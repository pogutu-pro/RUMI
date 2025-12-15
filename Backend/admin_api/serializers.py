from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from .models import (
    SystemActivity, HostelModeration, PaymentDispute, 
    AdminSubscription, UserSuspension
)

User = get_user_model()


class SystemActivitySerializer(serializers.ModelSerializer):
    """Serializer for system activity feed"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemActivity
        fields = [
            'id', 'activity_type', 'title', 'description', 'user', 'user_name', 
            'user_email', 'user_role', 'metadata', 'severity', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_time_ago(self, obj):
        """Return human-readable time difference"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{int(diff.total_seconds() // 60)} mins ago"
        elif diff < timedelta(days=1):
            return f"{int(diff.total_seconds() // 3600)} hours ago"
        elif diff < timedelta(days=7):
            return f"{diff.days} days ago"
        else:
            return obj.created_at.strftime('%b %d, %Y')


class SystemActivityCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating system activities"""
    
    class Meta:
        model = SystemActivity
        fields = ['activity_type', 'title', 'description', 'user', 'user_role', 'metadata', 'severity']
    
    def create(self, validated_data):
        """Create system activity with automatic user detection"""
        # If no user provided, try to get from request context
        if not validated_data.get('user') and hasattr(self.context.get('request'), 'user'):
            validated_data['user'] = self.context['request'].user
        
        # Set user role if user exists
        if validated_data.get('user') and not validated_data.get('user_role'):
            validated_data['user_role'] = validated_data['user'].role
        
        return super().create(validated_data)


class HostelModerationSerializer(serializers.ModelSerializer):
    """Serializer for hostel moderation"""
    
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    hostel_location = serializers.CharField(source='hostel.location', read_only=True)
    hostel_landlord = serializers.CharField(source='hostel.landlord.user.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    review_duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelModeration
        fields = [
            'id', 'hostel', 'hostel_name', 'hostel_location', 'hostel_landlord',
            'status', 'submitted_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_name',
            'admin_notes', 'rejection_reason', 'verification_checklist', 
            'review_duration_hours', 'review_duration_formatted'
        ]
        read_only_fields = ['id', 'submitted_at']
    
    def get_review_duration_formatted(self, obj):
        """Return formatted review duration"""
        if obj.review_duration_hours is None:
            return None
        elif obj.review_duration_hours < 24:
            return f"{obj.review_duration_hours} hours"
        else:
            days = obj.review_duration_hours / 24
            return f"{days:.1f} days"


class HostelModerationActionSerializer(serializers.ModelSerializer):
    """Serializer for hostel moderation actions (approve/reject)"""
    
    class Meta:
        model = HostelModeration
        fields = ['admin_notes', 'rejection_reason']
    
    def validate(self, data):
        """Validate moderation action based on status"""
        if hasattr(self, 'instance') and self.instance:
            if self.instance.status == 'approved':
                if data.get('rejection_reason'):
                    raise serializers.ValidationError("Rejection reason not allowed for approval")
            elif self.instance.status == 'rejected':
                if not data.get('rejection_reason'):
                    raise serializers.ValidationError("Rejection reason required for rejection")
        return data


class PaymentDisputeSerializer(serializers.ModelSerializer):
    """Serializer for payment disputes"""
    
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.user.email', read_only=True)
    transaction_reference = serializers.CharField(source='transaction.transaction_reference', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    days_since_submission = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentDispute
        fields = [
            'id', 'dispute_id', 'transaction', 'student', 'student_name', 'student_email',
            'transaction_reference', 'reason', 'description', 'status', 'priority',
            'amount_disputed', 'evidence', 'submitted_at', 'resolved_at', 
            'resolved_by', 'resolved_by_name', 'resolution_notes', 'refund_amount',
            'days_since_submission'
        ]
        read_only_fields = ['id', 'dispute_id', 'submitted_at']
    
    def get_days_since_submission(self, obj):
        """Return days since dispute submission"""
        return (timezone.now().date() - obj.submitted_at.date()).days


class PaymentDisputeActionSerializer(serializers.ModelSerializer):
    """Serializer for dispute resolution actions"""
    
    class Meta:
        model = PaymentDispute
        fields = ['status', 'resolution_notes', 'refund_amount']
    
    def validate(self, data):
        """Validate dispute resolution"""
        status = data.get('status')
        resolution_notes = data.get('resolution_notes')
        
        if status in ['resolved', 'rejected'] and not resolution_notes:
            raise serializers.ValidationError("Resolution notes required")
        
        if status == 'resolved' and data.get('refund_amount') is None:
            raise serializers.ValidationError("Refund amount required for resolution")
        
        return data


class AdminSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for admin subscription oversight"""
    
    landlord_email = serializers.CharField(source='landlord.user.email', read_only=True)
    landlord_name = serializers.CharField(source='landlord.user.get_full_name', read_only=True)
    plan_name = serializers.CharField(source='subscription.plan.name', read_only=True)
    current_period_end = serializers.CharField(source='subscription.current_period_end', read_only=True)
    churn_risk_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminSubscription
        fields = [
            'id', 'landlord', 'landlord_email', 'landlord_name', 'subscription', 'plan_name',
            'status', 'monthly_recurring_revenue', 'churn_risk_score', 'churn_risk_percentage',
            'last_payment_attempt', 'payment_failures', 'notes', 'current_period_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_churn_risk_percentage(self, obj):
        """Return churn risk as percentage"""
        return f"{obj.churn_risk_score * 100:.1f}%"


class UserSuspensionSerializer(serializers.ModelSerializer):
    """Serializer for user suspensions"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    suspended_by_name = serializers.CharField(source='suspended_by.get_full_name', read_only=True)
    duration = serializers.SerializerMethodField()
    is_active_display = serializers.CharField(source='is_active', read_only=True)
    
    class Meta:
        model = UserSuspension
        fields = [
            'id', 'user', 'user_name', 'user_email', 'reason', 'description',
            'suspended_by', 'suspended_by_name', 'suspended_at', 'suspended_until',
            'is_permanent', 'is_active', 'is_active_display', 'appeal_allowed',
            'notes', 'duration'
        ]
        read_only_fields = ['id', 'suspended_at']
    
    def get_duration(self, obj):
        """Return suspension duration"""
        if obj.is_permanent:
            return "Permanent"
        elif obj.suspended_until:
            duration = obj.suspended_until - obj.suspended_at
            if duration.days > 0:
                return f"{duration.days} days"
            else:
                return f"{duration.seconds // 3600} hours"
        return "Unknown"


class AdminStatsSerializer(serializers.Serializer):
    """Serializer for admin dashboard statistics"""
    
    # User stats
    total_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_week = serializers.IntegerField()
    new_users_month = serializers.IntegerField()
    
    # Hostel stats
    pending_hostels = serializers.IntegerField()
    total_hostels = serializers.IntegerField()
    approved_hostels_today = serializers.IntegerField()
    
    # Payment stats
    total_transactions_today = serializers.IntegerField()
    total_revenue_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_disputes = serializers.IntegerField()
    
    # Subscription stats
    active_subscriptions = serializers.IntegerField()
    monthly_recurring_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    churn_rate = serializers.FloatField()
    
    # System stats
    system_activities_today = serializers.IntegerField()
    support_tickets_open = serializers.IntegerField()
    uptime_percentage = serializers.FloatField()