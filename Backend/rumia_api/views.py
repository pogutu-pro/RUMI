"""RUMIA canonical API views — organization-scoped."""

import logging
import uuid
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import log_audit
from billing.services.gating_service import GatingService
from core.permissions.rumia import (
    CanAccessProperty,
    CanAccessTenantProfile,
    CanViewFinancials,
    OrganizationScopedMixin,
    get_canonical_role,
)
from organizations.models import Organization, OrganizationMembership
from properties.models import CaretakerPropertyAssignment, Property, RentalUnit, Tenancy
from rent.models import Payment, RentCharge
from rent.services.income_flow import IncomeFlowService
from rent.services.payment_service import PaymentService
from rent.services.rent_generation import RentChargeGenerationService
from rumia_api.serializers import (
    CaretakerCreateSerializer,
    CaretakerSerializer,
    EmergencyContactSerializer,
    ManualPaymentSerializer,
    OrganizationCreateInputSerializer,
    OrganizationSerializer,
    PaymentInitiateSerializer,
    PaymentSerializer,
    PropertySerializer,
    RentalUnitSerializer,
    RentChargeSerializer,
    TenancySerializer,
    TenancyTerminateSerializer,
    TenantProfileSerializer,
)
from tenants.models import TenantProfile
from tenants.services import onboard_tenant_user, save_emergency_contacts

logger = logging.getLogger(__name__)


class RumiaBaseView(OrganizationScopedMixin, APIView):
    permission_classes = [IsAuthenticated]
    organization_lookup = 'organization'


def _caretaker_can(user, flag: str) -> bool:
    try:
        return bool(user.caretaker_profile.permissions.get(flag, False))
    except Exception:
        return False


def _sync_unit_status(tenancy: Tenancy) -> None:
    """Keep RentalUnit.status consistent with whether it has an active tenancy."""
    unit = tenancy.unit
    if tenancy.status == 'active':
        if unit.status != 'occupied':
            unit.status = 'occupied'
            unit.save(update_fields=['status', 'updated_at'])
    else:
        still_active = unit.tenancies.filter(status='active').exclude(pk=tenancy.pk).exists()
        if not still_active and unit.status == 'occupied':
            unit.status = 'vacant'
            unit.save(update_fields=['status', 'updated_at'])


