# HOME APP - Technical Specification
**RUMI Platform v1.6**  
**App Name:** `home`  
**Purpose:** Public-facing website pages including landing page, about us, team, contact us, and general content management

---

## 1. Overview and Scope

The `home` app serves as the platform's public-facing website and marketing portal. It handles:
- Landing page with platform overview and value proposition
- About Us page with company story and mission
- Team page showcasing leadership and staff
- Contact Us page with inquiry forms
- FAQ section for common questions
- Blog/News section for updates and announcements
- Terms of Service and Privacy Policy pages
- General content management for static pages
- Newsletter subscription management
- Contact form submissions and tracking

### Design Philosophy
- **SEO-Optimized:** All pages optimized for search engines
- **Mobile-First:** Responsive design for all device sizes
- **Fast Loading:** Optimized assets and lazy loading
- **Conversion-Focused:** Clear CTAs to drive user registration
- **Content-Rich:** Informative content to build trust
- **Analytics-Driven:** Track visitor engagement and conversions

---

## 2. Data Models

### 2.1 Page
**Table:** `home_page`  
**Purpose:** Dynamic content pages with SEO metadata

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Page identifier |
| title | VARCHAR(200) | NOT NULL | Page title |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly identifier |
| meta_title | VARCHAR(60) | NULL | SEO title tag |
| meta_description | VARCHAR(160) | NULL | SEO description |
| meta_keywords | VARCHAR(255) | NULL | SEO keywords |
| content | TEXT | NOT NULL | Page content (HTML) |
| is_published | BOOLEAN | DEFAULT FALSE | Publication status |
| view_count | INTEGER | DEFAULT 0 | Page views |
| template_name | VARCHAR(100) | DEFAULT 'default' | Template to use |
| display_order | INTEGER | DEFAULT 0 | Navigation order |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |
| published_at | TIMESTAMP | NULL | Publication time |

**Indexes:**
- `idx_page_slug` on `slug` (unique)
- `idx_page_published` on `is_published`
- `idx_page_order` on `display_order`

**Constraints:**
- `CHECK (template_name IN ('default', 'about', 'team', 'contact', 'faq', 'blog'))`

**Sample Pages:**
```json
[
  {"title": "Home", "slug": "home", "template_name": "default"},
  {"title": "About Us", "slug": "about-us", "template_name": "about"},
  {"title": "Our Team", "slug": "team", "template_name": "team"},
  {"title": "Contact Us", "slug": "contact-us", "template_name": "contact"},
  {"title": "FAQ", "slug": "faq", "template_name": "faq"},
  {"title": "Terms of Service", "slug": "terms-of-service", "template_name": "default"},
  {"title": "Privacy Policy", "slug": "privacy-policy", "template_name": "default"}
]
```

---

### 2.2 TeamMember
**Table:** `home_teammember`  
**Purpose:** Staff and leadership profiles

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Member identifier |
| full_name | VARCHAR(200) | NOT NULL | Member name |
| position | VARCHAR(200) | NOT NULL | Job title/role |
| bio | TEXT | NULL | Professional biography |
| profile_picture | VARCHAR(255) | NULL | Profile photo URL |
| email | VARCHAR(254) | NULL | Contact email |
| linkedin_url | VARCHAR(255) | NULL | LinkedIn profile |
| twitter_url | VARCHAR(255) | NULL | Twitter/X profile |
| display_order | INTEGER | DEFAULT 0 | Display sequence |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_team_member_active` on `is_active`
- `idx_team_member_order` on `display_order`

**Sample Team Members:**
```json
[
  {
    "full_name": "Joseph Ogutu",
    "position": "Chief Technology Officer",
    "bio": "10+ years experience in software architecture and development...",
    "email": "joseph@rumi.co.ke",
    "linkedin_url": "https://linkedin.com/in/josephogutu"
  }
]
```

---

### 2.3 ContactInquiry
**Table:** `home_contactinquiry`  
**Purpose:** Contact form submissions and tracking

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Inquiry identifier |
| full_name | VARCHAR(200) | NOT NULL | Inquirer name |
| email | VARCHAR(254) | NOT NULL | Contact email |
| phone_number | VARCHAR(15) | NULL | Contact phone |
| subject | VARCHAR(200) | NOT NULL | Inquiry subject |
| message | TEXT | NOT NULL | Inquiry message |
| inquiry_type | VARCHAR(50) | NOT NULL | Category |
| status | VARCHAR(20) | DEFAULT 'pending' | Processing status |
| ip_address | VARCHAR(45) | NULL | Submitter IP |
| user_agent | VARCHAR(255) | NULL | Browser info |
| responded_at | TIMESTAMP | NULL | Response time |
| responded_by_id | INTEGER | FK → User, NULL | Admin who responded |
| response_message | TEXT | NULL | Admin response |
| created_at | TIMESTAMP | DEFAULT NOW() | Submission time |

**Indexes:**
- `idx_inquiry_status` on `status`
- `idx_inquiry_type` on `inquiry_type`
- `idx_inquiry_created` on `created_at DESC`

**Constraints:**
- `CHECK (inquiry_type IN ('general', 'student_support', 'landlord_support', 'technical', 'partnership', 'media', 'other'))`
- `CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed'))`

---

