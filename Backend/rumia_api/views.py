"""RUMIA canonical API views — organization-scoped."""

import logging
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
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
from rent.models import Payment, PaymentAllocation, RentCharge
from rent.services.income_flow import IncomeFlowService
from rent.services.deposits import DepositService
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


def _notify_payment_in_app(payment, recorded_by=None) -> None:
    """Bell notifications for a successful payment: the tenant, and the landlord."""
    from notifications.in_app import display_name, notify_in_app, role_url

    amount = f'KES {payment.amount:,.0f}'
    unit = payment.unit.unit_number if payment.unit_id else ''
    tenant_user = getattr(payment.tenant, 'user', None)
    owner = getattr(payment.organization, 'owner', None)

    if tenant_user is not None:
        how = f' recorded by {display_name(recorded_by)}' if recorded_by else ' received'
        notify_in_app(
            tenant_user, notification_type='payment',
            subject='Payment received' if not recorded_by else 'Payment recorded',
            message=f'Your payment of {amount}{" for unit " + unit if unit else ""} was{how}.',
            url=role_url(tenant_user, 'rent'),
        )
    # Tell the landlord unless they are the one who just recorded it.
    if owner is not None and (recorded_by is None or recorded_by.id != owner.id):
        who = payment.tenant.full_name
        via = f' (recorded by {display_name(recorded_by)})' if recorded_by else ''
        notify_in_app(
            owner, notification_type='payment',
            subject=f'{who} paid {amount}',
            message=f'Rent payment{" for unit " + unit if unit else ""}{via}.',
            url=role_url(owner, 'rent'),
        )


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
                # Invited by their landlord, who already supplied everything
                # the platform needs: there is no onboarding wizard to finish.
                onboarding_stage='COMPLETED',
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

            serializer = PropertySerializer(data=request.data, context={'organization_id': org.pk})
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


def _is_uuid(value) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