class OrganizationListView(APIView):
    """Super-admin only: list every organization, for the cross-org dashboard switcher.

    POST is a separate role branch (landlord-only): the landlord onboarding
    wizard's org-creation step, idempotent per-landlord.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        qs = Organization.objects.all().order_by('name')
        return Response(OrganizationSerializer(qs, many=True).data)

    def post(self, request):
        from accounts.models import User

        role = get_canonical_role(request.user)
        if role != 'landlord':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrganizationCreateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # WR-04: lock the requesting user's row so two concurrent POSTs from
        # the same landlord (double-click on "Continue", or a retried
        # request after a timeout) serialize instead of both reading
        # `existing is None` and both creating an org — mirrors the
        # select_for_update pattern already applied elsewhere in this file
        # (see the CR-02 comments on CaretakerListCreateView/
        # PropertyListCreateView/RentalUnitListCreateView).
        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)

            existing = Organization.objects.filter(owner=request.user).first()
            if existing:
                # Idempotent — the wizard's org step may be resubmitted on
                # resume; never create a second org for the same landlord.
                return Response(OrganizationSerializer(existing).data, status=status.HTTP_200_OK)

            org = Organization.objects.create(owner=request.user, **serializer.validated_data)
            OrganizationMembership.objects.create(
                organization=org, user=request.user, role='owner', is_active=True,
            )
            log_audit('organization_created', actor=request.user, organization=org, entity=org)

        return Response(OrganizationSerializer(org).data, status=status.HTTP_201_CREATED)


class CaretakerListCreateView(RumiaBaseView):
    """Landlord/super_admin: list and add caretakers for their organization."""

    def get(self, request):
        from accounts.models import CaretakerProfile

        org_ids = self.get_user_organization_ids()
        qs = CaretakerProfile.objects.select_related('user').prefetch_related(
            'property_assignments__property_assignment'
        )
        if org_ids is not None:  # None means super_admin — unrestricted
            from organizations.models import OrganizationMembership
            member_user_ids = OrganizationMembership.objects.filter(
                organization_id__in=org_ids, role='caretaker', is_active=True,
            ).values_list('user_id', flat=True)
            qs = qs.filter(user_id__in=member_user_ids)

        return Response(CaretakerSerializer(qs, many=True).data)

    def post(self, request):
        from django.db import transaction

        from accounts.models import CaretakerProfile, User
        from accounts.services import onboard_caretaker_user
        from organizations.models import OrganizationMembership

        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        org = self._resolve_organization(request)
        if not org:
            return Response({'detail': 'Organization required'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CaretakerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if User.objects.filter(email=data['email']).exists():
            return Response(
                {'detail': 'A user with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name_parts = data['full_name'].strip().split(' ', 1)
        first_name = name_parts[0] if name_parts else data['full_name']
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # CR-02: the gate check now runs inside the same locked transaction
        # as the seat-consuming write (OrganizationMembership create) —
        # select_for_update() on the org row serializes concurrent POSTs so
        # they can no longer all read the same pre-creation seat count and
        # all pass the max_caretaker_seats gate.
        with transaction.atomic():
            org = Organization.objects.select_for_update().get(pk=org.pk)
            gate_error = GatingService.check_caretaker_seat_limit(org)
            if gate_error:
                return Response(gate_error, status=status.HTTP_403_FORBIDDEN)

            user = User.objects.create_user(
                email=data['email'],
                password=None,
                first_name=first_name,
                last_name=last_name,
                role='caretaker',
                phone_number=data['phone'],
            )
            caretaker_profile = CaretakerProfile.objects.create(
                user=user,
                created_by=request.user,
                emergency_contact_name=data['emergency_contact_name'],
                emergency_contact_phone=data['emergency_contact_phone'],
                permissions=data.get('permissions') or {},
            )
            OrganizationMembership.objects.get_or_create(
                organization=org, user=user, defaults={'role': 'caretaker'},
            )

            property_ids = data.get('property_ids') or []
            if property_ids:
                properties = Property.objects.filter(id__in=property_ids, organization=org)
                for prop in properties:
                    CaretakerPropertyAssignment.objects.get_or_create(
                        caretaker_profile=caretaker_profile,
                        property_assignment=prop,
                        organization=org,
                    )

        onboard_caretaker_user(caretaker_profile)
        log_audit('caretaker_created', actor=request.user, organization=org, entity=caretaker_profile)

        caretaker_profile = CaretakerProfile.objects.select_related('user').prefetch_related(
            'property_assignments__property_assignment'
        ).get(pk=caretaker_profile.pk)
        return Response(CaretakerSerializer(caretaker_profile).data, status=status.HTTP_201_CREATED)

    def _resolve_organization(self, request):
        # CR-03: verify the caller actually belongs to the client-supplied
        # organization_id before trusting it — mirrors the membership check
        # already used correctly in IncomeSummaryView.get (views.py). Without
        # this, any authenticated landlord who knows/guesses another org's
        # UUID could create caretakers inside that org.
        org_id = request.data.get('organization_id')
        if org_id:
            org_ids = self.get_user_organization_ids()
            if org_ids is not None and str(org_id) not in [str(i) for i in org_ids]:
                return None
            return Organization.objects.filter(id=org_id).first()
        return Organization.objects.filter(owner=request.user).first()


class PropertyListCreateView(RumiaBaseView):
    property_lookup = 'id'

    def get(self, request):
        qs = self.filter_by_organization(Property.objects.all())
        return Response(PropertySerializer(qs, many=True).data)

    def post(self, request):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        org = self._resolve_organization(request)
        if not org:
            return Response({'detail': 'Organization required'}, status=status.HTTP_400_BAD_REQUEST)

        # CR-02: lock the organization row for the duration of the
        # check-then-create sequence — otherwise concurrent POSTs all read
        # the same pre-creation count, all pass the gate, and all commit,
        # permanently exceeding the plan's max_properties cap.
        with transaction.atomic():
            org = Organization.objects.select_for_update().get(pk=org.pk)
            gate_error = GatingService.check_property_limit(org)
            if gate_error:
                return Response(gate_error, status=status.HTTP_403_FORBIDDEN)

            serializer = PropertySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            prop = serializer.save(organization=org)
        log_audit('property_created', actor=request.user, organization=org, entity=prop)
        return Response(PropertySerializer(prop).data, status=status.HTTP_201_CREATED)

    def _resolve_organization(self, request):
        # CR-03: verify the caller actually belongs to the client-supplied
        # organization_id before trusting it — mirrors the membership check
        # already used correctly in IncomeSummaryView.get (views.py). Without
        # this, any authenticated landlord who knows/guesses another org's
        # UUID could create properties inside that org.
        org_id = request.data.get('organization_id')
        if org_id:
            org_ids = self.get_user_organization_ids()
            if org_ids is not None and str(org_id) not in [str(i) for i in org_ids]:
                return None
            return Organization.objects.filter(id=org_id).first()
        return Organization.objects.filter(owner=request.user).first()


class PropertyDetailView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanAccessProperty]

    def get_object(self, pk):
        return Property.objects.get(pk=pk)

    def get(self, request, pk):
        prop = self.get_object(pk)
        self.check_object_permissions(request, prop)
        return Response(PropertySerializer(prop).data)

    def patch(self, request, pk):
        prop = self.get_object(pk)
        self.check_object_permissions(request, prop)

        role = get_canonical_role(request.user)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_edit_properties'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'tenant':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PropertySerializer(prop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        old_status = prop.status
        serializer.save()
        log_audit(
            'property_updated', actor=request.user, organization=prop.organization, entity=prop,
            old_value={'status': old_status}, new_value={'status': prop.status},
        )
        return Response(PropertySerializer(prop).data)

    def delete(self, request, pk):
        """Archive, never hard-delete — a property with historical tenancies/payments must not disappear."""
        prop = self.get_object(pk)
        self.check_object_permissions(request, prop)

        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        prop.status = 'inactive'
        prop.save(update_fields=['status', 'updated_at'])
        log_audit('property_updated', actor=request.user, organization=prop.organization, entity=prop,
                   new_value={'status': 'inactive'})
        return Response(PropertySerializer(prop).data)


class RentalUnitListCreateView(RumiaBaseView):
    property_lookup = 'parent_property'

    def get(self, request):
        qs = self.filter_by_organization(RentalUnit.objects.select_related('parent_property'))
        property_id = request.query_params.get('property_id')
        if property_id:
            qs = qs.filter(parent_property_id=property_id)
        return Response(RentalUnitSerializer(qs, many=True).data)

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin', 'caretaker'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # WR-05: a missing/unknown/deleted `property` id previously raised
        # KeyError/DoesNotExist, which DRF's default exception handling
        # turns into an opaque 500 — surface a clean 400 instead.
        prop = Property.objects.filter(pk=request.data.get('property')).first()
        if not prop:
            return Response({'detail': 'Property not found'}, status=status.HTTP_400_BAD_REQUEST)
        if role == 'caretaker':
            if prop.id not in self.get_user_property_ids():
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        elif role != 'super_admin':
            org_ids = self.get_user_organization_ids()
            if prop.organization_id not in org_ids:
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # CR-02: lock the organization row for the duration of the
        # check-then-create sequence — see PropertyListCreateView.post for
        # the full rationale (same race, same fix, one org can own units
        # across multiple properties so the lock is on the org, not prop).
        with transaction.atomic():
            org = Organization.objects.select_for_update().get(pk=prop.organization_id)
            gate_error = GatingService.check_unit_limit(org)
            if gate_error:
                return Response(gate_error, status=status.HTTP_403_FORBIDDEN)

            serializer = RentalUnitSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            unit = serializer.save(organization=org, parent_property=prop)
        log_audit('unit_created', actor=request.user, organization=org, entity=unit)
        return Response(RentalUnitSerializer(unit).data, status=status.HTTP_201_CREATED)


class RentalUnitDetailView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanAccessProperty]

    def get_object(self, pk):
        return RentalUnit.objects.select_related('parent_property').get(pk=pk)

    def get(self, request, pk):
        unit = self.get_object(pk)
        self.check_object_permissions(request, unit)
        return Response(RentalUnitSerializer(unit).data)

    def patch(self, request, pk):
        """Also how a unit is marked vacant/occupied/under maintenance — PATCH status."""
        unit = self.get_object(pk)
        self.check_object_permissions(request, unit)

        role = get_canonical_role(request.user)
        if role == 'tenant':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_edit_properties'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        data = dict(request.data)
        if unit.active_tenancy and data.get('status') == 'vacant':
            return Response(
                {'detail': 'Unit has an active tenancy — terminate it first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RentalUnitSerializer(unit, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_audit('unit_updated', actor=request.user, organization=unit.organization, entity=unit)
        return Response(RentalUnitSerializer(unit).data)


class TenancyListCreateView(RumiaBaseView):
    property_lookup = 'parent_property'

    def get(self, request):
        qs = self.filter_by_organization(
            Tenancy.objects.select_related('tenant', 'unit', 'parent_property')
        )
        role = get_canonical_role(request.user)
        if role == 'tenant':
            qs = qs.filter(tenant__user=request.user)
        return Response(TenancySerializer(qs, many=True).data)

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin', 'caretaker'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # WR-05: missing/unknown/deleted `unit` or `tenant` ids
            # previously raised KeyError/DoesNotExist -> opaque 500;
            # `.filter().first()` + explicit 400 gives a clean, actionable
            # error instead (matches the validation-error style used
            # everywhere else in this file).
            unit = RentalUnit.objects.select_for_update().filter(pk=request.data.get('unit')).first()
            if not unit:
                return Response({'detail': 'Unit not found'}, status=status.HTTP_400_BAD_REQUEST)

            if role == 'caretaker' and unit.parent_property_id not in self.get_user_property_ids():
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            elif role != 'super_admin' and unit.organization_id not in self.get_user_organization_ids():
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

            tenant = TenantProfile.objects.filter(pk=request.data.get('tenant')).first()
            if not tenant:
                return Response({'detail': 'Tenant not found'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = TenancySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            new_status = serializer.validated_data.get('status', 'pending')

            if new_status == 'active' and unit.tenancies.filter(status='active').exists():
                return Response(
                    {'detail': 'This unit already has an active tenancy.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            tenancy = serializer.save(
                organization=unit.organization,
                parent_property=unit.parent_property,
                unit=unit,
                tenant=tenant,
                created_by=request.user,
            )
            _sync_unit_status(tenancy)

        log_audit('tenancy_created', actor=request.user, organization=unit.organization, entity=tenancy)
        # Outside the transaction — this is the point a tenant is actually tied to a
        # property, so it's when they should get their account + login invite.
        onboard_tenant_user(tenant, property_name=unit.parent_property.name)
        return Response(TenancySerializer(tenancy).data, status=status.HTTP_201_CREATED)


class TenancyDetailView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanAccessProperty]

    # Status transitions go through TenancyTerminateView, not a generic PATCH,
    # so the unit-vacancy/one-active-tenancy side effects always happen correctly.
    PATCHABLE_FIELDS = ('monthly_rent', 'deposit', 'rent_due_day', 'grace_period_days', 'prorate_final_period',
                        'end_date', 'renewal_notes', 'notes')

    def get_object(self, pk):
        return Tenancy.objects.select_related('tenant', 'unit', 'parent_property').get(pk=pk)

    def get(self, request, pk):
        tenancy = self.get_object(pk)
        self.check_object_permissions(request, tenancy)
        return Response(TenancySerializer(tenancy).data)

    def patch(self, request, pk):
        tenancy = self.get_object(pk)
        self.check_object_permissions(request, tenancy)

        role = get_canonical_role(request.user)
        if role == 'tenant':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_manage_tenants'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        data = {k: v for k, v in request.data.items() if k in self.PATCHABLE_FIELDS}
        serializer = TenancySerializer(tenancy, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_audit('tenancy_updated', actor=request.user, organization=tenancy.organization, entity=tenancy)
        return Response(TenancySerializer(tenancy).data)


class TenancyTerminateView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanAccessProperty]

    def post(self, request, pk):
        tenancy = Tenancy.objects.select_related('unit').get(pk=pk)
        self.check_object_permissions(request, tenancy)

        role = get_canonical_role(request.user)
        if role == 'tenant':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_manage_tenants'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        if tenancy.status in ('terminated', 'expired'):
            return Response({'detail': 'Tenancy is already ended.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TenancyTerminateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        move_out_date = serializer.validated_data.get('move_out_date', timezone.now().date())

        with transaction.atomic():
            tenancy.status = 'terminated'
            tenancy.end_date = move_out_date
            tenancy.move_out_date = move_out_date
            if 'renewal_notes' in serializer.validated_data:
                tenancy.renewal_notes = serializer.validated_data['renewal_notes']
            tenancy.save(update_fields=['status', 'end_date', 'move_out_date', 'renewal_notes', 'updated_at'])
            _sync_unit_status(tenancy)
            # Bill anything still owed up to the move-out date (prorated final period).
            RentChargeGenerationService.generate_for_tenancy(tenancy)

        log_audit('tenancy_terminated', actor=request.user, organization=tenancy.organization, entity=tenancy)
        return Response(TenancySerializer(tenancy).data)


class TenantListCreateView(RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_canonical_role(request.user)

        if role == 'caretaker':
            property_ids = self.get_user_property_ids()
            qs = TenantProfile.objects.filter(
                tenancies__unit__parent_property__in=property_ids,
            ).distinct()
        else:
            qs = self.filter_by_organization(TenantProfile.objects.all())
            if role == 'tenant':
                qs = qs.filter(user=request.user)

        return Response(TenantProfileSerializer(qs, many=True).data)

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin', 'caretaker'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_manage_tenants'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        org = Organization.objects.filter(owner=request.user).first()
        if not org:
            org_ids = self.get_user_organization_ids()
            org = Organization.objects.filter(id__in=org_ids).first() if org_ids else None
        if not org:
            return Response({'detail': 'Organization required'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TenantProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        emergency_contacts = serializer.validated_data.pop('emergency_contacts', [])
        profile = serializer.save(organization=org, created_by=request.user)
        if emergency_contacts:
            save_emergency_contacts(profile, emergency_contacts)
        log_audit('tenant_created', actor=request.user, organization=org, entity=profile)
        return Response(TenantProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class TenantDetailView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanAccessTenantProfile]

    def get_object(self, pk):
        return TenantProfile.objects.get(pk=pk)

    def get(self, request, pk):
        profile = self.get_object(pk)
        self.check_object_permissions(request, profile)
        data = TenantProfileSerializer(profile).data
        data['emergency_contacts'] = EmergencyContactSerializer(
            profile.emergency_contacts.all(), many=True,
        ).data
        return Response(data)

    def patch(self, request, pk):
        profile = self.get_object(pk)
        self.check_object_permissions(request, profile)

        role = get_canonical_role(request.user)
        if role == 'tenant':
            # Tenants may correct their own contact details, nothing else.
            allowed = {'phone', 'email', 'occupation', 'address'}
            data = {k: v for k, v in request.data.items() if k in allowed}
        else:
            data = request.data

        serializer = TenantProfileSerializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_audit('tenant_updated', actor=request.user, organization=profile.organization, entity=profile)
        return Response(TenantProfileSerializer(profile).data)


class RentChargeListView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]
    property_lookup = 'parent_property'

    def get(self, request):
        qs = self.filter_by_organization(
            RentCharge.objects.select_related('tenant', 'unit').prefetch_related('lines')
        )
        role = get_canonical_role(request.user)
        if role == 'tenant':
            qs = qs.filter(tenant__user=request.user)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(RentChargeSerializer(qs, many=True).data)


class RentBalanceView(RumiaBaseView):
    """Answers 'who owes me rent / how much do I owe' directly, with totals."""

    permission_classes = [IsAuthenticated, CanViewFinancials]
    property_lookup = 'parent_property'

    def get(self, request):
        qs = self.filter_by_organization(
            RentCharge.objects.select_related('tenant', 'unit').prefetch_related('lines')
            .exclude(status__in=['paid', 'waived'])
        )
        role = get_canonical_role(request.user)
        if role == 'tenant':
            qs = qs.filter(tenant__user=request.user)

        tenancy_id = request.query_params.get('tenancy_id')
        if tenancy_id:
            qs = qs.filter(tenancy_id=tenancy_id)

        charges = list(qs)
        outstanding_total = sum((c.outstanding for c in charges), Decimal('0.00'))
        overdue_total = sum((c.outstanding for c in charges if c.status == 'overdue'), Decimal('0.00'))

        # Tenant credit (overpayments / advance payments not yet applied),
        # within the same visibility scope as the charges above.
        credit_qs = self.filter_by_organization(
            Payment.objects.filter(status='success', unapplied_amount__gt=0)
        )
        if role == 'tenant':
            credit_qs = credit_qs.filter(tenant__user=request.user)
        if tenancy_id:
            credit_qs = credit_qs.filter(tenancy_id=tenancy_id)
        credit_total = sum((p.unapplied_amount for p in credit_qs), Decimal('0.00'))

        return Response({
            'outstanding_total': str(outstanding_total),
            'overdue_total': str(overdue_total),
            'credit_total': str(credit_total),
            'net_balance': str(outstanding_total - credit_total),
            'charges': RentChargeSerializer(charges, many=True).data,
        })


class RentChargeGenerateView(RumiaBaseView):
    """Manual trigger for the same generation the daily Celery task runs — useful for demos/MVP."""

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        org_id = request.data.get('organization_id')
        if not org_id:
            org_ids = self.get_user_organization_ids()
            org_id = org_ids[0] if org_ids else None
        if not org_id:
            return Response({'detail': 'Organization required'}, status=status.HTTP_400_BAD_REQUEST)
        if role != 'super_admin' and str(org_id) not in [str(i) for i in self.get_user_organization_ids()]:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        result = RentChargeGenerationService.generate_for_organization(org_id)
        return Response({'created': result.created, 'tenancies_up_to_date': result.skipped})


class PaymentListCreateView(RumiaBaseView):
    # Not CanViewFinancials at the class level: that permission restricts
    # tenants to safe (GET) methods only, which would also block the one
    # write action tenants are explicitly allowed — starting their own
    # payment. View/initiate authorization is enforced per-method below instead.
    permission_classes = [IsAuthenticated]
    property_lookup = 'parent_property'

    def get(self, request):
        if not CanViewFinancials().has_permission(request, self):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        qs = self.filter_by_organization(
            Payment.objects.select_related('tenant').order_by('-created_at')
        )
        role = get_canonical_role(request.user)
        if role == 'tenant':
            qs = qs.filter(tenant__user=request.user)
        return Response(PaymentSerializer(qs, many=True).data)

    def post(self, request):
        """Start a Paystack payment via PaymentService.initiate(). Status always starts 'pending' —
        the client can never set or claim a payment status; only the Paystack webhook can."""
        role = get_canonical_role(request.user)
        if role not in ('tenant', 'landlord', 'caretaker', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenancy = serializer.validated_data['tenancy']

        if role == 'tenant':
            if tenancy.tenant.user_id != request.user.id:
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        elif role != 'super_admin':
            if tenancy.organization_id not in self.get_user_organization_ids():
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        payment = Payment.objects.create(
            organization=tenancy.organization,
            tenancy=tenancy,
            tenant=tenancy.tenant,
            parent_property=tenancy.parent_property,
            unit=tenancy.unit,
            amount=serializer.validated_data['amount'],
            currency=serializer.validated_data['currency'],
            payment_method='paystack',
            provider='paystack',
            internal_reference=f'RUMIA-{uuid.uuid4().hex[:16].upper()}',
            recorded_by=request.user,
        )

        # Must match the Next.js route frontend/src/app/(tenant)/tenant/rental/payments/callback.
        # Paystack appends its own `trxref`/`reference` query params.
        callback_url = f'{settings.FRONTEND_URL}/tenant/rental/payments/callback?payment_id={payment.id}'
        result = PaymentService.initiate(payment, callback_url)

        if not result.get('success'):
            return Response(
                {'detail': 'Payment could not be started.', 'error': result.get('error'),
                 'required_env_vars': result.get('required_env_vars', [])},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        log_audit('payment_recorded', actor=request.user, organization=tenancy.organization, entity=payment,
                   metadata={'action': 'initiated'})
        return Response({
            'payment_id': str(payment.id),
            'internal_reference': payment.internal_reference,
            'authorization_url': result.get('authorization_url', ''),
            'status': 'processing',
        }, status=status.HTTP_201_CREATED)


class ManualPaymentView(RumiaBaseView):
    """Cash/bank payments recorded by a landlord or permitted caretaker — never provider-verified."""

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin', 'caretaker'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_record_payments'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ManualPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenancy = serializer.validated_data['tenancy']

        if role != 'super_admin' and tenancy.organization_id not in self.get_user_organization_ids():
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and tenancy.parent_property_id not in self.get_user_property_ids():
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        allocations = None
        rent_charge = serializer.validated_data.get('rent_charge_id')
        if rent_charge:
            allocations = [{'invoice_id': rent_charge.id, 'amount': serializer.validated_data['amount']}]

        try:
            # One transaction: a rejected allocation must not leave an orphan payment row.
            with transaction.atomic():
                payment = Payment.objects.create(
                    organization=tenancy.organization,
                    tenancy=tenancy,
                    tenant=tenancy.tenant,
                    parent_property=tenancy.parent_property,
                    unit=tenancy.unit,
                    amount=serializer.validated_data['amount'],
                    payment_method=serializer.validated_data['payment_method'],
                    provider='manual',
                    internal_reference=f'RUMIA-MANUAL-{uuid.uuid4().hex[:16].upper()}',
                    notes=serializer.validated_data.get('notes', ''),
                    recorded_by=request.user,
                )
                payment = PaymentService.record_manual_payment(
                    payment, allocations=allocations, verified_by=request.user,
                )
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        log_audit('payment_recorded', actor=request.user, organization=tenancy.organization, entity=payment,
                   metadata={'action': 'manual'})
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaystackWebhookView(APIView):
    """
    No authentication — Paystack calls this directly. Trust nothing in the body;
    the signature proves the request came from Paystack, and PaymentService
    re-verifies the actual transaction status with Paystack's API before
    ever touching a Payment/RentCharge row.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        import hashlib
        import hmac as hmac_module

        secret = (getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', '') or '').encode()
        signature = request.headers.get('x-paystack-signature', '')

        if not secret or not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

        computed = hmac_module.new(secret, request.body, hashlib.sha512).hexdigest()
        if not hmac_module.compare_digest(computed, signature):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data
        event = payload.get('event')
        data = payload.get('data', {})
        reference = data.get('reference')

        if event == 'charge.success' and reference:
            try:
                payment = Payment.objects.get(internal_reference=reference)
            except Payment.DoesNotExist:
                payment = None

            if payment is not None:
                payment = PaymentService.verify_and_allocate(payment, raw_callback=payload)

                if payment.status == 'success':
                    # The tenant is notified by the receipt issued in
                    # PaymentService (SMS + emailed PDF), after commit.
                    log_audit('payment_recorded', organization=payment.organization, entity=payment,
                               metadata={'action': 'webhook_verified'})

                return Response({'status': 'processed', 'payment_status': payment.status})

        # Not a rent-payment reference (unmatched, or the event isn't
        # charge.success at all) — the only other consumer of this single
        # physical webhook URL is the billing/subscription domain. Paystack
        # never calls a second endpoint for subscription.*/invoice.* events.
        try:
            from billing.services.webhook import handle_billing_event
            result = handle_billing_event(payload)
        except Exception:
            # Never surface a 5xx to Paystack over a malformed/unrecognized
            # billing event — same "ignored -> 200" philosophy as the
            # unmatched-rent-reference case above.
            logger.exception('Billing webhook dispatch failed for event=%s', event)
            result = {'status': 'error'}

        return Response(result, status=status.HTTP_200_OK)


class IncomeSummaryView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]

    def get(self, request):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        org_ids = self.get_user_organization_ids()
        if not org_ids:
            return Response({'detail': 'No organization'}, status=status.HTTP_404_NOT_FOUND)

        org_id = request.query_params.get('organization_id', org_ids[0])
        if str(org_id) not in [str(i) for i in org_ids] and get_canonical_role(request.user) != 'super_admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # WR-02: super_admin's org_id isn't checked against a known-valid
        # set above (the membership guard is skipped for that role), so a
        # non-existent organization_id must 404 cleanly instead of letting
        # Organization.DoesNotExist propagate into an opaque 500 (DRF's
        # exception_handler doesn't map bare Model.DoesNotExist to 404).
        org = Organization.objects.filter(id=org_id).first()
        if org is None:
            return Response({'detail': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        gate_error = GatingService.check_analytics_feature(org)
        if gate_error:
            return Response(gate_error, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        period_start = date.fromisoformat(
            request.query_params.get('period_start', today.replace(day=1).isoformat())
        )
        period_end = date.fromisoformat(
            request.query_params.get('period_end', today.isoformat())
        )

        report = IncomeFlowService.for_organization(org_id, period_start, period_end)
        return Response({
            'organization_id': report.organization_id,
            'period_start': report.period_start.isoformat(),
            'period_end': report.period_end.isoformat(),
            'summary': {
                'expected_rent': str(report.summary.expected_rent),
                'collected_rent': str(report.summary.collected_rent),
                'outstanding_rent': str(report.summary.outstanding_rent),
                'overdue_rent': str(report.summary.overdue_rent),
                'collection_rate': str(report.summary.collection_rate),
                'vacancy_loss': str(report.summary.vacancy_loss),
                'projected_income': str(report.summary.projected_income),
            },
            'by_property': [
                {
                    'property_id': p.property_id,
                    'property_name': p.property_name,
                    'expected_rent': str(p.expected_rent),
                    'collected_rent': str(p.collected_rent),
                    'outstanding_rent': str(p.outstanding_rent),
                    'collection_rate': str(p.collection_rate),
                }
                for p in report.by_property
            ],
        })


class PaymentProviderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        providers = PaymentService.list_providers()
        return Response([
            {
                'provider': p.provider,
                'status': p.status.value,
                'message': p.message,
                'required_env_vars': p.required_env_vars,
            }
            for p in providers
        ])
