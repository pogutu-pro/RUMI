from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User, StudentProfile, LandlordProfile, CaretakerProfile, UserActivityLog, Conversation, Message
from .utils import validate_password_strength


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration"""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=['student', 'landlord'])
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate(self, data):
        # Check password match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")

        # Validate password strength
        validate_password_strength(data['password'])

        return data


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField()
    password = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'is_verified', 'phone_number', 'profile_picture',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'date_joined', 'last_login']

    def to_representation(self, instance):
        """Customize output based on user role"""
        data = super().to_representation(instance)

        if instance.role == 'student':
            try:
                profile = instance.student_profile
                data['profile'] = {
                    'university': profile.university,
                    'student_id_number': profile.student_id_number,
                    'year_of_study': profile.year_of_study,
                    'course': profile.course,
                    'lifestyle_preferences': profile.lifestyle_preferences,
                    'bio': profile.bio,
                    'emergency_contact_name': profile.emergency_contact_name,
                    'emergency_contact_phone': profile.emergency_contact_phone,
                    'emergency_contact_relationship': profile.emergency_contact_relationship,
                    'is_profile_complete': profile.is_profile_complete
                }
            except:
                data['profile'] = None

        elif instance.role == 'landlord':
            try:
                profile = instance.landlord_profile
                data['profile'] = {
                    'company_name': profile.company_name,
                    'national_id': profile.national_id,
                    'business_address': profile.business_address,
                    'bank_name': profile.bank_name,
                    'bank_account_number': profile.bank_account_number,
                    'is_verified': profile.is_verified,
                    'verified_at': profile.verified_at,
                    'paystack_subaccount_code': profile.paystack_subaccount_code,
                    'can_list_hostels': profile.is_verified,
                    'total_hostels': profile.total_hostels,
                    'total_rooms': profile.total_rooms,
                    'total_earnings': float(profile.total_earnings)
                }
            except:
                data['profile'] = None

        elif instance.role == 'caretaker':
            try:
                profile = instance.caretaker_profile
                data['profile'] = {
                    'national_id': profile.national_id,
                    'hostel': {
                        'hostel_id': profile.hostel.id,
                        'hostel_name': profile.hostel.name,
                        'landlord_name': profile.landlord.company_name or profile.landlord.user.get_full_name()
                    },
                    'employment_start_date': profile.employment_start_date,
                    'is_active': profile.is_active,
                    'permissions': profile.permissions,
                    'emergency_contact_name': profile.emergency_contact_name,
                    'emergency_contact_phone': profile.emergency_contact_phone
                }
            except:
                data['profile'] = None

        return data


class CaretakerCreateSerializer(serializers.Serializer):
    """Serializer for creating caretakers"""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    national_id = serializers.CharField(max_length=20)
    hostel_id = serializers.IntegerField()
    employment_start_date = serializers.DateField()
    salary_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    payment_method = serializers.ChoiceField(
        choices=['mpesa', 'bank_transfer', 'cash', 'not_tracked'],
        default='not_tracked'
    )
    emergency_contact_name = serializers.CharField(max_length=200)
    emergency_contact_phone = serializers.CharField(max_length=15)
    permissions = serializers.JSONField(required=False)


class CaretakerUpdateSerializer(serializers.Serializer):
    """Serializer for updating caretakers"""

    phone_number = serializers.CharField(max_length=15, required=False)
    salary_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    payment_method = serializers.ChoiceField(
        choices=['mpesa', 'bank_transfer', 'cash', 'not_tracked'],
        required=False
    )
    permissions = serializers.JSONField(required=False)


class UserActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for user activity logs"""

    class Meta:
        model = UserActivityLog
        fields = [
            'id', 'action_type', 'action_description',
            'ip_address', 'created_at'
        ]


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""

    token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)

    def validate(self, data):
        # Check password match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")

        # Validate password strength
        validate_password_strength(data['new_password'])

        return data


class OTPVerificationSerializer(serializers.Serializer):
    """Serializer for OTP verification"""

    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)


class LandlordVerificationSerializer(serializers.Serializer):
    """Serializer for landlord verification"""

    verification_status = serializers.ChoiceField(choices=['approved', 'rejected'])
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""

    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_profile_picture = serializers.URLField(source='sender.profile_picture', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'sender_profile_picture',
            'content', 'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'sender_name', 'sender_profile_picture', 'is_read', 'read_at', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for chat conversations"""

    participants = UserProfileSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'last_message',
            'unread_count', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_other_participant(self, obj):
        """Get the other participant in the conversation"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return UserProfileSerializer(other_user).data
        return None

    def get_last_message(self, obj):
        """Get the last message in the conversation"""
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_unread_count(self, obj):
        """Get count of unread messages for the current user"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.messages.filter(sender__id=request.user.id, is_read=False).count()
        return 0


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending messages"""

    recipient_id = serializers.IntegerField()
    content = serializers.CharField(max_length=1000)

    def validate_recipient_id(self, value):
        """Validate that recipient exists and is not the sender"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.id == value:
            raise serializers.ValidationError("You cannot send messages to yourself")
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient does not exist")
        return value