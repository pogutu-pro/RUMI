import uuid
import re
import requests
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.core.files.storage import default_storage
from django.db import transaction, models
from django.db.models import Sum
from django.utils import timezone
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed, ValidationError as DRFValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema

from . import passwordless
from .models import (
    User, LandlordProfile, CaretakerProfile,
    OTPVerification, PasswordResetToken, UserActivityLog,
    Conversation, Message
)



from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, BasicUserProfileSerializer, 
    FullUserProfileSerializer, PublicUserProfileSerializer,
    CaretakerCreateSerializer, CaretakerUpdateSerializer, UserActivityLogSerializer,
    LandlordVerificationSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, OTPVerificationSerializer,
    ConversationSerializer, MessageSerializer, SendMessageSerializer
)
from .permissions import (
    IsStudent, IsLandlord, IsCaretaker, IsTechSupportAdmin, IsSuperAdmin,
    IsAdminOrSuperAdmin, IsVerifiedLandlord, HasCaretakerPermission
)
from .utils import (
    generate_6_digit_otp, generate_strong_password, validate_password_strength,
    is_disposable_email, check_login_rate_limit, log_failed_login_attempt,
    reset_login_rate_limit, check_otp_rate_limit, get_client_ip,
    detect_device_type, detect_browser, create_paystack_subaccount,
    check_password_reset_cooldown, set_password_reset_cooldown,
    PASSWORD_RESET_COOLDOWN_SECONDS,
)


@swagger_auto_schema(
    tags=['Authentication']
)
class UserRegistrationView(APIView):
    """
    User Registration API
    
    Handle user registration with role-based profile creation.
    
    POST: Register new user with role-specific profile creation
    
    Authentication Required: None (Public endpoint)
    
    This endpoint allows new landlords to self-register. Tenants are invited
    by their landlord (see tenants/services.py) and never self-register.
    
    Features:
    - Automatic OTP generation for email verification
    - Role-specific profile creation
    - Email validation and disposable email checking
    - Rate limiting and security measures
    - Async email sending (verification and welcome)
    - Activity logging for audit trail
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Register New User
        
        Create a new user account with role-specific profile.
        
        Required Fields:
        - email: Unique email address (validated for disposable emails)
        - password: Strong password (minimum requirements enforced)
        - first_name: User's first name
        - last_name: User's last name
        - role: User role (only 'landlord' is accepted for self-registration)
        
        Optional Fields:
        - phone_number: Contact phone number
        
        Returns user ID, email, role, and verification instructions.
        Automatically generates and sends verification OTP via email.
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Extract validated data
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        role = serializer.validated_data['role']
        first_name = serializer.validated_data['first_name']
        last_name = serializer.validated_data['last_name']
        phone_number = serializer.validated_data.get('phone_number')

        # Check disposable email
        if is_disposable_email(email):
            return Response({
                'error': 'Disposable email addresses not allowed'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number,
                    role=role,
                    gender=serializer.validated_data.get('gender'),
                    date_of_birth=serializer.validated_data.get('date_of_birth')
                )

                # Create role-specific profile
                if role == 'landlord':
                    LandlordProfile.objects.create(
                        user=user,
                        company_name=serializer.validated_data.get('company_name'),
                        total_units=serializer.validated_data.get('total_units', 0)
                    )

                # Generate OTP
                otp = OTPVerification.objects.create(
                    user=user,
                    otp_code=generate_6_digit_otp(),
                    verification_type='email',
                    expires_at=timezone.now() + timezone.timedelta(minutes=5),
                    ip_address=get_client_ip(request)
                )

                # Try to send verification email (async) - don't fail registration if email fails
                try:
                    from .tasks import send_verification_email
                    send_verification_email.delay(
                        user_id=user.id,
                        otp_code=otp.otp_code,
                        first_name=first_name
                    )
                    verification_sent = True
                except Exception as email_error:
                    print(f"Email sending failed: {email_error}")
                    verification_sent = False

                # Log activity
                UserActivityLog.objects.create(
                    user=user,
                    action_type='register',
                    action_description=f"User registered with role: {role}",
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )

                return Response({
                    'user_id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'message': 'Registration successful. Please verify your email.',
                    'verification_sent': verification_sent,
                    'otp_expires_in_seconds': 300,
                    'next_step': 'verify_email'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Registration failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['Authentication']
)
class EmailVerificationView(APIView):
    """
    Email Verification API
    
    Handle email verification with OTP (One-Time Password).
    
    POST: Verify email address using OTP code
    
    Authentication Required: None (Public endpoint)
    
    This endpoint verifies user email addresses using the OTP sent during registration.
    Features OTP validation, attempt limiting, and automatic token generation upon success.
    
    Security Features:
    - OTP expiration (5 minutes)
    - Maximum attempt limiting (5 attempts)
    - Rate limiting protection
    - Automatic token blacklisting on failure
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Verify Email Address
        
        Verify email address using OTP code sent during registration.
        
        Required Fields:
        - email: Email address used during registration
        - otp_code: 6-digit verification code
        
        On successful verification:
        - Marks user as verified
        - Generates JWT access and refresh tokens
        - Sends welcome email
        - Logs verification activity
        
        Returns authentication tokens and user verification status.
        """
        serializer = OTPVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp_code']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Find active OTP
        otp = OTPVerification.objects.filter(
            user=user,
            verification_type='email',
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp:
            return Response({
                'error': 'OTP expired or invalid'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check attempts
        if otp.attempts >= 5:
            return Response({
                'error': 'Maximum verification attempts exceeded'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Verify OTP
        if otp.otp_code != otp_code:
            otp.attempts += 1
            otp.save()
            return Response({
                'error': 'Invalid OTP code'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update user and OTP
        with transaction.atomic():
            user.is_verified = True
            user.save()

            otp.is_used = True
            otp.used_at = timezone.now()
            otp.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Send welcome email (async)
            from .tasks import send_welcome_email
            send_welcome_email.delay(user_id=user.id)

            # Log activity
            UserActivityLog.objects.create(
                user=user,
                action_type='verification',
                action_description="Email verified successfully",
                ip_address=get_client_ip(request)
            )

            return Response({
                'message': 'Email verified successfully',
                'user_id': user.id,
                'is_verified': True,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': 3600,
                'next_step': 'complete_profile'
            }, status=status.HTTP_200_OK)


def issue_email_otp(user, request, verification_type='email'):
    """
    Create a fresh 5-minute OTP for `user` and email it (async).

    Shared by the resend endpoint and by the login gate, so a user turned
    away for an unverified email is sent a live code straight away instead of
    having to find the resend button first.
    """
    otp = OTPVerification.objects.create(
        user=user,
        otp_code=generate_6_digit_otp(),
        verification_type=verification_type,
        expires_at=timezone.now() + timezone.timedelta(minutes=5),
        ip_address=get_client_ip(request),
    )
    from .tasks import send_verification_email
    send_verification_email.delay(
        user_id=user.id,
        otp_code=otp.otp_code,
        first_name=user.first_name,
    )
    return otp


@swagger_auto_schema(
    tags=['Authentication']
)
class ResendOTPView(APIView):
    """Resend verification OTP"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        verification_type = request.data.get('verification_type', 'email')

        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Rate limiting
        if check_otp_rate_limit(email):
            return Response({
                'error': 'Too many OTP requests. Please try again in 15 minutes.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response({
                'message': 'OTP sent successfully',
                'expires_in_seconds': 300
            }, status=status.HTTP_200_OK)

        issue_email_otp(user, request, verification_type)

        return Response({
            'message': 'OTP sent successfully',
            'expires_in_seconds': 300
        }, status=status.HTTP_200_OK)


