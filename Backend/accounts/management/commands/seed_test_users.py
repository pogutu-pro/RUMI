"""
Production-grade test user seeding command for RUMI platform.

Usage:
    python manage.py seed_test_users                    # Create test users (staging)
    python manage.py seed_test_users --dry-run          # Preview without DB changes
    python manage.py seed_test_users --remove           # Remove seeded test data
    python manage.py seed_test_users --env=production --force-production  # Production (requires explicit flag)

All seeded records are tagged with metadata:
    {"test_seeded_by": "rumia_ide", "seed_date": "YYYY-MM-DD"}
"""
import json
import os
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import StudentProfile, LandlordProfile, CaretakerProfile
from hostels.models import Hostel, Room, Booking
from hostels.bed_models import Bed, BedOccupancy
from payments.models import MpesaPaymentConfig

User = get_user_model()

# Metadata marker for all seeded objects
SEED_METADATA = {
    "test_seeded_by": "rumia_ide",
    "seed_date": date.today().isoformat()
}

# Test password for all users
TEST_PASSWORD = "Test@Rumia2026"

# Test user definitions
TEST_USERS = [
    {
        "email": "amani.ochieng@test.rumia.co.ke",
        "first_name": "Amani",
        "last_name": "Ochieng",
        "role": "student",
        "phone_number": "+254712345001",
        "is_verified": True,
        "gender": "male",
        "onboarding_stage": "COMPLETED",
    },
    {
        "email": "james.mwangi@test.rumia.co.ke",
        "first_name": "James",
        "last_name": "Mwangi",
        "role": "landlord",
        "phone_number": "+254712345002",
        "is_verified": True,
        "gender": "male",
        "onboarding_stage": "COMPLETED",
    },
    {
        "email": "grace.wanjiku@test.rumia.co.ke",
        "first_name": "Grace",
        "last_name": "Wanjiku",
        "role": "caretaker",
        "phone_number": "+254712345003",
        "is_verified": True,
        "gender": "female",
        "onboarding_stage": "COMPLETED",
    },
    {
        "email": "kevin.njoroge@test.rumia.co.ke",
        "first_name": "Kevin",
        "last_name": "Njoroge",
        "role": "tech_support",
        "phone_number": "+254712345004",
        "is_verified": True,
        "is_staff": True,
        "gender": "male",
        "onboarding_stage": "COMPLETED",
        "capabilities": ["monitoring:view", "impersonation:user"],
    },
    {
        "email": "admin.rumia@test.rumia.co.ke",
        "first_name": "Admin",
        "last_name": "Rumia",
        "role": "super_admin",
        "phone_number": "+254712345005",
        "is_verified": True,
        "is_staff": True,
        "is_superuser": True,
        "gender": "male",
        "onboarding_stage": "COMPLETED",
        "capabilities": ["all:admin"],
    },
]


