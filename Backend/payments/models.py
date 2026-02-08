from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class WebhookEvent(models.Model):
    """Log of all incoming payment webhooks for auditing and idempotency"""
    transaction_ref = models.CharField(max_length=100, unique=True, db_index=True)
    provider = models.CharField(max_length=50, help_text="e.g. mpesa, paystack")
    event_type = models.CharField(max_length=100, help_text="e.g. stk_push_callback, c2b_confirmation")
    payload = models.JSONField()
    processing_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processed', 'Processed'),
            ('failed', 'Failed'),
            ('duplicate', 'Duplicate')
        ],
        default='pending'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments_webhookevent'
        indexes = [
            models.Index(fields=['created_at'], name='idx_webhook_created'),
            models.Index(fields=['processing_status'], name='idx_webhook_status'),
        ]

    def __str__(self):
        return f"{self.provider} - {self.transaction_ref} ({self.processing_status})"


class IdempotencyKey(models.Model):
    """Generic idempotency key storage for API requests"""
    idempotency_key = models.UUIDField(unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    request_path = models.CharField(max_length=255)
    response_code = models.IntegerField(null=True, blank=True)
    response_body = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'payments_idempotencykey'
        indexes = [
            models.Index(fields=['expires_at'], name='idx_idemp_expiry'),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return str(self.idempotency_key)


class MpesaPaymentConfig(models.Model):
    """Store landlord-specific M-Pesa payment configurations"""
    
    # RESTRICTED: Only Paybill is supported for automated tracking
    PAYMENT_TYPE_CHOICES = [
        ('paybill', 'Paybill Number'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending_verification', 'Pending Verification'),
    ]
    
    landlord = models.ForeignKey(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='mpesa_payment_configs'
    )
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='paybill')
    mpesa_number = models.CharField(max_length=20, help_text="Paybill Number")
    business_name = models.CharField(max_length=255, help_text="Business name for display")
    
    # API Credentials for Multi-Tenant Routing
    consumer_key = models.CharField(max_length=255, blank=True, null=True, help_text="Daraja App Consumer Key")
    consumer_secret = models.CharField(max_length=255, blank=True, null=True, help_text="Daraja App Consumer Secret")
    passkey = models.CharField(max_length=255, blank=True, null=True, help_text="Lipa Na M-Pesa Online Passkey")
    
    is_default = models.BooleanField(default=False, help_text="Default payment method for this landlord")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')
    verification_code = models.CharField(max_length=10, blank=True, null=True, help_text="SMS verification code")
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'payments_mpesapaymentconfig'
        indexes = [
            models.Index(fields=['landlord'], name='idx_mpesa_config_landlord'),
            models.Index(fields=['payment_type'], name='idx_mpesa_config_type'),
        ]
    
    def __str__(self):
        return f"{self.get_payment_type_display()} - {self.mpesa_number} ({self.landlord.user.get_full_name()})"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            MpesaPaymentConfig.objects.filter(
                landlord=self.landlord
            ).exclude(pk=self.pk).update(is_default=False)
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class StudentPaymentTracker(models.Model):
    """Tracks student overpayments and credits for future use"""
    student = models.OneToOneField(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='payment_tracker'
    )
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment Tracker: {self.student.user.get_full_name()} - KES {self.balance}"


class RentPeriod(models.Model):
    """
    CANONICAL TRUTH: Immutable record of a specific rent obligation.
    Created for every month/cycle a student is in a bed.
    """
    STATUS_CHOICES = [
        ('due', 'Due'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('transferred', 'Transferred'),  # If student moved mid-month
    ]

    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='rent_periods'
    )
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='rent_periods'
    )
    # Keeping Booking generic, but linking distinct periods
    booking = models.ForeignKey(
        'hostels.Booking',
        on_delete=models.SET_NULL,
        null=True,
        related_name='rent_periods'
    )
    room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.SET_NULL,
        null=True,
        related_name='rent_periods'
    )
    # Canonical link to the physical bed
    bed = models.ForeignKey(
        'hostels.Bed',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rent_periods'
    )
    # Conceptual/Legacy bed slot ID
    bed_slot_id = models.CharField(max_length=50, blank=True, null=True)

    start_date = models.DateField()
    end_date = models.DateField()
    
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='due')
    
    # Payment Resolution Fields
    assigned_paybill = models.CharField(max_length=20, blank=True, null=True)
    student_account_ref = models.CharField(max_length=50, help_text="Unique ref for Paybill matching")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['assigned_paybill', 'student_account_ref']),
        ]

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.start_date.strftime('%b %Y')} ({self.status})"
    
    @property
    def balance(self):
        return self.amount_due - self.amount_paid