AUTH_COOKIES = ('rumi_access_token', 'rumi_refresh_token', 'rumi_user_role', 'rumi_onboarding_stage')


def set_auth_cookies(response, access_token, refresh_token=None, role=None):
    """
    The session cookies, each living exactly as long as its token, so the
    browser drops an expired access token instead of the site treating a
    dead session as signed in.

    Lax, not Strict: Strict withholds the cookies when Paystack or Google
    redirects the browser back to us, which sent tenants to /login right
    after paying. Lax still refuses them on cross-site POST/PUT/DELETE, so
    CSRF protection is unaffected. Secure everywhere except local DEBUG.
    """
    jwt = settings.SIMPLE_JWT
    common = {'path': '/', 'domain': None, 'secure': not settings.DEBUG, 'samesite': 'Lax'}
    response.set_cookie(
        'rumi_access_token', access_token, httponly=True,
        max_age=int(jwt['ACCESS_TOKEN_LIFETIME'].total_seconds()), **common,
    )
    refresh_age = int(jwt['REFRESH_TOKEN_LIFETIME'].total_seconds())
    if refresh_token:
        response.set_cookie('rumi_refresh_token', refresh_token, httponly=True, max_age=refresh_age, **common)
    if role:
        # Readable by the frontend, which needs the role.
        response.set_cookie('rumi_user_role', role, httponly=False, max_age=refresh_age, **common)


def clear_auth_cookies(response):
    # path/domain/samesite must match set_auth_cookies or the browser keeps them.
    for name in AUTH_COOKIES:
        response.delete_cookie(name, path='/', domain=None, samesite='Lax')


def session_response(user, access_token, refresh_token, extra=None):
    """
    The signed-in response every sign-in method returns: tokens, the user's
    profile and the auth cookies the frontend middleware reads.
    """
    profile_data = UserLoginView()._get_user_profile_data(user)

    response = Response({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'user': profile_data,
        **(extra or {}),
    }, status=status.HTTP_200_OK)

    set_auth_cookies(response, access_token, refresh_token, role=user.role)
    return response


