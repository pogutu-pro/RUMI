# ACCOUNTS APP - Technical Specification
**RUMI Platform v2.0 - Enterprise Edition**
**App Name:** `accounts`
**Purpose:** User authentication, authorization, profile management, Google OAuth, and subscription management for Students, Landlords, Caretakers, and Administrators

---

## 1. Overview and Scope

The `accounts` app is the foundation of the RUMI platform's user management system. It handles:
- Multi-role user authentication and authorization (5 roles)
- **Google OAuth 2.0 authentication** (NEW in v2.0)
- **Subscription management for landlords** (NEW in v2.0)
- **Feature access control based on subscription tiers** (NEW in v2.0)
- Student, Landlord, and Caretaker profile management
- Advanced Role-Based Access Control (RBAC) with granular permissions
- OTP verification for account security
- Lifestyle preferences and roommate matching data for students
- Password reset and account recovery
- User activity audit trails
- Profile picture uploads and management
- Caretaker-hostel assignments

### Design Philosophy
- **Separation of Concerns:** Core user authentication (Django's User model extension) is separated from role-specific profile data
- **Multi-role Support:** Users can have different roles (Student, Landlord, Caretaker, Tech Support Admin, Super Admin) with isolated profile tables
- **Security-First:** Email verification, Google OAuth, secure password handling, JWT authentication, and RBAC enforcement
- **Subscription-Based Access:** Feature access controlled by subscription tier, not transaction fees
- **Fair Pricing Model:** Revenue-based Medium plan (1% of rent) benefits both small and large hostels
- **Extensibility:** JSONB fields for flexible profile attributes without schema migrations
- **Audit Trail:** All authentication events and profile changes are logged

---

## 2. Data Models

### 2.1 User (Extended Django User Model)
**Table:** `accounts_user`  
**Purpose:** Core authentication and authorization

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Unique identifier |
| email | VARCHAR(254) | NOT NULL | Primary login credential |
| password | VARCHAR(128) | NOT NULL | Hashed password (Django bcrypt) |
| first_name | VARCHAR(150) | NOT NULL | User's first name |
| last_name | VARCHAR(150) | NOT NULL | User's last name |
| role | VARCHAR(20) | NOT NULL | User role type |
| is_active | BOOLEAN | DEFAULT TRUE | Account activation status |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| is_staff | BOOLEAN | DEFAULT FALSE | Django admin access |
| is_superuser | BOOLEAN | DEFAULT FALSE | Django superuser status |
| phone_number | VARCHAR(15) | NULL | Contact number (format: +254XXXXXXXXX) |
| profile_picture | VARCHAR(255) | NULL | URL to uploaded image |
| last_login | TIMESTAMP | NULL | Last login timestamp |
| date_joined | TIMESTAMP | DEFAULT NOW() | Registration timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_user_email` on `email` (login lookup)
- `idx_user_role` on `role` (role-based queries)
- `idx_user_active_verified` on `(is_active, is_verified)` (active user filtering)

**Constraints:**
- `CHECK (role IN ('student', 'landlord', 'caretaker', 'tech_support', 'super_admin'))`
- `CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')` (valid email format)
- `CHECK (phone_number IS NULL OR phone_number ~* '^\+254[0-9]{9}$')` (Kenya format)

**Sample Record:**
```json
{
  "id": 123,
  "email": "johndoe@gmail.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "is_active": true,
  "is_verified": true,
  "phone_number": "+254712345678",
  "profile_picture": "https://#/rumi Picture/profiles/123.jpg",
  "date_joined": "2025-10-15T10:30:00Z",
  "last_login": "2025-11-05T08:15:00Z"
}
```

---

### 2.2 StudentProfile
**Table:** `accounts_studentprofile`  
**Purpose:** Student-specific data and preferences

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Profile identifier |
| user_id | INTEGER | FK → User, UNIQUE, NOT NULL | One-to-one with User |
| university | VARCHAR(255) | NOT NULL | University affiliation |
| student_id_number | VARCHAR(50) | UNIQUE, NOT NULL | University ID |
| year_of_study | INTEGER | CHECK (1-6), NOT NULL | Academic year |
| course | VARCHAR(255) | NULL | Field of study |
| lifestyle_preferences | JSONB | NULL | Matching criteria (v1.6) |
| bio | TEXT | NULL | Self-description (max 500 chars) |
| emergency_contact_name | VARCHAR(200) | NULL | Emergency contact |
| emergency_contact_phone | VARCHAR(15) | NULL | Emergency phone |
| emergency_contact_relationship | VARCHAR(50) | NULL | Relationship to student |
| is_profile_complete | BOOLEAN | DEFAULT FALSE | Profile completion flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Profile creation time |
| updated_at | TIMESTAMP | AUTO | Last update time |

**Indexes:**
- `idx_student_user` UNIQUE on `user_id` (one-to-one enforcement)
- `idx_student_university` on `university` (filtering by institution)
- `idx_student_id_number` UNIQUE on `student_id_number` (unique lookup)
- `idx_student_preferences_gin` GIN on `lifestyle_preferences` (JSONB queries)
- `idx_student_complete` on `is_profile_complete` (booking eligibility checks)

**Constraints:**
- `CHECK (year_of_study BETWEEN 1 AND 6)`
- `CHECK (LENGTH(bio) <= 500)`
- `CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~* '^\+254[0-9]{9}$')`

**JSONB Structure for `lifestyle_preferences`:**
```json
{
  "sleep_schedule": "early_bird|night_owl|flexible",
  "cleanliness": 1-5,
  "noise_tolerance": 1-5,
  "study_habits": "library|room|mixed",
  "smoking": true|false,
  "pets": true|false,
  "social_level": 1-5,
  "dietary_restrictions": ["vegetarian", "halal", "vegan", "none"]
}
```

**Profile Completion Rules:**
Required fields for `is_profile_complete = TRUE`:
- `university`
- `student_id_number`
- `year_of_study`
- `phone_number` (from User model)
- `emergency_contact_name`
- `emergency_contact_phone`

**Sample Profile:**
```json
{
  "id": 456,
  "user_id": 123,
  "university": "University of Nairobi",
  "student_id_number": "J17/12345/2021",
  "year_of_study": 2,
  "course": "Computer Science",
  "lifestyle_preferences": {
    "sleep_schedule": "early_bird",
    "cleanliness": 4,
    "noise_tolerance": 2,
    "study_habits": "library",
    "smoking": false,
    "pets": false,
    "social_level": 3,
    "dietary_restrictions": ["vegetarian"]
  },
  "bio": "Second-year CS student. Love coding and early morning runs.",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+254722345678",
  "emergency_contact_relationship": "Mother",
  "is_profile_complete": true,
  "created_at": "2025-10-15T11:00:00Z"
}
```

---

### 2.3 LandlordProfile
**Table:** `accounts_landlordprofile`  
**Purpose:** Landlord/Property Manager data

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Profile identifier |
| user_id | INTEGER | FK → User, UNIQUE, NOT NULL | One-to-one with User |
| company_name | VARCHAR(255) | NULL | Business name (optional) |
| national_id | VARCHAR(20) | UNIQUE, NOT NULL | ID verification |
| business_address | TEXT | NULL | Physical location |
| bank_name | VARCHAR(100) | NOT NULL | Settlement bank |
| bank_account_number | VARCHAR(20) | NOT NULL | Account number |
| bank_code | VARCHAR(10) | NOT NULL | Bank code (for Paystack) |
| paystack_subaccount_code | VARCHAR(100) | UNIQUE, NULL | Payment split account |
| is_verified | BOOLEAN | DEFAULT FALSE | Admin approval status |
| verification_documents | JSONB | NULL | URLs to uploaded docs |
| verified_at | TIMESTAMP | NULL | Verification timestamp |
| verified_by_id | INTEGER | FK → User (admin), NULL | Admin who verified |
| total_hostels | INTEGER | DEFAULT 0 | Hostel count (cached) |
| total_rooms | INTEGER | DEFAULT 0 | Room count (cached) |
| total_earnings | NUMERIC(10,2) | DEFAULT 0.00 | Lifetime earnings (cached) |
| created_at | TIMESTAMP | DEFAULT NOW() | Profile creation time |
| updated_at | TIMESTAMP | AUTO | Last update time |

**Indexes:**
- `idx_landlord_user` UNIQUE on `user_id`
- `idx_landlord_national_id` UNIQUE on `national_id`
- `idx_landlord_verified` on `is_verified` (verified landlord queries)
- `idx_landlord_paystack` UNIQUE on `paystack_subaccount_code`

**Constraints:**
- `CHECK (LENGTH(national_id) BETWEEN 5 AND 20)`
- `CHECK (total_hostels >= 0)`
- `CHECK (total_rooms >= 0)`
- `CHECK (total_earnings >= 0)`

**JSONB Structure for `verification_documents`:**
```json
{
  "national_id_front": "https://#/rumi/docs/id_front_10.jpg",
  "national_id_back": "https://#/rumi/docs/id_back_10.jpg",
  "kra_pin_certificate": "https://#/rumi/docs/kra_10.pdf",
  "business_license": "https://#/rumi/docs/license_10.pdf"
}
```

**Sample Profile:**
```json
{
  "id": 10,
  "user_id": 456,
  "company_name": "Smith Properties Ltd",
  "national_id": "12345678",
  "business_address": "456 Business Park, Nairobi",
  "bank_name": "Equity Bank",
  "bank_account_number": "1234567890",
  "bank_code": "68",
  "paystack_subaccount_code": "ACCT_abc123xyz",
  "is_verified": true,
  "verified_at": "2025-10-20T14:00:00Z",
  "verified_by_id": 1,

---

## 2.8 SubscriptionPlan (NEW in v2.0)
**Table:** `accounts_subscriptionplan`  
**Purpose:** Define available subscription tiers for landlords

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | UUID | PK | Plan identifier |
| name | VARCHAR(100) | NOT NULL | Plan display name |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | URL-safe identifier |
| plan_type | VARCHAR(20) | NOT NULL | Plan tier type |
| billing_type | VARCHAR(20) | NOT NULL | Billing model |
| fixed_price | NUMERIC(10,2) | DEFAULT 0.00 | Monthly fixed fee (KES) |
| revenue_percentage | NUMERIC(5,2) | DEFAULT 0.00 | % of rent revenue |
| trial_duration_days | INTEGER | DEFAULT 0 | Trial period length |
| features | JSONB | NOT NULL | Feature permissions |
| description | TEXT | NULL | Plan description |
| is_active | BOOLEAN | DEFAULT TRUE | Availability status |
| sort_order | INTEGER | DEFAULT 0 | Display ordering |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last update |

**Indexes:**
- `idx_plan_slug` UNIQUE on `slug`
- `idx_plan_type` on `plan_type`
- `idx_plan_active` on `is_active`

**Constraints:**
- `CHECK (plan_type IN ('trial', 'basic', 'medium', 'advanced'))`
- `CHECK (billing_type IN ('fixed', 'revenue'))`
- `CHECK (revenue_percentage BETWEEN 0 AND 100)`

**JSONB Structure for `features`:**
```json
{
  "hostels": "unlimited",
  "rooms": "unlimited",
  "caretakers": "unlimited",
  "recurring_payments": true,
  "inventory_management": true,
  "basic_analytics": true,
  "advanced_analytics": true,
  "marketplace": true,
  "custom_reports": true,
  "bulk_operations": true,
  "ai_features": true,
  "predictive_analytics": true,
  "smart_pricing": true,
  "api_access": true,
  "white_label": true,
  "auto_screening": true
}
```

**Available Plans:**

**1. Free Trial**
- Duration: 30 days
- Price: FREE
- Access: All features unlimited
- Purpose: First-time landlord onboarding

**2. Basic Plan**
- Price: KES 10,000/month (fixed)
- Features: Core + Basic tier
- Best for: Small hostels with steady income

**3. Medium Plan**
- Price: 1% of monthly rent revenue (variable)
- Features: Core + Basic + Medium tier
- Best for: Growing hostels (pay-as-you-grow)
- Calculation: Auto-calculated at end of each month

**4. Advanced Plan**
- Price: KES 9,999/month (fixed)
- Features: ALL features including AI
- Best for: Large hostel chains & enterprises

---

## 2.9 LandlordSubscription (NEW in v2.0)
**Table:** `accounts_landlordsubscription`  
**Purpose:** Track landlord's active subscription

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | UUID | PK | Subscription identifier |
| landlord_id | INTEGER | FK → LandlordProfile, UNIQUE | One subscription per landlord |
| plan_id | UUID | FK → SubscriptionPlan, NOT NULL | Current plan |
| status | VARCHAR(20) | NOT NULL | Subscription state |
| current_period_start | DATE | NOT NULL | Billing period start |
| current_period_end | DATE | NOT NULL | Billing period end |
| next_billing_date | DATE | NOT NULL | Next charge date |
| trial_start | DATE | NULL | Trial start date |
| trial_end | DATE | NULL | Trial expiry date |
| is_trial_used | BOOLEAN | DEFAULT FALSE | Trial redemption flag |
| total_rent_collected_this_period | NUMERIC(12,2) | DEFAULT 0.00 | Revenue tracking |
| calculated_fee_this_period | NUMERIC(10,2) | DEFAULT 0.00 | Medium plan fee |
| auto_renew | BOOLEAN | DEFAULT TRUE | Auto-renewal flag |
| cancel_at_period_end | BOOLEAN | DEFAULT FALSE | Scheduled cancellation |
| last_payment_date | DATE | NULL | Last successful payment |
| last_payment_amount | NUMERIC(10,2) | NULL | Last payment amount |
| created_at | TIMESTAMP | DEFAULT NOW() | Subscription creation |
| updated_at | TIMESTAMP | AUTO | Last modification |
| cancelled_at | TIMESTAMP | NULL | Cancellation time |
| cancellation_reason | TEXT | NULL | Cancellation reason |

**Indexes:**
- `idx_sub_landlord` UNIQUE on `landlord_id`
- `idx_sub_status` on `status`
- `idx_sub_billing` on `next_billing_date`
- `idx_sub_trial_end` on `trial_end`

**Constraints:**
- `CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'))`
- `CHECK (current_period_end >= current_period_start)`

**Sample Record:**
```json
{
  "id": "uuid",
  "landlord_id": 10,
  "plan_id": "uuid",
  "status": "trial",
  "current_period_start": "2025-11-01",
  "current_period_end": "2025-12-01",
  "next_billing_date": "2025-12-02",
  "trial_start": "2025-11-01",
  "trial_end": "2025-12-01",
  "is_trial_used": true,
  "total_rent_collected_this_period": "0.00",
  "auto_renew": true,
  "cancel_at_period_end": false
}
```

---

## 2.10 FeatureAccess (NEW in v2.0)
**Table:** `accounts_featureaccess`  
**Purpose:** Control feature availability based on subscription

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Access record identifier |
| landlord_id | INTEGER | FK → LandlordProfile, UNIQUE | One-to-one mapping |
| can_create_hostels | BOOLEAN | DEFAULT TRUE | Core feature |
| can_manage_rooms | BOOLEAN | DEFAULT TRUE | Core feature |
| can_process_payments | BOOLEAN | DEFAULT TRUE | Core feature |
| can_create_caretakers | BOOLEAN | DEFAULT TRUE | Core feature |
| can_use_recurring_payments | BOOLEAN | DEFAULT FALSE | Basic+ feature |
| can_use_inventory_management | BOOLEAN | DEFAULT FALSE | Basic+ feature |
| can_view_basic_analytics | BOOLEAN | DEFAULT TRUE | Core feature |
| can_access_marketplace | BOOLEAN | DEFAULT FALSE | Medium+ feature |
| can_view_advanced_analytics | BOOLEAN | DEFAULT FALSE | Medium+ feature |
| can_generate_custom_reports | BOOLEAN | DEFAULT FALSE | Medium+ feature |
| can_use_bulk_operations | BOOLEAN | DEFAULT FALSE | Medium+ feature |
| can_use_ai_features | BOOLEAN | DEFAULT FALSE | Advanced only |
| can_use_predictive_analytics | BOOLEAN | DEFAULT FALSE | Advanced only |
| can_use_smart_pricing | BOOLEAN | DEFAULT FALSE | Advanced only |
| can_use_api_access | BOOLEAN | DEFAULT FALSE | Advanced only |
| can_use_white_label | BOOLEAN | DEFAULT FALSE | Advanced only |
| can_auto_screen_tenants | BOOLEAN | DEFAULT FALSE | Advanced only |
| last_feature_sync | TIMESTAMP | AUTO | Last sync time |

**Indexes:**
- `idx_feature_landlord` UNIQUE on `landlord_id`

**Feature Tiers:**
- **Core**: Always available (create hostels, manage rooms, process payments)
- **Basic**: Recurring payments, inventory management
- **Medium**: Marketplace, advanced analytics, custom reports, bulk operations
- **Advanced**: AI features, predictive analytics, smart pricing, API access, white-label

**Sample Record:**
```json
{
  "landlord_id": 10,
  "can_create_hostels": true,
  "can_use_ai_features": false,
  "can_access_marketplace": true,
  "last_feature_sync": "2025-11-21T10:00:00Z"
}
```

---

## 2.11 SubscriptionPayment (NEW in v2.0)
**Table:** `accounts_subscriptionpayment`  
**Purpose:** Track subscription payment history

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | UUID | PK | Payment identifier |
| subscription_id | UUID | FK → LandlordSubscription, NOT NULL | Parent subscription |
| amount | NUMERIC(10,2) | NOT NULL | Payment amount (KES) |
| billing_period_start | DATE | NOT NULL | Period start |
| billing_period_end | DATE | NOT NULL | Period end |
| rent_revenue_amount | NUMERIC(12,2) | NULL | For revenue-based plans |
| payment_method | VARCHAR(50) | DEFAULT 'paystack' | Payment gateway |
| transaction_reference | VARCHAR(100) | UNIQUE, NOT NULL | Platform reference |
| paystack_reference | VARCHAR(100) | NULL | Paystack transaction ID |
| status | VARCHAR(20) | DEFAULT 'pending' | Payment state |
| initiated_at | TIMESTAMP | DEFAULT NOW() | Payment request time |
| paid_at | TIMESTAMP | NULL | Payment success time |
| failed_at | TIMESTAMP | NULL | Payment failure time |
| failure_reason | TEXT | NULL | Error message |
| metadata | JSONB | DEFAULT {} | Additional data |

**Indexes:**
- `idx_subpay_subscription` on `subscription_id`
- `idx_subpay_status` on `status`
- `idx_subpay_txn_ref` UNIQUE on `transaction_reference`
- `idx_subpay_paid_at` on `paid_at`

**Constraints:**
- `CHECK (status IN ('pending', 'success', 'failed', 'refunded'))`

  "total_hostels": 3,
  "total_rooms": 50,
  "total_earnings": 450000.00,
  "created_at": "2025-10-10T09:00:00Z"
}
```

---

### 2.4 CaretakerProfile (NEW in v1.7)
**Table:** `accounts_caretakerprofile`  
**Purpose:** On-site property manager data

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Profile identifier |
| user_id | INTEGER | FK → User, UNIQUE, NOT NULL | One-to-one with User |
| national_id | VARCHAR(20) | UNIQUE, NOT NULL | ID verification |
| hostel_id | INTEGER | FK → Hostel, UNIQUE, NOT NULL | Assigned hostel |
| landlord_id | INTEGER | FK → LandlordProfile, NOT NULL | Employer reference |
| employment_start_date | DATE | NOT NULL | Start date |
| employment_end_date | DATE | NULL | End date (if terminated) |
| is_active | BOOLEAN | DEFAULT TRUE | Employment status |
| permissions | JSONB | NOT NULL | Caretaker permissions |
| emergency_contact_name | VARCHAR(200) | NOT NULL | Emergency contact |
| emergency_contact_phone | VARCHAR(15) | NOT NULL | Emergency phone |
| created_at | TIMESTAMP | DEFAULT NOW() | Profile creation time |
| updated_at | TIMESTAMP | AUTO | Last update time |
| created_by_id | INTEGER | FK → User (landlord), NOT NULL | Who hired |

**Indexes:**
- `idx_caretaker_user` UNIQUE on `user_id`
- `idx_caretaker_hostel` UNIQUE on `hostel_id` (one caretaker per hostel)
- `idx_caretaker_landlord` on `landlord_id` (landlord's caretakers)
- `idx_caretaker_active` on `(is_active, hostel_id)` (active caretaker lookup)

**Constraints:**
- `CHECK (employment_end_date IS NULL OR employment_end_date >= employment_start_date)`
- `CHECK (salary_amount IS NULL OR salary_amount > 0)`
- `CHECK (payment_method IN ('mpesa', 'bank_transfer', 'cash', 'not_tracked'))`
- `UNIQUE (hostel_id)` → One caretaker per hostel

**JSONB Structure for `permissions`:**
```json
{
  "can_view_student_payments": true,
  "can_view_payment_amounts": true,
  "can_create_inventory_templates": true,
  "can_verify_check_ins": true,
  "can_verify_check_outs": true,
  "can_create_damage_reports": true,
  "can_approve_room_transfers": true,
  "can_view_financial_reports": false
}
```

**Sample Profile:**
```json
{
  "id": 25,
  "user_id": 789,
  "national_id": "87654321",
  "hostel_id": 5,
  "landlord_id": 10,
  "employment_start_date": "2025-09-01",
  "employment_end_date": null,
  "is_active": true,
  "permissions": {
    "can_view_student_payments": true,
    "can_view_payment_amounts": true,
    "can_create_inventory_templates": true,
    "can_verify_check_ins": true,
    "can_verify_check_outs": true,
    "can_create_damage_reports": true,
    "can_approve_room_transfers": true,
    "can_view_financial_reports": false
  },
  "emergency_contact_name": "Peter Mwangi",
  "emergency_contact_phone": "+254733456789",
  "created_at": "2025-09-01T08:00:00Z",
  "created_by_id": 456
}
```

**Key Business Rules:**
1. **One Caretaker Per Hostel:** UNIQUE constraint on `hostel_id`
2. **Landlord Control:** Landlord can create/remove caretakers without admin approval
3. **Payment Visibility:** Caretaker sees student payment status (paid/not paid) AND exact amounts
4. **Hostel Assignment:** When hostel is deleted, caretaker is automatically deactivated (`is_active=FALSE`)


---

### 2.5 OTPVerification
**Table:** `accounts_otpverification`  
**Purpose:** Temporary storage for email/phone verification codes

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | OTP record identifier |
| user_id | INTEGER | FK → User, NOT NULL | User requesting verification |
| otp_code | VARCHAR(6) | NOT NULL | 6-digit code |
| verification_type | VARCHAR(20) | NOT NULL | 'email' or 'phone' |
| created_at | TIMESTAMP | DEFAULT NOW() | Generation time |
| expires_at | TIMESTAMP | NOT NULL | Expiry (5 minutes) |
| is_used | BOOLEAN | DEFAULT FALSE | Single-use flag |
| used_at | TIMESTAMP | NULL | Usage timestamp |
| attempts | INTEGER | DEFAULT 0 | Failed verification attempts |
| ip_address | VARCHAR(45) | NULL | Request IP address |

**Indexes:**
- `idx_otp_user_type` on `(user_id, verification_type)`
- `idx_otp_expiry` on `expires_at` (cleanup job)
- `idx_otp_active` on `(user_id, is_used, expires_at)` (active OTP lookup)

**Constraints:**
- `CHECK (verification_type IN ('email', 'phone'))`
- `CHECK (LENGTH(otp_code) = 6 AND otp_code ~ '^[0-9]+$')` (6 numeric digits)
- `CHECK (expires_at > created_at)`
- `CHECK (attempts >= 0 AND attempts <= 5)` (max 5 attempts)

**Lifecycle:**
- **Created:** On registration or verification request
- **Expires:** After 5 minutes (`expires_at < NOW()`)
- **Used:** Once verified successfully (`is_used=TRUE`)
- **Cleaned Up:** Daily Celery job deletes records older than 24 hours

**Sample Record:**
```json
{
  "id": 1001,
  "user_id": 123,
  "otp_code": "847392",
  "verification_type": "email",
  "created_at": "2025-11-05T10:00:00Z",
  "expires_at": "2025-11-05T10:05:00Z",
  "is_used": false,
  "used_at": null,
  "attempts": 0,
  "ip_address": "197.156.89.45"
}
```

---

### 2.6 PasswordResetToken
**Table:** `accounts_passwordresettoken`  
**Purpose:** Secure password reset token storage

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Token identifier |
| user_id | INTEGER | FK → User, NOT NULL | User requesting reset |
| token | UUID | UNIQUE, NOT NULL | Reset token |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| expires_at | TIMESTAMP | NOT NULL | Expiry (24 hours) |
| is_used | BOOLEAN | DEFAULT FALSE | Single-use flag |
| used_at | TIMESTAMP | NULL | Usage timestamp |
| ip_address | VARCHAR(45) | NULL | Request IP address |

**Indexes:**
- `idx_reset_token` UNIQUE on `token`
- `idx_reset_user` on `user_id`
- `idx_reset_expiry` on `expires_at` (cleanup job)

**Constraints:**
- `CHECK (expires_at > created_at)`

**Lifecycle:**
- **Created:** When user requests password reset
- **Expires:** After 24 hours
- **Used:** Once password is successfully reset
- **Cleaned Up:** Daily Celery job deletes records older than 7 days

---

### 2.7 UserActivityLog (NEW in v1.7)
**Table:** `accounts_useractivitylog`  
**Purpose:** Audit trail for user actions (5-year retention for compliance)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | BIGSERIAL | PK | Log identifier (big int for large volume) |
| user_id | INTEGER | FK → User, NULL | User who performed action |
| action_type | VARCHAR(50) | NOT NULL | Type of action |
| action_description | TEXT | NULL | Detailed description |
| ip_address | VARCHAR(45) | NULL | Request IP |
| user_agent | VARCHAR(255) | NULL | Browser/device info |
| metadata | JSONB | NULL | Additional context |
| created_at | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_activity_user` on `user_id`
- `idx_activity_type` on `action_type`
- `idx_activity_created` on `created_at DESC` (time-series queries)
- `idx_activity_created_partition` (for table partitioning by month)

