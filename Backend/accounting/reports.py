"""
Financial reports from the journal — trial balance, income statement,
balance sheet — plus manual journal entries and bank/M-Pesa statement
reconciliation (CSV import).
"""

from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Optional

from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone

from accounting.models import StatementImport, StatementLine
from ledger.models import Account, JournalLine
from ledger.services.posting import LedgerError, LedgerService, Leg
from properties.models import Tenancy, normalize_payment_reference
from rent.models import Payment

ZERO = Decimal('0.00')
MAX_IMPORT_LINES = 5000


class ReportError(ValueError):
    pass


def _natural(account: Account, debit: Decimal, credit: Decimal) -> Decimal:
    return debit - credit if account.account_type in Account.DEBIT_NORMAL else credit - debit


def _totals(organization, filters: Q) -> dict:
    rows = (
        JournalLine.objects.filter(Q(entry__organization=organization) & filters)
        .values('account_id').annotate(dr=Sum('debit'), cr=Sum('credit'))
    )
    return {r['account_id']: (r['dr'] or ZERO, r['cr'] or ZERO) for r in rows}


class Reports:
    @staticmethod
    def trial_balance(organization, as_of: date) -> dict:
        totals = _totals(organization, Q(entry__entry_date__lte=as_of))
        rows, total_dr, total_cr = [], ZERO, ZERO
        for account in Account.objects.filter(organization=organization).order_by('code'):
            dr, cr = totals.get(account.pk, (ZERO, ZERO))
            net = dr - cr
            if not net:
                continue
            debit, credit = (net, ZERO) if net > 0 else (ZERO, -net)
            total_dr += debit
            total_cr += credit
            rows.append({'code': account.code, 'name': account.name, 'type': account.account_type,
                         'debit': str(debit), 'credit': str(credit)})
        return {'as_of': as_of.isoformat(), 'accounts': rows, 'total_debit': str(total_dr),
                'total_credit': str(total_cr), 'balanced': total_dr == total_cr}

    @staticmethod
    def income_statement(organization, start: date, end: date, property_obj=None) -> dict:
        filters = Q(entry__entry_date__gte=start, entry__entry_date__lte=end)
        if property_obj is not None:
            filters &= Q(parent_property=property_obj)
        totals = _totals(organization, filters)
        income, expenses = [], []
        for account in Account.objects.filter(organization=organization, account_type__in=('income', 'expense')).order_by('code'):
            dr, cr = totals.get(account.pk, (ZERO, ZERO))
            amount = _natural(account, dr, cr)
            if amount:
                (income if account.account_type == 'income' else expenses).append(
                    {'code': account.code, 'name': account.name, 'amount': str(amount)})
        total_income = sum((Decimal(r['amount']) for r in income), ZERO)
        total_expenses = sum((Decimal(r['amount']) for r in expenses), ZERO)
        return {'period_start': start.isoformat(), 'period_end': end.isoformat(),
                'property': property_obj.name if property_obj else None,
                'income': income, 'expenses': expenses, 'total_income': str(total_income),
                'total_expenses': str(total_expenses), 'net_income': str(total_income - total_expenses)}

    @staticmethod
    def balance_sheet(organization, as_of: date) -> dict:
        totals = _totals(organization, Q(entry__entry_date__lte=as_of))
        sections = {'asset': [], 'liability': [], 'equity': []}
        earnings = ZERO
        for account in Account.objects.filter(organization=organization).order_by('code'):
            dr, cr = totals.get(account.pk, (ZERO, ZERO))
            amount = _natural(account, dr, cr)
            if account.account_type == 'income':
                earnings += amount
            elif account.account_type == 'expense':
                earnings -= amount
            elif amount:
                sections[account.account_type].append({'code': account.code, 'name': account.name, 'amount': str(amount)})
        sections['equity'].append({'code': '—', 'name': 'Retained earnings (all income less expenses)', 'amount': str(earnings)})
        sums = {k: sum((Decimal(r['amount']) for r in v), ZERO) for k, v in sections.items()}
        return {'as_of': as_of.isoformat(), 'assets': sections['asset'], 'liabilities': sections['liability'],
                'equity': sections['equity'], 'total_assets': str(sums['asset']),
                'total_liabilities_and_equity': str(sums['liability'] + sums['equity']),
                'balanced': sums['asset'] == sums['liability'] + sums['equity']}

    @staticmethod
    def accounts(organization) -> list[dict]:
        totals = _totals(organization, Q())
        return [
            {'code': a.code, 'name': a.name, 'type': a.account_type,
             'balance': str(_natural(a, *totals.get(a.pk, (ZERO, ZERO))))}
            for a in Account.objects.filter(organization=organization).order_by('code')
        ]


