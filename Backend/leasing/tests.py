"""Phase 3c — leases, documents, notices, debt recovery, rent reviews, expiry reminders."""

import shutil
import tempfile
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from leasing.models import DebtCase, LeaseReminder, RentReview, TenancyDocument
from leasing.services import (
    DebtService, DocumentService, LeaseExpiryService, LeasingError, RentReviewService,
)
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.rent_generation import RentChargeGenerationService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
TODAY = timezone.localdate()
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class LeasingFixtures(RumiaTestFixtures):
    def setUp(self):
        self.media = tempfile.mkdtemp(prefix='rumiarent-leasing-')
        self.media_override = override_settings(MEDIA_ROOT=self.media)
        self.media_override.enable()
        self.sms = patch(SMS)
        self.sms.start()
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)

    def tearDown(self):
        self.sms.stop()
        self.media_override.disable()
        shutil.rmtree(self.media, ignore_errors=True)

    def overdue(self, amount='22000'):
        return InvoiceService.create_invoice(
            self.tenancy, 'rent', [LineSpec('rent', D(amount))],
            period_start=TODAY - timedelta(days=20), period_end=TODAY, due_date=TODAY - timedelta(days=10),
        )

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class DocumentTests(LeasingFixtures):
    def test_lease_pdf(self):
        doc = DocumentService.lease(self.tenancy)
        self.assertEqual(doc.kind, 'lease')
        with doc.file.open('rb') as f:
            self.assertTrue(f.read().startswith(b'%PDF'))

    def test_demand_note_needs_arrears_and_is_sent(self):
        with self.assertRaises(LeasingError):
            DocumentService.demand_note(self.tenancy)
        self.overdue()
        doc = DocumentService.demand_note(self.tenancy, pay_within_days=5)
        self.assertEqual(doc.details['amount'], '22000.00')
        self.assertTrue(DocumentService.send(doc))
        self.assertEqual(mail.outbox[-1].to, [self.tenant.email])
        self.assertEqual(mail.outbox[-1].attachments[0][0], 'demand_note.pdf')

    def test_quit_notice_defaults_to_30_days(self):
        doc = DocumentService.quit_notice(self.tenancy)
        self.assertEqual(doc.details['vacate_by'], (TODAY + timedelta(days=30)).isoformat())
        with self.assertRaises(LeasingError):
            DocumentService.quit_notice(self.tenancy, vacate_by=TODAY)

    def test_tenant_notice_to_vacate_puts_tenancy_on_notice_and_alerts_owner(self):
        move_out = TODAY + timedelta(days=30)
        DocumentService.notice_to_vacate(self.tenancy, move_out, 'Relocating', given_by=self.tenant_user, by_tenant=True)
        self.tenancy.refresh_from_db()
        self.assertEqual((self.tenancy.status, self.tenancy.end_date), ('notice_period', move_out))
        self.assertIn(self.landlord.email, [m.to[0] for m in mail.outbox])
        with self.assertRaises(LeasingError):
            DocumentService.notice_to_vacate(self.tenancy, TODAY, '')


class RentReviewTests(LeasingFixtures):
    def test_percentage_review_notified_applied_and_repeats(self):
        effective = TODAY + timedelta(days=20)
        review = RentReviewService.schedule(self.tenancy, effective, increase_percent=D('10'), repeat_annually=True)
        self.assertEqual(RentReviewService.run(as_of=TODAY), {'notified': 1, 'applied': 0})
        self.assertEqual(RentReviewService.run(as_of=effective), {'notified': 0, 'applied': 1})
        self.tenancy.refresh_from_db()
        self.assertEqual(self.tenancy.monthly_rent, D('24200'))
        review.refresh_from_db()
        self.assertEqual((review.previous_rent, review.applied_rent), (D('22000.00'), D('24200.00')))
        follow_up = RentReview.objects.exclude(pk=review.pk).get()
        self.assertEqual(follow_up.effective_date, effective.replace(year=effective.year + 1))

    def test_new_rent_flows_into_next_invoice(self):
        self.tenancy.start_date = TODAY.replace(day=1)
        self.tenancy.save()
        RentChargeGenerationService.generate_for_tenancy(self.tenancy, as_of=TODAY)
        review = RentReview.objects.create(organization=self.org, tenancy=self.tenancy,
                                           effective_date=TODAY, new_monthly_rent=D('25000'))
        RentReviewService.run(as_of=TODAY)
        review.refresh_from_db()
        self.assertIsNotNone(review.applied_at)
        next_start = (TODAY.replace(day=1) + timedelta(days=32)).replace(day=1)
        self.tenancy.refresh_from_db()  # the daily task always loads tenancies fresh
        RentChargeGenerationService.generate_for_tenancy(self.tenancy, as_of=next_start)
        latest = self.tenancy.invoices.filter(invoice_type='rent').order_by('-period_start').first()
        self.assertEqual(latest.amount_due, D('25000.00'))

    def test_validation(self):
        with self.assertRaises(LeasingError):
            RentReviewService.schedule(self.tenancy, TODAY + timedelta(days=5))
        with self.assertRaises(LeasingError):
            RentReviewService.schedule(self.tenancy, TODAY + timedelta(days=5), new_monthly_rent=D('1'), repeat_annually=True)
        with self.assertRaises(LeasingError):
            RentReviewService.schedule(self.tenancy, TODAY, new_monthly_rent=D('1'))


