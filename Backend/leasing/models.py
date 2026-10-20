"""
Lease lifecycle and debt control (EazzyRent parity):
documents (generated lease/demand/quit/notice letters and uploads), debt
recovery cases, scheduled rent reviews, and lease-expiry reminder log.
See docs/roadmap/phase-3c-leasing.md.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class TenancyDocument(models.Model):
    KIND_CHOICES = [
        ('lease', 'Lease agreement'),
        ('demand_note', 'Demand note'),
        ('quit_notice', 'Notice to quit'),
        ('notice_to_vacate', 'Notice to vacate (from tenant)'),
        ('id_copy', 'ID copy'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='tenancy_documents')
    tenancy = models.ForeignKey('properties.Tenancy', on_delete=models.CASCADE, related_name='documents')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='tenancy-documents/%Y/%m/')
    generated = models.BooleanField(default=False)
    visible_to_tenant = models.BooleanField(default=True)
    details = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='tenancy_documents',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'leasing_tenancydocument'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_kind_display()}: {self.title}'


class DebtCase(models.Model):
    """A debt-recovery task for one tenancy, assigned to a staff member."""

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('promised', 'Promised to pay'),
        ('escalated', 'Escalated'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='debt_cases')
    tenancy = models.ForeignKey('properties.Tenancy', on_delete=models.CASCADE, related_name='debt_cases')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='debt_cases_assigned',
    )
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='open')
    amount_at_open = models.DecimalField(max_digits=12, decimal_places=2)
    promise_date = models.DateField(null=True, blank=True)
    promise_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    closed_reason = models.CharField(max_length=255, blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='debt_cases_created',
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leasing_debtcase'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['tenancy'], condition=~models.Q(status='closed'), name='uniq_open_debt_case_per_tenancy',
            ),
        ]


class DebtCaseNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(DebtCase, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'leasing_debtcasenote'
        ordering = ['created_at']


class RentReview(models.Model):
    """A scheduled rent change; applied on its effective date, tenant told in advance."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='rent_reviews')
    tenancy = models.ForeignKey('properties.Tenancy', on_delete=models.CASCADE, related_name='rent_reviews')
    effective_date = models.DateField()
    new_monthly_rent = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0.01'))],
    )
    increase_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    repeat_annually = models.BooleanField(default=False, help_text='After applying, schedule the same % a year later.')
    notified_at = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(null=True, blank=True)
    applied_rent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    previous_rent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'leasing_rentreview'
        ordering = ['effective_date']


class LeaseReminder(models.Model):
    """Log of lease-expiry reminders so each threshold is sent once."""

    tenancy = models.ForeignKey('properties.Tenancy', on_delete=models.CASCADE, related_name='lease_reminders')
    key = models.CharField(max_length=20)
    sent_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'leasing_leasereminder'
        constraints = [models.UniqueConstraint(fields=['tenancy', 'key'], name='uniq_lease_reminder')]
