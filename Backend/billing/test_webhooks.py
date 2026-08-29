"""
Billing webhook handler tests — subscription-lifecycle event handling,
dispatch from the single Paystack webhook, and grace-period/reminder tasks.

Kept separate from `billing/tests.py` (plan 01-01's file) so this plan's
edits never collide with sibling plans' edits to that file.
"""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.utils import timezone

from billing.models import (
    OrganizationSubscription,
    SubscriptionPayment,
    SubscriptionPlan,
    SubscriptionWebhookEvent,
)
from billing.services.webhook import handle_billing_event
from rumia_api.tests import RumiaTestFixtures


def _make_plan(slug):
    return SubscriptionPlan.objects.create(name='Starter', slug=slug, price=Decimal('1500.00'))


class HandleBillingEventTests(RumiaTestFixtures):
    def test_subscription_create_activates_and_populates_codes(self):
        user, profile, org = self.create_landlord_with_org()
        plan = _make_plan('starter-create')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )

        result = handle_billing_event({
            'event': 'subscription.create',
            'data': {
                'id': 'evt_sub_create_1',
                'subscription_code': 'SUB_CODE_1',
                'email_token': 'tok_1',
                'customer': {'email': user.email},
            },
        })

        self.assertEqual(result['status'], 'processed')
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'active')
        self.assertEqual(subscription.paystack_subscription_code, 'SUB_CODE_1')
        self.assertEqual(subscription.paystack_email_token, 'tok_1')

    def test_subscription_create_with_no_unambiguous_match_is_unmatched(self):
        result = handle_billing_event({
            'event': 'subscription.create',
            'data': {
                'id': 'evt_sub_create_unmatched',
                'subscription_code': 'SUB_CODE_ORPHAN',
                'email_token': 'tok_orphan',
                'customer': {'email': 'nobody@nowhere.test'},
            },
        })
        self.assertEqual(result['status'], 'unmatched')
        self.assertEqual(OrganizationSubscription.objects.count(), 0)

    def test_charge_success_for_subscription_payment_marks_paid_and_extends_period(self):
        user, profile, org = self.create_landlord_with_org()
        plan = _make_plan('starter-charge')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        payment = SubscriptionPayment.objects.create(
            subscription=subscription, amount=plan.price,
            internal_reference='SUB-CHARGE-1', status='pending',
        )

        result = handle_billing_event({
            'event': 'charge.success',
            'data': {'id': 'evt_charge_1', 'reference': 'SUB-CHARGE-1', 'status': 'success'},
        })

        self.assertEqual(result['status'], 'processed')
        payment.refresh_from_db()
        subscription.refresh_from_db()
        self.assertEqual(payment.status, 'success')
        self.assertIsNotNone(payment.paid_at)
        today = timezone.now().date()
        self.assertEqual(subscription.current_period_start, today)
        self.assertEqual(subscription.current_period_end, today + timedelta(days=30))
        self.assertIsNone(subscription.grace_period_ends_at)
        self.assertEqual(subscription.status, 'active')

    def test_charge_success_unmatched_reference_is_ignored_and_creates_no_row(self):
        result = handle_billing_event({
            'event': 'charge.success',
            'data': {'id': 'evt_charge_unmatched', 'reference': 'RUMIA-NOT-OURS', 'status': 'success'},
        })
        self.assertEqual(result['status'], 'ignored')
        self.assertEqual(SubscriptionPayment.objects.count(), 0)
        self.assertEqual(OrganizationSubscription.objects.count(), 0)

    def test_invoice_payment_failed_sets_past_due_with_future_grace(self):
        user, profile, org = self.create_landlord_with_org()
        plan = _make_plan('starter-invoice-failed')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='active', billing_mode='auto',
            paystack_subscription_code='SUB_CODE_FAIL',
        )

        result = handle_billing_event({
            'event': 'invoice.payment_failed',
            'data': {
                'id': 'evt_invoice_failed_1',
                'subscription': {'subscription_code': 'SUB_CODE_FAIL'},
            },
        })

        self.assertEqual(result['status'], 'processed')
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'past_due')
        self.assertIsNotNone(subscription.grace_period_ends_at)
        self.assertGreater(subscription.grace_period_ends_at, timezone.now())

    def test_subscription_disable_cancels_subscription(self):
        user, profile, org = self.create_landlord_with_org()
        plan = _make_plan('starter-disable')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='active', billing_mode='auto',
            paystack_subscription_code='SUB_CODE_DISABLE',
        )

        result = handle_billing_event({
            'event': 'subscription.disable',
            'data': {'id': 'evt_disable_1', 'subscription_code': 'SUB_CODE_DISABLE'},
        })

        self.assertEqual(result['status'], 'processed')
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'cancelled')
        self.assertIsNotNone(subscription.cancelled_at)

    def test_duplicate_event_processes_state_transition_only_once(self):
        user, profile, org = self.create_landlord_with_org()
        plan = _make_plan('starter-dup')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        original_save = OrganizationSubscription.save
        payload = {
            'event': 'subscription.create',
            'data': {
                'id': 'evt_dup_1',
                'subscription_code': 'SUB_CODE_DUP',
                'email_token': 'tok_dup',
                'customer': {'email': user.email},
            },
        }

        with patch.object(OrganizationSubscription, 'save', autospec=True) as mock_save:
            mock_save.side_effect = original_save

            first = handle_billing_event(payload)
            second = handle_billing_event(payload)

        self.assertEqual(first['status'], 'processed')
        self.assertEqual(second['status'], 'already_processed')
        self.assertEqual(mock_save.call_count, 1)
        self.assertEqual(
            SubscriptionWebhookEvent.objects.filter(
                event_type='subscription.create', paystack_object_id='evt_dup_1',
            ).count(),
            1,
        )
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'active')
