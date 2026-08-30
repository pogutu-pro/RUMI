"""
Billing webhook handler tests — subscription-lifecycle event handling,
dispatch from the single Paystack webhook, and grace-period/reminder tasks.

Kept separate from `billing/tests.py` (plan 01-01's file) so this plan's
edits never collide with sibling plans' edits to that file.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from billing.models import (
    OrganizationSubscription,
    SubscriptionPayment,
    SubscriptionPlan,
    SubscriptionWebhookEvent,
)
from billing.services.webhook import handle_billing_event
from rent.models import Payment
from rent.providers.paystack import PaystackProvider
from rumia_api.tests import RumiaTestFixtures

WEBHOOK_URL = '/api/v1/rent/payments/webhook/paystack/'


def _make_plan(slug):
    return SubscriptionPlan.objects.create(name='Starter', slug=slug, price=Decimal('1500.00'))


def _signed_body(secret, event, data):
    body = json.dumps({'event': event, 'data': data}).encode()
    sig = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
    return body, sig


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


@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')
class DispatchFromPaystackWebhookTests(RumiaTestFixtures):
    """
    Task 2 — the single physical Paystack webhook URL must correctly route
    rent-payment vs. billing/subscription events with zero cross-processing.
    """

    def _tenancy_with_tenant(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        tenant_user, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        return org, tenant_user, tenant, tenancy

    @patch.object(PaystackProvider, 'verify_payment')
    def test_charge_success_for_rent_payment_never_dispatches_to_billing(self, mock_verify):
        from rent.providers.base import VerifyPaymentResult

        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        charge = self.create_rent_charge(tenancy, amount=Decimal('22000.00'))
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-DISPATCH-RENT-1', status='processing',
        )
        mock_verify.return_value = VerifyPaymentResult(
            success=True, status='success', amount=Decimal('22000.00'),
            provider_reference=payment.internal_reference,
        )
        body, sig = _signed_body(
            'test_secret_key', 'charge.success',
            {'id': 'evt_rent_1', 'reference': payment.internal_reference, 'status': 'success', 'amount': 2200000},
        )

        with patch('billing.services.webhook.handle_billing_event') as mock_billing:
            client = APIClient()
            response = client.generic(
                'POST', WEBHOOK_URL, data=body, content_type='application/json',
                HTTP_X_PAYSTACK_SIGNATURE=sig,
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'processed')
        self.assertEqual(mock_billing.call_count, 0)
        payment.refresh_from_db()
        charge.refresh_from_db()
        self.assertEqual(payment.status, 'success')
        self.assertEqual(charge.status, 'paid')

    def test_subscription_lifecycle_event_dispatches_to_billing_without_touching_rent_payment(self):
        user, profile, org = self.create_landlord_with_org(email='dispatch-sub@test.com')
        plan = _make_plan('starter-dispatch-sub')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        body, sig = _signed_body(
            'test_secret_key', 'subscription.create',
            {
                'id': 'evt_dispatch_sub_1',
                'subscription_code': 'SUB_CODE_DISPATCH_1',
                'email_token': 'tok_dispatch_1',
                'customer': {'email': user.email},
            },
        )

        with patch.object(Payment.objects, 'get') as mock_payment_get:
            client = APIClient()
            response = client.generic(
                'POST', WEBHOOK_URL, data=body, content_type='application/json',
                HTTP_X_PAYSTACK_SIGNATURE=sig,
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'processed')
        self.assertEqual(mock_payment_get.call_count, 0)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'active')
        self.assertEqual(subscription.paystack_subscription_code, 'SUB_CODE_DISPATCH_1')

    def test_invoice_payment_failed_dispatches_to_billing_without_touching_rent_payment(self):
        user, profile, org = self.create_landlord_with_org(email='dispatch-invoice@test.com')
        plan = _make_plan('starter-dispatch-invoice')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='active', billing_mode='auto',
            paystack_subscription_code='SUB_CODE_DISPATCH_INVOICE',
        )
        body, sig = _signed_body(
            'test_secret_key', 'invoice.payment_failed',
            {
                'id': 'evt_dispatch_invoice_1',
                'subscription': {'subscription_code': 'SUB_CODE_DISPATCH_INVOICE'},
            },
        )

        with patch.object(Payment.objects, 'get') as mock_payment_get:
            client = APIClient()
            response = client.generic(
                'POST', WEBHOOK_URL, data=body, content_type='application/json',
                HTTP_X_PAYSTACK_SIGNATURE=sig,
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'processed')
        self.assertEqual(mock_payment_get.call_count, 0)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'past_due')
        self.assertIsNotNone(subscription.grace_period_ends_at)

    def test_charge_success_for_subscription_payment_dispatches_to_billing(self):
        user, profile, org = self.create_landlord_with_org(email='dispatch-charge@test.com')
        plan = _make_plan('starter-dispatch-charge')
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plan, status='pending', billing_mode='auto',
        )
        sub_payment = SubscriptionPayment.objects.create(
            subscription=subscription, amount=plan.price,
            internal_reference='SUB-DISPATCH-CHARGE-1', status='pending',
        )
        body, sig = _signed_body(
            'test_secret_key', 'charge.success',
            {'id': 'evt_dispatch_charge_1', 'reference': sub_payment.internal_reference, 'status': 'success'},
        )

        client = APIClient()
        response = client.generic(
            'POST', WEBHOOK_URL, data=body, content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'processed')
        sub_payment.refresh_from_db()
        subscription.refresh_from_db()
        self.assertEqual(sub_payment.status, 'success')
        self.assertEqual(subscription.status, 'active')

    def test_bad_signature_rejected_before_dispatch_for_rent_and_billing_shapes(self):
        rent_body, _ = _signed_body(
            'test_secret_key', 'charge.success',
            {'id': 'evt_bad_sig_rent', 'reference': 'RUMIA-BAD-SIG', 'status': 'success'},
        )
        billing_body, _ = _signed_body(
            'test_secret_key', 'subscription.create',
            {'id': 'evt_bad_sig_billing', 'subscription_code': 'SUB_BAD_SIG'},
        )

        with patch('billing.services.webhook.handle_billing_event') as mock_billing:
            client = APIClient()
            rent_response = client.generic(
                'POST', WEBHOOK_URL, data=rent_body, content_type='application/json',
                HTTP_X_PAYSTACK_SIGNATURE='not-the-right-signature',
            )
            billing_response = client.generic(
                'POST', WEBHOOK_URL, data=billing_body, content_type='application/json',
                HTTP_X_PAYSTACK_SIGNATURE='also-not-the-right-signature',
            )

        self.assertEqual(rent_response.status_code, 400)
        self.assertEqual(billing_response.status_code, 400)
        self.assertEqual(mock_billing.call_count, 0)
