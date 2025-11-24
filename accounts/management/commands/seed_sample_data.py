"""
Management command to seed comprehensive sample data for testing
Usage: python manage.py seed_sample_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import StudentProfile, LandlordProfile
from hostels.models import Hostel, Room, Amenity, HostelAmenity
from marketplace.models import Category, Product, ProductImage
from home.models import FAQ, TeamMember, Statistics
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed comprehensive sample data for testing RUMI platform'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding comprehensive sample data...'))

        # Create sample data in order
        self.create_amenities()
        self.create_hostels_and_rooms()
        self.create_marketplace_categories()
        self.create_marketplace_products()
        self.create_faqs()
        self.create_team_members()
        self.create_statistics()

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

    def create_marketplace_categories(self):
        """Create marketplace product categories"""
        categories_data = [
            ('Electronics', 'electronics', 'Phones, laptops, and gadgets'),
            ('Furniture', 'furniture', 'Desks, chairs, and home items'),
            ('Books', 'books', 'Textbooks and study materials'),
            ('Clothing', 'clothing', 'Clothes and accessories'),
            ('Sports', 'sports', 'Sports equipment and gear'),
        ]

        for name, slug, description in categories_data:
            Category.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'description': description,
                    'is_active': True
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ Created marketplace categories'))

    def create_marketplace_products(self):
        """Create sample marketplace products"""
        try:
            student = StudentProfile.objects.get(user__email='student@test.com')
        except StudentProfile.DoesNotExist:
            self.stdout.write(self.style.WARNING('Student not found, skipping product creation'))
            return

        try:
            electronics_cat = Category.objects.get(slug='electronics')
            furniture_cat = Category.objects.get(slug='furniture')
            books_cat = Category.objects.get(slug='books')
        except Category.DoesNotExist:
            self.stdout.write(self.style.WARNING('Categories not found, skipping product creation'))
            return

        products_data = [
            {
                'title': 'iPhone 12 Pro',
                'description': 'Barely used iPhone 12 Pro in excellent condition. Comes with original box and accessories.',
                'price': Decimal('45000.00'),
                'category': electronics_cat,
                'condition': 'like_new',
                'location': 'Westlands, Nairobi'
            },
            {
                'title': 'Study Desk',
                'description': 'Solid wooden study desk perfect for student accommodation. Good condition.',
                'price': Decimal('3500.00'),
                'category': furniture_cat,
                'condition': 'good',
                'location': 'Kilimani, Nairobi'
            },
            {
                'title': 'Calculus Textbook',
                'description': 'Advanced Calculus textbook for engineering students. Like new condition.',
                'price': Decimal('1200.00'),
                'category': books_cat,
                'condition': 'like_new',
                'location': 'University of Nairobi'
            },
            {
                'title': 'MacBook Air M1',
                'description': 'Apple MacBook Air with M1 chip. Perfect for programming and design work.',
                'price': Decimal('85000.00'),
                'category': electronics_cat,
                'condition': 'good',
                'location': 'Karen, Nairobi'
            }
        ]

        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                title=product_data['title'],
                seller=student,
                defaults={
                    **product_data,
                    'slug': product_data['title'].lower().replace(' ', '-'),
                    'status': 'active',
                    'is_negotiable': True,
                    'contact_method': 'in_app'
                }
            )

            if created:
                # Create sample product image
                ProductImage.objects.get_or_create(
                    product=product,
                    image_url='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                    defaults={
                        'caption': f'Image for {product.title}',
                        'is_primary': True,
                        'sort_order': 1
                    }
                )

                self.stdout.write(self.style.SUCCESS(f'✓ Created product: {product.title}'))

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