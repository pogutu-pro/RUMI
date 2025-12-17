"""
Email Service Integration

Provides email sending capabilities for the RUMI platform:
- Account verification emails
- Password reset emails
- Booking confirmations and receipts
- Payment notifications
- System alerts and notifications
- Bulk email campaigns
- Email templates management
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string
from django.urls import reverse
from .base import ThirdPartyServiceBase, ServiceConfig, APIResponse, register_service


@dataclass
class EmailTemplate:
    """Email template structure"""
    name: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    variables: Optional[List[str]] = None


@dataclass
class EmailAttachment:
    """Email attachment structure"""
    filename: str
    content: bytes
    content_type: str


@dataclass
class EmailRecipient:
    """Email recipient structure"""
    email: str
    name: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None


class EmailService(ThirdPartyServiceBase):
    """Email service supporting SendGrid and Mailgun"""
    
    def __init__(self):
        # Determine which email service to use based on settings
        primary_service = getattr(settings, 'EMAIL_SERVICE_PROVIDER', 'sendgrid').lower()
        
        if primary_service == 'sendgrid':
            config = ServiceConfig(
                api_key=settings.SENDGRID_API_KEY or "",
                base_url="https://api.sendgrid.com/v3",
                timeout=30,
                retries=3,
                cache_ttl=0,  # No caching for emails
                enabled=bool(settings.SENDGRID_API_KEY),
                rate_limit=100  # 100 emails per minute
            )
            self.service_type = 'sendgrid'
        else:  # mailgun
            config = ServiceConfig(
                api_key=settings.MAILGUN_API_KEY or "",
                base_url=f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}",
                timeout=30,
                retries=3,
                cache_ttl=0,
                enabled=bool(settings.MAILGUN_API_KEY),
                rate_limit=50  # 50 emails per minute
            )
            self.service_type = 'mailgun'
            
        super().__init__("email", config)
        
        # Default sender info
        self.from_email = settings.DEFAULT_FROM_EMAIL or 'noreply@rumi.ac.ke'
        self.from_name = settings.DEFAULT_FROM_NAME or 'RUMI Platform'
        
        # Email templates for common use cases
        self.templates = self._load_email_templates()
    
    def _load_email_templates(self) -> Dict[str, EmailTemplate]:
        """Load email templates"""
        return {
            'account_verification': EmailTemplate(
                name='account_verification',
                subject='Verify Your RUMI Account',
                html_content="""
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                        <h1>RUMI Platform</h1>
                        <p>Student Accommodation Made Easy</p>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Welcome to RUMI!</h2>
                        <p>Hi {{ user_name }},</p>
                        <p>Thank you for joining RUMI, the premier student accommodation platform.</p>
                        <p>Please verify your email address by clicking the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{ verification_url }}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #4CAF50;">{{ verification_url }}</p>
                        <p>This verification link will expire in 24 hours.</p>
                        <hr style="margin: 30px 0;">
                        <p>If you didn't create this account, please ignore this email.</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280;">
                        <p>&copy; 2025 RUMI Platform. All rights reserved.</p>
                        <p>Contact us: support@rumi.ac.ke</p>
                    </div>
                </div>
                """,
                variables=['user_name', 'verification_url']
            ),
            'password_reset': EmailTemplate(
                name='password_reset',
                subject='Reset Your RUMI Password',
                html_content="""
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                        <h1>RUMI Platform</h1>
                        <p>Password Reset Request</p>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Password Reset</h2>
                        <p>Hi {{ user_name }},</p>
                        <p>We received a request to reset your password for your RUMI account.</p>
                        <p>Click the button below to create a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{ reset_url }}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #4CAF50;">{{ reset_url }}</p>
                        <p>This reset link will expire in 1 hour for security reasons.</p>
                        <hr style="margin: 30px 0;">
                        <p>If you didn't request a password reset, please ignore this email.</p>
                        <p>For security, this link can only be used once.</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280;">
                        <p>&copy; 2025 RUMI Platform. All rights reserved.</p>
                    </div>
                </div>
                """,
                variables=['user_name', 'reset_url']
            ),
            'booking_confirmation': EmailTemplate(
                name='booking_confirmation',
                subject='Booking Confirmed - {{ hostel_name }}',
                html_content="""
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                        <h1>RUMI Platform</h1>
                        <p>Booking Confirmation</p>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Booking Confirmed!</h2>
                        <p>Hi {{ user_name }},</p>
                        <p>Your booking has been confirmed. Here are the details:</p>
                        
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3>Booking Details</h3>
                            <p><strong>Hostel:</strong> {{ hostel_name }}</p>
                            <p><strong>Room:</strong> {{ room_type }} - Room {{ room_number }}</p>
                            <p><strong>Check-in:</strong> {{ check_in_date }}</p>
                            <p><strong>Check-out:</strong> {{ check_out_date }}</p>
                            <p><strong>Booking ID:</strong> {{ booking_id }}</p>
                            <p><strong>Total Amount:</strong> KES {{ total_amount }}</p>
                        </div>
                        
                        <p>Please arrive at the hostel on your check-in date with a valid student ID.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{ booking_details_url }}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Booking Details
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280;">
                        <p>&copy; 2025 RUMI Platform. All rights reserved.</p>
                    </div>
                </div>
                """,
                variables=['user_name', 'hostel_name', 'room_type', 'room_number', 
                          'check_in_date', 'check_out_date', 'booking_id', 'total_amount', 'booking_details_url']
            ),
            'payment_success': EmailTemplate(
                name='payment_success',
                subject='Payment Successful - {{ booking_id }}',
                html_content="""
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                        <h1>RUMI Platform</h1>
                        <p>Payment Confirmation</p>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Payment Successful!</h2>
                        <p>Hi {{ user_name }},</p>
                        <p>We've received your payment. Here are the details:</p>
                        
                        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                            <h3>Payment Details</h3>
                            <p><strong>Transaction ID:</strong> {{ transaction_id }}</p>
                            <p><strong>Amount:</strong> KES {{ amount }}</p>
                            <p><strong>Payment Method:</strong> {{ payment_method }}</p>
                            <p><strong>Date:</strong> {{ payment_date }}</p>
                            <p><strong>Booking ID:</strong> {{ booking_id }}</p>
                        </div>
                        
                        <p>Thank you for your payment. Your booking is now confirmed!</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{ booking_details_url }}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Booking Details
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280;">
                        <p>&copy; 2025 RUMI Platform. All rights reserved.</p>
                    </div>
                </div>
                """,
                variables=['user_name', 'transaction_id', 'amount', 'payment_method', 
                          'payment_date', 'booking_id', 'booking_details_url']
            )
        }
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> APIResponse:
        """Send a single email"""
        try:
            if not self.config.enabled:
                # Fallback to Django email backend
                return await self._send_django_email(
                    to, subject, html_content, text_content, from_email, from_name, attachments
                )
            
            if self.service_type == 'sendgrid':
                return await self._send_sendgrid_email(
                    to, subject, html_content, text_content, from_email, from_name, attachments
                )
            else:  # mailgun
                return await self._send_mailgun_email(
                    to, subject, html_content, text_content, from_email, from_name, attachments
                )
                
        except Exception as e:
            return self.handle_error(e, "Email sending failed")
    
    async def send_template_email(
        self,
        template_name: str,
        recipients: List[EmailRecipient],
        variables: Optional[Dict[str, Any]] = None
    ) -> APIResponse:
        """Send email using a template"""
        try:
            template = self.templates.get(template_name)
            if not template:
                return APIResponse(
                    success=False,
                    error=f"Template '{template_name}' not found"
                )
            
            results = []
            for recipient in recipients:
                # Merge template variables with recipient variables
                email_variables = variables or {}
                if recipient.variables:
                    email_variables.update(recipient.variables)
                
                # Render template
                html_content = self._render_template(template.html_content, email_variables)
                text_content = template.text_content
                if text_content:
                    text_content = self._render_template(text_content, email_variables)
                
                # Send email
                result = await self.send_email(
                    to=recipient.email,
                    subject=template.subject,
                    html_content=html_content,
                    text_content=text_content
                )
                results.append(result)
            
            # Check if all emails were sent successfully
            success_count = sum(1 for r in results if r.success)
            return APIResponse(
                success=success_count == len(recipients),
                data={
                    'total_sent': success_count,
                    'total_recipients': len(recipients),
                    'results': results
                }
            )
            
        except Exception as e:
            return self.handle_error(e, "Template email sending failed")
    
    async def _send_sendgrid_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> APIResponse:
        """Send email using SendGrid"""
        try:
            url = f"{self.config.base_url}/mail/send"
            
            headers = {
                'Authorization': f'Bearer {self.config.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'personalizations': [
                    {
                        'to': [{'email': to}],
                        'subject': subject
                    }
                ],
                'from': {
                    'email': from_email or self.from_email,
                    'name': from_name or self.from_name
                },
                'content': [
                    {
                        'type': 'text/html',
                        'value': html_content
                    }
                ]
            }
            
            if text_content:
                payload['content'].insert(0, {
                    'type': 'text/plain',
                    'value': text_content
                })
            
            # Add attachments if provided
            if attachments:
                payload['attachments'] = []
                for attachment in attachments:
                    payload['attachments'].append({
                        'filename': attachment.filename,
                        'content': base64.b64encode(attachment.content).decode('utf-8'),
                        'type': attachment.content_type,
                        'disposition': 'attachment'
                    })
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 202:
                        return APIResponse(
                            success=True,
                            data={'message': 'Email sent successfully'}
                        )
                    else:
                        error_data = await response.text()
                        return APIResponse(
                            success=False,
                            error=f"SendGrid API error: {error_data}"
                        )
                        
        except Exception as e:
            return self.handle_error(e, "SendGrid email sending failed")
    
    async def _send_mailgun_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> APIResponse:
        """Send email using Mailgun"""
        try:
            url = f"{self.config.base_url}/messages"
            
            # Prepare form data
            data = {
                'from': f"{from_name or self.from_name} <{from_email or self.from_email}>",
                'to': [to],
                'subject': subject,
                'html': html_content
            }
            
            if text_content:
                data['text'] = text_content
            
            # Add attachments
            files = {}
            if attachments:
                for i, attachment in enumerate(attachments):
                    files[f'attachment[{i}]'] = (attachment.filename, attachment.content, attachment.content_type)
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, 
                    data=data if not files else {**data, **files},
                    auth=aiohttp.BasicAuth('api', self.config.api_key)
                ) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return APIResponse(
                            success=True,
                            data=response_data
                        )
                    else:
                        return APIResponse(
                            success=False,
                            error=f"Mailgun API error: {response_data.get('message', 'Unknown error')}"
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Mailgun email sending failed")
    
    async def _send_django_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> APIResponse:
        """Send email using Django's email backend"""
        try:
            # For attachments, use EmailMessage
            if attachments:
                email = EmailMessage(
                    subject=subject,
                    body=html_content,
                    from_email=from_email or self.from_email,
                    to=[to]
                )
                email.content_subtype = "html"
                
                # Add attachments
                for attachment in attachments:
                    email.attach(
                        filename=attachment.filename,
                        content=attachment.content,
                        mimetype=attachment.content_type
                    )
                
                email.send()
            else:
                # Simple email without attachments
                send_mail(
                    subject=subject,
                    message=text_content or html_content,
                    from_email=from_email or self.from_email,
                    recipient_list=[to],
                    html_message=html_content if not text_content else None
                )
            
            return APIResponse(
                success=True,
                data={'message': 'Email sent successfully using Django backend'}
            )
            
        except Exception as e:
            return self.handle_error(e, "Django email sending failed")
    
    def _render_template(self, template_content: str, variables: Dict[str, Any]) -> str:
        """Render template with variables"""
        # Simple variable replacement
        for key, value in variables.items():
            placeholder = f"{{{{ {key} }}}}"
            template_content = template_content.replace(placeholder, str(value))
        
        return template_content
    
    # Convenience methods for common email types
    async def send_verification_email(self, user_email: str, user_name: str, verification_url: str) -> APIResponse:
        """Send account verification email"""
        recipient = EmailRecipient(
            email=user_email,
            name=user_name,
            variables={'user_name': user_name, 'verification_url': verification_url}
        )
        
        return await self.send_template_email('account_verification', [recipient])
    
    async def send_password_reset_email(self, user_email: str, user_name: str, reset_url: str) -> APIResponse:
        """Send password reset email"""
        recipient = EmailRecipient(
            email=user_email,
            name=user_name,
            variables={'user_name': user_name, 'reset_url': reset_url}
        )
        
        return await self.send_template_email('password_reset', [recipient])
    
    async def send_booking_confirmation(
        self,
        user_email: str,
        user_name: str,
        booking_details: Dict[str, Any]
    ) -> APIResponse:
        """Send booking confirmation email"""
        # Build booking details URL
        booking_details_url = f"{getattr(settings, 'FRONTEND_URL', 'https://rumi.ac.ke')}/dashboard/bookings/{booking_details.get('booking_id')}"
        
        variables = {
            'user_name': user_name,
            'booking_details_url': booking_details_url,
            **booking_details
        }
        
        recipient = EmailRecipient(
            email=user_email,
            name=user_name,
            variables=variables
        )
        
        return await self.send_template_email('booking_confirmation', [recipient])
    
    async def send_payment_confirmation(
        self,
        user_email: str,
        user_name: str,
        payment_details: Dict[str, Any]
    ) -> APIResponse:
        """Send payment confirmation email"""
        booking_details_url = f"{getattr(settings, 'FRONTEND_URL', 'https://rumi.ac.ke')}/dashboard/bookings/{payment_details.get('booking_id')}"
        
        variables = {
            'user_name': user_name,
            'booking_details_url': booking_details_url,
            **payment_details
        }
        
        recipient = EmailRecipient(
            email=user_email,
            name=user_name,
            variables=variables
        )
        
        return await self.send_template_email('payment_success', [recipient])


# Create and register the email service instance
email_service = EmailService()
register_service(email_service)


# Convenience functions for common email operations
async def send_email(
    to: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    attachments: Optional[List[EmailAttachment]] = None
) -> APIResponse:
    """Send a simple email"""
    return await email_service.send_email(to, subject, html_content, text_content, attachments=attachments)


async def send_verification_email(user_email: str, user_name: str, verification_url: str) -> APIResponse:
    """Send account verification email"""
    return await email_service.send_verification_email(user_email, user_name, verification_url)


async def send_password_reset_email(user_email: str, user_name: str, reset_url: str) -> APIResponse:
    """Send password reset email"""
    return await email_service.send_password_reset_email(user_email, user_name, reset_url)


async def send_booking_confirmation(user_email: str, user_name: str, booking_details: Dict[str, Any]) -> APIResponse:
    """Send booking confirmation email"""
    return await email_service.send_booking_confirmation(user_email, user_name, booking_details)


async def send_payment_confirmation(user_email: str, user_name: str, payment_details: Dict[str, Any]) -> APIResponse:
    """Send payment confirmation email"""
    return await email_service.send_payment_confirmation(user_email, user_name, payment_details)
