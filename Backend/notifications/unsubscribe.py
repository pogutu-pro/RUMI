"""One-click unsubscribe for marketing email.

The link carries a signed token so it works without logging in, and never
exposes the user id. Transactional email (receipts, reminders, invites) is
not marketing and is never gated by this.
"""
from django.conf import settings
from django.core import signing

_SALT = 'notifications.marketing-unsubscribe'


def make_unsubscribe_token(user) -> str:
    return signing.dumps({'uid': user.pk}, salt=_SALT)


def read_unsubscribe_token(token: str):
    """Return the user id, or None for a tampered or malformed token."""
    try:
        return signing.loads(token, salt=_SALT)['uid']
    except (signing.BadSignature, KeyError):
        return None


def unsubscribe_url(user) -> str:
    return f"{settings.FRONTEND_URL}/unsubscribe?token={make_unsubscribe_token(user)}"


def unsubscribe_footer(user) -> str:
    return (
        '<hr><p style="font-size:12px;color:#6b7280">'
        "You are receiving this because you opted in to updates from RumiaRent. "
        f'<a href="{unsubscribe_url(user)}">Unsubscribe</a>.</p>'
    )
