"""
Deposits (design §3.7, §5.6).

- A deposit is billed on its own `deposit` invoice; payments to it are held in
  ledger account 2100 (a liability — it is the tenant's money), never income.
- New tenancies get their deposit invoice at creation. Existing tenancies are
  never billed automatically: the landlord issues an invoice, or records a
  deposit already held (invoice + payment, receipt not sent).
- At move-out a DepositSettlement lists deductions:
    arrears  → paid from the deposit through an internal `deposit_transfer`
               payment, so it allocates exactly like any payment;
    damages / cleaning / other → kept by the landlord (Dr 2100 / Cr other income);
  any uncollected deposit is closed with a credit note, and the remainder is
  recorded as refunded (Dr 2100 / Cr cash/bank/M-Pesa).
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Iterable, Optional

from django.db import transaction
from django.utils import timezone

from ledger.services import chart
from ledger.services.numbering import DEPOSIT_SETTLEMENT, next_number
from ledger.services.posting import LedgerService, Leg
from rent.models import DepositDeduction, DepositSettlement, Invoice, Payment
from rent.services.allocation import CHANNEL_ACCOUNTS, AllocationService
from rent.services.invoicing import InvoiceService, LineSpec, tenancy_dimensions

ZERO = Decimal('0.00')
ACTIVE_SETTLEMENT_STATUSES = ('draft', 'approved', 'refunded')


class DepositError(ValueError):
    """Invalid deposit request (maps to a 400)."""


def _deposit_invoices(tenancy):
    return Invoice.objects.filter(tenancy=tenancy, invoice_type='deposit')


class DepositService:
    @classmethod
    def summary(cls, tenancy) -> dict:
        invoices = list(_deposit_invoices(tenancy))
        invoiced = sum((i.amount_due - i.amount_credited for i in invoices), ZERO)
        paid = sum((i.amount_paid for i in invoices), ZERO)
        settled = sum(
            (s.held_amount for s in tenancy.deposit_settlements.filter(status__in=('approved', 'refunded'))), ZERO,
        )
        return {
            'required': tenancy.deposit,
            'invoiced': invoiced,
            'paid': paid,
            'outstanding': invoiced - paid,
            'held': max(paid - settled, ZERO),
            'to_invoice': max(tenancy.deposit - invoiced, ZERO),
        }

    @classmethod
    @transaction.atomic
    def issue_invoice(cls, tenancy, amount=None, due_date: Optional[date] = None, created_by=None) -> Invoice:
        summary = cls.summary(tenancy)
        amount = Decimal(str(amount)) if amount is not None else summary['to_invoice']
        if amount <= 0:
            raise DepositError('There is no deposit left to invoice for this tenancy.')
        due_date = due_date or max(tenancy.start_date, timezone.localdate())
        return InvoiceService.create_invoice(
            tenancy, 'deposit', [LineSpec('deposit', amount, description='Security deposit')],
            period_start=min(tenancy.start_date, due_date), period_end=due_date, due_date=due_date,
            created_by=created_by,
        )

    @classmethod
    @transaction.atomic
    def record_held(
        cls, tenancy, amount, method: str = 'cash', reference: str = '', received_on: Optional[date] = None,
        created_by=None, notify: bool = False,
    ) -> Payment:
        """A deposit already received outside RumiaRent: invoice it and record the payment against it."""
        from rent.services.payment_service import PaymentService

        amount = Decimal(str(amount))
        if amount <= 0:
            raise DepositError('Deposit amount must be positive.')
        if method not in ('cash', 'bank_transfer', 'mpesa_paybill', 'other'):
            raise DepositError('Unsupported deposit payment method.')
        received_on = received_on or timezone.localdate()
        invoice = cls.issue_invoice(tenancy, amount, due_date=received_on, created_by=created_by)

        payment = Payment.objects.create(
            organization=tenancy.organization, tenancy=tenancy, tenant=tenancy.tenant,
            parent_property=tenancy.parent_property, unit=tenancy.unit, amount=amount,
            payment_method=method, provider='manual', provider_reference=reference,
            internal_reference=f'RUMIA-DEP-{uuid.uuid4().hex[:12].upper()}',
            notes=f'Deposit received on {received_on.isoformat()}, recorded later in RumiaRent',
            recorded_by=created_by,
        )
        invoice.refresh_from_db()  # tenant credit may already have paid part of it
        allocations = [{'invoice_id': invoice.id, 'amount': min(amount, invoice.outstanding)}] if invoice.outstanding else []
        return PaymentService.record_manual_payment(
            payment, allocations=allocations or None, verified_by=created_by, notify=notify,
        )

    @classmethod
    def arrears(cls, tenancy) -> Decimal:
        return sum(
            (
                i.outstanding
                for i in Invoice.objects.filter(tenancy=tenancy, is_disputed=False).exclude(invoice_type='deposit')
            ),
            ZERO,
        )

    @classmethod
    @transaction.atomic
    def create_settlement(
        cls, tenancy, deductions: Iterable[dict] = (), include_arrears: bool = True, notes: str = '',
        condition_report=None, created_by=None,
    ) -> DepositSettlement:
        if tenancy.deposit_settlements.filter(status__in=ACTIVE_SETTLEMENT_STATUSES).exists():
            raise DepositError('This tenancy already has a deposit settlement. Cancel the draft to start again.')
        held = cls.summary(tenancy)['held']
        deductions = [
            {**d, 'amount': Decimal(str(d['amount']))} for d in deductions if Decimal(str(d.get('amount', 0))) > 0
        ]
        for d in deductions:
            if d.get('kind') not in dict(DepositDeduction.KIND_CHOICES):
                raise DepositError(f"Unknown deduction kind: {d.get('kind')}")
        if include_arrears and not any(d['kind'] == 'arrears' for d in deductions):
            room = held - sum((d['amount'] for d in deductions), ZERO)
            arrears = min(cls.arrears(tenancy), max(room, ZERO))
            if arrears > 0:
                deductions.insert(0, {'kind': 'arrears', 'description': 'Unpaid rent and charges', 'amount': arrears})
        if sum((d['amount'] for d in deductions), ZERO) > held:
            raise DepositError(f'Deductions exceed the deposit held ({held}).')

        settlement = DepositSettlement.objects.create(
            organization=tenancy.organization, tenancy=tenancy,
            number=next_number(tenancy.organization, DEPOSIT_SETTLEMENT),
            held_amount=held, notes=notes, condition_report=condition_report, created_by=created_by,
        )
        DepositDeduction.objects.bulk_create([
            DepositDeduction(
                settlement=settlement, kind=d['kind'], description=d.get('description') or d['kind'], amount=d['amount'],
            )
            for d in deductions
        ])
        return settlement

    @classmethod
    @transaction.atomic
    def approve(cls, settlement: DepositSettlement, approved_by=None) -> DepositSettlement:
        settlement = DepositSettlement.objects.select_for_update().select_related('tenancy').get(pk=settlement.pk)
        if settlement.status != 'draft':
            raise DepositError('Only a draft settlement can be approved.')
        tenancy = settlement.tenancy
        today = timezone.localdate()

        # 1. Close any deposit that was invoiced but never collected.
        for invoice in _deposit_invoices(tenancy):
            if invoice.outstanding > 0:
                InvoiceService.issue_credit_note(
                    invoice, invoice.outstanding, f'Uncollected deposit closed by {settlement.number}',
                    created_by=approved_by,
                )

        deductions = list(settlement.deductions.all())

        # 2. Arrears are paid from the deposit like any payment.
        arrears = sum((d.amount for d in deductions if d.kind == 'arrears'), ZERO)
        if arrears > 0:
            transfer = Payment.objects.create(
                organization=tenancy.organization, tenancy=tenancy, tenant=tenancy.tenant,
                parent_property=tenancy.parent_property, unit=tenancy.unit, amount=arrears,
                payment_method='deposit_transfer', provider='internal', status='success', paid_at=timezone.now(),
                internal_reference=f'RUMIA-{settlement.number}', notes=f'Deposit applied by {settlement.number}',
                recorded_by=approved_by, verified_by=approved_by,
            )
            AllocationService.receive(transfer, created_by=approved_by)
            AllocationService.auto_allocate(transfer, created_by=approved_by)

        # 3. Damages and other deductions are kept by the landlord.
        dims = tenancy_dimensions(tenancy)
        kept = [d for d in deductions if d.kind != 'arrears']
        if kept:
            legs = []
            for d in kept:
                legs.append(Leg.dr(chart.DEPOSITS_HELD, d.amount, d.description, **dims))
                legs.append(Leg.cr(chart.OTHER_INCOME, d.amount, f'{d.get_kind_display()}: {d.description}', **dims))
            LedgerService.post(
                tenancy.organization, today, legs, source_type='deposit_settlement', source_id=str(settlement.pk),
                memo=f'Deposit deductions {settlement.number}', created_by=approved_by,
            )

        settlement.status = 'approved'
        settlement.approved_by = approved_by
        settlement.approved_at = timezone.now()
        settlement.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])
        return settlement

    @classmethod
    @transaction.atomic
    def record_refund(
        cls, settlement: DepositSettlement, method: str, reference: str = '', refunded_on: Optional[date] = None,
        recorded_by=None,
    ) -> DepositSettlement:
        settlement = DepositSettlement.objects.select_for_update().select_related('tenancy').get(pk=settlement.pk)
        if settlement.status != 'approved':
            raise DepositError('Approve the settlement before recording the refund.')
        if method not in dict(DepositSettlement.REFUND_METHOD_CHOICES):
            raise DepositError('Unsupported refund method.')
        refunded_on = refunded_on or timezone.localdate()
        amount = settlement.refund_amount
        if amount > 0:
            dims = tenancy_dimensions(settlement.tenancy)
            LedgerService.post(
                settlement.organization, refunded_on,
                [
                    Leg.dr(chart.DEPOSITS_HELD, amount, f'Deposit refund {settlement.number}', **dims),
                    Leg.cr(
                        CHANNEL_ACCOUNTS.get(method, chart.CASH_ON_HAND), amount, f'Deposit refund {settlement.number}', **dims,
                    ),
                ],
                source_type='deposit_settlement', source_id=str(settlement.pk),
                memo=f'Deposit refund {settlement.number}', created_by=recorded_by,
            )
        settlement.status = 'refunded'
        settlement.refund_method = method
        settlement.refund_reference = reference
        settlement.refunded_on = refunded_on
        settlement.save(update_fields=['status', 'refund_method', 'refund_reference', 'refunded_on', 'updated_at'])
        return settlement

    @classmethod
    @transaction.atomic
    def cancel(cls, settlement: DepositSettlement) -> DepositSettlement:
        settlement = DepositSettlement.objects.select_for_update().get(pk=settlement.pk)
        if settlement.status != 'draft':
            raise DepositError('Only a draft settlement can be cancelled.')
        settlement.status = 'cancelled'
        settlement.save(update_fields=['status', 'updated_at'])
        return settlement
