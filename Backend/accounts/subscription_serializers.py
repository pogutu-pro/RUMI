"""
Serializers for subscription-related models
"""
from rest_framework import serializers
from .subscription_models import (
    SubscriptionPlan, LandlordSubscription, 
    SubscriptionPayment, FeatureAccess
)
from decimal import Decimal


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans"""
    
    billing_display = serializers.SerializerMethodField()
    price_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'plan_type', 'billing_type',
            'fixed_price', 'revenue_percentage', 'trial_duration_days',
            'features', 'description', 'is_active', 'sort_order',
            'billing_display', 'price_display'
        ]
        read_only_fields = ['id']
    
    def get_billing_display(self, obj):
        """Human-readable billing type"""
        if obj.billing_type == 'fixed':
            return f"KES {obj.fixed_price:,.2f} per month"
        elif obj.billing_type == 'revenue':
            return f"{obj.revenue_percentage}% of monthly rent revenue"
        return "Unknown"
    
    def get_price_display(self, obj):
        """Display price in user-friendly format"""
        if obj.billing_type == 'fixed':
            if obj.fixed_price == 0:
                return "FREE"
            return f"KES {obj.fixed_price:,.0f}/mo"
        else:
            return f"{obj.revenue_percentage}% revenue"


class FeatureAccessSerializer(serializers.ModelSerializer):
    """Serializer for feature access"""
    
    active_features = serializers.SerializerMethodField()
    feature_categories = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureAccess
        fields = [
            'can_create_hostels', 'can_manage_rooms', 'can_process_payments',
            'can_create_caretakers', 'can_use_recurring_payments',
            'can_use_inventory_management', 'can_view_basic_analytics',
            'can_access_marketplace', 'can_view_advanced_analytics',
            'can_generate_custom_reports', 'can_use_bulk_operations',
            'can_use_ai_features', 'can_use_predictive_analytics',
            'can_use_smart_pricing', 'can_use_api_access',
            'can_use_white_label', 'can_auto_screen_tenants',
            'last_feature_sync', 'active_features', 'feature_categories'
        ]
        read_only_fields = fields
    
    def get_active_features(self, obj):
        """Return list of active feature names"""
        features = []
        feature_map = {
            'can_create_hostels': 'Create Hostels',
            'can_manage_rooms': 'Manage Rooms',
            'can_process_payments': 'Process Payments',
            'can_create_caretakers': 'Manage Caretakers',
            'can_use_recurring_payments': 'Recurring Payments',
            'can_use_inventory_management': 'Inventory Management',
            'can_view_basic_analytics': 'Basic Analytics',
            'can_access_marketplace': 'Marketplace Access',
            'can_view_advanced_analytics': 'Advanced Analytics',
            'can_generate_custom_reports': 'Custom Reports',
            'can_use_bulk_operations': 'Bulk Operations',
            'can_use_ai_features': 'AI Features',
            'can_use_predictive_analytics': 'Predictive Analytics',
            'can_use_smart_pricing': 'Smart Pricing',
            'can_use_api_access': 'API Access',
            'can_use_white_label': 'White Label',
            'can_auto_screen_tenants': 'Auto Tenant Screening',
        }
        
        for field, display_name in feature_map.items():
            if getattr(obj, field):
                features.append(display_name)
        
        return features
    
    def get_feature_categories(self, obj):
        """Group features by category"""
        return {
            'core': {
                'Create Hostels': obj.can_create_hostels,
                'Manage Rooms': obj.can_manage_rooms,
                'Process Payments': obj.can_process_payments,
                'Manage Caretakers': obj.can_create_caretakers,
            },
            'basic': {
                'Recurring Payments': obj.can_use_recurring_payments,
                'Inventory Management': obj.can_use_inventory_management,
                'Basic Analytics': obj.can_view_basic_analytics,
            },
            'medium': {
                'Marketplace Access': obj.can_access_marketplace,
                'Advanced Analytics': obj.can_view_advanced_analytics,
                'Custom Reports': obj.can_generate_custom_reports,
                'Bulk Operations': obj.can_use_bulk_operations,
            },
            'advanced': {
                'AI Features': obj.can_use_ai_features,
                'Predictive Analytics': obj.can_use_predictive_analytics,
                'Smart Pricing': obj.can_use_smart_pricing,
                'API Access': obj.can_use_api_access,
                'White Label': obj.can_use_white_label,
                'Auto Tenant Screening': obj.can_auto_screen_tenants,
            }
        }


class LandlordSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for landlord subscription"""
    
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    days_until_billing = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    current_period_display = serializers.SerializerMethodField()
    subscription_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = LandlordSubscription
        fields = [
            'id', 'plan', 'plan_details', 'status', 'status_display',
            'current_period_start', 'current_period_end', 'next_billing_date',
            'trial_start', 'trial_end', 'is_trial_used',
            'total_rent_collected_this_period', 'calculated_fee_this_period',
            'auto_renew', 'cancel_at_period_end', 'last_payment_date',
            'last_payment_amount', 'created_at', 'cancelled_at',
            'cancellation_reason', 'days_until_billing', 
            'current_period_display', 'subscription_amount'
        ]
        read_only_fields = [
            'id', 'status', 'trial_start', 'trial_end', 'is_trial_used',
            'total_rent_collected_this_period', 'calculated_fee_this_period',
            'last_payment_date', 'last_payment_amount', 'created_at',
            'cancelled_at'
        ]
    
    def get_days_until_billing(self, obj):
        """Calculate days until next billing"""
        return obj.days_until_billing()
    
    def get_status_display(self, obj):
        """Human-readable status"""
        status_map = {
            'trial': ' Free Trial',
            'active': ' Active',
            'past_due': 'Payment Due',
            'cancelled': 'Cancelled',
            'expired': ' Expired',
        }
        return status_map.get(obj.status, obj.status)
    
    def get_current_period_display(self, obj):
        """Format current billing period"""
        return f"{obj.current_period_start.strftime('%b %d, %Y')} - {obj.current_period_end.strftime('%b %d, %Y')}"
    
    def get_subscription_amount(self, obj):
        """Calculate amount due for this period"""
        if obj.plan.billing_type == 'fixed':
            return float(obj.plan.fixed_price)
        elif obj.plan.billing_type == 'revenue':
            return float(obj.calculated_fee_this_period)
        return 0.0


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    """Serializer for subscription payments"""
    
    subscription_details = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    period_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPayment
        fields = [
            'id', 'subscription', 'subscription_details', 'amount',
            'billing_period_start', 'billing_period_end', 'period_display',
            'rent_revenue_amount', 'payment_method', 'transaction_reference',
            'paystack_reference', 'status', 'status_display',
            'initiated_at', 'paid_at', 'failed_at', 'failure_reason'
        ]
        read_only_fields = [
            'id', 'transaction_reference', 'paystack_reference',
            'initiated_at', 'paid_at', 'failed_at'
        ]
    
    def get_subscription_details(self, obj):
        """Get subscription plan name"""
        return {
            'plan_name': obj.subscription.plan.name,
            'plan_type': obj.subscription.plan.plan_type
        }
    
    def get_status_display(self, obj):
        """Human-readable payment status"""
        status_map = {
            'pending': '⏳ Pending',
            'success': '✓ Paid',
            'failed': '✗ Failed',
            'refunded': '↩ Refunded',
        }
        return status_map.get(obj.status, obj.status)
    
    def get_period_display(self, obj):
        """Format billing period"""
        return f"{obj.billing_period_start.strftime('%b %d')} - {obj.billing_period_end.strftime('%b %d, %Y')}"


class SubscriptionUpgradeSerializer(serializers.Serializer):
    """Serializer for plan upgrades/downgrades"""
    
    new_plan_id = serializers.UUIDField(required=True)
    immediate = serializers.BooleanField(default=False)
    
    def validate_new_plan_id(self, value):
        """Validate plan exists and is active"""
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
            return value
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive subscription plan")


class SubscriptionCancelSerializer(serializers.Serializer):
    """Serializer for subscription cancellation"""
    
    reason = serializers.CharField(required=True, max_length=500)
    immediate = serializers.BooleanField(default=False)
    feedback = serializers.CharField(required=False, allow_blank=True)