**Constraints:**
- `CHECK (action_type IN ('login', 'logout', 'register', 'password_reset', 'profile_update', 'permission_change', 'verification', 'failed_login', 'account_deactivation', 'account_reactivation'))`

**Partitioning Strategy:**
- Partition table by month (e.g., `accounts_useractivitylog_2025_11`)
- Retain 5 years of data (60 partitions)
- Automated archival to cold storage after 5 years

**Sample Record:**
```json
{
  "id": 1000001,
  "user_id": 123,
  "action_type": "login",
  "action_description": "User logged in successfully",
  "ip_address": "197.156.89.45",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "login_method": "email_password",
    "device_type": "desktop",
    "browser": "Chrome",
    "success": true
  },
  "created_at": "2025-11-05T08:15:00Z"
}
```

---

## 3. API Endpoints

### 3.1 Authentication Endpoints

#### POST `/api/v1/accounts/register`
**Purpose:** User registration  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "student@gmail.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+254712345678"
}
```

**Validation Rules:**
- Email: Valid format, from disposable email providers
- Password: Min 8 chars, must contain uppercase, lowercase, digit, special char
- Passwords must match
- Role: Must be 'student' or 'landlord' (caretaker created by landlord)
- Phone: Kenya format (+254XXXXXXXXX)

**Response (201):**
```json
{
  "user_id": 123,
  "email": "student@gmail.com",
  "role": "student",
  "message": "Registration successful. Please verify your email.",
  "verification_sent": true,
  "otp_expires_in_seconds": 300,
  "next_step": "verify_email"
}
```

**Backend Flow:**
1. Validate input data
2. Do not enforce email uniqueness (duplicates allowed)
3. Check against disposable email blacklist
4. Hash password using Django's `make_password()`
5. Create User record with `is_verified=False`
6. Create role-specific profile (StudentProfile or LandlordProfile)
7. Generate 6-digit OTP with 5-minute expiry
8. Send verification email via notifications app (async)
9. Log activity (`action_type='register'`)
10. Return success response

---

#### POST `/api/v1/accounts/verify-email`
**Purpose:** OTP verification  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "student@gmail.com",
  "otp_code": "847392"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "user_id": 123,
  "is_verified": true,
  "access_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "next_step": "complete_profile"
}
```

