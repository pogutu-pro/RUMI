# RUMI Platform - Complete Student Accommodation Solution

> A comprehensive platform connecting students with quality accommodation in Kenya

## Project Overview

RUMI Platform is a full-stack web application that revolutionizes student accommodation by connecting students, landlords, and property managers through a seamless digital experience. Built with modern technologies and designed for scale.

### Key Features

- **Multi-Role Authentication** - Students, landlords, caretakers, and administrators
- **Smart Hostel Management** - Room booking, inventory tracking, roommate matching
- **Integrated Payments** - Paystack integration with automated rent collection
- **Real-Time Chat** - Built-in messaging system for all users
- **Advanced Analytics** - Revenue tracking, occupancy reports, performance metrics
- **Smart Notifications** - Email/SMS alerts with customizable preferences
- **Subscription Management** - Flexible pricing tiers with feature access control
- **CMS & Content** - Blog, testimonials, FAQ, and dynamic pages

### Technology Stack

**Backend:**
- **Framework:** Django 4.2 + Django REST Framework
- **Authentication:** JWT (SimpleJWT) with role-based permissions
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Task Queue:** Celery + Redis for background processing
- **Payments:** Paystack integration with webhooks
- **Documentation:** Swagger/OpenAPI interactive docs

**Frontend (Separate Repository):**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication

---

## Project Structure

```
RUMI_PLATFORM/
├── accounts/          # User management, authentication, profiles, chat
├── hostels/           # Hostel/room management, bookings, inventory
├── payments/          # Payment processing, transactions, payouts
├── notifications/     # Email/SMS templates, delivery, preferences
├── home/              # CMS, blog, testimonials, contact forms
├── rumi/              # Django settings and URL configuration
├── frontend/          # React frontend (development in progress)
├── docs/              # Technical specifications and documentation
└── static/            # Static files (CSS, JS, images)
```

---

## Quick Start

### Prerequisites
- Python 3.12+
- Redis (for caching and Celery)
- Git

### Backend Setup

```bash
# Clone the repository
git clone <repository-url>
cd RUMI_PLATFORM

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed all data (users, hostels, subscriptions, chat)
python manage.py seed_test_users --skip-checks && \
python manage.py seed_subscription_plans --skip-checks && \
python manage.py seed_sample_data --skip-checks && \
python manage.py seed_chat_data --skip-checks

# Start development server
python manage.py runserver
```

### Access Points

- **Web App:** http://localhost:8000
- **API Documentation:**
  - **Swagger UI:** http://localhost:8000/swagger/
  - **ReDoc:** http://localhost:8000/redoc/
  - **OpenAPI JSON:** http://localhost:8000/swagger.json

### Background Services (Optional)

```bash
# Start Redis server
redis-server

# Start Celery worker
celery -A rumi worker --loglevel=info
```

---

## User Roles & Features

### Students
- Browse and book hostels
- Manage bookings and payments
- Chat with landlords and caretakers
- View roommate recommendations
- Access receipts and payment history

### Landlords
- List and manage hostels/rooms
- Process bookings and payments
- Automated rent collection
- Access detailed analytics
- Manage caretakers and inventory

### Caretakers
- Check-in/out students
- Manage room inventory
- Verify payments and documents
- Handle maintenance requests
- Report issues and updates

### Administrators
- User management and verification
- Platform analytics and reporting
- Content management
- System configuration and monitoring

---

## Subscription Plans

| Plan | Monthly Fee | Key Features |
|------|-------------|--------------|
| **Free Trial** | KES 0 | 30 days, all features |
| **Basic** | KES 10,000 | Unlimited hostels/rooms |
| **Medium** | Revenue-based | 1% of rent collected |
| **Advanced** | KES 40,000 | AI features + analytics |

---

## API Overview

### Base URL: `http://localhost:8000/api/v1/`

### Core Endpoints

```javascript
// Authentication
POST /accounts/login/
POST /accounts/register/
POST /accounts/verify-email/

// Hostels & Bookings
GET  /hostels/
POST /hostels/{id}/reserve/
POST /hostels/{id}/book/

// Chat System
GET  /accounts/chat/conversations/
GET  /accounts/chat/conversations/{id}/messages/
POST /accounts/chat/send/

// Payments
POST /payments/initialize/
GET  /payments/transactions/

// Subscriptions
GET  /accounts/subscriptions/plans/
POST /accounts/subscriptions/upgrade/
```

### Interactive API Documentation

Visit http://localhost:8000/swagger/ to explore and test all API endpoints interactively.

---

## Database Schema

**45+ Tables** across all apps with comprehensive relationships:

- **Accounts:** Users, profiles, conversations, messages
- **Hostels:** Properties, rooms, bookings, inventory
- **Payments:** Transactions, payouts, analytics
- **Notifications:** Templates, preferences, delivery logs
- **Home:** CMS pages, blog posts, testimonials

---

## Testing

### Test Users Available

| Role | Email | Password |
|------|--------|----------|
| Student | `student@test.com` | `testpass123` |
| Landlord | `landlord@test.com` | `testpass123` |
| Caretaker | `caretaker@test.com` | `testpass123` |
| Admin | `superadmin@test.com` | `testpass123` |

### Sample Data

All tables are pre-populated with realistic test data:
- 5+ test users across all roles
- 3 sample hostels with rooms and amenities
- Complete booking and payment history
- Sample conversations and messages
- Blog posts, testimonials, and FAQ

---

## Platform Analytics

- **Revenue Tracking:** Daily/monthly collection reports
- **Occupancy Analytics:** Room utilization metrics
- **User Engagement:** Booking patterns and preferences
- **Financial Reports:** Tax-ready statements and payouts
- **Performance Metrics:** System health and API usage

---

## Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure payment processing
- Audit logging for all user actions

---

## Documentation

### Backend Documentation
- [API Endpoints Reference](API_ENDPOINTS_REFERENCE.md)
- [Subscription API Guide](API_REFERENCE_SUBSCRIPTIONS.md)
- [Backend Implementation Report](BACKEND_AUDIT_README.md)
- [Setup Guide](SETUP_GUIDE.md)

### Technical Specs
- [Payment Fee Structure](FINAL_REVENUE_MODEL.md)
- [Pricing Model](UPDATED_PRICING.md)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## License

This project is proprietary software owned by RUMI Platform.

---

## Support

- **Email:** support@rumi.co.ke
- **Documentation:** http://localhost:8000/swagger/
- **Issues:** GitHub Issues (coming soon)

---

## Roadmap

- [x] Complete backend API implementation
- [x] Payment integration and automation
- [x] Real-time chat system
- [x] Interactive API documentation
- [ ] Frontend React application
- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Multi-language support

---

**Ready for deployment and user testing!**

*Last updated: December 8, 2025*