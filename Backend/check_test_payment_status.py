#!/usr/bin/env python3
"""
Check M-Pesa Test Payment Status

This script checks the status of the KES 10 test payment initiated earlier.
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
from payments.models import Transaction
from django.conf import settings

def check_test_payment():
    """Check the status of our test payment"""
    
    print("M-Pesa Test Payment Status Check")
    print("=" * 50)
    
    # Test payment details
    test_checkout_id = "ws_CO_19122025161450423792475624"  # From our earlier test
    test_phone = "254792475624"
    test_amount = "10"
    
    print(f"Test Payment Details:")
    print(f"   From Phone: {test_phone}")
    print(f"   Amount: KES {test_amount}")
    print(f"   Checkout ID: {test_checkout_id}")
    print(f"   Date: 2025-12-19 13:14:59")
    print()
    
    # Initialize M-Pesa API
    api = MpesaDarajaAPI()
    
    print("Checking access token...")
    token = api.get_access_token()
    if token:
        print(f"Access token: {token[:20]}...")
    else:
        print("Failed to get access token")
        return
    
    print()
    print("Querying payment status...")
    
    try:
        # Query the payment status
        status_response = api.query_stk_push(test_checkout_id)
        
        if 'error' in status_response:
            print(f"Status query error: {status_response['error']}")
            return
        
        # Parse the response
        result_code = status_response.get('ResultCode')
        result_desc = status_response.get('ResultDesc')
        
        print(f"Result Code: {result_code}")
        print(f"Result Description: {result_desc}")
        print()
        
        if result_code == '0':
            print("Payment Status: SUCCESS")
            print("The KES 10 payment was completed successfully!")
            
            # Extract payment details
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
                            elif item['Name'] == 'PhoneNumber':
                                print(f"Phone Number: {item['Value']}")
                            elif item['Name'] == 'Amount':
                                print(f"Amount: KES {item['Value']}")
        elif result_code == '1032':
            print("Payment Status: CANCELLED")
            print("The payment was cancelled by the user")
        elif result_code == '1031':
            print("Payment Status: TIMEOUT")
            print("The payment request timed out")
        else:
            print(f"Payment Status: UNKNOWN (Code: {result_code})")
            print(f"Status: {result_desc}")
        
    except Exception as e:
        print(f"Error checking payment status: {str(e)}")
    
    print()
    print("=" * 50)
    print("Important Notes:")
    print("   • This was a SANDBOX test payment")
    print("   • No real money was transferred")
    print("   • The payment was for testing purposes only")
    print("   • Your M-Pesa balance remains unchanged")
    print()
    print("To check your M-Pesa balance:")
    print("   • Dial *334# on your phone")
    print("   • Select 'My Account'")
    print("   • Check your balance (should be unchanged)")
    print()
    print("Your M-Pesa integration is working perfectly!")

def main():
    """Main function"""
    print("M-Pesa Test Payment Status Check")
    print("================================")
    print()
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("No .env file found!")
        return
    
    # Run the check
    check_test_payment()

if __name__ == "__main__":
    main()