"""
Rent domain — authoritative tenant ledger for RumiaRent.

Tenancy → Invoice (+ InvoiceLines, CreditNotes) → Payment(s) via PaymentAllocation

Invoices are immutable once issued: corrections are CreditNotes. Every money
event also posts a balanced journal entry in the `ledger` app (see
rent/services/invoicing.py and docs/roadmap/phase-1-ledger-design.md).
Financial state is computed from ledger records, never from dashboard caches.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q, Sum
from django.utils import timezone


class Invoice(models.Model):
    """
    An amount a tenant owes: monthly rent (plus recurring extras), a deposit,
    a late penalty, or an ad-hoc charge.

    Evolved in place from the former `RentCharge` (same table, same rows).
    `amount_due` is the invoice total — always the sum of its lines.
    Status is derived from payments and credit notes but stored for query efficiency.
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

    TYPE_CHOICES = [
        ('rent', 'Rent'),
        ('deposit', 'Deposit'),
        ('penalty', 'Late Penalty'),
        ('adhoc', 'Ad-hoc Charge'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    tenancy = models.ForeignKey(
        'properties.Tenancy',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    parent_property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='invoices',
        db_column='property_id',
    )
    unit = models.ForeignKey(
        'properties.RentalUnit',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    tenant = models.ForeignKey(
        'tenants.TenantProfile',
        on_delete=models.CASCADE,
        related_name='invoices',
    )

    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='rent')
    number = models.CharField(max_length=30, blank=True, default='')
    issue_date = models.DateField(null=True, blank=True)
    source_invoice = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='derived_invoices',
        help_text='For a penalty: the invoice it penalizes.',
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
    amount_credited = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    is_disputed = models.BooleanField(default=False)
    currency = models.CharField(max_length=3, default='KES')
    notes = models.TextField(blank=True, default='')
    reminder_sent_at = models.DateTimeField(null=True, blank=True)  # Deprecated: superseded by ReminderLog.
    next_of_kin_notified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rent_rentcharge'
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_charge_org_status'),
            models.Index(fields=['tenancy', 'due_date'], name='idx_charge_tenancy_due'),
            models.Index(fields=['due_date', 'status'], name='idx_charge_due_status'),
            models.Index(fields=['tenant', 'status'], name='idx_charge_tenant_status'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['tenancy', 'period_start'],
                condition=Q(invoice_type='rent'),
                name='uniq_rent_invoice_per_period',
            ),
            models.UniqueConstraint(
                fields=['organization', 'number'],
                condition=~Q(number=''),
                name='uniq_invoice_number_per_org',
            ),
            models.UniqueConstraint(
                fields=['source_invoice', 'period_start'],
                condition=Q(invoice_type='penalty'),
                name='uniq_penalty_per_source_per_day',
            ),
            models.CheckConstraint(
                check=Q(amount_paid__lte=F('amount_due') - F('amount_credited')),
                name='check_invoice_paid_not_exceed_due',
            ),
        ]

    def __str__(self):
        return f'{self.number or self.pk} {self.tenant.full_name} — {self.get_invoice_type_display()} ({self.status})'

    @property
    def total_due(self) -> Decimal:
        """What the tenant must pay: the total less anything credited."""
        return self.amount_due - self.amount_credited

    @property
    def outstanding(self) -> Decimal:
        return max(self.total_due - self.amount_paid, Decimal('0.00'))

    def recalculate_status(self, as_of=None) -> str:
        """Recompute amount_paid and status from authoritative allocations and credit notes."""
        today = (as_of or timezone.now().date())
        paid = self.payment_allocations.filter(
            payment__status='success'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        self.amount_paid = paid
        total = self.total_due

        if self.is_disputed:
            new_status = 'disputed'
        elif total <= 0 and self.amount_credited > 0:
            new_status = 'waived'
        elif paid >= total and total > 0:
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


# Backwards-compatible alias — the model was named RentCharge before Phase 1.
RentCharge = Invoice


class InvoiceLine(models.Model):
    """One billed item on an invoice. Lines never change after the invoice is issued."""

    LINE_TYPE_CHOICES = [
        ('rent', 'Rent'),
        ('service_charge', 'Service Charge'),
        ('water', 'Water'),
        ('electricity', 'Electricity'),
        ('garbage', 'Garbage'),
        ('parking', 'Parking'),
        ('penalty', 'Late Penalty'),
        ('deposit', 'Deposit'),
        ('repair', 'Repair'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='lines')
    line_type = models.CharField(max_length=20, choices=LINE_TYPE_CHOICES)
    description = models.CharField(max_length=255, blank=True, default='')
    quantity = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal('1'))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'rent_invoiceline'
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.get_line_type_display()}: {self.amount}'


class CreditNote(models.Model):
    """
    Reduces what a tenant owes on one invoice — a waiver, discount or correction.

    Never exceeds the invoice's unpaid balance; money already paid is returned
    by reversing/refunding the payment, not by a credit note.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='credit_notes',
    )
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='credit_notes')
    number = models.CharField(max_length=30)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))],
    )
    reason = models.TextField()
    issue_date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='credit_notes_issued',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'rent_creditnote'
        ordering = ['-issue_date', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'number'], name='uniq_credit_note_number_per_org'),
        ]

    def __str__(self):
        return f'{self.number} on {self.invoice.number}: {self.amount}'


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
        ('mpesa_paybill', 'M-Pesa Paybill'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('deposit_transfer', 'Deposit applied'),
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
    unapplied_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        help_text='Part of a successful payment not yet allocated to an invoice — tenant credit.',
    )
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

    class Meta:
        db_table = 'rent_payment'
        constraints = [
            models.CheckConstraint(
                check=Q(unapplied_amount__gte=0) & Q(unapplied_amount__lte=F('amount')),
                name='check_payment_unapplied_within_amount',
            ),
        ]
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
    Links a payment to one or more invoices.

    Supports partial payments and multiple payments against a single invoice.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='allocations',
    )
    invoice = models.ForeignKey(
        Invoice,
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
            models.Index(fields=['invoice'], name='idx_allocation_charge'),
            models.Index(fields=['payment'], name='idx_allocation_payment'),
        ]

    def __str__(self):
        return f'{self.payment.internal_reference} → {self.invoice_id}: {self.amount}'


class Receipt(models.Model):
    """
    Numbered proof of a successful payment (RCT-000001, per organization).

    `snapshot` freezes what the payment paid at the moment of issue — invoices
    and amounts, credit kept, and the tenant's balance afterwards — so a
    receipt never changes when credit is applied to later invoices.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='receipts',
    )
    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name='receipt')
    number = models.CharField(max_length=30)
    issued_at = models.DateTimeField(default=timezone.now)
    snapshot = models.JSONField(default=dict)
    pdf = models.FileField(upload_to='receipts/rumiarent/%Y/%m/', blank=True)
    sent_sms_at = models.DateTimeField(null=True, blank=True)
    sent_email_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'rent_receipt'
        ordering = ['-issued_at']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'number'], name='uniq_receipt_number_per_org'),
        ]

    def __str__(self):
        return f'{self.number} — {self.payment.amount} {self.payment.currency}'


