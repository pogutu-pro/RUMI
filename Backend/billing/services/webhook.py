"""
Billing webhook handler — routes Paystack subscription-lifecycle events.

Paystack POSTs every account event (rent `charge.success` AND subscription
`subscription.*` / `invoice.*`) to the one webhook URL configured in the
Paystack dashboard. `rumia_api.views.PaystackWebhookView` attempts the
rent-payment path first (unchanged) and only reaches `handle_billing_event`
when that path doesn't own the event — see that view for the dispatch order.

`SubscriptionWebhookEvent`'s unique_together(event_type, paystack_object_id)
is the SOLE idempotency guard: it is created inside the same
`transaction.atomic()` block as every other side effect here, before any
`OrganizationSubscription` / `SubscriptionPayment` row is mutated. A replayed
delivery is therefore a guaranteed no-op, never re-derived from re-reading
current model state.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from audit.models import log_audit
from billing.models import (
    OrganizationSubscription,
    SubscriptionPayment,
    SubscriptionPlan,
    SubscriptionWebhookEvent,
)

logger = logging.getLogger(__name__)

PERIOD_DAYS = 30


def _customer_code(data: dict) -> str:
    customer = data.get('customer', {}) or {}
    return (customer.get('customer_code', '') or '') if isinstance(customer, dict) else ''


def _plan_code(data: dict) -> str:
    plan = data.get('plan', {}) or {}
    return (plan.get('plan_code', '') or '') if isinstance(plan, dict) else ''


def _amount_major(data: dict) -> Decimal | None:
    """Paystack amounts are in the minor unit (cents); None when absent/unparseable."""
    raw = data.get('amount')
    if raw in (None, ''):
        return None
    try:
        return Decimal(str(raw)) / Decimal('100')
    except InvalidOperation:
        return None


def _subscriptions_for_email(email: str):
    """
    Subscriptions of every organization the email owns or is an active member
    of, row-locked. PostgreSQL rejects FOR UPDATE together with DISTINCT (which
    the membership join needs), so the ids are found first and locked after.
    """
    ids = OrganizationSubscription.objects.filter(
        Q(organization__owner__email__iexact=email)
        | Q(
            organization__memberships__user__email__iexact=email,
            organization__memberships__is_active=True,
        ),
    ).values_list('pk', flat=True).distinct()
    return OrganizationSubscription.objects.select_for_update().filter(pk__in=list(ids))


def handle_billing_event(payload: dict) -> dict:
    """
    Process a single Paystack webhook payload for the billing/subscription
    domain. Never raises — an unrecognized event or an event whose reference
    belongs to a different domain (e.g. a rent `Payment`) always returns an
    `{'status': 'ignored'}`-shaped result instead.
    """
    event_type = payload.get('event', '') or ''
    data = payload.get('data', {}) or {}

    raw_id = data.get('id')
    if raw_id not in (None, ''):
        paystack_object_id = str(raw_id)
    else:
        # Never collapse a missing data.id to the literal empty string — the
        # unique_together(event_type, paystack_object_id) constraint would
        # then treat EVERY such malformed event for this event_type as a
        # duplicate of the first one seen, silently dropping legitimate
        # events. Fall back to the billing reference if present, else a
        # content hash of the full payload so distinct deliveries still get
        # distinct idempotency keys.
        reference = data.get('reference') or ''
        if reference:
            paystack_object_id = f'noid-ref:{reference}'
        else:
            payload_hash = hashlib.sha256(
                json.dumps(payload, sort_keys=True, default=str).encode()
            ).hexdigest()
            paystack_object_id = f'noid-hash:{payload_hash}'
        logger.warning(
            'Paystack webhook payload for event_type=%s is missing data.id; '
            'using fallback idempotency key %s instead of an empty string.',
            event_type, paystack_object_id,
        )

    with transaction.atomic():
        webhook_event, created = SubscriptionWebhookEvent.objects.get_or_create(
            event_type=event_type,
            paystack_object_id=paystack_object_id,
            defaults={'raw_payload': payload},
        )
        if not created:
            # Idempotency guard — a replayed/duplicated delivery is a no-op.
            # Never touch any OrganizationSubscription/SubscriptionPayment row
            # from here.
            return {'status': 'already_processed'}

        if event_type == 'subscription.create':
            result = _handle_subscription_create(data)
        elif event_type == 'charge.success':
            result = _handle_charge_success(data)
        elif event_type == 'invoice.payment_failed':
            result = _handle_invoice_payment_failed(data)
        elif event_type in ('subscription.disable', 'subscription.not_renew'):
            result = _handle_subscription_disable(data)
        else:
            result = {'status': 'ignored'}

        webhook_event.processed_at = timezone.now()
        webhook_event.save(update_fields=['processed_at'])

    return result


def _handle_subscription_create(data: dict) -> dict:
    """
    `subscription.create` — Paystack confirms a subscription was created for
    a customer. Resolve the target `OrganizationSubscription` and populate
    its Paystack codes.
    """
    subscription_code = data.get('subscription_code', '') or ''
    customer = data.get('customer', {}) or {}
    email = customer.get('email', '') or ''
    plan_code = _plan_code(data)

    subscription = None
    if subscription_code:
        subscription = OrganizationSubscription.objects.select_for_update().filter(
            paystack_subscription_code=subscription_code,
        ).first()

    # A landlord may own/be a member of MULTIPLE organizations — matching via
    # email alone can find more than one candidate across those
    # organizations. Picking one would risk activating the WRONG
    # organization's subscription, so each email fallback below is accepted
    # only when it is unambiguous: exactly one candidate.
    if subscription is None and email and plan_code:
        # A plan switch in flight: the org is still on its old Paystack
        # subscription code, with a pending/just-paid switch payment for the
        # plan this new Paystack subscription is for. Paystack may deliver
        # this event before or after the switch's charge.success.
        candidates = [
            sub for sub in _subscriptions_for_email(email).filter(billing_mode='auto')
            if _has_switch_payment_for_plan_code(sub, plan_code)
        ]
        if len(candidates) == 1:
            subscription = candidates[0]

    if subscription is None and email:
        # A fresh subscribe (status pending), or a completed switch whose
        # charge.success already cleared the old Paystack subscription code.
        candidates = list(
            _subscriptions_for_email(email).filter(
                Q(status='pending')
                | Q(status__in=('active', 'past_due'), billing_mode='auto', paystack_subscription_code=''),
            )
        )
        if len(candidates) == 1:
            subscription = candidates[0]

    if subscription is None:
        # No unambiguous match — never guess which organization this belongs to.
        return {'status': 'unmatched'}

    old_status = subscription.status
    subscription.paystack_subscription_code = subscription_code
    subscription.paystack_email_token = data.get('email_token', '') or ''
    subscription.paystack_customer_code = _customer_code(data) or subscription.paystack_customer_code
    subscription.status = 'active'
    subscription.save(update_fields=[
        'paystack_subscription_code', 'paystack_email_token', 'paystack_customer_code',
        'status', 'updated_at',
    ])
    log_audit(
        'subscription_activated',
        organization=subscription.organization,
        entity=subscription,
        old_value={'status': old_status},
        new_value={
            'status': subscription.status,
            'paystack_subscription_code': subscription.paystack_subscription_code,
        },
        metadata={
            'source': 'webhook', 'event_type': 'subscription.create',
            'paystack_object_id': data.get('id', ''),
        },
    )
    return {'status': 'processed', 'event': 'subscription.create'}


def _has_switch_payment_for_plan_code(subscription: OrganizationSubscription, plan_code: str) -> bool:
    for payment in subscription.payments.filter(status__in=('pending', 'success')):
        if payment.metadata.get('kind') != 'switch':
            continue
        plan = SubscriptionPlan.objects.filter(id=payment.metadata.get('plan_id')).first()
        if plan is not None and plan.paystack_plan_code == plan_code:
            return True
    return False


def _schedule_old_subscription_disable(subscription_code: str, email_token: str) -> None:
    """Disable the replaced Paystack subscription only once this transaction commits."""
    from billing.tasks import disable_replaced_paystack_subscription

    transaction.on_commit(
        lambda: disable_replaced_paystack_subscription.delay(subscription_code, email_token)
    )


def _handle_charge_success(data: dict) -> dict:
    """
    `charge.success` for a subscription billing reference.

    - A reference matching a `SubscriptionPayment` is a checkout we started
      (subscribe or plan switch).
    - Otherwise, a charge carrying a Paystack `plan` is a recurring renewal or
      dunning retry — Paystack generates those references itself, so they
      never match ours (audit C3).
    - Anything else belongs to `rent.models.Payment` (or is unrecognized) —
      this function must never touch that row, so it returns `ignored`.
    """
    reference = data.get('reference', '') or ''

    try:
        payment = SubscriptionPayment.objects.select_for_update().get(
            internal_reference=reference,
        )
    except SubscriptionPayment.DoesNotExist:
        if _plan_code(data):
            return _handle_renewal_charge(data)
        return {'status': 'ignored'}

    now = timezone.now()
    today = now.date()

    old_payment_status = payment.status

    paid_amount = _amount_major(data)
    if paid_amount is not None and paid_amount < payment.amount:
        payment.status = 'failed'
        payment.failed_at = now
        payment.failure_reason = f'Paid {paid_amount} but {payment.amount} was due'
        payment.save(update_fields=['status', 'failed_at', 'failure_reason'])
        logger.error(
            'Subscription payment %s underpaid: paid %s, expected %s',
            payment.internal_reference, paid_amount, payment.amount,
        )
        return {'status': 'amount_mismatch'}

    payment.status = 'success'
    payment.paid_at = now
    payment.paystack_reference = data.get('reference', '') or ''
    payment.failed_at = None
    payment.failure_reason = ''
    payment.save(update_fields=['status', 'paid_at', 'paystack_reference', 'failed_at', 'failure_reason'])

    subscription = OrganizationSubscription.objects.select_for_update().get(
        pk=payment.subscription_id,
    )
    update_fields = [
        'current_period_start', 'current_period_end', 'grace_period_ends_at',
        'status', 'last_payment_at', 'last_payment_amount', 'paystack_customer_code', 'updated_at',
    ]

    # The plan is applied only now that the charge is confirmed.
    target_plan = SubscriptionPlan.objects.filter(id=payment.metadata.get('plan_id')).first()
    if target_plan is not None:
        subscription.plan = target_plan
        subscription.billing_mode = 'auto'
        update_fields += ['plan', 'billing_mode']

    old_code = payment.metadata.get('replaces_subscription_code', '')
    if old_code:
        if subscription.paystack_subscription_code == old_code:
            # Clearing the code lets the new Paystack subscription's
            # `subscription.create` match this org (see its email fallback).
            subscription.paystack_subscription_code = ''
            subscription.paystack_email_token = ''
            update_fields += ['paystack_subscription_code', 'paystack_email_token']
        _schedule_old_subscription_disable(old_code, payment.metadata.get('replaces_email_token', ''))

    subscription.current_period_start = today
    subscription.current_period_end = today + timedelta(days=PERIOD_DAYS)
    subscription.grace_period_ends_at = None
    subscription.status = 'active'
    subscription.last_payment_at = now
    subscription.last_payment_amount = payment.amount
    subscription.paystack_customer_code = _customer_code(data) or subscription.paystack_customer_code
    subscription.save(update_fields=update_fields)
    log_audit(
        'subscription_payment_recorded',
        organization=subscription.organization,
        entity=payment,
        old_value={'status': old_payment_status},
        new_value={'status': payment.status, 'amount': str(payment.amount)},
        metadata={
            'source': 'webhook', 'event_type': 'charge.success',
            'paystack_object_id': data.get('id', ''), 'subscription_id': str(subscription.id),
        },
    )
    return {'status': 'processed', 'event': 'charge.success'}


def _resolve_subscription_for_renewal(data: dict) -> OrganizationSubscription | None:
    """
    Resolve the subscription a recurring charge belongs to: by Paystack
    customer code first, then by the subscription code if present, then by an
    unambiguous customer email across auto-billed subscriptions.
    """
    customer_code = _customer_code(data)
    if customer_code:
        subscription = OrganizationSubscription.objects.select_for_update().filter(
            paystack_customer_code=customer_code,
        ).first()
        if subscription is not None:
            return subscription

    subscription_payload = data.get('subscription', {})
    subscription_code = (
        subscription_payload.get('subscription_code', '')
        if isinstance(subscription_payload, dict) else ''
    ) or data.get('subscription_code', '') or ''
    if subscription_code:
        subscription = OrganizationSubscription.objects.select_for_update().filter(
            paystack_subscription_code=subscription_code,
        ).first()
        if subscription is not None:
            return subscription

    customer = data.get('customer', {}) or {}
    email = (customer.get('email', '') or '') if isinstance(customer, dict) else ''
    if email:
        candidates = list(_subscriptions_for_email(email).filter(billing_mode='auto'))
        if len(candidates) == 1:
            return candidates[0]

    return None


def _handle_renewal_charge(data: dict) -> dict:
    """
    A Paystack-initiated recurring charge (monthly renewal or a dunning retry
    after `invoice.payment_failed`). Records it in the ledger and extends the
    paid period — including restoring a past_due/suspended organization that
    has now paid.
    """
    subscription = _resolve_subscription_for_renewal(data)
    if subscription is None:
        logger.warning(
            'Unmatched Paystack subscription charge reference=%s plan=%s',
            data.get('reference', ''), _plan_code(data),
        )
        return {'status': 'unmatched'}

    now = timezone.now()
    today = now.date()
    amount = _amount_major(data) or subscription.plan.price

    # Extend from the end of the current paid period when renewing on time,
    # from today when the organization had already lapsed.
    period_end = subscription.current_period_end
    period_start = period_end if period_end is not None and period_end >= today else today

    reference = data.get('reference', '') or ''
    payment = SubscriptionPayment.objects.create(
        subscription=subscription,
        amount=amount,
        currency=(data.get('currency') or 'KES')[:3],
        internal_reference=f'SUB-RNW-{reference or data.get("id", "")}'[:100],
        paystack_reference=reference,
        status='success',
        billing_period_start=period_start,
        billing_period_end=period_start + timedelta(days=PERIOD_DAYS),
        paid_at=now,
        metadata={'kind': 'renewal', 'plan_code': _plan_code(data)},
    )

    old_status = subscription.status
    subscription.current_period_start = period_start
    subscription.current_period_end = period_start + timedelta(days=PERIOD_DAYS)
    subscription.grace_period_ends_at = None
    subscription.status = 'active'
    subscription.last_payment_at = now
    subscription.last_payment_amount = amount
    subscription.paystack_customer_code = _customer_code(data) or subscription.paystack_customer_code
    subscription.save(update_fields=[
        'current_period_start', 'current_period_end', 'grace_period_ends_at', 'status',
        'last_payment_at', 'last_payment_amount', 'paystack_customer_code', 'updated_at',
    ])
    log_audit(
        'subscription_payment_recorded',
        organization=subscription.organization,
        entity=payment,
        old_value={'status': old_status},
        new_value={'status': subscription.status, 'amount': str(amount)},
        metadata={
            'source': 'webhook', 'event_type': 'charge.success', 'kind': 'renewal',
            'paystack_object_id': data.get('id', ''), 'subscription_id': str(subscription.id),
        },
    )
    return {'status': 'processed', 'event': 'charge.success', 'kind': 'renewal'}


def _resolve_subscription_for_invoice(data: dict) -> OrganizationSubscription | None:
    """
    Resolve the target subscription for an `invoice.payment_failed` event.
    Tries, in order: the nested subscription code, the billing reference
    (via `SubscriptionPayment`), then the Paystack customer code.
    """
    subscription_payload = data.get('subscription', {})
    subscription_code = (
        subscription_payload.get('subscription_code', '')
        if isinstance(subscription_payload, dict) else ''
    ) or data.get('subscription_code', '') or ''

    if subscription_code:
        subscription = OrganizationSubscription.objects.select_for_update().filter(
            paystack_subscription_code=subscription_code,
        ).first()
        if subscription is not None:
            return subscription

    reference = data.get('reference', '') or ''
    if not reference:
        invoice_payload = data.get('invoice', {})
        if isinstance(invoice_payload, dict):
            reference = invoice_payload.get('reference', '') or ''
    if reference:
        payment = SubscriptionPayment.objects.select_for_update().filter(
            internal_reference=reference,
        ).select_related('subscription').first()
        if payment is not None:
            return payment.subscription

    customer = data.get('customer', {}) or {}
    customer_code = customer.get('customer_code', '') or ''
    if customer_code:
        return OrganizationSubscription.objects.select_for_update().filter(
            paystack_customer_code=customer_code,
        ).first()

    return None


def _handle_invoice_payment_failed(data: dict) -> dict:
    """
    `invoice.payment_failed` — a renewal attempt failed. Degrade to `past_due`
    with a grace window, never straight to `suspended`/`cancelled`.
    """
    subscription = _resolve_subscription_for_invoice(data)
    if subscription is None:
        return {'status': 'ignored'}

    old_status = subscription.status
    grace_days = getattr(settings, 'BILLING_GRACE_PERIOD_DAYS', 7)
    subscription.status = 'past_due'
    subscription.grace_period_ends_at = timezone.now() + timedelta(days=grace_days)
    subscription.save(update_fields=['status', 'grace_period_ends_at', 'updated_at'])
    log_audit(
        'subscription_payment_failed',
        organization=subscription.organization,
        entity=subscription,
        old_value={'status': old_status},
        new_value={
            'status': subscription.status,
            'grace_period_ends_at': subscription.grace_period_ends_at.isoformat(),
        },
        metadata={
            'source': 'webhook', 'event_type': 'invoice.payment_failed',
            'paystack_object_id': data.get('id', ''),
        },
    )
    return {'status': 'processed', 'event': 'invoice.payment_failed'}


def _handle_subscription_disable(data: dict) -> dict:
    """`subscription.disable` / `subscription.not_renew` — mark cancelled."""
    subscription_code = data.get('subscription_code', '') or ''
    if not subscription_code:
        return {'status': 'ignored'}

    subscription = OrganizationSubscription.objects.select_for_update().filter(
        paystack_subscription_code=subscription_code,
    ).first()
    if subscription is None:
        return {'status': 'ignored'}

    old_status = subscription.status
    subscription.status = 'cancelled'
    subscription.cancelled_at = timezone.now()
    subscription.save(update_fields=['status', 'cancelled_at', 'updated_at'])
    log_audit(
        'subscription_disabled',
        organization=subscription.organization,
        entity=subscription,
        old_value={'status': old_status},
        new_value={'status': subscription.status},
        metadata={
            'source': 'webhook', 'event_type': 'subscription.disable',
            'paystack_object_id': data.get('id', ''),
            'paystack_subscription_code': subscription_code,
        },
    )
    return {'status': 'processed', 'event': 'subscription.disable'}
