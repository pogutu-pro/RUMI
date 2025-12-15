import uuid
import re
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

from .models import (
    User, StudentProfile, LandlordProfile, CaretakerProfile,
    OTPVerification, PasswordResetToken, UserActivityLog,
    Conversation, Message
)
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
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


class UserRegistrationView(APIView):
    """Handle user registration with role-based profile creation"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
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
                    role=role
                )

                # Create role-specific profile
                if role == 'student':
                    StudentProfile.objects.create(user=user)
                elif role == 'landlord':
                    LandlordProfile.objects.create(user=user)

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


class EmailVerificationView(APIView):
    """Handle email verification with OTP"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
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


class UserLoginView(APIView):
    """Handle user authentication"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
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

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'user': profile_data
        }, status=status.HTTP_200_OK)

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


class UserProfileView(APIView):
    """Get and update user profile"""

    def get(self, request):
        """Get authenticated user's profile"""
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Update user profile"""
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)

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
                'profile_complete': self._is_profile_complete(user)
            }, status=status.HTTP_200_OK)

    def _is_profile_complete(self, user):
        """Check if user profile is complete"""
        if user.role == 'student':
            try:
                profile = user.student_profile
                return profile.is_profile_complete
            except:
                return False
        return True


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


class CaretakerListCreateView(APIView):
    """List and create caretakers (Landlord only)"""

    permission_classes = [IsLandlord]

    def get(self, request):
        """List landlord's caretakers"""
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
        """Create new caretaker"""
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


class UserManagementView(APIView):
    """User management for admins"""

    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        """List users with filters"""
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


class StudentDashboardView(APIView):
    """Student dashboard with overview of bookings, payments, and activities"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get student dashboard data"""
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
                'move_in_date': booking.move_in_date.isoformat() if booking.move_in_date else None,
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
        ).aggregate(total=Sum('total_charged_amount'))['total'] or 0

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
            'recent_bookings': bookings_data,
            'recent_payments': payments_data,
            'quick_actions': [
                {'action': 'search_rooms', 'label': 'Find Rooms', 'available': True},
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


class LandlordDashboardView(APIView):
    """Landlord dashboard with overview of hostels, earnings, and activities"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get landlord dashboard data"""
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
        from payments.models import Transaction
        recent_payments = Transaction.objects.filter(
            landlord=landlord_profile,
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


class ConversationListView(APIView):
    """List user's chat conversations"""

    def get(self, request):
        """Get all conversations for the authenticated user"""
        conversations = Conversation.objects.filter(
            participants=request.user,
            is_active=True
        ).prefetch_related('participants', 'messages').order_by('-updated_at')

        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response({
            'conversations': serializer.data,
            'total': len(serializer.data)
        }, status=status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    """Get messages for a specific conversation"""

    def get(self, request, conversation_id):
        """Get messages for a conversation"""
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
        """Send a message to a conversation"""
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


class SendMessageView(APIView):
    """Send a message to start a new conversation or continue existing"""

    def post(self, request):
        """Send message to recipient (creates conversation if doesn't exist)"""
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
