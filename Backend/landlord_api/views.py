from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q, Sum, Avg
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth

from accounts.models import User, LandlordProfile
from hostels.models import Hostel, Booking
from payments.models import Transaction

class LandlordDashboardOverviewView(APIView):
    """Get comprehensive landlord dashboard data"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return comprehensive landlord dashboard statistics"""
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            landlord_profile = request.user.landlord_profile
        except LandlordProfile.DoesNotExist:
            return Response({
                'error': 'Landlord profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get landlord's hostels
        hostels = Hostel.objects.filter(landlord=landlord_profile)
        hostel_ids = hostels.values_list('id', flat=True)
        
        # Calculate date ranges
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Monthly revenue data (last 6 months)
        monthly_revenue = []
        current_date = now.replace(day=1) - timedelta(days=180)
        
        for i in range(6):
            month_start = current_date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            # Get transactions for this month
            month_transactions = Transaction.objects.filter(
                booking__room__hostel_id__in=hostel_ids,
                status='success',
                paid_at__date__gte=month_start,
                paid_at__date__lte=month_end
            )
            
            revenue = month_transactions.aggregate(total=Sum('total_charged_amount'))['total'] or 0
            occupancy_count = Booking.objects.filter(
                room__hostel_id__in=hostel_ids,
                status__in=['confirmed', 'reserved'],
                check_in_date__lte=month_end,
                check_out_date__gte=month_start
            ).count()
            
            monthly_revenue.append({
                'month': month_start.strftime('%b'),
                'revenue': float(revenue),
                'occupancy': occupancy_count
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Hostel performance data
        hostel_performance = []
        for hostel in hostels:
            total_rooms = hostel.total_rooms
            occupied_rooms = Booking.objects.filter(
                room__hostel=hostel,
                status__in=['confirmed', 'reserved'],
                check_in_date__lte=now,
                check_out_date__gte=now
            ).count()
            
            occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
            
            # Calculate revenue for this hostel (last 30 days)
            hostel_revenue = Transaction.objects.filter(
                booking__room__hostel=hostel,
                status='success',
                paid_at__date__gte=month_ago,
                paid_at__date__lte=today
            ).aggregate(total=Sum('total_charged_amount'))['total'] or 0
            
            hostel_performance.append({
                'id': hostel.id,
                'name': hostel.name,
                'occupancy': round(occupancy_rate, 1),
                'revenue': float(hostel_revenue),
                'total_rooms': total_rooms,
                'occupied_rooms': occupied_rooms
            })
        
        # Booking status summary
        booking_status = Booking.objects.filter(
            room__hostel_id__in=hostel_ids
        ).aggregate(
            confirmed=Count('id', filter=Q(status='confirmed')),
            pending=Count('id', filter=Q(status='pending')),
            cancelled=Count('id', filter=Q(status='cancelled'))
        )
        
        # Overall stats
        total_revenue = Transaction.objects.filter(
            booking__room__hostel_id__in=hostel_ids,
            status='success'
        ).aggregate(total=Sum('total_charged_amount'))['total'] or 0
        
        # Calculate occupancy rate
        total_capacity = sum(hostel.total_rooms for hostel in hostels)
        current_occupancy = Booking.objects.filter(
            room__hostel_id__in=hostel_ids,
            status__in=['confirmed', 'reserved'],
            check_in_date__lte=now,
            check_out_date__gte=now
        ).count()
        
        overall_occupancy_rate = (current_occupancy / total_capacity * 100) if total_capacity > 0 else 0
        
        # Recent activity (last 7 days)
        recent_activities = []
        recent_bookings = Booking.objects.filter(
            room__hostel_id__in=hostel_ids,
            created_at__date__gte=week_ago,
            created_at__date__lte=today
        ).order_by('-created_at')[:5]
        
        for booking in recent_bookings:
            recent_activities.append({
                'type': 'booking',
                'description': f'New booking for {booking.room.hostel.name}',
                'time': booking.created_at.strftime('%Y-%m-%d %H:%M'),
                'student': booking.student.user.get_full_name() if booking.student else 'Unknown'
            })
        
        return Response({
            'monthly_revenue': monthly_revenue,
            'hostel_performance': hostel_performance,
            'booking_status': {
                'confirmed': booking_status['confirmed'],
                'pending': booking_status['pending'],
                'cancelled': booking_status['cancelled']
            },
            'stats': {
                'total_revenue': float(total_revenue),
                'occupancy_rate': round(overall_occupancy_rate, 1),
                'active_hostels': hostels.count(),
                'pending_actions': Booking.objects.filter(
                    room__hostel_id__in=hostel_ids,
                    status='pending'
                ).count()
            },
            'recent_activity': recent_activities
        }, status=status.HTTP_200_OK)


class LandlordActivityFeedView(APIView):
    """Get landlord's recent activities"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return landlord's recent activities"""
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            landlord_profile = request.user.landlord_profile
        except LandlordProfile.DoesNotExist:
            return Response({
                'error': 'Landlord profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        limit = int(request.query_params.get('limit', 10))
        
        # Get recent bookings
        recent_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord_profile
        ).select_related('student__user', 'room__hostel').order_by('-created_at')[:limit]
        
        activities = []
        for booking in recent_bookings:
            activities.append({
                'id': f'booking_{booking.id}',
                'type': 'booking',
                'title': f'New Booking - {booking.room.hostel.name}',
                'description': f'{booking.student.user.get_full_name()} booked {booking.room.room_number}',
                'time': booking.created_at.strftime('%Y-%m-%d %H:%M'),
                'student_name': booking.student.user.get_full_name(),
                'hostel_name': booking.room.hostel.name,
                'room_number': booking.room.room_number,
                'created_at': booking.created_at.isoformat()
            })
        
        # Add payment activities
        recent_payments = Transaction.objects.filter(
            booking__room__hostel__landlord=landlord_profile,
            status='success'
        ).select_related('booking__student__user', 'booking__room__hostel').order_by('-paid_at')[:limit//2]
        
        for payment in recent_payments:
            activities.append({
                'id': f'payment_{payment.id}',
                'type': 'payment',
                'title': f'Payment Received - {payment.booking.room.hostel.name}',
                'description': f'KES {payment.total_charged_amount} from {payment.booking.student.user.get_full_name()}',
                'time': payment.paid_at.strftime('%Y-%m-%d %H:%M'),
                'amount': float(payment.total_charged_amount),
                'student_name': payment.booking.student.user.get_full_name(),
                'hostel_name': payment.booking.room.hostel.name,
                'created_at': payment.paid_at.isoformat()
            })
        
        # Sort all activities by time
        activities.sort(key=lambda x: x['created_at'], reverse=True)
        activities = activities[:limit]
        
        return Response({
            'activities': activities,
            'total': len(activities)
        }, status=status.HTTP_200_OK)


class LandlordPaymentReportsView(APIView):
    """Landlord payment reports and analytics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get landlord payment reports"""
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            landlord_profile = request.user.landlord_profile
        except LandlordProfile.DoesNotExist:
            return Response({
                'error': 'Landlord profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # For now, return mock report data
        # In production, this would generate actual PDF/Excel reports
        reports = [
            {
                'id': '1',
                'name': 'Monthly Revenue Report - December 2024',
                'type': 'financial',
                'generated_at': '2024-12-15T10:00:00Z',
                'file_size': '2.4 MB',
                'download_url': '/api/v1/landlord/payments/reports/1/download/',
                'expires_at': '2024-12-22T10:00:00Z'
            },
            {
                'id': '2',
                'name': 'Occupancy Report - Q4 2024',
                'type': 'occupancy',
                'generated_at': '2024-12-01T09:00:00Z',
                'file_size': '1.8 MB',
                'download_url': '/api/v1/landlord/payments/reports/2/download/',
                'expires_at': '2024-12-08T09:00:00Z'
            }
        ]
        
        return Response({
            'reports': reports
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Generate new payment report"""
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        report_type = request.data.get('type', 'financial')
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')
        
        # In production, this would trigger report generation
        return Response({
            'report_id': 'new_report_123',
            'status': 'generating',
            'estimated_time': 120,  # seconds
            'message': f'Report generation started for {report_type} from {date_from} to {date_to}'
        }, status=status.HTTP_200_OK)


class LandlordPaymentAnalyticsView(APIView):
    """Get landlord payment analytics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get payment trends and statistics"""
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            landlord_profile = request.user.landlord_profile
        except LandlordProfile.DoesNotExist:
            return Response({
                'error': 'Landlord profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        period = request.query_params.get('period', '6months')
        hostel_id = request.query_params.get('hostel_id')
        
        # Calculate date range based on period
        now = timezone.now()
        if period == '1month':
            start_date = now - timedelta(days=30)
        elif period == '3months':
            start_date = now - timedelta(days=90)
        elif period == '6months':
            start_date = now - timedelta(days=180)
        elif period == '1year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=180)
        
        # Get landlord's transactions
        queryset = Transaction.objects.filter(
            booking__room__hostel__landlord=landlord_profile,
            status='success',
            paid_at__date__gte=start_date,
            paid_at__date__lte=now.date()
        )
        
        # Filter by hostel if specified
        if hostel_id:
            queryset = queryset.filter(booking__room__hostel_id=hostel_id)
        
        # Calculate monthly data
        monthly_data = []
        current_date = start_date.replace(day=1)
        
        while current_date <= now:
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), now.date())
            
            month_transactions = queryset.filter(
                paid_at__date__gte=current_date,
                paid_at__date__lte=month_end
            )
            
            collected = month_transactions.aggregate(total=Sum('total_charged_amount'))['total'] or 0
            pending = month_transactions.filter(status='pending').aggregate(total=Sum('total_charged_amount'))['total'] or 0
            
            collection_rate = (collected / (collected + pending) * 100) if (collected + pending) > 0 else 0
            
            monthly_data.append({
                'month': current_date.strftime('%b'),
                'collected': float(collected),
                'pending': float(pending),
                'collection_rate': round(collection_rate, 1)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Calculate summary
        total_collected = queryset.aggregate(total=Sum('total_charged_amount'))['total'] or 0
        total_pending = queryset.filter(status='pending').aggregate(total=Sum('total_charged_amount'))['total'] or 0
        avg_collection_rate = sum(item['collection_rate'] for item in monthly_data) / len(monthly_data) if monthly_data else 0
        
        return Response({
            'monthly_data': monthly_data,
            'summary': {
                'total_collected': float(total_collected),
                'avg_collection_rate': round(avg_collection_rate, 1),
                'pending_payments': float(total_pending),
                'completed_transactions': queryset.count()
            }
        }, status=status.HTTP_200_OK)


class LandlordRecentTransactionsView(APIView):
    """Get landlord's recent transactions"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get recent transactions with filtering"""
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            landlord_profile = request.user.landlord_profile
        except LandlordProfile.DoesNotExist:
            return Response({
                'error': 'Landlord profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        limit = int(request.query_params.get('limit', 10))
        status_filter = request.query_params.get('status', 'all')
        hostel_id = request.query_params.get('hostel_id')
        
        queryset = Transaction.objects.filter(
            booking__room__hostel__landlord=landlord_profile
        ).select_related(
            'booking__student__user',
            'booking__room__hostel'
        ).order_by('-paid_at')
        
        # Apply filters
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        if hostel_id:
            queryset = queryset.filter(booking__room__hostel_id=hostel_id)
        
        transactions = queryset[:limit]
        
        transaction_data = []
        for transaction in transactions:
            transaction_data.append({
                'id': transaction.id,
                'student': {
                    'id': transaction.booking.student.id,
                    'name': transaction.booking.student.user.get_full_name()
                },
                'hostel': {
                    'id': transaction.booking.room.hostel.id,
                    'name': transaction.booking.room.hostel.name
                },
                'amount': float(transaction.total_charged_amount),
                'status': transaction.status,
                'date': transaction.paid_at.isoformat() if transaction.paid_at else transaction.created_at.isoformat(),
                'payment_method': 'M-Pesa'  # This would come from transaction details
            })
        
        return Response({
            'transactions': transaction_data
        }, status=status.HTTP_200_OK)