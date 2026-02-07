from rest_framework import serializers
from .subscription_models import SubscriptionPlan, OccupancySnapshot, SubscriptionInvoice
from hostels.models import Hostel

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class OccupancySnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = OccupancySnapshot
        fields = '__all__'

class SubscriptionInvoiceSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    
    class Meta:
        model = SubscriptionInvoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'created_at', 'updated_at']
