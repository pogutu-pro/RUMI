"""Phase 3d — financial reports, manual journals, suppliers, statement reconciliation."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from accounting.models import StatementLine, Supplier
from accounting.reports import ManualJournalService, ReconciliationService, ReportError, Reports
from accounting.services import ExpenseError, ExpenseService
from paybill.models import PaybillAccount
from paybill.services import PaybillService
from rent.models import Payment
from rent.services.invoicing import InvoiceService, LineSpec
from rumia_api.tests import RumiaTestFixtures

D = Decimal
TODAY = timezone.localdate()
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class ReportFixtures(RumiaTestFixtures):
    def setUp(self):
        self.sms = patch(SMS)
        self.sms.start()
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        _, tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, tenant)
        InvoiceService.create_invoice(self.tenancy, 'rent', [LineSpec('rent', D('20000'))],
                                      period_start=TODAY, period_end=TODAY, due_date=TODAY)
        InvoiceService.create_invoice(self.tenancy, 'deposit', [LineSpec('deposit', D('20000'))],
                                      period_start=TODAY, period_end=TODAY, due_date=TODAY)
        ExpenseService.record(self.org, parent_property=self.prop, category='repairs', description='Paint',
                              amount=D('5000'), expense_date=TODAY, paid_from='cash')

    def tearDown(self):
        self.sms.stop()

    def api(self):
        c = APIClient()
        c.force_authenticate(user=self.landlord)
        return c


class ReportTests(ReportFixtures):
    def test_trial_balance_balances(self):
        tb = Reports.trial_balance(self.org, TODAY)
        self.assertTrue(tb['balanced'])
        self.assertEqual(tb['total_debit'], tb['total_credit'])

    def test_income_statement(self):
        report = Reports.income_statement(self.org, TODAY, TODAY)
        self.assertEqual(report['total_income'], '20000.00')   # deposits are not income
        self.assertEqual(report['total_expenses'], '5000.00')
        self.assertEqual(report['net_income'], '15000.00')

    def test_balance_sheet_balances(self):
        bs = Reports.balance_sheet(self.org, TODAY)
        self.assertTrue(bs['balanced'], bs)
        self.assertEqual(bs['total_assets'], bs['total_liabilities_and_equity'])

    def test_manual_journal(self):
        ManualJournalService.post(self.org, TODAY, 'Owner capital injection',
                                  [{'account': '1010', 'debit': '100000'}, {'account': '3900', 'credit': '100000'}])
        self.assertTrue(Reports.balance_sheet(self.org, TODAY)['balanced'])
        with self.assertRaises(ReportError):
            ManualJournalService.post(self.org, TODAY, 'Bad', [{'account': '1010', 'debit': '1'}])
        with self.assertRaises(ReportError):
            ManualJournalService.post(self.org, TODAY, ' ', [])

    def test_report_api(self):
        c = self.api()
        for report in ('trial_balance', 'income_statement', 'balance_sheet', 'accounts'):
            self.assertEqual(c.get(f'/api/v1/accounting/reports/?report={report}').status_code, 200, report)
        self.assertEqual(c.get('/api/v1/accounting/reports/?report=nope').status_code, 400)


class SupplierTests(ReportFixtures):
    def test_supplier_on_expense_and_isolation(self):
        supplier = Supplier.objects.create(organization=self.org, name='Juma Hardware')
        expense = ExpenseService.record(self.org, supplier_ref=supplier, category='repairs', description='Taps',
                                        amount=D('900'), expense_date=TODAY, paid_from='cash')
        self.assertEqual(expense.supplier, 'Juma Hardware')
        _, _, other = self.create_landlord_with_org('o@test.com')
        foreign = Supplier.objects.create(organization=other, name='X')
        with self.assertRaises(ExpenseError):
            ExpenseService.record(self.org, supplier_ref=foreign, category='repairs', description='x',
                                  amount=D('1'), expense_date=TODAY, paid_from='cash')
        c = self.api()
        self.assertEqual(c.post('/api/v1/accounting/suppliers/', {'name': 'juma hardware'}, format='json').status_code, 400)


class ReconciliationTests(ReportFixtures):
    MPESA_CSV = (
        'Receipt No.,Completion Time,Details,Transaction Status,Paid In,Withdrawn,Balance\n'
        'QK11111111,{d} 10:00:00,Pay Bill from 2547****222 - John Kamau Acc. A101,Completed,"20,000.00",,1\n'
        'QK22222222,{d} 11:00:00,Pay Bill from 2547****333 - Unknown Acc. ZZ,Completed,1500.00,,1\n'
        'QK33333333,{d} 12:00:00,Withdrawal Charge,Completed,,30.00,1\n'
    )

    def upload(self):
        csv_bytes = self.MPESA_CSV.format(d=TODAY.strftime('%d/%m/%Y')).encode()
        return ReconciliationService.import_csv(
            self.org, '1020', SimpleUploadedFile('mpesa.csv', csv_bytes),
            {'date': 'Completion Time', 'amount': 'Paid In', 'reference': 'Receipt No.', 'description': 'Details'},
        )

    def test_import_matches_known_payment_and_queues_the_rest(self):
        paybill = PaybillAccount.objects.create(organization=self.org, shortcode='600999')
        PaybillService.ingest(paybill, {'TransID': 'QK11111111', 'TransAmount': '20000', 'BillRefNumber': 'A101',
                                        'BusinessShortCode': '600999', 'TransTime': TODAY.strftime('%Y%m%d%H%M%S')})
        statement = self.upload()
        statuses = dict(statement.lines.values_list('reference', 'status'))
        self.assertEqual(statuses, {'QK11111111': 'matched', 'QK22222222': 'unmatched'})  # withdrawal skipped

        again = self.upload()  # a re-import never matches the same payment twice
        self.assertEqual(again.lines.get(reference='QK11111111').status, 'unmatched')

    def test_assign_unmatched_line_creates_tenant_payment(self):
        statement = self.upload()
        line = statement.lines.get(reference='QK22222222')
        payment = ReconciliationService.assign(line, self.tenancy)
        self.assertEqual((payment.payment_method, payment.amount, payment.status), ('mpesa_paybill', D('1500.00'), 'success'))
        self.assertTrue(hasattr(payment, 'receipt'))
        with self.assertRaises(ReportError):
            ReconciliationService.assign(StatementLine.objects.get(pk=line.pk), self.tenancy)

    def test_bad_mapping_and_api(self):
        with self.assertRaises(ReportError):
            ReconciliationService.import_csv(self.org, '1020', SimpleUploadedFile('x.csv', b'a,b\n1,2\n'),
                                             {'date': 'Date', 'amount': 'Amount'})
        csv_bytes = self.MPESA_CSV.format(d=TODAY.strftime('%d/%m/%Y')).encode()
        response = self.api().post('/api/v1/accounting/reconciliation/', {
            'file': SimpleUploadedFile('m.csv', csv_bytes, content_type='text/csv'), 'account_code': '1020',
            'date_column': 'Completion Time', 'amount_column': 'Paid In', 'reference_column': 'Receipt No.',
            'description_column': 'Details',
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['unmatched'], 2)
        line_id = StatementLine.objects.filter(reference='QK22222222').first().id
        ignored = self.api().post(f'/api/v1/accounting/reconciliation/lines/{line_id}/ignore/', {'note': 'Own transfer'},
                                     format='json')
        self.assertEqual(ignored.data['status'], 'ignored')
