"""
Delivery log: one Notification row per email or SMS actually attempted.

Recorded at the two lowest layers (the email backend and the SMS sender) so
every feature is covered without each one remembering to log. Message bodies
are deliberately NOT stored: they carry verification codes and reset links,
and this log is readable by admins.
"""

import contextlib
import contextvars
import logging

from django.utils import timezone

logger = logging.getLogger(__name__)

DELIVERY_EMAIL = 'delivery_email'
DELIVERY_SMS = 'delivery_sms'
DELIVERY_TYPES = (DELIVERY_EMAIL, DELIVERY_SMS)

_suppressed = contextvars.ContextVar('delivery_log_suppressed', default=False)


@contextlib.contextmanager
def suppressed():
    """Skip automatic logging inside, for callers that keep their own record."""
    token = _suppressed.set(True)
    try:
        yield
    finally:
        _suppressed.reset(token)


def _find_recipient(channel, address):
    from accounts.models import User

    if not address:
        return None
    if channel == 'email':
        return User.objects.filter(email__iexact=address).first()
    digits = ''.join(ch for ch in address if ch.isdigit())[-9:]
    if len(digits) < 9:
        return None
    return User.objects.filter(phone_number__endswith=digits).first()


def log_delivery(*, channel, address, subject='', ok, error=''):
    """
    Record one delivery attempt. Never raises: a logging problem must not
    turn a delivered message into a failed one.
    """
    if _suppressed.get():
        return
    try:
        from .models import Notification

        now = timezone.now()
        Notification.objects.create(
            recipient=_find_recipient(channel, address),
            recipient_address=(address or '')[:254],
            notification_type=DELIVERY_EMAIL if channel == 'email' else DELIVERY_SMS,
            channel=channel,
            subject=(subject or '')[:255],
            message='',
            status='sent' if ok else 'failed',
            sent_at=now if ok else None,
            failed_at=None if ok else now,
            error_message=(str(error)[:1000] if error else None),
        )
    except Exception:  # noqa: BLE001 - see docstring
        logger.exception('Could not record %s delivery to %s', channel, address)
