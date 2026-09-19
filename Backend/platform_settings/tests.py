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
        service.unlock(self.admin)  # the password gate is tested separately below

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


class PasswordGateTests(PlatformSettingsBase):
    """Integrations opens only for a super admin who has just re-entered their password."""

    def setUp(self):
        super().setUp()
        service.lock(self.admin)
        self.admin.set_password('AdminPass#2026')
        self.admin.save()

    def _unlock(self, password):
        return self.client.post('/api/v1/platform-settings/unlock/', {'password': password}, format='json')

    def test_everything_is_closed_until_the_password_is_entered(self):
        blocked = [
            self.client.get('/api/v1/platform-settings/'),
            self.put('PAYSTACK_SECRET_KEY', SECRET),
            self.client.delete('/api/v1/platform-settings/EMAIL_HOST/'),
            self.client.post('/api/v1/platform-settings/test/paystack/'),
            self.client.get('/api/v1/platform-settings/social-links/'),
        ]
        for response in blocked:
            self.assertEqual(response.status_code, 403)
            self.assertEqual(response.json()['code'], 'reauth_required')
        self.assertEqual(PlatformSetting.objects.count(), 0)

    def test_the_right_password_opens_it_and_wrong_ones_do_not(self):
        self.assertEqual(self._unlock('nope').status_code, 400)
        self.assertEqual(self.client.get('/api/v1/platform-settings/').status_code, 403)

        ok = self._unlock('AdminPass#2026')
        self.assertEqual(ok.status_code, 200)
        self.assertGreater(ok.json()['seconds_left'], 500)
        self.assertEqual(self.client.get('/api/v1/platform-settings/').status_code, 200)

    def test_status_reports_locked_and_unlocked(self):
        self.assertFalse(self.client.get('/api/v1/platform-settings/unlock-status/').json()['unlocked'])
        self._unlock('AdminPass#2026')
        self.assertTrue(self.client.get('/api/v1/platform-settings/unlock-status/').json()['unlocked'])

    def test_it_can_be_locked_again_at_once(self):
        self._unlock('AdminPass#2026')
        self.assertEqual(self.client.post('/api/v1/platform-settings/lock/').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/platform-settings/').status_code, 403)

    def test_it_expires_by_itself(self):
        self._unlock('AdminPass#2026')
        with mock.patch('platform_settings.service.time.time', return_value=service.time.time() + service.UNLOCK_TTL_SECONDS + 5):
            self.assertEqual(self.client.get('/api/v1/platform-settings/').status_code, 403)

    def test_repeated_wrong_passwords_are_throttled_even_for_the_right_one(self):
        for _ in range(service.MAX_UNLOCK_FAILURES):
            self.assertEqual(self._unlock('wrong').status_code, 400)
        locked_out = self._unlock('AdminPass#2026')
        self.assertEqual(locked_out.status_code, 429)
        self.assertEqual(self.client.get('/api/v1/platform-settings/').status_code, 403)

    def test_attempts_are_audited_without_the_password(self):
        self._unlock('wrong-secret-attempt')
        self._unlock('AdminPass#2026')
        actions = list(AuditLog.objects.filter(action__startswith='platform_settings_unlock').values_list('action', flat=True))
        self.assertIn('platform_settings_unlock_failed', actions)
        self.assertIn('platform_settings_unlocked', actions)
        everything = ' '.join(str(e.metadata) for e in AuditLog.objects.all())
        self.assertNotIn('wrong-secret-attempt', everything)
        self.assertNotIn('AdminPass', everything)

    def test_another_admin_is_not_unlocked_by_this_ones_password(self):
        other = User.objects.create_user(email='root2@t.com', password='Other#2026x', first_name='O', last_name='T',
                                         role='super_admin', is_verified=True)
        self._unlock('AdminPass#2026')
        client = APIClient()
        client.force_authenticate(user=other)
        self.assertEqual(client.get('/api/v1/platform-settings/').status_code, 403)

    def test_non_super_admins_cannot_even_try_the_password_step(self):
        support = User.objects.create_user(email='s@t.com', password='Pass123!', first_name='S', last_name='T', role='tech_support')
        client = APIClient()
        client.force_authenticate(user=support)
        self.assertEqual(client.post('/api/v1/platform-settings/unlock/', {'password': 'Pass123!'}, format='json').status_code, 403)


class SocialLinkTests(PlatformSettingsBase):
    def test_a_super_admin_adds_a_link_and_the_public_endpoint_shows_it(self):
        from rumi.cache_utils import api_cache
        resp = self.client.put('/api/v1/platform-settings/social-links/tiktok/', {'url': 'https://www.tiktok.com/@rumiarent'}, format='json')
        self.assertEqual(resp.status_code, 200)
        api_cache.cache_manager.delete(api_cache.cache_manager.get_cache_key('api', '/api/v1/home/social-links/', 'GET'))
        public = APIClient().get('/api/v1/home/social-links/').json()['results']
        self.assertEqual(public, [{'platform': 'tiktok', 'url': 'https://www.tiktok.com/@rumiarent'}])

    def test_nothing_is_shown_until_a_link_is_added(self):
        self.assertEqual(APIClient().get('/api/v1/home/social-links/').json()['results'], [])

    def test_a_scheme_is_added_when_missing_and_www_is_accepted(self):
        resp = self.client.put('/api/v1/platform-settings/social-links/instagram/', {'url': 'instagram.com/rumiarent'}, format='json')
        self.assertEqual(resp.json()['url'], 'https://instagram.com/rumiarent')

    def test_bad_links_are_rejected(self):
        bad = [
            ('tiktok', 'https://facebook.com/rumiarent'),      # wrong site
            ('tiktok', 'https://evil.com/tiktok.com'),          # host trick
            ('tiktok', 'https://tiktok.com.evil.com/x'),        # look-alike domain
            ('tiktok', 'http://tiktok.com/@x'),                 # not https
            ('tiktok', 'javascript:alert(1)'),
            ('tiktok', 'https://user:pass@tiktok.com/@x'),
            ('tiktok', 'https://tiktok.com/@x y'),
            ('tiktok', ''),
            ('myspace', 'https://myspace.com/x'),               # unsupported platform
        ]
        for platform, url in bad:
            with self.subTest(url=url):
                resp = self.client.put(f'/api/v1/platform-settings/social-links/{platform}/', {'url': url}, format='json')
                self.assertEqual(resp.status_code, 400)
        from home.models import SocialLink
        self.assertEqual(SocialLink.objects.count(), 0)

    def test_links_can_be_replaced_and_removed(self):
        self.client.put('/api/v1/platform-settings/social-links/x/', {'url': 'https://x.com/old'}, format='json')
        self.client.put('/api/v1/platform-settings/social-links/x/', {'url': 'https://x.com/new'}, format='json')
        listing = {r['platform']: r['url'] for r in self.client.get('/api/v1/platform-settings/social-links/').json()['results']}
        self.assertEqual(listing['x'], 'https://x.com/new')
        self.assertEqual(listing['tiktok'], '')
        self.assertEqual(self.client.delete('/api/v1/platform-settings/social-links/x/').status_code, 200)
        from home.models import SocialLink
        self.assertEqual(SocialLink.objects.count(), 0)

    def test_changes_are_audited_and_the_cached_public_list_is_cleared(self):
        with mock.patch('rumi.cache_utils.api_cache.cache_manager.delete') as delete:
            self.client.put('/api/v1/platform-settings/social-links/youtube/', {'url': 'https://youtube.com/@rumiarent'}, format='json')
        delete.assert_called()
        self.assertTrue(AuditLog.objects.filter(action='social_link_updated').exists())

    def test_only_an_unlocked_super_admin_can_change_links(self):
        service.lock(self.admin)
        self.assertEqual(
            self.client.put('/api/v1/platform-settings/social-links/tiktok/', {'url': 'https://tiktok.com/@x'}, format='json').status_code, 403)
        tenant = User.objects.create_user(email='t@t.com', password='Pass123!', first_name='T', last_name='T', role='tenant')
        client = APIClient()
        client.force_authenticate(user=tenant)
        self.assertEqual(client.put('/api/v1/platform-settings/social-links/tiktok/', {'url': 'https://tiktok.com/@x'}, format='json').status_code, 403)

