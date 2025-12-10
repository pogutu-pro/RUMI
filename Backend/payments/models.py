from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class Transaction(models.Model):
    """Central record of all payment attempts and completions"""

    TRANSACTION_TYPE_CHOICES = [
        ('initial', 'Initial Payment'),
        ('recurring', 'Recurring Payment'),
        ('late_fee', 'Late Fee Payment'),
    ]

    PAYMENT_PLAN_CHOICES = [
        ('monthly', 'Monthly'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
    ]

    booking = models.OneToOneField(
        'hostels.Booking',
        on_delete=models.CASCADE,
        related_name='payment_transaction'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    landlord = models.ForeignKey(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_reference = models.CharField(max_length=100, unique=True)
    paystack_reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        default='initial'
    )
    payment_plan = models.CharField(
        max_length=20,
        choices=PAYMENT_PLAN_CHOICES,
        default='monthly'
    )
    # NEW v2.0: Student pays 2% service fee, landlord receives full rent
    base_rent = models.DecimalField(max_digits=10, decimal_places=2)
    student_service_fee = models.DecimalField(max_digits=10, decimal_places=2)  # 2% of rent
    total_charged_amount = models.DecimalField(max_digits=10, decimal_places=2)  # rent + 2%
    landlord_payout_amount = models.DecimalField(max_digits=10, decimal_places=2)  # Full rent
    
    # Platform revenue breakdown
    gross_platform_revenue = models.DecimalField(max_digits=10, decimal_places=2)  # 2% service fee
    gateway_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # ~1.5%
    net_platform_revenue = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # ~0.5%
    
    # Removed fields
    landlord_commission = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))  # NO landlord commission!
    withholding_tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))  # Removed
    currency = models.CharField(max_length=3, default='KES')
    payment_method = models.CharField(
        max_length=50,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        null=True
    )
    saved_payment_method = models.ForeignKey(
        'SavedPaymentMethod',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    initiated_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)
    failed_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = 'payments_transaction'
        indexes = [
            models.Index(fields=['booking'], name='idx_transaction_booking'),
            models.Index(fields=['student'], name='idx_transaction_student'),
            models.Index(fields=['paystack_reference'], name='idx_transaction_paystack_ref'),
            models.Index(fields=['status'], name='idx_transaction_status'),
            models.Index(fields=['transaction_type'], name='idx_transaction_type'),
            models.Index(fields=['paid_at'], name='idx_transaction_paid_at'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'success', 'failed', 'refunded']),
                name='check_transaction_status'
            ),
            models.CheckConstraint(
                check=models.Q(transaction_type__in=['initial', 'recurring', 'late_fee']),
                name='check_transaction_type'
            ),
            models.CheckConstraint(
                check=models.Q(payment_plan__in=['monthly']),
                name='check_payment_plan'
            ),
            # NEW v2.0: Service fee model constraints
            models.CheckConstraint(
                check=models.Q(student_service_fee=models.F('base_rent') * 0.02),
                name='check_service_fee_2_percent'
            ),
            models.CheckConstraint(
                check=models.Q(total_charged_amount=models.F('base_rent') + models.F('student_service_fee')),
                name='check_total_with_service_fee'
            ),
            models.CheckConstraint(
                check=models.Q(landlord_payout_amount=models.F('base_rent')),
                name='check_landlord_gets_full_rent'
            ),
            models.CheckConstraint(
                check=models.Q(landlord_commission=0.00),
                name='check_no_landlord_commission'
            ),
            models.CheckConstraint(
                check=models.Q(gross_platform_revenue=models.F('student_service_fee')),
                name='check_platform_revenue_from_service_fee'
            ),
        ]

    def __str__(self):
        return f"{self.transaction_reference} - {self.booking.student.user.get_full_name()}"


class SavedPaymentMethod(models.Model):
    """Store tokenized payment methods for recurring payments"""

    PAYMENT_TYPE_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
    ]

    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='saved_payment_methods'
    )
    paystack_authorization_code = models.CharField(max_length=100, unique=True)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    last_four = models.CharField(max_length=4, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    expiry_month = models.CharField(max_length=2, blank=True, null=True)
    expiry_year = models.CharField(max_length=4, blank=True, null=True)
    bank = models.CharField(max_length=50, blank=True, null=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments_savedpaymentmethod'
        indexes = [
            models.Index(fields=['student'], name='idx_saved_payment_student'),
            models.Index(fields=['paystack_authorization_code'], name='idx_saved_payment_auth_code'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(payment_type__in=['mpesa', 'card', 'bank_transfer']),
                name='check_payment_type'
            ),
            models.UniqueConstraint(
                fields=['student', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_payment_method'
            ),
        ]

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.payment_type}"


class RecurringPayment(models.Model):
    """Track recurring payment schedules for active tenants"""

    booking = models.OneToOneField(
        'hostels.Booking',
        on_delete=models.CASCADE,
        related_name='recurring_payment'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='recurring_payments'
    )
    saved_payment_method = models.ForeignKey(
        SavedPaymentMethod,
        on_delete=models.CASCADE,
        related_name='recurring_payments'
    )
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=20, default='monthly')
    next_payment_date = models.DateField()
    grace_period_days = models.IntegerField(default=7, validators=[MinValueValidator(0)])
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('200.00'))
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(default=timezone.now)
    paused_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    last_payment_at = models.DateTimeField(blank=True, null=True)
    consecutive_failures = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    class Meta:
        db_table = 'payments_recurringpayment'
        indexes = [
            models.Index(fields=['booking'], name='idx_recurring_booking'),
            models.Index(fields=['next_payment_date'], name='idx_recurring_next_payment'),
            models.Index(fields=['student'], name='idx_recurring_student'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(frequency__in=['monthly']),
                name='check_recurring_frequency'
            ),
            models.CheckConstraint(
                check=models.Q(grace_period_days__gte=0),
                name='check_grace_period_positive'
            ),
            models.CheckConstraint(
                check=models.Q(consecutive_failures__gte=0),
                name='check_consecutive_failures_positive'
            ),
        ]

    def __str__(self):
        return f"Recurring payment for {self.booking.student.user.get_full_name()}"


