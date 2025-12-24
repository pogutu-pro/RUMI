from rest_framework import serializers
from .models import (
    Hostel, Room, Booking, RoomImage, Amenity, HostelAmenity,
    RoomTransfer, DamageReport, InventoryTemplate, RoomReservation,
    RoomOccupant, CompatibilityScore, InventoryItem, InventoryCheckIn,
    InventoryCheckOut, RoomInventory, VisitorCheckIn
)


class AmenitySerializer(serializers.ModelSerializer):
    """Serializer for hostel amenities"""

    class Meta:
        model = Amenity
        fields = ['id', 'name', 'description', 'icon', 'category']


class HostelAmenitySerializer(serializers.ModelSerializer):
    """Serializer for hostel-amenity relationships"""
    amenity = AmenitySerializer(read_only=True)

    class Meta:
        model = HostelAmenity
        fields = ['id', 'amenity', 'is_available']


class HostelSerializer(serializers.ModelSerializer):
    """Serializer for hostel listings"""
    amenities = HostelAmenitySerializer(source='hostel_amenities', many=True, read_only=True)
    landlord_info = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'description', 'address', 'city', 'university',
            'latitude', 'longitude', 'total_rooms', 'available_rooms',
            'base_price', 'currency', 'rating', 'review_count', 'images',
            'amenities', 'gender_policy', 'distance_from_university',
            'is_verified', 'landlord_info'
        ]
        read_only_fields = ['id', 'landlord_info', 'rating', 'review_count']

    def get_landlord_info(self, obj):
        return {
            'company_name': obj.landlord.company_name,
            'phone': obj.landlord.user.phone_number
        }


class HostelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating hostels"""

    class Meta:
        model = Hostel
        fields = [
            'name', 'description', 'address', 'city', 'university',
            'distance_from_university', 'gender_policy', 'amenities',
            'rules', 'images'
        ]

    def validate_gender_policy(self, value):
        valid_policies = ['male_only', 'female_only', 'mixed']
        if value not in valid_policies:
            raise serializers.ValidationError('Invalid gender policy')
        return value


class RoomImageSerializer(serializers.ModelSerializer):
    """Serializer for room images"""

    class Meta:
        model = RoomImage
        fields = ['id', 'image_url', 'alt_text', 'sort_order']


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for room listings"""
    images = RoomImageSerializer(many=True, read_only=True)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    compatibility_score = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hostel_name', 'room_number', 'capacity', 'base_price',
            'semester_price', 'deposit_required', 'room_type', 'floor',
            'amenities', 'detailed_attributes', 'images', 'is_available',
            'compatibility_score'
        ]

    def get_compatibility_score(self, obj):
        # Mock compatibility score - would be calculated based on user preferences
        return 85


class RoomCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating rooms"""

    class Meta:
        model = Room
        fields = [
            'room_number', 'floor', 'capacity', 'base_price', 'semester_price',
            'deposit_required', 'room_type', 'detailed_attributes', 'images'
        ]

    def validate_room_type(self, value):
        valid_types = ['single', 'double', 'triple', 'quad']
        if value not in valid_types:
            raise serializers.ValidationError('Invalid room type')
        return value


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for bookings"""
    room_info = serializers.SerializerMethodField()
    student_info = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'status', 'payment_status',
            'total_amount', 'amount_paid', 'balance_due', 'payment_plan',
            'move_in_date', 'move_out_date', 'created_at', 'updated_at',
            'room_info', 'student_info'
        ]
        read_only_fields = ['id', 'booking_reference', 'created_at', 'updated_at']

    def get_room_info(self, obj):
        return {
            'room_id': obj.room.id,
            'room_number': obj.room.room_number,
            'hostel_name': obj.room.hostel.name
        }

    def get_student_info(self, obj):
        return {
            'student_id': obj.student.id,
            'name': obj.student.user.get_full_name(),
            'email': obj.student.user.email
        }


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings"""

    class Meta:
        model = Booking
        fields = ['payment_plan', 'move_in_date']

    def validate_move_in_date(self, value):
        from django.utils import timezone
        if value < timezone.now().date():
            raise serializers.ValidationError('Move-in date cannot be in the past')
        return value


class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for inventory items"""

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'item_name', 'category', 'quantity', 'replacement_cost',
            'is_mandatory', 'display_order'
        ]


class InventoryTemplateSerializer(serializers.ModelSerializer):
    """Serializer for inventory templates"""
    items = InventoryItemSerializer(many=True, read_only=True)

    class Meta:
        model = InventoryTemplate
        fields = [
            'id', 'template_name', 'version', 'total_items',
            'created_at', 'created_by', 'items'
        ]
        read_only_fields = ['id', 'version', 'total_items', 'created_at']


class InventoryCheckInSerializer(serializers.ModelSerializer):
    """Serializer for inventory check-ins"""

    class Meta:
        model = InventoryCheckIn
        fields = [
            'id', 'booking', 'room', 'student', 'template', 'checklist_data',
            'student_notes', 'student_signature', 'caretaker_notes',
            'caretaker_signature', 'status', 'verified_by', 'student_submitted_at',
            'caretaker_verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RoomTransferSerializer(serializers.ModelSerializer):
    """Serializer for room transfers"""

    class Meta:
        model = RoomTransfer
        fields = [
            'id', 'student', 'from_room', 'to_room', 'reason', 'status',
            'requested_by', 'approved_by', 'approved_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DamageReportSerializer(serializers.ModelSerializer):
    """Serializer for damage reports"""

    class Meta:
        model = DamageReport
        fields = [
            'id', 'room', 'reported_by', 'damage_type', 'description',
            'estimated_cost', 'status', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VisitorCheckInSerializer(serializers.ModelSerializer):
    """Serializer for visitor check-ins"""

    class Meta:
        model = VisitorCheckIn
        fields = [
            'id', 'hostel', 'room', 'visitor_id_number', 'visitor_name',
            'check_in_time', 'check_out_time', 'person_visited_name',
            'checked_in_by', 'checked_out_by', 'notes', 'is_active',
            'visit_duration', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'check_out_time', 'checked_out_by', 'visit_duration',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        # Validate that room belongs to the hostel
        if data['room'].hostel != data['hostel']:
            raise serializers.ValidationError('Room does not belong to the specified hostel')
        return data


class VisitorCheckInCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating visitor check-ins"""

    class Meta:
        model = VisitorCheckIn
        fields = [
            'hostel', 'room', 'visitor_id_number', 'visitor_name',
            'person_visited_name', 'notes'
        ]

    def validate(self, data):
        # Validate that room belongs to the hostel
        if data['room'].hostel != data['hostel']:
            raise serializers.ValidationError('Room does not belong to the specified hostel')
        return data


class RoomOccupantSerializer(serializers.ModelSerializer):
    """Serializer for room occupants"""

    class Meta:
        model = RoomOccupant
        fields = [
            'id', 'room', 'student', 'booking', 'move_in_date',
            'move_out_date', 'is_active', 'check_in_completed'
        ]
        read_only_fields = ['id']


class CompatibilityScoreSerializer(serializers.ModelSerializer):
    """Serializer for compatibility scores"""

    class Meta:
        model = CompatibilityScore
        fields = [
            'id', 'student1', 'student2', 'room', 'score', 'factors',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']