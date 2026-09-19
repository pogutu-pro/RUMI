"""Calculation layer: MRI figures, income and expense summaries, CSV export."""

import csv
import io
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from rent.models import Payment

from .models import Expense, MriFiling, TaxRateConfig

CENT = Decimal('0.01')


def money(value) -> Decimal:
    return Decimal(value or 0).quantize(CENT, rounding=ROUND_HALF_UP)


def month_start(year: int, month: int) -> date:
    return date(year, month, 1)


def next_month(d: date) -> date:
    return date(d.year + (d.month == 12), 1 if d.month == 12 else d.month + 1, 1)


def _aware_start(d: date) -> datetime:
    return timezone.make_aware(datetime(d.year, d.month, d.day))


def filing_deadline(month: date, config: TaxRateConfig) -> date:
    """Rent for a month is declared by the due day of the FOLLOWING month."""
    following = next_month(month)
    return date(following.year, following.month, min(config.filing_due_day, 28))


def rent_received(organization, start: date, end: date) -> dict:
    """
    Gross rent actually received between `start` (inclusive) and `end`
    (exclusive), on the Nairobi calendar. Cash basis, which is what MRI is
    charged on: a successful payment counts in the month it was paid; a
    reversed one does not count at all.
    """
    payments = Payment.objects.filter(
        organization=organization, status='success',
        paid_at__gte=_aware_start(start), paid_at__lt=_aware_start(end),
    )
    total = payments.aggregate(t=Sum('amount'), n=Count('id'))
    by_property = (
        payments.values('parent_property_id', 'parent_property__name')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')
    )
    return {
        'total': money(total['t']),
        'count': total['n'] or 0,
        'by_property': [
            {
                'property_id': str(row['parent_property_id']) if row['parent_property_id'] else None,
                'property_name': row['parent_property__name'] or 'Not linked to a property',
                'amount': money(row['amount']),
                'payments': row['count'],
            }
            for row in by_property
        ],
    }


def mri_for_month(organization, month: date, config: TaxRateConfig | None = None) -> dict:
    config = config or TaxRateConfig.get()
    received = rent_received(organization, month, next_month(month))
    gross = received['total']
    tax = money(gross * config.mri_rate / Decimal('100'))

    # Rolling twelve months up to and including this one, to show which band
    # the landlord is in. Informational only: the landlord decides.
    window_start = date(month.year - 1, month.month, 1)
    window_start = next_month(window_start)
    rolling = rent_received(organization, window_start, next_month(month))['total']

    deadline = filing_deadline(month, config)
    filing = MriFiling.objects.filter(organization=organization, month=month).first()
    today = timezone.localdate()
    if filing:
        status = 'filed'
    elif month >= today.replace(day=1):
        status = 'in_progress'  # the month has not finished
    elif today > deadline:
        status = 'overdue'
    else:
        status = 'due'

    if rolling < config.mri_annual_min:
        band = 'below'
    elif rolling > config.mri_annual_max:
        band = 'above'
    else:
        band = 'within'

    return {
        'month': month.isoformat(),
        'gross_rent': str(gross),
        'payments': received['count'],
        'rate': str(config.mri_rate),
        'mri_due': str(tax),
        'is_nil': gross == 0,
        'by_property': [{**p, 'amount': str(p['amount']), 'mri': str(money(p['amount'] * config.mri_rate / 100))}
                        for p in received['by_property']],
        'deadline': deadline.isoformat(),
        'status': status,
        'rolling_12_months': str(rolling),
        'band': band,
        'annual_min': str(config.mri_annual_min),
        'annual_max': str(config.mri_annual_max),
        'filing': None if not filing else {
            'filed_on': filing.filed_on.isoformat(),
            'reference': filing.reference,
            'gross_rent_at_filing': str(filing.gross_rent),
            'mri_at_filing': str(filing.mri_amount),
            'changed_since': money(filing.gross_rent) != gross,
        },
    }


