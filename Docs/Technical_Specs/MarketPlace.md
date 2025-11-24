# MARKETPLACE APP - Technical Specification
**RUMI Platform v1.6** 
**App Name:** `marketplace`
**Purpose:** Verified seller peer-to-peer product listing and trading platform for students (textbooks, furniture, electronics, etc.)

---

## 1. Overview and Scope

The `marketplace` app enables verified sellers to buy and sell items within the university community. It handles:
- **Seller Verification System:** Admin-approved seller registration with business details
- Product listing and management (CRUD operations) - restricted to verified sellers
- Category-based browsing and search
- Product image uploads and management
- Seller contact information reveal system
- Product view tracking and analytics
- Saved/favorited products
- **In-app messaging between buyers and sellers**
- **Social media sharing for product listings**
- **Comprehensive admin moderation tools**
- **Seller application workflow management**

### Design Philosophy
- **Verified Sellers Only:** Only tech support admin-approved sellers can list products
- **Business Registration:** Sellers must provide business details for verification
- **Student-Centric:** Only verified students can list and purchase items
- **University-Based:** Products filtered by university for local transactions
- **Safety-First:** Contact reveal system prevents spam and ensures serious buyers
- **Analytics-Driven:** Sellers can track product performance (views, favorites, contact reveals)
- **Image-Heavy:** Visual product presentation with multiple photos
- **No Payment Processing:** Platform facilitates contact only, not financial transactions
- **Real-Time Communication:** In-app chat for buyer-seller negotiations
- **Viral Growth:** Social sharing to expand marketplace reach
- **Content Moderation:** Admin tools for safe marketplace environment
- **Regulatory Compliance:** Seller verification ensures responsible marketplace participation

---

## 2. Data Models

### 2.1 SellerApplication
**Table:** `marketplace_sellerapplication`
**Purpose:** Seller registration requests awaiting admin approval

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Application identifier |
| applicant_id | INTEGER | FK → StudentProfile, NOT NULL | Student applying to become seller |
| business_name | VARCHAR(255) | NOT NULL | Registered business name |
| business_type | VARCHAR(100) | NOT NULL | Type of business (retail, services, etc.) |
| description | TEXT | NOT NULL | Business description and operations |
| contact_email | VARCHAR(254) | NOT NULL | Business contact email |
| contact_phone | VARCHAR(15) | NOT NULL | Business contact phone |
| business_address | TEXT | NOT NULL | Physical business location |
| id_document | VARCHAR(255) | NULL | ID verification document URL |
| status | VARCHAR(20) | DEFAULT 'pending' | Application status |
| submitted_at | TIMESTAMP | DEFAULT NOW() | Submission timestamp |
| reviewed_at | TIMESTAMP | NULL | Review timestamp |
| reviewed_by_id | INTEGER | FK → User (admin), NULL | Admin who reviewed |
| approval_notes | TEXT | NULL | Admin approval/rejection notes |
| rejection_reason | TEXT | NULL | Specific rejection reasons |

**Indexes:**
- `idx_seller_app_applicant` on `applicant_id` (unique active)
- `idx_seller_app_status` on `status`
- `idx_seller_app_submitted` on `submitted_at`

**Constraints:**
- `CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'))`
- `CHECK (business_type IN ('retail', 'wholesale', 'services', 'manufacturing', 'other'))`
- `UNIQUE (applicant_id, status) WHERE status IN ('pending', 'under_review', 'approved')`

**Sample Application:**
```json
{
  "id": 1,
  "applicant_id": 123,
  "business_name": "Campus Books & Supplies Ltd",
  "business_type": "retail",
  "description": "Specialized in providing textbooks, stationery, and study materials for university students",
  "contact_email": "info@campusbooks.co.ke",
  "contact_phone": "+254712345678",
  "business_address": "Shop 5, Student Center, University of Nairobi",
  "status": "pending",
  "submitted_at": "2025-11-05T10:00:00Z"
}
```

---

