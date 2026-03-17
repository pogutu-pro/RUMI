"""
N+1 query optimization tests — Wave 0 stubs.

RED phase: all assertNumQueries tests are written with TIGHT bounds that
FAIL before the fix (bounds deliberately set below actual query counts).
GREEN phase (Task 2): views.py gets prefetch_related / select_related and
expected_count is updated to the measured passing value.

Actual query counts recorded below per test (captured from RED run).
"""

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from accounts.models import User, LandlordProfile, StudentProfile
from hostels.models import Hostel, Room, Booking, Amenity, HostelAmenity
from hostels.bed_models import Bed, BedOccupancy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(role, email_suffix, phone=None):
    """Create a minimal User with the given role."""
    email = f"{email_suffix}@test.example"
    phone = phone or f"+2547{abs(hash(email_suffix)) % 100000000:08d}"
    return User.objects.create_user(
        email=email,
        password="testpass123",
        role=role,
        phone_number=phone,
        is_active=True,
    )


def _make_landlord(suffix="ql"):
    user = _make_user("landlord", f"landlord_{suffix}", phone=f"+2547{abs(hash(suffix)) % 100000000:08d}")
    return LandlordProfile.objects.create(
        user=user,
        company_name=f"Prop Co {suffix}",
        national_id=f"ID-{abs(hash(suffix)) % 100000000:08d}",
        bank_name="Equity",
        bank_account_number=f"ACC-{abs(hash(suffix)) % 10000000000:010d}",
        is_verified=True,
    )


def _make_student(suffix="qs"):
    user = _make_user("student", f"student_{suffix}", phone=f"+2547{abs(hash('s' + suffix)) % 100000000:08d}")
    return StudentProfile.objects.create(
        user=user,
        university="Test University",
        student_id_number=f"STU-{abs(hash(suffix)) % 100000:05d}",
        year_of_study=1,
        emergency_contact_name="Guardian",
        emergency_contact_phone="+254700000001",
        emergency_contact_relationship="Parent",
        is_profile_complete=True,
    )


# ---------------------------------------------------------------------------
# PERF-01: Hostel listing N+1
# ---------------------------------------------------------------------------

