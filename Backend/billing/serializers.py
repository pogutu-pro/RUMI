from rest_framework import serializers

from organizations.serializers import PayoutAccountSerializer
from rumia_api.serializers import OrganizationSerializer

from .models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan


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
