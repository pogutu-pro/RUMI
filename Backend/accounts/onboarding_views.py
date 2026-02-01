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

        return Response({
            "onboarding_stage": user.onboarding_stage,
            "is_complete": user.onboarding_stage == 'COMPLETED',
            "draft_data": profile.draft_data if profile else {},
            "role": user.role
        }, status=status.HTTP_200_OK)
