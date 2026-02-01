import logging
from django.db import transaction
from django.utils import timezone
from .models import User, StudentProfile, LandlordProfile, CaretakerProfile

logger = logging.getLogger(__name__)

class OnboardingService:
    """
    Server-authoritative service for managing user onboarding lifecycle.
    Prevents illegal state transitions and ensures atomic draft persistence.
    """
    
    from .logic import OnboardingStateMachine

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
            # 1. Promote draft data to actual model fields if they match
            draft = profile.draft_data or {}
            for field, value in draft.items():
                if hasattr(profile, field) and value:
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
