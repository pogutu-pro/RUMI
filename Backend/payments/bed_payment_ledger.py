"""
Bed Payment Ledger model for payment reconciliation and attribution.

CRITICAL BUSINESS MODEL REMINDER:
- Rumia does NOT hold or process money
- Students pay DIRECTLY to landlord's Paybill/Till
- Money flows directly from student → landlord (never touches Rumia)
- Rumia receives M-Pesa callbacks for ledger reconciliation only
- Payments work via ANY M-Pesa channel (app, USSD *234*PAYBILL#, button phone)

This ledger is IMMUTABLE and tracks:
- Which bed received which payment
- How payments are allocated to rent periods
- Attribution source (automatic vs manual override)
- Complete audit trail for reconciliation
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class BedPaymentLedger(models.Model):
    """
    Immutable ledger of payment allocations to beds.
    
    Each entry represents a portion of a payment allocated to a bed for a specific period.
    CRITICAL: This is a reconciliation ledger, NOT a payment processor.
    
    Use Cases:
    - Reconcile M-Pesa callbacks to specific beds
    - Prove which bed received which payment (audit trail)
    - Handle partial payment allocations
    - Track admin overrides/dispute resolutions
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core References
    bed = models.ForeignKey(
        'hostels.Bed',
        on_delete=models.PROTECT,  # NEVER delete ledger entries (immutable)
        related_name='payment_ledger'
    )
    transaction = models.ForeignKey(
        'payments.Transaction',
        on_delete=models.PROTECT,  # NEVER delete ledger entries
        related_name='bed_attributions'
    )
    
    # Allocation Details
    amount_allocated = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Amount of transaction allocated to this bed (KES)"
    )
    
    # Period Attribution (which rent period does this payment cover?)
    allocated_to_period_start = models.DateField(
        help_text="Start date of rent period this payment covers"
    )
    allocated_to_period_end = models.DateField(
        help_text="End date of rent period this payment covers"
    )
    
    # Attribution Metadata
    attributed_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Timestamp when this attribution was made"
    )
    
    ATTRIBUTION_SOURCE_CHOICES = [
        ('system', 'Automatic System Attribution'),
        ('admin_override', 'Manual Admin Override'),
        ('dispute_resolution', 'Dispute Resolution Adjustment'),
        ('reconciliation', 'Manual Reconciliation'),
    ]
    attributed_by = models.CharField(
        max_length=50,
        choices=ATTRIBUTION_SOURCE_CHOICES,
        default='system'
    )
    
    # Admin Override Tracking (required if attributed_by != 'system')
    override_reason = models.TextField(
        blank=True,
        help_text="Reason for manual override (required for non-system attributions)"
    )
    overridden_by_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_ledger_overrides'
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'bed_payment_ledger'
        indexes = [
            models.Index(fields=['bed', 'attributed_at'], name='idx_ledger_bed_date'),
            models.Index(fields=['transaction'], name='idx_ledger_transaction'),
            models.Index(fields=['allocated_to_period_start', 'allocated_to_period_end'], name='idx_ledger_period'),
            models.Index(fields=['attributed_by'], name='idx_ledger_attribution_source'),
        ]
        ordering = ['-attributed_at']
        constraints = [
            models.CheckConstraint(
                check=models.Q(amount_allocated__gt=Decimal('0.00')),
                name='positive_allocation'
            ),
            models.CheckConstraint(
                check=models.Q(allocated_to_period_end__gte=models.F('allocated_to_period_start')),
                name='valid_allocation_period'
            ),
        ]
    
    def __str__(self):
        return f"{self.bed.full_code}: KES {self.amount_allocated} from {self.transaction.transaction_reference if hasattr(self.transaction, 'transaction_reference') else self.transaction.id}"
    
    def save(self, *args, **kwargs):
        """Validate that override reason is provided for manual attributions"""
        if self.attributed_by != 'system' and not self.override_reason:
            raise ValueError(
                f"override_reason is required when attributed_by='{self.attributed_by}'"
            )
        
        if self.attributed_by != 'system' and not self.overridden_by_user_id:
            raise ValueError(
                f"overridden_by_user is required when attributed_by='{self.attributed_by}'"
            )
        
        super().save(*args, **kwargs)