**Backend Flow:**
1. Find active OTP for user and email
2. Check OTP not expired (`expires_at > NOW()`)
3. Check OTP not used (`is_used=FALSE`)
4. Verify OTP code matches
5. Increment `attempts` if invalid (max 5 attempts)
6. Update User: `is_verified=TRUE`
7. Mark OTP as used: `is_used=TRUE`, `used_at=NOW()`
8. Generate JWT tokens (access + refresh)
9. Send welcome email (async)
10. Log activity (`action_type='verification'`)
11. Return tokens and success response

**Error Responses:**
- `400 Bad Request`: Invalid or expired OTP
- `404 Not Found`: User not found
- `429 Too Many Requests`: Max attempts exceeded (5 failed attempts)

---

#### POST `/api/v1/accounts/resend-otp`
**Purpose:** Resend verification OTP  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "student@gmail.com",
  "verification_type": "email"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully",
  "expires_in_seconds": 300,
  "rate_limit_remaining": 2
}
```

**Rate Limiting:** Max 3 requests per 15 minutes per email

---

#### POST `/api/v1/accounts/login`
**Purpose:** User authentication  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "student@gmail.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 123,
    "email": "student@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "is_verified": true,
    "profile_complete": true,
    "profile_picture": "https://#/rumi/profiles/123.jpg"
  }
}
```

**Backend Flow:**
1. Validate email exists
2. Check user `is_active=TRUE`
3. Verify password using Django's `check_password()`
4. Check if account is locked (5 failed attempts = 15-min lockout)
5. Check `is_verified=TRUE` (optional, can allow unverified login with warning)
6. Generate JWT access token (1-hour expiry)
7. Generate JWT refresh token (7-day expiry)
8. Update `last_login` timestamp
9. Reset failed login counter to 0
10. Log activity (`action_type='login'`)
11. Return tokens and user data

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account disabled or unverified
- `429 Too Many Requests`: Account temporarily locked (5 failed attempts)

**Rate Limiting:** 
- 5 failed attempts = 15-minute lockout
- Track using Redis: `login_attempts:{email}`

---

#### POST `/api/v1/accounts/refresh-token`
**Purpose:** Refresh access token  
**Authentication:** Refresh token required

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "expires_in": 3600
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token
- `403 Forbidden`: Token has been blacklisted

---

#### POST `/api/v1/accounts/logout`
**Purpose:** User logout (blacklist refresh token)  
**Authentication:** Required

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Backend Flow:**
1. Add refresh token to Redis blacklist (7-day expiry)
2. Clear user session data
3. Log activity (`action_type='logout'`)
4. Return success response

---

### 3.2 Password Management

#### POST `/api/v1/accounts/password-reset/request`
**Purpose:** Request password reset link  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "student@gmail.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset link sent to your email",
  "expires_in_hours": 24
}
```

**Backend Flow:**
1. Validate email exists (always return 200 even if not found - security best practice)
2. If email exists:
   - Generate UUID reset token with 24-hour expiry
   - Create PasswordResetToken record
   - Send email with reset link: `https://rumi.co.ke/reset-password?token={uuid}`
   - Log activity (`action_type='password_reset'`)
3. Return success response (always 200, even if email doesn't exist)

**Rate Limiting:** Max 3 requests per hour per email

---

#### POST `/api/v1/accounts/password-reset/verify`
**Purpose:** Verify reset token validity  
**Authentication:** Not required

**Request Body:**
```json
{
  "token": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
}
```

**Response (200):**
```json
{
  "valid": true,
  "email": "student@gmail.com",
  "expires_at": "2025-11-06T10:30:00Z"
}
```

**Error Response (400):**
```json
{
  "valid": false,
  "error": "Token has expired or is invalid"
}
```

---

#### POST `/api/v1/accounts/password-reset/confirm`
**Purpose:** Set new password using reset token  
**Authentication:** Not required

**Request Body:**
```json
{
  "token": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "new_password": "NewSecurePass123!",
  "confirm_password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully",
  "user_id": 123,
  "next_step": "login"
}
```

**Backend Flow:**
1. Verify token exists and not expired
2. Check token not already used
3. Validate new password (same rules as registration)
4. Hash new password
5. Update User password
6. Mark token as used
7. Invalidate all existing refresh tokens (force re-login on all devices)
8. Send confirmation email
9. Log activity (`action_type='password_reset'`)
10. Return success response

---

### 3.3 Profile Management

#### GET `/api/v1/accounts/profile`
**Purpose:** Retrieve authenticated user's profile  
**Authentication:** Required (JWT)

**Response (200) - Student:**
```json
{
  "user": {
    "id": 123,
    "email": "student@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "is_verified": true,
    "phone_number": "+254712345678",
    "profile_picture": "https://#/rumi/profiles/123.jpg",
    "date_joined": "2025-10-15T10:30:00Z",
    "last_login": "2025-11-05T08:15:00Z"
  },
  "profile": {
    "university": "University of Nairobi",
    "student_id_number": "J17/12345/2021",
    "year_of_study": 2,
    "course": "Computer Science",
    "lifestyle_preferences": {
      "sleep_schedule": "early_bird",
      "cleanliness": 4,
      "noise_tolerance": 2,
      "smoking": false,
      "pets": false,
      "social_level": 3,
      "dietary_restrictions": ["vegetarian"]
    },
    "bio": "Second-year CS student. Love coding and early morning runs.",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+254722345678",
    "emergency_contact_relationship": "Mother",
    "is_profile_complete": true
  }
}
```

**Response (200) - Landlord:**
```json
{
  "user": {
    "id": 456,
    "email": "landlord@gmail.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "landlord",
    "is_verified": true,
    "phone_number": "+254722345678",
    "profile_picture": null
  },
  "profile": {
    "company_name": "Smith Properties Ltd",
    "national_id": "12345678",
    "business_address": "456 Business Park, Nairobi",
    "bank_name": "Equity Bank",
    "bank_account_number": "1234567890",
    "is_verified": true,
    "verified_at": "2025-10-20T14:00:00Z",
    "paystack_subaccount_code": "ACCT_abc123",
    "can_list_hostels": true,
    "total_hostels": 3,
    "total_rooms": 50,
    "total_earnings": 450000.00
  }
}
```

**Response (200) - Caretaker:**
```json
{
  "user": {
    "id": 789,
    "email": "caretaker@gmail.com",
    "first_name": "Peter",
    "last_name": "Mwangi",
    "role": "caretaker",
    "is_verified": true,
    "phone_number": "+254733456789"
  },
  "profile": {
    "national_id": "87654321",
    "hostel": {
      "hostel_id": 5,
      "hostel_name": "University Heights",
      "landlord_name": "Smith Properties Ltd"
    },
    "employment_start_date": "2025-09-01",
    "is_active": true,
    "permissions": {
      "can_view_student_payments": true,
      "can_view_payment_amounts": true,
      "can_create_inventory_templates": true,
      "can_verify_check_ins": true,
      "can_verify_check_outs": true,
      "can_create_damage_reports": true,
      "can_approve_room_transfers": true
    },
    "emergency_contact_name": "Mary Mwangi",
    "emergency_contact_phone": "+254744567890"
  }
}
```

---

#### PUT `/api/v1/accounts/profile`
**Purpose:** Update profile data  
**Authentication:** Required (JWT)

**Request Body (Student):**
```json
{
  "university": "University of Nairobi",
  "student_id_number": "J17/12345/2021",
  "year_of_study": 2,
  "course": "Computer Science",
  "lifestyle_preferences": {
    "sleep_schedule": "early_bird",
    "cleanliness": 4,
    "noise_tolerance": 2,
    "smoking": false,
    "pets": false,
    "social_level": 3
  },
  "bio": "Updated bio",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+254722345678",
  "emergency_contact_relationship": "Mother"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile_complete": true,
  "compatibility_scores_updated": true
}
```

**Backend Flow (Student):**
1. Validate all fields
2. Update StudentProfile record
3. Check if profile now complete (all required fields filled)
4. If `lifestyle_preferences` changed:
   - Trigger Celery task to recalculate compatibility scores
   - Invalidate cached compatibility data
5. Log activity (`action_type='profile_update'`)
6. Return success response

---

#### POST `/api/v1/accounts/profile/upload-picture`
**Purpose:** Upload profile picture  
**Authentication:** Required (JWT)  
**Content-Type:** multipart/form-data

**Request:**
```
POST /api/v1/accounts/profile/upload-picture
Content-Type: multipart/form-data

file: [binary image data]
```

**Response (200):**
```json
{
  "message": "Profile picture uploaded successfully",
  "profile_picture_url": "https://#/rumi/profiles/123_abc.jpg"
}
```

**Backend Flow:**
1. Validate file type (JPEG, PNG only)
2. Validate file size (max 5MB)
3. Resize image to 500x500px (optimize storage)
4. Generate unique filename: `{user_id}_{timestamp}.{ext}`
5. Upload to Digital Ocean Spaces
6. Update User.profile_picture with new URL
7. Delete old image from storage (if exists)
8. Log activity (`action_type='profile_update'`)
9. Return new URL

---

### 3.4 Caretaker Management (Landlord)

#### POST `/api/v1/accounts/caretakers`
**Purpose:** Create caretaker account  
**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "email": "caretaker@gmail.com",
  "first_name": "Peter",
  "last_name": "Mwangi",
  "phone_number": "+254733456789",
  "national_id": "87654321",
  "hostel_id": 5,
  "employment_start_date": "2025-11-10",
  "salary_amount": 25000.00,
  "payment_method": "mpesa",
  "emergency_contact_name": "Mary Mwangi",
  "emergency_contact_phone": "+254744567890",
  "permissions": {
    "can_view_student_payments": true,
    "can_view_payment_amounts": true,
    "can_create_inventory_templates": true,
    "can_verify_check_ins": true,
    "can_verify_check_outs": true,
    "can_create_damage_reports": true,
    "can_approve_room_transfers": true
  }
}
```

**Validation Rules:**
- Landlord must own the hostel (`hostel.landlord_id == request.user.landlord_profile.id`)
- Hostel must not already have an active caretaker
- Email may be reused (no uniqueness enforced)
- National ID must be unique
- All required fields must be provided

**Response (201):**
```json
{
  "caretaker_id": 25,
  "user_id": 789,
  "email": "caretaker@gmail.com",
  "hostel_name": "University Heights",
  "employment_start_date": "2025-11-10",
  "is_active": true,
  "temporary_password": "TempPass123!",
  "message": "Caretaker account created successfully. Temporary password sent to email."
}
```

**Backend Flow:**
1. Validate landlord owns hostel
2. Check hostel doesn't have active caretaker
3. Validate national_id uniqueness
4. Generate temporary password (strong random)
5. Create User record (`role='caretaker'`, `is_verified=FALSE`)
6. Create CaretakerProfile record
7. Send welcome email with temporary password and instructions to verify email
8. Log activity (`action_type='caretaker_created'`)
9. Return caretaker details

---

#### GET `/api/v1/accounts/caretakers`
**Purpose:** List landlord's caretakers  
**Authentication:** Required (Landlord only)

**Query Parameters:**
- `hostel_id`: Filter by hostel (optional)
- `is_active`: Filter by employment status (optional)

**Response (200):**
```json
{
  "total_caretakers": 3,
  "caretakers": [
    {
      "caretaker_id": 25,
      "user_id": 789,
      "email": "caretaker@gmail.com",
      "first_name": "Peter",
      "last_name": "Mwangi",
      "phone_number": "+254733456789",
      "hostel": {
        "hostel_id": 5,
        "hostel_name": "University Heights"
      },
      "employment_start_date": "2025-09-01",
      "is_active": true,
      "salary_amount": 25000.00
    }
  ]
}
```

---

#### PUT `/api/v1/accounts/caretakers/{caretaker_id}`
**Purpose:** Update caretaker profile  
**Authentication:** Required (Landlord only)  
**Authorization:** Must own the caretaker's hostel

**Request Body:**
```json
{
  "phone_number": "+254733456789",
  "salary_amount": 27000.00,
  "payment_method": "bank_transfer",
  "permissions": {
    "can_view_student_payments": true,
    "can_view_payment_amounts": false
  }
}
```

**Response (200):**
```json
{
  "message": "Caretaker profile updated successfully",
  "caretaker_id": 25
}
```

---

#### DELETE `/api/v1/accounts/caretakers/{caretaker_id}`
**Purpose:** Terminate caretaker employment  
**Authentication:** Required (Landlord only)  
**Authorization:** Must own the caretaker's hostel

**Request Body:**
```json
{
  "employment_end_date": "2025-11-30",
  "reason": "Contract ended"
}
```

**Response (200):**
```json
{
  "message": "Caretaker employment terminated",
  "caretaker_id": 25,
  "employment_end_date": "2025-11-30",
  "is_active": false
}
```

**Backend Flow:**
1. Validate landlord owns caretaker's hostel
2. Update CaretakerProfile:
   - `is_active = FALSE`
   - `employment_end_date = provided_date`
3. Deactivate User account (`is_active = FALSE`)
4. Send termination notification email to caretaker
5. Log activity (`action_type='caretaker_terminated'`)
6. Return success response

**Note:** Soft delete only - data retained for audit purposes

---

### 3.5 User Management (Admin)

#### GET `/api/v1/accounts/users`
**Purpose:** List all users with filters  
**Authentication:** Required (Admin or Super Admin only)

**Query Parameters:**
- `role`: Filter by role ('student', 'landlord', 'caretaker', etc.)
- `is_verified`: Filter by verification status
- `is_active`: Filter by active status
- `search`: Search by name or email
- `limit`: Pagination limit (default: 20)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "total_users": 1500,
  "filters_applied": {
    "role": "student",
    "is_verified": true
  },
  "users": [
    {
      "user_id": 123,
      "email": "student@gmail.com",
      "full_name": "John Doe",
      "role": "student",
      "is_verified": true,
      "is_active": true,
      "date_joined": "2025-10-15T10:30:00Z",
      "last_login": "2025-11-05T08:15:00Z"
    }
  ]
}
```

