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
from organizations.models import PayoutAccount
from organizations.services.payout_service import PayoutService
from rent.providers.base import AccountResolveResult, SubaccountResult
from rent.providers.paystack import PaystackProvider
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

    def test_charge_success_on_previously_failed_payment_logs_true_prior_status(self):
        user, profile, org = self.create_landlord_with_org(email='audit-charge-retry@test.com')
        plan = _make_plan('audit-charge-retry')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        payment = SubscriptionPayment.objects.create(
            subscription=subscription, amount=plan.price,
            internal_reference='SUB-AUDIT-CHARGE-RETRY-1', status='failed',
        )

        result = handle_billing_event({
            'event': 'charge.success',
            'data': {'id': 'evt_audit_charge_retry_1', 'reference': 'SUB-AUDIT-CHARGE-RETRY-1', 'status': 'success'},
        })

        self.assertEqual(result['status'], 'processed')
        entry = AuditLog.objects.filter(action='subscription_payment_recorded').latest('created_at')
        self.assertEqual(entry.old_value, {'status': 'failed'})
        self.assertEqual(entry.new_value['status'], 'success')

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


def _mock_resolve_success(account_name='John Kamau'):
    return AccountResolveResult(success=True, account_name=account_name)


def _mock_subaccount_success(code='ACCT_audit_test'):
    return SubaccountResult(success=True, subaccount_code=code)


class PayoutAuditTests(RumiaTestFixtures):
    """D-01: payout status transitions are audit-logged with the acting
    landlord as actor, and never leak the full bank account number."""

    def test_submit_for_new_org_logs_both_transitions_with_landlord_actor(self):
        user, profile, org = self.create_landlord_with_org(email='payout-audit-1@test.com')
        raw_account_number = '1234567890'

        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_success()), \
                patch.object(PaystackProvider, 'create_subaccount', return_value=_mock_subaccount_success()):
            payout_account = PayoutService.submit_bank_details(
                org, bank_name='Equity Bank', bank_account_number=raw_account_number,
                bank_code='068', actor=user,
            )

        self.assertEqual(payout_account.status, 'active')

        pending_entries = AuditLog.objects.filter(action='payout_pending_verification')
        activated_entries = AuditLog.objects.filter(action='payout_activated')
        self.assertEqual(pending_entries.count(), 1)
        self.assertEqual(activated_entries.count(), 1)
        self.assertEqual(pending_entries.first().actor_id, user.id)
        self.assertEqual(activated_entries.first().actor_id, user.id)

    def test_resubmitting_identical_details_while_active_creates_no_new_rows(self):
        user, profile, org = self.create_landlord_with_org(email='payout-audit-2@test.com')
        raw_account_number = '1234567890'

        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_success()), \
                patch.object(PaystackProvider, 'create_subaccount', return_value=_mock_subaccount_success()):
            PayoutService.submit_bank_details(
                org, bank_name='Equity Bank', bank_account_number=raw_account_number,
                bank_code='068', actor=user,
            )

        count_after_first_submit = AuditLog.objects.count()

        with patch.object(PaystackProvider, 'resolve_account') as mock_resolve, \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create:
            payout_account = PayoutService.submit_bank_details(
                org, bank_name='Equity Bank', bank_account_number=raw_account_number,
                bank_code='068', actor=user,
            )

        self.assertEqual(payout_account.status, 'active')
        mock_resolve.assert_not_called()
        mock_create.assert_not_called()
        self.assertEqual(AuditLog.objects.count(), count_after_first_submit)

    def test_no_full_bank_account_number_in_any_payout_audit_row(self):
        user, profile, org = self.create_landlord_with_org(email='payout-audit-3@test.com')
        raw_account_number = '9988776655'

        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_success()), \
                patch.object(PaystackProvider, 'create_subaccount', return_value=_mock_subaccount_success()):
            PayoutService.submit_bank_details(
                org, bank_name='Equity Bank', bank_account_number=raw_account_number,
                bank_code='068', actor=user,
            )

        for entry in AuditLog.objects.filter(
            action__in=['payout_pending_verification', 'payout_activated'],
        ):
            blob = json.dumps({
                'old_value': entry.old_value, 'new_value': entry.new_value, 'metadata': entry.metadata,
            })
            self.assertNotIn(raw_account_number, blob)
