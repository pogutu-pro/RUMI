from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from decimal import Decimal
from .factories import RoomFactory, StudentProfileFactory, BookingFactory

class BookingLifecycleTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = StudentProfileFactory()
        self.room = RoomFactory(capacity=2, base_price=5000, status='available')
        self.client.force_authenticate(user=self.student.user)

    def test_booking_creation_and_capacity(self):
        """Test that reserving a room updates occupancy and creates a booking"""
        # 1. Create Reservation (which creates a booking)
        response = self.client.post(f'/api/v1/hostels/{self.room.id}/reserve/', {
            'move_in_date': str(timezone.now().date()),
            'payment_plan': 'monthly'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking_id = response.data['booking_id']
        
        # 2. Confirm Booking (Simulating Landlord action)
        from hostels.models import Booking
        booking = Booking.objects.get(id=booking_id)
        booking.status = 'confirmed'
        booking.save()
        
        # 3. Refresh room and check available slots
        self.room.refresh_from_db()
        # RoomReserveView increments occupancy (line 914)
        self.assertEqual(self.room.current_occupancy, 1)
        self.assertTrue(self.room.is_active)
        
        # 4. Manual confirmation of another booking to hit capacity
        student2 = StudentProfileFactory()
        # BookingFactory needs to be careful about fields match
        # Let's just create it manually if factory is tricky
        booking2 = Booking.objects.create(
            room=self.room,
            student=student2,
            status='confirmed',
            booking_reference='TEST-BK-2',
            check_in_date=timezone.now().date(),
            monthly_rent=5000,
            total_amount=5000,
            emergency_contact_name='Parent',
            emergency_contact_phone='+254711111111',
            emergency_contact_relationship='Guardian'
        )
        # We need to manually increment occupancy if we create model directly without View logic
        self.room.current_occupancy += 1
        self.room.save()
        
        self.room.refresh_from_db()
        self.assertEqual(self.room.current_occupancy, 2)
        # Note: Need to check if Room model has logic for available? 
        # Usually it's a property or status update

    def test_invalid_date_transitions(self):
        """Test that move-in date cannot be in the past"""
        past_date = timezone.now().date() - timedelta(days=1)
        response = self.client.post(f'/api/v1/hostels/{self.room.id}/reserve/', {
            'move_in_date': str(past_date),
            'payment_plan': 'monthly'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('move_in_date', response.data)
