"""Sessions survive the 1-hour access token, and a dead session is cleared."""
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User

LOGIN = '/api/v1/accounts/login/'
REFRESH = '/api/v1/accounts/refresh-token/'
LOGOUT = '/api/v1/accounts/logout/'
PROFILE = '/api/v1/accounts/profile/'


class SessionRefreshTests(TestCase):
    def setUp(self):
        User.objects.create_user(email='grace@example.com', password='Secret#123', role='landlord', is_verified=True)
        self.client = APIClient()
        res = self.client.post(LOGIN, {'email': 'grace@example.com', 'password': 'Secret#123'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.login = res

    def test_cookies_live_as_long_as_their_tokens(self):
        self.assertEqual(self.login.cookies['rumi_access_token']['max-age'], 3600)
        self.assertEqual(self.login.cookies['rumi_refresh_token']['max-age'], 7 * 24 * 3600)

    def test_refresh_works_from_the_cookie_alone(self):
        # The browser cannot read the httpOnly refresh cookie, so the body is empty.
        self.client.cookies.pop('rumi_access_token')
        self.assertEqual(self.client.get(PROFILE).status_code, 401)

        res = self.client.post(REFRESH, {}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertIn('rumi_access_token', res.cookies)
        self.assertEqual(self.client.get(PROFILE).status_code, 200)

    def test_refresh_rotates_and_the_old_token_stops_working(self):
        old = self.login.cookies['rumi_refresh_token'].value
        res = self.client.post(REFRESH, {}, format='json')
        self.assertNotEqual(res.cookies['rumi_refresh_token'].value, old)

        replay = APIClient().post(REFRESH, {'refresh_token': old}, format='json')

        self.assertEqual(replay.status_code, 401)

    def test_failed_refresh_clears_the_session_cookies(self):
        client = APIClient()
        client.cookies['rumi_refresh_token'] = 'not-a-token'
        client.cookies['rumi_access_token'] = 'expired'

        res = client.post(REFRESH, {}, format='json')

        self.assertEqual(res.status_code, 401)
        for name in ('rumi_access_token', 'rumi_refresh_token', 'rumi_user_role'):
            self.assertEqual(res.cookies[name]['max-age'], 0, name)

    def test_logout_works_with_an_expired_session(self):
        self.client.cookies['rumi_access_token'] = 'expired'

        res = self.client.post(LOGOUT, {}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.cookies['rumi_refresh_token']['max-age'], 0)
        # The refresh token was blacklisted, so it cannot be used again.
        replay = APIClient().post(REFRESH, {'refresh_token': self.login.cookies['rumi_refresh_token'].value}, format='json')
        self.assertEqual(replay.status_code, 401)
