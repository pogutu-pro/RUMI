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


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    AFRICASTALKING_API_KEY='atsk_test_not_a_real_key',
    AFRICASTALKING_USERNAME='rumiarent',
    SMS_MONTHLY_LIMIT=3,
)
class SendSmsViaAfricasTalkingTests(TestCase):
    """Africa's Talking answers HTTP 201 even when it refuses a recipient
    (blacklisted, bad number, no balance) — a refused message must raise, not
    be recorded as sent."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    @staticmethod
    def _response(status, code):
        return {'SMSMessageData': {'Message': 'x', 'Recipients': [
            {'number': '+254101436845', 'status': status, 'statusCode': code, 'cost': 'KES 0.8000'},
        ]}}

    def _send(self, response, phone='+254101436845'):
        from unittest.mock import patch
        from notifications.tasks import send_sms_via_africastalking
        with patch('africastalking.initialize'), patch('africastalking.SMS') as sms:
            sms.send.return_value = response
            result = send_sms_via_africastalking(phone, 'hello')
            return result, sms

    def test_accepted_message_returns_response(self):
        result, _ = self._send(self._response('Success', 100))
        self.assertEqual(result['SMSMessageData']['Recipients'][0]['status'], 'Success')

    def test_blacklisted_recipient_raises(self):
        from notifications.tasks import SMSDeliveryError
        with self.assertRaises(SMSDeliveryError) as ctx:
            self._send(self._response('UserInBlacklist', 406))
        self.assertIn('UserInBlacklist', str(ctx.exception))

    def test_insufficient_balance_raises(self):
        from notifications.tasks import SMSDeliveryError
        with self.assertRaises(SMSDeliveryError):
            self._send(self._response('InsufficientBalance', 405))

    def test_empty_recipient_list_raises(self):
        from notifications.tasks import SMSDeliveryError
        with self.assertRaises(SMSDeliveryError):
            self._send({'SMSMessageData': {'Message': 'x', 'Recipients': []}})

    def test_refused_message_does_not_use_up_monthly_allowance(self):
        from django.core.cache import cache
        from notifications.tasks import SMSDeliveryError
        with self.assertRaises(SMSDeliveryError):
            self._send(self._response('UserInBlacklist', 406))
        self.assertEqual(cache.get('sms:monthly_count', 0), 0)

    def test_monthly_limit_comes_from_settings(self):
        for _ in range(3):
            self._send(self._response('Success', 101))
        with self.assertRaisesMessage(Exception, 'SMS monthly limit reached'):
            self._send(self._response('Success', 101))

    def test_local_format_number_is_sent_in_e164(self):
        _, sms = self._send(self._response('Success', 100), phone='0101 436 845')
        sms.send.assert_called_once_with('hello', ['+254101436845'])


class NormalizeKenyanPhoneTests(TestCase):
    def test_formats(self):
        from notifications.tasks import normalize_kenyan_phone as n
        self.assertEqual(n('0712345678'), '+254712345678')
        self.assertEqual(n('0101436845'), '+254101436845')
        self.assertEqual(n('254712345678'), '+254712345678')
        self.assertEqual(n('+254 712-345-678'), '+254712345678')
        self.assertEqual(n('+254712345678'), '+254712345678')
        self.assertEqual(n('+15551234567'), '+15551234567')


class DeliveryLogTests(TestCase):
    """Every email and SMS attempt lands in the admin delivery log."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        User = get_user_model()
        self.user = User.objects.create_user(
            email='tenant@example.com', password='Pass123!', first_name='Ten', last_name='Ant',
            role='tenant', phone_number='0712345678',
        )
        self.admin = User.objects.create_user(
            email='root@example.com', password='Pass123!', first_name='Ad', last_name='Min',
            role='super_admin', is_verified=True,
        )
        self.client = APIClient()

    def _email_backend(self, **kwargs):
        from notifications.email_backend import LoggingSMTPEmailBackend
        return LoggingSMTPEmailBackend(host='localhost', **kwargs)

    def _message(self, to='tenant@example.com', subject='Your RumiaRent verification code'):
        from django.core.mail import EmailMessage
        return EmailMessage(subject=subject, body='<b>code 123456</b>', from_email='a@b.c', to=[to])

    def test_successful_email_is_logged_without_its_body(self):
        from unittest import mock
        from notifications.models import Notification

        backend = self._email_backend()
        with mock.patch('django.core.mail.backends.smtp.EmailBackend.send_messages', return_value=1):
            sent = backend.send_messages([self._message()])
        self.assertEqual(sent, 1)
        row = Notification.objects.get()
        self.assertEqual((row.channel, row.status), ('email', 'sent'))
        self.assertEqual(row.recipient, self.user)
        self.assertEqual(row.recipient_address, 'tenant@example.com')
        self.assertEqual(row.subject, 'Your RumiaRent verification code')
        self.assertEqual(row.message, '')
        self.assertIsNotNone(row.sent_at)

    def test_failed_email_is_logged_with_reason_and_still_raises(self):
        from unittest import mock
        from notifications.models import Notification

        backend = self._email_backend()
        with mock.patch(
            'django.core.mail.backends.smtp.EmailBackend.send_messages',
            side_effect=ConnectionRefusedError('smtp down'),
        ):
            with self.assertRaises(ConnectionRefusedError):
                backend.send_messages([self._message()])
        row = Notification.objects.get()
        self.assertEqual(row.status, 'failed')
        self.assertIn('smtp down', row.error_message)

    def test_email_to_a_non_user_is_still_logged(self):
        from unittest import mock
        from notifications.models import Notification

        with mock.patch('django.core.mail.backends.smtp.EmailBackend.send_messages', return_value=1):
            self._email_backend().send_messages([self._message(to='stranger@example.com')])
        row = Notification.objects.get()
        self.assertIsNone(row.recipient)
        self.assertEqual(row.recipient_address, 'stranger@example.com')

    def test_sms_success_and_failure_are_logged(self):
        from unittest import mock
        from notifications.models import Notification
        from notifications.tasks import send_sms_via_africastalking

        with mock.patch('notifications.tasks._deliver_sms', return_value={'ok': True}):
            send_sms_via_africastalking('0712345678', 'code 123456')
        with mock.patch('notifications.tasks._deliver_sms', side_effect=Exception('blacklisted')):
            with self.assertRaises(Exception):
                send_sms_via_africastalking('0712345678', 'code 654321')

        rows = list(Notification.objects.order_by('created_at'))
        self.assertEqual([r.status for r in rows], ['sent', 'failed'])
        self.assertTrue(all(r.channel == 'sms' and r.recipient == self.user for r in rows))
        self.assertTrue(all(r.message == '' for r in rows))  # the code is never stored
        self.assertIn('blacklisted', rows[1].error_message)

    def test_suppressed_block_records_nothing(self):
        from notifications.delivery_log import log_delivery, suppressed
        from notifications.models import Notification

        with suppressed():
            log_delivery(channel='email', address='tenant@example.com', ok=True)
        self.assertEqual(Notification.objects.count(), 0)

    def test_retry_task_leaves_delivery_log_failures_alone(self):
        from notifications.delivery_log import log_delivery
        from notifications.models import Notification
        from notifications.tasks import retry_failed_notifications

        log_delivery(channel='sms', address='0712345678', ok=False, error='no balance')
        retry_failed_notifications()
        self.assertEqual(Notification.objects.get().status, 'failed')

    def test_deleting_a_user_keeps_their_delivery_history(self):
        from notifications.delivery_log import log_delivery
        from notifications.models import Notification

        log_delivery(channel='email', address='tenant@example.com', subject='Welcome', ok=True)
        self.user.delete()
        row = Notification.objects.get()
        self.assertIsNone(row.recipient)
        self.assertEqual(row.recipient_address, 'tenant@example.com')

    def test_admin_endpoint_lists_deliveries_and_filters(self):
        from notifications.delivery_log import log_delivery

        log_delivery(channel='email', address='tenant@example.com', subject='Welcome', ok=True)
        log_delivery(channel='sms', address='0712345678', ok=False, error='no balance')
        self.client.force_authenticate(user=self.admin)

        everything = self.client.get('/api/v1/notifications/admin/deliveries/').json()['results']
        self.assertEqual(len(everything), 2)
        failed = self.client.get('/api/v1/notifications/admin/deliveries/?status=failed').json()['results']
        self.assertEqual([(r['channel'], r['error_message']) for r in failed], [('sms', 'no balance')])
        emails = self.client.get('/api/v1/notifications/admin/deliveries/?channel=email').json()['results']
        self.assertEqual(emails[0]['recipient_name'], 'Ten Ant')

    def test_admin_endpoint_is_forbidden_to_everyone_else(self):
        self.client.force_authenticate(user=self.user)
        self.assertEqual(self.client.get('/api/v1/notifications/admin/deliveries/').status_code, 403)
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get('/api/v1/notifications/admin/deliveries/').status_code, (401, 403))

    def test_stats_reflect_logged_deliveries(self):
        from notifications.delivery_log import log_delivery

        log_delivery(channel='email', address='tenant@example.com', ok=True)
        log_delivery(channel='email', address='tenant@example.com', ok=True)
        log_delivery(channel='sms', address='0712345678', ok=False, error='x')
        self.client.force_authenticate(user=self.admin)
        stats = self.client.get('/api/v1/notifications/admin/stats/').json()
        self.assertEqual(stats['total_notifications'], 3)
        self.assertEqual(stats['by_channel'], {'email': 2, 'sms': 1, 'in_app': 0})
        self.assertAlmostEqual(stats['delivery_rate'], 66.666, places=1)


