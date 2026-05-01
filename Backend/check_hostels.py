import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from hostels.models import Hostel
from users.models import CustomUser

james = CustomUser.objects.filter(email='james.mwangi@test.rumia.co.ke').first()
if james:
    print(f"User: {james.email}")
    hostels = Hostel.objects.filter(landlord=james.landlord_profile)
    print(f"Hostels Count: {hostels.count()}")
    for h in hostels:
        print(f" - {h.name} (Rooms: {h.total_rooms})")
else:
    print("User not found!")
