"""
Management command to backfill RentPeriods for existing confirmed bookings.

This command creates missing RentPeriod instances for all confirmed bookings
that don't have complete rent period coverage.

Usage:
    python manage.py backfill_rent_periods [--dry-run] [--booking-id <id>]

Options:
    --dry-run: Show what would be created without actually creating
    --booking-id: Process only specific booking (useful for testing)
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from datetime import timedelta, date
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

from hostels.models import Booking
from payments.models import RentPeriod


class Command(BaseCommand):
    help = 'Backfill RentPeriods for existing confirmed bookings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating',
        )
        parser.add_argument(
            '--booking-id',
            type=int,
            help='Process only specific booking ID',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        booking_id = options['booking_id']
        
        self.stdout.write(self.style.SUCCESS('Starting RentPeriod backfill...'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Get bookings to process
        if booking_id:
            bookings = Booking.objects.filter(id=booking_id, status='confirmed')
            self.stdout.write(f"Processing specific booking: {booking_id}")
        else:
            bookings = Booking.objects.filter(status='confirmed')
            self.stdout.write(f"Processing all confirmed bookings: {bookings.count()} found")
        
        total_periods_created = 0
        total_bookings_processed = 0
        
        for booking in bookings:
            try:
                periods_created = self.backfill_booking_periods(booking, dry_run)
                total_periods_created += periods_created
                total_bookings_processed += 1
                
                if periods_created > 0:
                    status = "Would create" if dry_run else "Created"
                    self.stdout.write(
                        f"  {status} {periods_created} periods for booking {booking.booking_reference}"
                    )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error processing booking {booking.booking_reference}: {str(e)}")
                )
                continue
        
        # Summary
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"DRY RUN COMPLETE: Would create {total_periods_created} periods "
                    f"for {total_bookings_processed} bookings"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"BACKFILL COMPLETE: Created {total_periods_created} periods "
                    f"for {total_bookings_processed} bookings"
                )
            )

    def backfill_booking_periods(self, booking, dry_run=False):
        """
        Create missing RentPeriods for a single booking.
        
        Returns number of periods that would be/were created.
        """
        # Calculate date range
        start_date = booking.check_in_date
        end_date = timezone.now().date()
        
        # Don't create future periods beyond current date
        if start_date > end_date:
            return 0
        
        # Get existing periods for this booking
        existing_periods = set()
        for period in RentPeriod.objects.filter(booking=booking):
            existing_periods.add(period.start_date)
        
        # Generate monthly periods
        periods_to_create = []
        current_date = start_date
        
        while current_date <= end_date:
            if current_date not in existing_periods:
                period_end = self.get_month_end_date(current_date)
                
                # Determine status based on date
                if period_end < timezone.now().date():
                    status = 'overdue'  # Past period
                else:
                    status = 'due'  # Current or future period
                
                period_data = {
                    'student': booking.student,
                    'hostel': booking.room.hostel,
                    'booking': booking,
                    'room': booking.room,
                    'start_date': current_date,
                    'end_date': period_end,
                    'amount_due': booking.monthly_rent,
                    'amount_paid': Decimal('0.00'),
                    'status': status,
                    'assigned_paybill': '',
                    'student_account_ref': f"{booking.booking_reference}-{current_date.strftime('%Y%m')}"
                }
                periods_to_create.append(period_data)
            
            # Move to next month
            if current_date.month == 12:
                current_date = date(current_date.year + 1, 1, 1)
            else:
                current_date = date(current_date.year, current_date.month + 1, 1)
        
        # Create periods if not dry run
        if not dry_run and periods_to_create:
            with transaction.atomic():
                for period_data in periods_to_create:
                    RentPeriod.objects.create(**period_data)
        
        return len(periods_to_create)

    def get_month_end_date(self, date_obj):
        """
        Get the last day of the month for a given date.
        """
        if date_obj.month == 12:
            return date(date_obj.year + 1, 1, 1) - timedelta(days=1)
        else:
            return date(date_obj.year, date_obj.month + 1, 1) - timedelta(days=1)
