"""
Subscription lifecycle orchestration — subscribe and switch-plan.

Views must call this service, never touch PaystackBillingClient or the
billing models directly for mutations — this is the single choke point that
guarantees an organization can never be double-billed.
"""
from __future__ import annotations

import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from billing.models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient

# Only a subscription in one of these statuses is eligible to be switched, and
# only a subscription NOT in one of these statuses is eligible for a fresh subscribe.
ACTIVE_STATUSES = ('active', 'past_due')


class SubscriptionService:
    """Provider-independent subscription orchestration for the `billing` app."""

    @classmethod
    def _initiate_auto_charge(
        cls,
        subscription: OrganizationSubscription,
        plan: SubscriptionPlan,
        requester_email: str,
    ) -> dict:
        """
        Create a pending SubscriptionPayment for `plan` and start its Paystack
        checkout.

        This is the ONLY place that reads `plan.price` and builds the
        Paystack initialize payload — both `subscribe()` and `switch_plan()`
        call this helper instead of duplicating the sequence, which is what
        guarantees a plan switch always bills the new plan's live price,
        never a stale/cached one.
        """
        if not plan.paystack_plan_code:
            raise ValueError('Plan not yet linked to Paystack')

        today = timezone.now().date()
        internal_reference = f'SUB-{uuid.uuid4().hex[:10].upper()}'

        SubscriptionPayment.objects.create(
            subscription=subscription,
            amount=plan.price,
            internal_reference=internal_reference,
            status='pending',
            billing_period_start=today,
            billing_period_end=today + timedelta(days=30),
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

            if not created and subscription.status == 'pending':
                # The auto-charge flow leaves status='pending' until the Paystack
                # webhook confirms payment — without this guard, a double-submit
                # (double-click, retry after a slow response) here would create a
                # SECOND SubscriptionPayment and a second Paystack checkout for the
                # same organization while the first checkout is still live.
                raise ValueError(
                    'A subscription is already pending for this organization — '
                    'complete or wait for the existing checkout before retrying'
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
                return cls._initiate_auto_charge(subscription, plan, requester_email)

            raise ValueError(f'Unknown billing_mode: {billing_mode}')

    @classmethod
    def switch_plan(
        cls,
        organization,
        new_plan: SubscriptionPlan,
        requester_email: str,
    ) -> dict:
        """Switch an organization's existing subscription to `new_plan`."""
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

            if subscription.billing_mode == 'auto':
                # Disable-before-initiate ordering: this is what makes double-billing
                # on a plan switch structurally impossible, not just conventionally avoided.
                if subscription.paystack_subscription_code:
                    PaystackBillingClient().disable_subscription(
                        subscription.paystack_subscription_code,
                        subscription.paystack_email_token,
                    )
                    subscription.paystack_subscription_code = ''
                    subscription.paystack_email_token = ''
                    subscription.save(update_fields=[
                        'paystack_subscription_code', 'paystack_email_token', 'updated_at',
                    ])

                return cls._initiate_auto_charge(subscription, new_plan, requester_email)

            # Manual mode — no Paystack call, just swap the plan.
            subscription.plan = new_plan
            subscription.save(update_fields=['plan', 'updated_at'])
            return {'mode': 'manual', 'status': subscription.status}
