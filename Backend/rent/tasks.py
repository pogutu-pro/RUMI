"""RUMIA rent domain Celery tasks — recurring charge generation and reminders."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='rent.tasks.generate_rent_charges')
def generate_rent_charges():
    """Daily: ensure every active tenancy has a RentCharge for its current period."""
    from rent.services.rent_generation import RentChargeGenerationService

    result = RentChargeGenerationService.generate_for_all_organizations()
    updated = RentChargeGenerationService.refresh_statuses()
    logger.info(
        'RUMIA rent generation: %s charges created, %s statuses refreshed',
        result.created, updated,
    )
    return {'created': result.created, 'statuses_refreshed': updated}


@shared_task(name='rent.tasks.send_payment_confirmation_task')
def send_payment_confirmation_task(payment_id):
    """Fired from the Paystack webhook after a payment is verified — kept off the request path."""
    from rent.models import Payment
    from rent.services.notifications import send_payment_confirmation

    try:
        payment = Payment.objects.select_related('tenant', 'unit').get(pk=payment_id)
    except Payment.DoesNotExist:
        return
    send_payment_confirmation(payment)


@shared_task(name='rent.tasks.send_rent_due_reminders')
def send_rent_due_reminders():
    """
    Daily: remind tenants whose charge is due within 3 days or already overdue,
    at most once per charge (RentCharge.reminder_sent_at guards against repeats).
    """
    from datetime import date, timedelta

    from django.utils import timezone

    from rent.models import RentCharge
    from rent.services.notifications import send_rent_due_reminder

    today = date.today()
    horizon = today + timedelta(days=3)

    charges = RentCharge.objects.filter(
        status__in=['due', 'partially_paid', 'overdue'],
        due_date__lte=horizon,
        reminder_sent_at__isnull=True,
    ).select_related('tenant', 'unit')

    sent = 0
    for charge in charges:
        send_rent_due_reminder(charge)
        RentCharge.objects.filter(pk=charge.pk).update(reminder_sent_at=timezone.now())
        sent += 1

    logger.info('RUMIA rent reminders sent: %s', sent)
    return {'sent': sent}


@shared_task(name='rent.tasks.escalate_overdue_to_next_of_kin')
def escalate_overdue_to_next_of_kin():
    """
    Daily: for organizations that have explicitly opted in
    (EscalationPolicy.allow_next_of_kin_rent_contact), notify a tenant's
    authorized next-of-kin once a charge has been overdue past the
    configured threshold. Never contacts a next-of-kin without that opt-in
    and an explicitly authorized EmergencyContact — see tenants.models.
    """
    from datetime import date, timedelta

    from django.utils import timezone

    from rent.models import RentCharge
    from rent.services.notifications import send_next_of_kin_escalation
    from tenants.models import EscalationPolicy

    today = date.today()
    notified = 0

    policies = EscalationPolicy.objects.filter(
        allow_next_of_kin_rent_contact=True,
        next_of_kin_contact_after_days__isnull=False,
        is_active=True,
    ).select_related('organization')

    for policy in policies:
        cutoff = today - timedelta(days=policy.next_of_kin_contact_after_days)
        charges = RentCharge.objects.filter(
            organization=policy.organization,
            status='overdue',
            due_date__lte=cutoff,
            next_of_kin_notified_at__isnull=True,
        ).select_related('tenant', 'unit')

        for charge in charges:
            contact = (
                charge.tenant.emergency_contacts
                .filter(purpose__in=['rent_escalation_authorized', 'both'])
                .order_by('-is_primary')
                .first()
            )
            if not contact:
                continue
            send_next_of_kin_escalation(charge, contact)
            RentCharge.objects.filter(pk=charge.pk).update(next_of_kin_notified_at=timezone.now())
            notified += 1

    logger.info('RUMIA next-of-kin escalations sent: %s', notified)
    return {'notified': notified}
