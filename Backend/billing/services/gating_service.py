"""
Feature-gating enforcement — effective-tier resolution and per-limit gate checks.

This is the single choke point every gate check in this phase must call — no
gate check may reimplement the trial/grace/downgrade rules inline in a view.
Mirrors `billing.services.subscription_service.SubscriptionService`'s
classmethod-only style (no instantiation).
"""
from __future__ import annotations

import math
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from billing.models import SubscriptionPlan
from organizations.models import OrganizationMembership
from properties.models import Property, RentalUnit


class GatingService:
    """Resolves an organization's effective subscription tier and enforces its limits/features."""

    # Fixed 3-tier upgrade mapping — the seeded tiers are a closed, unchanging
    # set (see seed_subscription_plans.py), so no generic sort_order walk is
    # needed here.
    _UPGRADE_PATH = {'starter': 'pro', 'pro': 'enterprise'}

    @classmethod
    def _next_tier_unlocking(cls, plan: SubscriptionPlan) -> str:
        return cls._UPGRADE_PATH.get(plan.slug, 'enterprise')

    @classmethod
    def _get_floor_plan(cls, slug: str) -> SubscriptionPlan:
        """
        WR-05: every organization with no active/in-grace subscription (i.e.
        every brand-new signup) depends on the 'enterprise' and 'starter'
        seed rows existing. Surface a clear, actionable operational error
        instead of letting SubscriptionPlan.DoesNotExist propagate as a bare
        500 for every gate-guarded endpoint org-wide.
        """
        try:
            return SubscriptionPlan.objects.get(slug=slug)
        except SubscriptionPlan.DoesNotExist as exc:
            raise RuntimeError(
                f"SubscriptionPlan seed data missing (slug={slug!r}) — "
                "run `python manage.py seed_subscription_plans`."
            ) from exc

    @classmethod
    def get_effective_plan(cls, organization) -> SubscriptionPlan:
        """
        Single entry point for all four gate checks (D-01-D-04).

        - An active subscription's plan is authoritative.
        - A past_due subscription still within its grace period keeps its
          subscribed plan's full limits/features (D-01 — graceful
          degradation, not instant cutoff).
        - Every other case (no subscription row at all; status in
          pending/suspended/cancelled; an expired or missing grace period)
          falls through to the no-subscription trial/floor: Enterprise-tier
          access for 30 days from Organization.created_at (D-03), then
          Starter-tier floor limits/features once that window has passed
          (D-04).
        """
        subscription = getattr(organization, 'subscription', None)

        if subscription is not None:
            if subscription.status == 'active':
                return subscription.plan
            if (
                subscription.status == 'past_due'
                and subscription.grace_period_ends_at is not None
                and timezone.now() <= subscription.grace_period_ends_at
            ):
                return subscription.plan

        if timezone.now() <= cls.trial_ends_at(organization):
            return cls._get_floor_plan('enterprise')
        return cls._get_floor_plan('starter')

    @staticmethod
    def trial_days() -> int:
        return int(getattr(settings, 'SUBSCRIPTION_TRIAL_DAYS', 30))

    @classmethod
    def trial_ends_at(cls, organization):
        """Every new organization gets the top tier free for this long from signup."""
        return organization.created_at + timedelta(days=cls.trial_days())

    @classmethod
    def get_access_summary(cls, organization) -> dict:
        """
        What the landlord is entitled to right now and why, for the trial banner.

        `on_trial` is true only while access comes from the free window rather
        than from a paid/in-grace subscription.
        """
        subscription = getattr(organization, 'subscription', None)
        plan = cls.get_effective_plan(organization)
        ends_at = cls.trial_ends_at(organization)
        now = timezone.now()

        paying = subscription is not None and (
            subscription.status == 'active'
            or (
                subscription.status == 'past_due'
                and subscription.grace_period_ends_at is not None
                and now <= subscription.grace_period_ends_at
            )
        )
        on_trial = not paying and now <= ends_at
        return {
            'effective_plan': plan.slug,
            'effective_plan_name': plan.name,
            'on_trial': on_trial,
            'trial_expired': (not paying) and now > ends_at,
            'trial_ends_at': ends_at,
            'trial_days_left': max(math.ceil((ends_at - now).total_seconds() / 86400), 0) if on_trial else 0,
            'subscription_status': subscription.status if subscription is not None else None,
        }

    @classmethod
    def check_property_limit(cls, organization) -> dict | None:
        plan = cls.get_effective_plan(organization)
        if plan.max_properties == 0:  # 0 means unlimited (billing/models.py)
            return None

        current_count = Property.objects.filter(organization=organization).count()
        if current_count >= plan.max_properties:
            return {
                'detail': 'Property limit reached for your plan.',
                'gate': 'max_properties',
                'current_tier': plan.slug,
                'required_tier': cls._next_tier_unlocking(plan),
            }
        return None

    @classmethod
    def check_unit_limit(cls, organization) -> dict | None:
        plan = cls.get_effective_plan(organization)
        if plan.max_units == 0:  # 0 means unlimited (billing/models.py)
            return None

        current_count = RentalUnit.objects.filter(organization=organization).count()
        if current_count >= plan.max_units:
            return {
                'detail': 'Unit limit reached for your plan.',
                'gate': 'max_units',
                'current_tier': plan.slug,
                'required_tier': cls._next_tier_unlocking(plan),
            }
        return None

    @classmethod
    def check_caretaker_seat_limit(cls, organization) -> dict | None:
        plan = cls.get_effective_plan(organization)
        if plan.max_caretaker_seats == 0:  # 0 means unlimited (billing/models.py)
            return None

        # D-07: a seat is one distinct caretaker membership, never one per
        # property-assignment row — a caretaker assigned to 3 properties
        # still consumes exactly 1 seat.
        current_count = OrganizationMembership.objects.filter(
            organization=organization, role='caretaker', is_active=True,
        ).count()
        if current_count >= plan.max_caretaker_seats:
            return {
                'detail': 'Caretaker seat limit reached for your plan.',
                'gate': 'max_caretaker_seats',
                'current_tier': plan.slug,
                'required_tier': cls._next_tier_unlocking(plan),
            }
        return None

    @classmethod
    def check_analytics_feature(cls, organization) -> dict | None:
        """
        Analytics is the one feature switch a plan carries: the landlord income
        summary (expected, collected, outstanding and overdue rent, collection
        rate and a per-property breakdown) is refused with a gate response on a
        plan that does not include it.
        """
        plan = cls.get_effective_plan(organization)
        if plan.features.get('analytics', False):
            return None
        return {
            'detail': 'Analytics is not included in your plan.',
            'gate': 'analytics',
            'current_tier': plan.slug,
            'required_tier': cls._next_tier_unlocking(plan),
        }