### 2.4 FAQ
**Table:** `home_faq`  
**Purpose:** Frequently asked questions

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | FAQ identifier |
| category | VARCHAR(100) | NOT NULL | FAQ category |
| question | VARCHAR(500) | NOT NULL | Question text |
| answer | TEXT | NOT NULL | Answer text (HTML) |
| display_order | INTEGER | DEFAULT 0 | Display sequence |
| is_published | BOOLEAN | DEFAULT TRUE | Visibility status |
| view_count | INTEGER | DEFAULT 0 | Times viewed |
| helpful_count | INTEGER | DEFAULT 0 | Helpful votes |
| not_helpful_count | INTEGER | DEFAULT 0 | Not helpful votes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_faq_category` on `category`
- `idx_faq_published` on `is_published`
- `idx_faq_order` on `(category, display_order)`

**FAQ Categories:**
- `getting_started` - Getting Started
- `students` - For Students
- `landlords` - For Landlords
- `payments` - Payments & Billing
- `safety` - Safety & Security
- `technical` - Technical Support
- `marketplace` - Marketplace

---

### 2.5 BlogPost
**Table:** `home_blogpost`  
**Purpose:** News, updates, and announcements

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Post identifier |
| title | VARCHAR(200) | NOT NULL | Post title |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly identifier |
| excerpt | TEXT | NULL | Short summary |
| content | TEXT | NOT NULL | Post content (HTML) |
| featured_image | VARCHAR(255) | NULL | Main image URL |
| author_id | INTEGER | FK → User, NOT NULL | Post author |
| category | VARCHAR(100) | NOT NULL | Post category |
| tags | JSONB | NULL | Post tags array |
| meta_title | VARCHAR(60) | NULL | SEO title |
| meta_description | VARCHAR(160) | NULL | SEO description |
| is_published | BOOLEAN | DEFAULT FALSE | Publication status |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured post flag |
| view_count | INTEGER | DEFAULT 0 | Post views |
| read_time_minutes | INTEGER | NULL | Estimated read time |
| published_at | TIMESTAMP | NULL | Publication time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_blog_slug` on `slug` (unique)
- `idx_blog_published` on `(is_published, published_at DESC)`
- `idx_blog_category` on `category`
- `idx_blog_featured` on `is_featured`
- `idx_blog_tags_gin` GIN on `tags`

**Blog Categories:**
- `company_news` - Company News
- `product_updates` - Product Updates
- `student_stories` - Student Stories
- `landlord_tips` - Landlord Tips
- `housing_guides` - Housing Guides
- `marketplace_highlights` - Marketplace Highlights

---

### 2.6 Newsletter
**Table:** `home_newsletter`  
**Purpose:** Newsletter subscription management

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Subscription identifier |
| email | VARCHAR(254) | UNIQUE, NOT NULL | Subscriber email |
| full_name | VARCHAR(200) | NULL | Subscriber name |
| subscription_type | VARCHAR(50) | DEFAULT 'general' | Subscription category |
| status | VARCHAR(20) | DEFAULT 'active' | Subscription status |
| subscribed_at | TIMESTAMP | DEFAULT NOW() | Subscription time |
| unsubscribed_at | TIMESTAMP | NULL | Unsubscribe time |
| verification_token | UUID | NULL | Email verification token |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verified |
| ip_address | VARCHAR(45) | NULL | Subscription IP |

**Indexes:**
- `idx_newsletter_email` on `email` (unique)
- `idx_newsletter_status` on `status`
- `idx_newsletter_type` on `subscription_type`

**Constraints:**
- `CHECK (subscription_type IN ('general', 'students', 'landlords', 'marketplace', 'blog'))`
- `CHECK (status IN ('active', 'unsubscribed', 'bounced', 'spam_complaint'))`

---

### 2.7 Testimonial
**Table:** `home_testimonial`  
**Purpose:** User testimonials and reviews for landing page

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Testimonial identifier |
| author_name | VARCHAR(200) | NOT NULL | Reviewer name |
| author_role | VARCHAR(200) | NULL | Role/title (e.g., "3rd Year Student") |
| author_university | VARCHAR(255) | NULL | University affiliation |
| author_photo | VARCHAR(255) | NULL | Profile photo URL |
| testimonial_text | TEXT | NOT NULL | Review content |
| rating | INTEGER | NULL | Star rating (1-5) |
| is_published | BOOLEAN | DEFAULT FALSE | Visibility status |
| is_featured | BOOLEAN | DEFAULT FALSE | Homepage feature flag |
| display_order | INTEGER | DEFAULT 0 | Display sequence |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `idx_testimonial_published` on `is_published`
- `idx_testimonial_featured` on `is_featured`
- `idx_testimonial_order` on `display_order`

**Constraints:**
- `CHECK (rating BETWEEN 1 AND 5)`

---

### 2.8 Statistics
**Table:** `home_statistics`  
**Purpose:** Platform statistics for landing page display

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Stat identifier |
| stat_key | VARCHAR(100) | UNIQUE, NOT NULL | Statistic identifier |
| stat_value | INTEGER | NOT NULL | Current value |
| stat_label | VARCHAR(200) | NOT NULL | Display label |
| stat_icon | VARCHAR(50) | NULL | Icon identifier |
| display_order | INTEGER | DEFAULT 0 | Display sequence |
| is_active | BOOLEAN | DEFAULT TRUE | Display status |
| updated_at | TIMESTAMP | AUTO | Last update |

