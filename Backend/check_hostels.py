#!/usr/bin/env python3
import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from accounts.models import LandlordProfile
from hostels.models import Hostel, Room

# Check landlord and hostels
landlord = LandlordProfile.objects.filter(user__email='landlord@test.com').first()
if landlord:
    print(f"Landlord found: {landlord.user.email}")
    print(f"Landlord ID: {landlord.id}")

    hostels = Hostel.objects.filter(landlord=landlord)
    print(f"Hostels count: {hostels.count()}")

    for hostel in hostels:
        print(f"Hostel: {hostel.name}")
        print(f"  Images: {hostel.images}")
        print(f"  Total rooms: {hostel.total_rooms}")
        print(f"  Available rooms: {hostel.available_rooms}")
        print(f"  Is verified: {hostel.is_verified}")

        rooms = Room.objects.filter(hostel=hostel)
        print(f"  Rooms count: {rooms.count()}")
        for room in rooms[:2]:  # Show first 2 rooms
            print(f"    Room {room.room_number}: {room.room_type}, KES {room.base_price}")
        print()
else:
    print("Landlord not found")

# Check all hostels
all_hostels = Hostel.objects.all()
print(f"Total hostels in system: {all_hostels.count()}")
for hostel in all_hostels:
    print(f"Hostel: {hostel.name} - Landlord: {hostel.landlord.user.email}")