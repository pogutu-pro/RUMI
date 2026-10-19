"""
Minimal Safaricom Daraja client — OAuth and C2B Register URL.

Matches the raw-`requests` adapter style of rent/providers/paystack.py.
Not exercised against Safaricom yet (no credentials); unit-tested with
mocked HTTP. See docs/roadmap/phase-2-paybill-design.md.
"""

from __future__ import annotations

import requests
from django.conf import settings
from django.core.cache import cache

BASE_URLS = {
    'sandbox': 'https://sandbox.safaricom.co.ke',
    'production': 'https://api.safaricom.co.ke',
}
TOKEN_TTL_SECONDS = 50 * 60  # Daraja tokens last ~1 hour


class DarajaError(Exception):
    """Daraja refused or could not be reached (maps to a 502)."""


def callback_urls(paybill) -> dict:
    base = getattr(settings, 'BACKEND_API_URL', '').rstrip('/')
    prefix = f'{base}/api/v1/paybill/c2b/{paybill.callback_token}'
    return {'ConfirmationURL': f'{prefix}/confirm/', 'ValidationURL': f'{prefix}/validate/'}


class DarajaClient:
    def __init__(self, paybill):
        self.paybill = paybill
        self.base_url = BASE_URLS[paybill.environment]

    def _token(self) -> str:
        cache_key = f'daraja-token:{self.paybill.pk}'
        token = cache.get(cache_key)
        if token:
            return token
        if not self.paybill.has_credentials:
            raise DarajaError('Add the Daraja consumer key and secret for this paybill first.')
        try:
            response = requests.get(
                f'{self.base_url}/oauth/v1/generate',
                params={'grant_type': 'client_credentials'},
                auth=(self.paybill.consumer_key, self.paybill.consumer_secret),
                timeout=30,
            )
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise DarajaError(f'Could not reach Safaricom: {exc}') from exc
        token = data.get('access_token')
        if not token:
            raise DarajaError(data.get('errorMessage') or 'Safaricom rejected the consumer key/secret')
        cache.set(cache_key, token, TOKEN_TTL_SECONDS)
        return token

    def register_urls(self) -> dict:
        """
        Point Safaricom's C2B callbacks for this shortcode at RumiaRent.
        ResponseType 'Completed': if our validation endpoint is unreachable the
        payment still completes — tenants are never bounced by our downtime.
        """
        path = getattr(settings, 'DARAJA_C2B_REGISTER_PATH', '/mpesa/c2b/v2/registerurl')
        payload = {'ShortCode': self.paybill.shortcode, 'ResponseType': 'Completed', **callback_urls(self.paybill)}
        try:
            response = requests.post(
                f'{self.base_url}{path}',
                json=payload,
                headers={'Authorization': f'Bearer {self._token()}'},
                timeout=30,
            )
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise DarajaError(f'Could not reach Safaricom: {exc}') from exc
        if str(data.get('ResponseCode', data.get('responseCode', ''))) not in ('0', '00000000'):
            raise DarajaError(data.get('errorMessage') or data.get('ResponseDescription') or 'URL registration failed')
        return data
