from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils.crypto import get_random_string
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from accounts.permissions import IsVerifiedLandlord
from accounts.models import User, CaretakerProfile, LandlordProfile
from accounts.serializers import CaretakerCreateSerializer
from hostels.models import Hostel

import logging
logger = logging.getLogger(__name__)

@swagger_auto_schema(
    tags=['Landlord API']
)
class InviteCaretakerView(APIView):
    """
    Invite/Onboard a Caretaker.
    
    Landlord provides details. System creates a User (if needed) and a CaretakerProfile.
    """
    permission_classes = [permissions.IsAuthenticated, IsVerifiedLandlord]

    @swagger_auto_schema(
        request_body=CaretakerCreateSerializer,
        responses={201: "Caretaker invited successfully"}
    )
    def post(self, request):
        if request.user.role != 'landlord':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = CaretakerCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Verify Landlord owns the hostel
        try:
            hostel = Hostel.objects.get(id=data['hostel_id'])
            if hostel.landlord.user != request.user:
                 return Response({'error': 'You do not own this hostel'}, status=status.HTTP_403_FORBIDDEN)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # 1. Create or Get User
            email = data['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'phone_number': data.get('phone_number', ''),
                    'role': 'caretaker',
                    'username': email,
                    'is_active': False # Pending activation via email
                }
            )
            
            if created:
                # Set unusable password or generated one
                user.set_password(get_random_string(12))
                user.save()
            else:
                # If user exists, ensure they are compatible?
                if user.role != 'caretaker':
                     return Response({'error': 'User exists with a different role'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 2. Create Profile
            profile, p_created = CaretakerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'hostel': hostel,
                    'created_by': request.user,
                    'national_id': data['national_id'],
                    'employment_start_date': data['employment_start_date'],
                    'emergency_contact_name': data['emergency_contact_name'],
                    'emergency_contact_phone': data['emergency_contact_phone'],
                    'permissions': data.get('permissions', {})
                }
            )
            
            # 3. Send Invitation (Mocked)
            # send_caretaker_invitation.delay(user.id, hostel.name)
            
        return Response({
            'message': 'Caretaker invited successfully',
            'caretaker_id': user.id,
            'is_new_user': created
        }, status=status.HTTP_201_CREATED)
