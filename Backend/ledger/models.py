"""
Ledger — double-entry journal underneath every RumiaRent money event.

Every invoice, payment, allocation, credit note and deposit settlement posts a
balanced JournalEntry (Σ debit = Σ credit). Entries are immutable: mistakes are
corrected by posting a reversing entry, never by editing. Financial reports
(landlord statements, trial balance, P&L) are derived from JournalLine rows.

See docs/roadmap/phase-1-ledger-design.md §3.10 and §4.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Account(models.Model):
    """A chart-of-accounts entry, scoped to one organization."""

    TYPE_CHOICES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('equity', 'Equity'),
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    # Debit-normal account types: a positive balance is debit − credit.
    DEBIT_NORMAL = ('asset', 'expense')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='ledger_accounts',
    )
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_system = models.BooleanField(
        default=True,
        help_text='Seeded account that posting rules depend on — never deleted or renamed by users.',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ledger_account'
        unique_together = [['organization', 'code']]
        ordering = ['code']

    def __str__(self):
        return f'{self.code} {self.name}'


class JournalEntry(models.Model):
    """One balanced posting. Immutable once created."""

    SOURCE_CHOICES = [
        ('invoice', 'Invoice'),
        ('credit_note', 'Credit Note'),
        ('payment', 'Payment'),
        ('allocation', 'Allocation'),
        ('deposit_settlement', 'Deposit Settlement'),
        ('expense', 'Expense'),
        ('reversal', 'Reversal'),
        ('opening_balance', 'Opening Balance'),
        ('manual', 'Manual'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='journal_entries',
    )
    entry_date = models.DateField()
    memo = models.CharField(max_length=255, blank=True, default='')
    source_type = models.CharField(max_length=30, choices=SOURCE_CHOICES)
    source_id = models.CharField(max_length=64, blank=True, default='')
    reverses = models.OneToOneField(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='reversed_by',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='journal_entries',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ledger_journalentry'
        ordering = ['entry_date', 'created_at']
        indexes = [
            models.Index(fields=['organization', 'entry_date'], name='idx_je_org_date'),
            models.Index(fields=['source_type', 'source_id'], name='idx_je_source'),
        ]

    def __str__(self):
        return f'{self.entry_date} {self.source_type}:{self.source_id} {self.memo}'


class JournalLine(models.Model):
    """A single debit or credit against one account, with optional rental dimensions."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='lines')
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    description = models.CharField(max_length=255, blank=True, default='')

    # Sub-ledger dimensions — let receivables/credit/deposits be queried per
    # tenancy and income per property without a separate account per tenant.
    tenancy = models.ForeignKey(
        'properties.Tenancy', on_delete=models.PROTECT, null=True, blank=True, related_name='journal_lines',
    )
    tenant = models.ForeignKey(
        'tenants.TenantProfile', on_delete=models.PROTECT, null=True, blank=True, related_name='journal_lines',
    )
    parent_property = models.ForeignKey(
        'properties.Property', on_delete=models.PROTECT, null=True, blank=True,
        related_name='journal_lines', db_column='property_id',
    )
    unit = models.ForeignKey(
        'properties.RentalUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='journal_lines',
    )

    class Meta:
        db_table = 'ledger_journalline'
        indexes = [
            models.Index(fields=['account', 'tenancy'], name='idx_jl_account_tenancy'),
            models.Index(fields=['account', 'parent_property'], name='idx_jl_account_property'),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(debit__gte=0) & Q(credit__gte=0),
                name='check_jl_non_negative',
            ),
            models.CheckConstraint(
                check=(Q(debit=0) & Q(credit__gt=0)) | (Q(credit=0) & Q(debit__gt=0)),
                name='check_jl_one_sided',
            ),
        ]

    def __str__(self):
        side = f'Dr {self.debit}' if self.debit else f'Cr {self.credit}'
        return f'{self.account.code} {side}'


class DocumentSequence(models.Model):
    """
    Gap-free per-organization counter for document numbers (INV-000001,
    CN-000001, RCT-000001). Incremented under a row lock — see
    ledger.services.numbering.next_number.
    """

    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='document_sequences',
    )
    prefix = models.CharField(max_length=10)
    last_value = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'ledger_documentsequence'
        unique_together = [['organization', 'prefix']]

    def __str__(self):
        return f'{self.organization_id} {self.prefix} @ {self.last_value}'
