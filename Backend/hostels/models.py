from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Hostel(models.Model):
    """Main hostel/accommodation property"""

    HOSTEL_TYPE_CHOICES = [
        ('single_rooms', 'Single Rooms'),
        ('shared_rooms', 'Shared Rooms'),
        ('mixed', 'Mixed'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('under_maintenance', 'Under Maintenance'),
    ]

    landlord = models.ForeignKey(
        'accounts.LandlordProfile',
        on_delete=models.CASCADE,
        related_name='hostels'
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    address = models.TextField()
    city = models.CharField(max_length=100, default='Nairobi')
    university = models.CharField(max_length=255, blank=True, null=True)
    distance_from_university = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    
    GENDER_POLICY_CHOICES = [
        ('male_only', 'Male Only'),
        ('female_only', 'Female Only'),
        ('mixed', 'Mixed'),
    ]
    gender_policy = models.CharField(max_length=20, choices=GENDER_POLICY_CHOICES, default='mixed')
    
    hostel_type = models.CharField(max_length=20, choices=HOSTEL_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    total_rooms = models.IntegerField(default=0)
    available_rooms = models.IntegerField(default=0)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.0'))
    review_count = models.IntegerField(default=0)
    
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='verified_hostels'
    )
    images = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels_hostel'
        indexes = [
            models.Index(fields=['landlord'], name='idx_hostel_landlord'),
            models.Index(fields=['status'], name='idx_hostel_status'),
            models.Index(fields=['is_verified'], name='idx_hostel_verified'),
        ]

    def __str__(self):
        return self.name


class Room(models.Model):
    """Individual room within a hostel"""

    ROOM_TYPE_CHOICES = [
        ('single', 'Single Room'),
        ('double', 'Double Room'),
        ('triple', 'Triple Room'),
        ('quad', 'Quad Room'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
        ('reserved', 'Reserved'),
    ]

    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    room_number = models.CharField(max_length=50)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    floor = models.IntegerField(blank=True, null=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    capacity = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    current_occupancy = models.IntegerField(default=0)
    amenities = models.JSONField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels_room'
        indexes = [
            models.Index(fields=['hostel'], name='idx_room_hostel'),
            models.Index(fields=['status'], name='idx_room_status'),
            models.Index(fields=['room_type'], name='idx_room_type'),
        ]
        unique_together = ['hostel', 'room_number']

    def __str__(self):
        return f"{self.hostel.name} - Room {self.room_number}"


class Booking(models.Model):
    """Room booking/reservation records"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]

    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    booking_reference = models.CharField(max_length=100, unique=True)
    check_in_date = models.DateField()
    check_out_date = models.DateField(blank=True, null=True)
    duration_months = models.IntegerField(default=12)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    auto_renewal = models.BooleanField(default=False)
    special_requests = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=200)
    emergency_contact_phone = models.CharField(max_length=15)
    emergency_contact_relationship = models.CharField(max_length=50)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels_booking'
        indexes = [
            models.Index(fields=['student'], name='idx_booking_student'),
            models.Index(fields=['room'], name='idx_booking_room'),
            models.Index(fields=['status'], name='idx_booking_status'),
            models.Index(fields=['check_in_date'], name='idx_booking_check_in'),
        ]

    def __str__(self):
        return f"Booking {self.booking_reference} - {self.student.user.get_full_name()}"


class RoomImage(models.Model):
    """Room photos and images"""

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField()
    caption = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_roomimage'
        indexes = [
            models.Index(fields=['room'], name='idx_room_image_room'),
            models.Index(fields=['is_primary'], name='idx_room_image_primary'),
        ]
        ordering = ['sort_order', 'uploaded_at']

    def __str__(self):
        return f"Image for {self.room}"


class Amenity(models.Model):
    """Available amenities that can be associated with hostels/rooms"""

    CATEGORY_CHOICES = [
        ('basic', 'Basic Amenities'),
        ('security', 'Security'),
        ('facilities', 'Facilities'),
        ('services', 'Services'),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    icon_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'hostels_amenity'

    def __str__(self):
        return self.name


class HostelAmenity(models.Model):
    """Many-to-many relationship between hostels and amenities"""

    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='hostel_amenities'
    )
    amenity = models.ForeignKey(
        Amenity,
        on_delete=models.CASCADE,
        related_name='hostel_amenities'
    )
    is_available = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'hostels_hostelamenity'
        unique_together = ['hostel', 'amenity']

    def __str__(self):
        return f"{self.hostel.name} - {self.amenity.name}"


class RoomTransfer(models.Model):
    """Track room transfers within the same hostel"""

    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='room_transfers'
    )
    from_room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='transfers_from'
    )
    to_room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='transfers_to'
    )
    requested_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='room_transfer_requests'
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_transfers'
    )
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    requested_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'hostels_roomtransfer'
        indexes = [
            models.Index(fields=['booking'], name='idx_transfer_booking'),
            models.Index(fields=['status'], name='idx_transfer_status'),
        ]

    def __str__(self):
        return f"Transfer request for {self.booking.student.user.get_full_name()}"


class DamageReport(models.Model):
    """Damage reports for rooms"""

    SEVERITY_CHOICES = [
        ('minor', 'Minor'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]

    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('investigating', 'Investigating'),
        ('repairing', 'Repairing'),
        ('resolved', 'Resolved'),
    ]

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='damage_reports'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='damage_reports'
    )
    reported_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='damage_reports'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    images = models.JSONField(blank=True, null=True)  # Array of image URLs
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    repair_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    reported_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'hostels_damagereport'
        indexes = [
            models.Index(fields=['booking'], name='idx_damage_booking'),
            models.Index(fields=['room'], name='idx_damage_room'),
            models.Index(fields=['status'], name='idx_damage_status'),
        ]

    def __str__(self):
        return f"Damage report: {self.title}"


class InventoryTemplate(models.Model):
    """Room inventory checklists for check-in/check-out"""

    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='inventory_templates'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    items = models.JSONField()  # Array of inventory items
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='inventory_templates'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels_inventorytemplate'
        indexes = [
            models.Index(fields=['hostel'], name='idx_inventory_hostel'),
        ]

    def __str__(self):
        return f"Inventory template: {self.name}"


class RoomReservation(models.Model):
    """Temporary room reservations"""

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='reservation'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    reservation_token = models.UUIDField(unique=True)
    expiry_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_roomreservation'
        indexes = [
            models.Index(fields=['reservation_token'], name='idx_reservation_token'),
            models.Index(fields=['expiry_time'], name='idx_reservation_expiry'),
        ]

    def __str__(self):
        return f"Reservation for {self.room} by {self.student.user.get_full_name()}"


class RoomOccupant(models.Model):
    """Current room occupants"""

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='occupants'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='room_occupancy'
    )
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='occupants'
    )
    move_in_date = models.DateField()
    move_out_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    check_in_completed = models.BooleanField(default=False)
    check_in_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_roomoccupant'
        indexes = [
            models.Index(fields=['room'], name='idx_occupant_room'),
            models.Index(fields=['student'], name='idx_occupant_student'),
            models.Index(fields=['is_active'], name='idx_occupant_active'),
        ]

    def __str__(self):
        return f"{self.student.user.get_full_name()} in {self.room}"


class CompatibilityScore(models.Model):
    """Compatibility scores between students for roommate matching"""

    student_a = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='compatibility_scores_a'
    )
    student_b = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='compatibility_scores_b'
    )
    score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    factors = models.JSONField()  # Detailed scoring factors
    calculated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_compatibilityscore'
        indexes = [
            models.Index(fields=['student_a', 'student_b'], name='idx_compatibility_pair'),
            models.Index(fields=['score'], name='idx_compatibility_score'),
        ]
        unique_together = ['student_a', 'student_b']

    def __str__(self):
        return f"Compatibility: {self.student_a.user.get_full_name()} & {self.student_b.user.get_full_name()} - {self.score}%"


class InventoryItem(models.Model):
    """Individual inventory items within templates"""

    template = models.ForeignKey(
        InventoryTemplate,
        on_delete=models.CASCADE,
        related_name='inventoryitem_set'
    )
    category = models.CharField(max_length=100, default='other')
    item_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    replacement_cost = models.DecimalField(max_digits=10, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_inventoryitem'
        indexes = [
            models.Index(fields=['template'], name='idx_inventory_item_template'),
            models.Index(fields=['category'], name='idx_inventory_item_category'),
        ]
        ordering = ['display_order', 'item_name']

    def __str__(self):
        return f"{self.item_name} ({self.quantity})"


class InventoryCheckIn(models.Model):
    """Student inventory check-in records"""

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='checkin'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='checkins'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='checkins'
    )
    template = models.ForeignKey(
        InventoryTemplate,
        on_delete=models.CASCADE,
        related_name='checkins'
    )
    checklist_data = models.JSONField()
    student_notes = models.TextField(blank=True, null=True)
    student_signature = models.URLField(blank=True, null=True)
    caretaker_notes = models.TextField(blank=True, null=True)
    caretaker_signature = models.URLField(blank=True, null=True)
    verified_by_caretaker = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='verified_checkins'
    )
    status = models.CharField(max_length=20, default='pending')
    student_submitted_at = models.DateTimeField(blank=True, null=True)
    caretaker_verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_inventorycheckin'
        indexes = [
            models.Index(fields=['booking'], name='idx_checkin_booking'),
            models.Index(fields=['status'], name='idx_checkin_status'),
        ]

    def __str__(self):
        return f"Check-in for {self.booking.student.user.get_full_name()}"


class InventoryCheckOut(models.Model):
    """Student inventory check-out records"""

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='checkout'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='checkouts'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='checkouts'
    )
    template = models.ForeignKey(
        InventoryTemplate,
        on_delete=models.CASCADE,
        related_name='checkouts'
    )
    checklist_data = models.JSONField()
    student_notes = models.TextField(blank=True, null=True)
    student_signature = models.URLField(blank=True, null=True)
    caretaker_notes = models.TextField(blank=True, null=True)
    caretaker_signature = models.URLField(blank=True, null=True)
    verified_by_caretaker = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='verified_checkouts'
    )
    status = models.CharField(max_length=20, default='pending')
    student_submitted_at = models.DateTimeField(blank=True, null=True)
    caretaker_verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_inventorycheckout'
        indexes = [
            models.Index(fields=['booking'], name='idx_checkout_booking'),
            models.Index(fields=['status'], name='idx_checkout_status'),
        ]

    def __str__(self):
        return f"Check-out for {self.booking.student.user.get_full_name()}"


class RoomInventory(models.Model):
    """Room inventory check records"""

    STATUS_CHOICES = [
        ('check_in', 'Check-in'),
        ('check_out', 'Check-out'),
    ]

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='inventory_checks'
    )
    template = models.ForeignKey(
        InventoryTemplate,
        on_delete=models.CASCADE,
        related_name='inventory_checks'
    )
    checked_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='inventory_checks'
    )
    check_type = models.CharField(max_length=20, choices=STATUS_CHOICES)
    items_status = models.JSONField()  # Status of each inventory item
    notes = models.TextField(blank=True, null=True)
    student_signature = models.URLField(blank=True, null=True)  # Signature image URL
    caretaker_signature = models.URLField(blank=True, null=True)  # Signature image URL
    checked_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'hostels_roominventory'
        indexes = [
            models.Index(fields=['booking'], name='idx_inventory_booking'),
            models.Index(fields=['check_type'], name='idx_inventory_type'),
        ]

    def __str__(self):
        return f"{self.check_type.title()} inventory for {self.booking.student.user.get_full_name()}"


class VisitorCheckIn(models.Model):
    """Visitor check-in/check-out records for hostels"""

    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='visitor_records'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='visitor_records'
    )
    visitor_id_number = models.CharField(max_length=50, help_text="Admission/ID number")
    visitor_name = models.CharField(max_length=255, help_text="Full name of visitor")
    check_in_time = models.DateTimeField(default=timezone.now)
    check_out_time = models.DateTimeField(blank=True, null=True)
    person_visited_name = models.CharField(max_length=255, help_text="Name of the person being visited")
    checked_in_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.CASCADE,
        related_name='checked_in_visitors'
    )
    checked_out_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='checked_out_visitors'
    )
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="True if visitor is still checked in")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels_visitorcheckin'
        indexes = [
            models.Index(fields=['hostel'], name='idx_visitor_hostel'),
            models.Index(fields=['room'], name='idx_visitor_room'),
            models.Index(fields=['check_in_time'], name='idx_visitor_checkin_time'),
            models.Index(fields=['check_out_time'], name='idx_visitor_checkout_time'),
            models.Index(fields=['is_active'], name='idx_visitor_active'),
        ]
        ordering = ['-check_in_time']

    @property
    def visit_duration(self):
        """Calculate visit duration in minutes"""
        if self.check_out_time and self.check_in_time:
            duration = self.check_out_time - self.check_in_time
            return int(duration.total_seconds() / 60)
        return None

    def __str__(self):
        return f"Visitor: {self.visitor_name} at {self.room} ({self.check_in_time.date()})"


class RoomRequest(models.Model):
    """Room requests submitted by students before booking"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('converted_to_booking', 'Converted to Booking'),
    ]

    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='room_requests'
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='room_requests'
    )
    preferred_room_type = models.CharField(
        max_length=20,
        choices=Room.ROOM_TYPE_CHOICES,
        help_text="Type of room student is requesting"
    )
    preferred_floor = models.IntegerField(blank=True, null=True)
    max_price_range = models.DecimalField(max_digits=10, decimal_places=2)
    move_in_date = models.DateField()
    duration_months = models.IntegerField(default=12)
    special_requirements = models.TextField(
        blank=True,
        null=True,
        help_text="Any special requirements or preferences"
    )
    roommate_preferences = models.JSONField(
        blank=True,
        null=True,
        help_text="Preferred roommate characteristics"
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    priority_level = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent')
        ],
        default='medium'
    )
    requested_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_room_requests'
    )
    rejection_reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'hostels_roomrequest'
        indexes = [
            models.Index(fields=['student'], name='idx_roomrequest_student'),
            models.Index(fields=['hostel'], name='idx_roomrequest_hostel'),
            models.Index(fields=['status'], name='idx_roomrequest_status'),
            models.Index(fields=['move_in_date'], name='idx_roomrequest_movein'),
            models.Index(fields=['priority_level'], name='idx_roomrequest_priority'),
        ]
        ordering = ['-priority_level', 'requested_at']

    def __str__(self):
        return f"Room request by {self.student.user.get_full_name()} - {self.hostel.name}"


