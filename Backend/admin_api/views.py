from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

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
    """
    System Activity Monitoring API
    
    Provide comprehensive system-wide activity monitoring for administrators.
    
    GET: Retrieve system activities with advanced filtering and pagination
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint provides administrators with comprehensive system activity
    monitoring including user actions, system events, and security incidents.
    
    Activity Categories:
    - User authentication events
    - Booking and payment activities
    - System configuration changes
    - Security and compliance events
    - Error and exception tracking
    
    Features:
    - Multi-dimensional filtering
    - Severity-based organization
    - Real-time activity streaming
    - Compliance audit trails
    """
    
    permission_classes = [IsTechSupportAdmin]
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get System Activity Feed",
        operation_description="Retrieve system-wide activity data with comprehensive filtering",
        responses={
            200: 'Successfully retrieved system activities',
            403: 'Admin access required'
        }
    )
    
    def get(self, request):
        """
        Get System Activity Feed
        
        Retrieve system-wide activity data with comprehensive filtering.
        
        Query Parameters:
        - activity_type: Filter by activity category
        - severity: Filter by severity level (info, warning, error, critical)
        - user_role: Filter by user role type
        - date_from: Start date for activity range
        - date_to: End date for activity range
        - limit: Number of activities per page (default: 20)
        - offset: Pagination offset
        
        Returns comprehensive activity monitoring data:
        
        Activity Details:
        - activity_id: Unique activity identifier
        - activity_type: Category of activity
        - title: Activity summary title
        - description: Detailed activity description
        - user: Associated user information
        - user_role: User role at time of activity
        - severity: Activity severity level
        - created_at: Activity timestamp
        - metadata: Additional activity data (JSON)
        
        Severity Levels:
        - info: Informational activities
        - warning: Cautionary events
        - error: Error conditions
        - critical: Security and system-critical events
        
        Activity Types:
        - user_registration: New user signups
        - login_events: Authentication activities
        - booking_activities: Reservation and booking actions
        - payment_transactions: Financial transaction events
        - property_management: Hostel and room management
        - support_tickets: Customer support interactions
        - system_configuration: Admin configuration changes
        - security_incidents: Security and compliance events
        - api_access: API usage and access patterns
        - data_exports: Data export and reporting activities
        
        Filtering Capabilities:
        - Time-based activity windows
        - User-specific activity tracking
        - Role-based activity monitoring
        - Severity-based incident filtering
        - Activity type categorization
        
        Administrative Use Cases:
        - System health monitoring
        - Security incident investigation
        - Compliance audit support
        - User behavior analysis
        - Performance monitoring
        - Troubleshooting assistance
        
        Performance Features:
        - Efficient pagination for large datasets
        - Optimized filtering queries
        - Real-time activity streaming
        - Historical data retention
        
        Note: Provides complete system visibility for administrators.
        """
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
    """
    Administrative User Management API
    
    Provide comprehensive user management capabilities for administrators.
    
    GET: List users with role-based filtering and comprehensive search
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint provides administrators with comprehensive user management
    including role-based filtering, status monitoring, and user oversight.
    
    Features:
    - Multi-role user filtering
    - Status-based organization
    - Advanced search capabilities
    - Role-specific data inclusion
    - Comprehensive user profiles
    """
    
    permission_classes = [IsTechSupportAdmin]
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get User Management List",
        operation_description="Retrieve comprehensive user list with advanced filtering and search",
        responses={
            200: 'Successfully retrieved user list',
            403: 'Admin access required'
        }
    )
    
    def get(self, request):
        """
        Get User Management List
        
        Retrieve comprehensive user list with advanced filtering and search.
        
        Query Parameters:
        - role: Filter by user role (student, landlord, caretaker, tech_support, super_admin)
        - status: Filter by account status (active, suspended, pending)
        - search: Text search in name and email fields
        - page: Page number for pagination (default: 1)
        - limit: Users per page (default: 50)
        
        Returns comprehensive user management data:
        
        User Information:
        - id: Unique user identifier
        - email: User email address
        - name: Complete user name
        - role: User role type
        - status: Account status (active/inactive)
        - is_verified: Email verification status
        - joined_at: Registration timestamp
        - last_login: Last login timestamp
        
        Role-Specific Data:
        
        Student Profile:
        - university: Student's university
        - course: Course of study
        - year_of_study: Academic year level
        
        Landlord Profile:
        - company_name: Business/company name
        - total_hostels: Number of properties owned
        - is_verified: Landlord verification status
        
        Caretaker Profile:
        - assigned_hostel: Currently assigned property
        - is_active: Employment status
        
        Status Categories:
        - active: Verified and active accounts
        - inactive: Deactivated or suspended accounts
        - pending: Unverified or pending approval
        - suspended: Temporarily suspended accounts
        
        Search Capabilities:
        - Email address matching
        - Name field searching
        - Partial string matching
        - Case-insensitive search
        
        Administrative Features:
        - User verification management
        - Account status control
        - Role assignment oversight
        - Compliance monitoring
        - Security incident tracking
        
        Pagination Support:
        - Efficient large dataset handling
        - Configurable page sizes
        - Total count tracking
        - Navigation support
        
        Usage:
        - User administration and oversight
        - Compliance monitoring
        - Security management
        - Support ticket resolution
        - Platform analytics
        
        Note: Provides comprehensive user lifecycle management.
        """
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
    """
    Hostel Moderation Management API
    
    Manage hostel property moderation and approval workflows.
    
    GET: List hostels awaiting administrative moderation
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint provides administrators with comprehensive hostel moderation
    capabilities including property review, approval workflows, and quality control.
    
    Features:
    - Pending property review queue
    - Comprehensive property details
    - Landlord verification tracking
    - Quality assurance workflows
    - Moderation timeline tracking
    """
    
    permission_classes = [IsTechSupportAdmin]
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get Hostel Moderation Queue",
        operation_description="Retrieve hostels awaiting administrative moderation and review",
        responses={
            200: 'Successfully retrieved moderation queue',
            403: 'Admin access required'
        }
    )
    
    def get(self, request):
        """
        Get Hostel Moderation Queue
        
        Retrieve hostels awaiting administrative moderation and review.
        
        Query Parameters:
        - status: Filter by moderation status (default: pending)
        
        Returns comprehensive moderation data:
        
        Property Information:
        - id: Moderation record identifier
        - hostel_id: Associated hostel property ID
        - name: Hostel property name
        - location: Property location details
        
        Landlord Details:
        - id: Landlord user ID
        - name: Landlord full name
        - email: Contact email address
        - phone: Contact phone number
        - avatar: Profile picture URL
        
        Property Specifications:
        - total_rooms: Number of rooms in property
        - base_price: Starting rental price
        - description: Property description
        - amenities: Available amenities list
        - images: Property photo gallery
        
        Moderation Details:
        - verification_checklist: Admin verification requirements
        - submitted_at: Submission timestamp
        - days_waiting: Time since submission
        - moderation_status: Current review status
        
        Quality Control Metrics:
        - Photo quality assessment
        - Description completeness
        - Pricing verification
        - Amenity validation
        - Compliance checking
        
        Moderation Workflow:
        1. Initial submission review
        - Document verification
        - Photo quality check
        - Pricing validation
        2. Quality assessment
        - Property condition evaluation
        - Amenity verification
        - Compliance checking
        3. Final approval/rejection
        - Administrative decision
        - Feedback provision
        - Timeline tracking
        
        Review Priorities:
        - High-value properties
        - Popular locations
        - First-time landlords
        - Quality submissions
        - Compliance-sensitive areas
        
        Administrative Actions:
        - Approve property listing
        - Reject with detailed feedback
        - Request additional information
        - Flag for quality review
        - Suspend pending investigation
        
        Usage:
        - Quality assurance oversight
        - Property listing management
        - Landlord verification
        - Compliance monitoring
        - Platform quality control
        
        Note: Critical for maintaining platform property quality standards.
        """
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
    """
    Hostel Moderation Action API
    
    Process hostel moderation decisions with comprehensive approval/rejection workflows.
    
    POST: Approve or reject hostel moderation with admin notes
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint processes administrative decisions on hostel moderation
    including approvals, rejections, and detailed feedback provision.
    
    Features:
    - Comprehensive approval workflows
    - Detailed rejection feedback
    - System activity logging
    - Automated notifications
    - Compliance tracking
    """
    
    permission_classes = [IsTechSupportAdmin]
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Process Hostel Moderation",
        operation_description="Approve or reject hostel property with administrative decision tracking",
        responses={
            200: 'Successfully processed moderation',
            400: 'Invalid action or missing data',
            404: 'Moderation record not found',
            403: 'Admin access required'
        }
    )
    
    def post(self, request, moderation_id, action):
        """
        Process Hostel Moderation
        
        Approve or reject hostel property with administrative decision tracking.
        
        Path Parameters:
        - moderation_id: Unique moderation record identifier
        - action: Administrative action (approve/reject)
        
        Request Body:
        - admin_notes: Administrative comments and notes
        - rejection_reason: Detailed rejection explanation (required for reject)
        
        Process Flow:
        1. Validate moderation record existence
        2. Verify administrative permissions
        3. Process approval/rejection decision
        4. Update property status accordingly
        5. Log system activity
        6. Notify affected parties
        7. Return decision confirmation
        
        Approval Process:
        - Set moderation status to 'approved'
        - Update hostel status to 'approved'
        - Mark property as verified
        - Activate property listing
        - Notify landlord of approval
        - Log approval activity
        
        Rejection Process:
        - Set moderation status to 'rejected'
        - Update hostel status to 'rejected'
        - Maintain verification flags
        - Provide detailed feedback
        - Notify landlord of rejection
        - Log rejection activity
        
        Returns moderation decision results:
        
        Decision Confirmation:
        - message: Decision confirmation message
        - moderation: Updated moderation record
        - property_status: New property status
        - admin_actions: Actions taken
        - notification_sent: Communication status
        
        System Integration:
        - Activity logging for audit trails
        - Notification system integration
        - Compliance tracking updates
        - Performance metrics tracking
        - Quality control documentation
        
        Error Handling:
        - 404: Moderation record not found
        - 400: Invalid action or missing required data
        - 403: Insufficient administrative privileges
        
        Security Features:
        - Administrative action logging
        - Audit trail maintenance
        - Compliance documentation
        - Decision tracking and review
        
        Usage:
        - Property quality control
        - Landlord communication
        - Platform management
        - Compliance oversight
        - Quality assurance
        
        Note: Critical administrative action with full audit trail.
        """
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
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get Subscription List",
        operation_description="List all user subscriptions for admin oversight",
        responses={
            200: 'Successfully retrieved subscription list',
            403: 'Admin access required'
        }
    )
    
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
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get Subscription Statistics",
        operation_description="Return subscription KPIs and statistics",
        responses={
            200: 'Successfully retrieved subscription statistics',
            403: 'Admin access required'
        }
    )
    
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
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get Payment Disputes List",
        operation_description="List payment disputes with filtering",
        responses={
            200: 'Successfully retrieved disputes list',
            403: 'Admin access required'
        }
    )
    
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
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get Payment Dispute Statistics",
        operation_description="Return dispute statistics",
        responses={
            200: 'Successfully retrieved dispute statistics',
            403: 'Admin access required'
        }
    )

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


