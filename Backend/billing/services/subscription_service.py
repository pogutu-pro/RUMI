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

from audit.models import log_audit
from billing.models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient
from rent.providers.base import PaymentProviderError

logger = logging.getLogger(__name__)

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
                # Stays 'pending' — GatingService only grants a plan's limits
                # for 'active' (or 'past_due' within its grace period), so
                # choosing to pay another way never hands out the paid tier
                # before anyone has actually paid. A super admin confirms
                # receipt via AdminSubscriptionOverrideView, the same
                # override endpoint used for every other billing correction,
                # which sets status='active' and starts the period then.
                subscription.plan = plan
                subscription.billing_mode = 'manual'
                subscription.status = 'pending'
                subscription.save(update_fields=['plan', 'billing_mode', 'status', 'updated_at'])

                log_audit(
                    'manual_subscription_requested',
                    actor=organization.owner,
                    organization=subscription.organization,
                    entity=subscription,
                    metadata={'plan': plan.slug, 'requester_email': requester_email},
                )
                return {'mode': 'manual', 'status': 'pending'}

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
        """
        Switch an organization's existing subscription to `new_plan`.

        The Paystack `disable_subscription` call is a real, irreversible external
        side effect — it must never be made inside the same `transaction.atomic()`
        block as a later step that can still fail and roll back the DB. Otherwise
        a failure in `_initiate_auto_charge` (e.g. a second Paystack call raising)
        would roll the DB back to believing the OLD Paystack subscription is still
        live, while Paystack itself has already cancelled it — a permanent desync
        where the org silently never gets billed again.

        To avoid that, this method never opens more than one atomic block around
        an external call: the "disable" intent is committed to the DB BEFORE the
        Paystack call is made (so a crash before/after that call always leaves the
        DB in a state consistent with "we no longer own that Paystack subscription
        code"), and `_initiate_auto_charge` runs in its own, separate transaction
        afterwards. If that second step fails, the subscription is left in a safe,
        retryable state — `paystack_subscription_code` already cleared, no new
        recurring subscription created yet — and calling `switch_plan` again picks
        up cleanly from there.
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
                # Manual mode — no Paystack call, just swap the plan.
                subscription.plan = new_plan
                subscription.save(update_fields=['plan', 'updated_at'])
                return {'mode': 'manual', 'status': subscription.status}

            # Auto mode: capture the old Paystack identifiers and clear them from
            # the DB record NOW, before the external call — this commits the
            # "disabling" intent first, per the docstring above.
            old_subscription_code = subscription.paystack_subscription_code
            old_email_token = subscription.paystack_email_token
            if old_subscription_code:
                subscription.paystack_subscription_code = ''
                subscription.paystack_email_token = ''
                subscription.save(update_fields=[
                    'paystack_subscription_code', 'paystack_email_token', 'updated_at',
                ])
        # transaction committed here — DB no longer references the old Paystack
        # subscription code regardless of what happens next.

        if old_subscription_code:
            try:
                PaystackBillingClient().disable_subscription(old_subscription_code, old_email_token)
            except PaymentProviderError:
                # The DB write already committed (we no longer track the old
                # code), but Paystack may still be actively charging the old
                # subscription. Never swallow this — it needs a human to cancel
                # it manually in the Paystack dashboard, or the org keeps paying
                # for a plan our system has already forgotten about.
                logger.error(
                    'Failed to disable Paystack subscription %s for organization %s during '
                    'plan switch — manual cancellation in the Paystack dashboard is required '
                    'to avoid a stray recurring charge.',
                    old_subscription_code, organization.id,
                )
                raise

        # Disable-before-initiate ordering: this is what makes double-billing
        # on a plan switch structurally impossible, not just conventionally
        # avoided. Runs in its own transaction, separate from the disable call.
        with transaction.atomic():
            subscription = OrganizationSubscription.objects.select_for_update().get(pk=subscription.pk)
            return cls._initiate_auto_charge(subscription, new_plan, requester_email)
