from __future__ import annotations

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=120, unique=True)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('ACTIVE', 'Active'), ('inactive', 'Inactive'), ('INACTIVE', 'Inactive')],
        default='active',
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Property(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='properties')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_properties')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('ACTIVE', 'Active'), ('inactive', 'Inactive'), ('INACTIVE', 'Inactive'), ('maintenance', 'Maintenance'), ('MAINTENANCE', 'Maintenance')],
        default='active',
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['organization', 'name'], name='unique_property_name_per_org'),
        ]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.organization.name})'


class Building(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='buildings')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('ACTIVE', 'Active'), ('inactive', 'Inactive'), ('INACTIVE', 'Inactive')],
        default='active',
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['property', 'name'], name='unique_building_name_per_property'),
        ]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.property.name})'


class Floor(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='floors', null=True, blank=True)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floors', null=True, blank=True)
    number = models.IntegerField()
    name = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['building', 'number'], name='unique_floor_number_per_building', condition=models.Q(building__isnull=False)),
            models.UniqueConstraint(fields=['property', 'number'], name='unique_floor_number_per_property', condition=models.Q(building__isnull=True, property__isnull=False)),
        ]
        ordering = ['number']

    def clean(self):
        if self.building_id and self.property_id and self.building.property_id != self.property_id:
            raise ValidationError('Floor property must match its building property.')
        if self.building_id is None and self.property_id is None:
            raise ValidationError('A floor must belong to either a property or a building.')
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name or f'Floor {self.number}'


class RentalUnit(models.Model):
    UNIT_TYPE_CHOICES = [
        ('studio', 'Studio'),
        ('1bedroom', '1 Bedroom'),
        ('2bedroom', '2 Bedroom'),
        ('3bedroom', '3 Bedroom'),
        ('commercial', 'Commercial'),
    ]
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('AVAILABLE', 'Available'),
        ('occupied', 'Occupied'),
        ('OCCUPIED', 'Occupied'),
        ('maintenance', 'Maintenance'),
        ('MAINTENANCE', 'Maintenance'),
        ('reserved', 'Reserved'),
        ('RESERVED', 'Reserved'),
        ('inactive', 'Inactive'),
        ('INACTIVE', 'Inactive'),
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='rental_units')
    building = models.ForeignKey(Building, on_delete=models.SET_NULL, related_name='rental_units', null=True, blank=True)
    floor = models.ForeignKey(Floor, on_delete=models.SET_NULL, related_name='rental_units', null=True, blank=True)
    unit_number = models.CharField(max_length=50)
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES, default='studio')
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    availability = models.CharField(max_length=20, choices=[('vacant', 'Vacant'), ('booked', 'Booked'), ('occupied', 'Occupied')], default='vacant')
    occupancy = models.IntegerField(default=0)
    notes = models.TextField(blank=True, default='')
    condition = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['property', 'unit_number'], name='unique_unit_number_per_property'),
        ]
        ordering = ['unit_number']

    def clean(self):
        if self.building_id and self.building.property_id != self.property_id:
            raise ValidationError('Building must belong to the same property.')
        if self.floor_id and self.floor.property_id and self.floor.property_id != self.property_id:
            raise ValidationError('Floor must belong to the same property.')
        if self.floor_id and self.building_id and self.floor.building_id != self.building_id:
            raise ValidationError('Floor must belong to the same building.')
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.property.name} - {self.unit_number}'


class Tenant(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenant_profile_rumia')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='tenants')
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    identification_number = models.CharField(max_length=100, blank=True, default='')
    address = models.TextField(blank=True, default='')
    next_of_kin_name = models.CharField(max_length=255, blank=True, default='')
    next_of_kin_phone = models.CharField(max_length=30, blank=True, default='')
    next_of_kin_relationship = models.CharField(max_length=100, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['organization', 'user'], name='unique_tenant_user_per_org'),
        ]
        ordering = ['full_name']

    def save(self, *args, **kwargs):
        if not self.email and self.user_id:
            self.email = self.user.email
        if not self.full_name and self.user_id:
            self.full_name = self.user.get_full_name()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name or self.email or str(self.user)


class Tenancy(models.Model):
    TENANCY_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('DRAFT', 'Draft'),
        ('active', 'Active'),
        ('ACTIVE', 'Active'),
        ('ended', 'Ended'),
        ('ENDED', 'Ended'),
        ('cancelled', 'Cancelled'),
        ('CANCELLED', 'Cancelled'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tenancies')
    unit = models.ForeignKey(RentalUnit, on_delete=models.CASCADE, related_name='tenancies')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='tenancies')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TENANCY_STATUS_CHOICES, default='active')
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['unit'], name='unique_active_tenancy_per_unit', condition=models.Q(status='active')),
        ]
        ordering = ['-start_date']

    def clean(self):
        if self.tenant.organization_id != self.organization_id:
            raise ValidationError('Tenant and tenancy must belong to the same organization.')
        if self.unit.property.organization_id != self.organization_id:
            raise ValidationError('Unit property and tenancy must belong to the same organization.')
        if self.tenant_id and self.unit_id:
            if self.unit.property.organization_id != self.tenant.organization_id:
                raise ValidationError('Tenant and unit must belong to the same organization.')
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError('End date cannot be before start date.')
        active_exists = Tenancy.objects.filter(unit=self.unit, status='active').exclude(pk=self.pk).exists()
        if self.status == 'active' and active_exists:
            raise ValidationError('Only one active tenancy is allowed per rental unit.')
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tenant.full_name} - {self.unit.unit_number}'


