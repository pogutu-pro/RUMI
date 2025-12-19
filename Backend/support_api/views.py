from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError
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
    CaretakerCreateSerializer, CaretakerUpdateSerializer
)
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


class SystemLogsView(APIView):
    """System Logs API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get system logs"""
        return Response({'logs': 'System logs endpoint - implement as needed'})


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


class UserSupportView(APIView):
    """User Support API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user support operations"""
        return Response({'users': 'User support endpoint - implement as needed'})


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


class PaymentSupportView(APIView):
    """Payment Support API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get payment support operations"""
        return Response({'payments': 'Payment support endpoint - implement as needed'})


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