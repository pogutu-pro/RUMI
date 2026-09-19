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

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import log_audit
from core.permissions.rumia import OrganizationScopedMixin, get_canonical_role
from organizations.models import Organization
from rent.providers.base import PaymentProviderError
from support.models import SupportTicket

from .models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from .providers.paystack_billing import PaystackBillingClient
from .serializers import (
    AdminOrganizationBillingDetailSerializer,
    AdminPlanSerializer,
    AdminOrganizationBillingListSerializer,
    OrganizationSubscriptionSerializer,
    SubscriptionPlanSerializer,
)
from .services.admin_override_service import AdminOverrideService
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

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)

        rows = []
        for org in page:
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

        return paginator.get_paginated_response(
            AdminOrganizationBillingListSerializer(rows, many=True).data
        )


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


class AdminSubscriptionOverrideView(APIView):
    """
    POST -> super_admin-only manual override of an organization's
    subscription plan and/or status, never via SubscriptionService, never
    calling Paystack (D-05). Every override requires a non-empty `reason`
    and is audit-logged (D-05a).

    Deliberately does NOT subclass or call `_BillingMutationView`'s
    landlord-permitting `_resolve_organization` — this endpoint is
    super_admin-only, full stop.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        try:
            organization = Organization.objects.get(pk=pk)
        except (Organization.DoesNotExist, ValueError, ValidationError):
            return Response({'detail': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)

        # Explicit allow-list — never **request.data — so paystack_* /
        # billing_mode / any other field can never reach the service layer.
        reason = (request.data.get('reason') or '').strip()
        plan_id = request.data.get('plan_id')
        new_status = request.data.get('status')

        plan = None
        if plan_id is not None:
            try:
                plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            except PLAN_LOOKUP_ERRORS:
                return Response({'error': 'Invalid plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        if new_status is not None and new_status not in dict(OrganizationSubscription.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            AdminOverrideService.override_subscription(
                organization, plan=plan, status=new_status, reason=reason, actor=request.user,
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        payload = _build_admin_billing_detail(organization)
        return Response(AdminOrganizationBillingDetailSerializer(payload).data)


class AdminRevenueSummaryView(APIView):
    """
    GET -> platform-wide revenue summary, super_admin only. Real numbers
    from SubscriptionPayment (the actual payment ledger) and
    OrganizationSubscription — never estimated or fabricated. Distinct from
    AdminOrganizationBillingListView, which shows each org's own
    status/payout, not what the *platform* has actually earned.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        successful_payments = SubscriptionPayment.objects.filter(status='success')

        total_revenue = successful_payments.aggregate(total=Sum('amount'))['total'] or 0

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        revenue_this_month = successful_payments.filter(
            paid_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # MRR: sum of the plan price for every currently-active subscription.
        # All plans bill monthly today (SubscriptionPlan.interval defaults
        # to 'monthly' and nothing else seeds a different interval), so this
        # is a direct sum, not a normalized-to-monthly estimate.
        active_subscriptions = OrganizationSubscription.objects.filter(
            status='active'
        ).select_related('plan')
        mrr = sum((sub.plan.price for sub in active_subscriptions), start=0)

        # Last 12 months of successful-payment revenue, oldest first — a
        # simple trend, not a forecast.
        twelve_months_ago = (month_start - timezone.timedelta(days=365)).replace(day=1)
        monthly = (
            successful_payments.filter(paid_at__gte=twelve_months_ago)
            .annotate(month=TruncMonth('paid_at'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )

        return Response({
            'total_revenue': total_revenue,
            'revenue_this_month': revenue_this_month,
            'mrr': mrr,
            'active_subscriptions_count': active_subscriptions.count(),
            'total_successful_payments': successful_payments.count(),
            'monthly_revenue': [
                {'month': row['month'].date().isoformat(), 'total': row['total']}
                for row in monthly
            ],
        })


class AdminPlatformOverviewView(APIView):
    """
    GET -> single-call platform snapshot for the super-admin Overview page:
    every user broken down by role, every organization, open support
    tickets, and the same revenue figures AdminRevenueSummaryView computes
    (kept in sync here rather than making the frontend fire two requests
    for one landing page).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        User = get_user_model()
        role_counts = dict(
            User.objects.values_list('role').annotate(count=Count('id')).order_by()
        )
        total_users = sum(role_counts.values())

        successful_payments = SubscriptionPayment.objects.filter(status='success')
        total_revenue = successful_payments.aggregate(total=Sum('amount'))['total'] or 0

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        revenue_this_month = successful_payments.filter(
            paid_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        active_subscriptions = OrganizationSubscription.objects.filter(status='active')
        mrr = sum((sub.plan.price for sub in active_subscriptions.select_related('plan')), start=0)

        ticket_counts = dict(
            SupportTicket.objects.values_list('status').annotate(count=Count('id')).order_by()
        )
        open_tickets = ticket_counts.get('open', 0) + ticket_counts.get('in_progress', 0)

        return Response({
            'total_users': total_users,
            'users_by_role': role_counts,
            'total_organizations': Organization.objects.count(),
            'total_revenue': total_revenue,
            'revenue_this_month': revenue_this_month,
            'mrr': mrr,
            'paying_organizations': active_subscriptions.count(),
            'open_support_tickets': open_tickets,
            'total_support_tickets': sum(ticket_counts.values()),
        })


class BillingAccessView(APIView):
    """
    GET -> what the caller's organization may use right now: the effective
    plan, and whether that is the free new-landlord trial (and when it ends).
    Powers the trial banner. Own organization only, resolved server-side.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from organizations.models import Organization

        if get_canonical_role(request.user) not in MUTATING_ROLES:
            return Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
        org_ids = _OrgResolver(request).get_user_organization_ids()
        organization = Organization.objects.filter(id__in=org_ids or []).order_by('created_at').first()
        if organization is None:
            return Response({'error': 'No organization found for this user'}, status=status.HTTP_404_NOT_FOUND)
        return Response(GatingService.get_access_summary(organization))


def _invalidate_public_plans_cache():
    """
    The anonymous plan list is cached by APIResponseCacheMiddleware for up to
    5 minutes, keyed only on the URL. Without this, a price a super admin has
    just changed would keep showing the old figure on the public site.
    """
    from rumi.cache_utils import api_cache

    for path in ('/api/v1/billing/plans/',):
        api_cache.cache_manager.delete(api_cache.cache_manager.get_cache_key('api', path, 'GET'))


class AdminPlanListView(APIView):
    """GET -> every tier with its price, limits, features and subscriber count. Super admin only."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        plans = SubscriptionPlan.objects.order_by('sort_order')
        return Response(AdminPlanSerializer(plans, many=True).data)


class AdminPlanDetailView(APIView):
    """
    PATCH -> edit a tier's name, price, limits and feature switches.

    The change is saved first and is audit-logged. Paystack is then updated so
    that NEW subscribers are charged the new amount; if that call cannot be
    made the save still stands and the response says so, rather than the admin
    thinking a price is live when Paystack disagrees.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            plan = SubscriptionPlan.objects.get(pk=pk)
        except (SubscriptionPlan.DoesNotExist, ValueError, ValidationError):
            return Response({'detail': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        before = AdminPlanSerializer(plan).data
        serializer = AdminPlanSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save()
        after = AdminPlanSerializer(plan).data

        changed = {k: {'from': str(before[k]), 'to': str(after[k])} for k in after if before.get(k) != after[k] and k != 'updated_at'}
        if changed:
            log_audit(
                'subscription_plan_updated', actor=request.user, entity=plan,
                old_value={k: str(v['from']) for k, v in changed.items()},
                new_value={k: str(v['to']) for k, v in changed.items()},
                metadata={'plan': plan.slug},
            )
        _invalidate_public_plans_cache()

        paystack = self._sync_paystack(plan, name_or_price_changed=('name' in changed or 'price' in changed))
        return Response({**after, 'paystack_sync': paystack})

    @staticmethod
    def _sync_paystack(plan, name_or_price_changed: bool) -> dict:
        if not name_or_price_changed:
            return {'status': 'not_needed'}
        if not plan.paystack_plan_code:
            return {
                'status': 'skipped',
                'detail': 'Saved. This tier is not linked to a Paystack plan yet, so automatic billing '
                          'will use the new price once Paystack is connected.',
            }
        try:
            PaystackBillingClient().update_plan(plan.paystack_plan_code, plan.name, plan.price)
        except PaymentProviderError as exc:
            return {'status': 'failed', 'detail': f'Saved, but Paystack was not updated: {exc}'}
        return {'status': 'updated', 'detail': 'Paystack updated. Existing subscribers keep their current price.'}
