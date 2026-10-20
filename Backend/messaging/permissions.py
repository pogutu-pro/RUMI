"""
Who may message whom. The chain follows how a rental is actually run:

    tenant  <->  caretaker  <->  landlord  <->  super admin  <->  tech support

- a tenant reaches the caretaker(s) assigned to their property; if the
  property has none, they reach the landlord instead so nobody is left with
  no one to talk to
- a caretaker reaches their landlord and the tenants of their properties
- a landlord reaches their caretakers and the RumiaRent team (super admins)
- a super admin reaches landlords and the tech support team
- tech support reaches the super admins

The relation is symmetric, and is checked on every send, so removing a
caretaker or a tenancy stops the conversation immediately.
"""

from django.contrib.auth import get_user_model

from core.permissions.rumia import get_canonical_role

User = get_user_model()


def _tenant_contacts(user):
    from properties.models import Tenancy

    tenancies = Tenancy.objects.filter(
        tenant__user=user, status__in=['active', 'notice_period', 'pending'],
    ).select_related('parent_property__organization__owner')
    property_ids = [t.parent_property_id for t in tenancies]

    caretakers = User.objects.filter(
        is_active=True,
        caretaker_profile__property_assignments__property_assignment_id__in=property_ids,
        caretaker_profile__property_assignments__is_active=True,
    ).distinct()
    if caretakers.exists():
        return caretakers

    # No caretaker on the property: fall back to the landlord.
    owner_ids = {t.parent_property.organization.owner_id for t in tenancies if t.parent_property.organization_id}
    return User.objects.filter(id__in=owner_ids, is_active=True)


def _caretaker_contacts(user):
    from properties.models import CaretakerPropertyAssignment, Tenancy

    assignments = CaretakerPropertyAssignment.objects.filter(
        caretaker_profile__user=user, is_active=True,
    ).select_related('organization')
    property_ids = [a.property_assignment_id for a in assignments]
    owner_ids = {a.organization.owner_id for a in assignments}

    tenant_user_ids = Tenancy.objects.filter(
        parent_property_id__in=property_ids,
        status__in=['active', 'notice_period'],
        tenant__user__isnull=False,
    ).values_list('tenant__user_id', flat=True)

    return User.objects.filter(is_active=True).filter(
        id__in=set(owner_ids) | set(tenant_user_ids),
    )


def _landlord_contacts(user):
    from organizations.models import Organization

    org_ids = Organization.objects.filter(owner=user).values_list('id', flat=True)
    caretakers = User.objects.filter(
        is_active=True, role='caretaker',
        organization_memberships__organization_id__in=list(org_ids),
    )
    staff = User.objects.filter(is_active=True, role='super_admin')
    return (caretakers | staff).distinct()


def _super_admin_contacts(user):
    return User.objects.filter(is_active=True, role__in=['landlord', 'tech_support', 'tech_support_admin'])


def _tech_support_contacts(user):
    return User.objects.filter(is_active=True, role='super_admin')


_RESOLVERS = {
    'tenant': _tenant_contacts,
    'caretaker': _caretaker_contacts,
    'landlord': _landlord_contacts,
    'super_admin': _super_admin_contacts,
    'tech_support': _tech_support_contacts,
    'tech_support_admin': _tech_support_contacts,
}


def contacts_for(user):
    """Users `user` may start or continue a conversation with."""
    resolver = _RESOLVERS.get(get_canonical_role(user))
    if resolver is None:
        return User.objects.none()
    return resolver(user).exclude(id=user.id)


def can_message(sender, recipient) -> bool:
    """Symmetric: either side's rules permit the pair."""
    if sender.id == recipient.id or not recipient.is_active:
        return False
    return (
        contacts_for(sender).filter(id=recipient.id).exists()
        or contacts_for(recipient).filter(id=sender.id).exists()
    )
