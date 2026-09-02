from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.rumia import get_canonical_role
from organizations.models import Organization
from properties.models import RentalUnit

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


def _user_can_access_unit(user, unit_id) -> bool:
    """
    Authorization gate for the ticket-create endpoint's `unit` field (T-05-04).

    Any authenticated user of any role can supply an arbitrary `unit` UUID in
    the request body — this closes that IDOR by scoping the unit to the
    caller's own org (landlord), assigned properties (caretaker), or own
    tenancy (tenant). Staff triage roles are never blocked.
    """
    if not unit_id:
        return True

    unit = RentalUnit.objects.filter(pk=unit_id).select_related('parent_property').first()
    if unit is None:
        return False

    role = get_canonical_role(user)

    if _is_staff_role(role):
        return True

    if role == 'landlord':
        return Organization.objects.filter(
            id=unit.organization_id, owner=user,
        ).exists()

    if role == 'caretaker':
        try:
            return user.caretaker_profile.property_assignments.filter(
                is_active=True,
                property_assignment_id=unit.parent_property_id,
            ).exists()
        except Exception:
            return False

    if role == 'tenant':
        return unit.tenancies.filter(
            tenant__user=user,
            status__in=['active', 'pending', 'notice_period'],
        ).exists()

    return False


def _non_staff_ticket_visibility(user, role) -> Q:
    """
    Shared list-endpoint visibility rule for non-staff roles (CARE-02/WR-03).

    Always includes the caller's own tickets. Caretakers additionally see
    tickets on units belonging to a property they hold an active
    `CaretakerPropertyAssignment` for; landlords additionally see tickets on
    units belonging to an organization they own. Any other role (tenant, or
    unrecognized) gets no additional branch.

    Mirror of `_user_can_view_ticket` below (per-instance version used by the
    detail endpoint) — if you change one, check the other so the list and
    detail endpoints cannot silently drift apart.
    """
    q = Q(created_by=user)

    if role == 'caretaker':
        q |= Q(
            unit__parent_property__caretaker_assignments__caretaker_profile__user=user,
            unit__parent_property__caretaker_assignments__is_active=True,
        )
    elif role == 'landlord':
        q |= Q(unit__organization__owner=user)

    return q


def _user_can_view_ticket(user, ticket) -> bool:
    """
    Shared detail-endpoint visibility rule for non-staff roles (CARE-02/WR-03).

    Per-instance mirror of `_non_staff_ticket_visibility` above — a ticket
    visible in the list must always be openable here, so both checks encode
    the identical three-branch rule (staff / own / assignment-or-ownership).
    If you change one, check the other.
    """
    role = get_canonical_role(user)

    if _is_staff_role(role):
        return True

    if ticket.created_by_id == user.id:
        return True

    if ticket.unit_id is None:
        return False

    if role == 'caretaker':
        try:
            return user.caretaker_profile.property_assignments.filter(
                is_active=True,
                property_assignment_id=ticket.unit.parent_property_id,
            ).exists()
        except Exception:
            return False

    if role == 'landlord':
        return Organization.objects.filter(
            id=ticket.unit.organization_id, owner=user,
        ).exists()

    return False


class SupportTicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_canonical_role(request.user)
        qs = SupportTicket.objects.select_related('created_by', 'assigned_to', 'unit', 'unit__parent_property')

        if not _is_staff_role(role):
            qs = qs.filter(_non_staff_ticket_visibility(request.user, role)).distinct()

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(SupportTicketSerializer(qs, many=True).data)

    def post(self, request):
        subject = request.data.get('subject', '').strip()
        description = request.data.get('description', '').strip()
        category = request.data.get('category', 'general')
        priority = request.data.get('priority', 'medium')
        unit_id = request.data.get('unit') or None

        if not subject or not description:
            return Response(
                {'detail': 'Subject and description are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if category not in dict(SupportTicket.CATEGORY_CHOICES):
            return Response({'detail': 'Invalid category.'}, status=status.HTTP_400_BAD_REQUEST)
        if priority not in dict(SupportTicket.PRIORITY_CHOICES):
            return Response({'detail': 'Invalid priority.'}, status=status.HTTP_400_BAD_REQUEST)
        if unit_id and not _user_can_access_unit(request.user, unit_id):
            return Response(
                {'detail': 'Unit not found or not accessible.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket = SupportTicket.objects.create(
            created_by=request.user,
            organization_id=_user_organization_id(request.user),
            subject=subject,
            description=description,
            category=category,
            priority=priority,
            unit_id=unit_id,
        )
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class SupportTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_ticket(self, request, pk):
        ticket = get_object_or_404(
            SupportTicket.objects.select_related(
                'created_by', 'assigned_to', 'unit', 'unit__parent_property',
            ).prefetch_related('messages__author'),
            pk=pk,
        )
        if not _user_can_view_ticket(request.user, ticket):
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
