"""
Rent domain — authoritative financial ledger for RUMIA.

Tenancy → RentCharge → Payment(s) via PaymentAllocation

Financial state is computed from ledger records, never from dashboard caches.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Sum
from django.utils import timezone


class RentCharge(models.Model):
    """
    Immutable rent obligation for a billing period.

    Status is derived from amount_paid vs amount_due but stored for query efficiency.
    """

    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('due', 'Due'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('waived', 'Waived'),
        ('disputed', 'Disputed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='rent_charges',
    )
    tenancy = models.ForeignKey(
        'properties.Tenancy',
        on_delete=models.CASCADE,
        related_name='rent_charges',
    )
    parent_property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='rent_charges',
        db_column='property_id',
    )
    unit = models.ForeignKey(
        'properties.RentalUnit',
        on_delete=models.CASCADE,
        related_name='rent_charges',
    )
    tenant = models.ForeignKey(
        'tenants.TenantProfile',
        on_delete=models.CASCADE,
        related_name='rent_charges',
    )

    # Legacy bridge
    legacy_rent_period = models.OneToOneField(
        'payments.RentPeriod',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rent_charge',
    )

    period_start = models.DateField()
    period_end = models.DateField()
    due_date = models.DateField()

    amount_due = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    amount_paid = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    late_fee_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    currency = models.CharField(max_length=3, default='KES')
    notes = models.TextField(blank=True, default='')
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    next_of_kin_notified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rent_rentcharge'
        unique_together = [['tenancy', 'period_start']]
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_charge_org_status'),
            models.Index(fields=['tenancy', 'due_date'], name='idx_charge_tenancy_due'),
            models.Index(fields=['due_date', 'status'], name='idx_charge_due_status'),
            models.Index(fields=['tenant', 'status'], name='idx_charge_tenant_status'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(amount_paid__lte=F('amount_due') + F('late_fee_amount')),
                name='check_charge_paid_not_exceed_due',
            ),
        ]

    def __str__(self):
        return f'{self.tenant.full_name} — {self.period_start.strftime("%b %Y")} ({self.status})'

    @property
    def total_due(self) -> Decimal:
        return self.amount_due + self.late_fee_amount

    @property
    def outstanding(self) -> Decimal:
        return max(self.total_due - self.amount_paid, Decimal('0.00'))

    def recalculate_status(self, as_of=None) -> str:
        """Recompute status from authoritative payment allocations."""
        today = (as_of or timezone.now().date())
        paid = self.payment_allocations.filter(
            payment__status='success'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        self.amount_paid = paid
        total = self.total_due

        if self.status == 'waived':
            return 'waived'
        if self.status == 'disputed':
            return 'disputed'
        if paid >= total and total > 0:
            new_status = 'paid'
        elif paid > 0:
            new_status = 'partially_paid'
        elif self.due_date < today:
            new_status = 'overdue'
        elif self.due_date == today:
            new_status = 'due'
        elif self.period_start > today:
            new_status = 'upcoming'
        else:
            new_status = 'due'

        self.status = new_status
        return new_status


class Payment(models.Model):
    """
    Provider-independent payment record for rental income.

    Business logic must not depend on whether payment came from Paystack or M-Pesa.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
        ('disputed', 'Disputed'),
    ]

    METHOD_CHOICES = [
        ('paystack', 'Paystack'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='rent_payments',
    )
    tenancy = models.ForeignKey(
        'properties.Tenancy',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )
    tenant = models.ForeignKey(
        'tenants.TenantProfile',
        on_delete=models.CASCADE,
        related_name='payments',
    )
    parent_property = models.ForeignKey(
        'properties.Property',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
        db_column='property_id',
    )
    unit = models.ForeignKey(
        'properties.RentalUnit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )

    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    currency = models.CharField(max_length=3, default='KES')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    provider = models.CharField(
        max_length=50,
        help_text='Provider identifier: paystack, manual',
    )
    provider_reference = models.CharField(max_length=255, blank=True, default='')
    internal_reference = models.CharField(max_length=100, unique=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_payments',
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_payments',
    )

    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Legacy bridge
    legacy_transaction = models.OneToOneField(
        'payments.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rent_payment',
    )

    class Meta:
        db_table = 'rent_payment'
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_payment_org_status'),
            models.Index(fields=['tenant', 'status'], name='idx_payment_tenant_status'),
            models.Index(fields=['provider_reference'], name='idx_payment_provider_ref'),
            models.Index(fields=['internal_reference'], name='idx_payment_internal_ref'),
        ]

    def __str__(self):
        return f'{self.internal_reference} — {self.amount} {self.currency} ({self.status})'


class PaymentAllocation(models.Model):
    """
    Links a payment to one or more rent charges.

    Supports partial payments and multiple payments against a single charge.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='allocations',
    )
    rent_charge = models.ForeignKey(
        RentCharge,
        on_delete=models.CASCADE,
        related_name='payment_allocations',
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'rent_paymentallocation'
        indexes = [
            models.Index(fields=['rent_charge'], name='idx_allocation_charge'),
            models.Index(fields=['payment'], name='idx_allocation_payment'),
        ]

    def __str__(self):
        return f'{self.payment.internal_reference} → {self.rent_charge_id}: {self.amount}'
