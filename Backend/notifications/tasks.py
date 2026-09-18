from celery import shared_task
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from django.template import Template, Context
from accounts.utils import send_branded_email


@shared_task
def send_notification(recipient_id, notification_type, channel, context):
    """
    Send notification via specified channel

    Args:
        recipient_id: User ID
        notification_type: e.g., 'booking_confirmed'
        channel: 'email', 'sms', 'in_app'
        context: dict with template variables
    """
    from accounts.models import User
    from .models import Notification, NotificationPreference, EmailTemplate, SMSTemplate

    try:
        # Get recipient
        recipient = User.objects.get(id=recipient_id)

        # Check user preferences
        try:
            prefs = NotificationPreference.objects.get(user=recipient)
            if not _is_channel_enabled(prefs, channel, notification_type):
                return  # User opted out
        except NotificationPreference.DoesNotExist:
            # Create default preferences
            prefs = NotificationPreference.objects.create(user=recipient)

        # Load template
        subject = None
        message = None

        if channel == 'email':
            try:
                template = EmailTemplate.objects.get(name=notification_type, is_active=True)
                subject = _render_template(template.subject, context)
                message = _render_template(template.html_content, context)
            except EmailTemplate.DoesNotExist:
                print(f"Email template not found: {notification_type}")
                return
        elif channel == 'sms':
            try:
                template = SMSTemplate.objects.get(name=notification_type, is_active=True)
                message = _render_template(template.message, context)
            except SMSTemplate.DoesNotExist:
                print(f"SMS template not found: {notification_type}")
                return
        elif channel == 'in_app':
            # For in-app, we need to create a simple message
            message = _create_in_app_message(notification_type, context)

        # Create notification record
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            channel=channel,
            subject=subject,
            message=message,
            metadata=context,
            status='pending'
        )

        # Send via appropriate service
        try:
            if channel == 'email':
                _send_email_via_mailtrap(recipient.email, subject, message)
            elif channel == 'sms':
                send_sms_via_africastalking(recipient.phone_number, message)
            elif channel == 'in_app':
                # Already stored in DB, no external service needed
                pass

            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save()

        except Exception as e:
            notification.status = 'failed'
            notification.failed_at = timezone.now()
            notification.error_message = str(e)
            notification.save()
            print(f"Failed to send {channel} notification: {e}")

    except Exception as e:
        print(f"Failed to send notification: {e}")


def _is_channel_enabled(preferences, channel, notification_type):
    """
    Check if user has enabled this channel for this notification type
    """
    # Critical notifications always go through
    critical_types = [
        'email_verification', 'password_reset', 'booking_confirmed',
        'payment_receipt', 'account_deactivation'
    ]

    if notification_type in critical_types:
        return True

    # Check channel-specific preferences
    if channel == 'email':
        if notification_type.startswith('marketing_'):
            return preferences.marketing_emails
        return preferences.email_enabled
    elif channel == 'sms':
        return preferences.sms_enabled
    elif channel == 'in_app':
        return True  # In-app notifications are always enabled

    return False


def _render_template(template_string, context):
    """
    Replace {{variable}} with actual values from context dict
    """
    if not template_string:
        return ""

    for key, value in context.items():
        placeholder = f"{{{{{key}}}}}"
        template_string = template_string.replace(placeholder, str(value))
    return template_string


def _create_in_app_message(notification_type, context):
    """
    Create a simple in-app message from notification type and context
    """
    message_templates = {
        'booking_confirmed': "Your booking for {{hostel_name}} has been confirmed!",
        'booking_expired': "Your room reservation at {{hostel_name}} has expired.",
        'product_listed': "Your product '{{product_title}}' has been listed successfully.",
        'contact_reveal': "Someone revealed contact info for your '{{product_title}}' listing.",
        'welcome': "Welcome to RumiaRent! Your account has been verified.",
        'password_reset': "Your password has been reset successfully.",
    }

    template = message_templates.get(notification_type, f"New notification: {notification_type}")
    return _render_template(template, context)


def _send_email_via_mailtrap(recipient, subject, html_content):
    """
    Send email via Mailtrap
    """
    from django.core.mail import EmailMessage

    email = EmailMessage(
        subject=subject,
        body='',  # Plain text fallback
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient]
    )

    email.content_subtype = "html"  # Main content is HTML
    email.body = html_content  # Set HTML as main content

    return email.send(fail_silently=False)


class SMSDeliveryError(Exception):
    """Africa's Talking accepted the HTTP request but refused the recipient."""


# Africa's Talking per-recipient status codes that mean the message was
# taken for delivery. Everything else (401 RiskHold, 403 InvalidPhoneNumber,
# 405 InsufficientBalance, 406 UserInBlacklist, 407 CouldNotRoute, ...) is a
# refusal — the API still answers HTTP 201 for those.
_AT_ACCEPTED_STATUS_CODES = {100, 101, 102}

SMS_COUNTER_KEY = 'sms:monthly_count'


