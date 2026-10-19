"""
Paybill collection — a landlord's own M-Pesa paybill/till connected through
Daraja C2B. RumiaRent never holds the money; it records, matches and
receipts what lands in the landlord's paybill. See
docs/roadmap/phase-2-paybill-design.md.
"""

import secrets
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from paybill.crypto import decrypt, encrypt


def new_callback_token() -> str:
    return secrets.token_urlsafe(24)


class PaybillAccount(models.Model):
    TYPE_CHOICES = [
        ('paybill', 'Paybill'),
        ('till', 'Till (Buy Goods)'),
    ]
    ENVIRONMENT_CHOICES = [
        ('sandbox', 'Sandbox'),
        ('production', 'Production'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='paybill_accounts',
    )
    shortcode = models.CharField(max_length=20, unique=True)
    shortcode_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='paybill')
    display_name = models.CharField(max_length=100, blank=True, default='')
    environment = models.CharField(max_length=12, choices=ENVIRONMENT_CHOICES, default='sandbox')
    consumer_key_encrypted = models.TextField(blank=True, default='')
    consumer_secret_encrypted = models.TextField(blank=True, default='')
    callback_token = models.CharField(max_length=64, unique=True, default=new_callback_token)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(null=True, blank=True)
    registration_response = models.JSONField(default=dict, blank=True)
    last_callback_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'paybill_account'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.get_shortcode_type_display()} {self.shortcode}'

    @property
    def consumer_key(self) -> str:
        return decrypt(self.consumer_key_encrypted)

    @property
    def consumer_secret(self) -> str:
        return decrypt(self.consumer_secret_encrypted)

    def set_credentials(self, consumer_key: str, consumer_secret: str) -> None:
        self.consumer_key_encrypted = encrypt(consumer_key)
        self.consumer_secret_encrypted = encrypt(consumer_secret)

    @property
    def has_credentials(self) -> bool:
        return bool(self.consumer_key_encrypted and self.consumer_secret_encrypted)


class IncomingTransaction(models.Model):
    """One M-Pesa C2B confirmation, stored before any matching (raw inbox)."""

    STATUS_CHOICES = [
        ('matched', 'Matched automatically'),
        ('unmatched', 'Needs attention'),
        ('assigned', 'Assigned by hand'),
        ('ignored', 'Ignored'),
    ]
    MATCHED_BY_CHOICES = [
        ('reference', 'Account number'),
        ('unit', 'Unit number'),
        ('phone', 'Phone number'),
        ('manual', 'Assigned by hand'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paybill = models.ForeignKey(PaybillAccount, on_delete=models.PROTECT, related_name='transactions')
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='paybill_transactions',
    )
    trans_id = models.CharField(max_length=40, unique=True, help_text='M-Pesa receipt number, e.g. QK12AB34CD')
    trans_type = models.CharField(max_length=40, blank=True, default='')
    trans_time = models.DateTimeField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    bill_ref_number = models.CharField(max_length=100, blank=True, default='')
    normalized_ref = models.CharField(max_length=100, blank=True, default='', db_index=True)
    msisdn = models.CharField(max_length=128, blank=True, default='', help_text='May be masked or hashed by Safaricom')
    payer_name = models.CharField(max_length=150, blank=True, default='')
    org_account_balance = models.CharField(max_length=40, blank=True, default='')
    raw_payload = models.JSONField(default=dict)

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='unmatched', db_index=True)
    matched_by = models.CharField(max_length=12, choices=MATCHED_BY_CHOICES, blank=True, default='')
    tenancy = models.ForeignKey(
        'properties.Tenancy', on_delete=models.SET_NULL, null=True, blank=True, related_name='paybill_transactions',
    )
    payment = models.OneToOneField(
        'rent.Payment', on_delete=models.SET_NULL, null=True, blank=True, related_name='paybill_transaction',
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='paybill_transactions_resolved',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    note = models.CharField(max_length=255, blank=True, default='')
    received_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'paybill_incomingtransaction'
        ordering = ['-trans_time']
        indexes = [models.Index(fields=['organization', 'status'], name='idx_paybill_txn_org_status')]

    def __str__(self):
        return f'{self.trans_id} {self.amount} → {self.bill_ref_number or "?"} ({self.status})'
