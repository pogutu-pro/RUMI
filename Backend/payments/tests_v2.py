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


class TestPaymentLedgerExportView(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='export_user@test.com', password='pass', role='student'
        )
        self.student = StudentProfile.objects.create(user=self.user)
        self.landlord_user = User.objects.create_user(
            email='export_landlord@test.com', password='pass', role='landlord'
        )
        self.landlord = LandlordProfile.objects.create(user=self.landlord_user)
        self.hostel = Hostel.objects.create(
            name='Export Hostel', landlord=self.landlord,
            base_price=Decimal('5000.00'), hostel_type='single_rooms'
        )
        self.room = Room.objects.create(
            hostel=self.hostel, room_number='E01',
            room_type='single', capacity=1,
            base_price=Decimal('5000.00'), status='available'
        )
        self.bed = Bed.objects.create(
            room=self.room, hostel=self.hostel,
            code='A', full_code='EXP-E01-A'
        )
        self.txn = Transaction.objects.create(
            student=self.student,
            transaction_reference='TXN-EXPORT-001',
            amount=Decimal('5000.00'),
            status='success',
            transaction_type='rent',
            payment_method='mpesa',
        )
        self.client.force_authenticate(user=self.user)

    def test_export_returns_csv_content_type(self):
        url = reverse('payment_ledger_export_stub')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/csv', response['Content-Type'])

    def test_export_has_content_disposition(self):
        url = reverse('payment_ledger_export_stub')
        response = self.client.get(url)
        cd = response['Content-Disposition']
        self.assertIn('attachment', cd)
        self.assertIn('ledger_export', cd)

    def test_export_has_header_row(self):
        url = reverse('payment_ledger_export_stub')
        response = self.client.get(url)
        content = response.content.decode('utf-8-sig')
        self.assertIn('Date', content)
        self.assertIn('Bed Code', content)
        self.assertIn('Amount (KES)', content)

    def test_export_includes_ledger_rows(self):
        import datetime
        BedPaymentLedger.objects.create(
            bed=self.bed, transaction=self.txn,
            amount_allocated=Decimal('5000.00'),
            allocated_to_period_start=datetime.date(2026, 3, 1),
            allocated_to_period_end=datetime.date(2026, 3, 31),
        )
        url = reverse('payment_ledger_export_stub')
        response = self.client.get(url)
        content = response.content.decode('utf-8-sig')
        self.assertIn('EXP-E01-A', content)
        self.assertIn('TXN-EXPORT-001', content)

    def test_export_empty_ledger(self):
        url = reverse('payment_ledger_export_stub')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8-sig')
        lines = [l for l in content.strip().split('\n') if l]
        self.assertEqual(len(lines), 1)  # only header row


class TestPaymentLedgerView(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='ledger_user@test.com', password='pass', role='student'
        )
        self.student = StudentProfile.objects.create(user=self.user)
        self.landlord_user = User.objects.create_user(
            email='ledger_landlord@test.com', password='pass', role='landlord'
        )
        self.landlord = LandlordProfile.objects.create(user=self.landlord_user)
        self.hostel = Hostel.objects.create(
            name='Ledger Hostel', landlord=self.landlord,
            base_price=Decimal('5000.00'), hostel_type='single_rooms'
        )
        self.room = Room.objects.create(
            hostel=self.hostel, room_number='L01',
            room_type='single', capacity=1,
            base_price=Decimal('5000.00'), status='available'
        )
        self.bed = Bed.objects.create(
            room=self.room, hostel=self.hostel,
            code='A', full_code='LDG-L01-A'
        )
        self.txn = Transaction.objects.create(
            student=self.student,
            transaction_reference='TXN-LEDGER-001',
            amount=Decimal('5000.00'),
            status='success',
            transaction_type='rent',
            payment_method='mpesa',
        )
        self.client.force_authenticate(user=self.user)

    def test_ledger_list_empty(self):
        url = reverse('payment_ledger_stub')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data'], [])

    def test_ledger_list_returns_entries(self):
        import datetime
        entry = BedPaymentLedger.objects.create(
            bed=self.bed, transaction=self.txn,
            amount_allocated=Decimal('5000.00'),
            allocated_to_period_start=datetime.date(2026, 3, 1),
            allocated_to_period_end=datetime.date(2026, 3, 31),
        )
        url = reverse('payment_ledger_stub')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 1)
        row = response.data['data'][0]
        for key in ('id', 'transaction_date', 'bed_code', 'student_name',
                    'transaction_type', 'amount', 'balance', 'description', 'reference'):
            self.assertIn(key, row)

    def test_ledger_search_filters(self):
        import datetime
        BedPaymentLedger.objects.create(
            bed=self.bed, transaction=self.txn,
            amount_allocated=Decimal('5000.00'),
            allocated_to_period_start=datetime.date(2026, 3, 1),
            allocated_to_period_end=datetime.date(2026, 3, 31),
        )
        url = reverse('payment_ledger_search_stub', args=['LDG'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 1)

        url_no_match = reverse('payment_ledger_search_stub', args=['ZZZNOMATCH'])
        response2 = self.client.get(url_no_match)
        self.assertEqual(len(response2.data['data']), 0)


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