### 2.2 SellerProfile
**Table:** `marketplace_sellerprofile`
**Purpose:** Additional seller information for approved sellers

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Profile identifier |
| seller_id | INTEGER | FK → StudentProfile, UNIQUE, NOT NULL | Approved seller reference |
| application_id | INTEGER | FK → SellerApplication, NOT NULL | Original application |
| business_name | VARCHAR(255) | NOT NULL | Registered business name |
| business_type | VARCHAR(100) | NOT NULL | Type of business |
| description | TEXT | NOT NULL | Business description |
| contact_email | VARCHAR(254) | NOT NULL | Business contact email |
| contact_phone | VARCHAR(15) | NOT NULL | Business contact phone |
| business_address | TEXT | NOT NULL | Physical business location |
| store_banner | VARCHAR(255) | NULL | Store banner image URL |
| store_logo | VARCHAR(255) | NULL | Store logo image URL |
| social_links | JSONB | NULL | Social media profiles |
| return_policy | TEXT | NULL | Product return policy |
| shipping_policy | TEXT | NULL | Shipping/delivery policy |
| is_verified | BOOLEAN | DEFAULT TRUE | Seller verification status |
| total_products | INTEGER | DEFAULT 0 | Active product count |
| total_sales | INTEGER | DEFAULT 0 | Completed transactions |
| average_rating | DECIMAL(3,2) | NULL | Seller rating (0-5) |
| approval_date | TIMESTAMP | DEFAULT NOW() | Seller approval date |
| created_at | TIMESTAMP | DEFAULT NOW() | Profile creation |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_seller_profile_seller` UNIQUE on `seller_id`
- `idx_seller_profile_verified` on `is_verified`
- `idx_seller_profile_rating` on `average_rating`

**Constraints:**
- `CHECK (average_rating BETWEEN 0 AND 5)`
- `CHECK (business_type IN ('retail', 'wholesale', 'services', 'manufacturing', 'other'))`

**JSONB Structure for `social_links`:**
```json
{
  "website": "https://campusbooks.co.ke",
  "facebook": "https://facebook.com/campusbooks",
  "instagram": "https://instagram.com/campusbooks",
  "twitter": "https://twitter.com/campusbooks"
}
```

---

### 2.3 Category
**Table:** `marketplace_category`
**Purpose:** Product categorization for easy browsing

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Category identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Category description |
| icon | VARCHAR(50) | NULL | Icon identifier (e.g., 'book', 'laptop') |
| display_order | INTEGER | DEFAULT 0 | Sort order |
| is_active | BOOLEAN | DEFAULT TRUE | Visibility flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `idx_category_slug` on `slug` (unique)
- `idx_category_active` on `is_active`

**Sample Categories:**
```json
[
  {"name": "Textbooks & Course Materials", "slug": "textbooks", "icon": "book"},
  {"name": "Electronics", "slug": "electronics", "icon": "laptop"},
  {"name": "Furniture", "slug": "furniture", "icon": "chair"},
  {"name": "Clothing & Accessories", "slug": "clothing", "icon": "shirt"},
  {"name": "Kitchen & Appliances", "slug": "kitchen", "icon": "utensils"},
  {"name": "Sports & Fitness", "slug": "sports", "icon": "dumbbell"},
  {"name": "Stationery & Supplies", "slug": "stationery", "icon": "pencil"},
  {"name": "Other", "slug": "other", "icon": "box"}
]
```

---

### 2.4 Product
**Table:** `marketplace_product`
**Purpose:** Individual product listings by verified sellers

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Product identifier |
| seller_id | INTEGER | FK → StudentProfile, NOT NULL | Verified seller reference |
| seller_profile_id | INTEGER | FK → SellerProfile, NOT NULL | Seller profile |
| category_id | INTEGER | FK → Category, NOT NULL | Category reference |
| title | VARCHAR(200) | NOT NULL | Product name |
| description | TEXT | NOT NULL | Product details |
| price | NUMERIC(10,2) | NOT NULL | Asking price (KES) |
| condition | VARCHAR(20) | NOT NULL | Product condition |
| university | VARCHAR(255) | NOT NULL | Seller's university |
| location | VARCHAR(255) | NULL | Pickup location |
| is_negotiable | BOOLEAN | DEFAULT TRUE | Price negotiable flag |
| status | VARCHAR(20) | DEFAULT 'available' | Product status |
| view_count | INTEGER | DEFAULT 0 | Total views |
| unique_view_count | INTEGER | DEFAULT 0 | Unique viewers |
| contact_reveal_count | INTEGER | DEFAULT 0 | Contact reveals |
| favorite_count | INTEGER | DEFAULT 0 | Total favorites |
| share_count | INTEGER | DEFAULT 0 | Social shares |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured listing flag |
| is_active | BOOLEAN | DEFAULT TRUE | Listing visibility |
| created_at | TIMESTAMP | DEFAULT NOW() | Listing creation |
| updated_at | TIMESTAMP | AUTO | Last modification |
| sold_at | TIMESTAMP | NULL | Sale completion time |

**Indexes:**
- `idx_product_seller` on `seller_id`
- `idx_product_seller_profile` on `seller_profile_id`
- `idx_product_category` on `category_id`
- `idx_product_university` on `university`
- `idx_product_status` on `status`
- `idx_product_active` on `is_active WHERE is_active = TRUE`
- `idx_product_created` on `created_at DESC`
- `idx_product_price` on `price`

**Constraints:**
- `CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor'))`
- `CHECK (status IN ('available', 'reserved', 'sold'))`
- `CHECK (price > 0)`
- `CHECK (view_count >= 0)`
- `CHECK (unique_view_count >= 0)`
- `CHECK (contact_reveal_count >= 0)`
- `CHECK (share_count >= 0)`

