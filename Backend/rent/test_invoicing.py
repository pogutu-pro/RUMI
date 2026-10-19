"""Phase 1b — invoices, lines, numbering, credit notes, disputes, and their API."""

from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APIClient

from accounts.models import CaretakerProfile, LandlordProfile
from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from organizations.models import OrganizationMembership
from properties.models import CaretakerPropertyAssignment
from rent.models import CreditNote, Invoice
from rent.services.invoicing import InvoiceError, InvoiceService, LineSpec
from rent.services.rent_generation import RentChargeGenerationService
from rumia_api.tests import RumiaTestFixtures, User

D = Decimal


class InvoiceFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)

    def make_invoice(self, invoice_type='adhoc', lines=None, due=None, tenancy=None):
        due = due or date.today() + timedelta(days=10)
        return InvoiceService.create_invoice(
            tenancy or self.tenancy,
            invoice_type,
            [LineSpec('repair', D('1500'), description='Broken window')] if lines is None else lines,
            period_start=date.today(),
            period_end=due,
            due_date=due,
        )

    def receivable(self, tenancy=None):
        return LedgerService.balance(self.org, chart.TENANT_RECEIVABLES, tenancy=tenancy or self.tenancy)


class InvoiceServiceTests(InvoiceFixtures):
    def test_invoice_has_number_lines_total_and_posts_journal(self):
        invoice = self.make_invoice(lines=[
            LineSpec('service_charge', D('2000')),
            LineSpec('water', D('120'), quantity=D('5'), description='5 units'),
        ])

        self.assertEqual(invoice.number, 'INV-000001')
        self.assertEqual(invoice.amount_due, D('2600.00'))
        self.assertEqual(invoice.lines.count(), 2)
        self.assertEqual(self.receivable(), D('2600.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.SERVICE_CHARGE_INCOME), D('2000.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.UTILITY_INCOME), D('600.00'))
        assert_ledger_balanced(self)

    def test_numbering_is_sequential_per_organization(self):
        first = self.make_invoice()
        second = self.make_invoice()
        _, _, other_org = self.create_landlord_with_org('other@test.com')
        other_prop, other_unit = self.create_property_with_unit(other_org, name='Other')
        _, other_tenant = self.create_tenant(other_org, email='other-tenant@test.com')
        other_tenancy = self.create_tenancy(other_org, other_prop, other_unit, other_tenant)
        other = self.make_invoice(tenancy=other_tenancy)

        self.assertEqual([first.number, second.number, other.number], ['INV-000001', 'INV-000002', 'INV-000001'])

    def test_deposit_invoice_credits_deposits_held_not_income(self):
        self.make_invoice('deposit', [LineSpec('deposit', D('22000'))])
        self.assertEqual(LedgerService.balance(self.org, chart.DEPOSITS_HELD, tenancy=self.tenancy), D('22000.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.RENT_INCOME), D('0.00'))

    def test_deposit_lines_cannot_mix_with_other_charges(self):
        with self.assertRaises(InvoiceError):
            self.make_invoice('rent', [LineSpec('rent', D('22000')), LineSpec('deposit', D('22000'))])
        with self.assertRaises(InvoiceError):
            self.make_invoice('deposit', [LineSpec('rent', D('22000'))])

    def test_invalid_lines_rejected(self):
        with self.assertRaises(InvoiceError):
            self.make_invoice(lines=[])
        with self.assertRaises(InvoiceError):
            self.make_invoice(lines=[LineSpec('repair', D('0'))])
        with self.assertRaises(InvoiceError):
            self.make_invoice(lines=[LineSpec('spaceship', D('10'))])

    def test_rent_generation_issues_numbered_invoices_with_journal(self):
        created = RentChargeGenerationService.generate_for_tenancy(self.tenancy)

        invoices = list(Invoice.objects.filter(tenancy=self.tenancy).order_by('period_start'))
        self.assertEqual(created, len(invoices))
        self.assertTrue(all(i.invoice_type == 'rent' and i.number.startswith('INV-') for i in invoices))
        self.assertEqual(invoices[0].lines.get().line_type, 'rent')
        self.assertEqual(self.receivable(), D('22000.00') * len(invoices))
        assert_ledger_balanced(self)


class CreditNoteTests(InvoiceFixtures):
    def test_partial_credit_note_reduces_outstanding_and_posts_waiver(self):
        invoice = self.make_invoice()
        credit_note = InvoiceService.issue_credit_note(invoice, '500', 'Goodwill discount', created_by=self.landlord)

        invoice.refresh_from_db()
        self.assertEqual(credit_note.number, 'CN-000001')
        self.assertEqual(invoice.amount_credited, D('500.00'))
        self.assertEqual(invoice.outstanding, D('1000.00'))
        self.assertEqual(self.receivable(), D('1000.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.WAIVERS_AND_DISCOUNTS), D('500.00'))
        assert_ledger_balanced(self)

    def test_full_credit_marks_invoice_waived(self):
        invoice = self.make_invoice()
        InvoiceService.issue_credit_note(invoice, '1500', 'Charged in error')
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'waived')
        self.assertEqual(invoice.outstanding, D('0.00'))

    def test_deposit_credit_note_reduces_deposits_held(self):
        invoice = self.make_invoice('deposit', [LineSpec('deposit', D('22000'))])
        InvoiceService.issue_credit_note(invoice, '2000', 'Reduced deposit agreed')
        self.assertEqual(LedgerService.balance(self.org, chart.DEPOSITS_HELD, tenancy=self.tenancy), D('20000.00'))
        self.assertEqual(LedgerService.balance(self.org, chart.WAIVERS_AND_DISCOUNTS), D('0.00'))

    def test_credit_note_cannot_exceed_unpaid_balance_or_lack_reason(self):
        invoice = self.make_invoice()
        with self.assertRaises(InvoiceError):
            InvoiceService.issue_credit_note(invoice, '1500.01', 'Too much')
        with self.assertRaises(InvoiceError):
            InvoiceService.issue_credit_note(invoice, '10', '   ')
        self.assertEqual(CreditNote.objects.count(), 0)

    def test_dispute_flag_overrides_status_until_cleared(self):
        invoice = self.make_invoice()
        invoice = InvoiceService.set_disputed(invoice, True)
        self.assertEqual(invoice.status, 'disputed')
        invoice = InvoiceService.set_disputed(invoice, False)
        self.assertNotEqual(invoice.status, 'disputed')


class InvoiceApiTests(InvoiceFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def make_caretaker(self, permissions):
        user = User.objects.create_user(
            email='care@test.com', password='TestPass123!', first_name='Care', last_name='Taker',
            role='caretaker', phone_number='+254733333333',
        )
        profile = CaretakerProfile.objects.create(
            user=user,
            landlord=LandlordProfile.objects.get(user=self.landlord),
            emergency_contact_name='Emergency',
            emergency_contact_phone='+254744444444',
            created_by=self.landlord,
            permissions=permissions,
        )
        OrganizationMembership.objects.create(organization=self.org, user=user, role='caretaker')
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=profile, property_assignment=self.prop, organization=self.org,
            assigned_by=self.landlord,
        )
        return user

    def test_landlord_creates_adhoc_invoice(self):
        response = self.client_for(self.landlord).post('/api/v1/invoices/', {
            'tenancy': str(self.tenancy.id),
            'due_date': (date.today() + timedelta(days=7)).isoformat(),
            'lines': [{'line_type': 'repair', 'unit_price': '3500.00', 'description': 'Door lock'}],
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['number'], 'INV-000001')
        self.assertEqual(response.data['amount_due'], '3500.00')
        self.assertEqual(response.data['lines'][0]['description'], 'Door lock')

    def test_adhoc_invoice_rejects_rent_penalty_and_deposit_lines(self):
        response = self.client_for(self.landlord).post('/api/v1/invoices/', {
            'tenancy': str(self.tenancy.id), 'due_date': date.today().isoformat(),
            'lines': [{'line_type': 'penalty', 'unit_price': '100.00'}],
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_cannot_invoice_another_organizations_tenancy(self):
        other_landlord, _, _ = self.create_landlord_with_org('intruder@test.com')
        response = self.client_for(other_landlord).post('/api/v1/invoices/', {
            'tenancy': str(self.tenancy.id), 'due_date': date.today().isoformat(),
            'lines': [{'line_type': 'repair', 'unit_price': '100.00'}],
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Invoice.objects.count(), 0)

    def test_caretaker_needs_permission_flag_to_create_charges(self):
        payload = {
            'tenancy': str(self.tenancy.id), 'due_date': date.today().isoformat(),
            'lines': [{'line_type': 'repair', 'unit_price': '100.00'}],
        }
        without = self.make_caretaker({'can_view_payments': True})
        self.assertEqual(self.client_for(without).post('/api/v1/invoices/', payload, format='json').status_code, 403)

        without.caretaker_profile.permissions = {'can_view_payments': True, 'can_create_charges': True}
        without.caretaker_profile.save()
        self.assertEqual(self.client_for(without).post('/api/v1/invoices/', payload, format='json').status_code, 201)

    def test_tenant_lists_only_own_invoices_and_cannot_create(self):
        self.make_invoice()
        other_user, other_tenant = self.create_tenant(self.org, email='neighbour@test.com')
        _, other_unit = self.create_property_with_unit(self.org, name='Annex')
        other_tenancy = self.create_tenancy(self.org, self.prop, other_unit, other_tenant)
        self.make_invoice(tenancy=other_tenancy)

        client = self.client_for(self.tenant_user)
        listing = client.get('/api/v1/invoices/')
        self.assertEqual(listing.status_code, 200)
        self.assertEqual([i['tenancy'] for i in listing.data], [self.tenancy.id])

        created = client.post('/api/v1/invoices/', {
            'tenancy': str(self.tenancy.id), 'due_date': date.today().isoformat(),
            'lines': [{'line_type': 'repair', 'unit_price': '1.00'}],
        }, format='json')
        self.assertEqual(created.status_code, 403)

    def test_credit_note_endpoint_and_detail_view(self):
        invoice = self.make_invoice()
        client = self.client_for(self.landlord)

        too_much = client.post(f'/api/v1/invoices/{invoice.id}/credit-notes/',
                               {'amount': '9999.00', 'reason': 'x'}, format='json')
        self.assertEqual(too_much.status_code, 400)

        ok = client.post(f'/api/v1/invoices/{invoice.id}/credit-notes/',
                         {'amount': '500.00', 'reason': 'Goodwill'}, format='json')
        self.assertEqual(ok.status_code, 201)

        detail = client.get(f'/api/v1/invoices/{invoice.id}/')
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data['outstanding'], '1000.00')
        self.assertEqual(detail.data['credit_notes'][0]['number'], 'CN-000001')
        self.assertEqual(detail.data['payments'], [])

        tenant_credit = self.client_for(self.tenant_user).post(
            f'/api/v1/invoices/{invoice.id}/credit-notes/', {'amount': '1.00', 'reason': 'please'}, format='json',
        )
        self.assertEqual(tenant_credit.status_code, 403)

    def test_tenant_can_raise_but_not_clear_a_dispute(self):
        invoice = self.make_invoice()
        tenant = self.client_for(self.tenant_user)

        raised = tenant.post(f'/api/v1/invoices/{invoice.id}/dispute/', {'disputed': True}, format='json')
        self.assertEqual(raised.status_code, 200)
        self.assertEqual(raised.data['status'], 'disputed')

        cleared_by_tenant = tenant.post(f'/api/v1/invoices/{invoice.id}/dispute/', {'disputed': False}, format='json')
        self.assertEqual(cleared_by_tenant.status_code, 403)

        cleared = self.client_for(self.landlord).post(
            f'/api/v1/invoices/{invoice.id}/dispute/', {'disputed': False}, format='json',
        )
        self.assertEqual(cleared.status_code, 200)
        self.assertNotEqual(cleared.data['status'], 'disputed')

    def test_legacy_rent_endpoint_keeps_response_shape(self):
        RentChargeGenerationService.generate_for_tenancy(self.tenancy)
        response = self.client_for(self.landlord).get('/api/v1/rent/')
        self.assertEqual(response.status_code, 200)
        for key in ('amount_due', 'amount_paid', 'late_fee_amount', 'outstanding', 'status', 'number', 'lines'):
            self.assertIn(key, response.data[0])
