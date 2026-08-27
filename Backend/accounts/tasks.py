from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import OTPVerification, PasswordResetToken
from .utils import send_branded_email


@shared_task
def send_verification_email(user_id, otp_code, first_name):
    """
    Send email verification OTP
    """
    from .models import User
    try:
        user = User.objects.get(id=user_id)
        subject = 'Verify Your RUMI Account'
        message = f"""
        Hi {first_name},

        Welcome to RUMI! Please verify your email address using this code:

        {otp_code}

        This code will expire in 5 minutes.

        If you didn't create an account, please ignore this email.

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send verification email: {e}")


@shared_task
def send_welcome_email(user_id):
    """
    Send welcome email after verification
    """
    from .models import User
    try:
        user = User.objects.get(id=user_id)
        subject = 'Welcome to RUMI!'
        message = f"""
        Hi {user.first_name},

        Welcome to RUMI! Your account has been successfully verified.

        You can now:
        - Browse and book hostels
        - Connect with other students
        - Access exclusive student deals

        Start exploring: https://rumi.co.ke/dashboard

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send welcome email: {e}")


@shared_task
def send_tenant_invite_email(user_id, reset_token, property_name=''):
    """
    Sent once when a landlord/caretaker adds a tenant to RUMIA — the tenant has
    no password yet, so this reuses the password-reset confirm flow as the
    account setup step rather than building a separate one.
    """
    from .models import User
    try:
        user = User.objects.get(id=user_id)
        setup_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        property_line = f' for {property_name}' if property_name else ''

        subject = 'You have been added to RUMIA'
        message = f"""
        Hi {user.first_name},

        You have been added as a tenant{property_line} on RUMIA.

        Set up your password to log in and view your tenancy, rent balance, and
        payment history:
        {setup_url}

        This link will expire in 24 hours.

        Best regards,
        RUMIA Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except User.DoesNotExist:
        pass


@shared_task
def send_password_reset_email(user_id, reset_token):
    """
    Send password reset email
    """
    from .models import User
    try:
        user = User.objects.get(id=user_id)
        reset_url = f"https://rumi.co.ke/reset-password?token={reset_token}"

        subject = 'Reset Your RUMI Password'
        message = f"""
        Hi {user.first_name},

        You requested a password reset for your RUMI account.

        Click this link to reset your password:
        {reset_url}

        This link will expire in 24 hours.

        If you didn't request this reset, please ignore this email.

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send password reset email: {e}")


@shared_task
def send_caretaker_welcome_email(caretaker_id, temporary_password):
    """
    Send welcome email to new caretaker
    """
    from .models import CaretakerProfile
    try:
        caretaker = CaretakerProfile.objects.select_related('user', 'hostel', 'landlord').get(id=caretaker_id)
        user = caretaker.user
        hostel = caretaker.hostel
        landlord = caretaker.landlord

        subject = 'Welcome to RUMI - Caretaker Account Created'
        message = f"""
        Hi {user.first_name},

        A caretaker account has been created for you on RUMI.

        Hostel: {hostel.name}
        Landlord: {landlord.company_name or landlord.user.get_full_name()}

        Your temporary password: {temporary_password}

        Please log in and change your password immediately:
        https://rumi.co.ke/login

        You will be prompted to verify your email address.

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send caretaker welcome email: {e}")


@shared_task
def send_caretaker_termination_email(caretaker_id, reason):
    """
    Send termination notification to caretaker
    """
    from .models import CaretakerProfile
    try:
        caretaker = CaretakerProfile.objects.select_related('user').get(id=caretaker_id)
        user = caretaker.user

        subject = 'RUMI Caretaker Account Update'
        message = f"""
        Hi {user.first_name},

        This is to inform you that your caretaker employment has ended.

        Reason: {reason}

        Your account access has been deactivated.

        If you believe this is an error, please contact your landlord directly.

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send caretaker termination email: {e}")


@shared_task
def send_account_deactivation_email(user_id, reason):
    """
    Send account deactivation notification
    """
    from .models import User
    try:
        user = User.objects.get(id=user_id)

        subject = 'RUMI Account Deactivated'
        message = f"""
        Hi {user.first_name},

        Your RUMI account has been deactivated.

        Reason: {reason}

        If you believe this is an error, please contact support.

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send deactivation email: {e}")


@shared_task
def send_landlord_verification_email(landlord_id, approved, reason=None):
    """
    Send landlord verification result email
    """
    from .models import LandlordProfile
    try:
        landlord = LandlordProfile.objects.select_related('user').get(id=landlord_id)
        user = landlord.user

        if approved:
            subject = 'RUMI Landlord Account Approved'
            message = f"""
            Hi {user.first_name},

            Congratulations! Your landlord account has been approved.

            You can now:
            - List your hostels on RUMI
            - Manage your properties
            - Receive automated payments

            Start listing: https://rumi.co.ke/dashboard

            Best regards,
            RUMI Team
            """
        else:
            subject = 'RUMI Landlord Application Update'
            message = f"""
            Hi {user.first_name},

            Thank you for your interest in RUMI.

            Unfortunately, we are unable to approve your landlord application at this time.

            Reason: {reason}

            You can reapply after addressing the issues mentioned.

            Best regards,
            RUMI Team
            """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            recipient_name=user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send landlord verification email: {e}")


@shared_task
def cleanup_expired_otps():
    """
    Delete OTP records older than 24 hours
    """
    cutoff_time = timezone.now() - timezone.timedelta(hours=24)

    deleted_count = OTPVerification.objects.filter(
        created_at__lt=cutoff_time
    ).delete()[0]

    return {
        'deleted_otps': deleted_count,
        'cutoff_time': cutoff_time.isoformat()
    }


@shared_task
def cleanup_expired_password_reset_tokens():
    """
    Delete password reset tokens older than 7 days
    """
    cutoff_time = timezone.now() - timezone.timedelta(days=7)

    deleted_count = PasswordResetToken.objects.filter(
        created_at__lt=cutoff_time
    ).delete()[0]

    return {
        'deleted_tokens': deleted_count,
        'cutoff_time': cutoff_time.isoformat()
    }