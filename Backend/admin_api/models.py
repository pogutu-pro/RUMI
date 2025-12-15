from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class SystemActivity(models.Model):
    """
    System-wide activity feed for admin dashboard
    Tracks all important system events for administrative oversight
    """
    ACTIVITY_TYPES = [
        ('user_registration', 'User Registration'),
        ('user_login', 'User Login'),
        ('user_deactivation', 'User Deactivation'),
        ('landlord_verification', 'Landlord Verification'),
        ('hostel_submission', 'Hostel Submission'),
        ('hostel_approval', 'Hostel Approval'),
        ('hostel_rejection', 'Hostel Rejection'),
        ('booking_created', 'Booking Created'),
        ('booking_confirmed', 'Booking Confirmed'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('payment_initiated', 'Payment Initiated'),
        ('payment_completed', 'Payment Completed'),
        ('payment_failed', 'Payment Failed'),
        ('subscription_upgrade', 'Subscription Upgrade'),
        ('subscription_cancellation', 'Subscription Cancellation'),
        ('dispute_opened', 'Dispute Opened'),
        ('dispute_resolved', 'Dispute Resolved'),
        ('support_ticket_created', 'Support Ticket Created'),
        ('support_ticket_resolved', 'Support Ticket Resolved'),
        ('system_maintenance', 'System Maintenance'),
        ('security_alert', 'Security Alert'),
    ]

    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='system_activities'
    )
    user_role = models.CharField(max_length=20, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    severity = models.CharField(
        max_length=20, 
        choices=[
            ('info', 'Info'),
            ('warning', 'Warning'),
            ('error', 'Error'),
            ('critical', 'Critical')
        ],
        default='info'
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'admin_system_activity'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['activity_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return f"{self.activity_type}: {self.title}"


class HostelModeration(models.Model):
    """
    Hostel moderation workflow for admin approval/rejection
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('flagged', 'Flagged for Review'),
    ]

    hostel = models.OneToOneField('hostels.Hostel', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_hostels'
    )
    admin_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    verification_checklist = models.JSONField(default=list)
    review_duration_hours = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'admin_hostel_moderation'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['submitted_at']),
        ]

    def save(self, *args, **kwargs):
        if self.reviewed_at and not self.review_duration_hours:
            self.review_duration_hours = int(
                (self.reviewed_at - self.submitted_at).total_seconds() / 3600
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Moderation: {self.hostel.name} - {self.status}"


class PaymentDispute(models.Model):
    """
    Payment dispute management for admin resolution
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    dispute_id = models.CharField(max_length=20, unique=True)  # User-facing ID
    transaction = models.ForeignKey('payments.Transaction', on_delete=models.CASCADE)
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE)
    reason = models.TextField()
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    amount_disputed = models.DecimalField(max_digits=10, decimal_places=2)
    evidence = models.JSONField(default=list, blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='resolved_disputes'
    )
    resolution_notes = models.TextField(blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = 'admin_payment_disputes'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['submitted_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.dispute_id:
            # Generate dispute ID like "DIS-2024-001"
            year = timezone.now().year
            count = PaymentDispute.objects.filter(
                submitted_at__year=year
            ).count() + 1
            self.dispute_id = f"DIS-{year}-{count:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.dispute_id}: {self.reason[:50]}"


class AdminSubscription(models.Model):
    """
    Extended subscription tracking for admin oversight
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('trialing', 'Trialing'),
        ('unpaid', 'Unpaid'),
    ]

    landlord = models.OneToOneField('accounts.LandlordProfile', on_delete=models.CASCADE)
    subscription = models.OneToOneField('accounts.LandlordSubscription', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    monthly_recurring_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    churn_risk_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        default=0.0
    )
    last_payment_attempt = models.DateTimeField(blank=True, null=True)
    payment_failures = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_subscriptions'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['churn_risk_score']),
        ]

    def __str__(self):
        return f"{self.landlord.user.email}: {self.status}"


class UserSuspension(models.Model):
    """
    User suspension management
    """
    REASON_CHOICES = [
        ('payment_default', 'Payment Default'),
        ('policy_violation', 'Policy Violation'),
        ('harassment', 'Harassment'),
        ('fraud', 'Fraud'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField()
    suspended_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='suspended_users'
    )
    suspended_at = models.DateTimeField(default=timezone.now)
    suspended_until = models.DateTimeField(blank=True, null=True)
    is_permanent = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    appeal_allowed = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'admin_user_suspensions'
        ordering = ['-suspended_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['suspended_at']),
        ]

    def __str__(self):
        duration = "permanent" if self.is_permanent else f"until {self.suspended_until}"
        return f"{self.user.email}: {self.reason} ({duration})"