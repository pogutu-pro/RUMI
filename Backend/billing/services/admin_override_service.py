"""
Admin subscription override — a deliberately SEPARATE code path from the
regular subscribe/switch-plan orchestration service.

This module never imports the Paystack-charging subscription service and
never imports the Paystack billing provider client (per D-05): the override
path must be structurally incapable of calling Paystack. It force-sets
OrganizationSubscription.plan and/or .status directly, for cases like
manual bank-transfer reconciliation or comping a customer, and every call
is audit-logged with a mandatory reason (D-05a).
"""
from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from audit.models import log_audit

from ..models import OrganizationSubscription


class AdminOverrideService:
    """Provider-independent, Paystack-free subscription override for super_admin support actions."""

    @classmethod
    def override_subscription(
        cls,
        organization,
        plan=None,
        status=None,
        reason: str = '',
        actor=None,
    ) -> OrganizationSubscription:
        if not reason or not reason.strip():
            raise ValueError('reason is required')
        if plan is None and status is None:
            raise ValueError('At least one of plan or status must be provided')

        with transaction.atomic():
            if plan is None:
                existing = OrganizationSubscription.objects.filter(
                    organization=organization,
                ).first()
                if existing is None:
                    raise ValueError(
                        'plan is required when the organization has no existing subscription'
                    )

            defaults = {}
            if plan is not None:
                defaults['plan'] = plan
            defaults['status'] = status if status is not None else 'pending'

            subscription, created = OrganizationSubscription.objects.get_or_create(
                organization=organization, defaults=defaults,
            )

            old_value = {
                'plan': subscription.plan.slug if subscription.plan_id else None,
                'status': subscription.status,
            }

            update_fields = []
            if not created:
                if plan is not None:
                    subscription.plan = plan
                    update_fields.append('plan')
                if status is not None:
                    subscription.status = status
                    update_fields.append('status')
                    # Confirming a manual (or any other) payment this way —
                    # e.g. bank-transfer reconciliation — is exactly the
                    # moment a billing period should start; without this, a
                    # subscription activated by override sits with no
                    # current_period_end, so it never gets a renewal
                    # reminder and never comes up for review again.
                    if status == 'active' and (
                        subscription.current_period_end is None
                        or subscription.current_period_end < timezone.now().date()
                    ):
                        today = timezone.now().date()
                        subscription.current_period_start = today
                        subscription.current_period_end = today + timedelta(days=30)
                        subscription.grace_period_ends_at = None
                        update_fields += ['current_period_start', 'current_period_end', 'grace_period_ends_at']
                if update_fields:
                    subscription.save(update_fields=update_fields)

            new_value = {
                'plan': subscription.plan.slug if subscription.plan_id else None,
                'status': subscription.status,
            }

            log_audit(
                'other',
                actor=actor,
                organization=organization,
                entity=subscription,
                old_value=old_value,
                new_value=new_value,
                metadata={'reason': reason, 'override_type': 'subscription'},
            )

        return subscription
