from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.core.paginator import Paginator
import logging

from .models import SupportTicket, SupportResponse, TechSupportProfile, TicketActivityLog
from .serializers import (
    SupportTicketListSerializer, SupportTicketCreateSerializer, SupportTicketDetailSerializer,
    SupportResponseSerializer, SupportResponseCreateSerializer, TechSupportProfileSerializer,
    TechSupportProfileCreateSerializer, TicketActivityLogSerializer, TicketEscalationSerializer,
    TicketResolutionSerializer, TicketAssignmentSerializer, SupportTicketStatsSerializer,
    CaretakerCreateSerializer, CaretakerUpdateSerializer, TechSupportUserSerializer,
    TechSupportHostelSerializer, TechSupportTransactionSerializer, TechSupportLogSerializer,
    TechSupportMessageSerializer, TechSupportStatsSerializer
)
from home.models import BlogPost
from home.serializers import BlogPostSerializer, BlogPostCreateSerializer, BlogPostUpdateSerializer
from .permissions import (
    CanCreateSupportTicket, CanViewOwnSupportTicket, CanViewAssignedSupportTicket,
    CanManageSupportTicket, CanEscalateTicket, CanResolveTicket, CanCreateTechSupportUser,
    CanManageTechSupportUser, CanCreateCaretaker, CanManageCaretaker, CanViewTechSupportDashboard,
    CanRespondToTicket, CanViewTicketResponses
)

logger = logging.getLogger(__name__)


