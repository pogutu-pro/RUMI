from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import transaction

from accounts.permissions import IsSuperAdmin, IsLandlord, IsCaretaker, IsStudent, IsTechSupportAdmin
from rest_framework.permissions import IsAuthenticated

from . import models, serializers


def _user_organizations(user):
    """Derive organizations the user is associated with.
    Heuristics:
      - Organizations where user owns a Property (property.owner == user)
      - Organizations where user is Tenant.user
      - Organizations where user has payments (payment.tenant.user)
    This is intentionally conservative; system-wide roles like super_admin will bypass.
    """
    if not user or not user.is_authenticated:
        return models.Organization.objects.none()

    orgs = models.Organization.objects.none()
    # properties owned
    orgs = orgs | models.Organization.objects.filter(properties__owner=user)
    # tenant
    orgs = orgs | models.Organization.objects.filter(tenants__user=user)
    # payments via tenant
    orgs = orgs | models.Organization.objects.filter(payments__tenant__user=user)
    return orgs.distinct()


class BaseRentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        # super admin sees everything
        if user.role == 'super_admin':
            return qs
        # tenant: only own objects if relevant
        if user.role == 'tenant':
            # allow access if object relates to tenant.user
            if hasattr(qs.model, 'tenant'):
                return qs.filter(tenant__user=user)
            if hasattr(qs.model, 'tenancy'):
                return qs.filter(tenancy__tenant__user=user)
            return qs.none()
        # landlord/caretaker/tech_support limited to organizations they are associated with
        orgs = _user_organizations(user)
        if hasattr(qs.model, 'organization'):
            return qs.filter(organization__in=orgs)
        # For models that reference property via 'property'
        if hasattr(qs.model, 'property'):
            return qs.filter(property__organization__in=orgs)
        # For models that reference unit via 'unit'
        if hasattr(qs.model, 'unit'):
            return qs.filter(unit__property__organization__in=orgs)
        return qs.none()

    def perform_create(self, serializer):
        # Guard common organization/ownership issues here for create operations
        user = self.request.user
        obj = serializer.save()
        # Audit logging could be placed here (using payments.PaymentAuditLog or similar)


class OrganizationViewSet(BaseRentViewSet):
    queryset = models.Organization.objects.all().order_by('name')
    serializer_class = serializers.OrganizationSerializer
    permission_classes = [IsAuthenticated & (IsSuperAdmin | IsTechSupportAdmin)]


