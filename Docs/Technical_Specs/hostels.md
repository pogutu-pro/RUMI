# HOSTELS APP - Technical Specification
**RUMI Platform v1.7**  
**App Name:** `hostels`  
**Purpose:** Hostel and room management, booking workflow, inventory tracking, room selection, occupancy management, and damage reporting

---

## 1. Overview and Scope

The `hostels` app is the core business logic engine of the RUMI platform. It handles:
- Hostel property listing and management (CRUD operations)
- Room inventory management with real-time availability tracking
- **v1.6 Booking Flow:** Room Selection → Temporary Reservation → Payment → Confirmation
- Time-sensitive room reservations (15-minute hold with 1 extension)
- Room occupancy tracking and roommate management
- Compatibility scoring between potential roommates
- Floor plan visualization and interactive room selection
- **v1.7 NEW:** Physical inventory management (check-in/check-out workflows)
- **v1.7 NEW:** Damage reporting and invoice generation
- **v1.7 NEW:** Room transfer process with full checkout approval
- **v1.7 NEW:** Caretaker inventory verification

### Design Philosophy
- **Time-Sensitive Operations:** Reservation system uses distributed locking (Redis) to prevent race conditions
- **Transactional Integrity:** All state changes wrapped in database transactions
- **Real-Time Updates:** Redis cache for instant availability checks
- **Denormalized Optimization:** `current_occupancy` field for fast reads (maintained via transactions)
- **Inventory Accountability:** Complete audit trail from check-in to check-out with damage tracking
- **Caretaker Empowerment:** On-site managers verify physical inventory condition

---

## 2. Data Models

### 2.1 Hostel
**Table:** `hostels_hostel`  
**Purpose:** Property listings managed by landlords

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Hostel identifier |
| landlord_id | INTEGER | FK → LandlordProfile, NOT NULL | Owner reference |
| name | VARCHAR(255) | NOT NULL | Hostel name |
| description | TEXT | NULL | Marketing description |
| address | TEXT | NOT NULL | Physical location |
| city | VARCHAR(100) | NOT NULL | City name |
| university | VARCHAR(255) | NOT NULL, INDEX | Target university |
| distance_from_university | NUMERIC(5,2) | NULL | Distance in KM |
| gender_policy | VARCHAR(20) | NOT NULL | Male-only/Female-only/Mixed |
| total_rooms | INTEGER | DEFAULT 0 | Room count (cached) |
| available_rooms | INTEGER | DEFAULT 0 | Currently bookable rooms (cached) |
| amenities | JSONB | NULL | Facility features |
| rules | TEXT | NULL | Hostel policies |
| images | JSONB | NULL | Array of image URLs |
| floor_plan_image | VARCHAR(255) | NULL | Floor plan URL |
| has_inventory_template | BOOLEAN | DEFAULT FALSE | Inventory template exists |
| is_active | BOOLEAN | DEFAULT TRUE | Listing visibility |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_hostel_landlord` on `landlord_id`
- `idx_hostel_university` on `university`
- `idx_hostel_gender` on `gender_policy`
- `idx_hostel_active` on `is_active`
- `idx_hostel_inventory` on `has_inventory_template`

**Constraints:**
- `CHECK (gender_policy IN ('male_only', 'female_only', 'mixed'))`
- `CHECK (total_rooms >= 0)`
- `CHECK (available_rooms >= 0)`
- `CHECK (available_rooms <= total_rooms)`
- `CHECK (distance_from_university >= 0)`

**JSONB Structure for `amenities`:**
```json
{
  "wifi": true,
  "parking": true,
  "security": "24/7 guard",
  "water_supply": "borehole + county",
  "electricity": "KPLC + backup generator",
  "laundry": true,
  "common_room": true,
  "study_area": true,
  "kitchen": "shared",
  "backup_power": true,
  "cctv": true,
  "cleaning_service": "weekly"
}
```

**Sample Record:**
```json
{
  "id": 5,
  "landlord_id": 10,
  "name": "University Heights",
  "description": "Modern hostel with excellent amenities near campus",
  "address": "123 College Road, Nairobi",
  "city": "Nairobi",
  "university": "University of Nairobi",
  "distance_from_university": 0.5,
  "gender_policy": "mixed",
  "total_rooms": 20,
  "available_rooms": 5,
  "amenities": {...},
  "has_inventory_template": true,
  "is_active": true
}
```

---

### 2.2 Room
**Table:** `hostels_room`  
**Purpose:** Individual room inventory (THE HOT TABLE - high read/write volume)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Room identifier |
| hostel_id | INTEGER | FK → Hostel, NOT NULL | Hostel reference |
| room_number | VARCHAR(20) | NOT NULL | Room identifier |
| floor | INTEGER | NULL | Floor number |
| capacity | INTEGER | CHECK (1-4), NOT NULL | Max occupants |
| current_occupancy | INTEGER | DEFAULT 0, CHECK (>=0) | Current occupants (DENORMALIZED) |
| base_price | NUMERIC(10,2) | NOT NULL | Monthly rent (KES) |
| semester_price | NUMERIC(10,2) | NULL | 3-month price (discounted) |
| deposit_required | NUMERIC(10,2) | NOT NULL | Security deposit |
| room_type | VARCHAR(50) | NOT NULL | Single/Double/Triple/Quad |
| is_available | BOOLEAN | DEFAULT TRUE | Bookable status |
| detailed_attributes | JSONB | NULL | Flexible room features |
| images | JSONB | NULL | Room photos |
| has_custom_inventory | BOOLEAN | DEFAULT FALSE | Room-specific inventory exists |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_room_hostel` on `hostel_id`
- `idx_room_available` PARTIAL on `(hostel_id, base_price) WHERE is_available = TRUE` ⚡ **CRITICAL**
- `idx_room_attributes_gin` GIN on `detailed_attributes` (JSONB queries)
- `idx_room_capacity_occupancy` on `(capacity, current_occupancy)`

**Constraints:**
- `UNIQUE (hostel_id, room_number)` → Prevent duplicate room numbers per hostel
- `CHECK (capacity BETWEEN 1 AND 4)`
- `CHECK (current_occupancy <= capacity)`
- `CHECK (current_occupancy >= 0)`
- `CHECK (base_price > 0)`
- `CHECK (deposit_required >= 0)`
- `CHECK (room_type IN ('single', 'double', 'triple', 'quad'))`

**JSONB Structure for `detailed_attributes`:**
```json
{
  "has_balcony": true,
  "bathroom": "private|shared",
  "window_view": "garden|street|courtyard",
  "bed_type": "single|double|bunk",
  "desk": true,
  "wardrobe": true,
  "air_conditioning": false,
  "fan": true,
  "socket_count": 4,
  "natural_light": "excellent|good|moderate|poor"
}
```

---

### 2.3 Booking
**Table:** `hostels_booking`  
**Purpose:** Long-term record of all booking transactions

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Booking identifier |
| booking_reference | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable ID |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Tenant reference |
| room_id | INTEGER | FK → Room, NOT NULL | Room reference |
| status | VARCHAR(20) | DEFAULT 'reserved' | Booking state |
| payment_status | VARCHAR(20) | DEFAULT 'pending' | Payment state |
| payment_plan | VARCHAR(20) | DEFAULT 'monthly' | Payment frequency |
| semester_booking | BOOLEAN | DEFAULT FALSE | 3-month prepay flag |
| total_amount | NUMERIC(10,2) | NOT NULL | Total to pay |
| amount_paid | NUMERIC(10,2) | DEFAULT 0.00 | Cumulative payments |
| balance_due | NUMERIC(10,2) | DEFAULT 0.00 | Remaining amount |
| deposit_paid | NUMERIC(10,2) | DEFAULT 0.00 | Security deposit paid |
| deposit_refunded | NUMERIC(10,2) | DEFAULT 0.00 | Deposit returned |
| move_in_date | DATE | NOT NULL | Intended start date |
| lease_end_date | DATE | NULL | Contract end date |
| actual_move_in_date | DATE | NULL | Actual check-in date |
| actual_move_out_date | DATE | NULL | Actual check-out date |
| auto_renewal | BOOLEAN | DEFAULT FALSE | Recurring payment opt-in |
| created_at | TIMESTAMP | DEFAULT NOW() | Reservation time |
| reserved_at | TIMESTAMP | NULL | Temp reservation time |
| confirmed_at | TIMESTAMP | NULL | Payment success time |
| cancelled_at | TIMESTAMP | NULL | Cancellation time |
| cancellation_reason | TEXT | NULL | Reason for cancellation |

**Indexes:**
- `idx_booking_student_status` on `(student_id, status)` ⚡ **CRITICAL**
- `idx_booking_room` on `room_id`
- `idx_booking_reference` UNIQUE on `booking_reference`
- `idx_booking_payment_status` on `payment_status`
- `idx_booking_move_in` on `move_in_date`
- `idx_booking_active` on `(room_id, status) WHERE status IN ('reserved', 'confirmed')`

**Constraints:**
- `CHECK (status IN ('reserved', 'confirmed', 'cancelled', 'expired', 'completed'))`
- `CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'refunded'))`
- `CHECK (payment_plan IN ('monthly', 'semester', 'installment'))`
- `CHECK (amount_paid <= total_amount)`
- `CHECK (balance_due >= 0)`
- `CHECK (deposit_paid >= 0)`
- `CHECK (deposit_refunded <= deposit_paid)`

**Status Flow:**
```
reserved → confirmed (payment success)
reserved → expired (15-min timeout)
reserved → cancelled (user action)
confirmed → completed (lease ended + checkout approved)
confirmed → cancelled (refund request)
```

---

### 2.4 RoomReservation
**Table:** `hostels_roomreservation`  
**Purpose:** Ephemeral, time-sensitive state for temporary room holds

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Reservation identifier |
| booking_id | INTEGER | FK → Booking, UNIQUE, NOT NULL | Associated booking |
| room_id | INTEGER | FK → Room, NOT NULL | Reserved room |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Reserver |
| reservation_token | UUID | UNIQUE, NOT NULL | Security token |
| expiry_time | TIMESTAMP | NOT NULL | 15-min deadline |
| extension_count | INTEGER | DEFAULT 0 | Times extended |
| is_active | BOOLEAN | DEFAULT TRUE | Active flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| expired_at | TIMESTAMP | NULL | Expiry time (if expired) |

**Indexes:**
- `idx_reservation_expiry` CONDITIONAL on `expiry_time WHERE is_active = TRUE` ⚡ **CRITICAL**
- `idx_reservation_booking` UNIQUE on `booking_id`
- `idx_reservation_token` UNIQUE on `reservation_token`

**Constraints:**
- `CHECK (extension_count <= 1)` → Max 1 extension (5 minutes)
- `CHECK (expiry_time > created_at)`

**Lifecycle:**
- **Created:** Student selects room (15-minute timer starts)
- **Extended:** Student requests extension (+5 minutes, max once)
- **Deactivated:** Payment success OR expiry timeout
- **Cleaned Up:** Celery task marks expired reservations

---