class LateFeeCharge(models.Model):
    """Track late fee charges after grace period"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('waived', 'Waived'),
    ]

    booking = models.ForeignKey(
        'hostels.Booking',
        on_delete=models.CASCADE,
        related_name='late_fees'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='late_fees'
    )
    original_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='late_fees'
    )
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    grace_period_end = models.DateField()
    charged_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments_latefeecharge'
        indexes = [
            models.Index(fields=['booking'], name='idx_late_fee_booking'),
            models.Index(fields=['student'], name='idx_late_fee_student'),
            models.Index(fields=['status'], name='idx_late_fee_status'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'paid', 'waived']),
                name='check_late_fee_status'
            ),
            models.CheckConstraint(
                check=models.Q(grace_period_end__gt=models.F('due_date')),
                name='check_grace_period_after_due_date'
            ),
        ]

    def __str__(self):
        return f"Late fee for {self.booking.student.user.get_full_name()} - {self.late_fee_amount}"


class TaxReport(models.Model):
    """Store monthly withholding tax reports for landlords"""

    landlord = models.ForeignKey(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='tax_reports'
    )
    report_month = models.DateField()  # YYYY-MM-01 format
    total_rent_received = models.DecimalField(max_digits=10, decimal_places=2)
    total_withholding_tax = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_count = models.IntegerField()
    report_file_url = models.URLField(blank=True, null=True)
    generated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments_taxreport'
        indexes = [
            models.Index(fields=['landlord', 'report_month'], name='idx_tax_report_landlord_month'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['landlord', 'report_month'],
                name='unique_landlord_monthly_tax_report'
            ),
            models.CheckConstraint(
                check=models.Q(total_withholding_tax=models.F('total_rent_received') * 0.10),
                name='check_tax_calculation'
            ),
        ]

    def __str__(self):
        return f"Tax report for {self.landlord.user.get_full_name()} - {self.report_month.strftime('%B %Y')}"


class PaystackSubaccount(models.Model):
    """Store Paystack subaccount details for automated landlord payouts"""

    landlord = models.OneToOneField(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='paystack_subaccount'
    )
    subaccount_code = models.CharField(max_length=100, unique=True)
    business_name = models.CharField(max_length=255)
    settlement_bank = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    percentage_charge = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    total_payouts = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_commission_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    verified_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments_paystacksubaccount'
        indexes = [
            models.Index(fields=['landlord'], name='idx_subaccount_landlord'),
            models.Index(fields=['subaccount_code'], name='idx_subaccount_code'),
        ]

    def __str__(self):
        return f"Subaccount for {self.business_name}"


class Payout(models.Model):
    """Track automated payouts to landlords"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='payout'
    )
    landlord = models.ForeignKey(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='payouts'
    )
    subaccount = models.ForeignKey(
        PaystackSubaccount,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='payouts'
    )
    payout_reference = models.CharField(max_length=100, unique=True)
    paystack_transfer_code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_deducted = models.DecimalField(max_digits=10, decimal_places=2)
    withholding_tax_deducted = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_payout_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payout_duration_seconds = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    initiated_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)
    failed_at = models.DateTimeField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'payments_payout'
        indexes = [
            models.Index(fields=['transaction'], name='idx_payout_transaction'),
            models.Index(fields=['landlord'], name='idx_payout_landlord'),
            models.Index(fields=['status'], name='idx_payout_status'),
            models.Index(fields=['completed_at'], name='idx_payout_completed_at'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'processing', 'success', 'failed']),
                name='check_payout_status'
            ),
            models.CheckConstraint(
                check=models.Q(net_payout_amount=models.F('gross_amount') - models.F('commission_deducted') - models.F('withholding_tax_deducted')),
                name='check_net_payout_calculation'
            ),
        ]

    def __str__(self):
        return f"Payout {self.payout_reference} - {self.net_payout_amount}"


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


class RevenueAnalytics(models.Model):
    """Pre-aggregated revenue metrics for dashboard performance"""

    PERIOD_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    date = models.DateField()
    period_type = models.CharField(max_length=20, choices=PERIOD_TYPE_CHOICES)
    total_transactions = models.IntegerField(default=0)
    total_volume = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    gross_platform_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    gateway_fees_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_platform_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    recurring_payments_count = models.IntegerField(default=0)
    late_fees_collected = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_withholding_tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments_revenueanalytics'
        indexes = [
            models.Index(fields=['date', 'period_type'], name='idx_revenue_date_period'),
            models.Index(fields=['date'], name='idx_revenue_date'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(period_type__in=['daily', 'weekly', 'monthly']),
                name='check_period_type'
            ),
            models.UniqueConstraint(
                fields=['date', 'period_type'],
                name='unique_date_period_analytics'
            ),
        ]

    def __str__(self):
        return f"{self.period_type.title()} analytics for {self.date}"
