"""
Expenses (posted to the ledger) and landlord statements (computed from it).

A statement is derived entirely from journal lines, so it always reconciles:
for every tenancy, closing = opening + invoiced − credited − paid
− paid from deposit + reversed, where each column is the movement of
(receivables − prepayments) by journal source.
"""

from __future__ import annotations

import io
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from accounting.models import Expense
from ledger.models import Account, JournalLine
from ledger.services import chart
from ledger.services.posting import LedgerService, Leg
from properties.models import Tenancy

ZERO = Decimal('0.00')

CATEGORY_ACCOUNTS = {
    'repairs': chart.REPAIRS_AND_MAINTENANCE,
    'utilities': chart.PROPERTY_UTILITIES,
    'security_cleaning': chart.SECURITY_AND_CLEANING,
    'management_fees': chart.MANAGEMENT_FEES,
    'insurance': chart.INSURANCE,
    'rates_taxes': chart.RATES_AND_TAXES,
    'other': chart.OTHER_EXPENSES,
}
PAID_FROM_ACCOUNTS = {
    'cash': chart.CASH_ON_HAND,
    'bank_transfer': chart.BANK,
    'mpesa_paybill': chart.MPESA_PAYBILL,
    'other': chart.CASH_ON_HAND,
}
CHANNEL_LABELS = {
    chart.CASH_ON_HAND: 'Cash',
    chart.BANK: 'Bank',
    chart.MPESA_PAYBILL: 'M-Pesa paybill',
    chart.PAYSTACK_CLEARING: 'Paystack',
}


class ExpenseError(ValueError):
    pass


class ExpenseService:
    @classmethod
    @transaction.atomic
    def record(cls, organization, created_by=None, **fields) -> Expense:
        prop = fields.get('parent_property')
        if prop is not None and prop.organization_id != organization.id:
            raise ExpenseError('That property belongs to another organization.')
        supplier = fields.get('supplier_ref')
        if supplier is not None:
            if supplier.organization_id != organization.id:
                raise ExpenseError('That supplier belongs to another organization.')
            if not fields.get('supplier'):
                fields['supplier'] = supplier.name
        expense = Expense.objects.create(organization=organization, created_by=created_by, **fields)
        dims = {'parent_property': expense.parent_property} if expense.parent_property_id else {}
        if expense.unit_id:
            dims['unit'] = expense.unit
        LedgerService.post(
            organization,
            expense.expense_date,
            [
                Leg.dr(CATEGORY_ACCOUNTS[expense.category], expense.amount, expense.description, **dims),
                Leg.cr(PAID_FROM_ACCOUNTS[expense.paid_from], expense.amount, expense.supplier or expense.description, **dims),
            ],
            source_type='expense',
            source_id=str(expense.pk),
            memo=f'Expense: {expense.description}'[:255],
            created_by=created_by,
        )
        return expense

    @classmethod
    @transaction.atomic
    def void(cls, expense: Expense, reason: str, voided_by=None) -> Expense:
        expense = Expense.objects.select_for_update().get(pk=expense.pk)
        if expense.voided_at:
            raise ExpenseError('This expense is already voided.')
        if not (reason or '').strip():
            raise ExpenseError('Give a reason for voiding the expense.')
        for entry in LedgerService.entries_for('expense', expense.pk):
            if not hasattr(entry, 'reversed_by'):
                LedgerService.reverse(entry, timezone.now().date(), memo=f'Void expense: {reason}', created_by=voided_by)
        expense.voided_at = timezone.now()
        expense.void_reason = reason.strip()[:255]
        expense.save(update_fields=['voided_at', 'void_reason'])
        return expense


# ----------------------------------------------------------------- statements


@dataclass
class TenantRow:
    tenancy_id: str
    tenant_name: str
    unit_number: str
    property_name: str
    opening: Decimal = ZERO
    invoiced: Decimal = ZERO
    credited: Decimal = ZERO
    paid: Decimal = ZERO
    paid_from_deposit: Decimal = ZERO
    reversed: Decimal = ZERO
    closing: Decimal = ZERO