---

### 2.5 ProductImage
**Table:** `marketplace_productimage`
**Purpose:** Multiple images per product listing

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Image identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Product reference |
| image_url | VARCHAR(255) | NOT NULL | S3/Cloudinary URL |
| display_order | INTEGER | DEFAULT 0 | Image sequence |
| is_primary | BOOLEAN | DEFAULT FALSE | Primary image flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Upload time |

**Indexes:**
- `idx_product_image_product` on `product_id`
- `idx_product_image_primary` on `(product_id, is_primary)`

**Constraints:**
- `UNIQUE (product_id, display_order)` → No duplicate order per product
- Max 5 images per product (enforced at application level)

---

### 2.6 ProductView
**Table:** `marketplace_productview`
**Purpose:** Track product views for analytics

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | View identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Viewed product |
| viewer_id | INTEGER | FK → StudentProfile, NULL | Viewer (if logged in) |
| viewer_ip | VARCHAR(45) | NULL | IP address (anonymous) |
| viewed_at | TIMESTAMP | DEFAULT NOW() | View timestamp |
| session_id | VARCHAR(100) | NULL | Browser session ID |

**Indexes:**
- `idx_product_view_product` on `product_id`
- `idx_product_view_viewer` on `viewer_id`
- `idx_product_view_date` on `viewed_at`
- `idx_product_view_unique` on `(product_id, viewer_id)` (for unique counting)

---

### 2.7 ProductFavorite
**Table:** `marketplace_productfavorite`
**Purpose:** Students can save products for later

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Favorite identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Favorited product |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | User reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Favorite time |

**Indexes:**
- `idx_favorite_product` on `product_id`
- `idx_favorite_student` on `student_id`
- `idx_favorite_unique` on `(product_id, student_id)` (unique)

**Constraints:**
- `UNIQUE (product_id, student_id)` → Can't favorite twice

---

### 2.8 ContactReveal
**Table:** `marketplace_contactreveal`
**Purpose:** Track when buyers reveal seller contact information

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Reveal identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Product reference |
| buyer_id | INTEGER | FK → StudentProfile, NOT NULL | Buyer reference |
| seller_id | INTEGER | FK → StudentProfile, NOT NULL | Seller reference |
| revealed_at | TIMESTAMP | DEFAULT NOW() | Reveal timestamp |

**Indexes:**
- `idx_contact_reveal_product` on `product_id`
- `idx_contact_reveal_buyer` on `buyer_id`
- `idx_contact_reveal_seller` on `seller_id`
- `idx_contact_reveal_unique` on `(product_id, buyer_id)` (unique)

**Constraints:**
- `UNIQUE (product_id, buyer_id)` → Can only reveal once per product

---

### 2.9 ChatConversation
**Table:** `marketplace_chatconversation`
**Purpose:** Group messages between buyer and seller about a product

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Conversation identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Product being discussed |
| buyer_id | INTEGER | FK → StudentProfile, NOT NULL | Buyer reference |
| seller_id | INTEGER | FK → StudentProfile, NOT NULL | Seller reference |
| last_message_at | TIMESTAMP | NULL | Last message timestamp |
| buyer_unread_count | INTEGER | DEFAULT 0 | Buyer's unread messages |
| seller_unread_count | INTEGER | DEFAULT 0 | Seller's unread messages |
| is_active | BOOLEAN | DEFAULT TRUE | Conversation status |
| created_at | TIMESTAMP | DEFAULT NOW() | Conversation start |

