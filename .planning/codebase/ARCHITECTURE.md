# ARCHITECTURE.md — System Architecture

## Overview
RUMI is a student accommodation platform for the Kenyan market, connecting students with hostels. It is a full-stack monorepo with a Django REST API backend and a Next.js frontend.

## Architectural Pattern
- **Backend**: Django monolith with role-based app decomposition (not microservices)
- **Frontend**: Next.js App Router with route groups per user role
- **Communication**: REST API (JSON over HTTP) + WebSockets (Django Channels)
- **Overall**: Client-Server SPA architecture

## Layers

### Backend Layers
```
HTTP Request
  → Django Middleware (CORS, Auth, Prometheus)
  → URL Router (rumi/urls.py)
  → DRF ViewSet / APIView
  → Serializer (validation + serialization)
  → Django ORM / Service layer
  → PostgreSQL / Redis
  → Response
```

### Background Layer
```
Celery Task Queue (Redis broker)
  → Async tasks: SMS notifications, email, payment processing, billing accrual
  → Scheduled tasks: rent reminders, billing cycles
```

### Real-time Layer
```
WebSocket (Django Channels)
  → Redis channel layer
  → Consumers (accounts/consumers.py)
  → Real-time notifications, live updates
```

### Frontend Layers
```
Next.js App Router
  → Middleware (middleware.ts) — auth guards, route protection
  → Route Group Layout (per role)
  → Page Component
  → Client Components + Hooks
  → API calls (fetch / lib functions)
  → Django REST API
```

## User Role Architecture
Four distinct user roles, each with separate route groups and backend API modules:

| Role | Frontend Route Group | Backend App |
|---|---|---|
| Student | `(student)/student/` | `student_api/` |
| Landlord | `(landlord)/landlord/` | `landlord_api/` |
| Caretaker | `(caretaker)/caretaker/` | `caretaker_operations/` |
| Admin/Tech Support | `(admin)/admin/`, `tech-support/` | `admin_api/`, `admin_endpoints/`, `support_api/` |

## Key Backend Apps (Django)

| App | Responsibility |
|---|---|
| `accounts` | Users, profiles, auth, subscriptions, roommate matching, WebSocket consumers |
| `hostels` | Hostel/room/bed CRUD, bookings, reviews, favorites, waitlist, occupancy |
| `payments` | M-Pesa, Paystack, receipts, billing accrual (pay-per-occupied-bed) |
| `notifications` | SMS (Africa's Talking), email, in-app notifications via Celery tasks |
| `landlord_api` | Landlord-specific views (hostel management, tenant management) |
| `student_api` | Student-specific views (search, bookings, profile) |
| `caretaker_operations` | Caretaker daily operations (check-ins, maintenance, visitor logs) |
| `admin_api` | Platform admin dashboard |
| `admin_endpoints` | Legacy admin endpoints (to be deprecated) |
| `support_api` | Tech support dashboard views |
| `analytics` | Occupancy, revenue, landlord analytics |
| `roommate_system` | Roommate matching logic |
| `recommendations` | Hostel recommendation engine |
| `monitoring` | Health checks, Prometheus metrics |
| `home` | Homepage/public endpoints, metrics proxy |
| `core` | Shared base views |

## Entry Points
- **Backend**: `Backend/rumi/wsgi.py`, `Backend/rumi/asgi.py` (ASGI for Channels)
- **Backend settings**: `Backend/rumi/settings/` (base + env-specific)
- **URL root**: `Backend/rumi/urls.py`
- **Frontend**: `frontend/src/app/layout.tsx`
- **Frontend middleware**: `frontend/middleware.ts` (auth guards)
- **Celery**: `Backend/rumi/celery.py`

## API Documentation
- Swagger UI: `/swagger/`
- ReDoc: `/redoc/`
- JSON spec: `/swagger.json`
- All APIs versioned under `/api/v1/`

## Key Design Patterns
- **Role-based API decomposition**: Separate URL namespaces and view modules per user role
- **Service layer**: Some apps use `services.py` / `logic.py` for business logic separation
- **DRF Serializers**: Handle both validation and serialization
- **Celery tasks**: All async work (notifications, billing) in `tasks.py` per app
- **Pay-per-occupied-bed billing**: Real-time accrual tracking in `hostels/bed_models.py`, `hostels/lifecycle_services.py`
- **ML compatibility scoring**: `accounts/ml/compatibility_scorer.py` for roommate matching
