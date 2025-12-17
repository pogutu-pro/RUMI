"""
SMS Notification Service - Africa's Talking Integration

Provides SMS capabilities for the RUMI platform including:
- OTP verification
- Payment notifications
- Booking confirmations
- Security alerts
- System notifications
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

from django.conf import settings
from .base import ThirdPartyServiceBase, ServiceConfig, APIResponse, register_service


@dataclass
class SMSMessage:
    """SMS message configuration"""
    to: Union[str, List[str]]
    message: str
    message_type: str = "plain"  # plain, unicode, binary
    sender: Optional[str] = None  # Shortcode or sender ID
    priority: str = "normal"  # normal, high, low
    retry_duration: int = 60  # seconds
    
    def __post_init__(self):
        # Ensure to is a list
        if isinstance(self.to, str):
            self.to = [self.to]


@dataclass
class SMSResponse:
    """SMS delivery response"""
    message_count: int
    pending_message_count: int
    failed_message_count: int
    message_id: str
    status: str
    recipients: List[Dict[str, Any]]


class SMSService(ThirdPartyServiceBase):
    """SMS service using Africa's Talking"""
    
    def __init__(self):
        config = ServiceConfig(
            api_key=settings.AFRICASTALKING_API_KEY or "",
            api_secret=settings.AFRICASTALKING_API_SECRET or "",
            base_url="https://api.africastalking.com/rest",
            timeout=30,
            retries=3,
            cache_ttl=0,  # Don't cache SMS requests
            enabled=bool(settings.AFRICASTALKING_API_KEY),
            rate_limit=100  # 100 SMS per minute
        )
        super().__init__("sms", config)
        
        # Get username from settings
        self.username = getattr(settings, 'AFRICASTALKING_USERNAME', 'sandbox')
        
        # Default sender ID (shortcode or sender name)
        self.default_sender = getattr(settings, 'SMS_DEFAULT_SENDER', 'RUMI')
        
        # API endpoints
        self.send_endpoint = "/messaging"
        self.delivery_endpoint = "/delivery"
        self.balance_endpoint = "/user/balance"
    
    async def send_sms(self, message: SMSMessage) -> APIResponse:
        """Send SMS message"""
        try:
            if not self.is_enabled():
                return APIResponse(
                    success=False,
                    error="SMS service is not configured"
                )
            
            # Prepare request data
            data = {
                'username': self.username,
                'to': ','.join(message.to) if isinstance(message.to, list) else message.to,
                'message': message.message,
                'bulkSMSMode': 1,  # For multiple recipients
                'retryDuration': message.retry_duration
            }
            
            # Add sender if specified
            if message.sender:
                data['enqueue'] = 1
                data['keyword'] = message.sender
            else:
                data['from'] = self.default_sender
            
            # Add message type
            if message.message_type != "plain":
                data['messageType'] = message.message_type
            
            response = await self._make_request(
                endpoint=self.send_endpoint,
                method="POST",
                data=data
            )
            
            if response.success:
                # Parse SMS response
                sms_response = self._parse_sms_response(response.data)
                return APIResponse(
                    success=True,
                    data={
                        'message_id': sms_response.message_id,
                        'status': sms_response.status,
                        'recipients': sms_response.recipients,
                        'message_count': sms_response.message_count,
                        'failed_count': sms_response.failed_message_count
                    }
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "SMS sending failed")
    
    async def send_otp(self, phone_number: str, otp_code: str, purpose: str = "verification") -> APIResponse:
        """Send OTP verification message"""
        message = f"Your RUMI verification code is: {otp_code}. This code expires in 5 minutes. For {purpose}, do not share this code with anyone."
        
        sms_message = SMSMessage(
            to=phone_number,
            message=message,
            priority="high"
        )
        
        return await self.send_sms(sms_message)
    
    async def send_payment_notification(self, phone_number: str, amount: float, status: str) -> APIResponse:
        """Send payment notification"""
        status_emoji = "✓" if status == "success" else "❌"
        message = f"{status_emoji} RUMI Payment Update: Your payment of KES {amount:,.2f} has been {status}."
        
        sms_message = SMSMessage(
            to=phone_number,
            message=message
        )
        
        return await self.send_sms(sms_message)
    
    async def send_booking_notification(self, phone_number: str, action: str, booking_ref: str) -> APIResponse:
        """Send booking-related notifications"""
        actions = {
            'confirmed': f"✓ Your RUMI booking {booking_ref} has been confirmed! Welcome to your new home.",
            'cancelled': f"❌ Your RUMI booking {booking_ref} has been cancelled.",
            'reminder': f"⏰ Reminder: Your RUMI booking {booking_ref} is coming up. Check your app for details."
        }
        
        message = actions.get(action, f"Update for your RUMI booking {booking_ref}: {action}")
        
        sms_message = SMSMessage(
            to=phone_number,
            message=message
        )
        
        return await self.send_sms(sms_message)
    
    async def send_security_alert(self, phone_number: str, alert_type: str, location: str = "") -> APIResponse:
        """Send security alerts"""
        alerts = {
            'late_entry': f"🚨 Security Alert: Late entry recorded at {location}. Please check your app for details.",
            'unauthorized_visitor': f"🚨 Security Alert: Unauthorized visitor attempt at {location}.",
            'maintenance': f"🔧 Maintenance Alert: Scheduled maintenance at {location}."
        }
        
        message = alerts.get(alert_type, f"🚨 Security alert at {location}")
        
        sms_message = SMSMessage(
            to=phone_number,
            message=message,
            priority="high"
        )
        
        return await self.send_sms(sms_message)
    
    async def send_bulk_sms(self, phone_numbers: List[str], message: str, **kwargs) -> APIResponse:
        """Send bulk SMS to multiple recipients"""
        sms_message = SMSMessage(
            to=phone_numbers,
            message=message,
            **kwargs
        )
        
        return await self.send_sms(sms_message)
    
    async def check_balance(self) -> APIResponse:
        """Check SMS account balance"""
        try:
            response = await self._make_request(
                endpoint=self.balance_endpoint,
                method="GET"
            )
            
            if response.success:
                return APIResponse(
                    success=True,
                    data={
                        'balance': response.data.get('balance'),
                        'currency': response.data.get('currency'),
                        'account_type': response.data.get('accountType')
                    }
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Balance check failed")
    
    async def get_delivery_status(self, message_id: str) -> APIResponse:
        """Get SMS delivery status"""
        try:
            params = {'messageId': message_id}
            response = await self._make_request(
                endpoint=self.delivery_endpoint,
                method="GET",
                params=params
            )
            
            if response.success:
                return APIResponse(
                    success=True,
                    data=response.data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Delivery status check failed")
    
    def _parse_sms_response(self, data: Dict[str, Any]) -> SMSResponse:
        """Parse SMS API response"""
        return SMSResponse(
            message_count=data.get('SMSMessageCount', 0),
            pending_message_count=data.get('PendingMessageCount', 0),
            failed_message_count=data.get('FailedMessageCount', 0),
            message_id=data.get('MessageID', ''),
            status=data.get('Message', ''),
            recipients=data.get('Recipients', [])
        )
    
    async def _make_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> APIResponse:
        """Make HTTP request to Africa's Talking API"""
        import time
        start_time = time.time()
        
        try:
            # Prepare headers
            headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': self.config.api_key
            }
            
            # Prepare URL
            url = f"{self.config.base_url}{endpoint}"
            
            # Prepare data
            if method == "POST" and data:
                # Encode data as form data
                form_data = aiohttp.FormData()
                for key, value in data.items():
                    form_data.add_field(key, str(value))
                request_data = form_data
            else:
                request_data = None
            
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            ) as session:
                
                async with session.request(
                    method=method,
                    url=url,
                    data=request_data,
                    params=params,
                    headers=headers,
                    **kwargs
                ) as response:
                    
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        result = await response.json()
                        return APIResponse(
                            success=True,
                            data=result,
                            status_code=response.status,
                            response_time=response_time
                        )
                    else:
                        error_text = await response.text()
                        return APIResponse(
                            success=False,
                            error=f"API Error: {response.status} - {error_text}",
                            status_code=response.status,
                            response_time=response_time
                        )
                        
        except asyncio.TimeoutError:
            return APIResponse(
                success=False,
                error="Request timeout",
                response_time=self.config.timeout
            )
        except Exception as e:
            return self.handle_error(e, "SMS API request failed")


# Create and register the SMS service instance
sms_service = SMSService()
register_service(sms_service)


# Convenience functions for common SMS operations
async def send_otp_sms(phone_number: str, otp_code: str, purpose: str = "verification") -> APIResponse:
    """Send OTP via SMS"""
    return await sms_service.send_otp(phone_number, otp_code, purpose)


async def send_payment_sms(phone_number: str, amount: float, status: str) -> APIResponse:
    """Send payment notification via SMS"""
    return await sms_service.send_payment_notification(phone_number, amount, status)


async def send_booking_sms(phone_number: str, action: str, booking_ref: str) -> APIResponse:
    """Send booking notification via SMS"""
    return await sms_service.send_booking_notification(phone_number, action, booking_ref)


async def send_security_sms(phone_number: str, alert_type: str, location: str = "") -> APIResponse:
    """Send security alert via SMS"""
    return await sms_service.send_security_alert(phone_number, alert_type, location)


async def send_bulk_sms(phone_numbers: List[str], message: str) -> APIResponse:
    """Send bulk SMS"""
    return await sms_service.send_bulk_sms(phone_numbers, message)


async def check_sms_balance() -> APIResponse:
    """Check SMS account balance"""
    return await sms_service.check_balance()