### 2.5 RoomOccupant
**Table:** `hostels_roomoccupant`  
**Purpose:** Current, permanent state of who lives in each room

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Occupant identifier |
| room_id | INTEGER | FK → Room, NOT NULL | Occupied room |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Current tenant |
| booking_id | INTEGER | FK → Booking, NOT NULL | Source booking |
| move_in_date | DATE | NOT NULL | Actual move-in |
| move_out_date | DATE | NULL | Lease end/termination |
| is_active | BOOLEAN | DEFAULT TRUE | Current occupancy flag |
| check_in_completed | BOOLEAN | DEFAULT FALSE | Inventory check-in done |
| check_out_completed | BOOLEAN | DEFAULT FALSE | Inventory check-out done |
| check_in_id | INTEGER | FK → InventoryCheckIn, NULL | Check-in record |
| check_out_id | INTEGER | FK → InventoryCheckOut, NULL | Check-out record |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_occupant_room` on `room_id`
- `idx_occupant_student` on `student_id`
- `idx_occupant_active` on `(room_id, is_active)`
- `idx_occupant_checkin` on `check_in_completed WHERE is_active = TRUE`

**Constraints:**
- `UNIQUE (room_id, student_id)` → Prevent duplicate assignments
- `CHECK (move_out_date IS NULL OR move_out_date >= move_in_date)`

---

### 2.6 CompatibilityScore
**Table:** `hostels_compatibilityscore`  
**Purpose:** Pre-calculated compatibility scores between potential roommates

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Score identifier |
| student_a_id | INTEGER | FK → StudentProfile, NOT NULL | First student |
| student_b_id | INTEGER | FK → StudentProfile, NOT NULL | Second student |
| score | INTEGER | CHECK (0-100), NOT NULL | Compatibility (0-100) |
| calculated_at | TIMESTAMP | DEFAULT NOW() | Calculation time |
| factors | JSONB | NULL | Score breakdown |

**Indexes:**
- `idx_compatibility_student_a` on `student_a_id`
- `idx_compatibility_student_b` on `student_b_id`
- `idx_compatibility_score` on `score`
- `idx_compatibility_pair` UNIQUE on `(student_a_id, student_b_id)`

**Constraints:**
- `UNIQUE (student_a_id, student_b_id)`
- `CHECK (score BETWEEN 0 AND 100)`
- `CHECK (student_a_id < student_b_id)` → Canonical ordering

---

### 2.7 InventoryTemplate (NEW in v1.7)
**Table:** `hostels_inventorytemplate`  
**Purpose:** Master inventory checklist for hostel (created by caretaker)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Template identifier |
| hostel_id | INTEGER | FK → Hostel, UNIQUE, NOT NULL | Hostel reference |
| created_by_id | INTEGER | FK → CaretakerProfile, NOT NULL | Caretaker who created |
| template_name | VARCHAR(200) | NOT NULL | Template description |
| is_active | BOOLEAN | DEFAULT TRUE | Current template flag |
| version | INTEGER | DEFAULT 1 | Template version number |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_inventory_template_hostel` UNIQUE on `hostel_id WHERE is_active = TRUE`
- `idx_inventory_template_caretaker` on `created_by_id`

**Constraints:**
- `UNIQUE (hostel_id, version)`
- `CHECK (version > 0)`

**Business Rules:**
1. **One Active Template Per Hostel:** Only one template can be active at a time
2. **Versioning:** When template is updated, old version is deactivated and new version created
3. **Caretaker Ownership:** Only caretaker assigned to hostel can create/update template

**Sample Record:**
```json
{
  "id": 1,
  "hostel_id": 5,
  "created_by_id": 25,
  "template_name": "University Heights Standard Room Inventory",
  "is_active": true,
  "version": 1,
  "created_at": "2025-09-01T10:00:00Z"
}
```

---

### 2.8 InventoryItem (NEW in v1.7)
**Table:** `hostels_inventoryitem`  
**Purpose:** Individual items in inventory template

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Item identifier |
| template_id | INTEGER | FK → InventoryTemplate, NOT NULL | Template reference |
| category | VARCHAR(50) | NOT NULL | Item category |
| item_name | VARCHAR(200) | NOT NULL | Item description |
| quantity | INTEGER | DEFAULT 1 | Expected quantity |
| replacement_cost | NUMERIC(10,2) | NOT NULL | Cost if damaged/missing |
| is_mandatory | BOOLEAN | DEFAULT TRUE | Must be present |
| display_order | INTEGER | DEFAULT 0 | Sort order in checklist |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `idx_inventory_item_template` on `template_id`
- `idx_inventory_item_category` on `category`
- `idx_inventory_item_order` on `(template_id, display_order)`

**Constraints:**
- `CHECK (quantity > 0)`
- `CHECK (replacement_cost >= 0)`
- `CHECK (category IN ('entrance', 'kitchenette', 'bathroom', 'main_room', 'fixtures', 'other'))`

**Sample Items (Based on Maisha Hostels Inventory):**
```json
[
  {
    "category": "entrance",
    "item_name": "Card operated lock",
    "quantity": 1,
    "replacement_cost": 3000.00,
    "is_mandatory": true
  },
  {
    "category": "entrance",
    "item_name": "Key card",
    "quantity": 2,
    "replacement_cost": 500.00,
    "is_mandatory": true
  },
  {
    "category": "entrance",
    "item_name": "Silver door peep hole with cover",
    "quantity": 1,
    "replacement_cost": 800.00,
    "is_mandatory": true
  },
  {
    "category": "kitchenette",
    "item_name": "Sink with silver strainer",
    "quantity": 1,
    "replacement_cost": 5000.00,
    "is_mandatory": true
  },
  {
    "category": "bathroom",
    "item_name": "WC unit complete with seat cover",
    "quantity": 1,
    "replacement_cost": 8000.00,
    "is_mandatory": true
  },
  {
    "category": "bathroom",
    "item_name": "Ceramic soap dish",
    "quantity": 1,
    "replacement_cost": 500.00,
    "is_mandatory": false
  },
  {
    "category": "main_room",
    "item_name": "Wardrobe",
    "quantity": 2,
    "replacement_cost": 12000.00,
    "is_mandatory": true
  },
  {
    "category": "main_room",
    "item_name": "3x6 metallic bed",
    "quantity": 2,
    "replacement_cost": 8000.00,
    "is_mandatory": true
  }
]
```

---

