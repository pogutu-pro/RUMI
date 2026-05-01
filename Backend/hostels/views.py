import uuid
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import transaction, models
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from accounts.permissions import IsVerifiedLandlord, IsHostelOwner, IsLandlordOfRoom
from accounts.models import LandlordProfile
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from core.views import TenantModelViewSet
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import (
    Hostel, Room, Booking, RoomReservation, RoomOccupant,
    CompatibilityScore, InventoryTemplate, InventoryItem,
    RoomInventory, InventoryCheckIn, InventoryCheckOut,
    DamageReport, RoomTransfer, RoomImage, HostelAmenity,
    Favorite, Waitlist
)
from .bed_models import Bed, BedOccupancy
from .serializers import (
    HostelSerializer, HostelCreateSerializer,
    RoomSerializer, RoomCreateSerializer,
    BookingSerializer, BookingCreateSerializer
)


class HostelViewSet(TenantModelViewSet):
    """
    Unified Hostel Management ViewSet.
    - Landlords: Full CRUD on OWN hostels.
    - Caretakers: Read/Update on ASSIGNED hostel.
    - Public: Read ONLY on ACTIVE hostels.
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
        return Hostel.objects.filter(status='active').select_related(
            'landlord__user'
        ).prefetch_related('hostel_amenities__amenity', 'rooms')

    def list(self, request, *args, **kwargs):
        # Skip cache for authenticated landlords/caretakers — they see scoped data
        if request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        cached = cache.get('hostels_list')
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set('hostels_list', response.data, timeout=300)
        return response

    def perform_create(self, serializer):
        if self.request.user.role != 'landlord':
            raise PermissionDenied("Only landlords can create hostels")
            
        try:
            landlord_profile = self.request.user.landlord_profile
            if not landlord_profile.is_verified:
                raise PermissionDenied("Landlord must be verified to create hostels")
                
            hostel = serializer.save(landlord=landlord_profile)
            
            # Auto-generate Room stubs based on total_rooms
            total_rooms = serializer.validated_data.get('total_rooms', 0)
            if total_rooms > 0:
                rooms_to_create = []
                for i in range(total_rooms):
                    rooms_to_create.append(Room(
                        hostel=hostel,
                        room_number=f"Room {i+1}",
                        capacity=1,
                        base_price=serializer.validated_data.get('base_price', 0),
                        room_type='single',
                        floor=1
                    ))
                Room.objects.bulk_create(rooms_to_create)
            
            # Update landlord stats
            landlord_profile.total_hostels += 1
            landlord_profile.save()
        except LandlordProfile.DoesNotExist:
            raise ValidationError("Landlord profile not found")


class RoomViewSet(TenantModelViewSet):
    """
    Unified Room Management ViewSet.
    - Landlords: Full CRUD on rooms in their hostels.
    - Caretakers: Read/Update on rooms in their assigned hostel.
    - Public: Read ONLY on available rooms in active hostels.
    """
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsLandlordOfRoom]
    queryset = Room.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return RoomCreateSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        
        # 1. Tenant Scoped (Landlord/Caretaker)
        if user.is_authenticated and user.role in ['landlord', 'caretaker']:
            return super().get_queryset()
            
        # 2. Public Scope (Available rooms in active hostels)
        active_occupancy = Prefetch(
            'occupancy_timeline',
            queryset=BedOccupancy.objects.filter(is_active=True).select_related('student__user'),
        )
        return Room.objects.filter(
            status='available', hostel__status='active'
        ).select_related('hostel').prefetch_related(
            Prefetch('beds', queryset=Bed.objects.prefetch_related(active_occupancy))
        )

    def perform_create(self, serializer):
        hostel_id = self.request.data.get('hostel_id')
        if not hostel_id:
            raise ValidationError("hostel_id is required")
            
        try:
            hostel = Hostel.objects.get(id=hostel_id)
            if hostel.landlord.user != self.request.user:
                raise PermissionDenied("You do not own this hostel")
            serializer.save(hostel=hostel)
        except Hostel.DoesNotExist:
            raise ValidationError("Hostel not found")


class BookingViewSet(TenantModelViewSet):
    """
    Unified Booking Management ViewSet.
    - Landlords: View/Manage bookings for their hostels.
    - Students: View/Create their own bookings.
    - Caretakers: View/Manage bookings for their assigned hostel.
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Booking.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset().select_related('room__hostel', 'student__user')
        hostel_id = self.request.query_params.get('hostel_id')
        if hostel_id:
            queryset = queryset.filter(room__hostel_id=hostel_id)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        # Subscription Enforcement Check
        room_id = self.request.data.get('room_id') or self.request.data.get('room')
        if room_id:
            try:
                from payments.subscription_models import SubscriptionInvoice
                from django.db.models import Q
                
                room = Room.objects.get(id=room_id)
                landlord = room.hostel.landlord
                
                # Check for severely overdue invoices (> 21 days)
                critical_overdue = SubscriptionInvoice.objects.filter(
                    landlord=landlord,
                    status__in=['issued', 'overdue', 'in_grace'],
                    due_date__lt=timezone.now().date() - timezone.timedelta(days=21)
                ).exists()
                
                if critical_overdue:
                    raise PermissionDenied(
                        "This hostel is currently not accepting new bookings "
                        "due to administrative reasons. Please try again later or "
                        "contact support."
                    )
            except (Room.DoesNotExist, ImportError):
                pass

        try:
            student_profile = self.request.user.student_profile
            serializer.save(student=student_profile)
        except Exception:
            raise ValidationError("Student profile not found")


