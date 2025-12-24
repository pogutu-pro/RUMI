from datetime import datetime, timedelta, date
from decimal import Decimal
from django.db.models import (
    Sum, Count, Avg, F, Q, Case, When, Value, IntegerField,
    ExpressionWrapper, DurationField
)
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AnalyticsEvent, LandlordAnalytics, CaretakerAnalytics, StudentAnalytics
)
from accounts.permissions import IsLandlord, IsAdminOrSuperAdmin
from accounts.models import User


class LandlordRevenueAnalyticsView(APIView):
    """Get detailed revenue analytics for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get revenue analytics with multiple timeframes"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        # Get query parameters
        timeframe = request.query_params.get('timeframe', '6_months')  # 1_week, 1_month, 3_months, 6_months, 1_year
        hostel_id = request.query_params.get('hostel_id')  # Optional filter by specific hostel
        
        # Calculate date range based on timeframe
        end_date = timezone.now().date()
        if timeframe == '1_week':
            start_date = end_date - timedelta(weeks=1)
        elif timeframe == '1_month':
            start_date = end_date - timedelta(days=30)
        elif timeframe == '3_months':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '6_months':
            start_date = end_date - timedelta(days=180)
        elif timeframe == '1_year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)  # Default 6 months
        
        # Get bookings and payments data
        from hostels.models import Booking
        from payments.models import Transaction
        
        # Base queryset
        bookings_qs = Booking.objects.filter(
            room__hostel__landlord=landlord,
            status__in=['confirmed', 'completed']
        )
        
        if hostel_id:
            bookings_qs = bookings_qs.filter(room__hostel_id=hostel_id)
        
        # Filter by date range
        bookings_qs = bookings_qs.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        # Get transactions
        transactions_qs = Transaction.objects.filter(
            landlord=landlord,
            status='success'
        ).filter(
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date
        )
        
        # Calculate metrics
        total_revenue = transactions_qs.aggregate(
            total=Sum('landlord_payout_amount')
        )['total'] or Decimal('0')
        
        total_bookings = bookings_qs.count()
        confirmed_bookings = bookings_qs.filter(status='confirmed').count()
        cancelled_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            status='cancelled',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()
        
        average_booking_value = bookings_qs.aggregate(
            avg=Avg('total_amount')
        )['avg'] or Decimal('0')
        
        # Monthly revenue breakdown
        monthly_revenue = []
        current_date = start_date.replace(day=1)
        while current_date <= end_date:
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)
            
            month_transactions = transactions_qs.filter(
                paid_at__date__gte=current_date,
                paid_at__date__lte=month_end
            )
            
            month_revenue = month_transactions.aggregate(
                total=Sum('landlord_payout_amount')
            )['total'] or Decimal('0')
            
            monthly_revenue.append({
                'month': current_date.strftime('%Y-%m'),
                'revenue': float(month_revenue),
                'bookings': bookings_qs.filter(
                    created_at__date__gte=current_date,
                    created_at__date__lte=month_end
                ).count()
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Revenue breakdown by payment method
        revenue_by_method = transactions_qs.values('payment_method').annotate(
            total_amount=Sum('landlord_payout_amount'),
            transaction_count=Count('id')
        ).order_by('-total_amount')
        
        revenue_by_method_list = []
        for item in revenue_by_method:
            revenue_by_method_list.append({
                'payment_method': item['payment_method'] or 'Unknown',
                'total_amount': float(item['total_amount']),
                'transaction_count': item['transaction_count']
            })
        
        # Calculate growth (compare with previous period)
        prev_start_date = start_date - (end_date - start_date)
        prev_transactions = Transaction.objects.filter(
            landlord=landlord,
            status='success',
            paid_at__date__gte=prev_start_date,
            paid_at__date__lt=start_date
        )
        
        prev_revenue = prev_transactions.aggregate(
            total=Sum('landlord_payout_amount')
        )['total'] or Decimal('0')
        
        revenue_growth = Decimal('0')
        if prev_revenue > 0:
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue) * 100
        
        return Response({
            'timeframe': timeframe,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'total_revenue': float(total_revenue),
                'total_bookings': total_bookings,
                'confirmed_bookings': confirmed_bookings,
                'cancelled_bookings': cancelled_bookings,
                'average_booking_value': float(average_booking_value),
                'revenue_growth': float(revenue_growth)
            },
            'monthly_revenue': monthly_revenue,
            'revenue_by_payment_method': revenue_by_method_list
        }, status=status.HTTP_200_OK)


class LandlordOccupancyAnalyticsView(APIView):
    """Get occupancy analytics for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get occupancy analytics"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        timeframe = request.query_params.get('timeframe', '6_months')
        hostel_id = request.query_params.get('hostel_id')
        
        # Calculate date range
        end_date = timezone.now().date()
        if timeframe == '1_week':
            start_date = end_date - timedelta(weeks=1)
        elif timeframe == '1_month':
            start_date = end_date - timedelta(days=30)
        elif timeframe == '3_months':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '6_months':
            start_date = end_date - timedelta(days=180)
        elif timeframe == '1_year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)
        
        from hostels.models import Hostel, Room, Booking
        
        # Get hostels
        hostels_qs = Hostel.objects.filter(landlord=landlord)
        if hostel_id:
            hostels_qs = hostels_qs.filter(id=hostel_id)
        
        # Calculate occupancy for each hostel
        hostels_data = []
        total_rooms = 0
        total_occupied_rooms = 0
        
        for hostel in hostels_qs:
            rooms = Room.objects.filter(hostel=hostel)
            total_hostel_rooms = rooms.count()
            occupied_rooms = rooms.filter(status='occupied').count()
            available_rooms = rooms.filter(status='available').count()
            maintenance_rooms = rooms.filter(status='maintenance').count()
            
            # Calculate occupancy rate
            occupancy_rate = Decimal('0')
            if total_hostel_rooms > 0:
                occupancy_rate = (Decimal(occupied_rooms) / Decimal(total_hostel_rooms)) * 100
            
            # Get bookings data for this hostel
            bookings_qs = Booking.objects.filter(
                room__hostel=hostel,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            
            monthly_bookings = []
            current_date = start_date.replace(day=1)
            while current_date <= end_date:
                month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)
                
                month_bookings = bookings_qs.filter(
                    created_at__date__gte=current_date,
                    created_at__date__lte=month_end
                ).count()
                
                monthly_bookings.append({
                    'month': current_date.strftime('%Y-%m'),
                    'bookings': month_bookings
                })
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            hostels_data.append({
                'hostel_id': hostel.id,
                'hostel_name': hostel.name,
                'total_rooms': total_hostel_rooms,
                'occupied_rooms': occupied_rooms,
                'available_rooms': available_rooms,
                'maintenance_rooms': maintenance_rooms,
                'occupancy_rate': float(occupancy_rate),
                'monthly_bookings': monthly_bookings
            })
            
            total_rooms += total_hostel_rooms
            total_occupied_rooms += occupied_rooms
        
        # Overall occupancy rate
        overall_occupancy_rate = Decimal('0')
        if total_rooms > 0:
            overall_occupancy_rate = (Decimal(total_occupied_rooms) / Decimal(total_rooms)) * 100
        
        # Average length of stay
        completed_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            status='completed',
            check_in_date__isnull=False,
            check_out_date__isnull=False,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        average_stay_duration = 0
        if completed_bookings.exists():
            total_days = 0
            count = 0
            for booking in completed_bookings:
                if booking.check_out_date and booking.check_in_date:
                    duration = (booking.check_out_date - booking.check_in_date).days
                    total_days += duration
                    count += 1
            if count > 0:
                average_stay_duration = total_days / count
        
        return Response({
            'timeframe': timeframe,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'overall_occupancy_rate': float(overall_occupancy_rate),
                'total_rooms': total_rooms,
                'total_occupied_rooms': total_occupied_rooms,
                'average_stay_duration_days': average_stay_duration,
                'total_hostels': len(hostels_data)
            },
            'hostels': hostels_data
        }, status=status.HTTP_200_OK)


