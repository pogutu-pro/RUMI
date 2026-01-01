import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from django.test import RequestFactory
from landlord_api.views import LandlordStudentManagementView
from accounts.models import User, LandlordProfile
from hostels.models import Hostel, Room, Booking, RoomOccupant
from django.utils import timezone
from decimal import Decimal

def test_landlord_tenants_api():
    print("Testing Landlord Student Management API...")
    
    # Get or create a landlord
    landlord_user, _ = User.objects.get_or_create(
        email='test_landlord@example.com',
        defaults={'role': 'landlord', 'first_name': 'Test', 'last_name': 'Landlord'}
    )
    landlord_profile, _ = LandlordProfile.objects.get_or_create(user=landlord_user)
    
    # Create a hostel
    hostel, _ = Hostel.objects.get_or_create(
        landlord=landlord_profile,
        name='Test Hostel',
        defaults={'address': '123 Test St', 'base_price': 5000}
    )
    
    # Create a room
    room, _ = Room.objects.get_or_create(
        hostel=hostel,
        room_number='101',
        defaults={'room_type': 'single', 'base_price': 5000, 'capacity': 1}
    )
    
    # Create a student
    from accounts.models import StudentProfile
    student_user, _ = User.objects.get_or_create(
        email='test_student@example.com',
        defaults={'role': 'student', 'first_name': 'Test', 'last_name': 'Student'}
    )
    student_profile, _ = StudentProfile.objects.get_or_create(user=student_user)
    
    # Create a booking
    booking, _ = Booking.objects.get_or_create(
        student=student_profile,
        room=room,
        defaults={
            'booking_reference': 'TEST-BOOKING-001',
            'check_in_date': timezone.now().date(),
            'monthly_rent': 5000,
            'total_amount': 5000,
            'emergency_contact_name': 'Emergency',
            'emergency_contact_phone': '0700000000',
            'emergency_contact_relationship': 'Parent'
        }
    )
    
    # Create a room occupant
    RoomOccupant.objects.get_or_create(
        room=room,
        student=student_profile,
        booking=booking,
        defaults={'move_in_date': timezone.now().date(), 'is_active': True}
    )
    
    # Mock request
    factory = RequestFactory()
    request = factory.get('/api/v1/landlord/tenants/')
    request.user = landlord_user
    
    view = LandlordStudentManagementView.as_view()
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    if response.status_code == 200:
        print("✅ Backend test passed!")
        return True
    else:
        print("❌ Backend test failed!")
        return False

if __name__ == "__main__":
    if test_landlord_tenants_api():
        sys.exit(0)
    else:
        sys.exit(1)
