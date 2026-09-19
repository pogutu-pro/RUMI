from django.db import models
from django.utils import timezone
from django.core.validators import MaxLengthValidator


class Notification(models.Model):
    """Central record of all sent notifications"""

    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('read', 'Read'),
    ]

    # Nullable and SET_NULL so the delivery log outlives a deleted user and can
    # also record messages to addresses that are not (or not yet) users.
    recipient = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    # Where the message actually went (email address or phone number).
    recipient_address = models.CharField(max_length=254, blank=True, default='')
    notification_type = models.CharField(max_length=50)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    subject = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    metadata = models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(blank=True, null=True)
    failed_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'notifications_notification'
        indexes = [
            models.Index(fields=['recipient'], name='idx_notification_recipient'),
            models.Index(fields=['notification_type'], name='idx_notification_type'),
            models.Index(fields=['status'], name='idx_notification_status'),
            models.Index(fields=['created_at'], name='idx_notification_created'),
        ]

    def __str__(self):
        target = self.recipient.email if self.recipient_id else (self.recipient_address or 'unknown')
        return f"{self.notification_type} to {target} via {self.channel}"


class EmailTemplate(models.Model):
    """Reusable email templates with variable substitution"""

    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    text_content = models.TextField(blank=True, null=True)
    variables = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications_emailtemplate'
        indexes = [
            models.Index(fields=['name'], name='idx_emailtemplate_name'),
        ]

    def __str__(self):
        return f"Email Template: {self.name}"


class SMSTemplate(models.Model):
    """SMS message templates (cost-optimized, limited usage)"""

    name = models.CharField(max_length=100, unique=True)
    message = models.CharField(
        max_length=160,
        validators=[MaxLengthValidator(160)]
    )
    variables = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'notifications_smstemplate'
        # Note: Length constraint removed for SQLite compatibility
        # In production (PostgreSQL), this constraint should be re-added

    def __str__(self):
        return f"SMS Template: {self.name}"


class NotificationPreference(models.Model):
    """User-configurable notification settings"""

    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=True)
    booking_updates = models.BooleanField(default=True)
    marketplace_updates = models.BooleanField(default=True)
    roommate_updates = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications_notificationpreference'
        indexes = [
            models.Index(fields=['user'], name='idx_notificationpref_user'),
        ]

    def __str__(self):
        return f"Preferences for {self.user.email}"
