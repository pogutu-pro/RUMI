"""
Invoice and credit-note issuing — the only code path that creates them.

Every invoice posts:      Dr Tenant receivables  /  Cr income (or deposits held) per line
Every credit note posts:  Dr Waivers & discounts (or deposits held)  /  Cr Tenant receivables

See docs/roadmap/phase-1-ledger-design.md §4.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Iterable, Optional

from django.db import transaction
from django.utils import timezone

from ledger.services import chart
from ledger.services.numbering import CREDIT_NOTE, INVOICE, next_number
from ledger.services.posting import LedgerService, Leg
from rent.models import CreditNote, Invoice, InvoiceLine

CENT = Decimal('0.01')

# Where each kind of billed line is recognized.
LINE_ACCOUNTS = {
    'rent': chart.RENT_INCOME,
    'service_charge': chart.SERVICE_CHARGE_INCOME,
    'garbage': chart.SERVICE_CHARGE_INCOME,
    'parking': chart.SERVICE_CHARGE_INCOME,
    'water': chart.UTILITY_INCOME,
    'electricity': chart.UTILITY_INCOME,
    'penalty': chart.PENALTY_INCOME,
    'deposit': chart.DEPOSITS_HELD,
    'repair': chart.OTHER_INCOME,
    'other': chart.OTHER_INCOME,
}


class InvoiceError(ValueError):
    """Invalid invoice or credit-note request (maps to a 400)."""


@dataclass
class LineSpec:
    line_type: str
    unit_price: Decimal
    quantity: Decimal = Decimal('1')
    description: str = ''

    @property
    def amount(self) -> Decimal:
        return (Decimal(self.quantity) * Decimal(self.unit_price)).quantize(CENT)


def tenancy_dimensions(tenancy) -> dict:
    return {
        'tenancy': tenancy,
        'tenant': tenancy.tenant,
        'parent_property': tenancy.parent_property,
        'unit': tenancy.unit,
    }


class InvoiceService:
    @classmethod
    @transaction.atomic
    def create_invoice(
        cls,
        tenancy,
        invoice_type: str,
        lines: Iterable[LineSpec],
        period_start: date,
        period_end: date,
        due_date: date,
        issue_date: Optional[date] = None,
        source_invoice: Optional[Invoice] = None,
        notes: str = '',
        created_by=None,
        as_of: Optional[date] = None,
    ) -> Invoice:
        lines = list(lines)
        if invoice_type not in dict(Invoice.TYPE_CHOICES):
            raise InvoiceError(f'Unknown invoice type: {invoice_type}')
        if not lines:
            raise InvoiceError('An invoice needs at least one line')
        for line in lines:
            if line.line_type not in LINE_ACCOUNTS:
                raise InvoiceError(f'Unknown line type: {line.line_type}')
            if line.amount <= 0:
                raise InvoiceError('Invoice line amounts must be positive')
        has_deposit = any(line.line_type == 'deposit' for line in lines)
        if has_deposit != (invoice_type == 'deposit') or (
            invoice_type == 'deposit' and not all(line.line_type == 'deposit' for line in lines)
        ):
            # Deposits are a liability, not income — keeping them on their own
            # invoice keeps deposit balances and income reports clean.
            raise InvoiceError('Deposit lines must be on their own deposit invoice')

        organization = tenancy.organization
        issue_date = issue_date or timezone.now().date()
        total = sum((line.amount for line in lines), Decimal('0.00'))

        invoice = Invoice.objects.create(
            organization=organization,
            tenancy=tenancy,
            parent_property=tenancy.parent_property,
            unit=tenancy.unit,
            tenant=tenancy.tenant,
            invoice_type=invoice_type,
            number=next_number(organization, INVOICE),
            issue_date=issue_date,
            source_invoice=source_invoice,
            period_start=period_start,
            period_end=period_end,
            due_date=due_date,
            amount_due=total,
            currency='KES',
            notes=notes,
        )
        InvoiceLine.objects.bulk_create([
            InvoiceLine(
                invoice=invoice,
                line_type=line.line_type,
                description=line.description or dict(InvoiceLine.LINE_TYPE_CHOICES)[line.line_type],
                quantity=line.quantity,
                unit_price=line.unit_price,
                amount=line.amount,
                sort_order=index,
            )
            for index, line in enumerate(lines)
        ])
        invoice.recalculate_status(as_of=as_of)
        invoice.save(update_fields=['amount_paid', 'status', 'updated_at'])

        cls.post_invoice(invoice, created_by=created_by)
        return invoice

    @classmethod
    def post_invoice(cls, invoice: Invoice, created_by=None) -> None:
        dims = tenancy_dimensions(invoice.tenancy)
        legs = [Leg.dr(chart.TENANT_RECEIVABLES, invoice.amount_due, f'Invoice {invoice.number}', **dims)]
        for line in invoice.lines.all():
            legs.append(Leg.cr(LINE_ACCOUNTS[line.line_type], line.amount, line.description, **dims))
        LedgerService.post(
            invoice.organization,
            invoice.issue_date or invoice.created_at.date(),
            legs,
            source_type='invoice',
            source_id=str(invoice.pk),
            memo=f'Invoice {invoice.number}',
            created_by=created_by,
        )

    @classmethod
    @transaction.atomic
    def issue_credit_note(
        cls,
        invoice: Invoice,
        amount,
        reason: str,
        created_by=None,
        issue_date: Optional[date] = None,
    ) -> CreditNote:
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
        amount = Decimal(str(amount)).quantize(CENT)
        reason = (reason or '').strip()
        if not reason:
            raise InvoiceError('A reason is required for a credit note')
        if amount <= 0:
            raise InvoiceError('Credit note amount must be positive')
        if amount > invoice.outstanding:
            raise InvoiceError(
                f'Credit note of {amount} exceeds the unpaid balance of {invoice.outstanding}. '
                'Money already paid is returned by reversing or refunding the payment.'
            )

        issue_date = issue_date or timezone.now().date()
        credit_note = CreditNote.objects.create(
            organization=invoice.organization,
            invoice=invoice,
            number=next_number(invoice.organization, CREDIT_NOTE),
            amount=amount,
            reason=reason,
            issue_date=issue_date,
            created_by=created_by,
        )
        invoice.amount_credited += amount
        invoice.recalculate_status()
        invoice.save(update_fields=['amount_credited', 'amount_paid', 'status', 'updated_at'])

        cls.post_credit_note(credit_note, created_by=created_by)
        return credit_note

    @classmethod
    def post_credit_note(cls, credit_note: CreditNote, created_by=None) -> None:
        invoice = credit_note.invoice
        dims = tenancy_dimensions(invoice.tenancy)
        debit_account = chart.DEPOSITS_HELD if invoice.invoice_type == 'deposit' else chart.WAIVERS_AND_DISCOUNTS
        LedgerService.post(
            invoice.organization,
            credit_note.issue_date,
            [
                Leg.dr(debit_account, credit_note.amount, credit_note.reason, **dims),
                Leg.cr(chart.TENANT_RECEIVABLES, credit_note.amount, f'Credit note {credit_note.number}', **dims),
            ],
            source_type='credit_note',
            source_id=str(credit_note.pk),
            memo=f'Credit note {credit_note.number} on {invoice.number}',
            created_by=created_by,
        )

    @classmethod
    @transaction.atomic
    def set_disputed(cls, invoice: Invoice, disputed: bool) -> Invoice:
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
        invoice.is_disputed = disputed
        invoice.recalculate_status()
        invoice.save(update_fields=['is_disputed', 'amount_paid', 'status', 'updated_at'])
        return invoice
