"""
Metered utilities (design §3.4, decision D3).

Readings are recorded per unit and utility. Consumption = this reading −
the previous reading for the same unit and utility; a unit's very first
reading is the baseline. Unbilled readings taken before a rent period
starts are billed on that period's rent invoice (in arrears), or straight
away with `bill_now`. Rates default from the property's
`settings['utility_rates']` and are stored on each reading.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from django.db import transaction
from django.utils import timezone

from rent.models import MeterReading
from rent.services.invoicing import InvoiceService, LineSpec

ZERO = Decimal('0')


class UtilityError(ValueError):
    """Invalid reading or billing request (maps to a 400)."""


def default_rate(unit, utility: str) -> Optional[Decimal]:
    rates = (unit.parent_property.settings or {}).get('utility_rates', {})
    value = rates.get(utility)
    return Decimal(str(value)) if value not in (None, '') else None


class UtilityService:
    @classmethod
    @transaction.atomic
    def record_reading(
        cls, unit, utility: str, reading_date: date, value, rate_per_unit=None, notes: str = '', recorded_by=None,
    ) -> MeterReading:
        value = Decimal(str(value))
        rate = Decimal(str(rate_per_unit)) if rate_per_unit is not None else default_rate(unit, utility)
        if rate is None:
            raise UtilityError(f'Set a {utility} rate for this property, or give rate_per_unit.')
        previous = cls._previous(unit, utility, reading_date)
        if previous is not None and value < previous.value:
            raise UtilityError(
                f'Reading {value} is lower than the previous reading {previous.value} on {previous.reading_date}. '
                'If the meter was replaced, record the new meter’s first reading with notes.'
            )
        later = MeterReading.objects.filter(unit=unit, utility=utility, reading_date__gt=reading_date)
        if later.filter(billed=True).exists():
            raise UtilityError('A later reading has already been billed; readings cannot be inserted before it.')
        return MeterReading.objects.create(
            organization=unit.organization, unit=unit, utility=utility, reading_date=reading_date, value=value,
            rate_per_unit=rate, notes=notes, recorded_by=recorded_by,
        )

    @staticmethod
    def _previous(unit, utility, reading_date) -> Optional[MeterReading]:
        return (
            MeterReading.objects.filter(unit=unit, utility=utility, reading_date__lt=reading_date)
            .order_by('-reading_date').first()
        )

    @classmethod
    def lines_for(cls, tenancy, before: date) -> tuple[list[LineSpec], list[MeterReading]]:
        """
        Invoice lines for the tenancy's unbilled readings dated before `before`
        (and on/after the tenancy start). Returns (lines, readings consumed).
        """
        readings = list(
            MeterReading.objects.select_for_update()
            .filter(unit=tenancy.unit, billed=False, reading_date__lt=before, reading_date__gte=tenancy.start_date)
            .order_by('utility', 'reading_date')
        )
        lines = []
        for reading in readings:
            previous = cls._previous(reading.unit, reading.utility, reading.reading_date)
            reading.consumption = (reading.value - previous.value) if previous is not None else ZERO
            if reading.consumption > 0:
                lines.append(LineSpec(
                    reading.utility,
                    reading.rate_per_unit,
                    quantity=reading.consumption,
                    description=(
                        f'{reading.get_utility_display()}: {previous.value} → {reading.value} '
                        f'({previous.reading_date:%d %b} – {reading.reading_date:%d %b})'
                    ),
                ))
        return [line for line in lines if line.amount > 0], readings

    @staticmethod
    def mark_billed(readings, invoice) -> None:
        for reading in readings:
            reading.billed = True
            reading.billed_invoice = invoice if reading.consumption and reading.consumption > 0 else None
            reading.save(update_fields=['billed', 'billed_invoice', 'consumption'])

    @classmethod
    @transaction.atomic
    def bill_now(cls, tenancy, created_by=None):
        """Bill all unbilled readings for the tenancy on an ad-hoc invoice due today."""
        today = timezone.localdate()
        lines, readings = cls.lines_for(tenancy, before=today + timedelta(days=1))
        if not lines:
            raise UtilityError('No unbilled consumption for this tenancy.')
        invoice = InvoiceService.create_invoice(
            tenancy, 'adhoc', lines, period_start=min(r.reading_date for r in readings), period_end=today,
            due_date=today, created_by=created_by, notes='Metered utilities',
        )
        cls.mark_billed(readings, invoice)
        return invoice