def normalize_kenyan_phone(phone_number):
    """
    Turn the ways a Kenyan number gets stored (0712…, 0101…, 254712…,
    +254 712 …) into E.164 (+254712…). Anything else is returned stripped
    but otherwise untouched, so Africa's Talking rejects it visibly rather
    than us guessing a country.
    """
    cleaned = ''.join(ch for ch in str(phone_number) if ch.isdigit() or ch == '+')
    if cleaned.startswith('+'):
        return cleaned
    if cleaned.startswith('254') and len(cleaned) == 12:
        return '+' + cleaned
    if cleaned.startswith('0') and len(cleaned) == 10:
        return '+254' + cleaned[1:]
    return cleaned


def send_sms_via_africastalking(phone_number, message):
    """
    Send SMS via Africa's Talking, with a monthly ceiling
    (settings.SMS_MONTHLY_LIMIT).

    Raises on any failure — including Africa's Talking answering HTTP 201 but
    refusing the recipient (blacklisted, invalid number, no balance) — so
    callers never record a refused message as sent.

    Public (no leading underscore) so other apps — e.g. the RumiaRent rental
    domain — can call this directly without depending on the DB-template
    notification pipeline below.
    """
    if not phone_number:
        raise ValueError("Phone number required for SMS")
    phone_number = normalize_kenyan_phone(phone_number)

    monthly_count = cache.get(SMS_COUNTER_KEY, 0)
    if monthly_count >= settings.SMS_MONTHLY_LIMIT:
        raise Exception("SMS monthly limit reached")

    if not settings.AFRICASTALKING_API_KEY:
        # No credentials configured (e.g. local dev) — mock instead of failing.
        print(f"MOCK SMS to {phone_number}: {message}")
        cache.add(SMS_COUNTER_KEY, 0, timeout=None)
        cache.incr(SMS_COUNTER_KEY)
        return {"mock": True}

    import africastalking
    africastalking.initialize(
        username=settings.AFRICASTALKING_USERNAME,
        api_key=settings.AFRICASTALKING_API_KEY,
    )
    sms = africastalking.SMS

    response = sms.send(message, [phone_number])

    recipients = (response or {}).get('SMSMessageData', {}).get('Recipients', [])
    refused = [r for r in recipients if r.get('statusCode') not in _AT_ACCEPTED_STATUS_CODES]
    if refused or not recipients:
        detail = ', '.join(f"{r.get('status')} ({r.get('statusCode')})" for r in refused) or 'no recipient result'
        raise SMSDeliveryError(f"Africa's Talking did not accept the message: {detail}")

    cache.add(SMS_COUNTER_KEY, 0, timeout=None)
    cache.incr(SMS_COUNTER_KEY)
    return response


@shared_task
def send_bulk_notification(recipient_ids, notification_type, context):
    """
    Send notification to multiple recipients (marketing campaigns)
    """
    for recipient_id in recipient_ids:
        send_notification.delay(recipient_id, notification_type, 'email', context)
        # Rate limit: ~50/minute
        import time
        time.sleep(1.2)


@shared_task
def cleanup_old_notifications():
    """
    Delete notifications older than 90 days (GDPR compliance)
    """
    from .models import Notification
    cutoff_date = timezone.now() - timezone.timedelta(days=90)

    deleted_count = Notification.objects.filter(
        created_at__lt=cutoff_date
    ).delete()[0]

    print(f"Cleaned up {deleted_count} old notifications")
    return deleted_count


@shared_task
def reset_sms_monthly_counter():
    """
    Reset SMS counter on the 1st of each month
    """
    cache.set('sms:monthly_count', 0)
    print("Reset SMS monthly counter")
    return True


@shared_task
def retry_failed_notifications():
    """
    Retry failed notifications (up to 3 attempts)
    """
    from .models import Notification
    from datetime import timedelta

    # Get failed notifications from last 24 hours
    cutoff_time = timezone.now() - timedelta(hours=24)
    failed_notifications = Notification.objects.filter(
        status='failed',
        created_at__gte=cutoff_time
    )

    retried_count = 0
    for notification in failed_notifications:
        # Simple retry logic - could be enhanced
        if notification.error_message and 'rate limit' in notification.error_message.lower():
            # Wait longer for rate limit errors
            continue

        # Reset status and retry
        notification.status = 'pending'
        notification.save()
        retried_count += 1

    print(f"Queued {retried_count} failed notifications for retry")
    return retried_count


@shared_task
def send_notification_digest():
    """
    Send daily digest of unread notifications to users who haven't logged in recently
    """
    from accounts.models import User
    from .models import Notification
    from datetime import timedelta

    # Users who haven't logged in for 3+ days
    inactive_users = User.objects.filter(
        last_login__lt=timezone.now() - timedelta(days=3),
        is_active=True
    )

    digest_count = 0
    for user in inactive_users:
        # Get unread notifications from last 7 days
        unread_notifications = Notification.objects.filter(
            recipient=user,
            channel='in_app',
            read_at__isnull=True,
            created_at__gte=timezone.now() - timedelta(days=7)
        )

        if unread_notifications.count() >= 5:  # Only send if 5+ unread
            context = {
                'first_name': user.first_name,
                'unread_count': unread_notifications.count(),
                'login_url': 'https://rumi.co.ke/login'
            }

            send_notification.delay(
                user.id,
                'notification_digest',
                'email',
                context
            )
            digest_count += 1

    print(f"Sent notification digests to {digest_count} inactive users")
    return digest_count