class RentalUnitBulkCreateView(RumiaBaseView):
    """
    Create many units at once: POST {property, count, prefix?, start?, monthly_rent?, unit_type?}.
    Numbers run prefix+start, prefix+start+1, ... and skip numbers the property already has,
    so "20 units, prefix A" gives A1..A20 in one step during onboarding.
    """

    MAX_UNITS = 300

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin', 'caretaker'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        prop = Property.objects.filter(pk=request.data.get('property')).first() if _is_uuid(
            request.data.get('property')) else None
        if not prop:
            return Response({'detail': 'Property not found'}, status=status.HTTP_400_BAD_REQUEST)
        if role == 'caretaker':
            if prop.id not in self.get_user_property_ids():
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        elif role != 'super_admin' and prop.organization_id not in self.get_user_organization_ids():
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        errors = {}
        try:
            count = int(request.data.get('count'))
            if not 1 <= count <= self.MAX_UNITS:
                raise ValueError
        except (TypeError, ValueError):
            count = 0
            errors['count'] = f'Enter a number of units from 1 to {self.MAX_UNITS}.'
        try:
            start = int(request.data.get('start') or 1)
            if start < 0:
                raise ValueError
        except (TypeError, ValueError):
            start = 1
            errors['start'] = 'Start numbering from 0 or more.'
        prefix = str(request.data.get('prefix') or '').strip()[:10]
        try:
            rent = Decimal(str(request.data.get('monthly_rent') or '0'))
            if rent < 0:
                raise InvalidOperation
        except (InvalidOperation, ValueError):
            rent = Decimal('0')
            errors['monthly_rent'] = 'Enter the monthly rent as a number.'
        unit_type = request.data.get('unit_type') or '1_bedroom'
        if unit_type not in dict(RentalUnit.UNIT_TYPE_CHOICES):
            errors['unit_type'] = 'Choose a unit type.'
        if errors:
            return Response({'detail': 'Please fix the highlighted fields.', 'errors': errors},
                            status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            org = Organization.objects.select_for_update().get(pk=prop.organization_id)
            gate_error = GatingService.check_unit_limit(org, adding=count)
            if gate_error:
                return Response(gate_error, status=status.HTTP_403_FORBIDDEN)
            taken = set(RentalUnit.objects.filter(parent_property=prop).values_list('unit_number', flat=True))
            numbers, n = [], start
            while len(numbers) < count:
                candidate = f'{prefix}{n}'
                if candidate not in taken:
                    numbers.append(candidate)
                n += 1
            RentalUnit.objects.bulk_create([
                RentalUnit(organization=org, parent_property=prop, unit_number=number,
                           unit_type=unit_type, monthly_rent=rent)
                for number in numbers
            ])
        units = RentalUnit.objects.filter(parent_property=prop, unit_number__in=numbers).select_related('parent_property')
        log_audit('unit_created', actor=request.user, organization=org, entity=prop,
                  metadata={'bulk': len(numbers), 'first': numbers[0], 'last': numbers[-1]})
        return Response(RentalUnitSerializer(units, many=True).data, status=status.HTTP_201_CREATED)


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
        error = _check_deposit_options(request.data)
        if error:
            return error

        with transaction.atomic():
            unit, error = _unit_for_tenancy(self, request, role)
            if error:
                return error
            # The tenant must belong to the unit's organization: otherwise any
            # landlord could attach (and read) another landlord's tenant.
            tenant = TenantProfile.objects.filter(
                pk=request.data.get('tenant'), organization_id=unit.organization_id,
            ).first() if _is_uuid(request.data.get('tenant')) else None
            if not tenant:
                return Response({'detail': 'Tenant not found'}, status=status.HTTP_400_BAD_REQUEST)
            tenancy, error = _create_tenancy(request, unit, tenant, request.data)
            if error:
                return error

        return _tenancy_created_response(request, unit, tenant, tenancy)


class TenancyMoveInView(RumiaBaseView):
    """
    Move a tenant into a unit in one step: POST {unit, full_name, phone, email?,
    national_id?, monthly_rent, deposit?, deposit_handling?, start_date, ...}.
    Creates the tenant and the tenancy together, so a half-finished move-in
    never leaves a stray tenant behind.
    """

    def post(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin', 'caretaker'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if role == 'caretaker' and not _caretaker_can(request.user, 'can_manage_tenants'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        error = _check_deposit_options(request.data)
        if error:
            return error
        profile_serializer = TenantProfileSerializer(data={
            field: request.data.get(field, '') for field in ('full_name', 'phone', 'email', 'national_id', 'occupation')
        })
        profile_serializer.is_valid(raise_exception=True)
        if not (profile_serializer.validated_data.get('phone') or profile_serializer.validated_data.get('email')):
            return Response({'phone': 'Add a phone number or email so the tenant gets receipts.'},
                            status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            unit, error = _unit_for_tenancy(self, request, role)
            if error:
                return error
            tenant = profile_serializer.save(organization=unit.organization, created_by=request.user, status='active')
            log_audit('tenant_created', actor=request.user, organization=unit.organization, entity=tenant)
            data = {**{k: v for k, v in request.data.items()}, 'tenant': str(tenant.id),
                    'status': request.data.get('status', 'active')}
            tenancy, error = _create_tenancy(request, unit, tenant, data)
            if error:
                transaction.set_rollback(True)
                return error

        return _tenancy_created_response(request, unit, tenant, tenancy)


def _check_deposit_options(data):
    if data.get('deposit_handling', 'invoice') not in ('invoice', 'already_paid', 'none'):
        return Response({'deposit_handling': 'Use invoice, already_paid or none.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if data.get('deposit_payment_method', 'cash') not in ('cash', 'bank_transfer', 'mpesa_paybill', 'other'):
        return Response({'deposit_payment_method': 'Use cash, bank_transfer, mpesa_paybill or other.'},
                        status=status.HTTP_400_BAD_REQUEST)
    return None


def _unit_for_tenancy(view, request, role):
    """Lock and return the unit the caller may let, or (None, error response)."""
    unit_id = request.data.get('unit')
    unit = RentalUnit.objects.select_for_update().filter(pk=unit_id).first() if _is_uuid(unit_id) else None
    if not unit:
        return None, Response({'detail': 'Unit not found'}, status=status.HTTP_400_BAD_REQUEST)
    if role == 'caretaker' and unit.parent_property_id not in view.get_user_property_ids():
        return None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    if role not in ('caretaker', 'super_admin') and unit.organization_id not in view.get_user_organization_ids():
        return None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    return unit, None


def _create_tenancy(request, unit, tenant, data):
    """Create the tenancy and its deposit entry. Call inside a transaction holding the unit lock."""
    serializer = TenancySerializer(data=data)
    serializer.is_valid(raise_exception=True)
    if serializer.validated_data.get('status', 'pending') == 'active' and unit.tenancies.filter(status='active').exists():
        return None, Response({'detail': 'This unit already has an active tenancy.'},
                              status=status.HTTP_400_BAD_REQUEST)
    tenancy = serializer.save(
        organization=unit.organization, parent_property=unit.parent_property, unit=unit, tenant=tenant,
        created_by=request.user,
    )
    _sync_unit_status(tenancy)

    # Deposit for a new tenancy: invoice it (default), record it as
    # already paid, or skip ('none').
    deposit_handling = data.get('deposit_handling', 'invoice')
    if tenancy.deposit > 0 and deposit_handling == 'invoice':
        DepositService.issue_invoice(tenancy, created_by=request.user)
    elif tenancy.deposit > 0 and deposit_handling == 'already_paid':
        DepositService.record_held(
            tenancy, tenancy.deposit, method=data.get('deposit_payment_method', 'cash'), created_by=request.user,
        )
    return tenancy, None


def _tenancy_created_response(request, unit, tenant, tenancy):
    log_audit('tenancy_created', actor=request.user, organization=unit.organization, entity=tenancy)
    # Outside the transaction — this is the point a tenant is actually tied to a
    # property, so it's when they should get their account + login invite.
    _tenant, invite_outcome = onboard_tenant_user(tenant, property_name=unit.parent_property.name)
    data = TenancySerializer(tenancy).data
    # 'invited' | 'linked_existing' | 'no_email' | 'already_linked' — the
    # frontend uses this to tell the landlord/caretaker whether an
    # invite actually went out, instead of leaving them to assume it did.
    data['tenant_invite_outcome'] = invite_outcome
    return Response(data, status=status.HTTP_201_CREATED)


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
        move_out_date = serializer.validated_data.get('move_out_date', timezone.localdate())

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
        role = get_canonical_role(request.user)
        tenancy_id = request.query_params.get('tenancy_id')

        qs = self.filter_by_organization(
            RentCharge.objects.select_related('tenant', 'unit').prefetch_related('lines')
            .exclude(status__in=['paid', 'waived'])
        )
        if role == 'tenant':
            qs = qs.filter(tenant__user=request.user)
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

        paid_qs = self.filter_by_organization(Payment.objects.filter(status='success'))
        if role == 'tenant':
            paid_qs = paid_qs.filter(tenant__user=request.user)
        if tenancy_id:
            paid_qs = paid_qs.filter(tenancy_id=tenancy_id)
        paid_this_month = paid_qs.filter(paid_at__date__gte=timezone.localdate().replace(day=1)).aggregate(
            total=Sum('amount'),
        )['total'] or Decimal('0.00')

        return Response({
            'outstanding_total': str(outstanding_total),
            'overdue_total': str(overdue_total),
            'credit_total': str(credit_total),
            'net_balance': str(outstanding_total - credit_total),
            'paid_this_month': str(paid_this_month),
            'credit_balance': str(credit_total),  # same figure as credit_total, kept for older clients
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
        if not settings.RENT_ONLINE_PAYMENTS_ENABLED:
            # The webhook still settles checkouts started before this was turned off.
            return Response({
                'detail': "Online rent payment is turned off. Pay to your landlord's M-Pesa paybill or bank "
                          'using your account number, or ask your landlord to record a cash payment.',
                'code': 'online_rent_disabled',
            }, status=status.HTTP_403_FORBIDDEN)

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
        # SMS/email go out with the receipt (PaymentService); this is the in-app bell.
        _notify_payment_in_app(payment, recorded_by=request.user)
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaystackWebhookView(APIView):
    """
    No authentication — Paystack calls this directly. Trust nothing in the body;
    the signature proves the request came from Paystack, and PaymentService
    re-verifies the actual transaction status with Paystack's API before
    ever touching a Payment/RentCharge row.
    """

    permission_classes = [AllowAny]
    # DRF's default AnonRateThrottle would otherwise count every delivery
    # against Paystack's shared sending IPs (100/hour by default here) —
    # the HMAC signature check above is the real gate for this endpoint,
    # not a per-IP anonymous-abuse limit. RATE_LIMIT_EXEMPT_PATH_PREFIXES
    # in rumi/middleware.py exempts it from the other rate limiter too.
    throttle_classes = []

    def post(self, request):
        import hashlib
        import hmac as hmac_module

        # Paystack signs webhooks with the account's secret key. A separately
        # configured PAYSTACK_WEBHOOK_SECRET is also accepted for backwards
        # compatibility; either way the signer must hold a server secret.
        secrets = [
            value.encode() for value in {
                getattr(settings, 'PAYSTACK_SECRET_KEY', '') or '',
                getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', '') or '',
            } if value
        ]
        signature = request.headers.get('x-paystack-signature', '')

        if not secrets or not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

        if not any(
            hmac_module.compare_digest(hmac_module.new(secret, request.body, hashlib.sha512).hexdigest(), signature)
            for secret in secrets
        ):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data
        event = payload.get('event') or ''
        data = payload.get('data', {}) or {}
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
                    _notify_payment_in_app(payment)

                return Response({'status': 'processed', 'payment_status': payment.status})

        if event.startswith('refund.') or event.startswith('charge.dispute.'):
            payment = _payment_for_paystack_event(data)
            if payment is not None:
                return Response(_handle_payment_event(payment, event, data, payload))

        # Not a rent-payment event — the only other consumer of this single
        # physical webhook URL is the billing/subscription domain. Paystack
        # never calls a second endpoint for subscription.*/invoice.* events.
        # handle_billing_event returns 'ignored' for anything it doesn't own;
        # an exception here is a genuine failure, so answer 500 and let
        # Paystack retry the delivery (audit H6).
        from billing.services.webhook import handle_billing_event
        try:
            result = handle_billing_event(payload)
        except Exception:
            logger.exception('Billing webhook dispatch failed for event=%s', event)
            return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(result, status=status.HTTP_200_OK)


def _payment_for_paystack_event(data: dict):
    """
    Refund/dispute payloads carry the original transaction reference in
    different places across Paystack versions — check each.
    """
    transaction_data = data.get('transaction')
    candidates = [
        data.get('transaction_reference'),
        transaction_data.get('reference') if isinstance(transaction_data, dict) else None,
        data.get('reference'),
    ]
    for reference in filter(None, candidates):
        payment = Payment.objects.filter(internal_reference=str(reference)).first()
        if payment is not None:
            return payment
    return None


def _handle_payment_event(payment, event: str, data: dict, payload: dict) -> dict:
    if event == 'refund.processed':
        raw_amount = data.get('amount')
        try:
            amount = Decimal(str(raw_amount)) / Decimal('100') if raw_amount not in (None, '') else None
        except Exception:
            amount = None
        outcome = PaymentService.handle_refund(payment, amount, payload)
        action = 'payment_reversed' if outcome == 'reversed' else 'payment_edited'
    elif event.startswith('charge.dispute.'):
        outcome = PaymentService.flag_dispute(payment, event, payload)
        action = 'payment_edited'
        if event == 'charge.dispute.create':
            _notify_landlord_of_dispute(payment)
    else:
        return {'status': 'ignored', 'event': event}

    log_audit(action, organization=payment.organization, entity=payment,
              metadata={'source': 'paystack_webhook', 'event': event, 'outcome': outcome})
    return {'status': 'processed', 'event': event, 'outcome': outcome}


def _notify_landlord_of_dispute(payment) -> None:
    from rent.services.notifications import _deliver

    owner = payment.organization.owner
    text = (
        f'RumiaRent: a chargeback was opened on payment {payment.internal_reference} '
        f'(KES {payment.amount}, {payment.tenant.full_name}). Respond in your Paystack dashboard; '
        f'if you lose it, reverse the payment in RumiaRent.'
    )
    try:
        _deliver(['email', 'sms', 'in_app'], email=owner.email, phone=getattr(owner, 'phone_number', ''), user=owner,
                 subject=f'Chargeback on {payment.internal_reference}', body=text, sms=text,
                 kind='payment_dispute', metadata={'payment_id': str(payment.pk)})
    except Exception:
        logger.exception('Dispute notification failed for payment %s', payment.pk)


class PaymentReverseView(RumiaBaseView):
    """
    POST {reason}: reverse a successful payment (bounced cheque, lost
    chargeback, recorded in error). Owner-side only; unwinds the ledger and
    restores the invoices it paid.
    """

    property_lookup = 'parent_property'

    def post(self, request, pk):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        reason = str(request.data.get('reason', '')).strip()
        if not reason:
            return Response({'reason': 'A reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
        payment = self.filter_by_organization(Payment.objects.all()).filter(pk=pk).first()
        if payment is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            PaymentService.reverse_payment(payment, reversed_by=request.user, reason=reason)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('payment_reversed', actor=request.user, organization=payment.organization, entity=payment,
                  metadata={'reason': reason})
        return Response(PaymentSerializer(payment).data)


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

        today = timezone.localdate()
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
