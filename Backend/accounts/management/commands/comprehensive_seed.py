"""
Comprehensive database seeding command for RUMI platform
Populates all tables with realistic test data for UI testing

NOTE: this command originally also seeded the legacy hostel-booking domain
(hostels, payments, analytics, admin_api). Those apps were removed from
INSTALLED_APPS (see "Remove legacy hostel-booking platform" and
"remove stale accounts.subscription_* scaffold" commits) and their
directories no longer exist, so all of that seeding logic has been removed
here too — importing those modules unconditionally made this command
ImportError on load, before `handle()` ever ran. It now only seeds the
users/profiles, notifications, and homepage-content data that still map to
live apps.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from datetime import timedelta
import random

# Import all models
from accounts.models import (
    User, StudentProfile, LandlordProfile, CaretakerProfile,
    OTPVerification, PasswordResetToken, UserActivityLog,
    Conversation, Message
)

from notifications.models import Notification, EmailTemplate, SMSTemplate, NotificationPreference

from home.models import Page, TeamMember, ContactInquiry, FAQ, BlogPost, Newsletter, Testimonial, Statistics

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with comprehensive test data for UI testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting comprehensive database seeding...'))

        with transaction.atomic():
            self.clear_existing_data()
            self.create_users_and_profiles()
            self.create_notifications_and_communications()
            self.create_homepage_content()

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
        self.stdout.write(self.style.WARNING(
            'Hostel/booking/payments/analytics/admin_api seeding was removed along with '
            'those legacy apps — this command now only seeds users, profiles, '
            'notifications, and homepage content.'
        ))

    def clear_existing_data(self):
        """Clear existing data to start fresh"""
        self.stdout.write('Clearing existing data...')

        # Clear in reverse dependency order
        Message.objects.all().delete()
        Conversation.objects.all().delete()
        UserActivityLog.objects.all().delete()
        PasswordResetToken.objects.all().delete()
        OTPVerification.objects.all().delete()
        CaretakerProfile.objects.all().delete()
        LandlordProfile.objects.all().delete()
        StudentProfile.objects.all().delete()

        NotificationPreference.objects.all().delete()
        SMSTemplate.objects.all().delete()
        EmailTemplate.objects.all().delete()
        Notification.objects.all().delete()

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
            content='Contact us at info@rumiarent.com',
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
