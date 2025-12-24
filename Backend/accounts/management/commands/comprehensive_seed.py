"""
Comprehensive database seeding command for RUMI platform
Populates all tables with realistic test data for UI testing
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from datetime import date, datetime, timedelta
import random
import uuid

# Import all models
from accounts.models import (
    User, StudentProfile, LandlordProfile, CaretakerProfile,
    OTPVerification, PasswordResetToken, UserActivityLog,
    Conversation, Message
)
from accounts.subscription_models import SubscriptionPlan, LandlordSubscription, FeatureAccess

from hostels.models import (
    Hostel, Room, Booking, RoomImage, Amenity, HostelAmenity,
    RoomTransfer, DamageReport, InventoryTemplate, RoomReservation,
    RoomOccupant, CompatibilityScore, InventoryItem,
    InventoryCheckIn, InventoryCheckOut, RoomInventory,
    VisitorCheckIn, RoomRequest, MaintenanceLog, IncidentReport,
    LateEntryLog, VisitorInvitation
)

from payments.models import (
    Transaction, SavedPaymentMethod, RecurringPayment, LateFeeCharge,
    TaxReport, PaystackSubaccount, Payout, RefundRequest,
    RevenueAnalytics, Receipt
)

from notifications.models import Notification, EmailTemplate, SMSTemplate, NotificationPreference

from home.models import Page, TeamMember, ContactInquiry, FAQ, BlogPost, Newsletter, Testimonial, Statistics

from analytics.models import AnalyticsEvent, LandlordAnalytics, CaretakerAnalytics, StudentAnalytics

from admin_api.models import SystemActivity, HostelModeration, PaymentDispute, AdminSubscription, UserSuspension

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with comprehensive test data for UI testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting comprehensive database seeding...'))
        
        with transaction.atomic():
            self.clear_existing_data()
            self.create_users_and_profiles()
            self.create_subscription_plans()
            self.create_hostels_and_rooms()
            self.create_bookings_and_payments()
            self.create_notifications_and_communications()
            self.create_amenities_and_inventory()
            self.create_maintenance_and_incident_data()
            self.create_analytics_data()
            self.create_admin_data()
            self.create_homepage_content()
            
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

    def clear_existing_data(self):
        """Clear existing data to start fresh"""
        self.stdout.write('Clearing existing data...')
        
        # Clear in reverse dependency order
        Receipt.objects.all().delete()
        RevenueAnalytics.objects.all().delete()
        RefundRequest.objects.all().delete()
        Payout.objects.all().delete()
        LateFeeCharge.objects.all().delete()
        RecurringPayment.objects.all().delete()
        SavedPaymentMethod.objects.all().delete()
        Transaction.objects.all().delete()
        
        VisitorInvitation.objects.all().delete()
        LateEntryLog.objects.all().delete()
        IncidentReport.objects.all().delete()
        MaintenanceLog.objects.all().delete()
        RoomRequest.objects.all().delete()
        VisitorCheckIn.objects.all().delete()
        RoomInventory.objects.all().delete()
        InventoryCheckOut.objects.all().delete()
        InventoryCheckIn.objects.all().delete()
        InventoryItem.objects.all().delete()
        CompatibilityScore.objects.all().delete()
        RoomOccupant.objects.all().delete()
        RoomReservation.objects.all().delete()
        InventoryTemplate.objects.all().delete()
        DamageReport.objects.all().delete()
        RoomTransfer.objects.all().delete()
        RoomImage.objects.all().delete()
        Booking.objects.all().delete()
        Room.objects.all().delete()
        HostelAmenity.objects.all().delete()
        Amenity.objects.all().delete()
        Hostel.objects.all().delete()
        
        Message.objects.all().delete()
        Conversation.objects.all().delete()
        UserActivityLog.objects.all().delete()
        PasswordResetToken.objects.all().delete()
        OTPVerification.objects.all().delete()
        CaretakerProfile.objects.all().delete()
        LandlordProfile.objects.all().delete()
        StudentProfile.objects.all().delete()
        
        FeatureAccess.objects.all().delete()
        LandlordSubscription.objects.all().delete()
        SubscriptionPlan.objects.all().delete()
        
        NotificationPreference.objects.all().delete()
        SMSTemplate.objects.all().delete()
        EmailTemplate.objects.all().delete()
        Notification.objects.all().delete()
        
        AnalyticsEvent.objects.all().delete()
        StudentAnalytics.objects.all().delete()
        CaretakerAnalytics.objects.all().delete()
        LandlordAnalytics.objects.all().delete()
        
        UserSuspension.objects.all().delete()
        AdminSubscription.objects.all().delete()
        PaymentDispute.objects.all().delete()
        HostelModeration.objects.all().delete()
        SystemActivity.objects.all().delete()
        
        Statistics.objects.all().delete()
        Testimonial.objects.all().delete()
        Newsletter.objects.all().delete()
        BlogPost.objects.all().delete()
        FAQ.objects.all().delete()
        ContactInquiry.objects.all().delete()
        TeamMember.objects.all().delete()
        Page.objects.all().delete()
        
        User.objects.all().delete()

    def create_users_and_profiles(self):
        """Create users with different roles and their profiles"""
        self.stdout.write('Creating users and profiles...')
        
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
        
        # Create tech support user
        tech_user = User.objects.create_user(
            email='tech@rumi.co.ke',
            password='tech123',
            first_name='Tech',
            last_name='Support',
            role='tech_support',
            is_verified=True,
            phone_number='+254700000002'
        )
        
        # Create landlord users
        landlords = []
        for i in range(5):
            landlord_user = User.objects.create_user(
                email=f'landlord{i+1}@example.com',
                password='landlord123',
                first_name=f'Landlord',
                last_name=f'{i+1}',
                role='landlord',
                is_verified=True,
                phone_number=f'+254700000{str(i+10).zfill(3)}'
            )
            
            landlord_profile = LandlordProfile.objects.create(
                user=landlord_user,
                company_name=f'Prime Properties {i+1}',
                national_id=f'12345{str(i+1).zfill(6)}',
                business_address=f'Business Address {i+1}, Nairobi',
                bank_name='KCB Bank',
                bank_account_number=f'123456789{i}',
                bank_code='01',
                is_verified=True,
                verified_by=admin_user,
                total_hostels=random.randint(1, 3),
                total_rooms=random.randint(20, 100),
                total_earnings=Decimal(str(random.uniform(50000, 500000)))
            )
            landlords.append(landlord_profile)
        
        # Create student users
        students = []
        universities = ['University of Nairobi', 'Kenya Methodist University', 'Strathmore University', 
                       'Daystar University', 'United States International University']
        courses = ['Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Law']
        
        for i in range(20):
            student_user = User.objects.create_user(
                email=f'student{i+1}@example.com',
                password='student123',
                first_name=f'Student',
                last_name=f'{i+1}',
                role='student',
                is_verified=True,
                phone_number=f'+254700000{str(i+20).zfill(3)}'
            )
            
            student_profile = StudentProfile.objects.create(
                user=student_user,
                university=random.choice(universities),
                student_id_number=f'CS{str(i+1).zfill(8)}',
                year_of_study=random.randint(1, 4),
                course=random.choice(courses),
                bio=f'Student {i+1} studying {random.choice(courses)}',
                emergency_contact_name=f'Emergency Contact {i+1}',
                emergency_contact_phone=f'+254700000{str(i+50).zfill(3)}',
                emergency_contact_relationship='Parent'
            )
            students.append(student_profile)
        
        # Create caretaker users
        caretakers = []
        for i in range(8):
            caretaker_user = User.objects.create_user(
                email=f'caretaker{i+1}@example.com',
                password='caretaker123',
                first_name=f'Caretaker',
                last_name=f'{i+1}',
                role='caretaker',
                is_verified=True,
                phone_number=f'+254700000{str(i+70).zfill(3)}'
            )
            caretakers.append(caretaker_user)
        
        # Store created users for later use
        self.admin_user = admin_user
        self.tech_user = tech_user
        self.landlords = landlords
        self.students = students
        self.caretakers = caretakers

    def create_subscription_plans(self):
        """Create subscription plans and assign to landlords"""
        self.stdout.write('Creating subscription plans...')
        
        # Create subscription plans
        trial_plan = SubscriptionPlan.objects.create(
            name='Free Trial',
            slug='free-trial',
            plan_type='trial',
            billing_type='fixed',
            fixed_price=Decimal('0.00'),
            trial_duration_days=30,
            description='1 month free trial with full access to all features',
            features={'all_features': True, 'unlimited_access': True}
        )
        
        basic_plan = SubscriptionPlan.objects.create(
            name='Basic Plan',
            slug='basic-plan',
            plan_type='paid',
            billing_type='monthly',
            monthly_price=Decimal('5000.00'),
            description='Basic features for small property owners',
            features={'hostel_management': True, 'tenant_management': True, 'basic_analytics': True}
        )
        
        premium_plan = SubscriptionPlan.objects.create(
            name='Premium Plan',
            slug='premium-plan',
            plan_type='paid',
            billing_type='monthly',
            monthly_price=Decimal('15000.00'),
            description='Premium features with advanced analytics and support',
            features={
                'hostel_management': True, 'tenant_management': True, 'advanced_analytics': True,
                'priority_support': True, 'maintenance_tracking': True, 'incident_reporting': True
            }
        )
        
        # Assign plans to landlords
        for landlord in self.landlords:
            subscription = LandlordSubscription.objects.create(
                landlord=landlord,
                plan=basic_plan if random.random() < 0.7 else premium_plan,
                status='active',
                current_period_start=timezone.now().date(),
                current_period_end=timezone.now().date() + timedelta(days=30),
                next_billing_date=timezone.now().date() + timedelta(days=30)
            )
            
            # Create feature access
            feature_access = FeatureAccess.objects.create(landlord=landlord)
            feature_access.sync_with_subscription()

    def create_hostels_and_rooms(self):
        """Create hostels with rooms and assign caretakers"""
        self.stdout.write('Creating hostels and rooms...')
        
        hostel_names = ['University Heights', 'Campus Lodge', 'Student Paradise', 'Scholar\'s Rest', 'Academic Elite']
        cities = ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret']
        
        hostels = []
        for i, landlord in enumerate(self.landlords):
            for j in range(random.randint(1, 3)):
                hostel = Hostel.objects.create(
                    landlord=landlord,
                    name=f'{hostel_names[i % len(hostel_names)]} {j+1}',
                    description=f'Modern student accommodation with excellent facilities',
                    address=f'{random.randint(1, 999)} University Way, {random.choice(cities)}',
                    city=random.choice(cities),
                    university=f'University of {random.choice(cities)}',
                    distance_from_university=Decimal(str(random.uniform(0.5, 5.0))),
                    latitude=Decimal(str(random.uniform(-1.3, -0.8))),
                    longitude=Decimal(str(random.uniform(36.7, 37.2))),
                    gender_policy=random.choice(['male_only', 'female_only', 'mixed']),
                    hostel_type=random.choice(['single_rooms', 'shared_rooms', 'mixed']),
                    status='active',
                    total_rooms=random.randint(30, 100),
                    available_rooms=random.randint(5, 20),
                    base_price=Decimal(str(random.uniform(8000, 25000))),
                    rating=Decimal(str(random.uniform(3.5, 5.0))),
                    review_count=random.randint(10, 200),
                    is_verified=True,
                    verified_by=self.admin_user,
                    images=['https://example.com/hostel1.jpg', 'https://example.com/hostel2.jpg']
                )
                hostels.append(hostel)
        
        # Create rooms for each hostel
        room_types = ['single', 'double', 'triple', 'quad']
        room_statuses = ['available', 'occupied', 'maintenance', 'reserved']
        
        for hostel in hostels:
            for i in range(hostel.total_rooms):
                room = Room.objects.create(
                    hostel=hostel,
                    room_number=f'{random.choice(["A", "B", "C"])}{str(i+1).zfill(3)}',
                    room_type=random.choice(room_types),
                    floor=random.randint(1, 5),
                    base_price=Decimal(str(random.uniform(8000, 25000))),
                    status=random.choice(room_statuses),
                    capacity=random.randint(1, 4),
                    current_occupancy=random.randint(0, 2),
                    amenities=['wifi', 'study_desk', 'wardrobe'],
                    description=f'Comfortable {random.choice(room_types)} room with modern amenities'
                )
                
                # Create room images
                for j in range(random.randint(1, 3)):
                    RoomImage.objects.create(
                        room=room,
                        image_url=f'https://example.com/room{room.pk}_{j}.jpg',
                        caption=f'Room {room.room_number} view {j+1}',
                        is_primary=j == 0,
                        sort_order=j
                    )
        
        # Assign caretakers to hostels
        for i, hostel in enumerate(hostels):
            caretaker_profile = CaretakerProfile.objects.create(
                user=self.caretakers[i % len(self.caretakers)],
                national_id=f'98765{str(i).zfill(6)}',
                hostel=hostel,
                landlord=hostel.landlord,
                employment_start_date=timezone.now().date() - timedelta(days=random.randint(30, 365)),
                emergency_contact_name=f'Emergency Contact for Caretaker {i+1}',
                emergency_contact_phone=f'+254700000{str(i+100).zfill(3)}',
                created_by=self.admin_user
            )
        
        self.hostels = hostels

    def create_bookings_and_payments(self):
        """Create bookings and payment transactions"""
        self.stdout.write('Creating bookings and payments...')
        
        for i, student in enumerate(self.students[:15]):  # Create bookings for first 15 students
            if random.random() < 0.8:  # 80% chance of having a booking
                hostel = random.choice(self.hostels)
                available_rooms = hostel.rooms.filter(status='available')
                if available_rooms.exists():
                    room = random.choice(available_rooms)
                    
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
                        status=random.choice(['pending', 'confirmed', 'completed']),
                        emergency_contact_name=student.emergency_contact_name,
                        emergency_contact_phone=student.emergency_contact_phone,
                        emergency_contact_relationship=student.emergency_contact_relationship,
                        confirmed_at=timezone.now() - timedelta(days=random.randint(1, 30)) if random.random() < 0.9 else None
                    )
                    
                    # Update room occupancy
                    if booking.status == 'confirmed':
                        room.current_occupancy += 1
                        room.save()
                    
                    # Create transaction
                    if booking.status in ['confirmed', 'completed']:
                        transaction = Transaction.objects.create(
                            booking=booking,
                            student=student,
                            landlord=hostel.landlord,
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

    def create_notifications_and_communications(self):
        """Create notifications and chat messages"""
        self.stdout.write('Creating notifications and communications...')
        
        # Create email templates
        EmailTemplate.objects.create(
            name='Welcome Email',
            subject='Welcome to RUMI Platform',
            content='Welcome to RUMI, {{user_name}}! Your account has been created successfully.',
            variables=['user_name']
        )

        EmailTemplate.objects.create(
            name='Payment Confirmation',
            subject='Payment Confirmation - {{receipt_number}}',
            content='Dear {{student_name}}, your payment of KES {{amount}} has been confirmed.',
            variables=['student_name', 'receipt_number', 'amount']
        )
        
        # Create notifications
        for i in range(50):
            student = random.choice(self.students)
            Notification.objects.create(
                recipient=student.user,
                notification_type=random.choice(['payment_success', 'booking_confirmed', 'maintenance_scheduled']),
                channel=random.choice(['email', 'sms', 'push']),
                title=random.choice(['Payment Successful', 'Booking Confirmed', 'Maintenance Scheduled']),
                message=f'Test notification message {i+1}',
                is_read=random.choice([True, False]),
                sent_at=timezone.now() - timedelta(days=random.randint(0, 30))
            )
        
        # Create conversations and messages
        for i in range(20):
            student = random.choice(self.students)
            landlord = random.choice(self.landlords)
            
            conversation = Conversation.objects.create()
            conversation.participants.add(student.user, landlord.user)
            
            # Add messages to conversation
            for j in range(random.randint(1, 5)):
                Message.objects.create(
                    conversation=conversation,
                    sender=student.user if j % 2 == 0 else landlord.user,
                    content=f'Message {j+1} in conversation {i+1}',
                    is_read=random.choice([True, False]),
                    read_at=timezone.now() - timedelta(days=random.randint(0, 7)) if random.choice([True, False]) else None
                )

    def create_amenities_and_inventory(self):
        """Create amenities and inventory templates"""
        self.stdout.write('Creating amenities and inventory...')
        
        # Create amenities
        amenities_data = [
            ('WiFi', 'basic', 'High-speed internet access'),
            ('Study Desk', 'basic', 'Dedicated study space'),
            ('Wardrobe', 'basic', 'Personal storage space'),
            ('Security Guard', 'security', '24/7 security personnel'),
            ('CCTV', 'security', 'Surveillance cameras'),
            ('Laundry', 'facilities', 'On-site laundry service'),
            ('Mess Hall', 'facilities', 'Shared dining area'),
            ('Gym', 'facilities', 'Fitness center'),
            ('Study Room', 'services', 'Quiet study areas'),
            ('Parking', 'services', 'Vehicle parking space')
        ]
        
        amenities = []
        for name, category, description in amenities_data:
            amenity = Amenity.objects.create(
                name=name,
                category=category,
                description=description,
                icon_url=f'https://example.com/icons/{name.lower().replace(" ", "_")}.png'
            )
            amenities.append(amenity)
        
        # Link amenities to hostels
        for hostel in self.hostels:
            for amenity in random.sample(amenities, random.randint(3, 7)):
                HostelAmenity.objects.create(
                    hostel=hostel,
                    amenity=amenity,
                    is_available=True
                )
        
        # Create inventory templates
        for hostel in self.hostels:
            template = InventoryTemplate.objects.create(
                hostel=hostel,
                name=f'Standard Inventory - {hostel.name}',
                description='Standard room inventory checklist',
                items=[
                    {'name': 'Bed', 'quantity': 1, 'condition': 'good'},
                    {'name': 'Mattress', 'quantity': 1, 'condition': 'good'},
                    {'name': 'Study Desk', 'quantity': 1, 'condition': 'good'},
                    {'name': 'Chair', 'quantity': 1, 'condition': 'good'},
                    {'name': 'Wardrobe', 'quantity': 1, 'condition': 'good'}
                ],
                created_by=self.admin_user
            )
            
            # Create inventory items
            for item_data in template.items:
                InventoryItem.objects.create(
                    template=template,
                    category='furniture',
                    item_name=item_data['name'],
                    quantity=item_data['quantity'],
                    replacement_cost=Decimal(str(random.uniform(1000, 5000))),
                    display_order=len(template.inventoryitem_set.all())
                )

    def create_maintenance_and_incident_data(self):
        """Create maintenance logs and incident reports"""
        self.stdout.write('Creating maintenance and incident data...')
        
        categories = ['plumbing', 'electrical', 'hvac', 'security', 'cleaning', 'appliances']
        priorities = ['low', 'medium', 'high', 'emergency']
        statuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
        
        for i in range(30):
            hostel = random.choice(self.hostels)
            room = random.choice(hostel.rooms.all()) if hostel.rooms.exists() else None
            
            MaintenanceLog.objects.create(
                hostel=hostel,
                room=room,
                requested_by=random.choice([self.admin_user] + [c.user for c in CaretakerProfile.objects.all()]),
                title=f'Maintenance Issue {i+1}',
                description=f'Description of maintenance issue {i+1}',
                category=random.choice(categories),
                priority=random.choice(priorities),
                status=random.choice(statuses),
                scheduled_date=timezone.now() + timedelta(days=random.randint(-7, 30)),
                estimated_cost=Decimal(str(random.uniform(1000, 10000))),
                actual_cost=Decimal(str(random.uniform(800, 12000))) if random.choice([True, False]) else None,
                images=['https://example.com/maintenance1.jpg'],
                work_performed=f'Work performed for issue {i+1}',
                is_recurring=random.choice([True, False]),
                affects_students=random.choice([True, False])
            )
        
        # Create incident reports
        incident_types = ['theft', 'vandalism', 'noise_complaint', 'safety_violation', 'other']
        severities = ['low', 'medium', 'high', 'critical']
        incident_statuses = ['reported', 'investigating', 'resolved', 'escalated']
        
        for i in range(15):
            hostel = random.choice(self.hostels)
            room = random.choice(hostel.rooms.all()) if hostel.rooms.exists() else None
            
            IncidentReport.objects.create(
                hostel=hostel,
                room=room,
                reported_by=random.choice([self.admin_user] + [c.user for c in CaretakerProfile.objects.all()]),
                incident_type=random.choice(incident_types),
                severity=random.choice(severities),
                status=random.choice(incident_statuses),
                title=f'Incident Report {i+1}',
                description=f'Description of incident {i+1}',
                incident_date=timezone.now() - timedelta(days=random.randint(0, 30)),
                victims=[{'name': f'Victim {i+1}', 'type': 'student'}],
                suspects=[{'name': f'Suspect {i+1}', 'type': 'unknown'}],
                witnesses=[{'name': f'Witness {i+1}', 'contact': '+254700000000'}],
                police_reported=random.choice([True, False]),
                estimated_damage_cost=Decimal(str(random.uniform(1000, 50000))) if random.choice([True, False]) else None
            )
        
        # Create late entry logs
        for i in range(25):
            student = random.choice(self.students)
            hostel = random.choice(self.hostels)
            room = random.choice(hostel.rooms.all())
            
            LateEntryLog.objects.create(
                student=student,
                hostel=hostel,
                room=room,
                entry_time=timezone.now() - timedelta(days=random.randint(0, 30), 
                              hours=random.randint(20, 23), 
                              minutes=random.randint(0, 59)),
                expected_curfew=datetime.now().time().replace(hour=22, minute=0),
                reason=random.choice(['library_study', 'class_extended', 'medical_visit', 'family_emergency']),
                status=random.choice(['pending', 'approved', 'warning_issued']),
                is_violation=random.choice([True, False]),
                violation_count=random.randint(0, 3)
            )

    def create_analytics_data(self):
        """Create analytics events and metrics"""
        self.stdout.write('Creating analytics data...')
        
        # Create analytics events
        event_types = ['page_view', 'booking_created', 'payment_made', 'user_registered', 'search_performed']
        
        for i in range(100):
            user = random.choice([self.admin_user] + 
                               [s.user for s in self.students] + 
                               [l.user for l in self.landlords] + 
                               [c.user for c in self.caretakers])
            
            AnalyticsEvent.objects.create(
                user=user,
                event_type=random.choice(event_types),
                event_data={'page': f'/page/{i}', 'timestamp': timezone.now()},
                ip_address=f'192.168.1.{random.randint(1, 254)}',
                user_agent='Mozilla/5.0 (Test Browser)'
            )
        
        # Create role-specific analytics
        for landlord in self.landlords:
            LandlordAnalytics.objects.create(
                landlord=landlord,
                total_bookings=random.randint(10, 100),
                total_revenue=Decimal(str(random.uniform(100000, 1000000))),
                occupancy_rate=Decimal(str(random.uniform(0.6, 0.95))),
                maintenance_requests=random.randint(5, 30),
                incident_reports=random.randint(0, 10)
            )
        
        for student in self.students[:10]:
            StudentAnalytics.objects.create(
                student=student,
                total_bookings=random.randint(1, 3),
                total_spent=Decimal(str(random.uniform(50000, 300000))),
                payment_history=[{'date': timezone.now().date(), 'amount': Decimal('15000')}],
                satisfaction_score=Decimal(str(random.uniform(3.0, 5.0)))
            )
        
        for caretaker in CaretakerProfile.objects.all():
            CaretakerAnalytics.objects.create(
                caretaker=caretaker,
                students_managed=random.randint(20, 80),
                maintenance_completed=random.randint(10, 50),
                incident_response_time=random.randint(5, 120),  # minutes
                tasks_completed=random.randint(50, 200)
            )

    def create_admin_data(self):
        """Create admin-related data"""
        self.stdout.write('Creating admin data...')
        
        # Create system activities
        for i in range(20):
            SystemActivity.objects.create(
                admin=self.admin_user,
                action=random.choice(['user_created', 'hostel_approved', 'payment_processed', 'report_generated']),
                description=f'System activity {i+1}',
                ip_address=f'192.168.1.{random.randint(1, 254)}',
                metadata={'action_type': 'admin_action', 'timestamp': timezone.now()}
            )
        
        # Create hostel moderation records
        for hostel in self.hostels[:5]:
            HostelModeration.objects.create(
                hostel=hostel,
                moderated_by=self.admin_user,
                status=random.choice(['approved', 'pending', 'rejected']),
                notes=f'Moderation notes for {hostel.name}',
                moderation_date=timezone.now() - timedelta(days=random.randint(1, 30))
            )
        
        # Create payment disputes
        for i in range(10):
            student = random.choice(self.students)
            Transaction.objects.create(
                booking=Booking.objects.first() if Booking.objects.exists() else None,
                student=student,
                landlord=random.choice(self.landlords),
                transaction_reference=f'DISPUTE-{uuid.uuid4().hex[:8].upper()}',
                transaction_type='initial',
                payment_plan='monthly',
                base_rent=Decimal('15000'),
                student_service_fee=Decimal('300'),
                total_charged_amount=Decimal('15300'),
                landlord_payout_amount=Decimal('15000'),
                gross_platform_revenue=Decimal('300'),
                status='refunded'
            )

    def create_homepage_content(self):
        """Create homepage content and static pages"""
        self.stdout.write('Creating homepage content...')
        
        # Create pages
        Page.objects.create(
            title='About Us',
            slug='about',
            content='RUMI is a modern student accommodation platform...',
            meta_description='Learn about RUMI platform'
        )
        
        Page.objects.create(
            title='Contact',
            slug='contact',
            content='Contact us at info@rumi.co.ke',
            meta_description='Get in touch with RUMI'
        )
        
        # Create team members
        for i in range(5):
            TeamMember.objects.create(
                name=f'Team Member {i+1}',
                position=random.choice(['CEO', 'CTO', 'Marketing Manager', 'Operations Manager', 'Customer Success']),
                bio=f'Experienced professional {i+1}',
                photo_url=f'https://example.com/team{i+1}.jpg',
                linkedin_url=f'https://linkedin.com/in/teammember{i+1}'
            )
        
        # Create FAQs
        for i in range(10):
            FAQ.objects.create(
                question=f'Frequently Asked Question {i+1}?',
                answer=f'This is the answer to frequently asked question {i+1}.',
                order=i+1,
                is_active=True
            )
        
        # Create blog posts
        for i in range(8):
            BlogPost.objects.create(
                title=f'Blog Post {i+1}',
                slug=f'blog-post-{i+1}',
                content=f'This is the content of blog post {i+1}.',
                excerpt=f'Excerpt of blog post {i+1}',
                author=self.admin_user,
                featured_image=f'https://example.com/blog{i+1}.jpg',
                is_published=True,
                published_at=timezone.now() - timedelta(days=random.randint(1, 90))
            )
        
        # Create testimonials
        for i in range(6):
            Testimonial.objects.create(
                name=f'Testimonial {i+1}',
                content=f'This is a testimonial from satisfied user {i+1}.',
                rating=random.randint(4, 5),
                photo_url=f'https://example.com/testimonial{i+1}.jpg',
                is_featured=random.choice([True, False])
            )
        
        # Create statistics
        Statistics.objects.create(
            total_students=2500,
            total_hostels=150,
            total_rooms=5000,
            average_rating=Decimal('4.5'),
            cities_covered=5
        )
        
        # Create contact inquiries
        for i in range(15):
            ContactInquiry.objects.create(
                name=f'Contact Person {i+1}',
                email=f'contact{i+1}@example.com',
                phone=f'+254700000{str(i+100).zfill(3)}',
                subject=f'Inquiry {i+1}',
                message=f'This is inquiry message {i+1}',
                status=random.choice(['new', 'in_progress', 'resolved']),
                assigned_to=self.admin_user if random.random() < 0.7 else None
            )
        
        # Create newsletter subscribers
        for i in range(50):
            Newsletter.objects.create(
                email=f'subscriber{i+1}@example.com',
                is_active=random.choice([True, False]),
                subscribed_at=timezone.now() - timedelta(days=random.randint(1, 365))
            )