**Indexes:**
- `idx_chat_conversation_product` on `product_id`
- `idx_chat_conversation_buyer` on `buyer_id`
- `idx_chat_conversation_seller` on `seller_id`
- `idx_chat_conversation_unique` on `(product_id, buyer_id)` (unique)

**Constraints:**
- `UNIQUE (product_id, buyer_id)` → One conversation per buyer per product
- `CHECK (buyer_id != seller_id)` → Can't message yourself

---

### 2.10 ChatMessage
**Table:** `marketplace_chatmessage`
**Purpose:** Direct messaging between buyers and sellers

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Message identifier |
| conversation_id | INTEGER | FK → ChatConversation, NOT NULL | Conversation reference |
| sender_id | INTEGER | FK → StudentProfile, NOT NULL | Message sender |
| message_text | TEXT | NOT NULL | Message content |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| read_at | TIMESTAMP | NULL | Read timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Send time |

**Indexes:**
- `idx_chat_message_conversation` on `conversation_id`
- `idx_chat_message_sender` on `sender_id`
- `idx_chat_message_created` on `created_at DESC`
- `idx_chat_message_unread` on `(conversation_id, is_read) WHERE is_read = FALSE`

**Constraints:**
- `CHECK (LENGTH(message_text) <= 1000)` → Prevent spam with long messages

---

### 2.11 ProductShare
**Table:** `marketplace_productshare`
**Purpose:** Track social media shares for viral growth analytics

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Share identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Shared product |
| sharer_id | INTEGER | FK → StudentProfile, NULL | User who shared (if logged in) |
| platform | VARCHAR(20) | NOT NULL | Social platform |
| shared_at | TIMESTAMP | DEFAULT NOW() | Share timestamp |
| referral_clicks | INTEGER | DEFAULT 0 | Clicks from shared link |

**Indexes:**
- `idx_product_share_product` on `product_id`
- `idx_product_share_platform` on `platform`
- `idx_product_share_date` on `shared_at`

**Constraints:**
- `CHECK (platform IN ('whatsapp', 'facebook', 'twitter', 'instagram', 'telegram', 'email'))`

---

### 2.12 ProductReport
**Table:** `marketplace_productreport`
**Purpose:** Users can report inappropriate listings

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Report identifier |
| product_id | INTEGER | FK → Product, NOT NULL | Reported product |
| reporter_id | INTEGER | FK → StudentProfile, NOT NULL | Reporter reference |
| reason | VARCHAR(50) | NOT NULL | Report reason |
| description | TEXT | NULL | Additional details |
| status | VARCHAR(20) | DEFAULT 'pending' | Review status |
| reviewed_by_id | INTEGER | FK → User (admin), NULL | Reviewer reference |
| reviewed_at | TIMESTAMP | NULL | Review timestamp |
| action_taken | VARCHAR(50) | NULL | Admin action |
| created_at | TIMESTAMP | DEFAULT NOW() | Report time |

**Indexes:**
- `idx_product_report_product` on `product_id`
- `idx_product_report_status` on `status`

**Constraints:**
- `CHECK (reason IN ('inappropriate_content', 'scam', 'duplicate', 'sold_elsewhere', 'prohibited_item', 'other'))`
- `CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken'))`

## 3. API Endpoints

### 3.1 Seller Application Workflow

#### POST `/api/v1/marketplace/seller-application`
**Purpose:** Submit seller application for admin approval
**Authentication:** Required (Student only)

**Request Body:**
```json
{
  "business_name": "Campus Books & Supplies Ltd",
  "business_type": "retail",
  "description": "Specialized in providing textbooks, stationery, and study materials for university students. We source products from reputable suppliers and ensure quality.",
  "contact_email": "info@campusbooks.co.ke",
  "contact_phone": "+254712345678",
  "business_address": "Shop 5, Student Center, University of Nairobi",
  "id_document": "[FILE UPLOAD]",
}
```

**Validation Rules:**
- Business name: 5-255 characters, alphanumeric + spaces + punctuation
- Business type: Must be from predefined list
- Description: 50-1000 characters minimum
- Contact email: Valid format, different from student email
- Contact phone: Kenya format (+254XXXXXXXXX)
- Business address: 10-500 characters
- File uploads: Max 5MB each, PDF/JPG/PNG only
- Rate limit: 1 application per student, 3 submissions per day globally

