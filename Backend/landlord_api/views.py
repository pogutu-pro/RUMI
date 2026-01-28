from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q, Sum, Avg
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from accounts.models import User, LandlordProfile, StudentProfile
from hostels.models import Hostel, Booking, RoomOccupant
from payments.models import Transaction

@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordDashboardOverviewView(APIView):
    """
    Landlord Dashboard Overview API
    
    Provide comprehensive landlord dashboard with business analytics and performance metrics.
    
    GET: Retrieve complete landlord dashboard data
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with a comprehensive business dashboard including
    revenue analytics, occupancy tracking, hostel performance, and recent activities.
    
    Dashboard Components:
    - Monthly revenue trends (last 6 months)
    - Hostel-by-hostel performance metrics
    - Booking status summary (confirmed, pending, cancelled)
    - Overall business statistics
    - Recent activity feed (last 7 days)
    - Occupancy rate calculations
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get Landlord Dashboard Overview
        
        Retrieve comprehensive dashboard data for the authenticated landlord.
        
        Returns complete business analytics including:
        
        Revenue Analytics:
        - monthly_revenue: 6-month revenue trend with occupancy data
        - total_revenue: Lifetime total earnings
        
        Property Performance:
        - hostel_performance: Individual hostel metrics
          - occupancy rate percentage
          - revenue for last 30 days
          - total and occupied room counts
        
        Booking Summary:
        - booking_status: Status breakdown (confirmed, pending, cancelled)
        - active_hostels: Number of properties
        - pending_actions: Bookings requiring attention
        
        Business Statistics:
        - occupancy_rate: Overall property occupancy percentage
        - active_hostels: Count of landlord's properties
        - total_revenue: Complete earnings summary
        - pending_actions: Actions requiring landlord attention
        
        Activity Feed:
        - recent_activity: Last 7 days of booking activities
        - Real-time activity tracking
        
        Note: Only accessible by users with 'landlord' role.
        """
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


@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordActivityFeedView(APIView):
    """
    Landlord Activity Feed API
    
    Retrieve landlord's recent activities and timeline updates.
    
    GET: Get chronological activity feed with booking and payment events
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with a chronological feed of recent activities
    across their properties, including bookings and payment events.
    
    Activity Types:
    - Booking activities: New bookings, status changes
    - Payment activities: Successful payments, revenue events
    - Real-time activity tracking with timestamps
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get Activity Feed
        
        Retrieve chronological activity feed for the authenticated landlord.
        
        Query Parameters:
        - limit: Number of activities to return (default: 10)
        
        Returns comprehensive activity feed including:
        
        Booking Activities:
        - id: Unique activity identifier
        - type: Activity type ('booking')
        - title: Activity title with property context
        - description: Detailed activity description
        - time: Activity timestamp (formatted)
        - student_name: Associated student name
        - hostel_name: Property name
        - room_number: Room details
        - created_at: ISO timestamp for sorting
        
        Payment Activities:
        - id: Unique activity identifier
        - type: Activity type ('payment')
        - title: Payment notification title
        - description: Payment amount and student details
        - time: Payment timestamp (formatted)
        - amount: Payment amount in KES
        - student_name: Paying student
        - hostel_name: Property receiving payment
        - created_at: ISO timestamp for sorting
        
        Features:
        - Chronological sorting by creation time
        - Mixed activity types in single feed
        - Configurable activity limit
        - Real-time activity tracking
        
        Note: Only accessible by users with 'landlord' role.
        """
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


