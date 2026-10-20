"""
Allocation of payments to invoices, and tenant credit.

Money received first sits on the payment as `unapplied_amount` (ledger:
Tenant prepayments). Allocating moves it onto an invoice (ledger: Dr
prepayments / Cr receivables). Whatever cannot be allocated — an overpayment,
or rent paid before the invoice exists — stays as credit and is applied
automatically when the next invoice is issued. Nothing is ever dropped
(audit H1) and nothing is ever over-allocated (audit H2).

Allocation order is design decision D2: oldest due date first; invoices due
the same day in TYPE_PRIORITY order. Disputed invoices are skipped by
automatic allocation.
"""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.db.models import Case, IntegerField, Value, When

from ledger.services import chart
from ledger.services.posting import LedgerService, Leg
from rent.models import Invoice, Payment, PaymentAllocation
from rent.services.invoicing import tenancy_dimensions

ZERO = Decimal('0.00')

TYPE_PRIORITY = {'deposit': 0, 'rent': 1, 'adhoc': 2, 'penalty': 3}

# Ledger account money lands in, by payment method.
CHANNEL_ACCOUNTS = {
    'paystack': chart.PAYSTACK_CLEARING,
    'cash': chart.CASH_ON_HAND,
    'bank_transfer': chart.BANK,
    'mpesa_paybill': chart.MPESA_PAYBILL,
    'deposit_transfer': chart.DEPOSITS_HELD,
    'other': chart.CASH_ON_HAND,
}


class AllocationError(ValueError):
    """Invalid allocation request (maps to a 400)."""


def channel_account(payment: Payment) -> str:
    return CHANNEL_ACCOUNTS.get(payment.payment_method, chart.CASH_ON_HAND)


class AllocationService:
    @classmethod
    def open_invoices(cls, tenancy):
        """Invoices that can still take money, in allocation order (D2)."""
        priority = Case(
            *[When(invoice_type=t, then=Value(p)) for t, p in TYPE_PRIORITY.items()],
            default=Value(99),
            output_field=IntegerField(),
        )
        return (
            Invoice.objects.select_for_update()
            .filter(tenancy=tenancy, is_disputed=False)
            .exclude(status__in=['paid', 'waived'])
            .annotate(type_priority=priority)
            .order_by('due_date', 'type_priority', 'created_at')
        )

    @classmethod
    @transaction.atomic
    def receive(cls, payment: Payment, created_by=None) -> Payment:
        """
        Book a payment that just became successful: all of it is unapplied
        credit until allocated. Idempotent — a payment is received once.
        """
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != 'success':
            raise AllocationError('Only successful payments can be received')
        if LedgerService.entries_for('payment', payment.pk):
            return payment

        payment.unapplied_amount = payment.amount
        payment.save(update_fields=['unapplied_amount', 'updated_at'])

        dims = tenancy_dimensions(payment.tenancy) if payment.tenancy_id else {}
        LedgerService.post(
            payment.organization,
            (payment.paid_at or payment.created_at).date(),
            [
                Leg.dr(channel_account(payment), payment.amount, f'Payment {payment.internal_reference}', **dims),
                Leg.cr(chart.TENANT_PREPAYMENTS, payment.amount, f'Payment {payment.internal_reference}', **dims),
            ],
            source_type='payment',
            source_id=str(payment.pk),
            memo=f'Payment {payment.internal_reference}',
            created_by=created_by,
        )
        return payment

    @classmethod
    @transaction.atomic
    def allocate(cls, payment: Payment, invoice: Invoice, amount, created_by=None) -> PaymentAllocation:
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
        amount = Decimal(str(amount)).quantize(Decimal('0.01'))

        if payment.status != 'success':
            raise AllocationError('Cannot allocate a payment that has not succeeded')
        if invoice.organization_id != payment.organization_id or (
            payment.tenancy_id and invoice.tenancy_id != payment.tenancy_id
        ):
            raise AllocationError("Cannot allocate a payment to another tenancy's invoice")
        if amount <= 0:
            raise AllocationError('Allocation amount must be positive')
        if amount > payment.unapplied_amount:
            raise AllocationError(
                f'Allocation of {amount} exceeds the unallocated {payment.unapplied_amount} on this payment'
            )
        if amount > invoice.outstanding:
            raise AllocationError(f'Allocation of {amount} exceeds the outstanding {invoice.outstanding} on this invoice')

        allocation = PaymentAllocation.objects.create(payment=payment, invoice=invoice, amount=amount)
        invoice.recalculate_status()
        invoice.save(update_fields=['amount_paid', 'status', 'updated_at'])
        payment.unapplied_amount -= amount
        payment.save(update_fields=['unapplied_amount', 'updated_at'])

        dims = tenancy_dimensions(invoice.tenancy)
        LedgerService.post(
            payment.organization,
            (payment.paid_at or payment.created_at).date(),
            [
                Leg.dr(chart.TENANT_PREPAYMENTS, amount, f'Applied to {invoice.number}', **dims),
                Leg.cr(chart.TENANT_RECEIVABLES, amount, f'Paid by {payment.internal_reference}', **dims),
            ],
            source_type='allocation',
            source_id=str(allocation.pk),
            memo=f'{payment.internal_reference} → {invoice.number}',
            created_by=created_by,
        )
        return allocation

    @classmethod
    @transaction.atomic
    def auto_allocate(cls, payment: Payment, created_by=None) -> list[PaymentAllocation]:
        """Spread the payment's unapplied amount over open invoices, oldest first."""
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != 'success' or not payment.tenancy_id:
            return []
        allocations = []
        remaining = payment.unapplied_amount
        for invoice in cls.open_invoices(payment.tenancy):
            if remaining <= 0:
                break
            amount = min(remaining, invoice.outstanding)
            if amount > 0:
                allocations.append(cls.allocate(payment, invoice, amount, created_by=created_by))
                remaining -= amount
        return allocations

    @classmethod
    @transaction.atomic
    def apply_credit(cls, tenancy, created_by=None) -> list[PaymentAllocation]:
        """Apply every unallocated successful payment of a tenancy to its open invoices, oldest money first."""
        allocations = []
        payments = Payment.objects.filter(
            tenancy=tenancy, status='success', unapplied_amount__gt=0,
        ).order_by('paid_at', 'created_at')
        for payment in payments:
            allocations.extend(cls.auto_allocate(payment, created_by=created_by))
        return allocations

    @classmethod
    def credit_balance(cls, tenancy=None, tenant=None) -> Decimal:
        payments = Payment.objects.filter(status='success', unapplied_amount__gt=0)
        if tenancy is not None:
            payments = payments.filter(tenancy=tenancy)
        if tenant is not None:
            payments = payments.filter(tenant=tenant)
        return sum((p.unapplied_amount for p in payments), ZERO)