### 2.9 RoomInventory (NEW in v1.7)
**Table:** `hostels_roominventory`  
**Purpose:** Room-specific inventory customizations (if room differs from template)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Room inventory ID |
| room_id | INTEGER | FK → Room, UNIQUE, NOT NULL | Room reference |
| template_id | INTEGER | FK → InventoryTemplate, NOT NULL | Base template |
| custom_items | JSONB | NULL | Additional/modified items |
| notes | TEXT | NULL | Special instructions |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_room_inventory_room` UNIQUE on `room_id`
- `idx_room_inventory_template` on `template_id`

**JSONB Structure for `custom_items`:**
```json
{
  "additions": [
    {
      "item_name": "Mini fridge",
      "quantity": 1,
      "replacement_cost": 15000.00
    }
  ],
  "removals": [
    "Ceramic soap dish"
  ],
  "quantity_overrides": {
    "Wardrobe": 3
  }
}
```

---

### 2.10 InventoryCheckIn (NEW in v1.7)
**Table:** `hostels_inventorycheckin`  
**Purpose:** Record inventory condition at student move-in

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Check-in identifier |
| booking_id | INTEGER | FK → Booking, UNIQUE, NOT NULL | Associated booking |
| room_id | INTEGER | FK → Room, NOT NULL | Room reference |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Tenant reference |
| template_id | INTEGER | FK → InventoryTemplate, NOT NULL | Inventory template used |
| checklist_data | JSONB | NOT NULL | Item-by-item verification |
| student_signature | VARCHAR(255) | NULL | Digital signature URL |
| caretaker_signature | VARCHAR(255) | NULL | Caretaker signature URL |
| verified_by_caretaker_id | INTEGER | FK → CaretakerProfile, NULL | Caretaker who verified |
| student_notes | TEXT | NULL | Student comments |
| caretaker_notes | TEXT | NULL | Caretaker observations |
| status | VARCHAR(20) | DEFAULT 'pending' | Verification status |
| student_submitted_at | TIMESTAMP | NULL | Student completion time |
| caretaker_verified_at | TIMESTAMP | NULL | Caretaker verification time |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes:**
- `idx_checkin_booking` UNIQUE on `booking_id`
- `idx_checkin_room` on `room_id`
- `idx_checkin_student` on `student_id`
- `idx_checkin_status` on `status`
- `idx_checkin_pending` on `created_at WHERE status = 'pending'`

**Constraints:**
- `CHECK (status IN ('pending', 'student_submitted', 'caretaker_verified', 'disputed'))`

**JSONB Structure for `checklist_data`:**
```json
{
  "items": [
    {
      "item_id": 1,
      "item_name": "Card operated lock",
      "expected_quantity": 1,
      "actual_quantity": 1,
      "condition": "good",
      "has_damage": false,
      "damage_description": null,
      "student_checked": true,
      "caretaker_checked": true
    },
    {
      "item_id": 5,
      "item_name": "Ceramic soap dish",
      "expected_quantity": 1,
      "actual_quantity": 1,
      "condition": "fair",
      "has_damage": true,
      "damage_description": "Small chip on corner",
      "student_checked": true,
      "caretaker_checked": true
    }
  ],
  "summary": {
    "total_items": 25,
    "items_present": 25,
    "items_missing": 0,
    "items_damaged": 1
  }
}
```

**Business Rules:**
1. **Student Submission:** Student reviews inventory and marks items as present/damaged
2. **Caretaker Verification:** Caretaker physically verifies student's submission
3. **Dispute Process:** If student disagrees with caretaker's assessment, status = 'disputed'
4. **Move-in Blocked:** Student cannot fully move in until check-in is `caretaker_verified`

---

### 2.11 InventoryCheckOut (NEW in v1.7)
**Table:** `hostels_inventorycheckout`  
**Purpose:** Record inventory condition at student move-out (24-hour window)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Check-out identifier |
| booking_id | INTEGER | FK → Booking, UNIQUE, NOT NULL | Associated booking |
| checkin_id | INTEGER | FK → InventoryCheckIn, NOT NULL | Original check-in |
| room_id | INTEGER | FK → Room, NOT NULL | Room reference |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Tenant reference |
| template_id | INTEGER | FK → InventoryTemplate, NOT NULL | Inventory template used |
| checklist_data | JSONB | NOT NULL | Item-by-item verification |
| student_signature | VARCHAR(255) | NULL | Digital signature URL |
| caretaker_signature | VARCHAR(255) | NULL | Caretaker signature URL |
| verified_by_caretaker_id | INTEGER | FK → CaretakerProfile, NULL | Caretaker who verified |
| student_notes | TEXT | NULL | Student comments |
| caretaker_notes | TEXT | NULL | Caretaker observations |
| damage_reports_created | INTEGER | DEFAULT 0 | Number of damage claims |
| status | VARCHAR(20) | DEFAULT 'pending' | Verification status |
| checkout_deadline | TIMESTAMP | NOT NULL | 24-hour deadline |
| student_submitted_at | TIMESTAMP | NULL | Student completion time |
| caretaker_verified_at | TIMESTAMP | NULL | Caretaker verification time |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes:**
- `idx_checkout_booking` UNIQUE on `booking_id`
- `idx_checkout_checkin` on `checkin_id`
- `idx_checkout_room` on `room_id`
- `idx_checkout_status` on `status`
- `idx_checkout_deadline` on `checkout_deadline WHERE status IN ('pending', 'student_submitted')`

**Constraints:**
- `CHECK (status IN ('pending', 'student_submitted', 'caretaker_verified', 'disputed', 'completed'))`
- `CHECK (checkout_deadline > created_at)`
- `CHECK (damage_reports_created >= 0)`

**JSONB Structure for `checklist_data`:**
```json
{
  "items": [
    {
      "item_id": 1,
      "item_name": "Card operated lock",
      "checkin_condition": "good",
      "checkout_condition": "good",
      "has_new_damage": false,
      "damage_description": null,
      "student_checked": true,
      "caretaker_checked": true
    },
    {
      "item_id": 10,
      "item_name": "Wardrobe",
      "checkin_condition": "good",
      "checkout_condition": "damaged",
      "has_new_damage": true,
      "damage_description": "Door hinge broken",
      "replacement_cost": 12000.00,
      "student_checked": true,
      "caretaker_checked": true,
      "damage_report_id": 15
    }
  ],
  "summary": {
    "total_items": 25,
    "items_returned": 24,
    "items_missing": 1,
    "items_newly_damaged": 1,
    "total_damage_cost": 12500.00
  }
}
```

**Business Rules:**
1. **24-Hour Window:** Check-out must be completed within 24 hours after `lease_end_date`
2. **Comparison:** System compares check-in condition vs check-out condition
3. **Auto-Damage Detection:** Items marked "good" at check-in but "damaged" at check-out trigger damage reports
4. **Deposit Refund:** Deposit refund calculated after all damage reports are resolved

---

### 2.12 DamageReport (NEW in v1.7)
**Table:** `hostels_damagereport`  
**Purpose:** Track damaged/missing items and associated charges

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Report identifier |
| checkout_id | INTEGER | FK → InventoryCheckOut, NOT NULL | Source check-out |
| booking_id | INTEGER | FK → Booking, NOT NULL | Associated booking |
| room_id | INTEGER | FK → Room, NOT NULL | Room reference |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Liable student |
| caretaker_id | INTEGER | FK → CaretakerProfile, NOT NULL | Reporter |
| item_id | INTEGER | FK → InventoryItem, NOT NULL | Damaged item |
| item_name | VARCHAR(200) | NOT NULL | Item description (cached) |
| damage_type | VARCHAR(50) | NOT NULL | Type of damage |
| damage_description | TEXT | NOT NULL | Detailed description |
| replacement_cost | NUMERIC(10,2) | NOT NULL | Cost to replace/repair |
| caretaker_assessed_cost | NUMERIC(10,2) | NULL | Caretaker's cost assessment |
| final_charge_amount | NUMERIC(10,2) | NULL | Approved charge amount |
| student_disputed | BOOLEAN | DEFAULT FALSE | Student contests charge |
| dispute_reason | TEXT | NULL | Student's dispute explanation |
| status | VARCHAR(20) | DEFAULT 'pending' | Report status |
| invoice_generated | BOOLEAN | DEFAULT FALSE | Invoice created |
| invoice_id | INTEGER | FK → Transaction, NULL | Damage charge transaction |
| created_at | TIMESTAMP | DEFAULT NOW() | Report creation |
| caretaker_approved_at | TIMESTAMP | NULL | Caretaker approval time |
| resolved_at | TIMESTAMP | NULL | Resolution time |
| resolved_by_id | INTEGER | FK → User (admin), NULL | Who resolved dispute |

**Indexes:**
- `idx_damage_checkout` on `checkout_id`
- `idx_damage_booking` on `booking_id`
- `idx_damage_student` on `student_id`
- `idx_damage_caretaker` on `caretaker_id`
- `idx_damage_status` on `status`
- `idx_damage_disputed` on `student_disputed WHERE student_disputed = TRUE`
- `idx_damage_pending_invoice` on `invoice_generated WHERE invoice_generated = FALSE AND status = 'approved'`

**Constraints:**
- `CHECK (damage_type IN ('missing', 'broken', 'stained', 'worn', 'other'))`
- `CHECK (status IN ('pending', 'caretaker_approved', 'disputed', 'approved', 'rejected', 'paid'))`
- `CHECK (replacement_cost > 0)`
- `CHECK (caretaker_assessed_cost IS NULL OR caretaker_assessed_cost >= 0)`
- `CHECK (final_charge_amount IS NULL OR final_charge_amount >= 0)`

**Status Flow:**
```
pending → caretaker_approved (caretaker reviews)
caretaker_approved → approved (auto OR admin review if disputed)
caretaker_approved → disputed (student contests)
disputed → approved (admin resolves in favor of caretaker)
disputed → rejected (admin resolves in favor of student)
approved → paid (invoice paid by student)
```

**Sample Record:**
```json
{
  "id": 15,
  "checkout_id": 10,
  "booking_id": 789,
  "room_id": 101,
  "student_id": 456,
  "caretaker_id": 25,
  "item_id": 10,
  "item_name": "Wardrobe",
  "damage_type": "broken",
  "damage_description": "Door hinge broken, door won't close properly",
  "replacement_cost": 12000.00,
  "caretaker_assessed_cost": 3000.00,
  "final_charge_amount": 3000.00,
  "student_disputed": false,
  "status": "caretaker_approved",
  "invoice_generated": false,
  "created_at": "2025-11-05T14:30:00Z"
}
```

**Business Rules:**
1. **Caretaker Assessment:** Caretaker can adjust cost (e.g., repair vs replace)
2. **Auto-Approval:** If student doesn't dispute within 48 hours, status → `approved`
3. **Dispute Window:** Student has 48 hours to dispute charge
4. **Invoice Generation:** After `status = approved` AND `student_disputed = FALSE`, system auto-generates damage invoice
5. **Deposit Deduction:** Damage charges first deducted from security deposit, remainder billed separately

---

### 2.13 RoomTransfer (NEW in v1.7)
**Table:** `hostels_roomtransfer`  
**Purpose:** Track room transfer requests and approvals

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Transfer identifier |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Student requesting transfer |
| old_booking_id | INTEGER | FK → Booking, NOT NULL | Current booking |
| old_room_id | INTEGER | FK → Room, NOT NULL | Current room |
| new_room_id | INTEGER | FK → Room, NOT NULL | Desired room |
| transfer_reason | TEXT | NOT NULL | Why transferring |
| transfer_type | VARCHAR(20) | NOT NULL | Same hostel or different |
| checkout_id | INTEGER | FK → InventoryCheckOut, NULL | Old room checkout |
| checkout_approved | BOOLEAN | DEFAULT FALSE | Old room cleared |
| new_booking_id | INTEGER | FK → Booking, NULL | New room booking |
| status | VARCHAR(20) | DEFAULT 'pending' | Transfer status |
| requested_at | TIMESTAMP | DEFAULT NOW() | Request time |
| approved_at | TIMESTAMP | NULL | Approval time |
| completed_at | TIMESTAMP | NULL | Transfer completion time |
| rejected_at | TIMESTAMP | NULL | Rejection time |
| rejection_reason | TEXT | NULL | Why rejected |

**Indexes:**
- `idx_transfer_student` on `student_id`
- `idx_transfer_old_booking` on `old_booking_id`
- `idx_transfer_new_room` on `new_room_id`
- `idx_transfer_status` on `status`
- `idx_transfer_pending` on `requested_at WHERE status = 'pending'`

**Constraints:**
- `CHECK (transfer_type IN ('same_hostel', 'different_hostel'))`
- `CHECK (status IN ('pending', 'checkout_pending', 'checkout_approved', 'approved', 'rejected', 'completed'))`
- `CHECK (old_room_id != new_room_id)`

**Status Flow:**
```
pending → checkout_pending (transfer approved, awaiting old room checkout)
checkout_pending → checkout_approved (inventory verified)
checkout_approved → approved (new room available, payment confirmed)
approved → completed (student moved to new room)
pending → rejected (transfer denied)
```

**Business Rules:**
1. **Full Checkout Required:** Student must complete full inventory checkout of old room
2. **Deposit Transfer:** Security deposit transfers to new booking (no refund)
3. **Payment Adjustment:** If new room has different price, prorated adjustment calculated
4. **Same Hostel Priority:** Transfers within same hostel processed faster
5. **Caretaker Approval:** Caretaker must approve checkout before transfer proceeds

---

## 3. API Endpoints

### 3.1 Hostel Management (Landlord)

#### POST `/api/v1/hostels`
**Purpose:** Create new hostel listing
**Authentication:** Required (Landlord only)
**Authorization:** `is_verified = TRUE`

**Request Body:**
```json
{
  "name": "University Heights",
  "description": "Modern hostel near campus with excellent amenities",
  "address": "123 College Road, Nairobi",
  "city": "Nairobi",
  "university": "University of Nairobi",
  "distance_from_university": 0.5,
  "gender_policy": "mixed",
  "amenities": {
    "wifi": true,
    "parking": true,
    "security": "24/7 guard",
    "water_supply": "borehole + county",
    "electricity": "KPLC + backup generator"
  },
  "rules": "No smoking, No loud music after 10 PM",
  "images": ["https://spaces.digitalocean.com/rumi/hostels/hostel1.jpg"]
}
```

**Response (201):**
```json
{
  "hostel_id": 10,
  "name": "University Heights",
  "landlord_name": "Smith Properties Ltd",
  "total_rooms": 0,
  "is_active": true,
  "has_inventory_template": false,
  "created_at": "2025-11-05T10:00:00Z",
  "message": "Hostel created successfully. Next steps: Add rooms and create inventory template."
}
```

---

#### GET `/api/v1/hostels/{hostel_id}`
**Purpose:** Retrieve hostel details
**Authentication:** Optional

**Response (200):**
```json
{
  "hostel_id": 10,
  "name": "University Heights",
  "landlord": {
    "landlord_id": 5,
    "company_name": "Smith Properties Ltd",
    "phone": "+254722345678"
  },
  "description": "Modern hostel near campus",
  "address": "123 College Road, Nairobi",
  "university": "University of Nairobi",
  "distance_from_university": 0.5,
  "gender_policy": "mixed",
  "total_rooms": 20,
  "available_rooms": 5,
  "amenities": {...},
  "images": [...],
  "average_rating": 4.5,
  "review_count": 15,
  "has_inventory_template": true,
  "has_caretaker": true
}
```

---

### 3.2 Room Management (Landlord)

#### POST `/api/v1/hostels/{hostel_id}/rooms`
**Purpose:** Add room to hostel
**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "room_number": "A201",
  "floor": 2,
  "capacity": 2,
  "base_price": 5000.00,
  "semester_price": 14000.00,
  "deposit_required": 5000.00,
  "room_type": "double",
  "detailed_attributes": {
    "has_balcony": true,
    "bathroom": "private",
    "bed_type": "single"
  },
  "images": ["https://spaces.digitalocean.com/rumi/rooms/room1.jpg"]
}
```

**Response (201):**
```json
{
  "room_id": 101,
  "hostel_name": "University Heights",
  "room_number": "A201",
  "capacity": 2,
  "base_price": 5000.00,
  "is_available": true,
  "has_custom_inventory": false,
  "message": "Room added successfully"
}
```

---

### 3.3 Inventory Template Management (Caretaker)

#### POST `/api/v1/hostels/{hostel_id}/inventory-template`
**Purpose:** Create inventory template for hostel
**Authentication:** Required (Caretaker only)
**Authorization:** Caretaker must be assigned to this hostel

**Request Body:**
```json
{
  "template_name": "University Heights Standard Room Inventory",
  "items": [
    {
      "category": "entrance",
      "item_name": "Card operated lock",
      "quantity": 1,
      "replacement_cost": 3000.00,
      "is_mandatory": true
    },
    {
      "category": "entrance",
      "item_name": "Key card",
      "quantity": 2,
      "replacement_cost": 500.00,
      "is_mandatory": true
    }
  ]
}
```

**Response (201):**
```json
{
  "template_id": 1,
  "hostel_id": 5,
  "template_name": "University Heights Standard Room Inventory",
  "total_items": 25,
  "total_replacement_value": 125000.00,
  "version": 1,
  "created_at": "2025-09-01T10:00:00Z",
  "message": "Inventory template created successfully"
}
```

---

#### GET `/api/v1/hostels/{hostel_id}/inventory-template`
**Purpose:** Retrieve current inventory template
**Authentication:** Required

**Response (200):**
```json
{
  "template_id": 1,
  "template_name": "University Heights Standard Room Inventory",
  "version": 1,
  "total_items": 25,
  "total_replacement_value": 125000.00,
  "items_by_category": {
    "entrance": [...],
    "kitchenette": [...],
    "bathroom": [...],
    "main_room": [...]
  },
  "created_by": {
    "caretaker_name": "Peter Mwangi",
    "created_at": "2025-09-01T10:00:00Z"
  }
}
```

---

### 3.4 Check-in/Check-out Workflow

#### POST `/api/v1/bookings/{booking_id}/check-in/start`
**Purpose:** Initiate inventory check-in process
**Authentication:** Required (Student only)

**Response (201):**
```json
{
  "checkin_id": 50,
  "booking_id": 789,
  "room_number": "A201",
  "hostel_name": "University Heights",
  "template_id": 1,
  "total_items": 25,
  "status": "pending",
  "instructions": "Please review inventory checklist"
}
```

---

#### PUT `/api/v1/inventory/check-in/{checkin_id}/submit`
**Purpose:** Student submits completed inventory checklist
**Authentication:** Required (Student only)

