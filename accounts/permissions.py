from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """
    Allow access only to users with student role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsLandlord(permissions.BasePermission):
    """
    Allow access only to users with landlord role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'landlord'


class IsCaretaker(permissions.BasePermission):
    """
    Allow access only to users with caretaker role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'caretaker'


class IsTechSupportAdmin(permissions.BasePermission):
    """
    Allow access only to tech support admins
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'tech_support'


class IsSuperAdmin(permissions.BasePermission):
    """
    Allow access only to super admins
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Allow access to any admin type
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['tech_support', 'super_admin']
        )


class IsVerifiedLandlord(permissions.BasePermission):
    """
    Allow access only to verified landlords
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.role != 'landlord':
            return False

        try:
            return request.user.landlord_profile.is_verified
        except Exception:
            return False


class HasCaretakerPermission(permissions.BasePermission):
    """
    Check specific caretaker permission from JSONB field
    """
    required_permission = None  # Override in subclasses

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.role != 'caretaker':
            return False

        try:
            caretaker = request.user.caretaker_profile
            return caretaker.permissions.get(self.required_permission, False)
        except Exception:
            return False


class CanViewStudentPayments(HasCaretakerPermission):
    required_permission = 'can_view_student_payments'


class CanCreateInventoryTemplates(HasCaretakerPermission):
    required_permission = 'can_create_inventory_templates'


class CanVerifyCheckIns(HasCaretakerPermission):
    required_permission = 'can_verify_check_ins'