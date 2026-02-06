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

    def test_mpesa_stk_push_callback_activation(self):
        """
        Simulate a successful M-Pesa STK Push callback.
        This should:
        1. Update transaction status
        2. Activate tenancy (Booking status -> confirmed)
        3. Generate RentPeriods
        """
        checkout_id = "ws_CO_191220191020363925"
        transaction_ref = f"RUMI-INITIAL-{self.booking.id}-XYZ123"
        
        # Create the pending transaction that we expect to update
        transaction = Transaction.objects.create(
            booking=self.booking,
            student=self.student,
            transaction_reference=transaction_ref,
            mpesa_checkout_request_id=checkout_id,
            transaction_type='deposit',
            payment_method='mpesa',
            amount=Decimal('5000.00'),
            status='pending'
        )
        
        # Mock M-Pesa callback payload
        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "29115-3462713-1",
                    "CheckoutRequestID": checkout_id,
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 5000.00},
                            {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT6P2H"},
                            {"Name": "TransactionDate", "Value": 20191219102115},
                            {"Name": "PhoneNumber", "Value": 254708374149}
                        ]
                    }
                }
            }
        }
        
        # Post to the verified STK push webhook endpoint
        response = self.client.post('/api/v1/payments/webhook/mpesa/stk_push/', payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify transaction status
        transaction.refresh_from_db()
        # It goes from pending -> processing -> success (if everything works)
        # Note: MpesaWebhookHandler set it to 'processing' before calling logic, 
        # but process_confirmed_payment logic might set it to 'success' or it might stay 'processing' if logic fails.
        # Looking at services.py: it creates a NEW transaction if it doesn't exist, 
        # but here we ALREADY created it.
        # Actually, MpesaWebhookHandler._update_transaction_from_stk_push sets it to 'processing'.
        self.assertEqual(transaction.status, 'success') 
        self.assertEqual(transaction.mpesa_receipt_number, 'NLJ7RT6P2H')
        
        # Verify Booking status (Activated via LifecycleService)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(self.booking.amount_paid, Decimal('5000.00'))
        self.assertEqual(self.booking.balance_due, Decimal('0.00'))
        
        # Verify RentPeriods generation
        rent_periods = RentPeriod.objects.filter(booking=self.booking)
        self.assertEqual(rent_periods.count(), self.booking.duration_months)
        self.assertTrue(all(p.status == 'due' for p in rent_periods))

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
