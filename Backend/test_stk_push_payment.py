#!/usr/bin/env python3
"""
M-Pesa STK Push Payment Test for RUMI Platform

This script initiates an STK push payment from the user's phone.
Test Case:
- From: +254792475624
- To: +254114845619  
- Amount: KES 10
"""

import os
import sys
import django
from decimal import Decimal

# Load .env file before Django setup
def load_env_file():
    """Load environment variables from .env file"""
    env_file = '.env'
    if os.path.exists(env_file):
        print(f"Loading environment variables from {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
        return True
    return False

# Load environment variables
load_env_file()

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from payments.mpesa_api import MpesaDarajaAPI

def test_stk_push_payment():
    """Test STK Push payment"""
    
    print("M-Pesa STK Push Payment Test")
    print("=" * 50)
    
    # Payment details
    amount = "10"  # KES 10
    from_phone = "+254792475624"  # User's phone
    to_phone = "+254114845619"    # Destination phone
    reference = "TEST-PAYMENT-001"
    description = "Test M-Pesa payment via RUMI Platform"
    
    print(f"From: {from_phone}")
    print(f"To: {to_phone}")
    print(f"Amount: KES {amount}")
    print(f"Reference: {reference}")
    print()
    
    # Initialize M-Pesa API
    api = MpesaDarajaAPI()
    
    # Validate phone numbers
    print("Validating phone numbers...")
    formatted_from = api.validate_phone_number(from_phone)
    formatted_to = api.validate_phone_number(to_phone)
    
    if not formatted_from:
        print(f"Invalid sender phone: {from_phone}")
        return False
        
    if not formatted_to:
        print(f"Invalid recipient phone: {to_phone}")
        return False
    
    print(f"Sender: {from_phone} → {formatted_from}")
    print(f"Recipient: {to_phone} → {formatted_to}")
    print()
    
    # Get access token
    print("Getting access token...")
    access_token = api.get_access_token()
    if not access_token:
        print("Failed to get access token")
        return False
    
    print(f"Access token obtained: {access_token[:20]}...")
    print()
    
    # Initiate STK Push
    print("Initiating STK Push payment...")
    try:
        response = api.initiate_stk_push(
            amount=amount,
            phone_number=formatted_from,  # Send from user's phone
            reference=reference,
            description=description
        )
        
        if 'error' in response:
            print(f"STK Push failed: {response['error']}")
            return False
        
        # Extract response data
        checkout_request_id = response.get('CheckoutRequestID')
        merchant_request_id = response.get('MerchantRequestID')
        response_code = response.get('ResponseCode')
        response_description = response.get('ResponseDescription')
        
        print("STK Push initiated successfully!")
        print(f"Checkout Request ID: {checkout_request_id}")
        print(f"Merchant Request ID: {merchant_request_id}")
        print(f"Response Code: {response_code}")
        print(f"Response: {response_description}")
        print()
        
        # Wait a moment for STK to be sent
        print("Waiting for STK push to be sent to phone...")
        print("Please check your phone (+254792475624) for the M-Pesa prompt")
        print("Use PIN: 254079 for sandbox testing")
        print()
        
        # Query payment status after a delay
        print("Querying payment status...")
        import time
        time.sleep(5)  # Wait 5 seconds
        
        if checkout_request_id:
            status_response = api.query_stk_push(checkout_request_id)
            
            if 'error' in status_response:
                print(f"Status query failed: {status_response['error']}")
            else:
                result_code = status_response.get('ResultCode')
                result_desc = status_response.get('ResultDesc')
                
                print(f"Status Result Code: {result_code}")
                print(f"Status Description: {result_desc}")
                
                if result_code == '0':
                    print("Payment completed successfully!")
                    
                    # Extract payment details if available
                    callback_metadata = status_response.get('CallbackMetadata')
                    if callback_metadata and isinstance(callback_metadata, dict):
                        items = callback_metadata.get('Item', [])
                        if isinstance(items, list):
                            for item in items:
                                if isinstance(item, dict) and 'Name' in item:
                                    if item['Name'] == 'MpesaReceiptNumber':
                                        print(f"Receipt Number: {item['Value']}")
                                    elif item['Name'] == 'TransactionDate':
                                        print(f"Transaction Date: {item['Value']}")
                else:
                    print("Payment failed or was cancelled")
        
        print("\n" + "=" * 50)
        print("STK Push Test Complete!")
        
        return True
        
    except Exception as e:
        print(f"Error during STK Push: {str(e)}")
        return False

def main():
    """Main test function"""
    
    print("M-Pesa STK Push Payment Test for RUMI Platform")
    print("=" * 60)
    print()
    print("This test will initiate an STK push payment of KES 10")
    print("from your phone (+254792475624) to +254114845619")
    print()
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("No .env file found!")
        print("Please ensure your M-Pesa credentials are configured.")
        return
    
    # Run the test
    success = test_stk_push_payment()
    
    if success:
        print("\nTest completed successfully!")
        print("If you didn't receive the STK prompt, check:")
        print("   - Your phone has M-Pesa service")
        print("   - You have sufficient balance")
        print("   - The number is registered with M-Pesa")
    else:
        print("\nTest failed!")
        print("Please check the error messages above.")

if __name__ == "__main__":
    main()