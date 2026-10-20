"""
Post journal entries for money records created before the ledger existed.

Idempotent: anything that already has its journal entry is skipped, so it is
safe to re-run. Run once after deploying Phase 1, then `--check` to confirm
every tenancy's ledger receivable equals the sum of its invoice balances.

    python manage.py ledger_backfill
    python manage.py ledger_backfill --check
"""

from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounting.books import ExpenseService
from accounting.models import Expense
from ledger.models import JournalEntry
from ledger.services import chart
from ledger.services.posting import LedgerService, Leg
from organizations.models import Organization
from rent.models import CreditNote, Invoice, Payment, PaymentAllocation
from rent.services.allocation import channel_account
from rent.services.invoicing import InvoiceService, tenancy_dimensions
from rent.services.receipts import ReceiptService

ZERO = Decimal('0.00')


def _posted(source_type, pk):
    return JournalEntry.objects.filter(source_type=source_type, source_id=str(pk)).exists()


class Command(BaseCommand):
    help = 'Backfill ledger journal entries for pre-ledger invoices, credit notes, payments, allocations and expenses.'

    def add_arguments(self, parser):
        parser.add_argument('--check', action='store_true', help='Only reconcile; post nothing.')

    def handle(self, *args, **options):
        if not options['check']:
            counts = {'invoices': 0, 'credit_notes': 0, 'payments': 0, 'allocations': 0, 'receipts': 0, 'expenses': 0}
            for org in Organization.objects.all():
                with transaction.atomic():
                    self._backfill_org(org, counts)
            self.stdout.write(self.style.SUCCESS(f'Backfilled: {counts}'))

        mismatches = self._reconcile()
        if mismatches:
            for line in mismatches:
                self.stderr.write(line)
            raise CommandError(f'{len(mismatches)} tenancy balance mismatch(es)')
        self.stdout.write(self.style.SUCCESS('Ledger reconciles with invoices and payments.'))

    def _backfill_org(self, org, counts):
        for invoice in Invoice.objects.filter(organization=org).prefetch_related('lines').order_by('created_at'):
            if _posted('invoice', invoice.pk):
                continue
            if not invoice.lines.exists():
                raise CommandError(f'Invoice {invoice.pk} has no lines — run migrations first')
            InvoiceService.post_invoice(invoice)
            counts['invoices'] += 1

        for credit_note in CreditNote.objects.filter(organization=org).select_related('invoice__tenancy'):
            if not _posted('credit_note', credit_note.pk):
                InvoiceService.post_credit_note(credit_note)
                counts['credit_notes'] += 1

        payments = Payment.objects.filter(organization=org, status='success').select_related('tenancy')
        for payment in payments.order_by('paid_at', 'created_at'):
            if not _posted('payment', payment.pk):
                dims = tenancy_dimensions(payment.tenancy) if payment.tenancy_id else {}
                LedgerService.post(
                    org,
                    (payment.paid_at or payment.created_at).date(),
                    [
                        Leg.dr(channel_account(payment), payment.amount, f'Payment {payment.internal_reference}', **dims),
                        Leg.cr(chart.TENANT_PREPAYMENTS, payment.amount, f'Payment {payment.internal_reference}', **dims),
                    ],
                    source_type='payment', source_id=str(payment.pk), memo=f'Payment {payment.internal_reference} (backfill)',
                )
                counts['payments'] += 1

            for allocation in payment.allocations.select_related('invoice__tenancy'):
                if _posted('allocation', allocation.pk):
                    continue
                dims = tenancy_dimensions(allocation.invoice.tenancy)
                LedgerService.post(
                    org,
                    (payment.paid_at or payment.created_at).date(),
                    [
                        Leg.dr(chart.TENANT_PREPAYMENTS, allocation.amount, f'Applied to {allocation.invoice.number}', **dims),
                        Leg.cr(chart.TENANT_RECEIVABLES, allocation.amount, f'Paid by {payment.internal_reference}', **dims),
                    ],
                    source_type='allocation', source_id=str(allocation.pk),
                    memo=f'{payment.internal_reference} → {allocation.invoice.number} (backfill)',
                )
                counts['allocations'] += 1

            if not hasattr(payment, 'receipt'):
                # Past payments get a receipt for the record — never sent.
                ReceiptService.issue(payment, notify=False)
                counts['receipts'] += 1

        # Expenses recorded before they were booked (voided ones never touch the books).
        for expense in Expense.objects.filter(organization=org, is_void=False).order_by('incurred_on', 'created_at'):
            if not _posted('expense', expense.pk):
                ExpenseService._post(expense, expense.recorded_by)
                counts['expenses'] += 1

    def _reconcile(self):
        """Per tenancy: ledger receivable == Σ invoice balances, ledger prepayments == Σ unapplied."""
        problems = []
        tenancy_ids = Invoice.objects.values_list('tenancy_id', flat=True).distinct()
        for tenancy_id in tenancy_ids:
            invoices = list(Invoice.objects.filter(tenancy_id=tenancy_id).select_related('organization'))
            org = invoices[0].organization
            expected_receivable = sum((i.amount_due - i.amount_credited - i.amount_paid for i in invoices), ZERO)
            receivable = LedgerService.balance(org, chart.TENANT_RECEIVABLES, tenancy_id=tenancy_id)
            if receivable != expected_receivable:
                problems.append(
                    f'Tenancy {tenancy_id}: ledger receivable {receivable} != invoice balances {expected_receivable}'
                )
            expected_credit = sum(
                (p.unapplied_amount for p in Payment.objects.filter(tenancy_id=tenancy_id, status='success')), ZERO,
            )
            credit = LedgerService.balance(org, chart.TENANT_PREPAYMENTS, tenancy_id=tenancy_id)
            if credit != expected_credit:
                problems.append(f'Tenancy {tenancy_id}: ledger prepayments {credit} != unapplied payments {expected_credit}')
        return problems