---

#### PUT `/api/v1/accounts/users/{user_id}/deactivate`
**Purpose:** Deactivate user account  
**Authentication:** Required (Admin or Super Admin only)

**Request Body:**
```json
{
  "reason": "Violated terms of service",
  "notify_user": true
}
```

**Response (200):**
```json
{
  "message": "User account deactivated",
  "user_id": 123,
  "is_active": false
}
```

**Backend Flow:**
1. Validate admin permissions
2. Update User: `is_active = FALSE`
3. Invalidate all user's refresh tokens (force logout)
4. If `notify_user=true`, send deactivation email
5. Log activity (`action_type='account_deactivation'`)
6. Return success response

---

#### PUT `/api/v1/accounts/users/{user_id}/reactivate`
**Purpose:** Reactivate deactivated account  
**Authentication:** Required (Super Admin only)

**Response (200):**
```json
{
  "message": "User account reactivated",
  "user_id": 123,
  "is_active": true
}
```

---

#### GET `/api/v1/accounts/users/{user_id}/activity-log`
**Purpose:** View user's activity history  
**Authentication:** Required (Admin or Super Admin only)

**Query Parameters:**
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset
- `action_type`: Filter by action type

**Response (200):**
```json
{
  "total_activities": 250,
  "activities": [
    {
      "id": 1000001,
      "action_type": "login",
      "action_description": "User logged in successfully",
      "ip_address": "197.156.89.45",
      "created_at": "2025-11-05T08:15:00Z"
    },
    {
      "id": 1000002,
      "action_type": "profile_update",
      "action_description": "Updated lifestyle preferences",
      "ip_address": "197.156.89.45",
      "created_at": "2025-11-05T09:30:00Z"
    }
  ]
}
```

---

### 3.6 Landlord Verification (Admin)

#### GET `/api/v1/accounts/landlords/pending`
**Purpose:** List landlords awaiting verification  
**Authentication:** Required (Admin only)

**Response (200):**
```json
{
  "total_pending": 5,
  "landlords": [
    {
      "landlord_id": 10,
      "user_id": 456,
      "email": "landlord@gmail.com",
      "company_name": "Smith Properties Ltd",
      "phone_number": "+254722345678",
      "national_id": "12345678",
      "kra_pin": "A123456789X",
      "verification_documents": {
        "national_id_front": "https://#/rumi/docs/id_front_10.jpg",
        "kra_pin_certificate": "https://#/rumi/docs/kra_10.pdf"
      },
      "submitted_at": "2025-10-25T10:00:00Z"
    }
  ]
}
```

---

#### POST `/api/v1/accounts/landlords/{landlord_id}/verify`
**Purpose:** Approve landlord verification  
**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "verification_status": "approved",
  "admin_notes": "All documents verified"
}
```

**Response (200):**
```json
{
  "message": "Landlord verified successfully",
  "landlord_id": 10,
  "is_verified": true,
  "can_list_hostels": true,
  "paystack_subaccount_created": true,
  "subaccount_code": "ACCT_abc123"
}
```

**Backend Flow:**
1. Validate admin role
2. Review verification documents
3. Update LandlordProfile:
   - `is_verified = TRUE`
   - `verified_at = NOW()`
   - `verified_by_id = request.user.id`
4. Create Paystack subaccount (see Payments integration)
5. Send verification success email to landlord
6. Log activity (`action_type='landlord_verified'`)
7. Return success response

---

#### POST `/api/v1/accounts/landlords/{landlord_id}/reject`
**Purpose:** Reject landlord verification  
**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "rejection_reason": "Invalid KRA PIN certificate"
}
```

**Response (200):**
```json
{
  "message": "Landlord verification rejected",
  "landlord_id": 10,
  "reason_sent": true
}
```

**Backend Flow:**
1. Validate admin role
2. Send rejection email to landlord with reason
3. Log activity (`action_type='landlord_rejected'`)
4. Return success response

---

## 4. Business Logic and Workflows

### 4.1 Registration and Verification Flow

**Step 1: Registration**
```python
def register_user(email, password, role, first_name, last_name, phone_number):
    """
    Create new user account
    """
    # 1. Do not enforce email uniqueness (duplicates allowed)
    pass
    
    # 2. Check disposable email blacklist
    if is_disposable_email(email):
        raise ValidationError("Disposable email addresses not allowed")
    
    # 3. Validate password strength
    validate_password_strength(password)
    
    # 4. Create user
    with transaction.atomic():
        user = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            role=role,
            is_active=True,
            is_verified=False
        )
        user.set_password(password)
        user.save()
        
        # 5. Create role-specific profile
        if role == 'student':
            StudentProfile.objects.create(user=user)
        elif role == 'landlord':
            LandlordProfile.objects.create(user=user)
        
        # 6. Generate OTP
        otp = OTPVerification.objects.create(
            user=user,
            otp_code=generate_6_digit_otp(),
            verification_type='email',
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        
        # 7. Send verification email (async)
        send_notification.delay(
            recipient_id=user.id,
            notification_type='email_verification',
            channel='email',
            context={
                'first_name': first_name,
                'otp_code': otp.otp_code,
                'expires_in_minutes': 5
            }
        )
        
        # 8. Log activity
        UserActivityLog.objects.create(
            user=user,
            action_type='register',
            action_description=f"User registered with role: {role}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
    
    return user
```

---

**Step 2: Email Verification**
```python
def verify_email(email, otp_code, ip_address):
    """
    Verify user email with OTP
    """
    user = User.objects.get(email=email)
    
    # 1. Find active OTP
    otp = OTPVerification.objects.filter(
        user=user,
        verification_type='email',
        is_used=False,
        expires_at__gt=timezone.now()
    ).order_by('-created_at').first()
    
    if not otp:
        raise ValidationError("OTP expired or invalid")
    
    # 2. Check max attempts
    if otp.attempts >= 5:
        raise ValidationError("Maximum verification attempts exceeded")
    
    # 3. Verify OTP
    if otp.otp_code != otp_code:
        otp.attempts += 1
        otp.save()
        raise ValidationError("Invalid OTP code")
    
    # 4. Update user and OTP
    with transaction.atomic():
        user.is_verified = True
        user.save()
        
        otp.is_used = True
        otp.used_at = timezone.now()
        otp.save()
        
        # 5. Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # 6. Send welcome email (async)
        send_notification.delay(
            recipient_id=user.id,
            notification_type='welcome',
            channel='email',
            context={'first_name': user.first_name}
        )
        
        # 7. Log activity
        UserActivityLog.objects.create(
            user=user,
            action_type='verification',
            action_description="Email verified successfully",
            ip_address=ip_address
        )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user
    }
```

---

### 4.2 Login and JWT Generation

```python
from rest_framework_simplejwt.tokens import RefreshToken

def authenticate_user(email, password, ip_address, user_agent):
    """
    Authenticate user and generate JWT tokens
    """
    # 1. Check rate limiting
    check_login_rate_limit(email)
    
    # 2. Find user
    try:
        user = User.objects.select_related(
            'student_profile',
            'landlord_profile',
            'caretaker_profile'
        ).get(email=email)
    except User.DoesNotExist:
        # Log failed attempt
        log_failed_login_attempt(email, ip_address)
        raise AuthenticationFailed("Invalid credentials")
    
    # 3. Check active status
    if not user.is_active:
        UserActivityLog.objects.create(
            user=user,
            action_type='failed_login',
            action_description="Login attempt on deactivated account",
            ip_address=ip_address
        )
        raise PermissionDenied("Account deactivated")
    
    # 4. Verify password
    if not user.check_password(password):
        # Increment failed attempt counter
        log_failed_login_attempt(email, ip_address)
        
        UserActivityLog.objects.create(
            user=user,
            action_type='failed_login',
            action_description="Invalid password attempt",
            ip_address=ip_address
        )
        raise AuthenticationFailed("Invalid credentials")
    
    # 5. Optional: Check email verification
    # if not user.is_verified:
    #     raise PermissionDenied("Email not verified")
    
    # 6. Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    # 7. Update last login
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
    
    # 8. Reset failed login counter
    reset_login_rate_limit(email)
    
    # 9. Log successful login
    UserActivityLog.objects.create(
        user=user,
        action_type='login',
        action_description="User logged in successfully",
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'device_type': detect_device_type(user_agent),
            'browser': detect_browser(user_agent)
        }
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user
    }
```

