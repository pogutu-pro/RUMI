"""
Property domain — the canonical rental hierarchy for RUMIA.

Property → Building (optional) → Floor (optional) → RentalUnit → Tenancy

Units exist independently of tenants. The active tenancy determines occupancy.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Property(models.Model):
    """A rentable property: apartment block, estate, house, etc."""

    PROPERTY_TYPE_CHOICES = [
        ('apartment', 'Apartment'),
        ('residential_estate', 'Residential Estate'),
        ('house', 'House'),
        ('flat', 'Flat'),
        ('villa', 'Villa'),
        ('commercial_residential', 'Commercial-Residential'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('under_maintenance', 'Under Maintenance'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        'agency.PropertyOwner',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='properties',
        help_text='For agencies: the landlord this property is managed for. Empty = the organization owns it.',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='properties',
    )
    name = models.CharField(max_length=255)
    property_type = models.CharField(
        max_length=30, choices=PROPERTY_TYPE_CHOICES, default='apartment'
    )
    description = models.TextField(blank=True, default='')
    address = models.TextField()
    county = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=100, default='Nairobi')
    latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    default_monthly_rent = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(max_length=3, default='KES')
    total_units = models.PositiveIntegerField(default=0)
    images = models.JSONField(default=list, blank=True)
    settings = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'properties_property'
        verbose_name_plural = 'properties'
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_property_org_status'),
            models.Index(fields=['city'], name='idx_property_city'),
        ]

    def __str__(self):
        return self.name


class Building(models.Model):
    """Optional block/building within a property."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent_property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='buildings',
        db_column='property_id',
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'properties_building'
        unique_together = [['parent_property', 'name']]
        indexes = [
            models.Index(fields=['parent_property'], name='idx_building_property'),
        ]

    def __str__(self):
        return f'{self.parent_property.name} — {self.name}'


class Floor(models.Model):
    """Optional floor within a building."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='floors',
    )
    parent_property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='floors',
        db_column='property_id',
    )
    level = models.IntegerField(help_text='Floor number, e.g. 0=ground, 1=first')
    label = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        db_table = 'properties_floor'
        unique_together = [['building', 'level']]
        indexes = [
            models.Index(fields=['parent_property'], name='idx_floor_property'),
        ]

    def __str__(self):
        return f'{self.building.name} — Floor {self.level}'


class RentalUnit(models.Model):
    """
    A rentable unit within a property.

    Represents A101, A204, House 12 — never a bed.
    Occupancy is derived from active tenancies, not stored as source of truth.
    """

    UNIT_TYPE_CHOICES = [
        ('studio', 'Studio'),
        ('bedsitter', 'Bedsitter'),
        ('1_bedroom', '1 Bedroom'),
        ('2_bedroom', '2 Bedroom'),
        ('3_bedroom', '3 Bedroom'),
        ('4_bedroom', '4 Bedroom'),
        ('house', 'House'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('vacant', 'Vacant'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Maintenance/Unavailable'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='rental_units',
    )
    parent_property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='units',
        db_column='property_id',
    )
    building = models.ForeignKey(
        Building,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='units',
    )
    floor = models.ForeignKey(
        Floor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='units',
    )
    unit_number = models.CharField(max_length=50)
    unit_type = models.CharField(
        max_length=20, choices=UNIT_TYPE_CHOICES, default='1_bedroom'
    )
    monthly_rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='vacant')
    notes = models.TextField(blank=True, default='')
    amenities = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_listed = models.BooleanField(
        default=True, help_text='Advertise on the public RumiaRent listings while vacant (removed automatically once let).',
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'properties_rentalunit'
        unique_together = [['parent_property', 'unit_number']]
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_unit_org_status'),
            models.Index(fields=['parent_property', 'status'], name='idx_unit_property_status'),
        ]

    def __str__(self):
        return f'{self.parent_property.name} — {self.unit_number}'

    @property
    def active_tenancy(self):
        return self.tenancies.filter(status='active').order_by('-start_date').first()

    @property
    def current_tenant(self):
        tenancy = self.active_tenancy
        return tenancy.tenant if tenancy else None


class Tenancy(models.Model):
    """
    Contractual relationship between a tenant and a rental unit.

    A unit may have many tenancies over time; only one should be active at once.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('notice_period', 'Notice Period'),
        ('expired', 'Expired'),
        ('terminated', 'Terminated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='tenancies',
    )
    parent_property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='tenancies',
        db_column='property_id',
    )
    unit = models.ForeignKey(
        RentalUnit,
        on_delete=models.CASCADE,
        related_name='tenancies',
    )
    tenant = models.ForeignKey(
        'tenants.TenantProfile',
        on_delete=models.PROTECT,
        related_name='tenancies',
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    move_in_date = models.DateField(null=True, blank=True)
    move_out_date = models.DateField(null=True, blank=True)

    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2)
    deposit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    rent_due_day = models.PositiveIntegerField(
        default=5,
        help_text='Day of month rent is due (1-28)',
    )
    grace_period_days = models.PositiveIntegerField(default=5)
    prorate_final_period = models.BooleanField(
        default=True,
        help_text='Bill the last, partial month by days stayed (true) or as a full month (false).',
    )
    payment_reference = models.CharField(
        max_length=20, blank=True, default='',
        help_text='Account number tenants type when paying by paybill. Unique per organization.',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    renewal_notes = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tenancies',
    )

    class Meta:
        db_table = 'properties_tenancy'
        verbose_name_plural = 'tenancies'
        indexes = [
            models.Index(fields=['organization', 'status'], name='idx_tenancy_org_status'),
            models.Index(fields=['unit', 'status'], name='idx_tenancy_unit_status'),
            models.Index(fields=['tenant'], name='idx_tenancy_tenant'),
            models.Index(fields=['start_date', 'end_date'], name='idx_tenancy_dates'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['unit'],
                condition=models.Q(status='active'),
                name='unique_active_tenancy_per_unit',
            ),
            models.UniqueConstraint(
                fields=['organization', 'payment_reference'],
                condition=~models.Q(payment_reference=''),
                name='uniq_tenancy_payment_reference_per_org',
            ),
        ]

    def __str__(self):
        return f'{self.tenant.full_name} @ {self.unit.unit_number} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.payment_reference and self.organization_id and self.unit_id:
            self.payment_reference = next_payment_reference(self)
            if kwargs.get('update_fields') is not None:
                kwargs['update_fields'] = list({*kwargs['update_fields'], 'payment_reference'})
        super().save(*args, **kwargs)


