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
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role = serializers.ChoiceField(choices=['student', 'landlord'])
    # Common fields
    phone_number = serializers.CharField(max_length=15, required=True)
    
    # Student specific fields
    gender = serializers.ChoiceField(choices=['male', 'female', 'other'], required=False)
    date_of_birth = serializers.DateField(required=False)
    university = serializers.CharField(max_length=255, required=False)
    preferred_hostel_id = serializers.IntegerField(required=False)
    room_number = serializers.CharField(max_length=20, required=False)
    
    # Landlord specific fields
    company_name = serializers.CharField(max_length=255, required=False)
    total_units = serializers.IntegerField(required=False)

    def validate(self, data):
        # Check password match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")

        # Role-specific validation
        role = data.get('role')
        if role == 'student':
            if not data.get('gender'):
                raise serializers.ValidationError({"gender": "Gender is required for students"})
            if not data.get('date_of_birth'):
                raise serializers.ValidationError({"date_of_birth": "Date of birth is required for students"})
            if not data.get('university'):
                raise serializers.ValidationError({"university": "School name is required for students"})
        elif role == 'landlord':
            if not data.get('company_name'):
                raise serializers.ValidationError({"company_name": "Property name is required for landlords"})

        # Validate password strength
        validate_password_strength(data['password'])

        return data


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField()
    password = serializers.CharField()


    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)
    
    # Student Profile Fields (Write Only)
    university = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    student_id_number = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    year_of_study = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    graduation_year = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    course = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    campus = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    high_school = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    bio = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    emergency_contact_name = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    emergency_contact_phone = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    emergency_contact_relationship = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    urls = serializers.JSONField(required=False, write_only=True, allow_null=True) # Social links wrapper

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'is_verified', 'phone_number', 'profile_picture',
            'date_joined', 'last_login',
            # Write-only fields for unified updates
            'university', 'student_id_number', 'year_of_study', 'graduation_year',
            'course', 'campus', 'high_school', 'bio',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'urls'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'date_joined', 'last_login']

    def update(self, instance, validated_data):
        """
        Update user and profile data with atomic transaction safety.
        Automatically routes fields to User or Role-based Profile models.
        """
        from django.db import transaction
        
        # fields belonging to StudentProfile
        profile_fields = {
            'university', 'student_id_number', 'year_of_study', 'graduation_year',
            'course', 'campus', 'high_school', 'bio',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
        }
        
        with transaction.atomic():
            # 1. Update User Model Fields
            for attr, value in validated_data.items():
                if attr not in profile_fields and attr != 'urls':
                    setattr(instance, attr, value)
            instance.save()

            # 2. Update Student Profile Fields (if applicable)
            if instance.role == 'student':
                student_profile, _ = StudentProfile.objects.get_or_create(user=instance)
                
                # Update standard profile fields
                for field in profile_fields:
                    if field in validated_data:
                        setattr(student_profile, field, validated_data[field])

                # Update Social Links (stored in lifestyle_preferences)
                if 'urls' in validated_data and validated_data['urls']:
                    # Ensure lifestyle_preferences is a dict
                    prefs = student_profile.lifestyle_preferences or {}
                    if not isinstance(prefs, dict):
                         prefs = {}
                    
                    # Merge or set socials
                    prefs['socials'] = validated_data['urls']
                    student_profile.lifestyle_preferences = prefs

                student_profile.save()

            # 3. Update Landlord Profile (if applicable)
            elif instance.role == 'landlord':
                landlord_profile, _ = LandlordProfile.objects.get_or_create(user=instance)
                
                landlord_fields = {
                    'company_name', 'national_id', 'business_address', 
                    'bank_name', 'bank_account_number'
                }
                
                for field in landlord_fields:
                    if field in validated_data:
                        setattr(landlord_profile, field, validated_data[field])
                
                landlord_profile.save()

        return instance

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
                    'graduation_year': profile.graduation_year,
                    'course': profile.course,
                    'campus': profile.campus,
                    'high_school': profile.high_school,
                    'lifestyle_preferences': profile.lifestyle_preferences,
                    'bio': profile.bio,
                    'emergency_contact_name': profile.emergency_contact_name,
                    'emergency_contact_phone': profile.emergency_contact_phone,
                    'emergency_contact_relationship': profile.emergency_contact_relationship,
                    'is_profile_complete': profile.is_profile_complete,
                    'profile_completion_percentage': profile.profile_completion_percentage
                }
                # Inject social URLs back into the response for frontend convenience
                if profile.lifestyle_preferences and isinstance(profile.lifestyle_preferences, dict):
                     data['urls'] = profile.lifestyle_preferences.get('socials', {})

            except StudentProfile.DoesNotExist:
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


class BasicUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for basic user profile information (used in lists/chats)"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_picture', 'role']


    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_picture', 'role']


class PublicUserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for PUBLIC profile view (Discovery Mode).
    Strictly excludes sensitive contact info (Email, Phone, Emergency Contacts).
    """
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'profile_picture', 'profile'] 
        # Note: No last_name, email, or phone for detailed privacy in discovery

    def get_profile(self, obj):
        try:
            profile = obj.student_profile
            return {
                'university': profile.university,
                'course': profile.course,
                'year_of_study': profile.year_of_study,
                'campus': profile.campus,
                'bio': profile.bio,
                'lifestyle_preferences': profile.lifestyle_preferences, # Safe (Quiz results)
                'profile_completion_percentage': profile.profile_completion_percentage
            }
        except StudentProfile.DoesNotExist:
            return None


class FullUserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for OWNER profile management.
    Allows reading and updating ALL fields including sensitive ones.
    """
    # Student Profile Fields (Write/Read)
    university = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    student_id_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    year_of_study = serializers.IntegerField(required=False, allow_null=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    course = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    campus = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    high_school = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    emergency_contact_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    emergency_contact_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    emergency_contact_relationship = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    lifestyle_preferences = serializers.JSONField(required=False, allow_null=True)
    # Landlord Profile Fields (Write/Read)
    company_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    business_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bank_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bank_account_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    urls = serializers.JSONField(required=False, allow_null=True) # Social links wrapper
    
    profile = serializers.SerializerMethodField() # For reading structured data

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number', 'profile_picture', 'role',
            'university', 'student_id_number', 'year_of_study', 'graduation_year',
            'course', 'campus', 'high_school', 'bio',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'lifestyle_preferences',
            'company_name', 'national_id', 'business_address', 'bank_name', 'bank_account_number',
            'urls', 'profile'
        ]
        read_only_fields = ['id', 'email', 'role']

    def get_profile(self, obj):
        """Include the full nested profile object for frontend convenience"""
        if obj.role == 'student':
            try:
                profile = obj.student_profile
                return {
                    'university': profile.university,
                    'student_id_number': profile.student_id_number,
                    'is_profile_complete': profile.is_profile_complete,
                    'profile_completion_percentage': profile.profile_completion_percentage
                }
            except:
                return None
        return None

    def update(self, instance, validated_data):
        """
        Update user and profile data with atomic transaction safety.
        Automatically routes fields to User or Role-based Profile models.
        """
        from django.db import transaction
        from .models import StudentProfile
        
        # fields belonging to StudentProfile
        profile_fields = {
            'university', 'student_id_number', 'year_of_study', 'graduation_year',
            'course', 'campus', 'high_school', 'bio',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'lifestyle_preferences'
        }
        
        with transaction.atomic():
            # 1. Update User Model Fields
            user_data = {k: v for k, v in validated_data.items() if k not in profile_fields and k != 'urls' and k != 'profile'}
            for attr, value in user_data.items():
                setattr(instance, attr, value)
            instance.save()

            # 2. Update Student Profile Fields (if applicable)
            if instance.role == 'student':
                student_profile, _ = StudentProfile.objects.get_or_create(user=instance)
                
                # Handle standard profile fields
                for field in profile_fields:
                    if field in validated_data and field != 'lifestyle_preferences':
                        setattr(student_profile, field, validated_data[field])

                # Handle lifestyle_preferences (Merge logic)
                incoming_prefs = validated_data.get('lifestyle_preferences')
                if incoming_prefs is not None:
                    current_prefs = student_profile.lifestyle_preferences or {}
                    if not isinstance(current_prefs, dict):
                        current_prefs = {}
                    
                    # Deep merge if incoming is dict
                    if isinstance(incoming_prefs, dict):
                        current_prefs.update(incoming_prefs)
                        student_profile.lifestyle_preferences = current_prefs
                    else:
                        student_profile.lifestyle_preferences = incoming_prefs

                # Handle "urls" mapping to lifestyle_preferences['socials']
                if 'urls' in validated_data:
                    prefs = student_profile.lifestyle_preferences or {}
                    if not isinstance(prefs, dict):
                         prefs = {}
                    prefs['socials'] = validated_data['urls']
                    student_profile.lifestyle_preferences = prefs
                
                student_profile.save()

            # 3. Update Landlord Profile (if applicable)
            elif instance.role == 'landlord':
                landlord_profile, _ = LandlordProfile.objects.get_or_create(user=instance)
                
                landlord_fields = {
                    'company_name', 'national_id', 'business_address', 
                    'bank_name', 'bank_account_number'
                }
                
                for field in landlord_fields:
                    if field in validated_data:
                        setattr(landlord_profile, field, validated_data[field])
                
                landlord_profile.save()

        return instance



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

    participants = BasicUserProfileSerializer(many=True, read_only=True)
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
                return BasicUserProfileSerializer(other_user).data
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