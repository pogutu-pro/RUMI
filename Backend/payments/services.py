"""
RentPeriod Business Logic Services

This module contains the core business logic for:
- Generating RentPeriods upon booking confirmation
- Processing payments and applying them to RentPeriods
- Managing StudentWallet credits
- Handling room/hostel transfers
"""

from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from datetime import date
import uuid

from .models import RentPeriod, StudentWallet, Transaction, TransferLog
from hostels.models import Booking


def generate_rent_periods_for_booking(booking):
    """
    Generate RentPeriod records for a confirmed booking.
    Creates one RentPeriod per month for the booking duration.
    
    Args:
        booking: Booking instance
    
    Returns:
        list: Created RentPeriod instances
    """
    rent_periods = []
    current_date = booking.check_in_date
    
    # Generate a unique bed_slot_id (can be enhanced with actual bed tracking)
    bed_slot_id = f"{booking.room.room_number}-{booking.student.id}"
    
    for month_offset in range(booking.duration_months):
        period_start = current_date + relativedelta(months=month_offset)
        period_end = period_start + relativedelta(months=1) - relativedelta(days=1)
        
        # Generate unique student account reference for paybill matching
        student_account_ref = f"STU{booking.student.id:06d}M{month_offset+1:02d}"
        
        rent_period = RentPeriod.objects.create(
            student=booking.student,
            hostel=booking.room.hostel,
            booking=booking,
            room=booking.room,
            bed_slot_id=bed_slot_id,
            start_date=period_start,
            end_date=period_end,
            amount_due=booking.monthly_rent,
            amount_paid=Decimal('0.00'),
            status='due',
            student_account_ref=student_account_ref,
            # assigned_paybill will be set by landlord later
        )
        rent_periods.append(rent_period)
    
    return rent_periods


def get_or_create_student_wallet(student):
    """Get or create a StudentWallet for the given student."""
    wallet, created = StudentWallet.objects.get_or_create(
        student=student,
        defaults={'balance': Decimal('0.00')}
    )
    return wallet


@transaction.atomic
def process_payment_to_rent_periods(student, amount, payment_method, metadata=None):
    """
    Process a payment and apply it to the oldest unpaid RentPeriods.
    Excess amount goes to StudentWallet.
    
    Args:
        student: StudentProfile instance
        amount: Decimal amount paid
        payment_method: 'mpesa' or 'paystack'
        metadata: dict of payment gateway metadata
    
    Returns:
        dict: {
            'transactions': list of Transaction instances created,
            'rent_periods_updated': list of RentPeriod instances updated,
            'wallet_credit': Decimal amount added to wallet (if any)
        }
    """
    remaining_amount = amount
    transactions = []
    rent_periods_updated = []
    
    # Get unpaid/partially paid RentPeriods, oldest first
    unpaid_periods = RentPeriod.objects.filter(
        student=student,
        status__in=['due', 'partially_paid', 'overdue']
    ).order_by('start_date')
    
    for rent_period in unpaid_periods:
        if remaining_amount <= 0:
            break
        
        balance = rent_period.balance
        
        if balance <= 0:
            continue
        
        # Determine how much to apply to this period
        payment_to_apply = min(remaining_amount, balance)
        
        # Create transaction record
        transaction_ref = f"RUMI-RENT-{rent_period.id}-{uuid.uuid4().hex[:8]}"
        txn = Transaction.objects.create(
            rent_period=rent_period,
            booking=rent_period.booking,
            student=student,
            transaction_reference=transaction_ref,
            amount=payment_to_apply,
            transaction_type='rent',
            payment_method=payment_method,
            status='success',
            metadata=metadata or {},
            paid_at=timezone.now()
        )
        transactions.append(txn)
        
        # Update RentPeriod
        rent_period.amount_paid += payment_to_apply
        
        if rent_period.amount_paid >= rent_period.amount_due:
            rent_period.status = 'paid'
        else:
            rent_period.status = 'partially_paid'
        
        rent_period.save()
        rent_periods_updated.append(rent_period)
        
        remaining_amount -= payment_to_apply
    
    # Handle excess amount -> StudentWallet
    wallet_credit = Decimal('0.00')
    if remaining_amount > 0:
        wallet = get_or_create_student_wallet(student)
        wallet.balance += remaining_amount
        wallet.save()
        wallet_credit = remaining_amount
        
        # Create a wallet credit transaction
        wallet_txn_ref = f"RUMI-WALLET-{student.id}-{uuid.uuid4().hex[:8]}"
        wallet_txn = Transaction.objects.create(
            student=student,
            transaction_reference=wallet_txn_ref,
            amount=remaining_amount,
            transaction_type='wallet_credit',
            payment_method=payment_method,
            status='success',
            metadata=metadata or {},
            paid_at=timezone.now()
        )
        transactions.append(wallet_txn)
    
    return {
        'transactions': transactions,
        'rent_periods_updated': rent_periods_updated,
        'wallet_credit': wallet_credit
    }


