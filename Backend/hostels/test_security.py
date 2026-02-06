import json
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, LandlordProfile, StudentProfile
from hostels.models import Hostel, Room, Booking

class TenantIsolationTests(APITestCase):
    def setUp(self):
        # 1. Create Landlord A and their Hostel/Room
        self.landlord_user_a = User.objects.create_user(
            email='landlord_a@example.com', password='password', role='landlord'
        )
        self.landlord_profile_a = LandlordProfile.objects.create(user=self.landlord_user_a, is_verified=True)
        self.hostel_a = Hostel.objects.create(
            landlord=self.landlord_profile_a, name='Hostel A', status='active', base_price=5000
        )
        self.room_a = Room.objects.create(hostel=self.hostel_a, room_number='A1', base_price=5000, capacity=1)

        # 2. Create Landlord B and their Hostel/Room
        self.landlord_user_b = User.objects.create_user(
            email='landlord_b@example.com', password='password', role='landlord'
        )
        self.landlord_profile_b = LandlordProfile.objects.create(user=self.landlord_user_b, is_verified=True)
        self.hostel_b = Hostel.objects.create(
            landlord=self.landlord_profile_b, name='Hostel B', status='active', base_price=6000
        )
        self.room_b = Room.objects.create(hostel=self.hostel_b, room_number='B1', base_price=6000, capacity=1)

    def test_landlord_cannot_access_other_landlord_hostel(self):
        """Landlord A should not be able to retrieve Hostel B details"""
        self.client.force_authenticate(user=self.landlord_user_a)
        url = reverse('hostel_detail', kwargs={'pk': self.hostel_b.id})
        response = self.client.get(url)
        # Depending on implementation, this could be 404 (filtered out of queryset) or 403
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_landlord_cannot_access_other_landlord_room(self):
        """Landlord A should not be able to retrieve Room B details"""
        self.client.force_authenticate(user=self.landlord_user_a)
        url = reverse('room_detail', kwargs={'pk': self.room_b.id})
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_landlord_isolation_in_listings(self):
        """Landlord A should only see Hostel A in the list"""
        self.client.force_authenticate(user=self.landlord_user_a)
        url = reverse('hostels_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle both DRF Response and standard HttpResponse
        data = response.data if hasattr(response, 'data') else response.json()
        results = data.get('results', data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.hostel_a.id)

    def test_public_access_only_active_hostels(self):
        """Unauthenticated user can see active hostels but not inactive ones"""
        # Create an inactive hostel
        inactive_hostel = Hostel.objects.create(
            landlord=self.landlord_profile_a, name='Inactive Hostel', status='inactive', base_price=4000
        )
        url = reverse('hostels_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if hasattr(response, 'data') else response.json()
        results = data.get('results', data)
        # Should see Hostel A and Hostel B (if they are active), but not Inactive Hostel
        # Actually our current get_queryset for public returns all active ones
        hostel_ids = [hostel['id'] for hostel in results]
        self.assertIn(self.hostel_a.id, hostel_ids)
        self.assertIn(self.hostel_b.id, hostel_ids)
        self.assertNotIn(inactive_hostel.id, hostel_ids)