**Indexes:**
- `idx_statistics_key` on `stat_key` (unique)
- `idx_statistics_order` on `display_order`

**Sample Statistics:**
```json
[
  {"stat_key": "total_students", "stat_value": 2000, "stat_label": "Active Students"},
  {"stat_key": "total_hostels", "stat_value": 150, "stat_label": "Listed Hostels"},
  {"stat_key": "total_rooms", "stat_value": 3000, "stat_label": "Available Rooms"},
  {"stat_key": "total_bookings", "stat_value": 1500, "stat_label": "Successful Bookings"},
  {"stat_key": "marketplace_items", "stat_value": 500, "stat_label": "Marketplace Items"}
]
```

---

## 3. API Endpoints

### 3.1 Landing Page

#### GET `/api/v1/home`
**Purpose:** Get landing page data  
**Authentication:** Not required

**Response (200):**
```json
{
  "hero": {
    "title": "Find Your Perfect Student Accommodation",
    "subtitle": "Browse verified hostels near your university. Book rooms with confidence.",
    "cta_buttons": [
      {"text": "Find Rooms", "link": "/hostels"},
      {"text": "List Your Hostel", "link": "/landlord/register"}
    ]
  },
  "statistics": [
    {
      "label": "Active Students",
      "value": 2000,
      "icon": "users"
    },
    {
      "label": "Listed Hostels",
      "value": 150,
      "icon": "building"
    },
    {
      "label": "Available Rooms",
      "value": 3000,
      "icon": "bed"
    },
    {
      "label": "Successful Bookings",
      "value": 1500,
      "icon": "check-circle"
    }
  ],
  "featured_hostels": [
    {
      "hostel_id": 10,
      "name": "University Heights",
      "university": "University of Nairobi",
      "min_price": 5000.00,
      "available_rooms": 15,
      "rating": 4.5,
      "image": "https://..."
    }
  ],
  "testimonials": [
    {
      "author_name": "Jane Doe",
      "author_role": "3rd Year Student, UoN",
      "author_photo": "https://...",
      "testimonial_text": "RUMI made finding accommodation so easy! Highly recommended.",
      "rating": 5
    }
  ],
  "features": [
    {
      "title": "Verified Hostels",
      "description": "All hostels verified for quality and safety",
      "icon": "shield-check"
    },
    {
      "title": "Secure Payments",
      "description": "Pay securely via M-Pesa with platform protection",
      "icon": "lock"
    },
    {
      "title": "Roommate Matching",
      "description": "Find compatible roommates based on lifestyle",
      "icon": "users"
    },
    {
      "title": "Student Marketplace",
      "description": "Buy and sell items within your university",
      "icon": "shopping-bag"
    }
  ]
}
```

---

### 3.2 About Us

#### GET `/api/v1/home/about`
**Purpose:** Get about us page content  
**Authentication:** Not required

**Response (200):**
```json
{
  "mission": {
    "title": "Our Mission",
    "content": "To revolutionize student accommodation in Kenya by providing a transparent, secure, and user-friendly platform..."
  },
  "vision": {
    "title": "Our Vision",
    "content": "To become the leading student accommodation platform in Africa..."
  },
  "story": {
    "title": "Our Story",
    "content": "Founded in 2024 by university students who experienced the challenges of finding safe accommodation...",
    "milestones": [
      {"year": "2024", "event": "Platform launched at University of Nairobi"},
      {"year": "2025", "event": "Expanded to 5 universities across Kenya"},
      {"year": "2025", "event": "Launched integrated student marketplace"}
    ]
  },
  "values": [
    {
      "title": "Transparency",
      "description": "Clear pricing, verified information, no hidden fees"
    },
    {
      "title": "Safety",
      "description": "Verified hostels, secure payments, trusted landlords"
    },
    {
      "title": "Community",
      "description": "Building connections between students and landlords"
    }
  ]
}
```

---

### 3.3 Team

#### GET `/api/v1/home/team`
**Purpose:** Get team members list  
**Authentication:** Not required

**Response (200):**
```json
{
  "leadership": [
    {
      "member_id": 1,
      "full_name": "Joseph Ogutu",
      "position": "Chief Technology Officer",
      "bio": "10+ years experience in software architecture...",
      "profile_picture": "https://...",
      "linkedin_url": "https://linkedin.com/in/josephogutu"
    }
  ],
  "team": [
    {
      "member_id": 2,
      "full_name": "Jane Smith",
      "position": "Head of Operations",
      "bio": "Experienced in property management and student services...",
      "profile_picture": "https://..."
    }
  ]
}
```

---

### 3.4 Contact Us

