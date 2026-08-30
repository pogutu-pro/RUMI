"""
Tenant domain models — separate from User authentication.

TenantProfile holds rental-specific data. EmergencyContact and EscalationPolicy
are kept distinct so next-of-kin is never conflated with rent collection.
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class TenantProfile(models.Model):
    """
    Rental tenant profile — not overloaded onto User.

    May exist without a linked User account (caretaker-created tenant pending signup).
    """

    STATUS_CHOICES = [
        ('prospect', 'Prospect'),
        ('active', 'Active'),
        ('notice_period', 'Notice Period'),
        ('former', 'Former Tenant'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='tenant_profiles',
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenant_profile',
    )

    # Legacy bridge — populated during hostel→RUMIA migration
    legacy_student_profile = models.OneToOneField(
        'accounts.StudentProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenant_profile',
    )

    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    national_id = models.CharField(max_length=50, blank=True, default='')
    occupation = models.CharField(max_length=255, blank=True, default='')
    address = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='prospect')
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tenant_profiles',
    )

    class Meta:
        db_table = 'tenants_tenantprofile'
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_tenant_org_status'),
            models.Index(fields=['phone'], name='idx_tenant_phone'),
            models.Index(fields=['full_name'], name='idx_tenant_name'),
        ]

    def __str__(self):
        return self.full_name


class EmergencyContact(models.Model):
    """
    Next-of-kin / emergency contact for a tenant.

    Purpose defaults to emergency-only. Rent escalation requires explicit
    authorization recorded on the contact or via EscalationPolicy.
    """

    PURPOSE_CHOICES = [
        ('emergency_only', 'Emergency Only'),
        ('rent_escalation_authorized', 'Rent Escalation Authorized'),
        ('both', 'Emergency and Rent Escalation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        TenantProfile,
        on_delete=models.CASCADE,
        related_name='emergency_contacts',
    )
    full_name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    alternative_phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    is_primary = models.BooleanField(default=False)
    purpose = models.CharField(
        max_length=40, choices=PURPOSE_CHOICES, default='emergency_only'
    )
    consent_recorded_at = models.DateTimeField(null=True, blank=True)
    consent_notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants_emergencycontact'
        indexes = [
            models.Index(fields=['tenant', 'is_primary'], name='idx_emergency_tenant_primary'),
        ]

    def __str__(self):
        return f'{self.full_name} ({self.relationship}) — {self.tenant.full_name}'


class EscalationPolicy(models.Model):
    """
    Organization-level rules for rent reminder and escalation workflows.

    Next-of-kin contact for rent is NEVER automatic — it requires explicit
    configuration and tenant consent on EmergencyContact.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='escalation_policy',
    )

    # Days after due date for each escalation step
    first_reminder_days_before = models.PositiveIntegerField(default=7)
    second_reminder_days_before = models.PositiveIntegerField(default=3)
    due_date_reminder = models.BooleanField(default=True)
    overdue_reminder_days = models.JSONField(
        default=list,
        blank=True,
        help_text='Days after due date to send overdue reminders, e.g. [1, 3, 7, 14]',
    )
    caretaker_escalation_after_days = models.PositiveIntegerField(default=14)
    landlord_escalation_after_days = models.PositiveIntegerField(default=21)

    # Next-of-kin for rent — off by default
    allow_next_of_kin_rent_contact = models.BooleanField(default=False)
    next_of_kin_contact_after_days = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Only applies when allow_next_of_kin_rent_contact is True',
    )

    notification_channels = models.JSONField(
        default=list,
        blank=True,
        help_text='Enabled channels: in_app, email, sms, whatsapp',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants_escalationpolicy'

    def __str__(self):
        return f'Escalation policy — {self.organization.name}'