def mri_for_year(organization, year: int) -> dict:
    config = TaxRateConfig.get()
    months = [mri_for_month(organization, month_start(year, m), config) for m in range(1, 13)]
    total_gross = sum((Decimal(m['gross_rent']) for m in months), Decimal('0'))
    total_tax = sum((Decimal(m['mri_due']) for m in months), Decimal('0'))
    return {
        'year': year,
        'months': months,
        'total_gross_rent': str(money(total_gross)),
        'total_mri_due': str(money(total_tax)),
    }


def summary(organization, start: date, end: date) -> dict:
    """Income, expenses and net for [start, end), overall and per property."""
    income = rent_received(organization, start, end)
    expenses = Expense.objects.filter(
        organization=organization, is_void=False, incurred_on__gte=start, incurred_on__lt=end,
    )
    spent = money(expenses.aggregate(t=Sum('amount'))['t'])
    by_category = {
        row['category']: money(row['t'])
        for row in expenses.values('category').annotate(t=Sum('amount'))
    }
    category_rows = [
        {'category': key, 'label': label, 'amount': str(by_category.get(key, Decimal('0.00')))}
        for key, label in Expense.CATEGORIES if by_category.get(key)
    ]

    props = {}
    for row in income['by_property']:
        props.setdefault(row['property_id'], {'property_id': row['property_id'], 'property_name': row['property_name'],
                                                'income': Decimal('0'), 'expenses': Decimal('0')})
        props[row['property_id']]['income'] += row['amount']
    for row in expenses.values('parent_property_id', 'parent_property__name').annotate(t=Sum('amount')):
        pid = str(row['parent_property_id']) if row['parent_property_id'] else None
        props.setdefault(pid, {'property_id': pid, 'property_name': row['parent_property__name'] or 'General (no property)',
                                'income': Decimal('0'), 'expenses': Decimal('0')})
        props[pid]['expenses'] += money(row['t'])

    return {
        'start': start.isoformat(),
        'end': (end - timedelta(days=1)).isoformat(),
        'income': str(income['total']),
        'expenses': str(spent),
        'net': str(money(income['total'] - spent)),
        'expenses_by_category': category_rows,
        'by_property': [
            {**p, 'income': str(money(p['income'])), 'expenses': str(money(p['expenses'])),
             'net': str(money(p['income'] - p['expenses']))}
            for p in props.values()
        ],
    }


# --- CSV ---------------------------------------------------------------------

def _safe(cell):
    """
    Stop a spreadsheet treating text a user typed as a formula (CSV injection).
    Real numbers are passed through untouched: a negative amount starts with
    '-' and must stay a number, or QuickBooks would read it as text.
    """
    if isinstance(cell, (int, float, Decimal)) and not isinstance(cell, bool):
        return str(cell)
    text = '' if cell is None else str(cell)
    return "'" + text if text[:1] in ('=', '+', '-', '@', '\t', '\r') else text


def _csv(rows) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    for row in rows:
        writer.writerow([_safe(c) for c in row])
    return buffer.getvalue()


def mri_year_csv(organization, year: int) -> str:
    data = mri_for_year(organization, year)
    rows = [['Month', 'Gross rent received (KES)', 'MRI rate (%)', 'MRI due (KES)', 'File and pay by', 'Status', 'Filed on', 'Reference']]
    for m in data['months']:
        filing = m['filing'] or {}
        rows.append([m['month'][:7], m['gross_rent'], m['rate'], m['mri_due'], m['deadline'], m['status'],
                     filing.get('filed_on', ''), filing.get('reference', '')])
    rows.append(['Total', data['total_gross_rent'], '', data['total_mri_due'], '', '', '', ''])
    return _csv(rows)


