# RUMI Backend Optimization

## What This Is

RUMI is a Kenyan student accommodation platform connecting students with hostels. The Django REST API backend serves four user roles (student, landlord, caretaker, admin/tech support) with M-Pesa and Paystack payments, bed-level occupancy billing, WebSocket notifications, and Celery async tasks. The goal of this project is to comprehensively optimize the backend so every API endpoint works correctly, matches frontend expectations, and has no placeholder/stub implementations.

## Core Value

Every backend API endpoint must work exactly as the frontend expects it — no stubs, no placeholders, no broken payment flows.

## Requirements

### Validated

- ✓ Multi-role user system (student, landlord, caretaker, admin, tech support) — existing
- ✓ JWT authentication with OTP verification — existing
- ✓ Hostel/room/bed management with CRUD — existing
- ✓ Booking system with status lifecycle — existing
- ✓ M-Pesa Daraja STK Push integration — existing (partial)
- ✓ Paystack payment integration — existing (partial)
- ✓ Celery async task queue (Redis) — existing
- ✓ Django Channels WebSocket consumers — existing
- ✓ Role-based API decomposition (landlord_api, student_api, caretaker_operations, admin_api) — existing
- ✓ Pay-per-occupied-bed billing model — existing
- ✓ SMS notifications via Africa's Talking — existing (partial)
- ✓ Prometheus metrics + Sentry monitoring — existing

### Active

- [ ] Payment flows fully implemented — M-Pesa STK push, C2B webhooks, Paystack flows match what frontend calls
- [ ] Stub views replaced — payments/stubs_views.py replaced with real implementations
- [ ] Billing accrual correct — pay-per-occupied-bed lifecycle triggers accurate billing on move-in/out events
- [ ] Receipt generation working — PDF receipts generated and accessible via correct API endpoints
- [ ] Legacy admin layer cleaned — admin_endpoints/ duplication removed/consolidated into admin_api/
- [ ] All API responses match frontend contracts — field names, shapes, and status codes match what frontend components expect
- [ ] Caretaker placeholder logic replaced — maintenance requests, damage reports use real models
- [ ] N+1 queries fixed — hostel listings, booking lists, analytics views use select_related/prefetch_related
- [ ] Notification tasks wired — SMS and email dispatch fires on relevant events (booking confirmed, payment received, rent due)
- [ ] AWS S3 storage wired — media files (receipts, profile images) correctly configured for storage
- [ ] Weather API stub replaced or removed — third_party/weather.py either implemented or removed cleanly
- [ ] Backend test coverage improved — key flows (payments, bookings, billing) have passing tests

### Out of Scope

- Frontend changes — backend must adapt to frontend; no frontend modifications
- Mobile app — not part of this project
- New user-facing features — optimization only; no net-new product features
- Microservices split — keep Django monolith structure

## Context

- **Codebase map**: See `.planning/codebase/` for full architecture, stack, and concerns analysis
- **Database**: Seed/test data only — safe to make schema changes, migrations, and data resets
- **Frontend first**: Pull from frontend code to understand exact API contracts before changing any endpoint response shapes
- **Two venv directories**: `Backend/venv/` and `Backend/venv_new/` — use `venv_new` (newer)
- **Two docs dirs**: `Backend/docs/` and `Backend/Docs/` — both exist, case-sensitive filesystem
- **Payment priority**: M-Pesa and Paystack are the highest-priority flows to fix first

## Constraints

- **Frontend compatibility**: No breaking API changes — field names, URL paths, and response shapes must match what frontend already calls
- **Django monolith**: Keep the existing app structure; do not restructure into microservices
- **Python 3.12 / Django 4.2**: Stay on current versions unless a patch is required
- **No frontend changes**: Backend must conform to frontend expectations, not vice versa

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix backend to match frontend (not vice versa) | Frontend is stable; backend has the stubs/placeholders | — Pending |
| Consolidate admin_endpoints into admin_api | admin_endpoints is explicitly marked deprecated | — Pending |
| Replace stubs_views.py with real payment logic | Stubs in URL config risk being called in production | — Pending |
| Improve test coverage for payment and booking flows | These are highest risk; currently untested | — Pending |

---
*Last updated: 2026-03-07 after initialization*
