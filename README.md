# RUMIA — Rental Management Platform

RUMIA is a rental property management platform for landlords, caretakers, and tenants. It manages the full rental lifecycle across organizations, properties, units, tenancies, rent charges, payments, notifications, and financial reporting while preserving historical RUMI hostel data as migration-compatible legacy context.

**Status:** v1.0 — Production-ready backend (112 tests passing)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework 3.14 |
| Frontend | Next.js 16, React 19, TypeScript |
| Database | PostgreSQL (production) / SQLite (dev) |
| Cache | Redis (django-redis) |
| Async tasks | Celery + django-celery-beat |
| Real-time | Django Channels (WebSocket) |
| Payments | M-Pesa Daraja STK Push, Paystack |
| Storage | AWS S3 (production) / local disk (dev) |
| Auth | JWT (SimpleJWT) with role-based access |
| Monitoring | Prometheus + Sentry |
| PDF | ReportLab (receipt generation) |
| SMS | Africa's Talking |

---

## User Roles

| Role | Description |
|------|-------------|
| Student | Searches hostels, books rooms, pays rent |
| Landlord | Lists properties, manages rooms and tenants |
| Caretaker | Handles visitor invitations, maintenance, late entries |
| Admin | Platform oversight, user management, financial reports |
| Tech Support | System health, logs, error monitoring |

---

## Project Structure

```
RUMI/
├── Backend/
│   ├── accounts/              # Users, authentication, roles, OTP
│   ├── hostels/               # Hostel, room, bed, booking models
│   ├── payments/              # M-Pesa, Paystack, transactions, receipts
│   ├── admin_api/             # Admin and super-admin API endpoints
│   ├── caretaker_operations/  # Visitor invitations, maintenance, late entries
│   ├── student_api/           # Student-facing API endpoints
│   ├── landlord_api/          # Landlord-facing API endpoints
│   ├── support_api/           # Tech support endpoints
│   ├── notifications/         # SMS, email, push notification tasks
│   ├── analytics/             # Revenue, occupancy, and reporting
│   ├── home/                  # Public homepage and landing page API
│   ├── core/                  # Shared utilities, custom exception handler
│   ├── roommate_system/       # Roommate compatibility matching
│   ├── monitoring/            # Prometheus metrics and health checks
│   └── rumi/                  # Django project settings and URL config
└── frontend/
    └── src/app/
        ├── (admin)/           # Admin dashboard
        ├── (auth)/            # Login, register, OTP
        ├── (student)/         # Student portal
        ├── (landlord)/        # Landlord portal
        ├── (caretaker)/       # Caretaker portal
        └── (public)/          # Public-facing pages
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Redis
- PostgreSQL (production) or SQLite (dev, zero config)

### Backend

```bash
cd Backend

# Create and activate virtualenv
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — minimum required: SECRET_KEY, MPESA_*, PAYSTACK_SECRET_KEY

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
```

### Background Services

```bash
# Redis (required for caching and Celery)
redis-server

# Celery worker
cd Backend
celery -A rumi worker --loglevel=info

# Celery beat scheduler (recurring tasks: late fees, webhook retries)
celery -A rumi beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## Environment Variables

### Backend — `.env`

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (omit for SQLite dev)
DB_NAME=rumi
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# M-Pesa (Safaricom Daraja)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/payments/webhook/mpesa/
BACKEND_API_URL=https://your-domain.com

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# AWS S3 (set USE_S3=true in production)
USE_S3=false
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# SMS (Africa's Talking)
AT_API_KEY=
AT_USERNAME=

# Sentry (optional)
SENTRY_DSN=
```

### Frontend — `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
```

---

## API Overview

Base URL: `/api/v1/`

| Prefix | Description |
|--------|-------------|
| `/api/v1/auth/` | Registration, login, OTP verification, JWT refresh |
| `/api/v1/hostels/` | Hostel and room listings |
| `/api/v1/bookings/` | Booking creation and management |
| `/api/v1/payments/` | Initiate payments, webhook endpoints |
| `/api/v1/admin/` | Admin platform management |
| `/api/v1/caretaker/` | Caretaker operations |
| `/api/v1/student/` | Student portal endpoints |
| `/api/v1/landlord/` | Landlord portal endpoints |
| `/api/v1/support/` | Tech support endpoints |
| `/api/v1/home/` | Public landing page data |
| `/api/v1/notifications/` | Notification management |
| `/metrics` | Prometheus metrics |

Interactive API docs (Swagger): `http://localhost:8000/swagger/`

---

## Payment Flows

### M-Pesa STK Push
1. Student initiates payment → backend calls Daraja STK Push API
2. Safaricom prompts student on their phone
3. Safaricom POSTs callback to `/api/v1/payments/webhook/mpesa/stk_push/`
4. Backend updates Transaction status and generates a PDF receipt

### Paystack
1. Frontend charges card via Paystack.js
2. Paystack POSTs `charge.success` to `/api/v1/payments/webhook/paystack/`
3. Backend verifies HMAC-SHA512 signature, updates Transaction, triggers notification

---

## Testing

```bash
cd Backend
source venv/bin/activate

# Run all tests
python manage.py test

# Run specific app
python manage.py test payments
python manage.py test hostels
python manage.py test caretaker_operations

# With coverage
coverage run --source='.' manage.py test
coverage report
```

**Current:** 112 tests, 0 failures

Key coverage areas:
- M-Pesa STK push full lifecycle (initiation → callback → receipt PDF)
- Paystack HMAC-SHA512 webhook verification (valid + tampered signatures)
- N+1 query regression guards (`assertNumQueries`) for hostel/room/booking list endpoints
- Booking state machine (pending → confirmed → checked_in → completed)

---

## Celery Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| `assess_late_fees` | Daily | Calculates and applies late payment fees |
| `retry_failed_webhook_events` | Every 5 min | Retries failed webhook deliveries |
| `charge_saved_payment_method` | Configurable | Charges saved payment methods via Paystack |
| `send_booking_confirmation` | On event | Sends SMS/email on booking approval |
| `send_payment_notification` | On event | Sends SMS/email on payment receipt |

---

## Deployment Checklist

- [ ] Set `DEBUG=False` and a strong random `SECRET_KEY`
- [ ] Configure PostgreSQL (`DB_*` env vars)
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Set `USE_S3=true` and configure `AWS_*` vars
- [ ] Set `BACKEND_API_URL` to your production domain (used in M-Pesa callback URLs)
- [ ] Configure Celery with Redis broker
- [ ] Run `python manage.py collectstatic`
- [ ] Set up SSL/TLS (required for M-Pesa and Paystack webhooks)

---

## Monitoring

- **Prometheus metrics:** `/metrics`
- **Django admin:** `/admin/`
- **Swagger docs:** `/swagger/`
- **Application logs:** `Backend/logs/`

---

**Version:** v1.0
**Last updated:** 2026-03-17