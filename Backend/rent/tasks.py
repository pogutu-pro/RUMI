"""RumiaRent rent domain Celery tasks — recurring charge generation and reminders."""

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
        'RumiaRent rent generation: %s charges created, %s statuses refreshed',
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


@shared_task(name='rent.tasks.deliver_receipt_task')
def deliver_receipt_task(receipt_id):
    """Render a receipt PDF and send it by SMS/email — scheduled after the payment commits."""
    from rent.models import Receipt
    from rent.services.receipts import ReceiptService

    receipt = Receipt.objects.filter(pk=receipt_id).first()
    if receipt is not None:
        ReceiptService.deliver(receipt)


@shared_task(name='rent.tasks.send_rent_due_reminders')
def send_rent_due_reminders():
    """
    Daily: send each due step of every organization's EscalationPolicy
    reminder schedule — before due, on the due date, overdue follow-ups, and
    caretaker/landlord escalations — each at most once per invoice.
    """
    from rent.services.reminders import ReminderService

    counts = ReminderService.run()
    logger.info('RumiaRent reminders: %s sent, %s stale steps skipped', counts['sent'], counts['skipped'])
    return counts


@shared_task(name='rent.tasks.apply_late_penalties')
def apply_late_penalties():
    """Daily: issue late-penalty invoices under each organization's enabled PenaltyPolicy."""
    from rent.services.penalties import PenaltyService

    counts = PenaltyService.run()
    logger.info('RumiaRent late penalties issued: %s', counts['issued'])
    return counts


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

    logger.info('RumiaRent next-of-kin escalations sent: %s', notified)
    return {'notified': notified}