---

### 4.3 Caretaker Creation Workflow

```python
def create_caretaker(landlord, hostel_id, caretaker_data):
    """
    Create caretaker account (called by landlord)
    """
    # 1. Validate landlord owns hostel
    hostel = Hostel.objects.get(id=hostel_id, landlord_id=landlord.id)
    
    # 2. Check hostel doesn't have active caretaker
    existing_caretaker = CaretakerProfile.objects.filter(
        hostel_id=hostel_id,
        is_active=True
    ).exists()
    
    if existing_caretaker:
        raise ValidationError("This hostel already has an active caretaker")
    
    # 3. Validate uniqueness
    if User.objects.filter(email=caretaker_data['email']).exists():
        raise ValidationError("Email already registered")
    
    if CaretakerProfile.objects.filter(
        national_id=caretaker_data['national_id']
    ).exists():
        raise ValidationError("National ID already registered")
    
    # 4. Generate temporary password
    temp_password = generate_strong_password()
    
    # 5. Create user and profile
    with transaction.atomic():
        user = User.objects.create(
            email=caretaker_data['email'],
            first_name=caretaker_data['first_name'],
            last_name=caretaker_data['last_name'],
            phone_number=caretaker_data['phone_number'],
            role='caretaker',
            is_active=True,
            is_verified=False  # Must verify email
        )
        user.set_password(temp_password)
        user.save()
        
        caretaker_profile = CaretakerProfile.objects.create(
            user=user,
            national_id=caretaker_data['national_id'],
            hostel_id=hostel_id,
            landlord_id=landlord.id,
            employment_start_date=caretaker_data['employment_start_date'],
            salary_amount=caretaker_data.get('salary_amount'),
            payment_method=caretaker_data.get('payment_method', 'not_tracked'),
            permissions=caretaker_data.get('permissions', get_default_caretaker_permissions()),
            emergency_contact_name=caretaker_data['emergency_contact_name'],
            emergency_contact_phone=caretaker_data['emergency_contact_phone'],
            is_active=True,
            created_by_id=landlord.user_id
        )
        
        # 6. Send welcome email with temporary password
        send_notification.delay(
            recipient_id=user.id,
            notification_type='caretaker_welcome',
            channel='email',
            context={
                'first_name': user.first_name,
                'hostel_name': hostel.name,
                'landlord_name': landlord.company_name or landlord.user.get_full_name(),
                'temporary_password': temp_password,
                'login_url': 'https://rumi.co.ke/login'
            }
        )
        
        # 7. Log activity
        UserActivityLog.objects.create(
            user=landlord.user,
            action_type='caretaker_created',
            action_description=f"Created caretaker for hostel {hostel.name}",
            metadata={
                'caretaker_user_id': user.id,
                'hostel_id': hostel_id
            }
        )
    
    return caretaker_profile


def get_default_caretaker_permissions():
    """
    Default permissions for new caretakers
    """
    return {
        'can_view_student_payments': True,
        'can_view_payment_amounts': True,
        'can_create_inventory_templates': True,
        'can_verify_check_ins': True,
        'can_verify_check_outs': True,
        'can_create_damage_reports': True,
        'can_approve_room_transfers': True,
        'can_view_financial_reports': False
    }
```

---

### 4.4 Profile Completion Check

**Student Profile Completion:**
```python
def is_student_profile_complete(student_profile):
    """
    Check if student can book rooms
    """
    user = student_profile.user
    
    required_fields = [
        student_profile.university,
        student_profile.student_id_number,
        student_profile.year_of_study,
        user.phone_number,
        student_profile.emergency_contact_name,
        student_profile.emergency_contact_phone
    ]
    
    all_filled = all(required_fields)
    
    # Update cached flag
    if student_profile.is_profile_complete != all_filled:
        student_profile.is_profile_complete = all_filled
        student_profile.save(update_fields=['is_profile_complete'])
    
    return all_filled
```

**Landlord Profile Completion:**
```python
def can_landlord_list_hostels(landlord_profile):
    """
    Check if landlord can create hostel listings
    """
    profile_complete = all([
        landlord_profile.user.phone_number,
        landlord_profile.national_id,
        landlord_profile.bank_name,
        landlord_profile.bank_account_number,
        landlord_profile.bank_code
    ])
    
    return landlord_profile.is_verified and profile_complete
```

---

### 4.5 Compatibility Score Trigger

**Update Lifestyle Preferences:**
```python
from celery import shared_task

@shared_task
def update_compatibility_scores_for_student(student_id):
    """
    Recalculate compatibility scores when student updates preferences
    """
    student = StudentProfile.objects.get(id=student_id)
    
    # Get all other students with preferences
    other_students = StudentProfile.objects.filter(
        user__is_active=True,
        lifestyle_preferences__isnull=False
    ).exclude(id=student_id).exclude(lifestyle_preferences={})
    
    updated_count = 0
    
    for other_student in other_students:
        # Ensure canonical ordering (a < b)
        student_a_id = min(student.id, other_student.id)
        student_b_id = max(student.id, other_student.id)
        
        # Calculate new score
        score = calculate_compatibility_score(student, other_student)
        factors = calculate_score_factors(student, other_student)
        
        # Update or create score
        from hostels.models import CompatibilityScore
        CompatibilityScore.objects.update_or_create(
            student_a_id=student_a_id,
            student_b_id=student_b_id,
            defaults={
                'score': score,
                'factors': factors,
                'calculated_at': timezone.now()
            }
        )
        
        updated_count += 1
    
    return {
        'student_id': student_id,
        'updated_scores': updated_count
    }


def calculate_compatibility_score(student_a, student_b):
    """
    Calculate overall compatibility score (0-100)
    """
    prefs_a = student_a.lifestyle_preferences
    prefs_b = student_b.lifestyle_preferences
    
    if not prefs_a or not prefs_b:
        return 50  # Neutral score if preferences missing
    
    factors = calculate_score_factors(student_a, student_b)
    total_score = sum(factors.values())
    
    return total_score


def calculate_score_factors(student_a, student_b):
    """
    Return detailed breakdown of compatibility factors
    """
    prefs_a = student_a.lifestyle_preferences or {}
    prefs_b = student_b.lifestyle_preferences or {}
    
    factors = {}
    
    # Sleep schedule (20 points)
    if prefs_a.get('sleep_schedule') == prefs_b.get('sleep_schedule'):
        factors['sleep_schedule_match'] = 20
    elif 'flexible' in [prefs_a.get('sleep_schedule'), prefs_b.get('sleep_schedule')]:
        factors['sleep_schedule_match'] = 10
    else:
        factors['sleep_schedule_match'] = 0
    
    # Cleanliness (25 points)
    clean_a = prefs_a.get('cleanliness', 3)
    clean_b = prefs_b.get('cleanliness', 3)
    clean_diff = abs(clean_a - clean_b)
    factors['cleanliness_match'] = max(0, 25 - (clean_diff * 6))
    
    # Noise tolerance (15 points)
    noise_a = prefs_a.get('noise_tolerance', 3)
    noise_b = prefs_b.get('noise_tolerance', 3)
    noise_diff = abs(noise_a - noise_b)
    factors['noise_tolerance_match'] = max(0, 15 - (noise_diff * 4))
    
    # Smoking (20 points)
    if prefs_a.get('smoking') == prefs_b.get('smoking'):
        factors['smoking_match'] = 20
    else:
        factors['smoking_match'] = 0
    
    # Social level (10 points)
    social_a = prefs_a.get('social_level', 3)
    social_b = prefs_b.get('social_level', 3)
    social_diff = abs(social_a - social_b)
    factors['social_level_match'] = max(0, 10 - (social_diff * 2))
    
    # Pets (10 points)
    if prefs_a.get('pets') == prefs_b.get('pets'):
        factors['pets_match'] = 10
    else:
        factors['pets_match'] = 0
    
    return factors
```

---

### 4.6 Landlord Verification and Paystack Setup

**Verification Workflow:**
```python
def verify_landlord(landlord_id, admin_id):
    """
    Approve landlord and create Paystack subaccount
    """
    with transaction.atomic():
        landlord = LandlordProfile.objects.select_for_update().get(id=landlord_id)
        
        # 1. Update verification status
        landlord.is_verified = True
        landlord.verified_at = timezone.now()
        landlord.verified_by_id = admin_id
        landlord.save()
        
        # 2. Create Paystack subaccount
        try:
            subaccount = create_paystack_subaccount(landlord)
            landlord.paystack_subaccount_code = subaccount['subaccount_code']
            landlord.save()
        except Exception as e:
            logger.error(f"Failed to create Paystack subaccount for landlord {landlord_id}: {e}")
            # Rollback verification if Paystack fails
            raise
        
        # 3. Send approval notification
        send_notification.delay(
            recipient_id=landlord.user_id,
            notification_type='landlord_verified',
            channel='email',
            context={
                'landlord_name': landlord.company_name or landlord.user.get_full_name(),
                'verified_at': timezone.now().isoformat()
            }
        )
        
        # 4. Log activity
        admin_user = User.objects.get(id=admin_id)
        UserActivityLog.objects.create(
            user=admin_user,
            action_type='landlord_verified',
            action_description=f"Verified landlord: {landlord.user.email}",
            metadata={'landlord_id': landlord_id}
        )
        
        return landlord


def create_paystack_subaccount(landlord):
    """
    Create Paystack subaccount for landlord payouts
    """
    from paystackapi.paystack import Paystack
    
    paystack = Paystack(secret_key=settings.PAYSTACK_SECRET_KEY)
    
    response = paystack.subaccount.create(
        business_name=landlord.company_name or landlord.user.get_full_name(),
        settlement_bank=landlord.bank_code,
        account_number=landlord.bank_account_number,
        percentage_charge=0,  # Using transaction_charge parameter instead
        primary_contact_email=landlord.user.email,
        primary_contact_name=landlord.user.get_full_name(),
        primary_contact_phone=landlord.user.phone_number
    )
    
    return response['data']
```

---

## 5. Security Implementation

### 5.1 Password Security

**Password Validation:**
```python
import re
from django.core.exceptions import ValidationError

def validate_password_strength(password):
    """
    Enforce strong password requirements
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    # Check against common passwords
    common_passwords = [
        'password', '12345678', 'qwerty123', 'password123',
        'admin123', 'letmein', 'welcome', 'monkey123'
    ]
    if password.lower() in common_passwords:
        errors.append("Password is too common")
    
    if errors:
        raise ValidationError(errors)
    
    return True
```

**Password Hashing Configuration:**
```python
# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',  # Most secure (recommended)
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]
```

---

### 5.2 JWT Authentication

**Token Configuration:**
```python
# settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

**Custom JWT Claims:**
```python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        
        return token
```

---

### 5.3 Role-Based Access Control (RBAC)

**Permission Classes:**
```python
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
        except:
            return False
```

**Granular Caretaker Permissions:**
```python
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
        except:
            return False


class CanViewStudentPayments(HasCaretakerPermission):
    required_permission = 'can_view_student_payments'


class CanCreateInventoryTemplates(HasCaretakerPermission):
    required_permission = 'can_create_inventory_templates'


class CanVerifyCheckIns(HasCaretakerPermission):
    required_permission = 'can_verify_check_ins'
```

---

### 5.4 Rate Limiting

**Login Attempt Limiting:**
```python
from django.core.cache import cache

def check_login_rate_limit(email):
    """
    Check if user has exceeded login attempts
    """
    cache_key = f"login_attempts:{email}"
    attempts = cache.get(cache_key, 0)
    
    if attempts >= 5:
        raise PermissionDenied(
            "Too many failed login attempts. Please try again in 15 minutes."
        )
    
    return True


def log_failed_login_attempt(email, ip_address):
    """
    Increment failed login counter
    """
    cache_key = f"login_attempts:{email}"
    attempts = cache.get(cache_key, 0)
    cache.set(cache_key, attempts + 1, timeout=900)  # 15-minute timeout
    
    # Log to activity log (without user_id since login failed)
    UserActivityLog.objects.create(
        user_id=None,
        action_type='failed_login',
        action_description=f"Failed login attempt for: {email}",
        ip_address=ip_address
    )


def reset_login_rate_limit(email):
    """
    Reset counter after successful login
    """
    cache_key = f"login_attempts:{email}"
    cache.delete(cache_key)
```

**OTP Request Limiting:**
```python
def check_otp_rate_limit(email):
    """
    Limit OTP requests to 3 per 15 minutes
    """
    cache_key = f"otp_requests:{email}"
    requests = cache.get(cache_key, 0)
    
    if requests >= 3:
        raise PermissionDenied(
            "Too many OTP requests. Please try again in 15 minutes."
        )
    
    cache.set(cache_key, requests + 1, timeout=900)
    return True
