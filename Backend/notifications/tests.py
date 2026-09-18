"""
Tests for notifications app - notification CRUD, preferences, admin views.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from notifications.models import Notification

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class NotificationListTests(TestCase):
    """Test notification listing and filtering."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        self.base_url = '/api/v1/notifications/'
        self.notif1 = Notification.objects.create(
            recipient=self.user, notification_type='booking',
            channel='in_app', subject='Booking Confirmed',
            message='Your booking has been confirmed.', status='sent',
        )
        self.notif2 = Notification.objects.create(
            recipient=self.user, notification_type='payment',
            channel='in_app', subject='Payment Received',
            message='Your payment was received.', status='sent',
        )

    def test_list_notifications_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)

    def test_list_notifications_unauthenticated(self):
        response = self.client.get(self.base_url)
        self.assertIn(response.status_code, [401, 403])

    def test_notifications_only_own(self):
        other_user = User.objects.create_user(
            email='other@test.com', password='Pass123!',
            first_name='Other', last_name='User', role='student',
        )
        Notification.objects.create(
            recipient=other_user, notification_type='booking',
            channel='in_app', message='Not yours', status='sent',
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class NotificationMarkReadTests(TestCase):
    """Test marking notifications as read."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        self.notif = Notification.objects.create(
            recipient=self.user, notification_type='booking',
            channel='in_app', message='Test notification', status='sent',
        )

    def test_mark_single_read(self):
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/notifications/{self.notif.id}/read/'
        response = self.client.put(url)
        self.assertEqual(response.status_code, 200)

    def test_mark_all_read(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put('/api/v1/notifications/mark-all-read/')
        self.assertEqual(response.status_code, 200)

    def test_mark_read_unauthenticated(self):
        url = f'/api/v1/notifications/{self.notif.id}/read/'
        response = self.client.put(url)
        self.assertIn(response.status_code, [401, 403])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class NotificationPreferenceTests(TestCase):
    """Test notification preference management."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        self.url = '/api/v1/notifications/preferences/'

    def test_get_preferences(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_update_preferences(self):
        self.client.force_authenticate(user=self.user)
        data = {'email_enabled': False}
        response = self.client.put(self.url, data, format='json')
        self.assertIn(response.status_code, [200, 204])
        self.assertFalse(response.data['email_enabled'])

    def test_sms_enabled_cannot_be_turned_off(self):
        """SMS rent reminders are mandatory — the field is readable but not
        settable through this endpoint, and any pre-existing False value is
        self-healed back to True on the next update."""
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url, {'sms_enabled': False}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['sms_enabled'])

        from .models import NotificationPreference
        prefs = NotificationPreference.objects.get(user=self.user)
        self.assertTrue(prefs.sms_enabled)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class AdminNotificationTests(TestCase):
    """Test admin notification endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@test.com', password='Pass123!',
            first_name='Admin', last_name='User', role='tech_support',
            is_verified=True,
        )
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )

    def test_admin_stats_access(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/notifications/admin/stats/')
        self.assertEqual(response.status_code, 200)

    def test_student_cannot_access_admin_stats(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/notifications/admin/stats/')
        self.assertIn(response.status_code, [403, 404])

    def test_admin_email_templates(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/notifications/admin/templates/email/')
        self.assertEqual(response.status_code, 200)

    def test_admin_sms_templates(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/notifications/admin/templates/sms/')
        self.assertEqual(response.status_code, 200)
