"""
Complete the database seeding by creating student profiles and related data
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
    help = 'Complete database seeding by creating student profiles and related data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to complete database seeding...'))
        
        with transaction.atomic():
            self.create_student_profiles()
            self.create_bookings_and_payments()
            
        self.stdout.write(self.style.SUCCESS('Database seeding completion finished successfully!'))

    def create_student_profiles(self):
        """Create student profiles for existing student users"""
        self.stdout.write('Creating student profiles...')
        
        try:
            from accounts.models import StudentProfile
            
            universities = ['University of Nairobi', 'Kenya Methodist University', 'Strathmore University', 
                           'Daystar University', 'United States International University']
            courses = ['Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Law']
            
            students = User.objects.filter(role='student')
            
            for i, student in enumerate(students):
                StudentProfile.objects.create(
                    user=student,
                    university=random.choice(universities),
                    student_id_number=f'CS{str(i+1).zfill(8)}',
                    year_of_study=random.randint(1, 4),
                    course=random.choice(courses),
                    bio=f'Student {i+1} studying {random.choice(courses)}',
                    emergency_contact_name=f'Emergency Contact {i+1}',
                    emergency_contact_phone=f'+254700000{str(i+100).zfill(3)}',
                    emergency_contact_relationship='Parent'
                )
            
            self.stdout.write(self.style.SUCCESS(f'Created {students.count()} student profiles'))
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Could not import student profile models: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating student profiles: {e}'))

    def create_bookings_and_payments(self):
        """Create bookings and payment transactions"""
        self.stdout.write('Creating bookings and payments...')
        
        try:
            from hostels.models import Booking, Room
            from accounts.models import StudentProfile
            from payments.models import Transaction, Receipt
            
            students = StudentProfile.objects.all()
            rooms = Room.objects.filter(status='available')
            
            if not students.exists():
                self.stdout.write(self.style.WARNING('No student profiles found'))
                return
                
            if not rooms.exists():
                self.stdout.write(self.style.WARNING('No available rooms found'))
                return
            
            bookings_created = 0
            for i, student in enumerate(students[:10]):  # Create bookings for first 10 students
                if rooms.exists() and random.random() < 0.8:  # 80% chance of having a booking
                    room = random.choice(rooms)
                    
                    # Create booking
                    check_in_date = timezone.now().date() + timedelta(days=random.randint(-30, 60))
                    booking = Booking.objects.create(
                        student=student,
                        room=room,
                        booking_reference=f'BKG-{uuid.uuid4().hex[:8].upper()}',
                        check_in_date=check_in_date,
                        check_out_date=check_in_date + timedelta(days=365),
                        duration_months=12,
                        monthly_rent=room.base_price,
                        total_amount=room.base_price * 12,
                        status='confirmed',
                        emergency_contact_name=student.emergency_contact_name,
                        emergency_contact_phone=student.emergency_contact_phone,
                        emergency_contact_relationship=student.emergency_contact_relationship,
                        confirmed_at=timezone.now() - timedelta(days=random.randint(1, 30))
                    )
                    
                    bookings_created += 1
                    
                    # Update room status
                    room.status = 'occupied'
                    room.current_occupancy = 1
                    room.save()
                    
                    # Create transaction
                    transaction = Transaction.objects.create(
                        booking=booking,
                        student=student,
                        landlord=room.hostel.landlord,
                        transaction_reference=f'TXN-{uuid.uuid4().hex[:8].upper()}',
                        transaction_type='initial',
                        payment_plan='monthly',
                        base_rent=booking.monthly_rent,
                        student_service_fee=booking.monthly_rent * Decimal('0.02'),
                        total_charged_amount=booking.monthly_rent + (booking.monthly_rent * Decimal('0.02')),
                        landlord_payout_amount=booking.monthly_rent,
                        gross_platform_revenue=booking.monthly_rent * Decimal('0.02'),
                        currency='KES',
                        status='success',
                        initiated_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                        paid_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                        gateway_fee=Decimal(str(random.uniform(100, 300))),
                        net_platform_revenue=Decimal(str(random.uniform(50, 200)))
                    )
                    
                    # Create receipt
                    receipt = Receipt.objects.create(
                        transaction=transaction,
                        receipt_number=f'RUMI-{timezone.now().strftime("%Y%m%d")}-{str(uuid.uuid4())[:6].upper()}',
                        email_sent=True,
                        emailed_at=transaction.paid_at
                    )
            
            self.stdout.write(self.style.SUCCESS(f'Created {bookings_created} bookings with payments and receipts'))
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Could not import booking/payment models: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating bookings and payments: {e}'))