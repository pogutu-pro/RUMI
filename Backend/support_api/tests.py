"""
Tests for support_api app - ticketing, system health, user management.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from support_api.models import TechSupportProfile

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class TechSupportDashboardTests(TestCase):
    """Test tech support dashboard."""

    def setUp(self):
        self.client = APIClient()
        # Use super_admin to avoid needing TechSupportProfile for dashboard
        self.super_admin = User.objects.create_user(
            email='superadmin@test.com', password='Pass123!',
            first_name='Super', last_name='Admin', role='super_admin',
            is_verified=True,
        )
        self.tech_support_user = User.objects.create_user(
            email='techsupport@test.com', password='Pass123!',
            first_name='Tech', last_name='Support', role='tech_support',
            is_verified=True,
        )
        TechSupportProfile.objects.create(
            user=self.tech_support_user, employee_id='TS001',
            department='general', created_by=self.super_admin,
        )
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
        )

    def test_dashboard_super_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get('/api/v1/support/dashboard/')
        self.assertEqual(response.status_code, 200)

    def test_dashboard_tech_support(self):
        self.client.force_authenticate(user=self.tech_support_user)
        response = self.client.get('/api/v1/support/dashboard/')
        self.assertEqual(response.status_code, 200)

    def test_student_cannot_access_dashboard(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/support/dashboard/')
        self.assertIn(response.status_code, [403])

    def test_dashboard_unauthenticated(self):
        response = self.client.get('/api/v1/support/dashboard/')
        self.assertIn(response.status_code, [401, 403])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class SupportTicketTests(TestCase):
    """Test support ticket CRUD."""

    def setUp(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_user(
            email='admin@test.com', password='Pass123!',
            first_name='Admin', last_name='User', role='super_admin',
            is_verified=True,
        )
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )

    def test_list_tickets_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(response.status_code, 200)

    def test_create_ticket(self):
        self.client.force_authenticate(user=self.student_user)
        data = {
            'title': 'Test Ticket',
            'description': 'I need help with my booking.',
            'category': 'general',
            'priority': 'medium',
        }
        response = self.client.post('/api/v1/support/tickets/', data, format='json')
        self.assertIn(response.status_code, [200, 201])

    def test_ticket_stats(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get('/api/v1/support/tickets/stats/')
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class SystemHealthTests(TestCase):
    """Test system health and monitoring endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@test.com', password='Pass123!',
            first_name='Admin', last_name='User', role='super_admin',
            is_verified=True,
        )
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
        )

    def test_system_health(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/support/system-health/')
        self.assertEqual(response.status_code, 200)

    def test_system_stats(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/support/stats/')
        self.assertEqual(response.status_code, 200)

    def test_system_logs(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/support/logs/')
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class UserManagementTests(TestCase):
    """Test tech support user management."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@test.com', password='Pass123!',
            first_name='Admin', last_name='User', role='super_admin',
            is_verified=True,
        )

    def test_list_users(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/support/users/')
        self.assertEqual(response.status_code, 200)

    def test_list_hostels(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/support/hostels/')
        self.assertEqual(response.status_code, 200)

    def test_list_transactions(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/support/transactions/')
        self.assertEqual(response.status_code, 200)
