# NOTIFICATIONS APP - Technical Specification
**RUMI Platform v1.6**  
**App Name:** `notifications`  
**Purpose:** Multi-channel communication system (Email, SMS, In-App) for user engagement and transactional messaging

---

## 1. Overview and Scope

The `notifications` app is the centralized communication hub for the RUMI platform. It handles:
- Transactional notifications (booking confirmations, payment receipts)
- System notifications (reservation expiry, roommate introductions)
- Marketing communications (promotions, announcements)
- Multi-channel delivery (Email via Mailtrap, SMS via African Talking, In-App)

### Design Philosophy
- **Template-Based:** Reusable message templates for consistency
- **Channel Prioritization:** Email for important transactions, SMS as fallback, In-App for updates
- **Cost-Optimization:** SMS only for critical/unpaid tenant reminders (per financial plan)
- **Async Processing:** All notifications sent via Celery to avoid blocking user requests

---

## 2. Data Models

### 2.1 Notification
**Table:** `notifications_notification`  
**Purpose:** Central record of all sent notifications

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Notification identifier |
| recipient_id | INTEGER | FK → User, NOT NULL | Recipient reference |
| notification_type | VARCHAR(50) | NOT NULL | Type of notification |
| channel | VARCHAR(20) | NOT NULL | Delivery method |
| subject | VARCHAR(255) | NULL | Email subject / SMS title |
| message | TEXT | NOT NULL | Notification content |
| metadata | JSONB | NULL | Additional context data |
| status | VARCHAR(20) | DEFAULT 'pending' | Delivery status |
| sent_at | TIMESTAMP | NULL | Successful send time |
| failed_at | TIMESTAMP | NULL | Failure timestamp |
| error_message | TEXT | NULL | Failure reason |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| read_at | TIMESTAMP | NULL | User read time (in-app) |

**Indexes:**
- `idx_notification_recipient` on `recipient_id`
- `idx_notification_type` on `notification_type`
- `idx_notification_status` on `status` (for retry queries)
- `idx_notification_created` on `created_at` (cleanup old records)

**Constraints:**
- `CHECK (channel IN ('email', 'sms', 'in_app'))`
- `CHECK (status IN ('pending', 'sent', 'failed', 'read'))`

**Notification Types:**
```
# Accounts
- email_verification
- welcome
- password_reset

# Bookings
- booking_reserved
- booking_confirmed
- booking_expired
- booking_cancelled
- payment_receipt

# Marketplace
- product_listed
- product_sold
- contact_reveal

# Roommates
- roommate_introduction
- compatibility_update

# System
- maintenance_alert
- policy_update
```

---

### 2.2 EmailTemplate
**Table:** `notifications_emailtemplate`  
**Purpose:** Reusable email templates with variable substitution

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Template identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Template key |
| subject | VARCHAR(255) | NOT NULL | Email subject (with variables) |
| html_content | TEXT | NOT NULL | HTML email body |
| text_content | TEXT | NULL | Plain text fallback |
| variables | JSONB | NULL | Expected variables list |
| is_active | BOOLEAN | DEFAULT TRUE | Enable/disable template |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | AUTO | Last modification |

**Indexes:**
- `idx_emailtemplate_name` on `name` (unique)

**Sample Template (Booking Confirmation):**
```json
{
  "name": "booking_confirmed",
  "subject": " Booking Confirmed - {{hostel_name}}",
  "html_content": "<h1>Congratulations {{student_name}}!</h1><p>Your booking for Room {{room_number}} at {{hostel_name}} has been confirmed.</p><p><strong>Booking Reference:</strong> {{booking_reference}}</p><p><strong>Move-in Date:</strong> {{move_in_date}}</p><p><strong>Total Amount Paid:</strong> KES {{total_amount}}</p>",
  "variables": ["student_name", "hostel_name", "room_number", "booking_reference", "move_in_date", "total_amount"]
}
```

---

