"""
Simple database seeding command for RUMI platform
Populates essential tables with test data for UI testing
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from datetime import date, datetime, timedelta
import random
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with test data for UI testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))
        
        with transaction.atomic():
            self.create_users()
            self.create_hostels()
            self.create_bookings()
            self.create_notifications()
            
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

    def create_users(self):
        """Create users with different roles"""
        self.stdout.write('Creating users...')
        
        # Create admin user
        admin_user = User.objects.create_user(
            email='admin@rumi.co.ke',
            password='admin123',
            first_name='System',
            last_name='Administrator',
            role='super_admin',
            is_verified=True,
            is_staff=True,
            is_superuser=True,
            phone_number='+254700000001'
        )
        
        # Create student users
        for i in range(15):
            User.objects.create_user(
                email=f'student{i+1}@example.com',
                password='student123',
                first_name=f'Student',
                last_name=f'{i+1}',
                role='student',
                is_verified=True,
                phone_number=f'+254700000{str(i+10).zfill(3)}'
            )
        
        # Create landlord users
        for i in range(5):
            User.objects.create_user(
                email=f'landlord{i+1}@example.com',
                password='landlord123',
                first_name=f'Landlord',
                last_name=f'{i+1}',
                role='landlord',
                is_verified=True,
                phone_number=f'+254700000{str(i+30).zfill(3)}'
            )
        
        # Create caretaker users
        for i in range(8):
            User.objects.create_user(
                email=f'caretaker{i+1}@example.com',
                password='caretaker123',
                first_name=f'Caretaker',
                last_name=f'{i+1}',
                role='caretaker',
                is_verified=True,
                phone_number=f'+254700000{str(i+50).zfill(3)}'
            )
        
        self.stdout.write(self.style.SUCCESS('Users created successfully'))

    def create_hostels(self):
        """Create hostels with rooms"""
        self.stdout.write('Creating hostels and rooms...')
        
        try:
            from hostels.models import Hostel, Room
            from accounts.models import LandlordProfile
            
            landlords = LandlordProfile.objects.all()
            if not landlords.exists():
                self.stdout.write(self.style.WARNING('No landlords found, creating some...'))
                # Create landlord profiles first
                for i, user in enumerate(User.objects.filter(role='landlord')):
                    LandlordProfile.objects.create(
                        user=user,
                        company_name=f'Property Company {i+1}',
                        national_id=f'12345{str(i).zfill(6)}',
                        business_address=f'Address {i+1}, Nairobi',
                        bank_name='KCB Bank',
                        bank_account_number=f'123456789{i}',
                        bank_code='01',
                        is_verified=True,
                        verified_by=User.objects.filter(role='super_admin').first()
                    )
                landlords = LandlordProfile.objects.all()
            
            # Create hostels
            for i, landlord in enumerate(landlords):
                hostel = Hostel.objects.create(
                    landlord=landlord,
                    name=f'University Hostel {i+1}',
                    description='Modern student accommodation',
                    address=f'{random.randint(1, 999)} University Street, Nairobi',
                    city='Nairobi',
                    university='University of Nairobi',
                    distance_from_university=Decimal('2.5'),
                    latitude=Decimal('-1.2921'),
                    longitude=Decimal('36.8219'),
                    gender_policy='mixed',
                    hostel_type='single_rooms',
                    status='active',
                    total_rooms=random.randint(20, 50),
                    available_rooms=random.randint(5, 15),
                    base_price=Decimal('12000'),
                    rating=Decimal('4.2'),
                    review_count=random.randint(10, 100),
                    is_verified=True,
                    verified_by=User.objects.filter(role='super_admin').first()
                )
                
                # Create rooms for this hostel
                for j in range(hostel.total_rooms):
                    Room.objects.create(
                        hostel=hostel,
                        room_number=f'A{str(j+1).zfill(3)}',
                        room_type='single',
                        floor=random.randint(1, 3),
                        base_price=Decimal('12000'),
                        status=random.choice(['available', 'occupied', 'maintenance']),
                        capacity=1,
                        current_occupancy=random.randint(0, 1),
                        amenities=['wifi', 'study_desk', 'wardrobe'],
                        description='Comfortable single room'
                    )
            
            self.stdout.write(self.style.SUCCESS('Hostels and rooms created successfully'))
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Could not import hostel models: {e}'))

    def create_bookings(self):
        """Create sample bookings"""
        self.stdout.write('Creating bookings...')
        
        try:
            from hostels.models import Booking, Room
            from accounts.models import StudentProfile
            
            students = StudentProfile.objects.all()
            rooms = Room.objects.filter(status='available')
            
            for i, student in enumerate(students[:10]):
                if rooms.exists():
                    room = random.choice(rooms)
                    Booking.objects.create(
                        student=student,
                        room=room,
                        booking_reference=f'BKG-{uuid.uuid4().hex[:8].upper()}',
                        check_in_date=timezone.now().date() + timedelta(days=7),
                        check_out_date=timezone.now().date() + timedelta(days=372),
                        duration_months=12,
                        monthly_rent=room.base_price,
                        total_amount=room.base_price * 12,
                        status='confirmed',
                        emergency_contact_name=student.emergency_contact_name,
                        emergency_contact_phone=student.emergency_contact_phone,
                        emergency_contact_relationship=student.emergency_contact_relationship,
                        confirmed_at=timezone.now() - timedelta(days=1)
                    )
                    
                    # Update room status
                    room.status = 'occupied'
                    room.current_occupancy = 1
                    room.save()
            
            self.stdout.write(self.style.SUCCESS('Bookings created successfully'))
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Could not import booking models: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating bookings: {e}'))

    def create_notifications(self):
        """Create sample notifications"""
        self.stdout.write('Creating notifications...')
        
        try:
            from notifications.models import Notification
            
            students = User.objects.filter(role='student')
            
            for i in range(20):
                student = random.choice(students)
                Notification.objects.create(
                    recipient=student,
                    notification_type=random.choice(['payment_success', 'booking_confirmed', 'maintenance_scheduled']),
                    channel='email',
                    subject=random.choice(['Payment Successful', 'Booking Confirmed', 'Welcome to RUMI']),
                    message=f'This is a test notification message {i+1}',
                    status='sent',
                    sent_at=timezone.now() - timedelta(days=random.randint(0, 7))
                )
            
            self.stdout.write(self.style.SUCCESS('Notifications created successfully'))
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Could not import notification models: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating notifications: {e}'))