class MaintenanceLog(models.Model):
    """Detailed maintenance activity logs for hostels and rooms"""

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('emergency', 'Emergency'),
    ]

    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    ]

    CATEGORY_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('hvac', 'HVAC/Climate Control'),
        ('security', 'Security/Locks'),
        ('cleaning', 'Cleaning'),
        ('appliances', 'Appliances'),
        ('furniture', 'Furniture'),
        ('pest_control', 'Pest Control'),
        ('landscaping', 'Landscaping'),
        ('other', 'Other'),
    ]

    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='maintenance_logs'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='maintenance_logs'
    )
    requested_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )
    assigned_to = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_maintenance'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Scheduling
    scheduled_date = models.DateTimeField(blank=True, null=True)
    estimated_duration_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True
    )
    actual_start_time = models.DateTimeField(blank=True, null=True)
    actual_end_time = models.DateTimeField(blank=True, null=True)
    
    # Costs and resources
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    materials_used = models.JSONField(blank=True, null=True)
    external_contractor = models.CharField(max_length=255, blank=True, null=True)
    
    # Documentation
    images = models.JSONField(blank=True, null=True, help_text="Array of image URLs")
    before_images = models.JSONField(blank=True, null=True)
    after_images = models.JSONField(blank=True, null=True)
    work_performed = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    
    # Recurring maintenance
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(
        max_length=20,
        choices=[
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly'),
            ('semi_annually', 'Semi-Annually'),
            ('annually', 'Annually'),
        ],
        blank=True,
        null=True
    )
    next_due_date = models.DateField(blank=True, null=True)
    
    # Student impact
    affects_students = models.BooleanField(default=False)
    students_notified = models.BooleanField(default=False)
    alternative_accommodation_provided = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'hostels_maintenancelog'
        indexes = [
            models.Index(fields=['hostel'], name='idx_maintenance_hostel'),
            models.Index(fields=['room'], name='idx_maintenance_room'),
            models.Index(fields=['status'], name='idx_maintenance_status'),
            models.Index(fields=['priority'], name='idx_maintenance_priority'),
            models.Index(fields=['category'], name='idx_maintenance_category'),
            models.Index(fields=['scheduled_date'], name='idx_maintenance_scheduled'),
            models.Index(fields=['is_recurring'], name='idx_maintenance_recurring'),
        ]
        ordering = ['-priority', 'scheduled_date', 'created_at']

    def __str__(self):
        location = f"{self.hostel.name}"
        if self.room:
            location += f" - Room {self.room.room_number}"
        return f"Maintenance: {self.title} at {location}"

    @property
    def duration_hours(self):
        """Calculate actual duration in hours"""
        if self.actual_start_time and self.actual_end_time:
            duration = self.actual_end_time - self.actual_start_time
            return round(duration.total_seconds() / 3600, 2)
        return None

    @property
    def is_overdue(self):
        """Check if maintenance is overdue"""
        if self.status in ['scheduled', 'in_progress'] and self.scheduled_date:
            return timezone.now() > self.scheduled_date
        return False


