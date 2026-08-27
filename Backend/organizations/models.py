"""
Organization — SaaS tenant boundary for RUMIA.

Every property, tenancy, tenant profile, and financial record belongs to exactly
one organization. Data isolation is enforced at the queryset level, not only in UI.
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Organization(models.Model):
    """
    Top-level account boundary.

    Supports individual landlords (type=individual) and property management
    companies (type=company) with multiple staff users.
    """

    TYPE_CHOICES = [
        ('individual', 'Individual Landlord'),
        ('company', 'Property Management Company'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    organization_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='individual'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Primary owner (typically the registering landlord)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_organizations',
    )

    # Optional link to legacy landlord profile during migration
    legacy_landlord_profile = models.OneToOneField(
        'accounts.LandlordProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organization',
    )

    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations_organization'
        indexes = [
            models.Index(fields=['slug'], name='idx_org_slug'),
            models.Index(fields=['status'], name='idx_org_status'),
            models.Index(fields=['owner'], name='idx_org_owner'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or str(self.id)[:8]
            candidate = base
            counter = 1
            while Organization.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f'{base}-{counter}'
                counter += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    """
    Links users to organizations with a scoped role.

    A user may belong to multiple organizations (e.g. consultant) but each
    property-scoped query still filters by the active organization context.
    """

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Administrator'),
        ('landlord', 'Landlord'),
        ('caretaker', 'Caretaker'),
        ('staff', 'Staff'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organization_memberships',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='landlord')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'organizations_membership'
        unique_together = [['organization', 'user']]
        indexes = [
            models.Index(fields=['organization', 'is_active'], name='idx_membership_org_active'),
            models.Index(fields=['user', 'is_active'], name='idx_membership_user_active'),
        ]

    def __str__(self):
        return f'{self.user.email} @ {self.organization.name} ({self.role})'