class ManualJournalService:
    @staticmethod
    def post(organization, entry_date: date, memo: str, lines: list[dict], created_by=None):
        """lines: [{'account': '1010', 'debit': '100', 'credit': '0', 'description': ''}] — must balance."""
        if not memo.strip():
            raise ReportError('Describe the journal entry.')
        legs = []
        for line in lines:
            try:
                debit = Decimal(str(line.get('debit') or 0))
                credit = Decimal(str(line.get('credit') or 0))
            except InvalidOperation as exc:
                raise ReportError('Amounts must be numbers.') from exc
            legs.append(Leg(str(line.get('account', '')), debit=debit, credit=credit, description=str(line.get('description', ''))))
        try:
            return LedgerService.post(organization, entry_date, legs, source_type='manual', memo=memo, created_by=created_by)
        except LedgerError as exc:
            raise ReportError(str(exc)) from exc


# ----------------------------------------------------------- reconciliation

DATE_FORMATS = ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d/%m/%Y %H:%M:%S', '%Y-%m-%d %H:%M:%S', '%d.%m.%Y', '%d %b %Y')
MPESA_CODE = re.compile(r'\b[A-Z0-9]{10}\b')


def _parse_date(value: str) -> date:
    value = (value or '').strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ReportError(f'Unrecognised date "{value}" — use YYYY-MM-DD or DD/MM/YYYY.')


def _parse_amount(value: str) -> Optional[Decimal]:
    cleaned = (value or '').replace(',', '').replace('KES', '').replace('Ksh', '').strip()
    if not cleaned:
        return None
    try:
        return Decimal(cleaned).quantize(Decimal('0.01'))
    except InvalidOperation as exc:
        raise ReportError(f'Unrecognised amount "{value}".') from exc


