from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from accounts.utils import send_branded_email


@shared_task
def notify_landlord_inventory_template_created(hostel_id, caretaker_name, total_items):
    """
    Notify landlord when caretaker creates inventory template
    """
    from .models import Hostel
    try:
        hostel = Hostel.objects.select_related('landlord__user').get(id=hostel_id)

        subject = f'Inventory Template Created - {hostel.name}'
        message = f"""
        Dear {hostel.landlord.user.first_name},

        Your caretaker {caretaker_name} has created an inventory template for {hostel.name}.

        Template Details:
        - Hostel: {hostel.name}
        - Total Items: {total_items}
        - Created: {timezone.now().strftime('%B %d, %Y at %I:%M %p')}

        This template will be used for all check-ins and check-outs at this hostel.

        Best regards,
        RUMI Platform
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[hostel.landlord.user.email],
            recipient_name=hostel.landlord.user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to notify landlord of inventory template creation: {e}")


@shared_task
def notify_caretaker_checkin_submitted(checkin_id):
    """
    Notify caretaker when student submits check-in
    """
    from .models import InventoryCheckIn
    try:
        checkin = InventoryCheckIn.objects.select_related(
            'room__hostel__caretaker__user', 'student__user'
        ).get(id=checkin_id)

        caretaker = checkin.room.hostel.caretaker
        if not caretaker or not caretaker.is_active:
            return

        subject = f'Inventory Check-in Submitted - Room {checkin.room.room_number}'
        message = f"""
        Dear {caretaker.user.first_name},

        A student has submitted an inventory check-in for Room {checkin.room.room_number} at {checkin.room.hostel.name}.

        Details:
        - Student: {checkin.student.user.get_full_name()}
        - Room: {checkin.room.room_number}
        - Hostel: {checkin.room.hostel.name}
        - Submitted: {checkin.student_submitted_at.strftime('%B %d, %Y at %I:%M %p')}

        Please review and verify the inventory checklist within 24 hours.

        Check-in URL: https://rumi.co.ke/admin/hostels/inventorycheckin/{checkin.id}/change/

        Best regards,
        RUMI Platform
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[caretaker.user.email],
            recipient_name=caretaker.user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to notify caretaker of check-in submission: {e}")


