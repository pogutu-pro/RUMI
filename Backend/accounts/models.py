from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
import uuid
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserManager(BaseUserManager):
    """Custom manager for User model with role-based creation"""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Extended Django User model with role-based authentication"""

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('landlord', 'Landlord'),
        ('caretaker', 'Caretaker'),
        ('tech_support', 'Tech Support Admin'),
        ('super_admin', 'Super Admin'),
    ]

    ONBOARDING_STAGE_CHOICES = [
        ('REGISTERED', 'Registered'),
        ('ROLE_SELECTED', 'Role Selected'),
        ('IDENTITY_DRAFT', 'Identity Draft'),
        ('IDENTITY_VERIFIED', 'Identity Verified'),
        ('VERIFICATION_PENDING', 'Verification Pending'),
        ('COMPLETED', 'Completed'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    email = models.EmailField(
        unique=True,
        validators=[RegexValidator(
            regex=r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$',
            message='Enter a valid email address.'
        )]
    )
    password = models.CharField(max_length=128)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student'
    )
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        null=True
    )
    date_of_birth = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[RegexValidator(
            regex=r'^\+254[0-9]{9}$',
            message='Phone number must be in format: +254XXXXXXXXX'
        )]
    )
    profile_picture = models.URLField(blank=True, null=True)
    onboarding_stage = models.CharField(
        max_length=50,
        choices=ONBOARDING_STAGE_CHOICES,
        default='REGISTERED',
        db_index=True
    )
    capabilities = models.JSONField(
        default=list,
        blank=True,
        help_text="List of grantable capabilities (e.g. ['hostel:operate', 'tenant:offboard'])"
    )
    last_login = models.DateTimeField(blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    class Meta:
        db_table = 'accounts_user'
        indexes = [
            models.Index(fields=['email'], name='idx_user_email'),
            models.Index(fields=['role'], name='idx_user_role'),
            models.Index(fields=['is_active', 'is_verified'], name='idx_user_active_verified'),
        ]

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class StudentProfile(models.Model):
    """Student-specific profile data and preferences"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    university = models.CharField(max_length=255, blank=True, null=True)
    student_id_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    year_of_study = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(7)]
    )
    graduation_year = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(2020), MaxValueValidator(2030)]
    )
    course = models.CharField(max_length=255, blank=True, null=True)
    campus = models.CharField(max_length=255, blank=True, null=True)
    high_school = models.CharField(max_length=255, blank=True, null=True)
    preferred_hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='prospective_students'
    )
    preferred_room_number = models.CharField(max_length=20, blank=True, null=True)
    draft_data = models.JSONField(default=dict, blank=True)
    lifestyle_preferences = models.JSONField(blank=True, null=True)
    bio = models.TextField(
        blank=True,
        null=True,
        validators=[MaxLengthValidator(500)]
    )
    emergency_contact_name = models.CharField(max_length=200, blank=True, null=True)
    emergency_contact_phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[RegexValidator(
            regex=r'^\+254[0-9]{9}$',
            message='Emergency contact phone must be in format: +254XXXXXXXXX'
        )]
    )
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True)
    is_profile_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_studentprofile'
        indexes = [
            models.Index(fields=['user'], name='idx_student_user'),
            models.Index(fields=['university'], name='idx_student_university'),
            models.Index(fields=['student_id_number'], name='idx_student_id_number'),
            models.Index(fields=['is_profile_complete'], name='idx_student_complete'),
        ]

    @property
    def profile_completion_percentage(self):
        """Calculate percentage of profile completion"""
        fields_to_check = [
            self.university,
            self.student_id_number,
            self.year_of_study,
            self.course,
            self.campus,
            self.high_school,
            self.bio,
            self.emergency_contact_name,
            self.emergency_contact_phone,
            self.emergency_contact_relationship,
            self.user.first_name,
            self.user.last_name,
            self.user.phone_number,
            self.user.profile_picture or self.user.avatar,
        ]
        
        filled_fields = [f for f in fields_to_check if f]
        if not fields_to_check:
            return 0
        return int((len(filled_fields) / len(fields_to_check)) * 100)

    def save(self, *args, **kwargs):
        """Auto-calculate profile completion status"""
        self.is_profile_complete = self.validate_readiness(raise_exception=False)
        super().save(*args, **kwargs)

    def validate_readiness(self, raise_exception=True):
        """
        Strict validation check before finalizing onboarding.
        Returns True if ready, raises ValidationError or returns False otherwise.
        """
        required_fields = [
            (self.university, "University"),
            (self.student_id_number, "Student ID Number"),
            (self.year_of_study, "Year of Study"),
            (self.user.phone_number, "Phone Number"),
            (self.emergency_contact_name, "Emergency Contact Name"),
            (self.emergency_contact_phone, "Emergency Contact Phone"),
        ]
        
        missing = [name for field, name in required_fields if not field]
        
        if missing:
            if raise_exception:
                from django.core.exceptions import ValidationError
                raise ValidationError(f"Missing required fields: {', '.join(missing)}")
            return False
        return True

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.university}"


