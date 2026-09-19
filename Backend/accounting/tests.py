import csv
import io
from datetime import date, datetime, timedelta
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounting import services
from accounting.models import Expense, MriFiling, TaxRateConfig
from audit.models import AuditLog
from organizations.models import Organization
from properties.models import Property, RentalUnit
from rent.models import Payment
from tenants.models import TenantProfile

User = get_user_model()


def aware(y, m, d, hour=12):
    return timezone.make_aware(datetime(y, m, d, hour))


class AccountingBase(TestCase):
    def setUp(self):
        self.landlord = self._user('landlord@t.com', 'landlord')
        self.org = Organization.objects.create(name='Org', owner=self.landlord)
        self.prop_a = Property.objects.create(organization=self.org, name='Greenview', address='1 Rd', city='Nairobi')
        self.prop_b = Property.objects.create(organization=self.org, name='Hillside', address='2 Rd', city='Nairobi')
        self.unit_a = RentalUnit.objects.create(organization=self.org, parent_property=self.prop_a, unit_number='A1', monthly_rent=Decimal('10000'))
        self.unit_b = RentalUnit.objects.create(organization=self.org, parent_property=self.prop_b, unit_number='B1', monthly_rent=Decimal('10000'))
        self.tenant = TenantProfile.objects.create(organization=self.org, full_name='Jane Wanjiku', phone='+254711111111', email='j@t.com', status='active')
        self._n = 0

    @staticmethod
    def _user(email, role):
        return User.objects.create_user(email=email, password='Pass123!', first_name='Test', last_name='User',
                                        role=role, is_verified=True, onboarding_stage='COMPLETED')

    def pay(self, amount, when, prop=None, unit=None, status='success', method='cash', org=None):
        self._n += 1
        prop = prop if prop is not None else self.prop_a
        unit = unit if unit is not None else (self.unit_a if prop == self.prop_a else self.unit_b)
        return Payment.objects.create(
            organization=org or self.org, tenant=self.tenant, parent_property=prop, unit=unit,
            amount=Decimal(str(amount)), payment_method=method, provider='manual',
            internal_reference=f'REF-{self._n}', status=status, paid_at=when,
        )

    def api(self, user=None):
        client = APIClient()
        client.force_authenticate(user=user or self.landlord)
        return client


class MriCalculationTests(AccountingBase):
    def test_gross_rent_and_tax_use_rent_received_in_that_month_only(self):
        self.pay(20000, aware(2026, 8, 31))          # August: not September
        self.pay(30000, aware(2026, 9, 5))
        self.pay(20000, aware(2026, 9, 28), prop=self.prop_b)
        self.pay(10000, aware(2026, 10, 1, hour=0))  # October
        data = self.api().get('/api/v1/accounting/mri/?month=2026-09').json()
        self.assertEqual(data['gross_rent'], '50000.00')
        self.assertEqual(data['rate'], '7.50')
        self.assertEqual(data['mri_due'], '3750.00')
        self.assertEqual(data['payments'], 2)
        self.assertEqual(data['deadline'], '2026-10-20')
        self.assertFalse(data['is_nil'])

    def test_month_boundaries_follow_the_nairobi_calendar(self):
        # 22:00 UTC on 30 Sep is 01:00 on 1 Oct in Nairobi, so it is October rent.
        self.pay(5000, datetime(2026, 9, 30, 22, 0, tzinfo=timezone.utc))
        sept = self.api().get('/api/v1/accounting/mri/?month=2026-09').json()
        octo = self.api().get('/api/v1/accounting/mri/?month=2026-10').json()
        self.assertEqual((sept['gross_rent'], octo['gross_rent']), ('0.00', '5000.00'))

    def test_reversed_pending_and_failed_payments_do_not_count(self):
        self.pay(10000, aware(2026, 9, 5))
        for status in ('reversed', 'pending', 'failed', 'processing'):
            self.pay(99999, aware(2026, 9, 6), status=status)
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['gross_rent'], '10000.00')

    def test_per_property_breakdown_adds_up(self):
        self.pay(30000, aware(2026, 9, 5), prop=self.prop_a)
        self.pay(20000, aware(2026, 9, 6), prop=self.prop_b)
        rows = {r['property_name']: r for r in self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['by_property']}
        self.assertEqual(rows['Greenview']['amount'], '30000.00')
        self.assertEqual(rows['Greenview']['mri'], '2250.00')
        self.assertEqual(rows['Hillside']['mri'], '1500.00')

    def test_a_month_with_no_rent_is_a_nil_return(self):
        data = self.api().get('/api/v1/accounting/mri/?month=2026-09').json()
        self.assertTrue(data['is_nil'])
        self.assertEqual(data['mri_due'], '0.00')

    def test_only_this_landlords_money_is_counted(self):
        other_landlord = self._user('other@t.com', 'landlord')
        other_org = Organization.objects.create(name='Other', owner=other_landlord)
        self.pay(777777, aware(2026, 9, 5), org=other_org)
        self.pay(1000, aware(2026, 9, 5))
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['gross_rent'], '1000.00')
        self.assertEqual(self.api(other_landlord).get('/api/v1/accounting/mri/?month=2026-09').json()['gross_rent'], '777777.00')

    def test_rate_and_threshold_come_from_the_editable_config(self):
        self.pay(100000, aware(2026, 9, 5))
        config = TaxRateConfig.get()
        config.mri_rate = Decimal('10.00')
        config.save()
        data = self.api().get('/api/v1/accounting/mri/?month=2026-09').json()
        self.assertEqual(data['mri_due'], '10000.00')

    def test_band_reflects_the_rolling_twelve_months(self):
        self.pay(10000, aware(2026, 9, 5))
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['band'], 'below')
        for month in range(1, 9):
            self.pay(40000, aware(2026, month, 5))
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['band'], 'within')

    def test_rounding_is_to_the_cent(self):
        self.pay('12345.67', aware(2026, 9, 5))
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['mri_due'], '925.93')

    def test_the_year_view_totals_every_month(self):
        self.pay(10000, aware(2026, 1, 5))
        self.pay(20000, aware(2026, 3, 5))
        year = self.api().get('/api/v1/accounting/mri/year/?year=2026').json()
        self.assertEqual(len(year['months']), 12)
        self.assertEqual(year['total_gross_rent'], '30000.00')
        self.assertEqual(year['total_mri_due'], '2250.00')