#### POST `/api/v1/home/contact`
**Purpose:** Submit contact inquiry  
**Authentication:** Not required

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+254712345678",
  "subject": "Partnership Inquiry",
  "inquiry_type": "partnership",
  "message": "I would like to discuss a partnership opportunity..."
}
```

**Validation Rules:**
- Full name: 2-200 characters
- Email: Valid email format
- Subject: 5-200 characters
- Message: 10-2000 characters
- Rate limit: 3 submissions per hour per IP

**Response (201):**
```json
{
  "inquiry_id": 50,
  "message": "Thank you for contacting us! We'll respond within 24 hours.",
  "reference_number": "INQ-2025-000050",
  "expected_response_time": "24 hours"
}
```

**Backend Logic:**
```python
def submit_contact_inquiry(data):
    """
    Process contact form submission
    """
    # Check rate limit
    check_contact_rate_limit(data['ip_address'])
    
    # Create inquiry
    inquiry = ContactInquiry.objects.create(
        full_name=data['full_name'],
        email=data['email'],
        phone_number=data.get('phone_number'),
        subject=data['subject'],
        inquiry_type=data['inquiry_type'],
        message=data['message'],
        ip_address=data['ip_address'],
        user_agent=data['user_agent'],
        status='pending'
    )
    
    # Send confirmation email to inquirer
    send_notification.delay(
        recipient_email=data['email'],
        notification_type='inquiry_received',
        channel='email',
        context={
            'full_name': data['full_name'],
            'reference_number': f"INQ-{timezone.now().year}-{inquiry.id:06d}",
            'subject': data['subject']
        }
    )
    
    # Notify admin team
    send_notification.delay(
        recipient_id=settings.CONTACT_ADMIN_ID,
        notification_type='new_inquiry',
        channel='email',
        context={
            'inquiry_id': inquiry.id,
            'from_name': data['full_name'],
            'from_email': data['email'],
            'subject': data['subject'],
            'inquiry_type': data['inquiry_type']
        }
    )
    
    return inquiry
```

---

#### GET `/api/v1/home/contact-info`
**Purpose:** Get platform contact information  
**Authentication:** Not required

**Response (200):**
```json
{
  "email": "hello@rumi.co.ke",
  "support_email": "support@rumi.co.ke",
  "phone": "+254 700 000 000",
  "whatsapp": "+254 700 000 000",
  "address": {
    "street": "123 University Way",
    "city": "Nairobi",
    "country": "Kenya",
    "postal_code": "00100"
  },
  "social_media": {
    "facebook": "https://facebook.com/rumikenya",
    "twitter": "https://twitter.com/rumikenya",
    "instagram": "https://instagram.com/rumikenya",
    "linkedin": "https://linkedin.com/company/rumikenya"
  },
  "office_hours": {
    "weekdays": "8:00 AM - 6:00 PM EAT",
    "saturday": "9:00 AM - 2:00 PM EAT",
    "sunday": "Closed"
  }
}
```

---

### 3.5 FAQ

#### GET `/api/v1/home/faq`
**Purpose:** Get frequently asked questions  
**Authentication:** Not required

**Query Parameters:**
- `category`: string (filter by category)

**Response (200):**
```json
{
  "categories": [
    {
      "category": "getting_started",
      "label": "Getting Started",
      "faqs": [
        {
          "faq_id": 1,
          "question": "How do I create an account?",
          "answer": "Click on 'Sign Up' and choose your role (Student or Landlord)...",
          "helpful_count": 45,
          "not_helpful_count": 2
        }
      ]
    },
    {
      "category": "students",
      "label": "For Students",
      "faqs": [
        {
          "faq_id": 5,
          "question": "How do I book a room?",
          "answer": "Browse available rooms, select your preferred room, and complete payment...",
          "helpful_count": 120,
          "not_helpful_count": 5
        }
      ]
    }
  ]
}
```

---

#### POST `/api/v1/home/faq/{faq_id}/helpful`
**Purpose:** Mark FAQ as helpful or not helpful  
**Authentication:** Not required

**Request Body:**
```json
{
  "helpful": true
}
```

**Response (200):**
```json
{
  "faq_id": 1,
  "helpful_count": 46,
  "not_helpful_count": 2,
  "message": "Thank you for your feedback!"
}
```

---

### 3.6 Blog

#### GET `/api/v1/home/blog`
**Purpose:** List blog posts  
**Authentication:** Not required

**Query Parameters:**
- `category`: string (filter by category)
- `tag`: string (filter by tag)
- `featured`: boolean (only featured posts)
- `limit`: integer (default: 10)
- `offset`: integer (pagination)

**Response (200):**
```json
{
  "total_posts": 25,
  "posts": [
    {
      "post_id": 10,
      "title": "5 Tips for Finding Student Accommodation in Nairobi",
      "slug": "5-tips-student-accommodation-nairobi",
      "excerpt": "Finding the perfect hostel can be challenging. Here are our top tips...",
      "featured_image": "https://...",
      "author": {
        "name": "Jane Smith",
        "profile_picture": "https://..."
      },
      "category": "housing_guides",
      "tags": ["accommodation", "nairobi", "tips"],
      "read_time_minutes": 5,
      "published_at": "2025-10-25T10:00:00Z",
      "view_count": 450
    }
  ]
}
```

---

#### GET `/api/v1/home/blog/{slug}`
**Purpose:** Get single blog post  
**Authentication:** Not required

**Response (200):**
```json
{
  "post_id": 10,
  "title": "5 Tips for Finding Student Accommodation in Nairobi",
  "slug": "5-tips-student-accommodation-nairobi",
  "content": "<p>Full HTML content of the blog post...</p>",
  "featured_image": "https://...",
  "author": {
    "name": "Jane Smith",
    "bio": "Content Manager at RUMI",
    "profile_picture": "https://..."
  },
  "category": "housing_guides",
  "tags": ["accommodation", "nairobi", "tips"],
  "read_time_minutes": 5,
  "published_at": "2025-10-25T10:00:00Z",
  "view_count": 451,
  "related_posts": [
    {
      "post_id": 11,
      "title": "Understanding Hostel Deposits in Kenya",
      "slug": "understanding-hostel-deposits-kenya",
      "excerpt": "Learn about security deposits and refund policies..."
    }
  ]
}
```

---

### 3.7 Newsletter

#### POST `/api/v1/home/newsletter/subscribe`
**Purpose:** Subscribe to newsletter  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "subscriber@example.com",
  "full_name": "John Doe",
  "subscription_type": "general"
}
```