```

---

### 5.5 Disposable Email Detection

```python
# List of known disposable email domains (maintain in database or config)
DISPOSABLE_EMAIL_DOMAINS = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'throwaway.email', 'temp-mail.org',
    'fakeinbox.com', 'sharklasers.com', 'getnada.com'
]

def is_disposable_email(email):
    """
    Check if email is from a disposable email provider
    """
    domain = email.split('@')[1].lower()
    return domain in DISPOSABLE_EMAIL_DOMAINS
```

---

## 6. Performance and Caching

### 6.1 Profile Caching

**Cache User Profile:**
```python
from django.core.cache import cache

def get_user_profile(user_id):
    """
    Get user profile with caching
    """
    cache_key = f"user:profile:{user_id}"
    cached_profile = cache.get(cache_key)
    
    if cached_profile:
        return cached_profile
    
    # Fetch from database
    user = User.objects.select_related(
        'student_profile',
        'landlord_profile',
        'caretaker_profile__hostel'
    ).get(id=user_id)
    
    profile_data = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'profile': get_role_specific_profile(user)
    }
    
    # Cache for 10 minutes
    cache.set(cache_key, profile_data, timeout=600)
    
    return profile_data


def invalidate_user_profile_cache(user_id):
    """
    Clear profile cache after updates
    """
    cache_key = f"user:profile:{user_id}"
    cache.delete(cache_key)
```

---

### 6.2 Database Query Optimization

**Efficient Profile Retrieval:**
```python
# BAD: N+1 query problem
user = User.objects.get(id=user_id)
profile = user.student_profile  # Additional query

# GOOD: Use select_related
user = User.objects.select_related('student_profile').get(id=user_id)
profile = user.student_profile  # No additional query

# BETTER: Fetch only needed fields
user = User.objects.select_related('student_profile').only(
    'id', 'email', 'first_name', 'last_name', 'role',
    'student_profile__university', 'student_profile__year_of_study'
).get(id=user_id)
```

---

## 7. Integration Points

### 7.1 With notifications App

**Trigger Notifications:**
```python
# Registration email verification
send_notification.delay(
    recipient_id=user.id,
    notification_type='email_verification',
    channel='email',
    context={'otp_code': otp.otp_code}
)

# Welcome email after verification
send_notification.delay(
    recipient_id=user.id,
    notification_type='welcome',
    channel='email',
    context={'first_name': user.first_name}
)

# Landlord verification approval
send_notification.delay(
    recipient_id=landlord.user_id,
    notification_type='landlord_verified',
    channel='email',
    context={'company_name': landlord.company_name}
)

# Caretaker account creation
send_notification.delay(
    recipient_id=caretaker.user_id,
    notification_type='caretaker_welcome',
    channel='email',
    context={
        'first_name': caretaker.user.first_name,
        'temporary_password': temp_password
    }
)
```

---

### 7.2 With hostels App

**Profile Completion Check Before Booking:**
```python
# In hostels/views.py
def create_room_reservation(request, room_id):
    student = request.user.student_profile
    
    # Check profile completion
    if not student.is_profile_complete:
        return Response({
            'error': 'Please complete your profile before booking',
            'required_fields': [
                'university', 'student_id_number', 'year_of_study',
                'phone_number', 'emergency_contact'
            ],
            'profile_completion_url': '/api/v1/accounts/profile'
        }, status=400)
    
    # Proceed with reservation...
```

**Caretaker Access Control:**
```python
# In hostels/views.py
def get_student_payment_status(request, booking_id):
    """
    Caretaker viewing student payment status
    """
    # Verify caretaker has permission
    if request.user.role == 'caretaker':
        caretaker = request.user.caretaker_profile
        
        if not caretaker.permissions.get('can_view_student_payments'):
            return Response({
                'error': 'You do not have permission to view student payments'
            }, status=403)
        
        # Check if booking is in caretaker's hostel
        booking = Booking.objects.get(id=booking_id)
        if booking.room.hostel_id != caretaker.hostel_id:
            return Response({
                'error': 'You can only view payments for your assigned hostel'
            }, status=403)
        
        # Return payment status and amount (caretaker can see both)
        return Response({
            'booking_id': booking_id,
            'student_name': booking.student.user.get_full_name(),
            'payment_status': booking.payment_status,
            'amount_paid': float(booking.amount_paid) if caretaker.permissions.get('can_view_payment_amounts') else None,
            'balance_due': float(booking.balance_due) if caretaker.permissions.get('can_view_payment_amounts') else None
        })
```

---

### 7.3 With payments App

**Paystack Subaccount Creation:**
```python
# Called during landlord verification
from payments.services import create_paystack_subaccount

subaccount = create_paystack_subaccount(
    landlord=landlord_profile,
    business_name=landlord_profile.company_name,
    bank_code=landlord_profile.bank_code,
    account_number=landlord_profile.bank_account_number
)

landlord_profile.paystack_subaccount_code = subaccount['subaccount_code']
landlord_profile.save()
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

```python
from django.test import TestCase
from accounts.models import User, StudentProfile, CaretakerProfile

class UserRegistrationTests(TestCase):
    """Test user registration flow"""
    
    def test_user_creation_with_valid_data(self):
        """Test successful user creation"""
        user = User.objects.create_user(
            email='test@example.com',
            password='SecurePass123!',
            first_name='Test',
            last_name='User',
            phone_number='+254712345678',
            role='student'
        )
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('SecurePass123!'))
        self.assertEqual(user.role, 'student')
        self.assertFalse(user.is_verified)
        self.assertTrue(user.is_active)
    
    def test_duplicate_email_rejected(self):
        """Test that duplicate emails are rejected"""
        User.objects.create_user(
            email='test@example.com',
            password='Pass123!',
            role='student'
        )
        
        with self.assertRaises(ValidationError):
            User.objects.create_user(
                email='test@example.com',
                password='Pass456!',
                role='student'
            )
    
    def test_disposable_email_rejected(self):
        """Test disposable emails are blocked"""
        with self.assertRaises(ValidationError):
            register_user(
                email='test@tempmail.com',
                password='Pass123!',
                role='student',
                first_name='Test',
                last_name='User',
                phone_number='+254712345678'
            )
    
    def test_weak_password_rejected(self):
        """Test password strength validation"""
        with self.assertRaises(ValidationError):
            validate_password_strength('weakpass')
        
        with self.assertRaises(ValidationError):
            validate_password_strength('NoDigits!')
        
        with self.assertRaises(ValidationError):
            validate_password_strength('nouppercas3!')


class OTPVerificationTests(TestCase):
    """Test OTP generation and verification"""
    
    def test_otp_generation(self):
        """Test OTP is generated correctly"""
        user = create_test_user()
        otp = OTPVerification.objects.create(
            user=user,
            otp_code=generate_6_digit_otp(),
            verification_type='email',
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        
        self.assertEqual(len(otp.otp_code), 6)
        self.assertTrue(otp.otp_code.isdigit())
        self.assertFalse(otp.is_used)
    
    def test_otp_expiry(self):
        """Test OTP expires after timeout"""
        user = create_test_user()
        otp = OTPVerification.objects.create(
            user=user,
            otp_code='123456',
            verification_type='email',
            created_at=timezone.now() - timedelta(minutes=10),
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        
        self.assertTrue(otp.expires_at < timezone.now())
    
    def test_otp_max_attempts(self):
        """Test OTP blocks after 5 failed attempts"""
        user = create_test_user()
        otp = OTPVerification.objects.create(
            user=user,
            otp_code='123456',
            verification_type='email',
            expires_at=timezone.now() + timedelta(minutes=5),
            attempts=5
        )
        
        with self.assertRaises(ValidationError):
            verify_email(user.email, 'wrong_code', '127.0.0.1')


class CaretakerManagementTests(TestCase):
    """Test caretaker creation and management"""
    
    def test_landlord_creates_caretaker(self):
        """Test landlord can create caretaker"""
        landlord = create_test_landlord()
        hostel = create_test_hostel(landlord_id=landlord.id)
        
        caretaker_data = {
            'email': 'caretaker@example.com',
            'first_name': 'Peter',
            'last_name': 'Mwangi',
            'phone_number': '+254733456789',
            'national_id': '87654321',
            'employment_start_date': timezone.now().date(),
            'emergency_contact_name': 'Mary Mwangi',
            'emergency_contact_phone': '+254744567890'
        }
        
        caretaker = create_caretaker(landlord, hostel.id, caretaker_data)
        
        self.assertEqual(caretaker.hostel_id, hostel.id)
        self.assertEqual(caretaker.landlord_id, landlord.id)
        self.assertTrue(caretaker.is_active)
        self.assertEqual(caretaker.user.role, 'caretaker')
    
    def test_one_caretaker_per_hostel(self):
        """Test hostel can only have one active caretaker"""
        landlord = create_test_landlord()
        hostel = create_test_hostel(landlord_id=landlord.id)
        
        # Create first caretaker
        create_caretaker(landlord, hostel.id, {...})
        
        # Attempt to create second caretaker for same hostel
        with self.assertRaises(ValidationError):
            create_caretaker(landlord, hostel.id, {...})
```

---

### 8.2 Integration Tests

```python
class RegistrationAPITests(APITestCase):
    """Test registration API endpoints"""
    
    def test_full_registration_flow(self):
        """Test complete registration to verification"""
        # 1. Register
        response = self.client.post('/api/v1/accounts/register', {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'confirm_password': 'SecurePass123!',
            'role': 'student',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+254712345678'
        })
        
        self.assertEqual(response.status_code, 201)
        user_id = response.data['user_id']
        
        # 2. Get OTP from database
        user = User.objects.get(id=user_id)
        otp = OTPVerification.objects.filter(user=user).first()
        
        # 3. Verify email
        response = self.client.post('/api/v1/accounts/verify-email', {
            'email': 'test@example.com',
            'otp_code': otp.otp_code
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        
        # 4. Verify user is now verified
        user.refresh_from_database()
        self.assertTrue(user.is_verified)


class AuthenticationAPITests(APITestCase):
    """Test login and JWT generation"""
    
    def test_login_with_valid_credentials(self):
        """Test successful login"""
        user = create_test_user(
            email='test@example.com',
            password='SecurePass123!',
            is_verified=True
        )
        
        response = self.client.post('/api/v1/accounts/login', {
            'email': 'test@example.com',
            'password': 'SecurePass123!'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        
        # Verify activity log created
        log = UserActivityLog.objects.filter(
            user=user,
            action_type='login'
        ).first()
        self.assertIsNotNone(log)
    
    def test_login_with_invalid_credentials(self):
        """Test login failure with wrong password"""
        user = create_test_user(
            email='test@example.com',
            password='SecurePass123!'
        )
        
        response = self.client.post('/api/v1/accounts/login', {
            'email': 'test@example.com',
            'password': 'WrongPassword!'
        })
        
        self.assertEqual(response.status_code, 401)
        
        # Verify failed attempt logged
        log = UserActivityLog.objects.filter(
            user=user,
            action_type='failed_login'
        ).first()
        self.assertIsNotNone(log)
    
    def test_login_rate_limiting(self):
        """Test account lockout after 5 failed attempts"""
        user = create_test_user(email='test@example.com')
        
        # Make 5 failed attempts
        for i in range(5):
            self.client.post('/api/v1/accounts/login', {
                'email': 'test@example.com',
                'password': 'WrongPassword!'
            })
        
        # 6th attempt should be blocked
        response = self.client.post('/api/v1/accounts/login', {
            'email': 'test@example.com',
            'password': 'WrongPassword!'
        })
        
        self.assertEqual(response.status_code, 429)
        self.assertIn('Too many failed login attempts', response.data['error'])
```

---

## 9. Migration Strategy

### 9.1 Initial Migration

```bash
# Create migrations
python manage.py makemigrations accounts

# Review migration file
cat accounts/migrations/0001_initial.py

# Apply migrations
python manage.py migrate accounts

# Verify tables created
python manage.py dbshell
\dt accounts_*
```

---

### 9.2 Data Seeding (Development)

