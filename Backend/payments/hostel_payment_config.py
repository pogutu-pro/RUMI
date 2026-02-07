"""
Per-hostel payment configuration for multi-tenant support.

CRITICAL: Supports both Paybill AND Till numbers.
Each hostel can configure their own M-Pesa payment method.
"""

from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class HostelPaymentConfig(models.Model):
    """
    Per-hostel payment configuration for true multi-tenant isolation.
    
    Each hostel can have their own Paybill or Till number.
    Account numbers are unique per hostel.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Reference (one-to-one with Hostel)
    hostel = models.OneToOneField(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='payment_config'
    )
    
    # Payment Method Type
    PAYMENT_TYPE_CHOICES = [
        ('paybill', 'M-Pesa Paybill'),
        ('till', 'M-Pesa Till Number'),
        ('bank', 'Bank Account'),  # Future support
    ]
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPE_CHOICES,
        default='paybill'
    )
    
    # M-Pesa Configuration
    mpesa_number = models.CharField(
        max_length=20,
        help_text="Paybill number or Till number",
        validators=[RegexValidator(regex=r'^\d{5,7}$', message="Must be 5-7 digits")]
    )
    business_name = models.CharField(
        max_length=255,
        help_text="Business name as registered with M-Pesa"
    )
    
    # Account Number Configuration
    account_number_template = models.CharField(
        max_length=100,
        default="{hostel_code}-{bed_code}-{checksum}",
        help_text="Template for generating account numbers"
    )
    account_number_prefix = models.CharField(
        max_length=10,
        blank=True,
        help_text="Optional prefix for all account numbers (e.g., 'KBH')"
    )
    
    # Verification Status
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('test_payment_sent', 'Test Payment Sent'),
        ('verified', 'Verified'),
        ('failed', 'Verification Failed'),
    ]
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
    # Test Payment Tracking (for verification)
    test_payment_account_number = models.CharField(max_length=50, blank=True)
    test_payment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount for test payment (e.g., KES 50)"
    )
    test_payment_received_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(
        default=False,
        help_text="Only active configs are used for payment routing"
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hostel_payment_configs'
        indexes = [
            models.Index(fields=['hostel'], name='idx_payment_cfg_hostel'),
            models.Index(fields=['mpesa_number'], name='idx_payment_cfg_mpesa'),
            models.Index(fields=['verification_status'], name='idx_payment_cfg_verify'),
        ]
    
    def __str__(self):
        return f"{self.hostel.name} - {self.get_payment_type_display()} ({self.mpesa_number})"
    
    def generate_account_number(self, bed):
        """
        Generate unique account number for a bed.
        
        Format: {HOSTEL_CODE}-{BED_CODE}-{CHECKSUM}
        Example: KBH-101A-47
        
        Args:
            bed: Bed instance
            
        Returns:
            str: Unique account number
        """
        from .account_number_utils import generate_account_number
        return generate_account_number(self.hostel, bed, self.account_number_prefix)
    
    def validate_account_number(self, account_number):
        """
        Validate account number checksum.
        
        Args:
            account_number: Account number string to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        from .account_number_utils import validate_account_number_checksum
        return validate_account_number_checksum(account_number)
    
    def mark_verified(self):
        """Mark payment config as verified"""
        self.verification_status = 'verified'
        self.verified_at = timezone.now()
        self.is_active = True
        self.save()
