"""
Landlord-side accounting on top of the ledger: expenses, and (computed, not
stored) monthly statements. See docs/roadmap/phase-3a-statements.md.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('repairs', 'Repairs and maintenance'),
        ('utilities', 'Utilities (paid by landlord)'),
        ('security_cleaning', 'Security and cleaning'),
        ('management_fees', 'Management fees'),
        ('insurance', 'Insurance'),
        ('rates_taxes', 'Land rates and taxes'),
        ('other', 'Other'),
    ]
    PAID_FROM_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank'),
        ('mpesa_paybill', 'M-Pesa'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='expenses')
    parent_property = models.ForeignKey(
        'properties.Property', on_delete=models.PROTECT, null=True, blank=True, related_name='expenses',
        db_column='property_id', help_text='Empty for organization-wide costs.',
    )
    unit = models.ForeignKey(
        'properties.RentalUnit', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses',
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=255)
    supplier = models.CharField(max_length=150, blank=True, default='')
    supplier_ref = models.ForeignKey(
        'accounting.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    expense_date = models.DateField()
    paid_from = models.CharField(max_length=20, choices=PAID_FROM_CHOICES, default='cash')
    reference = models.CharField(max_length=100, blank=True, default='')
    voided_at = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_recorded',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'accounting_expense'
        ordering = ['-expense_date', '-created_at']
        indexes = [models.Index(fields=['organization', 'expense_date'], name='idx_expense_org_date')]

    def __str__(self):
        return f'{self.expense_date} {self.get_category_display()} {self.amount}'


class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='suppliers')
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    kra_pin = models.CharField(max_length=20, blank=True, default='')
    category = models.CharField(max_length=30, blank=True, default='', help_text='Usual expense category')
    notes = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'accounting_supplier'
        ordering = ['name']
        constraints = [models.UniqueConstraint(fields=['organization', 'name'], name='uniq_supplier_name_per_org')]

    def __str__(self):
        return self.name


class StatementImport(models.Model):
    """An uploaded bank or M-Pesa statement (CSV) being reconciled against RumiaRent's records."""

    ACCOUNT_CHOICES = [
        ('1010', 'Bank'),
        ('1020', 'M-Pesa paybill'),
        ('1000', 'Cash'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='statement_imports')
    account_code = models.CharField(max_length=10, choices=ACCOUNT_CHOICES)
    filename = models.CharField(max_length=255)
    imported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'accounting_statementimport'
        ordering = ['-created_at']


class StatementLine(models.Model):
    STATUS_CHOICES = [
        ('matched', 'Matches a recorded payment'),
        ('created', 'Recorded as a tenant payment'),
        ('unmatched', 'Needs attention'),
        ('ignored', 'Not rent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    statement = models.ForeignKey(StatementImport, on_delete=models.CASCADE, related_name='lines')
    line_date = models.DateField()
    reference = models.CharField(max_length=100, blank=True, default='')
    description = models.CharField(max_length=255, blank=True, default='')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unmatched')
    payment = models.ForeignKey('rent.Payment', on_delete=models.SET_NULL, null=True, blank=True, related_name='statement_lines')
    note = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'accounting_statementline'
        ordering = ['line_date']
