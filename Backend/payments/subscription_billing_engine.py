"""
Subscription Billing Engine Service

Handles:
- Daily occupancy snapshot generation
- Monthly invoice generation
- Invoice payment reconciliation
- Enforcement workflows
"""

from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from datetime import timedelta, date
from django.db.models import Count, Q
import logging

from hostels.models import Hostel
from hostels.bed_models import BedOccupancy
from payments.subscription_models import OccupancySnapshot, SubscriptionPlan, SubscriptionInvoice
from admin_api.models import SystemActivity

logger = logging.getLogger(__name__)


class SubscriptionBillingEngine:
    """Service for landlord subscription billing operations"""
    
    @staticmethod
    def generate_daily_occupancy_snapshots(target_date=None):
        """
        Generate occupancy snapshots for all active hostels.
        
        Should be run daily at 00:00 UTC via cron job.
        
        Args:
            target_date: Date to generate snapshot for (defaults to yesterday)
        """
        if target_date is None:
            target_date = (timezone.now() - timedelta(days=1)).date()
        
        logger.info(f"Generating occupancy snapshots for {target_date}")
        
        hostels_processed = 0
        errors = []
        
        for hostel in Hostel.objects.filter(status='active'):
            try:
                # Get all beds for this hostel
                total_beds = hostel.beds.filter(is_active=True).count()
                
                # Get occupied beds on this date
                occupied_beds = BedOccupancy.objects.filter(
                    Q(moved_out_at__isnull=True) | Q(moved_out_at__gte=target_date),
                    bed__hostel=hostel,
                    is_active=True,
                    moved_in_at__lte=target_date
                ).count()
                
                # Build detailed occupancy map
                bed_occupancy_data = {}
                for bed in hostel.beds.filter(is_active=True):
                    occupancy = BedOccupancy.objects.filter(
                        Q(moved_out_at__isnull=True) | Q(moved_out_at__gte=target_date),
                        bed=bed,
                        is_active=True,
                        moved_in_at__lte=target_date
                    ).first()
                    
                    bed_occupancy_data[str(bed.id)] = {
                        'student_id': str(occupancy.student.id) if occupancy else None,
                        'bed_code': bed.full_code,
                    }
                
                # Create or update snapshot
                snapshot, created = OccupancySnapshot.objects.update_or_create(
                    hostel=hostel,
                    snapshot_date=target_date,
                    defaults={
                        'total_beds': total_beds,
                        'occupied_beds': occupied_beds,
                        'vacant_beds': total_beds - occupied_beds,
'bed_occupancy_data': bed_occupancy_data,
                    }
                )
                
                action = "Created" if created else "Updated"
                logger.info(f"{action} snapshot for {hostel.name}: {occupied_beds}/{total_beds} beds")
                hostels_processed += 1
                
            except Exception as e:
                logger.error(f"Error generating snapshot for {hostel.name}: {e}")
                errors.append({'hostel': hostel.name, 'error': str(e)})
        
        logger.info(f"Completed: {hostels_processed} snapshots generated, {len(errors)} errors")
        return {
            'success': hostels_processed,
            'errors': errors,
            'date': target_date
        }
    
    @staticmethod
    def generate_monthly_invoices(billing_month=None):
        """
        Generate subscription invoices for all hostels for the previous month.
        
        Should be run on 1st of each month via cron job.
        
        Args:
            billing_month: Month to bill for (defaults to previous month)
        """
        if billing_month is None:
            # Default to previous month
            today = timezone.now().date()
            first_of_this_month = today.replace(day=1)
            last_of_prev_month = first_of_this_month - timedelta(days=1)
            period_end = last_of_prev_month
            period_start = period_end.replace(day=1)
        else:
            period_start = billing_month
            # Last day of month
            next_month = period_start + timedelta(days=32)
            period_end = next_month.replace(day=1) - timedelta(days=1)
        
        logger.info(f"Generating invoices for period: {period_start} to {period_end}")
        
        # Get default per-bed plan
        try:
            plan = SubscriptionPlan.objects.get(
                pricing_model='per_bed',
                is_active=True,
                is_default=True
            )
        except SubscriptionPlan.DoesNotExist:
            logger.error("No default per-bed subscription plan found!")
            return {'success': 0, 'errors': ['No default plan']}
        
        invoices_created = 0
        errors = []
        
        for hostel in Hostel.objects.filter(status='active'):
            try:
                # Skip if invoice already exists for this period
                if SubscriptionInvoice.objects.filter(
                    hostel=hostel,
                    period_start=period_start,
                    period_end=period_end
                ).exists():
                    logger.info(f"Invoice already exists for {hostel.name}")
                    continue
                
                invoice = SubscriptionBillingEngine.create_invoice(
                    hostel=hostel,
                    period_start=period_start,
                    period_end=period_end,
                    plan=plan
                )
                
                logger.info(f"Created invoice {invoice.invoice_number} for {hostel.name}: KES {invoice.total_amount}")
                invoices_created += 1
                
                # Send notification
                SubscriptionBillingEngine.send_invoice_notification(invoice)
                
            except Exception as e:
                logger.error(f"Error generating invoice for {hostel.name}: {e}")
                errors.append({'hostel': hostel.name, 'error': str(e)})
        
        logger.info(f"Completed: {invoices_created} invoices generated, {len(errors)} errors")
        return {
            'success': invoices_created,
            'errors': errors,
            'period': f"{period_start} to {period_end}"
        }
    
    @staticmethod
    def create_invoice(hostel, period_start, period_end, plan):
        """
        Create a subscription invoice for a hostel.
        
        Args:
            hostel: Hostel instance
            period_start: Start date of billing period
            period_end: End date of billing period
            plan: SubscriptionPlan instance
            
        Returns:
            SubscriptionInvoice instance
        """
        # Get occupancy snapshots for period
        snapshots = OccupancySnapshot.objects.filter(
            hostel=hostel,
            snapshot_date__gte=period_start,
            snapshot_date__lte=period_end
        ).order_by('snapshot_date')
        
        if not snapshots.exists():
            raise ValueError(f"No occupancy snapshots found for {hostel.name} in period")
        
        # Calculate total bed-days
        total_bed_days = sum(snapshot.occupied_beds for snapshot in snapshots)
        
        # Calculate average occupancy
        num_days = snapshots.count()
        average_occupancy = Decimal(str(total_bed_days)) / Decimal(str(num_days)) if num_days > 0 else Decimal('0')
        
        # Calculate amount
        # Daily rate = monthly rate / 30
        days_in_period = (period_end - period_start).days + 1
        daily_rate = plan.unit_price / Decimal('30')
        subtotal = daily_rate * Decimal(str(total_bed_days))
        
        # Round to 2 decimal places
        subtotal = subtotal.quantize(Decimal('0.01'))
        total = subtotal  # No tax for now
        
        # Generate invoice number
        invoice_number = f"SUB-{period_start.year}{period_start.month:02d}-{hostel.id.hex[:8].upper()}"
        
        # Prepare occupancy snapshot summary
        occupancy_summary = [
            {
                'date': str(snapshot.snapshot_date),
                'occupied_beds': snapshot.occupied_beds,
                'total_beds': snapshot.total_beds
            }
            for snapshot in snapshots
        ]
        
        # Create invoice
        invoice = SubscriptionInvoice.objects.create(
            hostel=hostel,
            landlord=hostel.landlord,
            subscription_plan=plan,
            invoice_number=invoice_number,
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=plan.grace_period_days),
            period_start=period_start,
            period_end=period_end,
            occupancy_snapshot=occupancy_summary,
            total_bed_days=total_bed_days,
            average_occupancy=average_occupancy,
            unit_price=plan.unit_price,
            subtotal=subtotal,
            tax_amount=Decimal('0.00'),
            total_amount=total,
            status='issued'
        )
        
        return invoice
    
    @staticmethod
    def send_invoice_notification(invoice):
        """Send email/SMS notification about new invoice"""
        # TODO: Implement notification service
        logger.info(f"Would send notification for invoice {invoice.invoice_number}")
        pass
    
    @staticmethod
    def check_overdue_invoices():
        """
        Check for overdue invoices and apply enforcement.
        
        Should be run daily via cron job.
        """
        today = timezone.now().date()
        
        # Find overdue invoices
        overdue_invoices = SubscriptionInvoice.objects.filter(
            status='issued',
            due_date__lt=today
        )
        
        for invoice in overdue_invoices:
            days_overdue = (today - invoice.due_date).days
            
            # Update status to overdue
            if invoice.status == 'issued':
                invoice.status = 'overdue'
                invoice.save()
            
            # Send warning if in grace period
            grace_period = invoice.subscription_plan.grace_period_days
            if days_overdue <= grace_period and not invoice.warning_sent_at:
                SubscriptionBillingEngine.send_warning_notification(invoice)
                invoice.warning_sent_at = timezone.now()
                invoice.status = 'in_grace'
                invoice.save()
            
            # Apply enforcement
            enforcement_days = invoice.subscription_plan.enforcement_days
            if days_overdue > enforcement_days and not invoice.enforcement_activated_at:
                SubscriptionBillingEngine.apply_enforcement(invoice)
                invoice.enforcement_activated_at = timezone.now()
                invoice.save()
        
        logger.info(f"Checked {overdue_invoices.count()} overdue invoices")
    
    @staticmethod
    def send_warning_notification(invoice):
        """Send warning notification for overdue invoice"""
        logger.info(f"Would send warning for invoice {invoice.invoice_number}")
        pass
    
    @staticmethod
    def apply_enforcement(invoice):
        """Put hostel management in Read-Only mode for non-payment"""
        logger.info(f"Applying enforcement for invoice {invoice.invoice_number}")
        
        hostel = invoice.hostel
        
        # Apply the restriction
        hostel.is_restricted = True
        hostel.save()
        
        # Log the enforcement action
        SystemActivity.objects.create(
            activity_type='enforcement',
            title=f"Enforcement Activated: {hostel.name}",
            description=f"Hostel {hostel.name} has been placed in read-only mode due to overdue subscription {invoice.invoice_number}.",
            user=hostel.landlord.user,
            user_role='landlord',
            severity='high',
            metadata={
                'hostel_id': hostel.id,
                'invoice_id': str(invoice.id),
                'days_overdue': invoice.days_overdue
            }
        )
        
        logger.warning(f"Hostel {hostel.name} set to RESTRICTED (Read-Only) due to invoice {invoice.invoice_number}")