**Request Body:**
```json
{
  "checklist_data": {
    "items": [
      {
        "item_id": 1,
        "actual_quantity": 1,
        "condition": "good",
        "has_damage": false,
        "student_checked": true
      }
    ]
  },
  "student_notes": "All items present",
  "student_signature": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "checkin_id": 50,
  "status": "student_submitted",
  "submitted_at": "2025-11-05T14:30:00Z",
  "message": "Inventory checklist submitted"
}
```

---

#### PUT `/api/v1/inventory/check-in/{checkin_id}/verify`
**Purpose:** Caretaker verifies student's inventory submission
**Authentication:** Required (Caretaker only)

**Response (200):**
```json
{
  "checkin_id": 50,
  "status": "caretaker_verified",
  "verified_at": "2025-11-05T15:00:00Z",
  "message": "Inventory check-in verified"
}
```

---

### 3.5 Room Search & Booking

#### GET `/api/v1/rooms/search`
**Purpose:** Search available rooms
**Authentication:** Required

**Query Parameters:**
- university: string
- min_price/max_price: number
- room_type: string
- amenities: array
- page, limit: pagination

**Response (200):**
```json
{
  "total_results": 45,
  "results": [
    {
      "room_id": 101,
      "hostel_name": "University Heights",
      "room_number": "A201",
      "capacity": 2,
      "base_price": 5000.00,
      "room_type": "double",
      "amenities": ["wifi", "parking"],
      "images": ["..."],
      "compatibility_score": 85
    }
  ]
}
```

---

#### POST `/api/v1/rooms/{room_id}/reserve`
**Purpose:** Create room reservation
**Authentication:** Required (Student only)

**Request Body:**
```json
{
  "move_in_date": "2025-12-01",
  "payment_plan": "monthly"
}
```

**Response (201):**
```json
{
  "reservation_id": 400,
  "room_id": 101,
  "expires_at": "2025-11-12T14:15:00Z",
  "reservation_token": "550e8400-e29b-41d4-a716-446655440401",
  "status": "reserved"
}
```

---

#### POST `/api/v1/rooms/{room_id}/book`
**Purpose:** Confirm booking with payment
**Authentication:** Required (Student only)
**Header:** X-Reservation-Token: {token}

**Response (201):**
```json
{
  "booking_id": 500,
  "booking_reference": "RUMI-BK-2025-001001",
  "status": "pending_payment",
  "payment_required": {
    "total_amount": 5050.00,
    "breakdown": {
      "rent": 5000.00,
      "service_fee": 50.00
    }
  }
}
```

---

## 4. Business Logic and Workflows

### 4.1 Room Reservation System

**Time-Sensitive Operations:**
```python
def reserve_room(room_id, student_id, duration_minutes=15):
    """
    Reserve room with automatic expiry
    """
    with transaction.atomic():
        # Check availability
        room = Room.objects.select_for_update().get(id=room_id)
        if not room.is_available:
            raise ValidationError("Room not available")

        # Create reservation
        reservation = RoomReservation.objects.create(
            room_id=room_id,
            student_id=student_id,
            expiry_time=timezone.now() + timedelta(minutes=duration_minutes),
            reservation_token=generate_token()
        )

        # Mark room temporarily unavailable
        room.current_occupancy += 1  # Temporary hold
        room.save()

        # Schedule cleanup task
        cleanup_reservation.apply_async(
            args=[reservation.id],
            countdown=duration_minutes * 60
        )

        return reservation
```

---

### 4.2 Compatibility Scoring

**Algorithm Implementation:**
```python
def calculate_compatibility_score(student_a, student_b):
    """
    Calculate roommate compatibility (0-100)
    """
    prefs_a = student_a.lifestyle_preferences
    prefs_b = student_b.lifestyle_preferences

    if not prefs_a or not prefs_b:
        return 50

    factors = {
        'sleep_schedule': 20,
        'cleanliness': 25,
        'noise_tolerance': 15,
        'smoking': 20,
        'social_level': 10,
        'pets': 10
    }

    total_score = 0
    detailed_factors = {}

    # Sleep schedule match (20 points)
    if prefs_a.get('sleep_schedule') == prefs_b.get('sleep_schedule'):
        detailed_factors['sleep_schedule_match'] = 20
        total_score += 20
    elif 'flexible' in [prefs_a.get('sleep_schedule'), prefs_b.get('sleep_schedule')]:
        detailed_factors['sleep_schedule_match'] = 10
        total_score += 10

    # Cleanliness compatibility (25 points)
    clean_diff = abs(prefs_a.get('cleanliness', 3) - prefs_b.get('cleanliness', 3))
    cleanliness_score = max(0, 25 - (clean_diff * 6))
    detailed_factors['cleanliness_match'] = cleanliness_score
    total_score += cleanliness_score

    # Continue for other factors...

    return {
        'score': total_score,
        'factors': detailed_factors,
        'recommendation': 'Excellent match' if total_score >= 80 else 'Good match' if total_score >= 60 else 'Compatible'
    }
```

---

### 4.3 Inventory Management Workflow

**Check-in Process:**
```python
def process_inventory_checkin(booking_id, student_id):
    """
    Handle student move-in inventory verification
    """
    # Get active template
    template = InventoryTemplate.objects.get(
        hostel_id=booking.room.hostel_id,
        is_active=True
    )

    # Create check-in record
    checkin = InventoryCheckIn.objects.create(
        booking_id=booking_id,
        room_id=booking.room_id,
        student_id=student_id,
        template_id=template.id,
        checklist_data=generate_checklist(template)
    )

    # Notify caretaker
    send_notification.delay(
        recipient_id=booking.room.hostel.caretaker.user_id,
        notification_type='checkin_ready',
        channel='in_app',
        context={'booking_id': booking_id}
    )

    return checkin
```

---

## 5. Security Implementation

### 5.1 Access Control

**Role-Based Permissions:**
```python
class RoomAccessPermissions:
    def has_room_access(self, user, room):
        """Check if user can access room operations"""
        if user.role == 'landlord':
            return room.hostel.landlord_id == user.landlord_profile.id
        elif user.role == 'caretaker':
            return room.hostel.caretaker_id == user.caretaker_profile.id
        elif user.role == 'student':
            return Booking.objects.filter(
                room_id=room.id,
                student_id=user.student_profile.id,
                status__in=['confirmed', 'active']
            ).exists()
        return False
```

---

### 5.2 Data Validation

**Business Rules Enforcement:**
```python
def validate_room_booking(room, student, move_in_date):
    """Validate booking constraints"""
    errors = []

    # Capacity check
    if room.current_occupancy >= room.capacity:
        errors.append("Room is at full capacity")

    # Gender policy
    if room.hostel.gender_policy != 'mixed':
        student_gender = 'male' if student.user.first_name.lower() in male_names else 'female'
        if room.hostel.gender_policy != student_gender:
            errors.append(f"Room is {room.hostel.gender_policy}-only")

    # Availability check
    if not room.is_available:
        errors.append("Room is not available for booking")

    # Move-in date validation
    if move_in_date < timezone.now().date():
        errors.append("Move-in date cannot be in the past")

    return errors
```

---

## 6. Performance Optimization

### 6.1 Database Indexing Strategy

**Critical Indexes for Performance:**
```sql
-- Room availability queries (HIGH TRAFFIC)
CREATE INDEX CONCURRENTLY idx_room_available_price
ON hostels_room (hostel_id, base_price)
WHERE is_available = true;

-- Booking status queries
CREATE INDEX CONCURRENTLY idx_booking_student_status
ON hostels_booking (student_id, status);

-- Reservation expiry cleanup
CREATE INDEX CONCURRENTLY idx_reservation_expiry_active
ON hostels_roomreservation (expiry_time)
WHERE is_active = true;

-- Compatibility score queries
CREATE INDEX CONCURRENTLY idx_compatibility_score
ON hostels_compatibilityscore (student_a_id, student_b_id, score DESC);
```

---

### 6.2 Caching Strategy

**Redis Cache Implementation:**
```python
def get_room_availability_cache(room_id):
    """Cache room availability for 5 minutes"""
    cache_key = f"room:availability:{room_id}"
    cached = cache.get(cache_key)

    if cached is None:
        room = Room.objects.select_related('hostel').get(id=room_id)
        cached = {
            'is_available': room.is_available,
            'current_occupancy': room.current_occupancy,
            'capacity': room.capacity,
            'cached_at': timezone.now()
        }
        cache.set(cache_key, cached, timeout=300)  # 5 minutes

    return cached

def invalidate_room_cache(room_id):
    """Clear room cache after changes"""
    cache.delete(f"room:availability:{room_id}")
    cache.delete(f"room:details:{room_id}")
```

---

## 7. Integration Points

### 7.1 With accounts App

**User Validation:**
```python
# In hostels/views.py
def create_booking(request, room_id):
    # Validate user profile completeness
    student = request.user.student_profile
    if not student.is_profile_complete:
        return Response({
            'error': 'Complete your profile before booking',
            'required_fields': ['university', 'student_id_number', 'emergency_contact']
        }, status=400)

    # Proceed with booking...
```

---

### 7.2 With payments App

**Payment Integration:**
```python
def confirm_booking_payment(booking_id, payment_data):
    """Handle payment confirmation from payments service"""

    booking = Booking.objects.get(id=booking_id)
    booking.status = 'confirmed'
    booking.confirmed_at = timezone.now()
    booking.save()

    # Update room occupancy
    room = booking.room
    room.current_occupancy += 1
    room.save()

    # Start check-in process
    process_inventory_checkin.delay(booking_id, booking.student_id)
```

---

### 7.3 With notifications App

**Automated Communications:**
```python
def send_booking_notifications(booking):
    """Send booking-related notifications"""

    # Email to student
    send_notification.delay(
        recipient_id=booking.student_id,
        notification_type='booking_confirmed',
        channel='email',
        context={
            'student_name': booking.student.user.first_name,
            'hostel_name': booking.room.hostel.name,
            'room_number': booking.room.room_number,
            'move_in_date': booking.move_in_date.strftime('%B %d, %Y')
        }
    )

    # In-app notification
    send_notification.delay(
        recipient_id=booking.student_id,
        notification_type='booking_confirmed',
        channel='in_app',
        context={'booking_id': booking.id}
    )
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

**Critical Business Logic Tests:**
```python
class RoomReservationTests(TestCase):
    def test_room_reservation_expiry(self):
        """Test reservation auto-expiry"""
        reservation = create_test_reservation(expires_in_minutes=1)

        # Wait for expiry
        time.sleep(65)

        # Run cleanup
        cleanup_expired_reservations()

        # Verify expiry
        reservation.refresh_from_database()
        self.assertFalse(reservation.is_active)
        self.assertIsNotNone(reservation.expired_at)

    def test_room_capacity_enforcement(self):
        """Test room capacity limits"""
        room = create_test_room(capacity=2)

        # Fill room
        create_test_booking(room, student_id=1)
        create_test_booking(room, student_id=2)

        # Attempt third booking
        with self.assertRaises(ValidationError):
            create_test_booking(room, student_id=3)
