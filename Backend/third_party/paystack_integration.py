"""
Paystack API integration utilities
"""
import requests
import logging
from typing import Dict, Optional, Any
from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)


class PaystackAPIError(Exception):
    """Custom exception for Paystack API errors"""
    pass


class PaystackClient:
    """
    High-quality Paystack API client for payment processing
    """
    
    def __init__(self, secret_key: Optional[str] = None):
        """
        Initialize Paystack client with API credentials
        
        Args:
            secret_key: Paystack secret key (defaults to settings)
        """
        self.secret_key = secret_key or getattr(settings, 'PAYSTACK_SECRET_KEY', None)
        self.base_url = 'https://api.paystack.co'
        
        if not self.secret_key:
            raise ImproperlyConfigured('PAYSTACK_SECRET_KEY not configured')
    
    def _make_request(self, endpoint: str, method: str = 'GET', 
                    data: Optional[Dict] = None, 
                    headers: Optional[Dict] = None) -> Dict:
        """
        Make authenticated request to Paystack API
        
        Args:
            endpoint: API endpoint path
            method: HTTP method (GET, POST, etc.)
            data: Request data for POST requests
            headers: Additional headers
            
        Returns:
            Response data from Paystack API
            
        Raises:
            PaystackAPIError: If API request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            else:
                raise PaystackAPIError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            
            api_response = response.json()
            
            if api_response.get('status', False) is False:
                error_msg = api_response.get('message', 'Unknown error occurred')
                raise PaystackAPIError(f"Paystack API error: {error_msg}")
            
            return api_response
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack API request failed: {str(e)}")
            raise PaystackAPIError(f"Failed to connect to Paystack API: {str(e)}")
        except ValueError as e:
            logger.error(f"Invalid JSON response from Paystack: {str(e)}")
            raise PaystackAPIError(f"Invalid response from Paystack API: {str(e)}")
    
    def create_transaction(self, amount: Decimal, email: str, 
                        reference: str, callback_url: Optional[str] = None,
                        metadata: Optional[Dict] = None) -> Dict:
        """
        Create payment transaction
        
        Args:
            amount: Amount to charge (in KES)
            email: Customer email address
            reference: Unique transaction reference
            callback_url: URL to redirect to after payment
            metadata: Additional metadata
            
        Returns:
            Transaction creation response
        """
        data = {
            'amount': str(int(amount * 100)),  # Convert to kobo
            'email': email,
            'reference': reference,
            'currency': 'KES',
        }
        
        if callback_url:
            data['callback_url'] = callback_url
            
        if metadata:
            data['metadata'] = metadata
        
        return self._make_request('/transaction/initialize', 'POST', data)
    
    def verify_transaction(self, reference: str) -> Dict:
        """
        Verify transaction status
        
        Args:
            reference: Transaction reference to verify
            
        Returns:
            Transaction verification response
        """
        return self._make_request(f'/transaction/verify/{reference}', 'GET')
    
    def create_subaccount(self, business_name: str, account_number: str, 
                         bank_code: str, split_percentage: float = 0.0,
                         description: Optional[str] = None) -> Dict:
        """
        Create Paystack subaccount for payouts
        
        Args:
            business_name: Registered business name
            account_number: Bank account number
            bank_code: Bank code
            split_percentage: Percentage to split with subaccount
            description: Business description
            
        Returns:
            Subaccount creation response
        """
        data = {
            'business_name': business_name,
            'settlement_bank': {
                'account_number': account_number,
                'bank_code': bank_code,
            },
            'settlement_schedule': {
                'type': 'manual',
                'monthly': 1,
            },
            'split_type': 'percentage',
            'split_value': {
                'subaccount': split_percentage,
                'main': 100 - split_percentage,
            },
        }
        
        if description:
            data['description'] = description
        
        return self._make_request('/subaccount', 'POST', data)
    
    def process_refund(self, transaction_reference: str, 
                     amount: Optional[Decimal] = None) -> Dict:
        """
        Process refund for a transaction
        
        Args:
            transaction_reference: Original transaction reference
            amount: Amount to refund (None for full refund)
            
        Returns:
            Refund processing response
        """
        data = {
            'transaction': transaction_reference,
        }
        
        if amount:
            data['amount'] = str(int(amount * 100))  # Convert to kobo
        
        return self._make_request('/refund', 'POST', data)
    
    def list_transactions(self, per_page: int = 50, 
                      from_date: Optional[str] = None,
                      to_date: Optional[str] = None) -> Dict:
        """
        List transactions with pagination and filtering
        
        Args:
            per_page: Number of results per page
            from_date: Filter from date (YYYY-MM-DD)
            to_date: Filter to date (YYYY-MM-DD)
            
        Returns:
            Transaction list response
        """
        params = {
            'perPage': per_page,
        }
        
        if from_date:
            params['from'] = from_date
            
        if to_date:
            params['to'] = to_date
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return self._make_request(f'/transaction?{query_string}', 'GET')
    
    def get_transaction_details(self, transaction_id: str) -> Dict:
        """
        Get detailed information about a specific transaction
        
        Args:
            transaction_id: Paystack transaction ID
            
        Returns:
            Transaction details response
        """
        return self._make_request(f'/transaction/{transaction_id}', 'GET')
    
    def get_balance(self) -> Dict:
        """
        Get account balance
        
        Returns:
            Balance information
        """
        return self._make_request('/balance', 'GET')


def create_paystack_payment_link(amount: Decimal, email: str, 
                              reference: str, callback_url: str,
                              metadata: Optional[Dict] = None) -> Dict[str, Any]:
    """
    High-level function to create Paystack payment link
    
    Args:
        amount: Payment amount in KES
        email: Customer email
        reference: Unique transaction reference  
        callback_url: Payment success callback URL
        metadata: Additional metadata
        
    Returns:
        Dictionary with payment URL and authorization info
        
    Raises:
        PaystackAPIError: If payment link creation fails
    """
    try:
        client = PaystackClient()
        result = client.create_transaction(
            amount=amount,
            email=email,
            reference=reference,
            callback_url=callback_url,
            metadata=metadata
        )
        
        if result.get('status') is True:
            payment_data = result.get('data', {})
            return {
                'status': 'success',
                'payment_url': payment_data.get('authorization_url'),
                'access_code': payment_data.get('access_code'),
                'reference': payment_data.get('reference'),
                'message': 'Payment link created successfully'
            }
        else:
            return {
                'status': 'error',
                'message': result.get('message', 'Failed to create payment link'),
                'reference': reference
            }
            
    except PaystackAPIError as e:
        logger.error(f"Paystack payment creation failed: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'reference': reference
        }
    except Exception as e:
        logger.error(f"Unexpected error in Paystack integration: {str(e)}")
        return {
            'status': 'error',
            'message': 'Payment service temporarily unavailable',
            'reference': reference
        }


def create_paystack_subaccount(business_name: str, account_number: str,
                            bank_code: str, business_email: str) -> Dict[str, Any]:
    """
    High-level function to create Paystack subaccount
    
    Args:
        business_name: Registered business name
        account_number: Bank account number
        bank_code: Bank code
        business_email: Business contact email
        
    Returns:
        Dictionary with subaccount details
        
    Raises:
        PaystackAPIError: If subaccount creation fails
    """
    try:
        client = PaystackClient()
        result = client.create_subaccount(
            business_name=business_name,
            account_number=account_number,
            bank_code=bank_code,
            split_percentage=100.0,  # 100% to subaccount
            description=f"Subaccount for {business_name}"
        )
        
        if result.get('status') is True:
            subaccount_data = result.get('data', {})
            return {
                'status': 'success',
                'subaccount_code': subaccount_data.get('subaccount_code'),
                'business_name': subaccount_data.get('business_name'),
                'message': 'Subaccount created successfully'
            }
        else:
            return {
                'status': 'error',
                'message': result.get('message', 'Failed to create subaccount'),
            }
            
    except PaystackAPIError as e:
        logger.error(f"Paystack subaccount creation failed: {str(e)}")
        return {
            'status': 'error',
            'message': str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error in subaccount creation: {str(e)}")
        return {
            'status': 'error',
            'message': 'Subaccount service temporarily unavailable'
        }


def process_paystack_refund(transaction_reference: str, 
                        amount: Optional[Decimal] = None) -> Dict[str, Any]:
    """
    High-level function to process Paystack refund
    
    Args:
        transaction_reference: Original transaction reference
        amount: Amount to refund (None for full refund)
        
    Returns:
        Dictionary with refund status
        
    Raises:
        PaystackAPIError: If refund processing fails
    """
    try:
        client = PaystackClient()
        result = client.process_refund(transaction_reference, amount)
        
        if result.get('status') is True:
            refund_data = result.get('data', {})
            return {
                'status': 'success',
                'refund_id': refund_data.get('id'),
                'amount': refund_data.get('amount'),
                'reference': refund_data.get('transaction'),
                'message': 'Refund processed successfully'
            }
        else:
            return {
                'status': 'error',
                'message': result.get('message', 'Failed to process refund'),
                'reference': transaction_reference
            }
            
    except PaystackAPIError as e:
        logger.error(f"Paystack refund failed: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'reference': transaction_reference
        }
    except Exception as e:
        logger.error(f"Unexpected error in refund processing: {str(e)}")
        return {
            'status': 'error',
            'message': 'Refund service temporarily unavailable',
            'reference': transaction_reference
        }