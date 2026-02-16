from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid
from django.db.models import QuerySet


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self):
        super().delete()


class Hostel(SoftDeleteModel):
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
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
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
    verification_data = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Detailed verification attributes (e.g. {'id_verified': true, 'in_person_visit': true})"
    )
    contact_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="Landlord specific contact rules/availability"
    )
    rules = models.TextField(blank=True, null=True)
    
    # Wizard Data Fields
    caretaker_name = models.CharField(max_length=255, blank=True, null=True)
    caretaker_phone = models.CharField(max_length=50, blank=True, null=True)
    total_floors = models.IntegerField(default=1)
    
    safety_features = models.JSONField(default=list, blank=True, help_text="List of safety features IDs")
    
    # Payment & Terms
    payment_terms = models.TextField(blank=True, null=True)
    PAYMENT_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('semester', 'Per Semester'),
        ('annual', 'Annually'),
    ]
    payment_cycle = models.CharField(max_length=20, choices=PAYMENT_CYCLE_CHOICES, default='monthly')
    grace_period_days = models.IntegerField(default=5)
    late_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.00'))
    
    TENANT_TYPE_CHOICES = [
        ('students_only', 'Students Only'),
        ('anyone', 'Open to Anyone'),
    ]
    tenant_type = models.CharField(max_length=20, choices=TENANT_TYPE_CHOICES, default='students_only')
    
    minimum_stay = models.CharField(max_length=50, default='semester')
    mid_term_joins_allowed = models.BooleanField(default=True)

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


