from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.rumia import get_canonical_role
from organizations.models import Organization

from .models import SupportTicket, TicketMessage
from .serializers import (
    SupportTicketDetailSerializer,
    SupportTicketSerializer,
    TicketMessageSerializer,
)


def _is_staff_role(role: str) -> bool:
    return role in ('tech_support', 'tech_support_admin', 'super_admin')


def _user_organization_id(user):
    """Best-effort organization for a ticket's context — not authorization."""
    role = get_canonical_role(user)
    if role == 'landlord':
        org = Organization.objects.filter(owner=user).first()
        return org.id if org else None
    if role == 'caretaker':
        try:
            assignment = user.caretaker_profile.property_assignments.filter(is_active=True).first()
            return assignment.organization_id if assignment else None
        except Exception:
            return None
    if role == 'tenant':
        try:
            return user.tenant_profile.organization_id
        except Exception:
            return None
    return None


class SupportTicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_canonical_role(request.user)
        qs = SupportTicket.objects.select_related('created_by', 'assigned_to')

        if not _is_staff_role(role):
            qs = qs.filter(created_by=request.user)

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(SupportTicketSerializer(qs, many=True).data)

    def post(self, request):
        subject = request.data.get('subject', '').strip()
        description = request.data.get('description', '').strip()
        if not subject or not description:
            return Response(
                {'detail': 'Subject and description are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket = SupportTicket.objects.create(
            created_by=request.user,
            organization_id=_user_organization_id(request.user),
            subject=subject,
            description=description,
        )
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class SupportTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_ticket(self, request, pk):
        ticket = get_object_or_404(
            SupportTicket.objects.select_related('created_by', 'assigned_to').prefetch_related('messages__author'),
            pk=pk,
        )
        role = get_canonical_role(request.user)
        if not _is_staff_role(role) and ticket.created_by_id != request.user.id:
            return None
        return ticket

    def get(self, request, pk):
        ticket = self._get_ticket(request, pk)
        if ticket is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SupportTicketDetailSerializer(ticket).data)

    def patch(self, request, pk):
        role = get_canonical_role(request.user)
        if not _is_staff_role(role):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        ticket = get_object_or_404(SupportTicket, pk=pk)
        new_status = request.data.get('status')
        if new_status:
            if new_status not in dict(SupportTicket.STATUS_CHOICES):
                return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
            ticket.status = new_status

        if 'assigned_to' in request.data:
            ticket.assigned_to_id = request.data.get('assigned_to') or None

        ticket.save(update_fields=['status', 'assigned_to', 'updated_at'])
        return Response(SupportTicketSerializer(ticket).data)


class TicketMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def _can_access(self, request, ticket):
        role = get_canonical_role(request.user)
        return _is_staff_role(role) or ticket.created_by_id == request.user.id

    def get(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        if not self._can_access(request, ticket):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        messages = ticket.messages.select_related('author')
        return Response(TicketMessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        if not self._can_access(request, ticket):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = TicketMessage.objects.create(ticket=ticket, author=request.user, message=message)

        # Reopen a resolved/closed ticket if the original requester replies again.
        role = get_canonical_role(request.user)
        if not _is_staff_role(role) and ticket.status in ('resolved', 'closed'):
            ticket.status = 'open'
            ticket.save(update_fields=['status', 'updated_at'])

        return Response(TicketMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
