"""
Organizations API views — landlord payout-account status and bank-details
submission.

Trust boundary (see this plan's threat model, T-02-01/T-02-03): mutating the
PayoutAccount is restricted to the Organization's owner ONLY (D-08) — no
`super_admin` override, unlike billing, and no `OrganizationMembership` role
bypass. For any non-super_admin caller, the served organization is always
resolved from the authenticated session, never from client input.
"""
from __future__ import annotations

from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.rumia import IsOrganizationOwner, OrganizationScopedMixin, get_canonical_role
from rent.providers.base import PaymentProviderError

from .models import Organization, PayoutAccount
from .serializers import PayoutAccountSerializer, PayoutBankDetailsInputSerializer
from .services.payout_service import PayoutService

NOT_STARTED_RESPONSE = {
    'status': 'not_started',
    'account_name': '',
    'bank_name': '',
    'bank_account_number_masked': '',
    'last_verified_at': None,
    'updated_at': None,
}


class _OrgResolver(OrganizationScopedMixin):
    """
    Thin shim so `get_user_organization_ids()` can be reused outside a
    ViewSet context, without duplicating its Q-filter. Duplicated per-app
    (see billing.views._OrgResolver) since it's a tiny non-Q-filter-
    duplicating shim, not shared logic.
    """

    def __init__(self, request):
        self.request = request


class PayoutAccountView(APIView):
    """GET -> payout status (read-only). POST -> owner-only bank-details submit/edit."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_canonical_role(request.user)

        if role == 'super_admin':
            org_id = request.query_params.get('organization_id')
            if not org_id:
                return Response(
                    {'error': 'organization_id is required for super_admin'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif role == 'landlord':
            org_ids = _OrgResolver(request).get_user_organization_ids()
            if not org_ids:
                return Response(
                    {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
                )
            org_id = org_ids[0]
        else:
            # Bank details (account_name, bank_name, masked account number)
            # are landlord-sensitive — not exposed to tenants/caretakers,
            # matching the owner-only trust boundary this endpoint mutates
            # under (see module docstring).
            return Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        try:
            payout_account = PayoutAccount.objects.filter(organization_id=org_id).first()
        except (ValueError, ValidationError):
            return Response({'error': 'Invalid organization_id'}, status=status.HTTP_400_BAD_REQUEST)

        if payout_account is None:
            return Response(NOT_STARTED_RESPONSE, status=status.HTTP_200_OK)

        return Response(PayoutAccountSerializer(payout_account).data)

    def post(self, request):
        role = get_canonical_role(request.user)
        if role != 'landlord':
            return Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        org_ids = _OrgResolver(request).get_user_organization_ids()
        if not org_ids:
            return Response(
                {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            organization = Organization.objects.get(id=org_ids[0])
        except (Organization.DoesNotExist, ValueError, ValidationError):
            return Response(
                {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
            )

        if not IsOrganizationOwner().has_object_permission(request, self, organization):
            return Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        input_serializer = PayoutBankDetailsInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        try:
            payout_account = PayoutService.submit_bank_details(
                organization, actor=request.user, **input_serializer.validated_data,
            )
        except PaymentProviderError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(PayoutAccountSerializer(payout_account).data, status=status.HTTP_200_OK)