class FilingTrackerTests(AccountingBase):
    def test_marking_a_finished_month_as_filed_snapshots_the_figures(self):
        self.pay(40000, aware(2026, 8, 5))
        with mock.patch('accounting.services.timezone.localdate', return_value=date(2026, 9, 12)), \
                mock.patch('accounting.views.timezone.localdate', return_value=date(2026, 9, 12)):
            resp = self.api().post('/api/v1/accounting/mri/2026-08/filed/', {'reference': 'RCPT123'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['status'], 'filed')
        filing = MriFiling.objects.get()
        self.assertEqual((filing.gross_rent, filing.mri_amount, filing.reference), (Decimal('40000.00'), Decimal('3000.00'), 'RCPT123'))
        self.assertTrue(AuditLog.objects.filter(action='mri_marked_filed').exists())

    def test_a_correction_after_filing_is_flagged(self):
        self.pay(40000, aware(2026, 8, 5))
        with mock.patch('accounting.views.timezone.localdate', return_value=date(2026, 9, 12)):
            self.api().post('/api/v1/accounting/mri/2026-08/filed/', {}, format='json')
        self.pay(5000, aware(2026, 8, 20))  # rent recorded late
        data = self.api().get('/api/v1/accounting/mri/?month=2026-08').json()
        self.assertTrue(data['filing']['changed_since'])
        self.assertEqual(data['filing']['gross_rent_at_filing'], '40000.00')

    def test_a_month_still_in_progress_cannot_be_marked_filed(self):
        today = timezone.localdate()
        resp = self.api().post(f'/api/v1/accounting/mri/{today.strftime("%Y-%m")}/filed/', {}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(MriFiling.objects.count(), 0)

    def test_it_can_be_undone_and_bad_months_are_rejected(self):
        MriFiling.objects.create(organization=self.org, month=date(2026, 8, 1), gross_rent=1, rate=7.5, mri_amount=0)
        self.assertEqual(self.api().delete('/api/v1/accounting/mri/2026-08/filed/').status_code, 200)
        self.assertEqual(MriFiling.objects.count(), 0)
        self.assertEqual(self.api().post('/api/v1/accounting/mri/nonsense/filed/', {}, format='json').status_code, 400)

    def test_status_moves_from_due_to_overdue_after_the_deadline(self):
        self.pay(10000, aware(2026, 8, 5))
        with mock.patch('accounting.services.timezone.localdate', return_value=date(2026, 9, 10)):
            self.assertEqual(services.mri_for_month(self.org, date(2026, 8, 1))['status'], 'due')
        with mock.patch('accounting.services.timezone.localdate', return_value=date(2026, 9, 21)):
            self.assertEqual(services.mri_for_month(self.org, date(2026, 8, 1))['status'], 'overdue')


class ExpenseTests(AccountingBase):
    def _post(self, **overrides):
        payload = {'category': 'repairs', 'amount': '2500', 'incurred_on': '2026-09-03', 'vendor': 'Fundi Joe',
                   'description': 'Fix tap', 'property': str(self.prop_a.id)}
        payload.update(overrides)
        return self.api().post('/api/v1/accounting/expenses/', payload, format='json')

    def test_record_list_and_filter(self):
        self.assertEqual(self._post().status_code, 201)
        self._post(category='utilities', amount='1000', incurred_on='2026-08-10')
        listing = self.api().get('/api/v1/accounting/expenses/?month=2026-09').json()
        self.assertEqual((listing['count'], listing['results'][0]['category_label'], listing['results'][0]['property_name']),
                         (1, 'Repairs and maintenance', 'Greenview'))
        self.assertEqual(self.api().get('/api/v1/accounting/expenses/?category=utilities').json()['count'], 1)

    def test_validation(self):
        for override in ({'amount': '0'}, {'amount': '-5'}, {'amount': 'abc'}, {'category': 'yacht'},
                         {'incurred_on': 'soon'}, {'incurred_on': '2099-01-01'}, {'property': 'not-a-uuid'}):
            with self.subTest(override=override):
                self.assertEqual(self._post(**override).status_code, 400)
        self.assertEqual(Expense.objects.count(), 0)

    def test_cannot_attach_another_landlords_property(self):
        other = Organization.objects.create(name='Other', owner=self._user('o@t.com', 'landlord'))
        foreign = Property.objects.create(organization=other, name='Theirs', address='x', city='y')
        self.assertEqual(self._post(property=str(foreign.id)).status_code, 400)

    def test_removing_voids_with_a_reason_and_keeps_the_record(self):
        expense_id = self._post().json()['id']
        self.assertEqual(self.api().delete(f'/api/v1/accounting/expenses/{expense_id}/').status_code, 400)  # no reason
        resp = self.api().delete(f'/api/v1/accounting/expenses/{expense_id}/', {'reason': 'Entered twice'}, format='json')
        self.assertEqual(resp.status_code, 200)
        expense = Expense.objects.get()
        self.assertTrue(expense.is_void)
        self.assertEqual(self.api().get('/api/v1/accounting/expenses/').json()['count'], 0)
        self.assertEqual(self.api().get('/api/v1/accounting/expenses/?include_void=true').json()['count'], 1)
        self.assertEqual(self.api().patch(f'/api/v1/accounting/expenses/{expense_id}/', {'amount': '1'}, format='json').status_code, 400)
        self.assertTrue(AuditLog.objects.filter(action='expense_voided').exists())

    def test_edit(self):
        expense_id = self._post().json()['id']
        resp = self.api().patch(f'/api/v1/accounting/expenses/{expense_id}/', {'amount': '3100'}, format='json')
        self.assertEqual(resp.json()['amount'], '3100.00')

    def test_receipt_upload_rules(self):
        good = SimpleUploadedFile('my receipt.JPG', b'\xff\xd8\xff', content_type='image/jpeg')
        resp = self.api().post('/api/v1/accounting/expenses/', {
            'category': 'repairs', 'amount': '100', 'incurred_on': '2026-09-03', 'receipt': good}, format='multipart')
        self.assertEqual(resp.status_code, 201)
        url = resp.json()['receipt_url']
        self.assertTrue(url.endswith('.jpg'))
        self.assertNotIn('receipt', url.rsplit('/', 1)[-1])  # the user's file name is not kept
        for name, data in (('virus.exe', b'MZ'), ('big.jpg', b'x' * (5 * 1024 * 1024 + 1))):
            bad = self.api().post('/api/v1/accounting/expenses/', {
                'category': 'repairs', 'amount': '100', 'incurred_on': '2026-09-03',
                'receipt': SimpleUploadedFile(name, data)}, format='multipart')
            self.assertEqual(bad.status_code, 400, name)

    def test_only_this_landlords_expenses_are_visible_or_editable(self):
        other_landlord = self._user('o@t.com', 'landlord')
        Organization.objects.create(name='Other', owner=other_landlord)
        expense_id = self._post().json()['id']
        self.assertEqual(self.api(other_landlord).get('/api/v1/accounting/expenses/').json()['count'], 0)
        self.assertEqual(self.api(other_landlord).patch(f'/api/v1/accounting/expenses/{expense_id}/', {'amount': '1'}, format='json').status_code, 404)

    def test_pagination(self):
        for n in range(23):
            self._post(description=f'item {n}')
        first = self.api().get('/api/v1/accounting/expenses/').json()
        self.assertEqual((first['count'], len(first['results'])), (23, 20))
        self.assertEqual(len(self.api().get('/api/v1/accounting/expenses/?page=2').json()['results']), 3)


class SummaryTests(AccountingBase):
    def test_income_expenses_and_net_per_property(self):
        self.pay(30000, aware(2026, 9, 5), prop=self.prop_a)
        self.pay(20000, aware(2026, 9, 6), prop=self.prop_b)
        Expense.objects.create(organization=self.org, parent_property=self.prop_a, category='repairs', amount=4000, incurred_on=date(2026, 9, 2))
        Expense.objects.create(organization=self.org, category='insurance', amount=1000, incurred_on=date(2026, 9, 9))
        Expense.objects.create(organization=self.org, category='repairs', amount=9999, incurred_on=date(2026, 9, 9), is_void=True)
        Expense.objects.create(organization=self.org, category='repairs', amount=500, incurred_on=date(2026, 8, 9))
        data = self.api().get('/api/v1/accounting/summary/?month=2026-09').json()
        self.assertEqual((data['income'], data['expenses'], data['net']), ('50000.00', '5000.00', '45000.00'))
        by_prop = {r['property_name']: r for r in data['by_property']}
        self.assertEqual(by_prop['Greenview']['net'], '26000.00')
        self.assertEqual(by_prop['General (no property)']['expenses'], '1000.00')
        self.assertEqual({c['category']: c['amount'] for c in data['expenses_by_category']}, {'repairs': '4000.00', 'insurance': '1000.00'})


class ExportTests(AccountingBase):
    def _rows(self, url):
        resp = self.api().get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('attachment', resp['Content-Disposition'])
        return list(csv.reader(io.StringIO(resp.content.decode())))

    def setUp(self):
        super().setUp()
        self.pay(30000, aware(2026, 9, 5))
        Expense.objects.create(organization=self.org, parent_property=self.prop_a, category='repairs', amount=4000,
                               incurred_on=date(2026, 9, 7), vendor='Fundi Joe', description='Tap')

    def test_quickbooks_bank_csv_matches_the_documented_three_columns(self):
        rows = self._rows('/api/v1/accounting/export/?kind=quickbooks_bank&from=2026-09-01&to=2026-09-30')
        self.assertEqual(rows[0], ['Date', 'Description', 'Amount'])
        self.assertEqual(rows[1], ['05/09/2026', 'Rent from Jane Wanjiku A1', '30000.00'])
        self.assertEqual(rows[2][0], '07/09/2026')
        self.assertEqual(rows[2][2], '-4000.00')  # money out is negative
        self.assertTrue(all(len(r) == 3 for r in rows))

    def test_quickbooks_journal_entries_balance(self):
        rows = self._rows('/api/v1/accounting/export/?kind=quickbooks_journal&from=2026-09-01&to=2026-09-30')
        self.assertEqual(rows[0][:5], ['Journal No', 'Journal Date', 'Account Name', 'Debits', 'Credits'])
        by_entry = {}
        for r in rows[1:]:
            debit = Decimal(r[3] or 0)
            credit = Decimal(r[4] or 0)
            totals = by_entry.setdefault(r[0], [Decimal(0), Decimal(0)])
            totals[0] += debit
            totals[1] += credit
        self.assertEqual(len(by_entry), 2)
        self.assertTrue(all(d == c and d > 0 for d, c in by_entry.values()))
        accounts = {r[2] for r in rows[1:]}
        self.assertEqual(accounts, {'Bank Account', 'Rental Income', 'Repairs and Maintenance'})

    def test_ledger_and_mri_exports(self):
        ledger = self._rows('/api/v1/accounting/export/?kind=ledger&from=2026-09-01&to=2026-09-30')
        self.assertEqual([r[1] for r in ledger[1:]], ['Income', 'Expense'])
        mri = self._rows('/api/v1/accounting/export/?kind=mri&year=2026')
        self.assertEqual(mri[-1][0], 'Total')
        self.assertEqual(mri[-1][3], '2250.00')

    def test_spreadsheet_formulas_in_user_text_are_neutralised(self):
        Property.objects.filter(pk=self.prop_a.pk).update(name='=cmd|calc')
        Expense.objects.create(organization=self.org, category='other', amount=1, incurred_on=date(2026, 9, 8),
                               vendor='=HYPERLINK("http://evil")', description='x')
        rows = self._rows('/api/v1/accounting/export/?kind=ledger&from=2026-09-01&to=2026-09-30')
        cells = [cell for row in rows for cell in row]
        self.assertTrue(any(c.startswith("'=") for c in cells))          # neutralised
        self.assertFalse(any(c.startswith('=') for c in cells))          # nothing left that a spreadsheet would run
        amounts = [r[6] for r in rows[1:]]
        self.assertIn('-4000.00', amounts)                                # real numbers are untouched

    def test_bad_ranges_are_rejected(self):
        for url in ('/api/v1/accounting/export/?kind=ledger&from=nope', '/api/v1/accounting/export/?kind=ledger&from=2026-09-30&to=2026-09-01',
                    '/api/v1/accounting/export/?kind=ledger&from=2000-01-01&to=2026-01-01', '/api/v1/accounting/export/?kind=payroll'):
            self.assertEqual(self.api().get(url).status_code, 400, url)


class AccessTests(AccountingBase):
    def test_only_landlords_and_super_admins_reach_it(self):
        for role in ('tenant', 'caretaker', 'tech_support'):
            user = self._user(f'{role}@t.com', role)
            with self.subTest(role=role):
                self.assertEqual(self.api(user).get('/api/v1/accounting/mri/').status_code, 403)
        self.assertIn(APIClient().get('/api/v1/accounting/mri/').status_code, (401, 403))

    def test_a_super_admin_needs_to_name_the_organization(self):
        admin = self._user('admin@t.com', 'super_admin')
        self.assertEqual(self.api(admin).get('/api/v1/accounting/mri/?month=2026-09').status_code, 404)
        self.assertEqual(self.api(admin).get(f'/api/v1/accounting/mri/?month=2026-09&organization_id={self.org.id}').status_code, 200)

    def test_a_landlord_cannot_read_another_organization_by_id(self):
        other_landlord = self._user('o@t.com', 'landlord')
        other = Organization.objects.create(name='Other', owner=other_landlord)
        self.pay(500, aware(2026, 9, 5), org=other)
        data = self.api().get(f'/api/v1/accounting/mri/?month=2026-09&organization_id={other.id}').json()
        # Not theirs: falls back to nothing rather than leaking the other org.
        self.assertNotEqual(data.get('gross_rent'), '500.00')

    def test_free_on_every_plan_tier_no_gating(self):
        from django.core.management import call_command
        from billing.models import SubscriptionPlan
        call_command('seed_subscription_plans')
        self.org.created_at = timezone.now() - timedelta(days=400)  # long past the trial: Starter limits
        self.org.save(update_fields=['created_at'])
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').status_code, 200)
        self.assertEqual(self.api().get('/api/v1/accounting/summary/?month=2026-09').status_code, 200)
        self.assertEqual(self.api().get('/api/v1/accounting/export/?kind=mri&year=2026').status_code, 200)


class TaxProfileTests(AccountingBase):
    def test_kra_pin_is_validated_and_normalised(self):
        ok = self.api().put('/api/v1/accounting/tax-profile/', {'kra_pin': ' a123456789b '}, format='json')
        self.assertEqual(ok.json()['kra_pin'], 'A123456789B')
        for bad in ('12345', 'Z123456789B', 'A12345678B', 'A123456789'):
            with self.subTest(bad=bad):
                self.assertEqual(self.api().put('/api/v1/accounting/tax-profile/', {'kra_pin': bad}, format='json').status_code, 400)
        self.assertEqual(self.api().get('/api/v1/accounting/tax-profile/').json()['kra_pin'], 'A123456789B')

    def test_a_pin_can_be_cleared(self):
        self.api().put('/api/v1/accounting/tax-profile/', {'kra_pin': 'A123456789B'}, format='json')
        self.assertEqual(self.api().put('/api/v1/accounting/tax-profile/', {'kra_pin': ''}, format='json').json()['kra_pin'], '')


class ReminderTests(AccountingBase):
    def setUp(self):
        super().setUp()
        self.pay(40000, aware(2026, 8, 5))

    def _run(self, on):
        from accounting.tasks import send_mri_reminders
        with mock.patch('accounting.tasks.timezone.localdate', return_value=on), \
                mock.patch('accounting.services.timezone.localdate', return_value=on), \
                mock.patch('accounts.utils.send_branded_email') as email:
            result = send_mri_reminders()
        return result, email

    def test_reminds_five_days_before_the_deadline_with_the_figures(self):
        result, email = self._run(date(2026, 9, 15))
        self.assertEqual(result['sent'], 1)
        body = email.call_args.kwargs['message']
        self.assertIn('KES 40000.00', body)
        self.assertIn('KES 3000.00', body)
        self.assertIn('20 September 2026', body)
        self.assertIn('does not file for you', body)
        from notifications.models import Notification
        note = Notification.objects.get(notification_type='mri_reminder')
        self.assertEqual(note.recipient, self.landlord)
        self.assertEqual(note.metadata['url'], '/landlord/rental/accounting')

    def test_no_reminder_on_other_days_or_once_filed(self):
        self.assertEqual(self._run(date(2026, 9, 10))[0]['sent'], 0)
        MriFiling.objects.create(organization=self.org, month=date(2026, 8, 1), gross_rent=1, rate=7.5, mri_amount=0)
        self.assertEqual(self._run(date(2026, 9, 15))[0]['sent'], 0)

    def test_overdue_wording_the_day_after(self):
        result, email = self._run(date(2026, 9, 21))
        self.assertEqual(result['sent'], 1)
        self.assertIn('now overdue', email.call_args.kwargs['message'])

    def test_landlords_who_never_collected_rent_are_not_nagged(self):
        Payment.objects.all().delete()
        self.assertEqual(self._run(date(2026, 9, 15))[0]['sent'], 0)

    def test_one_failure_does_not_stop_the_rest(self):
        other = Organization.objects.create(name='Second', owner=self._user('o@t.com', 'landlord'))
        self.pay(1000, aware(2026, 8, 6), org=other)
        from accounting.tasks import send_mri_reminders
        with mock.patch('accounting.tasks.timezone.localdate', return_value=date(2026, 9, 15)), \
                mock.patch('accounting.services.timezone.localdate', return_value=date(2026, 9, 15)), \
                mock.patch('accounts.utils.send_branded_email', side_effect=[Exception('smtp'), None]):
            self.assertEqual(send_mri_reminders()['sent'], 1)


class TaxRateAdminTests(AccountingBase):
    def setUp(self):
        super().setUp()
        from platform_settings import service
        self.admin = self._user('root@t.com', 'super_admin')
        service.unlock(self.admin)

    def test_a_super_admin_changes_the_rate_and_landlord_figures_follow(self):
        self.pay(100000, aware(2026, 9, 5))
        resp = self.api(self.admin).put('/api/v1/platform-settings/tax-rates/', {
            'mri_rate': '10', 'mri_annual_min': '288000', 'mri_annual_max': '15000000', 'filing_due_day': 20}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(self.api().get('/api/v1/accounting/mri/?month=2026-09').json()['mri_due'], '10000.00')
        self.assertTrue(AuditLog.objects.filter(action='tax_rates_updated').exists())

    def test_bad_values_are_rejected_and_landlords_cannot_edit(self):
        for payload in ({'mri_rate': '0'}, {'mri_rate': '90'}, {'mri_rate': 'x'},
                        {'mri_rate': '7.5', 'mri_annual_min': '500', 'mri_annual_max': '100'},
                        {'mri_rate': '7.5', 'mri_annual_min': '1', 'mri_annual_max': '2', 'filing_due_day': 40}):
            with self.subTest(payload=payload):
                self.assertEqual(self.api(self.admin).put('/api/v1/platform-settings/tax-rates/', payload, format='json').status_code, 400)
        self.assertEqual(TaxRateConfig.get().mri_rate, Decimal('7.50'))
        self.assertEqual(self.api().put('/api/v1/platform-settings/tax-rates/', {'mri_rate': '5'}, format='json').status_code, 403)
