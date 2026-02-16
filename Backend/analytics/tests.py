"""
Tests for analytics app - landlord analytics dashboards.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from decimal import Decimal
from rest_framework.test import APIClient
from accounts.models import LandlordProfile, StudentProfile
from hostels.models import Hostel

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class LandlordAnalyticsTests(TestCase):
    """Test landlord analytics endpoints."""

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

    def test_revenue_analytics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/revenue/')
        self.assertEqual(response.status_code, 200)

    def test_occupancy_analytics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/occupancy/')
        self.assertEqual(response.status_code, 200)

    def test_growth_analytics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/growth/')
        self.assertEqual(response.status_code, 200)

    def test_performance_metrics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/performance/')
        self.assertEqual(response.status_code, 200)

    def test_customer_analytics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/customers/')
        self.assertEqual(response.status_code, 200)

    def test_financial_reports(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/financial-reports/')
        self.assertEqual(response.status_code, 200)

    def test_predictive_analytics(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/analytics/landlord/predictive/')
        self.assertEqual(response.status_code, 200)

    def test_student_cannot_access_analytics(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/analytics/landlord/revenue/')
        self.assertIn(response.status_code, [403])

    def test_unauthenticated_cannot_access(self):
        response = self.client.get('/api/v1/analytics/landlord/revenue/')
        self.assertIn(response.status_code, [401, 403])