```

---

### 8.2 Integration Tests

**End-to-End Booking Flow:**
```python
class BookingIntegrationTests(APITestCase):
    def test_complete_booking_flow(self):
        """Test full booking to occupancy"""

        # 1. Search rooms
        response = self.client.get('/api/v1/rooms/search?university=UON')
        self.assertEqual(response.status_code, 200)
        room_id = response.data['results'][0]['room_id']

        # 2. Reserve room
        response = self.client.post(f'/api/v1/rooms/{room_id}/reserve', {
            'move_in_date': '2025-12-01'
        }, HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        self.assertEqual(response.status_code, 201)
        reservation_token = response.data['reservation_token']

        # 3. Create booking
        headers = {
            'HTTP_AUTHORIZATION': f'Bearer {self.student_token}',
            'HTTP_X_RESERVATION_TOKEN': reservation_token
        }
        response = self.client.post(f'/api/v1/rooms/{room_id}/book', {
            'move_in_date': '2025-12-01'
        }, **headers)
        self.assertEqual(response.status_code, 201)
        booking_id = response.data['booking_id']

        # 4. Simulate payment confirmation
        confirm_booking_payment(booking_id, mock_payment_data)

        # 5. Verify room occupancy updated
        room = Room.objects.get(id=room_id)
        self.assertEqual(room.current_occupancy, 1)
```

---

## 9. Migration Strategy

### 9.1 Database Migration

**Schema Evolution:**
```bash
# Create new hostels database
createdb rumi_hostels

# Generate migration scripts
python manage.py makemigrations hostels --empty
# Edit migration to include all hostels-related tables

# Run migrations
python manage.py migrate hostels --database=hostels
```

---

### 9.2 Data Migration

**Hostels Data Transfer:**
```python
def migrate_hostels_data():
    """Migrate hostels data to separate database"""

    # Source connection (main DB)
    source_conn = get_main_database_connection()

    # Target connection (hostels DB)
    target_conn = get_hostels_database_connection()

    # Migrate hostels
    migrate_table(source_conn, target_conn, 'hostels_hostel')
    migrate_table(source_conn, target_conn, 'hostels_room')
    migrate_table(source_conn, target_conn, 'hostels_booking')

    # Update foreign key references to point to new services
    update_foreign_keys(target_conn)
```

---

## 10. Celery Tasks

### 10.1 Reservation Cleanup

**Task Implementation:**
```python
@shared_task
def cleanup_expired_reservations():
    """Clean up expired room reservations"""

    expired_reservations = RoomReservation.objects.filter(
        is_active=True,
        expiry_time__lt=timezone.now()
    )

    for reservation in expired_reservations:
        with transaction.atomic():
            # Mark reservation as expired
            reservation.is_active = False
            reservation.expired_at = timezone.now()
            reservation.save()

            # Release room hold
            room = reservation.room
            if room.current_occupancy > 0:
                room.current_occupancy -= 1
                room.save()

    return f"Cleaned up {len(expired_reservations)} expired reservations"
```

---

### 10.2 Compatibility Score Updates

**Background Processing:**
```python
@shared_task
def update_compatibility_scores(student_id):
    """Recalculate compatibility scores after profile changes"""

    student = StudentProfile.objects.get(id=student_id)
    other_students = StudentProfile.objects.exclude(id=student_id)

    scores_created = 0
    for other in other_students:
        score = calculate_compatibility_score(student, other)

        CompatibilityScore.objects.update_or_create(
            student_a_id=min(student.id, other.id),
            student_b_id=max(student.id, other.id),
            defaults={
                'score': score['score'],
                'factors': score['factors'],
                'calculated_at': timezone.now()
            }
        )
        scores_created += 1

    return f"Updated {scores_created} compatibility scores"
```

---

## 11. API Response Examples

### 11.1 Success Responses

**Standard Format:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-11-12T14:00:00Z",
    "version": "v1"
  }
}
```

---

### 11.2 Error Responses

**Validation Errors:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid booking request",
    "details": {
      "move_in_date": ["Cannot be in the past"],
      "room_id": ["Room not available"]
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-11-12T14:00:00Z"
  }
}
```

---

## 12. Future Enhancements

### 12.1 Advanced Features

- **Smart Room Matching:** AI-powered roommate recommendations
- **Dynamic Pricing:** Demand-based price adjustments
- **Virtual Tours:** 360° room photography integration
- **Booking Analytics:** Occupancy prediction models
- **Automated Inventory:** RFID/item tracking integration

### 12.2 Integration Improvements

- **Calendar Integration:** Google Calendar booking sync
- **Messaging Apps:** WhatsApp booking confirmations
- **Payment Options:** Mobile money, crypto payments
- **Review System:** Verified tenant reviews and ratings

### 12.3 Operational Enhancements

- **Automated Pricing:** Dynamic rate optimization
- **Predictive Maintenance:** Inventory replacement alerts
- **Staff Scheduling:** Caretaker shift management
- **Performance Analytics:** Detailed operational metrics

---

## 13. Compliance and Security

### 13.1 Data Protection

**GDPR Compliance:**
- User data minimization in booking records
- Right to erasure for cancelled bookings
- Data portability for active bookings
- Consent management for data processing

### 13.2 Audit Requirements

**Booking Audit Trail:**
- Complete transaction history for 7 years
- Change tracking for room assignments
- Payment reconciliation logs
- Inventory condition documentation

---

## 14. Deployment Considerations

### 14.1 Environment Configuration

**Database Connections:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'rumi_hostels',
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
    }
}
```

---

### 14.2 Performance Monitoring

**Key Metrics:**
- Room search response times (< 500ms)
- Booking completion rate (> 90%)
- Inventory check-in completion time (< 24 hours)
- Room occupancy update latency (< 100ms)

---

## 15. Monitoring and Alerts

### 15.1 Critical Metrics

**Business KPIs:**
- Daily booking volume and conversion rates
- Room occupancy percentages by hostel
- Inventory damage claims and resolution times
- Customer satisfaction scores

**Technical Metrics:**
- Database query performance and slow query alerts
- Cache hit rates and memory usage
- Background job queue lengths
- API response times by endpoint

### 15.2 Alert Configuration

**Automated Alerts:**
```python
# Room availability drops below threshold
if room.available_rooms < 2:
    alert_landlord(room.hostel, "Low room availability")

# Booking payment pending too long
if booking.status == 'pending' and age > 900:  # 15 minutes
    alert_admin("Stale booking payment")

# Inventory check-in overdue
if checkin.status == 'pending' and age > 86400:  # 24 hours
    alert_caretaker(checkin, "Overdue check-in")
```

---

## 16. Documentation Links

### 16.1 API Documentation
- Swagger/OpenAPI: `/api/v1/hostels/docs/`
- Postman Collection: `docs/api/hostels.postman_collection.json`
- Integration Guide: `docs/integrations/hostels-api.md`

### 16.2 Related Documentation
- Accounts App: `docs/accounts.md`
- Payments App: `docs/payments.md`
- Notifications App: `docs/notifications.md`
- Migration Guide: `docs/migration/hostels-migration.md`

---

## 17. Summary

The **Hostels App v1.7** provides comprehensive hostel inventory management with advanced features:

**Core Features:**
- Complete hostel and room CRUD operations
- Time-sensitive room reservation system
- Real-time availability tracking
- Compatibility scoring for roommate matching
- Inventory management with check-in/check-out workflows
- Damage reporting and financial reconciliation
- Room transfer capabilities

**Enterprise Features:**
- Denormalized occupancy tracking for performance
- Distributed locking for race condition prevention
- Transactional integrity across complex workflows
- Comprehensive audit trails for compliance
- Scalable search and filtering capabilities

**Integration Points:**
- Seamless integration with accounts, payments, and notifications
- Event-driven architecture for real-time updates
- API-first design for microservices compatibility

**Next Steps:**
- Review and approve this specification
- Proceed to **Payments.md v1.6** implementation
- Begin migration to microservices architecture

---

**Document Owner:** Joseph Ogutu, CTO
**Last Updated:** November 12, 2025
**Version:** 1.7 (Complete - Inventory Management & Room Transfers)
**Status:** Ready for Implementation

---

### 2.14 RoomReview
**Table:** `hostels_roomreview`  
**Purpose:** Student reviews and ratings for rooms/hostels

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Review identifier |
| room_id | INTEGER | FK → Room, NOT NULL | Reviewed room |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Reviewer |
| booking_id | INTEGER | FK → Booking, NOT NULL | Source booking |
| rating | INTEGER | CHECK (1-5), NOT NULL | Overall star rating |
| review_text | TEXT | NULL | Written review |
| cleanliness_rating | INTEGER | CHECK (1-5) | Specific aspect |
| location_rating | INTEGER | CHECK (1-5) | Specific aspect |
| value_for_money_rating | INTEGER | CHECK (1-5) | Specific aspect |
| landlord_response | TEXT | NULL | Landlord reply |
| is_verified | BOOLEAN | DEFAULT FALSE | Admin approved |
| is_published | BOOLEAN | DEFAULT TRUE | Visibility |
| created_at | TIMESTAMP | DEFAULT NOW() | Review time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_review_room` on `room_id`
- `idx_review_student` on `student_id`
- `idx_review_rating` on `rating`
- `idx_review_published` on `is_published WHERE is_published = TRUE`

**Constraints:**
- `UNIQUE (room_id, student_id)` → One review per student per room
- `CHECK (rating BETWEEN 1 AND 5)`
- `CHECK (cleanliness_rating IS NULL OR cleanliness_rating BETWEEN 1 AND 5)`

---

## 3. API Endpoints

### 3.1 Hostel Management (Landlord)

#### POST `/api/v1/hostels`
**Purpose:** Create new hostel listing  
**Authentication:** Required (Landlord only)  
**Authorization:** `is_verified = TRUE`

**Request Body:**
```json
{
  "name": "University Heights",
  "description": "Modern hostel near campus with excellent amenities",
  "address": "123 College Road, Nairobi",
  "city": "Nairobi",
  "university": "University of Nairobi",
  "distance_from_university": 0.5,
  "gender_policy": "mixed",
  "amenities": {
    "wifi": true,
    "parking": true,
    "security": "24/7 guard",
    "water_supply": "borehole + county",
    "electricity": "KPLC + backup generator"
  },
  "rules": "No smoking, No loud music after 10 PM",
  "images": ["https://spaces.digitalocean.com/rumi/hostels/hostel1.jpg"]
}
```

**Response (201):**
```json
{
  "hostel_id": 10,
  "name": "University Heights",
  "landlord_name": "Smith Properties Ltd",
  "total_rooms": 0,
  "is_active": true,
  "has_inventory_template": false,
  "created_at": "2025-11-05T10:00:00Z",
  "message": "Hostel created successfully. Next steps: Add rooms and create inventory template."
}
```

---

#### GET `/api/v1/hostels/{hostel_id}`
**Purpose:** Retrieve hostel details  
**Authentication:** Optional

**Response (200):**
```json
{
  "hostel_id": 10,
  "name": "University Heights",
  "landlord": {
    "landlord_id": 5,
    "company_name": "Smith Properties Ltd",
    "phone": "+254722345678"
  },
  "description": "Modern hostel near campus",
  "address": "123 College Road, Nairobi",
  "university": "University of Nairobi",
  "distance_from_university": 0.5,
  "gender_policy": "mixed",
  "total_rooms": 20,
  "available_rooms": 5,
  "amenities": {...},
  "images": [...],
  "average_rating": 4.5,
  "review_count": 15,
  "has_inventory_template": true,
  "has_caretaker": true
}
```

---

### 3.2 Room Management (Landlord)

#### POST `/api/v1/hostels/{hostel_id}/rooms`
**Purpose:** Add room to hostel  
**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "room_number": "A201",
  "floor": 2,
  "capacity": 2,
  "base_price": 5000.00,
  "semester_price": 14000.00,
  "deposit_required": 5000.00,
  "room_type": "double",
  "detailed_attributes": {
    "has_balcony": true,
    "bathroom": "private",
    "bed_type": "single"
  },
  "images": ["https://spaces.digitalocean.com/rumi/rooms/room1.jpg"]
}
```

**Response (201):**
```json
{
  "room_id": 101,
  "hostel_name": "University Heights",
  "room_number": "A201",
  "capacity": 2,
  "base_price": 5000.00,
  "is_available": true,
  "has_custom_inventory": false,
  "message": "Room added successfully"
}
```

---

### 3.3 Inventory Template Management (Caretaker)

#### POST `/api/v1/hostels/{hostel_id}/inventory-template`
**Purpose:** Create inventory template for hostel  
**Authentication:** Required (Caretaker only)  
**Authorization:** Caretaker must be assigned to this hostel

