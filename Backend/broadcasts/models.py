"""Bulk SMS / email to tenants (EazzyRent 'bulk SMS and email')."""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Broadcast(models.Model):
    AUDIENCE_CHOICES = [
        ('all_tenants', 'All current tenants'),
        ('property', 'Tenants of one property'),
        ('arrears', 'Tenants with overdue balances'),
    ]
    STATUS_CHOICES = [('queued', 'Queued'), ('sending', 'Sending'), ('sent', 'Sent'), ('failed', 'Failed')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='broadcasts')
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES)
    parent_property = models.ForeignKey(
        'properties.Property', on_delete=models.SET_NULL, null=True, blank=True, db_column='property_id',
    )
    send_sms = models.BooleanField(default=True)
    send_email = models.BooleanField(default=False)
    subject = models.CharField(max_length=150, blank=True, default='')
    message = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='queued')
    recipients = models.PositiveIntegerField(default=0)
    sms_sent = models.PositiveIntegerField(default=0)
    sms_segments = models.PositiveIntegerField(default=0)
    emails_sent = models.PositiveIntegerField(default=0)
    failures = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'broadcasts_broadcast'
        ordering = ['-created_at']


class BroadcastDelivery(models.Model):
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name='deliveries')
    tenant = models.ForeignKey('tenants.TenantProfile', on_delete=models.CASCADE)
    channel = models.CharField(max_length=10)
    ok = models.BooleanField(default=False)
    sent_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'broadcasts_delivery'
