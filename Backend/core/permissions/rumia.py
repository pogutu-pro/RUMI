"""
RUMIA RBAC — server-side authorization foundation.

See RBAC_MATRIX.md for the full resource/action/role/scope matrix.
"""

from rest_framework import permissions

from organizations.models import OrganizationMembership
from properties.models import CaretakerPropertyAssignment, Property, RentalUnit, Tenancy
from tenants.models import TenantProfile


def get_canonical_role(user) -> str:
    """Map legacy 'student' role to canonical 'tenant'."""
    if not user.is_authenticated:
        return ''
    if user.role == 'student':
        return 'tenant'
    return user.role


class IsTenant(permissions.BasePermission):
    """Allow users with tenant role (including legacy student)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and get_canonical_role(request.user) == 'tenant'


class IsOrganizationMember(permissions.BasePermission):
    """User belongs to the organization being accessed."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        org_id = view.kwargs.get('organization_id') or getattr(view, 'organization_id', None)
        if not org_id:
            return True  # View must enforce org in queryset
        return OrganizationMembership.objects.filter(
            organization_id=org_id,
            user=request.user,
            is_active=True,
        ).exists()


class OrganizationScopedMixin:
    """
    Mixin for views/querysets — enforce organization data isolation.

    Subclasses set `organization_lookup` to the FK path prefix on the model.
    Subclasses set `property_lookup` to additionally restrict caretakers to
    only their assigned properties (RBAC_MATRIX.md: "Assigned properties only").
    Leave `property_lookup = None` for models with no direct property FK.
    """

    organization_lookup = 'organization'
    property_lookup = None

    def get_user_organization_ids(self):
        user = self.request.user
        role = get_canonical_role(user)

        if role == 'super_admin':
            return None  # unrestricted platform access

        if role == 'landlord':
            from organizations.models import Organization
            # Deterministic ordering: callers (e.g. PayoutAccountView) take
            # org_ids[0] as "the" organization for a landlord with no
            # explicit organization_id. Without ORDER BY, Postgres does not
            # guarantee row order for a DISTINCT query, so two consecutive
            # requests from the same multi-org landlord could otherwise
            # resolve to different organizations.
            return list(
                Organization.objects.filter(
                    models.Q(owner=user)
                    | models.Q(memberships__user=user, memberships__is_active=True)
                    | models.Q(legacy_landlord_profile__user=user)
                ).order_by('created_at').values_list('id', flat=True).distinct()
            )

        if role == 'caretaker':
            try:
                return list(
                    CaretakerPropertyAssignment.objects.filter(
                        caretaker_profile__user=user,
                        is_active=True,
                    ).values_list('organization_id', flat=True).distinct()
                )
            except Exception:
                return []

        if role == 'tenant':
            try:
                org_id = user.tenant_profile.organization_id
                return [org_id] if org_id else []
            except Exception:
                return []

        return []

    def get_user_property_ids(self):
        """Property IDs a caretaker is actively assigned to. Only meaningful for caretakers."""
        user = self.request.user
        return list(
            CaretakerPropertyAssignment.objects.filter(
                caretaker_profile__user=user, is_active=True,
            ).values_list('property_assignment_id', flat=True).distinct()
        )

    def filter_by_organization(self, queryset):
        user = self.request.user
        role = get_canonical_role(user)

        if role == 'super_admin':
            # Unrestricted platform access, optionally narrowed to one
            # organization for the super-admin cross-org dashboard switcher.
            org_id = self.request.query_params.get('organization_id')
            if org_id:
                queryset = queryset.filter(**{f'{self.organization_lookup}__id': org_id})
            return queryset

        org_ids = self.get_user_organization_ids()
        if not org_ids:
            return queryset.none()

        lookup = self.organization_lookup
        queryset = queryset.filter(**{f'{lookup}__in': org_ids})

        if role == 'caretaker' and self.property_lookup:
            property_ids = self.get_user_property_ids()
            if not property_ids:
                return queryset.none()
            queryset = queryset.filter(**{f'{self.property_lookup}__in': property_ids})

        return queryset


from django.db import models  # noqa: E402


class CanAccessProperty(permissions.BasePermission):
    """Object-level: user can access this property's organization."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = get_canonical_role(user)

        if role == 'super_admin':
            return True

        prop = obj if isinstance(obj, Property) else getattr(obj, 'parent_property', None)
        if prop is None and isinstance(obj, RentalUnit):
            prop = obj.parent_property
        if prop is None and isinstance(obj, Tenancy):
            prop = obj.parent_property
        if prop is None:
            return False

        org_id = prop.organization_id

        if role == 'landlord':
            return OrganizationMembership.objects.filter(
                organization_id=org_id, user=user, is_active=True
            ).exists() or prop.organization.owner_id == user.id

        if role == 'caretaker':
            return CaretakerPropertyAssignment.objects.filter(
                caretaker_profile__user=user,
                property_assignment=prop,
                is_active=True,
            ).exists()

        if role == 'tenant':
            try:
                return user.tenant_profile.organization_id == org_id
            except Exception:
                return False

        if role == 'tech_support':
            # Support-level read access only — views must filter sensitive fields
            return request.method in permissions.SAFE_METHODS

        return False


class CanAccessTenantProfile(permissions.BasePermission):
    """Tenant profile access — strict isolation."""

    def has_object_permission(self, request, view, obj: TenantProfile):
        user = request.user
        role = get_canonical_role(user)

        if role == 'super_admin':
            return True

        if role == 'tenant':
            return obj.user_id == user.id

        if role == 'landlord':
            return OrganizationMembership.objects.filter(
                organization=obj.organization,
                user=user,
                is_active=True,
            ).exists() or obj.organization.owner_id == user.id

        if role == 'caretaker':
            if not request.method in permissions.SAFE_METHODS:
                # Caretakers need explicit permission to edit
                try:
                    perms = user.caretaker_profile.permissions or {}
                    if not perms.get('can_manage_tenants', False):
                        return False
                except Exception:
                    return False
            return CaretakerPropertyAssignment.objects.filter(
                caretaker_profile__user=user,
                property_assignment__organization=obj.organization,
                is_active=True,
            ).exists()

        if role == 'tech_support':
            return request.method in permissions.SAFE_METHODS

        return False


class IsOrganizationOwner(permissions.BasePermission):
    """
    Object-level: caller is the Organization's registered owner.

    Deliberately does NOT consult `OrganizationMembership` — per D-08, even
    an admin-role membership must be excluded from mutating payout bank
    details. Only `Organization.owner_id` grants this permission.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        organization = obj if hasattr(obj, 'owner') else obj.organization
        return organization.owner_id == request.user.id


class CanViewFinancials(permissions.BasePermission):
    """Financial data access — caretakers and tech support are restricted."""

    def has_permission(self, request, view):
        user = request.user
        role = get_canonical_role(user)

        if role in ('landlord', 'super_admin'):
            return True

        if role == 'tenant':
            return request.method in permissions.SAFE_METHODS

        if role == 'caretaker':
            try:
                return user.caretaker_profile.permissions.get(
                    'can_view_payments', False
                ) or user.caretaker_profile.permissions.get(
                    'can_record_payments', False
                )
            except Exception:
                return False

        if role == 'tech_support':
            return False  # No financial access for tech support by default

        return False
