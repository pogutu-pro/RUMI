"""
Organization-level notifications.

`notify_payout_blocked_attempt` is called from `PaymentService.initiate`'s
payout-verification guard (PAY-03) whenever a rent payment is refused
because the landlord's Organization has no active PayoutAccount. It notifies
the Organization owner and every actively-assigned caretaker via email + SMS,
throttled to at most once per 24 hours per Organization (D-03/D-04).

Mirrors `billing/services/notifications.py`'s exact `_send_email`/`_send_sms`
structure: failures in one channel never raise — an owner with no phone
number on file, or a transient provider error, must never break the calling
payment flow (`PaymentService.initiate` already performs a synchronous
external Paystack call in this same request path).

T-02-08: the notification body deliberately excludes the tenant's name,
phone, and the payment amount — it only states that a tenant attempted to
pay rent and that payout setup is incomplete for this organization.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models import Q
from django.utils import timezone

from notifications.tasks import send_sms_via_africastalking

logger = logging.getLogger(__name__)

THROTTLE_WINDOW = timedelta(hours=24)


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
        logger.exception('RumiaRent payout-blocked email notification failed (to=%s)', to_email)
        return False


def _send_sms(phone: str, message: str) -> bool:
    if not phone:
        return False
    try:
        send_sms_via_africastalking(phone, message)
        return True
    except Exception:
        logger.exception('RumiaRent payout-blocked SMS notification failed (phone=%s)', phone)
        return False


def notify_payout_blocked_attempt(organization) -> None:
    """
    Notify the Organization owner and any actively-assigned caretakers that a
    tenant's rent payment was refused because payout setup is incomplete.

    Throttled to at most once per 24 hours per Organization (D-04) — a
    PayoutAccount row is created on first use (`status='not_started'`) if
    none exists yet, since a blocked attempt implies no verified account.
    """
    from organizations.models import PayoutAccount

    payout_account, _ = PayoutAccount.objects.get_or_create(
        organization=organization, defaults={'status': 'not_started'}
    )

    # Atomic conditional update ("claim the throttle window") instead of a
    # separate read-then-send-then-write: two concurrent callers (e.g. two
    # tenants hitting the same blocked payout within seconds of each other)
    # can otherwise both read a stale/None last_payout_blocked_notified_at,
    # both pass the throttle check, and both send duplicate notifications.
    # Only the caller whose UPDATE actually matches a row (rowcount == 1)
    # wins the right to send; a losing caller's UPDATE matches zero rows.
    cutoff = timezone.now() - THROTTLE_WINDOW
    claimed = PayoutAccount.objects.filter(pk=payout_account.pk).filter(
        Q(last_payout_blocked_notified_at__isnull=True)
        | Q(last_payout_blocked_notified_at__lt=cutoff)
    ).update(last_payout_blocked_notified_at=timezone.now())

    if not claimed:
        return

    subject = 'Action needed: a tenant tried to pay rent but payout setup is incomplete'
    body = (
        f'Hi,\n\n'
        f'A tenant just attempted to pay rent for {organization.name}, but this '
        f'organization has not completed Paystack payout setup yet, so the '
        f'payment could not be processed.\n\n'
        f'Please complete your bank details / payout setup as soon as possible '
        f'so future rent payments can be collected.\n\n'
        f'Thank you.'
    )
    sms_text = (
        f'RumiaRent: a tenant tried to pay rent for {organization.name} but '
        f'payout setup is incomplete. Please complete payout setup to receive rent.'
    )

    recipients = _blocked_notification_recipients(organization)
    for user in recipients:
        _send_email(user.email, subject, body)
        _send_sms(getattr(user, 'phone_number', ''), sms_text)


def _blocked_notification_recipients(organization) -> list:
    """Owner plus every user with an active caretaker assignment on this org."""
    from accounts.models import User
    from properties.models import CaretakerPropertyAssignment

    recipients = [organization.owner]

    caretaker_user_ids = (
        CaretakerPropertyAssignment.objects.filter(organization=organization, is_active=True)
        .select_related('caretaker_profile__user')
        .values_list('caretaker_profile__user', flat=True)
        .distinct()
    )
    if caretaker_user_ids:
        recipients.extend(User.objects.filter(id__in=list(caretaker_user_ids)))

    return recipients
