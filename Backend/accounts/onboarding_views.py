from django.db import transaction
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import OnboardingService
from .serializers import UserSerializer
import logging

logger = logging.getLogger(__name__)

class OnboardingDraftView(APIView):
    """
    API for saving partial onboarding data as draft.
    Allows for crash-resumable onboarding.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        draft_data = request.data
        if not draft_data:
            return Response({"error": "No data provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        success = OnboardingService.save_draft(request.user, draft_data)
        if success:
            return Response({"status": "draft_saved"}, status=status.HTTP_200_OK)
        return Response({"error": "Failed to save draft"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OnboardingAdvanceView(APIView):
    """
    API for advancing to the next onboarding stage.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        next_stage = request.data.get('next_stage')
        if not next_stage:
            return Response({"error": "next_stage is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        success = OnboardingService.update_stage(request.user, next_stage)
        if success:
            return Response({
                "status": "stage_updated",
                "current_stage": request.user.onboarding_stage
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid state transition"}, status=status.HTTP_400_BAD_REQUEST)

class OnboardingFinalizeView(APIView):
    """
    API for finalizing onboarding and granting full access.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Final safety check: ensure all required data is in draft or profile
        # This can be expanded with role-specific validation
        
        success = OnboardingService.finalize_onboarding(request.user)
        if success:
            return Response({
                "status": "onboarding_completed",
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        return Response({"error": "Failed to finalize onboarding"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OnboardingStatusView(APIView):
    """
    API for retrieving current onboarding status and draft data.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = None
        if user.role == 'student':
            profile = getattr(user, 'student_profile', None)
        elif user.role == 'landlord':
            profile = getattr(user, 'landlord_profile', None)
        elif user.role == 'caretaker':
            profile = getattr(user, 'caretaker_profile', None)

        wizard = None
        if user.role == 'landlord':
            from organizations.models import Organization, PayoutAccount
            from properties.models import Property

            org = Organization.objects.filter(owner=user).first()
            has_property = Property.objects.filter(organization=org).exists() if org else False
            payout = PayoutAccount.objects.filter(organization=org).first() if org else None
            payout_status = payout.status if payout else 'not_started'
            selected_tier = (org.settings or {}).get('preferred_tier') if org else None

            if not org:
                current_step = 1
            elif not has_property:
                current_step = 2
            elif payout_status == 'not_started':
                current_step = 3
            elif not selected_tier:
                current_step = 4
            else:
                current_step = 5

            wizard = {
                "organization_id": str(org.id) if org else None,
                "organization_name": org.name if org else None,
                "has_property": has_property,
                "payout_status": payout_status,
                "selected_tier": selected_tier,
                "current_step": current_step,
            }

        return Response({
            "onboarding_stage": user.onboarding_stage,
            "is_complete": user.onboarding_stage == 'COMPLETED',
            "draft_data": profile.draft_data if profile else {},
            "role": user.role,
            "wizard": wizard,
        }, status=status.HTTP_200_OK)


class LandlordWizardCompleteView(APIView):
    """
    Completes the landlord onboarding wizard once an organization and a
    property exist. Payout details are NOT required here: they can be added
    later from Billing & Payout (the dashboard keeps reminding the landlord),
    and until they are verified tenants simply cannot pay rent online. Making
    them mandatory locked every new landlord out whenever Paystack could not
    take the submission. Records the selected tier as a preference only
    (D-06): never triggers a billing subscription call or a Paystack charge.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'landlord':
            return Response({'error': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        plan_slug = request.data.get('plan_slug')
        if not plan_slug:
            return Response({'error': 'plan_slug is required'}, status=status.HTTP_400_BAD_REQUEST)

        from organizations.models import Organization, PayoutAccount
        from properties.models import Property
        from billing.models import SubscriptionPlan

        org = Organization.objects.filter(owner=user).first()
        if not org:
            return Response({'error': 'Organization setup is required first'}, status=status.HTTP_400_BAD_REQUEST)

        if not Property.objects.filter(organization=org).exists():
            return Response({'error': 'Property setup is required first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(slug=plan_slug, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Invalid plan'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Preference record only (D-06) — no billing/Paystack call here.
            org.settings = {**(org.settings or {}), 'preferred_tier': plan.slug}
            org.save(update_fields=['settings', 'updated_at'])

            user.onboarding_stage = 'COMPLETED'
            user.is_verified = True
            caps = set(user.capabilities or [])
            caps.update(['hostel:create', 'caretaker:invite', 'payout:request'])
            user.capabilities = list(caps)
            user.save(update_fields=['onboarding_stage', 'is_verified', 'capabilities', 'updated_at'])

        return Response({
            'status': 'onboarding_completed',
            'organization_id': str(org.id),
            'selected_tier': plan.slug,
        }, status=status.HTTP_200_OK)
