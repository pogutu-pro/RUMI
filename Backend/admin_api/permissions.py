from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsTechSupportAdmin(permissions.BasePermission):
    """Permission for Tech Support Admin users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['tech_support', 'super_admin']
        )


class IsSuperAdmin(permissions.BasePermission):
    """Permission for Super Admin users only"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'super_admin'
        )


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """Permission for Tech Support Admin or Super Admin"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['tech_support', 'super_admin']
        )