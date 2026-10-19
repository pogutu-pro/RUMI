"""RUMIA domain serializers."""

from decimal import Decimal

from rest_framework import serializers

from organizations.models import Organization
from properties.models import Property, RentalUnit, Tenancy
from rent.models import (
    CreditNote,
    Invoice,
    InvoiceLine,
    Payment,
    PenaltyPolicy,
    Receipt,
    RecurringCharge,
    RentCharge,
)
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
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', read_only=True
    )

    class Meta:
        model = Tenancy
        fields = [
            'id', 'organization', 'property', 'unit', 'tenant',
            'tenant_name', 'unit_number',
            'start_date', 'end_date', 'move_in_date', 'move_out_date',
            'monthly_rent', 'deposit', 'rent_due_day', 'grace_period_days', 'prorate_final_period',
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


class InvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLine
        fields = ['id', 'line_type', 'description', 'quantity', 'unit_price', 'amount']


class CreditNoteSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.number', read_only=True)

    class Meta:
        model = CreditNote
        fields = ['id', 'number', 'invoice', 'invoice_number', 'amount', 'reason', 'issue_date', 'created_at']


class RentChargeSerializer(serializers.ModelSerializer):
    """
    Invoice representation. Named for the pre-Phase-1 `/rent/` endpoints, whose
    response shape it keeps (`amount_due`, `late_fee_amount`, `outstanding`).
    """

    outstanding = serializers.SerializerMethodField()
    late_fee_amount = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    lines = InvoiceLineSerializer(many=True, read_only=True)
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', read_only=True
    )

    class Meta:
        model = Invoice
        fields = [
            'id', 'number', 'invoice_type', 'organization', 'tenancy', 'property', 'unit', 'tenant',
            'tenant_name', 'unit_number', 'issue_date',
            'period_start', 'period_end', 'due_date',
            'amount_due', 'amount_paid', 'amount_credited', 'late_fee_amount', 'outstanding',
            'status', 'is_disputed', 'currency', 'notes', 'lines', 'source_invoice', 'created_at',
        ]
        read_only_fields = fields

    def get_outstanding(self, obj):
        return str(obj.outstanding)

    def get_late_fee_amount(self, obj):
        # Late fees used to be a column; they are now penalty lines/invoices.
        total = sum((line.amount for line in obj.lines.all() if line.line_type == 'penalty'), Decimal('0.00'))
        return str(total)


InvoiceSerializer = RentChargeSerializer


class InvoiceLineInputSerializer(serializers.Serializer):
    line_type = serializers.ChoiceField(choices=[
        choice for choice in InvoiceLine.LINE_TYPE_CHOICES if choice[0] not in ('rent', 'penalty', 'deposit')
    ])
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=Decimal('0.001'), default=Decimal('1'))
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))


class AdhocInvoiceSerializer(serializers.Serializer):
    """Input for a landlord-raised one-off charge (repair, utility top-up, etc.)."""

    tenancy = serializers.PrimaryKeyRelatedField(queryset=Tenancy.objects.all())
    due_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    lines = InvoiceLineInputSerializer(many=True)

    def validate_lines(self, value):
        if not value:
            raise serializers.ValidationError('At least one line is required.')
        return value


class CreditNoteInputSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    reason = serializers.CharField(max_length=2000)


class PaymentSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', read_only=True
    )
    receipt = serializers.SerializerMethodField()

    def get_receipt(self, obj):
        receipt = getattr(obj, 'receipt', None)
        return {'id': str(receipt.id), 'number': receipt.number} if receipt else None

    class Meta:
        model = Payment
        fields = [
            'id', 'organization', 'tenancy', 'tenant', 'property', 'unit',
            'amount', 'unapplied_amount', 'currency', 'payment_method', 'provider',
            'provider_reference', 'internal_reference', 'status', 'notes',
            'paid_at', 'created_at', 'receipt',
        ]
        read_only_fields = [
            'id', 'organization', 'internal_reference', 'status', 'unapplied_amount',
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

    def validate(self, attrs):
        charge = attrs.get('rent_charge_id')
        if charge is not None:
            # The queryset spans every organization, so without this check a
            # landlord could mark another organization's charge paid (audit C4).
            if charge.tenancy_id != attrs['tenancy'].id:
                raise serializers.ValidationError(
                    {'rent_charge_id': 'This rent charge does not belong to the selected tenancy.'}
                )
            if attrs['amount'] > charge.outstanding:
                raise serializers.ValidationError(
                    {'amount': f'Amount exceeds the outstanding balance of {charge.outstanding} on this charge.'}
                )
        return attrs


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


class ReceiptSerializer(serializers.ModelSerializer):
    payment_reference = serializers.CharField(source='payment.internal_reference', read_only=True)
    amount = serializers.DecimalField(source='payment.amount', max_digits=12, decimal_places=2, read_only=True)
    tenancy = serializers.UUIDField(source='payment.tenancy_id', read_only=True)
    tenant_name = serializers.CharField(source='payment.tenant.full_name', read_only=True)

    class Meta:
        model = Receipt
        fields = [
            'id', 'number', 'payment', 'payment_reference', 'amount', 'tenancy', 'tenant_name',
            'issued_at', 'snapshot', 'sent_sms_at', 'sent_email_at',
        ]
        read_only_fields = fields


class RecurringChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringCharge
        fields = [
            'id', 'tenancy', 'line_type', 'description', 'amount', 'start_date', 'end_date', 'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'tenancy', 'created_at']

    def validate(self, attrs):
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})
        return attrs


class PenaltyPolicySerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(source='parent_property', read_only=True)

    class Meta:
        model = PenaltyPolicy
        fields = [
            'id', 'property', 'enabled', 'method', 'amount', 'percent', 'grace_days', 'frequency',
            'cap_percent_of_invoice', 'applies_to', 'notify_tenant', 'updated_at',
        ]
        read_only_fields = ['id', 'property', 'updated_at']

    def validate_applies_to(self, value):
        allowed = {'rent', 'adhoc', 'deposit'}
        if not isinstance(value, list) or not set(value) <= allowed:
            raise serializers.ValidationError(f'Choose from: {sorted(allowed)}')
        return value

    def validate(self, attrs):
        merged = {**({} if self.instance is None else {
            f: getattr(self.instance, f) for f in ('enabled', 'method', 'amount', 'percent')
        }), **attrs}
        if merged.get('enabled'):
            if merged.get('method', 'fixed') == 'fixed' and not merged.get('amount'):
                raise serializers.ValidationError({'amount': 'Set a penalty amount.'})
            if merged.get('method') == 'percent' and not (Decimal('0') < Decimal(merged.get('percent') or 0) <= 100):
                raise serializers.ValidationError({'percent': 'Percent must be between 0 and 100.'})
        return attrs