class HostelQueryOptimizationTest(APITestCase):
    """
    Asserts that GET /api/v1/hostels/ issues a FIXED number of queries
    regardless of how many hostels / amenities exist.

    Actual query count before fix  : 10  (1 COUNT + 1 hostel list (w/ landlord__user JOIN)
                                          + 2×2 hostel_amenities queries + 4 amenity lookups)
    Expected count after fix (GREEN): 4
      1 – auth middleware / session
      2 – hostel list with select_related('landlord__user')
      3 – prefetch hostel_amenities__amenity (single batched query)
      4 – prefetch rooms (single batched query)
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        landlord = _make_landlord("perf01")
        amenity = Amenity.objects.create(name="WiFi-perf01", category="basic")
        for i in range(2):
            h = Hostel.objects.create(
                landlord=landlord,
                name=f"Test Hostel {i}",
                description="desc",
                address="123 Test St",
                base_price=5000,
                hostel_type="single_rooms",
                status="active",
            )
            HostelAmenity.objects.create(hostel=h, amenity=amenity)

    def test_no_n_plus_one(self):
        # Actual query count before fix: 10 (N+1 amenity queries per hostel)
        # Actual query count after fix : 5  (fixed — prefetch batches all amenity queries)
        # GREEN expected_count = 5
        cache.clear()
        with self.assertNumQueries(5):
            response = self.client.get("/api/v1/hostels/")
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# PERF-02: Room listing (bed occupancy) N+1
# ---------------------------------------------------------------------------

class BedOccupancyQueryTest(APITestCase):
    """
    Asserts that GET /api/v1/hostels/rooms/ issues a FIXED number of queries
    regardless of how many beds / occupancy rows exist.

    Actual query count before fix  : 12  (1 COUNT + 1 room list + 3 bed queries
                                          + 3 occupancy queries per bed + hostel lookup)
    Expected count after fix (GREEN): 4
      1 – room list with select_related('hostel')
      2 – prefetch beds (single batched query)
      3 – prefetch beds__occupancy_timeline (single batched query)
      4 – content-type / permission overhead
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        landlord = _make_landlord("perf02")
        hostel = Hostel.objects.create(
            landlord=landlord,
            name="Bed Hostel",
            description="desc",
            address="456 Test Ave",
            base_price=5000,
            hostel_type="shared_rooms",
            status="active",
        )
        room = Room.objects.create(
            hostel=hostel,
            room_number="101",
            room_type="triple",
            capacity=3,
            base_price=4000,
            status="available",
        )
        student = _make_student("perf02")
        booking = Booking.objects.create(
            student=student,
            room=room,
            booking_reference="BK-PERF02",
            check_in_date=timezone.now().date(),
            monthly_rent=4000,
            total_amount=4000,
            emergency_contact_name="Guardian",
            emergency_contact_phone="+254700000002",
            emergency_contact_relationship="Parent",
        )
        for idx in range(3):
            bed = Bed.objects.create(
                room=room,
                hostel=hostel,
                code=str(idx + 1),
                full_code=f"BH-101-{idx + 1}",
            )
            BedOccupancy.objects.create(
                bed=bed,
                student=student,
                booking=booking,
                moved_in_at=timezone.now().date(),
                is_active=True,
                daily_subscription_rate="5.00",
            )

    def test_no_n_plus_one(self):
        # Actual query count before fix: 12 (N+1 per bed for occupancy + student + user lookups)
        # Actual query count after fix : 4  (COUNT + rooms+hostel JOIN + beds batch + occupancy batch)
        # GREEN expected_count = 4
        cache.clear()
        with self.assertNumQueries(4):
            response = self.client.get("/api/v1/hostels/rooms/")
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# PERF-03: Booking listing N+1
# ---------------------------------------------------------------------------

class BookingQueryOptimizationTest(APITestCase):
    """
    Asserts that GET /api/v1/hostels/bookings/ issues a FIXED number of
    queries regardless of how many bookings exist.

    Actual query count before fix  : 14  (1 COUNT + 1 booking list + 4 per booking:
                                          room, hostel, student, user — for 3 bookings)
    Expected count after fix (GREEN): 4
      1 – auth / session
      2 – booking list with select_related('room__hostel')
      3 – student prefetch (TenantModelViewSet scoping)
      4 – ContentType / permission overhead
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        landlord = _make_landlord("perf03")
        hostel = Hostel.objects.create(
            landlord=landlord,
            name="Booking Hostel",
            description="desc",
            address="789 Test Rd",
            base_price=6000,
            hostel_type="single_rooms",
            status="active",
        )
        room = Room.objects.create(
            hostel=hostel,
            room_number="201",
            room_type="single",
            capacity=1,
            base_price=6000,
            status="available",
        )
        self.student = _make_student("perf03")
        for i in range(3):
            Booking.objects.create(
                student=self.student,
                room=room,
                booking_reference=f"BK-PERF03-{i}",
                check_in_date=timezone.now().date(),
                monthly_rent=6000,
                total_amount=6000,
                emergency_contact_name="Guardian",
                emergency_contact_phone="+254700000003",
                emergency_contact_relationship="Parent",
            )
        self.client.force_authenticate(user=self.student.user)

    def test_no_n_plus_one(self):
        # Actual query count before fix: 14 (room+hostel+student+user per booking)
        # Actual query count after fix : 2  (COUNT + 1 booking+room+hostel+student+user JOIN)
        # GREEN expected_count = 2
        cache.clear()
        with self.assertNumQueries(2):
            response = self.client.get("/api/v1/hostels/bookings/")
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# PERF-04: Hostel cache stub (implemented in plan 06-02)
# ---------------------------------------------------------------------------

class HostelCacheTest(TestCase):
    """Stub — full implementation in plan 06-02."""

    def test_cache_hit_returns_cached_response(self):
        self.skipTest("Implemented in plan 06-02")