class BuiltInTemplateCatalogTests(TestCase):
    """The admin template tabs list the messages the code really sends."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='root@example.com', password='Pass123!', first_name='Ad', last_name='Min',
            role='super_admin', is_verified=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_email_tab_lists_built_in_messages_even_with_no_database_templates(self):
        data = self.client.get('/api/v1/notifications/admin/templates/email/').json()
        names = {t['name'] for t in data['templates']}
        self.assertGreaterEqual(data['total_templates'], 10)
        self.assertIn('Email verification code', names)
        self.assertIn('Password reset', names)
        first = data['templates'][0]
        self.assertEqual(first['source'], 'built_in')
        self.assertTrue(first['subject'] and first['body'] and first['trigger'])

    def test_sms_tab_lists_built_in_messages(self):
        data = self.client.get('/api/v1/notifications/admin/templates/sms/').json()
        self.assertGreaterEqual(data['total_templates'], 4)
        self.assertTrue(all(t['message'] and t['trigger'] for t in data['templates']))

    def test_custom_database_templates_are_still_listed_alongside(self):
        from notifications.models import EmailTemplate
        EmailTemplate.objects.create(name='promo', subject='Big news', html_content='<p>x</p>', is_active=True)
        data = self.client.get('/api/v1/notifications/admin/templates/email/').json()
        self.assertIn('promo', {t['name'] for t in data['templates']})

    def test_every_built_in_message_still_matches_the_code_that_sends_it(self):
        """
        The catalog is documentation, so fail when the wording it quotes drifts
        from the code that sends it: the longest fixed phrase of every subject,
        body and SMS must still appear in its source file.
        """
        import re
        from pathlib import Path
        from notifications.catalog import EMAIL_CATALOG, SMS_CATALOG

        root = Path(__file__).resolve().parent.parent

        def source_text(name):
            text = (root / name).read_text()
            # Adjacent string literals ('a ' f'b') are one message; join them.
            text = re.sub(r"['\"]\s*\n\s*f?['\"]", '', text)
            return re.sub(r'\s+', ' ', text.replace('\\n', ' '))

        def longest_phrase(text):
            parts = re.split(r'\{[^}]*\}|\n', text)
            return max((re.sub(r'\s+', ' ', p).strip() for p in parts), key=len)

        for entry in EMAIL_CATALOG:
            source = source_text(entry['source_file'])
            for label in ('subject', 'body'):
                phrase = longest_phrase(entry[label])
                self.assertIn(phrase, source, f"{entry['name']} {label}: {phrase!r} not in {entry['source_file']}")
        for entry in SMS_CATALOG:
            source = source_text(entry['source_file'])
            phrase = longest_phrase(entry['message'])
            self.assertIn(phrase, source, f"{entry['name']}: {phrase!r} not in {entry['source_file']}")

    def test_other_roles_are_still_refused(self):
        tenant = User.objects.create_user(email='t@example.com', password='Pass123!', first_name='T', last_name='T', role='tenant')
        self.client.force_authenticate(user=tenant)
        self.assertEqual(self.client.get('/api/v1/notifications/admin/templates/email/').status_code, 403)

    def test_deliveries_are_paged_so_older_ones_can_be_reached(self):
        from notifications.delivery_log import log_delivery

        for n in range(25):
            log_delivery(channel='email', address=f'person{n}@example.com', subject=f'Message {n}', ok=True)
        self.client.force_authenticate(user=self.admin)
        first = self.client.get('/api/v1/notifications/admin/deliveries/').json()
        self.assertEqual(first['count'], 25)
        self.assertEqual(len(first['results']), 20)
        self.assertIsNotNone(first['next'])
        second = self.client.get('/api/v1/notifications/admin/deliveries/?page=2').json()
        self.assertEqual(len(second['results']), 5)
        self.assertIsNone(second['next'])
        seen = {r['id'] for r in first['results']} | {r['id'] for r in second['results']}
        self.assertEqual(len(seen), 25)

