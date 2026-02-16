"""
Tests for student_api app - student-specific endpoints.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from rest_framework.test import APIClient
from accounts.models import StudentProfile, LandlordProfile
from hostels.models import Hostel, Room, Booking

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class StudentPendingReviewsTests(TestCase):
    """Test pending reviews endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user, university='Test Uni',
            course='CS', year_of_study=2,
        )
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678',
        )
        self.hostel = Hostel.objects.create(
            landlord=self.landlord_profile, name='Test Hostel',
            description='Desc', address='123 St', city='Nairobi',
            base_price=Decimal('10000'), gender_policy='mixed',
            total_rooms=10, available_rooms=5,
        )
        self.room = Room.objects.create(
            hostel=self.hostel, room_number='101',
            room_type='single', base_price=Decimal('10000'),
            capacity=1,
        )
        self.url = '/api/v1/students/reviews/pending/'

    def test_pending_reviews_authenticated(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_pending_reviews_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [401, 403])

    def test_landlord_cannot_access_student_reviews(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [403])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class StudentVisitorInvitationsTests(TestCase):
    """Test visitor invitations endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        StudentProfile.objects.create(
            user=self.student_user, university='Test Uni',
            course='CS', year_of_study=2,
        )
        self.url = '/api/v1/students/visitor-invitations/'

    def test_list_invitations(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_create_invitation(self):
        self.client.force_authenticate(user=self.student_user)
        data = {
            'visitor_name': 'John Doe',
            'visitor_id_number': '12345678',
            'purpose': 'Visit',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [200, 201])

    def test_unauthenticated_cannot_create(self):
        data = {
            'visitor_name': 'John Doe',
            'visitor_id_number': '12345678',
            'purpose': 'Visit',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [401, 403])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class StudentRoommateRequestsTests(TestCase):
    """Test roommate requests endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        StudentProfile.objects.create(
            user=self.student_user, university='Test Uni',
            course='CS', year_of_study=2,
        )
        self.other_student = User.objects.create_user(
            email='other@test.com', password='Pass123!',
            first_name='Other', last_name='Student', role='student',
        )
        self.other_profile = StudentProfile.objects.create(
            user=self.other_student, university='Test Uni',
            course='Eng', year_of_study=1,
        )
        self.url = '/api/v1/students/roommate-requests/'

    def test_list_roommate_requests(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_create_roommate_request(self):
        self.client.force_authenticate(user=self.student_user)
        data = {
            'requested_student_id': self.other_profile.id,
            'message': 'Looking for a roommate!',
            'move_in_date': '2026-03-01',
            'budget_min': 5000,
            'budget_max': 15000,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [200, 201])