### 2.3 SMSTemplate
**Table:** `notifications_smstemplate`  
**Purpose:** SMS message templates (cost-optimized, limited usage)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Template identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Template key |
| message | VARCHAR(160) | NOT NULL | SMS content (160 char limit) |
| variables | JSONB | NULL | Expected variables list |
| is_active | BOOLEAN | DEFAULT TRUE | Enable/disable template |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Constraints:**
- `CHECK (LENGTH(message) <= 160)` → SMS character limit

**Sample Template (Payment Reminder):**
```json
{
  "name": "payment_reminder",
  "message": "Hi {{first_name}}, your rent of KES {{amount}} for {{hostel_name}} is due. Pay via M-Pesa Paybill {{paybill}} Acc: {{account}}. -RUMI",
  "variables": ["first_name", "amount", "hostel_name", "paybill", "account"]
}
```

---

### 2.4 NotificationPreference
**Table:** `notifications_notificationpreference`  
**Purpose:** User-configurable notification settings

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Preference identifier |
| user_id | INTEGER | FK → User, UNIQUE | User reference |
| email_enabled | BOOLEAN | DEFAULT TRUE | Email notifications |
| sms_enabled | BOOLEAN | DEFAULT TRUE | SMS notifications |
| marketing_emails | BOOLEAN | DEFAULT TRUE | Marketing opt-in |
| booking_updates | BOOLEAN | DEFAULT TRUE | Booking status changes |
| marketplace_updates | BOOLEAN | DEFAULT TRUE | Marketplace activity |
| roommate_updates | BOOLEAN | DEFAULT TRUE | Compatibility alerts |
| created_at | TIMESTAMP | DEFAULT NOW() | Preference creation |
| updated_at | TIMESTAMP | AUTO | Last update |

**Indexes:**
- `idx_notificationpref_user` on `user_id` (unique)

---

## 3. API Endpoints

### 3.1 In-App Notifications

#### GET `/api/v1/notifications`
**Purpose:** Retrieve user's in-app notifications  
**Authentication:** Required

**Query Parameters:**
- `unread_only`: boolean (default: false)
- `limit`: integer (default: 20)

**Response (200):**
```json
{
  "unread_count": 3,
  "notifications": [
    {
      "notification_id": 501,
      "type": "booking_confirmed",
      "subject": "Booking Confirmed",
      "message": "Your booking for Room A201 at University Heights has been confirmed.",
      "metadata": {
        "booking_id": 789,
        "hostel_name": "University Heights"
      },
      "created_at": "2025-10-25T13:15:00Z",
      "read_at": null
    }
  ]
}
```

#### PUT `/api/v1/notifications/{notification_id}/read`
**Purpose:** Mark notification as read  
**Authentication:** Required

**Response (200):**
```json
{
  "notification_id": 501,
  "status": "read",
  "read_at": "2025-10-25T14:00:00Z"
}
```

#### PUT `/api/v1/notifications/read-all`
**Purpose:** Mark all notifications as read  
**Authentication:** Required

---

### 3.2 Notification Preferences

#### GET `/api/v1/notifications/preferences`
**Purpose:** Get user's notification settings  
**Authentication:** Required

**Response (200):**
```json
{
  "email_enabled": true,
  "sms_enabled": true,
  "marketing_emails": false,
  "booking_updates": true,
  "marketplace_updates": true,
  "roommate_updates": true
}
```

#### PUT `/api/v1/notifications/preferences`
**Purpose:** Update notification settings  
**Authentication:** Required

**Request Body:**
```json
{
  "email_enabled": true,
  "marketing_emails": false
}
```

---

## 4. Business Logic and Workflows

### 4.1 Notification Sending Flow (Celery Task)

**Task Name:** `send_notification`  
**Trigger:** Called by other apps (accounts, hostels, payments, marketplace)

