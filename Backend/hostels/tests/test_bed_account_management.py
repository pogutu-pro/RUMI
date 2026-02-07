from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from hostels.models import Hostel, Room, Booking
from hostels.bed_models import Bed, BedOccupancy
from accounts.models import User, StudentProfile, LandlordProfile

class BedAccountManagementTests(TestCase):
    def setUp(self):
        # Create Landlord
        self.landlord_user = User.objects.create_user(
            email='landlord@example.com',
            password='password123',
            role='landlord',
            phone_number='254700000001'
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user,
            company_name="Test Hostels Ltd"
        )

        # Create Student
        self.student_user = User.objects.create_user(
            email='student@example.com',
            password='password123',
            role='student',
            phone_number='254700000002'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user
        )

        # Create Hostel
        self.hostel = Hostel.objects.create(
            name="Test Hostel",
            landlord=self.landlord_profile,
            base_price=10000
        )

        # Create Room
        self.room = Room.objects.create(
            hostel=self.hostel,
            room_number="101",
            capacity=2,
            base_price=5000
        )

        # Create Bed
        self.bed = Bed.objects.create(
            room=self.room,
            code="BED-101-A",
            full_code="TEST-101-A",
            bed_type="single"
        )

        self.client = APIClient()

    def test_landlord_can_update_custom_account_number(self):
        self.client.force_authenticate(user=self.landlord_user)
        url = reverse('bed_update', kwargs={'id': self.bed.id})
        data = {'custom_account_number': 'ROOM-101-A'}
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bed.refresh_from_db()
        self.assertEqual(self.bed.custom_account_number, 'ROOM-101-A')

    def test_custom_account_number_uniqueness(self):
        # Create another bed with 'ROOM-101-A'
        other_bed = Bed.objects.create(
            room=self.room,
            code="BED-101-B",
            custom_account_number='ROOM-101-B',
            full_code="TEST-101-B",
            bed_type="single"
        )
        
        self.client.force_authenticate(user=self.landlord_user)
        url = reverse('bed_update', kwargs={'id': self.bed.id})
        # Try to set bed A to 'ROOM-101-B' which is taken
        data = {'custom_account_number': 'ROOM-101-B'}
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # DRF UniqueValidator message
        self.assertIn('bed with this custom account number already exists.', str(response.data))

    def test_student_cannot_update_bed(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('bed_update', kwargs={'id': self.bed.id})
        data = {'custom_account_number': 'HACKED'}
        
        response = self.client.patch(url, data)
        # Student permissions might return 403 or 404 depending on view logic
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_unauthorized_landlord_cannot_update_bed(self):
        # Different landlord
        other_landlord = User.objects.create_user(email='other@example.com', password='pw', role='landlord')
        LandlordProfile.objects.create(user=other_landlord)
        
        self.client.force_authenticate(user=other_landlord)
        url = reverse('bed_update', kwargs={'id': self.bed.id})
        data = {'custom_account_number': 'STOLEN'}
        
        response = self.client.patch(url, data)
        # Should return 404 because queryset filters by request.user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
