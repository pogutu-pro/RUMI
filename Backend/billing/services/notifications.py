"""
Billing notifications — manual-renewal reminder for `billing_mode=manual`
subscriptions.

Mirrors `rent/services/notifications.py`'s `_send_email`/`_send_sms`
structure: uses Django's configured EMAIL_BACKEND and the existing Africa's
Talking sender in `notifications.tasks` directly. Failures in one channel
never raise — a landlord with no phone on file, or a transient provider
error, must not break the Celery Beat task that triggered the reminder.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMessage

from notifications.tasks import send_sms_via_africastalking

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str) -> bool:
    if not to_email:
        return False
    try:
        EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        ).send(fail_silently=False)
        return True
    except Exception:
        logger.exception('RumiaRent billing email notification failed (to=%s)', to_email)
        return False


def _send_sms(phone: str, message: str) -> bool:
    if not phone:
        return False
    try:
        send_sms_via_africastalking(phone, message)
        return True
    except Exception:
        logger.exception('RumiaRent billing SMS notification failed (phone=%s)', phone)
        return False


def send_manual_renewal_reminder(subscription) -> None:
    """subscription: billing.models.OrganizationSubscription (billing_mode='manual')"""
    owner = subscription.organization.owner
    plan = subscription.plan
    period_end = subscription.current_period_end

    subject = 'Your RumiaRent subscription is due for renewal'
    body = (
        f'Hi {owner.get_full_name() or owner.email},\n\n'
        f'Your {plan.name} subscription (KES {plan.price}) for '
        f'{subscription.organization.name} is due for renewal on '
        f'{period_end.isoformat() if period_end else "your next billing date"}.\n\n'
        f'Since your subscription is on manual billing, please arrange payment '
        f'before then to avoid any interruption to your account.\n\n'
        f'Thank you.'
    )
    _send_email(owner.email, subject, body)

    sms_text = (
        f'RumiaRent: your {plan.name} subscription (KES {plan.price}) renews on '
        f'{period_end.isoformat() if period_end else "your next billing date"}. '
        f'Please arrange payment to avoid interruption.'
    )
    _send_sms(getattr(owner, 'phone_number', ''), sms_text)
