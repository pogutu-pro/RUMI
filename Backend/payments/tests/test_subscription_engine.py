import pytest
from decimal import Decimal
from django.utils import timezone
from payments.subscription_models import SubscriptionPlan, OccupancySnapshot, SubscriptionInvoice
from payments.tasks import capture_daily_occupancy_snapshots, generate_monthly_subscription_invoices
from hostels.models import Hostel, Room, Booking
from accounts.models import LandlordProfile, User

@pytest.mark.django_db
class TestSubscriptionEngine:
    def setup_method(self):
        # Setup test data
        self.user = User.objects.create_user(
            email='landlord@example.com', 
            password='password', 
            role='landlord',
            first_name='Landlord',
            last_name='User'
        )
        self.landlord = LandlordProfile.objects.create(user=self.user)
        self.hostel = Hostel.objects.create(
            landlord=self.landlord,
            name="Test Hostel",
            base_price=Decimal('10000.00'),
            hostel_type='single_rooms',
            status='active'
        )
        self.room = Room.objects.create(hostel=self.hostel, room_number="101", capacity=1, base_price=Decimal('10000.00'))
        
        # Create a confirmed booking
        self.student_user = User.objects.create_user(
            email='student@example.com', 
            role='student',
            first_name='Student',
            last_name='User'
        )
        from accounts.models import StudentProfile
        self.student = StudentProfile.objects.create(user=self.student_user)
        
        self.booking = Booking.objects.create(
            room=self.room,
            student=self.student,
            booking_reference="TEST-REF-001",
            check_in_date=timezone.now() - timezone.timedelta(days=5),
            check_out_date=timezone.now() + timezone.timedelta(days=25),
            status='confirmed',
            monthly_rent=Decimal('10000.00'),
            total_amount=Decimal('10000.00'),
            emergency_contact_name="Emergency",
            emergency_contact_phone="+254712345678",
            emergency_contact_relationship="Relative"
        )
        
        # Create starter plan
        SubscriptionPlan.objects.get_or_create(
            slug='starter',
            defaults={
                'name': 'Starter Plan',
                'unit_price': Decimal('29.00'),
                'is_active': True
            }
        )

    def test_daily_snapshot(self):
        # Run the task
        result = capture_daily_occupancy_snapshots()
        assert result['snapshots_created'] == 1
        
        snapshot = OccupancySnapshot.objects.get(hostel=self.hostel)
        assert snapshot.occupied_beds == 1
        assert snapshot.total_beds == 1

    def test_monthly_invoice_generation(self):
        # Mock some snapshots for the previous month
        today = timezone.now().date()
        last_month = today.replace(day=1) - timezone.timedelta(days=15)
        
        for i in range(30):
            day = last_month.replace(day=1) + timezone.timedelta(days=i)
            OccupancySnapshot.objects.create(
                hostel=self.hostel,
                snapshot_date=day,
                occupied_beds=1,
                total_beds=1,
                vacant_beds=0,
                bed_occupancy_data={}
            )
            
        # Run the task
        result = generate_monthly_subscription_invoices()
        assert result['invoices_created'] == 1
        
        invoice = SubscriptionInvoice.objects.get(hostel=self.hostel)
        assert invoice.total_bed_days == 30
        assert invoice.status == 'issued'
        # (30 bed-days / 30) * 29 = 29
        assert float(invoice.total_amount) == 29.0
