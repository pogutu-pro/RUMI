"""
Runtime overrides for the dashboard-managed settings.

Values live encrypted in the database and are applied onto `django.conf.settings`
so every existing `settings.X` read (Paystack provider, Africa's Talking sender,
SMTP backend, ...) picks them up without changes. Web workers and Celery workers
are separate processes, so a version stamp in the shared cache tells each one
when to reload: a change made in the dashboard reaches all of them within a
request or task, with no restart.
"""

import base64
import hashlib
import logging
import threading
import time

from django.conf import settings
from django.core.cache import cache

from .registry import BY_KEY, SPECS, SettingError, parse

logger = logging.getLogger(__name__)

VERSION_KEY = 'platform_settings:version'
_MISSING = object()

_lock = threading.Lock()
_originals = {}          # key -> value from the environment file, captured before the first override
_applied_version = None  # version this process last applied
_last_check = 0.0
_CHECK_EVERY_SECONDS = 2.0  # at most one cache read per process per couple of seconds


# --- encryption -------------------------------------------------------------

def _fernet():
    from cryptography.fernet import Fernet

    configured = getattr(settings, 'SETTINGS_ENCRYPTION_KEY', '') or ''
    if configured:
        key = configured.encode()
    else:
        digest = hashlib.sha256(f'platform-settings:{settings.SECRET_KEY}'.encode()).digest()
        key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt(value) -> str:
    return _fernet().encrypt(str(value).encode()).decode()


def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


# --- reading ----------------------------------------------------------------

def stored_values() -> dict:
    """{key: typed value} for every readable dashboard override."""
    from .models import PlatformSetting

    values = {}
    for row in PlatformSetting.objects.filter(key__in=BY_KEY):
        spec = BY_KEY[row.key]
        try:
            values[row.key] = parse(spec, decrypt(row.encrypted_value))
        except Exception:  # noqa: BLE001 - a bad row must never take the site down
            logger.error('Platform setting %s could not be read; using the server file value', row.key)
    return values


def unreadable_keys() -> set:
    from .models import PlatformSetting

    readable = set(stored_values())
    return set(PlatformSetting.objects.filter(key__in=BY_KEY).values_list('key', flat=True)) - readable


def env_value(key):
    """The value from the server's environment file, ignoring any dashboard override."""
    with _lock:
        if key in _originals:
            original = _originals[key]
        else:
            original = getattr(settings, key, _MISSING)
    return None if original is _MISSING else original


# --- applying ---------------------------------------------------------------

def apply_overrides() -> None:
    """Make `settings` reflect the database: overrides on, removed overrides back to the env value."""
    global _applied_version
    values = stored_values()
    with _lock:
        for spec in SPECS:
            if spec.key not in _originals:
                _originals[spec.key] = getattr(settings, spec.key, _MISSING)
            if spec.key in values:
                setattr(settings, spec.key, values[spec.key])
            elif _originals[spec.key] is _MISSING:
                if hasattr(settings, spec.key):
                    delattr(settings, spec.key)
            else:
                setattr(settings, spec.key, _originals[spec.key])
        _applied_version = cache.get(VERSION_KEY)


def bump_version() -> None:
    """Tell every process that the settings changed."""
    cache.set(VERSION_KEY, f'{time.time():.6f}', timeout=None)


def ensure_fresh() -> None:
    """Cheap per-request / per-task check; reloads only when another process changed something."""
    global _last_check
    now = time.monotonic()
    if now - _last_check < _CHECK_EVERY_SECONDS and _applied_version is not None:
        return
    _last_check = now

    try:
        version = cache.get(VERSION_KEY)
        if version is None:
            # Cache was flushed or never set: start a fresh version and load once.
            bump_version()
            version = cache.get(VERSION_KEY)
        if version != _applied_version:
            apply_overrides()
    except Exception:  # noqa: BLE001 - never break a request over this
        logger.exception('Could not refresh platform settings')


# --- writing ----------------------------------------------------------------

def set_value(key: str, raw, user=None):
    """Validate, encrypt and store `raw`, then apply it everywhere. Raises SettingError."""
    from .models import PlatformSetting

    spec = BY_KEY.get(key)
    if spec is None:
        raise SettingError('Unknown setting.')
    value = parse(spec, raw)
    PlatformSetting.objects.update_or_create(
        key=key, defaults={'encrypted_value': encrypt(value), 'updated_by': user},
    )
    bump_version()
    apply_overrides()
    return value


def clear_value(key: str) -> bool:
    """Remove a dashboard override so the server file value applies again."""
    from .models import PlatformSetting

    if key not in BY_KEY:
        raise SettingError('Unknown setting.')
    deleted, _ = PlatformSetting.objects.filter(key=key).delete()
    bump_version()
    apply_overrides()
    return bool(deleted)


def describe(spec) -> dict:
    """What the dashboard may show about a setting. Secrets never leave the server."""
    overrides = stored_values()
    unreadable = unreadable_keys()
    if spec.key in overrides:
        source, current = 'dashboard', overrides[spec.key]
    else:
        current = env_value(spec.key)
        source = 'server' if current not in (None, '') else 'not_set'
    configured = current not in (None, '')

    shown = None
    hint = ''
    if configured:
        if spec.secret:
            text = str(current)
            hint = f'••••{text[-4:]}' if len(text) >= 12 else '••••'
        else:
            shown = current
    return {
        'key': spec.key,
        'label': spec.label,
        'group': spec.group,
        'help': spec.help,
        'secret': spec.secret,
        'kind': spec.kind,
        'choices': list(spec.choices),
        'placeholder': spec.placeholder,
        'configured': configured,
        'source': source,
        'value': shown,
        'hint': hint,
        'unreadable': spec.key in unreadable,
    }


# --- step-up password gate ---------------------------------------------------

UNLOCK_TTL_SECONDS = 600
MAX_UNLOCK_FAILURES = 5
FAILURE_WINDOW_SECONDS = 900


def _unlock_key(user) -> str:
    return f'platform_settings:unlocked:{user.id}'


def _failure_key(user) -> str:
    return f'platform_settings:unlock_failures:{user.id}'


def unlock(user) -> None:
    """Mark this admin as having just proved their password, for a limited time."""
    cache.set(_unlock_key(user), time.time() + UNLOCK_TTL_SECONDS, timeout=UNLOCK_TTL_SECONDS)
    cache.delete(_failure_key(user))


def lock(user) -> None:
    cache.delete(_unlock_key(user))


def unlocked_seconds_left(user) -> int:
    expires = cache.get(_unlock_key(user))
    if not expires:
        return 0
    return max(int(expires - time.time()), 0)


def is_unlocked(user) -> bool:
    return unlocked_seconds_left(user) > 0


def too_many_failures(user) -> bool:
    return (cache.get(_failure_key(user)) or 0) >= MAX_UNLOCK_FAILURES


def record_failure(user) -> int:
    count = (cache.get(_failure_key(user)) or 0) + 1
    cache.set(_failure_key(user), count, timeout=FAILURE_WINDOW_SECONDS)
    return count