def normalize_payment_reference(value: str) -> str:
    """Uppercase letters and digits only — how references are stored and matched."""
    return ''.join(ch for ch in (value or '').upper() if ch.isalnum())


def next_payment_reference(tenancy) -> str:
    """
    The unit number (normalized), or — when another tenancy in the organization
    already uses it (e.g. a re-let unit) — the unit number plus X2, X3…, so a
    former tenant's payment can never land on the new tenant's account.
    """
    base = normalize_payment_reference(tenancy.unit.unit_number)[:14] or 'T'
    taken = set(
        Tenancy.objects.filter(organization_id=tenancy.organization_id, payment_reference__startswith=base)
        .exclude(pk=tenancy.pk)
        .values_list('payment_reference', flat=True)
    )
    if base not in taken:
        return base
    n = 2
    while f'{base}X{n}' in taken:
        n += 1
    return f'{base}X{n}'


class CaretakerPropertyAssignment(models.Model):
    """
    Many-to-many assignment of caretakers to properties.

    Replaces the single-hostel FK on CaretakerProfile for RUMIA operations.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    caretaker_profile = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.CASCADE,
        related_name='property_assignments',
    )
    property_assignment = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='caretaker_assignments',
        db_column='property_id',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='caretaker_assignments',
    )
    permissions = models.JSONField(
        default=dict,
        blank=True,
        help_text='Property-scoped permissions override, e.g. can_record_payments',
    )
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(default=timezone.now)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='caretaker_assignments_made',
    )

    class Meta:
        db_table = 'properties_caretakerassignment'
        unique_together = [['caretaker_profile', 'property_assignment']]
        indexes = [
            models.Index(
                fields=['caretaker_profile', 'is_active'],
                name='idx_caretaker_assign_active',
            ),
            models.Index(fields=['property_assignment', 'is_active'], name='idx_property_assign_active'),
        ]

    def __str__(self):
        return f'{self.caretaker_profile} → {self.property_assignment.name}'


class PropertyConditionReport(models.Model):
    """
    Move-in / move-out property condition inspection.

    Foundation for deposit accountability — does not implement deductions yet.
    """

    REPORT_TYPE_CHOICES = [
        ('move_in', 'Move-In Inspection'),
        ('move_out', 'Move-Out Inspection'),
        ('periodic', 'Periodic Inspection'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('acknowledged', 'Acknowledged by Tenant'),
        ('disputed', 'Disputed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='condition_reports',
    )
    parent_property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='condition_reports',
        db_column='property_id',
    )
    unit = models.ForeignKey(
        RentalUnit,
        on_delete=models.CASCADE,
        related_name='condition_reports',
    )
    tenancy = models.ForeignKey(
        Tenancy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='condition_reports',
    )

    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    inspection_date = models.DateField(default=timezone.now)

    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conducted_inspections',
    )
    tenant_acknowledged = models.BooleanField(default=False)
    tenant_acknowledged_at = models.DateTimeField(null=True, blank=True)

    # Structured inspection data
    items = models.JSONField(
        default=list,
        blank=True,
        help_text='Checklist items: walls, doors, windows, floors, plumbing, etc.',
    )
    existing_damage = models.JSONField(default=list, blank=True)
    meter_readings = models.JSONField(default=dict, blank=True)
    photos = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'properties_conditionreport'
        indexes = [
            models.Index(fields=['tenancy', 'report_type'], name='idx_condition_tenancy_type'),
            models.Index(fields=['unit', 'report_type'], name='idx_condition_unit_type'),
        ]

    def __str__(self):
        return f'{self.get_report_type_display()} — {self.unit.unit_number}'
