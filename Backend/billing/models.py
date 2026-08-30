"""
Billing models — subscription plan catalog, org subscriptions, and payment ledger.

This app replaces the deprecated plan catalog and subscribe flow that lived in
`accounts/subscription_models.py` (wrong tier vocabulary, rejected
revenue-percentage billing type, no Paystack code fields, fail-closed bug in
FeatureAccess.sync_with_subscription()). Field names here are deliberately
distinct from that scaffold's plan-classification vocabulary.
"""
from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class SubscriptionPlan(models.Model):
    """
    A flat-priced subscription tier (Starter / Pro / Enterprise).

    `price` is the ONLY pricing field on this model — there is no
    percentage-of-revenue field and no separate billing-mode-per-plan field.
    Billing mode (auto/manual) is a property of the subscribing organization's
    `OrganizationSubscription`, not of the plan.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    paystack_plan_code = models.CharField(max_length=100, blank=True, default='')
    interval = models.CharField(max_length=20, default='monthly')

    # 0 means unlimited for each of these three limit fields.
    max_properties = models.IntegerField(default=0)
    max_units = models.IntegerField(default=0)
    max_caretaker_seats = models.IntegerField(default=0)

    features = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'billing_subscriptionplan'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.name} (KES {self.price}/{self.interval})'


class OrganizationSubscription(models.Model):
    """
    The single subscription record for an organization.

    `organization` is a OneToOneField — this is the structural guarantee
    (enforced at the DB level, not just by convention) that an organization
    can never have two subscription rows, active or otherwise.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('suspended', 'Suspended'),
        ('cancelled', 'Cancelled'),
    ]
    BILLING_MODE_CHOICES = [
        ('auto', 'Auto (Paystack)'),
        ('manual', 'Manual'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='subscription',
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    billing_mode = models.CharField(max_length=10, choices=BILLING_MODE_CHOICES, default='auto')

    paystack_customer_code = models.CharField(max_length=255, blank=True, default='')
    paystack_subscription_code = models.CharField(max_length=255, blank=True, default='')
    paystack_email_token = models.CharField(max_length=255, blank=True, default='')

    current_period_start = models.DateField(null=True, blank=True)
    current_period_end = models.DateField(null=True, blank=True)
    grace_period_ends_at = models.DateTimeField(null=True, blank=True)

    last_payment_at = models.DateTimeField(null=True, blank=True)
    last_payment_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    last_reminder_sent_at = models.DateTimeField(null=True, blank=True)

    auto_renew = models.BooleanField(default=True)
    cancel_at_period_end = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'billing_organizationsubscription'

    def __str__(self):
        return f'{self.organization.name} - {self.plan.name} ({self.status})'


class SubscriptionPayment(models.Model):
    """
    Ledger row for a single subscription billing attempt.

    `internal_reference` always uses the `SUB-` prefix so this reference
    namespace never collides with `rent.models.Payment.internal_reference`'s
    separate namespace (rent charges use a different prefix entirely).
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        OrganizationSubscription,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    internal_reference = models.CharField(max_length=100, unique=True)
    paystack_reference = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    billing_period_start = models.DateField(null=True, blank=True)
    billing_period_end = models.DateField(null=True, blank=True)

    initiated_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, default='')

    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = 'billing_subscriptionpayment'
        ordering = ['-initiated_at']

    def __str__(self):
        return f'{self.internal_reference} - {self.amount} {self.currency} ({self.status})'


class SubscriptionWebhookEvent(models.Model):
    """
    Dedup ledger for incoming Paystack subscription-related webhook events.

    Consumed by plan 01-02's webhook handler — not read by this plan's own
    tasks. Kept here so the schema for the whole billing domain lands in one
    migration.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=50)
    paystack_object_id = models.CharField(max_length=100)
    raw_payload = models.JSONField(default=dict)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'billing_subscriptionwebhookevent'
        unique_together = [['event_type', 'paystack_object_id']]

    def __str__(self):
        return f'{self.event_type} - {self.paystack_object_id}'
