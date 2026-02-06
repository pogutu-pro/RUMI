from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied

class TenantModelViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet that automatically scopes queries to the authenticated tenant.
    Assumes models have either:
    - 'landlord': ForeignKey to LandlordProfile (direct ownership)
    - 'hostel': ForeignKey to Hostel (indirect ownership)
    - 'student': ForeignKey to StudentProfile (direct ownership for student resources)
    
    Also enforces standard permissions.
    """
    def get_queryset(self):
        # We need to get the queryset from the super class first since it might be doing other things (like prefetch_related)
        # But we can't call super().get_queryset() if it raises NotImplementedError without a queryset attribute.
        # So we assume the subclass defines 'queryset' or overrides get_queryset correctly.
        queryset = super().get_queryset()
        
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()

        # 1. Landlord Isolation
        if user.role == 'landlord':
            if hasattr(queryset.model, 'landlord'):
                return queryset.filter(landlord__user=user)
            elif hasattr(queryset.model, 'hostel'):
                return queryset.filter(hostel__landlord__user=user)
            # Add more indirect relationships if needed, e.g. RoomOccupant -> Room -> Hostel -> Landlord
            elif hasattr(queryset.model, 'room'):
                return queryset.filter(room__hostel__landlord__user=user)
                
        # 2. Caretaker Isolation (Hostel Scope)
        elif user.role == 'caretaker':
            try:
                caretaker_profile = user.caretaker_profile
                if not caretaker_profile.is_active or not caretaker_profile.hostel:
                    return queryset.none()
                
                # Caretakers can only see data for their assigned hostel
                if hasattr(self.queryset.model, 'hostel'):
                    return queryset.filter(hostel=caretaker_profile.hostel)
                elif hasattr(self.queryset.model, 'room'):
                    return queryset.filter(room__hostel=caretaker_profile.hostel)
                # If the model IS the Hostel model
                elif self.queryset.model.__name__ == 'Hostel':
                     return queryset.filter(id=caretaker_profile.hostel.id)
            except Exception:
                return queryset.none()
                
        # 3. Student Isolation (Own Data Scope)
        elif user.role == 'student':
            if hasattr(self.queryset.model, 'student'):
                return queryset.filter(student__user=user)
            # Students can usually view public Hostels/Rooms (handled by permission classes usually, 
            # but if we want to scope 'private' data, we do it here)
            
        return queryset
