"""
Django signals for automatic RentPeriod creation and payment synchronization.

This module handles the core business logic for recurring rent payments:
1. Creates RentPeriod instances when bookings are confirmed
2. Updates RentPeriod status when payments succeed
3. Synchronizes Booking amounts with RentPeriod totals
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta, date
import logging

logger = logging.getLogger(__name__)

from hostels.models import Booking
from .models import RentPeriod, Transaction


@receiver(pre_save, sender=Booking)
def track_booking_status_change(sender, instance, **kwargs):
    """
    Track the original status before save to detect status changes.
    """
    if instance.pk:
        try:
            original = Booking.objects.get(pk=instance.pk)
            instance._original_status = original.status
        except Booking.DoesNotExist:
            instance._original_status = None
    else:
        instance._original_status = None


@receiver(post_save, sender=Booking)
def create_initial_rent_period(sender, instance, created, **kwargs):
    """
    Create initial RentPeriod when a booking is confirmed.
    
    DISABLED: The LifecycleService already handles RentPeriod creation properly.
    This signal is kept for documentation purposes but disabled to avoid conflicts.
    """
    # LifecycleService handles RentPeriod creation - do nothing here
    pass


@receiver(post_save, sender=Transaction)
def update_rent_period_on_payment(sender, instance, created, **kwargs):
    """
    Update RentPeriod when a transaction succeeds.
    
    DISABLED: The process_confirmed_payment service handles RentPeriod updates.
    This signal is kept for documentation but disabled to avoid double counting.
    """
    # process_confirmed_payment service handles RentPeriod updates - do nothing here
    logger.debug(f"RentPeriod update signal disabled for Transaction {instance.id}")
    return


@receiver(post_save, sender=RentPeriod)
def sync_booking_amounts(sender, instance, **kwargs):
    """
    Synchronize Booking amounts with RentPeriod totals.
    
    TEMPORARILY DISABLED FOR TESTING - The LifecycleService handles booking updates.
    """
    # Temporarily disabled to test LifecycleService behavior
    logger.debug(f"Booking sync signal disabled for RentPeriod {instance.id}")
    return
