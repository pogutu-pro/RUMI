#!/usr/bin/env python3
"""
Script to add hostel image to existing hostel
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from hostels.models import Hostel

def add_hostel_image():
    """Add image to the first hostel"""
    
    # Get the first hostel
    hostel = Hostel.objects.first()
    
    if not hostel:
        print("❌ No hostels found!")
        return
    
    # The image URL from Unsplash
    image_url = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    
    # Add image to the hostel's images array
    current_images = hostel.images or []
    if image_url not in current_images:
        current_images.append(image_url)
        hostel.images = current_images
        hostel.save()
        print(f"✅ Added image to hostel: {hostel.name}")
        print(f"   Image URL: {image_url}")
        print(f"   Total images: {len(current_images)}")
    else:
        print(f"ℹ️  Image already exists for hostel: {hostel.name}")
    
    # Display hostel info
    print(f"\n📋 Hostel Details:")
    print(f"   Name: {hostel.name}")
    print(f"   Address: {hostel.address}")
    print(f"   City: {hostel.city}")
    print(f"   Price: {hostel.base_price} {hostel.currency}")
    print(f"   Images: {len(hostel.images)}")

if __name__ == "__main__":
    add_hostel_image()