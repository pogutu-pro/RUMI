from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from accounts.models import User, StudentProfile, LandlordProfile
from hostels.models import Booking
from hostels.lifecycle_services import LifecycleService
from payments.models import RentPeriod

class Command(BaseCommand):
    help = 'Migrate existing data to V2 state machine and capability model'

    def handle(self, *args, **options):
        self.stdout.write("Starting V2 migration...")
        
        with transaction.atomic():
            # 1. Migrate Users
            users = User.objects.all()
            for user in users:
                updated = False
                
                # Set onboarding stage for existing active users
                if user.is_active and user.onboarding_stage == 'REGISTERED':
                    user.onboarding_stage = 'COMPLETED'
                    updated = True
                
                # Initialize capabilities list if null
                if user.capabilities is None:
                    user.capabilities = []
                    updated = True
                
                # Check for active tenancies to grant capabilities
                if user.role == 'student':
                    has_active_booking = Booking.objects.filter(
                        student__user=user, 
                        status__in=['confirmed', 'checked_in']
                    ).exists()
                    
                    if has_active_booking and 'tenancy:active' not in user.capabilities:
                        user.capabilities.append('tenancy:active')
                        updated = True
                
                if updated:
                    user.save()
            
            self.stdout.write(self.style.SUCCESS(f"Migrated {users.count()} users."))

            # 2. Migrate Bookings (Generate RentPeriods for confirmed bookings)
            confirmed_bookings = Booking.objects.filter(status='confirmed')
            periods_created = 0
            
            for booking in confirmed_bookings:
                # Only generate if no periods exist
                if not RentPeriod.objects.filter(booking=booking).exists():
                    try:
                        from payments.services import generate_rent_periods_for_booking
                        generate_rent_periods_for_booking(booking)
                        periods_created += 1
                    except Exception as e:
                        self.stderr.write(f"Failed to generate periods for booking {booking.id}: {str(e)}")
            
            self.stdout.write(self.style.SUCCESS(f"Generated rent periods for {periods_created} bookings."))

        self.stdout.write(self.style.SUCCESS("V2 migration completed successfully."))
