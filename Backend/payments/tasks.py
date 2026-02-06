from celery import shared_task
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum


@shared_task
def process_recurring_payments():
    """
    Process all recurring payments due today
    """
    from .models import RecurringPayment, Transaction, SavedPaymentMethod
    from notifications.tasks import send_notification

    today = timezone.now().date()

    # Find active recurring payments due today
    due_payments = RecurringPayment.objects.filter(
        is_active=True,
        next_payment_date=today
    ).select_related('booking', 'student__user', 'saved_payment_method')

    results = {
        'total_due': len(due_payments),
        'successful': 0,
        'failed': 0,
        'errors': []
    }

    for recurring in due_payments:
        try:
            # Charge saved payment method (mock for now)
            charge_result = charge_saved_payment_method(recurring, recurring.rent_amount)

            if charge_result['status'] == 'success':
                # Update recurring payment schedule
                recurring.last_payment_at = timezone.now()
                recurring.next_payment_date = today + timezone.timedelta(days=30)
                recurring.consecutive_failures = 0
                recurring.save()

                results['successful'] += 1

                # Send success notification
                send_notification.delay(
                    recipient_id=recurring.student.user.id,
                    notification_type='recurring_payment_success',
                    channel='email',
                    context={
                        'student_name': recurring.student.user.first_name,
                        'amount': float(recurring.rent_amount),
                        'next_payment_date': recurring.next_payment_date.strftime('%B %d, %Y')
                    }
                )

            else:
                # Handle failure
                recurring.consecutive_failures += 1
                recurring.save()

                results['failed'] += 1

                # Send failure notification
                send_notification.delay(
                    recipient_id=recurring.student.user.id,
                    notification_type='recurring_payment_failed',
                    channel='email',
                    context={
                        'student_name': recurring.student.user.first_name,
                        'amount': float(recurring.rent_amount),
                        'failure_reason': charge_result.get('message'),
                        'retry_manually_link': f"https://rumi.co.ke/bookings/{recurring.booking.id}"
                    }
                )

                # Disable after 3 consecutive failures
                if recurring.consecutive_failures >= 3:
                    recurring.is_active = False
                    recurring.save()

                    send_notification.delay(
                        recipient_id=recurring.student.user.id,
                        notification_type='recurring_payment_disabled',
                        channel='email',
                        context={
                            'student_name': recurring.student.user.first_name
                        }
                    )

        except Exception as e:
            results['errors'].append({
                'recurring_id': recurring.id,
                'error': str(e)
            })
            continue

    # Send admin summary if there were failures
    if results['failed'] > 0:
        send_notification.delay(
            recipient_id=1,  # Admin user ID
            notification_type='recurring_payments_summary',
            channel='email',
            context=results
        )

    return results


def charge_saved_payment_method(recurring_payment, amount):
    """
    Charge saved payment method via Paystack
    """
    # Mock implementation - in production, call Paystack API
    try:
        # Simulate success/failure randomly for testing
        import random
        success = random.choice([True, True, True, False])  # 75% success rate

        if success:
            # Create transaction record
            from .models import Transaction
            transaction = Transaction.objects.create(
                booking=recurring_payment.booking,
                student=recurring_payment.student,
                transaction_reference=f"RUMI-RECUR-{timezone.now().year}-{recurring_payment.id}",
                transaction_type='rent',
                amount=amount,
                status='success',
                paid_at=timezone.now(),
                metadata={
                    'recurring_payment_id': recurring_payment.id,
                    'is_recurring': True
                }
            )

            return {
                'status': 'success',
                'transaction_id': transaction.id,
                'amount': float(amount)
            }
        else:
            return {
                'status': 'failed',
                'message': 'Insufficient funds'
            }

    except Exception as e:
        return {
            'status': 'failed',
            'message': str(e)
        }


@shared_task
def assess_late_fees():
    """
    Assess late fees for rent payments past grace period
    """
    from .models import RecurringPayment, LateFeeCharge
    from notifications.tasks import send_notification

    today = timezone.now().date()

    # Find active recurring payments past grace period
    overdue_payments = RecurringPayment.objects.filter(
        is_active=True,
        next_payment_date__lt=today - timezone.timedelta(days=7)  # Grace period expired
    ).exclude(
        booking__late_fees__status='pending'  # Don't charge twice
    )

    late_fees_charged = 0

    for recurring in overdue_payments:
        grace_period_end = recurring.next_payment_date + timezone.timedelta(days=recurring.grace_period_days)

        if today > grace_period_end:
            # Create late fee charge
            late_fee = LateFeeCharge.objects.create(
                booking=recurring.booking,
                student=recurring.student,
                late_fee_amount=recurring.late_fee_amount,
                due_date=recurring.next_payment_date,
                grace_period_end=grace_period_end,
                status='pending'
            )

            late_fees_charged += 1

            # Send notification
            send_notification.delay(
                recipient_id=recurring.student.user.id,
                notification_type='late_fee_charged',
                channel='email',
                context={
                    'student_name': recurring.student.user.first_name,
                    'late_fee_amount': float(recurring.late_fee_amount),
                    'original_due_date': recurring.next_payment_date.strftime('%B %d, %Y'),
                    'days_overdue': (today - grace_period_end).days
                }
            )

            # Send SMS for critical notification
            send_notification.delay(
                recipient_id=recurring.student.user.id,
                notification_type='late_fee_charged',
                channel='sms',
                context={
                    'first_name': recurring.student.user.first_name,
                    'late_fee_amount': float(recurring.late_fee_amount)
                }
            )

    return {
        'late_fees_charged': late_fees_charged,
        'timestamp': timezone.now().isoformat()
    }


