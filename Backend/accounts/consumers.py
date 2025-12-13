import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conversation, Message
from .serializers import MessageSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat functionality
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        # Check if user is authenticated
        if not self.user.is_authenticated:
            await self.close()
            return

        # Check if user has access to this conversation
        if not await self._user_has_access(self.conversation_id):
            await self.close()
            return

        # Join conversation group
        self.conversation_group_name = f'chat_{self.conversation_id}'
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )

        await self.accept()

        # Send online status
        await self._broadcast_online_status(True)

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'conversation_group_name'):
            await self.channel_layer.group_discard(
                self.conversation_group_name,
                self.channel_name
            )

            # Send offline status
            await self._broadcast_online_status(False)

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'send_message':
                await self._handle_send_message(data)
            elif message_type == 'typing_start':
                await self._handle_typing_start()
            elif message_type == 'typing_stop':
                await self._handle_typing_stop()
            elif message_type == 'mark_read':
                await self._handle_mark_read()

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def _handle_send_message(self, data):
        """Handle sending a message"""
        content = data.get('content', '').strip()

        if not content:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message content cannot be empty'
            }))
            return

        if len(content) > 1000:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message too long (max 1000 characters)'
            }))
            return

        # Create message in database
        message = await self._create_message(content)

        if message:
            # Broadcast message to conversation group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'chat_message',
                    'message': MessageSerializer(message).data,
                    'sender_id': self.user.id
                }
            )

    async def _handle_typing_start(self):
        """Handle typing indicator start"""
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name(),
                'is_typing': True
            }
        )

    async def _handle_typing_stop(self):
        """Handle typing indicator stop"""
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name(),
                'is_typing': False
            }
        )

    async def _handle_mark_read(self):
        """Handle marking messages as read"""
        await self._mark_messages_read()

        # Broadcast read status update
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'messages_read',
                'user_id': self.user.id
            }
        )

    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        # Don't send typing indicator to the user who is typing
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing']
            }))

    async def messages_read(self, event):
        """Send read status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'user_id': event['user_id']
        }))

    async def online_status(self, event):
        """Send online status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'online_status',
            'user_id': event['user_id'],
            'is_online': event['is_online']
        }))

    async def _broadcast_online_status(self, is_online):
        """Broadcast user's online status"""
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'online_status',
                'user_id': self.user.id,
                'is_online': is_online
            }
        )

    @database_sync_to_async
    def _user_has_access(self, conversation_id):
        """Check if user has access to conversation"""
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=self.user,
                is_active=True
            )
            return True
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def _create_message(self, content):
        """Create message in database"""
        try:
            conversation = Conversation.objects.get(
                id=self.conversation_id,
                participants=self.user,
                is_active=True
            )

            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content
            )

            # Update conversation timestamp
            conversation.updated_at = message.created_at
            conversation.save(update_fields=['updated_at'])

            return message
        except Exception:
            return None

    @database_sync_to_async
    def _mark_messages_read(self):
        """Mark messages as read for current user"""
        Message.objects.filter(
            conversation_id=self.conversation_id
        ).exclude(
            sender=self.user
        ).filter(
            is_read=False
        ).update(is_read=True, read_at=timezone.now())


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        # Join user's notification group
        self.notification_group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )

    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))