class ReconciliationService:
    """
    CSV columns are mapped by header name: date, amount (money in), and
    optionally reference and description. Only money-in lines are imported.
    M-Pesa org statements: date="Completion Time", amount="Paid In",
    reference="Receipt No.", description="Details".
    """

    @classmethod
    @transaction.atomic
    def import_csv(cls, organization, account_code: str, upload, mapping: dict, imported_by=None) -> StatementImport:
        if account_code not in dict(StatementImport.ACCOUNT_CHOICES):
            raise ReportError('Choose the bank or M-Pesa account this statement is for.')
        for key in ('date', 'amount'):
            if not mapping.get(key):
                raise ReportError(f'Say which column holds the {key}.')
        text = upload.read().decode('utf-8-sig', errors='replace')
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames or []
        missing = [mapping[k] for k in ('date', 'amount', 'reference', 'description') if mapping.get(k) and mapping[k] not in headers]
        if missing:
            raise ReportError(f'Columns not found in the file: {", ".join(missing)}. Found: {", ".join(headers)}.')
        statement = StatementImport.objects.create(organization=organization, account_code=account_code,
                                                   filename=getattr(upload, 'name', 'statement.csv')[:255],
                                                   imported_by=imported_by)
        lines = []
        for index, row in enumerate(reader):
            if index >= MAX_IMPORT_LINES:
                raise ReportError(f'Import at most {MAX_IMPORT_LINES} lines at a time.')
            amount = _parse_amount(row.get(mapping['amount'], ''))
            if amount is None or amount <= 0:
                continue  # money out / blank lines are not tenant payments
            lines.append(StatementLine(
                statement=statement, line_date=_parse_date(row.get(mapping['date'], '')), amount=amount,
                reference=(row.get(mapping.get('reference') or '', '') or '').strip()[:100],
                description=(row.get(mapping.get('description') or '', '') or '').strip()[:255],
            ))
        StatementLine.objects.bulk_create(lines)
        cls.auto_match(statement)
        return statement

    @classmethod
    def auto_match(cls, statement: StatementImport) -> None:
        payments = Payment.objects.filter(organization=statement.organization, status='success')
        claimed = set(StatementLine.objects.filter(statement__organization=statement.organization,
                                                   payment__isnull=False).values_list('payment_id', flat=True))
        tenancies = list(Tenancy.objects.filter(organization=statement.organization).exclude(payment_reference=''))
        for line in statement.lines.filter(status='unmatched'):
            codes = {line.reference.upper()} | set(MPESA_CODE.findall(f'{line.reference} {line.description}'.upper()))
            codes.discard('')
            match = next((p for p in payments.filter(
                Q(provider_reference__in=codes) | Q(internal_reference__in=codes) | Q(internal_reference__in=[f'MPESA-{c}' for c in codes])
            ) if p.pk not in claimed and p.amount == line.amount), None)
            if match is None:
                # Same amount, same day, and the tenancy's account number in the narrative.
                text = normalize_payment_reference(f'{line.reference} {line.description}')
                candidates = [t for t in tenancies if t.payment_reference and t.payment_reference in text]
                if len(candidates) == 1:
                    match = next((p for p in payments.filter(tenancy=candidates[0], amount=line.amount,
                                                              paid_at__date=line.line_date) if p.pk not in claimed), None)
            if match is not None:
                line.status, line.payment = 'matched', match
                line.save(update_fields=['status', 'payment'])
                claimed.add(match.pk)

    @staticmethod
    @transaction.atomic
    def assign(line: StatementLine, tenancy: Tenancy, user=None) -> Payment:
        """Record an unmatched statement line as a tenant payment (allocated, receipted, booked)."""
        from rent.services.payment_service import PaymentService

        line = StatementLine.objects.select_for_update().select_related('statement').get(pk=line.pk)
        if line.status != 'unmatched':
            raise ReportError('This line is already resolved.')
        if tenancy.organization_id != line.statement.organization_id:
            raise ReportError('That tenancy belongs to another organization.')
        method = {'1010': 'bank_transfer', '1020': 'mpesa_paybill', '1000': 'cash'}[line.statement.account_code]
        payment = Payment.objects.create(
            organization=tenancy.organization, tenancy=tenancy, tenant=tenancy.tenant,
            parent_property=tenancy.parent_property, unit=tenancy.unit, amount=line.amount,
            payment_method=method, provider='statement', provider_reference=line.reference,
            internal_reference=f'RUMIA-STMT-{str(line.pk)[:8].upper()}-{line.line_date:%Y%m%d}',
            status='success', paid_at=timezone.make_aware(datetime.combine(line.line_date, time(12, 0))),
            notes=f'From statement {line.statement.filename}: {line.description}'[:500], recorded_by=user, verified_by=user,
        )
        PaymentService.settle_received(payment, created_by=user)
        line.status, line.payment = 'created', payment
        line.save(update_fields=['status', 'payment'])
        return payment

    @staticmethod
    def ignore(line: StatementLine, note: str) -> StatementLine:
        if line.status != 'unmatched':
            raise ReportError('This line is already resolved.')
        if not note.strip():
            raise ReportError('Say why (e.g. "transfer between own accounts").')
        line.status, line.note = 'ignored', note.strip()[:255]
        line.save(update_fields=['status', 'note'])
        return line
