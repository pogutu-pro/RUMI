"""
In-app notifications (the bell). One helper, called from the places where
something a user should know about actually happens.

Never raises: a notification problem must not fail the request that caused it.
"""

import logging

from django.utils import timezone

logger = logging.getLogger(__name__)

_ROOTS = {
    'tenant': '/tenant/rental',
    'caretaker': '/caretaker/rental',
    'landlord': '/landlord/rental',
    'super_admin': '/platform',
    'tech_support': '/tech-support',
    'tech_support_admin': '/tech-support',
}


def role_url(user, section: str) -> str:
    """Where `section` ('messages', 'support', 'rent') lives for this user's role."""
    role = getattr(user, 'role', '')
    root = _ROOTS.get(role)
    if root is None:
        return ''
    if role in ('tech_support', 'tech_support_admin'):
        if section == 'support':
            return '/tech-support/dashboard'
        if section == 'messages':
            return '/tech-support/dashboard/messages'
    if section == 'rent' and role == 'tenant':
        return root
    if section == 'rent' and role in ('super_admin', 'tech_support', 'tech_support_admin'):
        return ''
    return f'{root}/{section}'


def notify_in_app(user, *, notification_type, subject, message='', url='', dedupe_key=None):
    """
    Add a bell notification for `user`.

    With `dedupe_key`, an unread notification with the same key is refreshed
    in place instead of stacking up (a busy chat should be one bell entry, not
    twenty).
    """
    if user is None:
        return None
    try:
        from .models import Notification

        metadata = {'url': url}
        if dedupe_key:
            metadata['dedupe_key'] = dedupe_key
            existing = Notification.objects.filter(
                recipient=user, channel='in_app', read_at__isnull=True,
                metadata__dedupe_key=dedupe_key,
            ).first()
            if existing:
                count = int((existing.metadata or {}).get('count', 1)) + 1
                existing.subject = subject
                existing.message = message
                existing.metadata = {**metadata, 'count': count}
                existing.created_at = timezone.now()
                existing.save(update_fields=['subject', 'message', 'metadata', 'created_at'])
                return existing

        return Notification.objects.create(
            recipient=user,
            recipient_address=(getattr(user, 'email', '') or '')[:254],
            notification_type=notification_type,
            channel='in_app',
            subject=subject[:255],
            message=message,
            metadata=metadata,
            status='sent',
            sent_at=timezone.now(),
        )
    except Exception:  # noqa: BLE001 - see module docstring
        logger.exception('Could not create in-app notification for user %s', getattr(user, 'id', None))
        return None


def display_name(user) -> str:
    return (user.get_full_name() or '').strip() or user.email
