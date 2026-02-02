"""
RentPeriod API Views

API endpoints for the canonical RentPeriod architecture.
Provides access to rent periods, student wallets, and transfer logs.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404

from .models import RentPeriod, StudentPaymentTracker, TransferLog
from .serializers import RentPeriodSerializer, StudentPaymentTrackerSerializer, TransferLogSerializer
from accounts.permissions import IsStudent, IsLandlord
from accounts.models import StudentProfile


class RentPeriodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for RentPeriod - the canonical rent ledger.
    
    Students can view their own rent periods.
    Landlords can view rent periods for their hostels.
    
    Endpoints:
    - GET /api/v1/payments/rent-periods/ - List rent periods
    - GET /api/v1/payments/rent-periods/{id}/ - Retrieve specific period
    - GET /api/v1/payments/rent-periods/current/ - Get current period
    - GET /api/v1/payments/rent-periods/overdue/ - Get overdue periods
    """
    pagination_class = None
    serializer_class = RentPeriodSerializer
    permission_classes = [permissions.IsAuthenticated]

    
    def get_queryset(self):
        user = self.request.user
        
        # Students see only their own rent periods
        if hasattr(user, 'student_profile'):
            return RentPeriod.objects.filter(
                student=user.student_profile
            ).select_related(
                'student__user', 'hostel', 'room', 'booking'
            ).prefetch_related('transactions')
        
        # Landlords see rent periods for their hostels
        elif hasattr(user, 'landlord_profile'):
            return RentPeriod.objects.filter(
                hostel__landlord=user.landlord_profile
            ).select_related(
                'student__user', 'hostel', 'room', 'booking'
            ).prefetch_related('transactions')
        
        # Caretakers see rent periods for their assigned hostel
        elif hasattr(user, 'caretaker_profile'):
            return RentPeriod.objects.filter(
                hostel=user.caretaker_profile.hostel
            ).select_related(
                'student__user', 'hostel', 'room', 'booking'
            ).prefetch_related('transactions')

        
        # Admins see all
        elif user.is_staff or user.is_superuser:
            return RentPeriod.objects.all().select_related(
                'student__user', 'hostel', 'room', 'booking'
            ).prefetch_related('transactions')
        
        return RentPeriod.objects.none()
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current active rent period for the student"""
        if not hasattr(request.user, 'student_profile'):
            return Response(
                {'error': 'Only students can access current rent period'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from datetime import date
        today = date.today()
        
        current_period = RentPeriod.objects.filter(
            student=request.user.student_profile,
            start_date__lte=today,
            end_date__gte=today
        ).select_related(
            'student__user', 'hostel', 'room', 'booking'
        ).prefetch_related('transactions').first()
        
        if not current_period:
            return Response(
                {'error': 'No current rent period found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(current_period)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue rent periods"""
        queryset = self.get_queryset().filter(status='overdue')
        
        # For students, also include partially paid periods past due date
        if hasattr(request.user, 'student_profile'):
            from datetime import date
            today = date.today()
            queryset = queryset | self.get_queryset().filter(
                status='partially_paid',
                end_date__lt=today
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for rent periods"""
        queryset = self.get_queryset()
        
        total_due = queryset.aggregate(Sum('amount_due'))['amount_due__sum'] or 0
        total_paid = queryset.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        
        summary = {
            'total_periods': queryset.count(),
            'paid_periods': queryset.filter(status='paid').count(),
            'overdue_periods': queryset.filter(status='overdue').count(),
            'partially_paid_periods': queryset.filter(status='partially_paid').count(),
            'total_amount_due': float(total_due),
            'total_amount_paid': float(total_paid),
            'total_balance': float(total_due - total_paid),
        }
        
        return Response(summary)


class StudentPaymentTrackerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for StudentPaymentTracker - tracks overpayments/credits.
    
    Students can view their own wallet.
    Landlords cannot access wallets.
    
    Endpoints:
    - GET /api/v1/payments/wallet/ - Get student's wallet
    """
    pagination_class = None
    serializer_class = StudentPaymentTrackerSerializer
    permission_classes = [permissions.IsAuthenticated]

    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'student_profile'):
            return StudentPaymentTracker.objects.filter(student=user.student_profile)
        
        # Landlords see wallets of their tenants
        elif hasattr(user, 'landlord_profile'):
            return StudentPaymentTracker.objects.filter(
                student__bookings__hostel__landlord=user.landlord_profile
            ).distinct()
            
        # Caretakers see wallets of their tenants
        elif hasattr(user, 'caretaker_profile'):
            return StudentPaymentTracker.objects.filter(
                student__bookings__hostel=user.caretaker_profile.hostel
            ).distinct()
            
        # Admins see all
        elif user.is_staff or user.is_superuser:
            return StudentPaymentTracker.objects.all()

    
    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        """Get the authenticated student's wallet"""
        if not hasattr(request.user, 'student_profile'):
            return Response(
                {'error': 'Only students have wallets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        wallet, created = StudentPaymentTracker.objects.get_or_create(
            student=request.user.student_profile
        )
        
        serializer = self.get_serializer(wallet)
        return Response(serializer.data)


class TransferLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for TransferLog - audit trail for room transfers.
    
    Students can view their own transfer history.
    Landlords can view transfers for their hostels.
    
    Endpoints:
    - GET /api/v1/payments/transfers/ - List transfer logs
    - GET /api/v1/payments/transfers/{id}/ - Retrieve specific transfer
    """
    pagination_class = None
    serializer_class = TransferLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Students see only their own transfers
        if hasattr(user, 'student_profile'):
            return TransferLog.objects.filter(
                student=user.student_profile
            ).select_related(
                'student__user',
                'from_rent_period__hostel',
                'from_rent_period__room',
                'to_rent_period__hostel',
                'to_rent_period__room'
            )
        
        # Landlords see transfers for their hostels
        elif hasattr(user, 'landlord_profile'):
            return TransferLog.objects.filter(
                Q(from_rent_period__hostel__landlord=user.landlord_profile) |
                Q(to_rent_period__hostel__landlord=user.landlord_profile)
            ).select_related(
                'student__user',
                'from_rent_period__hostel',
                'from_rent_period__room',
                'to_rent_period__hostel',
                'to_rent_period__room'
            )
        
        # Caretakers see transfers for their assigned hostel
        elif hasattr(user, 'caretaker_profile'):
            return TransferLog.objects.filter(
                Q(from_rent_period__hostel=user.caretaker_profile.hostel) |
                Q(to_rent_period__hostel=user.caretaker_profile.hostel)
            ).select_related(
                'student__user',
                'from_rent_period__hostel',
                'from_rent_period__room',
                'to_rent_period__hostel',
                'to_rent_period__room'
            )

        
        # Admins see all
        elif user.is_staff or user.is_superuser:
            return TransferLog.objects.all().select_related(
                'student__user',
                'from_rent_period__hostel',
                'from_rent_period__room',
                'to_rent_period__hostel',
                'to_rent_period__room'
            )
        
        return TransferLog.objects.none()