**Response (201):**
```json
{
  "application_id": 1,
  "reference_number": "SEL-2025-001001",
  "status": "pending",
  "estimated_review_time": "3-5 business days",
  "message": "Your application has been submitted successfully. We'll send updates to your email.",
  "next_steps": [
    "Application under review by our team",
    "Document verification process",
    "Final approval decision"
  ]
}
```

**Business Logic:**
```python
def submit_seller_application(student_id, application_data):
    """
    Process seller application submission
    """
    # Check if student already has an active application
    existing_app = SellerApplication.objects.filter(
        applicant_id=student_id,
        status__in=['pending', 'under_review', 'approved']
    ).exists()

    if existing_app:
        raise ValidationError("You already have an active application")

    # Check if student is already approved seller
    if SellerProfile.objects.filter(seller_id=student_id).exists():
        raise ValidationError("You are already an approved seller")

    # Validate business details
    validate_business_details(application_data)

    # Handle file uploads
    uploaded_files = handle_file_uploads(request.FILES)

    # Create application
    application = SellerApplication.objects.create(
        applicant_id=student_id,
        business_name=application_data['business_name'],
        business_type=application_data['business_type'],
        description=application_data['description'],
        contact_email=application_data['contact_email'],
        contact_phone=application_data['contact_phone'],
        business_address=application_data['business_address'],
        kra_pin=application_data.get('kra_pin'),
        business_license=uploaded_files.get('business_license'),
        id_document=uploaded_files.get('id_document'),
        tax_certificate=uploaded_files.get('tax_certificate'),
        status='pending'
    )

    # Send confirmation notification
    send_notification.delay(
        recipient_id=student_id,
        notification_type='seller_application_submitted',
        channel='email',
        context={
            'business_name': application.business_name,
            'reference_number': f"SEL-{timezone.now().year}-{application.id:06d}",
            'estimated_review_time': '3-5 business days'
        }
    )

    # Notify admin team
    send_notification.delay(
        recipient_id=settings.TECH_SUPPORT_ADMIN_ID,
        notification_type='new_seller_application',
        channel='email',
        context={
            'applicant_name': application.applicant.user.get_full_name(),
            'business_name': application.business_name,
            'application_id': application.id
        }
    )

    return application
```

---

#### GET `/api/v1/marketplace/seller-application/{application_id}`
**Purpose:** Check application status
**Authentication:** Required (Applicant only)

**Response (200):**
```json
{
  "application_id": 1,
  "business_name": "Campus Books & Supplies Ltd",
  "status": "under_review",
  "submitted_at": "2025-11-05T10:00:00Z",
  "status_history": [
    {
      "status": "pending",
      "timestamp": "2025-11-05T10:00:00Z",
      "notes": "Application submitted successfully"
    },
    {
      "status": "under_review",
      "timestamp": "2025-11-06T14:30:00Z",
      "notes": "Application under review by our team"
    }
  ],
  "estimated_completion": "2025-11-10T17:00:00Z"
}
```

---

### 3.2 Admin Seller Management

#### GET `/api/v1/admin/marketplace/seller-applications`
**Purpose:** List seller applications for review
**Authentication:** Required (Tech Support Admin only)

**Query Parameters:**
- `status`: Filter by status ('pending', 'under_review', 'approved', 'rejected')
- `limit`: Number of records (default: 20)
- `offset`: Pagination offset

**Response (200):**
```json
{
  "total_applications": 15,
  "pending_review": 8,
  "applications": [
    {
      "application_id": 1,
      "applicant": {
        "student_id": 123,
        "name": "John Doe",
        "email": "john.doe@email.com",
        "university": "University of Nairobi"
      },
      "business_details": {
        "business_name": "Campus Books & Supplies Ltd",
        "business_type": "retail",
        "contact_email": "info@campusbooks.co.ke"
      },
      "status": "pending",
      "submitted_at": "2025-11-05T10:00:00Z",
      "documents": {
        "business_license": "https://...",
        "id_document": "https://...",
        "tax_certificate": "https://..."
      }
    }
  ]
}
```

---

#### PUT `/api/v1/admin/marketplace/seller-applications/{application_id}/review`
**Purpose:** Move application to under review status
**Authentication:** Required (Tech Support Admin only)

**Request Body:**
```json
{
  "action": "start_review",
  "notes": "Documents look complete, beginning verification process"
}
```

---

#### POST `/api/v1/admin/marketplace/seller-applications/{application_id}/approve`
**Purpose:** Approve seller application
**Authentication:** Required (Tech Support Admin only)

