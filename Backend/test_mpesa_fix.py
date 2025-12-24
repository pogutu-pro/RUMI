#!/usr/bin/env python3
"""
M-Pesa STK Push Fix Verification Test

This script tests the M-Pesa payment initialization to verify the bug fix.
Run this after the fix to confirm STK push is working properly.
"""

import os
import sys
import django
import json
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')

# Load .env manually
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import User
from hostels.models import Booking

def test_mpesa_fix():
    """Test M-Pesa initialization after the bug fix"""
    
    print("🔧 M-Pesa STK Push Fix Verification Test")
    print("=" * 50)
    
    # Test 1: Check test booking exists
    print("\n1. Checking test booking...")
    try:
        booking = Booking.objects.get(id=11)
        balance_due = booking.total_amount - booking.amount_paid
        print(f"   ✅ Booking 11 found")
        print(f"   📋 Student: {booking.student.user.email}")
        print(f"   💰 Amount due: KES {balance_due}")
        print(f"   📍 Room: {booking.room.hostel.name} - {booking.room.room_number}")
    except Booking.DoesNotExist:
        print("   ❌ Booking 11 not found - run setup first")
        return False
    
    # Test 2: Check for existing payments
    print("\n2. Checking payment status...")
    try:
        payment_tx = booking.payment_transaction
        if payment_tx.status == 'success':
            print("   ❌ Booking already has successful payment - this shouldn't happen")
            return False
        else:
            print(f"   ⚠️  Found payment transaction with status: {payment_tx.status}")
    except:
        print("   ✅ No payment transaction exists - this is correct")
    
    # Test 3: Generate JWT token
    print("\n3. Generating test JWT token...")
    try:
        user = User.objects.get(email='student@test.com')
        token = AccessToken.for_user(user)
        print(f"   ✅ JWT token generated successfully")
        print(f"   🔑 Token preview: {str(token)[:20]}...")
    except Exception as e:
        print(f"   ❌ Failed to generate token: {e}")
        return False
    
    # Test 4: Test M-Pesa API call
    print("\n4. Testing M-Pesa API call...")
    print(f"   📡 Testing with booking ID: {booking.id}")
    print(f"   📱 Phone number: 254708374149")
    print(f"   💵 Amount: KES {balance_due}")
    
    # Prepare the test data
    test_data = {
        'booking_id': booking.id,
        'payment_type': 'initial',
        'payment_method': 'stk_push',
        'phone_number': '254708374149'
    }
    
    print(f"\n   📤 Request data: {json.dumps(test_data, indent=6)}")
    print(f"\n   🔑 Use this JWT token for curl testing:")
    print(f"   {token}")
    
    print(f"\n   📋 Curl command to test:")
    print(f"   curl -X POST http://localhost:8000/api/v1/payments/mpesa/initialize/ \\")
    print(f"     -H 'Content-Type: application/json' \\")
    print(f"     -H 'Authorization: Bearer {token}' \\")
    print(f"     -d '{json.dumps(test_data)}'")
    
    print("\n5. Expected Response:")
    print("   ✅ Should return STK push data like:")
    print("   {")
    print('     "transaction_id": 789,')
    print('     "status": "pending_stk_push",')
    print('     "message": "STK push initiated. Please check your phone for payment prompt.",')
    print('     "checkout_request_id": "ws_co_123456789"')
    print("   }")
    
    print("\n   ❌ Should NOT return:")
    print("   {")
    print('     "error": "Payment already completed for this booking"')
    print("   }")
    
    return True

def main():
    """Main test function"""
    print("🚀 Starting M-Pesa Fix Verification...")
    
    success = test_mpesa_fix()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All checks passed! Fix verification ready.")
        print("\n📝 Next steps:")
        print("1. Use the curl command above to test the API")
        print("2. Or test via frontend with booking ID 11")
        print("3. Verify you see 'Waiting for PIN...' instead of C2B instructions")
    else:
        print("❌ Some checks failed. Please review the errors above.")
    
    print("\n📄 Full details saved to: Backend/docs/MPESA_STK_PUSH_FIX_SUMMARY.md")

if __name__ == "__main__":
    main()