"""
Audit-trail tests — payout status transitions and webhook-driven subscription
status changes (HARD-03). See 07-02-PLAN.md.
"""
from __future__ import annotations

import json
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings

from audit.models import AuditLog
from billing.models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from billing.services.webhook import handle_billing_event
from rumia_api.tests import RumiaTestFixtures


def _make_plan(slug):
    return SubscriptionPlan.objects.create(name='Starter', slug=slug, price=Decimal('1500.00'))


class SubscriptionWebhookAuditTests(RumiaTestFixtures):
    """D-01/D-02: webhook-driven subscription state changes are audit-logged
    with actor=None (no human present) and event-type/reference metadata."""

    def test_subscription_create_logs_subscription_activated_with_no_actor(self):
        user, profile, org = self.create_landlord_with_org(email='audit-sub-create@test.com')
        plan = _make_plan('audit-sub-create')
        OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )

        result = handle_billing_event({
            'event': 'subscription.create',
            'data': {
                'id': 'evt_audit_create_1',
                'subscription_code': 'SUB_AUDIT_CREATE',
                'email_token': 'tok_audit',
                'customer': {'email': user.email},
            },
        })

        self.assertEqual(result['status'], 'processed')
        entries = AuditLog.objects.filter(action='subscription_activated')
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertIsNone(entry.actor)
        self.assertEqual(entry.metadata['source'], 'webhook')
        self.assertEqual(entry.metadata['event_type'], 'subscription.create')

    def test_charge_success_logs_subscription_payment_recorded_on_payment_entity(self):
        user, profile, org = self.create_landlord_with_org(email='audit-charge@test.com')
        plan = _make_plan('audit-charge')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        payment = SubscriptionPayment.objects.create(
            subscription=subscription, amount=plan.price,
            internal_reference='SUB-AUDIT-CHARGE-1', status='pending',
        )

        result = handle_billing_event({
            'event': 'charge.success',
            'data': {'id': 'evt_audit_charge_1', 'reference': 'SUB-AUDIT-CHARGE-1', 'status': 'success'},
        })

        self.assertEqual(result['status'], 'processed')
        entries = AuditLog.objects.filter(action='subscription_payment_recorded')
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertIsNone(entry.actor)
        self.assertEqual(entry.entity_type, 'SubscriptionPayment')
        self.assertEqual(entry.entity_id, str(payment.pk))

    def test_invoice_payment_failed_logs_new_status_past_due(self):
        user, profile, org = self.create_landlord_with_org(email='audit-invoice@test.com')
        plan = _make_plan('audit-invoice')
        OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='active', billing_mode='auto',
            paystack_subscription_code='SUB_AUDIT_INVOICE',
        )

        result = handle_billing_event({
            'event': 'invoice.payment_failed',
            'data': {
                'id': 'evt_audit_invoice_1',
                'subscription': {'subscription_code': 'SUB_AUDIT_INVOICE'},
            },
        })

        self.assertEqual(result['status'], 'processed')
        entries = AuditLog.objects.filter(action='subscription_payment_failed')
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertIsNone(entry.actor)
        self.assertEqual(entry.new_value['status'], 'past_due')

    def test_subscription_disable_logs_new_status_cancelled(self):
        user, profile, org = self.create_landlord_with_org(email='audit-disable@test.com')
        plan = _make_plan('audit-disable')
        OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='active', billing_mode='auto',
            paystack_subscription_code='SUB_AUDIT_DISABLE',
        )

        result = handle_billing_event({
            'event': 'subscription.disable',
            'data': {'id': 'evt_audit_disable_1', 'subscription_code': 'SUB_AUDIT_DISABLE'},
        })

        self.assertEqual(result['status'], 'processed')
        entries = AuditLog.objects.filter(action='subscription_disabled')
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertIsNone(entry.actor)
        self.assertEqual(entry.new_value['status'], 'cancelled')

    def test_replayed_webhook_delivery_does_not_double_log(self):
        user, profile, org = self.create_landlord_with_org(email='audit-replay@test.com')
        plan = _make_plan('audit-replay')
        OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='active', billing_mode='auto',
            paystack_subscription_code='SUB_AUDIT_REPLAY',
        )
        payload = {
            'event': 'subscription.disable',
            'data': {'id': 'evt_audit_replay_1', 'subscription_code': 'SUB_AUDIT_REPLAY'},
        }

        first = handle_billing_event(payload)
        second = handle_billing_event(payload)

        self.assertEqual(first['status'], 'processed')
        self.assertEqual(second['status'], 'already_processed')
        self.assertEqual(
            AuditLog.objects.filter(action='subscription_disabled').count(), 1,
        )

    @override_settings(PAYSTACK_SECRET_KEY='sk_test_do_not_leak_this_value')
    def test_no_raw_paystack_secret_in_any_webhook_audit_entry(self):
        from django.conf import settings

        user, profile, org = self.create_landlord_with_org(email='audit-nopii@test.com')
        plan = _make_plan('audit-nopii')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=plan.price,
            internal_reference='SUB-AUDIT-NOPII-1', status='pending',
        )

        handle_billing_event({
            'event': 'subscription.create',
            'data': {
                'id': 'evt_audit_nopii_create', 'subscription_code': 'SUB_AUDIT_NOPII',
                'email_token': 'tok_nopii', 'customer': {'email': user.email},
            },
        })
        handle_billing_event({
            'event': 'charge.success',
            'data': {'id': 'evt_audit_nopii_charge', 'reference': 'SUB-AUDIT-NOPII-1', 'status': 'success'},
        })
        handle_billing_event({
            'event': 'invoice.payment_failed',
            'data': {'id': 'evt_audit_nopii_invoice', 'subscription': {'subscription_code': 'SUB_AUDIT_NOPII'}},
        })
        handle_billing_event({
            'event': 'subscription.disable',
            'data': {'id': 'evt_audit_nopii_disable', 'subscription_code': 'SUB_AUDIT_NOPII'},
        })

        secret = settings.PAYSTACK_SECRET_KEY
        for entry in AuditLog.objects.filter(
            action__in=[
                'subscription_activated', 'subscription_payment_recorded',
                'subscription_payment_failed', 'subscription_disabled',
            ],
        ):
            blob = json.dumps({
                'old_value': entry.old_value, 'new_value': entry.new_value, 'metadata': entry.metadata,
            })
            self.assertNotIn(secret, blob)
