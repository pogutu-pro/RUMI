"""
Bed-related models for fine-grained payment tracking and subscription billing.

BUSINESS MODEL CLARIFICATION:
- Rumia does NOT hold or process money
- Students pay directly to landlord's M-Pesa Paybill
- Money never touches Rumia accounts
- Rumia only tracks payments via reconciliation ledger

These models enable:
- Per-bed payment attribution (which bed received which payment)
- Subscription billing based on occupied beds
- Forensic auditing and reconciliation
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class Bed(models.Model):
    """
    Individual bed within a room.
    Replaces string-based bed_slot_id with proper entity.
    
    Key Features:
    - Unique bed identification across platform
    - Per-bed pricing overrides
    - Bed-level occupancy tracking
    - Foundation for subscription billing
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core Relationships
    room = models.ForeignKey(
        'Room',
        on_delete=models.CASCADE,
        related_name='beds',
        help_text="Room containing this bed"
    )
    hostel = models.ForeignKey(
        'Hostel',
        on_delete=models.CASCADE,
        related_name='beds',
        help_text="Denormalized for faster hostel-wide queries"
    )
    
    # Bed Identification
    code = models.CharField(
        max_length=10,
        help_text="Bed identifier within room (e.g., 'A', 'B', '1', '2')"
    )
    full_code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Globally unique bed code (e.g., 'KBH-101-A')"
    )
    
    custom_account_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Optional custom M-Pesa account number for this bed (e.g. 'ROOM1-BED1'). Must be unique if set."
    )
    
    # Bed Attributes
    BED_TYPE_CHOICES = [
        ('single', 'Single Bed'),
        ('bunk_top', 'Bunk Bed (Top)'),
        ('bunk_bottom', 'Bunk Bed (Bottom)'),
        ('double', 'Double Bed'),
    ]
    bed_type = models.CharField(
        max_length=20,
        choices=BED_TYPE_CHOICES,
        default='single'
    )
    
    # Pricing
    price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Override room price for this specific bed (e.g., premium window bed)"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive beds cannot be booked"
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'beds'
        unique_together = [['room', 'code']]
        indexes = [
            models.Index(fields=['room', 'is_active'], name='idx_bed_room_active'),
            models.Index(fields=['hostel', 'is_active'], name='idx_bed_hostel_active'),
            models.Index(fields=['full_code'], name='idx_bed_full_code'),
        ]
        ordering = ['room', 'code']
    
    def __str__(self):
        return f"{self.room.hostel.name} - {self.room.room_number} - Bed {self.code}"
    
    @property
    def monthly_rent(self):
        """Get effective monthly rent for this bed"""
        return self.price_override if self.price_override else self.room.base_price
    
    def save(self, *args, **kwargs):
        """Auto-generate full_code if not provided"""
        if not self.full_code:
            # Generate unique bed code
            hostel_code = self.room.hostel.code if hasattr(self.room.hostel, 'code') else self.room.hostel.name[:3].upper()
            self.full_code = f"{hostel_code}-{self.room.room_number}-{self.code}"
        
        # Denormalize hostel FK for faster queries
        if not self.hostel_id:
            self.hostel = self.room.hostel
        
        super().save(*args, **kwargs)


class BedOccupancy(models.Model):
    """
    Timeline of bed occupancy for subscription billing.
    
    Each record represents a student occupying a bed during a specific period.
    Critical for:
    - Calculating landlord subscription fees (based on occupied bed-days)
    - Tracking mid-cycle bed transfers
    - Historical audit trail
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core References
    bed = models.ForeignKey(
        'Bed',
        on_delete=models.CASCADE,
        related_name='occupancy_timeline'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='bed_occupancy_history'
    )
    booking = models.ForeignKey(
        'Booking',
        on_delete=models.CASCADE,
        related_name='bed_occupancy',
        help_text="Booking that created this occupancy"
    )
    
    # Occupancy Period
    moved_in_at = models.DateField(
        help_text="Date student moved into this bed"
    )
    moved_out_at = models.DateField(
        null=True,
        blank=True,
        help_text="Date student moved out (null = still occupied)"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Current active occupancy"
    )
    
    # Billing (for subscription calculation)
    daily_subscription_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Daily platform subscription fee for this bed (KES/day)"
    )
    
    # Transfer Tracking
    transferred_from_bed = models.ForeignKey(
        'Bed',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfers_out',
        help_text="Previous bed if this is a mid-cycle transfer"
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bed_occupancy'
        indexes = [
            models.Index(fields=['bed', 'is_active'], name='idx_occupancy_bed_active'),
            models.Index(fields=['student', 'is_active'], name='idx_occupancy_student_active'),
            models.Index(fields=['moved_in_at', 'moved_out_at'], name='idx_occupancy_dates'),
        ]
        ordering = ['-moved_in_at']
        constraints = [
            models.CheckConstraint(
                check=models.Q(moved_out_at__isnull=True) | models.Q(moved_out_at__gt=models.F('moved_in_at')),
                name='valid_occupancy_dates'
            ),
            # Only one active occupancy per bed
            models.UniqueConstraint(
                fields=['bed'],
                condition=models.Q(is_active=True),
                name='one_active_occupancy_per_bed'
            ),
        ]
    
    def __str__(self):
        status = "Current" if self.is_active else "Past"
        return f"{status}: {self.student.user.get_full_name()} in {self.bed.full_code}"
    
    @property
    def occupancy_days(self):
        """Calculate number of days occupied"""
        end_date = self.moved_out_at or timezone.now().date()
        return (end_date - self.moved_in_at).days + 1
    
    def move_out(self, move_out_date):
        """End this occupancy"""
        self.moved_out_at = move_out_date
        self.is_active = False
        self.save()