class Room(SoftDeleteModel):
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
        ('under_maintenance', 'Under Maintenance'),
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
    semester_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    deposit_required = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    capacity = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    current_occupancy = models.IntegerField(default=0)
    amenities = models.JSONField(blank=True, null=True)
    detailed_attributes = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True, null=True)
    images = models.JSONField(default=list, blank=True)
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
        ('checked_in', 'Checked In'),
        ('inspection_pending', 'Inspection Pending'),
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
    payment_status = models.CharField(max_length=20, default='pending')
    payment_plan = models.CharField(max_length=20, default='monthly')
    move_in_date = models.DateField(null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    auto_renewal = models.BooleanField(default=False)
    is_existing_resident = models.BooleanField(default=False)
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
        related_name='room_photos'
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


class LateEntryLog(models.Model):
    """Track late entries for students returning to hostels"""
    
    REASON_CHOICES = [
        ('library_study', 'Library Study'),
        ('class_extended', 'Extended Classes'),
        ('medical_visit', 'Medical Visit'),
        ('family_emergency', 'Family Emergency'),
        ('part_time_job', 'Part-time Job'),
        ('social_event', 'Social Event'),
        ('transport_delay', 'Transport Delay'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('warning_issued', 'Warning Issued'),
        ('violation_recorded', 'Violation Recorded'),
    ]
    
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='late_entries'
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='late_entries'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='late_entries'
    )
    
    entry_time = models.DateTimeField(help_text="Actual time student entered")
    expected_curfew = models.TimeField(help_text="Expected curfew time for the day")
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    reason_details = models.TextField(blank=True, null=True, help_text="Additional details about the reason")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_late_entries'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    review_notes = models.TextField(blank=True, null=True)
    
    # Violation tracking
    is_violation = models.BooleanField(default=False, help_text="Whether this constitutes a curfew violation")
    warning_issued = models.BooleanField(default=False)
    violation_count = models.IntegerField(default=0, help_text="Number of violations for this student")
    
    # Location tracking
    entry_location = models.CharField(
        max_length=100,
        default='main_gate',
        help_text="Where student entered (main_gate, side_door, etc.)"
    )
    
    witness_name = models.CharField(max_length=255, blank=True, null=True)
    witness_contact = models.CharField(max_length=15, blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hostels_lateentrylog'
        indexes = [
            models.Index(fields=['student'], name='idx_late_entry_student'),
            models.Index(fields=['hostel'], name='idx_late_entry_hostel'),
            models.Index(fields=['entry_time'], name='idx_late_entry_time'),
            models.Index(fields=['status'], name='idx_late_entry_status'),
            models.Index(fields=['is_violation'], name='idx_late_entry_violation'),
        ]
        ordering = ['-entry_time']
    
    @property
    def delay_minutes(self):
        """Calculate delay in minutes"""
        from datetime import datetime, time
        entry_datetime = datetime.combine(self.entry_time.date(), self.expected_curfew)
        if self.entry_time.time() > self.expected_curfew:
            delay = self.entry_time - entry_datetime
            return int(delay.total_seconds() / 60)
        return 0
    
    @property
    def is_repeated_violation(self):
        """Check if this is a repeated violation"""
        recent_violations = LateEntryLog.objects.filter(
            student=self.student,
            is_violation=True,
            entry_time__gte=timezone.now() - timezone.timedelta(days=30)
        ).count()
        return recent_violations > 1
    
    def __str__(self):
        return f"Late entry: {self.student.user.get_full_name()} at {self.entry_time}"


class VisitorInvitation(models.Model):
    """Pre-registered visitor invitations from students"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
    ]
    
    RELATIONSHIP_CHOICES = [
        ('family', 'Family Member'),
        ('friend', 'Friend'),
        ('classmate', 'Classmate'),
        ('boyfriend', 'Boyfriend'),
        ('girlfriend', 'Girlfriend'),
        ('relative', 'Relative'),
        ('professional', 'Professional Visit'),
        ('other', 'Other'),
    ]
    
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='visitor_invitations'
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='visitor_invitations'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='visitor_invitations'
    )
    
    # Visitor details
    visitor_name = models.CharField(max_length=255, help_text="Full name of visitor")
    visitor_phone = models.CharField(max_length=15, help_text="Visitor phone number")
    visitor_id_number = models.CharField(max_length=50, help_text="National ID or student ID")
    visitor_relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    visitor_photo = models.URLField(blank=True, null=True, help_text="URL to visitor photo")
    
    # Visit details
    purpose = models.CharField(max_length=255, help_text="Purpose of visit")
    expected_arrival = models.DateTimeField(help_text="Expected arrival time")
    expected_departure = models.DateTimeField(help_text="Expected departure time")
    special_instructions = models.TextField(blank=True, null=True, help_text="Special instructions for caretaker")
    
    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_visitors'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    caretaker_notes = models.TextField(blank=True, null=True)
    
    # Check-in/out tracking
    actual_check_in = models.DateTimeField(blank=True, null=True)
    actual_check_out = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='checked_in_visitors_invitation'
    )
    checked_out_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='checked_out_visitors_invitation'
    )
    
    # Security features
    requires_escort = models.BooleanField(default=False, help_text="Whether visitor needs escort")
    escorted_by = models.CharField(max_length=255, blank=True, null=True, help_text="Name of escort")
    security_alert = models.BooleanField(default=False, help_text="Security alert triggered")
    blacklist_check = models.BooleanField(default=False, help_text="Whether visitor was checked against blacklist")
    
    # Metadata
    invitation_token = models.UUIDField(default=uuid.uuid4, unique=True, help_text="Unique token for visitor check-in")
    max_visitors = models.IntegerField(default=1, help_text="Maximum number of visitors in group")
    current_visitor_count = models.IntegerField(default=1, help_text="Current number of visitors")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hostels_visitorinvitation'
        indexes = [
            models.Index(fields=['student'], name='idx_visitor_invitation_student'),
            models.Index(fields=['hostel'], name='idx_visitor_invitation_hostel'),
            models.Index(fields=['status'], name='idx_visitor_invitation_status'),
            models.Index(fields=['expected_arrival'], name='idx_visitor_invitation_arrival'),
            models.Index(fields=['invitation_token'], name='idx_visitor_invitation_token'),
        ]
        ordering = ['-expected_arrival']
    
    @property
    def is_expired(self):
        """Check if invitation has expired"""
        return timezone.now() > self.expected_arrival + timezone.timedelta(hours=2)
    
    @property
    def visit_duration_hours(self):
        """Calculate expected visit duration in hours"""
        if self.expected_arrival and self.expected_departure:
            duration = self.expected_departure - self.expected_arrival
            return round(duration.total_seconds() / 3600, 2)
        return None
    
    @property
    def can_check_in(self):
        """Check if visitor can check in"""
        now = timezone.now()
        return (
            self.status == 'approved' and
            not self.is_expired and
            now >= self.expected_arrival - timezone.timedelta(minutes=30) and
            now <= self.expected_arrival + timezone.timedelta(hours=2)
        )
    
    def approve(self, caretaker, notes=''):
        """Approve the invitation"""
        self.status = 'approved'
        self.approved_by = caretaker
        self.approved_at = timezone.now()
        self.caretaker_notes = notes
        self.save()
    
    def reject(self, caretaker, reason):
        """Reject the invitation"""
        self.status = 'rejected'
        self.approved_by = caretaker
        self.approved_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def check_in(self, caretaker):
        """Check in the visitor"""
        self.status = 'checked_in'
        self.actual_check_in = timezone.now()
        self.checked_in_by = caretaker
        self.save()
    
    def check_out(self, caretaker):
        """Check out the visitor"""
        self.status = 'checked_out'
        self.actual_check_out = timezone.now()
        self.checked_out_by = caretaker
        self.save()
    
    def __str__(self):
        return f"Visitor invitation: {self.visitor_name} for {self.student.user.get_full_name()}"


class Favorite(models.Model):
    """User's favorite hostels"""
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='favorite_hostels'
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hostels_favorite'
        unique_together = ['user', 'hostel']
        indexes = [
            models.Index(fields=['user', 'hostel'], name='idx_fav_user_hostel'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.hostel.name}"


class Waitlist(models.Model):
    """Waitlist for students interested in full hostels"""
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='waitlist_entries'
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='waitlist'
    )
    room_type_preference = models.CharField(
        max_length=20,
        choices=Room.ROOM_TYPE_CHOICES,
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('contacted', 'Contacted'),
            ('converted', 'Converted'),
            ('cancelled', 'Cancelled')
        ],
        default='active'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hostels_waitlist'
        unique_together = ['student', 'hostel']
        ordering = ['created_at']

    def __str__(self):
        return f"Waitlist: {self.student.user.email} for {self.hostel.name}"

# Import bed-related models from separate file
from .bed_models import Bed, BedOccupancy