class Command(BaseCommand):
    help = "Seed realistic test users for all roles with supporting data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be created without making DB changes",
        )
        parser.add_argument(
            "--env",
            type=str,
            default="staging",
            choices=["staging", "production"],
            help="Target environment (default: staging)",
        )
        parser.add_argument(
            "--force-production",
            action="store_true",
            help="Required flag to seed production DB",
        )
        parser.add_argument(
            "--remove",
            action="store_true",
            help="Remove all records with test_seeded_by=rumia_ide metadata",
        )

    def handle(self, *args, **options):
        self.dry_run = options["dry_run"]
        self.env = options["env"]
        self.force_production = options["force_production"]
        self.remove = options["remove"]
        
        # Safety check for production
        if self.env == "production" and not self.force_production:
            raise CommandError(
                "Production seeding requires --force-production flag. "
                "Use: python manage.py seed_test_users --env=production --force-production"
            )
        
        if self.remove:
            self._remove_test_data()
            return
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("\n=== DRY RUN MODE ==="))
            self.stdout.write("No database changes will be made.\n")
        
        self.stdout.write(self.style.SUCCESS(f"\n🚀 Seeding test users for {self.env.upper()} environment\n"))
        
        try:
            with transaction.atomic():
                self.created_objects = {
                    "users": [],
                    "profiles": [],
                    "hostels": [],
                    "rooms": [],
                    "beds": [],
                    "bookings": [],
                    "payment_configs": [],
                }
                
                # Step 1: Create users
                self._create_users()
                
                # Step 2: Create profiles
                self._create_profiles()
                
                # Step 3: Create supporting data (hostels, rooms, beds)
                self._create_supporting_data()
                
                # Step 4: Create booking for student
                self._create_student_booking()
                
                # Step 5: Create payment config for landlord
                self._create_payment_config()
                
                # Step 6: Generate summary JSON
                self._generate_summary()
                
                if self.dry_run:
                    # Rollback in dry-run mode
                    raise DryRunRollback()
                    
        except DryRunRollback:
            self.stdout.write(self.style.WARNING("\n✓ Dry run complete - no changes made"))
            return
        
        self._display_credentials()
        self.stdout.write(self.style.SUCCESS("\n✅ Seeding complete!"))

    def _create_users(self):
        """Create base user accounts for each role"""
        self.stdout.write("\n📋 Creating users...")
        self.users = {}
        
        for user_data in TEST_USERS:
            email = user_data["email"]
            
            if self.dry_run:
                self.stdout.write(f"  [DRY] Would create: {email} ({user_data['role']})")
                self.users[user_data["role"]] = {"email": email, **user_data}
                continue
            
            user, created = User.objects.update_or_create(
                email=email,
                defaults={
                    **{k: v for k, v in user_data.items() if k != "email"},
                }
            )
            user.set_password(TEST_PASSWORD)
            user.save()
            
            self.users[user_data["role"]] = user
            self.created_objects["users"].append(email)
            
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"  ✓ {status}: {user.get_full_name()} ({user.role})"))

    def _create_profiles(self):
        """Create role-specific profile data"""
        self.stdout.write("\n📋 Creating profiles...")
        
        # Student Profile
        student = self.users.get("student")
        if student:
            profile_data = {
                "university": "University of Nairobi",
                "student_id_number": "STU-2026-001",
                "year_of_study": 2,
                "graduation_year": 2028,
                "course": "Computer Science",
                "campus": "Main Campus",
                "bio": "Test student for platform testing",
                "emergency_contact_name": "Test Parent Ochieng",
                "emergency_contact_phone": "+254700123456",
                "emergency_contact_relationship": "Parent",
                "is_profile_complete": True,
                "lifestyle_preferences": {"sleep_time": "22:00", "study_habits": "quiet"},
                "draft_data": SEED_METADATA,
            }
            
            if self.dry_run:
                self.stdout.write(f"  [DRY] Would create StudentProfile for {student['email']}")
            else:
                profile, _ = StudentProfile.objects.update_or_create(
                    user=student,
                    defaults=profile_data
                )
                self.created_objects["profiles"].append(f"StudentProfile:{student.email}")
                self.stdout.write(self.style.SUCCESS(f"  ✓ StudentProfile: {student.get_full_name()}"))
        
        # Landlord Profile
        landlord = self.users.get("landlord")
        if landlord:
            profile_data = {
                "company_name": "Mwangi Properties Ltd",
                "national_id": "LP-TEST-12345678",
                "business_address": "123 Kenyatta Avenue, Nairobi",
                "bank_name": "Equity Bank",
                "bank_account_number": "0123456789012",
                "bank_code": "068",
                "is_verified": True,
                "is_profile_complete": True,
                "total_hostels": 1,
                "total_rooms": 10,
                "trust_score": 85,
                "draft_data": SEED_METADATA,
            }
            
            if self.dry_run:
                self.stdout.write(f"  [DRY] Would create LandlordProfile for {landlord['email']}")
            else:
                profile, _ = LandlordProfile.objects.update_or_create(
                    user=landlord,
                    defaults=profile_data
                )
                self.landlord_profile = profile
                self.created_objects["profiles"].append(f"LandlordProfile:{landlord.email}")
                self.stdout.write(self.style.SUCCESS(f"  ✓ LandlordProfile: {landlord.get_full_name()}"))

    def _create_supporting_data(self):
        """Create hostels, rooms, and beds"""
        self.stdout.write("\n📋 Creating hostels, rooms, and beds...")
        
        if self.dry_run:
            self.stdout.write("  [DRY] Would create: Test Hostel Kilimani")
            self.stdout.write("  [DRY] Would create: Room 101, Room 102")
            self.stdout.write("  [DRY] Would create: 4 beds per room (8 total)")
            return
        
        if not hasattr(self, "landlord_profile"):
            self.stdout.write(self.style.WARNING("  ⚠ Skipping hostels - no landlord profile"))
            return
        
        # Create hostel
        hostel, _ = Hostel.objects.update_or_create(
            name="Test Hostel Kilimani",
            landlord=self.landlord_profile,
            defaults={
                "description": "Premium student accommodation near Nairobi CBD. Test hostel for platform testing.",
                "address": "456 Argwings Kodhek Road, Kilimani, Nairobi",
                "city": "Nairobi",
                "university": "University of Nairobi",
                "distance_from_university": Decimal("2.5"),
                "hostel_type": "shared_rooms",
                "status": "active",
                "total_rooms": 10,
                "available_rooms": 8,
                "base_price": Decimal("8000.00"),
                "deposit_amount": Decimal("8000.00"),
                "gender_policy": "mixed",
                "is_verified": True,
                "rules": "No smoking. Quiet hours 10pm-6am. Visitors must sign in.",
                "payment_cycle": "monthly",
                "grace_period_days": 5,
                "caretaker_name": "Grace Wanjiku",
                "caretaker_phone": "+254712345003",
            }
        )
        self.hostel = hostel
        self.created_objects["hostels"].append(hostel.name)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Hostel: {hostel.name}"))
        
        # Create rooms
        self.rooms = []
        for room_num in ["101", "102"]:
            room, _ = Room.objects.update_or_create(
                hostel=hostel,
                room_number=room_num,
                defaults={
                    "room_type": "double",
                    "floor": 1,
                    "base_price": Decimal("8000.00"),
                    "status": "available" if room_num == "102" else "occupied",
                    "capacity": 4,
                    "current_occupancy": 1 if room_num == "101" else 0,
                    "is_active": True,
                    "description": f"Spacious double room on first floor - Room {room_num}",
                    "amenities": ["wifi", "study_desk", "wardrobe", "fan"],
                }
            )
            self.rooms.append(room)
            self.created_objects["rooms"].append(f"{hostel.name} - {room_num}")
            self.stdout.write(self.style.SUCCESS(f"  ✓ Room: {room.room_number}"))
        
        # Create beds for each room
        self.beds = []
        for room in self.rooms:
            for bed_code in ["A", "B", "C", "D"]:
                full_code = f"KLM-{room.room_number}-{bed_code}"
                bed, _ = Bed.objects.update_or_create(
                    full_code=full_code,
                    defaults={
                        "room": room,
                        "hostel": hostel,
                        "code": bed_code,
                        "bed_type": "single",
                        "is_active": True,
                    }
                )
                self.beds.append(bed)
                self.created_objects["beds"].append(full_code)
        
        self.stdout.write(self.style.SUCCESS(f"  ✓ Created {len(self.beds)} beds"))
        
        # Create caretaker profile linked to hostel
        caretaker = self.users.get("caretaker")
        landlord = self.users.get("landlord")
        if caretaker and landlord:
            CaretakerProfile.objects.update_or_create(
                user=caretaker,
                defaults={
                    "national_id": "CT-TEST-87654321",
                    "hostel": hostel,
                    "landlord": self.landlord_profile,
                    "employment_start_date": date.today() - timedelta(days=90),
                    "is_active": True,
                    "permissions": {"check_in": True, "inventory": True, "maintenance": True, "visitors": True},
                    "emergency_contact_name": "Emergency Contact",
                    "emergency_contact_phone": "+254700987654",
                    "created_by": landlord,
                }
            )
            self.created_objects["profiles"].append(f"CaretakerProfile:{caretaker.email}")
            self.stdout.write(self.style.SUCCESS(f"  ✓ CaretakerProfile: {caretaker.get_full_name()}"))

    def _create_student_booking(self):
        """Create booking for student"""
        self.stdout.write("\n📋 Creating student booking...")
        
        if self.dry_run:
            self.stdout.write("  [DRY] Would create booking: BK-TEST-2026-001")
            return
        
        student = self.users.get("student")
        if not student or not hasattr(self, "rooms") or not self.rooms:
            self.stdout.write(self.style.WARNING("  ⚠ Skipping booking - missing student or rooms"))
            return
        
        student_profile = student.student_profile
        room = self.rooms[0]  # Room 101
        
        booking, _ = Booking.objects.update_or_create(
            booking_reference="BK-TEST-2026-001",
            defaults={
                "student": student_profile,
                "room": room,
                "check_in_date": date.today(),
                "check_out_date": date.today() + timedelta(days=365),
                "duration_months": 12,
                "monthly_rent": Decimal("8000.00"),
                "total_amount": Decimal("96000.00"),
                "payment_status": "paid",
                "status": "checked_in",
                "emergency_contact_name": "Test Parent Ochieng",
                "emergency_contact_phone": "+254700123456",
                "emergency_contact_relationship": "Parent",
            }
        )
        self.booking = booking
        self.created_objects["bookings"].append(booking.booking_reference)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Booking: {booking.booking_reference}"))
        
        # Create bed occupancy
        if self.beds:
            bed = self.beds[0]  # First bed in room 101
            BedOccupancy.objects.update_or_create(
                bed=bed,
                student=student_profile,
                booking=booking,
                is_active=True,
                defaults={
                    "moved_in_at": date.today(),
                    "daily_subscription_rate": Decimal("10.00"),
                }
            )
            self.stdout.write(self.style.SUCCESS(f"  ✓ BedOccupancy: {bed.full_code}"))

    def _create_payment_config(self):
        """Create mocked M-Pesa payment config for landlord"""
        self.stdout.write("\n📋 Creating payment config (mocked/test mode)...")
        
        if self.dry_run:
            self.stdout.write("  [DRY] Would create MpesaPaymentConfig: 174379 (test paybill)")
            return
        
        if not hasattr(self, "landlord_profile"):
            self.stdout.write(self.style.WARNING("  ⚠ Skipping payment config - no landlord profile"))
            return
        
        config, _ = MpesaPaymentConfig.objects.update_or_create(
            landlord=self.landlord_profile,
            mpesa_number="174379",  # Safaricom sandbox paybill
            defaults={
                "payment_type": "paybill",
                "business_name": "Mwangi Properties (TEST)",
                "consumer_key": "TEST_CONSUMER_KEY_DO_NOT_USE",
                "consumer_secret": "TEST_CONSUMER_SECRET_DO_NOT_USE",
                "passkey": "TEST_PASSKEY_DO_NOT_USE",
                "is_default": True,
                "status": "active",
            }
        )
        self.created_objects["payment_configs"].append(config.mpesa_number)
        self.stdout.write(self.style.SUCCESS(f"  ✓ MpesaPaymentConfig: {config.mpesa_number} (TEST MODE)"))

    def _generate_summary(self):
        """Generate fixtures/test_users_summary.json"""
        self.stdout.write("\n📋 Generating summary JSON...")
        
        summary = {
            "seed_metadata": SEED_METADATA,
            "environment": self.env,
            "users": [
                {
                    "email": u["email"],
                    "role": u["role"],
                    "name": f"{u['first_name']} {u['last_name']}"
                }
                for u in TEST_USERS
            ],
            "created_objects": self.created_objects,
        }
        
        if self.dry_run:
            self.stdout.write("  [DRY] Would write to: fixtures/test_users_summary.json")
            return
        
        fixtures_dir = Path(settings.BASE_DIR) / "fixtures"
        fixtures_dir.mkdir(exist_ok=True)
        
        summary_path = fixtures_dir / "test_users_summary.json"
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2, default=str)
        
        self.stdout.write(self.style.SUCCESS(f"  ✓ Summary: {summary_path}"))

    def _remove_test_data(self):
        """Remove all records with test_seeded_by=rumia_ide metadata"""
        self.stdout.write(self.style.WARNING("\n🗑️  Removing test data with marker: test_seeded_by=rumia_ide\n"))
        
        removed = {
            "users": 0,
            "hostels": 0,
            "bookings": 0,
            "payment_configs": 0,
        }
        
        # Remove test users by email pattern
        test_emails = [u["email"] for u in TEST_USERS]
        users_deleted, _ = User.objects.filter(email__in=test_emails).delete()
        removed["users"] = users_deleted
        self.stdout.write(f"  ✓ Deleted {users_deleted} test users")
        
        # Remove test hostel
        hostels_deleted, _ = Hostel.objects.filter(name="Test Hostel Kilimani").delete()
        removed["hostels"] = hostels_deleted
        self.stdout.write(f"  ✓ Deleted {hostels_deleted} test hostels (cascades rooms, beds, bookings)")
        
        # Remove test payment configs
        configs_deleted, _ = MpesaPaymentConfig.objects.filter(
            mpesa_number="174379",
            business_name__icontains="TEST"
        ).delete()
        removed["payment_configs"] = configs_deleted
        self.stdout.write(f"  ✓ Deleted {configs_deleted} test payment configs")
        
        # Remove summary file
        summary_path = Path(settings.BASE_DIR) / "fixtures" / "test_users_summary.json"
        if summary_path.exists():
            summary_path.unlink()
            self.stdout.write("  ✓ Deleted fixtures/test_users_summary.json")
        
        self.stdout.write(self.style.SUCCESS("\n✅ Test data removal complete!"))

    def _display_credentials(self):
        """Display login credentials for test users"""
        self.stdout.write(self.style.SUCCESS("\n=== Test User Credentials ==="))
        self.stdout.write(f"Password for all: {TEST_PASSWORD}\n")
        
        for user_data in TEST_USERS:
            role_display = user_data["role"].replace("_", " ").title()
            self.stdout.write(
                f"{role_display}:\n"
                f"  📧 {user_data['email']}\n"
            )
        
        self.stdout.write("\n🔗 Dashboard URLs:")
        self.stdout.write("  Student/Landlord: http://localhost:3000/dashboard")
        self.stdout.write("  Caretaker: http://localhost:3000/caretaker/dashboard")
        self.stdout.write("  Admin: http://localhost:3000/admin/dashboard")


class DryRunRollback(Exception):
    """Exception to trigger rollback in dry-run mode"""
    pass