class Transaction(models.Model):
    """Central record of money movement"""

    TRANSACTION_TYPE_CHOICES = [
        ('rent', 'Rent Payment'),
        ('deposit', 'Security Deposit'),
        ('late_fee', 'Late Fee'),
        ('wallet_credit', 'Wallet Credit'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa (Paybill)'),
        ('paystack', 'Card/Bank (Paystack)'),
    ]

    # REFACTORED: Linked to RentPeriod (can be null for wallet top-ups/deposits)
    rent_period = models.ForeignKey(
        RentPeriod,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions'
    )
    # Keeping Booking primarily for legacy/deposit logic
    booking = models.ForeignKey(
        'hostels.Booking',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions'
    )
    # Direct links for per-bed and per-hostel tracking
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions'
    )
    bed = models.ForeignKey(
        'hostels.Bed',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions'
    )
    
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    transaction_reference = models.CharField(max_length=100, unique=True)
    paystack_reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default='rent')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    metadata = models.JSONField(blank=True, null=True) # Full payload from gateway
    
    # M-Pesa Specifics
    mpesa_checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    mpesa_merchant_request_id = models.CharField(max_length=100, blank=True, null=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    mpesa_phone_number = models.CharField(max_length=15, blank=True, null=True)

    initiated_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)

    @property
    def total_charged_amount(self):
        return self.amount

    @property
    def landlord_payout_amount(self):
        return self.amount * Decimal('0.97') # Simplified 3% fee

    @property
    def platform_fee(self):
        return self.amount * Decimal('0.03')

    @property
    def landlord(self):
        if self.booking:
            return self.booking.room.hostel.landlord
        if self.rent_period:
            return self.rent_period.hostel.landlord
        return None

    class Meta:
        ordering = ['-initiated_at']

    def __str__(self):
        return f"{self.transaction_reference} - {self.amount}"


class TransferLog(models.Model):
    """Audit trail for room/hostel transfers affecting financials"""
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE)
    
    from_rent_period = models.ForeignKey(RentPeriod, on_delete=models.CASCADE, related_name='transfer_out')
    to_rent_period = models.ForeignKey(RentPeriod, on_delete=models.CASCADE, related_name='transfer_in')
    
    transfer_date = models.DateTimeField(default=timezone.now)
    reason = models.TextField(blank=True)

    def __str__(self):
        return f"Transfer: {self.student} ({self.transfer_date.date()})"


# --- Legacy / Auxiliary Models (Kept/Updated) ---

class SavedPaymentMethod(models.Model):
    """Store tokenized payment methods for recurring payments"""
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE)
    paystack_authorization_code = models.CharField(max_length=100)
    payment_type = models.CharField(max_length=20) # card, mpesa
    last_four = models.CharField(max_length=4)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.payment_type} **** {self.last_four}"


class RecurringPayment(models.Model):
    """Track recurring payment schedules"""
    booking = models.ForeignKey('hostels.Booking', on_delete=models.CASCADE, related_name='recurring_payments')
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    next_payment_date = models.DateField()
    is_active = models.BooleanField(default=True)


class Payout(models.Model):
    """
    Decoupled Payout Record.
    Created by async task from settled RentPeriods.
    """
    STATUS_CHOICES = [('pending', 'Pending'), ('processing', 'Processing'), ('success', 'Success'), ('failed', 'Failed')]
    
    landlord = models.ForeignKey('accounts.LandlordProfile', on_delete=models.CASCADE)
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(blank=True, null=True)