class PropertyViewSet(BaseRentViewSet):
    queryset = models.Property.objects.all().select_related('organization', 'owner')
    serializer_class = serializers.PropertySerializer

    def perform_create(self, serializer):
        user = self.request.user
        # Only super_admin or landlord may create property; landlords become owner by default
        if not (user.role == 'super_admin' or user.role == 'landlord'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only super_admin or landlord can create properties')
        prop = serializer.save()
        # If landlord created, ensure ownership
        if user.role == 'landlord' and prop.owner is None:
            prop.owner = user
            prop.save(update_fields=['owner'])


class BuildingViewSet(BaseRentViewSet):
    queryset = models.Building.objects.all().select_related('property')
    serializer_class = serializers.BuildingSerializer


class FloorViewSet(BaseRentViewSet):
    queryset = models.Floor.objects.all().select_related('property', 'building')
    serializer_class = serializers.FloorSerializer


class RentalUnitViewSet(BaseRentViewSet):
    queryset = models.RentalUnit.objects.all().select_related('property', 'building', 'floor')
    serializer_class = serializers.RentalUnitSerializer

    def perform_create(self, serializer):
        user = self.request.user
        prop = serializer.validated_data.get('property')
        # verify property belongs to user's organization association
        if user.role == 'caretaker':
            # No caretaker->rent assignment mapping exists; deny unless super_admin/landlord
            raise PermissionDenied('Caretakers cannot create rental units')
        if user.role == 'landlord':
            # only allow if landlord owns the property
            if prop.owner_id != user.id:
                raise PermissionDenied('Landlord does not own this property')
        serializer.save()


class TenantViewSet(BaseRentViewSet):
    queryset = models.Tenant.objects.all().select_related('user', 'organization')
    serializer_class = serializers.TenantSerializer

    def perform_create(self, serializer):
        # creating tenant must be tied to a property/org user can manage
        user = self.request.user
        # If landlord/tenant creating, ensure organization association
        tenant_org = serializer.validated_data.get('organization')
        if user.role == 'landlord':
            # landlord must own at least one property in the organization
            owns = models.Property.objects.filter(organization=tenant_org, owner=user).exists()
            if not owns:
                raise PermissionDenied('Landlord cannot create tenant for this organization')
        obj = serializer.save()


class TenancyViewSet(BaseRentViewSet):
    queryset = models.Tenancy.objects.all().select_related('tenant', 'unit', 'organization')
    serializer_class = serializers.TenancySerializer

    def create(self, request, *args, **kwargs):
        # Enforce ownership chain and single active tenancy at API layer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.validated_data.get('tenant')
        unit = serializer.validated_data.get('unit')
        organization = serializer.validated_data.get('organization')
        # Validate chain
        if tenant.organization_id != organization.id or unit.property.organization_id != organization.id:
            return Response({'detail': 'Tenant, unit and tenancy must belong to the same organization'}, status=status.HTTP_400_BAD_REQUEST)
        # Check active tenancy
        if models.Tenancy.objects.filter(unit=unit, status='active').exists() and serializer.validated_data.get('status') == 'active':
            return Response({'detail': 'There is already an active tenancy for this unit'}, status=status.HTTP_409_CONFLICT)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class RentChargeViewSet(BaseRentViewSet):
    queryset = models.RentCharge.objects.all().select_related('tenancy', 'organization')
    serializer_class = serializers.RentChargeSerializer

    def perform_create(self, serializer):
        tenancy = serializer.validated_data.get('tenancy')
        org = serializer.validated_data.get('organization')
        if tenancy.organization_id != org.id:
            raise PermissionDenied('Tenancy and rent charge organization must match')
        serializer.save()


class PaymentProviderViewSet(BaseRentViewSet):
    queryset = models.PaymentProvider.objects.all().select_related('organization')
    serializer_class = serializers.PaymentProviderSerializer


class PaymentViewSet(BaseRentViewSet):
    queryset = models.Payment.objects.all().select_related('organization', 'tenant', 'tenancy', 'provider')
    serializer_class = serializers.PaymentSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # idempotency handled in serializer
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response(serializers.PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def verify(self, request, pk=None):
        payment = get_object_or_404(self.get_queryset(), pk=pk)
        # Here provider verification would occur; for safety mark only if provider response verifies
        # For now, deny direct verification via API unless super_admin or tech_support
        if request.user.role not in ['super_admin', 'tech_support']:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        # Simulate verification: set status to verified
        payment.status = 'verified'
        payment.verified_at = models.timezone.now()
        payment.save(update_fields=['status', 'verified_at', 'updated_at'])
        return Response(self.get_serializer(payment).data)


class PaymentAllocationViewSet(BaseRentViewSet):
    queryset = models.PaymentAllocation.objects.all().select_related('payment', 'rent_charge')
    serializer_class = serializers.PaymentAllocationSerializer

    def perform_create(self, serializer):
        # Ensure payment and rent_charge belong to same organization and tenant
        payment = serializer.validated_data.get('payment')
        rent_charge = serializer.validated_data.get('rent_charge')
        if payment.organization_id != rent_charge.organization_id:
            raise PermissionDenied('Payment and rent charge must belong to the same organization')
        if payment.tenant_id != rent_charge.tenancy.tenant_id:
            raise PermissionDenied('Payment and rent charge must belong to the same tenant')
        # On create, allocation status defaults to allocated; update rent charge outstanding via model methods if needed
        serializer.save()


# Export mapping for URL router registration
viewset_mapping = [
    ('organizations', OrganizationViewSet),
    ('properties', PropertyViewSet),
    ('buildings', BuildingViewSet),
    ('floors', FloorViewSet),
    ('units', RentalUnitViewSet),
    ('tenants', TenantViewSet),
    ('tenancies', TenancyViewSet),
    ('rent-charges', RentChargeViewSet),
    ('payment-providers', PaymentProviderViewSet),
    ('payments', PaymentViewSet),
    ('payment-allocations', PaymentAllocationViewSet),
]
