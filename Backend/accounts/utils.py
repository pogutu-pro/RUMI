import re
import secrets
import string
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.utils import timezone
from user_agents import parse as parse_user_agent


def generate_6_digit_otp():
    """Generate a 6-digit OTP"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))


def generate_strong_password(length=12):
    """Generate a strong random password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))


def validate_password_strength(password):
    """
    Enforce strong password requirements
    """
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")

    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")

    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")

    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")

    # Check against common passwords
    common_passwords = [
        'password', '12345678', 'qwerty123', 'password123',
        'admin123', 'letmein', 'welcome', 'monkey123'
    ]
    if password.lower() in common_passwords:
        errors.append("Password is too common")

    if errors:
        raise ValidationError(errors)

    return True


def is_disposable_email(email):
    """
    Check if email is from a disposable email provider
    """
    domain = email.split('@')[1].lower()
    disposable_domains = [
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'mailinator.com', 'throwaway.email', 'temp-mail.org',
        'fakeinbox.com', 'sharklasers.com', 'getnada.com'
    ]
    return domain in disposable_domains


def check_login_rate_limit(email):
    """
    Check if user has exceeded login attempts
    """
    cache_key = f"login_attempts:{email}"
    attempts = cache.get(cache_key, 0)

    if attempts >= 5:
        return True  # Rate limited

    return False


def log_failed_login_attempt(email, ip_address):
    """
    Increment failed login counter
    """
    cache_key = f"login_attempts:{email}"
    attempts = cache.get(cache_key, 0)
    cache.set(cache_key, attempts + 1, timeout=900)  # 15-minute timeout


def reset_login_rate_limit(email):
    """
    Reset counter after successful login
    """
    cache_key = f"login_attempts:{email}"
    cache.delete(cache_key)


PASSWORD_RESET_COOLDOWN_SECONDS = 60


def check_password_reset_cooldown(email):
    """
    Return the remaining cooldown in seconds if a password reset was
    recently requested for this email (0 if not rate limited). Applied
    unconditionally to both existing and non-existing emails by the caller,
    so the cooldown itself never leaks whether an account exists — without
    this, a user could spam-click "resend" indefinitely and email-bomb any
    address.
    """
    cache_key = f"password_reset_cooldown:{email}"
    expires_at = cache.get(cache_key)
    if expires_at is None:
        return 0
    remaining = expires_at - timezone.now().timestamp()
    return max(0, int(remaining))


def set_password_reset_cooldown(email):
    """Start the cooldown window for this email's next reset request."""
    cache_key = f"password_reset_cooldown:{email}"
    expires_at = timezone.now().timestamp() + PASSWORD_RESET_COOLDOWN_SECONDS
    cache.set(cache_key, expires_at, timeout=PASSWORD_RESET_COOLDOWN_SECONDS)


def check_otp_rate_limit(email):
    """
    Limit OTP requests to 3 per 15 minutes
    """
    cache_key = f"otp_requests:{email}"
    requests = cache.get(cache_key, 0)

    if requests >= 3:
        return True  # Rate limited

    cache.set(cache_key, requests + 1, timeout=900)
    return False


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def detect_device_type(user_agent_string):
    """
    Detect device type from user agent
    """
    if not user_agent_string:
        return 'unknown'

    try:
        user_agent = parse_user_agent(user_agent_string)
        if user_agent.is_mobile:
            return 'mobile'
        elif user_agent.is_tablet:
            return 'tablet'
        elif user_agent.is_pc:
            return 'desktop'
        else:
            return 'unknown'
    except:
        return 'unknown'


def detect_browser(user_agent_string):
    """
    Detect browser from user agent
    """
    if not user_agent_string:
        return 'unknown'

    try:
        user_agent = parse_user_agent(user_agent_string)
        return user_agent.browser.family
    except:
        return 'unknown'


def create_paystack_subaccount(landlord):
    """
    Create Paystack subaccount for landlord payouts
    """
    # This would integrate with Paystack API
    # For now, return mock data
    import uuid
    return {
        'subaccount_code': f"ACCT_{uuid.uuid4().hex[:12].upper()}",
        'business_name': landlord.company_name or landlord.user.get_full_name(),
        'account_number': landlord.bank_account_number,
        'bank_code': landlord.bank_code
    }


BRAND_GREEN = '#027F53'
BRAND_SITE = 'https://rumiarent.com'
BRAND_LOGO_URL = f'{BRAND_SITE}/images/logo/logo.png'
_URL_RE = re.compile(r'(https?://[^\s<]+)')


