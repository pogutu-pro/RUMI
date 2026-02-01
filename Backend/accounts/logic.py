from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class OnboardingStateMachine:
    """
    Centralized State Machine for User Onboarding.
    Enforces valid transitions and provides the Single Source of Truth for
    where a user is in the onboarding lifecycle.
    """
    
    # States
    REGISTERED = 'REGISTERED'
    ROLE_SELECTED = 'ROLE_SELECTED'
    IDENTITY_DRAFT = 'IDENTITY_DRAFT'
    IDENTITY_VERIFIED = 'IDENTITY_VERIFIED'
    VERIFICATION_PENDING = 'VERIFICATION_PENDING'
    ACADEMIC_VERIFICATION = 'ACADEMIC_VERIFICATION_PENDING' # Student specific
    BUSINESS_VERIFICATION = 'BUSINESS_VERIFICATION_PENDING' # Landlord specific
    COMPLETED = 'COMPLETED'

    VALID_TRANSITIONS = {
        REGISTERED: {ROLE_SELECTED},
        ROLE_SELECTED: {IDENTITY_DRAFT},
        IDENTITY_DRAFT: {IDENTITY_DRAFT, VERIFICATION_PENDING, IDENTITY_VERIFIED},
        # Identity verified can go to role-specific verification or straight to complete depending on config
        IDENTITY_VERIFIED: {ACADEMIC_VERIFICATION, BUSINESS_VERIFICATION, COMPLETED},
        VERIFICATION_PENDING: {IDENTITY_VERIFIED, IDENTITY_DRAFT}, # Can revert if rejected
        ACADEMIC_VERIFICATION: {COMPLETED, IDENTITY_VERIFIED}, # Rejected -> Revert
        BUSINESS_VERIFICATION: {COMPLETED, IDENTITY_VERIFIED}, # Rejected -> Revert
        COMPLETED: set() # Terminal state for onboarding
    }

    @classmethod
    def can_transition(cls, current_stage, target_stage):
        """Check if a transition is valid."""
        # Admins can force transitions, but standard flow must obey this.
        allowed = cls.VALID_TRANSITIONS.get(current_stage, set())
        return target_stage in allowed

    @classmethod
    def transition(cls, user, target_stage, reason=None):
        """
        Execute a stage transition for a user.
        Raises ValidationError if transition is invalid.
        """
        current_stage = user.onboarding_stage
        
        # Super admin bypass handled in calling service or here if we pass request user
        # For strict state machine, we just check legitimacy.
        
        if not cls.can_transition(current_stage, target_stage):
            # Allow idempotency (transition to self is generally strictly handled in VALID_TRANSITIONS map 
            # or we can allow it explicitly here if needed, but usually we want to know if it's a real move)
            if current_stage == target_stage:
                return True 
                
            error_msg = f"Invalid transition from {current_stage} to {target_stage}"
            logger.warning(f"Onboarding State Machine Error: {error_msg} for User {user.id}")
            raise ValidationError(error_msg)

        user.onboarding_stage = target_stage
        user.save(update_fields=['onboarding_stage', 'updated_at'])
        
        logger.info(f"User {user.id} transitioned {current_stage} -> {target_stage}. Reason: {reason}")
        return True