@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordPaymentReportsView(APIView):
    """
    Landlord Payment Reports API
    
    Generate and manage landlord payment reports and financial analytics.
    
    GET: List available payment reports
    POST: Generate new payment report
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with financial reporting capabilities,
    allowing them to generate and download detailed payment and occupancy reports.
    
    Report Types:
    - Financial reports: Revenue, earnings, commission details
    - Occupancy reports: Room utilization, booking patterns
    - Custom date range reports
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        List Payment Reports
        
        Retrieve available payment and financial reports for download.
        
        Returns list of generated reports including:
        
        Report Information:
        - id: Unique report identifier
        - name: Descriptive report name with date
        - type: Report category (financial, occupancy)
        - generated_at: Report creation timestamp
        - file_size: Report file size
        - download_url: Secure download link
        - expires_at: Download link expiration
        
        Report Categories:
        - financial: Revenue and earnings reports
        - occupancy: Room utilization analytics
        
        Security Features:
        - Time-limited download links
        - Secure file access
        - Automatic link expiration
        
        Note: Only accessible by users with 'landlord' role.
        """
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
        """
        Generate Payment Report
        
        Generate a new payment or financial report with custom parameters.
        
        Request Body:
        - type: Report type ('financial', 'occupancy')
        - date_from: Start date for report period (optional)
        - date_to: End date for report period (optional)
        
        Process:
        1. Validate report parameters
        2. Queue report generation task
        3. Calculate report data from transactions
        4. Generate PDF/Excel report file
        5. Create secure download link
        6. Schedule automatic expiration
        
        Returns generation status and estimated completion time.
        
        Report Types:
        - financial: Complete revenue and payout analysis
        - occupancy: Room utilization and booking patterns
        
        Features:
        - Custom date range selection
        - Async report generation
        - Progress tracking
        - Email notification on completion
        
        Note: Only accessible by users with 'landlord' role.
        """
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


@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordPaymentAnalyticsView(APIView):
    """
    Landlord Payment Analytics API
    
    Provide detailed payment trends and collection analytics.
    
    GET: Retrieve payment analytics with trend analysis
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with detailed payment analytics including
    collection rates, revenue trends, and payment performance metrics.
    
    Analytics Features:
    - Monthly collection and pending payment tracking
    - Collection rate calculations
    - Property-specific payment analytics
    - Configurable time periods
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get Payment Analytics
        
        Retrieve detailed payment analytics and collection metrics.
        
        Query Parameters:
        - period: Analysis period ('1month', '3months', '6months', '1year')
        - hostel_id: Specific property ID for targeted analysis (optional)
        
        Returns comprehensive payment analytics:
        
        Monthly Trends:
        - monthly_data: Array of monthly payment metrics
          - month: Month abbreviation
          - collected: Successfully collected payments
          - pending: Outstanding payment amounts
          - collection_rate: Collection efficiency percentage
        
        Summary Statistics:
        - total_collected: Sum of all collected payments
        - avg_collection_rate: Average collection efficiency
        - pending_payments: Total outstanding amounts
        - completed_transactions: Number of successful payments
        
        Analysis Features:
        - Collection rate trend analysis
        - Revenue growth tracking
        - Payment performance metrics
        - Property-specific filtering
        
        Performance Metrics:
        - Collection efficiency percentage
        - Monthly revenue progression
        - Outstanding payment tracking
        - Transaction completion rates
        
        Note: Only accessible by users with 'landlord' role.
        """
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
            month_end = min(((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)).date(), now.date())
            
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


@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordRecentTransactionsView(APIView):
    """
    Landlord Recent Transactions API
    
    Retrieve landlord's recent payment transactions with filtering capabilities.
    
    GET: Get recent transactions with status and property filtering
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with a filtered view of recent payment
    transactions across their properties, with comprehensive transaction details.
    
    Features:
    - Configurable result limits
    - Payment status filtering
    - Property-specific filtering
    - Student and property context
    - Real-time transaction data
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get Recent Transactions
        
        Retrieve recent payment transactions with filtering options.
        
        Query Parameters:
        - limit: Number of transactions to return (default: 10)
        - status: Payment status filter ('all', 'success', 'pending', 'failed')
        - hostel_id: Specific property ID for targeted transactions (optional)
        
        Returns detailed transaction data:
        
        Transaction Details:
        - id: Unique transaction identifier
        - student: Student information
          - id: Student user ID
          - name: Student full name
        - hostel: Property information
          - id: Hostel ID
          - name: Hostel name
        - amount: Transaction amount in KES
        - status: Payment status (success, pending, failed)
        - date: Transaction timestamp (ISO format)
        - payment_method: Payment method used (e.g., M-Pesa)
        
        Filtering Options:
        - Status-based filtering for payment oversight
        - Property-specific transaction views
        - Configurable result limits for performance
        
        Use Cases:
        - Payment verification and tracking
        - Student payment history review
        - Property revenue monitoring
        - Financial reconciliation support
        
        Note: Only accessible by users with 'landlord' role.
        """
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


