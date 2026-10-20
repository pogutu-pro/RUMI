"""RumiaRent billing domain Celery tasks — grace-period expiration and manual-renewal reminders."""

import logging

from celery import shared_task
from django.db.models import Q

logger = logging.getLogger(__name__)


@shared_task(name='billing.tasks.process_grace_period_expirations')
def process_grace_period_expirations():
    """
    Daily:
    1. An `active` subscription whose paid period has ended moves to
       `past_due` with the normal grace window. Manual subscriptions lapse
       the day after `current_period_end` (they never get a Paystack renewal,
       so previously they stayed active forever — audit C1). Auto
       subscriptions get a few days' buffer, since Paystack renews on calendar
       months and normally delivers its renewal `charge.success` first.
    2. A `past_due` subscription never sits unresolved indefinitely — once
       its `grace_period_ends_at` has passed, transition it to `suspended`.
    """
    from datetime import timedelta

    from django.conf import settings
    from django.utils import timezone

    from billing.models import OrganizationSubscription

    now = timezone.now()
    today = now.date()
    grace = timedelta(days=getattr(settings, 'BILLING_GRACE_PERIOD_DAYS', 7))
    auto_buffer = timedelta(days=getattr(settings, 'BILLING_AUTO_RENEWAL_BUFFER_DAYS', 3))

    lapsed = OrganizationSubscription.objects.filter(
        status='active', current_period_end__isnull=False,
    ).filter(
        Q(billing_mode='manual', current_period_end__lt=today)
        | Q(billing_mode='auto', current_period_end__lt=today - auto_buffer)
    )
    lapsed_count = 0
    for subscription in lapsed:
        subscription.status = 'past_due'
        subscription.grace_period_ends_at = now + grace
        subscription.save(update_fields=['status', 'grace_period_ends_at', 'updated_at'])
        lapsed_count += 1
    logger.info('RumiaRent billing: %s subscriptions lapsed into past_due', lapsed_count)

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
    return {'lapsed': lapsed_count, 'suspended': suspended}


@shared_task(
    bind=True,
    name='billing.tasks.disable_replaced_paystack_subscription',
    max_retries=5,
    default_retry_delay=300,
)
def disable_replaced_paystack_subscription(self, subscription_code, email_token):
    """
    After a plan switch's first charge succeeds, cancel the old Paystack
    subscription so the organization isn't billed for both plans. Retried on
    failure; a final failure needs manual cancellation in the Paystack
    dashboard, so it is logged at error level.
    """
    from billing.providers.paystack_billing import PaystackBillingClient
    from rent.providers.base import PaymentProviderError

    try:
        PaystackBillingClient().disable_subscription(subscription_code, email_token)
    except PaymentProviderError as exc:
        if self.request.retries >= self.max_retries:
            logger.error(
                'Could not disable replaced Paystack subscription %s after a plan switch — '
                'cancel it manually in the Paystack dashboard to avoid double billing: %s',
                subscription_code, exc,
            )
            return {'disabled': False}
        raise self.retry(exc=exc)
    return {'disabled': True}


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
