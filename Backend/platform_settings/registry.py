"""
The settings a super admin may manage from the dashboard.

An explicit allow-list: anything not listed here (SECRET_KEY, database
credentials, allowed hosts, ...) can never be read or written through the
API, whatever a request contains.
"""

from dataclasses import dataclass, field
from typing import Callable, Optional


class SettingError(ValueError):
    """A submitted value is not acceptable for its setting."""


@dataclass(frozen=True)
class Spec:
    key: str
    label: str
    group: str
    help: str = ''
    secret: bool = False
    kind: str = 'str'  # str | int | bool | choice
    choices: tuple = ()
    placeholder: str = ''
    prefixes: tuple = ()  # accepted starts, for keys with a known format
    min_value: Optional[int] = None
    max_value: Optional[int] = None


GROUPS = {
    'paystack': ('Paystack', 'Rent collection and landlord subscriptions.'),
    'sms': ("Africa's Talking (SMS)", 'Rent reminders and other text messages.'),
    'email': ('Email (SMTP)', 'Verification codes, receipts, invitations and reminders.'),
}

SPECS = [
    Spec('PAYSTACK_SECRET_KEY', 'Secret key', 'paystack', secret=True, prefixes=('sk_test_', 'sk_live_'),
         placeholder='sk_live_...', help='From Paystack: Settings > API Keys & Webhooks.'),
    Spec('PAYSTACK_PUBLIC_KEY', 'Public key', 'paystack', prefixes=('pk_test_', 'pk_live_'),
         placeholder='pk_live_...'),
    Spec('PAYSTACK_WEBHOOK_SECRET', 'Webhook secret', 'paystack', secret=True,
         help='Paystack signs its webhooks with your secret key; use the same value unless Paystack shows a separate one.'),
    Spec('PAYSTACK_ENV', 'Mode', 'paystack', kind='choice', choices=('test', 'live'),
         help='Must match the keys: sk_test_ keys need test, sk_live_ keys need live.'),
    Spec('AFRICASTALKING_USERNAME', 'Username', 'sms', placeholder='rumiarent',
         help='The app username in Africa\'s Talking. Use "sandbox" only for testing.'),
    Spec('AFRICASTALKING_API_KEY', 'API key', 'sms', secret=True),
    Spec('SMS_MONTHLY_LIMIT', 'Monthly SMS limit', 'sms', kind='int', min_value=0, max_value=1_000_000,
         help='Sending stops for the month once this many texts are sent, to protect your balance.'),
    Spec('EMAIL_HOST', 'SMTP host', 'email', placeholder='live.smtp.mailtrap.io'),
    Spec('EMAIL_PORT', 'SMTP port', 'email', kind='int', min_value=1, max_value=65535, placeholder='587'),
    Spec('EMAIL_HOST_USER', 'SMTP username', 'email'),
    Spec('EMAIL_HOST_PASSWORD', 'SMTP password or API token', 'email', secret=True),
    Spec('EMAIL_USE_TLS', 'Use TLS', 'email', kind='bool'),
    Spec('DEFAULT_FROM_EMAIL', 'Sender address', 'email', placeholder='noreply@rumiarent.com',
         help='Must belong to a domain verified with your email provider.'),
]

BY_KEY = {spec.key: spec for spec in SPECS}


def parse(spec: Spec, raw) -> object:
    """Validate `raw` for `spec` and return the typed value. Raises SettingError."""
    if raw is None:
        raise SettingError('A value is required.')
    if spec.kind == 'bool':
        if isinstance(raw, bool):
            return raw
        text = str(raw).strip().lower()
        if text in ('true', '1', 'yes', 'on'):
            return True
        if text in ('false', '0', 'no', 'off'):
            return False
        raise SettingError('Choose on or off.')

    text = str(raw).strip()
    if not text:
        raise SettingError('A value is required.')
    if len(text) > 500 or '\n' in text or '\r' in text:
        raise SettingError('That does not look like a valid value.')

    if spec.kind == 'int':
        try:
            number = int(text)
        except ValueError:
            raise SettingError('Enter a whole number.')
        if spec.min_value is not None and number < spec.min_value:
            raise SettingError(f'Must be at least {spec.min_value}.')
        if spec.max_value is not None and number > spec.max_value:
            raise SettingError(f'Must be at most {spec.max_value}.')
        return number

    if spec.kind == 'choice':
        if text not in spec.choices:
            raise SettingError(f'Choose one of: {", ".join(spec.choices)}.')
        return text

    if spec.prefixes and not text.startswith(spec.prefixes):
        raise SettingError(f'This should start with {" or ".join(spec.prefixes)}.')
    return text