**Response (201):**
```json
{
  "message": "Thank you for subscribing! Please check your email to confirm.",
  "verification_required": true
}
```

**Backend Logic:**
```python
def subscribe_to_newsletter(email, full_name, subscription_type):
    """
    Process newsletter subscription
    """
    # Check if already subscribed
    existing = Newsletter.objects.filter(email=email).first()
    
    if existing and existing.status == 'active':
        return {'message': 'Email already subscribed', 'already_subscribed': True}
    
    # Generate verification token
    verification_token = uuid.uuid4()
    
    # Create subscription
    subscription = Newsletter.objects.create(
        email=email,
        full_name=full_name,
        subscription_type=subscription_type,
        verification_token=verification_token,
        is_verified=False,
        status='active'
    )
    
    # Send verification email
    verification_link = f"https://rumi.co.ke/newsletter/verify?token={verification_token}"
    
    send_notification.delay(
        recipient_email=email,
        notification_type='newsletter_verification',
        channel='email',
        context={
            'full_name': full_name,
            'verification_link': verification_link
        }
    )
    
    return subscription
```

---

#### GET `/api/v1/home/newsletter/verify`
**Purpose:** Verify email subscription  
**Authentication:** Not required

**Query Parameters:**
- `token`: UUID (verification token)

**Response (200):**
```json
{
  "message": "Email verified successfully! You'll start receiving our newsletter.",
  "verified": true
}
```

---

#### POST `/api/v1/home/newsletter/unsubscribe`
**Purpose:** Unsubscribe from newsletter  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "subscriber@example.com"
}
```

**Response (200):**
```json
{
  "message": "You have been unsubscribed successfully.",
  "unsubscribed": true
}
```

---

### 3.8 Statistics (Admin)

#### PUT `/api/v1/admin/home/statistics/{stat_key}`
**Purpose:** Update platform statistics  
**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "stat_value": 2500
}
```

**Response (200):**
```json
{
  "stat_key": "total_students",
  "stat_value": 2500,
  "stat_label": "Active Students",
  "updated_at": "2025-10-31T10:00:00Z"
}
```

---

## 4. Business Logic and Workflows

### 4.1 Contact Form Rate Limiting

**Purpose:** Prevent spam submissions

**Logic:**
```python
def check_contact_rate_limit(ip_address):
    """
    Limit contact form submissions to 3 per hour per IP
    """
    cache_key = f"contact_rate:{ip_address}"
    submissions = cache.get(cache_key, 0)
    
    if submissions >= 3:
        raise PermissionDenied(
            "Too many contact submissions. Please try again in 1 hour."
        )
    
    cache.incr(cache_key)
    cache.expire(cache_key, 3600)  # 1 hour
    
    return True
```

---

### 4.2 Blog Post View Tracking

**Purpose:** Track blog post engagement

**Logic:**
```python
@shared_task
def track_blog_view(post_id, viewer_ip, session_id):
    """
    Track blog post view
    """
    # Check if unique view (deduplicate by session)
    cache_key = f"blog_view:{post_id}:{session_id}"
    
    if not cache.exists(cache_key):
        # Increment view count
        BlogPost.objects.filter(id=post_id).update(
            view_count=F('view_count') + 1
        )
        
        # Cache for 24 hours to prevent duplicate counting
        cache.set(cache_key, True, timeout=86400)
```

---

### 4.3 Statistics Auto-Update (Celery Task)

**Task Name:** `update_platform_statistics`  
**Schedule:** Daily at midnight  
**Purpose:** Keep landing page statistics current

**Logic:**
```python
@shared_task
def update_platform_statistics():
    """
    Update platform statistics automatically
    """
    from accounts.models import StudentProfile
    from hostels.models import Hostel, Room, Booking
    from marketplace.models import Product
    
    stats_to_update = {
        'total_students': StudentProfile.objects.filter(user__is_active=True).count(),
        'total_hostels': Hostel.objects.filter(is_active=True).count(),
        'total_rooms': Room.objects.filter(is_available=True).count(),
        'total_bookings': Booking.objects.filter(status='confirmed').count(),
        'marketplace_items': Product.objects.filter(is_active=True, status='available').count()
    }
    
    for stat_key, stat_value in stats_to_update.items():
        Statistics.objects.update_or_create(
            stat_key=stat_key,
            defaults={'stat_value': stat_value}
        )
    
    return {
        'updated_stats': len(stats_to_update),
        'timestamp': timezone.now().isoformat()
    }
```