class RentCharge(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('UNPAID', 'Unpaid'),
        ('partially_paid', 'Partially Paid'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('paid', 'Paid'),
        ('PAID', 'Paid'),
        ('overdue', 'Overdue'),
        ('OVERDUE', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('CANCELLED', 'Cancelled'),
    ]

    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='rent_charges')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='rent_charges')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    due_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    @property
    def paid_amount(self):
        return sum(
            (allocation.amount for allocation in self.payment_allocations.filter(status='allocated')),
            Decimal('0.00'),
        )

    @property
    def outstanding_amount(self):
        return max(self.amount - self.paid_amount, Decimal('0.00'))

    def clean(self):
        if self.tenancy.organization_id != self.organization_id:
            raise ValidationError('Rent charge organization must match tenancy organization.')
        if self.tenancy.unit.property.organization_id != self.organization_id:
            raise ValidationError('Rent charge organization must match the unit property organization.')
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tenancy.tenant.full_name} - {self.amount}'


class PaymentProvider(models.Model):
    PROVIDER_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('MPESA', 'M-Pesa'),
        ('M-PESA', 'M-Pesa'),
        ('paystack', 'Paystack'),
        ('PAYSTACK', 'Paystack'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payment_providers')
    name = models.CharField(max_length=255)
    provider_type = models.CharField(max_length=30, choices=PROVIDER_CHOICES, default='mpesa')
    api_key = models.CharField(max_length=255, blank=True, default='')
    webhook_secret = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.provider_type})'


def default_internal_reference():
    return uuid.uuid4().hex


class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('PENDING', 'Pending'),
        ('initiated', 'Initiated'),
        ('INITIATED', 'Initiated'),
        ('verified', 'Verified'),
        ('VERIFIED', 'Verified'),
        ('failed', 'Failed'),
        ('FAILED', 'Failed'),
        ('reversed', 'Reversed'),
        ('REVERSED', 'Reversed'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payments')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='payments')
    provider = models.ForeignKey(PaymentProvider, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=10, default='KES')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    internal_reference = models.CharField(max_length=255, unique=True, default=default_internal_reference)
    external_reference = models.CharField(max_length=255, blank=True, default='')
    idempotency_key = models.CharField(max_length=255, unique=True, blank=True, default='')
    provider_response = models.JSONField(blank=True, default=dict)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.tenant.organization_id != self.organization_id:
            raise ValidationError('Payment organization must match tenant organization.')
        if self.tenancy.organization_id != self.organization_id:
            raise ValidationError('Payment organization must match tenancy organization.')
        if self.provider.organization_id != self.organization_id:
            raise ValidationError('Payment provider must belong to the same organization.')
        if self.tenant_id and self.tenancy_id and self.tenancy.tenant_id != self.tenant_id:
            raise ValidationError('Payment tenant must match the tenancy tenant.')
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def reverse(self):
        self.status = 'reversed'
        self.save(update_fields=['status', 'updated_at'])
        for allocation in self.allocations.filter(status='allocated'):
            allocation.status = 'reversed'
            allocation.save(update_fields=['status', 'updated_at'])

    def __str__(self):
        return f'{self.internal_reference} - {self.amount}'


class PaymentAllocation(models.Model):
    STATUS_CHOICES = [
        ('allocated', 'Allocated'),
        ('ALLOCATED', 'Allocated'),
        ('reversed', 'Reversed'),
        ('REVERSED', 'Reversed'),
    ]

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='allocations')
    rent_charge = models.ForeignKey(RentCharge, on_delete=models.CASCADE, related_name='payment_allocations')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='allocated')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['payment', 'rent_charge'], name='unique_payment_allocation_per_charge'),
        ]
        ordering = ['-created_at']

    def clean(self):
        if self.payment.organization_id != self.rent_charge.organization_id:
            raise ValidationError('Payment and rent charge must belong to the same organization.')
        if self.payment.tenant_id != self.rent_charge.tenancy.tenant_id:
            raise ValidationError('Payment and rent charge must belong to the same tenant.')
        if self.amount < 0:
            raise ValidationError('Allocation amount cannot be negative.')
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def reverse(self):
        self.status = 'reversed'
        self.save(update_fields=['status', 'updated_at'])

    def __str__(self):
        return f'{self.payment.internal_reference} -> {self.rent_charge_id}'
