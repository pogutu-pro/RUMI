"""
Management command to seed test users for all roles
Usage: python manage.py seed_test_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import StudentProfile, LandlordProfile, CaretakerProfile
from hostels.models import Hostel
from decimal import Decimal
from datetime import date, timedelta
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed test users for all roles in RUMI platform'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding test users for role-based testing...'))
        
        # Create test users for each role
        users_created = self.create_users()
        
        # Create supporting data (hostels, etc.)
        self.create_supporting_data()
        
        # Create profiles for users
        profiles_created = self.create_profiles()
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Seeding complete!'
            )
        )
        self.stdout.write(self.style.SUCCESS('\n=== Test User Credentials ==='))
        self.display_user_credentials()

    def create_users(self):
        """Create base users for each role"""
        users_data = [
            {
                'email': 'student@test.com',
                'first_name': 'Test',
                'last_name': 'Student',
                'role': 'student',
                'password': 'testpass123',
                'phone_number': '+254712345678',
                'is_verified': True,
            },
            {
                'email': 'landlord@test.com',
                'first_name': 'Test',
                'last_name': 'Landlord',
                'role': 'landlord',
                'password': 'testpass123',
                'phone_number': '+254723456789',
                'is_verified': True,
            },
            {
                'email': 'caretaker@test.com',
                'first_name': 'Test',
                'last_name': 'Caretaker',
                'role': 'caretaker',
                'password': 'testpass123',
                'phone_number': '+254734567890',
                'is_verified': True,
            },
            {
                'email': 'techsupport@test.com',
                'first_name': 'Tech',
                'last_name': 'Support',
                'role': 'tech_support',
                'password': 'testpass123',
                'phone_number': '+254745678901',
                'is_verified': True,
                'is_staff': True,
            },
            {
                'email': 'superadmin@test.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': 'super_admin',
                'password': 'testpass123',
                'phone_number': '+254756789012',
                'is_verified': True,
                'is_staff': True,
                'is_superuser': True,
            },
        ]
        
        created_count = 0
        self.test_users = {}
        
        for user_data in users_data:
            password = user_data.pop('password')
            
            user, created = User.objects.update_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            
            if created:
                user.set_password(password)
                user.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {user.get_full_name()} ({user.role})')
                )
            else:
                # Update password for existing users
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated: {user.get_full_name()} ({user.role})')
                )
            
            self.test_users[user.role] = user
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Users processed: {created_count} created/updated')
        )
        return created_count

    def create_supporting_data(self):
        """Create supporting data like hostels for caretaker profiles"""
        
        # Create a test hostel for caretaker assignment
        landlord_user = self.test_users.get('landlord')
        if landlord_user:
            landlord_profile = landlord_user.landlord_profile
            
            hostel, created = Hostel.objects.get_or_create(
                name='Test Hostel for Caretaker',
                defaults={
                    'landlord': landlord_profile,
                    'description': 'A test hostel created for caretaker testing',
                    'address': '123 Test Street, Test City',
                    'hostel_type': 'single_rooms',
                    'total_rooms': 50,
                    'available_rooms': 25,
                    'base_price': Decimal('5000.00'),
                    'is_verified': True,
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created test hostel: {hostel.name}')
                )
                self.test_hostel = hostel
            else:
                self.stdout.write(
                    self.style.WARNING(f'↻ Using existing hostel: {hostel.name}')
                )
                self.test_hostel = hostel

    def create_profiles(self):
        """Create profile data for users"""
        profiles_created = 0
        
        # Student Profile
        student_user = self.test_users.get('student')
        if student_user:
            profile, created = StudentProfile.objects.get_or_create(
                user=student_user,
                defaults={
                    'university': 'Test University',
                    'student_id_number': 'TEST123456',
                    'year_of_study': 2,
                    'course': 'Computer Science',
                    'bio': 'Test student for platform testing',
                    'emergency_contact_name': 'Test Parent',
                    'emergency_contact_phone': '+254767890123',
                    'emergency_contact_relationship': 'Parent',
                    'is_profile_complete': True,
                }
            )
            if created:
                profiles_created += 1
                self.stdout.write(self.style.SUCCESS('✓ Created Student Profile'))
        
        # Landlord Profile
        landlord_user = self.test_users.get('landlord')
        if landlord_user:
            profile, created = LandlordProfile.objects.get_or_create(
                user=landlord_user,
                defaults={
                    'company_name': 'Test Properties Ltd',
                    'national_id': 'TEST12345678',
                    'business_address': '456 Test Business Ave, Test City',
                    'bank_name': 'Test Bank',
                    'bank_account_number': '1234567890',
                    'bank_code': '001',
                    'is_verified': True,
                    'verification_documents': {'id_front': 'test_id_front.pdf', 'id_back': 'test_id_back.pdf'},
                    'total_hostels': 1,
                    'total_rooms': 50,
                }
            )
            if created:
                profiles_created += 1
                self.stdout.write(self.style.SUCCESS('✓ Created Landlord Profile'))
        
        # Caretaker Profile
        caretaker_user = self.test_users.get('caretaker')
        if caretaker_user and hasattr(self, 'test_hostel'):
            landlord_profile = self.test_users['landlord'].landlord_profile
            profile, created = CaretakerProfile.objects.get_or_create(
                user=caretaker_user,
                defaults={
                    'national_id': 'CARETAKER123',
                    'hostel': self.test_hostel,
                    'landlord': landlord_profile,
                    'employment_start_date': date.today() - timedelta(days=30),
                    'permissions': {'check_in': True, 'inventory': True, 'maintenance': False},
                    'emergency_contact_name': 'Test Emergency Contact',
                    'emergency_contact_phone': '+254778901234',
                    'created_by': landlord_user,
                }
            )
            if created:
                profiles_created += 1
                self.stdout.write(self.style.SUCCESS('✓ Created Caretaker Profile'))
        
        return profiles_created

    def display_user_credentials(self):
        """Display all test user credentials"""
        credentials = [
            ('Student', 'student@test.com', 'testpass123'),
            ('Landlord', 'landlord@test.com', 'testpass123'),
            ('Caretaker', 'caretaker@test.com', 'testpass123'),
            ('Tech Support Admin', 'techsupport@test.com', 'testpass123'),
            ('Super Admin', 'superadmin@test.com', 'testpass123'),
        ]
        
        for role, email, password in credentials:
            self.stdout.write(
                f'\n{role}:\n'
                f'  📧 Email: {email}\n'
                f'  🔑 Password: {password}'
            )
        
        self.stdout.write(
            self.style.SUCCESS('\n🚀 You can now log into different dashboards!')
        )
        self.stdout.write(
            self.style.SUCCESS('\nDashboard URLs to test:')
        )
        self.stdout.write('  🏠 Student: /dashboard')
        self.stdout.write('  🏢 Landlord: /dashboard') 
        self.stdout.write('  👷 Caretaker: /caretaker/dashboard')
        self.stdout.write('  🔧 Tech Support: /admin/dashboard')
        self.stdout.write('  👑 Super Admin: /admin/dashboard')