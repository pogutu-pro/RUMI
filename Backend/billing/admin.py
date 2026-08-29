from django.contrib import admin

from .models import (
    OrganizationSubscription,
    SubscriptionPayment,
    SubscriptionPlan,
    SubscriptionWebhookEvent,
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price', 'interval', 'is_active', 'sort_order')


@admin.register(OrganizationSubscription)
class OrganizationSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'status', 'billing_mode', 'current_period_end')


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ('internal_reference', 'subscription', 'amount', 'currency', 'status', 'initiated_at')


@admin.register(SubscriptionWebhookEvent)
class SubscriptionWebhookEventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'paystack_object_id', 'processed_at', 'created_at')