**Request Body:**
```json
{
  "template_name": "University Heights Standard Room Inventory",
  "items": [
    {
      "category": "entrance",
      "item_name": "Card operated lock",
      "quantity": 1,
      "replacement_cost": 3000.00,
      "is_mandatory": true
    },
    {
      "category": "entrance",
      "item_name": "Key card",
      "quantity": 2,
      "replacement_cost": 500.00,
      "is_mandatory": true
    },
    {
      "category": "kitchenette",
      "item_name": "Sink with silver strainer",
      "quantity": 1,
      "replacement_cost": 5000.00,
      "is_mandatory": true
    },
    {
      "category": "bathroom",
      "item_name": "WC unit complete with seat cover",
      "quantity": 1,
      "replacement_cost": 8000.00,
      "is_mandatory": true
    },
    {
      "category": "main_room",
      "item_name": "Wardrobe",
      "quantity": 2,
      "replacement_cost": 12000.00,
      "is_mandatory": true
    },
    {
      "category": "main_room",
      "item_name": "3x6 metallic bed",
      "quantity": 2,
      "replacement_cost": 8000.00,
      "is_mandatory": true
    }
  ]
}
```

**Response (201):**
```json
{
  "template_id": 1,
  "hostel_id": 5,
  "template_name": "University Heights Standard Room Inventory",
  "total_items": 25,
  "total_replacement_value": 125000.00,
  "version": 1,
  "created_at": "2025-09-01T10:00:00Z",
  "message": "Inventory template created successfully. All rooms in this hostel will use this template."
}
```

**Backend Logic:**
```python
def create_inventory_template(hostel_id, caretaker_id, template_data):
    """
    Create inventory template (caretaker only)
    """
    # 1. Verify caretaker is assigned to this hostel
    caretaker = CaretakerProfile.objects.get(
        user_id=request.user.id,
        hostel_id=hostel_id,
        is_active=True
    )
    
    if not caretaker.permissions.get('can_create_inventory_templates'):
        raise PermissionDenied("You don't have permission to create inventory templates")
    
    # 2. Deactivate existing template (if any)
    InventoryTemplate.objects.filter(
        hostel_id=hostel_id,
        is_active=True
    ).update(is_active=False)
    
    # 3. Create new template
    with transaction.atomic():
        template = InventoryTemplate.objects.create(
            hostel_id=hostel_id,
            created_by_id=caretaker.id,
            template_name=template_data['template_name'],
            is_active=True,
            version=get_next_version(hostel_id)
        )
        
        # 4. Create inventory items
        items = []
        for item_data in template_data['items']:
            item = InventoryItem.objects.create(
                template_id=template.id,
                category=item_data['category'],
                item_name=item_data['item_name'],
                quantity=item_data['quantity'],
                replacement_cost=item_data['replacement_cost'],
                is_mandatory=item_data.get('is_mandatory', True),
                display_order=item_data.get('display_order', 0)
            )
            items.append(item)
        
        # 5. Update hostel flag
        hostel = Hostel.objects.get(id=hostel_id)
        hostel.has_inventory_template = True
        hostel.save()
        
        # 6. Notify landlord
        send_notification.delay(
            recipient_id=hostel.landlord.user_id,
            notification_type='inventory_template_created',
            channel='email',
            context={
                'hostel_name': hostel.name,
                'caretaker_name': caretaker.user.get_full_name(),
                'total_items': len(items)
            }
        )
    
    return template
```

---

#### GET `/api/v1/hostels/{hostel_id}/inventory-template`
**Purpose:** Retrieve current inventory template  
**Authentication:** Required

**Response (200):**
```json
{
  "template_id": 1,
  "template_name": "University Heights Standard Room Inventory",
  "version": 1,
  "total_items": 25,
  "total_replacement_value": 125000.00,
  "items_by_category": {
    "entrance": [
      {
        "item_id": 1,
        "item_name": "Card operated lock",
        "quantity": 1,
        "replacement_cost": 3000.00,
        "is_mandatory": true
      }
    ],
    "kitchenette": [...],
    "bathroom": [...],
    "main_room": [...]
  },
  "created_by": {
    "caretaker_name": "Peter Mwangi",
    "created_at": "2025-09-01T10:00:00Z"
  }
}
```

---

### 3.4 Inventory Check-In Workflow (Student + Caretaker)

#### POST `/api/v1/bookings/{booking_id}/check-in/start`
**Purpose:** Initiate inventory check-in process  
**Authentication:** Required (Student only)  
**Trigger:** Called after payment confirmation, before physical move-in

**Response (201):**
```json
{
  "checkin_id": 50,
  "booking_id": 789,
  "room_number": "A201",
  "hostel_name": "University Heights",
  "template_id": 1,
  "total_items": 25,
  "status": "pending",
  "instructions": "Please review the inventory checklist and mark the condition of each item. The caretaker will verify your submission.",
  "deadline": "2025-11-10T23:59:59Z"
}
```

**Backend Logic:**
```python
def start_inventory_checkin(booking_id, student_id):
    """
    Create inventory check-in record
    """
    booking = Booking.objects.get(id=booking_id, student_id=student_id)
    
    # 1. Verify booking is confirmed
    if booking.status != 'confirmed':
        raise ValidationError("Booking must be confirmed before check-in")
    
    # 2. Check if check-in already exists
    if InventoryCheckIn.objects.filter(booking_id=booking_id).exists():
        raise ValidationError("Check-in already started for this booking")
    
    # 3. Get hostel's inventory template
    template = InventoryTemplate.objects.get(
        hostel_id=booking.room.hostel_id,
        is_active=True
    )
    
    # 4. Load inventory items
    items = InventoryItem.objects.filter(
        template_id=template.id
    ).order_by('display_order')
    
    # 5. Initialize checklist data
    checklist_data = {
        'items': [
            {
                'item_id': item.id,
                'item_name': item.item_name,
                'expected_quantity': item.quantity,
                'actual_quantity': None,  # To be filled by student
                'condition': None,  # To be filled by student
                'has_damage': None,
                'damage_description': None,
                'student_checked': False,
                'caretaker_checked': False
            }
            for item in items
        ],
        'summary': {
            'total_items': len(items),
            'items_present': 0,
            'items_missing': 0,
            'items_damaged': 0
        }
    }
    
    # 6. Create check-in record
    checkin = InventoryCheckIn.objects.create(
        booking_id=booking_id,
        room_id=booking.room_id,
        student_id=student_id,
        template_id=template.id,
        checklist_data=checklist_data,
        status='pending'
    )
    
    return checkin
```

---

#### PUT `/api/v1/inventory/check-in/{checkin_id}/submit`
**Purpose:** Student submits completed inventory checklist  
**Authentication:** Required (Student only)

**Request Body:**
```json
{
  "checklist_data": {
    "items": [
      {
        "item_id": 1,
        "actual_quantity": 1,
        "condition": "good",
        "has_damage": false,
        "student_checked": true
      },
      {
        "item_id": 5,
        "actual_quantity": 1,
        "condition": "fair",
        "has_damage": true,
        "damage_description": "Small chip on corner",
        "student_checked": true
      }
    ]
  },
  "student_notes": "All items present. Soap dish has minor damage.",
  "student_signature": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "checkin_id": 50,
  "status": "student_submitted",
  "submitted_at": "2025-11-05T14:30:00Z",
  "message": "Inventory checklist submitted. Awaiting caretaker verification.",
  "next_step": "caretaker_verification"
}
```

---

#### PUT `/api/v1/inventory/check-in/{checkin_id}/verify`
**Purpose:** Caretaker verifies student's inventory submission  
**Authentication:** Required (Caretaker only)  
**Authorization:** Caretaker must be assigned to this hostel

**Request Body:**
```json
{
  "verification_updates": [
    {
      "item_id": 5,
      "caretaker_condition_override": "good",
      "caretaker_notes": "Chip was pre-existing, not new damage"
    }
  ],
  "caretaker_notes": "All items verified. Pre-existing damage noted.",
  "caretaker_signature": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "checkin_id": 50,
  "status": "caretaker_verified",
  "verified_at": "2025-11-05T15:00:00Z",
  "message": "Inventory check-in verified. Student can now move in.",
  "student_can_move_in": true
}
```

**Backend Logic:**
```python
def caretaker_verify_checkin(checkin_id, caretaker_id, verification_data):
    """
    Caretaker physically verifies inventory
    """
    checkin = InventoryCheckIn.objects.get(id=checkin_id)
    
    # 1. Verify caretaker permission
    caretaker = CaretakerProfile.objects.get(
        user_id=request.user.id,
        hostel_id=checkin.room.hostel_id,
        is_active=True
    )
    
    if not caretaker.permissions.get('can_verify_check_ins'):
        raise PermissionDenied("You don't have permission to verify check-ins")
    
    # 2. Apply caretaker's corrections
    checklist = checkin.checklist_data
    for update in verification_data.get('verification_updates', []):
        for item in checklist['items']:
            if item['item_id'] == update['item_id']:
                if 'caretaker_condition_override' in update:
                    item['condition'] = update['caretaker_condition_override']
                item['caretaker_checked'] = True
                if 'caretaker_notes' in update:
                    item['caretaker_notes'] = update['caretaker_notes']
    
    # 3. Update check-in record
    checkin.checklist_data = checklist
    checkin.caretaker_notes = verification_data.get('caretaker_notes')
    checkin.caretaker_signature = verification_data.get('caretaker_signature')
    checkin.verified_by_caretaker_id = caretaker.id
    checkin.status = 'caretaker_verified'
    checkin.caretaker_verified_at = timezone.now()
    checkin.save()
    
    # 4. Update occupant record
    occupant = RoomOccupant.objects.get(booking_id=checkin.booking_id)
    occupant.check_in_completed = True
    occupant.check_in_id = checkin.id
    occupant.save()
    
    # 5. Notify student
    send_notification.delay(
        recipient_id=checkin.student_id,
        notification_type='checkin_verified',
        channel='in_app',
        context={
            'room_number': checkin.room.room_number,
            'hostel_name': checkin.room.hostel.name
        }
    )
    
    return checkin
```

---

### 3.5 Inventory Check-Out Workflow (Student + Caretaker)

#### POST `/api/v1/bookings/{booking_id}/check-out/start`
**Purpose:** Initiate inventory check-out process  
**Authentication:** Required (Student only)  
**Trigger:** Called when lease ends or student wants to vacate

**Response (201):**
```json
{
  "checkout_id": 10,
  "booking_id": 789,
  "checkin_id": 50,
  "room_number": "A201",
  "hostel_name": "University Heights",
  "total_items": 25,
  "status": "pending",
  "checkout_deadline": "2025-12-01T23:59:59Z",
  "time_remaining_hours": 24,
  "instructions": "You have 24 hours to complete inventory check-out. Compare current condition with move-in condition.",
  "move_in_checklist": {
    "checkin_id": 50,
    "items": [...]
  }
}
```

**Business Rule:** Check-out must be initiated within 24 hours before `lease_end_date`

---

#### PUT `/api/v1/inventory/check-out/{checkout_id}/submit`
**Purpose:** Student submits completed checkout checklist  
**Authentication:** Required (Student only)

**Request Body:**
```json
{
  "checklist_data": {
    "items": [
      {
        "item_id": 1,
        "checkout_condition": "good",
        "has_new_damage": false,
        "student_checked": true
      },
      {
        "item_id": 10,
        "checkout_condition": "damaged",
        "has_new_damage": true,
        "damage_description": "Door hinge broken",
        "student_accepts_charge": false,
        "student_checked": true
      }
    ]
  },
  "student_notes": "Wardrobe damage was not caused by me",
  "student_signature": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "checkout_id": 10,
  "status": "student_submitted",
  "submitted_at": "2025-11-30T10:00:00Z",
  "potential_charges": [
    {
      "item_name": "Wardrobe",
      "damage_type": "broken",
      "estimated_cost": 12000.00,
      "student_disputed": true
    }
  ],
  "total_estimated_charges": 12000.00,
  "message": "Check-out submitted. Caretaker will verify within 24 hours.",
  "dispute_window": "48 hours from caretaker verification"
}
```

---

#### PUT `/api/v1/inventory/check-out/{checkout_id}/verify`
**Purpose:** Caretaker verifies checkout and creates damage reports  
**Authentication:** Required (Caretaker only)

