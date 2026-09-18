from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.rumia import get_canonical_role

from .models import AuditLog


class AuditLogPagination(PageNumberPagination):
    page_size = 50


class AdminAuditLogListView(APIView):
    """
    GET -> platform-wide audit trail, super_admin only. AuditLog rows are
    written by audit.models.log_audit() throughout the codebase (payments,
    tenancy changes, subscription events, permission changes, ...) but had
    no admin-facing view until now — this is read-only, the log itself is
    immutable by design.

    Optional filters: ?action=<AuditLog.ACTION_CHOICES value>,
    ?organization_id=<uuid>.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        qs = AuditLog.objects.select_related('actor', 'organization').order_by('-created_at')

        action = request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)

        organization_id = request.query_params.get('organization_id')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)

        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(qs, request, view=self)

        rows = [
            {
                'id': str(entry.id),
                'action': entry.action,
                'actor_email': entry.actor.email if entry.actor else None,
                'organization_name': entry.organization.name if entry.organization else None,
                'entity_type': entry.entity_type,
                'entity_id': entry.entity_id,
                'metadata': entry.metadata,
                'ip_address': entry.ip_address,
                'created_at': entry.created_at,
            }
            for entry in page
        ]

        return paginator.get_paginated_response(rows)