---

### 4.4 Newsletter Cleanup (Celery Task)

**Task Name:** `cleanup_unverified_newsletters`  
**Schedule:** Weekly on Sunday at 2:00 AM  
**Purpose:** Remove unverified subscriptions after 7 days

**Logic:**
```python
@shared_task
def cleanup_unverified_newsletters():
    """
    Delete unverified newsletter subscriptions after 7 days
    """
    cutoff_date = timezone.now() - timedelta(days=7)
    
    deleted_count = Newsletter.objects.filter(
        is_verified=False,
        subscribed_at__lt=cutoff_date
    ).delete()[0]
    
    return {
        'deleted_count': deleted_count,
        'cutoff_date': cutoff_date.isoformat()
    }
```

---

### 4.5 Contact Inquiry Auto-Assignment

**Purpose:** Auto-assign inquiries to appropriate team members

**Logic:**
```python
def auto_assign_inquiry(inquiry):
    """
    Automatically assign inquiry to appropriate admin
    """
    # Assignment rules based on inquiry type
    assignment_map = {
        'general': settings.GENERAL_SUPPORT_ADMIN_ID,
        'student_support': settings.STUDENT_SUPPORT_ADMIN_ID,
        'landlord_support': settings.LANDLORD_SUPPORT_ADMIN_ID,
        'technical': settings.TECHNICAL_SUPPORT_ADMIN_ID,
        'partnership': settings.PARTNERSHIPS_ADMIN_ID,
        'media': settings.MEDIA_ADMIN_ID,
        'other': settings.GENERAL_SUPPORT_ADMIN_ID
    }
    
    assigned_admin_id = assignment_map.get(
        inquiry.inquiry_type,
        settings.GENERAL_SUPPORT_ADMIN_ID
    )
    
    # Update inquiry status
    inquiry.status = 'in_progress'
    inquiry.save()
    
    # Notify assigned admin
    send_notification.delay(
        recipient_id=assigned_admin_id,
        notification_type='inquiry_assigned',
        channel='email',
        context={
            'inquiry_id': inquiry.id,
            'from_name': inquiry.full_name,
            'subject': inquiry.subject,
            'inquiry_type': inquiry.inquiry_type,
            'admin_url': f"https://rumi.co.ke/admin/inquiries/{inquiry.id}"
        }
    )
```

---

## 5. SEO Optimization

### 5.1 Meta Tags Management

**Dynamic Meta Tags:**
```python
def generate_meta_tags(page):
    """
    Generate SEO meta tags for pages
    """
    return {
        'title': page.meta_title or page.title,
        'description': page.meta_description or page.content[:160],
        'keywords': page.meta_keywords,
        'og:title': page.meta_title or page.title,
        'og:description': page.meta_description,
        'og:image': get_page_featured_image(page),
        'og:url': f"https://rumi.co.ke/{page.slug}",
        'twitter:card': 'summary_large_image',
        'twitter:title': page.meta_title or page.title,
        'twitter:description': page.meta_description
    }
```

---

### 5.2 Sitemap Generation

**Automatic Sitemap:**
```python
from django.contrib.sitemaps import Sitemap

class PageSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.8
    
    def items(self):
        return Page.objects.filter(is_published=True)
    
    def lastmod(self, obj):
        return obj.updated_at
    
    def location(self, obj):
        return f"/{obj.slug}"


class BlogSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7
    
    def items(self):
        return BlogPost.objects.filter(is_published=True).order_by('-published_at')
    
    def lastmod(self, obj):
        return obj.updated_at
    
    def location(self, obj):
        return f"/blog/{obj.slug}"
```

---

### 5.3 Robots.txt Configuration

```python
# urls.py
from django.views.generic import TemplateView

urlpatterns = [
    path('robots.txt', TemplateView.as_view(
        template_name='robots.txt',
        content_type='text/plain'
    )),
]
```

**robots.txt:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /accounts/login/
Disallow: /accounts/register/

Sitemap: https://rumi.co.ke/sitemap.xml
```

---

## 6. Performance Optimization

### 6.1 Page Caching

**Cache Strategy:**
```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # Cache for 15 minutes
def landing_page(request):
    """
    Landing page with aggressive caching
    """
    return render(request, 'home/landing.html', context)


def invalidate_page_cache(page_slug):
    """
    Invalidate cache when page is updated
    """
    cache_key = f"page:{page_slug}"
    cache.delete(cache_key)
```

---

### 6.2 Image Optimization

**Responsive Images:**
```html
<!-- Use multiple image sizes for different devices -->
<img 
  srcset="
    hero-mobile.jpg 480w,
    hero-tablet.jpg 768w,
    hero-desktop.jpg 1200w
  "
  sizes="(max-width: 480px) 480px,
         (max-width: 768px) 768px,
         1200px"
  src="hero-desktop.jpg"
  alt="RUMI Platform"
  loading="lazy"
>
```

---

### 6.3 CDN Integration

**Static Asset Delivery:**
```python
# settings.py
STATIC_URL = 'https://cdn.rumi.co.ke/static/'
MEDIA_URL = 'https://cdn.rumi.co.ke/media/'

