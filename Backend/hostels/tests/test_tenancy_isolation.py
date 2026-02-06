from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .factories import UserFactory, LandlordProfileFactory, CaretakerProfileFactory, HostelFactory, RoomFactory

class TenancyIsolationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Landlord 1 and their Hostel
        self.landlord1 = LandlordProfileFactory()
        self.hostel1 = HostelFactory(landlord=self.landlord1)
        self.room1 = RoomFactory(hostel=self.hostel1)
        
        # Landlord 2 and their Hostel
        self.landlord2 = LandlordProfileFactory()
        self.hostel2 = HostelFactory(landlord=self.landlord2)
        self.room2 = RoomFactory(hostel=self.hostel2)
        
        # Caretaker for Hostel 1
        self.caretaker1 = CaretakerProfileFactory(hostel=self.hostel1)

    def test_landlord_cannot_access_other_landlord_hostel(self):
        """Landlord 2 should not be able to access details of Hostel 1"""
        self.client.force_authenticate(user=self.landlord2.user)
        response = self.client.get(f'/api/v1/hostels/{self.hostel1.id}/')
        
        # TenantModelViewSet should return 404 for resources outside the tenant scope
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_caretaker_isolation(self):
        """Caretaker 1 should not be able to access details of Hostel 2"""
        self.client.force_authenticate(user=self.caretaker1.user)
        response = self.client.get(f'/api/v1/hostels/{self.hostel2.id}/')
        
        # Caretaker is scoped to their assigned hostel
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_caretaker_can_access_assigned_hostel(self):
        """Caretaker 1 should be able to access their assigned Hostel 1"""
        self.client.force_authenticate(user=self.caretaker1.user)
        response = self.client.get(f'/api/v1/hostels/{self.hostel1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.hostel1.id)

    def test_landlord_can_access_own_hostel(self):
        """Landlord 1 should be able to access their own Hostel 1"""
        self.client.force_authenticate(user=self.landlord1.user)
        response = self.client.get(f'/api/v1/hostels/{self.hostel1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.hostel1.id)
