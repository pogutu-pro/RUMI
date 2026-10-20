"""Phase 3b — agency: owners, commissions, owner statements, remittances, advances."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from rest_framework.test import APIClient

from accounting.services import ExpenseService, month_bounds
from agency.models import PropertyOwner
from agency.services import AgencyError, OwnerStatementService, OwnerTransactionService
from ledger.tests import assert_ledger_balanced
from rent.models import Payment
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.payment_service import PaymentService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
TODAY = date.today()
START, END = month_bounds(TODAY.year, TODAY.month)
MONTH = f'{TODAY:%Y-%m}'
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class AgencyFixtures(RumiaTestFixtures):
    def setUp(self):
        self.agent, _, self.org = self.create_landlord_with_org()
        self.owner = PropertyOwner.objects.create(
            organization=self.org, full_name='Mama Wanjiru', email='owner@test.com',
            management_fee_percent=D('10'), letting_fee_percent=D('50'),
        )
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.prop.owner = self.owner
        self.prop.save()
        _, tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, tenant)
        self.tenancy.start_date = START  # new tenancy this month → letting fee
        self.tenancy.save()

        invoice = InvoiceService.create_invoice(self.tenancy, 'rent', [LineSpec('rent', D('20000'))],
                                                period_start=START, period_end=END, due_date=START)
        InvoiceService.create_invoice(self.tenancy, 'deposit', [LineSpec('deposit', D('20000'))],
                                      period_start=START, period_end=START, due_date=START)
        payment = Payment.objects.create(organization=self.org, tenancy=self.tenancy, tenant=tenant,
                                         amount=D('40000'), payment_method='cash', provider='manual',
                                         internal_reference='AG-1')
        with patch(SMS):
            PaymentService.record_manual_payment(payment)
        ExpenseService.record(self.org, parent_property=self.prop, category='repairs', description='Plumbing',
                              amount=D('3000'), expense_date=TODAY, paid_from='cash')
        self.invoice = invoice


class OwnerStatementTests(AgencyFixtures):
    def test_compute_excludes_deposits_and_applies_commissions(self):
        f = OwnerStatementService.compute(self.owner, START, END)
        t = f['totals']
        # Collected rent only (the deposit stays held for the tenant).
        self.assertEqual(t['collected'], '20000.00')
        self.assertEqual(t['expenses'], '3000.00')
        self.assertEqual(t['management_fee'], '2000.00')   # 10%
        self.assertEqual(t['letting_fee'], '11000.00')     # 50% of 22000 monthly rent
        self.assertEqual(t['net'], '4000.00')

    def test_approve_posts_payable_and_remittance_clears_it(self):
        with patch(SMS):
            statement = OwnerStatementService.approve(self.owner, START, END, approved_by=self.agent)
        self.assertEqual(statement.number, 'OST-000001')
        self.assertEqual(OwnerStatementService.balance(self.owner), D('4000.00'))
        with self.assertRaises(AgencyError):
            OwnerStatementService.approve(self.owner, START, END)  # overlapping period

        OwnerTransactionService.record(self.owner, 'remittance', '4000', TODAY, method='bank_transfer', reference='FT1')
        self.assertEqual(OwnerStatementService.balance(self.owner), D('0.00'))
        assert_ledger_balanced(self)

    def test_advance_and_fee_make_balance_negative_until_next_statement(self):
        OwnerTransactionService.record(self.owner, 'advance', '10000', TODAY, method='mpesa_paybill')
        OwnerTransactionService.record(self.owner, 'advance_fee', '500', TODAY)
        self.assertEqual(OwnerStatementService.balance(self.owner), D('-10500.00'))
        f = OwnerStatementService.compute(self.owner, START, END)
        self.assertEqual(f['closing_balance'], '-6500.00')  # −10500 + 4000 net due
        with self.assertRaises(AgencyError):
            OwnerTransactionService.record(self.owner, 'remittance', '1', TODAY, method='')
        assert_ledger_balanced(self)

    def test_pdf(self):
        statement = OwnerStatementService.approve(self.owner, START, END)
        self.assertTrue(OwnerStatementService.render_pdf(statement).startswith(b'%PDF'))


class AgencyApiTests(AgencyFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_owner_crud_preview_approve_email_and_transactions(self):
        client = self.client_for(self.agent)
        created = client.post('/api/v1/agency/owners/', {'full_name': 'Bwana Otieno', 'management_fee_percent': '8'},
                              format='json')
        self.assertEqual(created.status_code, 201, created.data)
        owners = client.get('/api/v1/agency/owners/').data
        self.assertEqual({o['full_name'] for o in owners}, {'Mama Wanjiru', 'Bwana Otieno'})

        preview = client.get(f'/api/v1/agency/owners/{self.owner.id}/statement-preview/?month={MONTH}')
        self.assertEqual(preview.data['totals']['net'], '4000.00')

        approved = client.post(f'/api/v1/agency/owners/{self.owner.id}/statements/', {'month': MONTH}, format='json')
        self.assertEqual(approved.status_code, 201, approved.data)
        self.assertIsNotNone(approved.data['emailed_at'])
        self.assertEqual(mail.outbox[-1].attachments[0][0], 'OST-000001.pdf')
        self.assertEqual(client.get(f'/api/v1/agency/statements/{approved.data["id"]}/pdf/')['Content-Type'],
                         'application/pdf')

        paid = client.post(f'/api/v1/agency/owners/{self.owner.id}/transactions/', {
            'kind': 'remittance', 'amount': '4000.00', 'transaction_date': TODAY.isoformat(), 'method': 'bank_transfer',
        }, format='json')
        self.assertEqual(paid.status_code, 201, paid.data)
        self.assertEqual(client.get(f'/api/v1/agency/owners/{self.owner.id}/').data['balance'], '0.00')

    def test_property_owner_must_be_same_organization(self):
        _, _, other = self.create_landlord_with_org('other@test.com')
        stranger = PropertyOwner.objects.create(organization=other, full_name='X')
        response = self.client_for(self.agent).patch(f'/api/v1/properties/{self.prop.id}/', {'owner': str(stranger.id)},
                                                     format='json')
        self.assertEqual(response.status_code, 400)

    def test_tenants_and_other_orgs_blocked(self):
        tenant_user = self.tenancy.tenant.user
        self.assertEqual(self.client_for(tenant_user).get('/api/v1/agency/owners/').status_code, 403)
        intruder, _, _ = self.create_landlord_with_org('intruder@test.com')
        self.assertEqual(self.client_for(intruder).get(f'/api/v1/agency/owners/{self.owner.id}/').status_code, 404)
