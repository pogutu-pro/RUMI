"""
Recurring rent invoicing.

For every billable tenancy, ensure each elapsed monthly billing period has
exactly one rent Invoice. Idempotent by design: (tenancy, period_start) is
unique for rent invoices at the database level (rent.Invoice
uniq_rent_invoice_per_period), so calling this repeatedly — from a manual
trigger or the daily Celery beat task — can never create a duplicate.

- Periods run monthly from the tenancy start date.
- Tenancies on notice keep being billed; billing stops at the lease end /
  move-out date, whichever is earlier.
- The final, partial period is prorated by days stayed unless the tenancy
  opts out (`Tenancy.prorate_final_period`, design decision D6).
- Each rent invoice carries the tenancy's active RecurringCharges as extra
  lines (prorated the same way).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from dateutil.relativedelta import relativedelta
from django.db import IntegrityError, transaction
from django.db.models import Q

from properties.models import Tenancy
from rent.models import Invoice
from rent.services.invoicing import InvoiceService, LineSpec

# Tenancies whose rent is still being invoiced day to day.
BILLABLE_STATUSES = ('active', 'notice_period')
# Ended tenancies are swept for this long after they end, so a final partial
# period is still billed if termination happened between daily runs.
ENDED_SWEEP_DAYS = 62


@dataclass
class GenerationResult:
    created: int
    skipped: int


def _natural_period_end(period_start: date) -> date:
    return period_start + relativedelta(months=1) - timedelta(days=1)


def _due_date_for(period_start: date, rent_due_day: int) -> date:
    period_end = _natural_period_end(period_start)
    day = min(rent_due_day, period_end.day)
    due = period_start.replace(day=day)
    # A tenancy starting after its nominal due-day (e.g. moves in on the 27th,
    # rent_due_day=5) would otherwise get a due_date before the period even
    # starts — clamp to period_start so a fresh tenancy is never born overdue.
    return max(due, period_start)


def tenancy_billing_end(tenancy: Tenancy) -> Optional[date]:
    """Last day the tenant is billed for: the earlier of lease end and move-out."""
    candidates = [d for d in (tenancy.end_date, tenancy.move_out_date) if d is not None]
    return min(candidates) if candidates else None


def _prorate(amount: Decimal, billed_days: int, period_days: int) -> Decimal:
    return (Decimal(amount) * Decimal(billed_days) / Decimal(period_days)).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP,
    )


class RentChargeGenerationService:
    """Generates the rent Invoices billable tenancies are owed. Never duplicates."""

    @classmethod
    def generate_for_tenancy(cls, tenancy: Tenancy, as_of: date | None = None) -> int:
        """Ensure every elapsed billing period up to `as_of` has a rent invoice. Returns count created."""
        as_of = as_of or date.today()
        billing_end = tenancy_billing_end(tenancy)
        created = 0

        latest = tenancy.invoices.filter(invoice_type='rent').order_by('-period_start').first()
        period_start = (latest.period_end + timedelta(days=1)) if latest else tenancy.start_date
        recurring = list(tenancy.recurring_charges.filter(is_active=True))

        # Safety cap: never generate more than 24 periods in one pass, even if
        # a tenancy was neglected for years — avoids a runaway loop.
        for _ in range(24):
            if period_start > as_of:
                break
            if billing_end is not None and period_start > billing_end:
                break

            natural_end = _natural_period_end(period_start)
            period_end = natural_end
            prorate = None
            if billing_end is not None and billing_end < natural_end:
                period_end = billing_end
                if tenancy.prorate_final_period:
                    prorate = ((billing_end - period_start).days + 1, (natural_end - period_start).days + 1)

            def amount(value):
                return _prorate(value, *prorate) if prorate else Decimal(value)

            suffix = f' ({prorate[0]} of {prorate[1]} days)' if prorate else ''
            lines = [LineSpec('rent', amount(tenancy.monthly_rent), description=f'Rent{suffix}')]
            for charge in recurring:
                if charge.applies_to(period_start, period_end):
                    lines.append(LineSpec(
                        charge.line_type,
                        amount(charge.amount),
                        description=f'{charge.description or charge.get_line_type_display()}{suffix}',
                    ))
            lines = [line for line in lines if line.amount > 0]

            if lines:
                try:
                    with transaction.atomic():
                        InvoiceService.create_invoice(
                            tenancy,
                            'rent',
                            lines,
                            period_start=period_start,
                            period_end=period_end,
                            due_date=min(_due_date_for(period_start, tenancy.rent_due_day), period_end),
                            issue_date=period_start,
                            # Set the true status immediately — a backfilled invoice for a
                            # tenancy that's been running a while may already be due or
                            # overdue on day one, not 'upcoming' (the model default).
                            as_of=as_of,
                        )
                    created += 1
                except IntegrityError:
                    # Another process already created this period's invoice —
                    # expected under concurrent execution, not an error.
                    pass

            period_start = period_end + timedelta(days=1)

        return created

    @classmethod
    def billable_tenancies(cls, as_of: date | None = None):
        as_of = as_of or date.today()
        recently_ended = Q(status__in=('terminated', 'expired')) & (
            Q(move_out_date__gte=as_of - timedelta(days=ENDED_SWEEP_DAYS))
            | Q(end_date__gte=as_of - timedelta(days=ENDED_SWEEP_DAYS))
        )
        return Tenancy.objects.filter(Q(status__in=BILLABLE_STATUSES) | recently_ended).select_related(
            'tenant', 'unit', 'parent_property', 'organization',
        )

    @classmethod
    def _generate(cls, tenancies, as_of) -> GenerationResult:
        created_total = 0
        skipped = 0
        for tenancy in tenancies:
            created = cls.generate_for_tenancy(tenancy, as_of=as_of)
            created_total += created
            if created == 0:
                skipped += 1
        return GenerationResult(created=created_total, skipped=skipped)

    @classmethod
    def generate_for_organization(cls, organization_id, as_of: date | None = None) -> GenerationResult:
        return cls._generate(cls.billable_tenancies(as_of).filter(organization_id=organization_id), as_of)

    @classmethod
    def generate_for_all_organizations(cls, as_of: date | None = None) -> GenerationResult:
        return cls._generate(cls.billable_tenancies(as_of), as_of)

    @classmethod
    def refresh_statuses(cls, as_of: date | None = None) -> int:
        """
        Advance invoice status purely by date (upcoming->due->overdue) for
        invoices with no recent payment activity. Payment flows already call
        Invoice.recalculate_status() themselves; this catches invoices that
        just aged past a boundary with no payment at all.
        """
        as_of = as_of or date.today()
        candidates = Invoice.objects.exclude(
            status__in=['paid', 'waived', 'disputed'],
        ).filter(period_start__lte=as_of)

        updated = 0
        for charge in candidates.iterator():
            previous_status = charge.status
            new_status = charge.recalculate_status(as_of=as_of)
            if new_status != previous_status:
                charge.save(update_fields=['amount_paid', 'status', 'updated_at'])
                updated += 1
        return updated