class IncidentReport(models.Model):
    """Security and incident reports for hostels"""

    INCIDENT_TYPE_CHOICES = [
        ('theft', 'Theft/Burglary'),
        ('vandalism', 'Vandalism'),
        ('assault', 'Assault/Physical Altercation'),
        ('harassment', 'Harassment'),
        ('drugs', 'Drug-Related'),
        ('alcohol', 'Alcohol-Related'),
        ('noise_complaint', 'Noise Complaint'),
        ('unauthorized_visitor', 'Unauthorized Visitor'),
        ('property_damage', 'Property Damage'),
        ('fire', 'Fire Hazard'),
        ('medical_emergency', 'Medical Emergency'),
        ('safety_violation', 'Safety Violation'),
        ('other', 'Other'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('escalated', 'Escalated'),
        ('closed', 'Closed'),
    ]

    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='incident_reports'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='incident_reports'
    )
    reported_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='reported_incidents'
    )
    incident_type = models.CharField(max_length=30, choices=INCIDENT_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    
    # Incident details
    title = models.CharField(max_length=255)
    description = models.TextField()
    location_details = models.TextField(blank=True, null=True)
    incident_date = models.DateTimeField()
    reported_date = models.DateTimeField(default=timezone.now)
    
    # People involved
    victims = models.JSONField(
        blank=True,
        null=True,
        help_text="Array of victim information"
    )
    suspects = models.JSONField(
        blank=True,
        null=True,
        help_text="Array of suspect information"
    )
    witnesses = models.JSONField(
        blank=True,
        null=True,
        help_text="Array of witness information"
    )
    
    # Actions taken
    immediate_action = models.TextField(blank=True, null=True)
    police_reported = models.BooleanField(default=False)
    police_report_number = models.CharField(max_length=50, blank=True, null=True)
    medical_attention_required = models.BooleanField(default=False)
    medical_attention_provided = models.BooleanField(default=False)
    
    # Investigation
    assigned_investigator = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_incidents'
    )
    investigation_notes = models.TextField(blank=True, null=True)
    evidence_collected = models.JSONField(blank=True, null=True)
    images = models.JSONField(blank=True, null=True)
    
    # Resolution
    resolution = models.TextField(blank=True, null=True)
    disciplinary_action = models.TextField(blank=True, null=True)
    preventive_measures = models.TextField(blank=True, null=True)
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(blank=True, null=True)
    
    # Financial impact
    estimated_damage_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    actual_repair_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    
    # Notifications
    landlord_notified = models.BooleanField(default=False)
    caretaker_notified = models.BooleanField(default=False)
    authorities_notified = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'hostels_incidentreport'
        indexes = [
            models.Index(fields=['hostel'], name='idx_incident_hostel'),
            models.Index(fields=['room'], name='idx_incident_room'),
            models.Index(fields=['incident_type'], name='idx_incident_type'),
            models.Index(fields=['severity'], name='idx_incident_severity'),
            models.Index(fields=['status'], name='idx_incident_status'),
            models.Index(fields=['incident_date'], name='idx_incident_date'),
            models.Index(fields=['reported_by'], name='idx_incident_reported_by'),
        ]
        ordering = ['-severity', '-incident_date']

    def __str__(self):
        location = f"{self.hostel.name}"
        if self.room:
            location += f" - Room {self.room.room_number}"
        return f"{self.get_incident_type_display()}: {self.title} at {location}"

    @property
    def time_to_report(self):
        """Calculate time between incident and report in hours"""
        if self.incident_date and self.reported_date:
            duration = self.reported_date - self.incident_date
            return round(duration.total_seconds() / 3600, 2)
        return None

    @property
    def resolution_time(self):
        """Calculate time to resolve incident in hours"""
        if self.reported_date and self.resolved_at:
            duration = self.resolved_at - self.reported_date
            return round(duration.total_seconds() / 3600, 2)
        return None