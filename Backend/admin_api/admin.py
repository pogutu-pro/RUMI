from django.contrib import admin
from .models import (
    SystemActivity, HostelModeration, PaymentDispute, 
    AdminSubscription, UserSuspension
)


@admin.register(SystemActivity)
class SystemActivityAdmin(admin.ModelAdmin):
    list_display = [
        'activity_type', 'title', 'user', 'user_role', 
        'severity', 'created_at'
    ]
    list_filter = ['activity_type', 'severity', 'created_at', 'user_role']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


@admin.register(HostelModeration)
class HostelModerationAdmin(admin.ModelAdmin):
    list_display = [
        'hostel', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by'
    ]
    list_filter = ['status', 'submitted_at', 'reviewed_at']
    search_fields = ['hostel__name', 'hostel__landlord__user__email']
    readonly_fields = ['submitted_at', 'reviewed_at', 'review_duration_hours']
    ordering = ['-submitted_at']


@admin.register(PaymentDispute)
class PaymentDisputeAdmin(admin.ModelAdmin):
    list_display = [
        'dispute_id', 'student', 'reason', 'status', 
        'priority', 'amount_disputed', 'submitted_at'
    ]
    list_filter = ['status', 'priority', 'submitted_at']
    search_fields = ['dispute_id', 'reason', 'student__user__email']
    readonly_fields = ['dispute_id', 'submitted_at', 'resolved_at']
    ordering = ['-submitted_at']


@admin.register(AdminSubscription)
class AdminSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'landlord', 'status', 'monthly_recurring_revenue', 
        'churn_risk_score', 'payment_failures', 'updated_at'
    ]
    list_filter = ['status', 'updated_at']
    search_fields = ['landlord__user__email', 'landlord__user__first_name', 'landlord__user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']


@admin.register(UserSuspension)
class UserSuspensionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'reason', 'suspended_by', 'is_permanent', 
        'suspended_at', 'suspended_until', 'is_active'
    ]
    list_filter = ['reason', 'is_permanent', 'is_active', 'suspended_at']
    search_fields = ['user__email', 'description', 'suspended_by__email']
    readonly_fields = ['suspended_at']
    ordering = ['-suspended_at']