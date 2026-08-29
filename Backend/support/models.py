"""
Minimal support ticket system for RumiaRent.

Any authenticated user (landlord, tenant, caretaker) can open a ticket.
Tech support and super admins can see and work every ticket; everyone
else sees only their own.
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='support_tickets',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_support_tickets',
    )
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'support_ticket'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_support_ticket_status'),
            models.Index(fields=['created_by'], name='idx_support_ticket_creator'),
            models.Index(fields=['assigned_to'], name='idx_support_ticket_assignee'),
        ]

    def __str__(self):
        return f'{self.subject} ({self.status})'


class TicketMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_messages')
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'support_ticket_message'
        ordering = ['created_at']

    def __str__(self):
        return f'Message on {self.ticket_id} by {self.author_id}'
