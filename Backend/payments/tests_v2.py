from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from decimal import Decimal
from rest_framework.test import APIClient
from accounts.models import User, StudentProfile, LandlordProfile
from hostels.models import Hostel, Room, Booking, Bed
from payments.models import RentPeriod, Transaction, BedPaymentLedger
from payments.services import process_confirmed_payment
from hostels.lifecycle_services import LifecycleService

class lifecycleTests(TestCase):
    def setUp(self):
        # Create Landlord
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='pass', role='landlord'
        )
        self.landlord = LandlordProfile.objects.create(user=self.landlord_user)
        
        # Create Student
        self.student_user = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.student = StudentProfile.objects.create(user=self.student_user)
        
        # Create Hostel & Room
        self.hostel = Hostel.objects.create(
            name='Test Hostel', 
            landlord=self.landlord,
            base_price=Decimal('10000.00'),
            hostel_type='single_rooms'
        )
        self.room = Room.objects.create(
            hostel=self.hostel, room_number='101', 
            room_type='single', capacity=1,
            base_price=Decimal('10000.00'), status='available'
        )
        
        # Create Booking
        self.booking = Booking.objects.create(
            student=self.student,
            room=self.room,
            status='pending_payment',
            total_amount=Decimal('10000.00'),
            check_in_date=timezone.now().date(),
            duration_months=1,
            monthly_rent=Decimal('10000.00')
        )

    def test_activate_tenancy(self):
        """Test that LifecycleService correctly activates a tenancy"""
        LifecycleService.activate_tenancy(self.booking)
        
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        
        # Check if RentPeriods were created
        self.assertEqual(RentPeriod.objects.filter(booking=self.booking).count(), 1)
        
        # Check if capabilities were granted
        self.student_user.refresh_from_db()
        self.assertIn('tenancy:active', self.student_user.capabilities)

    def test_process_confirmed_payment_initial(self):
        """Test processing the initial booking deposit"""
        reference = f"RUMI-INITIAL-{self.booking.id}-XYZ"
        
        result = process_confirmed_payment(
            student=self.student,
            amount=Decimal('10000.00'),
            reference=reference,
            payment_method='mpesa'
        )
        
        self.assertEqual(result['type'], 'booking')
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(self.booking.amount_paid, Decimal('10000.00'))
        
        # Verify transaction
        txn = Transaction.objects.get(transaction_reference=reference)
        self.assertEqual(txn.transaction_type, 'deposit')
        self.assertEqual(txn.status, 'success')

    def test_process_confirmed_payment_rent(self):
        """Test processing a subsequent rent payment"""
        # First activate it
        LifecycleService.activate_tenancy(self.booking)
        rent_period = RentPeriod.objects.get(booking=self.booking)

        reference = f"RUMI-RENT-{rent_period.id}-ABC"

        result = process_confirmed_payment(
            student=self.student,
            amount=Decimal('10000.00'),
            reference=reference,
            payment_method='mpesa'
        )

        self.assertEqual(result['type'], 'rent')
        rent_period.refresh_from_db()
        self.assertEqual(rent_period.status, 'paid')
        self.assertEqual(rent_period.amount_paid, Decimal('10000.00'))

        # Verify transaction
        txn = Transaction.objects.get(transaction_reference=reference)
        self.assertEqual(txn.transaction_type, 'rent')
        self.assertEqual(txn.rent_period, rent_period)


class TestPaymentVerifyView(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='verify_student@test.com', password='pass', role='student'
        )
        self.student = StudentProfile.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.txn = Transaction.objects.create(
            student=self.student,
            transaction_reference='TXN-VERIFY-001',
            amount=Decimal('5000.00'),
            status='success',
            payment_method='mpesa',
            transaction_type='rent',
        )

    def test_verify_query_param(self):
        url = reverse('payment_verify_stub') + '?reference=TXN-VERIFY-001'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('reference', response.data)
        self.assertIn('status', response.data)
        self.assertIn('amount', response.data)
        self.assertIn('verified', response.data)

    def test_verify_ref_path(self):
        url = reverse('payment_verify_ref_stub', args=['TXN-VERIFY-001'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('reference', response.data)

    def test_verify_not_found(self):
        url = reverse('payment_verify_stub') + '?reference=NONEXISTENT'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_verify_success_flag(self):
        url = reverse('payment_verify_stub') + '?reference=TXN-VERIFY-001'
        response = self.client.get(url)
        self.assertTrue(response.data['verified'])

        self.txn.status = 'pending'
        self.txn.save()
        response = self.client.get(url)
        self.assertFalse(response.data['verified'])