class LandlordGrowthAnalyticsView(APIView):
    """Get growth analytics for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get growth analytics"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        timeframe = request.query_params.get('timeframe', '6_months')
        
        # Calculate date ranges
        end_date = timezone.now().date()
        if timeframe == '1_week':
            current_start = end_date - timedelta(weeks=1)
            previous_start = current_start - timedelta(weeks=1)
            previous_end = current_start
        elif timeframe == '1_month':
            current_start = end_date - timedelta(days=30)
            previous_start = current_start - timedelta(days=30)
            previous_end = current_start
        elif timeframe == '3_months':
            current_start = end_date - timedelta(days=90)
            previous_start = current_start - timedelta(days=90)
            previous_end = current_start
        elif timeframe == '6_months':
            current_start = end_date - timedelta(days=180)
            previous_start = current_start - timedelta(days=180)
            previous_end = current_start
        elif timeframe == '1_year':
            current_start = end_date - timedelta(days=365)
            previous_start = current_start - timedelta(days=365)
            previous_end = current_start
        else:
            current_start = end_date - timedelta(days=180)
            previous_start = current_start - timedelta(days=180)
            previous_end = current_start
        
        from hostels.models import Booking
        from payments.models import Transaction
        
        # Current period metrics
        current_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            created_at__date__gte=current_start,
            created_at__date__lte=end_date
        )
        
        current_revenue = Transaction.objects.filter(
            landlord=landlord,
            status='success',
            paid_at__date__gte=current_start,
            paid_at__date__lte=end_date
        ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
        
        # Previous period metrics
        previous_bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            created_at__date__gte=previous_start,
            created_at__date__lt=current_start
        )
        
        previous_revenue = Transaction.objects.filter(
            landlord=landlord,
            status='success',
            paid_at__date__gte=previous_start,
            paid_at__date__lt=current_start
        ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
        
        # Calculate growth rates
        booking_growth = Decimal('0')
        revenue_growth = Decimal('0')
        
        if previous_bookings.count() > 0:
            booking_growth = ((current_bookings.count() - previous_bookings.count()) / previous_bookings.count()) * 100
        
        if previous_revenue > 0:
            revenue_growth = ((current_revenue - previous_revenue) / previous_revenue) * 100
        
        # Customer acquisition
        new_customers = current_bookings.filter(
            student__user__date_joined__gte=current_start
        ).count()
        
        returning_customers = current_bookings.filter(
            student__user__date_joined__lt=current_start
        ).count()
        
        customer_acquisition_rate = Decimal('0')
        total_customers = new_customers + returning_customers
        if total_customers > 0:
            customer_acquisition_rate = (Decimal(new_customers) / Decimal(total_customers)) * 100
        
        # Monthly growth trend
        monthly_growth = []
        current_date = current_start.replace(day=1)
        while current_date <= end_date:
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)
            
            month_bookings = Booking.objects.filter(
                room__hostel__landlord=landlord,
                created_at__date__gte=current_date,
                created_at__date__lte=month_end
            ).count()
            
            month_revenue = Transaction.objects.filter(
                landlord=landlord,
                status='success',
                paid_at__date__gte=current_date,
                paid_at__date__lte=month_end
            ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
            
            monthly_growth.append({
                'month': current_date.strftime('%Y-%m'),
                'bookings': month_bookings,
                'revenue': float(month_revenue)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return Response({
            'timeframe': timeframe,
            'period': {
                'current_start': current_start.isoformat(),
                'current_end': end_date.isoformat(),
                'previous_start': previous_start.isoformat(),
                'previous_end': previous_end.isoformat()
            },
            'growth_metrics': {
                'booking_growth_rate': float(booking_growth),
                'revenue_growth_rate': float(revenue_growth),
                'customer_acquisition_rate': float(customer_acquisition_rate),
                'new_customers': new_customers,
                'returning_customers': returning_customers
            },
            'current_period': {
                'bookings': current_bookings.count(),
                'revenue': float(current_revenue)
            },
            'previous_period': {
                'bookings': previous_bookings.count(),
                'revenue': float(previous_revenue)
            },
            'monthly_growth': monthly_growth
        }, status=status.HTTP_200_OK)


class AnalyticsDashboardView(APIView):
    """General analytics dashboard for platform-wide or landlord-specific data"""

    permission_classes = [IsAdminOrSuperAdmin | IsLandlord]

    def get(self, request):
        """Get analytics dashboard data"""
        user = request.user
        period = request.query_params.get('period', '180d')

        # Calculate date range based on period
        end_date = timezone.now().date()
        if period == '30d':
            start_date = end_date - timedelta(days=30)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        elif period == '1y':
            start_date = end_date - timedelta(days=365)
        else:  # 180d default
            start_date = end_date - timedelta(days=180)

        # Determine scope based on user role
        if user.role in ['super_admin', 'admin']:
            # Platform-wide analytics
            landlord_filter = {}
        else:
            # Landlord-specific analytics
            landlord = user.landlord_profile if hasattr(user, 'landlord_profile') else user
            landlord_filter = {'landlord': landlord}

        from hostels.models import Booking, Hostel, Room
        from payments.models import Transaction
        from accounts.models import StudentProfile

        # Get bookings in period
        bookings = Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            **landlord_filter
        )

        # Get transactions in period
        transactions = Transaction.objects.filter(
            status='success',
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date,
            **landlord_filter
        )

        # Calculate metrics
        total_revenue = transactions.aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
        total_bookings = bookings.count()
        confirmed_bookings = bookings.filter(status='confirmed').count()
        completed_bookings = bookings.filter(status='completed').count()

        # User metrics
        if user.role in ['super_admin', 'admin']:
            total_users = User.objects.count()
            active_users = User.objects.filter(last_login__gte=timezone.now() - timedelta(days=30)).count()
            total_hostels = Hostel.objects.count()
        else:
            total_users = StudentProfile.objects.filter(
                user__in=bookings.values_list('student', flat=True).distinct()
            ).count()
            active_users = total_users  # For landlord, active users are those who booked
            total_hostels = Hostel.objects.filter(**landlord_filter).count()

        # Growth calculations (compare with previous period)
        prev_start = start_date - (end_date - start_date)
        prev_end = start_date

        prev_bookings = Booking.objects.filter(
            created_at__date__gte=prev_start,
            created_at__date__lt=prev_end,
            **landlord_filter
        ).count()

        prev_revenue = Transaction.objects.filter(
            status='success',
            paid_at__date__gte=prev_start,
            paid_at__date__lt=prev_end,
            **landlord_filter
        ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')

        prev_users = User.objects.filter(
            date_joined__gte=prev_start,
            date_joined__lt=prev_end
        ).count() if user.role in ['super_admin', 'admin'] else 0

        # Calculate growth percentages
        user_growth = {
            'current': active_users,
            'previous': prev_users,
            'percentage': ((active_users - prev_users) / prev_users * 100) if prev_users > 0 else 0
        }

        booking_growth = {
            'current': total_bookings,
            'previous': prev_bookings,
            'percentage': ((total_bookings - prev_bookings) / prev_bookings * 100) if prev_bookings > 0 else 0
        }

        revenue_growth = {
            'current': float(total_revenue),
            'previous': float(prev_revenue),
            'percentage': ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        }

        # Trends data (monthly breakdown)
        trends = []
        current_date = start_date.replace(day=1)
        while current_date <= end_date:
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)

            month_bookings = bookings.filter(
                created_at__date__gte=current_date,
                created_at__date__lte=month_end
            ).count()

            month_revenue = transactions.filter(
                paid_at__date__gte=current_date,
                paid_at__date__lte=month_end
            ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')

            # Calculate occupancy for the month (average)
            month_occupancy = 0
            if user.role in ['super_admin', 'admin']:
                total_rooms = Room.objects.count()
                occupied_rooms = Room.objects.filter(status='occupied').count()
                month_occupancy = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
            else:
                landlord_rooms = Room.objects.filter(hostel__landlord=landlord)
                total_rooms = landlord_rooms.count()
                occupied_rooms = landlord_rooms.filter(status='occupied').count()
                month_occupancy = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

            trends.append({
                'month': current_date.strftime('%b %Y'),
                'bookings': month_bookings,
                'revenue': float(month_revenue),
                'occupancy': round(month_occupancy, 1)
            })

            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)

        # Property performance (top hostels)
        property_performance = []
        hostels = Hostel.objects.filter(**landlord_filter)[:5]  # Top 5
        for hostel in hostels:
            hostel_bookings = bookings.filter(room__hostel=hostel).count()
            hostel_revenue = transactions.filter(
                booking__room__hostel=hostel
            ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')

            total_rooms = Room.objects.filter(hostel=hostel).count()
            occupied_rooms = Room.objects.filter(hostel=hostel, status='occupied').count()
            occupancy = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

            property_performance.append({
                'name': hostel.name,
                'occupancy': round(occupancy, 1),
                'revenue': float(hostel_revenue),
                'bookings': hostel_bookings
            })

        # Platform metrics (radar chart data)
        platform_metrics = [
            {'metric': 'Revenue', 'score': min(100, float(total_revenue) / 100000 * 100)},  # Scale to 100k = 100%
            {'metric': 'Bookings', 'score': min(100, total_bookings / 100 * 100)},  # Scale to 100 bookings = 100%
            {'metric': 'Users', 'score': min(100, active_users / 100 * 100)},  # Scale to 100 users = 100%
            {'metric': 'Occupancy', 'score': 75},  # Placeholder
            {'metric': 'Growth', 'score': min(100, max(0, (user_growth['percentage'] + booking_growth['percentage'] + revenue_growth['percentage']) / 3))}
        ]

        # Revenue distribution (pie chart data)
        revenue_distribution = []
        if user.role in ['super_admin', 'admin']:
            # By landlord
            landlord_revenue = transactions.values('landlord__user__first_name').annotate(
                value=Sum('landlord_payout_amount')
            ).order_by('-value')[:5]
            colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
            for i, item in enumerate(landlord_revenue):
                revenue_distribution.append({
                    'name': item['landlord__user__first_name'] or f'Landlord {i+1}',
                    'value': float(item['value']),
                    'color': colors[i % len(colors)]
                })
        else:
            # By hostel
            hostel_revenue = transactions.values('booking__room__hostel__name').annotate(
                value=Sum('landlord_payout_amount')
            ).order_by('-value')[:5]
            colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
            for i, item in enumerate(hostel_revenue):
                revenue_distribution.append({
                    'name': item['booking__room__hostel__name'] or f'Hostel {i+1}',
                    'value': float(item['value']),
                    'color': colors[i % len(colors)]
                })

        return Response({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalHostels': total_hostels,
            'totalBookings': total_bookings,
            'totalRevenue': float(total_revenue),
            'userGrowth': user_growth,
            'bookingGrowth': booking_growth,
            'revenueGrowth': revenue_growth,
            'period': period,
            'trends': trends,
            'propertyPerformance': property_performance,
            'platformMetrics': platform_metrics,
            'revenueDistribution': revenue_distribution,
        }, status=status.HTTP_200_OK)


class AnalyticsBreakdownView(APIView):
    """Detailed analytics breakdown by category"""

    permission_classes = [IsAdminOrSuperAdmin | IsLandlord]

    def get(self, request, category):
        """Get detailed breakdown for a specific category"""
        user = request.user
        period = request.query_params.get('period', '180d')

        # Calculate date range
        end_date = timezone.now().date()
        if period == '30d':
            start_date = end_date - timedelta(days=30)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        elif period == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)

        # Determine scope
        if user.role in ['super_admin', 'admin']:
            landlord_filter = {}
        else:
            landlord = user.landlord_profile if hasattr(user, 'landlord_profile') else user
            landlord_filter = {'landlord': landlord}

        from hostels.models import Booking
        from payments.models import Transaction

        if category == 'users':
            # User analytics breakdown
            if user.role in ['super_admin', 'admin']:
                # Platform-wide user breakdown
                users_by_role = User.objects.values('role').annotate(count=Count('id')).order_by('-count')
                users_by_month = User.objects.filter(
                    date_joined__date__gte=start_date,
                    date_joined__date__lte=end_date
                ).annotate(
                    month=TruncMonth('date_joined')
                ).values('month').annotate(count=Count('id')).order_by('month')

                return Response({
                    'usersByRole': list(users_by_role),
                    'usersByMonth': [
                        {'month': item['month'].strftime('%b %Y'), 'count': item['count']}
                        for item in users_by_month
                    ],
                    'totalUsers': User.objects.count(),
                    'activeUsers': User.objects.filter(last_login__gte=timezone.now() - timedelta(days=30)).count()
                })
            else:
                # Landlord-specific: students who booked
                students = StudentProfile.objects.filter(
                    user__in=Booking.objects.filter(
                        created_at__date__gte=start_date,
                        created_at__date__lte=end_date,
                        **landlord_filter
                    ).values_list('student', flat=True).distinct()
                )

                return Response({
                    'totalStudents': students.count(),
                    'students': [
                        {
                            'id': student.user.id,
                            'name': student.user.get_full_name(),
                            'email': student.user.email,
                            'bookings_count': Booking.objects.filter(
                                student=student,
                                created_at__date__gte=start_date,
                                created_at__date__lte=end_date,
                                **landlord_filter
                            ).count()
                        }
                        for student in students[:20]  # Limit to 20
                    ]
                })

        elif category == 'bookings':
            # Booking analytics breakdown
            bookings = Booking.objects.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
                **landlord_filter
            )

            bookings_by_status = bookings.values('status').annotate(count=Count('id')).order_by('-count')
            bookings_by_month = bookings.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(count=Count('id')).order_by('month')

            # Bookings by hostel
            bookings_by_hostel = bookings.values('room__hostel__name').annotate(
                count=Count('id'),
                revenue=Sum('total_amount')
            ).order_by('-count')[:10]

            return Response({
                'bookingsByStatus': list(bookings_by_status),
                'bookingsByMonth': [
                    {'month': item['month'].strftime('%b %Y'), 'count': item['count']}
                    for item in bookings_by_month
                ],
                'bookingsByHostel': [
                    {
                        'hostel': item['room__hostel__name'],
                        'count': item['count'],
                        'revenue': float(item['revenue'] or 0)
                    }
                    for item in bookings_by_hostel
                ],
                'totalBookings': bookings.count(),
                'averageBookingValue': float(bookings.aggregate(avg=Avg('total_amount'))['avg'] or 0)
            })

        elif category == 'revenue':
            # Revenue analytics breakdown
            transactions = Transaction.objects.filter(
                status='success',
                paid_at__date__gte=start_date,
                paid_at__date__lte=end_date,
                **landlord_filter
            )

            revenue_by_month = transactions.annotate(
                month=TruncMonth('paid_at')
            ).values('month').annotate(
                total=Sum('landlord_payout_amount')
            ).order_by('month')

            revenue_by_method = transactions.values('payment_method').annotate(
                total=Sum('landlord_payout_amount'),
                count=Count('id')
            ).order_by('-total')

            return Response({
                'revenueByMonth': [
                    {'month': item['month'].strftime('%b %Y'), 'total': float(item['total'] or 0)}
                    for item in revenue_by_month
                ],
                'revenueByMethod': [
                    {
                        'method': item['payment_method'] or 'Unknown',
                        'total': float(item['total']),
                        'count': item['count']
                    }
                    for item in revenue_by_method
                ],
                'totalRevenue': float(transactions.aggregate(total=Sum('landlord_payout_amount'))['total'] or 0),
                'averageTransactionValue': float(transactions.aggregate(avg=Avg('landlord_payout_amount'))['avg'] or 0)
            })

        elif category == 'payments':
            # Payment analytics breakdown
            transactions = Transaction.objects.filter(
                paid_at__date__gte=start_date,
                paid_at__date__lte=end_date,
                **landlord_filter
            )

            payments_by_status = transactions.values('status').annotate(count=Count('id')).order_by('-count')
            payments_by_method = transactions.values('payment_method').annotate(
                count=Count('id'),
                total_amount=Sum('landlord_payout_amount')
            ).order_by('-total_amount')

            # Success rate
            total_payments = transactions.count()
            successful_payments = transactions.filter(status='success').count()
            success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0

            return Response({
                'paymentsByStatus': list(payments_by_status),
                'paymentsByMethod': [
                    {
                        'method': item['payment_method'] or 'Unknown',
                        'count': item['count'],
                        'total_amount': float(item['total_amount'] or 0)
                    }
                    for item in payments_by_method
                ],
                'successRate': round(success_rate, 2),
                'totalPayments': total_payments,
                'successfulPayments': successful_payments
            })

        return Response({'error': 'Invalid category'}, status=status.HTTP_400_BAD_REQUEST)


class LandlordPerformanceMetricsView(APIView):
    """Get performance metrics for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get performance metrics"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        timeframe = request.query_params.get('timeframe', '6_months')
        
        # Calculate date range
        end_date = timezone.now().date()
        if timeframe == '1_week':
            start_date = end_date - timedelta(weeks=1)
        elif timeframe == '1_month':
            start_date = end_date - timedelta(days=30)
        elif timeframe == '3_months':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '6_months':
            start_date = end_date - timedelta(days=180)
        elif timeframe == '1_year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)
        
        from hostels.models import Booking, Hostel
        from notifications.models import Notification
        
        # Get performance data
        bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        # Response time metrics (time from booking to confirmation)
        response_times = []
        for booking in bookings.filter(status__in=['confirmed', 'completed']):
            if booking.created_at and hasattr(booking, 'confirmed_at') and booking.confirmed_at:
                response_time = (booking.confirmed_at - booking.created_at).total_seconds() / 3600  # hours
                response_times.append(response_time)
        
        average_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Cancellation rate
        total_bookings = bookings.count()
        cancelled_bookings = bookings.filter(status='cancelled').count()
        cancellation_rate = (Decimal(cancelled_bookings) / Decimal(total_bookings)) * 100 if total_bookings > 0 else Decimal('0')
        
        # Customer satisfaction (based on reviews if available)
        # For now, we'll use a placeholder calculation
        customer_satisfaction_score = Decimal('4.2')  # This would come from actual reviews
        
        # Hostel performance comparison
        hostels = Hostel.objects.filter(landlord=landlord)
        hostel_performance = []
        
        for hostel in hostels:
            hostel_bookings = bookings.filter(room__hostel=hostel)
            hostel_total = hostel_bookings.count()
            hostel_cancelled = hostel_bookings.filter(status='cancelled').count()
            hostel_occupancy = 0
            
            # Calculate occupancy
            from hostels.models import Room
            total_rooms = Room.objects.filter(hostel=hostel).count()
            occupied_rooms = Room.objects.filter(hostel=hostel, status='occupied').count()
            if total_rooms > 0:
                hostel_occupancy = (Decimal(occupied_rooms) / Decimal(total_rooms)) * 100
            
            hostel_performance.append({
                'hostel_id': hostel.id,
                'hostel_name': hostel.name,
                'total_bookings': hostel_total,
                'cancelled_bookings': hostel_cancelled,
                'cancellation_rate': float((Decimal(hostel_cancelled) / Decimal(hostel_total)) * 100) if hostel_total > 0 else 0,
                'occupancy_rate': float(hostel_occupancy),
                'performance_score': float(hostel_occupancy - ((Decimal(hostel_cancelled) / Decimal(hostel_total)) * 100)) if hostel_total > 0 else 0
            })
        
        # Communication metrics
        total_notifications = Notification.objects.filter(
            recipient=request.user,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()
        
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()
        
        return Response({
            'timeframe': timeframe,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'performance_summary': {
                'average_response_time_hours': round(average_response_time, 2),
                'cancellation_rate': float(cancellation_rate),
                'customer_satisfaction_score': float(customer_satisfaction_score),
                'total_bookings': total_bookings,
                'confirmed_bookings': bookings.filter(status='confirmed').count(),
                'completed_bookings': bookings.filter(status='completed').count()
            },
            'hostel_performance': hostel_performance,
            'communication_metrics': {
                'total_notifications': total_notifications,
                'unread_notifications': unread_notifications,
                'notification_response_rate': float(((total_notifications - unread_notifications) / total_notifications) * 100) if total_notifications > 0 else 0
            }
        }, status=status.HTTP_200_OK)


class LandlordCustomerAnalyticsView(APIView):
    """Get customer analytics for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get customer analytics"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        timeframe = request.query_params.get('timeframe', '6_months')
        
        # Calculate date range
        end_date = timezone.now().date()
        if timeframe == '1_week':
            start_date = end_date - timedelta(weeks=1)
        elif timeframe == '1_month':
            start_date = end_date - timedelta(days=30)
        elif timeframe == '3_months':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '6_months':
            start_date = end_date - timedelta(days=180)
        elif timeframe == '1_year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)
        
        from hostels.models import Booking
        from accounts.models import StudentProfile
        
        # Get customer data
        bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('student', 'student__user')
        
        # Customer demographics
        customers = bookings.values('student__user__email', 'student__user__first_name', 'student__user__last_name').distinct()
        
        # Calculate repeat customers
        customer_booking_counts = {}
        for booking in bookings:
            email = booking.student.user.email
            if email in customer_booking_counts:
                customer_booking_counts[email] += 1
            else:
                customer_booking_counts[email] = 1
        
        repeat_customers = sum(1 for count in customer_booking_counts.values() if count > 1)
        total_customers = len(customer_booking_counts)
        repeat_customer_rate = (Decimal(repeat_customers) / Decimal(total_customers)) * 100 if total_customers > 0 else Decimal('0')
        
        # Customer lifetime value
        customer_ltv = {}
        for email, bookings_count in customer_booking_counts.items():
            customer_bookings = bookings.filter(student__user__email=email)
            total_spent = customer_bookings.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            customer_ltv[email] = {
                'bookings': bookings_count,
                'total_spent': float(total_spent),
                'average_booking_value': float(total_spent / Decimal(bookings_count)) if bookings_count > 0 else 0
            }
        
        # Top customers by value
        top_customers = sorted(customer_ltv.items(), key=lambda x: x[1]['total_spent'], reverse=True)[:10]
        
        # Customer acquisition over time
        customer_acquisition = []
        current_date = start_date.replace(day=1)
        while current_date <= end_date:
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)
            
            month_customers = bookings.filter(
                student__user__date_joined__gte=current_date,
                student__user__date_joined__lte=month_end
            ).values('student__user__email').distinct().count()
            
            customer_acquisition.append({
                'month': current_date.strftime('%Y-%m'),
                'new_customers': month_customers
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Customer segments
        high_value_customers = [email for email, data in customer_ltv.items() if data['total_spent'] > 50000]  # Above 50k
        medium_value_customers = [email for email, data in customer_ltv.items() if 20000 <= data['total_spent'] <= 50000]
        low_value_customers = [email for email, data in customer_ltv.items() if data['total_spent'] < 20000]
        
        return Response({
            'timeframe': timeframe,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'customer_summary': {
                'total_customers': total_customers,
                'repeat_customers': repeat_customers,
                'repeat_customer_rate': float(repeat_customer_rate),
                'average_customer_ltv': float(sum(data['total_spent'] for data in customer_ltv.values()) / len(customer_ltv)) if customer_ltv else 0
            },
            'customer_segments': {
                'high_value_customers': len(high_value_customers),
                'medium_value_customers': len(medium_value_customers),
                'low_value_customers': len(low_value_customers)
            },
            'top_customers': [
                {
                    'email': email,
                    'bookings': data['bookings'],
                    'total_spent': data['total_spent'],
                    'average_booking_value': data['average_booking_value']
                }
                for email, data in top_customers
            ],
            'customer_acquisition': customer_acquisition
        }, status=status.HTTP_200_OK)


class LandlordFinancialReportsView(APIView):
    """Get detailed financial reports for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get financial reports"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        report_type = request.query_params.get('type', 'summary')  # summary, detailed, tax
        timeframe = request.query_params.get('timeframe', '6_months')
        
        # Calculate date range
        end_date = timezone.now().date()
        if timeframe == '1_week':
            start_date = end_date - timedelta(weeks=1)
        elif timeframe == '1_month':
            start_date = end_date - timedelta(days=30)
        elif timeframe == '3_months':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '6_months':
            start_date = end_date - timedelta(days=180)
        elif timeframe == '1_year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)
        
        from payments.models import Transaction
        
        # Get transaction data
        transactions = Transaction.objects.filter(
            landlord=landlord,
            status='success',
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date
        )
        
        # Summary financial data
        total_revenue = transactions.aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
        total_service_fees = transactions.aggregate(total=Sum('student_service_fee'))['total'] or Decimal('0')
        total_platform_fees = transactions.aggregate(total=Sum('platform_fee'))['total'] or Decimal('0')
        
        # Revenue breakdown
        revenue_by_month = []
        current_date = start_date.replace(day=1)
        while current_date <= end_date:
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)
            
            month_transactions = transactions.filter(
                paid_at__date__gte=current_date,
                paid_at__date__lte=month_end
            )
            
            month_revenue = month_transactions.aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
            month_fees = month_transactions.aggregate(total=Sum('student_service_fee'))['total'] or Decimal('0')
            month_platform_fees = month_transactions.aggregate(total=Sum('platform_fee'))['total'] or Decimal('0')
            
            revenue_by_month.append({
                'month': current_date.strftime('%Y-%m'),
                'revenue': float(month_revenue),
                'service_fees': float(month_fees),
                'platform_fees': float(month_platform_fees),
                'net_income': float(month_revenue - month_platform_fees)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        if report_type == 'detailed':
            # Detailed transaction list
            transaction_list = []
            for transaction in transactions.order_by('-paid_at'):
                transaction_list.append({
                    'transaction_id': transaction.id,
                    'reference': transaction.transaction_reference,
                    'student_name': transaction.student.user.get_full_name() if transaction.student else 'N/A',
                    'amount': float(transaction.landlord_payout_amount),
                    'service_fee': float(transaction.student_service_fee),
                    'platform_fee': float(transaction.platform_fee),
                    'payment_method': transaction.payment_method,
                    'paid_at': transaction.paid_at.isoformat() if transaction.paid_at else None,
                    'status': transaction.status
                })
            
            return Response({
                'report_type': report_type,
                'timeframe': timeframe,
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                },
                'financial_summary': {
                    'total_revenue': float(total_revenue),
                    'total_service_fees': float(total_service_fees),
                    'total_platform_fees': float(total_platform_fees),
                    'net_income': float(total_revenue - total_platform_fees)
                },
                'monthly_breakdown': revenue_by_month,
                'transactions': transaction_list
            }, status=status.HTTP_200_OK)
        
        elif report_type == 'tax':
            # Tax report format
            tax_summary = {
                'total_income': float(total_revenue),
                'platform_fees_paid': float(total_platform_fees),
                'net_taxable_income': float(total_revenue - total_platform_fees),
                'transaction_count': transactions.count(),
                'reporting_period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            }
            
            return Response({
                'report_type': 'tax',
                'timeframe': timeframe,
                'tax_summary': tax_summary,
                'monthly_breakdown': revenue_by_month
            }, status=status.HTTP_200_OK)
        
        else:
            # Summary report
            return Response({
                'report_type': 'summary',
                'timeframe': timeframe,
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                },
                'financial_summary': {
                    'total_revenue': float(total_revenue),
                    'total_service_fees': float(total_service_fees),
                    'total_platform_fees': float(total_platform_fees),
                    'net_income': float(total_revenue - total_platform_fees),
                    'transaction_count': transactions.count(),
                    'average_transaction_value': float(total_revenue / transactions.count()) if transactions.count() > 0 else 0
                },
                'monthly_breakdown': revenue_by_month
            }, status=status.HTTP_200_OK)


class LandlordPredictiveAnalyticsView(APIView):
    """Get predictive analytics and recommendations for landlord"""
    
    permission_classes = [IsLandlord]
    
    def get(self, request):
        """Get predictive analytics"""
        landlord = request.user.landlord_profile if hasattr(request.user, 'landlord_profile') else request.user
        
        # Get historical data for predictions
        from hostels.models import Booking
        from payments.models import Transaction
        
        # Get last 12 months of data
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        bookings = Booking.objects.filter(
            room__hostel__landlord=landlord,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        transactions = Transaction.objects.filter(
            landlord=landlord,
            status='success',
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date
        )
        
        # Simple prediction based on historical trends
        monthly_bookings = []
        monthly_revenue = []
        
        current_date = start_date.replace(day=1)
        for i in range(12):
            month_end = min((current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1), end_date)
            
            month_bookings_count = bookings.filter(
                created_at__date__gte=current_date,
                created_at__date__lte=month_end
            ).count()
            
            month_revenue_amount = transactions.filter(
                paid_at__date__gte=current_date,
                paid_at__date__lte=month_end
            ).aggregate(total=Sum('landlord_payout_amount'))['total'] or Decimal('0')
            
            monthly_bookings.append(month_bookings_count)
            monthly_revenue.append(float(month_revenue_amount))
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Calculate trends and predictions
        if len(monthly_bookings) >= 3:
            # Simple linear trend
            recent_bookings = monthly_bookings[-3:]
            booking_trend = (recent_bookings[-1] - recent_bookings[0]) / 2
            
            predicted_bookings_next_month = max(0, int(monthly_bookings[-1] + booking_trend))
            
            recent_revenue = monthly_revenue[-3:]
            revenue_trend = (recent_revenue[-1] - recent_revenue[0]) / 2
            predicted_revenue_next_month = max(0, monthly_revenue[-1] + revenue_trend)
        else:
            predicted_bookings_next_month = monthly_bookings[-1] if monthly_bookings else 0
            predicted_revenue_next_month = monthly_revenue[-1] if monthly_revenue else 0
        
        # Occupancy prediction based on current occupancy
        from hostels.models import Hostel, Room
        
        hostels = Hostel.objects.filter(landlord=landlord)
        total_rooms = sum(hostel.total_rooms for hostel in hostels)
        occupied_rooms = sum(
            Room.objects.filter(hostel=hostel, status='occupied').count()
            for hostel in hostels
        )
        
        current_occupancy_rate = (Decimal(occupied_rooms) / Decimal(total_rooms)) * 100 if total_rooms > 0 else Decimal('0')
        
        # Recommendations based on data
        recommendations = []
        
        if current_occupancy_rate < 70:
            recommendations.append({
                'type': 'occupancy',
                'priority': 'high',
                'title': 'Low Occupancy Rate',
                'description': f'Your occupancy rate is {current_occupancy_rate:.1f}%. Consider promotional pricing or marketing efforts.',
                'action': 'Implement promotional rates or enhance marketing'
            })
        
        if len(monthly_bookings) >= 3 and booking_trend < 0:
            recommendations.append({
                'type': 'bookings',
                'priority': 'medium',
                'title': 'Declining Booking Trend',
                'description': 'Bookings have been declining. Review pricing and amenities.',
                'action': 'Analyze pricing strategy and improve property features'
            })
        
        if predicted_bookings_next_month < monthly_bookings[-1]:
            recommendations.append({
                'type': 'forecast',
                'priority': 'medium',
                'title': 'Projected Slow Month',
                'description': f'Projected bookings next month: {predicted_bookings_next_month}',
                'action': 'Consider special offers or extended stay discounts'
            })
        
        # Market insights
        market_insights = []
        
        # Seasonal analysis
        if len(monthly_bookings) >= 6:
            peak_months = []
            low_months = []
            
            for i, bookings_count in enumerate(monthly_bookings[-6:]):
                if bookings_count > sum(monthly_bookings[-6:]) / 6 * 1.2:
                    peak_months.append(i)
                elif bookings_count < sum(monthly_bookings[-6:]) / 6 * 0.8:
                    low_months.append(i)
            
            if peak_months:
                market_insights.append({
                    'type': 'seasonal',
                    'title': 'Peak Booking Periods',
                    'description': 'Higher booking activity detected in recent months',
                    'data': f'Peak months: {len(peak_months)} out of last 6 months'
                })
        
        return Response({
            'predictions': {
                'next_month': {
                    'predicted_bookings': predicted_bookings_next_month,
                    'predicted_revenue': round(predicted_revenue_next_month, 2),
                    'confidence': 'medium'  # Based on data availability
                }
            },
            'current_metrics': {
                'occupancy_rate': float(current_occupancy_rate),
                'average_monthly_bookings': sum(monthly_bookings) / len(monthly_bookings) if monthly_bookings else 0,
                'average_monthly_revenue': sum(monthly_revenue) / len(monthly_revenue) if monthly_revenue else 0
            },
            'recommendations': recommendations,
            'market_insights': market_insights,
            'data_period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'months_analyzed': len(monthly_bookings)
            }
        }, status=status.HTTP_200_OK)