class TechSupportDashboardView(APIView):
    """
    Tech Support Dashboard API
    
    Comprehensive dashboard for tech support and super admin users.
    
    GET: Returns dashboard data including:
    - Ticket statistics (total, by status, by priority)
    - Recent tickets assigned to the user
    - Recent responses and activities
    - Performance metrics
    
    Authentication Required: JWT Token
    Permissions: Tech Support Admin or Super Admin
    
    Tech Support users see only their assigned tickets.
    Super Admin users see all tickets across the system.
    """
    
    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]
    
    def get(self, request):
        """
        Get Tech Support Dashboard Data
        
        Returns comprehensive dashboard data for tech support and super admin users.
        
        Returns:
        - Ticket statistics breakdown by status and priority
        - Recent tickets assigned to the user
        - Recent responses and activities
        - Performance metrics and workload information
        """
        try:
            # Basic stats
            if request.user.role == 'super_admin':
                # Super admin sees all tickets
                total_tickets = SupportTicket.objects.count()
                my_tickets = SupportTicket.objects.all()
                recent_tickets = SupportTicket.objects.order_by('-created_at')[:10]
            else:
                # Tech support sees assigned tickets
                tech_support = request.user.tech_support_profile
                total_tickets = SupportTicket.objects.filter(assigned_to=tech_support).count()
                my_tickets = SupportTicket.objects.filter(assigned_to=tech_support)
                recent_tickets = my_tickets.order_by('-created_at')[:10]
            
            # Status breakdown
            status_breakdown = my_tickets.values('status').annotate(count=Count('status'))
            status_dict = {item['status']: item['count'] for item in status_breakdown}
            
            # Priority breakdown
            priority_breakdown = my_tickets.values('priority').annotate(count=Count('priority'))
            priority_dict = {item['priority']: item['count'] for item in priority_breakdown}
            
            # Recent activity
            recent_responses = SupportResponse.objects.filter(
                ticket__in=my_tickets
            ).order_by('-created_at')[:5]
            
            data = {
                'stats': {
                    'total_tickets': total_tickets,
                    'status_breakdown': status_dict,
                    'priority_breakdown': priority_dict,
                },
                'recent_tickets': SupportTicketListSerializer(recent_tickets, many=True).data,
                'recent_responses': SupportResponseSerializer(recent_responses, many=True).data,
                'timestamp': timezone.now().isoformat()
            }
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in tech support dashboard: {str(e)}")
            return Response(
                {'error': 'Failed to load dashboard data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupportTicketListView(APIView):
    """
    Support Ticket Management API
    
    Handles listing and creation of support tickets based on user role and permissions.
    
    GET: List tickets with filtering options
    POST: Create new support ticket (Students, Caretakers, Landlords only)
    
    Authentication Required: JWT Token
    
    Permissions:
    - Super Admin: Sees all tickets
    - Tech Support: Sees assigned tickets only
    - Students/Caretakers/Landlords: See their own tickets only
    
    Query Parameters:
    - page: Page number for pagination (default: 1)
    - per_page: Items per page (default: 10, max: 100)
    - status: Filter by ticket status (open, in_progress, pending, resolved, closed, escalated)
    - priority: Filter by priority level (low, medium, high, urgent, critical)
    - category: Filter by category (account, payment, technical, hostel, security, feature_request, bug_report, general)
    """
    
    def get_permissions(self):
        """Set permissions based on request method"""
        if self.request.method == 'GET':
            # Any authenticated user can view their relevant tickets
            return [permissions.IsAuthenticated()]
        elif self.request.method == 'POST':
            # Only students, caretakers, and landlords can create tickets
            return [permissions.IsAuthenticated(), CanCreateSupportTicket()]
        return [permissions.IsAuthenticated()]
    
    def get(self, request):
        """
        List Support Tickets
        
        List support tickets based on user role and filters.
        
        Returns paginated list of tickets with basic information.
        Each user sees tickets based on their role and permissions.
        """
        try:
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
            status_filter = request.GET.get('status')
            priority_filter = request.GET.get('priority')
            category_filter = request.GET.get('category')
            
            # Build base queryset based on user role
            if request.user.role == 'super_admin':
                queryset = SupportTicket.objects.all()
            elif request.user.role == 'tech_support':
                tech_support = request.user.tech_support_profile
                queryset = SupportTicket.objects.filter(assigned_to=tech_support)
            else:
                # Students, caretakers, landlords see only their own tickets
                queryset = SupportTicket.objects.filter(created_by=request.user)
            
            # Apply filters
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if priority_filter:
                queryset = queryset.filter(priority=priority_filter)
            if category_filter:
                queryset = queryset.filter(category=category_filter)
            
            # Order by creation date
            queryset = queryset.order_by('-created_at')
            
            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)
            
            serializer = SupportTicketListSerializer(page_obj, many=True)
            
            return Response({
                'tickets': serializer.data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error listing tickets: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve tickets'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Create Support Ticket
        
        Create a new support ticket.
        
        This endpoint allows Students, Caretakers, and Landlords to create support tickets
        that will be assigned to Tech Support staff.
        
        Required Fields:
        - title: Brief description of the issue (max 200 characters)
        - description: Detailed description of the problem (max 2000 characters)
        - category: Type of issue (account, payment, technical, hostel, security, feature_request, bug_report, general)
        - priority: Urgency level (low, medium, high, urgent, critical)
        
        Optional Fields:
        - tags: List of relevant tags for categorization
        - attachments: List of attachment URLs or file references
        
        The ticket will be automatically assigned escalation_level = 1
        and can be escalated to Super Admin by Tech Support if needed.
        
        Returns the complete ticket details with auto-generated ticket_id.
        """
        try:
            serializer = SupportTicketCreateSerializer(data=request.data)
            if serializer.is_valid():
                with transaction.atomic():
                    ticket = serializer.save()
                    
                    # Log activity
                    TicketActivityLog.objects.create(
                        ticket=ticket,
                        performed_by=request.user,
                        action='created',
                        description=f"Ticket created by {request.user.get_full_name()}"
                    )
                
                return Response(
                    SupportTicketDetailSerializer(ticket).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating ticket: {str(e)}")
            return Response(
                {'error': 'Failed to create ticket'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupportTicketDetailView(APIView):
    """
    Support Ticket Detail API
    
    Get detailed information for a specific support ticket.
    
    GET: Retrieve complete ticket details including responses and activity log
    
    Authentication Required: JWT Token
    
    Permissions:
    - Super Admin: Can view all tickets
    - Tech Support: Can view assigned tickets or escalated tickets
    - Ticket Creator: Can view their own tickets
    
    Path Parameters:
    - ticket_id: Unique ticket identifier (format: TKT-YYYYMMDD-XXXXXXXX)
    """
    
    def get_permissions(self):
        """Set permissions based on user role and ticket assignment"""
        return [permissions.IsAuthenticated()]
    
    def get(self, request, ticket_id):
        """
        Get Support Ticket Details
        
        Get detailed information for a specific support ticket.
        
        Returns:
        - Complete ticket information
        - All responses (internal notes hidden from customers)
        - Activity log
        - Assignment information
        - Escalation details
        - Resolution information (if resolved)
        """
        try:
            # Try to find ticket by ID
            try:
                ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            except SupportTicket.DoesNotExist:
                return Response(
                    {'error': 'Ticket not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check permissions
            if request.user.role == 'super_admin':
                pass  # Super admin can view all tickets
            elif request.user.role == 'tech_support':
                try:
                    tech_support = request.user.tech_support_profile
                    if ticket.assigned_to != tech_support and ticket.escalated_to != request.user:
                        return Response(
                            {'error': 'You do not have permission to view this ticket'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except TechSupportProfile.DoesNotExist:
                    return Response(
                        {'error': 'Tech support profile not found'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                # Regular users can only view their own tickets
                if ticket.created_by != request.user:
                    return Response(
                        {'error': 'You do not have permission to view this ticket'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = SupportTicketDetailSerializer(ticket)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error retrieving ticket {ticket_id}: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve ticket'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupportTicketResponseView(APIView):
    """
    Support Ticket Response API
    
    Add responses to support tickets.
    
    POST: Add response to ticket
    
    Authentication Required: JWT Token
    
    Permissions:
    - Super Admin: Can respond to any ticket
    - Tech Support: Can respond to assigned tickets or escalated tickets
    - Ticket Creator: Can respond to their own tickets
    
    Path Parameters:
    - ticket_id: Unique ticket identifier
    
    Request Body:
    - response_type: Type of response (initial, update, resolution, escalation, customer_response)
    - message: Response message content (max 2000 characters)
    - is_internal: Whether this is an internal note (tech support only)
    - new_status: Optional status change
    - new_priority: Optional priority change
    - new_assignee: Optional assignee change
    - attachments: Optional list of attachment URLs
    """
    
    def post(self, request, ticket_id):
        """
        Respond to Support Ticket
        
        Add response to a support ticket.
        
        This endpoint allows authorized users to add responses to tickets.
        Internal notes are only visible to tech support and super admin users.
        
        The response can also update ticket status, priority, or assignment.
        """
        try:
            # Get ticket
            try:
                ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            except SupportTicket.DoesNotExist:
                return Response(
                    {'error': 'Ticket not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check permissions
            if request.user.role == 'super_admin':
                pass  # Super admin can respond to any ticket
            elif request.user.role == 'tech_support':
                try:
                    tech_support = request.user.tech_support_profile
                    if ticket.assigned_to != tech_support and ticket.escalated_to != request.user:
                        return Response(
                            {'error': 'You are not assigned to this ticket'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except TechSupportProfile.DoesNotExist:
                    return Response(
                        {'error': 'Tech support profile not found'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                # Regular users can only respond to their own tickets
                if ticket.created_by != request.user:
                    return Response(
                        {'error': 'You can only respond to your own tickets'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = SupportResponseCreateSerializer(
                data=request.data,
                context={'ticket': ticket, 'request': request}
            )
            
            if serializer.is_valid():
                with transaction.atomic():
                    response = serializer.save()
                    
                    # Log activity
                    TicketActivityLog.objects.create(
                        ticket=ticket,
                        performed_by=request.user,
                        action='response_added',
                        description=f"Response added by {request.user.get_full_name()}"
                    )
                
                return Response(
                    SupportResponseSerializer(response).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error responding to ticket {ticket_id}: {str(e)}")
            return Response(
                {'error': 'Failed to add response'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupportTicketEscalateView(APIView):
    """
    Support Ticket Escalation API
    
    Escalate tickets to super admin.
    
    POST: Escalate ticket to super admin
    
    Authentication Required: JWT Token
    Permissions: Tech Support only
    
    Path Parameters:
    - ticket_id: Unique ticket identifier
    
    Request Body:
    - reason: Detailed reason for escalation (min 10 characters)
    
    This endpoint allows Tech Support to escalate tickets to Super Admin
    when they require higher-level intervention or authorization.
    """
    
    def post(self, request, ticket_id):
        """
        Escalate Ticket to Super Admin
        
        Escalate a support ticket to super admin for higher-level handling.
        
        This endpoint allows Tech Support to escalate tickets that require:
        - Higher-level decision making
        - System-level changes
        - Policy decisions
        - Complex technical issues
        
        The ticket will be marked as escalated and assigned escalation_level = 2.
        """
        try:
            # Get ticket
            try:
                ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            except SupportTicket.DoesNotExist:
                return Response(
                    {'error': 'Ticket not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user can escalate
            if request.user.role != 'tech_support':
                return Response(
                    {'error': 'Only tech support can escalate tickets'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            try:
                tech_support = request.user.tech_support_profile
                if ticket.assigned_to != tech_support:
                    return Response(
                        {'error': 'You can only escalate tickets assigned to you'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except TechSupportProfile.DoesNotExist:
                return Response(
                    {'error': 'Tech support profile not found'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = TicketEscalationSerializer(data=request.data)
            if serializer.is_valid():
                reason = serializer.validated_data['reason']
                
                with transaction.atomic():
                    # Escalate ticket
                    ticket.escalate_to_super_admin(reason, request.user)
                    
                    # Log activity
                    TicketActivityLog.objects.create(
                        ticket=ticket,
                        performed_by=request.user,
                        action='escalated',
                        description=f"Ticket escalated to super admin: {reason}"
                    )
                
                return Response(
                    {'message': 'Ticket escalated successfully'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error escalating ticket {ticket_id}: {str(e)}")
            return Response(
                {'error': 'Failed to escalate ticket'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupportTicketResolveView(APIView):
    """
    Support Ticket Resolution API
    
    Mark tickets as resolved.
    
    POST: Resolve support ticket
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    
    Path Parameters:
    - ticket_id: Unique ticket identifier
    
    Request Body:
    - notes: Resolution notes (optional, min 10 characters if provided)
    
    This endpoint marks tickets as resolved and updates performance metrics.
    """
    
    def post(self, request, ticket_id):
        """
        Resolve Support Ticket
        
        Mark a support ticket as resolved.
        
        This endpoint can be used by:
        - Tech Support: To resolve tickets assigned to them
        - Super Admin: To resolve any ticket in the system
        
        Resolving a ticket:
        - Updates ticket status to 'resolved'
        - Sets resolved_at timestamp
        - Records who resolved it
        - Updates tech support performance metrics
        - Decrements workload counters
        """
        try:
            # Get ticket
            try:
                ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            except SupportTicket.DoesNotExist:
                return Response(
                    {'error': 'Ticket not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check permissions
            if request.user.role == 'super_admin':
                pass  # Super admin can resolve any ticket
            elif request.user.role == 'tech_support':
                try:
                    tech_support = request.user.tech_support_profile
                    if ticket.assigned_to != tech_support:
                        return Response(
                            {'error': 'You can only resolve tickets assigned to you'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except TechSupportProfile.DoesNotExist:
                    return Response(
                        {'error': 'Tech support profile not found'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'error': 'Only tech support and super admin can resolve tickets'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = TicketResolutionSerializer(data=request.data)
            if serializer.is_valid():
                notes = serializer.validated_data.get('notes', '')
                
                with transaction.atomic():
                    # Resolve ticket
                    ticket.resolve_ticket(request.user, notes)
                    
                    # Log activity
                    TicketActivityLog.objects.create(
                        ticket=ticket,
                        performed_by=request.user,
                        action='resolved',
                        description=f"Ticket resolved by {request.user.get_full_name()}"
                    )
                
                return Response(
                    {'message': 'Ticket resolved successfully'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error resolving ticket {ticket_id}: {str(e)}")
            return Response(
                {'error': 'Failed to resolve ticket'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TechSupportUserManagementView(APIView):
    """
    Tech Support User Management API
    
    Manage tech support users (Super Admin only).
    
    GET: List all tech support users
    POST: Create new tech support user
    
    Authentication Required: JWT Token
    Permissions: Super Admin only
    
    This endpoint allows Super Admin to:
    - View all tech support profiles
    - Create new tech support accounts
    - Assign departments and seniority levels
    - Set workload limits
    """
    
    permission_classes = [permissions.IsAuthenticated, CanCreateTechSupportUser]
    
    def get(self, request):
        """
        List Tech Support Users
        
        Get a list of all tech support users with their profiles.
        
        Returns comprehensive information about each tech support user including:
        - Basic user information
        - Department and seniority level
        - Current workload and limits
        - Performance metrics
        - Online status
        """
        try:
            tech_support_users = TechSupportProfile.objects.all()
            serializer = TechSupportProfileSerializer(tech_support_users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error listing tech support users: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve tech support users'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Create Tech Support User
        
        Create a new tech support user account.
        
        This endpoint creates both a user account and a tech support profile.
        The new user will be automatically assigned the 'tech_support' role.
        
        Required Fields:
        - email: Unique email address
        - first_name: User's first name
        - last_name: User's last name
        - password: Temporary password (min 8 characters)
        - employee_id: Unique employee identifier
        - department: Support department (general, technical, billing, security, escalations)
        - seniority_level: Level (junior, senior, lead, manager)
        
        Optional Fields:
        - max_tickets_assigned: Maximum concurrent tickets (default: 50)
        """
        try:
            serializer = TechSupportProfileCreateSerializer(data=request.data)
            if serializer.is_valid():
                with transaction.atomic():
                    tech_support = serializer.save()
                    
                    # Log activity
                    TicketActivityLog.objects.create(
                        ticket=None,  # System-level activity
                        performed_by=request.user,
                        action='created',
                        description=f"Created tech support user: {tech_support.user.get_full_name()}"
                    )
                
                return Response(
                    TechSupportProfileSerializer(tech_support).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating tech support user: {str(e)}")
            return Response(
                {'error': 'Failed to create tech support user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CaretakerManagementView(APIView):
    """
    Caretaker Management API
    
    Manage caretaker accounts (Landlord only).
    
    GET: List caretakers for landlord
    POST: Create new caretaker
    
    Authentication Required: JWT Token
    Permissions: Verified Landlord only
    
    This endpoint allows verified landlords to:
    - View their assigned caretakers
    - Create new caretaker accounts
    - Assign caretakers to their hostels
    - Set caretaker permissions
    """
    
    def get_permissions(self):
        """Set permissions based on request method"""
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated(), CanManageCaretaker()]
        elif self.request.method == 'POST':
            return [permissions.IsAuthenticated(), CanCreateCaretaker()]
        return [permissions.IsAuthenticated()]
    
    def get(self, request):
        """
        List Caretakers
        
        Get a list of all caretakers assigned to the landlord's properties.
        
        Returns comprehensive information about each caretaker including:
        - Basic user information
        - National ID and contact details
        - Assigned hostel information
        - Employment details and status
        - Permissions and access levels
        """
        try:
            landlord_profile = request.user.landlord_profile
            caretakers = landlord_profile.caretakers.filter(is_active=True)
            
            data = []
            for caretaker in caretakers:
                data.append({
                    'id': caretaker.id,
                    'user': {
                        'id': caretaker.user.id,
                        'email': caretaker.user.email,
                        'first_name': caretaker.user.first_name,
                        'last_name': caretaker.user.last_name,
                        'phone_number': caretaker.user.phone_number
                    },
                    'national_id': caretaker.national_id,
                    'hostel': {
                        'id': caretaker.hostel.id,
                        'name': caretaker.hostel.name,
                        'location': caretaker.hostel.location
                    },
                    'employment_start_date': caretaker.employment_start_date,
                    'is_active': caretaker.is_active,
                    'permissions': caretaker.permissions,
                    'created_at': caretaker.created_at
                })
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error listing caretakers: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve caretakers'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Create Caretaker
        
        Create a new caretaker account and assign to a hostel.
        
        This endpoint creates both a user account and a caretaker profile.
        The new caretaker will be automatically assigned the 'caretaker' role
        and verified status.
        
        Required Fields:
        - email: Unique email address
        - first_name: Caretaker's first name
        - last_name: Caretaker's last name
        - national_id: Unique national ID
        - phone_number: Contact number
        - hostel_id: ID of hostel to assign to (must belong to landlord)
        - emergency_contact_name: Emergency contact name
        - emergency_contact_phone: Emergency contact phone
        
        Optional Fields:
        - permissions: JSON object with caretaker permissions
        
        Returns temporary password for the new caretaker account.
        """
        try:
            serializer = CaretakerCreateSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                with transaction.atomic():
                    # Extract validated data
                    validated_data = serializer.validated_data
                    email = validated_data.pop('email')
                    first_name = validated_data.pop('first_name')
                    last_name = validated_data.pop('last_name')
                    hostel_id = validated_data.pop('hostel_id')
                    
                    # Create user
                    from accounts.models import User
                    import uuid
                    temp_password = str(uuid.uuid4())[:8]
                    
                    user = User.objects.create(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        role='caretaker',
                        phone_number=validated_data.pop('phone_number'),
                        is_verified=True  # Auto-verify caretaker accounts
                    )
                    user.set_password(temp_password)
                    user.save()
                    
                    # Create caretaker profile
                    from accounts.models import CaretakerProfile
                    from hostels.models import Hostel
                    
                    hostel = Hostel.objects.get(id=hostel_id)
                    caretaker = CaretakerProfile.objects.create(
                        user=user,
                        landlord=request.user.landlord_profile,
                        hostel=hostel,
                        created_by=request.user,
                        **validated_data
                    )
                    
                    # Log activity
                    TicketActivityLog.objects.create(
                        ticket=None,
                        performed_by=request.user,
                        action='created',
                        description=f"Created caretaker: {caretaker.user.get_full_name()}"
                    )
                
                return Response({
                    'message': 'Caretaker created successfully',
                    'temporary_password': temp_password,
                    'caretaker': {
                        'id': caretaker.id,
                        'user_id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'hostel': {
                            'id': hostel.id,
                            'name': hostel.name
                        }
                    }
                }, status=status.HTTP_201_CREATED)
                
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating caretaker: {str(e)}")
            return Response(
                {'error': 'Failed to create caretaker'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupportTicketStatsView(APIView):
    """
    Support Ticket Statistics API
    
    Get comprehensive support ticket statistics.
    
    GET: Get ticket statistics
    
    Authentication Required: JWT Token
    
    This endpoint provides detailed analytics for support tickets including:
    - Total ticket counts by status and priority
    - Category breakdown
    - Average resolution times
    - Performance metrics
    
    Statistics are filtered based on user role:
    - Super Admin: All tickets
    - Tech Support: Assigned tickets only
    - Others: Own tickets only
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get Support Ticket Statistics
        
        Get comprehensive support ticket statistics and analytics.
        
        Returns detailed breakdown of:
        - Total tickets by status (open, in_progress, pending, escalated, resolved, closed)
        - Tickets by priority level
        - Tickets by category
        - Average resolution time
        - Performance metrics
        
        Data is filtered based on user permissions and role.
        """
        try:
            # Base queryset based on user role
            if request.user.role == 'super_admin':
                queryset = SupportTicket.objects.all()
            elif request.user.role == 'tech_support':
                tech_support = request.user.tech_support_profile
                queryset = SupportTicket.objects.filter(assigned_to=tech_support)
            else:
                queryset = SupportTicket.objects.filter(created_by=request.user)
            
            # Calculate stats
            total_tickets = queryset.count()
            open_tickets = queryset.filter(status='open').count()
            in_progress_tickets = queryset.filter(status='in_progress').count()
            pending_tickets = queryset.filter(status='pending').count()
            escalated_tickets = queryset.filter(status='escalated').count()
            resolved_tickets = queryset.filter(status='resolved').count()
            closed_tickets = queryset.filter(status='closed').count()
            
            # Category breakdown
            category_breakdown = dict(queryset.values('category').annotate(count=Count('category')).values_list('category', 'count'))
            
            # Priority breakdown
            priority_breakdown = dict(queryset.values('priority').annotate(count=Count('priority')).values_list('priority', 'count'))
            
            # Average resolution time
            resolved_with_time = queryset.filter(resolved_at__isnull=False)
            if resolved_with_time.exists():
                avg_resolution_hours = resolved_with_time.extra(
                    select={'resolution_hours': 'EXTRACT(EPOCH FROM (resolved_at - created_at))/3600'}
                ).aggregate(avg_hours=Avg('resolution_hours'))['avg_hours'] or 0
            else:
                avg_resolution_hours = 0
            
            data = {
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'in_progress_tickets': in_progress_tickets,
                'pending_tickets': pending_tickets,
                'escalated_tickets': escalated_tickets,
                'resolved_tickets': resolved_tickets,
                'closed_tickets': closed_tickets,
                'avg_resolution_time': round(avg_resolution_hours, 2),
                'tickets_by_category': category_breakdown,
                'tickets_by_priority': priority_breakdown
            }
            
            serializer = SupportTicketStatsSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating ticket stats: {str(e)}")
            return Response(
                {'error': 'Failed to generate statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Placeholder views for system monitoring (keeping existing structure)
class SystemHealthView(APIView):
    """System Health Check API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get system health status"""
        return Response({'status': 'healthy', 'timestamp': timezone.now().isoformat()})


class TechSupportLogsView(APIView):
    """
    Tech Support System Logs API

    Provides access to system activity logs for tech support monitoring.

    GET: List system logs with filtering options

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    Query Parameters:
    - page: Page number for pagination (default: 1)
    - per_page: Items per page (default: 50, max: 200)
    - action: Filter by action type
    - user: Filter by user ID
    - date_from: Filter logs from date (YYYY-MM-DD)
    - date_to: Filter logs to date (YYYY-MM-DD)
    - search: Search in action or description
    """

    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]

    @swagger_auto_schema(
        operation_description="List system activity logs for tech support monitoring",
        operation_summary="Get System Logs",
        manual_parameters=[
            openapi.Parameter(
                'page',
                openapi.IN_QUERY,
                description="Page number for pagination",
                type=openapi.TYPE_INTEGER,
                default=1
            ),
            openapi.Parameter(
                'per_page',
                openapi.IN_QUERY,
                description="Items per page (max 200)",
                type=openapi.TYPE_INTEGER,
                default=50
            ),
            openapi.Parameter(
                'action',
                openapi.IN_QUERY,
                description="Filter by action type",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'user',
                openapi.IN_QUERY,
                description="Filter by user ID",
                type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'date_from',
                openapi.IN_QUERY,
                description="Filter logs from date (YYYY-MM-DD)",
                type=openapi.TYPE_STRING,
                format="date"
            ),
            openapi.Parameter(
                'date_to',
                openapi.IN_QUERY,
                description="Filter logs to date (YYYY-MM-DD)",
                type=openapi.TYPE_STRING,
                format="date"
            ),
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Search in action or description",
                type=openapi.TYPE_STRING
            ),
        ],
        responses={
            200: openapi.Response(
                description="System logs with pagination",
                examples={
                    "application/json": {
                        "logs": [
                            {
                                "id": 1,
                                "user": "John Doe",
                                "action": "ticket_created",
                                "details": "New support ticket created",
                                "ip_address": "N/A",
                                "timestamp": "2025-12-24T12:00:00Z"
                            }
                        ],
                        "pagination": {
                            "current_page": 1,
                            "total_pages": 10,
                            "total_count": 500,
                            "has_next": True,
                            "has_previous": False
                        }
                    }
                }
            ),
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )

    def get(self, request):
        """
        List System Activity Logs

        Get paginated system activity logs visible to tech support.
        Filters out sensitive admin actions and shows user-facing activities.

        Returns activity logs to help tech support monitor system usage.
        """
        try:
            from django.core.paginator import Paginator

            page = int(request.GET.get('page', 1))
            per_page = min(int(request.GET.get('per_page', 50)), 200)  # Max 200 per page
            action_filter = request.GET.get('action')
            user_filter = request.GET.get('user')
            date_from = request.GET.get('date_from')
            date_to = request.GET.get('date_to')
            search = request.GET.get('search')

            # Base queryset - ticket activity logs (safe for tech support)
            queryset = TicketActivityLog.objects.select_related('ticket', 'performed_by').order_by('-created_at')

            # Apply filters
            if action_filter:
                queryset = queryset.filter(action=action_filter)
            if user_filter:
                queryset = queryset.filter(performed_by__id=user_filter)
            if date_from:
                queryset = queryset.filter(created_at__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__date__lte=date_to)
            if search:
                queryset = queryset.filter(
                    Q(action__icontains=search) |
                    Q(description__icontains=search)
                )

            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            # Serialize logs
            logs_data = []
            for log in page_obj:
                logs_data.append({
                    'id': log.id,
                    'user': log.performed_by.get_full_name() if log.performed_by else 'System',
                    'action': log.action,
                    'details': log.description,
                    'ip_address': 'N/A',  # IP logging not implemented yet
                    'timestamp': log.created_at.isoformat()
                })

            return Response({
                'logs': logs_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error retrieving system logs: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve system logs'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SystemMaintenanceView(APIView):
    """System Maintenance API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get system maintenance status"""
        return Response({'maintenance': 'System maintenance endpoint - implement as needed'})


class MaintenanceScheduleView(APIView):
    """Maintenance Schedule API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get maintenance schedule"""
        return Response({'schedule': 'Maintenance schedule endpoint - implement as needed'})


class SystemBackupView(APIView):
    """System Backup API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Initiate system backup"""
        return Response({'message': 'System backup initiated'})


class TechSupportUserVisibilityView(APIView):
    """
    Tech Support User Visibility API

    Provides read-only access to user information for tech support purposes.

    GET: List users with filtering options for support ticket context

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    Query Parameters:
    - page: Page number for pagination (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - role: Filter by user role (student, landlord, caretaker)
    - is_verified: Filter by verification status (true/false)
    - search: Search in name or email
    """

    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]

    @swagger_auto_schema(
        operation_description="List users visible to tech support for ticket context",
        operation_summary="Get Users for Support",
        manual_parameters=[
            openapi.Parameter(
                'page',
                openapi.IN_QUERY,
                description="Page number for pagination",
                type=openapi.TYPE_INTEGER,
                default=1
            ),
            openapi.Parameter(
                'per_page',
                openapi.IN_QUERY,
                description="Items per page (max 100)",
                type=openapi.TYPE_INTEGER,
                default=20
            ),
            openapi.Parameter(
                'role',
                openapi.IN_QUERY,
                description="Filter by user role",
                type=openapi.TYPE_STRING,
                enum=['student', 'landlord', 'caretaker']
            ),
            openapi.Parameter(
                'is_verified',
                openapi.IN_QUERY,
                description="Filter by verification status",
                type=openapi.TYPE_BOOLEAN
            ),
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Search in first name, last name, or email",
                type=openapi.TYPE_STRING
            ),
        ],
        responses={
            200: openapi.Response(
                description="Users list with pagination",
                examples={
                    "application/json": {
                        "users": [
                            {
                                "id": 1,
                                "email": "user@example.com",
                                "first_name": "John",
                                "last_name": "Doe",
                                "role": "student",
                                "is_active": True,
                                "is_verified": True,
                                "phone_number": "+1234567890",
                                "date_joined": "2025-01-01",
                                "date_joined_display": "2025-01-01"
                            }
                        ],
                        "pagination": {
                            "current_page": 1,
                            "total_pages": 5,
                            "total_count": 100,
                            "has_next": True,
                            "has_previous": False
                        }
                    }
                }
            ),
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )

    def get(self, request):
        """
        List Users for Tech Support

        Get a paginated list of users visible to tech support for ticket context.
        Excludes sensitive information like passwords and full financial data.

        Returns basic user information to help tech support understand ticket context.
        """
        try:
            from accounts.models import User
            from django.core.paginator import Paginator

            page = int(request.GET.get('page', 1))
            per_page = min(int(request.GET.get('per_page', 20)), 100)  # Max 100 per page
            role_filter = request.GET.get('role')
            verified_filter = request.GET.get('is_verified')
            search = request.GET.get('search')

            # Base queryset - all users (tech support needs visibility for support)
            queryset = User.objects.all().order_by('-date_joined')

            # Apply filters
            if role_filter:
                queryset = queryset.filter(role=role_filter)
            if verified_filter is not None:
                is_verified = verified_filter.lower() == 'true'
                queryset = queryset.filter(is_verified=is_verified)
            if search:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(email__icontains=search)
                )

            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            serializer = TechSupportUserSerializer(page_obj, many=True)

            return Response({
                'users': serializer.data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing users for tech support: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve users'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserSupportDetailView(APIView):
    """User Support Detail API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id):
        """Get user support details"""
        return Response({'user': f'User {user_id} support details'})


class UserPasswordResetView(APIView):
    """User Password Reset API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        """Reset user password"""
        return Response({'message': f'Password reset initiated for user {user_id}'})


class TechSupportTransactionView(APIView):
    """
    Tech Support Transaction Visibility API

    Provides read-only access to transaction information for payment dispute handling.

    GET: List transactions with filtering options

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    Query Parameters:
    - page: Page number for pagination (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - status: Filter by transaction status
    - type: Filter by transaction type
    - date_from: Filter transactions from date (YYYY-MM-DD)
    - date_to: Filter transactions to date (YYYY-MM-DD)
    - student_name: Search by student name
    """

    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]

    @swagger_auto_schema(
        operation_description="List transactions for payment dispute handling",
        operation_summary="Get Transactions for Support",
        manual_parameters=[
            openapi.Parameter(
                'page',
                openapi.IN_QUERY,
                description="Page number for pagination",
                type=openapi.TYPE_INTEGER,
                default=1
            ),
            openapi.Parameter(
                'per_page',
                openapi.IN_QUERY,
                description="Items per page (max 100)",
                type=openapi.TYPE_INTEGER,
                default=20
            ),
            openapi.Parameter(
                'status',
                openapi.IN_QUERY,
                description="Filter by transaction status",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'type',
                openapi.IN_QUERY,
                description="Filter by transaction type",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'date_from',
                openapi.IN_QUERY,
                description="Filter transactions from date (YYYY-MM-DD)",
                type=openapi.TYPE_STRING,
                format="date"
            ),
            openapi.Parameter(
                'date_to',
                openapi.IN_QUERY,
                description="Filter transactions to date (YYYY-MM-DD)",
                type=openapi.TYPE_STRING,
                format="date"
            ),
            openapi.Parameter(
                'student_name',
                openapi.IN_QUERY,
                description="Search by student name",
                type=openapi.TYPE_STRING
            ),
        ],
        responses={
            200: openapi.Response(
                description="Transactions list with pagination",
                examples={
                    "application/json": {
                        "transactions": [
                            {
                                "id": 1,
                                "transaction_reference": "TXN-123456",
                                "student_name": "John Doe",
                                "amount": 1500.00,
                                "status": "success",
                                "date": "2025-12-24T12:00:00Z",
                                "type": "booking_payment",
                                "booking_reference": "BK-789"
                            }
                        ],
                        "pagination": {
                            "current_page": 1,
                            "total_pages": 5,
                            "total_count": 100,
                            "has_next": True,
                            "has_previous": False
                        }
                    }
                }
            ),
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )

    def get(self, request):
        """
        List Transactions for Tech Support

        Get paginated list of transactions visible to tech support for dispute handling.
        Masks sensitive payment details and shows only necessary information.

        Returns transaction data to help tech support handle payment disputes.
        """
        try:
            from payments.models import Transaction
            from django.core.paginator import Paginator

            page = int(request.GET.get('page', 1))
            per_page = min(int(request.GET.get('per_page', 20)), 100)  # Max 100 per page
            status_filter = request.GET.get('status')
            type_filter = request.GET.get('type')
            date_from = request.GET.get('date_from')
            date_to = request.GET.get('date_to')
            student_search = request.GET.get('student_name')

            # Base queryset - transactions (mask sensitive data)
            queryset = Transaction.objects.select_related('booking__student').order_by('-created_at')

            # Apply filters
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if type_filter:
                queryset = queryset.filter(transaction_type=type_filter)
            if date_from:
                queryset = queryset.filter(created_at__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__date__lte=date_to)
            if student_search:
                queryset = queryset.filter(
                    Q(booking__student__first_name__icontains=student_search) |
                    Q(booking__student__last_name__icontains=student_search)
                )

            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            # Serialize transactions with masked data
            transactions_data = []
            for transaction in page_obj:
                transactions_data.append({
                    'id': transaction.id,
                    'transaction_reference': transaction.transaction_reference,
                    'student_name': f"{transaction.booking.student.first_name} {transaction.booking.student.last_name}" if transaction.booking and transaction.booking.student else 'N/A',
                    'amount': float(transaction.amount),
                    'status': transaction.status,
                    'date': transaction.created_at.isoformat(),
                    'type': transaction.transaction_type,
                    'booking_reference': transaction.booking.booking_reference if transaction.booking else 'N/A'
                })

            return Response({
                'transactions': transactions_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error retrieving transactions for tech support: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve transactions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentDisputeSupportView(APIView):
    """Payment Dispute Support API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get payment dispute support"""
        return Response({'disputes': 'Payment dispute support endpoint - implement as needed'})


class PaymentRefundSupportView(APIView):
    """Payment Refund Support API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get payment refund support"""
        return Response({'refunds': 'Payment refund support endpoint - implement as needed'})


class TechSupportMessagingView(APIView):
    """
    Tech Support Messaging API

    Provides messaging functionality between tech support and users.

    GET: List messages/conversations
    POST: Send message to user

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    Query Parameters:
    - page: Page number for pagination (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - user_id: Filter messages by specific user
    - ticket_id: Filter messages by ticket
    - unread_only: Show only unread messages (true/false)
    """

    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]

    @swagger_auto_schema(
        operation_description="List support messages and conversations",
        operation_summary="Get Support Messages",
        manual_parameters=[
            openapi.Parameter(
                'page',
                openapi.IN_QUERY,
                description="Page number for pagination",
                type=openapi.TYPE_INTEGER,
                default=1
            ),
            openapi.Parameter(
                'per_page',
                openapi.IN_QUERY,
                description="Items per page (max 100)",
                type=openapi.TYPE_INTEGER,
                default=20
            ),
            openapi.Parameter(
                'user_id',
                openapi.IN_QUERY,
                description="Filter messages by specific user ID",
                type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'ticket_id',
                openapi.IN_QUERY,
                description="Filter messages by ticket ID",
                type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'unread_only',
                openapi.IN_QUERY,
                description="Show only unread messages",
                type=openapi.TYPE_BOOLEAN
            ),
        ],
        responses={
            200: openapi.Response(
                description="Messages list with pagination",
                examples={
                    "application/json": {
                        "messages": [
                            {
                                "id": 1,
                                "sender": "Support Team",
                                "recipient": "John Doe",
                                "content": "Your ticket has been updated",
                                "timestamp": "2025-12-24T12:00:00Z",
                                "is_read": True,
                                "ticket_id": 123,
                                "ticket_subject": "Login Issue"
                            }
                        ],
                        "pagination": {
                            "current_page": 1,
                            "total_pages": 2,
                            "total_count": 25,
                            "has_next": True,
                            "has_previous": False
                        }
                    }
                }
            ),
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )
    def get(self, request):
        """
        List Support Messages

        Get paginated list of messages between tech support and users.
        Currently uses ticket responses as the message system.

        Returns message data for support communication tracking.
        """
        try:
            from django.core.paginator import Paginator

            page = int(request.GET.get('page', 1))
            per_page = min(int(request.GET.get('per_page', 20)), 100)  # Max 100 per page
            user_id = request.GET.get('user_id')
            ticket_id = request.GET.get('ticket_id')
            unread_only = request.GET.get('unread_only', '').lower() == 'true'

            # Base queryset - support responses (acting as messages)
            queryset = SupportResponse.objects.select_related(
                'ticket', 'responder', 'ticket__created_by'
            ).order_by('-created_at')

            # Apply filters
            if user_id:
                queryset = queryset.filter(
                    Q(ticket__created_by__id=user_id) | Q(responder__id=user_id)
                )
            if ticket_id:
                queryset = queryset.filter(ticket__id=ticket_id)
            if unread_only:
                # For now, assume all messages are read (no read status tracking yet)
                queryset = queryset.none()

            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            # Serialize messages
            messages_data = []
            for response in page_obj:
                messages_data.append({
                    'id': response.id,
                    'sender': response.responder.get_full_name(),
                    'recipient': response.ticket.created_by.get_full_name(),
                    'content': response.message,
                    'timestamp': response.created_at.isoformat(),
                    'is_read': True,  # Placeholder - no read status tracking yet
                    'ticket_id': response.ticket.id,
                    'ticket_subject': response.ticket.title
                })

            return Response({
                'messages': messages_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error retrieving messages for tech support: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve messages'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        operation_description="Send a message to a user through the support system",
        operation_summary="Send Support Message",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['user_id', 'content'],
            properties={
                'user_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the user to message"
                ),
                'content': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Message content"
                ),
                'ticket_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Optional ticket ID to associate with"
                ),
            }
        ),
        responses={
            201: openapi.Response(
                description="Message sent successfully",
                examples={
                    "application/json": {
                        "message": "Message sent successfully",
                        "ticket_id": 123
                    }
                }
            ),
            400: "Bad Request - Invalid data",
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            404: "User not found",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )
    def post(self, request):
        """
        Send Message to User

        Send a message to a specific user through the support system.
        Currently creates a ticket response (internal note) that can be viewed by the user.

        Required Fields:
        - user_id: ID of the user to message
        - content: Message content
        - ticket_id: Optional ticket ID to associate with (creates new ticket if not provided)
        """
        try:
            from django.core.paginator import Paginator

            page = int(request.GET.get('page', 1))
            per_page = min(int(request.GET.get('per_page', 20)), 100)  # Max 100 per page
            user_id = request.GET.get('user_id')
            ticket_id = request.GET.get('ticket_id')
            unread_only = request.GET.get('unread_only', '').lower() == 'true'

            # Base queryset - support responses (acting as messages)
            queryset = SupportResponse.objects.select_related(
                'ticket', 'responder', 'ticket__created_by'
            ).order_by('-created_at')

            # Apply filters
            if user_id:
                queryset = queryset.filter(
                    Q(ticket__created_by__id=user_id) | Q(responder__id=user_id)
                )
            if ticket_id:
                queryset = queryset.filter(ticket__id=ticket_id)
            if unread_only:
                # For now, assume all messages are read (no read status tracking yet)
                queryset = queryset.none()

            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            # Serialize messages
            messages_data = []
            for response in page_obj:
                messages_data.append({
                    'id': response.id,
                    'sender': response.responder.get_full_name(),
                    'recipient': response.ticket.created_by.get_full_name(),
                    'content': response.message,
                    'timestamp': response.created_at.isoformat(),
                    'is_read': True,  # Placeholder - no read status tracking yet
                    'ticket_id': response.ticket.id,
                    'ticket_subject': response.ticket.title
                })

            return Response({
                'messages': messages_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error retrieving messages for tech support: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve messages'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class TechSupportStatsView(APIView):
    """
    Tech Support Consolidated Statistics API

    Provides comprehensive statistics for the tech support dashboard.

    GET: Get consolidated dashboard statistics

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    Returns combined statistics from tickets, users, hostels, and transactions.
    """

    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]

    @swagger_auto_schema(
        operation_description="Get consolidated statistics for tech support dashboard",
        operation_summary="Get Dashboard Statistics",
        responses={
            200: openapi.Response(
                description="Consolidated dashboard statistics",
                examples={
                    "application/json": {
                        "total_users": 150,
                        "active_users": 120,
                        "total_hostels": 25,
                        "verified_hostels": 20,
                        "total_transactions": 500,
                        "successful_transactions": 450,
                        "total_tickets": 75,
                        "open_tickets": 15,
                        "resolved_tickets": 50,
                        "avg_resolution_time": 4.2,
                        "system_health": "operational",
                        "last_updated": "2025-12-24T12:00:00Z"
                    }
                }
            ),
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )

    def get(self, request):
        """
        Get Consolidated Tech Support Statistics

        Returns comprehensive statistics combining:
        - User statistics
        - Hostel statistics
        - Transaction statistics
        - Ticket statistics
        - System health metrics
        """
        try:
            from accounts.models import User
            from hostels.models import Hostel
            from payments.models import Transaction

            # User statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()

            # Hostel statistics
            total_hostels = Hostel.objects.count()
            verified_hostels = Hostel.objects.filter(is_verified=True).count()

            # Transaction statistics
            total_transactions = Transaction.objects.count()
            successful_transactions = Transaction.objects.filter(status='success').count()

            # Ticket statistics (reuse existing logic)
            ticket_queryset = SupportTicket.objects.all()
            total_tickets = ticket_queryset.count()
            open_tickets = ticket_queryset.filter(status='open').count()
            resolved_tickets = ticket_queryset.filter(status='resolved').count()

            # Average resolution time
            resolved_with_time = ticket_queryset.filter(resolved_at__isnull=False)
            avg_resolution_time = 0
            if resolved_with_time.exists():
                try:
                    avg_resolution_hours = resolved_with_time.extra(
                        select={'resolution_hours': 'EXTRACT(EPOCH FROM (resolved_at - created_at))/3600'}
                    ).aggregate(avg_hours=Avg('resolution_hours'))['avg_hours'] or 0
                    avg_resolution_time = round(float(avg_resolution_hours), 2)
                except:
                    avg_resolution_time = 0

            # System health (simplified)
            system_health = "operational"  # Could be expanded with actual health checks

            data = {
                'total_users': total_users,
                'active_users': active_users,
                'total_hostels': total_hostels,
                'verified_hostels': verified_hostels,
                'total_transactions': total_transactions,
                'successful_transactions': successful_transactions,
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'resolved_tickets': resolved_tickets,
                'avg_resolution_time': avg_resolution_time,
                'system_health': system_health,
                'last_updated': timezone.now().isoformat()
            }

            serializer = TechSupportStatsSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error generating consolidated stats: {str(e)}")
            return Response(
                {'error': 'Failed to generate statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TechSupportHostelManagementView(APIView):
    """
    Tech Support Hostel Visibility API

    Provides read-only access to hostel information for support ticket context.

    GET: List hostels with filtering options

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only

    Query Parameters:
    - page: Page number for pagination (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - status: Filter by hostel status (pending, active, hidden, flagged)
    - is_verified: Filter by verification status (true/false)
    - search: Search in hostel name or location
    - landlord: Filter by landlord name
    """

    permission_classes = [permissions.IsAuthenticated, CanViewTechSupportDashboard]

    @swagger_auto_schema(
        operation_description="List hostels for support ticket context",
        operation_summary="Get Hostels for Support",
        manual_parameters=[
            openapi.Parameter(
                'page',
                openapi.IN_QUERY,
                description="Page number for pagination",
                type=openapi.TYPE_INTEGER,
                default=1
            ),
            openapi.Parameter(
                'per_page',
                openapi.IN_QUERY,
                description="Items per page (max 100)",
                type=openapi.TYPE_INTEGER,
                default=20
            ),
            openapi.Parameter(
                'status',
                openapi.IN_QUERY,
                description="Filter by hostel status",
                type=openapi.TYPE_STRING,
                enum=['pending', 'active', 'hidden', 'flagged']
            ),
            openapi.Parameter(
                'is_verified',
                openapi.IN_QUERY,
                description="Filter by verification status",
                type=openapi.TYPE_BOOLEAN
            ),
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Search in hostel name, location, or city",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'landlord',
                openapi.IN_QUERY,
                description="Filter by landlord name",
                type=openapi.TYPE_STRING
            ),
        ],
        responses={
            200: openapi.Response(
                description="Hostels list with pagination",
                examples={
                    "application/json": {
                        "hostels": [
                            {
                                "id": 1,
                                "name": "Sunset Hostel",
                                "landlord_name": "Jane Smith",
                                "location": "Westlands, Nairobi",
                                "status": "active",
                                "rooms_count": 25,
                                "is_verified": True,
                                "city": "Nairobi",
                                "created_at": "2025-01-15T10:00:00Z"
                            }
                        ],
                        "pagination": {
                            "current_page": 1,
                            "total_pages": 3,
                            "total_count": 50,
                            "has_next": True,
                            "has_previous": False
                        }
                    }
                }
            ),
            401: "Unauthorized",
            403: "Forbidden - Insufficient permissions",
            500: "Internal server error"
        },
        tags=['Tech Support Dashboard']
    )

    def get(self, request):
        """
        List Hostels for Tech Support

        Get paginated list of hostels visible to tech support for ticket context.
        Includes basic hostel information and landlord contact details.

        Returns hostel data to help tech support understand ticket context.
        """
        try:
            from hostels.models import Hostel
            from django.core.paginator import Paginator

            page = int(request.GET.get('page', 1))
            per_page = min(int(request.GET.get('per_page', 20)), 100)  # Max 100 per page
            status_filter = request.GET.get('status')
            verified_filter = request.GET.get('is_verified')
            search = request.GET.get('search')
            landlord_filter = request.GET.get('landlord')

            # Base queryset - all hostels (tech support needs visibility)
            queryset = Hostel.objects.select_related('landlord').order_by('-created_at')

            # Apply filters
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if verified_filter is not None:
                is_verified = verified_filter.lower() == 'true'
                queryset = queryset.filter(is_verified=is_verified)
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(location__icontains=search) |
                    Q(city__icontains=search)
                )
            if landlord_filter:
                queryset = queryset.filter(
                    Q(landlord__first_name__icontains=landlord_filter) |
                    Q(landlord__last_name__icontains=landlord_filter)
                )

            # Paginate
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            # Serialize hostels
            hostels_data = []
            for hostel in page_obj:
                hostels_data.append({
                    'id': hostel.id,
                    'name': hostel.name,
                    'landlord_name': f"{hostel.landlord.first_name} {hostel.landlord.last_name}" if hostel.landlord else 'N/A',
                    'location': hostel.location,
                    'status': hostel.status,
                    'rooms_count': hostel.rooms.count(),
                    'is_verified': hostel.is_verified,
                    'city': hostel.city,
                    'created_at': hostel.created_at.isoformat()
                })

            return Response({
                'hostels': hostels_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error retrieving hostels for tech support: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve hostels'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SystemPerformanceView(APIView):
    """System Performance API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get system performance metrics"""
        return Response({'performance': 'System performance endpoint - implement as needed'})


class SystemErrorAnalyticsView(APIView):
    """System Error Analytics API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get system error analytics"""
        return Response({'errors': 'System error analytics endpoint - implement as needed'})


class SystemUsageAnalyticsView(APIView):
    """System Usage Analytics API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get system usage analytics"""
        return Response({'usage': 'System usage analytics endpoint - implement as needed'})


# Blog Management Views for Tech Support
class BlogPostListView(APIView):
    """
    Blog Post List API for Tech Support

    GET: List all blog posts with filtering and pagination
    POST: Create new blog post (redirects to create endpoint)

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="List all blog posts with filtering and pagination",
        operation_summary="Get Blog Posts",
        manual_parameters=[
            openapi.Parameter(
                'page',
                openapi.IN_QUERY,
                description="Page number",
                type=openapi.TYPE_INTEGER,
                default=1
            ),
            openapi.Parameter(
                'per_page',
                openapi.IN_QUERY,
                description="Items per page",
                type=openapi.TYPE_INTEGER,
                default=20
            ),
            openapi.Parameter(
                'status',
                openapi.IN_QUERY,
                description="Filter by status (published, draft)",
                type=openapi.TYPE_STRING,
                enum=['published', 'draft']
            ),
            openapi.Parameter(
                'category',
                openapi.IN_QUERY,
                description="Filter by category",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'featured',
                openapi.IN_QUERY,
                description="Filter by featured status",
                type=openapi.TYPE_BOOLEAN
            ),
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Search in title, excerpt, and content",
                type=openapi.TYPE_STRING
            ),
        ],
        responses={
            200: openapi.Response(
                description="Blog posts list",
                examples={
                    "application/json": {
                        "posts": [
                            {
                                "id": 1,
                                "title": "Sample Blog Post",
                                "slug": "sample-blog-post",
                                "excerpt": "Excerpt of the blog post",
                                "author": {"name": "Admin User", "profile_picture": None},
                                "category": "company_news",
                                "tags": ["tag1", "tag2"],
                                "is_published": True,
                                "is_featured": False,
                                "published_at": "2025-12-24T08:00:00Z"
                            }
                        ],
                        "pagination": {
                            "current_page": 1,
                            "total_pages": 1,
                            "total_count": 1,
                            "has_next": False,
                            "has_previous": False
                        }
                    }
                }
            ),
            401: "Unauthorized",
            500: "Internal server error"
        },
        tags=['Blog Management']
    )

    def get_permissions(self):
        """Set permissions based on request method"""
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        """List all blog posts with filtering"""
        try:
            queryset = BlogPost.objects.all().select_related('author')

            # Apply filters
            status_filter = request.GET.get('status')
            if status_filter == 'published':
                queryset = queryset.filter(is_published=True)
            elif status_filter == 'draft':
                queryset = queryset.filter(is_published=False)

            category_filter = request.GET.get('category')
            if category_filter:
                queryset = queryset.filter(category=category_filter)

            featured_filter = request.GET.get('featured')
            if featured_filter:
                queryset = queryset.filter(is_featured=featured_filter.lower() == 'true')

            # Search
            search = request.GET.get('search')
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(excerpt__icontains=search) |
                    Q(content__icontains=search)
                )

            # Order by creation date (newest first)
            queryset = queryset.order_by('-created_at')

            # Pagination
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 20))
            from django.core.paginator import Paginator
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)

            serializer = BlogPostSerializer(page_obj, many=True)

            return Response({
                'posts': serializer.data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing blog posts: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve blog posts'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlogPostCreateView(APIView):
    """
    Blog Post Create API for Tech Support

    POST: Create new blog post

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Create new blog post"""
        try:
            serializer = BlogPostCreateSerializer(data=request.data)
            if serializer.is_valid():
                blog_post = serializer.save()
                return Response(
                    BlogPostSerializer(blog_post).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error creating blog post: {str(e)}")
            return Response(
                {'error': 'Failed to create blog post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlogPostDetailView(APIView):
    """
    Blog Post Detail API for Tech Support

    GET: Get blog post details

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, post_id):
        """Get blog post details"""
        try:
            blog_post = BlogPost.objects.select_related('author').get(id=post_id)
            serializer = BlogPostSerializer(blog_post)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except BlogPost.DoesNotExist:
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving blog post {post_id}: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve blog post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlogPostUpdateView(APIView):
    """
    Blog Post Update API for Tech Support

    PUT: Update blog post

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, post_id):
        """Update blog post"""
        try:
            blog_post = BlogPost.objects.get(id=post_id)
            serializer = BlogPostUpdateSerializer(blog_post, data=request.data, partial=True)
            if serializer.is_valid():
                updated_post = serializer.save()
                return Response(
                    BlogPostSerializer(updated_post).data,
                    status=status.HTTP_200_OK
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except BlogPost.DoesNotExist:
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating blog post {post_id}: {str(e)}")
            return Response(
                {'error': 'Failed to update blog post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlogPostPublishView(APIView):
    """
    Blog Post Publish API for Tech Support

    POST: Publish blog post

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        """Publish blog post"""
        try:
            blog_post = BlogPost.objects.get(id=post_id)
            blog_post.is_published = True
            if not blog_post.published_at:
                blog_post.published_at = timezone.now()
            blog_post.save()

            serializer = BlogPostSerializer(blog_post)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except BlogPost.DoesNotExist:
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error publishing blog post {post_id}: {str(e)}")
            return Response(
                {'error': 'Failed to publish blog post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlogPostUnpublishView(APIView):
    """
    Blog Post Unpublish API for Tech Support

    POST: Unpublish blog post

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        """Unpublish blog post"""
        try:
            blog_post = BlogPost.objects.get(id=post_id)
            blog_post.is_published = False
            blog_post.save()

            serializer = BlogPostSerializer(blog_post)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except BlogPost.DoesNotExist:
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error unpublishing blog post {post_id}: {str(e)}")
            return Response(
                {'error': 'Failed to unpublish blog post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlogPostDeleteView(APIView):
    """
    Blog Post Delete API for Tech Support

    DELETE: Delete blog post

    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, post_id):
        """Delete blog post"""
        try:
            blog_post = BlogPost.objects.get(id=post_id)
            blog_post.delete()
            return Response(
                {'message': 'Blog post deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )

        except BlogPost.DoesNotExist:
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting blog post {post_id}: {str(e)}")
            return Response(
                {'error': 'Failed to delete blog post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )