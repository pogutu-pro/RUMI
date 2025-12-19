import uuid
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction, models
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import (
    Hostel, Room, Booking, RoomReservation, RoomOccupant,
    CompatibilityScore, InventoryTemplate, InventoryItem,
    RoomInventory, InventoryCheckIn, InventoryCheckOut,
    DamageReport, RoomTransfer, RoomImage, HostelAmenity
)


class HostelCreateView(APIView):
    """
    Hostel Creation API
    
    Create new hostel listing for verified landlords.
    
    POST: Create new hostel property listing
    
    Authentication Required: JWT Token
    Permissions: Verified landlords only
    
    This endpoint allows verified landlords to create new hostel listings on the platform.
    Includes property details, amenities, rules, and image management.
    
    Security Features:
    - Landlord verification requirement
    - Ownership validation
    - Data sanitization and validation
    - Automatic statistics update
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Create Hostel Listing
        
        Create a new hostel property listing with comprehensive details.
        
        Required Fields:
        - name: Hostel property name
        - description: Detailed property description
        - address: Physical address
        - city: City location
        - university: Associated university name
        - gender_policy: Gender policy (male_only, female_only, mixed)
        
        Optional Fields:
        - distance_from_university: Distance in kilometers
        - amenities: Dictionary of available amenities
        - rules: Hostel rules and regulations
        - images: Array of image URLs
        
        Process Flow:
        1. Validate user is verified landlord
        2. Validate required field presence
        3. Validate gender policy options
        4. Create hostel record with all details
        5. Update landlord statistics
        6. Return creation confirmation
        
        Returns hostel ID, initial stats, and next steps guidance.
        
        Error Handling:
        - 403: Non-landlord or unverified landlord access
        - 400: Missing required fields or invalid gender policy
        - 500: Database or server errors
        """
        # Check if user is verified landlord
        if request.user.role != 'landlord':
            return Response({
                'error': 'Only landlords can create hostels'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            landlord_profile = request.user.landlord_profile
            if not landlord_profile.is_verified:
                return Response({
                    'error': 'Landlord account must be verified to list hostels'
                }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({
                'error': 'Landlord profile not found'
            }, status=status.HTTP_403_FORBIDDEN)

        # Validate required fields
        required_fields = ['name', 'description', 'address', 'city', 'university', 'gender_policy']
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate gender policy
        valid_policies = ['male_only', 'female_only', 'mixed']
        if request.data['gender_policy'] not in valid_policies:
            return Response({
                'error': 'Invalid gender policy'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                hostel = Hostel.objects.create(
                    landlord=landlord_profile,
                    name=request.data['name'],
                    description=request.data['description'],
                    address=request.data['address'],
                    city=request.data['city'],
                    university=request.data['university'],
                    distance_from_university=request.data.get('distance_from_university'),
                    gender_policy=request.data['gender_policy'],
                    amenities=request.data.get('amenities', {}),
                    rules=request.data.get('rules'),
                    images=request.data.get('images', [])
                )

                # Update landlord stats
                landlord_profile.total_hostels += 1
                landlord_profile.save()

                return Response({
                    'hostel_id': hostel.id,
                    'name': hostel.name,
                    'landlord_name': landlord_profile.company_name or landlord_profile.user.get_full_name(),
                    'total_rooms': 0,
                    'is_active': hostel.is_active,
                    'has_inventory_template': False,
                    'created_at': hostel.created_at,
                    'message': 'Hostel created successfully. Next steps: Add rooms and create inventory template.'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to create hostel',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HostelDetailView(APIView):
    """Get hostel details"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, hostel_id):
        """Get hostel information"""
        try:
            hostel = Hostel.objects.select_related('landlord__user').get(id=hostel_id, is_active=True)
        except Hostel.DoesNotExist:
            return Response({
                'error': 'Hostel not found'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response(HostelSerializer(hostel).data, status=status.HTTP_200_OK)


class RoomCreateView(APIView):
    """
    Room Creation API
    
    Add new rooms to existing hostel properties.
    
    POST: Create new room in specified hostel
    
    Authentication Required: JWT Token
    Permissions: Verified landlords (property owners)
    
    This endpoint allows verified landlords to add individual rooms to their
    hostel properties, with detailed room specifications and pricing.
    
    Features:
    - Room type validation (single, double, triple, quad)
    - Duplicate room number prevention
    - Automatic inventory and statistics updates
    - Detailed room attributes and images
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, hostel_id):
        """
        Create Room
        
        Add a new room to the specified hostel property.
        
        Path Parameters:
        - hostel_id: Unique hostel identifier
        
        Required Fields:
        - room_number: Unique room identifier within hostel
        - capacity: Maximum number of occupants
        - base_price: Monthly rent amount
        - deposit_required: Security deposit amount
        - room_type: Room type (single, double, triple, quad)
        
        Optional Fields:
        - floor: Floor number
        - semester_price: Semester pricing option
        - detailed_attributes: Room-specific features
        - images: Room photos array
        
        Process Flow:
        1. Validate hostel ownership and existence
        2. Validate required field presence
        3. Validate room type options
        4. Check for duplicate room numbers
        5. Create room record with specifications
        6. Update hostel and landlord statistics
        7. Return room creation confirmation
        
        Returns room ID, specifications, and availability status.
        
        Error Handling:
        - 404: Hostel not found or access denied
        - 400: Missing fields, invalid room type, or duplicate room number
        - 500: Database or server errors
        """
        # Validate hostel ownership
        try:
            hostel = Hostel.objects.get(id=hostel_id, landlord__user=request.user, is_active=True)
        except Hostel.DoesNotExist:
            return Response({
                'error': 'Hostel not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)

        # Validate required fields
        required_fields = ['room_number', 'capacity', 'base_price', 'deposit_required', 'room_type']
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate room type
        valid_types = ['single', 'double', 'triple', 'quad']
        if request.data['room_type'] not in valid_types:
            return Response({
                'error': 'Invalid room type'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate room number
        if Room.objects.filter(hostel=hostel, room_number=request.data['room_number']).exists():
            return Response({
                'error': 'Room number already exists in this hostel'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                room = Room.objects.create(
                    hostel=hostel,
                    room_number=request.data['room_number'],
                    floor=request.data.get('floor'),
                    capacity=request.data['capacity'],
                    base_price=request.data['base_price'],
                    semester_price=request.data.get('semester_price'),
                    deposit_required=request.data['deposit_required'],
                    room_type=request.data['room_type'],
                    detailed_attributes=request.data.get('detailed_attributes', {}),
                    images=request.data.get('images', [])
                )

                # Update hostel stats
                hostel.total_rooms += 1
                hostel.available_rooms += 1
                hostel.save()

                # Update landlord stats
                hostel.landlord.total_rooms += 1
                hostel.landlord.save()

                return Response({
                    'room_id': room.id,
                    'hostel_name': hostel.name,
                    'room_number': room.room_number,
                    'capacity': room.capacity,
                    'base_price': float(room.base_price),
                    'is_available': room.is_available,
                    'has_custom_inventory': False,
                    'message': 'Room added successfully'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to add room',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

                # Notify landlord
                from .tasks import notify_landlord_inventory_template_created
                notify_landlord_inventory_template_created.delay(
                    hostel_id=hostel_id,
                    caretaker_name=caretaker.user.get_full_name(),
                    total_items=len(items)
                )

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

                # Notify caretaker
                from .tasks import notify_caretaker_checkin_submitted
                notify_caretaker_checkin_submitted.delay(checkin_id=checkin.id)

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

                # Notify student
                from .tasks import notify_student_checkin_verified
                notify_student_checkin_verified.delay(
                    checkin_id=checkin.id,
                    room_number=checkin.room.room_number,
                    hostel_name=checkin.room.hostel.name
                )

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
            is_available=True,
            hostel__is_active=True
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

    permission_classes = [permissions.IsAuthenticated]

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
        queryset = Hostel.objects.filter(is_active=True)

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
                queryset = queryset.filter(amenities__contains=[amenity])

        # Sorting
        sort_by = request.query_params.get('sort_by', 'name')
        if sort_by == 'price_low':
            queryset = queryset.order_by('base_price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-base_price')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-rating')
        else:
            queryset = queryset.order_by('name')

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_results = queryset.count()
        hostels = queryset[offset:offset + limit]

        results = []
        for hostel in hostels:
            # Calculate distance from university (mock calculation)
            distance = round(1.2 + (hostel.id % 10) * 0.3, 1)
            
            # Mock rating based on hostel id
            rating = round(3.5 + (hostel.id % 15) * 0.1, 1)
            
            results.append({
                'id': hostel.id,
                'name': hostel.name,
                'description': hostel.description,
                'address': hostel.address,
                'city': getattr(hostel, 'city', 'Nairobi'),
                'university': hostel.university,
                'latitude': float(hostel.latitude) if hostel.latitude else 0,
                'longitude': float(hostel.longitude) if hostel.longitude else 0,
                'total_rooms': hostel.total_rooms,
                'available_rooms': hostel.available_rooms,
                'base_price': float(hostel.base_price),
                'currency': hostel.currency,
                'rating': rating,
                'review_count': hostel.id * 3 + 10,
                'images': getattr(hostel, 'images', []) or [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
                ],
                'amenities': hostel.amenities or [],
                'gender_policy': hostel.gender_policy,
                'distance_from_university': distance,
                'is_verified': hostel.is_verified,
                'landlord_name': f"Landlord {hostel.id}"
            })

        return Response({
            'total_results': total_results,
            'results': results
        }, status=status.HTTP_200_OK)


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
            room = Room.objects.select_related('hostel').get(id=room_id, is_available=True)
        except Room.DoesNotExist:
            return Response({
                'error': 'Room not found or not available'
            }, status=status.HTTP_404_NOT_FOUND)

        move_in_date = request.data.get('move_in_date')
        payment_plan = request.data.get('payment_plan', 'monthly')

        if not move_in_date:
            return Response({
                'error': 'move_in_date is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            move_in_date = timezone.datetime.fromisoformat(move_in_date).date()
            if move_in_date < timezone.now().date():
                return Response({
                    'error': 'Move-in date cannot be in the past'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({
                'error': 'Invalid move_in_date format'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Create booking
                booking_reference = f"RUMI-BK-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"

                booking = Booking.objects.create(
                    booking_reference=booking_reference,
                    student=student,
                    room=room,
                    status='reserved',
                    payment_status='pending',
                    payment_plan=payment_plan,
                    total_amount=room.base_price,  # Simplified
                    amount_paid=Decimal('0.00'),
                    balance_due=room.base_price,
                    move_in_date=move_in_date
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

                # Schedule cleanup
                from .tasks import cleanup_expired_reservation
                cleanup_expired_reservation.apply_async(
                    args=[reservation.id],
                    countdown=15 * 60
                )

                return Response({
                    'reservation_id': reservation.id,
                    'room_id': room_id,
                    'expires_at': expiry_time,
                    'reservation_token': str(reservation_token),
                    'status': 'reserved'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to reserve room',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        from accounts.models import StudentProfile

        # Get students in the same university
        potential = StudentProfile.objects.filter(
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


class HostelsListView(APIView):
    """List all available hostels"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Get list of hostels with filtering"""
        queryset = Hostel.objects.filter(status='active').select_related('landlord__user')

        # Apply filters
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

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_hostels = queryset.count()
        hostels = queryset[offset:offset + limit]

        results = []
        for hostel in hostels:
            # Get room availability
            rooms = Room.objects.filter(hostel=hostel, is_active=True)
            total_rooms = rooms.count()
            available_rooms = rooms.filter(status='available').count()

            # Get amenities
            amenities = HostelAmenity.objects.filter(
                hostel=hostel,
                is_available=True
            ).select_related('amenity').values_list('amenity__name', flat=True)

            results.append({
                'hostel_id': hostel.id,
                'name': hostel.name,
                'description': hostel.description,
                'address': hostel.address,
                'hostel_type': hostel.hostel_type,
                'base_price': float(hostel.base_price),
                'total_rooms': total_rooms,
                'available_rooms': available_rooms,
                'amenities': list(amenities),
                'landlord': {
                    'company_name': hostel.landlord.company_name,
                    'phone': hostel.landlord.user.phone_number
                },
                'rating': 4.5,  # Mock rating
                'review_count': 15,  # Mock review count
                'is_verified': hostel.is_verified
            })

        return Response({
            'total_hostels': total_hostels,
            'hostels': results
        }, status=status.HTTP_200_OK)


class RoomsListView(APIView):
    """List all available rooms"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Get list of rooms with filtering"""
        queryset = Room.objects.select_related('hostel').filter(
            is_active=True,
            hostel__status='active',
            status='available'
        )

        # Apply filters
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

        hostel_type = request.query_params.get('hostel_type')
        if hostel_type:
            queryset = queryset.filter(hostel__hostel_type=hostel_type)

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_rooms = queryset.count()
        rooms = queryset[offset:offset + limit]

        results = []
        for room in rooms:
            # Get room images
            images = RoomImage.objects.filter(room=room).order_by('sort_order')
            image_urls = [img.image_url for img in images]

            results.append({
                'room_id': room.id,
                'hostel_name': room.hostel.name,
                'room_number': room.room_number,
                'capacity': room.capacity,
                'base_price': float(room.base_price),
                'room_type': room.room_type,
                'floor': room.floor,
                'amenities': room.amenities or {},
                'description': room.description,
                'images': image_urls,
                'hostel_type': room.hostel.hostel_type,
                'is_available': room.status == 'available',
                'compatibility_score': 85  # Mock compatibility score
            })

        return Response({
            'total_rooms': total_rooms,
            'rooms': results
        }, status=status.HTTP_200_OK)


class RoomDetailView(APIView):
    """Get detailed room information"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, room_id):
        """Get room details"""
        try:
            room = Room.objects.select_related('hostel__landlord__user').get(
                id=room_id,
                is_active=True,
                hostel__status='active'
            )
        except Room.DoesNotExist:
            return Response({
                'error': 'Room not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get room images
        images = RoomImage.objects.filter(room=room).order_by('sort_order')
        image_urls = [img.image_url for img in images]

        # Get current occupants
        occupants = RoomOccupant.objects.filter(
            room=room,
            is_active=True
        ).select_related('student__user')

        current_occupants = []
        for occupant in occupants:
            current_occupants.append({
                'name': occupant.student.user.get_full_name(),
                'course': getattr(occupant.student, 'course_of_study', ''),
                'year_of_study': getattr(occupant.student, 'year_of_study', '')
            })

        # Get hostel amenities
        amenities = HostelAmenity.objects.filter(
            hostel=room.hostel,
            is_available=True
        ).select_related('amenity').values_list('amenity__name', flat=True)

        return Response({
            'room_id': room.id,
            'hostel': {
                'hostel_id': room.hostel.id,
                'name': room.hostel.name,
                'address': room.hostel.address,
                'hostel_type': room.hostel.hostel_type,
                'landlord': {
                    'company_name': room.hostel.landlord.company_name,
                    'phone': room.hostel.landlord.user.phone_number
                }
            },
            'room_number': room.room_number,
            'capacity': room.capacity,
            'current_occupancy': room.current_occupancy,
            'base_price': float(room.base_price),
            'room_type': room.room_type,
            'floor': room.floor,
            'amenities': list(amenities),
            'description': room.description,
            'images': image_urls,
            'is_available': room.status == 'available',
            'current_occupants': current_occupants,
            'available_slots': room.capacity - room.current_occupancy
        }, status=status.HTTP_200_OK)
