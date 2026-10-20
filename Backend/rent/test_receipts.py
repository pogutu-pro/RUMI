"""Phase 1d — receipts: issue, snapshot, PDF, delivery, API."""

import shutil
import tempfile
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient

from rent.models import Payment, Receipt
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.payment_service import PaymentService
from rent.services.receipts import ReceiptService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
TODAY = date.today()
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class ReceiptFixtures(RumiaTestFixtures):
    def setUp(self):
        self.media = tempfile.mkdtemp(prefix='rumiarent-test-media-')
        self.media_override = override_settings(MEDIA_ROOT=self.media)
        self.media_override.enable()
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.invoice = InvoiceService.create_invoice(
            self.tenancy, 'rent', [LineSpec('rent', D('22000'))],
            period_start=TODAY.replace(day=1), period_end=TODAY, due_date=TODAY,
        )

    def tearDown(self):
        self.media_override.disable()
        shutil.rmtree(self.media, ignore_errors=True)

    def pay(self, amount, ref='RCPT-1'):
        payment = Payment.objects.create(
            organization=self.org, tenancy=self.tenancy, tenant=self.tenant, parent_property=self.prop,
            unit=self.unit, amount=D(amount), payment_method='cash', provider='manual', internal_reference=ref,
        )
        return PaymentService.record_manual_payment(payment)


class ReceiptIssueTests(ReceiptFixtures):
    def test_successful_payment_gets_numbered_receipt_with_snapshot(self):
        with patch(SMS):
            payment = self.pay('25000')
        receipt = payment.receipt

        self.assertEqual(receipt.number, 'RCT-000001')
        s = receipt.snapshot
        self.assertEqual(s['amount'], '25000.00')
        self.assertEqual(s['unit'], 'A101')
        self.assertEqual(s['allocations'][0]['invoice_number'], self.invoice.number)
        self.assertEqual(s['allocations'][0]['amount'], '22000.00')
        self.assertEqual(s['credit_kept'], '3000.00')
        self.assertEqual(s['balance_after'], '0.00')
        self.assertEqual(s['credit_after'], '3000.00')

    def test_issue_is_idempotent(self):
        with patch(SMS):
            payment = self.pay('100')
        self.assertEqual(ReceiptService.issue(payment).pk, payment.receipt.pk)
        self.assertEqual(Receipt.objects.count(), 1)

    def test_no_receipt_for_unsuccessful_payment(self):
        payment = Payment.objects.create(
            organization=self.org, tenancy=self.tenancy, tenant=self.tenant, amount=D('10'),
            payment_method='paystack', provider='paystack', internal_reference='X', status='disputed',
        )
        with self.assertRaises(ValueError):
            ReceiptService.issue(payment)

    def test_pdf_renders(self):
        with patch(SMS):
            payment = self.pay('22000')
        pdf = ReceiptService.render_pdf(payment.receipt)
        self.assertTrue(pdf.startswith(b'%PDF'))


class ReceiptDeliveryTests(ReceiptFixtures):
    def test_delivery_after_commit_sends_email_with_pdf_and_sms_once(self):
        with patch(SMS) as sms, self.captureOnCommitCallbacks(execute=True):
            payment = self.pay('22000')

        receipt = Receipt.objects.get(payment=payment)
        self.assertIsNotNone(receipt.sent_email_at)
        self.assertIsNotNone(receipt.sent_sms_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].attachments[0][0], 'RCT-000001.pdf')
        sms.assert_called_once()
        self.assertIn('RCT-000001', sms.call_args[0][1])

        ReceiptService.deliver(receipt)  # second delivery is a no-op
        self.assertEqual(len(mail.outbox), 1)
        sms.assert_called_once()

    def test_organization_can_turn_off_receipt_sms(self):
        self.org.settings = {'receipt_sms': False}
        self.org.save()
        with patch(SMS) as sms, self.captureOnCommitCallbacks(execute=True):
            self.pay('22000')
        sms.assert_not_called()
        self.assertEqual(len(mail.outbox), 1)


class ReceiptApiTests(ReceiptFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_tenant_downloads_own_receipt_pdf_but_not_others(self):
        with patch(SMS):
            payment = self.pay('22000')
        tenant = self.client_for(self.tenant_user)

        listing = tenant.get('/api/v1/receipts/')
        self.assertEqual([r['number'] for r in listing.data], ['RCT-000001'])
        pdf = tenant.get(f'/api/v1/receipts/{payment.receipt.id}/pdf/')
        self.assertEqual(pdf.status_code, 200)
        self.assertEqual(pdf['Content-Type'], 'application/pdf')
        self.assertTrue(pdf.content.startswith(b'%PDF'))

        stranger, _ = self.create_tenant(self.org, email='stranger@test.com')
        self.assertEqual(self.client_for(stranger).get(f'/api/v1/receipts/{payment.receipt.id}/pdf/').status_code, 404)

    def test_payments_list_shows_receipt_number(self):
        with patch(SMS):
            self.pay('22000')
        data = self.client_for(self.landlord).get('/api/v1/rent/payments/').data
        self.assertEqual(data[0]['receipt']['number'], 'RCT-000001')

    def test_resend_is_landlord_side_only(self):
        with patch(SMS):
            payment = self.pay('22000')
        url = f'/api/v1/receipts/{payment.receipt.id}/resend/'
        self.assertEqual(self.client_for(self.tenant_user).post(url).status_code, 403)
        with patch('rent.tasks.deliver_receipt_task.delay') as delay:
            self.assertEqual(self.client_for(self.landlord).post(url).status_code, 202)
        delay.assert_called_once()