class LandlordProfile(models.Model):
    """Landlord/Property Manager profile data"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='landlord_profile'
    )
    company_name = models.CharField(max_length=255, blank=True, null=True)
    national_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        validators=[MinLengthValidator(5), MaxLengthValidator(20)]
    )
    business_address = models.TextField(blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=20, blank=True, null=True)
    bank_code = models.CharField(max_length=10, blank=True, null=True)
    draft_data = models.JSONField(default=dict, blank=True)
    paystack_subaccount_code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    total_units = models.IntegerField(default=0, validators=[MinValueValidator(0)], blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_profile_complete = models.BooleanField(default=False)
    verification_documents = models.JSONField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='verified_landlords'
    )
    total_hostels = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_rooms = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_earnings = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_landlordprofile'
        indexes = [
            models.Index(fields=['user'], name='idx_landlord_user'),
            models.Index(fields=['national_id'], name='idx_landlord_national_id'),
            models.Index(fields=['is_verified'], name='idx_landlord_verified'),
            models.Index(fields=['paystack_subaccount_code'], name='idx_landlord_paystack'),
        ]

    def save(self, *args, **kwargs):
        """Auto-calculate profile completion status"""
        self.is_profile_complete = self.validate_readiness(raise_exception=False)
        super().save(*args, **kwargs)

    def validate_readiness(self, raise_exception=True):
        """Strict validation for Landlord onboarding finalization"""
        required_fields = [
            (self.company_name or self.user.get_full_name(), "Company/Name"),
            (self.national_id, "National ID"),
            (self.bank_name, "Bank Name"),
            (self.bank_account_number, "Bank Account Number"),
            (self.user.phone_number, "Phone Number"),
        ]
        
        missing = [name for field, name in required_fields if not field]
        
        if missing:
            if raise_exception:
                from django.core.exceptions import ValidationError
                raise ValidationError(f"Missing required fields: {', '.join(missing)}")
            return False
        return True

    def __str__(self):
        return f"{self.company_name or self.user.get_full_name()} - {self.national_id}"


class CaretakerProfile(models.Model):
    """On-site property manager profile data"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='caretaker_profile'
    )

    national_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        validators=[MinLengthValidator(5), MaxLengthValidator(20)]
    )
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='caretakers'
    )
    landlord = models.ForeignKey(
        LandlordProfile,
        on_delete=models.CASCADE,
        related_name='caretakers',
        null=True,
        blank=True
    )
    draft_data = models.JSONField(default=dict, blank=True)
    employment_start_date = models.DateField(blank=True, null=True)
    employment_end_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    permissions = models.JSONField(default=dict)
    emergency_contact_name = models.CharField(max_length=200)
    emergency_contact_phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\+254[0-9]{9}$',
            message='Emergency contact phone must be in format: +254XXXXXXXXX'
        )]
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_caretakers'
    )
    
    def validate_readiness(self, raise_exception=True):
        """Strict validation for Caretaker onboarding"""
        required_fields = [
            (self.hostel, "Assigned Hostel"),
            (self.national_id, "National ID"),
            (self.user.phone_number, "Phone Number"),
        ]
        
        missing = [name for field, name in required_fields if not field]
        
        if missing:
            if raise_exception:
                from django.core.exceptions import ValidationError
                raise ValidationError(f"Missing required fields: {', '.join(missing)}")
            return False
        return True

    class Meta:
        db_table = 'accounts_caretakerprofile'
        indexes = [
            models.Index(fields=['user'], name='idx_caretaker_user'),
            models.Index(fields=['hostel'], name='idx_caretaker_hostel'),
            models.Index(fields=['landlord'], name='idx_caretaker_landlord'),
            models.Index(fields=['is_active', 'hostel'], name='idx_caretaker_active'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(employment_end_date__isnull=True) | models.Q(employment_end_date__gte=models.F('employment_start_date')),
                name='check_employment_dates'
            ),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.hostel.name}"


