"""
Subscription billing models for landlord platform fees.

BUSINESS MODEL:
- Rumia charges landlords a subscription fee per occupied bed
- Pricing tiers: KES 29, 49, 85 per bed/month
- Billing calculated from BedOccupancy snapshots
- Invoices generated monthly (1st of month)
- Grace period before enforcement
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class SubscriptionPlan(models.Model):
    """
    Subscription pricing plans for landlords.
    
    Tiers based on feature set and hostel size.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Plan Details
    name = models.CharField(max_length=100, help_text="e.g., 'Starter', 'Growth', 'Enterprise'")
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    # Pricing Model
    PRICING_MODEL_CHOICES = [
        ('per_bed', 'Per Occupied Bed'),
        ('per_room', 'Per Room'),
        ('flat_rate', 'Flat Monthly Rate'),
    ]
    pricing_model = models.CharField(max_length=20, choices=PRICING_MODEL_CHOICES, default='per_bed')
    
    # Pricing (monthly basis)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Price per unit (KES/month)"
    )
    currency = models.CharField(max_length=3, default='KES')
    
    # Billing Frequency
    BILLING_FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
    ]
    billing_frequency = models.CharField(
        max_length=20,
        choices=BILLING_FREQUENCY_CHOICES,
        default='monthly'
    )
    
    # Enforcement Policies
    grace_period_days = models.IntegerField(
        default=7,
        help_text="Days after invoice due date before warnings"
    )
    enforcement_days = models.IntegerField(
        default=14,
        help_text="Days overdue before hiding hostel listing"
    )
    
    # Feature Limits (for different tiers)
    max_beds = models.IntegerField(
        null=True,
        blank=True,
        help_text="Max beds allowed on this plan (null = unlimited)"
    )
    features = models.JSONField(
        default=dict,
        blank=True,
        help_text="Feature flags: {'analytics': true, 'priority_support': true}"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['unit_price']
    
    def __str__(self):
        return f"{self.name} - KES {self.unit_price}/{self.get_pricing_model_display()}"
    
    @property
    def monthly_rate_per_bed(self):
        """
        Calculate effective monthly rate per bed.
        Useful for comparisons across different pricing models.
        """
        if self.pricing_model == 'per_bed':
            return self.unit_price
        # For flat_rate or per_room, this needs context (# beds/rooms)
        return None


class OccupancySnapshot(models.Model):
    """
    Daily snapshot of bed occupancy for billing calculations.
    
    Created by cron job at midnight daily.
    Used to calculate monthly invoices.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Reference
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='occupancy_snapshots'
    )
    snapshot_date = models.DateField(db_index=True)
    
    # Counts
    total_beds = models.IntegerField()
    occupied_beds = models.IntegerField()
    vacant_beds = models.IntegerField()
    
    # Detailed Breakdown (for auditing)
    bed_occupancy_data = models.JSONField(
        help_text="Map of bed_id -> student_id for this date"
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'occupancy_snapshots'
        unique_together = [['hostel', 'snapshot_date']]
        indexes = [
            models.Index(fields=['hostel', 'snapshot_date'], name='idx_snapshot_hostel_date'),
            models.Index(fields=['snapshot_date'], name='idx_snapshot_date'),
        ]
        ordering = ['-snapshot_date']
    
    def __str__(self):
        return f"{self.hostel.name} - {self.snapshot_date}: {self.occupied_beds}/{self.total_beds} beds"
    
    @property
    def occupancy_rate(self):
        """Calculate occupancy percentage"""
        if self.total_beds == 0:
            return Decimal('0.00')
        return (Decimal(str(self.occupied_beds)) / Decimal(str(self.total_beds))) * 100


class SubscriptionInvoice(models.Model):
    """
    Monthly subscription invoices for landlords.
    
    Generated automatically on 1st of each month.
    Based on previous month's occupancy snapshots.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # References
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='subscription_invoices'
    )
    landlord = models.ForeignKey(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='subscription_invoices'
    )
    subscription_plan = models.ForeignKey(
        'SubscriptionPlan',
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    
    # Invoice Identification
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    invoice_date = models.DateField()
    due_date = models.DateField()
    
    # Billing Period
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Occupancy Data (snapshot summary)
    occupancy_snapshot = models.JSONField(
        help_text="Daily occupancy counts for billing period"
    )
    total_bed_days = models.IntegerField(
        help_text="Sum of occupied beds across all days in period"
    )
    average_occupancy = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Average beds occupied during period"
    )
    
    # Amounts
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price per bed at time of invoice generation"
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="VAT if applicable"
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment Status
    STATUS_CHOICES = [
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('in_grace', 'In Grace Period'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='issued')
    
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_transaction = models.ForeignKey(
        'payments.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscription_invoices'
    )
    
    # Enforcement Tracking
    warning_sent_at = models.DateTimeField(null=True, blank=True)
    enforcement_activated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when hostel listing was hidden"
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_invoices'
        indexes = [
            models.Index(fields=['hostel', 'period_start'], name='idx_invoice_hostel_period'),
            models.Index(fields=['landlord', 'status'], name='idx_invoice_landlord_status'),
            models.Index(fields=['status', 'due_date'], name='idx_invoice_status_due'),
            models.Index(fields=['invoice_number'], name='idx_invoice_number'),
        ]
        ordering = ['-period_start']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.hostel.name} ({self.status})"
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue"""
        if self.status == 'paid':
            return False
        return timezone.now().date() > self.due_date
    
    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if not self.is_overdue:
            return 0
        return (timezone.now().date() - self.due_date).days
    
    def mark_paid(self, transaction):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_at = timezone.now()
        self.payment_transaction = transaction
        self.save()
