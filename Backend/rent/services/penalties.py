"""
Late penalties (design §5.4, decision D7).

Daily: for every overdue invoice covered by an enabled PenaltyPolicy (the
property's override if it has one, else the organization's), once the grace
period has passed, issue `penalty` invoices linked to it:

- `once`:    one penalty per overdue invoice.
- `monthly`: one more for every full month it stays unpaid after the first.

Amount is fixed or a percent of the overdue balance, never pushing total
penalties on one invoice past `cap_percent_of_invoice`. Idempotent: at most
one penalty per source invoice per day (database constraint), and the count
of penalties issued never exceeds what the policy allows for the elapsed time.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from dateutil.relativedelta import relativedelta
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.utils import timezone

from rent.models import Invoice, PenaltyPolicy
from rent.services.invoicing import InvoiceService, LineSpec

logger = logging.getLogger(__name__)

ZERO = Decimal('0.00')
CENT = Decimal('0.01')


def policy_for(invoice: Invoice) -> Optional[PenaltyPolicy]:
    policies = {
        p.parent_property_id: p
        for p in PenaltyPolicy.objects.filter(organization_id=invoice.organization_id)
    }
    return policies.get(invoice.parent_property_id) or policies.get(None)


def penalties_allowed(policy: PenaltyPolicy, first_penalty_day: date, as_of: date) -> int:
    if as_of < first_penalty_day:
        return 0
    if policy.frequency == 'once':
        return 1
    months = relativedelta(as_of, first_penalty_day)
    return 1 + months.years * 12 + months.months


class PenaltyService:
    @classmethod
    def run(cls, as_of: Optional[date] = None) -> dict:
        as_of = as_of or timezone.localdate()
        counts = {'issued': 0}
        org_ids = PenaltyPolicy.objects.filter(enabled=True).values_list('organization_id', flat=True)
        candidates = (
            Invoice.objects.filter(organization_id__in=set(org_ids), is_disputed=False, due_date__lt=as_of)
            .exclude(invoice_type='penalty')
            .exclude(status__in=['paid', 'waived'])
            .select_related('tenancy', 'tenant', 'unit', 'organization')
        )
        for invoice in candidates.iterator():
            try:
                counts['issued'] += cls.apply(invoice, as_of)
            except Exception:
                logger.exception('Penalty run failed for invoice %s', invoice.pk)
        return counts

    @classmethod
    def apply(cls, invoice: Invoice, as_of: date) -> int:
        policy = policy_for(invoice)
        if policy is None or not policy.enabled or invoice.invoice_type not in policy.invoice_types:
            return 0
        if invoice.outstanding <= 0 or invoice.is_disputed:
            return 0

        grace = policy.grace_days if policy.grace_days is not None else invoice.tenancy.grace_period_days
        first_penalty_day = invoice.due_date + timedelta(days=grace + 1)
        existing = invoice.derived_invoices.filter(invoice_type='penalty')
        if existing.count() >= penalties_allowed(policy, first_penalty_day, as_of):
            return 0

        amount = cls._amount(policy, invoice, existing)
        if amount <= 0:
            return 0
        try:
            with transaction.atomic():
                penalty = InvoiceService.create_invoice(
                    invoice.tenancy,
                    'penalty',
                    [LineSpec('penalty', amount, description=f'Late penalty on {invoice.number}')],
                    period_start=as_of,
                    period_end=as_of,
                    due_date=as_of,
                    issue_date=as_of,
                    source_invoice=invoice,
                    as_of=as_of,
                )
        except IntegrityError:
            return 0  # Already penalized today (concurrent run).

        if policy.notify_tenant:
            cls._notify(penalty, invoice)
        return 1

    @staticmethod
    def _amount(policy: PenaltyPolicy, invoice: Invoice, existing) -> Decimal:
        if policy.method == 'fixed':
            amount = policy.amount
        else:
            amount = (invoice.outstanding * policy.percent / Decimal('100')).quantize(CENT, rounding=ROUND_HALF_UP)
        if policy.cap_percent_of_invoice is not None:
            cap = (invoice.amount_due * policy.cap_percent_of_invoice / Decimal('100')).quantize(CENT)
            already = existing.aggregate(total=Sum('amount_due'))['total'] or ZERO
            amount = min(amount, max(cap - already, ZERO))
        return Decimal(amount).quantize(CENT)

    @staticmethod
    def _notify(penalty: Invoice, source: Invoice) -> None:
        from rent.services.notifications import _deliver
        from rent.services.reminders import _channels, _policy_for

        tenant = penalty.tenant
        sms = (
            f'RumiaRent: a late penalty of KES {penalty.amount_due} was added for {source.number} '
            f'({source.unit.unit_number}). Ref {penalty.number}.'
        )
        try:
            _deliver(
                _channels(_policy_for(penalty.organization)), email=tenant.email, phone=tenant.phone, user=tenant.user,
                subject=f'Late penalty added: KES {penalty.amount_due}',
                body=f'Hi {tenant.full_name},\n\n{sms.removeprefix("RumiaRent: ")}\n\n{penalty.organization.name}',
                sms=sms, kind='rent_penalty', metadata={'invoice_id': str(penalty.pk), 'source': str(source.pk)},
            )
        except Exception:
            logger.exception('Penalty notification failed for %s', penalty.pk)
