"""Phase 1j — metered utilities: readings, billing in arrears, bill-now, rates API."""

from datetime import date
from decimal import Decimal

from rest_framework.test import APIClient

from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from rent.models import Invoice, MeterReading
from rent.services.rent_generation import RentChargeGenerationService as Gen
from rent.services.utilities import UtilityError, UtilityService
from rumia_api.tests import RumiaTestFixtures

D = Decimal


class UtilityFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.prop.settings = {'utility_rates': {'water': '150', 'electricity': '25'}}
        self.prop.save()
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.tenancy.start_date = date(2026, 1, 1)
        self.tenancy.end_date = None
        self.tenancy.save()

    def read(self, day, value, utility='water', **kwargs):
        return UtilityService.record_reading(self.unit, utility, day, value, **kwargs)


class UtilityServiceTests(UtilityFixtures):
    def test_consumption_is_billed_in_arrears_on_next_rent_invoice(self):
        self.read(date(2026, 1, 1), '100')    # move-in baseline
        self.read(date(2026, 1, 31), '112')   # 12 m³ in January
        self.read(date(2026, 1, 31), '400', utility='electricity')  # electricity baseline

        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 2, 3))

        january, february = Invoice.objects.filter(tenancy=self.tenancy).order_by('period_start')
        self.assertFalse(january.lines.filter(line_type='water').exists())
        water = february.lines.get(line_type='water')
        self.assertEqual((water.quantity, water.unit_price, water.amount), (D('12.000'), D('150.00'), D('1800.00')))
        self.assertIn('100.000 → 112.000', water.description)
        self.assertFalse(february.lines.filter(line_type='electricity').exists())  # baseline only
        self.assertTrue(all(r.billed for r in MeterReading.objects.all()))
        self.assertEqual(LedgerService.balance(self.org, chart.UTILITY_INCOME), D('1800.00'))
        assert_ledger_balanced(self)

    def test_readings_are_never_billed_twice(self):
        self.read(date(2026, 1, 1), '100')
        self.read(date(2026, 1, 31), '110')
        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 2, 3))
        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 3, 3))
        self.assertEqual(sum(1 for i in Invoice.objects.all() for l in i.lines.all() if l.line_type == 'water'), 1)

    def test_bill_now_and_validation(self):
        self.read(date(2026, 1, 1), '100')
        with self.assertRaises(UtilityError):
            self.read(date(2026, 1, 20), '90')  # lower than previous
        self.read(date(2026, 1, 20), '105', rate_per_unit='200')
        invoice = UtilityService.bill_now(self.tenancy)
        self.assertEqual(invoice.invoice_type, 'adhoc')
        self.assertEqual(invoice.amount_due, D('1000.00'))  # 5 × 200 (rate given on reading)
        with self.assertRaises(UtilityError):
            UtilityService.bill_now(self.tenancy)  # nothing left
        with self.assertRaises(UtilityError):
            self.read(date(2026, 1, 10), '102')  # before an already-billed reading

    def test_missing_rate_is_rejected(self):
        self.prop.settings = {}
        self.prop.save()
        with self.assertRaises(UtilityError):
            self.read(date(2026, 1, 1), '100')

    def test_final_reading_at_move_out_is_billed_on_final_invoice(self):
        self.tenancy.end_date = date(2026, 1, 20)
        self.tenancy.save()
        self.read(date(2026, 1, 1), '100')
        self.read(date(2026, 1, 20), '106')
        Gen.generate_for_tenancy(self.tenancy, as_of=date(2026, 1, 25))
        final = Invoice.objects.get(tenancy=self.tenancy)
        self.assertEqual(final.lines.get(line_type='water').amount, D('900.00'))


class UtilityApiTests(UtilityFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_landlord_sets_rates_records_readings_and_bills(self):
        landlord = self.client_for(self.landlord)
        rates = landlord.put(f'/api/v1/properties/{self.prop.id}/utility-rates/', {'water': '175.00'}, format='json')
        self.assertEqual(rates.data, {'water': '175.00'})

        for day, value in (('2026-01-01', '50'), ('2026-01-15', '54')):
            response = landlord.post('/api/v1/meter-readings/', {
                'unit': str(self.unit.id), 'utility': 'water', 'reading_date': day, 'value': value,
            }, format='json')
            self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['rate_per_unit'], '175.00')

        billed = landlord.post(f'/api/v1/tenancies/{self.tenancy.id}/utilities/bill-now/')
        self.assertEqual(billed.status_code, 201, billed.data)
        self.assertEqual(billed.data['amount_due'], '700.00')

        listing = landlord.get(f'/api/v1/meter-readings/?unit_id={self.unit.id}&billed=true')
        self.assertEqual(len(listing.data), 2)

    def test_tenant_and_outsiders_cannot_record(self):
        payload = {'unit': str(self.unit.id), 'utility': 'water', 'reading_date': '2026-01-01', 'value': '1'}
        self.assertEqual(self.client_for(self.tenant_user).post('/api/v1/meter-readings/', payload, format='json').status_code, 403)
        intruder, _, _ = self.create_landlord_with_org('intruder@test.com')
        self.assertEqual(self.client_for(intruder).post('/api/v1/meter-readings/', payload, format='json').status_code, 403)
        self.assertEqual(
            self.client_for(intruder).get(f'/api/v1/properties/{self.prop.id}/utility-rates/').status_code, 404,
        )
