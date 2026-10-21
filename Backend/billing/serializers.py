from rest_framework import serializers

from organizations.serializers import PayoutAccountSerializer
from rumia_api.serializers import OrganizationSerializer

from .models import ManualPaymentInstructions, OrganizationSubscription, SubscriptionPayment, SubscriptionPlan


class ManualPaymentInstructionsSerializer(serializers.ModelSerializer):
    instructions = serializers.CharField(allow_blank=True, max_length=2000, trim_whitespace=False)

    class Meta:
        model = ManualPaymentInstructions
        fields = ['instructions', 'updated_at']
        read_only_fields = ['updated_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Public plan representation — never exposes `paystack_plan_code`."""

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'price', 'interval',
            'max_properties', 'max_units', 'max_caretaker_seats', 'features',
        ]


class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    """Subscription representation — excludes all `paystack_*` code/token fields."""

    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = OrganizationSubscription
        fields = [
            'id', 'plan', 'plan_details', 'status', 'billing_mode',
            'current_period_start', 'current_period_end', 'grace_period_ends_at',
            'auto_renew', 'cancel_at_period_end',
        ]


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    """
    Support-facing "last charge event" row. Deliberately excludes `metadata`,
    which may contain internal Paystack payload noise not meant for a
    support UI.
    """

    class Meta:
        model = SubscriptionPayment
        fields = [
            'id', 'amount', 'currency', 'status', 'paystack_reference',
            'initiated_at', 'paid_at', 'failed_at', 'failure_reason',
        ]


class AdminOrganizationBillingListSerializer(serializers.Serializer):
    """
    Flat summary row for the super-admin organization list (ADMIN-02):
    plan/status/payout visible inline, no click-through required.
    """

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    subscription_status = serializers.CharField(allow_null=True)
    plan_name = serializers.CharField(allow_null=True)
    plan_slug = serializers.CharField(allow_null=True)
    payout_status = serializers.CharField()


class AdminOrganizationBillingDetailSerializer(serializers.Serializer):
    """
    Super-admin-only joined billing record (ADMIN-01/ADMIN-02): raw
    subscription fields (via `OrganizationSubscriptionSerializer`, which
    already excludes `paystack_*`), the GatingService-computed effective
    plan, the masked payout status (via `PayoutAccountSerializer`, which
    already masks bank details), and the single most-recent
    `SubscriptionPayment` row as "last charge event".
    """

    organization = OrganizationSerializer()
    subscription = OrganizationSubscriptionSerializer(allow_null=True)
    effective_plan = SubscriptionPlanSerializer()
    payout = PayoutAccountSerializer(allow_null=True)
    last_charge_event = SubscriptionPaymentSerializer(allow_null=True)


class AdminPlanSerializer(serializers.ModelSerializer):
    """
    What a super admin may edit on a tier. `slug`, the billing interval and
    the Paystack code are read-only: the three tiers are a fixed set that the
    rest of the system (trial, gating, upgrade path) refers to by slug.
    """

    ALLOWED_FEATURES = ('analytics',)
    MAX_PRICE = 1_000_000
    MAX_LIMIT = 100_000

    paystack_linked = serializers.SerializerMethodField()
    active_subscribers = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'price', 'interval',
            'max_properties', 'max_units', 'max_caretaker_seats', 'features',
            'sort_order', 'paystack_linked', 'active_subscribers', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'interval', 'sort_order', 'updated_at']

    def get_paystack_linked(self, obj):
        return bool(obj.paystack_plan_code)

    def get_active_subscribers(self, obj):
        return obj.subscriptions.filter(status__in=['active', 'past_due']).count()

    def validate_name(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Name is required.')
        return value

    def validate_price(self, value):
        if value < 1 or value > self.MAX_PRICE:
            raise serializers.ValidationError(f'Price must be between 1 and {self.MAX_PRICE:,} KES.')
        return value

    def _validate_limit(self, value):
        if value < 0 or value > self.MAX_LIMIT:
            raise serializers.ValidationError(f'Enter 0 (unlimited) or a number up to {self.MAX_LIMIT:,}.')
        return value

    validate_max_properties = _validate_limit
    validate_max_units = _validate_limit
    validate_max_caretaker_seats = _validate_limit

    def validate_features(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Features must be an object of on/off switches.')
        unknown = [k for k in value if k not in self.ALLOWED_FEATURES]
        if unknown:
            raise serializers.ValidationError(f'Unknown feature: {", ".join(sorted(unknown))}.')
        if not all(isinstance(v, bool) for v in value.values()):
            raise serializers.ValidationError('Each feature must be true or false.')
        # Merge so a partial update never silently drops another switch.
        return {**(self.instance.features if self.instance else {}), **value}