**Request Body:**
```json
{
  "approval_notes": "Business  verified. All documents authentic.",
  "business_category_override": null,
  "additional_requirements": []
}
```

**Response (200):**
```json
{
  "application_id": 1,
  "status": "approved",
  "seller_profile_id": 1,
  "approved_at": "2025-11-08T15:30:00Z",
  "message": "Seller application approved successfully",
  "welcome_message": "Congratulations! You can now start listing products on our marketplace."
}
```

**Backend Logic:**
```python
def approve_seller_application(application_id, admin_id, approval_data):
    """
    Approve seller application and create seller profile
    """
    with transaction.atomic():
        application = SellerApplication.objects.select_for_update().get(id=application_id)

        if application.status != 'under_review':
            raise ValidationError("Application must be under review to approve")

        # Update application
        application.status = 'approved'
        application.reviewed_at = timezone.now()
        application.reviewed_by_id = admin_id
        application.approval_notes = approval_data.get('approval_notes')
        application.save()

        # Create seller profile
        seller_profile = SellerProfile.objects.create(
            seller_id=application.applicant_id,
            application_id=application.id,
            business_name=application.business_name,
            business_type=application.business_type,
            description=application.description,
            contact_email=application.contact_email,
            contact_phone=application.contact_phone,
            business_address=application.business_address,
            is_verified=True
        )

        # Send approval notification to seller
        send_notification.delay(
            recipient_id=application.applicant_id,
            notification_type='seller_application_approved',
            channel='email',
            context={
                'business_name': application.business_name,
                'approval_date': timezone.now().strftime('%B %d, %Y'),
                'next_steps': [
                    'Complete your seller profile',
                    'Upload store banner and logo',
                    'Start listing your first product'
                ]
            }
        )

        # Send approval SMS
        send_notification.delay(
            recipient_id=application.applicant_id,
            notification_type='seller_application_approved',
            channel='sms',
            context={
                'business_name': application.business_name[:20] + '...' if len(application.business_name) > 20 else application.business_name
            }
        )

        return seller_profile
```

---

#### POST `/api/v1/admin/marketplace/seller-applications/{application_id}/reject`
**Purpose:** Reject seller application
**Authentication:** Required (Tech Support Admin only)

**Request Body:**
```json
{
  "rejection_reason": "Business documents appears to be forged",
  "specific_issues": [
    "Incomplete business address"
  ],
  "can_reapply": true,
  "reapply_after_days": 30
}
```

**Response (200):**
```json
{
  "application_id": 1,
  "status": "rejected",
  "rejected_at": "2025-11-08T15:30:00Z",
  "rejection_reason": "Business  documents appears to be forged",
  "can_reapply": true,
  "reapply_after_days": 30
}
```

---

#### GET `/api/v1/admin/marketplace/sellers`
**Purpose:** List approved sellers
**Authentication:** Required (Tech Support Admin only)

**Response (200):**
```json
{
  "total_sellers": 25,
  "active_sellers": 23,
  "sellers": [
    {
      "seller_id": 1,
      "student_profile": {
        "name": "John Doe",
        "email": "john.doe@email.com"
      },
      "business_name": "Campus Books & Supplies Ltd",
      "business_type": "retail",
      "total_products": 15,
      "total_sales": 8,
      "average_rating": 4.2,
      "approval_date": "2025-10-15T10:00:00Z",
      "is_active": true
    }
  ]
}
```

---

### 3.3 Product Management (Enhanced with Seller Verification)

#### POST `/api/v1/marketplace/products`
**Purpose:** Create new product listing
**Authentication:** Required (Verified Seller only)

**Request Body:**
```json
{
  "title": "Introduction to Algorithms - 3rd Edition",
  "description": "Brand new textbook, never used. Perfect condition.",
  "category_slug": "textbooks",
  "price": 4500.00,
  "condition": "new",
  "location": "Westlands, Nairobi",
  "is_negotiable": false,
  "images": ["[FILE1]", "[FILE2]"],
  "tags": ["algorithms", "computer science", "textbook"]
}
```

**Validation Rules:**
- Seller must have approved seller profile
- Title: 10-200 characters
- Description: 20-2000 characters
- Price: KES 10 - 500,000
- Max 5 images per product
- Category must exist and be active

**Response (201):**
```json
{
  "product_id": 1,
  "title": "Introduction to Algorithms - 3rd Edition",
  "status": "available",
  "listing_fee": 0.00,
  "message": "Product listed successfully",
  "next_steps": [
    "Share your listing on social media",
    "Monitor inquiries from buyers",
    "Update product status when sold"
  ]
}
```

