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
        except requests.RequestException as exc:
            return VerifyPaymentResult(
                success=False,
                status='failed',
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

        status_map = {
            'success': 'success',
            'failed': 'failed',
            'abandoned': 'failed',
            'pending': 'pending',
        }

        return VerifyPaymentResult(
            success=paystack_status == 'success',
            status=status_map.get(paystack_status, 'failed'),
            amount=amount,
            provider_reference=txn.get('reference', ref),
            raw_response=data,
        )

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
