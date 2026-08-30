"""
Tenant onboarding — invite flow and next-of-kin capture.

Tenants are never self-registered. A caretaker (or the landlord, when a
property has no caretaker) creates the TenantProfile; this module handles
what happens next: give the tenant an account and a way to log in.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from .models import EmergencyContact, TenantProfile

User = get_user_model()


def onboard_tenant_user(profile: TenantProfile, property_name: str = '') -> TenantProfile:
    """
    Ensure the tenant has a User account, linked to this profile.

    - Email already belongs to an existing account: link it, no invite needed
      (they can already log in).
    - No account yet: create one (unusable password), link it, and email an
      invite that reuses the existing password-reset-confirm flow as the
      first-time setup step.
    - No email on file: nothing to invite; the profile stays unlinked until
      an email is added.
    """
    if profile.user_id or not profile.email:
        return profile

    with transaction.atomic():
        existing = User.objects.filter(email=profile.email).first()
        if existing:
            profile.user = existing
            profile.save(update_fields=['user', 'updated_at'])
            return profile

        name_parts = profile.full_name.strip().split(' ', 1)
        first_name = name_parts[0] if name_parts else profile.full_name
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            email=profile.email,
            password=None,  # User.set_password(None) sets an unusable password
            first_name=first_name,
            last_name=last_name,
            role='tenant',
            phone_number=profile.phone or None,
        )

        profile.user = user
        profile.save(update_fields=['user', 'updated_at'])

    from accounts.models import PasswordResetToken
    from accounts.tasks import send_tenant_invite_email

    token = PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + timezone.timedelta(hours=24),
    )
    try:
        send_tenant_invite_email.delay(
            user_id=user.id,
            reset_token=str(token.token),
            property_name=property_name,
        )
    except Exception:
        # The account and token already exist — a broker hiccup here must not
        # fail tenancy creation. Worst case, resend the invite manually later.
        logging.getLogger(__name__).exception(
            'Failed to queue tenant invite email for user %s', user.id,
        )
    return profile


def save_emergency_contacts(profile: TenantProfile, contacts: list[dict]) -> list[EmergencyContact]:
    """Replace-and-create next-of-kin records captured during onboarding."""
    created = []
    for contact in contacts:
        created.append(
            EmergencyContact.objects.create(
                tenant=profile,
                full_name=contact.get('full_name', ''),
                relationship=contact.get('relationship', ''),
                phone=contact.get('phone', ''),
                alternative_phone=contact.get('alternative_phone', ''),
                email=contact.get('email', ''),
                address=contact.get('address', ''),
                is_primary=contact.get('is_primary', False),
                purpose=contact.get('purpose', 'emergency_only'),
                consent_recorded_at=timezone.now() if contact.get('consent_given') else None,
                consent_notes=contact.get('consent_notes', ''),
            )
        )
    return created