**Backend Logic:**
```python
def create_product(seller_id, product_data):
    """
    Create product listing for verified seller
    """
    # Verify seller is approved
    seller_profile = SellerProfile.objects.get(
        seller_id=seller_id,
        is_verified=True
    )

    # Check if seller has reached product limit (optional)
    active_products = Product.objects.filter(
        seller_id=seller_id,
        is_active=True
    ).count()

    if active_products >= 50:  # Configurable limit
        raise ValidationError("Maximum 50 active products allowed")

    # Create product
    product = Product.objects.create(
        seller_id=seller_id,
        seller_profile_id=seller_profile.id,
        category_id=Category.objects.get(slug=product_data['category_slug']).id,
        title=product_data['title'],
        description=product_data['description'],
        price=product_data['price'],
        condition=product_data['condition'],
        university=seller_profile.seller.university,
        location=product_data.get('location'),
        is_negotiable=product_data.get('is_negotiable', True),
        status='available'
    )

    # Handle image uploads
    if product_data.get('images'):
        upload_product_images(product.id, product_data['images'])

    # Send listing confirmation
    send_notification.delay(
        recipient_id=seller_id,
        notification_type='product_listed',
        channel='in_app',
        context={
            'product_title': product.title,
            'product_id': product.id
        }
    )

    return product
```

---

### 3.4 Marketplace Browsing (Public)

#### GET `/api/v1/marketplace/products`
**Purpose:** Browse available products
**Authentication:** Not required

**Query Parameters:**
- `category`: Category slug filter
- `university`: University filter
- `min_price`, `max_price`: Price range
- `condition`: Product condition
- `seller_verified`: Only show verified sellers (default: true)
- `sort`: 'price_asc', 'price_desc', 'newest', 'popular'
- `limit`: Results per page (default: 20)
- `offset`: Pagination offset

**Response (200):**
```json
{
  "total_products": 156,
  "products": [
    {
      "product_id": 1,
      "title": "Introduction to Algorithms - 3rd Edition",
      "price": 4500.00,
      "condition": "new",
      "category": "textbooks",
      "seller": {
        "business_name": "Campus Books & Supplies Ltd",
        "rating": 4.2,
        "is_verified": true
      },
      "images": [
        {
          "url": "https://...",
          "is_primary": true
        }
      ],
      "location": "Westlands, Nairobi",
      "posted_at": "2025-11-05T10:00:00Z",
      "view_count": 25,
      "is_negotiable": false
    }
  ],
  "filters": {
    "categories": ["textbooks", "electronics", "furniture"],
    "universities": ["University of Nairobi", "Kenyatta University"],
    "price_range": {"min": 100, "max": 100000}
  }
}
```

---

### 3.5 Contact Reveal System

#### POST `/api/v1/marketplace/products/{product_id}/reveal-contact`
**Purpose:** Reveal seller contact information
**Authentication:** Required (Student only)

**Prerequisites:**
- Must be different student from seller
- Haven't revealed contact for this product before
- Product must be available

**Response (200):**
```json
{
  "seller_contact": {
    "business_name": "Campus Books & Supplies Ltd",
    "contact_email": "info@campusbooks.co.ke",
    "contact_phone": "+254712345678",
    "business_address": "Shop 5, Student Center, University of Nairobi"
  },
  "reveal_id": 1,
  "message": "Contact information revealed. Use this information responsibly.",
  "tips": [
    "Meet in public places",
    "Verify product condition before payment",
    "Report any suspicious activity"
  ]
}
```

---

## 4. Business Logic and Workflows

### 4.1 Seller Verification Workflow

**Application Submission Flow:**
```
Student → Fill Application Form → Upload Documents → Submit
    ↓
Admin Notification → Review Process → Approve/Reject
    ↓
Seller Profile Creation → Welcome Email → Product Listing Access
```

**Verification Requirements:**
- Business registration details
- Valid contact information
- Document verification (ID)
- Background check (future enhancement)

**Approval Criteria:**
- All documents present and authentic
- Business details verifiable
- No previous violations
- Business address within reasonable distance

---

### 4.2 Product Listing Restrictions