@swagger_auto_schema(
    tags=['Authentication']
)
class UserLoginView(APIView):
    """
    User Authentication API
    
    Handle user authentication and JWT token generation.
    
    POST: Authenticate user and generate JWT tokens
    
    Authentication Required: None (Public endpoint)
    
    This endpoint authenticates users using email and password, then generates
    JWT tokens for API access. Includes comprehensive security features and
    user profile data in response.
    
    Security Features:
    - Login attempt rate limiting
    - Failed login attempt tracking
    - Device and browser detection
    - Automatic token blacklisting
    - Secure cookie setting for frontend
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Authenticate User
        
        Authenticate user with email and password, then generate JWT tokens.
        
        Required Fields:
        - email: Registered email address
        - password: User password
        
        On successful authentication:
        - Generates access and refresh tokens
        - Sets secure HTTP-only cookies
        - Updates last login timestamp
        - Logs successful login with device info
        - Returns user profile data based on role
        
        Returns JWT tokens, user profile, and authentication status.
        """
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Rate limiting check
        if check_login_rate_limit(email):
            return Response({
                'error': 'Too many failed login attempts. Please try again in 15 minutes.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Authenticate user
        user = authenticate(email=email, password=password)

        if not user:
            log_failed_login_attempt(email, get_client_ip(request))
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check if active
        if not user.is_active:
            UserActivityLog.objects.create(
                user=user,
                action_type='failed_login',
                action_description="Login attempt on deactivated account",
                ip_address=get_client_ip(request)
            )
            return Response({
                'error': 'Account deactivated'
            }, status=status.HTTP_403_FORBIDDEN)

        # The password was right, so revealing that this address still needs
        # verifying leaks nothing. Send a fresh code (unless the resend rate
        # limit is hit) so the verify screen the frontend opens next is usable.
        if not user.is_verified:
            if not check_otp_rate_limit(email):
                issue_email_otp(user, request)
            return Response({
                'error': 'email_not_verified',
                'detail': 'Please verify your email address to sign in.',
                'email': user.email,
            }, status=status.HTTP_403_FORBIDDEN)

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # Reset rate limit
        reset_login_rate_limit(email)

        # Log successful login
        UserActivityLog.objects.create(
            user=user,
            action_type='login',
            action_description="User logged in successfully",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            metadata={
                'device_type': detect_device_type(request.META.get('HTTP_USER_AGENT')),
                'browser': detect_browser(request.META.get('HTTP_USER_AGENT'))
            }
        )

        return session_response(user, access_token, refresh_token)

    def _get_user_profile_data(self, user):
        """Get user profile data based on role"""
        base_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_verified': user.is_verified,
            'phone_number': user.phone_number,
            'profile_picture': user.profile_picture,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            # Required by the frontend post-login redirect flow: middleware
            # (frontend/src/middleware.ts) only lets an authenticated user
            # past its onboarding guard once rumi_onboarding_stage='COMPLETED',
            # and that cookie is only ever set from this field. Omitting it
            # here sends every fresh login into a permanent /onboarding loop
            # regardless of the account's actual onboarding_stage in the DB.
            'onboarding_stage': user.onboarding_stage,
            'capabilities': user.capabilities,
        }

        if user.role == 'student':
            try:
                profile = user.student_profile
                base_data['profile_complete'] = profile.is_profile_complete
            except:
                base_data['profile_complete'] = False
        elif user.role == 'landlord':
            try:
                profile = user.landlord_profile
                base_data['can_list_hostels'] = profile.is_verified
            except:
                base_data['can_list_hostels'] = False

        return base_data


@swagger_auto_schema(
    tags=['Authentication']
)
class TokenRefreshView(APIView):
    """
    A new access token from the refresh token. The browser cannot read the
    httpOnly refresh cookie, so it is taken from the cookie when the body has
    none. Rotation and blacklisting follow SIMPLE_JWT. A refresh that fails
    clears the session cookies, so the site stops treating a dead session as
    signed in.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer

        refresh_token = request.data.get('refresh_token') or request.COOKIES.get('rumi_refresh_token')
        if not refresh_token:
            response = Response({'error': 'Refresh token is required'}, status=status.HTTP_401_UNAUTHORIZED)
            clear_auth_cookies(response)
            return response

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken, AuthenticationFailed, DRFValidationError):
            response = Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
            clear_auth_cookies(response)
            return response

        access_token = serializer.validated_data['access']
        new_refresh = serializer.validated_data.get('refresh')
        response = Response({
            'access_token': access_token,
            'refresh_token': new_refresh or refresh_token,
            'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
        }, status=status.HTTP_200_OK)
        set_auth_cookies(response, access_token, new_refresh)
        return response


@swagger_auto_schema(
    tags=['Authentication']
)
class UserLogoutView(APIView):
    """
    Sign out. Works with an expired session too: its job is to clear the
    httpOnly cookies, which only the server can remove.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token') or request.COOKIES.get('rumi_refresh_token')

        if refresh_token:
            # Blacklist refresh token
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except:
                pass

        if request.user.is_authenticated:
            UserActivityLog.objects.create(
                user=request.user,
                action_type='logout',
                action_description="User logged out",
                ip_address=get_client_ip(request)
            )

        response = Response({
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)

        clear_auth_cookies(response)

        return response


@swagger_auto_schema(
    tags=['Authentication']
)
class PasswordResetRequestView(APIView):
    """Request password reset"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        # Checked before anything else, on the raw email — a user spamming
        # "resend" (or a script hitting this endpoint directly) had no limit
        # at all before this: every click queued a fresh Celery email task.
        remaining = check_password_reset_cooldown(email)
        if remaining > 0:
            return Response({
                'error': 'Please wait before requesting another reset link.',
                'retry_after_seconds': remaining,
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Always return success (security best practice)
        try:
            user = User.objects.get(email=email)
            # Generate reset token
            token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timezone.timedelta(hours=24),
                ip_address=get_client_ip(request)
            )

            # Send reset email (async)
            from .tasks import send_password_reset_email
            send_password_reset_email.delay(
                user_id=user.id,
                reset_token=str(token.token)
            )

            # Log activity
            UserActivityLog.objects.create(
                user=user,
                action_type='password_reset',
                action_description="Password reset requested",
                ip_address=get_client_ip(request)
            )

        except User.DoesNotExist:
            pass  # Don't reveal if user exists

        # Set unconditionally (existing-user and non-existing-user branches
        # alike) so the cooldown itself never becomes a side channel that
        # reveals whether the email has an account.
        set_password_reset_cooldown(email)

        return Response({
            'message': 'Password reset link sent to your email',
            'expires_in_hours': 24,
            'retry_after_seconds': PASSWORD_RESET_COOLDOWN_SECONDS,
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Authentication']
)
class PasswordResetVerifyView(APIView):
    """Verify reset token validity"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token_str = request.data.get('token')

        if not token_str:
            return Response({
                'error': 'Token is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = PasswordResetToken.objects.get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Token has expired or is invalid'
            }, status=status.HTTP_400_BAD_REQUEST)

        if token.is_used or token.is_expired():
            return Response({
                'valid': False,
                'error': 'Token has expired or is invalid'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'email': token.user.email,
            'expires_at': token.expires_at
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Authentication']
)
class PasswordResetConfirmView(APIView):
    """Confirm password reset"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        token_str = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            token = PasswordResetToken.objects.get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)

        if token.is_used or token.is_expired():
            return Response({
                'error': 'Token has expired or already used'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = token.user

        # Update password
        user.set_password(new_password)
        # The reset/invite link was delivered to this address, so using it
        # proves ownership. Invited tenants and caretakers are created
        # unverified and would otherwise be locked out by the login gate.
        user.is_verified = True
        user.save()

        # Mark token as used
        token.is_used = True
        token.used_at = timezone.now()
        token.save()

        # Invalidate all refresh tokens
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        OutstandingToken.objects.filter(user=user).delete()

        # Log activity
        UserActivityLog.objects.create(
            user=user,
            action_type='password_reset',
            action_description="Password reset successfully",
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'Password reset successfully',
            'user_id': user.id,
            'next_step': 'login'
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['User Management']
)
class UserProfileView(APIView):
    """
    User Profile Management API
    
    Get and update authenticated user's profile information.
    
    GET: Retrieve user's profile information
    PUT: Update user's profile data
    
    Authentication Required: JWT Token
    Permissions: Authenticated user (any role)
    
    This endpoint allows users to view and update their profile information.
    Includes basic user details and role-specific profile data.
    
    Profile Completion:
    - Automatically calculates profile completion percentage
    - Tracks missing required fields
    - Updates activity logs on changes
    """

    def get(self, request):
        """
        Get User Profile
        
        Retrieve the authenticated user's profile information.
        
        Returns comprehensive user profile including:
        - Basic user information (name, email, phone)
        - Role-specific profile data
        - Profile completion status
        - Verification status
        - Account creation and login timestamps
        
        Caretakers: Include assigned hostel information
        """
        user = request.user
        serializer = FullUserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Update User Profile"""
        user = request.user
        serializer = FullUserProfileSerializer(user, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            serializer.save()

            # Log activity
            UserActivityLog.objects.create(
                user=user,
                action_type='profile_update',
                action_description="Profile updated",
                ip_address=get_client_ip(request)
            )

            return Response({
                'message': 'Profile updated successfully',
                'user': serializer.data,
                'profile_complete': self._is_profile_complete(user)
            }, status=status.HTTP_200_OK)

    def patch(self, request):
        """Partial Update User Profile"""
        return self.put(request)

    def _is_profile_complete(self, user):
        """Check if user profile is complete"""
        if user.role == 'student':
            try:
                profile = user.student_profile
                return profile.is_profile_complete
            except:
                return False
        return True


@swagger_auto_schema(
    tags=['User Management']
)
class ProfilePictureUploadView(APIView):
    """Upload profile picture"""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if file_obj.content_type not in allowed_types:
            return Response({
                'error': 'Invalid file type. Only JPEG and PNG allowed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (5MB max)
        if file_obj.size > 5 * 1024 * 1024:
            return Response({
                'error': 'File too large. Maximum size is 5MB.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate filename
        file_extension = file_obj.name.split('.')[-1]
        filename = f"profiles/{user.id}_{timezone.now().timestamp()}.{file_extension}"

        # Upload to storage
        try:
            # Delete old picture if exists
            if user.profile_picture:
                # Extract filename from URL
                old_filename = user.profile_picture.split('/')[-1]
                default_storage.delete(f"profiles/{old_filename}")

            # Save new file
            default_storage.save(filename, file_obj)
            file_url = default_storage.url(filename)

            # Update user
            user.profile_picture = file_url
            user.save()

            # Log activity
            UserActivityLog.objects.create(
                user=user,
                action_type='profile_update',
                action_description="Profile picture uploaded",
                ip_address=get_client_ip(request)
            )

            return Response({
                'message': 'Profile picture uploaded successfully',
                'profile_picture_url': file_url
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Upload failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['User Management']
)
class ProfileCompletionView(APIView):
    """Get detailed profile completion information"""

    def get(self, request):
        """Get profile completion status and details"""
        user = request.user
        
        if user.role != 'student':
            return Response({
                'error': 'Profile completion endpoint is only available for students'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            student_profile = user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Define required fields for completion
        required_fields = [
            ('university', student_profile.university, 'University'),
            ('student_id_number', student_profile.student_id_number, 'Student ID Number'),
            ('year_of_study', student_profile.year_of_study, 'Year of Study'),
            ('course', student_profile.course, 'Course/Program'),
            ('phone_number', user.phone_number, 'Phone Number'),
            ('emergency_contact_name', student_profile.emergency_contact_name, 'Emergency Contact Name'),
            ('emergency_contact_phone', student_profile.emergency_contact_phone, 'Emergency Contact Phone'),
        ]

        completed_fields = []
        missing_fields = []
        completion_percentage = 0

        for field_name, field_value, display_name in required_fields:
            if field_value:
                completed_fields.append({
                    'field': field_name,
                    'label': display_name,
                    'completed': True,
                    'value': str(field_value)
                })
            else:
                missing_fields.append({
                    'field': field_name,
                    'label': display_name,
                    'completed': False,
                    'required': True
                })

        completion_percentage = int((len(completed_fields) / len(required_fields)) * 100)

        return Response({
            'completion_percentage': completion_percentage,
            'is_complete': student_profile.is_profile_complete,
            'completed_fields': completed_fields,
            'missing_fields': missing_fields,
            'total_required_fields': len(required_fields),
            'completed_count': len(completed_fields),
            'missing_count': len(missing_fields),
            'next_steps': [
                field['label'] for field in missing_fields
            ] if missing_fields else []
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['User Management']
)
class CaretakerDetailView(APIView):
    """Update and delete caretakers"""

    permission_classes = [IsLandlord]

    def put(self, request, caretaker_id):
        """Update caretaker profile"""
        landlord = request.user.landlord_profile

        try:
            caretaker = CaretakerProfile.objects.select_related('user').get(
                id=caretaker_id,
                landlord=landlord
            )
        except CaretakerProfile.DoesNotExist:
            return Response({
                'error': 'Caretaker not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = CaretakerUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        # Update caretaker
        for field, value in validated_data.items():
            if hasattr(caretaker, field):
                setattr(caretaker, field, value)
            elif hasattr(caretaker.user, field):
                setattr(caretaker.user, field, value)

        caretaker.save()
        caretaker.user.save()

        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            action_type='caretaker_updated',
            action_description=f"Updated caretaker {caretaker.user.get_full_name()}",
            metadata={'caretaker_id': caretaker.id},
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'Caretaker profile updated successfully',
            'caretaker_id': caretaker.id
        }, status=status.HTTP_200_OK)

    def delete(self, request, caretaker_id):
        """Terminate caretaker employment"""
        landlord = request.user.landlord_profile

        try:
            caretaker = CaretakerProfile.objects.select_related('user').get(
                id=caretaker_id,
                landlord=landlord
            )
        except CaretakerProfile.DoesNotExist:
            return Response({
                'error': 'Caretaker not found'
            }, status=status.HTTP_404_NOT_FOUND)

        end_date = request.data.get('employment_end_date')
        reason = request.data.get('reason', 'Terminated by landlord')

        with transaction.atomic():
            # Update caretaker
            caretaker.is_active = False
            caretaker.employment_end_date = end_date
            caretaker.save()

            # Deactivate user
            caretaker.user.is_active = False
            caretaker.user.save()

            # Send termination email (async)
            from .tasks import send_caretaker_termination_email
            send_caretaker_termination_email.delay(
                caretaker_id=caretaker.id,
                reason=reason
            )

            # Log activity
            UserActivityLog.objects.create(
                user=request.user,
                action_type='caretaker_terminated',
                action_description=f"Terminated caretaker {caretaker.user.get_full_name()}",
                metadata={
                    'caretaker_id': caretaker.id,
                    'reason': reason
                },
                ip_address=get_client_ip(request)
            )

            return Response({
                'message': 'Caretaker employment terminated',
                'caretaker_id': caretaker.id,
                'employment_end_date': end_date,
                'is_active': False
            }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Admin']
)
class UserManagementView(APIView):
    """
    User Management API
    
    Administrative user management with filtering and search capabilities.
    
    GET: List users with advanced filtering and search
    
    Authentication Required: JWT Token
    Permissions: Admin or Super Admin only
    
    This endpoint provides administrators with comprehensive user management
    capabilities including filtering, searching, and user oversight.
    
    Features:
    - Role-based filtering (student, landlord, caretaker, etc.)
    - Verification status filtering
    - Active status filtering
    - Text search across name and email
    - Pagination support
    - Activity tracking integration
    """

    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        """
        List Users
        
        Retrieve users with advanced filtering and search capabilities.
        
        Query Parameters:
        - role: Filter by user role (student, landlord, caretaker, tech_support, super_admin)
        - is_verified: Filter by verification status (true/false)
        - is_active: Filter by account status (true/false)
        - search: Text search in name and email fields
        - limit: Number of results per page (default: 20)
        - offset: Pagination offset (default: 0)
        
        Returns comprehensive user list including:
        
        User Information:
        - user_id: Unique user identifier
        - email: User email address
        - full_name: Complete user name
        - role: User role type
        - is_verified: Email verification status
        - is_active: Account status
        - date_joined: Registration date
        - last_login: Last login timestamp
        
        Additional Data:
        - total_users: Total count matching filters
        - filters_applied: Summary of applied filters
        - pagination_info: Results pagination details
        
        Note: Only accessible by admin and super admin users.
        """
        queryset = User.objects.select_related(
            'student_profile', 'landlord_profile', 'caretaker_profile'
        ).all()

        # Apply filters
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        is_verified = request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_users = queryset.count()
        users = queryset[offset:offset + limit]

        data = []
        for user in users:
            data.append({
                'user_id': user.id,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}",
                'role': user.role,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'last_login': user.last_login
            })

        return Response({
            'total_users': total_users,
            'filters_applied': {
                'role': role,
                'is_verified': is_verified,
                'is_active': is_active,
                'search': search
            },
            'users': data
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Admin']
)
class UserDeactivateView(APIView):
    """Deactivate user account"""

    permission_classes = [IsAdminOrSuperAdmin]

    def put(self, request, user_id):
        """Deactivate user"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Deactivated by admin')
        notify_user = request.data.get('notify_user', True)

        with transaction.atomic():
            user.is_active = False
            user.save()

            # Invalidate refresh tokens
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            OutstandingToken.objects.filter(user=user).delete()

            if notify_user:
                # Send deactivation email (async)
                from .tasks import send_account_deactivation_email
                send_account_deactivation_email.delay(
                    user_id=user.id,
                    reason=reason
                )

            # Log activity
            UserActivityLog.objects.create(
                user=request.user,
                action_type='account_deactivation',
                action_description=f"Deactivated user {user.email}",
                metadata={
                    'target_user_id': user.id,
                    'reason': reason
                },
                ip_address=get_client_ip(request)
            )

            return Response({
                'message': 'User account deactivated',
                'user_id': user.id,
                'is_active': False
            }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Admin']
)
class UserReactivateView(APIView):
    """Reactivate user account"""

    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        """Reactivate user"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        user.is_active = True
        user.save()

        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            action_type='account_reactivation',
            action_description=f"Reactivated user {user.email}",
            metadata={'target_user_id': user.id},
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'User account reactivated',
            'user_id': user.id,
            'is_active': True
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Admin']
)
class UserActivityLogView(APIView):
    """View user's activity history"""

    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request, user_id):
        """Get user activity log"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Filters
        action_type = request.query_params.get('action_type')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))

        queryset = UserActivityLog.objects.filter(user=user)

        if action_type:
            queryset = queryset.filter(action_type=action_type)

        total_activities = queryset.count()
        activities = queryset.order_by('-created_at')[offset:offset + limit]

        serializer = UserActivityLogSerializer(activities, many=True)

        return Response({
            'total_activities': total_activities,
            'activities': serializer.data
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Admin']
)
class LandlordVerificationListView(APIView):
    """List landlords awaiting verification"""

    permission_classes = [IsTechSupportAdmin]

    def get(self, request):
        """List pending landlords"""
        landlords = LandlordProfile.objects.filter(
            is_verified=False
        ).select_related('user').order_by('created_at')

        data = []
        for landlord in landlords:
            data.append({
                'landlord_id': landlord.id,
                'user_id': landlord.user.id,
                'email': landlord.user.email,
                'company_name': landlord.company_name,
                'phone_number': landlord.user.phone_number,
                'national_id': landlord.national_id,
                'kra_pin': landlord.kra_pin,
                'verification_documents': landlord.verification_documents,
                'submitted_at': landlord.created_at
            })

        return Response({
            'total_pending': len(data),
            'landlords': data
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Admin']
)
class LandlordVerificationView(APIView):
    """Verify or reject landlord applications"""

    permission_classes = [IsTechSupportAdmin]

    def post(self, request, landlord_id, action):
        """Verify or reject landlord"""
        try:
            landlord = LandlordProfile.objects.select_related('user').get(id=landlord_id)
        except LandlordProfile.DoesNotExist:
            return Response({
                'error': 'Landlord not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if action == 'verify':
            return self._verify_landlord(landlord, request)
        elif action == 'reject':
            return self._reject_landlord(landlord, request)
        else:
            return Response({
                'error': 'Invalid action'
            }, status=status.HTTP_400_BAD_REQUEST)

    def _verify_landlord(self, landlord, request):
        """Approve landlord verification"""
        admin_notes = request.data.get('admin_notes', '')

        try:
            with transaction.atomic():
                landlord.is_verified = True
                landlord.verified_at = timezone.now()
                landlord.verified_by = request.user
                landlord.save()

                # Create Paystack subaccount
                try:
                    subaccount = create_paystack_subaccount(landlord)
                    landlord.paystack_subaccount_code = subaccount['subaccount_code']
                    landlord.save()
                except Exception as e:
                    # Log error but don't fail verification
                    print(f"Paystack subaccount creation failed: {e}")

                # Send approval email (async)
                from .tasks import send_landlord_verification_email
                send_landlord_verification_email.delay(
                    landlord_id=landlord.id,
                    approved=True
                )

                # Log activity
                UserActivityLog.objects.create(
                    user=request.user,
                    action_type='landlord_verified',
                    action_description=f"Verified landlord: {landlord.user.email}",
                    metadata={'landlord_id': landlord.id},
                    ip_address=get_client_ip(request)
                )

                return Response({
                    'message': 'Landlord verified successfully',
                    'landlord_id': landlord.id,
                    'is_verified': True,
                    'can_list_hostels': True,
                    'paystack_subaccount_created': bool(landlord.paystack_subaccount_code),
                    'subaccount_code': landlord.paystack_subaccount_code
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Verification failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _reject_landlord(self, landlord, request):
        """Reject landlord verification"""
        rejection_reason = request.data.get('rejection_reason', 'Documents incomplete')

        # Send rejection email (async)
        from .tasks import send_landlord_verification_email
        send_landlord_verification_email.delay(
            landlord_id=landlord.id,
            approved=False,
            reason=rejection_reason
        )

        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            action_type='landlord_rejected',
            action_description=f"Rejected landlord: {landlord.user.email}",
            metadata={
                'landlord_id': landlord.id,
                'reason': rejection_reason
            },
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'Landlord verification rejected',
            'landlord_id': landlord.id,
            'reason_sent': True
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Messaging']
)
class ConversationListView(APIView):
    """
    Conversation List API
    
    Retrieve all chat conversations for the authenticated user.
    
    GET: List all active conversations with message previews
    
    Authentication Required: JWT Token
    Permissions: Authenticated user (any role)
    
    This endpoint provides users with a list of all their active chat conversations,
    including message previews and participant information.
    
    Features:
    - Real-time conversation updates
    - Message preview with last message content
    - Unread message counting
    - Participant information display
    - Conversation status tracking
    """

    def get(self, request):
        """
        Get User Conversations
        
        Retrieve all active chat conversations for the authenticated user.
        
        Returns conversation list including:
        - conversation_id: Unique conversation identifier
        - participants: List of conversation participants with basic info
        - last_message: Most recent message with timestamp
        - unread_count: Number of unread messages in conversation
        - updated_at: Last activity timestamp
        - is_active: Conversation status
        
        Conversations are ordered by most recent activity (updated_at).
        Only active conversations are included in the response.
        """
        conversations = Conversation.objects.filter(
            participants=request.user,
            is_active=True
        ).prefetch_related('participants', 'messages').order_by('-updated_at')

        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response({
            'conversations': serializer.data,
            'total': len(serializer.data)
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Messaging']
)
class ConversationMessagesView(APIView):
    """
    Conversation Messages API
    
    Retrieve and send messages within a specific conversation.
    
    GET: Retrieve all messages in a conversation
    POST: Send a new message to the conversation
    
    Authentication Required: JWT Token
    Permissions: Must be participant in the conversation
    
    This endpoint handles message retrieval and sending within existing conversations.
    Includes automatic read status updates and real-time broadcasting.
    
    Features:
    - Message history with pagination
    - Automatic read status marking
    - Real-time message broadcasting via WebSocket
    - Message activity logging
    - Conversation timestamp updates
    """

    def get(self, request, conversation_id):
        """
        Get Conversation Messages
        
        Retrieve all messages for a specific conversation.
        
        Path Parameters:
        - conversation_id: Unique conversation identifier
        
        Returns conversation messages including:
        - message_id: Unique message identifier
        - sender: Message sender information
        - content: Message text content
        - created_at: Message timestamp
        - is_read: Read status for current user
        - read_at: Timestamp when message was read
        
        Side Effects:
        - Marks all messages as read for current user
        - Updates conversation last activity timestamp
        
        Error Handling:
        - 404: Conversation not found or user not participant
        - 403: User not authorized to access conversation
        """
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=request.user,
                is_active=True
            )
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Mark messages as read for current user
        Message.objects.filter(
            conversation=conversation
        ).exclude(
            sender=request.user  # Messages sent by others
        ).filter(
            is_read=False
        ).update(is_read=True, read_at=timezone.now())

        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        messages = conversation.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)

        return Response({
            'conversation_id': conversation.id,
            'messages': serializer.data,
            'total': messages.count()
        }, status=status.HTTP_200_OK)

    def post(self, request, conversation_id):
        """
        Send Message to Conversation
        
        Send a new message to an existing conversation.
        
        Path Parameters:
        - conversation_id: Unique conversation identifier
        
        Request Body:
        - content: Message text content (required)
        
        Returns the created message with full metadata.
        
        Side Effects:
        - Creates new message in database
        - Updates conversation last activity timestamp
        - Broadcasts message via WebSocket to all participants
        - Logs message sending activity
        
        Real-time Features:
        - WebSocket message broadcasting
        - Automatic conversation timestamp updates
        """
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=request.user,
                is_active=True
            )
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create the message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data['content']
        )

        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        # Broadcast message via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation.id}',
            {
                'type': 'chat_message',
                'message': MessageSerializer(message).data,
                'sender_id': request.user.id
            }
        )

        # Return the created message
        message_serializer = MessageSerializer(message)

        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            action_type='message_sent',
            action_description=f"Sent message in conversation {conversation.id}",
            metadata={'conversation_id': conversation.id, 'message_id': message.id},
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'Message sent successfully',
            'message_data': message_serializer.data
        }, status=status.HTTP_201_CREATED)


@swagger_auto_schema(
    tags=['Messaging']
)
class SendMessageView(APIView):
    """
    Direct Message API
    
    Send a message to start a new conversation or continue existing one.
    
    POST: Send message to recipient (creates conversation if needed)
    
    Authentication Required: JWT Token
    Permissions: Authenticated user (any role)
    
    This endpoint allows users to send direct messages to other users,
    automatically creating conversations when they don't exist.
    
    Features:
    - Automatic conversation creation
    - Existing conversation detection
    - Real-time message broadcasting
    - Message activity logging
    - Recipient validation
    """

    def post(self, request):
        """
        Send Direct Message
        
        Send a message to a recipient, creating conversation if needed.
        
        Request Body:
        - recipient_id: Target user ID (required)
        - content: Message text content (required)
        
        Process Flow:
        1. Validate recipient exists and is different from sender
        2. Check for existing conversation between users
        3. Create new conversation if none exists
        4. Create and save new message
        5. Update conversation timestamp
        6. Broadcast message via WebSocket
        7. Log message sending activity
        
        Returns created message and conversation data.
        
        Error Handling:
        - 404: Recipient not found
        - 400: Invalid message content or recipient
        """
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        recipient_id = serializer.validated_data['recipient_id']
        content = serializer.validated_data['content']

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({
                'error': 'Recipient not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if conversation already exists between these users
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        ).filter(
            is_active=True
        ).first()

        # Create conversation if it doesn't exist
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, recipient)

        # Create the message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )

        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        # Broadcast message via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation.id}',
            {
                'type': 'chat_message',
                'message': MessageSerializer(message).data,
                'sender_id': request.user.id
            }
        )

        # Return conversation and message data
        conversation_serializer = ConversationSerializer(conversation, context={'request': request})
        message_serializer = MessageSerializer(message)

        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            action_type='message_sent',
            action_description=f"Sent message to {recipient.get_full_name()}",
            metadata={
                'recipient_id': recipient.id,
                'conversation_id': conversation.id,
                'message_id': message.id
            },
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'Message sent successfully',
            'conversation': conversation_serializer.data,
            'message_data': message_serializer.data
        }, status=status.HTTP_201_CREATED)


@swagger_auto_schema(
    tags=['Messaging']
)
class UnreadMessageCountView(APIView):
    """
    Unread Messages Count API
    
    Get unread message count and breakdown for authenticated user.
    
    GET: Retrieve unread message statistics
    
    Authentication Required: JWT Token
    Permissions: Authenticated user (any role)
    
    This endpoint provides users with their unread message statistics,
    useful for dashboard notifications and message indicators.
    
    Features:
    - Total unread count across all conversations
    - Conversation-level breakdown
    - Real-time count updates
    - Participant name inclusion for UI display
    """

    def get(self, request):
        """
        Get Unread Message Count
        
        Retrieve unread message statistics for the authenticated user.
        
        Returns comprehensive unread message data:
        
        Summary Statistics:
        - unread_count: Total unread messages across all conversations
        - conversations_with_unread: Number of conversations with unread messages
        
        Detailed Breakdown:
        - conversation_breakdown: Array of conversations with unread counts
          - conversation_id: Unique conversation identifier
          - other_participant_name: Name of conversation partner
          - unread_count: Number of unread messages in this conversation
        
        Usage:
        - Dashboard notification badges
        - Message list indicators
        - Real-time UI updates
        
        Note: Counts exclude messages sent by the current user.
        """
        # Count unread messages across all conversations for this user
        unread_count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(
            sender=request.user  # Exclude messages sent by the user
        ).count()
        
        # Get breakdown by conversation for dashboard widgets
        conversations_with_unread = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(
            sender=request.user
        ).values('conversation').annotate(
            unread_count=models.Count('id')
        )
        
        # Create conversation breakdown
        conversation_breakdown = []
        for conv in conversations_with_unread:
            try:
                conversation = Conversation.objects.get(id=conv['conversation'])
                other_participant = conversation.get_other_participant(request.user)
                conversation_breakdown.append({
                    'conversation_id': conv['conversation'],
                    'other_participant_name': other_participant.get_full_name() if other_participant else 'Unknown',
                    'unread_count': conv['unread_count']
                })
            except Conversation.DoesNotExist:
                continue
        
        return Response({
            'unread_count': unread_count,
            'conversations_with_unread': len(conversation_breakdown),
            'conversation_breakdown': conversation_breakdown
        }, status=status.HTTP_200_OK)


class CheckPasswordView(APIView):
    """
    Check if user has a usable password set
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            has_password = user.has_usable_password()
            
            return Response({
                'has_password': has_password,
                'can_set_password': not has_password
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to check password status',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SetPasswordView(APIView):
    """
    Set password for Google users who want to add email/password login
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        password = request.data.get('password')
        
        if not password:
            return Response({
                'error': 'Password is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = request.user
            
            # Check if user already has a password
            if user.has_usable_password():
                return Response({
                    'error': 'You already have a password set. Use change password instead.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate password strength
            from .utils import validate_password_strength
            try:
                validate_password_strength(password)
            except ValidationError as e:
                return Response({
                    'error': ' '.join(e.messages)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set password
            user.set_password(password)
            user.save(update_fields=['password'])
            
            # Log activity
            UserActivityLog.objects.create(
                user=user,
                action_type='profile_update',
                action_description='Password added for email login',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'auth_method': 'password_added'}
            )
            
            return Response({
                'message': 'Password set successfully. You can now login with email and password.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to set password',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckEmailView(APIView):
    """
    Check if email exists and what authentication method it uses
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.filter(email=email).first()
            
            if not user:
                return Response({
                    'exists': False,
                    'auth_method': 'email',
                    'message': 'No account found with this email'
                }, status=status.HTTP_200_OK)
            
            # Check if user has Google profile picture or was created via Google
            is_google_user = (
                user.profile_picture and 
                user.profile_picture.startswith('https://')
            )
            
            return Response({
                'exists': True,
                'auth_method': 'google' if is_google_user else 'email',
                'role': user.role,
                'message': f'Account found. Please sign in with {"Google or email/password" if is_google_user else "email and password"}.',
                'supports_password': True  # All users can potentially have passwords
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to check email',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class _SignInView(APIView):
    """Shared plumbing for the passwordless sign-in endpoints."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # a stale token cookie must not get in the way of signing in

    @staticmethod
    def _signed_in(user, created):
        refresh = RefreshToken.for_user(user)
        return session_response(user, str(refresh.access_token), str(refresh), extra={'is_new_user': created})

    @staticmethod
    def _refused(error):
        return Response({'error': error.code, 'detail': error.detail}, status=error.status)


class SignInMethodsView(APIView):
    """Which sign-in buttons to show. The Google client ID is public by design."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'google_client_id': settings.GOOGLE_CLIENT_ID or None, 'email_link': True})


class EmailLinkRequestView(_SignInView):
    """POST {email, next?}: email a one-time sign-in link and code."""

    def post(self, request):
        email = str(request.data.get('email', '')).strip()
        try:
            EmailValidator()(email)
        except ValidationError:
            return Response({'error': 'email_invalid', 'detail': 'Enter a valid email address.'},
                            status=status.HTTP_400_BAD_REQUEST)
        next_path = str(request.data.get('next', ''))
        if not next_path.startswith('/') or next_path.startswith('//'):
            next_path = ''  # internal paths only, never an open redirect
        result = passwordless.request_link(email, request, next_path=next_path)
        if not result.sent:
            return Response(
                {'error': 'rate_limited', 'detail': 'An email was just sent. Check your inbox or wait a minute.',
                 'retry_after': result.retry_after},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        return Response({'sent': True, 'expires_in': int(passwordless.LINK_TTL.total_seconds())})


class EmailLinkSignInView(_SignInView):
    """POST {token} from the emailed link, or {email, code} typed from the email."""

    def post(self, request):
        token = str(request.data.get('token', '')).strip()
        email = str(request.data.get('email', '')).strip()
        code = str(request.data.get('code', '')).strip()
        try:
            if token:
                user, created = passwordless.use_token(token, request)
            elif email and code:
                user, created = passwordless.use_code(email, code, request)
            else:
                return Response({'error': 'missing', 'detail': 'Open the link in the email or enter its code.'},
                                status=status.HTTP_400_BAD_REQUEST)
        except passwordless.SignInError as error:
            return self._refused(error)
        return self._signed_in(user, created)


class GoogleSignInView(_SignInView):
    """POST {credential}: the ID token from Google Identity Services."""

    def post(self, request):
        credential = str(request.data.get('credential', '')).strip()
        if not credential:
            return Response({'error': 'missing', 'detail': 'Google did not send a sign-in.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user, created = passwordless.google_sign_in(credential, request)
        except passwordless.SignInError as error:
            return self._refused(error)
        return self._signed_in(user, created)