```python
# accounts/management/commands/seed_users.py
from django.core.management.base import BaseCommand
from accounts.models import User, StudentProfile, LandlordProfile, CaretakerProfile

class Command(BaseCommand):
    help = 'Seed user test data'
    
    def handle(self, *args, **options):
        # Create super admin
        if not User.objects.filter(email='admin@rumi.co.ke').exists():
            admin = User.objects.create_superuser(
                email='admin@rumi.co.ke',
                password='AdminPass123!',
                first_name='Super',
                last_name='Admin',
                phone_number='+254700000000',
                role='super_admin'
            )
            admin.is_verified = True
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Created super admin: {admin.email}'))
        
        # Create tech support admin
        if not User.objects.filter(email='support@rumi.co.ke').exists():
            tech_admin = User.objects.create_user(
                email='support@rumi.co.ke',
                password='SupportPass123!',
                first_name='Tech',

---

---

## 13. Google OAuth 2.0 Authentication (NEW in v2.0)

### 13.1 Overview

Google OAuth provides secure, password-less authentication for users. This reduces API usage for email verification and simplifies the user experience.

**Benefits:**
- ✅ No password to remember
- ✅ Instant email verification (Google-verified)
- ✅ Reduced email API usage
- ✅ Faster onboarding
- ✅ Enhanced security (Google's 2FA)
- ✅ Auto-populated profile data

---

### 13.2 OAuth Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Google OAuth consent screen
   ↓
3. User grants permission
   ↓
4. Google redirects back with authorization code
   ↓
5. Backend exchanges code for access token
   ↓
6. Fetch user info from Google
   ↓
7. Create/update user account
   ↓
8. Generate JWT tokens
   ↓
9. Return tokens to frontend
```

---

### 13.3 Required Setup

**Google Cloud Console Configuration:**

1. Create Project at https://console.cloud.google.com
2. Enable Google+ API
3. Configure OAuth Consent Screen:
   - App name: "RUMI Platform"
   - Support email: support@rumi.co.ke
   - Scopes: email, profile, openid
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - http://localhost:3000/auth/google/callback (dev)
     - https://rumi.co.ke/auth/google/callback (prod)
5. Save Client ID and Client Secret

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

---

### 13.4 Backend Implementation

**Models Update:**
```python
class User(AbstractBaseUser, PermissionsMixin):
    # Existing fields...
    
    # OAuth fields (NEW)
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=[('email', 'Email/Password'), ('google', 'Google OAuth')],
        default='email'
    )
    is_oauth_user = models.BooleanField(default=False)
```

**API Endpoints:**

#### POST `/api/v1/accounts/auth/google/`
Exchange Google authorization code for JWT tokens

**Request:**
```json
{
  "code": "google_authorization_code",
  "role": "landlord"
}
```

**Response (200):**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "id": 123,
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "landlord",
    "is_verified": true,
    "auth_provider": "google",
    "profile_picture": "https://lh3.googleusercontent.com/..."
  },
  "is_new_user": false
}
```

**Backend Logic:**
```python
import requests
from django.conf import settings

def google_oauth_login(authorization_code, role):
    """
    Authenticate user via Google OAuth
    """
    # 1. Exchange code for access token
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': authorization_code,
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    token_response = requests.post(token_url, data=token_data)
    tokens = token_response.json()
    
    # 2. Fetch user info from Google
    user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
    headers = {'Authorization': f"Bearer {tokens['access_token']}"}
    user_info_response = requests.get(user_info_url, headers=headers)
    user_info = user_info_response.json()
    
    # 3. Create or update user
    google_id = user_info['id']
    email = user_info['email']
    
    try:
        # Check if user exists by Google ID
        user = User.objects.get(google_id=google_id)
        is_new_user = False
    except User.DoesNotExist:
        # Check if user exists by email
        try:
            user = User.objects.get(email=email)
            # Link Google account
            user.google_id = google_id
            user.auth_provider = 'google'
            user.is_oauth_user = True
            user.is_verified = True  # Google-verified
            user.save()
            is_new_user = False
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create(
                email=email,
                google_id=google_id,
                first_name=user_info.get('given_name', ''),
                last_name=user_info.get('family_name', ''),
                role=role,
                auth_provider='google',
                is_oauth_user=True,
                is_verified=True,
                profile_picture=user_info.get('picture')
            )
            
            # Create role-specific profile
            if role == 'student':
                StudentProfile.objects.create(user=user)
            elif role == 'landlord':
                LandlordProfile.objects.create(user=user)
                # Subscription and feature access auto-created by signal
            
            is_new_user = True
    
    # 4. Generate JWT tokens
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    
    # 5. Log activity
    UserActivityLog.objects.create(
        user=user,
        action_type='login',
        action_description='Google OAuth login',
        metadata={'is_new_user': is_new_user}
    )
    
    return {
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': user,
        'is_new_user': is_new_user
    }
```

---

### 13.5 Frontend Integration

**React Example:**
```typescript
// src/services/googleAuth.ts
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

export const initiateGoogleLogin = (role: 'student' | 'landlord') => {
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'offline',
    state: role, // Pass role in state
    prompt: 'consent'
  });
  
  window.location.href = `${googleAuthUrl}?${params.toString()}`;
};

export const handleGoogleCallback = async (code: string, role: string) => {
  const response = await fetch('/api/v1/accounts/auth/google/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, role })
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data;
};
```

**Button Component:**
```tsx
// src/components/auth/GoogleLoginButton.tsx
import { FcGoogle } from 'react-icons/fc';

interface Props {
  role: 'student' | 'landlord';
}

export const GoogleLoginButton = ({ role }: Props) => {
  const handleClick = () => {
    initiateGoogleLogin(role);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 
                 border-2 border-gray-300 rounded-lg hover:bg-gray-50 
                 transition-colors"
    >
      <FcGoogle className="text-2xl" />
      <span className="font-medium">Continue with Google</span>
    </button>
  );
};
```

---

### 13.6 Security Considerations

**State Parameter Validation:**
- Always validate state parameter matches expected value
- Prevents CSRF attacks

**Token Storage:**
- Store Google ID for future logins
- Never store Google access tokens long-term
- Use database lookup for subsequent logins

**Email Verification:**
- Google-authenticated users are auto-verified
- Skip OTP flow for OAuth users
- Trust Google's email verification

**Account Linking:**
- If email exists, link Google account
- Prevent duplicate accounts
- Maintain single user record per email

---


## 12. Subscription Management System (NEW in v2.0)

### 12.1 Subscription Business Logic

**Automatic Trial Creation:**
When a landlord registers, the system automatically:
1. Creates a 30-day free trial subscription
2. Enables all features (unlimited access)
3. Sets trial expiry date
4. Creates feature access record

**Trial to Paid Transition:**
```python
def handle_trial_expiry(landlord_subscription):
    """
    Handle trial expiration - require plan selection
    """
    if landlord_subscription.is_trial_active():
        days_remaining = (landlord_subscription.trial_end - timezone.now().date()).days
        
        # Send reminder 7 days before trial ends
        if days_remaining == 7:
            send_notification.delay(
                recipient_id=landlord_subscription.landlord.user_id,
                notification_type='trial_ending_soon',
                channel='email',
                context={
                    'landlord_name': landlord_subscription.landlord.company_name,
                    'days_remaining': 7,
                    'plans_url': 'https://rumi.co.ke/subscriptions/plans'
                }
            )
        
        # On trial expiry
        if days_remaining <= 0:
            landlord_subscription.status = 'expired'
            landlord_subscription.save()
            
            # Disable premium features
            feature_access = landlord_subscription.landlord.feature_access
            feature_access.disable_all_premium_features()
            
            send_notification.delay(
                recipient_id=landlord_subscription.landlord.user_id,
                notification_type='trial_expired',
                channel='email',
                context={
                    'landlord_name': landlord_subscription.landlord.company_name,
                    'upgrade_url': 'https://rumi.co.ke/subscriptions/upgrade'
                }
            )
```

---

### 12.2 Revenue-Based Billing (Medium Plan)

**Monthly Calculation Process:**
```python
from celery import shared_task
from django.db.models import Sum
from payments.models import Transaction

@shared_task
def calculate_medium_plan_fees():
    """
    Calculate subscription fees for Medium plan landlords
    Runs on 1st day of each month
    """
    # Get all active Medium plan subscriptions
    medium_subscriptions = LandlordSubscription.objects.filter(
        plan__plan_type='medium',
        status='active'
    ).select_related('landlord', 'plan')
    
    for subscription in medium_subscriptions:
        # Calculate total rent collected in previous month
        period_start = subscription.current_period_start
        period_end = subscription.current_period_end
        
        total_rent = Transaction.objects.filter(
            landlord=subscription.landlord,
            status='success',
            paid_at__date__gte=period_start,
            paid_at__date__lte=period_end
        ).aggregate(
            total=Sum('base_rent')
        )['total'] or Decimal('0.00')
        
        # Calculate 1% subscription fee
        subscription_fee = total_rent * Decimal('0.01')
        
        # Update subscription
        subscription.total_rent_collected_this_period = total_rent
        subscription.calculated_fee_this_period = subscription_fee
        subscription.save()
        
        # Create subscription payment record
        if subscription_fee > 0:
            payment = SubscriptionPayment.objects.create(
                subscription=subscription,
                amount=subscription_fee,
                billing_period_start=period_start,
                billing_period_end=period_end,
                rent_revenue_amount=total_rent,
                transaction_reference=f"SUB-MED-{subscription.id}",
                status='pending'
            )
            
            # Send payment notification
            send_notification.delay(
                recipient_id=subscription.landlord.user_id,
                notification_type='subscription_payment_due',
                channel='email',
                context={
                    'landlord_name': subscription.landlord.company_name,
                    'amount': float(subscription_fee),
                    'rent_collected': float(total_rent),
                    'percentage': '1%',
                    'due_date': subscription.next_billing_date,
                    'payment_link': f'/api/v1/accounts/subscriptions/payments/initiate/'
                }
            )
```

**Benefits of 1% Revenue Model:**
- Small hostel collecting KES 50,000/month → Pays KES 500 subscription
- Medium hostel collecting KES 300,000/month → Pays KES 3,000 subscription
- Large hostel collecting KES 1,000,000/month → Pays KES 10,000 subscription
- **Fair for all sizes** - you only pay when you earn!

---

### 12.3 Feature Access Control

**Permission Decorator:**
```python
from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def require_feature(feature_name):
    """
    Decorator to check if landlord has access to feature
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if request.user.role != 'landlord':
                return view_func(request, *args, **kwargs)
            
            try:
                feature_access = request.user.landlord_profile.feature_access
                feature_field = f"can_{feature_name}"
                
                if not hasattr(feature_access, feature_field):
                    return Response({
                        'error': 'Invalid feature check'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                if not getattr(feature_access, feature_field):
                    subscription = request.user.landlord_profile.subscription
                    return Response({
                        'error': 'Feature not available in your plan',
                        'feature': feature_name.replace('_', ' ').title(),
                        'current_plan': subscription.plan.name,
                        'upgrade_required': True,
                        'upgrade_url': '/api/v1/accounts/subscriptions/plans/'
                    }, status=status.HTTP_402_PAYMENT_REQUIRED)
                
                return view_func(request, *args, **kwargs)
                
            except Exception as e:
                return Response({
                    'error': 'Feature access check failed',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return wrapped
    return decorator
```

**Usage Example:**
```python
# In hostels/views.py
from accounts.decorators import require_feature

class AdvancedAnalyticsView(APIView):
    permission_classes = [IsLandlord]
    
    @require_feature('view_advanced_analytics')
    def get(self, request):
        """Get advanced analytics - requires Medium or Advanced plan"""
        # Feature access already validated by decorator
        analytics_data = generate_advanced_analytics(request.user.landlord_profile)
        return Response(analytics_data)
```

---

### 12.4 Subscription API Endpoints

**Base URL:** `/api/v1/accounts/subscriptions/`

#### GET `/plans/`
List all available subscription plans

**Response:**
```json
{
  "plans": [
    {
      "name": "Basic Plan",
      "price_display": "KES 10,000/mo",
      "features": {...}
    }
  ]
}
```

#### GET `/my-subscription/`
Get landlord's current subscription

**Authentication:** Required (Landlord)

**Response:**
```json
{
  "subscription": {
    "status": "trial",
    "days_until_billing": 10,
    "subscription_amount": 0.0
  },
  "features": {
    "active_features": ["Create Hostels", "AI Features"]
  },
  "is_trial": true
}
```

#### POST `/upgrade/`
Upgrade or downgrade subscription plan

**Request:**
```json
{
  "new_plan_id": "uuid",
  "immediate": false
}
```

#### POST `/cancel/`
Cancel subscription

**Request:**
```json
{
  "reason": "Cost concerns",
  "immediate": false
}
```

#### GET `/payments/history/`
View payment history

#### POST `/payments/initiate/`
Initialize subscription payment

#### GET `/features/{feature_name}/`
Check specific feature access

---

### 12.5 Subscription Lifecycle

```
Registration → Auto Trial (30 days) → Choose Plan → Active → Renewal/Cancel
     ↓              ↓                      ↓          ↓           ↓
  Create       All Features         Monthly     Auto-renew   Grace Period
  Account        Enabled            Billing     or Manual    (7 days)
```

**States:**
- `trial` - Free 30-day trial with all features
- `active` - Paid subscription active
- `past_due` - Payment failed, grace period active
- `cancelled` - User cancelled, access until period end
- `expired` - Trial or subscription ended

---

### 12.6 Integration with Payment System

**No More Transaction Commissions!**

**Old Model (v1.x):**
```
Student pays: Rent + 1% = KES 5,050
Landlord gets: Rent - 2% = KES 4,900
Platform earns: 3% per transaction
```

**New Model (v2.0):**
```
Student pays: Rent + 0% = KES 5,000 (NO FEES!)
Landlord gets: Rent - 0% = KES 5,000 (FULL AMOUNT!)
Platform earns: Subscription fees only

- Basic: KES 10,000/month
- Medium: 1% of rent (auto-calculated)
- Advanced: KES 9,999/month
```

**Benefits:**
- ✅ Transparent pricing
- ✅ No hidden transaction fees
- ✅ Predictable costs
- ✅ Fair for all hostel sizes
- ✅ Students save money
- ✅ Landlords keep more revenue

                last_name='Support',
                phone_number='+254700000001',
                role='tech_support'
            )
            tech_admin.is_verified = True
            tech_admin.save()
            self.stdout.write(self.style.SUCCESS(f'Created tech support: {tech_admin.email}'))
        
        # Create students
        for i in range(10):
            email = f'student{i+1}@example.com'
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email,
                    password='StudentPass123!',
                    first_name=f'Student{i+1}',
                    last_name='Test',
                    phone_number=f'+25471234567{i}',
                    role='student'
                )
                user.is_verified = True
                user.save()
                
                StudentProfile.objects.create(
                    user=user,
                    university='University of Nairobi',
                    student_id_number=f'J17/1234{i}/2021',
                    year_of_study=(i % 4) + 1,
                    course='Computer Science',
                    lifestyle_preferences={
                        'sleep_schedule': 'early_bird' if i % 2 == 0 else 'night_owl',
                        'cleanliness': (i % 5) + 1,
                        'noise_tolerance': (i % 5) + 1,
                        'smoking': False,
                        'pets': i % 3 == 0,
                        'social_level': (i % 5) + 1,
                        'dietary_restrictions': ['none']
                    },
                    emergency_contact_name='Parent Name',
                    emergency_contact_phone=f'+25472234567{i}',
                    emergency_contact_relationship='Parent',
                    is_profile_complete=True
                )
                
                self.stdout.write(self.style.SUCCESS(f'Created student: {user.email}'))
        
        # Create landlords
        for i in range(3):
            email = f'landlord{i+1}@example.com'
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email,
                    password='LandlordPass123!',
                    first_name=f'Landlord{i+1}',
                    last_name='Properties',
                    phone_number=f'+25472234567{i}',
                    role='landlord'
                )
                user.is_verified = True
                user.save()
                
                LandlordProfile.objects.create(
                    user=user,
                    company_name=f'Test Properties {i+1}',
                    national_id=f'1234567{i}',
                    business_address=f'{i+1} Business Park, Nairobi',
                    bank_name='Equity Bank',
                    bank_account_number=f'123456789{i}',
                    bank_code='68',
                    is_verified=True,
                    verified_at=timezone.now()
                )
                
                self.stdout.write(self.style.SUCCESS(f'Created landlord: {user.email}'))
```

**Run seeding:**
```bash
python manage.py seed_users
```

---

## 10. Celery Tasks (Async Operations)

### 10.1 OTP Cleanup Task

```python
# accounts/tasks.py
from celery import shared_task
from django.utils import timezone
from accounts.models import OTPVerification, PasswordResetToken

@shared_task
def cleanup_expired_otps():
    """
    Delete OTP records older than 24 hours
    """
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    deleted_count = OTPVerification.objects.filter(
        created_at__lt=cutoff_time
    ).delete()[0]
    
    return {
        'deleted_otps': deleted_count,
        'cutoff_time': cutoff_time.isoformat()
    }


@shared_task
def cleanup_expired_password_reset_tokens():
    """
    Delete password reset tokens older than 7 days
    """
    cutoff_time = timezone.now() - timedelta(days=7)
    
    deleted_count = PasswordResetToken.objects.filter(
        created_at__lt=cutoff_time
    ).delete()[0]
    
    return {
        'deleted_tokens': deleted_count,
        'cutoff_time': cutoff_time.isoformat()
    }
```

**Celery Beat Schedule:**
```python
# settings.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'cleanup-expired-otps': {
        'task': 'accounts.tasks.cleanup_expired_otps',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'cleanup-expired-reset-tokens': {
        'task': 'accounts.tasks.cleanup_expired_password_reset_tokens',
        'schedule': crontab(hour=2, minute=30),  # Daily at 2:30 AM
    },
}
```

---

### 10.2 Activity Log Partitioning Task

```python
@shared_task
def create_activity_log_partition():
    """
    Create new partition for next month's activity logs
    """
    from django.db import connection
    
    next_month = timezone.now() + timedelta(days=32)
    partition_name = f"accounts_useractivitylog_{next_month.year}_{next_month.month:02d}"
    
    with connection.cursor() as cursor:
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {partition_name} 
            PARTITION OF accounts_useractivitylog
            FOR VALUES FROM ('{next_month.year}-{next_month.month:02d}-01') 
            TO ('{next_month.year}-{(next_month.month % 12) + 1:02d}-01');
        """)
    
    return {
        'partition_created': partition_name,
        'for_month': next_month.strftime('%Y-%m')
    }
