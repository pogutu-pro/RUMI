"""RUMIA domain serializers."""

from decimal import Decimal

from rest_framework import serializers

from organizations.models import Organization
from properties.models import Property, RentalUnit, Tenancy
from rent.models import Payment, RentCharge
from tenants.models import EmergencyContact, TenantProfile


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'organization_type', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class OrganizationCreateInputSerializer(serializers.Serializer):
    """Input validation for POST /organizations/ — landlord onboarding wizard's org step."""

    name = serializers.CharField(min_length=2, max_length=255)
    organization_type = serializers.ChoiceField(
        choices=Organization.TYPE_CHOICES, default='individual', required=False,
    )


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'id', 'organization', 'name', 'property_type', 'description',
            'address', 'county', 'city', 'status', 'default_monthly_rent',
            'currency', 'total_units', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class RentalUnitSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', queryset=Property.objects.all()
    )

    class Meta:
        model = RentalUnit
        fields = [
            'id', 'organization', 'property', 'building', 'floor',
            'unit_number', 'unit_type', 'monthly_rent', 'deposit',
            'status', 'notes', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class TenancySerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    property_name = serializers.CharField(source='parent_property.name', read_only=True)
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', read_only=True
    )

    class Meta:
        model = Tenancy
        fields = [
            'id', 'organization', 'property', 'unit', 'tenant',
            'tenant_name', 'unit_number', 'property_name',
            'start_date', 'end_date', 'move_in_date', 'move_out_date',
            'monthly_rent', 'deposit', 'rent_due_day', 'grace_period_days',
            'status', 'renewal_notes', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class TenantProfileSerializer(serializers.ModelSerializer):
    # Captured at onboarding, not stored on TenantProfile itself — see
    # tenants.services.save_emergency_contacts. Each item may contain:
    # full_name, relationship, phone, alternative_phone, email, address,
    # is_primary, purpose ('emergency_only' | 'rent_escalation_authorized' | 'both'),
    # consent_given (bool), consent_notes.
    emergency_contacts = serializers.ListField(
        child=serializers.DictField(), required=False, write_only=True,
    )

    class Meta:
        model = TenantProfile
        fields = [
            'id', 'organization', 'user', 'full_name', 'phone', 'email',
            'national_id', 'occupation', 'address', 'status', 'notes',
            'emergency_contacts', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'user', 'created_at', 'updated_at']


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'tenant', 'full_name', 'relationship', 'phone',
            'alternative_phone', 'email', 'address', 'is_primary', 'purpose',
            'consent_recorded_at', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class RentChargeSerializer(serializers.ModelSerializer):
    outstanding = serializers.SerializerMethodField()
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', read_only=True
    )

    class Meta:
        model = RentCharge
        fields = [
            'id', 'organization', 'tenancy', 'property', 'unit', 'tenant',
            'period_start', 'period_end', 'due_date',
            'amount_due', 'amount_paid', 'late_fee_amount', 'outstanding',
            'status', 'currency', 'notes', 'created_at',
        ]
        read_only_fields = [
            'id', 'organization', 'amount_paid', 'status', 'created_at',
        ]

    def get_outstanding(self, obj):
        return str(obj.outstanding)


class PaymentSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            'id', 'organization', 'tenancy', 'tenant', 'property', 'unit',
            'amount', 'currency', 'payment_method', 'provider',
            'provider_reference', 'internal_reference', 'status',
            'paid_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'organization', 'internal_reference', 'status',
            'provider_reference', 'paid_at', 'created_at',
        ]


class PaymentInitiateSerializer(serializers.Serializer):
    """Input for POST /payments/ — starts a Paystack payment. Status is never accepted from the client."""

    tenancy = serializers.PrimaryKeyRelatedField(queryset=Tenancy.objects.all())
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    currency = serializers.CharField(max_length=3, default='KES')


class ManualPaymentSerializer(serializers.Serializer):
    """Input for recording a cash/bank payment against one or more rent charges."""

    tenancy = serializers.PrimaryKeyRelatedField(queryset=Tenancy.objects.all())
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    payment_method = serializers.ChoiceField(choices=['cash', 'bank_transfer', 'other'], default='cash')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    rent_charge_id = serializers.PrimaryKeyRelatedField(
        queryset=RentCharge.objects.all(), required=False, allow_null=True,
    )


class TenancyTerminateSerializer(serializers.Serializer):
    move_out_date = serializers.DateField(required=False)
    renewal_notes = serializers.CharField(required=False, allow_blank=True)


class CaretakerSerializer(serializers.Serializer):
    """Read view of a caretaker within an organization, with their assigned properties."""

    id = serializers.IntegerField(source='user.id')
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email')
    phone = serializers.CharField(source='user.phone_number')
    is_active = serializers.BooleanField()
    permissions = serializers.JSONField()
    assigned_properties = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()

    def get_full_name(self, obj):
        return obj.user.get_full_name().strip() or obj.user.email

    def get_assigned_properties(self, obj):
        return [
            {'id': str(a.property_assignment_id), 'name': a.property_assignment.name}
            for a in obj.property_assignments.filter(is_active=True).select_related('property_assignment')
        ]


class CaretakerCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.RegexField(r'^\+254[0-9]{9}$')
    emergency_contact_name = serializers.CharField()
    emergency_contact_phone = serializers.RegexField(r'^\+254[0-9]{9}$')
    property_ids = serializers.ListField(child=serializers.UUIDField(), required=False, default=list)
    permissions = serializers.DictField(required=False, default=dict)
