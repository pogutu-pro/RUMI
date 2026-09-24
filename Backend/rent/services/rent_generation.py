"""
Recurring rent-charge generation.

For every active tenancy, ensure the current billing period has exactly one
RentCharge. Idempotent by design: (tenancy, period_start) is unique at the
database level (rent.RentCharge.Meta.unique_together), so calling this
repeatedly — from a manual trigger or the daily Celery beat task — can never
create a duplicate charge for a period that already has one.

Deliberately simple: one monthly charge per tenancy, no proration, no
multi-period backfill beyond catching up a tenancy that was never billed.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from django.db import IntegrityError, transaction

from properties.models import Tenancy
from rent.models import RentCharge


@dataclass
class GenerationResult:
    created: int
    skipped: int


def _next_period(period_start: date) -> tuple[date, date]:
    period_end = period_start + relativedelta(months=1) - timedelta(days=1)
    return period_start, period_end


def _due_date_for(period_start: date, rent_due_day: int) -> date:
    period_end = period_start + relativedelta(months=1) - timedelta(days=1)
    day = min(rent_due_day, period_end.day)
    due = period_start.replace(day=day)
    # A tenancy starting after its nominal due-day (e.g. moves in on the 27th,
    # rent_due_day=5) would otherwise get a due_date before the period even
    # starts — clamp to period_start so a fresh tenancy is never born overdue.
    return max(due, period_start)


class RentChargeGenerationService:
    """Generates the next-due RentCharge for active tenancies. Never duplicates."""

    @classmethod
    def generate_for_tenancy(cls, tenancy: Tenancy, as_of: date | None = None) -> int:
        """Ensure every elapsed billing period up to `as_of` has a charge. Returns count created."""
        as_of = as_of or date.today()
        created = 0

        latest = tenancy.rent_charges.order_by('-period_start').first()
        period_start = (latest.period_end + timedelta(days=1)) if latest else tenancy.start_date

        # Safety cap: never generate more than 24 periods in one pass, even if
        # a tenancy was neglected for years — avoids a runaway loop.
        for _ in range(24):
            if period_start > as_of:
                break
            _, period_end = _next_period(period_start)
            due_date = _due_date_for(period_start, tenancy.rent_due_day)

            try:
                with transaction.atomic():
                    charge = RentCharge.objects.create(
                        organization=tenancy.organization,
                        tenancy=tenancy,
                        parent_property=tenancy.parent_property,
                        unit=tenancy.unit,
                        tenant=tenancy.tenant,
                        period_start=period_start,
                        period_end=period_end,
                        due_date=due_date,
                        amount_due=tenancy.monthly_rent,
                        currency='KES',
                    )
                    # Set the true status immediately — a backfilled charge for a
                    # tenancy that's been running a while may already be due or
                    # overdue on day one, not 'upcoming' (the model default).
                    charge.recalculate_status(as_of=as_of)
                    charge.save(update_fields=['amount_paid', 'status', 'updated_at'])

                    # A tenant who paid ahead (or overpaid) has that money
                    # sitting unattached to any charge until one exists to
                    # apply it to — this is that moment. Settles the new
                    # charge from oldest existing credit first; a no-op when
                    # there isn't any.
                    from rent.services.payment_service import PaymentService
                    PaymentService.apply_credit_to_new_charge(charge)
                created += 1
            except IntegrityError:
                # Another process already created this period's charge — expected
                # under concurrent execution, not an error.
                pass

            period_start = period_end + timedelta(days=1)

        return created

    @classmethod
    def generate_for_organization(cls, organization_id, as_of: date | None = None) -> GenerationResult:
        tenancies = Tenancy.objects.filter(
            organization_id=organization_id, status='active',
        ).select_related('tenant', 'unit', 'parent_property')

        created_total = 0
        skipped = 0
        for tenancy in tenancies:
            created = cls.generate_for_tenancy(tenancy, as_of=as_of)
            created_total += created
            if created == 0:
                skipped += 1

        return GenerationResult(created=created_total, skipped=skipped)

    @classmethod
    def refresh_statuses(cls, as_of: date | None = None) -> int:
        """
        Advance charge status purely by date (upcoming->due->overdue) for charges
        with no recent payment activity. Payment flows already call
        RentCharge.recalculate_status() themselves; this catches charges that
        just aged past a boundary with no payment at all.
        """
        as_of = as_of or date.today()
        candidates = RentCharge.objects.exclude(
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

    @classmethod
    def generate_for_all_organizations(cls, as_of: date | None = None) -> GenerationResult:
        tenancies = Tenancy.objects.filter(status='active').select_related(
            'tenant', 'unit', 'parent_property',
        )
        created_total = 0
        skipped = 0
        for tenancy in tenancies:
            created = cls.generate_for_tenancy(tenancy, as_of=as_of)
            created_total += created
            if created == 0:
                skipped += 1
        return GenerationResult(created=created_total, skipped=skipped)
