"""Phase 1h — deposits: invoicing, recording held deposits, move-out settlement, ledger."""

from datetime import date
from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APIClient

from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from rent.models import Invoice, Payment
from rent.services.deposits import DepositError, DepositService
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.payment_service import PaymentService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class DepositFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)  # deposit 22000

    def held(self):
        return LedgerService.balance(self.org, chart.DEPOSITS_HELD, tenancy=self.tenancy)

    def pay(self, amount, ref):
        payment = Payment.objects.create(
            organization=self.org, tenancy=self.tenancy, tenant=self.tenant, amount=D(amount),
            payment_method='cash', provider='manual', internal_reference=ref,
        )
        with patch(SMS):
            return PaymentService.record_manual_payment(payment)

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class DepositServiceTests(DepositFixtures):
    def test_deposit_invoice_paid_is_held_not_income(self):
        DepositService.issue_invoice(self.tenancy)
        self.pay('22000', 'DEP-PAY')

        summary = DepositService.summary(self.tenancy)
        self.assertEqual(summary['paid'], D('22000.00'))
        self.assertEqual(summary['held'], D('22000.00'))
        self.assertEqual(summary['to_invoice'], D('0.00'))
        self.assertEqual(self.held(), D('22000.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.RENT_INCOME), D('0.00'))
        with self.assertRaises(DepositError):
            DepositService.issue_invoice(self.tenancy)  # nothing left to invoice

    def test_record_held_creates_paid_invoice_without_sending_receipt(self):
        with patch(SMS) as sms, self.captureOnCommitCallbacks(execute=True):
            payment = DepositService.record_held(self.tenancy, '22000', method='bank_transfer', reference='FT123')
        sms.assert_not_called()
        self.assertTrue(hasattr(payment, 'receipt'))
        self.assertEqual(Invoice.objects.get(tenancy=self.tenancy, invoice_type='deposit').status, 'paid')
        self.assertEqual(LedgerService.balance(self.org, chart.BANK), D('22000.00'))

    def test_full_move_out_settlement_lifecycle(self):
        DepositService.issue_invoice(self.tenancy)
        self.pay('22000', 'DEP-PAY')
        rent = InvoiceService.create_invoice(
            self.tenancy, 'rent', [LineSpec('rent', D('5000'))],
            period_start=date(2026, 5, 1), period_end=date(2026, 5, 31), due_date=date(2026, 5, 5),
        )

        settlement = DepositService.create_settlement(
            self.tenancy, deductions=[{'kind': 'damages', 'description': 'Broken door', 'amount': '3000'}],
        )
        kinds = sorted((d.kind, d.amount) for d in settlement.deductions.all())
        self.assertEqual(kinds, [('arrears', D('5000.00')), ('damages', D('3000.00'))])
        self.assertEqual(settlement.refund_amount, D('14000.00'))

        DepositService.approve(settlement, approved_by=self.landlord)
        rent.refresh_from_db()
        self.assertEqual(rent.status, 'paid')
        self.assertEqual(LedgerService.balance(self.org, chart.OTHER_INCOME), D('3000.00'))
        self.assertEqual(self.held(), D('14000.00'))

        DepositService.record_refund(settlement, 'mpesa_paybill', reference='QK12AB')
        settlement.refresh_from_db()
        self.assertEqual(settlement.status, 'refunded')
        self.assertEqual(self.held(), D('0.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.MPESA_PAYBILL), D('-14000.00'))
        self.assertEqual(DepositService.summary(self.tenancy)['held'], D('0.00'))
        assert_ledger_balanced(self)

    def test_uncollected_deposit_is_closed_on_approval(self):
        DepositService.issue_invoice(self.tenancy)
        self.pay('10000', 'PART')  # only part of the deposit ever paid
        settlement = DepositService.create_settlement(self.tenancy, include_arrears=False)
        self.assertEqual(settlement.held_amount, D('10000.00'))
        DepositService.approve(settlement)
        deposit = Invoice.objects.get(tenancy=self.tenancy, invoice_type='deposit')
        self.assertEqual(deposit.outstanding, D('0.00'))
        DepositService.record_refund(settlement, 'cash')
        self.assertEqual(self.held(), D('0.00'))
        assert_ledger_balanced(self)

    def test_settlement_guards(self):
        DepositService.issue_invoice(self.tenancy)
        self.pay('22000', 'DEP-PAY')
        with self.assertRaises(DepositError):
            DepositService.create_settlement(
                self.tenancy, deductions=[{'kind': 'damages', 'description': 'x', 'amount': '30000'}],
            )
        settlement = DepositService.create_settlement(self.tenancy)
        with self.assertRaises(DepositError):
            DepositService.create_settlement(self.tenancy)  # one at a time
        with self.assertRaises(DepositError):
            DepositService.record_refund(settlement, 'cash')  # not approved yet
        DepositService.cancel(settlement)
        DepositService.create_settlement(self.tenancy)  # allowed after cancelling the draft


class DepositApiTests(DepositFixtures):
    def test_new_tenancy_gets_deposit_invoice_by_default(self):
        _, unit = self.create_property_with_unit(self.org, name='Annex')
        _, tenant = self.create_tenant(self.org, email='new@test.com')
        with patch('rumia_api.views.onboard_tenant_user'):
            response = self.client_for(self.landlord).post('/api/v1/tenancies/', {
                'unit': str(unit.id), 'tenant': str(tenant.id), 'start_date': '2026-06-01',
                'monthly_rent': '15000.00', 'deposit': '15000.00', 'rent_due_day': 5, 'status': 'active',
            }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        invoice = Invoice.objects.get(tenancy_id=response.data['id'], invoice_type='deposit')
        self.assertEqual(invoice.amount_due, D('15000.00'))

    def test_new_tenancy_deposit_already_paid_or_none(self):
        _, unit = self.create_property_with_unit(self.org, name='Annex')
        _, tenant = self.create_tenant(self.org, email='new@test.com')
        payload = {
            'unit': str(unit.id), 'tenant': str(tenant.id), 'start_date': '2026-06-01',
            'monthly_rent': '15000.00', 'deposit': '15000.00', 'rent_due_day': 5, 'status': 'pending',
        }
        client = self.client_for(self.landlord)
        bad = client.post('/api/v1/tenancies/', {**payload, 'deposit_handling': 'maybe'}, format='json')
        self.assertEqual(bad.status_code, 400)
        with patch('rumia_api.views.onboard_tenant_user'):
            paid = client.post('/api/v1/tenancies/', {**payload, 'deposit_handling': 'already_paid'}, format='json')
        self.assertEqual(Invoice.objects.get(tenancy_id=paid.data['id'], invoice_type='deposit').status, 'paid')

    def test_settlement_endpoints(self):
        client = self.client_for(self.landlord)
        record = client.post(
            f'/api/v1/tenancies/{self.tenancy.id}/deposit/record-held/', {'amount': '22000.00'}, format='json',
        )
        self.assertEqual(record.status_code, 201, record.data)
        self.assertEqual(record.data['held'], '22000.00')

        draft = client.post(f'/api/v1/tenancies/{self.tenancy.id}/deposit/settlements/', {
            'deductions': [{'kind': 'cleaning', 'description': 'Deep clean', 'amount': '2000.00'}],
        }, format='json')
        self.assertEqual(draft.status_code, 201, draft.data)
        self.assertEqual(draft.data['refund_amount'], '20000.00')
        sid = draft.data['id']

        tenant = self.client_for(self.tenant_user)
        self.assertEqual(tenant.get(f'/api/v1/deposit-settlements/{sid}/').status_code, 200)
        self.assertEqual(tenant.post(f'/api/v1/deposit-settlements/{sid}/approve/').status_code, 403)

        self.assertEqual(client.post(f'/api/v1/deposit-settlements/{sid}/approve/').data['status'], 'approved')
        refunded = client.post(f'/api/v1/deposit-settlements/{sid}/refund/', {'method': 'cash'}, format='json')
        self.assertEqual(refunded.data['status'], 'refunded')

        summary = client.get(f'/api/v1/tenancies/{self.tenancy.id}/deposit/')
        self.assertEqual(summary.data['held'], '0.00')
        self.assertEqual(len(summary.data['settlements']), 1)
