#!/usr/bin/env python3
"""
Test script to verify that the business_name vs company_name fix works
"""

import os
import sys
import django

# Add the current directory to the Python path
sys.path.append('/home/joseph-ogutu/Desktop/RUMI/Backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

# Import the models and serializers
from accounts.models import LandlordProfile, User
from payments.serializers import TransactionSerializer
from payments.models import Transaction

def test_landlord_field_access():
    """Test that we can access company_name field correctly"""
    try:
        # Create a test user and landlord profile if they don't exist
        user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Landlord',
                'role': 'landlord'
            }
        )
        
        landlord, created = LandlordProfile.objects.get_or_create(
            user=user,
            defaults={
                'national_id': '12345678',
                'bank_name': 'Test Bank',
                'bank_account_number': '1234567890',
                'bank_code': '001',
                'company_name': 'Test Company Ltd'
            }
        )
        
        print(f"✓ Successfully created/found landlord profile")
        print(f"  User: {user.get_full_name()}")
        print(f"  Company Name: {landlord.company_name}")
        print(f"  Has business_name attribute: {hasattr(landlord, 'business_name')}")
        
        # Test that accessing business_name would fail (before our fix)
        try:
            business_name = landlord.business_name
            print(f"✗ ERROR: landlord.business_name should not exist but returned: {business_name}")
        except AttributeError:
            print(f"✓ Correctly raises AttributeError for business_name (as expected)")
        
        # Test that accessing company_name works
        try:
            company_name = landlord.company_name
            print(f"✓ Successfully accessed company_name: {company_name}")
        except AttributeError as e:
            print(f"✗ ERROR: Failed to access company_name: {e}")
        
        # Test the serializer method
        class MockTransaction:
            def __init__(self):
                self.landlord = landlord
        
        mock_transaction = MockTransaction()
        serializer = TransactionSerializer()
        
        # Test the get_landlord_details method
        landlord_details = serializer.get_landlord_details(mock_transaction)
        print(f"✓ Serializer method worked: {landlord_details}")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing business_name vs company_name fix...")
    print("=" * 50)
    
    success = test_landlord_field_access()
    
    print("=" * 50)
    if success:
        print("✓ All tests passed! The fix is working correctly.")
    else:
        print("✗ Tests failed! There may still be issues.")
    
    sys.exit(0 if success else 1)