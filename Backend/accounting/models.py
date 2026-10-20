"""
Basic accounting and Monthly Rental Income (MRI) tax preparation.

RumiaRent only PREPARES the numbers a landlord needs; it never files anything
with KRA. Free on every plan tier.
"""

import re
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

KRA_PIN_PATTERN = re.compile(r'^[AP]\d{9}[A-Z]$')


class TaxRateConfig(models.Model):
    """
    Platform-wide MRI parameters (a single row). Rates and thresholds have
    changed before (10% to 7.5% in 2024), so a super admin edits them here
    instead of them being buried in code.
    """

    mri_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('7.50'))
    mri_annual_min = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('288000'))
    mri_annual_max = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('15000000'))
    filing_due_day = models.PositiveSmallIntegerField(default=20)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounting_tax_rate_config'

    @classmethod
    def get(cls) -> 'TaxRateConfig':
        config, _ = cls.objects.get_or_create(pk=1)
        return config


class OrganizationTaxProfile(models.Model):
    """The landlord's KRA PIN, kept for their own filing worksheet. Never a password."""

    organization = models.OneToOneField(
        'organizations.Organization', on_delete=models.CASCADE, related_name='tax_profile',
    )
    kra_pin = models.CharField(max_length=11, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounting_tax_profile'

    def clean(self):
        if self.kra_pin and not KRA_PIN_PATTERN.match(self.kra_pin):
            raise ValidationError({'kra_pin': 'A KRA PIN looks like A123456789B.'})


class MriFiling(models.Model):
    """
    A landlord's own record that they filed (and paid) MRI for a month, with a
    snapshot of the figures at the time so a later correction is visible.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='mri_filings')
    month = models.DateField(help_text='First day of the rent month this return covers.')
    gross_rent = models.DecimalField(max_digits=14, decimal_places=2)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    mri_amount = models.DecimalField(max_digits=14, decimal_places=2)
    filed_on = models.DateField(default=timezone.localdate)
    reference = models.CharField(max_length=100, blank=True, default='', help_text='iTax / eRITS receipt or payment reference.')
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'accounting_mri_filing'
        constraints = [models.UniqueConstraint(fields=['organization', 'month'], name='uniq_mri_filing_month')]
        ordering = ['-month']


class Expense(models.Model):
    """
    Money a landlord spent running a property. Never hard-deleted: a mistake is
    voided with a reason so the books keep their history.
    """

    CATEGORIES = [
        ('repairs', 'Repairs and maintenance'),
        ('utilities', 'Utilities (water, power)'),
        ('caretaker', 'Caretaker pay'),
        ('security', 'Security'),
        ('cleaning', 'Cleaning and garbage'),
        ('insurance', 'Insurance'),
        ('land_rates', 'Land rates and permits'),
        ('agent_fees', 'Agent or management fees'),
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
        'properties.Property', null=True, blank=True, on_delete=models.SET_NULL, related_name='expenses',
    )
    category = models.CharField(max_length=20, choices=CATEGORIES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    incurred_on = models.DateField()
    vendor = models.CharField(max_length=150, blank=True, default='')
    description = models.CharField(max_length=300, blank=True, default='')
    receipt = models.FileField(upload_to='expense_receipts/%Y/%m/', null=True, blank=True)

    # Added with the ledger: what paid for it, which unit, which supplier.
    unit = models.ForeignKey(
        'properties.RentalUnit', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses',
    )
    supplier_ref = models.ForeignKey(
        'accounting.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses',
    )
    paid_from = models.CharField(max_length=20, choices=PAID_FROM_CHOICES, default='cash')
    reference = models.CharField(max_length=100, blank=True, default='')

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+',
    )
    is_void = models.BooleanField(default=False)
    void_reason = models.CharField(max_length=300, blank=True, default='')
    voided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounting_expense'
        ordering = ['-incurred_on', '-created_at']
        indexes = [models.Index(fields=['organization', 'incurred_on'], name='idx_expense_org_date')]

    def __str__(self):
        return f'{self.incurred_on} {self.get_category_display()} {self.amount}'


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
