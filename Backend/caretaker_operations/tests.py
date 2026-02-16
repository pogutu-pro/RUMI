"""
Tests for caretaker_operations app - dashboard, check-ins, damage reports, visitors.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from decimal import Decimal
from rest_framework.test import APIClient
from accounts.models import LandlordProfile, CaretakerProfile
from hostels.models import Hostel

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class CaretakerDashboardTests(TestCase):
    """Test caretaker dashboard endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678', is_verified=True,
        )
        self.hostel = Hostel.objects.create(
            landlord=self.landlord_profile, name='Test Hostel',
            description='Desc', address='123 St', city='Nairobi',
            base_price=Decimal('10000'), gender_policy='mixed',
            total_rooms=10, available_rooms=5,
        )
        self.caretaker_user = User.objects.create_user(
            email='caretaker@test.com', password='Pass123!',
            first_name='Test', last_name='Caretaker', role='caretaker',
            is_verified=True,
        )
        self.caretaker_profile = CaretakerProfile.objects.create(
            user=self.caretaker_user, hostel=self.hostel,
            created_by=self.landlord_user,
            national_id='CT123456',
            emergency_contact_name='Emergency',
            emergency_contact_phone='+254700000000',
        )
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
        )

    def test_dashboard_authenticated(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/dashboard/')
        self.assertEqual(response.status_code, 200)

    def test_dashboard_unauthenticated(self):
        response = self.client.get('/api/v1/caretaker/dashboard/')
        self.assertIn(response.status_code, [401, 403])

    def test_student_cannot_access_caretaker_dashboard(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/caretaker/dashboard/')
        self.assertIn(response.status_code, [403])

    def test_dashboard_stats(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/stats/')
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class CaretakerCheckInOutTests(TestCase):
    """Test check-in and check-out operations."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678', is_verified=True,
        )
        self.hostel = Hostel.objects.create(
            landlord=self.landlord_profile, name='Test Hostel',
            description='Desc', address='123 St', city='Nairobi',
            base_price=Decimal('10000'), gender_policy='mixed',
            total_rooms=10, available_rooms=5,
        )
        self.caretaker_user = User.objects.create_user(
            email='caretaker@test.com', password='Pass123!',
            first_name='Test', last_name='Caretaker', role='caretaker',
            is_verified=True,
        )
        CaretakerProfile.objects.create(
            user=self.caretaker_user, hostel=self.hostel,
            created_by=self.landlord_user,
            national_id='CT123456',
            emergency_contact_name='Emergency',
            emergency_contact_phone='+254700000000',
        )

    def test_list_check_ins(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/check-ins/')
        self.assertEqual(response.status_code, 200)

    def test_list_check_outs(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/check-outs/')
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class CaretakerVisitorTests(TestCase):
    """Test visitor management."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678', is_verified=True,
        )
        self.hostel = Hostel.objects.create(
            landlord=self.landlord_profile, name='Test Hostel',
            description='Desc', address='123 St', city='Nairobi',
            base_price=Decimal('10000'), gender_policy='mixed',
            total_rooms=10, available_rooms=5,
        )
        self.caretaker_user = User.objects.create_user(
            email='caretaker@test.com', password='Pass123!',
            first_name='Test', last_name='Caretaker', role='caretaker',
            is_verified=True,
        )
        CaretakerProfile.objects.create(
            user=self.caretaker_user, hostel=self.hostel,
            created_by=self.landlord_user,
            national_id='CT123456',
            emergency_contact_name='Emergency',
            emergency_contact_phone='+254700000000',
        )

    def test_list_visitors(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/visitors/')
        self.assertEqual(response.status_code, 200)

    def test_list_damage_reports(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/damage-reports/')
        self.assertEqual(response.status_code, 200)

    def test_list_rooms(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/rooms/')
        self.assertEqual(response.status_code, 200)

    def test_list_tenants(self):
        self.client.force_authenticate(user=self.caretaker_user)
        response = self.client.get('/api/v1/caretaker/tenants/')
        self.assertEqual(response.status_code, 200)
