"""
Income flow calculations — authoritative, ledger-based.

All figures derive from Invoice and Payment records, never dashboard caches.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Optional

from django.db.models import F, Q, Sum
from django.utils import timezone

from properties.models import Property, RentalUnit, Tenancy
from rent.models import Invoice, Payment


@dataclass
class IncomeSummary:
    expected_rent: Decimal = Decimal('0.00')
    collected_rent: Decimal = Decimal('0.00')
    outstanding_rent: Decimal = Decimal('0.00')
    overdue_rent: Decimal = Decimal('0.00')
    collection_rate: Decimal = Decimal('0.00')
    vacancy_loss: Decimal = Decimal('0.00')
    projected_income: Decimal = Decimal('0.00')
    charge_count: int = 0
    overdue_count: int = 0


@dataclass
class PropertyIncomeSummary(IncomeSummary):
    property_id: str = ''
    property_name: str = ''


@dataclass
class IncomeFlowReport:
    organization_id: str
    period_start: date
    period_end: date
    summary: IncomeSummary = field(default_factory=IncomeSummary)
    by_property: list[PropertyIncomeSummary] = field(default_factory=list)


class IncomeFlowService:
    """Calculate rental income metrics from authoritative ledger records."""

    @classmethod
    def for_organization(
        cls,
        organization_id,
        period_start: date,
        period_end: date,
        property_id: Optional[str] = None,
    ) -> IncomeFlowReport:
        charges = Invoice.objects.filter(
            organization_id=organization_id,
            period_start__lte=period_end,
            period_end__gte=period_start,
        ).exclude(status='waived')

        if property_id:
            charges = charges.filter(parent_property_id=property_id)

        summary = cls._summarize_charges(charges, period_start, period_end)
        summary.vacancy_loss = cls._vacancy_loss(
            organization_id, period_start, period_end, property_id
        )
        summary.projected_income = summary.expected_rent + summary.vacancy_loss

        by_property = []
        if not property_id:
            property_ids = charges.values_list('parent_property_id', flat=True).distinct()
            for pid in property_ids:
                prop_charges = charges.filter(parent_property_id=pid)
                prop = Property.objects.filter(id=pid).first()
                prop_summary = cls._summarize_charges(
                    prop_charges, period_start, period_end
                )
                by_property.append(
                    PropertyIncomeSummary(
                        property_id=str(pid),
                        property_name=prop.name if prop else '',
                        expected_rent=prop_summary.expected_rent,
                        collected_rent=prop_summary.collected_rent,
                        outstanding_rent=prop_summary.outstanding_rent,
                        overdue_rent=prop_summary.overdue_rent,
                        collection_rate=prop_summary.collection_rate,
                        charge_count=prop_summary.charge_count,
                        overdue_count=prop_summary.overdue_count,
                    )
                )

        return IncomeFlowReport(
            organization_id=str(organization_id),
            period_start=period_start,
            period_end=period_end,
            summary=summary,
            by_property=by_property,
        )

    @classmethod
    def _summarize_charges(cls, charges, period_start: date, period_end: date) -> IncomeSummary:
        today = timezone.localdate()
        expected = Decimal('0.00')
        collected = Decimal('0.00')
        outstanding = Decimal('0.00')
        overdue = Decimal('0.00')
        overdue_count = 0

        for charge in charges:
            expected += charge.total_due
            collected += charge.amount_paid
            out = charge.outstanding
            outstanding += out
            if charge.status == 'overdue' or (
                charge.due_date < today and out > 0
            ):
                overdue += out
                overdue_count += 1

        collection_rate = (
            (collected / expected * Decimal('100')).quantize(Decimal('0.01'))
            if expected > 0
            else Decimal('0.00')
        )

        return IncomeSummary(
            expected_rent=expected,
            collected_rent=collected,
            outstanding_rent=outstanding,
            overdue_rent=overdue,
            collection_rate=collection_rate,
            charge_count=charges.count(),
            overdue_count=overdue_count,
        )

    @classmethod
    def _vacancy_loss(
        cls,
        organization_id,
        period_start: date,
        period_end: date,
        property_id: Optional[str] = None,
    ) -> Decimal:
        """
        Estimate potential income lost from vacant units during the period.

        Uses monthly_rent prorated by days in period for vacant units.
        """
        units = RentalUnit.objects.filter(
            organization_id=organization_id,
            status='vacant',
            is_active=True,
        )
        if property_id:
            units = units.filter(parent_property_id=property_id)

        days_in_period = (period_end - period_start).days + 1
        if days_in_period <= 0:
            return Decimal('0.00')

        total_loss = Decimal('0.00')
        for unit in units:
            daily_rate = unit.monthly_rent / Decimal('30')
            total_loss += (daily_rate * Decimal(str(days_in_period))).quantize(
                Decimal('0.01')
            )
        return total_loss

    @classmethod
    def overdue_charges(cls, organization_id, as_of: Optional[date] = None):
        today = as_of or timezone.localdate()
        return Invoice.objects.filter(
            organization_id=organization_id,
            due_date__lt=today,
        ).exclude(
            status__in=['paid', 'waived']
        ).filter(
            Q(amount_paid__lt=F('amount_due') - F('amount_credited'))
        )

    @classmethod
    def active_tenancy_for_unit(cls, unit: RentalUnit) -> Optional[Tenancy]:
        return unit.tenancies.filter(status='active').order_by('-start_date').first()
