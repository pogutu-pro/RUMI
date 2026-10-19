"""Phase 1c — allocation order, tenant credit, ledger posting of payments, H1–H3, backfill."""

from datetime import date, timedelta
from decimal import Decimal
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from ledger.models import JournalEntry
from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from rent.models import Invoice, Payment, PaymentAllocation
from rent.providers.base import VerifyPaymentResult
from rent.providers.paystack import PaystackProvider
from rent.services.allocation import AllocationError, AllocationService
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.payment_service import PaymentService
from rent.services.rent_generation import RentChargeGenerationService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
TODAY = date.today()


class AllocationFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)

    def invoice(self, amount, due, invoice_type='adhoc', line_type='repair', tenancy=None):
        return InvoiceService.create_invoice(
            tenancy or self.tenancy, invoice_type, [LineSpec(line_type, D(amount))],
            period_start=due, period_end=due, due_date=due,
        )

    def cash(self, amount, ref, tenancy=None, allocations=None):
        tenancy = tenancy or self.tenancy
        payment = Payment.objects.create(
            organization=tenancy.organization, tenancy=tenancy, tenant=tenancy.tenant,
            amount=D(amount), payment_method='cash', provider='manual', internal_reference=ref,
        )
        return PaymentService.record_manual_payment(payment, allocations=allocations)

    def balance(self, code, **dims):
        return LedgerService.balance(self.org, code, **dims)


class AllocationOrderTests(AllocationFixtures):
    def test_oldest_due_first_then_type_priority(self):
        later = self.invoice('1000', TODAY + timedelta(days=5))
        penalty = self.invoice('100', TODAY, invoice_type='penalty', line_type='penalty')
        rent = self.invoice('1000', TODAY, invoice_type='rent', line_type='rent')
        deposit = self.invoice('500', TODAY, invoice_type='deposit', line_type='deposit')

        self.cash('1700', 'ORDER-1')

        for inv in (later, penalty, rent, deposit):
            inv.refresh_from_db()
        self.assertEqual(deposit.status, 'paid')
        self.assertEqual(rent.status, 'paid')
        self.assertEqual(penalty.amount_paid, D('100.00'))
        self.assertEqual(later.amount_paid, D('100.00'))
        assert_ledger_balanced(self)

    def test_disputed_invoice_is_skipped_by_auto_allocation(self):
        disputed = self.invoice('1000', TODAY - timedelta(days=3))
        InvoiceService.set_disputed(disputed, True)
        other = self.invoice('1000', TODAY)

        self.cash('1000', 'DISPUTE-1')

        disputed.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(disputed.amount_paid, D('0.00'))
        self.assertEqual(other.status, 'paid')


class TenantCreditTests(AllocationFixtures):
    def test_overpayment_keeps_remainder_as_credit(self):
        invoice = self.invoice('1000', TODAY)
        payment = self.cash('1500', 'OVER-1')

        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'paid')
        self.assertEqual(payment.unapplied_amount, D('500.00'))
        self.assertEqual(self.balance(chart.TENANT_PREPAYMENTS, tenancy=self.tenancy), D('500.00'))
        self.assertEqual(self.balance(chart.TENANT_RECEIVABLES, tenancy=self.tenancy), D('0.00'))
        self.assertEqual(self.balance(chart.CASH_ON_HAND), D('1500.00'))
        assert_ledger_balanced(self)

    def test_advance_payment_is_applied_when_next_invoice_is_issued(self):
        """Audit H1: previously this money was recorded as success and credited to nothing."""
        payment = self.cash('22000', 'ADVANCE-1')
        self.assertEqual(payment.unapplied_amount, D('22000.00'))

        RentChargeGenerationService.generate_for_tenancy(self.tenancy)

        payment.refresh_from_db()
        first = Invoice.objects.filter(tenancy=self.tenancy).order_by('period_start').first()
        self.assertEqual(first.status, 'paid')
        self.assertEqual(payment.unapplied_amount, D('0.00'))
        self.assertEqual(AllocationService.credit_balance(tenancy=self.tenancy), D('0.00'))
        assert_ledger_balanced(self)

    def test_credit_from_several_payments_applies_oldest_money_first(self):
        first = self.cash('300', 'CR-1')
        second = self.cash('300', 'CR-2')
        self.invoice('400', TODAY)

        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(first.unapplied_amount, D('0.00'))
        self.assertEqual(second.unapplied_amount, D('200.00'))


class AllocationGuardTests(AllocationFixtures):
    def test_cannot_over_allocate_payment_or_invoice(self):
        invoice = self.invoice('1000', TODAY)
        payment = self.cash('500', 'GUARD-1', allocations=[])  # explicit empty list → auto allocate
        payment.refresh_from_db()
        self.assertEqual(payment.unapplied_amount, D('0.00'))

        extra = self.cash('2000', 'GUARD-2')
        extra.refresh_from_db()
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'paid')
        with self.assertRaises(AllocationError):
            AllocationService.allocate(extra, invoice, '1')  # invoice already paid
        with self.assertRaises(AllocationError):
            AllocationService.allocate(extra, self.invoice('5000', TODAY), '1500.01')  # more than unapplied

    def test_explicit_allocation_over_outstanding_is_rejected_and_rolled_back(self):
        """Audit H2: used to be an IntegrityError 500."""
        invoice = self.invoice('1000', TODAY)
        with self.assertRaises(ValueError):
            self.cash('1500', 'H2-1', allocations=[{'invoice_id': invoice.id, 'amount': '1500'}])
        self.assertFalse(Payment.objects.filter(internal_reference='H2-1', status='success').exists())
        self.assertEqual(PaymentAllocation.objects.count(), 0)

    def test_cross_tenancy_allocation_rejected(self):
        _, other_tenant = self.create_tenant(self.org, email='other@test.com')
        _, other_unit = self.create_property_with_unit(self.org, name='Annex')
        other_tenancy = self.create_tenancy(self.org, self.prop, other_unit, other_tenant)
        other_invoice = self.invoice('1000', TODAY, tenancy=other_tenancy)
        payment = self.cash('1000', 'X-1')
        with self.assertRaises(AllocationError):
            AllocationService.allocate(payment, other_invoice, '100')


class ReversalLedgerTests(AllocationFixtures):
    def test_reversal_unwinds_ledger_and_restores_balance(self):
        invoice = self.invoice('1000', TODAY)
        payment = self.cash('1200', 'REV-1')

        PaymentService.reverse_payment(payment, reversed_by=self.landlord, reason='Cheque bounced')

        invoice.refresh_from_db()
        self.assertEqual(payment.status, 'reversed')
        self.assertEqual(invoice.outstanding, D('1000.00'))
        self.assertEqual(self.balance(chart.TENANT_RECEIVABLES, tenancy=self.tenancy), D('1000.00'))
        self.assertEqual(self.balance(chart.TENANT_PREPAYMENTS, tenancy=self.tenancy), D('0.00'))
        self.assertEqual(self.balance(chart.CASH_ON_HAND), D('0.00'))
        assert_ledger_balanced(self)


class PaystackSettlementTests(AllocationFixtures):
    def _processing_payment(self, amount='1000.00'):
        return Payment.objects.create(
            organization=self.org, tenancy=self.tenancy, tenant=self.tenant, amount=D(amount),
            payment_method='paystack', provider='paystack', internal_reference='PSK-1', status='processing',
        )

    def test_amount_mismatch_is_disputed_and_not_allocated(self):
        """Audit H3."""
        invoice = self.invoice('1000', TODAY)
        payment = self._processing_payment()
        result = VerifyPaymentResult(success=True, status='success', amount=D('100.00'), provider_reference='PSK-1')
        with patch.object(PaystackProvider, 'verify_payment', return_value=result):
            payment = PaymentService.verify_and_allocate(payment, raw_callback={})

        invoice.refresh_from_db()
        self.assertEqual(payment.status, 'disputed')
        self.assertIn('100.00', payment.notes)
        self.assertEqual(invoice.amount_paid, D('0.00'))
        self.assertFalse(JournalEntry.objects.filter(source_type='payment').exists())

    def test_matching_settlement_posts_to_paystack_clearing(self):
        self.invoice('1000', TODAY)
        payment = self._processing_payment()
        result = VerifyPaymentResult(
            success=True, status='success', amount=D('1000.00'), provider_reference='PSK-1',
            raw_response={'data': {'currency': 'KES'}},
        )
        with patch.object(PaystackProvider, 'verify_payment', return_value=result):
            payment = PaymentService.verify_and_allocate(payment, raw_callback={})

        self.assertEqual(payment.status, 'success')
        self.assertEqual(self.balance(chart.PAYSTACK_CLEARING), D('1000.00'))
        self.assertEqual(self.balance(chart.TENANT_RECEIVABLES, tenancy=self.tenancy), D('0.00'))

    def test_currency_mismatch_is_disputed(self):
        payment = self._processing_payment()
        result = VerifyPaymentResult(
            success=True, status='success', amount=D('1000.00'), provider_reference='PSK-1',
            raw_response={'data': {'currency': 'NGN'}},
        )
        with patch.object(PaystackProvider, 'verify_payment', return_value=result):
            payment = PaymentService.verify_and_allocate(payment, raw_callback={})
        self.assertEqual(payment.status, 'disputed')