@shared_task
def generate_monthly_tax_reports():
    """
    Generate withholding tax reports for all landlords
    """
    from .models import Transaction, TaxReport
    from notifications.tasks import send_notification

    # Previous month
    today = timezone.now().date()
    report_month = (today.replace(day=1) - timezone.timedelta(days=1)).replace(day=1)

    # Get all landlords with transactions last month
    landlords_with_transactions = Transaction.objects.filter(
        status='success',
        paid_at__date__gte=report_month,
        paid_at__date__lt=report_month + timezone.timedelta(days=32)
    ).values('landlord_id').distinct()

    reports_generated = 0

    for landlord_data in landlords_with_transactions:
        landlord_id = landlord_data['landlord_id']

        # Aggregate transactions
        transactions = Transaction.objects.filter(
            landlord_id=landlord_id,
            status='success',
            paid_at__date__gte=report_month,
            paid_at__date__lt=report_month + timezone.timedelta(days=32)
        )

        total_rent = transactions.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        total_tax = total_rent * Decimal('0.10')
        transaction_count = transactions.count()

        # Create tax report record
        tax_report = TaxReport.objects.create(
            landlord_id=landlord_id,
            report_month=report_month,
            total_rent_received=total_rent,
            total_withholding_tax=total_tax,
            transaction_count=transaction_count
        )

        # Generate PDF report (mock)
        pdf_url = generate_tax_report_pdf(tax_report, transactions)
        tax_report.report_file_url = pdf_url
        tax_report.save()

        reports_generated += 1

        # Send notification to landlord
        from accounts.models import LandlordProfile
        landlord = LandlordProfile.objects.get(id=landlord_id)
        send_notification.delay(
            recipient_id=landlord.user.id,
            notification_type='tax_report_ready',
            channel='email',
            context={
                'landlord_name': landlord.company_name or landlord.user.get_full_name(),
                'report_month': report_month.strftime('%B %Y'),
                'total_rent': float(total_rent),
                'total_tax': float(total_tax),
                'download_link': f"https://rumi.co.ke/api/v1/payments/tax-reports/{tax_report.id}/download"
            }
        )

    return {
        'reports_generated': reports_generated,
        'report_month': report_month.strftime('%Y-%m')
    }


def generate_tax_report_pdf(tax_report, transactions):
    """
    Generate PDF tax report
    """
    # Mock PDF generation - in production, use reportlab or similar
    filename = f"tax_report_{tax_report.report_month.strftime('%Y_%m')}_{tax_report.landlord.id}.pdf"
    pdf_url = f"https://rumi-reports.s3.amazonaws.com/{filename}"

    # Here you would generate actual PDF with transaction details
    # For now, just return mock URL

    return pdf_url


