"""
Tests for roommate_system app - profile, matching, compatibility.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from accounts.models import StudentProfile, LandlordProfile

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class RoommateProfileTests(TestCase):
    """Test roommate profile endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True, gender='male',
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user, university='Test Uni',
            course='CS', year_of_study=2,
            lifestyle_preferences={
                'cleanliness': 'very_clean',
                'sleep_schedule': 'early_bird',
                'study_habits': 'library',
                'noise_tolerance': 'quiet',
            },
        )
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
        )

    def test_get_profile(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/roommates/profile/')
        self.assertEqual(response.status_code, 200)

    def test_profile_unauthenticated(self):
        response = self.client.get('/api/v1/roommates/profile/')
        self.assertIn(response.status_code, [401, 403])

    def test_landlord_cannot_access_roommate_profile(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/roommates/profile/')
        self.assertIn(response.status_code, [403])

    def test_update_profile(self):
        self.client.force_authenticate(user=self.student_user)
        data = {
            'lifestyle_preferences': {
                'cleanliness': 'moderate',
                'sleep_schedule': 'night_owl',
            }
        }
        response = self.client.put('/api/v1/roommates/profile/', data, format='json')
        self.assertIn(response.status_code, [200, 204])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class RoommateMatchingTests(TestCase):
    """Test roommate matching endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.student1 = User.objects.create_user(
            email='student1@test.com', password='Pass123!',
            first_name='Student', last_name='One', role='student',
            is_verified=True, gender='male',
        )
        StudentProfile.objects.create(
            user=self.student1, university='Test Uni',
            course='CS', year_of_study=2,
            lifestyle_preferences={'cleanliness': 'very_clean'},
        )
        self.student2 = User.objects.create_user(
            email='student2@test.com', password='Pass123!',
            first_name='Student', last_name='Two', role='student',
            is_verified=True, gender='male',
        )
        StudentProfile.objects.create(
            user=self.student2, university='Test Uni',
            course='Eng', year_of_study=1,
            lifestyle_preferences={'cleanliness': 'very_clean'},
        )

    def test_find_matches(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.get('/api/v1/roommates/matches/')
        self.assertEqual(response.status_code, 200)

    def test_matches_unauthenticated(self):
        response = self.client.get('/api/v1/roommates/matches/')
        self.assertIn(response.status_code, [401, 403])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class RoommateRequestTests(TestCase):
    """Test roommate request endpoints."""

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

    def test_list_requests(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/roommates/requests/')
        self.assertEqual(response.status_code, 200)

    def test_get_verification_status(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/roommates/verification/')
        self.assertEqual(response.status_code, 200)

    def test_get_analytics(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/roommates/analytics/')
        self.assertEqual(response.status_code, 200)

    def test_get_settings(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/roommates/settings/')
        self.assertEqual(response.status_code, 200)
