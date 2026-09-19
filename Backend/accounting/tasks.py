import logging
from datetime import date

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# Days before the deadline (negative = after it) on which a landlord is reminded.
REMINDER_DAYS_LEFT = (5, 1, -1)


def _previous_month(today: date) -> date:
    return date(today.year - (today.month == 1), 12 if today.month == 1 else today.month - 1, 1)


@shared_task(name='accounting.tasks.send_mri_reminders')
def send_mri_reminders():
    """
    Daily: remind landlords to declare last month's rental income tax (MRI)
    five days before the deadline, the day before, and the day after if it is
    still not marked as filed. RumiaRent never files for them; it tells them
    the figure and where to file.
    """
    from accounts.utils import send_branded_email
    from notifications.in_app import notify_in_app, role_url
    from organizations.models import Organization
    from rent.models import Payment

    from . import services
    from .models import TaxRateConfig

    today = timezone.localdate()
    config = TaxRateConfig.get()
    month = _previous_month(today)
    deadline = services.filing_deadline(month, config)
    days_left = (deadline - today).days
    if days_left not in REMINDER_DAYS_LEFT:
        return {'sent': 0}

    sent = 0
    for organization in Organization.objects.select_related('owner').filter(owner__is_active=True):
        # Only landlords who have actually collected rent through RumiaRent.
        if not Payment.objects.filter(organization=organization, status='success').exists():
            continue
        figures = services.mri_for_month(organization, month, config)
        if figures['status'] == 'filed':
            continue
        try:
            _notify(organization.owner, organization, month, figures, deadline, days_left,
                    send_branded_email, notify_in_app, role_url)
            sent += 1
        except Exception:  # noqa: BLE001 - one landlord's problem must not stop the rest
            logger.exception('MRI reminder failed for organization %s', organization.pk)
    logger.info('RumiaRent MRI reminders sent: %s', sent)
    return {'sent': sent}


def _notify(owner, organization, month, figures, deadline, days_left, send_email, notify_in_app, role_url):
    month_label = month.strftime('%B %Y')
    deadline_label = deadline.strftime('%d %B %Y')
    if days_left < 0:
        headline = f'Your rental income tax for {month_label} is now overdue.'
    else:
        headline = f'Your rental income tax for {month_label} is due by {deadline_label}.'

    if figures['is_nil']:
        detail = f'No rent was received in {month_label}. If you are registered for MRI, file a NIL return on iTax or eRITS.'
    else:
        detail = (
            f'Rent received in {month_label}: KES {figures["gross_rent"]}. '
            f'Rental income tax at {figures["rate"]}%: KES {figures["mri_due"]}.'
        )

    subject = f'Rental income tax (MRI) for {month_label}'
    message = f"""
    Hi {owner.first_name},

    {headline}

    {detail}

    File and pay on iTax or eRITS by {deadline_label}. RumiaRent prepares these figures but does not file for you.

    Open Accounting in RumiaRent to see the breakdown and mark the month as filed.

    This is a reminder, not tax advice.

    Best regards,
    RumiaRent Team
    """
    send_email(
        subject=subject, message=message, from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[owner.email], recipient_name=owner.first_name, fail_silently=False,
    )
    notify_in_app(
        owner, notification_type='mri_reminder', subject=subject, message=f'{headline} {detail}',
        url=role_url(owner, 'accounting'), dedupe_key=f'mri:{organization.pk}:{month.isoformat()}',
    )
