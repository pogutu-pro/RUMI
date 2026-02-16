"""
Tests for landlord_api app - landlord dashboard, hostels, payments, tenants.
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
class LandlordDashboardTests(TestCase):
    """Test landlord dashboard endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
            is_verified=True,
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
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
        )

    def test_dashboard_overview(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/dashboard/overview/')
        self.assertEqual(response.status_code, 200)

    def test_dashboard_overview_unauthenticated(self):
        response = self.client.get('/api/v1/landlord/dashboard/overview/')
        self.assertIn(response.status_code, [401, 403])

    def test_student_cannot_access_landlord_dashboard(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/landlord/dashboard/overview/')
        self.assertEqual(response.status_code, 403)

    def test_activity_feed(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/dashboard/activity-feed/')
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class LandlordHostelTests(TestCase):
    """Test landlord hostel listing."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
            is_verified=True,
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

    def test_list_own_hostels(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/hostels/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        hostels = data.get('hostels', data.get('results', []))
        if isinstance(hostels, list) and len(hostels) > 0:
            self.assertEqual(hostels[0]['name'], 'Test Hostel')

    def test_other_landlord_cannot_see_hostels(self):
        other_landlord = User.objects.create_user(
            email='other@test.com', password='Pass123!',
            first_name='Other', last_name='Landlord', role='landlord',
        )
        LandlordProfile.objects.create(
            user=other_landlord, company_name='Other Co',
            national_id='87654321',
        )
        self.client.force_authenticate(user=other_landlord)
        response = self.client.get('/api/v1/landlord/hostels/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        hostels = data.get('hostels', data.get('results', []))
        if isinstance(hostels, list):
            for h in hostels:
                self.assertNotEqual(h.get('name'), 'Test Hostel')


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class LandlordPaymentTests(TestCase):
    """Test landlord payment analytics endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
            is_verified=True,
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678', is_verified=True,
        )

    def test_payment_reports(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/payments/reports/')
        self.assertEqual(response.status_code, 200)

    def test_payment_analytics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/payments/analytics/')
        self.assertEqual(response.status_code, 200)

    def test_recent_transactions(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/payments/transactions/recent/')
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class LandlordTenantTests(TestCase):
    """Test landlord tenant management."""

    def setUp(self):
        self.client = APIClient()
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
            is_verified=True,
        )
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678', is_verified=True,
        )

    def test_list_tenants(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/landlord/tenants/')
        self.assertEqual(response.status_code, 200)
