"""
Payout account orchestration — bank-details submission, Paystack account
resolve, and subaccount create/update.

Views must call this service, never touch PaystackProvider or PayoutAccount
directly for mutations — this is the single choke point that guarantees an
Organization's payout status only ever flips to 'active' on Paystack's own
confirmed resolve + subaccount create/update, and never on client input.
"""
from __future__ import annotations

from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils import timezone

from organizations.models import PayoutAccount
from rent.providers.base import PaymentProviderError
from rent.providers.paystack import PaystackProvider


class PayoutService:
    """Provider-independent payout-account orchestration for the `organizations` app."""

    @classmethod
    def submit_bank_details(
        cls,
        organization,
        bank_name: str,
        bank_account_number: str,
        bank_code: str,
    ) -> PayoutAccount:
        """
        Submit (or edit) bank details for `organization`'s PayoutAccount.

        Idempotency: submitting identical bank details while the account is
        already 'active' is a safe no-op — no Paystack call, no second
        subaccount.

        D-09 edit-reset: editing bank details on an already-'active' account
        resets status to 'pending_verification' and reuses the existing
        Paystack subaccount code via `update_subaccount` (never
        `create_subaccount`, which would create a second, orphaned
        subaccount for the same Organization).
        """
        with transaction.atomic():
            # Chaining select_for_update() before get_or_create() locks the
            # row on both the found and newly-created path, closing the
            # concurrency race between two simultaneous submissions — except
            # for the very first submission, where select_for_update() has
            # no existing row to lock. Two concurrent first-time submissions
            # for a brand-new organization can both fall through to
            # create(), and PayoutAccount.organization is a unique
            # OneToOneField, so the loser raises IntegrityError. Catch it
            # and re-fetch instead of surfacing an unhandled 500.
            try:
                payout_account, _created = PayoutAccount.objects.select_for_update().get_or_create(
                    organization=organization,
                    defaults={'status': 'not_started'},
                )
            except IntegrityError:
                payout_account = PayoutAccount.objects.select_for_update().get(
                    organization=organization,
                )

            unchanged = (
                payout_account.bank_name == bank_name
                and payout_account.bank_account_number == bank_account_number
                and payout_account.bank_code == bank_code
            )
            if unchanged and payout_account.status == 'active':
                return payout_account

            # Capture BEFORE overwriting the bank fields below — capturing
            # after overwrite would always see the new, not-yet-verified
            # values and never detect a genuine edit-of-active.
            is_edit_of_active = payout_account.status == 'active'
            existing_subaccount_code = (
                payout_account.paystack_subaccount_code if is_edit_of_active else None
            )

            # Commit the "intent" before any external call — mirrors
            # SubscriptionService.switch_plan's disable-before-initiate
            # discipline rather than holding a Paystack HTTP call inside the
            # DB lock.
            payout_account.bank_name = bank_name
            payout_account.bank_account_number = bank_account_number
            payout_account.bank_code = bank_code
            payout_account.status = 'pending_verification'
            payout_account.save(update_fields=[
                'bank_name', 'bank_account_number', 'bank_code', 'status', 'updated_at',
            ])

        provider = PaystackProvider()

        resolve_result = provider.resolve_account(bank_account_number, bank_code)
        if not resolve_result.success:
            raise PaymentProviderError(
                resolve_result.error_message or 'Paystack account resolve failed',
                'paystack',
                recoverable=True,
            )

        if existing_subaccount_code:
            subaccount_result = provider.update_subaccount(
                existing_subaccount_code, bank_code, bank_account_number,
            )
        else:
            subaccount_result = provider.create_subaccount(
                business_name=organization.name,
                bank_code=bank_code,
                account_number=bank_account_number,
                percentage_charge=Decimal('0'),
            )

        if not subaccount_result.success:
            raise PaymentProviderError(
                subaccount_result.error_message or 'Paystack subaccount create/update failed',
                'paystack',
                recoverable=True,
            )

        with transaction.atomic():
            payout_account = PayoutAccount.objects.select_for_update().get(
                organization=organization,
            )
            if (
                payout_account.bank_account_number != bank_account_number
                or payout_account.bank_code != bank_code
            ):
                # A newer submission overwrote the bank fields while this
                # call's Paystack round-trip was in flight — the details we
                # just resolved/linked are stale. Do not activate; let the
                # newer submission's own resolve/subaccount call be the one
                # that flips status to active.
                return payout_account

            payout_account.paystack_subaccount_code = (
                subaccount_result.subaccount_code or existing_subaccount_code
            )
            payout_account.account_name = resolve_result.account_name
            payout_account.status = 'active'
            payout_account.last_verified_at = timezone.now()
            payout_account.save(update_fields=[
                'paystack_subaccount_code', 'account_name', 'status', 'last_verified_at', 'updated_at',
            ])

        return payout_account
