import logging
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from payments.models import RentPeriod, Transaction
from hostels.models import Booking

class LifecycleService:
    """
    Centralized service for managing the Tenancy Lifecycle:
    Booking confirmed -> Check-in -> Active -> Offboarding.
    """

    @staticmethod
    @transaction.atomic
    def activate_tenancy(booking, transaction_obj=None):
        """
        Transitions a booking to 'confirmed' status and initializes rent periods.
        Triggered when the initial deposit/payment is verified.
        Uses select_for_update to prevent double-booking race conditions.
        """
        if booking.status == 'confirmed':
            return booking

        # 1. Lock and Validate Room Availability
        from hostels.models import Room
        try:
            # Lock the room row until this transaction commits
            room = Room.objects.select_for_update().get(id=booking.room.id)
        except Room.DoesNotExist:
            raise ValueError("Room not found")

        # Check capacity strictly under lock
        if room.current_occupancy >= room.capacity:
            # TODO: Trigger refund or waitlist logic here
            logger.error(f"Double Booking Prevented for Room {room.id}. User {booking.student.user.id} payment received but room full.")
            raise ValueError("Room is fully occupied. Please contact support for refund.")

        # 2. Update Booking Status
        booking.status = 'confirmed'
        if transaction_obj:
            booking.amount_paid += transaction_obj.amount
            booking.balance_due = max(Decimal('0.00'), booking.total_amount - booking.amount_paid)
        booking.save()
        
        # 3. Increment Occupancy (Optimistic updates for read performance)
        room.current_occupancy += 1
        if room.current_occupancy >= room.capacity:
            room.status = 'occupied'
        room.save(update_fields=['current_occupancy', 'status'])

        # 4. Grant Capabilities to User (e.g. access to hostel facilities)
        user = booking.student.user
        if 'tenancy:active' not in (user.capabilities or []):
            if not user.capabilities:
                user.capabilities = []
            user.capabilities.append('tenancy:active')
            user.save()

        # 5. Generate Rent Periods
        # Implementation moved here from payments/services to keep lifecycle logic centralized
        from payments.services import generate_rent_periods_for_booking
        generate_rent_periods_for_booking(booking)

        return booking

    @staticmethod
    @transaction.atomic
    def initiate_checkin(booking):
        """
        Moves tenancy status to 'checked_in'.
        Triggered when inventory verification is completed.
        """
        if booking.status != 'confirmed':
            raise ValueError("Booking must be confirmed before check-in")
        
        booking.status = 'checked_in'
        booking.check_in_date = timezone.now().date()
        booking.save()
        
        # Room occupation status update
        room = booking.room
        if room.status == 'available':
             # Logic for multi-occupancy or single occupancy
             pass
             
        return booking

    @staticmethod
    @transaction.atomic
    def process_offboarding(booking):
        """
        Handles moving out, deposit reconciliation, and capability revocation.
        Flow: checked_in -> inspection_pending -> completed.
        Releases room capacity on completion (Ghost Occupancy Fix).
        """
        # Step 1: Initiate Inspection
        if booking.status == 'checked_in':
            booking.status = 'inspection_pending'
            booking.save()
            return booking

        # Step 2: Finalize Move-out
        if booking.status == 'inspection_pending':
            # In a real scenario, we'd check if DamageReports are resolved here
            
            booking.status = 'completed'
            booking.actual_check_out_date = timezone.now().date()
            booking.save()
            
            # Release Room Capacity (Fixed Ghost Occupancy)
            room = booking.room
            room.current_occupancy = max(0, room.current_occupancy - 1)
            
            # Update status if space freed up
            if room.current_occupancy < room.capacity:
                room.status = 'available'
            
            room.save(update_fields=['current_occupancy', 'status'])
            
            # Revoke Tenancy Capabilities
            user = booking.student.user
            if user.capabilities and 'tenancy:active' in user.capabilities:
                try:
                    user.capabilities.remove('tenancy:active')
                    user.save(update_fields=['capabilities'])
                except ValueError:
                    pass
                
            return booking

        raise ValueError("Booking must be in 'checked_in' or 'inspection_pending' status to offboard")
