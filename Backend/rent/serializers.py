from rest_framework import serializers
from . import models
from decimal import Decimal


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Organization
        fields = ['id', 'name', 'slug', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Property
        fields = ['id', 'organization', 'owner', 'name', 'address', 'city', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Building
        fields = ['id', 'property', 'name', 'address', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Floor
        fields = ['id', 'property', 'building', 'number', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RentalUnitSerializer(serializers.ModelSerializer):
    rent_amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        model = models.RentalUnit
        fields = ['id', 'property', 'building', 'floor', 'unit_number', 'unit_type', 'rent_amount', 'deposit_amount', 'status', 'availability', 'occupancy', 'notes', 'condition', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'occupancy']


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tenant
        fields = ['id', 'user', 'organization', 'full_name', 'email', 'phone', 'identification_number', 'address', 'next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_relationship', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TenancySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tenancy
        fields = ['id', 'tenant', 'unit', 'organization', 'start_date', 'end_date', 'status', 'rent_amount', 'deposit_amount', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        # Ensure tenant, unit, and organization match
        tenant = data.get('tenant')
        unit = data.get('unit')
        organization = data.get('organization')
        if tenant.organization_id != organization.id:
            raise serializers.ValidationError('Tenant and tenancy organization must match')
        if unit.property.organization_id != organization.id:
            raise serializers.ValidationError('Unit property and tenancy organization must match')
        return data


class RentChargeSerializer(serializers.ModelSerializer):
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    outstanding_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = models.RentCharge
        fields = ['id', 'tenancy', 'organization', 'amount', 'due_date', 'status', 'description', 'paid_amount', 'outstanding_amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'paid_amount', 'outstanding_amount', 'created_at', 'updated_at']


class PaymentProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PaymentProvider
        fields = ['id', 'organization', 'name', 'provider_type', 'api_key', 'webhook_secret', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PaymentAllocation
        fields = ['id', 'payment', 'rent_charge', 'amount', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    internal_reference = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    idempotency_key = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = models.Payment
        fields = ['id', 'organization', 'tenant', 'tenancy', 'provider', 'amount', 'currency', 'status', 'internal_reference', 'external_reference', 'idempotency_key', 'provider_response', 'verified_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'internal_reference', 'provider_response', 'verified_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        idem = validated_data.get('idempotency_key') or (request and request.headers.get('Idempotency-Key'))
        if idem:
            existing = models.Payment.objects.filter(idempotency_key=idem).first()
            if existing:
                return existing
        # Force status to pending regardless of client input
        validated_data['status'] = 'pending'
        # Generate internal ref via model default
        payment = super().create(validated_data)
        if idem:
            payment.idempotency_key = idem
            payment.save(update_fields=['idempotency_key'])
        return payment
