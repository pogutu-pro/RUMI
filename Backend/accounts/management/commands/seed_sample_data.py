"""
Management command to seed comprehensive sample data for testing
Usage: python manage.py seed_sample_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import StudentProfile, LandlordProfile, OTPVerification, PasswordResetToken, UserActivityLog
from hostels.models import Hostel, Room, Amenity, HostelAmenity, Booking
from home.models import FAQ, TeamMember, Statistics, BlogPost, Testimonial, Page, ContactInquiry, Newsletter
from payments.models import Transaction
from notifications.models import Notification, NotificationPreference, EmailTemplate, SMSTemplate
from decimal import Decimal
import random
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed comprehensive sample data for testing RUMI platform'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding comprehensive sample data...'))

        # Create sample data in order
        self.create_amenities()
        self.create_hostels_and_rooms()
        self.create_faqs()
        self.create_team_members()
        self.create_statistics()
        self.create_additional_sample_data()

        self.stdout.write(self.style.SUCCESS('✓ Sample data seeding complete!'))

    def create_amenities(self):
        """Create hostel amenities"""
        amenities_data = [
            ('WiFi', 'basic', 'High-speed internet access'),
            ('Laundry', 'facilities', 'Laundry facilities available'),
            ('Security', 'security', '24/7 security services'),
            ('Mess Hall', 'facilities', 'Dining area with meals'),
            ('Study Room', 'facilities', 'Quiet study spaces'),
            ('Gym', 'facilities', 'Fitness center access'),
            ('Parking', 'facilities', 'Vehicle parking space'),
            ('Backup Power', 'basic', 'Generator power backup'),
            ('Water Backup', 'basic', 'Water storage and backup'),
        ]

        for name, category, description in amenities_data:
            Amenity.objects.get_or_create(
                name=name,
                defaults={
                    'category': category,
                    'description': description,
                    'is_active': True
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ Created hostel amenities'))

    def create_hostels_and_rooms(self):
        """Create sample hostels and rooms"""
        try:
            landlord = LandlordProfile.objects.get(user__email='landlord@test.com')
        except LandlordProfile.DoesNotExist:
            self.stdout.write(self.style.WARNING('Landlord not found, skipping hostel creation'))
            return

        hostels_data = [
            {
                'name': 'University Heights',
                'description': 'Modern hostel with excellent views and premium amenities located just 5 minutes from the main campus.',
                'address': '123 University Road, Nairobi',
                'latitude': -1.2921,
                'longitude': 36.8219,
                'hostel_type': 'mixed',
                'base_price': Decimal('15000.00'),
                'total_rooms': 50,
                'available_rooms': 12,
                'amenities': ['WiFi', 'Laundry', 'Security', 'Mess Hall', 'Study Room']
            },
            {
                'name': 'Green Valley Residence',
                'description': 'Eco-friendly hostel with sustainable practices and beautiful gardens.',
                'address': '456 Green Valley Ave, Nairobi',
                'latitude': -1.2800,
                'longitude': 36.8400,
                'hostel_type': 'female',
                'base_price': Decimal('12000.00'),
                'total_rooms': 30,
                'available_rooms': 8,
                'amenities': ['WiFi', 'Parking', 'Gym', 'Cafeteria', 'Water Backup']
            },
            {
                'name': 'Sunrise Hostel',
                'description': 'Budget-friendly accommodation with basic amenities and great community spirit.',
                'address': '789 Sunrise Street, Nairobi',
                'latitude': -1.3200,
                'longitude': 36.8100,
                'hostel_type': 'mixed',
                'base_price': Decimal('8000.00'),
                'total_rooms': 40,
                'available_rooms': 15,
                'amenities': ['WiFi', 'Security', 'Backup Power']
            }
        ]

        for hostel_data in hostels_data:
            amenities = hostel_data.pop('amenities')
            total_rooms = hostel_data.pop('total_rooms')
            available_rooms = hostel_data.pop('available_rooms')

            hostel, created = Hostel.objects.get_or_create(
                name=hostel_data['name'],
                defaults={
                    **hostel_data,
                    'landlord': landlord,
                    'is_verified': True,
                    'total_rooms': total_rooms,
                    'available_rooms': available_rooms,
                    'currency': 'KES'
                }
            )

            if created:
                # Create hostel amenities
                for amenity_name in amenities:
                    try:
                        amenity = Amenity.objects.get(name=amenity_name)
                        HostelAmenity.objects.get_or_create(
                            hostel=hostel,
                            amenity=amenity,
                            defaults={'is_available': True}
                        )
                    except Amenity.DoesNotExist:
                        pass

                # Create rooms
                self.create_rooms_for_hostel(hostel, total_rooms, available_rooms)

                self.stdout.write(self.style.SUCCESS(f'✓ Created hostel: {hostel.name}'))

    def create_rooms_for_hostel(self, hostel, total_rooms, available_rooms):
        """Create rooms for a hostel"""
        room_types = ['single', 'double', 'triple']
        floors = list(range(1, 6))  # 5 floors

        for i in range(1, total_rooms + 1):
            room_type = random.choice(room_types)
            capacity = {'single': 1, 'double': 2, 'triple': 3}[room_type]
            base_price = hostel.base_price * {'single': Decimal('1.0'), 'double': Decimal('0.8'), 'triple': Decimal('0.6')}[room_type]

            Room.objects.get_or_create(
                hostel=hostel,
                room_number=f'{random.randint(100, 500)}{i:02d}',
                defaults={
                    'room_type': room_type,
                    'floor': random.choice(floors),
                    'base_price': base_price,
                    'capacity': capacity,
                    'current_occupancy': 0 if i <= available_rooms else capacity,
                    'status': 'available' if i <= available_rooms else 'occupied',
                    'is_active': True
                }
            )

    def create_additional_sample_data(self):
        """Create additional sample data for comprehensive testing"""
        try:
            self.create_otp_tokens()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping OTP tokens: {e}'))

        try:
            self.create_password_reset_tokens()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping password reset tokens: {e}'))

        try:
            self.create_user_activity_logs()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping activity logs: {e}'))

        try:
            self.create_email_templates()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping email templates: {e}'))

        try:
            self.create_sms_templates()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping SMS templates: {e}'))

        try:
            self.create_sample_pages()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping pages: {e}'))

        try:
            self.create_contact_inquiries()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping contact inquiries: {e}'))

        try:
            self.create_newsletter_subscriptions()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Skipping newsletter subscriptions: {e}'))

        # Comment out problematic seeding for now
        # self.create_bookings()
        # self.create_transactions()
        # self.create_notifications()
        # self.create_notification_preferences()
        # self.create_blog_posts()
        # self.create_testimonials()

        self.stdout.write(self.style.SUCCESS('✓ Created additional sample data (basic)'))

    def create_faqs(self):
        """Create sample FAQs"""
        faqs_data = [
            {
                'category': 'getting_started',
                'question': 'How do I create an account?',
                'answer': 'Click on the "Sign Up" button and fill in your details. You\'ll receive an email verification link to activate your account.',
                'is_published': True
            },
            {
                'category': 'students',
                'question': 'How do I find and book a room?',
                'answer': 'Browse available hostels, view room details, and click "Book Now". Complete the payment process to secure your booking.',
                'is_published': True
            },
            {
                'category': 'landlords',
                'question': 'How do I list my hostel?',
                'answer': 'Create a landlord account, verify your identity, and add your hostel details through the dashboard. Rooms will be visible to students immediately.',
                'is_published': True
            },
            {
                'category': 'payments',
                'question': 'What payment methods are accepted?',
                'answer': 'We accept M-Pesa, card payments, and bank transfers. All payments are processed securely through Paystack.',
                'is_published': True
            }
        ]

        for faq_data in faqs_data:
            FAQ.objects.get_or_create(
                question=faq_data['question'],
                defaults=faq_data
            )

        self.stdout.write(self.style.SUCCESS('✓ Created sample FAQs'))

    def create_team_members(self):
        """Create team member profiles"""
        team_data = [
            {
                'full_name': 'Joseph Ogutu',
                'position': 'Chief Technology Officer',
                'bio': '10+ years experience in software architecture and development. Passionate about solving real-world problems through technology.',
                'email': 'joseph@rumi.co.ke',
                'linkedin_url': 'https://linkedin.com/in/josephogutu',
                'display_order': 1,
                'is_active': True
            },
            {
                'full_name': 'Sarah Wanjiku',
                'position': 'Head of Operations',
                'bio': 'Experienced in property management and student services. Committed to providing excellent accommodation experiences.',
                'email': 'sarah@rumi.co.ke',
                'display_order': 2,
                'is_active': True
            }
        ]

        for member_data in team_data:
            TeamMember.objects.get_or_create(
                full_name=member_data['full_name'],
                defaults=member_data
            )

        self.stdout.write(self.style.SUCCESS('✓ Created team members'))

    def create_otp_tokens(self):
        """Create sample OTP verification tokens"""
        try:
            student = User.objects.get(email='student@test.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Student not found, skipping OTP creation'))
            return

        OTPVerification.objects.get_or_create(
            user=student,
            defaults={
                'otp_code': '123456',
                'verification_type': 'email',
                'expires_at': timezone.now() + timezone.timedelta(minutes=10),
                'is_used': False,
                'attempts': 0
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created OTP tokens'))

    def create_password_reset_tokens(self):
        """Create sample password reset tokens"""
        try:
            student = User.objects.get(email='student@test.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Student not found, skipping password reset token creation'))
            return

        PasswordResetToken.objects.get_or_create(
            user=student,
            defaults={
                'token': str(uuid.uuid4()),
                'expires_at': timezone.now() + timezone.timedelta(hours=24),
                'is_used': False
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created password reset tokens'))

    def create_user_activity_logs(self):
        """Create sample user activity logs"""
        try:
            student = User.objects.get(email='student@test.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Student not found, skipping activity log creation'))
            return

        activities = [
            ('login', 'User logged in successfully'),
            ('profile_update', 'Profile information updated'),
            ('password_change', 'Password changed successfully'),
        ]

        for activity_type, description in activities:
            UserActivityLog.objects.create(
                user=student,
                action_type=activity_type,
                action_description=description,
                ip_address='127.0.0.1',
                user_agent='Test Browser',
                metadata={'test': True}
            )
        self.stdout.write(self.style.SUCCESS('✓ Created user activity logs'))

    def create_bookings(self):
        """Create sample room bookings"""
        try:
            student = StudentProfile.objects.get(user__email='student@test.com')
            room = Room.objects.filter(status='available').first()
        except (StudentProfile.DoesNotExist, Room.DoesNotExist):
            self.stdout.write(self.style.WARNING('Student or room not found, skipping booking creation'))
            return

        if room:
            Booking.objects.get_or_create(
                student=student,
                room=room,
                defaults={
                    'check_in_date': timezone.now().date() + timezone.timedelta(days=7),
                    'check_out_date': timezone.now().date() + timezone.timedelta(days=370),
                    'total_amount': room.base_price * 12,  # 12 months
                    'status': 'confirmed',
                    'payment_status': 'paid',
                    'special_requests': 'Near window preferred'
                }
            )
            self.stdout.write(self.style.SUCCESS('✓ Created room bookings'))

    def create_transactions(self):
        """Create sample payment transactions"""
        try:
            student = StudentProfile.objects.get(user__email='student@test.com')
            booking = Booking.objects.filter(student=student).first()
        except (StudentProfile.DoesNotExist, Booking.DoesNotExist):
            self.stdout.write(self.style.WARNING('Student or booking not found, skipping transaction creation'))
            return

        if booking:
            Transaction.objects.get_or_create(
                reference=f"TXN-{uuid.uuid4().hex[:8].upper()}",
                defaults={
                    'student': student,
                    'booking': booking,
                    'amount': booking.total_amount,
                    'status': 'success',
                    'payment_method': 'mpesa',
                    'transaction_type': 'booking_payment',
                    'description': f'Room booking payment for {booking.room.room_number}',
                    'metadata': {'test_transaction': True}
                }
            )
            self.stdout.write(self.style.SUCCESS('✓ Created payment transactions'))

    def create_notifications(self):
        """Create sample notifications"""
        try:
            student = User.objects.get(email='student@test.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Student not found, skipping notification creation'))
            return

        notifications = [
            ('welcome', 'Welcome to RUMI Platform!', 'Thank you for joining our platform.'),
            ('booking_confirmed', 'Booking Confirmed', 'Your room booking has been confirmed.'),
            ('payment_received', 'Payment Received', 'We have received your payment successfully.'),
        ]

        for notification_type, title, message in notifications:
            Notification.objects.get_or_create(
                recipient=student,
                notification_type=notification_type,
                defaults={
                    'title': title,
                    'message': message,
                    'is_read': False,
                    'metadata': {'test': True}
                }
            )
        self.stdout.write(self.style.SUCCESS('✓ Created notifications'))

    def create_notification_preferences(self):
        """Create sample notification preferences"""
        try:
            student = User.objects.get(email='student@test.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Student not found, skipping notification preferences creation'))
            return

        NotificationPreference.objects.get_or_create(
            user=student,
            defaults={
                'email_notifications': True,
                'sms_notifications': False,
                'push_notifications': True,
                'booking_updates': True,
                'payment_reminders': True,
                'maintenance_alerts': True,
                'marketing_emails': False
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created notification preferences'))

    def create_blog_posts(self):
        """Create sample blog posts"""
        blog_posts = [
            {
                'title': 'Top 5 Tips for Student Life',
                'slug': 'top-5-tips-student-life',
                'content': 'Here are some essential tips for making the most of your student life...',
                'excerpt': 'Essential tips for student success',
                'author': 'RUMI Team',
                'is_published': True,
                'featured_image': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
                'tags': ['student-life', 'tips', 'advice'],
                'seo_title': 'Top 5 Tips for Student Life | RUMI Platform',
                'seo_description': 'Discover essential tips for student success and make the most of your university experience.'
            },
            {
                'title': 'How to Choose the Right Hostel',
                'slug': 'how-to-choose-right-hostel',
                'content': 'Choosing the right accommodation is crucial for your academic success...',
                'excerpt': 'Guide to selecting the perfect hostel',
                'author': 'RUMI Team',
                'is_published': True,
                'featured_image': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
                'tags': ['hostels', 'accommodation', 'guide'],
                'seo_title': 'How to Choose the Right Hostel | RUMI Platform',
                'seo_description': 'Learn how to select the perfect hostel for your student accommodation needs.'
            }
        ]

        for post_data in blog_posts:
            BlogPost.objects.get_or_create(
                slug=post_data['slug'],
                defaults=post_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created blog posts'))

    def create_testimonials(self):
        """Create sample testimonials"""
        testimonials = [
            {
                'name': 'John Mwangi',
                'university': 'University of Nairobi',
                'course': 'Computer Science',
                'content': 'RUMI Platform made finding accommodation so easy! The verification process gave me peace of mind.',
                'rating': 5,
                'is_featured': True,
                'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            },
            {
                'name': 'Grace Wanjiku',
                'university': 'Kenyatta University',
                'course': 'Business Administration',
                'content': 'Excellent platform with great support. The hostel I found through RUMI exceeded my expectations.',
                'rating': 5,
                'is_featured': True,
                'image_url': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
            }
        ]

        for testimonial_data in testimonials:
            Testimonial.objects.get_or_create(
                name=testimonial_data['name'],
                defaults=testimonial_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created testimonials'))

    def create_email_templates(self):
        """Create sample email templates"""
        email_templates = [
            {
                'name': 'welcome_email',
                'subject': 'Welcome to RUMI Platform - Your Account is Ready!',
                'html_content': '''
                <h1>Welcome to RUMI Platform!</h1>
                <p>Dear {{full_name}},</p>
                <p>Your account has been successfully created. You can now:</p>
                <ul>
                    <li>Browse available hostels</li>
                    <li>Book accommodation</li>
                    <li>Access your dashboard</li>
                </ul>
                <p>Best regards,<br>The RUMI Team</p>
                ''',
                'variables': {'full_name': 'User full name'}
            },
            {
                'name': 'password_reset',
                'subject': 'Reset Your RUMI Platform Password',
                'html_content': '''
                <h1>Password Reset Request</h1>
                <p>Dear User,</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <p><a href="{{reset_link}}">Reset Password</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't request this, please ignore this email.</p>
                ''',
                'variables': {'reset_link': 'Password reset URL'}
            }
        ]

        for template_data in email_templates:
            EmailTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created email templates'))

    def create_sms_templates(self):
        """Create sample SMS templates"""
        sms_templates = [
            {
                'name': 'booking_confirmation',
                'message': 'Hi {{first_name}}, your booking for {{hostel_name}} is confirmed. Check-in: {{check_in_date}}. Welcome to RUMI!',
                'variables': {'first_name': 'User first name', 'hostel_name': 'Hostel name', 'check_in_date': 'Check-in date'}
            },
            {
                'name': 'payment_reminder',
                'message': 'Hi {{first_name}}, your rent payment of KES {{amount}} is due on {{due_date}}. Pay now to avoid late fees.',
                'variables': {'first_name': 'User first name', 'amount': 'Payment amount', 'due_date': 'Due date'}
            }
        ]

        for template_data in sms_templates:
            SMSTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created SMS templates'))

    def create_sample_pages(self):
        """Create sample CMS pages"""
        pages = [
            {
                'title': 'About Us',
                'slug': 'about',
                'meta_title': 'About RUMI Platform - Connecting Students with Quality Housing',
                'meta_description': 'Learn about RUMI Platform, our mission to provide safe, affordable accommodation for university students across Kenya.',
                'content': '''
                <h1>About RUMI Platform</h1>
                <p>RUMI Platform is Kenya's leading student accommodation platform, connecting students with verified hostels and landlords.</p>
                <p>Our mission is to make finding quality housing simple, safe, and affordable for all university students.</p>
                ''',
                'is_published': True,
                'template_name': 'about'
            },
            {
                'title': 'Contact Us',
                'slug': 'contact',
                'meta_title': 'Contact RumiaRent - Get in Touch',
                'meta_description': 'Have questions? Contact our support team. We\'re here to help with your accommodation needs.',
                'content': '''
                <h1>Contact Us</h1>
                <p>Get in touch with our team for support, partnerships, or general inquiries.</p>
                <p>Email: info@rumiarent.co.ke</p>
                <p>Phone: +254 712 345 678</p>
                ''',
                'is_published': True,
                'template_name': 'contact'
            }
        ]

        for page_data in pages:
            Page.objects.get_or_create(
                slug=page_data['slug'],
                defaults=page_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created sample pages'))

    def create_contact_inquiries(self):
        """Create sample contact inquiries"""
        inquiries = [
            {
                'full_name': 'John Student',
                'email': 'john.student@email.com',
                'subject': 'Question about hostel booking',
                'message': 'Hi, I would like to know more about the booking process and payment options.',
                'inquiry_type': 'student_support',
                'status': 'pending'
            },
            {
                'full_name': 'Mary Landlord',
                'email': 'mary.landlord@email.com',
                'subject': 'Partnership inquiry',
                'message': 'I own several hostels and would like to partner with your platform.',
                'inquiry_type': 'partnership',
                'status': 'in_progress'
            }
        ]

        for inquiry_data in inquiries:
            ContactInquiry.objects.get_or_create(
                email=inquiry_data['email'],
                subject=inquiry_data['subject'],
                defaults=inquiry_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created contact inquiries'))

    def create_newsletter_subscriptions(self):
        """Create sample newsletter subscriptions"""
        subscriptions = [
            {
                'email': 'student1@university.edu',
                'full_name': 'Alice Johnson',
                'subscription_type': 'students',
                'is_verified': True
            },
            {
                'email': 'landlord1@email.com',
                'full_name': 'Bob Smith',
                'subscription_type': 'landlords',
                'is_verified': True
            },
            {
                'email': 'general.user@email.com',
                'full_name': 'Carol Davis',
                'subscription_type': 'general',
                'is_verified': False
            }
        ]

        for sub_data in subscriptions:
            Newsletter.objects.get_or_create(
                email=sub_data['email'],
                defaults=sub_data
            )
        self.stdout.write(self.style.SUCCESS('✓ Created newsletter subscriptions'))

    def create_statistics(self):
        """Create platform statistics"""
        stats_data = [
            ('total_students', 2000, 'Active Students'),
            ('total_hostels', 150, 'Listed Hostels'),
            ('total_rooms', 3000, 'Available Rooms'),
            ('total_bookings', 1500, 'Successful Bookings'),
            ('marketplace_items', 500, 'Marketplace Items'),
        ]

        for stat_key, stat_value, stat_label in stats_data:
            Statistics.objects.get_or_create(
                stat_key=stat_key,
                defaults={
                    'stat_value': stat_value,
                    'stat_label': stat_label,
                    'display_order': len(Statistics.objects.filter(stat_key__startswith=stat_key.split('_')[0])) + 1,
                    'is_active': True
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ Created platform statistics'))