**Logic:**
```python
@shared_task
def send_notification(recipient_id, notification_type, channel, context):
    """
    Args:
        recipient_id: User ID
        notification_type: e.g., 'booking_confirmed'
        channel: 'email', 'sms', 'in_app'
        context: dict with template variables
    """
    # 1. Check user preferences
    prefs = NotificationPreference.objects.get(user_id=recipient_id)
    if not prefs.is_channel_enabled(channel, notification_type):
        return  # User opted out
    
    # 2. Load template
    if channel == 'email':
        template = EmailTemplate.objects.get(name=notification_type)
        subject = render_template(template.subject, context)
        message = render_template(template.html_content, context)
    elif channel == 'sms':
        template = SMSTemplate.objects.get(name=notification_type)
        message = render_template(template.message, context)
    
    # 3. Create notification record
    notification = Notification.objects.create(
        recipient_id=recipient_id,
        notification_type=notification_type,
        channel=channel,
        subject=subject,
        message=message,
        metadata=context,
        status='pending'
    )
    
    # 4. Send via appropriate service
    try:
        if channel == 'email':
            send_email_via_mailtrap(recipient.email, subject, message)
        elif channel == 'sms':
            send_sms_via_africatalking(recipient.phone, message)
        elif channel == 'in_app':
            # Already stored in DB, no external service
            pass
        
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
    except Exception as e:
        notification.status = 'failed'
        notification.failed_at = timezone.now()
        notification.error_message = str(e)
        notification.save()
        # Log error for admin review
```

---

### 4.2 Multi-Channel Strategy

**Critical Notifications (Always Send):**
| Event | Email | SMS | In-App |
|-------|-------|-----|--------|
| Email Verification OTP | ✓ | - | - |
| Booking Confirmed | ✓ | - | ✓ |
| Payment Receipt | ✓ | - | ✓ |
| Reservation Expiry Warning | ✓ | - | ✓ |

**Cost-Optimized SMS (10% of users):**
| Event | Trigger | Channel |
|-------|---------|---------|
| Unpaid Rent Reminder | Tenant overdue >3 days | SMS + Email |

**Low-Priority (In-App Only):**
| Event | Channel |
|-------|---------|
| Product View | In-App |
| New Roommate Match | In-App + Email (daily digest) |
| System Updates | In-App |

---

### 4.3 Template Variable Substitution

**Implementation:**
```python
def render_template(template_string, context):
    """
    Replace {{variable}} with actual values from context dict
    Example: "Hello {{name}}" + {"name": "John"} → "Hello John"
    """
    for key, value in context.items():
        placeholder = f"{{{{{key}}}}}"
        template_string = template_string.replace(placeholder, str(value))
    return template_string
```

---

## 5. Integration with External Services

### 5.1 Mailtrap (Email Service)
**Purpose:** Transactional email delivery  
**Budget:** KES 1,400/month (3,500 emails)  
**Configuration:**
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.mailtrap.io'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('MAILTRAP_USERNAME')
EMAIL_HOST_PASSWORD = os.getenv('MAILTRAP_PASSWORD')
DEFAULT_FROM_EMAIL = 'noreply@rumi.co.ke'
```

**API Wrapper:**
```python
def send_email_via_mailtrap(recipient, subject, html_content):
    send_mail(
        subject=subject,
        message='',  # Plain text fallback
        html_message=html_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False
    )
```

---

### 5.2 African Talking (SMS Service)
**Purpose:** SMS delivery for critical reminders  
**Cost:** KES 1.00 per SMS  
**Budget:** KES 50/month (50 SMS for unpaid tenants)

**Configuration:**
```python
# settings.py
AFRICASTALKING_USERNAME = 'rumi'
AFRICASTALKING_API_KEY = os.getenv('AFRICASTALKING_API_KEY')
```

**API Wrapper:**
```python
import africastalking

def send_sms_via_africatalking(phone_number, message):
    africastalking.initialize(
        username=settings.AFRICASTALKING_USERNAME,
        api_key=settings.AFRICASTALKING_API_KEY
    )
    sms = africastalking.SMS
    
    response = sms.send(
        message=message,
        recipients=[phone_number]
    )
    return response
```

---

## 6. Performance and Scalability

### 6.1 Async Processing (Celery)
**Why:** Sending emails/SMS is I/O-bound and can take 1-3 seconds  
**Implementation:** All notification sends are Celery tasks

**Example Usage (from hostels app):**
```python
# hostels/views.py
from notifications.tasks import send_notification

