import uuid
import re
import requests
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
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
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema

from .models import (
    User, StudentProfile, LandlordProfile, CaretakerProfile,
    OTPVerification, PasswordResetToken, UserActivityLog,
    Conversation, Message
)

# Import security models from hostels app
from hostels.models import LateEntryLog, VisitorInvitation


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
    detect_device_type, detect_browser, create_paystack_subaccount
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
    
    This endpoint allows new users to register accounts with different roles:
    - student: Student looking for accommodation
    - landlord: Property owner/manager
    - caretaker: Property management staff
    
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
        - role: User role (student, landlord, caretaker)
        
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
                if role == 'student':
                    StudentProfile.objects.create(
                        user=user,
                        university=serializer.validated_data.get('university'),
                        preferred_hostel_id=serializer.validated_data.get('preferred_hostel_id'),
                        preferred_room_number=serializer.validated_data.get('room_number')
                    )
                elif role == 'landlord':
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

        # Generate new OTP
        otp = OTPVerification.objects.create(
            user=user,
            otp_code=generate_6_digit_otp(),
            verification_type=verification_type,
            expires_at=timezone.now() + timezone.timedelta(minutes=5),
            ip_address=get_client_ip(request)
        )

        # Send email (async)
        from .tasks import send_verification_email
        send_verification_email.delay(
            user_id=user.id,
            otp_code=otp.otp_code,
            first_name=user.first_name
        )

        return Response({
            'message': 'OTP sent successfully',
            'expires_in_seconds': 300
        }, status=status.HTTP_200_OK)


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

        # Optional: Check verification
        # if not user.is_verified:
        #     return Response({
        #         'error': 'Email not verified'
        #     }, status=status.HTTP_403_FORBIDDEN)

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

# Get profile data
        profile_data = self._get_user_profile_data(user)

        response = Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'user': profile_data
        }, status=status.HTTP_200_OK)

