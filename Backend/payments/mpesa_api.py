"""
M-Pesa Daraja API Integration for RUMI Platform (Optimized for Performance)

This module provides optimized integration with Safaricom's M-Pesa Daraja API for handling:
- OAuth authentication for access tokens (with caching)
- C2B (Customer to Business) for offline payments and webhooks
- M-Pesa Express (Lipa na M-Pesa) for STK push payments

Performance Optimizations:
- Connection pooling for HTTP requests
- Access token caching with automatic refresh
- Optimized request headers and payload
- Fast-fail error handling
- Minimal payload processing
"""

import base64
import hashlib
import hmac
import json
import logging
import requests
import time
from datetime import datetime, timedelta
from decimal import Decimal
from urllib.parse import urlencode
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Create a session with connection pooling for better performance
_session = requests.Session()
_session.headers.update({
    'User-Agent': 'RUMI-Platform/1.0',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
})


class MpesaDarajaAPI:
    """
    M-Pesa Daraja API integration class
    
    Handles OAuth authentication, C2B operations, and M-Pesa Express transactions
    """
    
    def __init__(self):
        """Initialize M-Pesa API with configuration"""
        self.consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        self.consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        self.shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
        self.passkey = getattr(settings, 'MPESA_PASSKEY', '')
        self.callback_url = getattr(settings, 'MPESA_CALLBACK_URL', '')
        self.validation_url = getattr(settings, 'MPESA_VALIDATION_URL', '')
        self.confirmation_url = getattr(settings, 'MPESA_CONFIRMATION_URL', '')
        
        # Environment URLs
        self.is_sandbox = getattr(settings, 'MPESA_SANDBOX', True)
        if self.is_sandbox:
            self.base_url = 'https://sandbox.safaricom.co.ke'
            self.oauth_url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
        else:
            self.base_url = 'https://api.safaricom.co.ke'
            self.oauth_url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
        
        # API endpoints
        self.c2b_url = f'{self.base_url}/mpesa/c2b/v1/registerurl'
        self.c2b_simulate_url = f'{self.base_url}/mpesa/c2b/v1/simulate'
        self.express_url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'
        self.express_query_url = f'{self.base_url}/mpesa/stkpush/v1/query'
        
        self.access_token = None
        self.token_expires_at = None

    def get_access_token(self):
        """
        Get OAuth access token for M-Pesa API (Optimized with caching)
        
        Returns:
            str: Access token if successful, None otherwise
        """
        try:
            # Check cache first for better performance
            cache_key = 'mpesa_access_token'
            cached_token = cache.get(cache_key)
            if cached_token:
                return cached_token
            
            # Generate new token only if not in cache
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # Use optimized session with connection pooling
            response = _session.get(
                self.oauth_url, 
                headers=headers, 
                timeout=10  # Fast timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data['access_token']
                
                # Cache token for 55 minutes (expires in 1 hour, cache for 55 min)
                cache.set(cache_key, token, 55 * 60)
                logger.info("M-Pesa access token generated and cached")
                return token
            else:
                logger.error(f"Failed to get M-Pesa access token: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting M-Pesa access token: {str(e)}")
            return None

    def register_c2b_urls(self):
        """
        Register C2B validation and confirmation URLs
        
        Returns:
            dict: Registration response
        """
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'ShortCode': self.shortcode,
                'ResponseType': 'Completed',
                'ConfirmationURL': self.confirmation_url,
                'ValidationURL': self.validation_url
            }
            
            response = requests.post(self.c2b_url, json=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"C2B URLs registered successfully: {result}")
                return result
            else:
                logger.error(f"C2B URL registration failed: {response.text}")
                return {'error': response.text}
                
        except Exception as e:
            logger.error(f"Error registering C2B URLs: {str(e)}")
            return {'error': str(e)}

    def simulate_c2b_payment(self, amount, msisdn, reference, command_id='CustomerPayBillOnline'):
        """
        Simulate C2B payment (for testing)
        
        Args:
            amount (str): Payment amount
            msisdn (str): Customer phone number
            reference (str): Payment reference
            command_id (str): C2B command ID
            
        Returns:
            dict: Simulation response
        """
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'ShortCode': self.shortcode,
                'CommandID': command_id,
                'Amount': amount,
                'Msisdn': msisdn,
                'BillRefNumber': reference
            }
            
            response = requests.post(self.c2b_simulate_url, json=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"C2B payment simulated: {result}")
                return result
            else:
                logger.error(f"C2B simulation failed: {response.text}")
                return {'error': response.text}
                
        except Exception as e:
            logger.error(f"Error simulating C2B payment: {str(e)}")
            return {'error': str(e)}

    def initiate_stk_push(self, amount, phone_number, reference, description="RUMI Payment"):
        """
        Initiate STK Push payment (Lipa na M-Pesa) - Optimized for speed
        
        Args:
            amount (str): Payment amount
            phone_number (str): Customer phone number (format: 254XXXXXXXXX)
            reference (str): Payment reference
            description (str): Payment description
            
        Returns:
            dict: STK push response with checkout request ID
        """
        try:
            # Get access token with caching
            access_token = self.get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            # Generate timestamp and password in one operation
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password_string = f"{self.shortcode}{self.passkey}{timestamp}"
            password_b64 = base64.b64encode(password_string.encode('ascii')).decode('ascii')
            
            # Optimized payload - minimal fields
            data = {
                'BusinessShortCode': self.shortcode,
                'Password': password_b64,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': str(int(float(amount))),  # Remove decimal places
                'PartyA': phone_number,
                'PartyB': self.shortcode,
                'PhoneNumber': phone_number,
                'CallBackURL': self.callback_url,
                'AccountReference': reference,
                'TransactionDesc': description
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Use optimized session with timeout
            response = _session.post(
                self.express_url, 
                json=data, 
                headers=headers, 
                timeout=15  # 15 second timeout for STK push
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"STK Push initiated successfully: {result.get('CheckoutRequestID', 'N/A')}")
                return result
            else:
                logger.error(f"STK Push initiation failed: {response.status_code} - {response.text}")
                return {'error': f'HTTP {response.status_code}: {response.text}'}
                
        except requests.exceptions.Timeout:
            logger.error("STK Push request timed out")
            return {'error': 'Request timeout'}
        except requests.exceptions.ConnectionError:
            logger.error("STK Push connection error")
            return {'error': 'Connection error'}
        except Exception as e:
            logger.error(f"Error initiating STK Push: {str(e)}")
            return {'error': str(e)}

    def query_stk_push(self, checkout_request_id):
        """
        Query STK Push payment status
        
        Args:
            checkout_request_id (str): Checkout request ID from STK push initiation
            
        Returns:
            dict: Query response with payment status
        """
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            # Generate timestamp
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            
            # Generate password
            password_string = f"{self.shortcode}{self.passkey}{timestamp}"
            password_bytes = password_string.encode('ascii')
            password_b64 = base64.b64encode(password_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'BusinessShortCode': self.shortcode,
                'Password': password_b64,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            response = requests.post(self.express_query_url, json=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"STK Push queried: {result}")
                return result
            else:
                logger.error(f"STK Push query failed: {response.text}")
                return {'error': response.text}
                
        except Exception as e:
            logger.error(f"Error querying STK Push: {str(e)}")
            return {'error': str(e)}

    def get_payment_methods(self):
        """
        Get available M-Pesa payment methods
        
        Returns:
            dict: Available payment methods with descriptions
        """
        return {
            'send_money': {
                'name': 'Send Money',
                'description': 'Direct M-Pesa send money to business number',
                'command_id': 'CustomerPayBillOnline',
                'type': 'online'
            },
            'till_number': {
                'name': 'Till Number',
                'description': 'Pay using business till number',
                'command_id': 'CustomerPayBillOnline',
                'type': 'online'
            },
            'pochi': {
                'name': 'Pochi la Biashara',
                'description': 'Pay using Pochi business account',
                'command_id': 'CustomerPayBillOnline',
                'type': 'online'
            },
            'paybill': {
                'name': 'Paybill Number',
                'description': 'Pay using paybill number',
                'command_id': 'CustomerPayBillOnline',
                'type': 'online'
            },
            'c2b': {
                'name': 'C2B Offline',
                'description': 'Customer initiates payment via phone',
                'command_id': 'CustomerPayBillOnline',
                'type': 'offline'
            }
        }

    def validate_phone_number(self, phone_number):
        """
        Validate and format phone number for M-Pesa
        
        Args:
            phone_number (str): Raw phone number
            
        Returns:
            str: Formatted phone number (254XXXXXXXXX) or None if invalid
        """
        if not phone_number:
            return None
            
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, phone_number))
        
        # Handle different formats
        if digits.startswith('254') and len(digits) == 12:
            return digits
        elif digits.startswith('0') and len(digits) == 10:
            return '254' + digits[1:]
        elif len(digits) == 9:
            return '254' + digits
        else:
            return None

    def process_payment_callback(self, callback_data):
        """
        Process M-Pesa payment callback data
        
        Args:
            callback_data (dict): Callback data from M-Pesa
            
        Returns:
            dict: Processed payment information
        """
        try:
            logger.info(f"Processing M-Pesa callback: {callback_data}")
            
            if 'Body' in callback_data and 'stkCallback' in callback_data['Body']:
                stk_data = callback_data['Body']['stkCallback']
                
                result_code = stk_data.get('ResultCode')
                result_desc = stk_data.get('ResultDesc')
                checkout_request_id = stk_data.get('CheckoutRequestID')
                
                payment_info = {
                    'status': 'pending',
                    'result_code': result_code,
                    'result_desc': result_desc,
                    'checkout_request_id': checkout_request_id,
                    'timestamp': timezone.now().isoformat()
                }
                
                if result_code == 0:
                    # Successful payment
                    payment_info['status'] = 'success'
                    
                    # Extract payment details
                    if 'CallbackMetadata' in stk_data:
                        metadata = stk_data['CallbackMetadata']['Item']
                        for item in metadata:
                            if item['Name'] == 'Amount':
                                payment_info['amount'] = item['Value']
                            elif item['Name'] == 'MpesaReceiptNumber':
                                payment_info['receipt_number'] = item['Value']
                            elif item['Name'] == 'PhoneNumber':
                                payment_info['phone_number'] = item['Value']
                            elif item['Name'] == 'TransactionDate':
                                payment_info['transaction_date'] = item['Value']
                else:
                    # Failed payment
                    payment_info['status'] = 'failed'
                
                return payment_info
            else:
                logger.error(f"Invalid callback data format: {callback_data}")
                return {'status': 'error', 'message': 'Invalid callback data format'}
                
        except Exception as e:
            logger.error(f"Error processing callback: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    def process_c2b_validation(self, validation_data):
        """
        Process C2B validation request
        
        Args:
            validation_data (dict): Validation data from M-Pesa
            
        Returns:
            dict: Validation response
        """
        try:
            logger.info(f"Processing C2B validation: {validation_data}")
            
            # Extract validation data
            amount = validation_data.get('Amount')
            msisdn = validation_data.get('MSISDN')
            reference = validation_data.get('BillRefNumber')
            
            # Validate the transaction
            validation_result = {
                'ResultCode': '0',  # 0 = Accept, 1 = Reject
                'ResultDesc': 'Accepted',
                'ThirdPartyTransID': f"C2B-{int(time.time())}"
            }
            
            # Add business logic here to validate the transaction
            # For now, accept all validations
            logger.info(f"C2B validation accepted for {amount} from {msisdn}")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error processing C2B validation: {str(e)}")
            return {
                'ResultCode': '1',
                'ResultDesc': 'Validation failed',
                'ThirdPartyTransID': f"C2B-{int(time.time())}"
            }

    def process_c2b_confirmation(self, confirmation_data):
        """
        Process C2B confirmation request
        
        Args:
            confirmation_data (dict): Confirmation data from M-Pesa
            
        Returns:
            dict: Confirmation response
        """
        try:
            logger.info(f"Processing C2B confirmation: {confirmation_data}")
            
            # Extract confirmation data
            amount = confirmation_data.get('Amount')
            msisdn = confirmation_data.get('MSISDN')
            reference = confirmation_data.get('BillRefNumber')
            transaction_id = confirmation_data.get('TransID')
            transaction_time = confirmation_data.get('TransTime')
            
            # Process the confirmed transaction
            payment_info = {
                'status': 'success',
                'transaction_id': transaction_id,
                'amount': amount,
                'phone_number': msisdn,
                'reference': reference,
                'transaction_time': transaction_time,
                'timestamp': timezone.now(),
                'payment_type': 'c2b'
            }
            
            logger.info(f"C2B confirmation processed: {payment_info}")
            
            return {
                'ResultCode': '0',
                'ResultDesc': 'Confirmation received',
                'ThirdPartyTransID': transaction_id
            }
            
        except Exception as e:
            logger.error(f"Error processing C2B confirmation: {str(e)}")
            return {
                'ResultCode': '1',
                'ResultDesc': 'Confirmation processing failed',
                'ThirdPartyTransID': f"C2B-{int(time.time())}"
            }