from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from .subscription_models import SubscriptionPlan, OccupancySnapshot, SubscriptionInvoice
from .subscription_serializers import (
    SubscriptionPlanSerializer, 
    OccupancySnapshotSerializer, 
    SubscriptionInvoiceSerializer
)
from accounts.permissions import IsVerifiedLandlord

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """View available subscription plans"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

class SubscriptionInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Manage landlord subscription invoices"""
    serializer_class = SubscriptionInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsVerifiedLandlord]

    def get_queryset(self):
        return SubscriptionInvoice.objects.filter(landlord=self.request.user.landlord_profile)

class SubscriptionAccrualView(APIView):
    """
    Get real-time unbilled accrual for the current month.
    """
    permission_classes = [permissions.IsAuthenticated, IsVerifiedLandlord]

    def get(self, request):
        landlord = request.user.landlord_profile
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Aggregate all snapshots for this landlord's hostels since month start
        snapshots = OccupancySnapshot.objects.filter(
            hostel__landlord=landlord,
            snapshot_date__gte=month_start,
            snapshot_date__lte=today
        )
        
        total_occupied_bed_days = snapshots.aggregate(total=Sum('occupied_beds'))['total'] or 0
        
        # Get the default per-bed plan rate
        try:
            plan = SubscriptionPlan.objects.get(pricing_model='per_bed', is_default=True)
            rate = plan.unit_price
        except SubscriptionPlan.DoesNotExist:
            rate = Decimal('29.00') # Fallback
            
        projected_cost = (Decimal(str(total_occupied_bed_days)) / Decimal('30.00')) * rate

        return Response({
            'period_start': month_start,
            'as_of': today,
            'total_occupied_bed_days': total_occupied_bed_days,
            'projected_accrual': float(projected_cost),
            'currency': 'KES',
            'hostel_breakdown': snapshots.values('hostel__name').annotate(
                bed_days=Sum('occupied_beds')
            )
        })
