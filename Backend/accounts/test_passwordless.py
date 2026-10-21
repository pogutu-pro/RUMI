"""Email-link (with code) and Google sign-in."""
from __future__ import annotations

import re
import time
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts import passwordless
from accounts.models import EmailSignInLink, LandlordProfile, User

REQUEST = '/api/v1/accounts/auth/email-link/'
SIGN_IN = '/api/v1/accounts/auth/email-link/sign-in/'
GOOGLE = '/api/v1/accounts/auth/google/'
METHODS = '/api/v1/accounts/auth/methods/'


class EmailLinkTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def ask(self, email='grace@example.com', **extra):
        return self.client.post(REQUEST, {'email': email, **extra}, format='json')

    def last_link(self):
        body = mail.outbox[-1].body
        token = re.search(r'/auth/link\?token=([\w-]+)', body).group(1)
        code = re.search(r'\((\d{6})\)', mail.outbox[-1].subject).group(1)
        return token, code

    def landlord(self, **kw):
        return User.objects.create_user(
            email='grace@example.com', password='Secret#123', role='landlord', first_name='Grace',
            is_verified=True, **kw,
        )

    def test_existing_user_signs_in_with_the_link(self):
        user = self.landlord()
        self.assertEqual(self.ask().status_code, 200)
        self.assertIn('Sign in to RumiaRent', mail.outbox[0].subject)
        token, _ = self.last_link()

        res = self.client.post(SIGN_IN, {'token': token}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['id'], user.id)
        self.assertFalse(res.data['is_new_user'])
        self.assertIn('rumi_access_token', res.cookies)
        self.assertEqual(res.cookies['rumi_user_role'].value, 'landlord')

    def test_a_link_works_once(self):
        self.landlord()
        self.ask()
        token, _ = self.last_link()
        self.client.post(SIGN_IN, {'token': token}, format='json')

        res = self.client.post(SIGN_IN, {'token': token}, format='json')

        self.assertEqual((res.status_code, res.data['error']), (400, 'link_invalid'))

    def test_an_expired_link_is_refused(self):
        self.landlord()
        self.ask()
        token, _ = self.last_link()
        EmailSignInLink.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        res = self.client.post(SIGN_IN, {'token': token}, format='json')

        self.assertEqual(res.data['error'], 'link_invalid')

    def test_a_new_email_replaces_the_previous_link(self):
        self.landlord()
        self.ask()
        old_token, _ = self.last_link()
        cache.clear()  # skip the one-minute cooldown
        self.ask()

        res = self.client.post(SIGN_IN, {'token': old_token}, format='json')

        self.assertEqual(res.data['error'], 'link_invalid')

    def test_the_code_signs_in_on_another_device(self):
        user = self.landlord()
        self.ask()
        _, code = self.last_link()

        res = self.client.post(SIGN_IN, {'email': 'Grace@Example.com', 'code': code}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['id'], user.id)

    def test_wrong_codes_lock_the_link_after_five_tries(self):
        self.landlord()
        self.ask()
        _, code = self.last_link()
        wrong = '000000' if code != '000000' else '111111'
        for _ in range(passwordless.MAX_CODE_ATTEMPTS):
            res = self.client.post(SIGN_IN, {'email': 'grace@example.com', 'code': wrong}, format='json')
            self.assertEqual(res.data['error'], 'code_invalid')

        res = self.client.post(SIGN_IN, {'email': 'grace@example.com', 'code': code}, format='json')

        self.assertEqual((res.status_code, res.data['error']), (429, 'code_locked'))

    def test_unknown_address_creates_a_landlord_account(self):
        self.assertEqual(self.ask('new.owner@example.com').status_code, 200)
        self.assertIn('Finish creating', mail.outbox[0].subject)
        self.assertFalse(User.objects.filter(email='new.owner@example.com').exists())  # not until they click
        token, _ = self.last_link()

        res = self.client.post(SIGN_IN, {'token': token}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_new_user'])
        user = User.objects.get(email='new.owner@example.com')
        self.assertEqual((user.role, user.is_verified, user.onboarding_stage), ('landlord', True, 'REGISTERED'))
        self.assertFalse(user.has_usable_password())
        self.assertTrue(LandlordProfile.objects.filter(user=user).exists())

    def test_answer_is_the_same_for_known_and_unknown_addresses(self):
        self.landlord()
        known = self.ask('grace@example.com')
        unknown = self.ask('nobody@example.com')
        self.assertEqual((known.status_code, known.data), (unknown.status_code, unknown.data))

    def test_staff_get_no_email(self):
        User.objects.create_user(email='admin@example.com', password='x', role='super_admin', is_verified=True)

        res = self.ask('admin@example.com')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_deactivated_account_gets_no_email(self):
        self.landlord(is_active=False)
        self.ask()
        self.assertEqual(len(mail.outbox), 0)

    def test_signing_in_verifies_an_unverified_address(self):
        user = User.objects.create_user(email='grace@example.com', password='x', role='tenant', is_verified=False)
        self.ask()
        token, _ = self.last_link()
        self.client.post(SIGN_IN, {'token': token}, format='json')
        user.refresh_from_db()
        self.assertTrue(user.is_verified)

    def test_one_email_a_minute_per_address(self):
        self.ask()
        res = self.ask()
        self.assertEqual((res.status_code, res.data['error']), (429, 'rate_limited'))
        self.assertEqual(len(mail.outbox), 1)

    def test_disposable_addresses_cannot_sign_up(self):
        self.ask('someone@mailinator.com')
        self.assertEqual(len(mail.outbox), 0)

    def test_next_path_is_kept_only_when_internal(self):
        self.ask(next='/tenant/rental/pay')
        self.assertIn('next=%2Ftenant%2Frental%2Fpay', mail.outbox[-1].body)
        cache.clear()
        self.ask(next='//evil.example/x')
        self.assertNotIn('next=', mail.outbox[-1].body)

    def test_only_hashes_are_stored(self):
        self.ask()
        token, code = self.last_link()
        link = EmailSignInLink.objects.get()
        self.assertNotIn(token, link.token_hash)
        self.assertNotEqual(code, link.code_hash)


def _rsa_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@override_settings(GOOGLE_CLIENT_ID='client-123.apps.googleusercontent.com')
class GoogleSignInTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.key = _rsa_key()
        keys = SimpleNamespace(get_signing_key_from_jwt=lambda _token: SimpleNamespace(key=self.key.public_key()))
        patcher = patch.object(passwordless, '_google_keys', return_value=keys)
        patcher.start()
        self.addCleanup(patcher.stop)

    def credential(self, key=None, **claims):
        now = int(time.time())
        payload = {
            'iss': 'https://accounts.google.com', 'aud': 'client-123.apps.googleusercontent.com',
            'iat': now, 'exp': now + 600, 'email': 'wanjiru@gmail.com', 'email_verified': True,
            'given_name': 'Wanjiru', 'family_name': 'Kamau', 'picture': 'https://lh3.googleusercontent.com/a/x',
            **claims,
        }
        return jwt.encode(payload, key or self.key, algorithm='RS256')

    def test_new_google_user_becomes_a_landlord(self):
        res = self.client.post(GOOGLE, {'credential': self.credential()}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_new_user'])
        user = User.objects.get(email='wanjiru@gmail.com')
        self.assertEqual((user.first_name, user.last_name, user.role), ('Wanjiru', 'Kamau', 'landlord'))

    def test_existing_tenant_signs_in_as_themselves(self):
        tenant = User.objects.create_user(email='wanjiru@gmail.com', password='x', role='tenant', is_verified=True)

        res = self.client.post(GOOGLE, {'credential': self.credential()}, format='json')

        self.assertEqual((res.status_code, res.data['user']['id']), (200, tenant.id))
        self.assertEqual(res.cookies['rumi_user_role'].value, 'tenant')

    def test_token_for_another_app_is_refused(self):
        res = self.client.post(GOOGLE, {'credential': self.credential(aud='someone-else')}, format='json')
        self.assertEqual((res.status_code, res.data['error']), (400, 'google_invalid'))

    def test_token_not_signed_by_google_is_refused(self):
        res = self.client.post(GOOGLE, {'credential': self.credential(key=_rsa_key())}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_expired_token_is_refused(self):
        old = int(time.time()) - 7200
        res = self.client.post(GOOGLE, {'credential': self.credential(iat=old, exp=old + 600)}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_unverified_google_address_is_refused(self):
        res = self.client.post(GOOGLE, {'credential': self.credential(email_verified=False)}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(email='wanjiru@gmail.com').exists())

    def test_staff_must_use_a_password(self):
        User.objects.create_user(email='wanjiru@gmail.com', password='x', role='super_admin', is_verified=True)
        res = self.client.post(GOOGLE, {'credential': self.credential()}, format='json')
        self.assertEqual((res.status_code, res.data['error']), (403, 'password_required'))

    @override_settings(GOOGLE_CLIENT_ID='')
    def test_off_until_a_client_id_is_set(self):
        res = self.client.post(GOOGLE, {'credential': self.credential()}, format='json')
        self.assertEqual((res.status_code, res.data['error']), (404, 'google_disabled'))


class SignInMethodsTests(TestCase):
    @override_settings(GOOGLE_CLIENT_ID='')
    def test_google_hidden_without_a_client_id(self):
        self.assertIsNone(APIClient().get(METHODS).data['google_client_id'])

    @override_settings(GOOGLE_CLIENT_ID='client-123')
    def test_google_shown_with_a_client_id(self):
        self.assertEqual(APIClient().get(METHODS).data['google_client_id'], 'client-123')
