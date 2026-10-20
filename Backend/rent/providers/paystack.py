"""
Paystack payment provider adapter.
"""

from __future__ import annotations

from decimal import Decimal

import requests
from django.conf import settings

from .base import (
    AccountResolveResult,
    BasePaymentProvider,
    InitiatePaymentRequest,
    InitiatePaymentResult,
    ProviderConfigStatus,
    ProviderStatus,
    SubaccountResult,
    VerifyPaymentRequest,
    VerifyPaymentResult,
    PaymentProviderError,
)


class PaystackProvider(BasePaymentProvider):
    provider_id = 'paystack'
    API_BASE = 'https://api.paystack.co'

    def get_config_status(self) -> ProviderConfigStatus:
        secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '') or ''
        if not secret:
            return ProviderConfigStatus(
                provider=self.provider_id,
                status=ProviderStatus.NOT_CONFIGURED,
                message='PAYSTACK_SECRET_KEY is not set',
                required_env_vars=['PAYSTACK_SECRET_KEY'],
            )

        # HARD-04/D-04: cheap prefix-match validation — never a live Paystack
        # API call. Confirms the deployed secret (and, if set, public) key
        # prefix actually matches the declared PAYSTACK_ENV, so a test key
        # accidentally deployed to a "live" environment (or vice versa) is
        # caught before PaymentService.initiate ever calls Paystack.
        env = getattr(settings, 'PAYSTACK_ENV', 'test') or 'test'
        public = getattr(settings, 'PAYSTACK_PUBLIC_KEY', '') or ''
        expected_secret_prefix = 'sk_live_' if env == 'live' else 'sk_test_'
        if not secret.startswith(expected_secret_prefix):
            return ProviderConfigStatus(
                provider=self.provider_id,
                status=ProviderStatus.MISCONFIGURED,
                message=f'PAYSTACK_SECRET_KEY prefix does not match PAYSTACK_ENV={env}',
            )
        if public:
            secret_is_live = secret.startswith('sk_live_')
            public_is_live = public.startswith('pk_live_')
            if secret_is_live != public_is_live:
                return ProviderConfigStatus(
                    provider=self.provider_id,
                    status=ProviderStatus.MISCONFIGURED,
                    message=(
                        'PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY are from '
                        'different environments (test/live mismatch)'
                    ),
                )

        return ProviderConfigStatus(
            provider=self.provider_id,
            status=ProviderStatus.AVAILABLE,
        )

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

    def initiate_payment(self, request: InitiatePaymentRequest) -> InitiatePaymentResult:
        config = self.get_config_status()
        if config.status != ProviderStatus.AVAILABLE:
            return InitiatePaymentResult(
                success=False,
                error_message=config.message,
            )

        payload = {
            'email': request.tenant_email,
            'amount': int(request.amount * 100),  # Paystack uses kobo/cents
            'currency': request.currency,
            'reference': request.internal_reference,
            'callback_url': request.callback_url,
            'metadata': {
                **request.metadata,
                'internal_reference': request.internal_reference,
                'tenant_phone': request.tenant_phone,
            },
        }

        if request.subaccount_code:
            # Split-payment routing (PAY-03): the platform's Paystack account
            # always bears the transaction fee on a split payment — hardcoded,
            # never left to Paystack's default (T-02-07).
            payload['subaccount'] = request.subaccount_code
            payload['bearer'] = request.bearer or 'account'

        try:
            response = requests.post(
                f'{self.API_BASE}/transaction/initialize',
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            return InitiatePaymentResult(
                success=False,
                error_message=f'Paystack request failed: {exc}',
            )

        if not data.get('status'):
            return InitiatePaymentResult(
                success=False,
                error_message=data.get('message', 'Paystack initialization failed'),
                raw_response=data,
            )

        auth_data = data.get('data', {})
        return InitiatePaymentResult(
            success=True,
            provider_reference=auth_data.get('reference', request.internal_reference),
            authorization_url=auth_data.get('authorization_url', ''),
            raw_response=data,
        )

    def verify_payment(self, request: VerifyPaymentRequest) -> VerifyPaymentResult:
        config = self.get_config_status()
        if config.status != ProviderStatus.AVAILABLE:
            return VerifyPaymentResult(
                success=False,
                status='failed',
                error_message=config.message,
            )

        ref = request.provider_reference or request.internal_reference
        try:
            response = requests.get(
                f'{self.API_BASE}/transaction/verify/{ref}',
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            # Audit H4: a network error or unreadable response says nothing
            # about the payment — keep it pending so it is retried, never
            # mark a possibly-paid transaction as failed.
            return VerifyPaymentResult(
                success=False,
                status='pending',
                error_message=f'Paystack verification failed: {exc}',
            )

        if not data.get('status'):
            return VerifyPaymentResult(
                success=False,
                status='failed',
                error_message=data.get('message', 'Verification failed'),
                raw_response=data,
            )

        txn = data.get('data', {})
        paystack_status = txn.get('status', 'failed')
        amount = Decimal(str(txn.get('amount', 0))) / Decimal('100')

        # Paystack transaction statuses. `abandoned` means checkout was opened
        # but not completed yet — the customer can still come back and pay,
        # so it stays pending; the reconciliation task gives up after 24h.
        status_map = {
            'success': 'success',
            'failed': 'failed',
            'reversed': 'failed',
            'abandoned': 'pending',
            'ongoing': 'pending',
            'pending': 'pending',
            'processing': 'pending',
            'queued': 'pending',
        }

        return VerifyPaymentResult(
            success=paystack_status == 'success',
            status=status_map.get(paystack_status, 'failed'),
            amount=amount,
            provider_reference=txn.get('reference', ref),
            raw_response=data,
        )

    def list_banks(self, country: str = 'kenya') -> tuple[list[dict], str | None]:
        """
        Live bank list from Paystack — GET /bank?country=<country>, so
        landlords select a real bank from a dropdown instead of typing a
        settlement bank code by hand. Returns (banks, error_message);
        banks is always a list (empty on any failure), error_message is
        None only on success — callers check error_message, not truthiness
        of an empty-but-successful list.

        Not part of BasePaymentProvider's abstract interface — Paystack is
        the sole payment processor (see CLAUDE.md constraints), so there's
        no other implementation to keep this contract-compatible with.
        """
        config = self.get_config_status()
        if config.status != ProviderStatus.AVAILABLE:
            return [], config.message

        try:
            response = requests.get(
                f'{self.API_BASE}/bank',
                params={'country': country, 'currency': 'KES', 'perPage': 100},
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            return [], f'Paystack bank list failed: {exc}'

        if not data.get('status'):
            return [], data.get('message', 'Could not fetch bank list')

        banks = [
            {'name': b.get('name', ''), 'code': b.get('code', '')}
            for b in data.get('data', [])
            if b.get('code')
        ]
        return banks, None

    def resolve_account(self, account_number: str, bank_code: str) -> AccountResolveResult:
        config = self.get_config_status()
        if config.status != ProviderStatus.AVAILABLE:
            return AccountResolveResult(
                success=False,
                error_message=config.message,
            )

        try:
            response = requests.get(
                f'{self.API_BASE}/bank/resolve',
                params={'account_number': account_number, 'bank_code': bank_code},
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            return AccountResolveResult(
                success=False,
                error_message=f'Paystack account resolve failed: {exc}',
            )

        if not data.get('status'):
            return AccountResolveResult(
                success=False,
                error_message=data.get('message', 'Account resolve failed'),
                raw_response=data,
            )

        resolved = data.get('data', {})
        return AccountResolveResult(
            success=True,
            account_name=resolved.get('account_name', ''),
            raw_response=data,
        )

    def create_subaccount(
        self,
        business_name: str,
        bank_code: str,
        account_number: str,
        percentage_charge: Decimal = Decimal('0'),
    ) -> SubaccountResult:
        config = self.get_config_status()
        if config.status != ProviderStatus.AVAILABLE:
            return SubaccountResult(
                success=False,
                error_message=config.message,
            )

        payload = {
            'business_name': business_name,
            'settlement_bank': bank_code,
            'account_number': account_number,
            'percentage_charge': float(percentage_charge),
        }

        try:
            response = requests.post(
                f'{self.API_BASE}/subaccount',
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            return SubaccountResult(
                success=False,
                error_message=f'Paystack subaccount creation failed: {exc}',
            )

        if not data.get('status'):
            return SubaccountResult(
                success=False,
                error_message=data.get('message', 'Subaccount creation failed'),
                raw_response=data,
            )

        subaccount = data.get('data', {})
        return SubaccountResult(
            success=True,
            subaccount_code=subaccount.get('subaccount_code', ''),
            raw_response=data,
        )

    def update_subaccount(
        self, subaccount_code: str, bank_code: str, account_number: str
    ) -> SubaccountResult:
        config = self.get_config_status()
        if config.status != ProviderStatus.AVAILABLE:
            return SubaccountResult(
                success=False,
                error_message=config.message,
            )

        payload = {
            'settlement_bank': bank_code,
            'account_number': account_number,
        }

        try:
            response = requests.put(
                f'{self.API_BASE}/subaccount/{subaccount_code}',
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            return SubaccountResult(
                success=False,
                error_message=f'Paystack subaccount update failed: {exc}',
            )

        if not data.get('status'):
            return SubaccountResult(
                success=False,
                error_message=data.get('message', 'Subaccount update failed'),
                raw_response=data,
            )

        subaccount = data.get('data', {})
        return SubaccountResult(
            success=True,
            subaccount_code=subaccount.get('subaccount_code', subaccount_code),
            raw_response=data,
        )
