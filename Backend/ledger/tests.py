"""Ledger core tests — chart seeding, posting invariants, reversal, balances."""

from datetime import date
from decimal import Decimal

from django.db import IntegrityError, transaction

from ledger.models import Account, JournalEntry, JournalLine
from ledger.services import chart
from ledger.services.posting import LedgerError, LedgerService, Leg
from rumia_api.tests import RumiaTestFixtures

TODAY = date(2026, 10, 1)


def assert_ledger_balanced(testcase):
    """Every journal entry in the database must balance. Reused by other apps' tests."""
    for entry in JournalEntry.objects.prefetch_related('lines'):
        debit = sum((line.debit for line in entry.lines.all()), Decimal('0'))
        credit = sum((line.credit for line in entry.lines.all()), Decimal('0'))
        testcase.assertEqual(debit, credit, f'Unbalanced journal entry {entry.pk} ({entry.memo})')


class ChartOfAccountsTests(RumiaTestFixtures):
    def test_new_organization_gets_default_chart(self):
        _, _, org = self.create_landlord_with_org()
        codes = set(Account.objects.filter(organization=org).values_list('code', flat=True))
        self.assertEqual(codes, {code for code, _, _ in chart.DEFAULT_ACCOUNTS})

    def test_ensure_chart_is_idempotent(self):
        _, _, org = self.create_landlord_with_org()
        self.assertEqual(chart.ensure_chart_of_accounts(org), 0)
        self.assertEqual(Account.objects.filter(organization=org).count(), len(chart.DEFAULT_ACCOUNTS))


class PostingTests(RumiaTestFixtures):
    def setUp(self):
        _, _, self.org = self.create_landlord_with_org()

    def test_balanced_entry_posts_lines(self):
        entry = LedgerService.post(
            self.org, TODAY,
            [Leg.dr(chart.TENANT_RECEIVABLES, '22000'), Leg.cr(chart.RENT_INCOME, '22000')],
            source_type='invoice', source_id='inv-1', memo='October rent',
        )
        self.assertEqual(entry.lines.count(), 2)
        assert_ledger_balanced(self)

    def test_unbalanced_entry_is_rejected_and_writes_nothing(self):
        with self.assertRaises(LedgerError):
            LedgerService.post(
                self.org, TODAY,
                [Leg.dr(chart.TENANT_RECEIVABLES, '100'), Leg.cr(chart.RENT_INCOME, '99.99')],
                source_type='invoice',
            )
        self.assertEqual(JournalEntry.objects.count(), 0)

    def test_empty_or_zero_entry_is_rejected(self):
        with self.assertRaises(LedgerError):
            LedgerService.post(self.org, TODAY, [Leg.dr(chart.BANK, '0')], source_type='manual')

    def test_leg_with_both_sides_is_rejected(self):
        with self.assertRaises(LedgerError):
            LedgerService.post(
                self.org, TODAY,
                [Leg(chart.BANK, debit=Decimal('5'), credit=Decimal('5'))],
                source_type='manual',
            )

    def test_unknown_account_code_is_rejected(self):
        with self.assertRaises(LedgerError):
            LedgerService.post(
                self.org, TODAY, [Leg.dr('9999', '5'), Leg.cr(chart.BANK, '5')], source_type='manual',
            )

    def test_amounts_are_rounded_to_cents_before_balancing(self):
        LedgerService.post(
            self.org, TODAY,
            [Leg.dr(chart.BANK, '10.004'), Leg.cr(chart.OTHER_INCOME, '10.00')],
            source_type='manual',
        )
        assert_ledger_balanced(self)

    def test_one_sided_db_constraint(self):
        entry = LedgerService.post(
            self.org, TODAY, [Leg.dr(chart.BANK, '1'), Leg.cr(chart.OTHER_INCOME, '1')], source_type='manual',
        )
        account = Account.objects.get(organization=self.org, code=chart.BANK)
        with self.assertRaises(IntegrityError), transaction.atomic():
            JournalLine.objects.create(entry=entry, account=account, debit=Decimal('0'), credit=Decimal('0'))

    def test_lazily_seeds_chart_for_org_without_accounts(self):
        Account.objects.filter(organization=self.org).delete()
        LedgerService.post(
            self.org, TODAY, [Leg.dr(chart.BANK, '1'), Leg.cr(chart.OTHER_INCOME, '1')], source_type='manual',
        )
        self.assertEqual(Account.objects.filter(organization=self.org).count(), len(chart.DEFAULT_ACCOUNTS))


class BalanceAndReversalTests(RumiaTestFixtures):
    def setUp(self):
        _, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        _, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)

    def test_balances_respect_account_normal_side_and_dimensions(self):
        LedgerService.post(
            self.org, TODAY,
            [
                Leg.dr(chart.TENANT_RECEIVABLES, '22000', tenancy=self.tenancy),
                Leg.cr(chart.RENT_INCOME, '22000', parent_property=self.prop),
            ],
            source_type='invoice',
        )
        LedgerService.post(
            self.org, TODAY,
            [
                Leg.dr(chart.CASH_ON_HAND, '5000'),
                Leg.cr(chart.TENANT_RECEIVABLES, '5000', tenancy=self.tenancy),
            ],
            source_type='payment',
        )
        self.assertEqual(LedgerService.balance(self.org, chart.TENANT_RECEIVABLES), Decimal('17000'))
        self.assertEqual(
            LedgerService.balance(self.org, chart.TENANT_RECEIVABLES, tenancy=self.tenancy), Decimal('17000'),
        )
        self.assertEqual(LedgerService.balance(self.org, chart.RENT_INCOME), Decimal('22000'))
        self.assertEqual(
            LedgerService.balance(self.org, chart.RENT_INCOME, parent_property=self.prop), Decimal('22000'),
        )
        self.assertEqual(LedgerService.balance(self.org, chart.CASH_ON_HAND), Decimal('5000'))

    def test_balance_as_of_excludes_later_entries(self):
        LedgerService.post(
            self.org, date(2026, 11, 1),
            [Leg.dr(chart.BANK, '10'), Leg.cr(chart.OTHER_INCOME, '10')], source_type='manual',
        )
        self.assertEqual(LedgerService.balance(self.org, chart.BANK, as_of=TODAY), Decimal('0'))

    def test_reversal_nets_to_zero_and_keeps_dimensions(self):
        entry = LedgerService.post(
            self.org, TODAY,
            [
                Leg.dr(chart.TENANT_RECEIVABLES, '22000', tenancy=self.tenancy),
                Leg.cr(chart.RENT_INCOME, '22000'),
            ],
            source_type='invoice',
        )
        reversal = LedgerService.reverse(entry, TODAY)

        self.assertEqual(reversal.reverses_id, entry.pk)
        self.assertEqual(
            LedgerService.balance(self.org, chart.TENANT_RECEIVABLES, tenancy=self.tenancy), Decimal('0'),
        )
        self.assertEqual(LedgerService.balance(self.org, chart.RENT_INCOME), Decimal('0'))
        assert_ledger_balanced(self)

    def test_entry_cannot_be_reversed_twice(self):
        entry = LedgerService.post(
            self.org, TODAY, [Leg.dr(chart.BANK, '1'), Leg.cr(chart.OTHER_INCOME, '1')], source_type='manual',
        )
        LedgerService.reverse(entry, TODAY)
        with self.assertRaises(LedgerError):
            LedgerService.reverse(entry, TODAY)
