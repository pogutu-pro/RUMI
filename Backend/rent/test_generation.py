"""Phase 1e — invoicing generator: notice period, lease end, proration, recurring charges."""

from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APIClient

from ledger.tests import assert_ledger_balanced
from rent.models import Invoice, RecurringCharge
from rent.services.rent_generation import RentChargeGenerationService as Gen
from rumia_api.tests import RumiaTestFixtures

D = Decimal


class GenerationFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.tenancy.start_date = date(2026, 1, 1)
        self.tenancy.end_date = None
        self.tenancy.save()

    def rent_invoices(self):
        return list(Invoice.objects.filter(tenancy=self.tenancy, invoice_type='rent').order_by('period_start'))

    def recurring(self, line_type='service_charge', amount='3000', start=date(2026, 1, 1), **kwargs):
        return RecurringCharge.objects.create(
            organization=self.org, tenancy=self.tenancy, line_type=line_type, amount=D(amount), start_date=start,
            **kwargs,
        )


class LeaseEndTests(GenerationFixtures):
    def test_notice_period_tenancy_keeps_being_billed(self):
        self.tenancy.status = 'notice_period'
        self.tenancy.save()
        Gen.generate_for_all_organizations(as_of=date(2026, 2, 10))
        self.assertEqual(len(self.rent_invoices()), 2)

    def test_billing_stops_at_end_date_with_prorated_final_period(self):
        self.tenancy.end_date = date(2026, 3, 15)
        self.tenancy.save()

        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 6, 1))

        invoices = self.rent_invoices()
        self.assertEqual([i.period_start for i in invoices], [date(2026, 1, 1), date(2026, 2, 1), date(2026, 3, 1)])
        final = invoices[-1]
        self.assertEqual(final.period_end, date(2026, 3, 15))
        self.assertEqual(final.amount_due, D('10645.16'))  # 22000 × 15/31
        self.assertIn('15 of 31 days', final.lines.get().description)
        self.assertLessEqual(final.due_date, final.period_end)
        assert_ledger_balanced(self)

    def test_move_out_before_end_date_wins(self):
        self.tenancy.end_date = date(2026, 12, 31)
        self.tenancy.move_out_date = date(2026, 1, 10)
        self.tenancy.save()
        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 3, 1))
        invoices = self.rent_invoices()
        self.assertEqual(len(invoices), 1)
        self.assertEqual(invoices[0].amount_due, D('7096.77'))  # 22000 × 10/31

    def test_proration_can_be_turned_off_per_tenancy(self):
        self.tenancy.end_date = date(2026, 1, 10)
        self.tenancy.prorate_final_period = False
        self.tenancy.save()
        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 3, 1))
        self.assertEqual(self.rent_invoices()[0].amount_due, D('22000.00'))

    def test_recently_terminated_tenancy_gets_final_invoice_from_daily_run(self):
        self.tenancy.status = 'terminated'
        self.tenancy.end_date = self.tenancy.move_out_date = date(2026, 1, 20)
        self.tenancy.save()
        result = Gen.generate_for_all_organizations(as_of=date(2026, 1, 25))
        self.assertEqual(result.created, 1)

    def test_long_ended_tenancy_is_not_swept(self):
        self.tenancy.status = 'terminated'
        self.tenancy.end_date = self.tenancy.move_out_date = date(2025, 1, 20)
        self.tenancy.save()
        self.assertEqual(Gen.generate_for_all_organizations(as_of=date(2026, 6, 1)).created, 0)


class RecurringChargeTests(GenerationFixtures):
    def test_active_recurring_charges_become_invoice_lines(self):
        self.recurring('service_charge', '3000', description='Service charge')
        self.recurring('garbage', '200')
        self.recurring('parking', '1500', start=date(2026, 2, 1))  # starts next month
        self.recurring('parking', '999', is_active=False)

        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 2, 5))

        january, february = self.rent_invoices()
        self.assertEqual(sorted(l.line_type for l in january.lines.all()), ['garbage', 'rent', 'service_charge'])
        self.assertEqual(january.amount_due, D('25200.00'))
        self.assertEqual(february.amount_due, D('26700.00'))
        assert_ledger_balanced(self)

    def test_recurring_charges_are_prorated_in_final_period(self):
        self.recurring('service_charge', '3100')
        self.tenancy.end_date = date(2026, 1, 10)
        self.tenancy.save()
        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 2, 1))
        service = self.rent_invoices()[0].lines.get(line_type='service_charge')
        self.assertEqual(service.amount, D('1000.00'))  # 3100 × 10/31


class TerminationAndApiTests(GenerationFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_terminating_bills_the_final_partial_period_immediately(self):
        self.tenancy.start_date = date.today().replace(day=1) - timedelta(days=1)
        self.tenancy.start_date = self.tenancy.start_date.replace(day=1)  # first of last month
        self.tenancy.save()
        Gen.generate_for_tenancy(self.tenancy, as_of=self.tenancy.start_date)

        move_out = date.today()
        response = self.client_for(self.landlord).post(
            f'/api/v1/tenancies/{self.tenancy.id}/terminate/', {'move_out_date': move_out.isoformat()}, format='json',
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.rent_invoices()[-1].period_end, move_out)

    def test_landlord_manages_recurring_charges_and_tenant_can_only_read(self):
        url = f'/api/v1/tenancies/{self.tenancy.id}/recurring-charges/'
        landlord = self.client_for(self.landlord)

        created = landlord.post(url, {
            'line_type': 'service_charge', 'amount': '3000.00', 'start_date': '2026-01-01',
            'description': 'Service charge',
        }, format='json')
        self.assertEqual(created.status_code, 201, created.data)

        bad = landlord.post(url, {'line_type': 'rent', 'amount': '1.00', 'start_date': '2026-01-01'}, format='json')
        self.assertEqual(bad.status_code, 400)

        tenant = self.client_for(self.tenant_user)
        self.assertEqual(len(tenant.get(url).data), 1)
        self.assertEqual(
            tenant.post(url, {'line_type': 'garbage', 'amount': '1', 'start_date': '2026-01-01'}, format='json').status_code,
            403,
        )

        detail = f'/api/v1/recurring-charges/{created.data["id"]}/'
        self.assertEqual(landlord.patch(detail, {'amount': '3500.00'}, format='json').data['amount'], '3500.00')
        self.assertEqual(landlord.delete(detail).status_code, 204)
        self.assertFalse(RecurringCharge.objects.get(pk=created.data['id']).is_active)

    def test_other_organization_cannot_touch_recurring_charges(self):
        intruder, _, _ = self.create_landlord_with_org('intruder@test.com')
        url = f'/api/v1/tenancies/{self.tenancy.id}/recurring-charges/'
        response = self.client_for(intruder).post(
            url, {'line_type': 'garbage', 'amount': '1', 'start_date': '2026-01-01'}, format='json',
        )
        self.assertEqual(response.status_code, 404)
