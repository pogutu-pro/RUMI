import json
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from audit.models import AuditLog
from platform_settings import service
from platform_settings.models import PlatformSetting

User = get_user_model()

SECRET = 'sk_live_supersecretvalue1234567890'


class PlatformSettingsBase(TestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email='root@t.com', password='Pass123!', first_name='Ad', last_name='Min',
            role='super_admin', is_verified=True, phone_number='0712345678',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def tearDown(self):
        # Restore whatever the env file said so a test never leaks into the next.
        PlatformSetting.objects.all().delete()
        service.apply_overrides()

    def put(self, key, value):
        return self.client.put(f'/api/v1/platform-settings/{key}/', {'value': value}, format='json')


class AccessControlTests(PlatformSettingsBase):
    def test_only_a_super_admin_may_use_any_endpoint(self):
        for role in ('tech_support', 'landlord', 'caretaker', 'tenant'):
            user = User.objects.create_user(email=f'{role}@t.com', password='Pass123!', first_name='X', last_name='Y', role=role)
            client = APIClient()
            client.force_authenticate(user=user)
            with self.subTest(role=role):
                self.assertEqual(client.get('/api/v1/platform-settings/').status_code, 403)
                self.assertEqual(client.put('/api/v1/platform-settings/PAYSTACK_SECRET_KEY/', {'value': SECRET}, format='json').status_code, 403)
                self.assertEqual(client.post('/api/v1/platform-settings/test/paystack/').status_code, 403)
        self.assertEqual(PlatformSetting.objects.count(), 0)

    def test_anonymous_is_refused(self):
        self.assertIn(APIClient().get('/api/v1/platform-settings/').status_code, (401, 403))

    def test_only_allow_listed_settings_can_be_touched(self):
        for key in ('SECRET_KEY', 'DEBUG', 'DATABASES', 'ALLOWED_HOSTS', 'nonsense'):
            with self.subTest(key=key):
                self.assertEqual(self.put(key, 'x').status_code, 404)
        self.assertEqual(PlatformSetting.objects.count(), 0)


class SecretsNeverLeakTests(PlatformSettingsBase):
    def test_a_saved_secret_is_never_returned_in_any_response(self):
        put = self.put('PAYSTACK_SECRET_KEY', SECRET)
        self.assertEqual(put.status_code, 200)
        listing = self.client.get('/api/v1/platform-settings/')
        for response in (put, listing):
            self.assertNotIn('supersecretvalue', response.content.decode())
        entry = next(s for g in listing.json()['groups'] for s in g['settings'] if s['key'] == 'PAYSTACK_SECRET_KEY')
        self.assertTrue(entry['configured'])
        self.assertEqual(entry['source'], 'dashboard')
        self.assertEqual(entry['hint'], '••••7890')
        self.assertIsNone(entry['value'])

    def test_secrets_are_encrypted_in_the_database(self):
        self.put('PAYSTACK_SECRET_KEY', SECRET)
        stored = PlatformSetting.objects.get(key='PAYSTACK_SECRET_KEY').encrypted_value
        self.assertNotIn('supersecretvalue', stored)
        self.assertEqual(service.decrypt(stored), SECRET)

    def test_the_audit_trail_records_the_change_but_not_the_secret(self):
        self.put('PAYSTACK_SECRET_KEY', SECRET)
        entry = AuditLog.objects.filter(action='platform_setting_updated').latest('id')
        self.assertEqual(entry.actor, self.admin)
        blob = json.dumps(entry.metadata) + str(entry.old_value) + str(entry.new_value)
        self.assertIn('PAYSTACK_SECRET_KEY', blob)
        self.assertNotIn('supersecretvalue', blob)
        self.assertNotIn('7890', blob)

    def test_non_secret_settings_show_their_value(self):
        self.put('EMAIL_HOST', 'live.smtp.mailtrap.io')
        entry = next(s for g in self.client.get('/api/v1/platform-settings/').json()['groups']
                     for s in g['settings'] if s['key'] == 'EMAIL_HOST')
        self.assertEqual(entry['value'], 'live.smtp.mailtrap.io')

    def test_a_key_that_cannot_be_decrypted_is_flagged_not_fatal(self):
        PlatformSetting.objects.create(key='PAYSTACK_SECRET_KEY', encrypted_value='not-a-real-token')
        service.apply_overrides()
        entry = next(s for g in self.client.get('/api/v1/platform-settings/').json()['groups']
                     for s in g['settings'] if s['key'] == 'PAYSTACK_SECRET_KEY')
        self.assertTrue(entry['unreadable'])


class ValidationTests(PlatformSettingsBase):
    def test_rejects_bad_values_and_stores_nothing(self):
        bad = {
            'PAYSTACK_SECRET_KEY': ['', '   ', 'abc123', 'pk_live_wrongkind'],
            'PAYSTACK_PUBLIC_KEY': ['sk_live_wrongkind'],
            'PAYSTACK_ENV': ['production'],
            'SMS_MONTHLY_LIMIT': ['lots', '-5', '99999999999'],
            'EMAIL_PORT': ['0', '70000', 'abc'],
            'EMAIL_USE_TLS': ['maybe'],
            'EMAIL_HOST': ['line1\nline2', 'x' * 501],
        }
        for key, values in bad.items():
            for value in values:
                with self.subTest(key=key, value=value[:20]):
                    self.assertEqual(self.put(key, value).status_code, 400)
        self.assertEqual(PlatformSetting.objects.count(), 0)

    def test_accepts_good_values_with_the_right_types(self):
        self.assertEqual(self.put('EMAIL_PORT', '2525').status_code, 200)
        self.assertEqual(settings.EMAIL_PORT, 2525)
        self.assertEqual(self.put('EMAIL_USE_TLS', False).status_code, 200)
        self.assertIs(settings.EMAIL_USE_TLS, False)
        self.assertEqual(self.put('PAYSTACK_ENV', 'live').status_code, 200)
        self.assertEqual(settings.PAYSTACK_ENV, 'live')


class RuntimeEffectTests(PlatformSettingsBase):
    def test_a_saved_value_is_what_the_rest_of_the_system_reads(self):
        self.put('AFRICASTALKING_API_KEY', 'at_key_from_dashboard')
        self.put('AFRICASTALKING_USERNAME', 'rumiarent')
        self.assertEqual(settings.AFRICASTALKING_API_KEY, 'at_key_from_dashboard')
        self.assertEqual(settings.AFRICASTALKING_USERNAME, 'rumiarent')

    def test_email_connections_pick_up_new_smtp_settings_without_a_restart(self):
        from django.core.mail import get_connection
        self.put('EMAIL_HOST', 'smtp.changed.example')
        self.put('EMAIL_PORT', 2525)
        connection = get_connection(backend='django.core.mail.backends.smtp.EmailBackend')
        self.assertEqual((connection.host, connection.port), ('smtp.changed.example', 2525))

    def test_paystack_provider_uses_the_dashboard_key(self):
        self.put('PAYSTACK_ENV', 'live')
        self.put('PAYSTACK_SECRET_KEY', SECRET)
        from billing.providers.paystack_billing import PaystackBillingClient
        self.assertEqual(PaystackBillingClient()._headers()['Authorization'], f'Bearer {SECRET}')

    def test_clearing_an_override_falls_back_to_the_server_file_value(self):
        original = getattr(settings, 'EMAIL_HOST', None)
        self.put('EMAIL_HOST', 'smtp.changed.example')
        self.assertEqual(settings.EMAIL_HOST, 'smtp.changed.example')
        resp = self.client.delete('/api/v1/platform-settings/EMAIL_HOST/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(settings.EMAIL_HOST, original)
        self.assertEqual(resp.json()['source'], 'server' if original else 'not_set')
        self.assertTrue(AuditLog.objects.filter(action='platform_setting_cleared').exists())

    def test_another_process_reloads_when_the_version_changes(self):
        """Simulates a Celery worker: it never handled the request, but sees the change."""
        self.put('EMAIL_HOST', 'smtp.first.example')
        # A different process changes the database and bumps the shared version.
        PlatformSetting.objects.filter(key='EMAIL_HOST').update(encrypted_value=service.encrypt('smtp.second.example'))
        service.bump_version()
        service._last_check = 0  # this process is due a check
        service.ensure_fresh()
        self.assertEqual(settings.EMAIL_HOST, 'smtp.second.example')

    def test_the_middleware_refreshes_before_handling_a_request(self):
        with mock.patch('platform_settings.service.ensure_fresh') as fresh:
            self.client.get('/api/v1/platform-settings/')
        fresh.assert_called()


class ConnectionTestTests(PlatformSettingsBase):
    def test_paystack_check_reports_accepted_and_rejected_keys(self):
        self.put('PAYSTACK_ENV', 'live')
        self.put('PAYSTACK_SECRET_KEY', SECRET)
        ok = mock.Mock(status_code=200)
        with mock.patch('platform_settings.views.requests.get', return_value=ok):
            body = self.client.post('/api/v1/platform-settings/test/paystack/').json()
        self.assertTrue(body['ok'])
        self.assertEqual(body['mode'], 'live')
        self.assertEqual(body['warning'], '')

        refused = mock.Mock(status_code=401)
        refused.json.return_value = {'message': 'Invalid key'}
        with mock.patch('platform_settings.views.requests.get', return_value=refused):
            body = self.client.post('/api/v1/platform-settings/test/paystack/').json()
        self.assertFalse(body['ok'])
        self.assertIn('Invalid key', body['detail'])

    def test_paystack_check_warns_when_key_and_mode_disagree(self):
        self.put('PAYSTACK_ENV', 'test')
        self.put('PAYSTACK_SECRET_KEY', SECRET)  # a live key
        with mock.patch('platform_settings.views.requests.get', return_value=mock.Mock(status_code=200)):
            body = self.client.post('/api/v1/platform-settings/test/paystack/').json()
        self.assertIn('live key', body['warning'])

    def test_paystack_check_without_a_key(self):
        with override_settings(PAYSTACK_SECRET_KEY=''):
            body = self.client.post('/api/v1/platform-settings/test/paystack/').json()
        self.assertFalse(body['ok'])

    def test_email_test_goes_to_the_signed_in_admin(self):
        from django.core import mail
        with override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'):
            body = self.client.post('/api/v1/platform-settings/test/email/').json()
        self.assertTrue(body['ok'])
        self.assertEqual(mail.outbox[0].to, ['root@t.com'])

    def test_email_test_reports_smtp_failure(self):
        with mock.patch('platform_settings.views.send_mail', side_effect=ConnectionRefusedError('nope')):
            body = self.client.post('/api/v1/platform-settings/test/email/').json()
        self.assertFalse(body['ok'])
        self.assertIn('nope', body['detail'])

    def test_sms_test_needs_a_phone_and_reports_failures(self):
        with mock.patch('notifications.tasks.send_sms_via_africastalking') as send:
            self.assertTrue(self.client.post('/api/v1/platform-settings/test/sms/').json()['ok'])
        send.assert_called_once()
        with mock.patch('notifications.tasks.send_sms_via_africastalking', side_effect=Exception('no balance')):
            body = self.client.post('/api/v1/platform-settings/test/sms/').json()
        self.assertFalse(body['ok'])
        self.admin.phone_number = ''
        self.admin.save()
        self.assertIn('phone number', self.client.post('/api/v1/platform-settings/test/sms/').json()['detail'])
