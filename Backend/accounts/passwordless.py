"""
Passwordless sign-in: a one-time email link (with a 6-digit code in the same
email) and "Continue with Google".

Both prove the person controls the email address, so both sign in an existing
account or, for an unknown address, create a landlord account (tenants and
caretakers are added by their landlord and already have accounts). Platform
staff keep password sign-in only: a compromised mailbox must not be enough to
reach the admin side.
"""
from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from .models import EmailSignInLink, LandlordProfile, User, UserActivityLog
from .utils import is_disposable_email, send_branded_email

LINK_TTL = timedelta(minutes=15)
MAX_CODE_ATTEMPTS = 5
# Per address: one email a minute, ten an hour. Per IP: thirty an hour.
EMAIL_COOLDOWN_SECONDS = 60
EMAIL_HOURLY_LIMIT = 10
IP_HOURLY_LIMIT = 30
STAFF_ROLES = {'super_admin', 'tech_support'}

GOOGLE_ISSUERS = {'accounts.google.com', 'https://accounts.google.com'}
GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs'


class SignInError(Exception):
    """A sign-in that must be refused; `code` is what the frontend switches on."""

    def __init__(self, code: str, detail: str, status: int = 400):
        # Never 401: the frontend API client treats 401 as an expired session.
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.status = status


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _code_hash(link_token_hash: str, code: str) -> str:
    # Salted with the link so equal codes on different links hash differently.
    return _hash(f'{link_token_hash}:{code}')


def client_ip(request) -> str | None:
    # Behind Caddy the last X-Forwarded-For entry is the one our proxy added;
    # earlier entries are whatever the client sent and can be forged.
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[-1].strip() or None
    return request.META.get('REMOTE_ADDR')


def _find_user(email: str) -> User | None:
    return User.objects.filter(email__iexact=email).first()


def _check_allowed(user: User | None) -> None:
    if user is None:
        return
    if not user.is_active:
        raise SignInError('account_inactive', 'This account is turned off. Contact support.', 403)
    if user.role in STAFF_ROLES:
        raise SignInError('password_required', 'Staff accounts sign in with a password.', 403)


# -- Email link ---------------------------------------------------------------

@dataclass
class LinkRequest:
    sent: bool
    retry_after: int = 0


def _throttled(email: str, ip: str | None) -> int:
    """Seconds to wait before another email may go out, or 0."""
    cooldown_key = f'signin_link:cooldown:{email}'
    if cache.get(cooldown_key):
        return EMAIL_COOLDOWN_SECONDS
    for key, limit in ((f'signin_link:hour:{email}', EMAIL_HOURLY_LIMIT), (f'signin_link:ip:{ip}', IP_HOURLY_LIMIT)):
        if cache.get(key, 0) >= limit:
            return 3600
    return 0


def _count_request(email: str, ip: str | None) -> None:
    cache.set(f'signin_link:cooldown:{email}', 1, EMAIL_COOLDOWN_SECONDS)
    for key in (f'signin_link:hour:{email}', f'signin_link:ip:{ip}'):
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, 3600)


def request_link(email: str, request, next_path: str = '') -> LinkRequest:
    """
    Email a sign-in link and code. The answer is the same whether or not the
    address has an account, so this cannot be used to find out who is a
    customer; a refused address (staff, deactivated) simply gets no email.
    """
    email = email.strip().lower()
    ip = client_ip(request)
    wait = _throttled(email, ip)
    if wait:
        return LinkRequest(sent=False, retry_after=wait)
    _count_request(email, ip)

    user = _find_user(email)
    try:
        _check_allowed(user)
    except SignInError:
        return LinkRequest(sent=True)
    if user is None and is_disposable_email(email):
        return LinkRequest(sent=True)

    token = secrets.token_urlsafe(32)
    code = f'{secrets.randbelow(10**6):06d}'
    token_hash = _hash(token)
    now = timezone.now()
    # A new link replaces any earlier one, so only the latest email works.
    EmailSignInLink.objects.filter(email=email, used_at__isnull=True).update(used_at=now)
    EmailSignInLink.objects.create(
        email=email, user=user, token_hash=token_hash, code_hash=_code_hash(token_hash, code),
        expires_at=now + LINK_TTL, ip_address=ip,
    )

    query = {'token': token}
    if next_path:
        query['next'] = next_path
    url = f'{settings.FRONTEND_URL}/auth/link?{urlencode(query)}'
    _send_link_email(email, user, url, code)
    return LinkRequest(sent=True)


