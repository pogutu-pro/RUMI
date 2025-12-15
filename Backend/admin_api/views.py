from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from accounts.models import StudentProfile, LandlordProfile, CaretakerProfile, User
from hostels.models import Hostel
from payments.models import Transaction, RecurringPayment
from accounts.models import LandlordSubscription
from notifications.models import Notification

from .models import (
    SystemActivity, HostelModeration, PaymentDispute,
    AdminSubscription, UserSuspension
)
from .serializers import (
    SystemActivitySerializer, SystemActivityCreateSerializer,
    HostelModerationSerializer, HostelModerationActionSerializer,
    PaymentDisputeSerializer, PaymentDisputeActionSerializer,
    AdminSubscriptionSerializer, UserSuspensionSerializer,
    AdminStatsSerializer
)
from .permissions import IsTechSupportAdmin, IsSuperAdmin


class SystemActivityFeedView(APIView):
    """Get system-wide activity feed for admin dashboard"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """Return system activities with filtering and pagination"""
        # Filters
        activity_type = request.query_params.get('activity_type')
        severity = request.query_params.get('severity')
        user_role = request.query_params.get('user_role')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        queryset = SystemActivity.objects.all()
        
        # Apply filters
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        if severity:
            queryset = queryset.filter(severity=severity)
        
        if user_role:
            queryset = queryset.filter(user_role=user_role)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        # Pagination
        total_activities = queryset.count()
        activities = queryset.select_related('user').order_by('-created_at')[offset:offset + limit]
        
        serializer = SystemActivitySerializer(activities, many=True)
        
        return Response({
            'activities': serializer.data,
            'total': total_activities,
            'has_more': offset + limit < total_activities
        }, status=status.HTTP_200_OK)


class AdminUserManagementView(APIView):
    """Admin user management with role-based filtering"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """List users with role-based filtering"""
        role = request.query_params.get('role')
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 50))
        offset = (page - 1) * limit
        
        queryset = User.objects.select_related(
            'student_profile', 'landlord_profile', 'caretaker_profile'
        ).all()
        
        # Apply role filter
        if role:
            queryset = queryset.filter(role=role)
        
        # Apply status filter
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'suspended':
            queryset = queryset.filter(id__in=UserSuspension.objects.filter(is_active=True).values('user_id'))
        elif status_filter == 'pending':
            queryset = queryset.filter(is_verified=False)
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Count total
        total_users = queryset.count()
        
        # Get users for current page
        users = queryset.order_by('-date_joined')[offset:offset + limit]
        
        # Format response based on role
        users_data = []
        for user in users:
            user_data = {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': user.role,
                'status': 'active' if user.is_active else 'inactive',
                'is_verified': user.is_verified,
                'joined_at': user.date_joined,
                'last_login': user.last_login
            }
            
            # Add role-specific data
            if user.role == 'student':
                try:
                    profile = user.student_profile
                    user_data.update({
                        'university': profile.university,
                        'course': profile.course,
                        'year_of_study': profile.year_of_study
                    })
                except:
                    user_data.update({
                        'university': None,
                        'course': None,
                        'year_of_study': None
                    })
            
            elif user.role == 'landlord':
                try:
                    profile = user.landlord_profile
                    user_data.update({
                        'company_name': profile.company_name,
                        'total_hostels': Hostel.objects.filter(landlord=profile).count(),
                        'is_verified': profile.is_verified
                    })
                except:
                    user_data.update({
                        'company_name': None,
                        'total_hostels': 0,
                        'is_verified': False
                    })
            
            elif user.role == 'caretaker':
                try:
                    profile = user.caretaker_profile
                    user_data.update({
                        'assigned_hostel': profile.hostel.name if profile.hostel else None,
                        'is_active': profile.is_active
                    })
                except:
                    user_data.update({
                        'assigned_hostel': None,
                        'is_active': False
                    })
            
            users_data.append(user_data)
        
        return Response({
            'users': users_data,
            'pagination': {
                'total': total_users,
                'page': page,
                'limit': limit,
                'total_pages': (total_users + limit - 1) // limit
            }
        }, status=status.HTTP_200_OK)


class HostelModerationListView(APIView):
    """List hostels awaiting admin moderation"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """List pending hostels for moderation"""
        status_filter = request.query_params.get('status', 'pending')
        
        queryset = HostelModeration.objects.filter(status=status_filter).select_related(
            'hostel__landlord__user'
        ).order_by('submitted_at')
        
        moderations_data = []
        for moderation in queryset:
            moderations_data.append({
                'id': moderation.id,
                'hostel_id': moderation.hostel.id,
                'name': moderation.hostel.name,
                'location': moderation.hostel.location,
                'landlord': {
                    'id': moderation.hostel.landlord.user.id,
                    'name': moderation.hostel.landlord.user.get_full_name(),
                    'email': moderation.hostel.landlord.user.email,
                    'phone': moderation.hostel.landlord.user.phone_number,
                    'avatar': moderation.hostel.landlord.user.profile_picture
                },
                'total_rooms': moderation.hostel.total_rooms,
                'base_price': float(moderation.hostel.base_price),
                'description': moderation.hostel.description,
                'amenities': moderation.hostel.amenities,
                'images': [img.image.url for img in moderation.hostel.images.all()],
                'verification_checklist': moderation.verification_checklist,
                'submitted_at': moderation.submitted_at,
                'days_waiting': (timezone.now().date() - moderation.submitted_at.date()).days
            })
        
        return Response({
            'hostels': moderations_data,
            'total': len(moderations_data)
        }, status=status.HTTP_200_OK)


class HostelModerationActionView(APIView):
    """Approve or reject hostel moderation"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def post(self, request, moderation_id, action):
        """Approve or reject hostel"""
        try:
            moderation = HostelModeration.objects.get(id=moderation_id)
        except HostelModeration.DoesNotExist:
            return Response({
                'error': 'Moderation record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if action not in ['approve', 'reject']:
            return Response({
                'error': 'Invalid action. Must be approve or reject'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = HostelModerationActionSerializer(
            moderation, 
            data=request.data, 
            partial=True
        )
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Update moderation
        moderation.admin_notes = validated_data.get('admin_notes')
        moderation.rejection_reason = validated_data.get('rejection_reason')
        moderation.reviewed_by = request.user
        moderation.reviewed_at = timezone.now()
        
        if action == 'approve':
            moderation.status = 'approved'
            moderation.hostel.status = 'approved'
            moderation.hostel.is_verified = True
            moderation.hostel.save()
            
            # Create system activity
            SystemActivity.objects.create(
                activity_type='hostel_approval',
                title=f'Hostel Approved: {moderation.hostel.name}',
                description=f'Hostel approved by admin {request.user.get_full_name()}',
                user=moderation.hostel.landlord.user,
                user_role='landlord',
                severity='info'
            )
        
        else:  # reject
            moderation.status = 'rejected'
            moderation.hostel.status = 'rejected'
            moderation.hostel.is_verified = False
            moderation.hostel.save()
            
            # Create system activity
            SystemActivity.objects.create(
                activity_type='hostel_rejection',
                title=f'Hostel Rejected: {moderation.hostel.name}',
                description=f'Hostel rejected by admin {request.user.get_full_name()}: {moderation.rejection_reason}',
                user=moderation.hostel.landlord.user,
                user_role='landlord',
                severity='warning'
            )
        
        moderation.save()
        
        return Response({
            'message': f'Hostel {action}d successfully',
            'moderation': HostelModerationSerializer(moderation).data
        }, status=status.HTTP_200_OK)


class AdminSubscriptionListView(APIView):
    """Admin subscription management"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """List all user subscriptions for admin oversight"""
        status_filter = request.query_params.get('status')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        offset = (page - 1) * limit
        
        # Get all landlord subscriptions with related data
        subscriptions = LandlordSubscription.objects.select_related(
            'landlord__user', 'plan'
        ).all()
        
        # Apply status filter
        if status_filter:
            subscriptions = subscriptions.filter(status=status_filter)
        
        # Count total
        total_subscriptions = subscriptions.count()
        
        # Get subscriptions for current page
        subscriptions_page = subscriptions.order_by('-created_at')[offset:offset + limit]
        
        subscriptions_data = []
        for subscription in subscriptions_page:
            subscriptions_data.append({
                'id': subscription.id,
                'landlord_id': subscription.landlord.id,
                'landlord_email': subscription.landlord.user.email,
                'landlord_name': subscription.landlord.user.get_full_name(),
                'plan_name': subscription.plan.name,
                'status': subscription.status,
                'amount': float(subscription.plan.fixed_price) if subscription.plan.fixed_price else 0,
                'current_period_start': subscription.current_period_start,
                'current_period_end': subscription.current_period_end,
                'next_billing_date': subscription.next_billing_date,
                'trial_end': subscription.trial_end,
                'created_at': subscription.created_at,
                'cancelled_at': subscription.cancelled_at
            })
        
        return Response({
            'subscriptions': subscriptions_data,
            'pagination': {
                'total': total_subscriptions,
                'page': page,
                'limit': limit,
                'total_pages': (total_subscriptions + limit - 1) // limit
            }
        }, status=status.HTTP_200_OK)


class AdminSubscriptionStatsView(APIView):
    """Get subscription statistics for admin dashboard"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """Return subscription KPIs and statistics"""
        now = timezone.now()
        
        # Get all subscriptions
        all_subscriptions = LandlordSubscription.objects.select_related('plan')
        active_subscriptions = all_subscriptions.filter(status='active')
        trialing_subscriptions = all_subscriptions.filter(status='trial')
        
        # Calculate MRR (Monthly Recurring Revenue)
        mrr = 0
        for subscription in active_subscriptions:
            if subscription.plan.fixed_price:
                mrr += float(subscription.plan.fixed_price)
            # For revenue-based plans, would need to calculate from transactions
        
        # Calculate churn rate (simplified - subscriptions cancelled in last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        cancelled_recently = all_subscriptions.filter(
            status='cancelled',
            cancelled_at__gte=thirty_days_ago
        ).count()
        
        total_subscriptions = all_subscriptions.count()
        churn_rate = (cancelled_recently / total_subscriptions * 100) if total_subscriptions > 0 else 0
        
        # Count by status
        status_counts = all_subscriptions.values('status').annotate(count=Count('status'))
        status_summary = {item['status']: item['count'] for item in status_counts}
        
        # Plan distribution
        plan_distribution = active_subscriptions.values(
            'plan__name'
        ).annotate(count=Count('plan__name'))
        
        return Response({
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': status_summary.get('active', 0),
            'trialing_subscriptions': status_summary.get('trial', 0),
            'past_due_subscriptions': status_summary.get('past_due', 0),
            'cancelled_subscriptions': status_summary.get('cancelled', 0),
            'monthly_recurring_revenue': mrr,
            'churn_rate': round(churn_rate, 2),
            'plan_distribution': list(plan_distribution)
        }, status=status.HTTP_200_OK)


class AdminPaymentDisputesListView(APIView):
    """List payment disputes for admin management"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """List payment disputes with filtering"""
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        offset = (page - 1) * limit
        
        queryset = PaymentDispute.objects.select_related(
            'transaction', 'student__user'
        ).all()
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        # Count total
        total_disputes = queryset.count()
        
        # Get disputes for current page
        disputes = queryset.order_by('-submitted_at')[offset:offset + limit]
        
        disputes_data = []
        for dispute in disputes:
            disputes_data.append({
                'id': dispute.id,
                'dispute_id': dispute.dispute_id,
                'student_name': dispute.student.user.get_full_name(),
                'student_email': dispute.student.user.email,
                'transaction_reference': dispute.transaction.transaction_reference,
                'amount_disputed': float(dispute.amount_disputed),
                'reason': dispute.reason,
                'status': dispute.status,
                'priority': dispute.priority,
                'submitted_at': dispute.submitted_at,
                'days_since_submission': (timezone.now().date() - dispute.submitted_at.date()).days,
                'resolved_at': dispute.resolved_at,
                'resolved_by_name': dispute.resolved_by.get_full_name() if dispute.resolved_by else None
            })
        
        return Response({
            'disputes': disputes_data,
            'pagination': {
                'total': total_disputes,
                'page': page,
                'limit': limit,
                'total_pages': (total_disputes + limit - 1) // limit
            }
        }, status=status.HTTP_200_OK)


class AdminPaymentDisputesStatsView(APIView):
    """Get payment dispute statistics"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """Return dispute statistics"""
        now = timezone.now()
        
        disputes = PaymentDispute.objects.all()
        
        # Count by status
        status_counts = disputes.values('status').annotate(count=Count('status'))
        status_summary = {item['status']: item['count'] for item in status_counts}
        
        # Total amount in dispute
        total_dispute_amount = disputes.aggregate(
            total=Sum('amount_disputed')
        )['total'] or 0
        
        # Average resolution time for resolved disputes
        resolved_disputes = disputes.filter(status='resolved')
        if resolved_disputes.exists():
            total_resolution_time = sum([
                (d.resolved_at - d.submitted_at).days 
                for d in resolved_disputes 
                if d.resolved_at
            ])
            avg_resolution_time = total_resolution_time / len(resolved_disputes)
        else:
            avg_resolution_time = 0
        
        return Response({
            'total_disputes': disputes.count(),
            'open_disputes': status_summary.get('open', 0),
            'investigating_disputes': status_summary.get('investigating', 0),
            'resolved_disputes': status_summary.get('resolved', 0),
            'rejected_disputes': status_summary.get('rejected', 0),
            'total_amount_in_dispute': float(total_dispute_amount),
            'avg_resolution_time_days': round(avg_resolution_time, 1)
        }, status=status.HTTP_200_OK)


class AdminDashboardStatsView(APIView):
    """Get comprehensive admin dashboard statistics"""
    
    permission_classes = [IsTechSupportAdmin]
    
    def get(self, request):
        """Return comprehensive admin statistics"""
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        new_users_month = User.objects.filter(date_joined__date__gte=month_ago).count()
        
        # Hostel statistics
        total_hostels = Hostel.objects.count()
        pending_hostels = Hostel.objects.filter(status='pending').count()
        approved_hostels_today = Hostel.objects.filter(
            status='approved',
            updated_at__date=today
        ).count()
        
        # Payment statistics
        today_transactions = Transaction.objects.filter(created_at__date=today)
        total_transactions_today = today_transactions.count()
        total_revenue_today = today_transactions.filter(
            status='success'
        ).aggregate(
            total=Sum('total_charged_amount')
        )['total'] or 0
        
        # Dispute statistics
        pending_disputes = PaymentDispute.objects.filter(status='open').count()
        
        # Subscription statistics
        active_subscriptions = LandlordSubscription.objects.filter(status='active').count()
        monthly_recurring_revenue = sum([
            float(sub.plan.fixed_price) for sub in 
            LandlordSubscription.objects.filter(status='active', plan__fixed_price__isnull=False)
        ])
        
        # Churn rate calculation
        cancelled_recently = LandlordSubscription.objects.filter(
            status='cancelled',
            cancelled_at__gte=month_ago
        ).count()
        churn_rate = (cancelled_recently / active_subscriptions * 100) if active_subscriptions > 0 else 0
        
        # System activity
        system_activities_today = SystemActivity.objects.filter(created_at__date=today).count()
        
        # Support tickets
        support_tickets_open = Notification.objects.filter(
            type='support_ticket',
            is_read=False
        ).count()
        
        # Uptime (calculated from system health data)
        # For now, estimate based on successful operations
        system_activities = SystemActivity.objects.filter(created_at__date=today)
        successful_activities = system_activities.filter(severity__in=['info', 'success']).count()
        total_activities = system_activities.count()
        uptime_percentage = 99.9 if total_activities == 0 else round((successful_activities / max(total_activities, 1)) * 100, 1)
        
        return Response({
            'total_users': total_users,
            'new_users_today': new_users_today,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'total_hostels': total_hostels,
            'pending_hostels': pending_hostels,
            'approved_hostels_today': approved_hostels_today,
            'total_transactions_today': total_transactions_today,
            'total_revenue_today': float(total_revenue_today),
            'pending_disputes': pending_disputes,
            'active_subscriptions': active_subscriptions,
            'monthly_recurring_revenue': monthly_recurring_revenue,
            'churn_rate': round(churn_rate, 2),
            'system_activities_today': system_activities_today,
            'support_tickets_open': support_tickets_open,
            'uptime_percentage': uptime_percentage
        }, status=status.HTTP_200_OK)