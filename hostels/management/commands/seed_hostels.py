from django.core.management.base import BaseCommand
from hostels.models import Hostel, Room, Amenity
from accounts.models import LandlordProfile
from decimal import Decimal
import random

class Command(BaseCommand):
    help = 'Seed hostels with frontend images and data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding hostels...'))
        
        # Get or create a landlord
        landlord = LandlordProfile.objects.first()
        if not landlord:
            self.stdout.write(self.style.ERROR('No landlord found! Run seed_test_users first.'))
            return

        # Images from frontend/public/images/cards
        CARD_IMAGES = [
            '/images/cards/card-01.jpg',
            '/images/cards/card-02.jpg',
            '/images/cards/card-03.jpg'
        ]

        # 1. Create "Sunshine Heights"
        hostel1, created = Hostel.objects.update_or_create(
            name='Sunshine Heights',
            defaults={
                'landlord': landlord,
                'description': 'Modern student living with spacious rooms and high-speed WiFi. Located just 5 minutes from campus.',
                'address': '123 University Way',
                'city': 'Nairobi',
                'university': 'University of Nairobi',
                'distance_from_university': Decimal('0.5'),
                'hostel_type': 'single_rooms',
                'gender_policy': 'mixed',
                'base_price': Decimal('15000.00'),
                'is_verified': True,
                'images': CARD_IMAGES, # Using all images
                'amenities': {'wifi': True, 'security': True, 'water': True},
                'total_rooms': 20,
                'available_rooms': 5,
                'rating': '4.8',
                'review_count': 124
            }
        )
        self.create_rooms(hostel1)
        self.stdout.write(self.style.SUCCESS(f'✓ Create/Updated: {hostel1.name}'))

        # 2. Create "Green Valley Hostels"
        hostel2, created = Hostel.objects.update_or_create(
            name='Green Valley Hostels',
            defaults={
                'landlord': landlord,
                'description': 'Peaceful environment perfect for serious students. Lush gardens and quiet study areas.',
                'address': '45 Parklands Avenue',
                'city': 'Nairobi',
                'university': 'Kenyatta University',
                'distance_from_university': Decimal('2.0'),
                'hostel_type': 'shared_rooms',
                'gender_policy': 'female_only',
                'base_price': Decimal('8500.00'),
                'is_verified': True,
                'images': [CARD_IMAGES[1], CARD_IMAGES[2]],
                'amenities': {'garden': True, 'study_room': True, 'shuttle': True},
                'total_rooms': 45,
                'available_rooms': 12,
                 'rating': '4.5',
                'review_count': 89
            }
        )
        self.create_rooms(hostel2)
        self.stdout.write(self.style.SUCCESS(f'✓ Create/Updated: {hostel2.name}'))

        # 3. Create "Urban Nest"
        hostel3, created = Hostel.objects.update_or_create(
            name='Urban Nest',
            defaults={
                'landlord': landlord,
                'description': 'Affordable luxury in the heart of the city. Gym and rooftop lounge included.',
                'address': '78 Moi Avenue',
                'city': 'Nairobi',
                'university': 'Technical University of Kenya',
                'distance_from_university': Decimal('1.2'),
                'hostel_type': 'mixed',
                'gender_policy': 'mixed',
                'base_price': Decimal('12000.00'),
                'is_verified': False, # Not verified
                'images': [CARD_IMAGES[0], CARD_IMAGES[2]],
                'amenities': {'gym': True, 'rooftop': True, 'cctv': True},
                'total_rooms': 30,
                'available_rooms': 0, # Fully booked
                'rating': '4.2',
                'review_count': 56
            }
        )
        self.create_rooms(hostel3)
        self.stdout.write(self.style.SUCCESS(f'✓ Create/Updated: {hostel3.name}'))

    def create_rooms(self, hostel):
        # Create some basic rooms
        for i in range(1, 4):
            Room.objects.get_or_create(
                hostel=hostel,
                room_number=f'A{i}',
                defaults={
                    'room_type': 'single' if i == 1 else 'double',
                    'capacity': 1 if i == 1 else 2,
                    'base_price': hostel.base_price,
                    'deposit_required': True,
                    'floor': 1,
                    'images': hostel.images[:1] # Use first image for room
                }
            )
