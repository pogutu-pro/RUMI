"""
Owner statements, commissions, remittances and advances.

Owner payable balance lives in ledger account 2300 (Due to property owners)
with the `owner` dimension:
- approving a statement credits 2300 with the period's net due
  (Dr 3900 Owner share of income);
- remittances and advances debit 2300 (Cr the money account);
- an advance fee/interest debits 2300 (Cr 4600 advance fee income).
A negative balance means the owner owes the agency (an outstanding advance).
"""

from __future__ import annotations

import io
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from accounting.models import Expense
from agency.models import OwnerStatement, OwnerTransaction, PropertyOwner
from ledger.models import JournalLine
from ledger.services import chart
from ledger.services.numbering import next_number
from ledger.services.posting import LedgerService, Leg
from properties.models import Tenancy
from rent.models import PaymentAllocation

ZERO = Decimal('0.00')
CENT = Decimal('0.01')
OWNER_STATEMENT_PREFIX = 'OST'
MONEY_ACCOUNTS = {
    'bank_transfer': chart.BANK,
    'mpesa_paybill': chart.MPESA_PAYBILL,
    'cash': chart.CASH_ON_HAND,
    'other': chart.CASH_ON_HAND,
}


class AgencyError(ValueError):
    pass


def _q(value) -> Decimal:
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


class OwnerStatementService:
    @classmethod
    def compute(cls, owner: PropertyOwner, period_start: date, period_end: date) -> dict:
        """Figures for one owner and period (nothing is saved)."""
        if period_end < period_start:
            raise AgencyError('Period end is before period start.')
        properties = list(owner.properties.all())
        rows = []
        for prop in properties:
            allocations = PaymentAllocation.objects.filter(
                invoice__parent_property=prop,
                payment__status='success',
                created_at__date__gte=period_start,
                created_at__date__lte=period_end,
            ).exclude(invoice__invoice_type='deposit')
            collected = allocations.aggregate(t=Sum('amount'))['t'] or ZERO
            penalties = allocations.filter(invoice__invoice_type='penalty').aggregate(t=Sum('amount'))['t'] or ZERO
            kept = JournalLine.objects.filter(
                entry__organization=owner.organization, entry__source_type='deposit_settlement',
                account__code=chart.OTHER_INCOME, parent_property=prop,
                entry__entry_date__gte=period_start, entry__entry_date__lte=period_end,
            ).aggregate(t=Sum('credit'))['t'] or ZERO
            expenses = Expense.objects.filter(
                organization=owner.organization, parent_property=prop, voided_at__isnull=True,
                expense_date__gte=period_start, expense_date__lte=period_end,
            ).aggregate(t=Sum('amount'))['t'] or ZERO
            commissionable = collected if owner.commission_on_penalties else collected - penalties
            management_fee = _q(commissionable * owner.management_fee_percent / 100)
            new_tenancies = Tenancy.objects.filter(
                parent_property=prop, start_date__gte=period_start, start_date__lte=period_end,
            ).exclude(status='pending')
            letting_fee = _q(sum((t.monthly_rent for t in new_tenancies), ZERO) * owner.letting_fee_percent / 100)
            net = _q(collected + kept - expenses - management_fee - letting_fee)
            rows.append({
                'property_id': str(prop.id), 'property_name': prop.name,
                'collected': str(_q(collected)), 'deposit_deductions_kept': str(_q(kept)),
                'expenses': str(_q(expenses)), 'management_fee': str(management_fee),
                'letting_fee': str(letting_fee), 'new_tenancies': new_tenancies.count(), 'net': str(net),
            })

        totals = {key: str(_q(sum((Decimal(r[key]) for r in rows), ZERO))) for key in (
            'collected', 'deposit_deductions_kept', 'expenses', 'management_fee', 'letting_fee', 'net',
        )}
        opening = cls.balance(owner, as_of=date.fromordinal(period_start.toordinal() - 1))
        paid = OwnerTransaction.objects.filter(
            owner=owner, transaction_date__gte=period_start, transaction_date__lte=period_end,
        )
        by_kind = {k: paid.filter(kind=k).aggregate(t=Sum('amount'))['t'] or ZERO
                   for k in ('remittance', 'advance', 'advance_fee')}
        net_due = Decimal(totals['net'])
        return {
            'owner_id': str(owner.id), 'owner_name': owner.full_name,
            'period_start': period_start.isoformat(), 'period_end': period_end.isoformat(),
            'management_fee_percent': str(owner.management_fee_percent),
            'letting_fee_percent': str(owner.letting_fee_percent),
            'properties': rows, 'totals': totals,
            'opening_balance': str(_q(opening)),
            'remitted': str(_q(by_kind['remittance'])),
            'advanced': str(_q(by_kind['advance'])),
            'advance_fees': str(_q(by_kind['advance_fee'])),
            'closing_balance': str(_q(opening + net_due - by_kind['remittance'] - by_kind['advance'] - by_kind['advance_fee'])),
        }

    @staticmethod
    def balance(owner: PropertyOwner, as_of: date | None = None) -> Decimal:
        """What the agency owes the owner (negative: the owner owes the agency)."""
        lines = JournalLine.objects.filter(owner=owner, account__code=chart.OWNER_PAYABLES)
        if as_of is not None:
            lines = lines.filter(entry__entry_date__lte=as_of)
        totals = lines.aggregate(dr=Sum('debit'), cr=Sum('credit'))
        return _q((totals['cr'] or ZERO) - (totals['dr'] or ZERO))

    @classmethod
    @transaction.atomic
    def approve(cls, owner: PropertyOwner, period_start: date, period_end: date, approved_by=None) -> OwnerStatement:
        PropertyOwner.objects.select_for_update().get(pk=owner.pk)
        overlap = owner.statements.filter(period_start__lte=period_end, period_end__gte=period_start)
        if overlap.exists():
            raise AgencyError(f'A statement already covers part of this period ({overlap.first().number}).')
        figures = cls.compute(owner, period_start, period_end)
        net_due = Decimal(figures['totals']['net'])
        statement = OwnerStatement.objects.create(
            organization=owner.organization, owner=owner,
            number=next_number(owner.organization, OWNER_STATEMENT_PREFIX),
            period_start=period_start, period_end=period_end, figures=figures, net_due=net_due,
            approved_by=approved_by,
        )
        if net_due:
            debit, credit = (chart.OWNER_DISTRIBUTIONS, chart.OWNER_PAYABLES) if net_due > 0 else \
                (chart.OWNER_PAYABLES, chart.OWNER_DISTRIBUTIONS)
            LedgerService.post(
                owner.organization, period_end,
                [Leg.dr(debit, abs(net_due), statement.number, owner=owner),
                 Leg.cr(credit, abs(net_due), statement.number, owner=owner)],
                source_type='owner_statement', source_id=str(statement.pk),
                memo=f'Owner statement {statement.number} — {owner.full_name}', created_by=approved_by,
            )
        return statement

    @staticmethod
    def render_pdf(statement: OwnerStatement) -> bytes:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        f = statement.figures
        styles = getSampleStyleSheet()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm,
                                topMargin=14 * mm, bottomMargin=14 * mm, title=f'Owner statement {statement.number}')
        kes = lambda v: f'{Decimal(v):,.2f}'  # noqa: E731
        style = TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.grey),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'), ('FONTSIZE', (0, 0), (-1, -1), 8),
        ])
        rows = [['Property', 'Collected', 'Deductions kept', 'Expenses', 'Mgmt fee', 'Letting fee', 'Net']]
        for r in f['properties']:
            rows.append([r['property_name'][:28], kes(r['collected']), kes(r['deposit_deductions_kept']),
                         kes(r['expenses']), kes(r['management_fee']), kes(r['letting_fee']), kes(r['net'])])
        t = f['totals']
        rows.append(['Total', kes(t['collected']), kes(t['deposit_deductions_kept']), kes(t['expenses']),
                     kes(t['management_fee']), kes(t['letting_fee']), kes(t['net'])])
        table = Table(rows, repeatRows=1)
        table.setStyle(style)
        account = Table([
            ['Your account', 'KES'],
            ['Balance brought forward', kes(f['opening_balance'])],
            ['Net due this period', kes(t['net'])],
            ['Paid to you', f"−{kes(f['remitted'])}"],
            ['Advances', f"−{kes(f['advanced'])}"],
            ['Advance fees', f"−{kes(f['advance_fees'])}"],
            ['Balance carried forward', kes(f['closing_balance'])],
        ], colWidths=[120 * mm, 50 * mm])
        account.setStyle(style)
        doc.build([
            Paragraph(statement.organization.name, styles['Title']),
            Paragraph(f'Owner statement {statement.number} — {f["owner_name"]}', styles['Heading3']),
            Paragraph(f'{statement.period_start:%d %b %Y} – {statement.period_end:%d %b %Y} · management fee '
                      f'{f["management_fee_percent"]}%, letting fee {f["letting_fee_percent"]}% of one month', styles['Normal']),
            Spacer(1, 5 * mm), table, Spacer(1, 6 * mm), account,
        ])
        return buffer.getvalue()

    @classmethod
    def email(cls, statement: OwnerStatement) -> bool:
        from django.conf import settings
        from django.core.mail import EmailMessage

        if not statement.owner.email:
            return False
        message = EmailMessage(
            subject=f'Statement {statement.number}: {statement.period_start:%B %Y}',
            body=(f'Dear {statement.owner.full_name},\n\nAttached is your statement for '
                  f'{statement.period_start:%B %Y}. Net due: KES {statement.net_due}.\n\n{statement.organization.name}'),
            from_email=settings.DEFAULT_FROM_EMAIL, to=[statement.owner.email],
        )
        message.attach(f'{statement.number}.pdf', cls.render_pdf(statement), 'application/pdf')
        try:
            message.send(fail_silently=False)
        except Exception:
            return False
        OwnerStatement.objects.filter(pk=statement.pk).update(emailed_at=timezone.now())
        return True