def confirm_booking(booking_id):
    booking = Booking.objects.get(id=booking_id)
    
    # Trigger async notification
    send_notification.delay(
        recipient_id=booking.student_id,
        notification_type='booking_confirmed',
        channel='email',
        context={
            'student_name': booking.student.first_name,
            'hostel_name': booking.room.hostel.name,
            'room_number': booking.room.room_number,
            'booking_reference': booking.booking_reference,
            'move_in_date': booking.move_in_date,
            'total_amount': booking.total_amount
        }
    )
```

---

### 6.2 Rate Limiting (Cost Control)
**SMS Budget Protection:**
- Maximum 50 SMS per month (per financial plan)
- Track SMS count in Redis: `sms:monthly_count`
- Reset counter on 1st of each month
- If limit reached, log error and send email instead

**Implementation:**
```python
def send_sms_with_rate_limit(phone_number, message):
    monthly_count = cache.get('sms:monthly_count', 0)
    
    if monthly_count >= 50:
        logger.warning("SMS monthly limit reached. Falling back to email.")
        return False
    
    send_sms_via_africatalking(phone_number, message)
    cache.incr('sms:monthly_count')
    return True
```

---

### 6.3 Batch Notifications (Marketing)
**Use Case:** Send promotional emails to 500 students  
**Strategy:** Queue batch job in Celery, send 50 emails/minute to avoid spam flags

```python
@shared_task
def send_bulk_notification(recipient_ids, notification_type, context):
    for recipient_id in recipient_ids:
        send_notification.delay(recipient_id, notification_type, 'email', context)
        time.sleep(1.2)  # Rate limit: ~50/min
```

---

## 7. Security and Privacy

### 7.1 Data Protection
- **Unsubscribe Links:** Include in all marketing emails
- **Data Retention:** Delete notifications older than 90 days (Celery cleanup job)
- **PII Handling:** Never log full email content (only metadata)

### 7.2 GDPR/Privacy Compliance
- Users can opt-out of marketing communications
- Critical notifications (booking confirmations, payments) cannot be disabled
- Provide notification history export on request

---

## 8. Monitoring and Analytics

### 8.1 Tracked Metrics
- Email delivery rate (sent / total)
- SMS delivery rate
- Email open rate (if tracking pixels enabled)
- Average time to delivery
- Failed notification count (by type)

### 8.2 Admin Dashboard Queries
```sql
-- Failed notifications (last 24 hours)
SELECT notification_type, COUNT(*) 
FROM notifications_notification 
WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type;

-- Monthly SMS usage
SELECT COUNT(*) FROM notifications_notification 
WHERE channel = 'sms' 
  AND status = 'sent' 
  AND DATE_TRUNC('month', sent_at) = DATE_TRUNC('month', NOW());
```

---

## 9. Testing Requirements

### 9.1 Unit Tests
- Template variable substitution
- Channel preference enforcement
- Rate limit logic (SMS budget)
- Email/SMS sending mocks

### 9.2 Integration Tests
- End-to-end notification flow (trigger → send → delivery)
- Multi-channel delivery (email + in-app)
- Failed delivery retry logic

---

## 10. Migration Strategy

### 10.1 Initial Migration
```bash
python manage.py makemigrations notifications
python manage.py migrate notifications
```

### 10.2 Data Seeding (Development)
- Create 10 email templates (all notification types)
- Create 3 SMS templates (critical only)
- Create default notification preferences for test users

---

## 11. Future Enhancements (Post-v1.6)

- Push notifications (mobile app)
- WhatsApp Business API integration (cost-effective alternative to SMS)
- Real-time WebSocket notifications (in-app alerts)
- Advanced email analytics (open rate, click tracking)
- A/B testing for email templates
- Notification scheduling (send at optimal times)

---

**Document Owner:** Joseph Ogutu, CTO  
**Last Updated:** October 2025  
**Version:** 1.6