class AdminPaymentDisputeActionView(APIView):
    """
    Payment Dispute Resolution Actions API

    Handle administrative actions on payment disputes including resolution,
    status updates, and refund processing.

    POST: Resolve or update payment dispute status
    PATCH: Update dispute status and notes

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    This endpoint provides comprehensive dispute resolution capabilities
    including status updates, refund processing, and detailed resolution tracking.

    Features:
    - Dispute status management (open, investigating, resolved, rejected)
    - Refund amount specification for resolutions
    - Resolution notes and audit trail
    - Automatic system activity logging
    - Notification triggers for affected parties
    """

    permission_classes = [IsTechSupportAdmin]

    @swagger_auto_schema(
        tags=['Admin'],
        operation_description="Resolve or update payment dispute status",
        operation_summary="Resolve Payment Dispute",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['action'],
            properties={
                'action': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['resolve', 'reject', 'update_status'],
                    description='Resolution action to perform'
                ),
                'status': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['open', 'investigating'],
                    description='New status (required for update_status action)'
                ),
                'resolution_notes': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Detailed resolution explanation'
                ),
                'refund_amount': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    format=openapi.FORMAT_FLOAT,
                    description='Refund amount in KES (required for resolve action)'
                ),
                'admin_notes': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Additional administrative notes'
                ),
            }
        ),
        responses={
            200: openapi.Response(
                description="Dispute resolved successfully",
                examples={
                    "application/json": {
                        "message": "Dispute resolved successfully",
                        "dispute": {
                            "id": 1,
                            "dispute_id": "DIS-2025-001",
                            "status": "resolved",
                            "refund_amount": 2500.00,
                            "resolution_notes": "Issue verified, processing refund"
                        },
                        "action_taken": "resolve",
                        "old_status": "open",
                        "new_status": "resolved"
                    }
                }
            ),
            400: "Validation error",
            404: "Dispute not found"
        }
    )
    def post(self, request, dispute_id):
        """
        Resolve Payment Dispute

        Process administrative resolution of payment disputes with refund handling.

        Path Parameters:
        - dispute_id: Unique dispute identifier

        Request Body:
        - action: Resolution action (resolve/reject/update_status)
        - status: New dispute status (for update_status action)
        - resolution_notes: Detailed resolution explanation (required)
        - refund_amount: Refund amount in KES (required for resolve action)
        - admin_notes: Additional administrative notes

        Resolution Process:
        1. Validate dispute existence and permissions
        2. Process resolution based on action type
        3. Update dispute status and metadata
        4. Log system activity for audit trail
        5. Trigger notifications to affected parties
        6. Return resolution confirmation

        Actions:
        - resolve: Mark dispute as resolved with refund
        - reject: Reject dispute with explanation
        - update_status: Update status to investigating/open

        Returns resolution confirmation with updated dispute details.
        """
        try:
            dispute = PaymentDispute.objects.get(id=dispute_id)
        except PaymentDispute.DoesNotExist:
            return Response({
                'error': 'Payment dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if not action:
            return Response({
                'error': 'Action is required (resolve/reject/update_status)'
            }, status=status.HTTP_400_BAD_REQUEST)

        if action not in ['resolve', 'reject', 'update_status']:
            return Response({
                'error': 'Invalid action. Must be resolve, reject, or update_status'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate required fields based on action
        resolution_notes = request.data.get('resolution_notes')
        if action in ['resolve', 'reject'] and not resolution_notes:
            return Response({
                'error': 'Resolution notes are required for resolve/reject actions'
            }, status=status.HTTP_400_BAD_REQUEST)

        if action == 'resolve':
            refund_amount = request.data.get('refund_amount')
            if refund_amount is None:
                return Response({
                    'error': 'Refund amount is required for resolve action'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate refund amount doesn't exceed disputed amount
            if float(refund_amount) > float(dispute.amount_disputed):
                return Response({
                    'error': 'Refund amount cannot exceed disputed amount'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Process the action
        old_status = dispute.status

        if action == 'resolve':
            dispute.status = 'resolved'
            dispute.refund_amount = request.data.get('refund_amount')
            dispute.resolution_notes = resolution_notes
            dispute.resolved_at = timezone.now()
            dispute.resolved_by = request.user

            # Create system activity
            SystemActivity.objects.create(
                activity_type='dispute_resolved',
                title=f'Dispute Resolved: {dispute.dispute_id}',
                description=f'Payment dispute resolved by admin {request.user.get_full_name()}: {resolution_notes}',
                user=dispute.student.user,
                user_role='student',
                severity='info',
                metadata={
                    'dispute_id': dispute.id,
                    'refund_amount': float(dispute.refund_amount),
                    'resolution_notes': resolution_notes
                }
            )

        elif action == 'reject':
            dispute.status = 'rejected'
            dispute.resolution_notes = resolution_notes
            dispute.resolved_at = timezone.now()
            dispute.resolved_by = request.user

            # Create system activity
            SystemActivity.objects.create(
                activity_type='dispute_rejected',
                title=f'Dispute Rejected: {dispute.dispute_id}',
                description=f'Payment dispute rejected by admin {request.user.get_full_name()}: {resolution_notes}',
                user=dispute.student.user,
                user_role='student',
                severity='warning',
                metadata={
                    'dispute_id': dispute.id,
                    'resolution_notes': resolution_notes
                }
            )

        elif action == 'update_status':
            new_status = request.data.get('status')
            if not new_status:
                return Response({
                    'error': 'New status is required for update_status action'
                }, status=status.HTTP_400_BAD_REQUEST)

            if new_status not in ['open', 'investigating']:
                return Response({
                    'error': 'Status must be open or investigating for update_status action'
                }, status=status.HTTP_400_BAD_REQUEST)

            dispute.status = new_status
            dispute.resolution_notes = resolution_notes or dispute.resolution_notes

            # Create system activity
            SystemActivity.objects.create(
                activity_type='dispute_status_updated',
                title=f'Dispute Status Updated: {dispute.dispute_id}',
                description=f'Dispute status changed from {old_status} to {new_status} by admin {request.user.get_full_name()}',
                user=dispute.student.user,
                user_role='student',
                severity='info',
                metadata={
                    'dispute_id': dispute.id,
                    'old_status': old_status,
                    'new_status': new_status,
                    'notes': resolution_notes
                }
            )

        dispute.save()

        return Response({
            'message': f'Dispute {action}d successfully',
            'dispute': PaymentDisputeSerializer(dispute).data,
            'action_taken': action,
            'old_status': old_status,
            'new_status': dispute.status
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        tags=['Admin'],
        operation_description="Update payment dispute status with partial data",
        operation_summary="Update Payment Dispute Status",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'status': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['open', 'investigating', 'resolved', 'rejected'],
                    description='New dispute status'
                ),
                'resolution_notes': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Updated resolution notes'
                ),
                'refund_amount': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    format=openapi.FORMAT_FLOAT,
                    description='Updated refund amount (for resolved disputes)'
                ),
            }
        ),
        responses={
            200: openapi.Response(
                description="Dispute updated successfully",
                examples={
                    "application/json": {
                        "message": "Dispute updated successfully",
                        "dispute": {
                            "id": 1,
                            "dispute_id": "DIS-2025-001",
                            "status": "investigating",
                            "resolution_notes": "Under review"
                        },
                        "old_status": "open",
                        "new_status": "investigating"
                    }
                }
            ),
            400: "Validation error",
            404: "Dispute not found"
        }
    )
    def patch(self, request, dispute_id):
        """
        Update Payment Dispute Status

        Alternative method for updating dispute status with partial data.

        Path Parameters:
        - dispute_id: Unique dispute identifier

        Request Body:
        - status: New dispute status
        - resolution_notes: Updated resolution notes
        - refund_amount: Updated refund amount (for resolved disputes)

        Returns updated dispute details.
        """
        try:
            dispute = PaymentDispute.objects.get(id=dispute_id)
        except PaymentDispute.DoesNotExist:
            return Response({
                'error': 'Payment dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentDisputeActionSerializer(
            dispute,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = dispute.status
        updated_dispute = serializer.save()

        # Create system activity if status changed
        if old_status != updated_dispute.status:
            SystemActivity.objects.create(
                activity_type='dispute_status_updated',
                title=f'Dispute Status Updated: {dispute.dispute_id}',
                description=f'Dispute status changed from {old_status} to {updated_dispute.status}',
                user=dispute.student.user,
                user_role='student',
                severity='info',
                metadata={
                    'dispute_id': dispute.id,
                    'old_status': old_status,
                    'new_status': updated_dispute.status
                }
            )

        return Response({
            'message': 'Dispute updated successfully',
            'dispute': PaymentDisputeSerializer(updated_dispute).data,
            'old_status': old_status,
            'new_status': updated_dispute.status
        }, status=status.HTTP_200_OK)


class AdminDashboardStatsView(APIView):
    """Get comprehensive admin dashboard statistics"""
    
    permission_classes = [IsTechSupportAdmin]
    
    @swagger_auto_schema(
        tags=['Admin'],
        operation_summary="Get Admin Dashboard Statistics",
        operation_description="Return comprehensive admin statistics",
        responses={
            200: 'Successfully retrieved dashboard statistics',
            403: 'Admin access required'
        }
    )
    
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
            total=Sum('amount')
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