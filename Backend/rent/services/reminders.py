"""
Arrears reminders driven by each organization's EscalationPolicy.

Schedule per open invoice (all optional, from the policy):
  before_<N>               N days before due   (first/second_reminder_days_before)
  due                      on the due date     (due_date_reminder)
  overdue_<N>              N days after due    (overdue_reminder_days)
  caretaker_escalation     assigned caretakers told the tenant is overdue
  landlord_escalation      organization owner told the tenant is overdue

Each step is logged once in ReminderLog. When several steps are due at once
(first run, or after downtime) only the latest is sent per audience and the
earlier ones are logged as skipped — tenants never get a burst of stale
reminders. Next-of-kin escalation stays in rent.tasks.escalate_overdue_to_next_of_kin.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Optional

from django.db import IntegrityError, transaction
from django.utils import timezone

from rent.models import Invoice, ReminderLog

logger = logging.getLogger(__name__)

DEFAULT_CHANNELS = ['sms', 'email', 'in_app']
TENANT, CARETAKER, LANDLORD = 'tenant', 'caretaker', 'landlord'


class _DefaultPolicy:
    """Used when an organization has no EscalationPolicy row (mirrors the model defaults)."""

    first_reminder_days_before = 7
    second_reminder_days_before = 3
    due_date_reminder = True
    overdue_reminder_days = [1, 3, 7, 14]
    caretaker_escalation_after_days = 14
    landlord_escalation_after_days = 21
    notification_channels = []
    is_active = True


def schedule_for(invoice: Invoice, policy) -> list[tuple[str, date, str]]:
    """(key, trigger date, audience) for every step of the policy, oldest first."""
    due = invoice.due_date
    steps = []
    for days in sorted({policy.first_reminder_days_before, policy.second_reminder_days_before}, reverse=True):
        if days:
            steps.append((f'before_{days}', due - timedelta(days=days), TENANT))
    if policy.due_date_reminder:
        steps.append(('due', due, TENANT))
    for days in sorted(set(policy.overdue_reminder_days or [])):
        if int(days) > 0:
            steps.append((f'overdue_{int(days)}', due + timedelta(days=int(days)), TENANT))
    if policy.caretaker_escalation_after_days:
        steps.append(('caretaker_escalation', due + timedelta(days=policy.caretaker_escalation_after_days), CARETAKER))
    if policy.landlord_escalation_after_days:
        steps.append(('landlord_escalation', due + timedelta(days=policy.landlord_escalation_after_days), LANDLORD))
    return sorted(steps, key=lambda step: step[1])


def _policy_for(organization):
    policy = getattr(organization, 'escalation_policy', None)
    return policy if policy is not None else _DefaultPolicy()


def _channels(policy) -> list[str]:
    return list(policy.notification_channels or DEFAULT_CHANNELS)


class ReminderService:
    @classmethod
    def run(cls, as_of: Optional[date] = None) -> dict:
        as_of = as_of or timezone.localdate()
        counts = {'sent': 0, 'skipped': 0}
        invoices = (
            Invoice.objects.filter(is_disputed=False)
            .exclude(status__in=['paid', 'waived'])
            .select_related('organization__escalation_policy', 'tenant__user', 'unit', 'parent_property')
        )
        for invoice in invoices.iterator():
            if invoice.outstanding <= 0:
                continue
            policy = _policy_for(invoice.organization)
            if not policy.is_active:
                continue
            sent, skipped = cls._process(invoice, policy, as_of)
            counts['sent'] += sent
            counts['skipped'] += skipped
        return counts

    @classmethod
    def _process(cls, invoice: Invoice, policy, as_of: date) -> tuple[int, int]:
        logged = set(invoice.reminder_logs.values_list('reminder_key', flat=True))
        due_now = [step for step in schedule_for(invoice, policy) if step[1] <= as_of and step[0] not in logged]
        if not due_now:
            return 0, 0

        # Latest due step per audience is sent; the rest are marked skipped.
        latest = {}
        for key, _trigger, audience in due_now:
            latest[audience] = key
        sent = skipped = 0
        channels = _channels(policy)
        for key, _trigger, audience in due_now:
            send = latest[audience] == key
            try:
                with transaction.atomic():
                    ReminderLog.objects.create(
                        invoice=invoice, reminder_key=key, skipped=not send, channels=channels if send else [],
                    )
            except IntegrityError:
                continue  # A concurrent run already handled this step.
            if send:
                cls._send(invoice, key, audience, channels, as_of)
                sent += 1
            else:
                skipped += 1
        return sent, skipped

    @classmethod
    def _send(cls, invoice: Invoice, key: str, audience: str, channels: list[str], as_of: date) -> None:
        from rent.services.notifications import send_invoice_reminder, send_overdue_escalation

        try:
            if audience == TENANT:
                send_invoice_reminder(invoice, key, channels, as_of)
            else:
                send_overdue_escalation(invoice, audience, channels, as_of)
        except Exception:
            # One bad recipient must never stop the daily run for everyone else.
            logger.exception('Reminder %s for invoice %s failed', key, invoice.pk)