def _send_link_email(email: str, user: User | None, url: str, code: str) -> None:
    minutes = int(LINK_TTL.total_seconds() // 60)
    if user is not None:
        subject = f'Sign in to RumiaRent ({code})'
        message = (
            'Tap the button below to sign in to RumiaRent.\n\n'
            f'The link and code work once and expire in {minutes} minutes. '
            'If you did not ask to sign in, you can ignore this email; nobody can sign in without it.'
        )
        label = 'Sign in to RumiaRent'
    else:
        subject = f'Finish creating your RumiaRent account ({code})'
        message = (
            'Tap the button below to finish creating your RumiaRent account.\n\n'
            f'The link and code work once and expire in {minutes} minutes. '
            'If you did not ask for an account, you can ignore this email.'
        )
        label = 'Create my account'
    send_branded_email(
        subject=subject, message=message, from_email=settings.DEFAULT_FROM_EMAIL, recipient_list=[email],
        recipient_name=(user.first_name if user else None) or None, action=(label, url), code=code,
        fail_silently=True,
    )


def _active_link_by_token(token: str) -> EmailSignInLink:
    link = EmailSignInLink.objects.select_for_update().filter(token_hash=_hash(token)).first()
    if link is None or link.used_at is not None or link.expires_at <= timezone.now():
        raise SignInError('link_invalid', 'This link has expired or was already used. Ask for a new one.', 400)
    return link


def use_token(token: str, request) -> tuple[User, bool]:
    with transaction.atomic():
        link = _active_link_by_token(token)
        return _finish(link, request, method='email_link')


def use_code(email: str, code: str, request) -> tuple[User, bool]:
    email = email.strip().lower()
    code = ''.join(ch for ch in code if ch.isdigit())
    with transaction.atomic():
        link = (
            EmailSignInLink.objects.select_for_update()
            .filter(email=email, used_at__isnull=True, expires_at__gt=timezone.now())
            .order_by('-created_at').first()
        )
        if link is None:
            raise SignInError('code_invalid', 'That code has expired. Ask for a new one.', 400)
        if link.attempts >= MAX_CODE_ATTEMPTS:
            raise SignInError('code_locked', 'Too many wrong codes. Ask for a new email.', 429)
        if secrets.compare_digest(link.code_hash, _code_hash(link.token_hash, code)):
            return _finish(link, request, method='email_code')
        # Saved before raising: an exception inside the block would roll it back.
        link.attempts += 1
        link.save(update_fields=['attempts'])
    raise SignInError('code_invalid', 'That code is not right. Check the latest email.', 400)


def _finish(link: EmailSignInLink, request, method: str) -> tuple[User, bool]:
    link.used_at = timezone.now()
    link.save(update_fields=['used_at'])
    return sign_in_or_create(link.email, request, method=method)


# -- Google -------------------------------------------------------------------

_jwk_client = None


def _google_keys():
    global _jwk_client
    if _jwk_client is None:
        from jwt import PyJWKClient
        _jwk_client = PyJWKClient(GOOGLE_CERTS_URL, cache_keys=True, lifespan=3600)
    return _jwk_client


def verify_google_credential(credential: str) -> dict:
    """
    Check a Google Identity Services ID token: Google's signature, issued for
    our client ID, not expired, and an address Google has verified.
    """
    import jwt

    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    if not client_id:
        raise SignInError('google_disabled', 'Google sign-in is not set up yet.', 404)
    try:
        key = _google_keys().get_signing_key_from_jwt(credential)
        claims = jwt.decode(
            credential, key.key, algorithms=['RS256'], audience=client_id,
            options={'require': ['exp', 'iat', 'iss', 'aud', 'email']}, leeway=30,
        )
    except Exception:  # noqa: BLE001 - any failure means the token is not usable
        raise SignInError('google_invalid', 'Google sign-in failed. Try again.', 400)
    if claims.get('iss') not in GOOGLE_ISSUERS or claims.get('email_verified') not in (True, 'true'):
        raise SignInError('google_invalid', 'Google sign-in failed. Try again.', 400)
    return claims


def google_sign_in(credential: str, request) -> tuple[User, bool]:
    claims = verify_google_credential(credential)
    return sign_in_or_create(
        claims['email'].strip().lower(), request, method='google',
        first_name=claims.get('given_name', ''), last_name=claims.get('family_name', ''),
        picture=claims.get('picture'),
    )


# -- Shared -------------------------------------------------------------------

def sign_in_or_create(email: str, request, method: str, first_name: str = '', last_name: str = '',
                      picture: str | None = None) -> tuple[User, bool]:
    """The address is proven: sign its owner in, or create a landlord account."""
    user = _find_user(email)
    _check_allowed(user)
    created = user is None
    if created:
        if is_disposable_email(email):
            raise SignInError('email_not_allowed', 'Use a permanent email address.', 400)
        user = User.objects.create_user(
            email=email, password=None, role='landlord', first_name=first_name, last_name=last_name,
            is_verified=True, profile_picture=picture or None,
        )
        LandlordProfile.objects.create(user=user, total_units=0)
    else:
        fields = ['last_login']
        if not user.is_verified:
            user.is_verified = True  # they just proved the address
            fields.append('is_verified')
        if picture and not user.profile_picture:
            user.profile_picture = picture
            fields.append('profile_picture')
        user.last_login = timezone.now()
        user.save(update_fields=fields)

    UserActivityLog.objects.create(
        user=user, action_type='register' if created else 'login',
        action_description=f'Signed {"up" if created else "in"} with {method.replace("_", " ")}',
        ip_address=client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''),
        metadata={'auth_method': method},
    )
    return user, created