class RecurringCharge(models.Model):
    """
    A fixed monthly extra billed on every rent invoice of a tenancy while
    active — service charge, garbage, parking, internet, flat-rate water.
    """

    LINE_TYPE_CHOICES = [
        choice for choice in InvoiceLine.LINE_TYPE_CHOICES if choice[0] not in ('rent', 'penalty', 'deposit')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='recurring_charges',
    )
    tenancy = models.ForeignKey('properties.Tenancy', on_delete=models.CASCADE, related_name='recurring_charges')
    line_type = models.CharField(max_length=20, choices=LINE_TYPE_CHOICES)
    description = models.CharField(max_length=255, blank=True, default='')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rent_recurringcharge'
        ordering = ['start_date', 'created_at']

    def __str__(self):
        return f'{self.get_line_type_display()} {self.amount}/month'

    def applies_to(self, period_start, period_end) -> bool:
        return self.is_active and self.start_date <= period_end and (
            self.end_date is None or self.end_date >= period_start
        )


class ReminderLog(models.Model):
    """
    One row per reminder step per invoice — guarantees each step of the
    organization's EscalationPolicy schedule is sent at most once.
    `skipped` marks earlier steps passed over because a later one was due
    (e.g. after downtime) so they are never sent late.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='reminder_logs')
    reminder_key = models.CharField(max_length=40)
    channels = models.JSONField(default=list, blank=True)
    skipped = models.BooleanField(default=False)
    sent_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'rent_reminderlog'
        ordering = ['sent_at']
        constraints = [
            models.UniqueConstraint(fields=['invoice', 'reminder_key'], name='uniq_reminder_step_per_invoice'),
        ]

    def __str__(self):
        return f'{self.invoice.number} {self.reminder_key}{" (skipped)" if self.skipped else ""}'


class PenaltyPolicy(models.Model):
    """
    Late-penalty rules for an organization, optionally overridden per property.
    Off by default (design decision D7). Penalties are separate `penalty`
    invoices linked to the invoice they penalize, so they can be waived with
    a credit note without touching the rent invoice.
    """

    METHOD_CHOICES = [
        ('fixed', 'Fixed amount'),
        ('percent', 'Percent of the overdue balance'),
    ]
    FREQUENCY_CHOICES = [
        ('once', 'Once per overdue invoice'),
        ('monthly', 'Again every month it stays unpaid'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='penalty_policies',
    )
    parent_property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, null=True, blank=True,
        related_name='penalty_policies', db_column='property_id',
        help_text='Leave empty for the organization-wide policy.',
    )
    enabled = models.BooleanField(default=False)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='fixed')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    grace_days = models.PositiveIntegerField(
        null=True, blank=True, help_text="Days after the due date before a penalty; empty = each tenancy's grace period.",
    )
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='once')
    cap_percent_of_invoice = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text='Maximum total penalties on one invoice, as a percent of that invoice.',
    )
    applies_to = models.JSONField(default=list, blank=True, help_text="Invoice types penalized; empty = ['rent'].")
    notify_tenant = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rent_penaltypolicy'
        constraints = [
            models.UniqueConstraint(
                fields=['organization'], condition=Q(parent_property__isnull=True), name='uniq_org_penalty_policy',
            ),
            models.UniqueConstraint(
                fields=['organization', 'parent_property'], condition=Q(parent_property__isnull=False),
                name='uniq_property_penalty_policy',
            ),
        ]

    def __str__(self):
        scope = self.parent_property.name if self.parent_property_id else 'organization'
        return f'Penalty policy ({scope}): {"on" if self.enabled else "off"}'

    @property
    def invoice_types(self) -> list:
        return list(self.applies_to or ['rent'])


class DepositSettlement(models.Model):
    """
    Move-out settlement of a tenancy's deposit: what was held, what is
    deducted (arrears, damages, other), and what is refunded.

    draft → approved (ledger postings made, arrears paid from the deposit)
          → refunded (refund recorded; paying it out happens outside RumiaRent in Phase 1)
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    REFUND_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mpesa_paybill', 'M-Pesa'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='deposit_settlements',
    )
    tenancy = models.ForeignKey('properties.Tenancy', on_delete=models.PROTECT, related_name='deposit_settlements')
    number = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    held_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, default='')
    condition_report = models.ForeignKey(
        'properties.PropertyConditionReport', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='deposit_settlements',
    )
    refund_method = models.CharField(max_length=20, choices=REFUND_METHOD_CHOICES, blank=True, default='')
    refund_reference = models.CharField(max_length=100, blank=True, default='')
    refunded_on = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='deposit_settlements_created',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='deposit_settlements_approved',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rent_depositsettlement'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'number'], name='uniq_deposit_settlement_number_per_org'),
        ]

    def __str__(self):
        return f'{self.number} ({self.status})'

    @property
    def total_deductions(self) -> Decimal:
        return sum((d.amount for d in self.deductions.all()), Decimal('0.00'))

    @property
    def refund_amount(self) -> Decimal:
        return max(self.held_amount - self.total_deductions, Decimal('0.00'))


class DepositDeduction(models.Model):
    KIND_CHOICES = [
        ('arrears', 'Unpaid rent and charges'),
        ('damages', 'Damages / repairs'),
        ('cleaning', 'Cleaning'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    settlement = models.ForeignKey(DepositSettlement, on_delete=models.CASCADE, related_name='deductions')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])

    class Meta:
        db_table = 'rent_depositdeduction'

    def __str__(self):
        return f'{self.get_kind_display()}: {self.amount}'