def create_branded_email_html(subject, plain_message, recipient_name=None, action=None, code=None):
    """
    Wrap a plain-text message in the RumiaRent email layout.

    Inline styles and tables on purpose: Gmail and Outlook strip or mangle
    <style> blocks, and gradients/transforms don't render reliably in mail
    clients. All user-supplied text is HTML-escaped; bare URLs become links.

    `action` is an optional (label, url) button and `code` an optional
    one-time code shown large; both go after the first paragraph.
    """
    import html as html_lib
    from django.utils import timezone

    def render_paragraph(text):
        escaped = html_lib.escape(text).replace('\n', '<br>')
        linked = _URL_RE.sub(
            lambda m: f'<a href="{m.group(1)}" style="color:{BRAND_GREEN};word-break:break-all;">{m.group(1)}</a>',
            escaped,
        )
        return (
            f'<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#1f2937;">{linked}</p>'
        )

    paragraphs = [p.strip() for p in plain_message.split('\n\n') if p.strip()]
    rendered = [render_paragraph(p) for p in paragraphs]
    extras = ''
    if action:
        label, url = action
        extras += (
            f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;"><tr>'
            f'<td style="border-radius:10px;background-color:{BRAND_GREEN};">'
            f'<a href="{html_lib.escape(url, quote=True)}" style="display:inline-block;padding:14px 28px;'
            f'font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">{html_lib.escape(label)}</a>'
            f'</td></tr></table>'
        )
    if code:
        extras += (
            f'<p style="margin:0 0 6px 0;font-size:14px;color:#6b7280;">Or enter this code:</p>'
            f'<p style="margin:0 0 24px 0;font-size:32px;font-weight:700;letter-spacing:8px;'
            f'font-family:SFMono-Regular,Menlo,Consolas,monospace;color:#111827;">{html_lib.escape(code)}</p>'
        )
    if extras:
        rendered.insert(1 if rendered else 0, extras)
    body_html = ''.join(rendered)

    # Most message bodies already open with their own "Hi <name>," — adding a
    # second one from the wrapper printed the greeting twice.
    already_greeted = bool(paragraphs) and paragraphs[0].lower().startswith(
        ('hi ', 'hi,', 'hello', 'dear ', 'hey ')
    )

    greeting = ''
    if recipient_name and not already_greeted:
        greeting = (
            f'<p style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#111827;">'
            f'Hi {html_lib.escape(recipient_name)},</p>'
        )

    year = timezone.now().year
    title = html_lib.escape(subject)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr><td style="height:4px;background-color:{BRAND_GREEN};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:28px 32px 20px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <img src="{BRAND_LOGO_URL}" alt="RumiaRent" width="44" height="48" style="display:block;border:0;height:48px;width:auto;">
          </td>
          <td style="vertical-align:middle;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.2px;">RumiaRent</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:8px 32px 28px 32px;">
        {greeting}{body_html}
      </td></tr>
      <tr><td style="padding:20px 32px 28px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 6px 0;font-size:14px;font-weight:600;color:#111827;">RumiaRent</p>
        <p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#6b7280;">Rental management for Kenyan landlords and agents.</p>
        <p style="margin:0 0 14px 0;font-size:13px;color:#6b7280;">
          <a href="{BRAND_SITE}" style="color:{BRAND_GREEN};text-decoration:none;">rumiarent.com</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:info@rumiarent.com" style="color:{BRAND_GREEN};text-decoration:none;">info@rumiarent.com</a>
        </p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">You are receiving this email because of activity on your RumiaRent account. &copy; {year} RumiaRent. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def send_branded_email(subject, message, from_email, recipient_list, recipient_name=None, **kwargs):
    """
    Send branded HTML email using Django's EmailMessage
    """
    from django.core.mail import EmailMessage

    # fail_silently is an argument to .send(), not to EmailMessage() — passing
    # it through **kwargs into the constructor raised TypeError on every call,
    # so no branded email (verification code, password reset, ...) was ever
    # actually sent.
    fail_silently = kwargs.pop('fail_silently', False)

    html_message = create_branded_email_html(
        subject, message, recipient_name, action=kwargs.pop('action', None), code=kwargs.pop('code', None),
    )

    email = EmailMessage(
        subject=subject,
        body=message,  # Plain text fallback
        from_email=from_email,
        to=recipient_list,
        **kwargs
    )

    email.content_subtype = "html"  # Main content is HTML
    email.body = html_message  # Set HTML as main content

    return email.send(fail_silently=fail_silently)