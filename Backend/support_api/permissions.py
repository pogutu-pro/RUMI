from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .models import SupportTicket, TechSupportProfile


class CanCreateSupportTicket(permissions.BasePermission):
    """
    Allow Student, Caretaker, and Landlord to create support tickets
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['student', 'caretaker', 'landlord']
        )


class CanViewOwnSupportTicket(permissions.BasePermission):
    """
    Allow users to view their own support tickets
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        ticket_id = view.kwargs.get('ticket_id')
        if not ticket_id:
            return False
        
        try:
            ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            return ticket.created_by == request.user
        except SupportTicket.DoesNotExist:
            return False


class CanViewAssignedSupportTicket(permissions.BasePermission):
    """
    Allow tech support to view tickets assigned to them
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != 'tech_support':
            return False
        
        ticket_id = view.kwargs.get('ticket_id')
        if not ticket_id:
            return False
        
        try:
            tech_support = request.user.tech_support_profile
            ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            return ticket.assigned_to == tech_support
        except (TechSupportProfile.DoesNotExist, SupportTicket.DoesNotExist):
            return False


class CanManageSupportTicket(permissions.BasePermission):
    """
    Allow tech support to manage assigned tickets, super admin to manage all
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Super admin can manage all tickets
        if request.user.role == 'super_admin':
            return True
        
        # Tech support can manage assigned tickets
        if request.user.role == 'tech_support':
            ticket_id = view.kwargs.get('ticket_id')
            if not ticket_id:
                return False
            
            try:
                tech_support = request.user.tech_support_profile
                ticket = SupportTicket.objects.get(ticket_id=ticket_id)
                return ticket.assigned_to == tech_support
            except (TechSupportProfile.DoesNotExist, SupportTicket.DoesNotExist):
                return False
        
        return False


class CanEscalateTicket(permissions.BasePermission):
    """
    Allow tech support to escalate tickets to super admin
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != 'tech_support':
            return False
        
        ticket_id = view.kwargs.get('ticket_id')
        if not ticket_id:
            return False
        
        try:
            tech_support = request.user.tech_support_profile
            ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            return (
                ticket.assigned_to == tech_support and 
                ticket.escalation_level == 1 and
                ticket.status != 'escalated'
            )
        except (TechSupportProfile.DoesNotExist, SupportTicket.DoesNotExist):
            return False


class CanResolveTicket(permissions.BasePermission):
    """
    Allow tech support to resolve assigned tickets, super admin to resolve any
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Super admin can resolve any ticket
        if request.user.role == 'super_admin':
            return True
        
        # Tech support can resolve assigned tickets
        if request.user.role == 'tech_support':
            ticket_id = view.kwargs.get('ticket_id')
            if not ticket_id:
                return False
            
            try:
                tech_support = request.user.tech_support_profile
                ticket = SupportTicket.objects.get(ticket_id=ticket_id)
                return (
                    ticket.assigned_to == tech_support and 
                    ticket.status in ['open', 'in_progress', 'pending']
                )
            except (TechSupportProfile.DoesNotExist, SupportTicket.DoesNotExist):
                return False
        
        return False


class CanCreateTechSupportUser(permissions.BasePermission):
    """
    Allow only super admin to create tech support users
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'super_admin'
        )


class CanManageTechSupportUser(permissions.BasePermission):
    """
    Allow super admin to manage tech support users
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'super_admin'
        )


class CanCreateCaretaker(permissions.BasePermission):
    """
    Allow verified landlord to create caretaker accounts
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != 'landlord':
            return False
        
        try:
            return request.user.landlord_profile.is_verified
        except Exception:
            return False


class CanManageCaretaker(permissions.BasePermission):
    """
    Allow landlord to manage caretakers they created
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != 'landlord':
            return False
        
        # Check if landlord can manage caretakers
        try:
            landlord_profile = request.user.landlord_profile
            if not landlord_profile.is_verified:
                return False
            
            # For specific caretaker management, check ownership
            caretaker_id = view.kwargs.get('caretaker_id')
            if caretaker_id:
                try:
                    from accounts.models import CaretakerProfile
                    caretaker = CaretakerProfile.objects.get(id=caretaker_id)
                    return caretaker.landlord == landlord_profile
                except Exception:
                    return False
            
            return True
        except Exception:
            return False


class CanViewTechSupportDashboard(permissions.BasePermission):
    """
    Allow tech support and super admin to view tech support dashboard
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['tech_support', 'super_admin']
        )


class CanRespondToTicket(permissions.BasePermission):
    """
    Allow tech support, super admin, and ticket creator to respond to tickets
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        ticket_id = view.kwargs.get('ticket_id')
        if not ticket_id:
            return False
        
        try:
            ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            
            # Super admin can respond to any ticket
            if request.user.role == 'super_admin':
                return True
            
            # Tech support can respond to assigned tickets
            if request.user.role == 'tech_support':
                try:
                    tech_support = request.user.tech_support_profile
                    return ticket.assigned_to == tech_support
                except TechSupportProfile.DoesNotExist:
                    return False
            
            # Ticket creator can respond to their own tickets
            return ticket.created_by == request.user
            
        except SupportTicket.DoesNotExist:
            return False


class CanViewTicketResponses(permissions.BasePermission):
    """
    Allow appropriate users to view ticket responses
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        ticket_id = view.kwargs.get('ticket_id')
        if not ticket_id:
            return False
        
        try:
            ticket = SupportTicket.objects.get(ticket_id=ticket_id)
            
            # Super admin can view all responses
            if request.user.role == 'super_admin':
                return True
            
            # Tech support can view responses for assigned tickets
            if request.user.role == 'tech_support':
                try:
                    tech_support = request.user.tech_support_profile
                    return ticket.assigned_to == tech_support
                except TechSupportProfile.DoesNotExist:
                    return False
            
            # Ticket creator can view their ticket responses (except internal ones)
            return ticket.created_by == request.user
            
        except SupportTicket.DoesNotExist:
            return False