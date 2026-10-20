"""Phase 3a — expenses and landlord statements (reconciliation-first)."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APIClient

from accounting.models import Expense
from accounting.books import ExpenseError, ExpenseService, StatementService, month_bounds
from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from rent.models import Payment
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.payment_service import PaymentService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
SMS = 'rent.services.notifications.send_sms_via_africastalking'
TODAY = date.today()
MONTH_START, MONTH_END = month_bounds(TODAY.year, TODAY.month)
LAST_MONTH = MONTH_START - timedelta(days=1)


class StatementFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop1, unit1 = self.create_property_with_unit(self.org, name='Greenview')
        self.prop2, unit2 = self.create_property_with_unit(self.org, name='Hillside')
        _, tenant1 = self.create_tenant(self.org, email='t1@test.com')
        _, tenant2 = self.create_tenant(self.org, email='t2@test.com')
        self.t1 = self.create_tenancy(self.org, self.prop1, unit1, tenant1)
        self.t2 = self.create_tenancy(self.org, self.prop2, unit2, tenant2)

        # Last month: T1 billed and never paid → opening balance this month.
        self.rent(self.t1, '22000', LAST_MONTH.replace(day=1))
        # This month.
        self.t1_now = self.rent(self.t1, '22000', MONTH_START)
        self.rent(self.t2, '15000', MONTH_START)
        InvoiceService.issue_credit_note(self.t1_now, '1000', 'Goodwill')
        self.pay(self.t1, '30000', 'P-T1', method='cash')
        ExpenseService.record(self.org, parent_property=self.prop1, category='repairs', description='Roof leak',
                              amount=D('5000'), incurred_on=TODAY, paid_from='bank_transfer')
        voided = ExpenseService.record(self.org, category='other', description='Typo', amount=D('999'),
                                       incurred_on=TODAY, paid_from='cash')
        ExpenseService.void(voided, 'Entered twice')

    def rent(self, tenancy, amount, start):
        return InvoiceService.create_invoice(
            tenancy, 'rent', [LineSpec('rent', D(amount))], period_start=start, period_end=start,
            due_date=start, issue_date=start,
        )

    def pay(self, tenancy, amount, ref, method='cash'):
        payment = Payment.objects.create(
            organization=self.org, tenancy=tenancy, tenant=tenancy.tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=D(amount), payment_method=method, provider='manual', internal_reference=ref,
        )
        with patch(SMS):
            return PaymentService.record_manual_payment(payment)

    def owed(self, tenancy, as_of):
        return (LedgerService.balance(self.org, chart.TENANT_RECEIVABLES, as_of=as_of, tenancy=tenancy)
                - LedgerService.balance(self.org, chart.TENANT_PREPAYMENTS, as_of=as_of, tenancy=tenancy))


class StatementTests(StatementFixtures):
    def test_month_statement_reconciles(self):
        s = StatementService.build(self.org, MONTH_START, MONTH_END)

        self.assertEqual(s.received_by_channel, {'Cash': D('30000.00')})
        self.assertEqual(s.expenses_by_category, {'Repairs and maintenance': D('5000.00')})  # void excluded
        self.assertEqual(s.net_cash, D('25000.00'))
        self.assertEqual(s.income_by_type, {'Rent income': D('37000.00')})
        self.assertEqual(s.waivers, D('1000.00'))

        rows = {r.tenancy_id: r for r in s.tenants}
        r1, r2 = rows[str(self.t1.id)], rows[str(self.t2.id)]
        self.assertEqual((r1.opening, r1.invoiced, r1.credited, r1.paid, r1.closing),
                         (D('22000.00'), D('22000.00'), D('1000.00'), D('30000.00'), D('13000.00')))
        self.assertEqual((r2.opening, r2.invoiced, r2.paid, r2.closing),
                         (D('0.00'), D('15000.00'), D('0.00'), D('15000.00')))
        for tenancy, row in ((self.t1, r1), (self.t2, r2)):
            self.assertEqual(row.closing, self.owed(tenancy, MONTH_END))
            self.assertEqual(row.opening, self.owed(tenancy, MONTH_START - timedelta(days=1)))
        self.assertEqual((s.owed_opening, s.owed_closing), (D('22000.00'), D('28000.00')))
        assert_ledger_balanced(self)

    def test_property_filter(self):
        s = StatementService.build(self.org, MONTH_START, MONTH_END, property_obj=self.prop2)
        self.assertEqual([r.tenancy_id for r in s.tenants], [str(self.t2.id)])
        self.assertEqual(s.received_total, D('0'))
        self.assertEqual(s.expenses_total, D('0'))

    def test_reversal_in_period_shows_and_still_reconciles(self):
        payment = Payment.objects.get(internal_reference='P-T1')
        PaymentService.reverse_payment(payment, reason='Bounced')
        s = StatementService.build(self.org, MONTH_START, MONTH_END)
        r1 = next(r for r in s.tenants if r.tenancy_id == str(self.t1.id))
        self.assertEqual(r1.reversed, D('30000.00'))
        self.assertEqual(r1.closing, self.owed(self.t1, MONTH_END))
        self.assertEqual(s.received_by_channel, {})

    def test_deposit_paid_from_deposit_and_refund(self):
        from rent.services.deposits import DepositService

        DepositService.record_held(self.t2, '15000', method='cash')
        settlement = DepositService.create_settlement(self.t2)  # arrears 15000 → entire deposit
        DepositService.approve(settlement)
        DepositService.record_refund(settlement, 'cash')
        s = StatementService.build(self.org, MONTH_START, MONTH_END)
        r2 = next(r for r in s.tenants if r.tenancy_id == str(self.t2.id))
        self.assertEqual(r2.paid_from_deposit, D('15000.00'))
        self.assertEqual(r2.closing, self.owed(self.t2, MONTH_END))
        self.assertEqual(s.deposits_held_closing, D('0.00'))

    def test_pdf(self):
        pdf = StatementService.render_pdf(StatementService.build(self.org, MONTH_START, MONTH_END))
        self.assertTrue(pdf.startswith(b'%PDF'))


class ExpenseTests(StatementFixtures):
    def test_expense_posts_and_void_reverses(self):
        self.assertEqual(LedgerService.balance(self.org, chart.REPAIRS_AND_MAINTENANCE), D('5000.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.OTHER_EXPENSES), D('0.00'))
        voided = Expense.objects.get(description='Typo')
        with self.assertRaises(ExpenseError):
            ExpenseService.void(voided, 'again')
        with self.assertRaises(ExpenseError):
            ExpenseService.void(Expense.objects.get(description='Roof leak'), '  ')

    def test_cannot_book_expense_on_another_organizations_property(self):
        _, _, other = self.create_landlord_with_org('other@test.com')
        with self.assertRaises(ExpenseError):
            ExpenseService.record(other, parent_property=self.prop1, category='repairs', description='x',
                                  amount=D('1'), incurred_on=TODAY, paid_from='cash')


class ApiTests(StatementFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_statement_api_json_and_pdf(self):
        client = self.client_for(self.landlord)
        month = f'{TODAY:%Y-%m}'
        data = client.get(f'/api/v1/accounting/statements/?month={month}').data
        self.assertEqual(data['cash']['net_cash'], '25000.00')
        self.assertEqual(len(data['tenants']), 2)
        pdf = client.get(f'/api/v1/accounting/statements/?month={month}&export=pdf')
        self.assertEqual(pdf['Content-Type'], 'application/pdf')
        self.assertEqual(client.get('/api/v1/accounting/statements/?month=bad').status_code, 400)

    def test_expenses_api_books_create_edit_and_void(self):
        client = self.client_for(self.landlord)
        created = client.post('/api/v1/accounting/expenses/', {
            'property': str(self.prop2.id), 'category': 'security', 'description': 'Guard, May',
            'amount': '12000.00', 'incurred_on': TODAY.isoformat(), 'paid_from': 'mpesa_paybill',
        }, format='json')
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(LedgerService.balance(self.org, chart.SECURITY_AND_CLEANING, parent_property=self.prop2), D('12000.00'))
        self.assertEqual(client.get('/api/v1/accounting/expenses/').data['count'], 2)  # voided one hidden

        edited = client.patch(f'/api/v1/accounting/expenses/{created.data["id"]}/', {'amount': '10000'}, format='json')
        self.assertEqual(edited.status_code, 200, edited.data)
        self.assertEqual(LedgerService.balance(self.org, chart.SECURITY_AND_CLEANING, parent_property=self.prop2), D('10000.00'))  # old entry reversed, new one posted
        client.patch(f'/api/v1/accounting/expenses/{created.data["id"]}/', {'vendor': 'Guards Ltd'}, format='json')
        self.assertEqual(len(LedgerService.entries_for('expense', created.data['id'])), 2)  # no money change, no repost

        voided = client.delete(f'/api/v1/accounting/expenses/{created.data["id"]}/?reason=Wrong%20month')
        self.assertTrue(voided.data['is_void'])
        self.assertEqual(LedgerService.balance(self.org, chart.SECURITY_AND_CLEANING, parent_property=self.prop2), D('0.00'))

    def test_only_owners(self):
        tenant_user = self.t1.tenant.user
        self.assertEqual(self.client_for(tenant_user).get('/api/v1/accounting/expenses/').status_code, 403)
        intruder, _, _ = self.create_landlord_with_org('intruder@test.com')
        response = self.client_for(intruder).get(
            f'/api/v1/accounting/statements/?month={TODAY:%Y-%m}&property_id={self.prop1.id}',
        )
        self.assertEqual(response.status_code, 404)