@shared_task
def aggregate_revenue_analytics():
    """
    Aggregate daily revenue metrics for dashboard
    """
    from .models import Transaction, RevenueAnalytics

    today = timezone.now().date()

    # Daily aggregation
    daily_transactions = Transaction.objects.filter(
        status='success',
        paid_at__date=today
    )

    daily_stats = daily_transactions.aggregate(
        total_transactions=Count('id'),
        total_volume=Sum('amount')
    )

    # Additional aggregations
    recurring_payments_count = daily_transactions.filter(
        metadata__is_recurring=True
    ).count()

    late_fees_collected = Transaction.objects.filter(
        status='success',
        paid_at__date=today,
        transaction_type='late_fee'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    withholding_tax_collected = daily_transactions.aggregate(
        total=Sum(F('amount') * Decimal('0.10'))
    )['total'] or Decimal('0.00')

    # Create/update daily analytics record
    RevenueAnalytics.objects.update_or_create(
        date=today,
        period_type='daily',
        defaults={
            'total_volume': daily_stats['total_volume'] or Decimal('0.00'),
        }
    )

    # Weekly aggregation (every Sunday)
    if today.weekday() == 6:  # Sunday
        week_start = today - timezone.timedelta(days=6)
        aggregate_period_stats(week_start, today, 'weekly')

    # Monthly aggregation (last day of month)
    if today == (today.replace(day=1) + timezone.timedelta(days=32)).replace(day=1) - timezone.timedelta(days=1):
        month_start = today.replace(day=1)
        aggregate_period_stats(month_start, today, 'monthly')

    return {
        'daily_processed': True,
        'weekly_processed': today.weekday() == 6,
        'monthly_processed': today == (today.replace(day=1) + timezone.timedelta(days=32)).replace(day=1) - timezone.timedelta(days=1),
        'date': today.isoformat()
    }


def aggregate_period_stats(start_date, end_date, period_type):
    """
    Helper function to aggregate stats for a date range
    """
    from .models import Transaction, RevenueAnalytics

    period_transactions = Transaction.objects.filter(
        status='success',
        paid_at__date__gte=start_date,
        paid_at__date__lte=end_date
    )

    stats = period_transactions.aggregate(
        total_transactions=Count('id'),
        total_volume=Sum('amount')
    )

    recurring_count = period_transactions.filter(metadata__is_recurring=True).count()

    late_fees = Transaction.objects.filter(
        status='success',
        paid_at__date__gte=start_date,
        paid_at__date__lte=end_date,
        transaction_type='late_fee'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    # Determine the date key for the period
    if period_type == 'weekly':
        date_key = start_date
    elif period_type == 'monthly':
        date_key = start_date
    else:
        date_key = end_date

    RevenueAnalytics.objects.update_or_create(
        date=date_key,
        period_type=period_type,
        defaults={
            'total_volume': stats['total_volume'] or Decimal('0.00'),
        }
    )

    return stats


@shared_task
def process_pending_payouts():
    """
    Process pending payouts to landlords
    """
    from .models import Payout

    pending_payouts = Payout.objects.filter(status='pending')

    processed = 0
    for payout in pending_payouts:
        try:
            # Mock payout processing - in production, call Paystack API
            payout.status = 'processing'
            payout.save()

            # Simulate processing delay
            import time
            time.sleep(2)

            # Mark as completed
            payout.status = 'success'
            payout.completed_at = timezone.now()
            payout.payout_duration_seconds = 45  # Mock duration
            payout.save()

            processed += 1

        except Exception as e:
            payout.status = 'failed'
            payout.failed_at = timezone.now()
            payout.failure_reason = str(e)
            payout.save()

    return {
        'payouts_processed': processed,
        'timestamp': timezone.now().isoformat()
    }


@shared_task
def cleanup_expired_payment_links():
    """
    Clean up expired payment links from cache
    """
    # This is handled by Redis TTL, but we can add cleanup logic if needed
    return {'status': 'completed'}


@shared_task
def send_payment_reminders():
    """
    Send payment reminders for upcoming due dates
    """
    from .models import RecurringPayment
    from notifications.tasks import send_notification

    # Find payments due in 3 days
    reminder_date = timezone.now().date() + timezone.timedelta(days=3)

    upcoming_payments = RecurringPayment.objects.filter(
        is_active=True,
        next_payment_date=reminder_date
    )

    reminders_sent = 0
    for payment in upcoming_payments:
        send_notification.delay(
            recipient_id=payment.student.user.id,
            notification_type='payment_reminder',
            channel='email',
            context={
                'first_name': payment.student.user.first_name,
                'amount': float(payment.rent_amount),
                'hostel_name': payment.booking.room.hostel.name,
                'due_date': payment.next_payment_date.strftime('%B %d, %Y')
            }
        )

        # Send SMS reminder
        send_notification.delay(
            recipient_id=payment.student.user.id,
            notification_type='payment_reminder',
            channel='sms',
            context={
                'first_name': payment.student.user.first_name,
                'amount': float(payment.rent_amount),
                'hostel_name': payment.booking.room.hostel.name
            }
        )

        reminders_sent += 1

    return {
        'reminders_sent': reminders_sent,
        'reminder_date': reminder_date.isoformat()
    }
@shared_task
def reconcile_missed_webhooks():
    """
    Periodic task to process 'pending' WebhookEvent records.
    Provides safety against transient failures in real-time webhook processing.
    """
    from .models import WebhookEvent
    from .services import process_confirmed_payment
    
    pending_events = WebhookEvent.objects.filter(processing_status='pending').order_by('created_at')[:50]
    
    results = {'processed': 0, 'failed': 0}
    
    for event in pending_events:
        try:
            payload = event.payload
            
            # C2B reconciliation
            if event.provider == 'mpesa' and event.event_type == 'c2b_confirmation':
                reference = payload.get('BillRefNumber')
                amount = Decimal(str(payload.get('TransAmount')))
                
                process_confirmed_payment(
                    student=None, # Resolved via reference
                    amount=amount,
                    reference=reference,
                    payment_method='mpesa',
                    metadata=payload
                )
                
                event.processing_status = 'processed'
                event.processed_at = timezone.now()
                event.save()
                results['processed'] += 1

        except Exception as e:
            event.processing_status = 'failed'
            event.error_message = str(e)
            event.save()
            results['failed'] += 1
            
    return results