**Seller Eligibility Checks:**
```python
def check_seller_eligibility(student_id):
    """
    Verify seller can list products
    """
    if not SellerProfile.objects.filter(
        seller_id=student_id,
        is_verified=True
    ).exists():
        raise PermissionDenied(
            "You must be an approved seller to list products. "
            "Please submit a seller application first."
        )

    # Check for any active violations
    active_reports = ProductReport.objects.filter(
        product__seller_id=student_id,
        status__in=['pending', 'reviewed'],
        action_taken__in=['suspend_listing', 'suspend_account']
    ).exists()

    if active_reports:
        raise PermissionDenied(
            "Your selling privileges are temporarily suspended due to policy violations."
        )

    return True
```

---

### 4.3 Anti-Spam Measures

**Application Rate Limiting:**
- Maximum 3 applications per IP per day
- One active application per student
- 30-day waiting period after rejection

**Product Listing Limits:**
- Maximum 50 active products per seller
- Maximum 5 products per day
- Automatic suspension for spam reports

---

## 5. Security Considerations

### 5.1 Document Verification
- All uploaded documents stored securely with access controls
- Admin-only access to sensitive documents
- Automatic document expiration (delete after 1 year)
- File type and size validation

### 5.2 Seller Trust System
- Verified seller badges and ratings
- Customer review and feedback system
- Dispute resolution process
- Seller performance metrics

### 5.3 Compliance and Legal
- Business registration verification
- Consumer protection guidelines
- Anti-money laundering checks

---

## 6. Testing Requirements

### 6.1 Unit Tests

```python
class SellerVerificationTests(TestCase):
    """Test seller verification workflow"""

    def test_seller_application_submission(self):
        """Test successful application submission"""
        student = create_test_student()
        application_data = {
            'business_name': 'Test Business Ltd',
            'business_type': 'retail',
            'contact_email': 'test@business.com',
            'contact_phone': '+254712345678',
            'business_address': '123 Test Street, Nairobi'
        }

        application = submit_seller_application(student.id, application_data)

        self.assertEqual(application.status, 'pending')
        self.assertEqual(application.business_name, 'Test Business Ltd')

    def test_duplicate_application_rejected(self):
        """Test duplicate application prevention"""
        student = create_test_student()

        # Submit first application
        submit_seller_application(student.id, {...})

        # Attempt second application
        with self.assertRaises(ValidationError):
            submit_seller_application(student.id, {...})

    def test_verified_seller_can_list_products(self):
        """Test product listing requires verification"""
        unverified_student = create_test_student()
        verified_seller = create_approved_seller()

        # Unverified student cannot list
        with self.assertRaises(PermissionDenied):
            create_product(unverified_student.id, {...})

        # Verified seller can list
        product = create_product(verified_seller.student.id, {...})
        self.assertIsNotNone(product)
```

---

## 7. Migration Strategy

### 7.1 New Models Migration

```bash
# Create migrations for new models
python manage.py makemigrations marketplace --name add_seller_verification

# Apply migrations
python manage.py migrate marketplace

# Verify new tables
python manage.py dbshell
\dt marketplace_seller*
```

### 7.2 Data Migration

```python
# Migrate existing products to use seller profiles
from marketplace.models import Product, SellerProfile

def migrate_existing_products():
    """
    Create seller profiles for existing product sellers
    """
    existing_sellers = Product.objects.values('seller_id').distinct()

    for seller_data in existing_sellers:
        seller_id = seller_data['seller_id']

        # Create basic seller profile
        seller_profile = SellerProfile.objects.create(
            seller_id=seller_id,
            business_name=f"Seller {seller_id}",
            business_type='retail',
            description='Migrated seller profile',
            contact_email=f"seller{seller_id}@example.com",
            contact_phone='+254700000000',
            business_address='To be updated',
            is_verified=True
        )

        # Update products to reference seller profile
        Product.objects.filter(seller_id=seller_id).update(
            seller_profile_id=seller_profile.id
        )
```

---

## 8. Future Enhancements (Post-v1.6)

### 8.1 Seller Dashboard
- Sales analytics and performance metrics
- Customer communication management
- Product performance insights
- Revenue tracking and payouts

### 8.2 Advanced Verification
- Video verification calls
- Background checks integration
- Business credit scoring
- Seller insurance options

### 8.3 Marketplace Features
- Bulk product uploads
- Product variation support (sizes, colors)
- Auction-style listings
- Seller subscription tiers

---

**Document Owner:** Joseph Ogutu, CTO
**Last Updated:** November 12, 2025
**Version:** 1.7