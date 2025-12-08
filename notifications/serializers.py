from rest_framework import serializers
from django.utils import timezone

from .models import Notification, NotificationPreference, EmailTemplate, SMSTemplate


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification instances"""

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'channel', 'subject', 'message',
            'metadata', 'status', 'sent_at', 'failed_at', 'error_message',
            'created_at', 'read_at'
        ]
        read_only_fields = [
            'id', 'sent_at', 'failed_at', 'error_message', 'created_at'
        ]


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing notifications"""

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'channel', 'subject', 'message',
            'metadata', 'created_at', 'read_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""

    class Meta:
        model = NotificationPreference
        fields = [
            'email_enabled', 'sms_enabled', 'marketing_emails',
            'booking_updates', 'marketplace_updates', 'roommate_updates',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer for email templates"""

    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'subject', 'html_content', 'text_content',
            'variables', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmailTemplateCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating email templates"""

    class Meta:
        model = EmailTemplate
        fields = [
            'name', 'subject', 'html_content', 'text_content',
            'variables', 'is_active'
        ]


class SMSTemplateSerializer(serializers.ModelSerializer):
    """Serializer for SMS templates"""

    class Meta:
        model = SMSTemplate
        fields = [
            'id', 'name', 'message', 'variables', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SMSTemplateCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating SMS templates"""

    class Meta:
        model = SMSTemplate
        fields = ['name', 'message', 'variables', 'is_active']


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""

    period = serializers.CharField()
    total_notifications = serializers.IntegerField()
    successful_deliveries = serializers.IntegerField()
    failed_deliveries = serializers.IntegerField()
    delivery_rate = serializers.FloatField()
    by_channel = serializers.DictField()
    top_failed_types = serializers.ListField()


class BulkNotificationActionSerializer(serializers.Serializer):
    """Serializer for bulk notification actions"""

    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    action = serializers.ChoiceField(
        choices=['mark_read', 'mark_unread', 'delete']
    )


class NotificationTemplateTestSerializer(serializers.Serializer):
    """Serializer for testing notification templates"""

    recipient_email = serializers.EmailField(required=False)
    recipient_phone = serializers.CharField(required=False, max_length=15)
    variables = serializers.DictField(required=False)

    def validate(self, data):
        if not data.get('recipient_email') and not data.get('recipient_phone'):
            raise serializers.ValidationError(
                "Either recipient_email or recipient_phone must be provided"
            )
        return data