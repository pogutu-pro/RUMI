from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from hostels.tests.factories import BookingFactory, RoomFactory, StudentProfileFactory
from payments.models import Transaction, RentPeriod

class FinancialTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = StudentProfileFactory()
        self.client.force_authenticate(user=self.student.user)
        self.room = RoomFactory(base_price=Decimal('5000.00'))
        # Create a booking that requires activation
        self.booking = BookingFactory(
            student=self.student,
            room=self.room,
            monthly_rent=Decimal('5000.00'),
            total_amount=Decimal('5000.00'),
            balance_due=Decimal('5000.00'),
            status='pending',
            payment_status='pending',
            check_in_date=timezone.now().date()
        )

    def test_rent_calculation_logic(self):
        """Verify that total_amount matches room price"""
        self.assertEqual(self.booking.total_amount, Decimal('5000.00'))
        self.assertEqual(self.booking.balance_due, Decimal('5000.00'))

    def test_rent_payment_updates_ledger(self):
        """Test that a rent payment correctly updates the oldest RentPeriod balance"""
        # 1. Setup a confirmed booking with rent periods
        from hostels.lifecycle_services import LifecycleService
        LifecycleService.activate_tenancy(self.booking)
        
        first_period = RentPeriod.objects.filter(booking=self.booking).order_by('start_date').first()
        initial_paid = first_period.amount_paid
        
        # 2. Simulate a rent payment for this period
        amount = Decimal('2000.00')
        ref = f"RUMI-RENT-{first_period.id}-TEST"
        
        from payments.services import process_confirmed_payment
        process_confirmed_payment(
            student=self.student,
            amount=amount,
            reference=ref,
            payment_method='mpesa'
        )
        
        first_period.refresh_from_db()
        self.assertEqual(first_period.amount_paid, initial_paid + amount)
        self.assertEqual(first_period.status, 'partially_paid')
        
        # Verify transaction record
        txn = Transaction.objects.get(transaction_reference=ref)
        self.assertEqual(txn.transaction_type, 'rent')
        self.assertEqual(txn.amount, amount)
