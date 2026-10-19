"""
LedgerService — the only code path that writes journal entries.

Callers describe a posting as a list of `Leg`s; the service resolves account
codes for the organization, enforces the double-entry invariant, and writes
the entry and its lines in one transaction.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Iterable, Optional

from django.db import transaction
from django.db.models import Sum

from ledger.models import Account, JournalEntry, JournalLine
from ledger.services.chart import ensure_chart_of_accounts

ZERO = Decimal('0.00')
CENT = Decimal('0.01')


class LedgerError(Exception):
    """Raised for an unbalanced, empty or otherwise invalid posting."""


@dataclass
class Leg:
    """One side of a posting. Exactly one of debit/credit must be positive."""

    account_code: str
    debit: Decimal = ZERO
    credit: Decimal = ZERO
    description: str = ''
    dimensions: dict = field(default_factory=dict)  # tenancy, tenant, parent_property, unit

    @classmethod
    def dr(cls, account_code: str, amount, description: str = '', **dimensions) -> 'Leg':
        return cls(account_code, debit=Decimal(amount), description=description, dimensions=dimensions)

    @classmethod
    def cr(cls, account_code: str, amount, description: str = '', **dimensions) -> 'Leg':
        return cls(account_code, credit=Decimal(amount), description=description, dimensions=dimensions)


DIMENSION_KEYS = ('tenancy', 'tenant', 'parent_property', 'unit')


def rental_dimensions(obj) -> dict:
    """Dimension kwargs from any object carrying tenancy/tenant/parent_property/unit attributes."""
    return {key: getattr(obj, key, None) for key in DIMENSION_KEYS if getattr(obj, key, None) is not None}


class LedgerService:
    @classmethod
    @transaction.atomic
    def post(
        cls,
        organization,
        entry_date: date,
        legs: Iterable[Leg],
        source_type: str,
        source_id: str = '',
        memo: str = '',
        created_by=None,
        reverses: Optional[JournalEntry] = None,
    ) -> JournalEntry:
        legs = [leg for leg in legs if leg.debit or leg.credit]
        if not legs:
            raise LedgerError('A journal entry needs at least one non-zero leg')

        for leg in legs:
            leg.debit = Decimal(leg.debit).quantize(CENT)
            leg.credit = Decimal(leg.credit).quantize(CENT)
            if leg.debit < 0 or leg.credit < 0:
                raise LedgerError(f'Negative amount on account {leg.account_code}')
            if leg.debit and leg.credit:
                raise LedgerError(f'Leg on account {leg.account_code} has both debit and credit')
            unknown = set(leg.dimensions) - set(DIMENSION_KEYS)
            if unknown:
                raise LedgerError(f'Unknown ledger dimensions: {sorted(unknown)}')

        total_debit = sum((leg.debit for leg in legs), ZERO)
        total_credit = sum((leg.credit for leg in legs), ZERO)
        if total_debit != total_credit:
            raise LedgerError(f'Unbalanced entry: debit {total_debit} != credit {total_credit}')

        accounts = cls._accounts(organization, {leg.account_code for leg in legs})

        entry = JournalEntry.objects.create(
            organization=organization,
            entry_date=entry_date,
            memo=memo[:255],
            source_type=source_type,
            source_id=str(source_id),
            created_by=created_by,
            reverses=reverses,
        )
        JournalLine.objects.bulk_create([
            JournalLine(
                entry=entry,
                account=accounts[leg.account_code],
                debit=leg.debit,
                credit=leg.credit,
                description=leg.description[:255],
                **leg.dimensions,
            )
            for leg in legs
        ])
        return entry

    @classmethod
    @transaction.atomic
    def reverse(cls, entry: JournalEntry, entry_date: date, memo: str = '', created_by=None) -> JournalEntry:
        """Post the mirror image of `entry`. An entry can be reversed only once."""
        entry = JournalEntry.objects.select_for_update().get(pk=entry.pk)
        if hasattr(entry, 'reversed_by'):
            raise LedgerError(f'Journal entry {entry.pk} is already reversed')
        legs = [
            Leg(
                line.account.code,
                debit=line.credit,
                credit=line.debit,
                description=line.description,
                dimensions={
                    key: getattr(line, key) for key in DIMENSION_KEYS if getattr(line, f'{key}_id') is not None
                },
            )
            for line in entry.lines.select_related('account', 'tenancy', 'tenant', 'parent_property', 'unit')
        ]
        return cls.post(
            entry.organization,
            entry_date,
            legs,
            source_type='reversal',
            source_id=str(entry.pk),
            memo=memo or f'Reversal of {entry.memo}',
            created_by=created_by,
            reverses=entry,
        )

    @classmethod
    def entries_for(cls, source_type: str, source_id) -> list[JournalEntry]:
        return list(JournalEntry.objects.filter(source_type=source_type, source_id=str(source_id)))

    @classmethod
    def balance(cls, organization, account_code: str, as_of: Optional[date] = None, **dimensions) -> Decimal:
        """
        Natural-sign balance of an account: debit − credit for asset/expense,
        credit − debit for liability/equity/income. Filterable by dimensions.
        """
        account = Account.objects.get(organization=organization, code=account_code)
        lines = JournalLine.objects.filter(account=account, **dimensions)
        if as_of is not None:
            lines = lines.filter(entry__entry_date__lte=as_of)
        totals = lines.aggregate(debit=Sum('debit'), credit=Sum('credit'))
        debit = totals['debit'] or ZERO
        credit = totals['credit'] or ZERO
        return debit - credit if account.account_type in Account.DEBIT_NORMAL else credit - debit

    @staticmethod
    def _accounts(organization, codes: set[str]) -> dict[str, Account]:
        accounts = {
            a.code: a for a in Account.objects.filter(organization=organization, code__in=codes)
        }
        if len(accounts) != len(codes):
            # Organizations created before the ledger existed (or in tests
            # bypassing signals) get their chart lazily.
            ensure_chart_of_accounts(organization)
            accounts = {
                a.code: a for a in Account.objects.filter(organization=organization, code__in=codes)
            }
        missing = codes - set(accounts)
        if missing:
            raise LedgerError(f'Unknown account codes for organization: {sorted(missing)}')
        return accounts
