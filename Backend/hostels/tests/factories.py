import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from accounts.models import User, StudentProfile, LandlordProfile, CaretakerProfile
from hostels.models import Hostel, Room, Booking

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    role = 'student'
    phone_number = '+254700000000'
    is_active = True

class LandlordProfileFactory(DjangoModelFactory):
    class Meta:
        model = LandlordProfile

    user = factory.SubFactory(UserFactory, role='landlord', phone_number='+254711111111')
    company_name = factory.Faker('company')
    national_id = factory.Sequence(lambda n: f'ID-{n:08d}')
    bank_name = 'Equity Bank'
    bank_account_number = factory.Sequence(lambda n: f'ACC-{n:010d}')
    is_verified = True

class StudentProfileFactory(DjangoModelFactory):
    class Meta:
        model = StudentProfile

    user = factory.SubFactory(UserFactory, role='student')
    university = factory.Faker('company')
    student_id_number = factory.Sequence(lambda n: f'STU{n:05d}')
    year_of_study = 1
    emergency_contact_name = factory.Faker('name')
    emergency_contact_phone = '+254700000000'
    emergency_contact_relationship = 'Guardian'
    is_profile_complete = True

class CaretakerProfileFactory(DjangoModelFactory):
    class Meta:
        model = CaretakerProfile

    user = factory.SubFactory(UserFactory, role='caretaker')
    hostel = factory.SubFactory('hostels.tests.factories.HostelFactory')
    created_by = factory.SubFactory(UserFactory, role='landlord')
    emergency_contact_name = factory.Faker('name')
    emergency_contact_phone = '+254711111111'
    is_active = True

class HostelFactory(DjangoModelFactory):
    class Meta:
        model = Hostel

    landlord = factory.SubFactory(LandlordProfileFactory)
    name = factory.Faker('company')
    description = factory.Faker('paragraph')
    address = factory.Faker('address')
    city = 'Nairobi'
    base_price = 5000
    hostel_type = 'single_rooms'
    status = 'active'
    is_verified = True

class RoomFactory(DjangoModelFactory):
    class Meta:
        model = Room

    hostel = factory.SubFactory(HostelFactory)
    room_number = factory.Sequence(lambda n: f'Room-{n}')
    room_type = 'single'
    capacity = 1
    base_price = 5000
    status = 'available'

class BookingFactory(DjangoModelFactory):
    class Meta:
        model = Booking

    student = factory.SubFactory(StudentProfileFactory)
    room = factory.SubFactory(RoomFactory)
    booking_reference = factory.Sequence(lambda n: f'BK-{n:05d}')
    check_in_date = factory.LazyFunction(lambda: timezone.now().date())
    monthly_rent = 5000
    total_amount = 5000
    status = 'pending'
    emergency_contact_name = factory.Faker('name')
    emergency_contact_phone = '+254700000000'
    emergency_contact_relationship = 'Parent'
