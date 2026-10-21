"""
"Today" is Kenya's date, not UTC's.

The nightly jobs run between 1 and 2 am Nairobi time, which is still the
previous day in UTC. Using the UTC date there dated invoices a day early and,
on the 1st, made the rent run think it was still last month.
"""
from datetime import date, datetime, timezone as dt_timezone
from decimal import Decimal
from unittest.mock import patch

from django.utils import timezone

from rent.models import Invoice
from rent.services.invoicing import InvoiceService, LineSpec
from rumia_api.tests import RumiaTestFixtures

# 22:30 UTC on 31 October is 01:30 on 1 November in Nairobi (UTC+3).
JUST_AFTER_MIDNIGHT_IN_NAIROBI = datetime(2026, 10, 31, 22, 30, tzinfo=dt_timezone.utc)


class KenyaLocalDateTests(RumiaTestFixtures):
    def test_localdate_is_already_the_first(self):
        with patch('django.utils.timezone.now', return_value=JUST_AFTER_MIDNIGHT_IN_NAIROBI):
            self.assertEqual(timezone.localdate(), date(2026, 11, 1))

    def test_invoice_issued_after_midnight_carries_kenyas_date(self):
        _, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        first = date(2026, 11, 1)

        with patch('django.utils.timezone.now', return_value=JUST_AFTER_MIDNIGHT_IN_NAIROBI), \
                patch('rent.services.notifications.send_sms_via_africastalking'):
            invoice = InvoiceService.create_invoice(
                tenancy, 'rent', [LineSpec('rent', Decimal('20000'))],
                period_start=first, period_end=date(2026, 11, 30), due_date=date(2026, 11, 5),
            )

        self.assertEqual(Invoice.objects.get(pk=invoice.pk).issue_date, first)
