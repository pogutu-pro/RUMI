"""
Paystack billing provider — plan creation, subscription checkout, and disable.

Mirrors `rent/providers/paystack.py`'s raw-`requests` adapter style. Does not
add the `paystackapi` PyPI package — it is installed but deliberately unused
in this codebase, matching the existing rent-payment provider's convention.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Optional

import requests
from django.conf import settings

from rent.providers.base import PaymentProviderError

API_BASE = 'https://api.paystack.co'


class PaystackBillingClient:
    """Raw Paystack HTTP client for subscription billing operations."""

    provider_id = 'paystack'

    def _headers(self) -> dict:
        secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '') or ''
        if not secret:
            raise PaymentProviderError(
                'Paystack is not configured', self.provider_id, recoverable=False
            )
        return {
            'Authorization': f'Bearer {secret}',
            'Content-Type': 'application/json',
        }

    def _post(self, path: str, payload: dict, action: str) -> dict:
        try:
            response = requests.post(
                f'{API_BASE}{path}', json=payload, headers=self._headers(), timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            raise PaymentProviderError(
                f'Paystack {action} failed: {exc}', self.provider_id, recoverable=True
            )

        if not data.get('status'):
            raise PaymentProviderError(
                data.get('message', f'Paystack {action} failed'), self.provider_id, recoverable=True
            )

        return data

    def create_plan(self, name: str, price: Decimal, interval: str = 'monthly') -> dict:
        """Create a Paystack plan for a SubscriptionPlan tier."""
        data = self._post(
            '/plan',
            {'name': name, 'amount': int(price * 100), 'interval': interval, 'currency': 'KES'},
            action='plan creation',
        )
        plan_data = data.get('data', {})
        return {'plan_code': plan_data.get('plan_code', ''), 'raw': data}

    def initialize_subscription_transaction(
        self,
        email: str,
        price: Decimal,
        plan_code: str,
        reference: str,
        callback_url: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Start a Paystack checkout transaction that will attach a subscription."""
        data = self._post(
            '/transaction/initialize',
            {
                'email': email,
                'amount': int(price * 100),
                'plan': plan_code,
                'reference': reference,
                'callback_url': callback_url,
                'metadata': metadata or {},
            },
            action='transaction initialize',
        )
        txn_data = data.get('data', {})
        return {
            'authorization_url': txn_data.get('authorization_url', ''),
            'access_code': txn_data.get('access_code', ''),
            'raw': data,
        }

    def disable_subscription(self, subscription_code: str, email_token: str) -> dict:
        """Disable an existing Paystack subscription (called before switching plans)."""
        return self._post(
            '/subscription/disable',
            {'code': subscription_code, 'token': email_token},
            action='subscription disable',
        )
