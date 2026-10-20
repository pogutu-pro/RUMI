from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from broadcasts.models import Broadcast
from broadcasts.services import personalise, preview, send
from rent.services.invoicing import InvoiceService, LineSpec
from rumia_api.tests import RumiaTestFixtures

SMS = 'rent.services.notifications.send_sms_via_africastalking'


class BroadcastTests(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, unit = self.create_property_with_unit(self.org)
        _, tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, unit, tenant)
        _, unit2 = self.create_property_with_unit(self.org, name='Annex')
        _, tenant2 = self.create_tenant(self.org, email='two@test.com')
        self.tenancy2 = self.create_tenancy(self.org, self.prop, unit2, tenant2)
        today = timezone.localdate()
        InvoiceService.create_invoice(self.tenancy, 'rent', [LineSpec('rent', Decimal('22000'))],
                                      period_start=today, period_end=today, due_date=today - timedelta(days=3))

    def test_personalise_and_preview(self):
        text = personalise('Hi {name}, {unit} owes {balance}. Acc {account}. {oops}', self.tenancy)
        self.assertEqual(text, 'Hi John, A101 owes KES 22,000. Acc A101. {oops}')
        p = preview(self.org, 'arrears', None, 'Hi {name} {oops}', True)
        self.assertEqual(p['recipients'], 1)
        self.assertEqual(p['unknown_placeholders'], ['oops'])
        self.assertEqual(preview(self.org, 'all_tenants', None, 'x' * 200, True)['sms_segments'], 4)

    def test_send_sms_and_email(self):
        b = Broadcast.objects.create(organization=self.org, audience='all_tenants', send_sms=True, send_email=True,
                                     subject='Water', message='Dear {name}, water is off on Sunday.')
        with patch(SMS) as sms:
            b = send(b)
        self.assertEqual((b.status, b.recipients, b.sms_sent, b.emails_sent), ('sent', 2, 2, 2))
        self.assertIn('Dear John', sms.call_args_list[0][0][1])
        self.assertEqual(len(mail.outbox), 2)

    def test_api_preview_send_and_permissions(self):
        client = APIClient()
        client.force_authenticate(user=self.landlord)
        payload = {'audience': 'arrears', 'send_sms': True, 'message': 'Please clear {balance}'}
        prev = client.post('/api/v1/broadcasts/', {**payload, 'preview': True}, format='json')
        self.assertEqual(prev.data['recipients'], 1)
        self.assertEqual(Broadcast.objects.count(), 0)
        with patch(SMS), self.captureOnCommitCallbacks(execute=True):
            sent = client.post('/api/v1/broadcasts/', payload, format='json')
        self.assertEqual(sent.status_code, 201, sent.data)
        self.assertEqual(Broadcast.objects.get().status, 'sent')
        self.org.settings = {'bulk_sms_enabled': False}
        self.org.save()
        self.assertEqual(client.post('/api/v1/broadcasts/', payload, format='json').status_code, 400)
        tenant = APIClient()
        tenant.force_authenticate(user=self.tenancy.tenant.user)
        self.assertEqual(tenant.post('/api/v1/broadcasts/', payload, format='json').status_code, 403)