def ledger_csv(organization, start: date, end: date) -> str:
    """Every rent payment and every expense in the range, oldest first."""
    entries = []
    payments = Payment.objects.filter(
        organization=organization, status='success',
        paid_at__gte=_aware_start(start), paid_at__lt=_aware_start(end),
    ).select_related('tenant', 'unit', 'parent_property')
    for p in payments:
        entries.append((timezone.localtime(p.paid_at).date(), 'Income', 'Rent',
                        p.parent_property.name if p.parent_property else '',
                        f'{p.tenant.full_name} ({p.unit.unit_number})' if p.unit else p.tenant.full_name,
                        p.get_payment_method_display(), money(p.amount), p.internal_reference))
    for e in Expense.objects.filter(organization=organization, is_void=False,
                                    incurred_on__gte=start, incurred_on__lt=end).select_related('parent_property'):
        entries.append((e.incurred_on, 'Expense', e.get_category_display(),
                        e.parent_property.name if e.parent_property else '',
                        ' - '.join(x for x in (e.vendor, e.description) if x), '', -money(e.amount), ''))
    entries.sort(key=lambda r: (r[0], r[1]))
    rows = [['Date', 'Type', 'Category', 'Property', 'Details', 'Method', 'Amount (KES)', 'Reference']]
    rows += [[d.isoformat(), t, c, prop, det, meth, amt, ref] for d, t, c, prop, det, meth, amt, ref in entries]
    return _csv(rows)


# --- QuickBooks-ready exports ------------------------------------------------
# QuickBooks Online imports bank transactions from a CSV with exactly Date,
# Description, Amount (money out is negative) and recommends dd/mm/yyyy. The
# journal format follows its journal-entry import template; that import is not
# available in every region, so QuickBooks' own sample file is the reference.

QB_INCOME_ACCOUNT = 'Rental Income'
QB_BANK_ACCOUNT = 'Bank Account'
QB_EXPENSE_ACCOUNTS = {
    'repairs': 'Repairs and Maintenance',
    'utilities': 'Utilities',
    'caretaker': 'Caretaker Pay',
    'security': 'Security',
    'cleaning': 'Cleaning and Garbage',
    'insurance': 'Insurance',
    'land_rates': 'Land Rates and Permits',
    'agent_fees': 'Agent and Management Fees',
    'other': 'Other Expenses',
}


def _ledger_entries(organization, start: date, end: date) -> list:
    """(date, kind, category_key, description, amount) - income positive, expenses negative."""
    entries = []
    payments = Payment.objects.filter(
        organization=organization, status='success',
        paid_at__gte=_aware_start(start), paid_at__lt=_aware_start(end),
    ).select_related('tenant', 'unit')
    for p in payments:
        who = f'{p.tenant.full_name} {p.unit.unit_number}'.strip() if p.unit else p.tenant.full_name
        entries.append((timezone.localtime(p.paid_at).date(), 'income', 'rent', f'Rent from {who}', money(p.amount)))
    expenses = Expense.objects.filter(
        organization=organization, is_void=False, incurred_on__gte=start, incurred_on__lt=end,
    )
    for e in expenses:
        label = ' - '.join(x for x in (e.get_category_display(), e.vendor, e.description) if x)
        entries.append((e.incurred_on, 'expense', e.category, label, -money(e.amount)))
    entries.sort(key=lambda r: (r[0], r[1]))
    return entries


def quickbooks_bank_csv(organization, start: date, end: date) -> str:
    """Upload under Banking > Upload transactions. Choose dd/mm/yyyy as the date format."""
    rows = [['Date', 'Description', 'Amount']]
    for day, _kind, _cat, description, amount in _ledger_entries(organization, start, end):
        rows.append([day.strftime('%d/%m/%Y'), description, amount])
    return _csv(rows)


def quickbooks_journal_csv(organization, start: date, end: date) -> str:
    """One balanced journal entry per transaction: the bank account against income or an expense account."""
    rows = [['Journal No', 'Journal Date', 'Account Name', 'Debits', 'Credits', 'Description', 'Name']]
    for number, (day, kind, category, description, amount) in enumerate(_ledger_entries(organization, start, end), 1):
        journal_no = f'RR-{number:05d}'
        when = day.strftime('%d/%m/%Y')
        value = abs(amount)
        if kind == 'income':
            rows.append([journal_no, when, QB_BANK_ACCOUNT, value, '', description, ''])
            rows.append([journal_no, when, QB_INCOME_ACCOUNT, '', value, description, ''])
        else:
            rows.append([journal_no, when, QB_EXPENSE_ACCOUNTS.get(category, 'Other Expenses'), value, '', description, ''])
            rows.append([journal_no, when, QB_BANK_ACCOUNT, '', value, description, ''])
    return _csv(rows)