# Use CloudFront or Cloudflare for CDN
AWS_S3_CUSTOM_DOMAIN = 'cdn.rumi.co.ke'
```

---

## 7. Analytics Integration

### 7.1 Google Analytics

**Track Key Events:**
```javascript
// Track newsletter subscription
gtag('event', 'newsletter_subscribe', {
  'event_category': 'engagement',
  'event_label': 'newsletter'
});

// Track contact form submission
gtag('event', 'contact_form_submit', {
  'event_category': 'engagement',
  'event_label': 'contact',
  'inquiry_type': 'general'
});

// Track blog post views
gtag('event', 'blog_view', {
  'event_category': 'content',
  'event_label': 'blog',
  'post_title': 'Article Title'
});
```

---

### 7.2 Conversion Tracking

**Key Conversions:**
```python
def track_conversion(conversion_type, user_id=None, metadata=None):
    """
    Track important conversion events
    """
    conversions = {
        'student_registration': 'Student signed up',
        'landlord_registration': 'Landlord signed up',
        'first_booking': 'First room booking',
        'newsletter_signup': 'Newsletter subscription',
        'contact_form': 'Contact form submission'
    }
    
    # Log to analytics platform
    analytics.track(
        user_id=user_id,
        event=conversions.get(conversion_type),
        properties=metadata
    )
```

---

## 8. Security Measures

### 8.1 Contact Form Protection

**CAPTCHA Integration:**
```python
from django.conf import settings
import requests

def verify_recaptcha(recaptcha_response):
    """
    Verify Google reCAPTCHA response
    """
    payload = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': recaptcha_response
    }
    
    response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data=payload
    )
    
    result = response.json()
    return result.get('success', False)
```

---

### 8.2 Email Validation

**Prevent Disposable Emails:**
```python
DISPOSABLE_EMAIL_DOMAINS = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com'
]

def validate_email_domain(email):
    """
    Block disposable email addresses
    """
    domain = email.split('@')[1].lower()
    
    if domain in DISPOSABLE_EMAIL_DOMAINS:
        raise ValidationError(
            "Please use a permanent email address"
        )
    
    return True
```

---

### 8.3 XSS Prevention

**Content Sanitization:**
```python
import bleach

ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code'
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt']
}

def sanitize_html_content(content):
    """
    Sanitize HTML content to prevent XSS
    """
    return bleach.clean(
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
```

---

## 9. Testing Requirements

### 9.1 Unit Tests

```python
from django.test import TestCase

class ContactFormTests(TestCase):
    """Test contact form functionality"""
    
    def test_valid_contact_submission(self):
        """Test successful contact form submission"""
        response = self.client.post('/api/v1/home/contact', {
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'subject': 'General Inquiry',
            'inquiry_type': 'general',
            'message': 'This is a test message with sufficient length.'
        })
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('inquiry_id', response.data)
    
    def test_contact_rate_limit(self):
        """Test rate limiting on contact form"""
        # Submit 3 times (limit)
        for i in range(3):
            self.client.post('/api/v1/home/contact', self.valid_data)
        
        # 4th attempt should fail
        response = self.client.post('/api/v1/home/contact', self.valid_data)
        self.assertEqual(response.status_code, 429)


class NewsletterTests(TestCase):
    """Test newsletter subscription"""
    
    def test_newsletter_subscription(self):
        """Test successful newsletter signup"""
        response = self.client.post('/api/v1/home/newsletter/subscribe', {
            'email': 'subscriber@example.com',
            'full_name': 'Jane Doe',
            'subscription_type': 'general'
        })
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['verification_required'])
    
    def test_duplicate_subscription(self):
        """Test duplicate email handling"""
        Newsletter.objects.create(
            email='existing@example.com',
            status='active'
        )
        
        response = self.client.post('/api/v1/home/newsletter/subscribe', {
            'email': 'existing@example.com',
            'subscription_type': 'general'
        })
        
        self.assertTrue(response.data['already_subscribed'])


class BlogPostTests(TestCase):
    """Test blog functionality"""
    
    def test_blog_list(self):
        """Test blog post listing"""
        response = self.client.get('/api/v1/home/blog')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('posts', response.data)
    
    def test_blog_view_tracking(self):
        """Test blog post view counting"""
        post = create_test_blog_post()
        
        # View post
        self.client.get(f'/api/v1/home/blog/{post.slug}')
        
        post.refresh_from_database()
        self.assertEqual(post.view_count, 1)
```

---

### 9.2 Integration Tests

```python
class HomePageIntegrationTests(APITestCase):
    """Test complete home page workflows"""
    
    def test_landing_to_registration_flow(self):
        """Test user journey from landing page to registration"""
        # 1. Load landing page
        response = self.client.get('/api/v1/home')
        self.assertEqual(response.status_code, 200)
        
        # 2. Subscribe to newsletter
        response = self.client.post('/api/v1/home/newsletter/subscribe', {
            'email': 'newuser@example.com',
            'subscription_type': 'students'
        })
        self.assertEqual(response.status_code, 201)
        
        # 3. Register as student
        response = self.client.post('/api/v1/accounts/register', {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'role': 'student'
        })
        self.assertEqual(response.status_code, 201)
    
    def test_contact_to_response_flow(self):
        """Test contact inquiry to admin response"""
        # 1. Submit inquiry
        response = self.client.post('/api/v1/home/contact', {
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'subject': 'Support Request',
            'inquiry_type': 'student_support',
            'message': 'I need help with my booking.'
        })
        
        inquiry_id = response.data['inquiry_id']
        
        # 2. Admin views inquiry
        inquiry = ContactInquiry.objects.get(id=inquiry_id)
        self.assertEqual(inquiry.status, 'pending')
        
        # 3. Admin responds (simulated)
        inquiry.status = 'resolved'
        inquiry.response_message = 'Thank you for contacting us...'
        inquiry.responded_at = timezone.now()
        inquiry.save()
        
        # Verify response notification sent
        self.assertEqual(inquiry.status, 'resolved')