@dataclass
class Statement:
    organization_name: str
    property_name: str
    period_start: date
    period_end: date
    received_by_channel: dict = field(default_factory=dict)
    received_total: Decimal = ZERO
    deposits_refunded: Decimal = ZERO
    expenses_by_category: dict = field(default_factory=dict)
    expenses_total: Decimal = ZERO
    net_cash: Decimal = ZERO
    income_by_type: dict = field(default_factory=dict)
    waivers: Decimal = ZERO
    tenants: list = field(default_factory=list)
    owed_opening: Decimal = ZERO
    owed_closing: Decimal = ZERO
    deposits_held_closing: Decimal = ZERO
    expenses: list = field(default_factory=list)


def _sum(lines, column):
    return lines.aggregate(total=Sum(column))['total'] or ZERO


class StatementService:
    @classmethod
    def build(cls, organization, period_start: date, period_end: date, property_obj=None) -> Statement:
        if period_end < period_start:
            raise ValueError('period_end is before period_start')
        accounts = {a.code: a for a in Account.objects.filter(organization=organization)}

        def lines(codes, **filters):
            qs = JournalLine.objects.filter(entry__organization=organization, account__code__in=codes, **filters)
            if property_obj is not None:
                qs = qs.filter(parent_property=property_obj)
            return qs

        in_period = {'entry__entry_date__gte': period_start, 'entry__entry_date__lte': period_end}
        statement = Statement(
            organization_name=organization.name,
            property_name=property_obj.name if property_obj else 'All properties',
            period_start=period_start,
            period_end=period_end,
        )

        # Money in: payments landing in a channel account, less reversals of payments.
        for code in chart.CHANNEL_ACCOUNTS_CODES:
            received = _sum(lines([code], entry__source_type='payment', **in_period), 'debit')
            reversed_out = _sum(
                lines([code], entry__source_type='reversal', entry__reverses__source_type='payment', **in_period),
                'credit',
            )
            net = received - reversed_out
            if net:
                statement.received_by_channel[CHANNEL_LABELS[code]] = net
        statement.received_total = sum(statement.received_by_channel.values(), ZERO)
        statement.deposits_refunded = _sum(
            lines(chart.CHANNEL_ACCOUNTS_CODES, entry__source_type='deposit_settlement', **in_period), 'credit',
        )

        # Money out: expenses net of voids, by category.
        for category, code in CATEGORY_ACCOUNTS.items():
            expense_lines = lines([code], **in_period)
            amount = _sum(expense_lines, 'debit') - _sum(expense_lines, 'credit')
            if amount:
                statement.expenses_by_category[dict(Expense.CATEGORY_CHOICES)[category]] = amount
        statement.expenses_total = sum(statement.expenses_by_category.values(), ZERO)
        statement.net_cash = statement.received_total - statement.deposits_refunded - statement.expenses_total

        # Income earned (accrual), by account.
        for code in chart.INCOME_CODES:
            income_lines = lines([code], **in_period)
            amount = _sum(income_lines, 'credit') - _sum(income_lines, 'debit')
            if amount and code in accounts:
                statement.income_by_type[accounts[code].name] = amount
        waiver_lines = lines([chart.WAIVERS_AND_DISCOUNTS], **in_period)
        statement.waivers = _sum(waiver_lines, 'debit') - _sum(waiver_lines, 'credit')

        statement.tenants = cls._tenant_rows(organization, period_start, period_end, property_obj)
        statement.owed_opening = sum((r.opening for r in statement.tenants), ZERO)
        statement.owed_closing = sum((r.closing for r in statement.tenants), ZERO)
        held = lines([chart.DEPOSITS_HELD], entry__entry_date__lte=period_end)
        statement.deposits_held_closing = _sum(held, 'credit') - _sum(held, 'debit')

        expenses = Expense.objects.filter(
            organization=organization, expense_date__gte=period_start, expense_date__lte=period_end, voided_at__isnull=True,
        ).select_related('parent_property')
        if property_obj is not None:
            expenses = expenses.filter(parent_property=property_obj)
        statement.expenses = list(expenses)
        return statement

    @classmethod
    def _tenant_rows(cls, organization, period_start, period_end, property_obj) -> list[TenantRow]:
        codes = (chart.TENANT_RECEIVABLES, chart.TENANT_PREPAYMENTS)
        base = JournalLine.objects.filter(
            entry__organization=organization, account__code__in=codes, tenancy__isnull=False,
        )
        if property_obj is not None:
            base = base.filter(tenancy__parent_property=property_obj)

        def net(qs):
            """
            Movement of what the tenant owes = receivables − prepayments. With
            receivables debit-normal and prepayments credit-normal, that is
            simply debit − credit summed over both accounts.
            """
            totals = defaultdict(lambda: ZERO)
            for row in qs.values('tenancy_id').annotate(dr=Sum('debit'), cr=Sum('credit')):
                totals[row['tenancy_id']] += row['dr'] - row['cr']
            return totals

        opening = net(base.filter(entry__entry_date__lt=period_start))
        period = base.filter(entry__entry_date__gte=period_start, entry__entry_date__lte=period_end)
        by_source = {source: net(period.filter(entry__source_type=source)) for source in (
            'invoice', 'credit_note', 'payment', 'allocation', 'reversal', 'deposit_settlement', 'opening_balance',
        )}
        deposit_payment_ids = set(
            JournalLine.objects.filter(
                entry__organization=organization, entry__source_type='payment', account__code=chart.DEPOSITS_HELD,
                entry__entry_date__gte=period_start, entry__entry_date__lte=period_end,
            ).values_list('entry_id', flat=True)
        )
        from_deposit = net(period.filter(entry__source_type='payment', entry_id__in=deposit_payment_ids))

        tenancy_ids = set(opening) | {tid for totals in by_source.values() for tid in totals}
        tenancies = Tenancy.objects.filter(pk__in=tenancy_ids).select_related('tenant', 'unit', 'parent_property')
        rows = []
        for tenancy in tenancies:
            tid = tenancy.pk
            payments_total = by_source['payment'].get(tid, ZERO)  # negative: payments reduce what is owed
            deposit_part = from_deposit.get(tid, ZERO)
            row = TenantRow(
                tenancy_id=str(tid),
                tenant_name=tenancy.tenant.full_name,
                unit_number=tenancy.unit.unit_number,
                property_name=tenancy.parent_property.name,
                opening=opening.get(tid, ZERO),
                invoiced=by_source['invoice'].get(tid, ZERO) + by_source['opening_balance'].get(tid, ZERO),
                credited=-by_source['credit_note'].get(tid, ZERO),
                paid=-(payments_total - deposit_part),
                paid_from_deposit=-deposit_part,
                reversed=by_source['reversal'].get(tid, ZERO),
            )
            row.closing = (
                row.opening + row.invoiced - row.credited - row.paid - row.paid_from_deposit + row.reversed
                + by_source['allocation'].get(tid, ZERO) + by_source['deposit_settlement'].get(tid, ZERO)
            )
            if any((row.opening, row.invoiced, row.credited, row.paid, row.paid_from_deposit, row.reversed, row.closing)):
                rows.append(row)
        return sorted(rows, key=lambda r: (r.property_name, r.unit_number))

    # ------------------------------------------------------------- output

    @staticmethod
    def as_dict(s: Statement) -> dict:
        money = lambda v: str(Decimal(v).quantize(Decimal('0.01')))  # noqa: E731
        return {
            'organization_name': s.organization_name,
            'property_name': s.property_name,
            'period_start': s.period_start.isoformat(),
            'period_end': s.period_end.isoformat(),
            'cash': {
                'received_by_channel': {k: money(v) for k, v in s.received_by_channel.items()},
                'received_total': money(s.received_total),
                'deposits_refunded': money(s.deposits_refunded),
                'expenses_total': money(s.expenses_total),
                'net_cash': money(s.net_cash),
            },
            'income_by_type': {k: money(v) for k, v in s.income_by_type.items()},
            'waivers': money(s.waivers),
            'expenses_by_category': {k: money(v) for k, v in s.expenses_by_category.items()},
            'owed_opening': money(s.owed_opening),
            'owed_closing': money(s.owed_closing),
            'deposits_held_closing': money(s.deposits_held_closing),
            'tenants': [
                {
                    'tenancy_id': r.tenancy_id, 'tenant_name': r.tenant_name, 'unit_number': r.unit_number,
                    'property_name': r.property_name, 'opening': money(r.opening), 'invoiced': money(r.invoiced),
                    'credited': money(r.credited), 'paid': money(r.paid),
                    'paid_from_deposit': money(r.paid_from_deposit), 'reversed': money(r.reversed),
                    'closing': money(r.closing),
                }
                for r in s.tenants
            ],
            'expenses': [
                {
                    'id': str(e.id), 'date': e.expense_date.isoformat(), 'category': e.get_category_display(),
                    'description': e.description, 'supplier': e.supplier, 'amount': money(e.amount),
                    'property': e.parent_property.name if e.parent_property_id else '',
                }
                for e in s.expenses
            ],
        }

    @staticmethod
    def render_pdf(s: Statement) -> bytes:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        def kes(v):
            return f'{Decimal(v):,.2f}'

        styles = getSampleStyleSheet()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm,
                                topMargin=14 * mm, bottomMargin=14 * mm, title='Landlord statement')
        grid = TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.grey),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ])
        story = [
            Paragraph(s.organization_name, styles['Title']),
            Paragraph(f'Statement · {s.property_name} · {s.period_start:%d %b %Y} – {s.period_end:%d %b %Y}', styles['Heading3']),
            Spacer(1, 4 * mm),
        ]
        cash_rows = [['Money in and out', 'KES']]
        cash_rows += [[f'Received — {k}', kes(v)] for k, v in s.received_by_channel.items()]
        cash_rows += [['Deposits refunded', f'−{kes(s.deposits_refunded)}'], ['Expenses', f'−{kes(s.expenses_total)}'],
                      ['Net cash', kes(s.net_cash)]]
        cash_table = Table(cash_rows, colWidths=[120 * mm, 50 * mm])
        cash_table.setStyle(grid)
        story += [cash_table, Spacer(1, 5 * mm)]

        tenant_rows = [['Unit', 'Tenant', 'Opening', 'Invoiced', 'Credited', 'Paid', 'From deposit', 'Closing']]
        for r in s.tenants:
            tenant_rows.append([r.unit_number, r.tenant_name[:22], kes(r.opening), kes(r.invoiced), kes(r.credited),
                                kes(r.paid), kes(r.paid_from_deposit), kes(r.closing)])
        tenant_rows.append(['', 'Total owed', kes(s.owed_opening), '', '', '', '', kes(s.owed_closing)])
        tenant_table = Table(tenant_rows, repeatRows=1)
        tenant_table.setStyle(grid)
        story += [Paragraph('Tenant balances', styles['Heading4']), tenant_table, Spacer(1, 5 * mm)]

        if s.expenses:
            expense_rows = [['Date', 'Category', 'Description', 'Amount']]
            expense_rows += [[f'{e.expense_date:%d %b}', e.get_category_display(), e.description[:40], kes(e.amount)]
                             for e in s.expenses]
            expense_table = Table(expense_rows, repeatRows=1)
            expense_table.setStyle(grid)
            story += [Paragraph('Expenses', styles['Heading4']), expense_table, Spacer(1, 5 * mm)]

        story.append(Paragraph(
            f'Deposits held at {s.period_end:%d %b %Y}: KES {kes(s.deposits_held_closing)}. Generated by RumiaRent.',
            styles['Italic'],
        ))
        doc.build(story)
        return buffer.getvalue()


def month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = (date(year + (month == 12), month % 12 + 1, 1) - timedelta(days=1))
    return start, end
