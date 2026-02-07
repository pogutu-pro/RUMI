from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from hostels.bed_models import Bed
from accounts.permissions import IsLandlord
from rest_framework import serializers

class BedUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = ['custom_account_number', 'price_override', 'is_active']
        extra_kwargs = {
            'custom_account_number': {'required': False, 'allow_null': True},
            'price_override': {'required': False, 'allow_null': True},
            'is_active': {'required': False}
        }

    def validate_custom_account_number(self, value):
        if value == "":
            return None
        # Check uniqueness excluding self is handled by database constraint,
        # but friendly error needed
        if value and Bed.objects.filter(custom_account_number=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("This account number is already in use by another bed.")
        return value

class BedUpdateView(generics.UpdateAPIView):
    """
    Endpoint for landlords to update specific bed details.
    
    Allows updating:
    - Custom Account Number (for M-Pesa tracking)
    - Price Override
    - Active Status
    """
    permission_classes = [IsLandlord]
    serializer_class = BedUpdateSerializer
    queryset = Bed.objects.all()
    lookup_field = 'id'

    def get_queryset(self):
        # Ensure landlord owns the bed
        return Bed.objects.filter(room__hostel__landlord=self.request.user.landlord_profile)
