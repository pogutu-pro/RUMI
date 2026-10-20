"""
Agency package — an organization (letting agent / property manager) managing
properties for many owners. Each owner has commission terms, monthly owner
statements, and a running payable balance (ledger account 2300 with the
owner dimension) reduced by remittances and advances.
See docs/roadmap/phase-3b-agency.md.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

PERCENT = [MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))]


class PropertyOwner(models.Model):
    PAYOUT_CHOICES = [
        ('bank_transfer', 'Bank transfer'),
        ('mpesa_paybill', 'M-Pesa'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='property_owners',
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    kra_pin = models.CharField(max_length=20, blank=True, default='')
    payout_method = models.CharField(max_length=20, choices=PAYOUT_CHOICES, default='bank_transfer')
    payout_details = models.CharField(max_length=255, blank=True, default='', help_text='Bank account / M-Pesa number')
    management_fee_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0'), validators=PERCENT,
        help_text='Percent of rent and charges collected kept as the management commission.',
    )
    letting_fee_percent = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))],
        help_text="Percent of one month's rent charged when a new tenancy starts (e.g. 50).",
    )
    commission_on_penalties = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agency_propertyowner'
        ordering = ['full_name']

    def __str__(self):
        return self.full_name


class OwnerStatement(models.Model):
    """An approved remittance statement for one owner and period. Figures are frozen at approval."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='owner_statements')
    owner = models.ForeignKey(PropertyOwner, on_delete=models.PROTECT, related_name='statements')
    number = models.CharField(max_length=30)
    period_start = models.DateField()
    period_end = models.DateField()
    figures = models.JSONField(default=dict)
    net_due = models.DecimalField(max_digits=14, decimal_places=2)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='owner_statements_approved',
    )
    approved_at = models.DateTimeField(default=timezone.now)
    emailed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'agency_ownerstatement'
        ordering = ['-period_start']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'number'], name='uniq_owner_statement_number_per_org'),
        ]

    def __str__(self):
        return f'{self.number} {self.owner} {self.period_start:%b %Y}'


class OwnerTransaction(models.Model):
    """Money paid to (or charged to) an owner outside a statement: remittances, advances, advance fees."""

    KIND_CHOICES = [
        ('remittance', 'Remittance paid'),
        ('advance', 'Advance / loan paid'),
        ('advance_fee', 'Advance fee / interest'),
    ]
    METHOD_CHOICES = PropertyOwner.PAYOUT_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='owner_transactions')
    owner = models.ForeignKey(PropertyOwner, on_delete=models.PROTECT, related_name='transactions')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    transaction_date = models.DateField()
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, blank=True, default='')
    reference = models.CharField(max_length=100, blank=True, default='')
    notes = models.CharField(max_length=255, blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='owner_transactions',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'agency_ownertransaction'
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f'{self.get_kind_display()} {self.amount} → {self.owner}'