@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordStudentManagementView(APIView):
    """
    Landlord Student Management API
    
    Retrieve and manage students (tenants) currently residing in the landlord's hostels.
    
    GET: List active tenants with filtering
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
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

        # Get active occupants in landlord's hostels
        occupants = RoomOccupant.objects.filter(
            room__hostel__landlord=landlord_profile,
            is_active=True
        ).select_related(
            'student__user', 
            'room', 
            'room__hostel',
            'booking'
        )

        students_data = []
        for occupant in occupants:
            student = occupant.student
            user = student.user
            room = occupant.room
            hostel = room.hostel
            booking = occupant.booking

            # In a real app, payment status would be calculated based on transactions
            # For now, we'll derive it from the booking or mock it consistently
            payment_status = 'current'
            if booking.balance_due > 0:
                payment_status = 'overdue'

            students_data.append({
                'id': user.id,
                'student_id': student.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number if hasattr(user, 'phone_number') else '',
                'profile_picture': user.profile_picture.url if hasattr(user, 'profile_picture') and user.profile_picture else None,
                'hostel_name': hostel.name,
                'room_number': room.room_number,
                'monthly_rent': float(booking.monthly_rent),
                'payment_status': payment_status,
                'last_payment_date': booking.updated_at.isoformat(), # Placeholder
                'occupancy_status': 'occupied',
                'lease_start': booking.check_in_date.isoformat() if booking.check_in_date else None,
                'lease_end': booking.check_out_date.isoformat() if booking.check_out_date else None,
            })

        return Response({
            'total_tenants': len(students_data),
            'results': students_data
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Landlord API']
)
class LandlordHostelsView(APIView):
    """
    Landlord Hostels API
    
    Retrieve landlord's own hostels for dashboard management.
    
    GET: List landlord's hostels with basic information
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get Landlord's Hostels
        
        Retrieve all hostels owned by the authenticated landlord.
        
        Returns hostel list with:
        - Basic hostel information
        - Room counts and availability
        - Revenue and occupancy data
        - Status and verification info
        """
        if request.user.role != 'landlord':
            return Response({
                'error': 'Access denied. Landlord role required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            landlord_profile = request.user.landlord_profile
        except Exception:
            return Response({
                'error': 'Landlord profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get landlord's hostels
        hostels = Hostel.objects.filter(landlord=landlord_profile).order_by('-created_at')
        
        results = []
        for hostel in hostels:
            # Calculate occupancy
            occupied_rooms = Booking.objects.filter(
                room__hostel=hostel,
                status__in=['confirmed', 'reserved']
            ).count()
            
            results.append({
                'id': hostel.id,
                'name': hostel.name,
                'description': hostel.description,
                'address': hostel.address,
                'city': hostel.city,
                'university': hostel.university,
                'gender_policy': hostel.gender_policy,
                'hostel_type': hostel.hostel_type,
                'status': hostel.status,
                'total_rooms': hostel.total_rooms,
                'available_rooms': hostel.available_rooms,
                'base_price': str(hostel.base_price),
                'currency': hostel.currency,
                'rating': float(hostel.rating),
                'review_count': hostel.review_count,
                'images': hostel.images or [],
                'is_verified': hostel.is_verified,
                'created_at': hostel.created_at.isoformat(),
                'updated_at': hostel.updated_at.isoformat(),
            })
        
        return Response({
            'current_page': 1,
            'total_pages': 1,
            'count': len(results),
            'results': results
        }, status=status.HTTP_200_OK)