@transaction.atomic
def handle_room_transfer(student, from_rent_period, new_room, transfer_date, reason=""):
    """
    Handle a student transfer from one room to another.
    Marks the current RentPeriod as 'transferred' and creates new RentPeriods
    for the new room starting from the transfer date.
    
    Args:
        student: StudentProfile instance
        from_rent_period: Current RentPeriod being transferred from
        new_room: New Room instance
        transfer_date: Date of transfer
        reason: Optional reason for transfer
    
    Returns:
        dict: {
            'from_rent_period': updated RentPeriod,
            'to_rent_period': new RentPeriod created,
            'transfer_log': TransferLog instance
        }
    """
    # Mark current period as transferred
    from_rent_period.status = 'transferred'
    from_rent_period.save()
    
    # Create new RentPeriod for the new room
    # Calculate remaining days in the month
    days_remaining = (from_rent_period.end_date - transfer_date).days + 1
    days_in_period = (from_rent_period.end_date - from_rent_period.start_date).days + 1
    
    # Pro-rate the rent for the new period
    prorated_amount = (new_room.base_price * days_remaining) / days_in_period
    
    bed_slot_id = f"{new_room.room_number}-{student.id}"
    student_account_ref = f"STU{student.id:06d}TR{uuid.uuid4().hex[:4]}"
    
    to_rent_period = RentPeriod.objects.create(
        student=student,
        hostel=new_room.hostel,
        booking=from_rent_period.booking,  # Keep same booking
        room=new_room,
        bed_slot_id=bed_slot_id,
        start_date=transfer_date,
        end_date=from_rent_period.end_date,
        amount_due=prorated_amount,
        amount_paid=Decimal('0.00'),
        status='due',
        student_account_ref=student_account_ref,
    )
    
    # Create transfer log
    transfer_log = TransferLog.objects.create(
        student=student,
        from_rent_period=from_rent_period,
        to_rent_period=to_rent_period,
        transfer_date=timezone.now(),
        reason=reason
    )
    
    return {
        'from_rent_period': from_rent_period,
        'to_rent_period': to_rent_period,
        'transfer_log': transfer_log
    }


@transaction.atomic
def process_confirmed_payment(student, amount, reference, payment_method, metadata=None):
    """
    Unified entry point for processing any confirmed payment from a webhook.
    Resolves whether the payment is for a Booking deposit or a RentPeriod.
    """
    from hostels.lifecycle_services import LifecycleService
    from hostels.models import Booking

    # 1. Resolve Target from Reference
    # Format: RUMI-{TYPE}-{ID}-{UUID}
    parts = reference.split('-')
    if len(parts) < 3:
        raise ValueError(f"Invalid reference format: {reference}")

    ref_type = parts[1] # INITIAL (Booking) or RENT (RentPeriod)
    ref_id = parts[2]

    transaction_obj = None

    if ref_type == 'INITIAL':
        # This is a booking deposit
        try:
            booking = Booking.objects.select_related('student').get(id=ref_id)
            if student and booking.student != student:
                raise ValueError(f"Booking/Student mismatch: {booking.student.id} != {student.id}")
            student = student or booking.student
        except Booking.DoesNotExist:
            raise ValueError(f"Booking {ref_id} not found")

        # Check if transaction already exists for this reference
        transaction_obj = Transaction.objects.filter(transaction_reference=reference, status='success').first()
        if transaction_obj:
            return {"type": "booking", "booking_id": booking.id, "status": "already_processed"}

        transaction_obj = Transaction.objects.create(
            booking=booking,
            student=student,
            transaction_reference=reference,
            amount=amount,
            transaction_type='deposit',
            payment_method=payment_method,
            status='success',
            metadata=metadata or {},
            paid_at=timezone.now()
        )

        LifecycleService.activate_tenancy(booking, transaction_obj)
        return {"type": "booking", "booking_id": booking.id}

    elif ref_type == 'RENT':
        # This is a standard rent payment
        try:
            rent_period = RentPeriod.objects.select_related('student', 'booking').get(id=ref_id)
            if student and rent_period.student != student:
                raise ValueError(f"RentPeriod/Student mismatch: {rent_period.student.id} != {student.id}")
            student = student or rent_period.student
        except RentPeriod.DoesNotExist:
            raise ValueError(f"RentPeriod {ref_id} not found")

        transaction_obj = Transaction.objects.filter(transaction_reference=reference, status='success').first()
        if transaction_obj:
            return {"type": "rent", "rent_period_id": rent_period.id, "status": "already_processed"}

        transaction_obj = Transaction.objects.create(
            rent_period=rent_period,
            booking=rent_period.booking,
            student=student,
            transaction_reference=reference,
            amount=amount,
            transaction_type='rent',
            payment_method=payment_method,
            status='success',
            metadata=metadata or {},
            paid_at=timezone.now()
        )

        rent_period.amount_paid += amount
        if rent_period.amount_paid >= rent_period.amount_due:
            rent_period.status = 'paid'
        else:
            rent_period.status = 'partially_paid'
        rent_period.save()

        return {"type": "rent", "rent_period_id": rent_period.id}

    else:
        # Fallback to greedy processing if type is unknown or mismatched
        return process_payment_to_rent_periods(student, amount, payment_method, metadata)