class BalanceApiTests(AllocationFixtures):
    def test_balance_endpoint_reports_credit_and_net(self):
        self.invoice('1000', TODAY - timedelta(days=1))
        self.cash('600', 'BAL-1')
        _, other_unit = self.create_property_with_unit(self.org, name='Annex')
        _, other_tenant = self.create_tenant(self.org, email='neighbour@test.com')
        neighbour = self.create_tenancy(self.org, self.prop, other_unit, other_tenant)
        self.cash('999', 'NEIGHBOUR-CREDIT', tenancy=neighbour)

        client = APIClient()
        client.force_authenticate(user=self.tenant_user)
        data = client.get('/api/v1/rent/balance/').data

        self.assertEqual(data['outstanding_total'], '400.00')
        self.assertEqual(data['credit_total'], '0.00')

        self.cash('1000', 'BAL-2')
        data = client.get('/api/v1/rent/balance/').data
        self.assertEqual(data['outstanding_total'], '0.00')
        self.assertEqual(data['credit_total'], '600.00')
        self.assertEqual(data['net_balance'], '-600.00')

    def test_manual_payment_api_rejects_bad_allocation_without_orphan_row(self):
        invoice = self.invoice('1000', TODAY)
        Invoice.objects.filter(pk=invoice.pk).update(amount_paid=D('900.00'))  # simulate race: only 100 left
        client = APIClient()
        client.force_authenticate(user=self.landlord)
        with patch('rumia_api.serializers.ManualPaymentSerializer.validate', side_effect=lambda attrs: attrs):
            response = client.post('/api/v1/rent/payments/manual/', {
                'tenancy': str(self.tenancy.id), 'amount': '500.00', 'payment_method': 'cash',
                'rent_charge_id': str(invoice.id),
            }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Payment.objects.exists())


class LedgerBackfillTests(AllocationFixtures):
    def test_backfill_posts_legacy_rows_reconciles_and_is_idempotent(self):
        # Legacy-style rows created directly, bypassing the services (as before Phase 1).
        legacy = Invoice.objects.create(
            organization=self.org, tenancy=self.tenancy, parent_property=self.prop, unit=self.unit,
            tenant=self.tenant, invoice_type='rent', number='INV-900001', issue_date=TODAY,
            period_start=TODAY, period_end=TODAY, due_date=TODAY, amount_due=D('1000.00'),
        )
        legacy.lines.create(line_type='rent', unit_price=D('1000.00'), amount=D('1000.00'))
        payment = Payment.objects.create(
            organization=self.org, tenancy=self.tenancy, tenant=self.tenant, amount=D('1200.00'),
            payment_method='cash', provider='manual', internal_reference='LEGACY-1', status='success',
            paid_at=timezone.now(), unapplied_amount=D('200.00'),
        )
        PaymentAllocation.objects.create(payment=payment, invoice=legacy, amount=D('1000.00'))
        legacy.recalculate_status()
        legacy.save()

        with self.assertRaises(Exception):
            call_command('ledger_backfill', '--check', stdout=StringIO(), stderr=StringIO())

        call_command('ledger_backfill', stdout=StringIO(), stderr=StringIO())
        entries = JournalEntry.objects.count()
        call_command('ledger_backfill', stdout=StringIO(), stderr=StringIO())

        self.assertEqual(JournalEntry.objects.count(), entries)
        self.assertEqual(self.balance(chart.TENANT_PREPAYMENTS, tenancy=self.tenancy), D('200.00'))
        self.assertEqual(self.balance(chart.TENANT_RECEIVABLES, tenancy=self.tenancy), D('0.00'))
        assert_ledger_balanced(self)