```

---

## 10. Admin Panel Features

### 10.1 Content Management

**Admin Actions:**
- Create/Edit/Delete pages
- Manage team members
- Review and respond to contact inquiries
- Moderate blog posts and comments
- Update platform statistics
- Manage FAQ entries
- Export newsletter subscribers

---

### 10.2 Analytics Dashboard

**Key Metrics:**
```python
def get_home_analytics():
    """
    Get analytics for home app
    """
    return {
        'page_views': {
            'total': Page.objects.aggregate(Sum('view_count'))['view_count__sum'],
            'landing_page': Page.objects.get(slug='home').view_count,
            'about_page': Page.objects.get(slug='about-us').view_count
        },
        'contact_inquiries': {
            'total': ContactInquiry.objects.count(),
            'pending': ContactInquiry.objects.filter(status='pending').count(),
            'resolved': ContactInquiry.objects.filter(status='resolved').count(),
            'by_type': ContactInquiry.objects.values('inquiry_type').annotate(
                count=Count('id')
            )
        },
        'newsletter': {
            'total_subscribers': Newsletter.objects.filter(status='active').count(),
            'verified': Newsletter.objects.filter(is_verified=True).count(),
            'by_type': Newsletter.objects.values('subscription_type').annotate(
                count=Count('id')
            )
        },
        'blog': {
            'total_posts': BlogPost.objects.filter(is_published=True).count(),
            'total_views': BlogPost.objects.aggregate(Sum('view_count'))['view_count__sum'],
            'most_viewed': BlogPost.objects.filter(is_published=True).order_by('-view_count')[:5]
        }
    }
```

---

## 11. Migration Strategy

### 11.1 Initial Migration

```bash
# Create migrations
python manage.py makemigrations home

# Apply migrations
python manage.py migrate home

# Verify tables
python manage.py dbshell
\dt home_*
```

---

### 11.2 Data Seeding

```python
# home/management/commands/seed_home.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seed home app data'
    
    def handle(self, *args, **options):
        # Create default pages
        pages = [
            {
                'title': 'Home',
                'slug': 'home',
                'content': 'Welcome to RUMI...',
                'is_published': True
            },
            {
                'title': 'About Us',
                'slug': 'about-us',
                'content': 'RUMI was founded...',
                'template_name': 'about',
                'is_published': True
            }
        ]
        
        for page_data in pages:
            Page.objects.create(**page_data)
            self.stdout.write(self.style.SUCCESS(f"Created page: {page_data['title']}"))
        
        # Create statistics
        stats = [
            {'stat_key': 'total_students', 'stat_value': 0, 'stat_label': 'Active Students'},
            {'stat_key': 'total_hostels', 'stat_value': 0, 'stat_label': 'Listed Hostels'},
            {'stat_key': 'total_rooms', 'stat_value': 0, 'stat_label': 'Available Rooms'}
        ]
        
        for stat_data in stats:
            Statistics.objects.create(**stat_data)
            self.stdout.write(self.style.SUCCESS(f"Created stat: {stat_data['stat_key']}"))
        
        # Create FAQ categories
        faqs = [
            {
                'category': 'getting_started',
                'question': 'How do I create an account?',
                'answer': 'Click on Sign Up...',
                'is_published': True
            }
        ]
        
        for faq_data in faqs:
            FAQ.objects.create(**faq_data)
            self.stdout.write(self.style.SUCCESS(f"Created FAQ: {faq_data['question']}"))
```

**Run seeding:**
```bash
python manage.py seed_home
```

---

## 12. Future Enhancements

### 12.1 Advanced Features
- **Live Chat:** Real-time chat widget for instant support
- **Webinars:** Host educational webinars for students/landlords
- **Resource Library:** Downloadable guides and templates
- **Video Testimonials:** Embedded video reviews
- **Interactive Tours:** Virtual platform walkthroughs

### 12.2 Content Features
- **Multi-language Support:** English and Swahili translations
- **Blog Comments:** User comments on blog posts
- **Content Search:** Full-text search across all pages
- **Related Content:** Smart content recommendations
- **Content Rating:** User feedback on help articles

### 12.3 Marketing Tools
- **A/B Testing:** Test different landing page versions
- **Email Campaigns:** Automated drip campaigns
- **Referral Program:** Track and reward referrals
- **Landing Page Builder:** Drag-and-drop page creation
- **Analytics Dashboard:** Advanced visitor analytics

---

**Document Owner:** Joseph Ogutu, CTO  
**Last Updated:** October 31, 2025  
**Version:** 1.6