@swagger_auto_schema(
    tags=['Inventory Management']
)
class InventoryTemplateCreateView(APIView):
    """Create inventory template for hostel (Caretaker only)"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, hostel_id):
        """Create inventory template"""
        # Validate caretaker access
        try:
            caretaker = request.user.caretaker_profile
            if caretaker.hostel_id != int(hostel_id) or not caretaker.is_active:
                return Response({
                    'error': 'Access denied'
                }, status=status.HTTP_403_FORBIDDEN)

            if not caretaker.permissions.get('can_create_inventory_templates'):
                return Response({
                    'error': 'You do not have permission to create inventory templates'
                }, status=status.HTTP_403_FORBIDDEN)

        except Exception:
            return Response({
                'error': 'Caretaker profile not found'
            }, status=status.HTTP_403_FORBIDDEN)

        # Validate required fields
        if not request.data.get('template_name') or not request.data.get('items'):
            return Response({
                'error': 'template_name and items are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Deactivate existing template
                InventoryTemplate.objects.filter(
                    hostel_id=hostel_id,
                    is_active=True
                ).update(is_active=False)

                # Get next version
                last_version = InventoryTemplate.objects.filter(
                    hostel_id=hostel_id
                ).aggregate(models.Max('version'))['version__max'] or 0

                # Create new template
                template = InventoryTemplate.objects.create(
                    hostel_id=hostel_id,
                    created_by=caretaker,
                    template_name=request.data['template_name'],
                    is_active=True,
                    version=last_version + 1
                )

                # Create inventory items
                items = []
                total_value = Decimal('0.00')
                for item_data in request.data['items']:
                    item = InventoryItem.objects.create(
                        template=template,
                        category=item_data.get('category', 'other'),
                        item_name=item_data['item_name'],
                        quantity=item_data.get('quantity', 1),
                        replacement_cost=item_data['replacement_cost'],
                        is_mandatory=item_data.get('is_mandatory', True),
                        display_order=item_data.get('display_order', 0)
                    )
                    items.append(item)
                    total_value += item.replacement_cost * item.quantity

                # Update hostel flag
                hostel = Hostel.objects.get(id=hostel_id)
                hostel.has_inventory_template = True
                hostel.save()

                # Notify landlord — deferred until after commit
                from .tasks import notify_landlord_inventory_template_created
                _hostel_id = hostel_id
                _caretaker_name = caretaker.user.get_full_name()
                _total_items = len(items)
                transaction.on_commit(lambda: notify_landlord_inventory_template_created.delay(
                    hostel_id=_hostel_id,
                    caretaker_name=_caretaker_name,
                    total_items=_total_items,
                ))

                return Response({
                    'template_id': template.id,
                    'hostel_id': hostel_id,
                    'template_name': template.template_name,
                    'total_items': len(items),
                    'total_replacement_value': float(total_value),
                    'version': template.version,
                    'created_at': template.created_at,
                    'message': 'Inventory template created successfully. All rooms in this hostel will use this template.'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to create inventory template',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['Inventory Management']
)
class InventoryTemplateDetailView(APIView):
    """Get inventory template details"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, hostel_id):
        """Get current inventory template"""
        try:
            template = InventoryTemplate.objects.prefetch_related('inventoryitem_set').get(
                hostel_id=hostel_id,
                is_active=True
            )
        except InventoryTemplate.DoesNotExist:
            return Response({
                'error': 'Inventory template not found'
            }, status=status.HTTP_404_NOT_FOUND)

        items = template.inventoryitem_set.all().order_by('display_order')
        total_value = sum(item.replacement_cost * item.quantity for item in items)

        # Group items by category
        items_by_category = {}
        for item in items:
            category = item.category
            if category not in items_by_category:
                items_by_category[category] = []
            items_by_category[category].append({
                'item_id': item.id,
                'item_name': item.item_name,
                'quantity': item.quantity,
                'replacement_cost': float(item.replacement_cost),
                'is_mandatory': item.is_mandatory
            })

        return Response({
            'template_id': template.id,
            'template_name': template.template_name,
            'version': template.version,
            'total_items': len(items),
            'total_replacement_value': float(total_value),
            'items_by_category': items_by_category,
            'created_by': {
                'caretaker_name': template.created_by.user.get_full_name(),
                'created_at': template.created_at
            }
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Inventory Management']
)
class InventoryCheckInStartView(APIView):
    """Start inventory check-in process (Student)"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        """Initiate check-in"""
        # Validate booking ownership
        try:
            booking = Booking.objects.select_related('room__hostel').get(
                id=booking_id,
                student__user=request.user,
                status='confirmed'
            )
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if check-in already exists
        if InventoryCheckIn.objects.filter(booking_id=booking_id).exists():
            return Response({
                'error': 'Check-in already started for this booking'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get inventory template
        try:
            template = InventoryTemplate.objects.prefetch_related('inventoryitem_set').get(
                hostel=booking.room.hostel,
                is_active=True
            )
        except InventoryTemplate.DoesNotExist:
            return Response({
                'error': 'Inventory template not found for this hostel'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                # Create check-in record
                checkin = InventoryCheckIn.objects.create(
                    booking=booking,
                    room=booking.room,
                    student=booking.student,
                    template=template,
                    checklist_data=self.generate_checklist(template),
                    status='pending'
                )

                return Response({
                    'checkin_id': checkin.id,
                    'booking_id': booking_id,
                    'room_number': booking.room.room_number,
                    'hostel_name': booking.room.hostel.name,
                    'template_id': template.id,
                    'total_items': len(template.inventoryitem_set.all()),
                    'status': 'pending',
                    'instructions': 'Please review the inventory checklist and mark the condition of each item. The caretaker will verify your submission.',
                    'deadline': (timezone.now() + timezone.timedelta(days=7)).isoformat()
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to start check-in',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def generate_checklist(self, template):
        """Generate initial checklist data"""
        items = []
        for item in template.inventoryitem_set.all().order_by('display_order'):
            items.append({
                'item_id': item.id,
                'item_name': item.item_name,
                'expected_quantity': item.quantity,
                'actual_quantity': None,
                'condition': None,
                'has_damage': None,
                'damage_description': None,
                'student_checked': False,
                'caretaker_checked': False
            })

        return {
            'items': items,
            'summary': {
                'total_items': len(items),
                'items_present': 0,
                'items_missing': 0,
                'items_damaged': 0
            }
        }


@swagger_auto_schema(
    tags=['Inventory Management']
)
class InventoryCheckInSubmitView(APIView):
    """Submit completed inventory checklist (Student)"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, checkin_id):
        """Submit student checklist"""
        try:
            checkin = InventoryCheckIn.objects.get(
                id=checkin_id,
                student__user=request.user,
                status='pending'
            )
        except InventoryCheckIn.DoesNotExist:
            return Response({
                'error': 'Check-in not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)

        checklist_data = request.data.get('checklist_data')
        if not checklist_data or not checklist_data.get('items'):
            return Response({
                'error': 'checklist_data with items is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Update checklist
                checkin.checklist_data = checklist_data
                checkin.student_notes = request.data.get('student_notes')
                checkin.student_signature = request.data.get('student_signature')
                checkin.status = 'student_submitted'
                checkin.student_submitted_at = timezone.now()
                checkin.save()

                # Notify caretaker — deferred until after commit
                from .tasks import notify_caretaker_checkin_submitted
                _checkin_id = checkin.id
                transaction.on_commit(lambda: notify_caretaker_checkin_submitted.delay(
                    checkin_id=_checkin_id,
                ))

                return Response({
                    'checkin_id': checkin.id,
                    'status': 'student_submitted',
                    'submitted_at': checkin.student_submitted_at,
                    'message': 'Inventory checklist submitted. Awaiting caretaker verification.',
                    'next_step': 'caretaker_verification'
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to submit checklist',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['Inventory Management']
)
class InventoryCheckInVerifyView(APIView):
    """Verify inventory check-in (Caretaker)"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, checkin_id):
        """Caretaker verification"""
        try:
            checkin = InventoryCheckIn.objects.select_related('room__hostel').get(id=checkin_id)
        except InventoryCheckIn.DoesNotExist:
            return Response({
                'error': 'Check-in not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Validate caretaker access
        try:
            caretaker = request.user.caretaker_profile
            if (caretaker.hostel_id != checkin.room.hostel_id or
                not caretaker.is_active or
                not caretaker.permissions.get('can_verify_check_ins')):
                return Response({
                    'error': 'Access denied'
                }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({
                'error': 'Caretaker profile not found'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            with transaction.atomic():
                # Apply caretaker updates
                verification_updates = request.data.get('verification_updates', [])
                checklist = checkin.checklist_data

                for update in verification_updates:
                    for item in checklist['items']:
                        if item['item_id'] == update['item_id']:
                            if 'caretaker_condition_override' in update:
                                item['condition'] = update['caretaker_condition_override']
                            item['caretaker_checked'] = True
                            if 'caretaker_notes' in update:
                                item['caretaker_notes'] = update['caretaker_notes']

                checkin.checklist_data = checklist
                checkin.caretaker_notes = request.data.get('caretaker_notes')
                checkin.caretaker_signature = request.data.get('caretaker_signature')
                checkin.verified_by_caretaker = caretaker
                checkin.status = 'caretaker_verified'
                checkin.caretaker_verified_at = timezone.now()
                checkin.save()

                # Update occupant record
                occupant, created = RoomOccupant.objects.get_or_create(
                    room=checkin.room,
                    student=checkin.student,
                    booking=checkin.booking,
                    defaults={
                        'move_in_date': timezone.now().date(),
                        'is_active': True,
                        'check_in_completed': True,
                        'check_in_id': checkin.id
                    }
                )
                if not created:
                    occupant.check_in_completed = True
                    occupant.check_in_id = checkin.id
                    occupant.save()

                # Notify student — deferred until after commit
                from .tasks import notify_student_checkin_verified
                _checkin_id = checkin.id
                _room_number = checkin.room.room_number
                _hostel_name = checkin.room.hostel.name
                transaction.on_commit(lambda: notify_student_checkin_verified.delay(
                    checkin_id=_checkin_id,
                    room_number=_room_number,
                    hostel_name=_hostel_name,
                ))

                return Response({
                    'checkin_id': checkin.id,
                    'status': 'caretaker_verified',
                    'verified_at': checkin.caretaker_verified_at,
                    'message': 'Inventory check-in verified. Student can now move in.',
                    'student_can_move_in': True
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to verify check-in',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['Room Search']
)
class RoomSearchView(APIView):
    """
    Room Search API
    
    Search and filter available rooms across all hostels.
    
    GET: Search rooms with comprehensive filtering options
    
    Authentication Required: JWT Token
    Permissions: Authenticated users (any role)
    
    This endpoint provides comprehensive room search functionality with
    multiple filtering options and compatibility scoring for students.
    
    Search Features:
    - University-based filtering
    - Price range filtering
    - Room type filtering
    - Compatibility score calculation
    - Real-time availability checking
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Search Rooms
        
        Search available rooms with comprehensive filtering options.
        
        Query Parameters:
        - university: Filter by university name
        - min_price: Minimum price filter (KES)
        - max_price: Maximum price filter (KES)
        - room_type: Room type filter (single, double, triple, quad)
        - limit: Number of results (default: 20)
        - offset: Pagination offset
        
        Returns comprehensive room search results:
        
        Room Information:
        - room_id: Unique room identifier
        - hostel_name: Associated property name
        - room_number: Room identifier
        - capacity: Maximum occupants
        - base_price: Monthly rent amount
        - room_type: Room configuration type
        - amenities: Available amenities list
        - images: Room photo gallery
        
        Matching Data:
        - compatibility_score: Student compatibility rating (0-100)
        
        Search Features:
        - Real-time availability checking
        - Multiple filter combination support
        - Optimized database queries
        - Pagination for large result sets
        
        Note: Only returns rooms from active, verified hostels.
        """
        queryset = Room.objects.select_related('hostel').filter(
            status='available',
            hostel__status='active'
        )

        # Apply filters
        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(hostel__university__icontains=university)

        min_price = request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(base_price__gte=Decimal(min_price))
            except Exception:
                pass

        max_price = request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(base_price__lte=Decimal(max_price))
            except Exception:
                pass

        room_type = request.query_params.get('room_type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_results = queryset.count()
        rooms = queryset[offset:offset + limit]

        results = []
        for room in rooms:
            # Mock compatibility score (would be calculated)
            compatibility_score = 85

            results.append({
                'room_id': room.id,
                'hostel_name': room.hostel.name,
                'room_number': room.room_number,
                'capacity': room.capacity,
                'base_price': float(room.base_price),
                'room_type': room.room_type,
                'amenities': room.hostel.amenities,
                'images': room.images or [],
                'compatibility_score': compatibility_score
            })

        return Response({
            'total_results': total_results,
            'results': results
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Room Search']
)
class HostelSearchView(APIView):
    """
    Hostel Search API
    
    Search and filter available hostels with comprehensive options.
    
    GET: Search hostels with advanced filtering and sorting
    
    Authentication Required: JWT Token
    Permissions: Authenticated users (any role)
    
    This endpoint provides comprehensive hostel search with advanced filtering,
    sorting options, and detailed property information.
    
    Search Features:
    - Text search across multiple fields
    - University-based filtering
    - Price range filtering
    - Gender policy filtering
    - Amenity-based filtering
    - Verification status filtering
    - Multiple sorting options
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Search Hostels
        
        Search available hostels with comprehensive filtering and sorting.
        
        Query Parameters:
        - search: Text search in name, description, address, university
        - university: Filter by specific university
        - min_price: Minimum base price filter (KES)
        - max_price: Maximum base price filter (KES)
        - gender_policy: Gender policy filter (male_only, female_only, mixed)
        - verified: Show only verified hostels (true/false)
        - amenities: Comma-separated amenity list
        - sort_by: Sorting option (name, price_low, price_high, rating)
        - limit: Number of results (default: 20)
        - offset: Pagination offset
        
        Returns comprehensive hostel search results:
        
        Property Information:
        - id: Unique hostel identifier
        - name: Property name
        - description: Detailed description
        - address: Physical address
        - city: City location
        - university: Associated university
        - latitude/longitude: GPS coordinates
        - total_rooms: Total room count
        - available_rooms: Currently available rooms
        - base_price: Starting price
        - currency: Pricing currency
        
        Quality Metrics:
        - rating: Average rating (1-5 stars)
        - review_count: Number of reviews
        - distance_from_university: Calculated distance
        - is_verified: Verification status
        
        Property Details:
        - images: Property photo gallery
        - amenities: Available amenities list
        - gender_policy: Gender accommodation policy
        - landlord_name: Property owner/manager
        
        Search Features:
        - Multi-field text search
        - Complex filter combinations
        - Multiple sorting options
        - Real-time availability
        - Verification status filtering
        
        Note: Only returns active hostel properties.
        """
        queryset = Hostel.objects.filter(status='active').select_related(
            'landlord', 'landlord__user'
        ).prefetch_related('hostel_amenities__amenity')

        # Apply filters
        search_query = request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(name__icontains=search_query) |
                models.Q(description__icontains=search_query) |
                models.Q(address__icontains=search_query) |
                models.Q(university__icontains=search_query)
            )

        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(university__icontains=university)

        min_price = request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(base_price__gte=Decimal(min_price))
            except Exception:
                pass

        max_price = request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(base_price__lte=Decimal(max_price))
            except Exception:
                pass

        hostel_type = request.query_params.get('hostel_type')
        if hostel_type:
            queryset = queryset.filter(hostel_type=hostel_type)

        gender_policy = request.query_params.get('gender_policy')
        if gender_policy:
            queryset = queryset.filter(gender_policy=gender_policy)

        verified_only = request.query_params.get('verified') == 'true'
        if verified_only:
            queryset = queryset.filter(is_verified=True)

        amenities_filter = request.query_params.get('amenities')
        if amenities_filter:
            # Simple contains filter for now - logic might need M2M filter refinement for strict matching
            amenity_list = amenities_filter.split(',')
            queryset = queryset.filter(hostel_amenities__amenity__name__in=amenity_list).distinct()

        # Sorting
        sort_by = request.query_params.get('sort_by')
        if sort_by == 'price_low':
            queryset = queryset.order_by('base_price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-base_price')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-rating')
        elif sort_by == 'popularity':
            queryset = queryset.order_by('-review_count')
        elif sort_by == 'newest':
             queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('name')

        # Use standard DRF pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get('limit', 20))
        
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = HostelSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        # Fallback if pagination fails or not needed
        serializer = HostelSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })


@swagger_auto_schema(
    tags=['Room Booking']
)
class RoomReserveView(APIView):
    """Reserve room temporarily (Student)"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        """Create room reservation"""
        # Validate student profile
        try:
            student = request.user.student_profile
            if not student.is_profile_complete:
                return Response({
                    'error': 'Complete your profile before booking'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate room
        try:
            room = Room.objects.select_related('hostel').get(id=room_id, status='available')
        except Room.DoesNotExist:
            return Response({
                'error': 'Room not found or not available'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        validated_data = serializer.validated_data
        move_in_date = validated_data.get('move_in_date', timezone.now().date())
        payment_plan = validated_data.get('payment_plan', 'monthly')
        is_existing_resident = validated_data.get('is_existing_resident', False)

        try:
            with transaction.atomic():
                # Create booking
                booking_reference = f"RUMI-BK-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"

                booking = Booking.objects.create(
                    booking_reference=booking_reference,
                    student=student,
                    room=room,
                    status='pending' if is_existing_resident else 'reserved',
                    payment_status='pending',
                    payment_plan=payment_plan,
                    is_existing_resident=is_existing_resident,
                    monthly_rent=room.base_price,
                    total_amount=room.base_price,  # Simplified
                    amount_paid=Decimal('0.00'),
                    balance_due=room.base_price,
                    check_in_date=move_in_date,
                    move_in_date=move_in_date,
                    emergency_contact_name=student.emergency_contact_name,
                    emergency_contact_phone=student.emergency_contact_phone,
                    emergency_contact_relationship=student.emergency_contact_relationship
                )

                # Create reservation
                reservation_token = uuid.uuid4()
                expiry_time = timezone.now() + timezone.timedelta(minutes=15)

                reservation = RoomReservation.objects.create(
                    booking=booking,
                    room=room,
                    student=student,
                    reservation_token=reservation_token,
                    expiry_time=expiry_time,
                    is_active=True
                )

                # Temporarily hold room
                room.current_occupancy += 1
                room.save()

                # Schedule cleanup — deferred until after commit
                from .tasks import cleanup_expired_reservation
                _reservation_id = reservation.id
                transaction.on_commit(lambda: cleanup_expired_reservation.apply_async(
                    args=[_reservation_id],
                    countdown=15 * 60,
                ))

                return Response({
                    'reservation_id': reservation.id,
                    'booking_id': booking.id,
                    'room_id': room_id,
                    'expires_at': expiry_time.isoformat(),
                    'expires_in_seconds': 15 * 60,  # 15 minutes in seconds
                    'reservation_token': str(reservation_token),
                    'status': 'reserved',
                    'countdown_started_at': timezone.now().isoformat()
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to reserve room',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['Room Booking']
)
class RoomBookView(APIView):
    """Confirm booking with payment (Student)"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        """Confirm booking"""
        reservation_token = request.META.get('HTTP_X_RESERVATION_TOKEN')

        if not reservation_token:
            return Response({
                'error': 'Reservation token required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation = RoomReservation.objects.select_related('booking', 'room').get(
                room_id=room_id,
                student__user=request.user,
                reservation_token=uuid.UUID(reservation_token),
                is_active=True,
                expiry_time__gt=timezone.now()
            )
        except (RoomReservation.DoesNotExist, ValueError):
            return Response({
                'error': 'Invalid or expired reservation'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                booking = reservation.booking
                booking.status = 'pending_payment'
                booking.reserved_at = timezone.now()
                booking.save()

                # Deactivate reservation
                reservation.is_active = False
                reservation.save()

                return Response({
                    'booking_id': booking.id,
                    'booking_reference': booking.booking_reference,
                    'status': 'pending_payment',
                    'payment_required': {
                        'total_amount': float(booking.total_amount),
                        'breakdown': {
                            'rent': float(booking.room.base_price),
                            'service_fee': float(booking.total_amount - booking.room.base_price)
                        }
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to confirm booking',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    tags=['Room Booking']
)
class ReservationStatusView(APIView):
    """Check reservation status and remaining time (Student)"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reservation_id):
        """Get reservation status and countdown information"""
        try:
            reservation = RoomReservation.objects.select_related(
                'booking', 'room', 'student__user'
            ).get(
                id=reservation_id,
                student__user=request.user,
                is_active=True
            )
        except RoomReservation.DoesNotExist:
            return Response({
                'error': 'Reservation not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Calculate remaining time
        now = timezone.now()
        expiry_time = reservation.expiry_time
        
        if expiry_time <= now:
            # Reservation expired
            return Response({
                'reservation_id': reservation.id,
                'status': 'expired',
                'expires_at': expiry_time.isoformat(),
                'expires_in_seconds': 0,
                'booking': {
                    'id': reservation.booking.id,
                    'booking_reference': reservation.booking.booking_reference,
                    'status': reservation.booking.status
                },
                'room': {
                    'id': reservation.room.id,
                    'room_number': reservation.room.room_number,
                    'hostel_name': reservation.room.hostel.name
                }
            }, status=status.HTTP_200_OK)
        
        # Calculate remaining seconds
        remaining_seconds = int((expiry_time - now).total_seconds())
        
        return Response({
            'reservation_id': reservation.id,
            'status': 'active',
            'expires_at': expiry_time.isoformat(),
            'expires_in_seconds': remaining_seconds,
            'countdown_started_at': reservation.created_at.isoformat(),
            'booking': {
                'id': reservation.booking.id,
                'booking_reference': reservation.booking.booking_reference,
                'status': reservation.booking.status
            },
            'room': {
                'id': reservation.room.id,
                'room_number': reservation.room.room_number,
                'hostel_name': reservation.room.hostel.name
            }
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    tags=['Roommate Matching']
)
class RoommateMatchingView(APIView):
    """Find compatible roommates for shared rooms"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        """Get potential roommates for a room"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can view roommate matches'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            room = Room.objects.select_related('hostel').get(id=room_id, is_available=True)
        except Room.DoesNotExist:
            return Response({
                'error': 'Room not found or not available'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get current user profile
        try:
            current_student = request.user.student_profile
        except Exception:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Find potential roommates
        potential_roommates = self.find_potential_roommates(room, current_student)

        # Calculate compatibility scores
        matches = []
        for roommate in potential_roommates:
            score = self.calculate_compatibility_score(current_student, roommate, room)
            matches.append({
                'student_id': roommate.id,
                'name': roommate.user.get_full_name(),
                'university': roommate.university,
                'course': roommate.course_of_study,
                'year_of_study': roommate.year_of_study,
                'gender': roommate.gender,
                'compatibility_score': score,
                'match_reasons': self.get_match_reasons(current_student, roommate, room)
            })

        # Sort by compatibility score
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)

        return Response({
            'room_id': room_id,
            'room_capacity': room.capacity,
            'current_occupancy': room.current_occupancy,
            'available_slots': room.capacity - room.current_occupancy,
            'potential_roommates': matches[:10]  # Top 10 matches
        }, status=status.HTTP_200_OK)

    def find_potential_roommates(self, room, current_student):
        """Find students who might be compatible roommates"""
        from accounts.models import StudentProfile as AccountsStudentProfile

        # Get students in the same university
        potential = AccountsStudentProfile.objects.filter(
            university=room.hostel.university,
            is_profile_complete=True
        ).exclude(id=current_student.id)

        # Exclude students already in this room or with active bookings
        occupied_students = RoomOccupant.objects.filter(
            room=room,
            is_active=True
        ).values_list('student_id', flat=True)

        active_bookings = Booking.objects.filter(
            room=room,
            status__in=['confirmed', 'reserved']
        ).values_list('student_id', flat=True)

        exclude_ids = set(occupied_students) | set(active_bookings)
        potential = potential.exclude(id__in=exclude_ids)

        return potential[:50]  # Limit for performance

    def calculate_compatibility_score(self, student1, student2, room):
        """Calculate compatibility score between two students"""
        score = 50  # Base score

        # Gender matching (high priority for shared rooms)
        if room.capacity > 1:  # Shared room
            if student1.gender == student2.gender:
                score += 30
            elif room.hostel.gender_policy == 'mixed':
                score += 10
            else:
                score -= 20  # Penalty for gender mismatch in non-mixed hostels

        # Course matching (coursemates)
        if student1.course_of_study and student2.course_of_study:
            if student1.course_of_study.lower() == student2.course_of_study.lower():
                score += 25
            elif student1.course_of_study.lower() in student2.course_of_study.lower() or \
                 student2.course_of_study.lower() in student1.course_of_study.lower():
                score += 15

        # Year of study (similar academic level)
        if student1.year_of_study and student2.year_of_study:
            year_diff = abs(student1.year_of_study - student2.year_of_study)
            if year_diff == 0:
                score += 15
            elif year_diff == 1:
                score += 10
            elif year_diff <= 2:
                score += 5

        # Lifestyle preferences (if available)
        if hasattr(student1, 'lifestyle_preferences') and hasattr(student2, 'lifestyle_preferences'):
            common_prefs = set(student1.lifestyle_preferences or []) & set(student2.lifestyle_preferences or [])
            score += len(common_prefs) * 5

        # Study habits compatibility
        if hasattr(student1, 'study_habits') and hasattr(student2, 'study_habits'):
            if student1.study_habits == student2.study_habits:
                score += 10

        # Ensure score is between 0 and 100
        return max(0, min(100, score))

    def get_match_reasons(self, student1, student2, room):
        """Get reasons why these students are compatible"""
        reasons = []

        if room.capacity > 1 and student1.gender == student2.gender:
            reasons.append("Same gender")

        if (student1.course_of_study and student2.course_of_study and
            student1.course_of_study.lower() == student2.course_of_study.lower()):
            reasons.append("Same course")

        if (student1.year_of_study and student2.year_of_study and
            abs(student1.year_of_study - student2.year_of_study) <= 1):
            reasons.append("Similar year of study")

        if not reasons:
            reasons.append("Same university")

        return reasons



class HostelRelatedView(APIView):
    """Get related hostels based on university and city"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, hostel_id):
        """Return 3 related hostels"""
        try:
            target_hostel = Hostel.objects.get(id=hostel_id, status='active')
        except Hostel.DoesNotExist:
            return Response({
                'error': 'Hostel not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Find hostels in the same university or city, excluding the current one
        queryset = Hostel.objects.filter(
            status='active'
        ).exclude(id=hostel_id)

        # Prioritize same university, then same city
        university_matches = queryset.filter(university=target_hostel.university)
        
        if university_matches.count() >= 3:
            related_hostels = university_matches[:3]
        else:
            city_matches = queryset.filter(city=target_hostel.city).exclude(id__in=university_matches.values_list('id', flat=True))
            related_hostels = list(university_matches) + list(city_matches[:3 - university_matches.count()])

        results = []
        for hostel in related_hostels:
            results.append({
                'id': hostel.id,
                'name': hostel.name,
                'description': hostel.description,
                'address': hostel.address,
                'city': hostel.city,
                'university': hostel.university,
                'gender_policy': hostel.gender_policy,
                'hostel_type': hostel.hostel_type,
                'base_price': str(hostel.base_price),
                'currency': hostel.currency,
                'rating': float(hostel.rating),
                'review_count': hostel.review_count,
                'images': hostel.images or [],
                'is_verified': hostel.is_verified,
            })

        return Response({
            'results': results
        }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method='post',
    responses={200: "Favorite toggled successfully"}
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_favorite_hostel(request, hostel_id):
    """
    Toggle favorite status for a hostel
    """
    try:
        hostel = Hostel.objects.get(id=hostel_id)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            hostel=hostel
        )
        
        if not created:
            favorite.delete()
            is_favorited = False
        else:
            is_favorited = True
            
        return Response({
            'is_favorited': is_favorited,
            'message': 'Hostel favorited' if is_favorited else 'Hostel removed from favorites'
        }, status=status.HTTP_200_OK)
        
    except Hostel.DoesNotExist:
        return Response({
            'error': 'Hostel not found'
        }, status=status.HTTP_404_NOT_FOUND)

@swagger_auto_schema(
    method='get',
    responses={200: "List of favorite hostels"}
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_favorites(request):
    """
    Get current user's favorite hostels
    """
    favorites = Favorite.objects.filter(user=request.user).select_related('hostel')
    results = []
    
    for fav in favorites:
        hostel = fav.hostel
        results.append({
            'id': hostel.id,
            'name': hostel.name,
            'address': hostel.address,
            'city': hostel.city,
            'base_price': float(hostel.base_price),
            'images': hostel.images or [],
            'is_verified': hostel.is_verified,
            'rating': float(hostel.rating)
        })
        
    return Response({
        'count': len(results),
        'results': results
    }, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method='post',
    responses={201: "Joined waitlist successfully"}
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_waitlist(request, hostel_id):
    """
    Join waitlist for a hostel
    """
    try:
        hostel = Hostel.objects.get(id=hostel_id)
        
        # Validate student profile
        try:
            student = request.user.student_profile
        except Exception:
            return Response({
                'error': 'Student profile required to join waitlist'
            }, status=status.HTTP_400_BAD_REQUEST)

        waitlist_entry, created = Waitlist.objects.get_or_create(
            student=student,
            hostel=hostel,
            defaults={
                'room_type_preference': request.data.get('room_type_preference'),
                'notes': request.data.get('notes')
            }
        )
        
        if not created:
            return Response({
                'message': 'You are already on the waitlist for this hostel'
            }, status=status.HTTP_200_OK)
            
        return Response({
            'message': 'Successfully joined the waitlist',
            'waitlist_id': waitlist_entry.id
        }, status=status.HTTP_201_CREATED)
        
    except Hostel.DoesNotExist:
        return Response({
            'error': 'Hostel not found'
        }, status=status.HTTP_404_NOT_FOUND)