```

**Schedule:** Run on the 25th of each month to create next month's partition

---

## 11. API Response Examples

### 11.1 Error Response Format

**Standardized Error Structure:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Email already registered"],
      "password": ["Password must contain at least one uppercase letter"]
    },
    "timestamp": "2025-11-05T10:30:00Z",
    "request_id": "req_abc123xyz"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_FAILED`: Invalid credentials
- `PERMISSION_DENIED`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Entity doesn't exist
- `CONFLICT`: Resource conflict (e.g., duplicate email)

---

### 11.2 Success Response Format

**Standardized Success Structure:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "user_id": 123,
    "email": "user@gmail.com"
  },
  "meta": {
    "timestamp": "2025-11-05T10:30:00Z",
    "request_id": "req_abc123xyz"
  }
}
```

---

## 12. Future Enhancements (Post-v1.7)

### 12.1 Social Authentication
- Google OAuth integration

### 12.2 Two-Factor Authentication (2FA)
- SMS-based 2FA via African Talking
- Authenticator app support (TOTP)
- Backup codes for account recovery

### 12.3 Advanced Profile Features
- Profile verification badges (verified student, verified landlord)
- Profile completion progress bar
- Profile visibility settings (public/private)
- Social media links integration
- Multiple emergency contacts

### 12.4 Account Management
- Email change workflow with verification
- Phone number verification via SMS
- Account deletion with confirmation (GDPR compliance)
- Export user data (JSON/PDF format)
- Account suspension (temporary deactivation)

### 12.5 Advanced Analytics
- User behavior tracking (login patterns, feature usage)
- Cohort analysis (student retention by university)
- Role-based usage statistics
- Geographic distribution of users

---

## 13. Compliance and Data Protection

### 13.1 Kenya Data Protection Act 2019

**User Consent Management:**
- Explicit consent checkbox during registration
- Opt-in for marketing communications
- Clear privacy policy presentation

**User Rights:**
- Right to access personal data (GET `/api/v1/accounts/profile`)
- Right to rectification (PUT `/api/v1/accounts/profile`)
- Right to erasure (DELETE `/api/v1/accounts/profile` - pending implementation)
- Right to data portability (JSON export)

**Data Breach Protocol:**
- Detect breach within 24 hours
- Notify affected users within 72 hours
- Report to Data Commissioner within 72 hours

---

### 13.2 Audit Trail Requirements

**5-Year Retention Policy:**
- All authentication events stored in `UserActivityLog`
- Table partitioned by month for efficient queries
- Automated archival to cold storage after 5 years

**Immutable Logs:**
- Append-only table (no UPDATE or DELETE allowed)
- Hash chain for tamper detection (future enhancement)

---

## 14. Deployment Considerations

### 14.1 Environment Variables

```bash
# .env.production
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=rumi.co.ke,www.rumi.co.ke

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rumi_production

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800

# Email
MAILTRAP_USERNAME=your-mailtrap-username
MAILTRAP_PASSWORD=your-mailtrap-password

# SMS
AFRICASTALKING_USERNAME=rumi
AFRICASTALKING_API_KEY=your-at-api-key

# Storage
DO_SPACES_ACCESS_KEY=your-do-spaces-key
DO_SPACES_SECRET_KEY=your-do-spaces-secret
DO_SPACES_BUCKET=rumi-production
DO_SPACES_REGION=nyc3

# Sentry
SENTRY_DSN=https://your-sentry-dsn
```

---

### 14.2 Database Indexes (Performance Critical)

```sql
-- Accounts app critical indexes
CREATE INDEX CONCURRENTLY idx_user_email ON accounts_user (email);
CREATE INDEX CONCURRENTLY idx_user_role ON accounts_user (role);
CREATE INDEX CONCURRENTLY idx_student_university ON accounts_studentprofile (university);
CREATE INDEX CONCURRENTLY idx_caretaker_hostel ON accounts_caretakerprofile (hostel_id);
CREATE INDEX CONCURRENTLY idx_activity_log_created ON accounts_useractivitylog (created_at DESC);

-- GIN indexes for JSONB
CREATE INDEX CONCURRENTLY idx_student_preferences_gin ON accounts_studentprofile USING GIN (lifestyle_preferences);
CREATE INDEX CONCURRENTLY idx_caretaker_permissions_gin ON accounts_caretakerprofile USING GIN (permissions);
```

---

## 15. Monitoring and Alerts

### 15.1 Critical Metrics to Track

**Authentication Metrics:**
- Failed login rate (alert if > 10% of attempts)
- Account lockouts per hour
- Average time to email verification
- JWT token refresh rate

**User Growth Metrics:**
- New registrations per day
- Verification completion rate
- Profile completion rate by role
- Active users (daily/weekly/monthly)

**Security Metrics:**
- Disposable email attempts blocked
- Rate limit triggers
- Password reset requests per hour
- Suspicious login attempts (unusual location/device)

---

### 15.2 Alert Configuration

**Sentry Alerts:**
```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
    send_default_pii=False,  # Don't send personally identifiable info
    environment='production',
    before_send=filter_sensitive_data,  # Custom filter
)

def filter_sensitive_data(event, hint):
    """
    Remove sensitive data from Sentry events
    """
    if 'request' in event:
        if 'data' in event['request']:
            # Remove password fields
            if 'password' in event['request']['data']:
                event['request']['data']['password'] = '[FILTERED]'
            if 'otp_code' in event['request']['data']:
                event['request']['data']['otp_code'] = '[FILTERED]'
    
    return event
```

---

## 16. Documentation Links

### 16.1 Internal Documentation
- API Documentation: `/api/v1/docs/` (Swagger UI)
- User Guides: `docs/user-guides/`
- Admin Manual: `docs/admin-manual.md`
- Deployment Guide: `docs/deployment.md`

### 16.2 External Resources
- Django Authentication: https://docs.djangoproject.com/en/4.2/topics/auth/
- JWT Best Practices: https://jwt.io/introduction
- OWASP Security Guidelines: https://owasp.org/www-project-top-ten/
- Kenya Data Protection Act: http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/2019/TheDataProtectionAct_No24of2019.pdf

---

## 17. Summary

The **Accounts App v1.7** provides a comprehensive, secure, and scalable user management system for the RUMI platform. Key features include:

 **Multi-Role Support** - 5 user roles (Student, Landlord, Caretaker, Tech Support, Super Admin)  
 **Enhanced Security** - OTP verification, JWT authentication, rate limiting, disposable email blocking  
 **Caretaker Management** - Landlords can create/manage caretakers with granular permissions  
 **Advanced RBAC** - Role-based and permission-based access control  
 **Audit Trail** - 5-year retention with monthly partitioning  
 **Profile Management** - Complete profile workflows for all roles  
 **Integration Ready** - Seamless integration with hostels, payments, and notifications apps  
 **Performance Optimized** - Caching, query optimization, and database indexing  
 **Compliance Ready** - Kenya Data Protection Act 2019 compliance  

**Next Steps:**
- Review and approve this specification
- Proceed to **Hostels.md v1.7** generation (inventory management, room transfers)

---

**Document Owner:** Joseph Ogutu, CTO  
**Last Updated:** November 7, 2025  
**Version:** 1.7 (Fresh - Complete Rewrite)  
**Status:**  Ready for Review