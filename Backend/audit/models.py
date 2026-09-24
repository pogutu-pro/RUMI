"""
Domain audit log — financial and administrative actions must be traceable.
"""

import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class AuditLog(models.Model):
    """Immutable audit trail for RUMIA domain actions."""

    ACTION_CHOICES = [
        ('tenant_created', 'Tenant Created'),
        ('tenant_updated', 'Tenant Updated'),
        ('tenant_archived', 'Tenant Archived'),
        ('property_created', 'Property Created'),
        ('property_updated', 'Property Updated'),
        ('unit_created', 'Unit Created'),
        ('unit_updated', 'Unit Updated'),
        ('tenancy_created', 'Tenancy Created'),
        ('tenancy_updated', 'Tenancy Updated'),
        ('tenancy_terminated', 'Tenancy Terminated'),
        ('rent_modified', 'Rent Modified'),
        ('rent_charge_created', 'Rent Charge Created'),
        ('payment_recorded', 'Payment Recorded'),
        ('payment_edited', 'Payment Edited'),
        ('payment_reversed', 'Payment Reversed'),
        ('payment_deleted', 'Payment Deleted'),
        ('reminder_sent', 'Reminder Sent'),
        ('permission_changed', 'Permission Changed'),
        ('inspection_completed', 'Inspection Completed'),
        ('payout_pending_verification', 'Payout Pending Verification'),
        ('payout_activated', 'Payout Activated'),
        ('subscription_activated', 'Subscription Activated'),
        ('subscription_payment_recorded', 'Subscription Payment Recorded'),
        ('subscription_payment_failed', 'Subscription Payment Failed'),
        ('subscription_disabled', 'Subscription Disabled'),
        ('manual_subscription_requested', 'Manual Subscription Requested'),
        ('manual_payment_instructions_updated', 'Manual Payment Instructions Updated'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_actions',
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.CharField(max_length=50, blank=True, default='')
    content_object = GenericForeignKey('content_type', 'object_id')

    entity_type = models.CharField(max_length=50, blank=True, default='')
    entity_id = models.CharField(max_length=50, blank=True, default='')

    old_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_auditlog'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'action'], name='idx_audit_org_action'),
            models.Index(fields=['entity_type', 'entity_id'], name='idx_audit_entity'),
        ]

    def __str__(self):
        return f'{self.action} by {self.actor} at {self.created_at}'


def log_audit(
    action: str,
    actor=None,
    organization=None,
    entity=None,
    old_value=None,
    new_value=None,
    metadata=None,
    ip_address=None,
):
    """Helper to create audit log entries consistently."""
    content_type = None
    object_id = ''
    entity_type = ''
    entity_id = ''

    if entity is not None:
        content_type = ContentType.objects.get_for_model(entity)
        object_id = str(entity.pk)
        entity_type = entity.__class__.__name__
        entity_id = object_id

    return AuditLog.objects.create(
        action=action,
        actor=actor,
        organization=organization,
        content_type=content_type,
        object_id=object_id,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value or {},
        new_value=new_value or {},
        metadata=metadata or {},
        ip_address=ip_address,
    )
