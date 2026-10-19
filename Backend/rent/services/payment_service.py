"""Payment provider registry and service facade."""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Optional

from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone

from organizations.models import PayoutAccount
from organizations.services.notifications import notify_payout_blocked_attempt
from rent.models import Payment, PaymentAllocation, RentCharge
from rent.providers.base import (
    InitiatePaymentRequest,
    PaymentProviderError,
    ProviderConfigStatus,
    VerifyPaymentRequest,
)
from rent.providers.paystack import PaystackProvider

logger = logging.getLogger(__name__)


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

        payment.status = 'success'
        payment.provider_reference = result.provider_reference or payment.provider_reference
        payment.paid_at = timezone.now()
        payment.save(update_fields=[
            'status', 'provider_reference', 'paid_at', 'metadata', 'updated_at',
        ])

        if allocations:
            for alloc in allocations:
                cls._create_allocation(
                    payment,
                    alloc['rent_charge_id'],
                    Decimal(str(alloc['amount'])),
                )
        elif payment.tenancy_id:
            cls._auto_allocate(payment)

        return payment

    @classmethod
    @transaction.atomic
    def record_manual_payment(
        cls,
        payment: Payment,
        allocations: Optional[list[dict]] = None,
        verified_by=None,
    ) -> Payment:
        """Record a cash/bank payment without external provider verification."""
        payment.status = 'success'
        payment.provider = 'manual'
        payment.payment_method = payment.payment_method or 'cash'
        payment.paid_at = timezone.now()
        payment.verified_by = verified_by
        payment.save()

        if allocations:
            for alloc in allocations:
                cls._create_allocation(
                    payment,
                    alloc['rent_charge_id'],
                    Decimal(str(alloc['amount'])),
                )
        elif payment.tenancy_id:
            cls._auto_allocate(payment)
        return payment

    @classmethod
    @transaction.atomic
    def reverse_payment(cls, payment: Payment, reversed_by=None) -> Payment:
        """Reverse a payment and restore outstanding balances on charges."""
        if payment.status != 'success':
            raise ValueError('Only successful payments can be reversed')

        # Flip status to 'reversed' first — recalculate_status() below re-derives
        # amount_paid from allocations where payment__status='success', so this
        # payment's allocations must already be excluded before recalculating,
        # or the recompute silently undoes the reversal.
        payment.status = 'reversed'
        payment.metadata = {
            **payment.metadata,
            'reversed_at': timezone.now().isoformat(),
            'reversed_by': str(reversed_by.id) if reversed_by else None,
        }
        payment.save(update_fields=['status', 'metadata', 'updated_at'])

        for allocation in payment.allocations.select_related('rent_charge'):
            charge = allocation.rent_charge
            charge.recalculate_status()
            charge.save(update_fields=['amount_paid', 'status', 'updated_at'])

        return payment

    @classmethod
    def _create_allocation(cls, payment: Payment, rent_charge_id, amount: Decimal):
        charge = RentCharge.objects.select_for_update().get(id=rent_charge_id)
        if payment.status != 'success':
            raise ValueError('Cannot allocate non-successful payment')
        if charge.organization_id != payment.organization_id or (
            payment.tenancy_id and charge.tenancy_id != payment.tenancy_id
        ):
            raise ValueError('Cannot allocate a payment to another tenancy\'s rent charge')

        PaymentAllocation.objects.create(
            payment=payment,
            rent_charge=charge,
            amount=amount,
        )
        paid = charge.payment_allocations.filter(
            payment__status='success'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        charge.amount_paid = paid
        charge.recalculate_status()
        charge.save(update_fields=['amount_paid', 'status', 'updated_at'])

    @classmethod
    def _auto_allocate(cls, payment: Payment):
        remaining = payment.amount
        charges = RentCharge.objects.filter(
            tenancy=payment.tenancy,
            status__in=['due', 'partially_paid', 'overdue'],
        ).order_by('due_date')

        for charge in charges:
            if remaining <= 0:
                break
            outstanding = charge.outstanding
            alloc_amount = min(remaining, outstanding)
            if alloc_amount > 0:
                cls._create_allocation(payment, charge.id, alloc_amount)
                remaining -= alloc_amount