**Request Body:**
```json
{
  "verification_updates": [
    {
      "item_id": 10,
      "caretaker_confirmed_damage": true,
      "damage_type": "broken",
      "damage_description": "Wardrobe door hinge completely broken off",
      "caretaker_assessed_cost": 3000.00,
      "assessment_notes": "Can repair hinge instead of full replacement"
    }
  ],
  "caretaker_notes": "Confirmed damage to wardrobe. Student disputes charge.",
  "caretaker_signature": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "checkout_id": 10,
  "status": "caretaker_verified",
  "verified_at": "2025-11-30T14:00:00Z",
  "damage_reports_created": 1,
  "damage_reports": [
    {
      "damage_report_id": 15,
      "item_name": "Wardrobe",
      "damage_type": "broken",
      "caretaker_assessed_cost": 3000.00,
      "status": "pending",
      "student_disputed": true
    }
  ],
  "total_damage_charges": 3000.00,
  "deposit_available": 5000.00,
  "deposit_deduction": 3000.00,
  "deposit_refund_amount": 2000.00,
  "message": "Check-out verified. Damage reports created. Student has 48 hours to dispute."
}
```

**Backend Logic:**
```python
def caretaker_verify_checkout(checkout_id, caretaker_id, verification_data):
    """
    Caretaker verifies checkout and creates damage reports
    """
    checkout = InventoryCheckOut.objects.get(id=checkout_id)
    
    # 1. Verify caretaker permission
    caretaker = CaretakerProfile.objects.get(
        user_id=request.user.id,
        hostel_id=checkout.room.hostel_id,
        is_active=True
    )
    
    if not caretaker.permissions.get('can_verify_check_outs'):
        raise PermissionDenied("You don't have permission to verify check-outs")
    
    # 2. Process each verified damage
    damage_reports = []
    for update in verification_data.get('verification_updates', []):
        if update.get('caretaker_confirmed_damage'):
            # Create damage report
            item = InventoryItem.objects.get(id=update['item_id'])
            
            damage_report = DamageReport.objects.create(
                checkout_id=checkout.id,
                booking_id=checkout.booking_id,
                room_id=checkout.room_id,
                student_id=checkout.student_id,
                caretaker_id=caretaker.id,
                item_id=item.id,
                item_name=item.item_name,
                damage_type=update['damage_type'],
                damage_description=update['damage_description'],
                replacement_cost=item.replacement_cost,
                caretaker_assessed_cost=update.get('caretaker_assessed_cost', item.replacement_cost),
                student_disputed=checkout.checklist_data['items'][item.id].get('student_accepts_charge') == False,
                status='pending'
            )
            damage_reports.append(damage_report)
    
    # 3. Update checkout record
    checkout.verified_by_caretaker_id = caretaker.id
    checkout.caretaker_notes = verification_data.get('caretaker_notes')
    checkout.caretaker_signature = verification_data.get('caretaker_signature')
    checkout.damage_reports_created = len(damage_reports)
    checkout.status = 'caretaker_verified'
    checkout.caretaker_verified_at = timezone.now()
    checkout.save()
    
    # 4. Update occupant record
    occupant = RoomOccupant.objects.get(booking_id=checkout.booking_id)
    occupant.check_out_completed = True
    occupant.check_out_id = checkout.id
    occupant.move_out_date = timezone.now().date()
    occupant.save()
    
    # 5. Notify student about verification
    send_notification.delay(
        recipient_id=checkout.student_id,
        notification_type='checkout_verified',
        channel='in_app',
        context={
            'room_number': checkout.room.room_number,
            'hostel_name': checkout.room.hostel.name,
            'damage_reports_count': len(damage_reports),
            'total_charges': sum(dr.caretaker_assessed_cost for dr in damage_reports)
        }
    )
    
    return checkout
    ```
    
    ---
    
    ### 3.6 Room Search & Booking
    
    #### GET `/api/v1/rooms/search`
    **Purpose:** Search available rooms
    **Authentication:** Required
    
    **Query Parameters:**
    - university: string
    - min_price/max_price: number
    - room_type: string
    - amenities: array
    - page, limit: pagination
    
    **Response (200):**
    ```json
    {
      "total_results": 45,
      "results": [
        {
          "room_id": 101,
          "hostel_name": "University Heights",
          "room_number": "A201",
          "capacity": 2,
          "base_price": 5000.00,
          "room_type": "double",
          "amenities": ["wifi", "parking"],
          "images": ["..."],
          "compatibility_score": 85
        }
      ]
    }
    ```
    
    ---
    
    #### POST `/api/v1/rooms/{room_id}/reserve`
    **Purpose:** Create room reservation
    **Authentication:** Required (Student only)
    
    **Request Body:**
    ```json
    {
      "move_in_date": "2025-12-01",
      "payment_plan": "monthly"
    }
    ```
    
    **Response (201):**
    ```json
    {
      "reservation_id": 400,
      "room_id": 101,
      "expires_at": "2025-11-12T14:15:00Z",
      "reservation_token": "550e8400-e29b-41d4-a716-446655440401",
      "status": "reserved"
    }
    ```
    
    ---
    
    #### POST `/api/v1/rooms/{room_id}/book`
    **Purpose:** Confirm booking with payment
    **Authentication:** Required (Student only)
    **Header:** X-Reservation-Token: {token}
    
    **Response (201):**
    ```json
    {
      "booking_id": 500,
      "booking_reference": "RUMI-BK-2025-001001",
      "status": "pending_payment",
      "payment_required": {
        "total_amount": 5050.00,
        "breakdown": {
          "rent": 5000.00,
          "service_fee": 50.00
        }
      }
    }
    ```
    
    ---
    
    ## 4. Business Logic and Workflows
    
    ### 4.1 Room Reservation System
    
    **Time-Sensitive Operations:**
    ```python
    def reserve_room(room_id, student_id, duration_minutes=15):
        """
        Reserve room with automatic expiry
        """
        with transaction.atomic():
            # Check availability
            room = Room.objects.select_for_update().get(id=room_id)
            if not room.is_available:
                raise ValidationError("Room not available")
    
            # Create reservation
            reservation = RoomReservation.objects.create(
                room_id=room_id,
                student_id=student_id,
                expiry_time=timezone.now() + timedelta(minutes=duration_minutes),
                reservation_token=generate_token()
            )
    
            # Mark room temporarily unavailable
            room.current_occupancy += 1  # Temporary hold
            room.save()
    
            # Schedule cleanup task
            cleanup_reservation.apply_async(
                args=[reservation.id],
                countdown=duration_minutes * 60
            )
    
            return reservation
    ```
    
    ---
    
    ### 4.2 Compatibility Scoring
    
    **Algorithm Implementation:**
    ```python
    def calculate_compatibility_score(student_a, student_b):
        """
        Calculate roommate compatibility (0-100)
        """
        prefs_a = student_a.lifestyle_preferences
        prefs_b = student_b.lifestyle_preferences
    
        if not prefs_a or not prefs_b:
            return 50
    
        factors = {
            'sleep_schedule': 20,
            'cleanliness': 25,
            'noise_tolerance': 15,
            'smoking': 20,
            'social_level': 10,
            'pets': 10
        }
    
        total_score = 0
        detailed_factors = {}
    
        # Sleep schedule match (20 points)
        if prefs_a.get('sleep_schedule') == prefs_b.get('sleep_schedule'):
            detailed_factors['sleep_schedule_match'] = 20
            total_score += 20
        elif 'flexible' in [prefs_a.get('sleep_schedule'), prefs_b.get('sleep_schedule')]:
            detailed_factors['sleep_schedule_match'] = 10
            total_score += 10
    
        # Cleanliness compatibility (25 points)
        clean_diff = abs(prefs_a.get('cleanliness', 3) - prefs_b.get('cleanliness', 3))
        cleanliness_score = max(0, 25 - (clean_diff * 6))
        detailed_factors['cleanliness_match'] = cleanliness_score
        total_score += cleanliness_score
    
        # Continue for other factors...
    
        return {
            'score': total_score,
            'factors': detailed_factors,
            'recommendation': 'Excellent match' if total_score >= 80 else 'Good match' if total_score >= 60 else 'Compatible'
        }
    ```
    
    ---
    
    ### 4.3 Inventory Management Workflow
    
    **Check-in Process:**
    ```python
    def process_inventory_checkin(booking_id, student_id):
        """
        Handle student move-in inventory verification
        """
        # Get active template
        template = InventoryTemplate.objects.get(
            hostel_id=booking.room.hostel_id,
            is_active=True
        )
    
        # Create check-in record
        checkin = InventoryCheckIn.objects.create(
            booking_id=booking_id,
            room_id=booking.room_id,
            student_id=student_id,
            template_id=template.id,
            checklist_data=generate_checklist(template)
        )
    
        # Notify caretaker
        send_notification.delay(
            recipient_id=booking.room.hostel.caretaker.user_id,
            notification_type='checkin_ready',
            channel='in_app',
            context={'booking_id': booking_id}
        )
    
        return checkin
    ```
    
    ---
    
    ## 5. Security Implementation
    
    ### 5.1 Access Control
    
    **Role-Based Permissions:**
    ```python
    class RoomAccessPermissions:
        def has_room_access(self, user, room):
            """Check if user can access room operations"""
            if user.role == 'landlord':
                return room.hostel.landlord_id == user.landlord_profile.id
            elif user.role == 'caretaker':
                return room.hostel.caretaker_id == user.caretaker_profile.id
            elif user.role == 'student':
                return Booking.objects.filter(
                    room_id=room.id,
                    student_id=user.student_profile.id,
                    status__in=['confirmed', 'active']
                ).exists()
            return False
    ```
    
    ---
    
    ### 5.2 Data Validation
    
    **Business Rules Enforcement:**
    ```python
    def validate_room_booking(room, student, move_in_date):
        """Validate booking constraints"""
        errors = []
    
        # Capacity check
        if room.current_occupancy >= room.capacity:
            errors.append("Room is at full capacity")
    
        # Gender policy
        if room.hostel.gender_policy != 'mixed':
            student_gender = 'male' if student.user.first_name.lower() in male_names else 'female'
            if room.hostel.gender_policy != student_gender:
                errors.append(f"Room is {room.hostel.gender_policy}-only")
    
        # Availability check
        if not room.is_available:
            errors.append("Room is not available for booking")
    
        # Move-in date validation
        if move_in_date < timezone.now().date():
            errors.append("Move-in date cannot be in the past")
    
        return errors
    ```
    
    ---
    
    ## 6. Performance Optimization
    
    ### 6.1 Database Indexing Strategy
    
    **Critical Indexes for Performance:**
    ```sql
    -- Room availability queries (HIGH TRAFFIC)
    CREATE INDEX CONCURRENTLY idx_room_available_price
    ON hostels_room (hostel_id, base_price)
    WHERE is_available = true;
    
    -- Booking status queries
    CREATE INDEX CONCURRENTLY idx_booking_student_status
    ON hostels_booking (student_id, status);
    
    -- Reservation expiry cleanup
    CREATE INDEX CONCURRENTLY idx_reservation_expiry_active
    ON hostels_roomreservation (expiry_time)
    WHERE is_active = true;
    
    -- Compatibility score queries
    CREATE INDEX CONCURRENTLY idx_compatibility_score
    ON hostels_compatibilityscore (student_a_id, student_b_id, score DESC);
    ```
    
    ---
    
    ### 6.2 Caching Strategy
    
    **Redis Cache Implementation:**
    ```python
    def get_room_availability_cache(room_id):
        """Cache room availability for 5 minutes"""
        cache_key = f"room:availability:{room_id}"
        cached = cache.get(cache_key)
    
        if cached is None:
            room = Room.objects.select_related('hostel').get(id=room_id)
            cached = {
                'is_available': room.is_available,
                'current_occupancy': room.current_occupancy,
                'capacity': room.capacity,
                'cached_at': timezone.now()
            }
            cache.set(cache_key, cached, timeout=300)  # 5 minutes
    
        return cached
    
    def invalidate_room_cache(room_id):
        """Clear room cache after changes"""
        cache.delete(f"room:availability:{room_id}")
        cache.delete(f"room:details:{room_id}")
    ```
    
    ---
    
    ## 7. Integration Points
    
    ### 7.1 With accounts App
    
    **User Validation:**
    ```python
    # In hostels/views.py
    def create_booking(request, room_id):
        # Validate user profile completeness
        student = request.user.student_profile
        if not student.is_profile_complete:
            return Response({
                'error': 'Complete your profile before booking',
                'required_fields': ['university', 'student_id_number', 'emergency_contact']
            }, status=400)
    
        # Proceed with booking...
    ```
    
    ---
    
    ### 7.2 With payments App
    
    **Payment Integration:**
    ```python
    def confirm_booking_payment(booking_id, payment_data):
        """Handle payment confirmation from payments service"""
    
        booking = Booking.objects.get(id=booking_id)
        booking.status = 'confirmed'
        booking.confirmed_at = timezone.now()
        booking.save()
    
        # Update room occupancy
        room = booking.room
        room.current_occupancy += 1
        room.save()
    
        # Start check-in process
        process_inventory_checkin.delay(booking_id, booking.student_id)
    ```
    
    ---
    
    ### 7.3 With notifications App
    
    **Automated Communications:**
    ```python
    def send_booking_notifications(booking):
        """Send booking-related notifications"""
    
        # Email to student
        send_notification.delay(
            recipient_id=booking.student_id,
            notification_type='booking_confirmed',
            channel='email',
            context={
                'student_name': booking.student.user.first_name,
                'hostel_name': booking.room.hostel.name,
                'room_number': booking.room.room_number,
                'move_in_date': booking.move_in_date.strftime('%B %d, %Y')
            }
        )
    
        # In-app notification
        send_notification.delay(
            recipient_id=booking.student_id,
            notification_type='booking_confirmed',
            channel='in_app',
            context={'booking_id': booking.id}
        )
    ```
    
    ---
    
    ## 8. Testing Requirements
    
    ### 8.1 Unit Tests
    
    **Critical Business Logic Tests:**
    ```python
    class RoomReservationTests(TestCase):
        def test_room_reservation_expiry(self):
            """Test reservation auto-expiry"""
            reservation = create_test_reservation(expires_in_minutes=1)
    
            # Wait for expiry
            time.sleep(65)
    
            # Run cleanup
            cleanup_expired_reservations()
    
            # Verify expiry
            reservation.refresh_from_database()
            self.assertFalse(reservation.is_active)
            self.assertIsNotNone(reservation.expired_at)
    
        def test_room_capacity_enforcement(self):
            """Test room capacity limits"""
            room = create_test_room(capacity=2)
    
            # Fill room
            create_test_booking(room, student_id=1)
            create_test_booking(room, student_id=2)
    
            # Attempt third booking
            with self.assertRaises(ValidationError):
                create_test_booking(room, student_id=3)
    ```
    
    ---
    
    ### 8.2 Integration Tests
    
    **End-to-End Booking Flow:**
    ```python
    class BookingIntegrationTests(APITestCase):
        def test_complete_booking_flow(self):
            """Test full booking to occupancy"""
    
            # 1. Search rooms
            response = self.client.get('/api/v1/rooms/search?university=UON')
            self.assertEqual(response.status_code, 200)
            room_id = response.data['results'][0]['room_id']
    
            # 2. Reserve room
            response = self.client.post(f'/api/v1/rooms/{room_id}/reserve', {
                'move_in_date': '2025-12-01'
            }, HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
            self.assertEqual(response.status_code, 201)
            reservation_token = response.data['reservation_token']
    
            # 3. Create booking
            headers = {
                'HTTP_AUTHORIZATION': f'Bearer {self.student_token}',
                'HTTP_X_RESERVATION_TOKEN': reservation_token
            }
            response = self.client.post(f'/api/v1/rooms/{room_id}/book', {
                'move_in_date': '2025-12-01'
            }, **headers)
            self.assertEqual(response.status_code, 201)
            booking_id = response.data['booking_id']
    
            # 4. Simulate payment confirmation
            confirm_booking_payment(booking_id, mock_payment_data)
    
            # 5. Verify room occupancy updated
            room = Room.objects.get(id=room_id)
            self.assertEqual(room.current_occupancy, 1)
    ```
    
    ---
    
    ## 9. Migration Strategy
    
    ### 9.1 Database Migration
    
    **Schema Evolution:**
    ```bash
    # Create new hostels database
    createdb rumi_hostels
    
    # Generate migration scripts
    python manage.py makemigrations hostels --empty
    # Edit migration to include all hostels-related tables
    
    # Run migrations
    python manage.py migrate hostels --database=hostels
    ```
    
    ---
    
    ### 9.2 Data Migration
    
    **Hostels Data Transfer:**
    ```python
    def migrate_hostels_data():
        """Migrate hostels data to separate database"""
    
        # Source connection (main DB)
        source_conn = get_main_database_connection()
    
        # Target connection (hostels DB)
        target_conn = get_hostels_database_connection()
    
        # Migrate hostels
        migrate_table(source_conn, target_conn, 'hostels_hostel')
        migrate_table(source_conn, target_conn, 'hostels_room')
        migrate_table(source_conn, target_conn, 'hostels_booking')
    
        # Update foreign key references to point to new services
        update_foreign_keys(target_conn)
    ```
    
    ---
    
    ## 10. Celery Tasks
    
    ### 10.1 Reservation Cleanup
    
    **Task Implementation:**
    ```python
    @shared_task
    def cleanup_expired_reservations():
        """Clean up expired room reservations"""
    
        expired_reservations = RoomReservation.objects.filter(
            is_active=True,
            expiry_time__lt=timezone.now()
        )
    
        for reservation in expired_reservations:
            with transaction.atomic():
                # Mark reservation as expired
                reservation.is_active = False
                reservation.expired_at = timezone.now()
                reservation.save()
    
                # Release room hold
                room = reservation.room
                if room.current_occupancy > 0:
                    room.current_occupancy -= 1
                    room.save()
    
        return f"Cleaned up {len(expired_reservations)} expired reservations"
    ```
    
    ---
    
    ### 10.2 Compatibility Score Updates
    
    **Background Processing:**
    ```python
    @shared_task
    def update_compatibility_scores(student_id):
        """Recalculate compatibility scores after profile changes"""
    
        student = StudentProfile.objects.get(id=student_id)
        other_students = StudentProfile.objects.exclude(id=student_id)
    
        scores_created = 0
        for other in other_students:
            score = calculate_compatibility_score(student, other)
    
            CompatibilityScore.objects.update_or_create(
                student_a_id=min(student.id, other.id),
                student_b_id=max(student.id, other.id),
                defaults={
                    'score': score['score'],
                    'factors': score['factors'],
                    'calculated_at': timezone.now()
                }
            )
            scores_created += 1
    
        return f"Updated {scores_created} compatibility scores"
    ```
    
    ---
    
    ## 11. API Response Examples
    
    ### 11.1 Success Responses
    
    **Standard Format:**
    ```json
    {
      "success": true,
      "data": { ... },
      "meta": {
        "request_id": "req_abc123",
        "timestamp": "2025-11-12T14:00:00Z",
        "version": "v1"
      }
    }
    ```
    
    ---
    
    ### 11.2 Error Responses
    
    **Validation Errors:**
    ```json
    {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid booking request",
        "details": {
          "move_in_date": ["Cannot be in the past"],
          "room_id": ["Room not available"]
        }
      },
      "meta": {
        "request_id": "req_abc123",
        "timestamp": "2025-11-12T14:00:00Z"
      }
    }
    ```
    
    ---
    
    ## 12. Future Enhancements
    
    ### 12.1 Advanced Features
    
    - **Smart Room Matching:** AI-powered roommate recommendations
    - **Dynamic Pricing:** Demand-based price adjustments
    - **Virtual Tours:** 360° room photography integration
    - **Booking Analytics:** Occupancy prediction models
    - **Automated Inventory:** RFID/item tracking integration
    
    ### 12.2 Integration Improvements
    
    - **Calendar Integration:** Google Calendar booking sync
    - **Messaging Apps:** WhatsApp booking confirmations
    - **Payment Options:** Mobile money, crypto payments
    - **Review System:** Verified tenant reviews and ratings
    
    ### 12.3 Operational Enhancements
    
    - **Automated Pricing:** Dynamic rate optimization
    - **Predictive Maintenance:** Inventory replacement alerts
    - **Staff Scheduling:** Caretaker shift management
    - **Performance Analytics:** Detailed operational metrics
    
    ---
    
    ## 13. Compliance and Security
    
    ### 13.1 Data Protection
    
    **GDPR Compliance:**
    - User data minimization in booking records
    - Right to erasure for cancelled bookings
    - Data portability for active bookings
    - Consent management for data processing
    
    ### 13.2 Audit Requirements
    
    **Booking Audit Trail:**
    - Complete transaction history for 7 years
    - Change tracking for room assignments
    - Payment reconciliation logs
    - Inventory condition documentation
    
    ---
    
    ## 14. Deployment Considerations
    
    ### 14.1 Environment Configuration
    
    **Database Connections:**
    ```python
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'rumi_hostels',
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
        }
    }
    ```
    
    ---
    
    ### 14.2 Performance Monitoring
    
    **Key Metrics:**
    - Room search response times (< 500ms)
    - Booking completion rate (> 90%)
    - Inventory check-in completion time (< 24 hours)
    - Room occupancy update latency (< 100ms)
    
    ---
    
    ## 15. Monitoring and Alerts
    
    ### 15.1 Critical Metrics
    
    **Business KPIs:**
    - Daily booking volume and conversion rates
    - Room occupancy percentages by hostel
    - Inventory damage claims and resolution times
    - Customer satisfaction scores
    
    **Technical Metrics:**
    - Database query performance and slow query alerts
    - Cache hit rates and memory usage
    - Background job queue lengths
    - API response times by endpoint
    
    ### 15.2 Alert Configuration
    
    **Automated Alerts:**
    ```python
    # Room availability drops below threshold
    if room.available_rooms < 2:
        alert_landlord(room.hostel, "Low room availability")
    
    # Booking payment pending too long
    if booking.status == 'pending' and age > 900:  # 15 minutes
        alert_admin("Stale booking payment")
    
    # Inventory check-in overdue
    if checkin.status == 'pending' and age > 86400:  # 24 hours
        alert_caretaker(checkin, "Overdue check-in")
    ```
    
    ---
    
    ## 16. Documentation Links
    
    ### 16.1 API Documentation
    - Swagger/OpenAPI: `/api/v1/hostels/docs/`
    - Postman Collection: `docs/api/hostels.postman_collection.json`
    - Integration Guide: `docs/integrations/hostels-api.md`
    
    ### 16.2 Related Documentation
    - Accounts App: `docs/accounts.md`
    - Payments App: `docs/payments.md`
    - Notifications App: `docs/notifications.md`
    - Migration Guide: `docs/migration/hostels-migration.md`
    
    ---
    
    ## 17. Summary
    
    The **Hostels App v1.7** provides comprehensive hostel inventory management with advanced features:
    
    **Core Features:**
    - Complete hostel and room CRUD operations
    - Time-sensitive room reservation system
    - Real-time availability tracking
    - Compatibility scoring for roommate matching
    - Inventory management with check-in/check-out workflows
    - Damage reporting and financial reconciliation
    - Room transfer capabilities
    
    **Enterprise Features:**
    - Denormalized occupancy tracking for performance
    - Distributed locking for race condition prevention
    - Transactional integrity across complex workflows
    - Comprehensive audit trails for compliance
    - Scalable search and filtering capabilities
    
    **Integration Points:**
    - Seamless integration with accounts, payments, and notifications
    - Event-driven architecture for real-time updates
    - API-first design for microservices compatibility
    
    **Next Steps:**
    - Review and approve this specification
    - Proceed to **Payments.md v1.6** implementation
    - Begin migration to microservices architecture
    
    ---
    
    **Document Owner:** Joseph Ogutu, CTO
    **Last Updated:** November 12, 2025
    **Version:** 1.7 (Complete - Inventory Management & Room Transfers)
    **Status:** Ready for Implementation