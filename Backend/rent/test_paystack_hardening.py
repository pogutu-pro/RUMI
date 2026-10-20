"""Phase 1i — Paystack hardening: transient errors, reconciliation (H4), refunds/disputes (H5), H6, reversal API."""

import hashlib
import hmac
import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

import requests
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from rent.models import Payment
from rent.providers.base import VerifyPaymentResult
from rent.providers.paystack import PaystackProvider
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.payment_service import PaymentService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
SECRET = 'sk_test_hardening'
WEBHOOK = '/api/v1/rent/payments/webhook/paystack/'
SMS = 'rent.services.notifications.send_sms_via_africastalking'


def ok(amount='1000.00', status='success'):
    return VerifyPaymentResult(success=status == 'success', status=status if status != 'abandoned' else 'pending',
                               amount=D(amount), provider_reference='PSK', raw_response={'data': {'currency': 'KES'}})


class HardeningFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.invoice = InvoiceService.create_invoice(
            self.tenancy, 'adhoc', [LineSpec('repair', D('1000'))],
            period_start=timezone.now().date(), period_end=timezone.now().date(), due_date=timezone.now().date(),
        )

    def processing(self, ref='PSK-REF', age=timedelta(minutes=30)):
        payment = Payment.objects.create(
            organization=self.org, tenancy=self.tenancy, tenant=self.tenant, amount=D('1000.00'),
            payment_method='paystack', provider='paystack', internal_reference=ref, status='processing',
        )
        Payment.objects.filter(pk=payment.pk).update(created_at=timezone.now() - age)
        payment.refresh_from_db()
        return payment

    def settled(self, ref='PSK-REF'):
        payment = self.processing(ref)
        with patch.object(PaystackProvider, 'verify_payment', return_value=ok()), patch(SMS):
            return PaymentService.verify_and_allocate(payment, raw_callback={})

    def webhook(self, event, data, secret=SECRET):
        body = json.dumps({'event': event, 'data': data}).encode()
        signature = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
        return APIClient().generic('POST', WEBHOOK, data=body, content_type='application/json',
                                   HTTP_X_PAYSTACK_SIGNATURE=signature)


@override_settings(PAYSTACK_SECRET_KEY=SECRET, PAYSTACK_ENV='test')
class TransientAndReconciliationTests(HardeningFixtures):
    def test_network_error_during_verify_keeps_payment_processing(self):
        payment = self.processing()
        with patch('rent.providers.paystack.requests.get', side_effect=requests.ConnectionError('down')):
            payment = PaymentService.verify_and_allocate(payment, raw_callback={})
        self.assertEqual(payment.status, 'processing')

    def test_abandoned_checkout_stays_pending_until_24h_then_fails(self):
        young = self.processing('YOUNG', age=timedelta(hours=1))
        old = self.processing('OLD', age=timedelta(hours=25))
        with patch.object(PaystackProvider, 'verify_payment', return_value=ok(status='abandoned')):
            counts = PaymentService.reconcile_processing()
        young.refresh_from_db()
        old.refresh_from_db()
        self.assertEqual(young.status, 'processing')
        self.assertEqual(old.status, 'failed')
        self.assertIn('Abandoned', old.notes)
        self.assertEqual(counts['abandoned'], 1)

    def test_reconciliation_settles_a_paid_payment_whose_webhook_was_lost(self):
        payment = self.processing()
        too_new = self.processing('NEW', age=timedelta(minutes=2))
        with patch.object(PaystackProvider, 'verify_payment', return_value=ok()) as verify, patch(SMS):
            counts = PaymentService.reconcile_processing()
        payment.refresh_from_db()
        self.invoice.refresh_from_db()
        self.assertEqual(payment.status, 'success')
        self.assertEqual(self.invoice.status, 'paid')
        self.assertEqual(counts['settled'], 1)
        self.assertEqual(verify.call_count, 1)  # the 2-minute-old one is left for its webhook
        too_new.refresh_from_db()
        self.assertEqual(too_new.status, 'processing')


@override_settings(PAYSTACK_SECRET_KEY=SECRET, PAYSTACK_WEBHOOK_SECRET='', PAYSTACK_ENV='test')
class RefundAndDisputeWebhookTests(HardeningFixtures):
    def test_signature_with_paystack_secret_key_is_accepted(self):
        response = self.webhook('refund.processed', {'transaction_reference': 'NOPE'})
        self.assertEqual(response.status_code, 200)
        bad = self.webhook('refund.processed', {'transaction_reference': 'NOPE'}, secret='wrong')
        self.assertEqual(bad.status_code, 400)

    def test_full_refund_reverses_payment_and_reopens_invoice(self):
        payment = self.settled()
        response = self.webhook('refund.processed', {'transaction_reference': payment.internal_reference,
                                                     'amount': 100000, 'status': 'processed'})
        self.assertEqual(response.data['outcome'], 'reversed')
        payment.refresh_from_db()
        self.invoice.refresh_from_db()
        self.assertEqual(payment.status, 'reversed')
        self.assertEqual(self.invoice.outstanding, D('1000.00'))

    def test_partial_refund_is_flagged_not_guessed(self):
        payment = self.settled()
        response = self.webhook('refund.processed', {'transaction': {'reference': payment.internal_reference},
                                                     'amount': 30000})
        self.assertEqual(response.data['outcome'], 'flagged')
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'success')
        self.assertEqual(payment.metadata['partial_refunds'][0]['amount'], '300')

    def test_dispute_flags_payment_and_alerts_owner(self):
        payment = self.settled()
        with patch(SMS) as sms:
            response = self.webhook('charge.dispute.create',
                                    {'transaction': {'reference': payment.internal_reference}, 'status': 'awaiting-merchant-feedback'})
        self.assertEqual(response.data['outcome'], 'flagged')
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'success')  # money only moves when a person reverses it
        self.assertEqual(payment.metadata['disputes'][0]['event'], 'charge.dispute.create')
        self.assertIn('chargeback', sms.call_args[0][1])

    def test_billing_handler_failure_returns_500_so_paystack_retries(self):
        with patch('billing.services.webhook.handle_billing_event', side_effect=RuntimeError('db down')):
            response = self.webhook('subscription.create', {'id': 1})
        self.assertEqual(response.status_code, 500)


class ReverseEndpointTests(HardeningFixtures):
    def test_owner_reverses_with_reason_others_cannot(self):
        payment = self.settled()
        url = f'/api/v1/rent/payments/{payment.id}/reverse/'

        tenant = APIClient()
        tenant.force_authenticate(user=self.tenant_user)
        self.assertEqual(tenant.post(url, {'reason': 'x'}, format='json').status_code, 403)

        landlord = APIClient()
        landlord.force_authenticate(user=self.landlord)
        self.assertEqual(landlord.post(url, {}, format='json').status_code, 400)
        response = landlord.post(url, {'reason': 'Cheque bounced'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'reversed')
        self.assertEqual(landlord.post(url, {'reason': 'again'}, format='json').status_code, 400)

        intruder, _, _ = self.create_landlord_with_org('intruder@test.com')
        other = APIClient()
        other.force_authenticate(user=intruder)
        self.assertEqual(other.post(url, {'reason': 'x'}, format='json').status_code, 404)
