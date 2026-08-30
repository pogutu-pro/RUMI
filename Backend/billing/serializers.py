from rest_framework import serializers

from .models import OrganizationSubscription, SubscriptionPlan


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
