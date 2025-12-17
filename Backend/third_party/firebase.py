"""
Firebase Cloud Messaging Integration

Provides push notification services for the RUMI platform:
- Send push notifications to individual users
- Send notifications to user topics
- Handle notification scheduling
- Manage user tokens
- Notification analytics
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone

from django.conf import settings
from .base import ThirdPartyServiceBase, ServiceConfig, APIResponse, register_service


@dataclass
class NotificationMessage:
    """Notification message structure"""
    title: str
    body: str
    image_url: Optional[str] = None
    icon: Optional[str] = None
    click_action: Optional[str] = None
    sound: Optional[str] = None
    badge: Optional[int] = None


@dataclass
class DataMessage:
    """Data message structure (for background processing)"""
    title: str
    body: str
    type: str
    payload: Dict[str, Any]


@dataclass
class FCMResponse:
    """Firebase Cloud Messaging response"""
    message_id: str
    success: bool
    failure_count: int
    multicast_id: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class FirebaseService(ThirdPartyServiceBase):
    """Firebase Cloud Messaging service"""
    
    def __init__(self):
        config = ServiceConfig(
            api_key=settings.FIREBASE_PRIVATE_KEY or "",
            base_url="https://fcm.googleapis.com/v1",
            timeout=30,
            retries=3,
            cache_ttl=0,  # No caching for notifications
            enabled=bool(settings.FIREBASE_PROJECT_ID and settings.FIREBASE_PRIVATE_KEY),
            rate_limit=100  # 100 notifications per minute
        )
        super().__init__("firebase", config)
        
        # Firebase configuration
        self.project_id = settings.FIREBASE_PROJECT_ID
        self.private_key = settings.FIREBASE_PRIVATE_KEY
        self.client_email = settings.FIREBASE_CLIENT_EMAIL
        
        # Generate access token
        self.access_token = None
        self.token_expiry = None
    
    async def get_access_token(self) -> APIResponse:
        """Get Firebase access token"""
        try:
            # Check if we have a valid token
            if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
                return APIResponse(
                    success=True,
                    data={'access_token': self.access_token}
                )
            
            # Import firebase_admin for token generation
            try:
                import firebase_admin
                from firebase_admin import credentials
                from google.oauth2 import service_account
                
                # Create credentials object
                credentials_data = {
                    'type': 'service_account',
                    'project_id': self.project_id,
                    'private_key_id': 'key-id',
                    'private_key': self.private_key.replace('\\n', '\n'),
                    'client_email': self.client_email,
                    'client_id': 'client-id',
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                }
                
                # Get access token
                creds = service_account.Credentials.from_service_account_info(credentials_data)
                scoped_creds = creds.with_scopes(['https://www.googleapis.com/auth/firebase.messaging'])
                self.access_token = scoped_creds.token
                
                # Set expiry (1 hour from now)
                self.token_expiry = datetime.now().replace(hour=datetime.now().hour + 1)
                
                return APIResponse(
                    success=True,
                    data={'access_token': self.access_token}
                )
                
            except ImportError:
                return APIResponse(
                    success=False,
                    error="firebase_admin package not installed. Install with: pip install firebase-admin"
                )
            except Exception as e:
                return self.handle_error(e, "Failed to generate Firebase access token")
                
        except Exception as e:
            return self.handle_error(e, "Access token generation failed")
    
    async def send_notification(
        self,
        token: str,
        notification: NotificationMessage,
        data: Optional[Dict[str, Any]] = None,
        android_config: Optional[Dict[str, Any]] = None,
        apns_config: Optional[Dict[str, Any]] = None
    ) -> APIResponse:
        """Send push notification to a single device"""
        try:
            # Get access token
            token_response = await self.get_access_token()
            if not token_response.success:
                return token_response
            
            access_token = token_response.data['access_token']
            
            # Prepare notification payload
            message = {
                'message': {
                    'token': token,
                    'notification': {
                        'title': notification.title,
                        'body': notification.body
                    },
                    'data': data or {}
                }
            }
            
            # Add optional configurations
            if notification.image_url:
                message['message']['notification']['image'] = notification.image_url
            if notification.icon:
                message['message']['notification']['icon'] = notification.icon
            if notification.click_action:
                message['message']['notification']['click_action'] = notification.click_action
            if notification.sound:
                message['message']['notification']['sound'] = notification.sound
            if notification.badge is not None:
                message['message']['notification']['badge'] = notification.badge
            
            if android_config:
                message['message']['android'] = android_config
            if apns_config:
                message['message']['apns'] = apns_config
            
            url = f"{self.config.base_url}/projects/{self.project_id}/messages:send"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=message) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        fcm_response = FCMResponse(
                            message_id=response_data.get('name', ''),
                            success=True,
                            failure_count=0,
                            multicast_id=response_data.get('name', '')
                        )
                        
                        return APIResponse(
                            success=True,
                            data={'fcm_response': fcm_response}
                        )
                    else:
                        error_message = response_data.get('error', {}).get('message', 'Unknown Firebase error')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Notification sending failed")
    
    async def send_to_topic(
        self,
        topic: str,
        notification: NotificationMessage,
        data: Optional[Dict[str, Any]] = None
    ) -> APIResponse:
        """Send push notification to all devices subscribed to a topic"""
        try:
            # Get access token
            token_response = await self.get_access_token()
            if not token_response.success:
                return token_response
            
            access_token = token_response.data['access_token']
            
            # Prepare message for topic
            message = {
                'message': {
                    'topic': topic,
                    'notification': {
                        'title': notification.title,
                        'body': notification.body
                    },
                    'data': data or {}
                }
            }
            
            if notification.image_url:
                message['message']['notification']['image'] = notification.image_url
            
            url = f"{self.config.base_url}/projects/{self.project_id}/messages:send"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=message) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return APIResponse(
                            success=True,
                            data={'message_id': response_data.get('name', '')}
                        )
                    else:
                        error_message = response_data.get('error', {}).get('message', 'Unknown Firebase error')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Topic notification sending failed")
    
    async def send_multicast(
        self,
        tokens: List[str],
        notification: NotificationMessage,
        data: Optional[Dict[str, Any]] = None
    ) -> APIResponse:
        """Send push notification to multiple devices"""
        try:
            # Get access token
            token_response = await self.get_access_token()
            if not token_response.success:
                return token_response
            
            access_token = token_response.data['access_token']
            
            # Prepare multicast message
            message = {
                'message': {
                    'tokens': tokens,
                    'notification': {
                        'title': notification.title,
                        'body': notification.body
                    },
                    'data': data or {}
                }
            }
            
            if notification.image_url:
                message['message']['notification']['image'] = notification.image_url
            
            url = f"{self.config.base_url}/projects/{self.project_id}/messages:send"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=message) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        # Parse response for each token
                        success_count = 0
                        failure_count = 0
                        results = []
                        
                        for i, token in enumerate(tokens):
                            token_result = {
                                'token': token,
                                'success': True,
                                'error': None
                            }
                            
                            if 'responses' in response_data:
                                if i < len(response_data['responses']):
                                    response_item = response_data['responses'][i]
                                    if not response_item.get('success', True):
                                        token_result['success'] = False
                                        token_result['error'] = response_item.get('error', {}).get('message', 'Unknown error')
                                        failure_count += 1
                                    else:
                                        success_count += 1
                                else:
                                    success_count += 1
                            else:
                                success_count += 1
                            
                            results.append(token_result)
                        
                        fcm_response = FCMResponse(
                            message_id=response_data.get('name', ''),
                            success=failure_count == 0,
                            failure_count=failure_count,
                            multicast_id=response_data.get('name', ''),
                            results=results
                        )
                        
                        return APIResponse(
                            success=True,
                            data={'fcm_response': fcm_response, 'success_count': success_count}
                        )
                    else:
                        error_message = response_data.get('error', {}).get('message', 'Unknown Firebase error')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Multicast notification sending failed")
    
    async def send_data_message(
        self,
        token: str,
        data_message: DataMessage,
        android_config: Optional[Dict[str, Any]] = None
    ) -> APIResponse:
        """Send data message (for background processing)"""
        try:
            # Get access token
            token_response = await self.get_access_token()
            if not token_response.success:
                return token_response
            
            access_token = token_response.data['access_token']
            
            # Prepare data message
            message = {
                'message': {
                    'token': token,
                    'data': {
                        'title': data_message.title,
                        'body': data_message.body,
                        'type': data_message.type,
                        'payload': json.dumps(data_message.payload)
                    }
                }
            }
            
            if android_config:
                message['message']['android'] = android_config
            
            url = f"{self.config.base_url}/projects/{self.project_id}/messages:send"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=message) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return APIResponse(
                            success=True,
                            data={'message_id': response_data.get('name', '')}
                        )
                    else:
                        error_message = response_data.get('error', {}).get('message', 'Unknown Firebase error')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Data message sending failed")
    
    async def subscribe_to_topic(self, tokens: List[str], topic: str) -> APIResponse:
        """Subscribe devices to a topic"""
        try:
            # Get access token
            token_response = await self.get_access_token()
            if not token_response.success:
                return token_response
            
            access_token = token_response.data['access_token']
            
            url = f"{self.config.base_url}/projects/{self.project_id}/topics/{topic}:subscribe"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            body = {'tokens': tokens}
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=body) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return APIResponse(
                            success=True,
                            data=response_data
                        )
                    else:
                        error_message = response_data.get('error', {}).get('message', 'Unknown Firebase error')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Topic subscription failed")
    
    async def unsubscribe_from_topic(self, tokens: List[str], topic: str) -> APIResponse:
        """Unsubscribe devices from a topic"""
        try:
            # Get access token
            token_response = await self.get_access_token()
            if not token_response.success:
                return token_response
            
            access_token = token_response.data['access_token']
            
            url = f"{self.config.base_url}/projects/{self.project_id}/topics/{topic}:unsubscribe"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            body = {'tokens': tokens}
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=body) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return APIResponse(
                            success=True,
                            data=response_data
                        )
                    else:
                        error_message = response_data.get('error', {}).get('message', 'Unknown Firebase error')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Topic unsubscription failed")


# Create and register the Firebase service instance
firebase_service = FirebaseService()
register_service(firebase_service)


# Convenience functions for Firebase operations
async def send_push_notification(token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> APIResponse:
    """Send push notification to a single device"""
    notification = NotificationMessage(title=title, body=body)
    return await firebase_service.send_notification(token, notification, data)


async def send_to_topic_notification(topic: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> APIResponse:
    """Send push notification to a topic"""
    notification = NotificationMessage(title=title, body=body)
    return await firebase_service.send_to_topic(topic, notification, data)


async def send_multicast_notification(tokens: List[str], title: str, body: str, data: Optional[Dict[str, Any]] = None) -> APIResponse:
    """Send push notification to multiple devices"""
    notification = NotificationMessage(title=title, body=body)
    return await firebase_service.send_multicast(tokens, notification, data)


async def subscribe_to_topic(tokens: List[str], topic: str) -> APIResponse:
    """Subscribe devices to a topic"""
    return await firebase_service.subscribe_to_topic(tokens, topic)


async def unsubscribe_from_topic(tokens: List[str], topic: str) -> APIResponse:
    """Unsubscribe devices from a topic"""
    return await firebase_service.unsubscribe_from_topic(tokens, topic)
