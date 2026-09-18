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


def create_branded_email_html(subject, plain_message, recipient_name=None):
    """
    Convert plain text email to branded HTML email with RUMI branding
    """
    # Split message into paragraphs
    paragraphs = [p.strip() for p in plain_message.split('\n\n') if p.strip()]

    # Convert plain text to HTML paragraphs
    html_content = ""
    for paragraph in paragraphs:
        # Handle line breaks within paragraphs
        paragraph = paragraph.replace('\n', '<br>')
        html_content += f"<p>{paragraph}</p>"

    # Branded HTML template
    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                background-color: #f8f9fa;
                padding: 20px;
            }}
            .email-container {{
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
            }}
            .logo {{
                max-width: 150px;
                height: auto;
                margin-bottom: 10px;
            }}
            .brand-name {{
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                letter-spacing: 2px;
            }}
            .content {{
                padding: 30px;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #667eea;
                margin-bottom: 20px;
            }}
            .message {{
                margin-bottom: 30px;
            }}
            .message p {{
                margin-bottom: 15px;
                font-size: 16px;
            }}
            .cta-button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                margin: 20px 0;
                transition: transform 0.2s;
            }}
            .cta-button:hover {{
                transform: translateY(-2px);
            }}
            .footer {{
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }}
            .footer-content {{
                color: #6c757d;
                font-size: 14px;
            }}
            .footer-links {{
                margin: 15px 0;
            }}
            .footer-links a {{
                color: #667eea;
                text-decoration: none;
                margin: 0 10px;
            }}
            .contact-info {{
                margin-top: 15px;
                font-size: 13px;
            }}
            .social-links {{
                margin-top: 15px;
            }}
            .social-links a {{
                display: inline-block;
                margin: 0 5px;
                color: #667eea;
                text-decoration: none;
                font-size: 18px;
            }}
            @media (max-width: 600px) {{
                body {{
                    padding: 10px;
                }}
                .content {{
                    padding: 20px;
                }}
                .header {{
                    padding: 20px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <img src="https://rumi.co.ke/static/images/logo.png" alt="RUMI Logo" class="logo">
                <h1 class="brand-name">RUMI</h1>
                <p>Connecting Students with Quality Accommodation</p>
            </div>

            <div class="content">
                {"<div class='greeting'>Hi " + recipient_name + ",</div>" if recipient_name else ""}
                <div class="message">
                    {html_content}
                </div>
            </div>

            <div class="footer">
                <div class="footer-content">
                    <div class="footer-links">
                        <a href="https://rumi.co.ke">Visit Website</a> |
                        <a href="https://rumi.co.ke/dashboard">Dashboard</a> |
                        <a href="https://rumi.co.ke/support">Support</a>
                    </div>

                    <div class="contact-info">
                        <strong>RUMI Platform</strong><br>
                        Email: info@rumiarent.co.ke | Phone: +254 700 000 000<br>
                        Nairobi, Kenya
                    </div>

                    <div class="social-links">
                        <a href="#"> Facebook</a>
                        <a href="#"> Twitter</a>
                        <a href="#"> Instagram</a>
                        <a href="#"> LinkedIn</a>
                    </div>

                    <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                        This email was sent to you because you are a valued member of the RUMI community.<br>
                        © 2025 RUMI. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    return html_template


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

    html_message = create_branded_email_html(subject, message, recipient_name)

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