class LeaseExpiryTests(LeasingFixtures):
    def test_each_threshold_once_and_latest_only(self):
        self.tenancy.end_date = TODAY + timedelta(days=25)  # past 60 and 30 at once
        self.tenancy.save()
        self.assertEqual(LeaseExpiryService.run(as_of=TODAY), 1)
        self.assertEqual(set(LeaseReminder.objects.values_list('key', flat=True)), {'expiry_60', 'expiry_30'})
        self.assertEqual(LeaseExpiryService.run(as_of=TODAY), 0)
        self.assertEqual(LeaseExpiryService.run(as_of=TODAY + timedelta(days=19)), 1)  # 6 days left → expiry_7


class DebtTests(LeasingFixtures):
    def test_case_lifecycle(self):
        with self.assertRaises(LeasingError):
            DebtService.open_case(self.tenancy)
        invoice = self.overdue()
        case = DebtService.open_case(self.tenancy, assigned_to=self.landlord, note='Called, no answer')
        self.assertEqual(case.amount_at_open, D('22000.00'))
        with self.assertRaises(LeasingError):
            DebtService.open_case(self.tenancy)  # one open case per tenancy
        with self.assertRaises(LeasingError):
            DebtService.update(case, self.landlord, status='closed')  # needs a reason
        DebtService.update(case, self.landlord, status='promised', promise_date=TODAY + timedelta(days=3))
        self.assertEqual(case.notes.count(), 2)

        InvoiceService.issue_credit_note(invoice, '22000', 'Settled in kind')
        self.assertEqual(DebtService.close_settled(), 1)
        case.refresh_from_db()
        self.assertEqual(case.status, 'closed')


class LeasingApiTests(LeasingFixtures):
    def test_generate_upload_and_tenant_visibility(self):
        landlord = self.client_for(self.landlord)
        url = f'/api/v1/leasing/tenancies/{self.tenancy.id}/documents/'
        lease = landlord.post(f'{url}generate/', {'kind': 'lease', 'send': False}, format='json')
        self.assertEqual(lease.status_code, 201, lease.data)

        bad = landlord.post(url, {'file': SimpleUploadedFile('x.exe', b'MZ', content_type='application/octet-stream')},
                            format='multipart')
        self.assertEqual(bad.status_code, 400)
        private = landlord.post(url, {'file': SimpleUploadedFile('id.pdf', b'%PDF-1.4', content_type='application/pdf'),
                                      'kind': 'id_copy', 'visible_to_tenant': 'false'}, format='multipart')
        self.assertEqual(private.status_code, 201, private.data)

        tenant = self.client_for(self.tenant_user)
        self.assertEqual([d['kind'] for d in tenant.get(url).data], ['lease'])
        self.assertEqual(tenant.get(f'/api/v1/leasing/documents/{private.data["id"]}/download/').status_code, 404)
        self.assertEqual(tenant.get(f'/api/v1/leasing/documents/{lease.data["id"]}/download/').status_code, 200)
        self.assertEqual(tenant.post(f'{url}generate/', {'kind': 'lease'}, format='json').status_code, 403)

    def test_tenant_gives_notice_via_api(self):
        response = self.client_for(self.tenant_user).post(
            f'/api/v1/leasing/tenancies/{self.tenancy.id}/notice-to-vacate/',
            {'move_out_date': (TODAY + timedelta(days=31)).isoformat(), 'reason': 'New job'}, format='json',
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(TenancyDocument.objects.filter(kind='notice_to_vacate').exists())

    def test_arrears_worklist_and_cases(self):
        self.overdue()
        landlord = self.client_for(self.landlord)
        worklist = landlord.get('/api/v1/leasing/arrears/').data
        self.assertEqual([(r['tenant_name'], r['arrears'], r['case']) for r in worklist], [('John Kamau', '22000.00', None)])
        staff = landlord.get('/api/v1/leasing/staff/').data
        created = landlord.post('/api/v1/leasing/debt-cases/', {'tenancy': str(self.tenancy.id),
                                                                 'assigned_to': staff[0]['id'], 'note': 'First call'},
                                format='json')
        self.assertEqual(created.status_code, 201, created.data)
        noted = landlord.post(f'/api/v1/leasing/debt-cases/{created.data["id"]}/', {'text': 'Promised Friday'}, format='json')
        self.assertEqual(len(noted.data['notes']), 2)
        self.assertEqual(self.client_for(self.tenant_user).get('/api/v1/leasing/arrears/').status_code, 403)

    def test_rent_review_api_owner_only(self):
        url = f'/api/v1/leasing/tenancies/{self.tenancy.id}/rent-reviews/'
        payload = {'effective_date': (TODAY + timedelta(days=40)).isoformat(), 'increase_percent': '7.5'}
        self.assertEqual(self.client_for(self.tenant_user).post(url, payload, format='json').status_code, 403)
        created = self.client_for(self.landlord).post(url, payload, format='json')
        self.assertEqual(created.status_code, 201, created.data)
        cancelled = self.client_for(self.landlord).post(f'/api/v1/leasing/rent-reviews/{created.data["id"]}/cancel/')
        self.assertIsNotNone(cancelled.data['cancelled_at'])