@shared_task
def notify_student_checkin_verified(checkin_id, room_number, hostel_name):
    """
    Notify student when caretaker verifies check-in
    """
    from .models import InventoryCheckIn
    try:
        checkin = InventoryCheckIn.objects.select_related('student__user').get(id=checkin_id)

        subject = f'Inventory Check-in Verified - Room {room_number}'
        message = f"""
        Hi {checkin.student.user.first_name},

        Great news! Your inventory check-in for Room {room_number} at {hostel_name} has been verified by the caretaker.

        You can now:
        - Move into your room
        - Access all hostel facilities
        - Contact the caretaker for any questions

        If you have any concerns about the verification, please contact the caretaker directly.

        Welcome to your new home!

        Best regards,
        RUMI Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[checkin.student.user.email],
            recipient_name=checkin.student.user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to notify student of check-in verification: {e}")


@shared_task
def cleanup_expired_reservation(reservation_id):
    """
    Clean up expired room reservation
    """
    from .models import RoomReservation
    try:
        reservation = RoomReservation.objects.select_related('room').get(id=reservation_id)

        if reservation.is_active and reservation.expiry_time <= timezone.now():
            with transaction.atomic():
                # Mark as expired
                reservation.is_active = False
                reservation.expired_at = timezone.now()
                reservation.save()

                # Release room hold
                room = reservation.room
                if room.current_occupancy > 0:
                    room.current_occupancy -= 1
                    room.save()

                print(f"Cleaned up expired reservation {reservation_id}")
    except RoomReservation.DoesNotExist:
        print(f"Reservation {reservation_id} not found")
    except Exception as e:
        print(f"Failed to cleanup reservation {reservation_id}: {e}")


@shared_task
def cleanup_expired_reservations():
    """
    Clean up all expired reservations (batch job)
    """
    from .models import RoomReservation
    try:
        expired_reservations = RoomReservation.objects.filter(
            is_active=True,
            expiry_time__lt=timezone.now()
        )

        cleaned_count = 0
        for reservation in expired_reservations:
            try:
                with transaction.atomic():
                    reservation.is_active = False
                    reservation.expired_at = timezone.now()
                    reservation.save()

                    # Release room hold
                    room = reservation.room
                    if room.current_occupancy > 0:
                        room.current_occupancy -= 1
                        room.save()

                    cleaned_count += 1
            except Exception as e:
                print(f"Failed to cleanup reservation {reservation.id}: {e}")

        print(f"Cleaned up {cleaned_count} expired reservations")
        return cleaned_count
    except Exception as e:
        print(f"Failed to cleanup expired reservations: {e}")
        return 0


@shared_task
def update_room_availability_cache():
    """
    Update room availability cache for performance
    """
    from .models import Room
    from django.core.cache import cache

    try:
        rooms = Room.objects.filter(is_active=True).select_related('hostel')

        updated_count = 0
        for room in rooms:
            cache_key = f"room:availability:{room.id}"
            cache_data = {
                'is_available': room.is_available,
                'current_occupancy': room.current_occupancy,
                'capacity': room.capacity,
                'cached_at': timezone.now()
            }
            cache.set(cache_key, cache_data, timeout=300)  # 5 minutes
            updated_count += 1

        print(f"Updated availability cache for {updated_count} rooms")
        return updated_count
    except Exception as e:
        print(f"Failed to update room availability cache: {e}")
        return 0


@shared_task
def generate_monthly_hostel_reports():
    """
    Generate monthly reports for hostels
    """
    from .models import Hostel, Room, Booking
    from django.db.models import Count, Sum
    from decimal import Decimal

    try:
        # Get current month
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (month_start + timezone.timedelta(days=32)).replace(day=1)

        hostels = Hostel.objects.filter(is_active=True)

        reports = []
        for hostel in hostels:
            # Room statistics
            total_rooms = Room.objects.filter(hostel=hostel, is_active=True).count()
            occupied_rooms = Room.objects.filter(
                hostel=hostel,
                is_active=True,
                current_occupancy__gt=0
            ).count()

            # Booking statistics
            monthly_bookings = Booking.objects.filter(
                room__hostel=hostel,
                created_at__gte=month_start,
                created_at__lt=next_month
            ).aggregate(
                total_bookings=Count('id'),
                total_revenue=Sum('total_amount')
            )

            report = {
                'hostel_id': hostel.id,
                'hostel_name': hostel.name,
                'month': month_start.strftime('%Y-%m'),
                'total_rooms': total_rooms,
                'occupied_rooms': occupied_rooms,
                'occupancy_rate': (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0,
                'monthly_bookings': monthly_bookings['total_bookings'] or 0,
                'monthly_revenue': float(monthly_bookings['total_revenue'] or Decimal('0.00'))
            }

            reports.append(report)

        # Here you would save reports to database or send emails
        print(f"Generated monthly reports for {len(reports)} hostels")
        return len(reports)
    except Exception as e:
        print(f"Failed to generate monthly hostel reports: {e}")
        return 0


@shared_task
def send_inventory_reminders():
    """
    Send reminders for overdue inventory check-ins/check-outs
    """
    from .models import InventoryCheckIn, InventoryCheckOut
    from datetime import timedelta

    try:
        # Overdue check-ins (more than 24 hours)
        overdue_checkins = InventoryCheckIn.objects.filter(
            status='pending',
            created_at__lt=timezone.now() - timedelta(hours=24)
        ).select_related('student__user', 'room__hostel')

        checkin_reminders = 0
        for checkin in overdue_checkins:
            # Send reminder email to student
            subject = f'Urgent: Complete Inventory Check-in - Room {checkin.room.room_number}'
            message = f"""
            Hi {checkin.student.user.first_name},

            Your inventory check-in for Room {checkin.room.room_number} at {checkin.room.hostel.name} is overdue.

            Please complete the check-in process as soon as possible to avoid delays in moving in.

            Check-in URL: https://rumi.co.ke/dashboard/checkin/{checkin.id}

            If you need assistance, contact the caretaker.

            Best regards,
            RUMI Team
            """

            send_branded_email(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[checkin.student.user.email],
                recipient_name=checkin.student.user.first_name,
                fail_silently=True
            )
            checkin_reminders += 1

        # Overdue check-outs (more than 24 hours before deadline)
        overdue_checkouts = InventoryCheckOut.objects.filter(
            status__in=['pending', 'student_submitted'],
            checkout_deadline__lt=timezone.now() + timedelta(hours=24)
        ).select_related('student__user', 'room__hostel')

        checkout_reminders = 0
        for checkout in overdue_checkouts:
            subject = f'Urgent: Complete Inventory Check-out - Room {checkout.room.room_number}'
            message = f"""
            Hi {checkout.student.user.first_name},

            Your inventory check-out for Room {checkout.room.room_number} at {checkout.room.hostel.name} is due soon.

            Deadline: {checkout.checkout_deadline.strftime('%B %d, %Y at %I:%M %p')}

            Please complete the check-out process to avoid additional charges.

            Check-out URL: https://rumi.co.ke/dashboard/checkout/{checkout.id}

            Best regards,
            RUMI Team
            """

            send_branded_email(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[checkout.student.user.email],
                recipient_name=checkout.student.user.first_name,
                fail_silently=True
            )
            checkout_reminders += 1

        print(f"Sent {checkin_reminders} check-in reminders and {checkout_reminders} check-out reminders")
        return checkin_reminders + checkout_reminders
    except Exception as e:
        print(f"Failed to send inventory reminders: {e}")
        return 0