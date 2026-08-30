"""
Billing API views — public plan catalog plus landlord/super_admin subscribe
and switch-plan endpoints.

Trust boundary (see this plan's threat model, T-01-01/T-01-02): mutating
endpoints reject any caller whose canonical role is not landlord or
super_admin. For a landlord, the organization is ALWAYS resolved server-side
from `request.user` — an `organization_id` is never accepted from the
request body, so a landlord can never act on another organization's
subscription. `super_admin` has no organization of their own, so — mirroring
the read-only `MyOrganizationSubscriptionView` pattern — they must supply an
explicit `organization_id` to act on behalf of that organization.
"""
from __future__ import annotations

from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.rumia import OrganizationScopedMixin, get_canonical_role
from organizations.models import Organization

from .models import OrganizationSubscription, SubscriptionPlan
from .serializers import OrganizationSubscriptionSerializer, SubscriptionPlanSerializer
from .services.subscription_service import SubscriptionService

MUTATING_ROLES = ('landlord', 'super_admin')

# Errors raised when the caller supplies an invalid/unresolvable plan id.
PLAN_LOOKUP_ERRORS = (SubscriptionPlan.DoesNotExist, ValueError, ValidationError)


class SubscriptionPlanListView(APIView):
    """Public plan catalog — no auth required."""

    permission_classes = [AllowAny]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('sort_order')
        return Response(SubscriptionPlanSerializer(plans, many=True).data)


class _OrgResolver(OrganizationScopedMixin):
    """
    Thin shim so `get_user_organization_ids()` can be reused outside a
    ViewSet context, without duplicating its Q-filter.
    """

    def __init__(self, request):
        self.request = request


class _BillingMutationView(APIView):
    """Shared auth/role/org-resolution for billing mutation endpoints."""

    permission_classes = [IsAuthenticated]

    def _resolve_organization(self, request):
        role = get_canonical_role(request.user)
        if role not in MUTATING_ROLES:
            return None, Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        if role == 'super_admin':
            # super_admin has no organization of their own — the read-only
            # get_user_organization_ids() correctly returns None (unrestricted)
            # for this role, which would otherwise always 404 here. Mirror
            # MyOrganizationSubscriptionView's pattern: require an explicit
            # organization_id to act on behalf of that organization.
            org_id = request.data.get('organization_id')
            if not org_id:
                return None, Response(
                    {'error': 'organization_id is required for super_admin'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                organization = Organization.objects.get(id=org_id)
            except (Organization.DoesNotExist, ValueError, ValidationError):
                return None, Response(
                    {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
                )
            return organization, None

        org_ids = _OrgResolver(request).get_user_organization_ids()
        if not org_ids:
            return None, Response(
                {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
            )

        organization = Organization.objects.filter(id__in=org_ids).first()
        if organization is None:
            return None, Response(
                {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
            )
        return organization, None


class SubscriptionSubscribeView(_BillingMutationView):
    """POST {plan_id, billing_mode} -> subscribe the caller's organization."""

    def post(self, request):
        organization, error_response = self._resolve_organization(request)
        if error_response:
            return error_response

        plan_id = request.data.get('plan_id')
        billing_mode = request.data.get('billing_mode', 'auto')

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except PLAN_LOOKUP_ERRORS:
            return Response({'error': 'Invalid plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = SubscriptionService.subscribe(
                organization=organization,
                plan=plan,
                billing_mode=billing_mode,
                requester_email=request.user.email,
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class MyOrganizationSubscriptionView(APIView):
    """
    GET -> the caller's own OrganizationSubscription status (read-only).

    A landlord's own organization is always resolved server-side and any
    `organization_id` query param they supply is ignored — a landlord can
    never see another organization's subscription this way. `super_admin`
    is the only role permitted to target another organization via that
    query param (mirrors the pattern in `rumia_api.views.IncomeSummaryView`).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_canonical_role(request.user)
        if role not in MUTATING_ROLES:
            return Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        if role == 'super_admin':
            org_id = request.query_params.get('organization_id')
            if not org_id:
                return Response(
                    {'error': 'organization_id is required for super_admin'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            org_ids = _OrgResolver(request).get_user_organization_ids()
            if not org_ids:
                return Response(
                    {'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND
                )
            org_id = org_ids[0]

        try:
            subscription = OrganizationSubscription.objects.select_related('plan').get(
                organization_id=org_id
            )
        except OrganizationSubscription.DoesNotExist:
            return Response({'error': 'No subscription found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(OrganizationSubscriptionSerializer(subscription).data)


class SubscriptionSwitchPlanView(_BillingMutationView):
    """POST {new_plan_id} -> switch the caller's organization to a new plan."""

    def post(self, request):
        organization, error_response = self._resolve_organization(request)
        if error_response:
            return error_response

        new_plan_id = request.data.get('new_plan_id')

        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
        except PLAN_LOOKUP_ERRORS:
            return Response({'error': 'Invalid new_plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = SubscriptionService.switch_plan(
                organization=organization,
                new_plan=new_plan,
                requester_email=request.user.email,
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)
