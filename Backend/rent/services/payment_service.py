"""Payment provider registry and service facade."""

from __future__ import annotations

import logging
from datetime import timedelta
from decimal import Decimal
from typing import Optional

from django.db import transaction
from django.utils import timezone

from ledger.services.posting import LedgerService
from organizations.models import PayoutAccount
from organizations.services.notifications import notify_payout_blocked_attempt
from rent.models import Invoice, Payment
from rent.providers.base import (
    InitiatePaymentRequest,
    PaymentProviderError,
    ProviderConfigStatus,
    VerifyPaymentRequest,
)
from rent.providers.paystack import PaystackProvider
from rent.services.allocation import AllocationError, AllocationService
from rent.services.receipts import ReceiptService

logger = logging.getLogger(__name__)


def _allocation_invoice_id(alloc: dict):
    # 'rent_charge_id' is the pre-Phase-1 key, still accepted from older callers.
    return alloc.get('invoice_id') or alloc['rent_charge_id']


class PaymentService:
    """
    Provider-independent payment orchestration.

    Rental business logic must use this service, not provider classes directly.
    RumiaRent uses Paystack only — see PAYMENT PROVIDER AUDIT for the M-Pesa removal decision.
    """

    _providers = {
        'paystack': PaystackProvider(),
    }

    @classmethod
    def get_provider(cls, provider_id: str):
        provider = cls._providers.get(provider_id)
        if not provider:
            raise PaymentProviderError(
                f'Unknown payment provider: {provider_id}', provider_id
            )
        return provider

    @classmethod
    def list_providers(cls) -> list[ProviderConfigStatus]:
        return [p.get_config_status() for p in cls._providers.values()]

    @classmethod
    def initiate(cls, payment: Payment, callback_url: str) -> dict:
        """
        Initiate payment with the configured provider.

        Payment remains in 'pending' until verified via callback.
        """
        # PAY-03 payout-verification guard — must run before any provider
        # call. A rent payment is never routed 100% to the platform: either
        # the organization has a verified (status='active') PayoutAccount and
        # the payment splits to it, or the payment is refused outright (D-01).
        # `record_manual_payment` is intentionally untouched by this guard (D-02).
        #
        # The lookup is wrapped narrowly so any unexpected exception here
        # (corrupted relation, DB error) is treated identically to "not
        # verified" — refuse the payment (T-02-09). This is the opposite
        # fail-closed direction from the FeatureAccess.sync_with_subscription()
        # bug in PITFALLS.md Pitfall 4: that bug incorrectly fails closed on
        # ALREADY-GRANTED paid access (revoking something a customer already
        # has); this fails closed on NOT-YET-granted money routing (refusing
        # to send money for the first time), which is the semantically
        # correct fail-closed direction for this specific check.
        #
        # Queried directly by organization_id (not via the
        # `payment.organization.payout_account` reverse-descriptor cache) so
        # status is always read fresh from the database at the moment
        # `initiate` runs — a concurrent D-09 bank-detail edit that resets an
        # already-`active` PayoutAccount to `pending_verification` between
        # two calls sharing the same in-memory Organization instance would
        # otherwise be masked by Django's per-instance relation cache
        # (T-02-06). [Deviation from Task 1's literal
        # `getattr(payment.organization, 'payout_account', None)` spec — Rule
        # 1 auto-fix: that form caches on the shared Organization instance
        # and returned a stale 'active' status in the StaleStatusReCheck
        # test, so Task 3 replaced it with a direct fresh query.]
        try:
            payout_account = PayoutAccount.objects.filter(
                organization_id=payment.organization_id
            ).first()
            # Defense-in-depth: don't rely on status alone. `paystack_
            # subaccount_code` is a nullable field with no DB-level CHECK
            # tying it to status, so an out-of-band write (admin edit, data
            # migration, future bug) that leaves status='active' with no
            # subaccount code must still fail closed rather than silently
            # routing the payment unsplit to the platform.
            payout_account_active = (
                payout_account is not None
                and payout_account.status == 'active'
                and bool(payout_account.paystack_subaccount_code)
            )
        except Exception:
            logger.exception(
                'Payout status check failed for organization %s during payment initiation',
                payment.organization_id,
            )
            payout_account = None
            payout_account_active = False

        if not payout_account_active:
            payment.status = 'failed'
            payment.notes = 'Payout setup incomplete for this landlord'
            payment.save(update_fields=['status', 'notes', 'updated_at'])
            notify_payout_blocked_attempt(payment.organization)
            return {
                'success': False,
                'error': 'This landlord has not completed payout setup yet.',
            }

        provider = cls.get_provider(payment.provider)
        config = provider.get_config_status()

        if not provider.is_available():
            payment.status = 'failed'
            payment.notes = config.message
            payment.save(update_fields=['status', 'notes', 'updated_at'])
            return {
                'success': False,
                'error': config.message,
                'required_env_vars': config.required_env_vars,
            }

        result = provider.initiate_payment(
            InitiatePaymentRequest(
                amount=payment.amount,
                currency=payment.currency,
                tenant_email=payment.tenant.email or '',
                tenant_phone=payment.tenant.phone,
                internal_reference=payment.internal_reference,
                callback_url=callback_url,
                metadata={'payment_id': str(payment.id)},
                # Reached only when the guard above already confirmed
                # payout_account.status == 'active' (freshly re-checked,
                # never cached) — never keyed off a leftover subaccount code
                # from an earlier, now-superseded verification attempt
                # (T-02-06).
                subaccount_code=payout_account.paystack_subaccount_code,
                bearer='account',
            )
        )

        if not result.success:
            payment.status = 'failed'
            payment.notes = result.error_message
            payment.save(update_fields=['status', 'notes', 'updated_at'])
            return {'success': False, 'error': result.error_message}

        payment.status = 'processing'
        payment.provider_reference = result.provider_reference
        payment.metadata = {**payment.metadata, 'initiate_response': result.raw_response}
        payment.save(update_fields=[
            'status', 'provider_reference', 'metadata', 'updated_at',
        ])

        return {
            'success': True,
            'status': 'processing',
            'provider_reference': result.provider_reference,
            'authorization_url': result.authorization_url,
        }

    @classmethod
    @transaction.atomic
    def verify_and_allocate(
        cls,
        payment: Payment,
        raw_callback: dict,
        allocations: Optional[list[dict]] = None,
    ) -> Payment:
        """Verify payment with provider and allocate to rent charges."""
        # Re-fetch under a row lock inside this atomic block so two concurrent
        # webhook deliveries for the same payment can't both pass the guard below.
        payment = Payment.objects.select_for_update().get(pk=payment.pk)

        if payment.status == 'success':
            # Idempotency guard: a replayed webhook must not re-verify or
            # re-allocate an already-settled payment.
            return payment

        provider = cls.get_provider(payment.provider)

        result = provider.verify_payment(
            VerifyPaymentRequest(
                provider_reference=payment.provider_reference,
                internal_reference=payment.internal_reference,
                raw_callback=raw_callback,
            )
        )

        payment.metadata = {
            **payment.metadata,
            'verify_response': result.raw_response,
        }

        if result.status == 'pending':
            payment.status = 'processing'
            payment.save(update_fields=['status', 'metadata', 'updated_at'])
            return payment

        if not result.success:
            payment.status = 'failed'
            payment.save(update_fields=['status', 'metadata', 'updated_at'])
            return payment

        mismatch = cls._settlement_mismatch(payment, result)
        if mismatch:
            # Audit H3: never credit a tenant with more than the provider
            # actually settled. Flag for a human instead of allocating.
            payment.status = 'disputed'
            payment.notes = mismatch
            payment.provider_reference = result.provider_reference or payment.provider_reference
            payment.save(update_fields=['status', 'notes', 'provider_reference', 'metadata', 'updated_at'])
            logger.error('Payment %s settlement mismatch: %s', payment.internal_reference, mismatch)
            return payment

        payment.status = 'success'
        payment.provider_reference = result.provider_reference or payment.provider_reference
        payment.paid_at = timezone.now()
        payment.save(update_fields=[
            'status', 'provider_reference', 'paid_at', 'metadata', 'updated_at',
        ])

        cls._receive_and_allocate(payment, allocations)
        payment.refresh_from_db()
        return payment

    @staticmethod
    def _settlement_mismatch(payment: Payment, result) -> str:
        if result.amount is not None and result.amount != payment.amount:
            return f'Provider settled {result.amount} but {payment.amount} was expected'
        currency = (result.raw_response.get('data') or {}).get('currency') if isinstance(result.raw_response, dict) else None
        if currency and currency != payment.currency:
            return f'Provider settled in {currency} but {payment.currency} was expected'
        return ''

    @classmethod
    def _receive_and_allocate(
        cls, payment: Payment, allocations: Optional[list[dict]], created_by=None, notify: bool = True,
    ):
        """
        Book the payment as tenant credit, then allocate it: explicitly when
        allocations are given, otherwise oldest invoice first. Anything left
        over stays as credit for future invoices (audit H1).
        """
        AllocationService.receive(payment, created_by=created_by)
        if allocations:
            for alloc in allocations:
                AllocationService.allocate(
                    payment,
                    Invoice.objects.get(pk=_allocation_invoice_id(alloc)),
                    Decimal(str(alloc['amount'])),
                    created_by=created_by,
                )
        elif payment.tenancy_id:
            AllocationService.auto_allocate(payment, created_by=created_by)
        ReceiptService.issue(payment, notify=notify)

    @classmethod
    @transaction.atomic
    def record_manual_payment(
        cls,
        payment: Payment,
        allocations: Optional[list[dict]] = None,
        verified_by=None,
        notify: bool = True,
    ) -> Payment:
        """
        Record a cash/bank payment without external provider verification.
        `notify=False` issues the receipt without sending it (historical entries).
        """
        payment.status = 'success'
        payment.provider = 'manual'
        payment.payment_method = payment.payment_method or 'cash'
        payment.paid_at = timezone.now()
        payment.verified_by = verified_by
        payment.save()

        try:
            cls._receive_and_allocate(payment, allocations, created_by=verified_by, notify=notify)
        except AllocationError as exc:
            # Re-raised as ValueError for existing callers; the whole
            # transaction (including the payment row) rolls back.
            raise ValueError(str(exc)) from exc
        payment.refresh_from_db()
        return payment

    @classmethod
    @transaction.atomic
    def reverse_payment(cls, payment: Payment, reversed_by=None, reason: str = '') -> Payment:
        """Reverse a payment: undo its ledger postings and restore outstanding balances."""
        Payment.objects.select_for_update().get(pk=payment.pk)  # lock the row
        payment.refresh_from_db()  # update the caller's instance in place
        if payment.status != 'success':
            raise ValueError('Only successful payments can be reversed')

        # Flip status to 'reversed' first — recalculate_status() below re-derives
        # amount_paid from allocations where payment__status='success', so this
        # payment's allocations must already be excluded before recalculating,
        # or the recompute silently undoes the reversal.
        payment.status = 'reversed'
        payment.unapplied_amount = Decimal('0.00')
        payment.metadata = {
            **payment.metadata,
            'reversed_at': timezone.now().isoformat(),
            'reversed_by': str(reversed_by.id) if reversed_by else None,
            'reversal_reason': reason,
        }
        payment.save(update_fields=['status', 'unapplied_amount', 'metadata', 'updated_at'])

        today = timezone.now().date()
        allocations = list(payment.allocations.select_related('invoice'))
        for entry in [
            *LedgerService.entries_for('payment', payment.pk),
            *[e for a in allocations for e in LedgerService.entries_for('allocation', a.pk)],
        ]:
            if not hasattr(entry, 'reversed_by'):
                LedgerService.reverse(
                    entry, today, memo=f'Reversal of payment {payment.internal_reference}', created_by=reversed_by,
                )

        for allocation in allocations:
            charge = allocation.invoice
            charge.recalculate_status()
            charge.save(update_fields=['amount_paid', 'status', 'updated_at'])

        return payment

    # --- reconciliation, refunds and disputes (audit H4/H5) -----------------

    RECONCILE_AFTER = timedelta(minutes=10)
    ABANDON_AFTER = timedelta(hours=24)

    @classmethod
    def reconcile_processing(cls) -> dict:
        now = timezone.now()
        counts = {'checked': 0, 'settled': 0, 'failed': 0, 'abandoned': 0}
        stale = Payment.objects.filter(
            status='processing', provider='paystack', created_at__lt=now - cls.RECONCILE_AFTER,
        )
        for payment in stale:
            counts['checked'] += 1
            try:
                payment = cls.verify_and_allocate(payment, raw_callback={'source': 'reconciliation'})
            except Exception:
                logger.exception('Reconciliation failed for payment %s', payment.pk)
                continue
            if payment.status == 'success':
                counts['settled'] += 1
            elif payment.status == 'failed':
                counts['failed'] += 1
            elif payment.status == 'processing' and payment.created_at < now - cls.ABANDON_AFTER:
                Payment.objects.filter(pk=payment.pk, status='processing').update(
                    status='failed', notes='Abandoned: checkout not completed within 24 hours',
                    updated_at=now,
                )
                counts['abandoned'] += 1
        return counts

    @classmethod
    def handle_refund(cls, payment: Payment, refund_amount_major: Optional[Decimal], payload: dict) -> str:
        """
        Paystack refunded (part of) a payment. A full refund reverses it; a
        partial refund is flagged for the landlord to resolve, never guessed.
        """
        payment.refresh_from_db()
        if payment.status != 'success':
            return 'ignored'
        if refund_amount_major is None or refund_amount_major >= payment.amount:
            cls.reverse_payment(payment, reason='Refunded through Paystack')
            return 'reversed'
        payment.metadata = {
            **payment.metadata,
            'partial_refunds': [*payment.metadata.get('partial_refunds', []), {
                'amount': str(refund_amount_major), 'at': timezone.now().isoformat(),
            }],
        }
        payment.notes = f'{payment.notes}\nPartial refund of {refund_amount_major} via Paystack — review.'.strip()
        payment.save(update_fields=['metadata', 'notes', 'updated_at'])
        return 'flagged'

    @classmethod
    def flag_dispute(cls, payment: Payment, event: str, payload: dict) -> str:
        """Record a chargeback event on the payment; money only moves when a person reverses it."""
        payment.refresh_from_db()
        payment.metadata = {
            **payment.metadata,
            'disputes': [*payment.metadata.get('disputes', []), {
                'event': event, 'at': timezone.now().isoformat(),
                'status': (payload.get('data') or {}).get('status', ''),
                'resolution': (payload.get('data') or {}).get('resolution', ''),
            }],
        }
        payment.save(update_fields=['metadata', 'updated_at'])
        return 'flagged'