class PaystackSubaccount(models.Model):
    """Store Paystack subaccount details for automated landlord payouts"""
    landlord = models.OneToOneField('accounts.LandlordProfile', on_delete=models.CASCADE)
    subaccount_code = models.CharField(max_length=100)
    business_name = models.CharField(max_length=255)
    settlement_bank = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)


class LateFeeCharge(models.Model):
    """Track late fee charges"""
    # Simply linking to RentPeriod for context would be better now
    rent_period = models.ForeignKey(RentPeriod, on_delete=models.CASCADE, null=True)
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255, default='Late Fee')
    created_at = models.DateTimeField(default=timezone.now)
    is_paid = models.BooleanField(default=False)


class RefundRequest(models.Model):
    """Handle booking cancellation refunds"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    REASON_CHOICES = [
        ('early_cancellation', 'Early Cancellation'),
        ('room_unavailable', 'Room Unavailable'),
        ('platform_error', 'Platform Error'),
    ]

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='refund_request'
    )
    booking = models.ForeignKey(
        'hostels.Booking',
        on_delete=models.CASCADE,
        related_name='refund_requests'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='refund_requests'
    )
    original_amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    refund_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    refund_reason = models.CharField(max_length=100, choices=REASON_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments_refundrequest'
        indexes = [
            models.Index(fields=['transaction'], name='idx_refund_transaction'),
            models.Index(fields=['status'], name='idx_refund_status'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'approved', 'processing', 'completed', 'rejected']),
                name='check_refund_status'
            ),
            models.CheckConstraint(
                check=models.Q(refund_reason__in=['early_cancellation', 'room_unavailable', 'platform_error']),
                name='check_refund_reason'
            ),
            models.CheckConstraint(
                check=models.Q(refund_amount__lte=models.F('original_amount_paid')),
                name='check_refund_amount_limit'
            ),
        ]

    def __str__(self):
        return f"Refund request for {self.booking.student.user.get_full_name()} - {self.refund_amount}"


class PaymentAuditLog(models.Model):
    """
    Immutable audit trail for all payment-related actions and state transitions.
    """
    ACTION_CHOICES = [
        ('payment_initiated', 'Payment Initiated'),
        ('payment_completed', 'Payment Completed'),
        ('payment_failed', 'Payment Failed'),
        ('manual_override', 'Manual Override'),
        ('refund_processed', 'Refund Processed'),
        ('subscription_enforced', 'Subscription Enforced'),
        ('invoice_generated', 'Invoice Generated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    
    # Generic relation to the affected object (Booking, Transaction, Invoice, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # State tracking
    old_state = models.JSONField(default=dict, blank=True)
    new_state = models.JSONField(default=dict, blank=True)
    
    # Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['actor']),
        ]

    def __str__(self):
        return f"{self.action} by {self.actor} on {self.timestamp}"


class Receipt(models.Model):
    """Store generated payment receipts"""
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True)
    pdf_file = models.FileField(upload_to='receipts/pdf/', blank=True, null=True)
    generated_at = models.DateTimeField(default=timezone.now)

class TaxReport(models.Model):
    """Store monthly withholding tax reports for landlords"""
    landlord = models.ForeignKey('accounts.LandlordProfile', on_delete=models.CASCADE)
    report_month = models.DateField()
    total_rent_received = models.DecimalField(max_digits=10, decimal_places=2)
    total_withholding_tax = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_count = models.IntegerField()
    report_file_url = models.URLField(blank=True, null=True)
    generated_at = models.DateTimeField(default=timezone.now)

class RevenueAnalytics(models.Model):
    """Pre-aggregated revenue metrics"""
    date = models.DateField()
    period_type = models.CharField(max_length=20)
    total_volume = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))


# Import bed payment ledger model
from .bed_payment_ledger import BedPaymentLedger


# Import subscription models
from .subscription_models import SubscriptionPlan, OccupancySnapshot, SubscriptionInvoice
from .hostel_payment_config import HostelPaymentConfig