# Set cookies for frontend access
        from django.utils.http import http_date
        from django.conf import settings
        
        # Set access token cookie
        response.set_cookie(
            key='rumi_access_token',
            value=access_token,
            path='/',
            domain=None,
            secure=False,  # Set to True in production with HTTPS
            httponly=True,
            samesite='Strict'
        )
        
        # Set refresh token cookie
        response.set_cookie(
            key='rumi_refresh_token',
            value=refresh_token,
            max_age=30 * 24 * 60 * 60,  # 30 days
            path='/',
            domain=None,
            secure=False,  # Set to True in production with HTTPS
            httponly=True,
            samesite='Strict'
        )
        
        # Set user role cookie
        response.set_cookie(
            key='rumi_user_role',
            value=user.role,
            max_age=30 * 24 * 60 * 60,  # 30 days
            path='/',
            domain=None,
            secure=False,  # Set to True in production with HTTPS
            httponly=False,  # Frontend needs access to role
            samesite='Strict'
        )

        return response

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
            'last_login': user.last_login
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
    """Refresh access token"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            return Response({
                'access_token': access_token,
                'expires_in': 3600
            }, status=status.HTTP_200_OK)

        except TokenError:
            return Response({
                'error': 'Invalid or expired refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)


@swagger_auto_schema(
    tags=['Authentication']
)
class UserLogoutView(APIView):
    """Handle user logout"""

    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if refresh_token:
            # Blacklist refresh token
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except:
                pass

        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            action_type='logout',
            action_description="User logged out",
            ip_address=get_client_ip(request)
        )

        return Response({
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)


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

        return Response({
            'message': 'Password reset link sent to your email',
            'expires_in_hours': 24
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
class CaretakerListCreateView(APIView):
    """
    Caretaker Management API
    
    List and create caretaker accounts (Landlord only).
    
    GET: List landlord's caretakers with detailed information
    POST: Create new caretaker account for specific hostel
    
    Authentication Required: JWT Token
    Permissions: Verified landlords only
    
    This endpoint allows verified landlords to manage their caretaker staff.
    Includes account creation, profile management, and hostel assignment.
    
    Features:
    - Automatic caretaker account creation with temporary passwords
    - Email notification with login credentials
    - Hostel-specific assignment
    - Permission management for caretaker actions
    - Activity logging for audit trail
    """

    permission_classes = [IsLandlord]

    def get(self, request):
        """
        List Caretakers
        
        Retrieve all caretakers assigned to the landlord's properties.
        
        Returns comprehensive caretaker list including:
        
        Caretaker Information:
        - caretaker_id: Unique caretaker identifier
        - user_id: Associated user account ID
        - email: Caretaker email address
        - full_name: Caretaker first and last name
        - phone_number: Contact phone number
        
        Assignment Details:
        - hostel: Hostel information (ID and name)
        - employment_start_date: Start date of employment
        - is_active: Current employment status
        - salary_amount: Current salary (if tracked)
        
        Returns total count and detailed caretaker profiles.
        Ordered by most recently created first.
        """
        landlord = request.user.landlord_profile

        caretakers = CaretakerProfile.objects.filter(
            landlord=landlord
        ).select_related('user', 'hostel').order_by('-created_at')

        data = []
        for caretaker in caretakers:
            data.append({
                'caretaker_id': caretaker.id,
                'user_id': caretaker.user.id,
                'email': caretaker.user.email,
                'first_name': caretaker.user.first_name,
                'last_name': caretaker.user.last_name,
                'phone_number': caretaker.user.phone_number,
                'hostel': {
                    'hostel_id': caretaker.hostel.id,
                    'hostel_name': caretaker.hostel.name
                },
                'employment_start_date': caretaker.employment_start_date,
                'is_active': caretaker.is_active,
                'salary_amount': caretaker.salary_amount
            })

        return Response({
            'total_caretakers': len(data),
            'caretakers': data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create Caretaker
        
        Create a new caretaker account for a specific hostel.
        
        Required Fields:
        - first_name: Caretaker's first name
        - last_name: Caretaker's last name
        - email: Unique email address for caretaker account
        - national_id: National identification number
        - hostel_id: Hostel to assign caretaker to
        - employment_start_date: Start date of employment
        - emergency_contact_name: Emergency contact person
        - emergency_contact_phone: Emergency contact phone
        
        Optional Fields:
        - phone_number: Caretaker's phone number
        - salary_amount: Monthly salary amount
        - payment_method: Payment tracking method
        - permissions: Custom permission settings
        
        Process Flow:
        1. Validate landlord owns the specified hostel
        2. Check for existing active caretaker on hostel
        3. Validate unique national ID
        4. Generate temporary secure password
        5. Create user account with caretaker role
        6. Create caretaker profile with permissions
        7. Send welcome email with credentials
        8. Log creation activity
        
        Returns created caretaker details and temporary password.
        
        Security Features:
        - Unique email validation
        - National ID uniqueness check
        - Secure password generation
        - Email notification with credentials
        """
        landlord = request.user.landlord_profile

        serializer = CaretakerCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        hostel_id = validated_data['hostel_id']

        # Validate hostel ownership
        try:
            from hostels.models import Hostel
            hostel = Hostel.objects.get(id=hostel_id, landlord=landlord)
        except Hostel.DoesNotExist:
            return Response({
                'error': 'Hostel not found or not owned by you'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if hostel already has active caretaker
        existing_caretaker = CaretakerProfile.objects.filter(
            hostel=hostel,
            is_active=True
        ).exists()

        if existing_caretaker:
            return Response({
                'error': 'This hostel already has an active caretaker'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check email uniqueness (allow duplicates)
        email = validated_data['email']
        national_id = validated_data['national_id']

        # Check national ID uniqueness
        if CaretakerProfile.objects.filter(national_id=national_id).exists():
            return Response({
                'error': 'National ID already registered'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate temporary password
        temp_password = generate_strong_password()

        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    email=email,
                    password=temp_password,
                    first_name=validated_data['first_name'],
                    last_name=validated_data['last_name'],
                    phone_number=validated_data.get('phone_number'),
                    role='caretaker',
                    is_active=True,
                    is_verified=False
                )

                # Create caretaker profile
                caretaker = CaretakerProfile.objects.create(
                    user=user,
                    national_id=national_id,
                    hostel=hostel,
                    landlord=landlord,
                    employment_start_date=validated_data['employment_start_date'],
                    salary_amount=validated_data.get('salary_amount'),
                    payment_method=validated_data.get('payment_method', 'not_tracked'),
                    permissions=validated_data.get('permissions', {
                        'can_view_student_payments': True,
                        'can_view_payment_amounts': True,
                        'can_create_inventory_templates': True,
                        'can_verify_check_ins': True,
                        'can_verify_check_outs': True,
                        'can_create_damage_reports': True,
                        'can_approve_room_transfers': True,
                        'can_view_financial_reports': False
                    }),
                    emergency_contact_name=validated_data['emergency_contact_name'],
                    emergency_contact_phone=validated_data['emergency_contact_phone'],
                    is_active=True,
                    created_by=request.user
                )

                # Send welcome email (async)
                from .tasks import send_caretaker_welcome_email
                send_caretaker_welcome_email.delay(
                    caretaker_id=caretaker.id,
                    temporary_password=temp_password
                )

                # Log activity
                UserActivityLog.objects.create(
                    user=request.user,
                    action_type='caretaker_created',
                    action_description=f"Created caretaker for hostel {hostel.name}",
                    metadata={
                        'caretaker_user_id': user.id,
                        'hostel_id': hostel.id
                    },
                    ip_address=get_client_ip(request)
                )

                return Response({
                    'caretaker_id': caretaker.id,
                    'user_id': user.id,
                    'email': user.email,
                    'hostel_name': hostel.name,
                    'employment_start_date': caretaker.employment_start_date,
                    'is_active': True,
                    'temporary_password': temp_password,
                    'message': 'Caretaker account created successfully. Temporary password sent to email.'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Caretaker creation failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    tags=['Student Dashboard']
)
class StudentDashboardView(APIView):
    """
    Student Dashboard API
    
    Provide comprehensive dashboard data for student users.
    
    GET: Retrieve student dashboard with overview data
    
    Authentication Required: JWT Token
    Permissions: Students only
    
    This endpoint provides students with a comprehensive overview of their
    accommodation journey including bookings, payments, profile completion,
    and quick actions.
    
    Dashboard Components:
    - Profile completion tracking and guidance
    - Recent booking history with status updates
    - Payment transaction history
    - Quick action buttons for common tasks
    - Notification count for unread messages
    - Statistics summary (total bookings, spending)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get Student Dashboard
        
        Retrieve comprehensive dashboard data for the authenticated student.
        
        Returns dashboard data including:
        
        Profile Section:
        - completion_percentage: Profile completion percentage
        - is_complete: Boolean indicating if profile is fully complete
        
        Statistics Section:
        - total_bookings: Total number of bookings made
        - active_bookings: Currently active/confirmed bookings
        - total_spent: Total amount spent on accommodations
        - unread_notifications: Count of unread notifications
        
        Recent Activity:
        - recent_bookings: Latest 5 bookings with details
        - recent_payments: Latest 5 successful payments
        
        Quick Actions:
        - Available actions based on user status
        - Contextual recommendations
        
        Note: Only accessible by users with 'student' role.
        """
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access dashboard'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get recent bookings
        from hostels.models import Booking
        recent_bookings = Booking.objects.filter(
            student=student_profile
        ).select_related('room__hostel').order_by('-created_at')[:5]

        bookings_data = []
        for booking in recent_bookings:
            bookings_data.append({
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'hostel_name': booking.room.hostel.name,
                'room_number': booking.room.room_number,
                'status': booking.status,
                'total_amount': float(booking.total_amount),
                'balance_due': float(booking.balance_due),
                'move_in_date': booking.check_in_date.isoformat() if booking.check_in_date else None,
                'created_at': booking.created_at.isoformat()
            })

        # Get recent payments
        from payments.models import Transaction
        recent_payments = Transaction.objects.filter(
            student=student_profile,
            status='success'
        ).order_by('-paid_at')[:5]

        payments_data = []
        for payment in recent_payments:
            payments_data.append({
                'transaction_id': payment.id,
                'reference': payment.transaction_reference,
                'amount': float(payment.total_charged_amount),
                'type': payment.transaction_type,
                'paid_at': payment.paid_at.isoformat() if payment.paid_at else None
            })

        # Get unread notifications count
        from notifications.models import Notification
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            channel='in_app',
            read_at__isnull=True
        ).count()

        # Get profile completion status
        profile_complete = student_profile.is_profile_complete

        # Quick stats
        total_bookings = Booking.objects.filter(student=student_profile).count()
        active_bookings = Booking.objects.filter(
            student=student_profile,
            status__in=['confirmed', 'reserved']
        ).count()
        total_spent = Transaction.objects.filter(
            student=student_profile,
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Get current/active booking for hostelInfo (used by payments)
        current_booking = Booking.objects.filter(
            student=student_profile,
            status__in=['confirmed', 'reserved']
        ).select_related('room__hostel').first()

        hostel_info = None
        if current_booking:
            hostel_info = {
                'id': current_booking.room.hostel.id,
                'name': current_booking.room.hostel.name,
                'booking_id': current_booking.id,
                'room_number': current_booking.room.room_number,
                'total_amount': float(current_booking.total_amount)
            }

        # Get pending payments/bookings that need payment
        pending_payments = Booking.objects.filter(
            student=student_profile,
            status__in=['pending_payment', 'reserved']
        ).select_related('room__hostel').order_by('-created_at')

        pending_payments_data = []
        has_pending_payments = False
        for booking in pending_payments:
            balance_due = booking.total_amount - booking.amount_paid
            if balance_due > 0:
                has_pending_payments = True
                pending_payments_data.append({
                    'booking_id': booking.id,
                    'booking_reference': booking.booking_reference,
                    'hostel_name': booking.room.hostel.name,
                    'room_number': booking.room.room_number,
                    'amount_due': float(balance_due),
                    'due_date': booking.check_in_date.isoformat() if booking.check_in_date else None,
                    'status': booking.status
                })

        # Get available payment methods
        from payments.models import SavedPaymentMethod
        saved_methods = SavedPaymentMethod.objects.filter(
            student=student_profile,
            is_active=True
        )

        payment_methods = {
            'available': ['mpesa_stk_push', 'paystack_card'],
            'saved_count': saved_methods.count(),
            'default_method': saved_methods.first().last_four if saved_methods.exists() else None
        }

        return Response({
            'profile': {
                'is_complete': profile_complete,
                'completion_percentage': self._calculate_profile_completion(student_profile)
            },
            'stats': {
                'total_bookings': total_bookings,
                'active_bookings': active_bookings,
                'total_spent': float(total_spent),
                'unread_notifications': unread_notifications
            },
            'hostelInfo': hostel_info,  # Include for payment modal compatibility
            'pending_payments': pending_payments_data,
            'payment_methods': payment_methods,
            'recent_bookings': bookings_data,
            'recent_payments': payments_data,
            'quick_actions': [
                {'action': 'make_payment', 'label': 'Make Payment', 'available': has_pending_payments},
                {'action': 'search_rooms', 'label': 'Find Rooms', 'available': True},
                {'action': 'setup_payments', 'label': 'Setup Payment Methods', 'available': True},
                {'action': 'complete_profile', 'label': 'Complete Profile', 'available': not profile_complete},
                {'action': 'view_receipts', 'label': 'View Receipts', 'available': len(payments_data) > 0},
                {'action': 'contact_support', 'label': 'Contact Support', 'available': True}
            ]
        }, status=status.HTTP_200_OK)

    def _calculate_profile_completion(self, student_profile):
        """Calculate profile completion percentage"""
        # Check actual fields that exist in StudentProfile model
        required_fields = [
            ('university', student_profile.university),
            ('student_id_number', student_profile.student_id_number),
            ('year_of_study', student_profile.year_of_study),
            ('course', student_profile.course),
            ('phone_number', student_profile.user.phone_number),  # From User model
            ('emergency_contact_name', student_profile.emergency_contact_name),
            ('emergency_contact_phone', student_profile.emergency_contact_phone),
        ]

        completed = 0
        for field_name, field_value in required_fields:
            if field_value:
                completed += 1

        return int((completed / len(required_fields)) * 100)


@swagger_auto_schema(
    tags=['Landlord Dashboard']
)
class LandlordDashboardView(APIView):
    """
    Landlord Dashboard API
    
    Provide comprehensive dashboard data for landlord users.
    
    GET: Retrieve landlord dashboard with business overview
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with a comprehensive business dashboard
    including property management, earnings, bookings, and platform analytics.
    
    Dashboard Components:
    - Property portfolio overview with occupancy rates
    - Financial earnings and payout tracking
    - Recent booking activity and guest management
    - Subscription plan and billing information
    - Quick action buttons for property management
    - Performance metrics and analytics
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get Landlord Dashboard
        
        Retrieve comprehensive dashboard data for the authenticated landlord.
        
        Returns dashboard data including:
        
        Profile Section:
        - is_verified: Verification status for hostel listing
        - company_name: Business/company name
        - total_hostels: Number of properties owned
        - total_rooms: Total room inventory
        - total_earnings: Lifetime earnings summary
        
        Subscription Section:
        - plan_name: Current subscription plan
        - status: Subscription status (active, trial, etc.)
        - billing_period: Current billing period dates
        - trial_remaining_days: Days left in trial (if applicable)
        
        Statistics Section:
        - total_hostels: Count of properties
        - total_rooms: Total room count across all properties
        - available_rooms: Currently available rooms
        - occupied_rooms: Currently occupied rooms
        - active_bookings: Ongoing confirmed bookings
        - total_earnings: Recent earnings total
        - unread_notifications: Count of unread notifications
        
        Business Data:
        - hostels: Detailed property list with occupancy
        - recent_bookings: Latest booking activity
        - recent_payments: Latest payment transactions
        
        Quick Actions:
        - Contextual actions based on verification status and activity
        
        Note: Only accessible by users with 'landlord' role.
        """
        if request.user.role != 'landlord':
            return Response({
                'error': 'Only landlords can access dashboard'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            landlord_profile = request.user.landlord_profile
        except:
            return Response({
                'error': 'Landlord profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get landlord's hostels
        from hostels.models import Hostel, Booking, Room
        hostels = Hostel.objects.filter(landlord=landlord_profile).select_related()

        hostels_data = []
        total_rooms = 0
        total_available_rooms = 0
        total_occupied_rooms = 0

        for hostel in hostels:
            rooms = Room.objects.filter(hostel=hostel)
            available_rooms = rooms.filter(status='available').count()
            occupied_rooms = rooms.filter(status='occupied').count()

            hostels_data.append({
                'hostel_id': hostel.id,
                'name': hostel.name,
                'status': hostel.status,
                'total_rooms': hostel.total_rooms,
                'available_rooms': available_rooms,
                'occupied_rooms': occupied_rooms,
                'base_price': float(hostel.base_price),
                'is_verified': hostel.is_verified,
                'created_at': hostel.created_at.isoformat()
            })

            total_rooms += hostel.total_rooms
            total_available_rooms += available_rooms
            total_occupied_rooms += occupied_rooms

        # Get recent bookings
        recent_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord_profile
        ).select_related('room__hostel', 'student__user').order_by('-created_at')[:5]

        bookings_data = []
        for booking in recent_bookings:
            bookings_data.append({
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'student_name': booking.student.user.get_full_name(),
                'hostel_name': booking.room.hostel.name,
                'room_number': booking.room.room_number,
                'status': booking.status,
                'total_amount': float(booking.total_amount),
                'monthly_rent': float(booking.monthly_rent),
                'move_in_date': booking.check_in_date.isoformat() if booking.check_in_date else None,
                'created_at': booking.created_at.isoformat()
            })

        # Get recent payments/transactions
        # Get recent payments/transactions
        from payments.models import Transaction
        from django.db.models import Q
        recent_payments = Transaction.objects.filter(
            Q(booking__room__hostel__landlord=landlord_profile) |
            Q(rent_period__hostel__landlord=landlord_profile),
            status='success'
        ).order_by('-paid_at')[:5]

        payments_data = []
        total_earnings = 0
        for payment in recent_payments:
            payments_data.append({
                'transaction_id': payment.id,
                'reference': payment.transaction_reference,
                'student_name': payment.student.user.get_full_name(),
                'amount': float(payment.landlord_payout_amount),
                'service_fee': float(payment.student_service_fee),
                'paid_at': payment.paid_at.isoformat() if payment.paid_at else None
            })
            total_earnings += float(payment.landlord_payout_amount)

        # Get subscription info
        subscription_data = None
        try:
            from .subscription_models import LandlordSubscription
            subscription = LandlordSubscription.objects.filter(
                landlord=landlord_profile
            ).select_related('plan').first()

            if subscription:
                subscription_data = {
                    'plan_name': subscription.plan.name,
                    'status': subscription.status,
                    'current_period_start': subscription.current_period_start.isoformat() if subscription.current_period_start else None,
                    'current_period_end': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                    'trial_remaining_days': max(0, (subscription.trial_end - timezone.now().date()).days) if subscription.trial_end and subscription.status == 'trial' else 0
                }
        except:
            pass

        # Get unread notifications count
        from notifications.models import Notification
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            channel='in_app',
            read_at__isnull=True
        ).count()

        # Quick stats
        total_hostels = hostels.count()
        active_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord_profile,
            status__in=['confirmed', 'reserved']
        ).count()

        return Response({
            'profile': {
                'is_verified': landlord_profile.is_verified,
                'company_name': landlord_profile.company_name,
                'total_hostels': landlord_profile.total_hostels,
                'total_rooms': landlord_profile.total_rooms,
                'total_earnings': float(landlord_profile.total_earnings)
            },
            'subscription': subscription_data,
            'stats': {
                'total_hostels': total_hostels,
                'total_rooms': total_rooms,
                'available_rooms': total_available_rooms,
                'occupied_rooms': total_occupied_rooms,
                'active_bookings': active_bookings,
                'total_earnings': float(total_earnings),
                'unread_notifications': unread_notifications
            },
            'hostels': hostels_data,
            'recent_bookings': bookings_data,
            'recent_payments': payments_data,
            'quick_actions': [
                {'action': 'add_hostel', 'label': 'Add New Hostel', 'available': landlord_profile.is_verified},
                {'action': 'manage_rooms', 'label': 'Manage Rooms', 'available': total_hostels > 0},
                {'action': 'view_earnings', 'label': 'View Earnings', 'available': len(payments_data) > 0},
                {'action': 'contact_support', 'label': 'Contact Support', 'available': True}
            ]
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


@swagger_auto_schema(
    tags=['Student Security']
)
class StudentSecurityLateEntriesView(APIView):
    """Get late entry logs for students"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get late entries for the authenticated student"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get late entry logs for this student
        late_entries = LateEntryLog.objects.filter(
            student=student_profile
        ).select_related('hostel', 'room', 'reviewed_by').order_by('-entry_time')
        
        # Apply filters
        status_filter = request.query_params.get('status', 'all')
        if status_filter != 'all':
            late_entries = late_entries.filter(status=status_filter)
        
        date_from = request.query_params.get('date_from')
        if date_from:
            late_entries = late_entries(entry_time__date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            late_entries = late_entries(entry_time__date__lte=date_to)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 10))
        start = (page - 1) * per_page
        end = start + per_page
        
        total_entries = late_entries.count()
        entries_page = late_entries[start:end]
        
        # Format response data
        entries_data = []
        for entry in entries_page:
            entries_data.append({
                'entry_id': entry.id,
                'hostel_name': entry.hostel.name,
                'room_number': entry.room.room_number,
                'entry_time': entry.entry_time.isoformat(),
                'expected_curfew': entry.expected_curfew.strftime('%H:%M'),
                'delay_minutes': entry.delay_minutes,
                'reason': entry.reason,
                'reason_details': entry.reason_details,
                'status': entry.status,
                'is_violation': entry.is_violation,
                'reviewed_by': entry.reviewed_by.user.get_full_name() if entry.reviewed_by else None,
                'reviewed_at': entry.reviewed_at.isoformat() if entry.reviewed_at else None,
                'review_notes': entry.review_notes,
                'entry_location': entry.entry_location,
                'violation_count': entry.violation_count,
                'created_at': entry.created_at.isoformat()
            })
        
        return Response({
            'late_entries': entries_data,
            'pagination': {
                'current_page': page,
                'total_pages': (total_entries + per_page - 1) // per_page,
                'total_entries': total_entries,
                'per_page': per_page,
                'has_next': page * per_page < total_entries,
                'has_previous': page > 1
            },
            'filters': {
                'status': status_filter,
                'date_from': date_from,
                'date_to': date_to
            }
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Student Security']
)
class StudentSecurityVisitorInvitationsView(APIView):
    """Create and manage visitor invitations for students"""

    permission_classes = [IsStudent]

    def get(self, request):
        """Get visitor invitations for the authenticated student"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get visitor invitations for this student
        invitations = VisitorInvitation.objects.filter(
            student=student_profile
        ).select_related('hostel', 'room', 'approved_by').order_by('-expected_arrival')

        # Apply filters
        status_filter = request.query_params.get('status', 'all')
        if status_filter != 'all':
            invitations = invitations.filter(status=status_filter)

        # Pagination
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 10))
        start = (page - 1) * per_page
        end = start + per_page

        total_invitations = invitations.count()
        invitations_page = invitations[start:end]

        # Format response data
        invitations_data = []
        for invitation in invitations_page:
            invitations_data.append({
                'invitation_id': invitation.id,
                'visitor_name': invitation.visitor_name,
                'visitor_phone': invitation.visitor_phone,
                'visitor_id_number': invitation.visitor_id_number,
                'visitor_relationship': invitation.visitor_relationship,
                'purpose': invitation.purpose,
                'expected_arrival': invitation.expected_arrival.isoformat(),
                'expected_departure': invitation.expected_departure.isoformat(),
                'status': invitation.status,
                'approved_by': invitation.approved_by.user.get_full_name() if invitation.approved_by else None,
                'approved_at': invitation.approved_at.isoformat() if invitation.approved_at else None,
                'rejection_reason': invitation.rejection_reason,
                'caretaker_notes': invitation.caretaker_notes,
                'actual_check_in': invitation.actual_check_in.isoformat() if invitation.actual_check_in else None,
                'actual_check_out': invitation.actual_check_out.isoformat() if invitation.actual_check_out else None,
                'requires_escort': invitation.requires_escort,
                'escorted_by': invitation.escorted_by,
                'invitation_token': str(invitation.invitation_token),
                'is_expired': invitation.is_expired,
                'can_check_in': invitation.can_check_in,
                'visit_duration_hours': invitation.visit_duration_hours,
                'created_at': invitation.created_at.isoformat()
            })

        return Response({
            'visitor_invitations': invitations_data,
            'pagination': {
                'current_page': page,
                'total_pages': (total_invitations + per_page - 1) // per_page,
                'total_invitations': total_invitations,
                'per_page': per_page,
                'has_next': page * per_page < total_invitations,
                'has_previous': page > 1
            },
            'filters': {
                'status': status_filter
            }
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new visitor invitation"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get invitation data
        visitor_name = request.data.get('visitor_name')
        visitor_phone = request.data.get('visitor_phone')
        visitor_id_number = request.data.get('visitor_id_number')
        visitor_relationship = request.data.get('visitor_relationship')
        purpose = request.data.get('purpose')
        expected_arrival = request.data.get('expected_arrival')
        expected_departure = request.data.get('expected_departure')
        special_instructions = request.data.get('special_instructions', '')
        requires_escort = request.data.get('requires_escort', False)

        # Validate required fields
        if not all([visitor_name, visitor_phone, visitor_id_number, visitor_relationship, purpose, expected_arrival, expected_departure]):
            return Response({
                'error': 'All visitor details and timing information are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get student's current room and hostel
            current_occupancy = RoomOccupant.objects.filter(
                student=student_profile,
                is_active=True
            ).select_related('room__hostel').first()

            if not current_occupancy:
                return Response({
                    'error': 'No active room assignment found'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create visitor invitation
            invitation = VisitorInvitation.objects.create(
                student=student_profile,
                hostel=current_occupancy.room.hostel,
                room=current_occupancy.room,
                visitor_name=visitor_name,
                visitor_phone=visitor_phone,
                visitor_id_number=visitor_id_number,
                visitor_relationship=visitor_relationship,
                purpose=purpose,
                expected_arrival=expected_arrival,
                expected_departure=expected_departure,
                special_instructions=special_instructions,
                requires_escort=requires_escort,
                status='pending'
            )

            return Response({
                'message': 'Visitor invitation created successfully',
                'invitation_id': invitation.id,
                'invitation_token': str(invitation.invitation_token),
                'status': invitation.status,
                'expected_arrival': invitation.expected_arrival.isoformat(),
                'needs_approval': invitation.caretaker_approval_required
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to create visitor invitation',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, invitation_id):
        """Update visitor invitation (cancel or modify)"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'cancel', 'modify'

        try:
            invitation = VisitorInvitation.objects.get(
                id=invitation_id,
                student=student_profile
            )
        except VisitorInvitation.DoesNotExist:
            return Response({
                'error': 'Visitor invitation not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if action == 'cancel':
            if invitation.status in ['checked_in', 'checked_out']:
                return Response({
                    'error': 'Cannot cancel invitation that has been checked in'
                }, status=status.HTTP_400_BAD_REQUEST)

            invitation.status = 'cancelled'
            invitation.save()

            return Response({
                'message': 'Visitor invitation cancelled successfully',
                'invitation_id': invitation.id,
                'status': invitation.status
            }, status=status.HTTP_200_OK)

        elif action == 'modify':
            # Allow modification of timing or instructions
            expected_arrival = request.data.get('expected_arrival')
            expected_departure = request.data.get('expected_departure')
            special_instructions = request.data.get('special_instructions')

            if expected_arrival:
                invitation.expected_arrival = expected_arrival
            if expected_departure:
                invitation.expected_departure = expected_departure
            if special_instructions is not None:
                invitation.special_instructions = special_instructions

            invitation.save()

            return Response({
                'message': 'Visitor invitation updated successfully',
                'invitation_id': invitation.id,
                'expected_arrival': invitation.expected_arrival.isoformat(),
                'expected_departure': invitation.expected_departure.isoformat()
            }, status=status.HTTP_200_OK)

        else:
            return Response({
                'error': 'Invalid action. Must be "cancel" or "modify"'
            }, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    tags=['Student Dashboard']
)
class StudentSupportTicketsView(APIView):
    """Get student's support tickets for dashboard"""

    permission_classes = [IsStudent]

    def get(self, request):
        """Get active support tickets for the student"""
        try:
            # Import support models
            from support_api.models import SupportTicket

            # Get student's active tickets
            tickets = SupportTicket.objects.filter(
                created_by=request.user,
                status__in=['open', 'in_progress', 'pending_response']
            ).select_related('assigned_to').order_by('-created_at')[:5]  # Limit to 5 for dashboard

            tickets_data = []
            for ticket in tickets:
                tickets_data.append({
                    'id': ticket.id,
                    'ticket_id': ticket.ticket_id,
                    'subject': ticket.subject,
                    'status': ticket.status,
                    'priority': ticket.priority,
                    'category': ticket.category,
                    'created_at': ticket.created_at.isoformat(),
                    'last_response_at': ticket.last_response_at.isoformat() if ticket.last_response_at else None,
                    'assigned_to': ticket.assigned_to.user.get_full_name() if ticket.assigned_to else None
                })

            return Response({
                'tickets': tickets_data,
                'total_active': len(tickets_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Return empty list if support API is not available
            return Response({
                'tickets': [],
                'total_active': 0
            }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Student Dashboard']
)
class StudentActivityFeedView(APIView):
    """Get student's activity feed for dashboard"""

    permission_classes = [IsStudent]

    def get(self, request):
        """Get recent activity feed for the student"""
        limit = int(request.query_params.get('limit', 5))

        try:
            # Get recent activities related to the student
            activities = []

            # Recent bookings
            from hostels.models import Booking
            recent_bookings = Booking.objects.filter(
                student__user=request.user
            ).select_related('room__hostel').order_by('-created_at')[:3]

            for booking in recent_bookings:
                activities.append({
                    'id': f'booking_{booking.id}',
                    'type': 'booking',
                    'title': f'Booking {booking.booking_reference}',
                    'description': f'Booked room {booking.room.room_number} at {booking.room.hostel.name}',
                    'timestamp': booking.created_at.isoformat(),
                    'status': booking.status,
                    'metadata': {
                        'booking_id': booking.id,
                        'hostel_name': booking.room.hostel.name,
                        'room_number': booking.room.room_number
                    }
                })

            # Recent payments
            from payments.models import Transaction
            recent_payments = Transaction.objects.filter(
                student__user=request.user,
                status='success'
            ).order_by('-paid_at')[:3]

            for payment in recent_payments:
                activities.append({
                    'id': f'payment_{payment.id}',
                    'type': 'payment',
                    'title': f'Payment of KES {payment.total_charged_amount}',
                    'description': f'Payment for {payment.transaction_type} transaction',
                    'timestamp': payment.paid_at.isoformat() if payment.paid_at else payment.initiated_at.isoformat(),
                    'status': 'completed',
                    'metadata': {
                        'transaction_id': payment.id,
                        'amount': float(payment.total_charged_amount),
                        'type': payment.transaction_type
                    }
                })

            # Sort by timestamp and limit
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            activities = activities[:limit]

            return Response({
                'activities': activities,
                'total': len(activities)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Return empty feed if there's an error
            return Response({
                'activities': [],
                'total': 0
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


class GoogleOAuthView(APIView):
    """
    Google OAuth authentication endpoint
    Handles Google token verification and user creation/login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        access_token = request.data.get('access_token')
        role = request.data.get('role', 'student')
        gender = request.data.get('gender')
        date_of_birth = request.data.get('date_of_birth')
        phone_number = request.data.get('phone_number')
        
        # Student specific fields
        university = request.data.get('university')
        preferred_hostel_id = request.data.get('preferred_hostel_id')
        room_number = request.data.get('room_number')
        
        # Landlord specific fields
        company_name = request.data.get('company_name')
        total_units = request.data.get('total_units')
        
        # Only allow student and landlord roles for Google OAuth
        if role and role not in ['student', 'landlord']:
            return Response({
                'error': 'Google OAuth only supports student and landlord roles'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not access_token:
            return Response({
                'error': 'Access token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify Google token
            user_info = self.verify_google_token(access_token)
            
            if not user_info:
                return Response({
                    'error': 'Invalid Google token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user exists and validate role
            email = user_info.get('email')
            existing_user = User.objects.filter(email=email).first()
            
            if existing_user:
                # For existing users, verify they're using the correct role
                if existing_user.role not in ['student', 'landlord']:
                    return Response({
                        'error': f'Account exists as {existing_user.role}. Please use email login.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Update existing user with latest Google info
                existing_user.first_name = user_info.get('given_name', existing_user.first_name)
                existing_user.last_name = user_info.get('family_name', existing_user.last_name)
                existing_user.profile_picture = user_info.get('picture', existing_user.profile_picture)
                
                # Update optional fields if provided
                if gender:
                    existing_user.gender = gender
                if date_of_birth:
                    existing_user.date_of_birth = date_of_birth
                if phone_number:
                    existing_user.phone_number = phone_number
                
                existing_user.last_login = timezone.now()
                existing_user.save()
                
                user = existing_user
                is_new_user = False
            else:
                # Create new user
                user = User.objects.create(
                    email=email,
                    first_name=user_info.get('given_name', ''),
                    last_name=user_info.get('family_name', ''),
                    role=role if role else 'student',
                    gender=gender,
                    date_of_birth=date_of_birth,
                    phone_number=phone_number,
                    is_verified=True,  # Google emails are verified
                    is_active=True,
                    profile_picture=user_info.get('picture'),
                    onboarding_stage='ROLE_SELECTED'
                )
                
                # Create role-specific profile with all captured data
                if user.role == 'student':
                    StudentProfile.objects.create(
                        user=user,
                        university=university,
                        preferred_hostel_id=preferred_hostel_id if preferred_hostel_id else None,
                        preferred_room_number=room_number,
                        is_profile_complete=False
                    )
                elif user.role == 'landlord':
                    LandlordProfile.objects.create(
                        user=user,
                        company_name=company_name,
                        total_units=total_units if total_units is not None else 0,
                        is_verified=False,
                        total_hostels=0
                    )
                
                is_new_user = True
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Log activity
            UserActivityLog.objects.create(
                user=user,
                action_type='login',
                action_description='Google OAuth login',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'auth_method': 'google_oauth'}
            )
            
            # Get profile data
            profile_data = self._get_user_profile_data(user)
            
            response = Response({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': 3600,
                'user': profile_data,
                'is_new_user': is_new_user,
                'is_profile_complete': profile_data.get('is_profile_complete', False)
            }, status=status.HTTP_200_OK)
            
            # Set access token cookie
            response.set_cookie(
                key='rumi_access_token',
                value=access_token,
                path='/',
                domain=None,
                secure=False,  # Set to True in production with HTTPS
                httponly=True,
                samesite='Lax'
            )
            
            return response
            
        except Exception as e:
            return Response({
                'error': 'Authentication failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def verify_google_token(self, access_token):
        """Verify Google access token and get user info"""
        try:
            # Call Google API to verify token
            response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
            
            if response.status_code != 200:
                return None
            
            return response.json()
            
        except requests.RequestException:
            return None
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
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
        }
        
        # Add role-specific profile data
        if user.role == 'student' and hasattr(user, 'student_profile'):
            profile = user.student_profile
            base_data.update({
                'university': profile.university,
                'student_id_number': profile.student_id_number,
                'year_of_study': profile.year_of_study,
                'course': profile.course,
                'is_profile_complete': profile.is_profile_complete,
            })
        elif user.role == 'landlord' and hasattr(user, 'landlord_profile'):
            profile = user.landlord_profile
            base_data.update({
                'company_name': profile.company_name,
                'is_verified': profile.is_verified,
                'total_hostels': profile.total_hostels,
                'is_profile_complete': getattr(profile, 'is_profile_complete', False),
            })
        elif user.role == 'caretaker' and hasattr(user, 'caretaker_profile'):
            profile = user.caretaker_profile
            base_data.update({
                'hostel': profile.hostel.name if profile.hostel else None,
                'is_active': profile.is_active,
            })
        
        return base_data