class OwnerTransactionService:
    @classmethod
    @transaction.atomic
    def record(cls, owner: PropertyOwner, kind: str, amount, transaction_date: date, method: str = '',
               reference: str = '', notes: str = '', created_by=None) -> OwnerTransaction:
        amount = _q(Decimal(str(amount)))
        if amount <= 0:
            raise AgencyError('Amount must be positive.')
        if kind in ('remittance', 'advance') and method not in MONEY_ACCOUNTS:
            raise AgencyError('Say how the money was paid.')
        txn = OwnerTransaction.objects.create(
            organization=owner.organization, owner=owner, kind=kind, amount=amount,
            transaction_date=transaction_date, method=method, reference=reference, notes=notes, created_by=created_by,
        )
        credit_account = chart.ADVANCE_FEE_INCOME if kind == 'advance_fee' else MONEY_ACCOUNTS[method]
        LedgerService.post(
            owner.organization, transaction_date,
            [Leg.dr(chart.OWNER_PAYABLES, amount, txn.get_kind_display(), owner=owner),
             Leg.cr(credit_account, amount, f'{txn.get_kind_display()} — {owner.full_name}', owner=owner)],
            source_type='owner_transaction', source_id=str(txn.pk),
            memo=f'{txn.get_kind_display()}: {owner.full_name}', created_by=created_by,
        )
        return txn
