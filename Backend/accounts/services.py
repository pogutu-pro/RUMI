import logging
from django.db import transaction
from django.utils import timezone
from .models import User, StudentProfile, LandlordProfile, CaretakerProfile

logger = logging.getLogger(__name__)


def onboard_caretaker_user(caretaker_profile: CaretakerProfile) -> CaretakerProfile:
    """
    Give a newly created caretaker a way to log in.

    Mirrors tenants.services.onboard_tenant_user: create an unusable-password
    account if one doesn't already exist for this email, then email an
    invite that reuses the password-reset-confirm flow as first-time setup.
    """
    user = caretaker_profile.user
    if user.has_usable_password():
        return caretaker_profile

    from accounts.models import PasswordResetToken
    from accounts.tasks import send_caretaker_invite_email

    token = PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + timezone.timedelta(hours=24),
    )
    try:
        send_caretaker_invite_email.delay(
            user_id=user.id,
            reset_token=str(token.token),
        )
    except Exception:
        logger.exception('Failed to queue caretaker invite email for user %s', user.id)
    return caretaker_profile

class OnboardingService:
    """
    Server-authoritative service for managing user onboarding lifecycle.
    Prevents illegal state transitions and ensures atomic draft persistence.
    """

    from .logic import OnboardingStateMachine

    # Fields a user is allowed to self-promote from draft_data to their
    # profile at finalize time, per role. Deliberately excludes
    # system/derived/verification fields (e.g. paystack_subaccount_code,
    # is_verified, is_profile_complete, total_units, verified_at,
    # verified_by) that must only ever be written by trusted server-side
    # flows (Paystack subaccount provisioning, admin verification, etc.).
    # See CR-01: without this allowlist, `finalize_onboarding` promoted
    # every key of the attacker-controlled draft_data dict onto the model.
    PROMOTABLE_FIELDS = {
        'student': {
            'university', 'student_id_number', 'year_of_study',
            'graduation_year', 'course', 'campus', 'high_school',
            'preferred_room_number', 'lifestyle_preferences', 'bio',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship',
        },
        'landlord': {
            'company_name', 'national_id', 'business_address',
            'bank_name', 'bank_account_number', 'bank_code',
        },
        'caretaker': {
            'national_id', 'employment_start_date', 'employment_end_date',
            'emergency_contact_name', 'emergency_contact_phone',
        },
    }

    @staticmethod
    def update_stage(user, next_stage):
        """Update the user's onboarding stage with validation"""
        current_stage = user.onboarding_stage
        
        # Admins bypass validation
        if user.role in ['super_admin', 'tech_support']:
             # Use the state machine even for admins to ensure logging, but we might want to suppress errors or force it.
             # For now, let's treat admin updates as force transitions.
             try:
                 OnboardingStateMachine.transition(user, next_stage, reason="Admin Override")
                 return True
             except Exception as e:
                 logger.error(f"Admin forced transition failed: {e}")
                 return False

        try:
            OnboardingStateMachine.transition(user, next_stage)
            return True
        except Exception as e:
            logger.warning(f"Transition failed: {e}")
            return False

    @staticmethod
    def save_draft(user, draft_data):
        """Save partial onboarding data to the appropriate profile draft_data field"""
        profile = None
        if user.role == 'student':
            profile = getattr(user, 'student_profile', None)
        elif user.role == 'landlord':
            profile = getattr(user, 'landlord_profile', None)
        elif user.role == 'caretaker':
            profile = getattr(user, 'caretaker_profile', None)

        if not profile:
            logger.error(f"Cannot save draft: Profile not found for user {user.id} (Role: {user.role})")
            return False

        with transaction.atomic():
            # Merge new draft data into existing
            current_draft = profile.draft_data or {}
            current_draft.update(draft_data)
            profile.draft_data = current_draft
            profile.save(update_fields=['draft_data', 'updated_at'])
        return True

    @staticmethod
    def finalize_onboarding(user):
        """Finalize onboarding, promote from draft to formal fields, and grant capabilities"""
        profile = None
        if user.role == 'student':
            profile = getattr(user, 'student_profile', None)
        elif user.role == 'landlord':
            profile = getattr(user, 'landlord_profile', None)
        elif user.role == 'caretaker':
            profile = getattr(user, 'caretaker_profile', None)

        if not profile:
            return False

        with transaction.atomic():
            # 1. Promote draft data to actual model fields, restricted to an
            # explicit per-role allowlist (CR-01). draft_data is populated
            # via OnboardingDraftView with no server-side field validation,
            # so it must never be trusted to promote arbitrary keys (e.g.
            # paystack_subaccount_code, is_verified) onto the profile.
            draft = profile.draft_data or {}
            promotable = OnboardingService.PROMOTABLE_FIELDS.get(user.role, set())
            for field, value in draft.items():
                if field in promotable and hasattr(profile, field) and value:
                    setattr(profile, field, value)

            # 2. Strict Readiness Check
            # This raises ValidationError if fields are missing, causing atomic rollback
            profile.validate_readiness(raise_exception=True)
            
            # 3. Update status flags
            profile.is_profile_complete = True
            profile.save()

            # 3. Update User status and grant initial capabilities
            user.onboarding_stage = 'COMPLETED'
            user.is_verified = True # Base verification Tier 1
            
            capabilities = []
            if user.role == 'student':
                capabilities = ['hostel:book', 'roommate:match', 'profile:manage']
            elif user.role == 'landlord':
                capabilities = ['hostel:create', 'caretaker:invite', 'payout:request']
            elif user.role == 'caretaker':
                capabilities = ['dashboard:view', 'inventory:check']
                
            # Merge capabilities avoiding duplicates
            current_caps = set(user.capabilities or [])
            current_caps.update(capabilities)
            user.capabilities = list(current_caps)
            
            user.save(update_fields=['onboarding_stage', 'is_verified', 'capabilities', 'updated_at'])
            
        logger.info(f"User {user.id} finalized onboarding and granted capabilities: {capabilities}")
        return True
