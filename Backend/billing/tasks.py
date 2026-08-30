"""RumiaRent billing domain Celery tasks — grace-period expiration and manual-renewal reminders."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='billing.tasks.process_grace_period_expirations')
def process_grace_period_expirations():
    """
    Daily: a `past_due` subscription never sits unresolved indefinitely — once
    its `grace_period_ends_at` has passed, transition it to `suspended`.
    """
    from django.utils import timezone

    from billing.models import OrganizationSubscription

    expired = OrganizationSubscription.objects.filter(
        status='past_due',
        grace_period_ends_at__lt=timezone.now(),
    )

    suspended = 0
    for subscription in expired:
        subscription.status = 'suspended'
        subscription.save(update_fields=['status', 'updated_at'])
        suspended += 1

    logger.info('RumiaRent billing grace-period expirations: %s subscriptions suspended', suspended)
    return {'suspended': suspended}


@shared_task(name='billing.tasks.send_manual_renewal_reminders')
def send_manual_renewal_reminders():
    """
    Daily: remind `billing_mode=manual` landlords whose subscription is
    approaching `current_period_end`, at most once per billing period
    (`last_reminder_sent_at` guards against repeats, mirroring
    `RentCharge.reminder_sent_at` in `rent/tasks.py::send_rent_due_reminders`).
    """
    from datetime import date, timedelta

    from django.utils import timezone

    from billing.models import OrganizationSubscription
    from billing.services.notifications import send_manual_renewal_reminder

    today = date.today()
    horizon = today + timedelta(days=3)

    subscriptions = OrganizationSubscription.objects.filter(
        billing_mode='manual',
        status='active',
        current_period_end__lte=horizon,
        current_period_end__gte=today,
    ).select_related('organization__owner', 'plan')

    sent = 0
    for subscription in subscriptions:
        # Guard against a second reminder within the same billing period:
        # `current_period_start` marks the start of the current period, so a
        # reminder already sent on/after that date has covered this period.
        period_start = subscription.current_period_start
        if (
            subscription.last_reminder_sent_at is not None
            and period_start is not None
            and subscription.last_reminder_sent_at.date() >= period_start
        ):
            continue

        send_manual_renewal_reminder(subscription)
        OrganizationSubscription.objects.filter(pk=subscription.pk).update(
            last_reminder_sent_at=timezone.now(),
        )
        sent += 1

    logger.info('RumiaRent billing manual-renewal reminders sent: %s', sent)
    return {'sent': sent}
