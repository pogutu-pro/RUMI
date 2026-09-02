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
from rent.providers.base import PaymentProviderError

from .models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from .serializers import (
    AdminOrganizationBillingDetailSerializer,
    AdminOrganizationBillingListSerializer,
    OrganizationSubscriptionSerializer,
    SubscriptionPlanSerializer,
)
from .services.gating_service import GatingService
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
        except PaymentProviderError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

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
        except (ValueError, ValidationError):
            # A super_admin-supplied organization_id that isn't a valid UUID
            # otherwise raises unhandled from Django's UUID field parsing.
            return Response({'error': 'Invalid organization_id'}, status=status.HTTP_400_BAD_REQUEST)

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
        except PaymentProviderError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(result, status=status.HTTP_200_OK)


def _build_admin_billing_detail(organization: Organization) -> dict:
    """
    Shared payload builder for the admin detail GET and the override POST's
    response — guarantees a post-override refresh returns the identical
    shape as a plain detail fetch.
    """
    effective_plan = GatingService.get_effective_plan(organization)
    last_charge = (
        SubscriptionPayment.objects.filter(subscription__organization=organization)
        .order_by('-initiated_at', '-id')
        .first()
    )
    return {
        'organization': organization,
        'subscription': getattr(organization, 'subscription', None),
        'effective_plan': effective_plan,
        'payout': getattr(organization, 'payout_account', None),
        'last_charge_event': last_charge,
    }


class AdminOrganizationBillingListView(APIView):
    """
    GET -> every organization's plan/status/payout inline (ADMIN-01 read,
    ADMIN-02), super_admin only. Optionally filtered by ?search=<name
    icontains>, ordered deterministically by name then id (stable tiebreak
    on identical names).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        qs = Organization.objects.select_related(
            'subscription__plan', 'payout_account'
        ).order_by('name', 'id')

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)

        rows = []
        for org in qs:
            subscription = getattr(org, 'subscription', None)
            payout_account = getattr(org, 'payout_account', None)
            rows.append({
                'id': org.id,
                'name': org.name,
                'slug': org.slug,
                'subscription_status': subscription.status if subscription else None,
                'plan_name': subscription.plan.name if subscription else None,
                'plan_slug': subscription.plan.slug if subscription else None,
                'payout_status': payout_account.status if payout_account else 'not_started',
            })

        return Response(AdminOrganizationBillingListSerializer(rows, many=True).data)


class AdminOrganizationBillingDetailView(APIView):
    """
    GET -> super_admin-only joined billing record for a single organization
    (ADMIN-01 read, ADMIN-02): raw subscription fields, the GatingService-
    computed effective plan, masked payout status, and the most-recent
    SubscriptionPayment row as "last charge event".
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        try:
            organization = Organization.objects.select_related(
                'subscription__plan', 'payout_account'
            ).get(pk=pk)
        except (Organization.DoesNotExist, ValueError, ValidationError):
            return Response({'detail': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = _build_admin_billing_detail(organization)
        return Response(AdminOrganizationBillingDetailSerializer(payload).data)
