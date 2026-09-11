from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from accounts.utils import send_branded_email


@shared_task
def send_inquiry_confirmation_email(inquiry_id, reference_number):
    """
    Send confirmation email to inquirer
    """
    from .models import ContactInquiry
    try:
        inquiry = ContactInquiry.objects.get(id=inquiry_id)

        subject = f'RumiaRent Contact Inquiry Received - {reference_number}'
        message = f"""
        Hi {inquiry.full_name},

        Thank you for contacting RumiaRent! We have received your inquiry and will respond within 24 hours.

        Inquiry Details:
        Reference Number: {reference_number}
        Subject: {inquiry.subject}
        Type: {inquiry.inquiry_type.replace('_', ' ').title()}

        Your Message:
        {inquiry.message}

        We typically respond within 24 hours during business days.
        For urgent matters, please call us at +254 700 000 000.

        Best regards,
        RumiaRent Support Team
        info@rumiarent.com
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[inquiry.email],
            recipient_name=inquiry.full_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send inquiry confirmation email: {e}")


@shared_task
def notify_admin_new_inquiry(inquiry_id):
    """
    Notify admin team of new inquiry
    """
    from .models import ContactInquiry
    try:
        inquiry = ContactInquiry.objects.get(id=inquiry_id)

        subject = f'New Contact Inquiry - {inquiry.inquiry_type.replace("_", " ").title()}'
        message = f"""
        New contact inquiry received:

        From: {inquiry.full_name} ({inquiry.email})
        Phone: {inquiry.phone_number or 'Not provided'}
        Type: {inquiry.inquiry_type.replace('_', ' ').title()}
        Subject: {inquiry.subject}

        Message:
        {inquiry.message}

        IP Address: {inquiry.ip_address}
        Submitted: {inquiry.created_at}

        Please respond within 24 hours.

        Admin Panel: https://rumi.co.ke/admin/home/contactinquiry/{inquiry.id}/change/
        """

        # Send to admin email
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@rumiarent.com')
        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            recipient_name="Admin",
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to notify admin of new inquiry: {e}")


@shared_task
def send_newsletter_verification_email(subscription_id, verification_token):
    """
    Send newsletter verification email
    """
    from .models import Newsletter
    try:
        subscription = Newsletter.objects.get(id=subscription_id)

        verification_link = f"https://rumi.co.ke/newsletter/verify?token={verification_token}"

        subject = 'Verify Your RumiaRent Newsletter Subscription'
        message = f"""
        Hi {subscription.full_name or 'there'},

        Thank you for subscribing to the RumiaRent newsletter!

        Please verify your email address by clicking the link below:
        {verification_link}

        This link will expire in 7 days.

        If you didn't subscribe to our newsletter, please ignore this email.

        Stay updated with:
        - New hostel listings near your university
        - Student accommodation tips
        - Platform updates and features
        - Exclusive student deals

        Best regards,
        RumiaRent Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[subscription.email],
            recipient_name=subscription.full_name or "there",
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send newsletter verification email: {e}")


@shared_task
def cleanup_unverified_newsletters():
    """
    Delete unverified newsletter subscriptions after 7 days
    """
    from .models import Newsletter
    from datetime import timedelta

    try:
        cutoff_date = timezone.now() - timedelta(days=7)

        deleted_count = Newsletter.objects.filter(
            is_verified=False,
            subscribed_at__lt=cutoff_date
        ).delete()[0]

        return {
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat()
        }
    except Exception as e:
        print(f"Failed to cleanup unverified newsletters: {e}")
        return {'error': str(e)}


@shared_task
def send_newsletter_campaign(campaign_id):
    """
    Send newsletter campaign to subscribers
    """
    # This would be implemented for bulk newsletter sending
    # For now, just a placeholder
    return {'campaign_id': campaign_id, 'status': 'completed'}