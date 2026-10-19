"""
Per-organization document numbering (design decision D4).

Each organization gets its own gap-free sequence per document prefix, so a
landlord's first invoice is INV-000001 regardless of platform volume. To
switch to platform-wide numbering, change `next_number` only.
"""

from __future__ import annotations

from django.db import IntegrityError, transaction

from ledger.models import DocumentSequence

INVOICE = 'INV'
CREDIT_NOTE = 'CN'
RECEIPT = 'RCT'
DEPOSIT_SETTLEMENT = 'DST'

WIDTH = 6


def format_number(prefix: str, value: int) -> str:
    return f'{prefix}-{value:0{WIDTH}d}'


def next_number(organization, prefix: str) -> str:
    """Reserve and return the next number. Must run inside the caller's transaction."""
    with transaction.atomic():
        try:
            with transaction.atomic():
                sequence, _ = DocumentSequence.objects.select_for_update().get_or_create(
                    organization=organization, prefix=prefix,
                )
        except IntegrityError:
            # Two first-ever numbers for this org/prefix raced on create.
            sequence = DocumentSequence.objects.select_for_update().get(organization=organization, prefix=prefix)
        sequence.last_value += 1
        sequence.save(update_fields=['last_value'])
        return format_number(prefix, sequence.last_value)
