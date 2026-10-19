"""
Subscription lifecycle orchestration — subscribe and switch-plan.

Views must call this service, never touch PaystackBillingClient or the
billing models directly for mutations — this is the single choke point that
guarantees an organization can never be double-billed.
"""
from __future__ import annotations

import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from billing.models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient

logger = logging.getLogger(__name__)

# Only a subscription in one of these statuses is eligible to be switched, and
# only a subscription NOT in one of these statuses is eligible for a fresh subscribe.
ACTIVE_STATUSES = ('active', 'past_due')

# SubscriptionPayment.metadata['kind'] values.
KIND_SUBSCRIBE = 'subscribe'
KIND_SWITCH = 'switch'


def _pending_checkout_ttl() -> timedelta:
    return timedelta(minutes=getattr(settings, 'BILLING_PENDING_CHECKOUT_TTL_MINUTES', 30))


class SubscriptionService:
    """Provider-independent subscription orchestration for the `billing` app."""

    @classmethod
    def _has_live_pending_checkout(cls, subscription: OrganizationSubscription) -> bool:
        """
        True when a checkout started less than the TTL ago is still awaiting
        payment. Older pending payments are marked failed (abandoned) so an
        organization that walked away from a Paystack checkout can always
        start a new one — without this, a single abandoned checkout locked
        the organization out of subscribe AND switch-plan forever (audit C2).

        A late payment against an expired checkout is still honoured: the
        webhook resolves SubscriptionPayment by reference regardless of status.
        """
        now = timezone.now()
        subscription.payments.filter(
            status='pending', initiated_at__lt=now - _pending_checkout_ttl(),
        ).update(status='failed', failed_at=now, failure_reason='Checkout abandoned (expired)')
        return subscription.payments.filter(status='pending').exists()

    @classmethod
    def _initiate_auto_charge(
        cls,
        subscription: OrganizationSubscription,
        plan: SubscriptionPlan,
        requester_email: str,
        kind: str,
    ) -> dict:
        """
        Create a pending SubscriptionPayment for `plan` and start its Paystack
        checkout.

        This is the ONLY place that reads `plan.price` and builds the
        Paystack initialize payload — both `subscribe()` and `switch_plan()`
        call this helper instead of duplicating the sequence, which is what
        guarantees a plan switch always bills the new plan's live price,
        never a stale/cached one.

        The target plan is recorded on the payment (`metadata.plan_id`) and is
        only applied to the subscription by the webhook once Paystack confirms
        the charge. For a switch, the subscription is left completely
        untouched here — abandoning the checkout leaves the organization on
        its current, still-billing plan.
        """
        if not plan.paystack_plan_code:
            raise ValueError('Plan not yet linked to Paystack')

        today = timezone.now().date()
        internal_reference = f'SUB-{uuid.uuid4().hex[:10].upper()}'

        metadata = {'kind': kind, 'plan_id': str(plan.id)}
        if kind == KIND_SWITCH and subscription.paystack_subscription_code:
            # The webhook disables this Paystack subscription only after the
            # new plan's first charge succeeds (billing.tasks.disable_replaced_paystack_subscription).
            metadata['replaces_subscription_code'] = subscription.paystack_subscription_code
            metadata['replaces_email_token'] = subscription.paystack_email_token

        SubscriptionPayment.objects.create(
            subscription=subscription,
            amount=plan.price,
            internal_reference=internal_reference,
            status='pending',
            billing_period_start=today,
            billing_period_end=today + timedelta(days=30),
            metadata=metadata,
        )

        # Mirrors the established convention (see rumia_api.views's rent-payment
        # checkout and rent/services/payment_service.py): the Paystack checkout
        # callback_url always redirects the browser to a FRONTEND_URL page, never
        # a bare backend API endpoint — no such backend route exists, and the
        # actual state transition is only ever driven by the verified webhook,
        # never by this redirect. `/api/v1/billing/callback/` is not registered
        # in billing/urls.py, so it was a guaranteed 404 dead end.
        callback_url = f'{settings.FRONTEND_URL}/landlord/rental'

        result = PaystackBillingClient().initialize_subscription_transaction(
            email=requester_email,
            price=plan.price,
            plan_code=plan.paystack_plan_code,
            reference=internal_reference,
            callback_url=callback_url,
            metadata={
                'organization_id': str(subscription.organization_id),
                'plan_id': str(plan.id),
            },
        )

        if kind == KIND_SUBSCRIBE:
            subscription.plan = plan
            subscription.billing_mode = 'auto'
            subscription.status = 'pending'
            subscription.current_period_start = today
            subscription.current_period_end = today + timedelta(days=30)
            subscription.save(update_fields=[
                'plan', 'billing_mode', 'status',
                'current_period_start', 'current_period_end', 'updated_at',
            ])

        return {
            'mode': 'auto',
            'authorization_url': result['authorization_url'],
            'internal_reference': internal_reference,
        }

    @classmethod
    def subscribe(
        cls,
        organization,
        plan: SubscriptionPlan,
        billing_mode: str,
        requester_email: str,
    ) -> dict:
        """Subscribe an organization to `plan` via `billing_mode` ('auto' or 'manual')."""
        with transaction.atomic():
            subscription, created = OrganizationSubscription.objects.select_for_update().get_or_create(
                organization=organization,
                defaults={'plan': plan, 'billing_mode': billing_mode, 'status': 'pending'},
            )

            if not created and subscription.status in ACTIVE_STATUSES:
                raise ValueError('Organization already has a subscription — use switch_plan')

            if not created and cls._has_live_pending_checkout(subscription):
                # A double-submit (double-click, retry after a slow response)
                # must not create a SECOND SubscriptionPayment and a second
                # Paystack checkout while the first one is still live. Once
                # the checkout passes its TTL it is treated as abandoned.
                raise ValueError(
                    'A subscription checkout is already in progress for this organization — '
                    'complete it, or try again in a few minutes'
                )

            if billing_mode == 'manual':
                today = timezone.now().date()
                subscription.plan = plan
                subscription.billing_mode = 'manual'
                subscription.status = 'active'
                subscription.current_period_start = today
                subscription.current_period_end = today + timedelta(days=30)
                subscription.save(update_fields=[
                    'plan', 'billing_mode', 'status',
                    'current_period_start', 'current_period_end', 'updated_at',
                ])
                return {'mode': 'manual', 'status': 'active'}

            if billing_mode == 'auto':
                return cls._initiate_auto_charge(subscription, plan, requester_email, KIND_SUBSCRIBE)

            raise ValueError(f'Unknown billing_mode: {billing_mode}')

    @classmethod
    def switch_plan(
        cls,
        organization,
        new_plan: SubscriptionPlan,
        requester_email: str,
    ) -> dict:
        """
        Switch an organization's existing subscription to `new_plan`.

        Auto mode is "pay first, then switch": this only starts a checkout for
        the new plan. The subscription keeps its current plan, status and
        Paystack subscription until the webhook confirms the new charge; the
        webhook then applies the new plan and disables the old Paystack
        subscription. Previously the old subscription was disabled up front,
        so an abandoned checkout left the organization unsubscribed and
        unable to recover (audit C2).
        """
        with transaction.atomic():
            subscription = OrganizationSubscription.objects.select_for_update().filter(
                organization=organization
            ).first()

            if subscription is None:
                raise ValueError('No subscription to switch')

            if subscription.status not in ACTIVE_STATUSES:
                raise ValueError('No active subscription to switch')

            if subscription.plan_id == new_plan.id:
                raise ValueError('Already subscribed to this plan')

            if subscription.billing_mode != 'auto':
                # Manual mode — no Paystack call, just swap the plan. The view
                # restricts this branch to super_admin.
                subscription.plan = new_plan
                subscription.save(update_fields=['plan', 'updated_at'])
                return {'mode': 'manual', 'status': subscription.status}

            if cls._has_live_pending_checkout(subscription):
                raise ValueError(
                    'A plan change checkout is already in progress — '
                    'complete it, or try again in a few minutes'
                )

            return cls._initiate_auto_charge(subscription, new_plan, requester_email, KIND_SWITCH)
