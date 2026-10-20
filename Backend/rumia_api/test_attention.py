from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APIClient

from paybill.models import IncomingTransaction, PaybillAccount
from rent.services.invoicing import InvoiceService, LineSpec
from rumia_api.tests import RumiaTestFixtures


class AttentionTests(RumiaTestFixtures):
    def test_items_are_prioritised_with_links(self):
        landlord, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        today = timezone.localdate()
        InvoiceService.create_invoice(tenancy, 'rent', [LineSpec('rent', Decimal('22000'))],
                                      period_start=today, period_end=today, due_date=today - timedelta(days=5))
        paybill = PaybillAccount.objects.create(organization=org, shortcode='600999')
        IncomingTransaction.objects.create(paybill=paybill, organization=org, trans_id='X1', trans_time=timezone.now(),
                                           amount=Decimal('5'), status='unmatched')
        client = APIClient()
        client.force_authenticate(user=landlord)
        items = client.get('/api/v1/attention/').data
        keys = [i['key'] for i in items]
        self.assertEqual(keys[:2], ['paybill_unmatched', 'arrears'])
        arrears = next(i for i in items if i['key'] == 'arrears')
        self.assertIn('KES 22,000', arrears['detail'])
        self.assertEqual(arrears['href'], '/landlord/rental/debt')
        self.assertNotIn('collection_setup', keys)  # a paybill is connected