class OTPVerification(models.Model):
    """Temporary storage for email/phone verification codes"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(
        max_length=6,
        validators=[RegexValidator(regex=r'^[0-9]{6}$', message='OTP must be 6 digits')]
    )
    verification_type = models.CharField(
        max_length=20,
        choices=[('email', 'Email'), ('phone', 'Phone')],
        default='email'
    )
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(blank=True, null=True)
    attempts = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        db_table = 'accounts_otpverification'
        indexes = [
            models.Index(fields=['user', 'verification_type'], name='idx_otp_user_type'),
            models.Index(fields=['expires_at'], name='idx_otp_expiry'),
            models.Index(fields=['user', 'is_used', 'expires_at'], name='idx_otp_active'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(expires_at__gt=models.F('created_at')),
                name='check_otp_expiry'
            ),
            models.CheckConstraint(
                check=models.Q(attempts__gte=0) & models.Q(attempts__lte=5),
                name='check_otp_attempts'
            ),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.email} ({self.verification_type})"


class PasswordResetToken(models.Model):
    """Secure password reset token storage"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        db_table = 'accounts_passwordresettoken'
        indexes = [
            models.Index(fields=['token'], name='idx_reset_token'),
            models.Index(fields=['user'], name='idx_reset_user'),
            models.Index(fields=['expires_at'], name='idx_reset_expiry'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(expires_at__gt=models.F('created_at')),
                name='check_reset_expiry'
            ),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Reset token for {self.user.email}"


class UserActivityLog(models.Model):
    """Audit trail for user actions"""

    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('register', 'Register'),
        ('password_reset', 'Password Reset'),
        ('profile_update', 'Profile Update'),
        ('permission_change', 'Permission Change'),
        ('verification', 'Verification'),
        ('failed_login', 'Failed Login'),
        ('account_deactivation', 'Account Deactivation'),
        ('account_reactivation', 'Account Reactivation'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='activity_logs'
    )
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    action_description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'accounts_useractivitylog'
        indexes = [
            models.Index(fields=['user'], name='idx_activity_user'),
            models.Index(fields=['action_type'], name='idx_activity_type'),
            models.Index(fields=['created_at'], name='idx_activity_created'),
        ]

    def __str__(self):
        return f"{self.user.email if self.user else 'Anonymous'} - {self.action_type} at {self.created_at}"


class Conversation(models.Model):
    """Chat conversation between two users"""

    participants = models.ManyToManyField(
        User,
        related_name='conversations',
        help_text='Users participating in this conversation'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'accounts_conversation'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['updated_at'], name='idx_conversation_updated'),
            models.Index(fields=['is_active'], name='idx_conversation_active'),
        ]

    def __str__(self):
        participants_names = [user.get_full_name() for user in self.participants.all()]
        return f"Chat between {', '.join(participants_names)}"

    def get_other_participant(self, user):
        """Get the other participant in a two-person conversation"""
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    """Individual message in a conversation"""

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(
        validators=[MaxLengthValidator(1000)],
        help_text='Message content (max 1000 characters)'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'accounts_message'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at'], name='idx_message_conversation_time'),
            models.Index(fields=['sender'], name='idx_message_sender'),
            models.Index(fields=['is_read'], name='idx_message_read'),
        ]

    def __str__(self):
        return f"Message from {self.sender.get_full_name()} at {self.created_at}"

    def mark_as_read(self):
        """Mark message as read and set read timestamp"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


# Import subscription models to register them with Django
try:
    from .subscription_models import (
        SubscriptionPlan, LandlordSubscription,
        SubscriptionPayment, FeatureAccess
    )
except ImportError:
    pass  # Models will be imported after migration
except Exception:
    pass


@receiver(post_save, sender=LandlordProfile)
def create_landlord_subscription_and_features(sender, instance, created, **kwargs):
    """
    Automatically create subscription and feature access when landlord profile is created
    """
    if created:
        # Get or create trial plan
        try:
            trial_plan = SubscriptionPlan.objects.get(slug='free-trial')
        except SubscriptionPlan.DoesNotExist:
            # Create default trial plan if it doesn't exist
            trial_plan = SubscriptionPlan.objects.create(
                name='Free Trial',
                slug='free-trial',
                plan_type='trial',
                billing_type='fixed',
                fixed_price=Decimal('0.00'),
                trial_duration_days=30,
                description='1 month free trial with full access to all features',
                features={
                    'all_features': True,
                    'unlimited_access': True
                }
            )
        
        # Calculate trial dates
        trial_start = timezone.now().date()
        trial_end = trial_start + timezone.timedelta(days=30)
        
        # Create subscription with trial
        subscription = LandlordSubscription.objects.create(
            landlord=instance,
            plan=trial_plan,
            status='trial',
            current_period_start=trial_start,
            current_period_end=trial_end,
            next_billing_date=trial_end + timezone.timedelta(days=1),
            trial_start=trial_start,
            trial_end=trial_end,
            is_trial_used=True
        )
        
        # Create feature access (trial gets all features)
        feature_access = FeatureAccess.objects.create(landlord=instance)
        feature_access.sync_with_subscription()