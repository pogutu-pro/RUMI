"""
Subscription models for RUMI platform landlord subscriptions
"""
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class SubscriptionPlan(models.Model):
    """Available subscription plans for landlords"""
    
    PLAN_TYPE_CHOICES = [
        ('trial', 'Free Trial'),
        ('basic', 'Basic Plan'),
        ('medium', 'Medium Plan'),
        ('advanced', 'Advanced Plan'),
    ]
    
    BILLING_TYPE_CHOICES = [
        ('fixed', 'Fixed Monthly Fee'),
        ('revenue', 'Revenue-Based (% of rent)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    billing_type = models.CharField(max_length=20, choices=BILLING_TYPE_CHOICES)
    
    # Pricing
    fixed_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Fixed monthly price (KES)"
    )
    revenue_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of rent revenue (for revenue-based plans)"
    )
    
    # Trial settings
    trial_duration_days = models.IntegerField(
        default=0,
        help_text="Trial period in days (0 = no trial)"
    )
    
    # Features (JSONB for flexibility)
    features = models.JSONField(default=dict, help_text="Plan features and limits")
    
    # Metadata
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0, help_text="Display order")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_subscriptionplan'
        ordering = ['sort_order', 'fixed_price']
        indexes = [
            models.Index(fields=['slug'], name='idx_plan_slug'),
            models.Index(fields=['plan_type'], name='idx_plan_type'),
            models.Index(fields=['is_active'], name='idx_plan_active'),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"
    
    def calculate_monthly_fee(self, total_rent_collected):
        """Calculate subscription fee based on plan type"""
        if self.billing_type == 'fixed':
            return self.fixed_price
        elif self.billing_type == 'revenue':
            return total_rent_collected * (self.revenue_percentage / 100)
        return Decimal('0.00')


class LandlordSubscription(models.Model):
    """Track landlord subscription status"""
    
    STATUS_CHOICES = [
        ('trial', 'Free Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord = models.OneToOneField(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    
    # Subscription status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    
    # Billing info
    current_period_start = models.DateField()
    current_period_end = models.DateField()
    next_billing_date = models.DateField()
    
    # Trial tracking
    trial_start = models.DateField(null=True, blank=True)
    trial_end = models.DateField(null=True, blank=True)
    is_trial_used = models.BooleanField(default=False)
    
    # Revenue tracking (for medium plan)
    total_rent_collected_this_period = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total rent collected in current billing period"
    )
    calculated_fee_this_period = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Calculated subscription fee for current period"
    )
    
    # Auto-renewal
    auto_renew = models.BooleanField(default=True)
    cancel_at_period_end = models.BooleanField(default=False)
    
    # Payment tracking
    last_payment_date = models.DateField(null=True, blank=True)
    last_payment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'accounts_landlordsubscription'
        indexes = [
            models.Index(fields=['landlord'], name='idx_sub_landlord'),
            models.Index(fields=['status'], name='idx_sub_status'),
            models.Index(fields=['next_billing_date'], name='idx_sub_billing'),
            models.Index(fields=['trial_end'], name='idx_sub_trial_end'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(current_period_end__gte=models.F('current_period_start')),
                name='check_period_dates'
            ),
        ]
    
    def __str__(self):
        return f"{self.landlord.user.get_full_name()} - {self.plan.name} ({self.status})"
    
    def is_active_or_trial(self):
        """Check if subscription allows platform access"""
        return self.status in ['trial', 'active']
    
    def days_until_billing(self):
        """Calculate days until next billing"""
        today = timezone.now().date()
        return (self.next_billing_date - today).days
    
    def is_trial_active(self):
        """Check if trial period is still valid"""
        if not self.trial_end:
            return False
        return timezone.now().date() <= self.trial_end and self.status == 'trial'


class SubscriptionPayment(models.Model):
    """Track subscription payment history"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        LandlordSubscription,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    
    # Revenue-based calculation (for medium plan)
    rent_revenue_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total rent collected (for revenue-based plans)"
    )
    
    # Payment processing
    payment_method = models.CharField(max_length=50, default='paystack')
    transaction_reference = models.CharField(max_length=100, unique=True)
    paystack_reference = models.CharField(max_length=100, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    initiated_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'accounts_subscriptionpayment'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['subscription'], name='idx_subpay_subscription'),
            models.Index(fields=['status'], name='idx_subpay_status'),
            models.Index(fields=['transaction_reference'], name='idx_subpay_txn_ref'),
            models.Index(fields=['paid_at'], name='idx_subpay_paid_at'),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_reference} - {self.amount} KES ({self.status})"


class FeatureAccess(models.Model):
    """Track feature access and usage for landlords"""
    
    landlord = models.OneToOneField(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='feature_access'
    )
    
    # Core features (always available)
    can_create_hostels = models.BooleanField(default=True)
    can_manage_rooms = models.BooleanField(default=True)
    can_process_payments = models.BooleanField(default=True)
    can_create_caretakers = models.BooleanField(default=True)
    
    # Basic plan features
    can_use_recurring_payments = models.BooleanField(default=False)
    can_use_inventory_management = models.BooleanField(default=False)
    can_view_basic_analytics = models.BooleanField(default=True)
    
    # Medium plan features
    can_access_marketplace = models.BooleanField(default=False)
    can_view_advanced_analytics = models.BooleanField(default=False)
    can_generate_custom_reports = models.BooleanField(default=False)
    can_use_bulk_operations = models.BooleanField(default=False)
    
    # Advanced plan features
    can_use_ai_features = models.BooleanField(default=False)
    can_use_predictive_analytics = models.BooleanField(default=False)
    can_use_smart_pricing = models.BooleanField(default=False)
    can_use_api_access = models.BooleanField(default=False)
    can_use_white_label = models.BooleanField(default=False)
    can_auto_screen_tenants = models.BooleanField(default=False)
    
    # Usage tracking
    last_feature_sync = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_featureaccess'
        indexes = [
            models.Index(fields=['landlord'], name='idx_feature_landlord'),
        ]
    
    def __str__(self):
        return f"Feature Access for {self.landlord.user.get_full_name()}"
    
    def sync_with_subscription(self):
        """Update feature access based on current subscription plan"""
        try:
            subscription = self.landlord.subscription
            if not subscription.is_active_or_trial():
                # Disable all premium features if subscription inactive
                self.disable_all_premium_features()
                return
            
            plan_type = subscription.plan.plan_type
            
            # Reset all features
            self.enable_core_features()
            
            if plan_type in ['trial', 'basic', 'medium', 'advanced']:
                self.enable_basic_features()
            
            if plan_type in ['trial', 'medium', 'advanced']:
                self.enable_medium_features()
            
            if plan_type in ['trial', 'advanced']:
                self.enable_advanced_features()
            
            self.save()
        except Exception:
            self.disable_all_premium_features()
    
    def enable_core_features(self):
        """Enable core features (always available)"""
        self.can_create_hostels = True
        self.can_manage_rooms = True
        self.can_process_payments = True
        self.can_create_caretakers = True
        self.can_view_basic_analytics = True
    
    def enable_basic_features(self):
        """Enable basic plan features"""
        self.can_use_recurring_payments = True
        self.can_use_inventory_management = True
    
    def enable_medium_features(self):
        """Enable medium plan features"""
        self.can_access_marketplace = True
        self.can_view_advanced_analytics = True
        self.can_generate_custom_reports = True
        self.can_use_bulk_operations = True
    
    def enable_advanced_features(self):
        """Enable advanced plan features"""
        self.can_use_ai_features = True
        self.can_use_predictive_analytics = True
        self.can_use_smart_pricing = True
        self.can_use_api_access = True
        self.can_use_white_label = True
        self.can_auto_screen_tenants = True
    
    def disable_all_premium_features(self):
        """Disable all premium features"""
        # Keep only core features
        self.can_use_recurring_payments = False
        self.can_use_inventory_management = False
        self.can_access_marketplace = False
        self.can_view_advanced_analytics = False
        self.can_generate_custom_reports = False
        self.can_use_bulk_operations = False
        self.can_use_ai_features = False
        self.can_use_predictive_analytics = False
        self.can_use_smart_pricing = False
        self.can_use_api_access = False
        self.can_use_white_label = False
        self.can_auto_screen_tenants = False
        self.save()