from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.rumia import get_canonical_role

from .models import Conversation, Message
from .permissions import can_message, contacts_for
from notifications.in_app import display_name, notify_in_app, role_url

MAX_BODY_LENGTH = 2000
PAGE_SIZE = 50

ROLE_LABELS = {
    'tenant': 'Tenant',
    'caretaker': 'Caretaker',
    'landlord': 'Landlord',
    'super_admin': 'RumiaRent team',
}


def _display_name(user) -> str:
    return user.get_full_name().strip() or user.email


def _person(user) -> dict:
    role = get_canonical_role(user)
    return {
        'id': user.id,
        'name': _display_name(user),
        'role': role,
        'role_label': ROLE_LABELS.get(role, role.replace('_', ' ').title()),
        'profile_picture': user.profile_picture or None,
    }


def _message(message) -> dict:
    return {
        'id': str(message.id),
        'sender': message.sender_id,
        'body': message.body,
        'created_at': message.created_at,
    }


def _conversation(conversation, viewer) -> dict:
    return {
        'id': str(conversation.id),
        'other': _person(conversation.other_user(viewer)),
        'last_message_at': conversation.last_message_at,
        'last_message_preview': conversation.last_message_preview,
        'unread_count': conversation.unread_count_for(viewer),
    }


def _mine(user):
    return Conversation.objects.filter(Q(user_a=user) | Q(user_b=user)).select_related('user_a', 'user_b')


class ContactListView(APIView):
    """People the signed-in user is allowed to message."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        people = contacts_for(request.user).order_by('first_name', 'last_name', 'email')
        return Response({'results': [_person(u) for u in people]})


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = _mine(request.user).exclude(last_message_at__isnull=True)
        return Response({'results': [_conversation(c, request.user) for c in conversations]})

    def post(self, request):
        """Open (or fetch) the conversation with `recipient` - no message needed yet."""
        from django.contrib.auth import get_user_model

        recipient = get_user_model().objects.filter(pk=request.data.get('recipient')).first()
        if recipient is None or not can_message(request.user, recipient):
            return Response(
                {'detail': 'You cannot message this person.'}, status=status.HTTP_403_FORBIDDEN,
            )
        conversation = Conversation.between(request.user, recipient)
        return Response(_conversation(conversation, request.user), status=status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def _conversation(self, request, pk):
        conversation = get_object_or_404(_mine(request.user), pk=pk)
        return conversation

    def get(self, request, pk):
        conversation = self._conversation(request, pk)
        messages = conversation.messages.all()
        after = request.query_params.get('after')
        if after:
            messages = messages.filter(created_at__gt=after)
        # Latest page, oldest first, so the newest message sits at the bottom.
        page = list(messages.order_by('-created_at')[:PAGE_SIZE])[::-1]
        return Response({
            'other': _person(conversation.other_user(request.user)),
            'results': [_message(m) for m in page],
        })

    def post(self, request, pk):
        conversation = self._conversation(request, pk)
        other = conversation.other_user(request.user)
        if not can_message(request.user, other):
            return Response(
                {'detail': 'You can no longer message this person.'}, status=status.HTTP_403_FORBIDDEN,
            )

        body = (request.data.get('body') or '').strip()
        if not body:
            return Response({'detail': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(body) > MAX_BODY_LENGTH:
            return Response(
                {'detail': f'Message is too long (maximum {MAX_BODY_LENGTH} characters).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            message = Message.objects.create(conversation=conversation, sender=request.user, body=body)
            conversation.last_message_at = message.created_at
            conversation.last_message_preview = body[:140]
            # Sending implies you have read everything up to now.
            read_field = 'user_a_last_read_at' if request.user.id == conversation.user_a_id else 'user_b_last_read_at'
            setattr(conversation, read_field, message.created_at)
            conversation.save(update_fields=['last_message_at', 'last_message_preview', read_field])

        notify_in_app(
            other,
            notification_type='message',
            subject=f'New message from {display_name(request.user)}',
            message=body[:140],
            url=role_url(other, 'messages'),
            dedupe_key=f'conversation:{conversation.id}',
        )
        return Response(_message(message), status=status.HTTP_201_CREATED)


class ConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(_mine(request.user), pk=pk)
        field = 'user_a_last_read_at' if request.user.id == conversation.user_a_id else 'user_b_last_read_at'
        setattr(conversation, field, timezone.now())
        conversation.save(update_fields=[field])
        return Response({'unread_count': 0})


class UnreadCountView(APIView):
    """Total unread messages, for the badge on the Messages nav item."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = sum(
            c.unread_count_for(request.user)
            for c in _mine(request.user).exclude(last_message_at__isnull=True)
        )
        return Response({'unread_count': total})
