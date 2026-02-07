from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, StudentProfile, LandlordProfile
from payments.models import Transaction, RentPeriod
from hostels.models import Hostel, Room, Booking
from django.utils import timezone
from decimal import Decimal

class ReceiptVerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='verifier@example.com', 
            password='password123',
            role='landlord' # Or student/admin
        )
        LandlordProfile.objects.create(user=self.user)

        self.student = User.objects.create_user(
            email='student@example.com',
            password='password123',
            role='student'
        )
        self.student_profile = StudentProfile.objects.create(user=self.student)
        
        self.hostel = Hostel.objects.create(name="Test Hostel", base_price=10000, landlord=self.user.landlord_profile)
        self.room = Room.objects.create(hostel=self.hostel, room_number="101", capacity=2, base_price=5000)
        
        self.transaction = Transaction.objects.create(
            student=self.student_profile,
            amount=Decimal('5000.00'),
            transaction_reference="TEST-REF-123",
            payment_method="mpesa",
            status="success",
            paid_at=timezone.now()
        )
        
        self.client = APIClient()

    def test_verify_receipt_success(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('receipt_verify', kwargs={'transaction_id': self.transaction.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['amount'], 5000.00)
        self.assertEqual(response.data['student_name'], self.student.get_full_name())

    def test_verify_receipt_unauthenticated(self):
        url = reverse('receipt_verify', kwargs={'transaction_id': self.transaction.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_verify_receipt_not_found(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('receipt_verify', kwargs={'transaction_id': 999999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
