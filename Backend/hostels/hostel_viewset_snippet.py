from core.views import TenantModelViewSet
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django.db.models import Q

class HostelViewSet(TenantModelViewSet):
    """
    Unified Hostel Management ViewSet.
    - Landlords: Full CRUD on OWN hostels (active/inactive).
    - Caretakers: Read/Update (if permitted) on ASSIGNED hostel.
    - Public/Students: Read ONLY on ACTIVE hostels.
    """
    serializer_class = HostelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Hostel.objects.all()

    def get_queryset(self):
        user = self.request.user
        
        # 1. Tenant Scoped (Landlord/Caretaker)
        if user.is_authenticated and user.role in ['landlord', 'caretaker']:
            return super().get_queryset()
            
        # 2. Public Scope (Active Only)
        return Hostel.objects.filter(status='active')

    def perform_create(self, serializer):
        # Enforce landlord role for creation
        if not self.request.user.role == 'landlord':
            raise PermissionDenied("Only landlords can create hostels.")
        
        landlord_profile = self.request.user.landlord_profile
        if not landlord_profile.is_verified:
            raise PermissionDenied("Landlord must be verified.")
            
        hostel = serializer.save(landlord=landlord_profile)
        
        # Update stats
        landlord_profile.total_hostels += 1
        landlord_profile.save()

    def list(self, request, *args, **kwargs):
        # Specialized filtering for the 'list' action to match HostelsListView
        # We can re-use the get_queryset logic which handles scoping, then apply filters
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply custom filters from parameters
        # (This replicates usage in HostelsListView)
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(university__icontains=search) |
                Q(address__icontains=search)
            )

        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(university__icontains=university)

        min_price = request.query_params.get('min_price')
        if min_price:
             queryset = queryset.filter(base_price__gte=min_price)
        
        max_price = request.query_params.get('max_price')
        if max_price:
             queryset = queryset.filter(base_price__lte=max_price)

        hostel_type = request.query_params.get('hostel_type')
        if hostel_type:
            queryset = queryset.filter(hostel_type=hostel_type)

        gender_policy = request.query_params.get('gender_policy')
        if gender_policy:
            queryset = queryset.filter(gender_policy=gender_policy)
            
        verified_only = request.query_params.get('verified') == 'true'
        if verified_only:
            queryset = queryset.filter(is_verified=True)

        amenities = request.query_params.get('amenities')
        if amenities:
            amenity_list = amenities.split(',')
            for amenity in amenity_list:
                queryset = queryset.filter(amenities__contains=[amenity]) # Assuming JSON field or similar logic

        # Sorting
        sort_by = request.query_params.get('sort_by', request.query_params.get('ordering', '-created_at'))
        if sort_by == 'price_low':
            queryset = queryset.order_by('base_price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-base_price')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-rating')
        elif sort_by in ['name', '-name', 'created_at', '-created_at']:
             queryset = queryset.order_by(sort_by)

        # Pagination logic (using standard DRF or Manual)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

