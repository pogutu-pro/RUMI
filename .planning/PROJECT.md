# RUMI Backend Optimization

## What This Is

RUMI is a Kenyan student accommodation platform connecting students with hostels. The Django REST API backend serves four user roles (student, landlord, caretaker, admin/tech support) with M-Pesa and Paystack payments, bed-level occupancy billing, WebSocket notifications, and Celery async tasks. v1.0 delivered a fully working backend — all payment flows write correct data, all caretaker endpoints are wired to real models, the deprecated admin layer is deleted, N+1 queries are eliminated, and key flows have passing integration tests.

## Core Value

Every backend API endpoint must work exactly as the frontend expects it — no stubs, no placeholders, no broken payment flows.

## Requirements

### Validated

- ✓ Multi-role user system (student, landlord, caretaker, admin, tech support) — existing
- ✓ JWT authentication with OTP verification — existing
- ✓ Hostel/room/bed management with CRUD — existing
- ✓ Booking system with status lifecycle — existing
- ✓ M-Pesa Daraja STK Push integration — fully working v1.0
- ✓ Paystack payment integration — fully working v1.0
- ✓ Celery async task queue (Redis) — beat schedule corrected, on_commit wrappers added v1.0
- ✓ Django Channels WebSocket consumers — existing
- ✓ Role-based API decomposition (landlord_api, student_api, caretaker_operations, admin_api) — existing
- ✓ Pay-per-occupied-bed billing model — existing
- ✓ SMS notifications via Africa's Talking — wired on payment/booking events v1.0
- ✓ Prometheus metrics + Sentry monitoring — existing
- ✓ Payment flows fully implemented — M-Pesa STK push, C2B webhooks, Paystack flows all write correct data — v1.0
- ✓ Stub views replaced — payments/stubs_views.py deleted; all 6 views promoted — v1.0
- ✓ Legacy admin layer cleaned — admin_endpoints/ deleted, zero cross-imports — v1.0
- ✓ Caretaker placeholder logic replaced — VisitorInvitation, MaintenanceRequest, LateEntry models wired — v1.0
- ✓ N+1 queries fixed — hostel/room/booking viewsets use select_related/prefetch_related — v1.0
- ✓ Notification tasks wired — send_booking_confirmation, send_payment_notification on_commit dispatch — v1.0
- ✓ AWS S3 storage wired — USE_S3 flag, STORAGES dict, receipt URLs using storage backend — v1.0
- ✓ Weather API stub removed — WeatherView, weather/ URL, third_party/weather.py deleted — v1.0
- ✓ Backend test coverage improved — M-Pesa lifecycle, Paystack HMAC, assertNumQueries, booking state machine — v1.0

### Active

- [ ] Squash migrations — hostels/ (26 migrations) and payments/ (24 migrations) squashed after schema stabilizes
- [ ] WebSocket token expiry handling — frontend reconnect-on-token-refresh for long-lived connections
- [ ] Billing accrual correctness — pay-per-occupied-bed lifecycle triggers verified with integration tests
- [ ] Receipt generation — PDF receipts fully exercised end-to-end in staging with S3 enabled

### Out of Scope

- Frontend changes — backend must adapt to frontend; no frontend modifications
- Mobile app — not part of this project
- New user-facing features — optimization only; no net-new product features
- Microservices split — keep Django monolith structure
- ML roommate compatibility — expanded training data deferred

## Context

- **Shipped:** v1.0 on 2026-03-17 — 8 phases, 30 plans, 52 requirements, 140 files changed
- **Codebase map**: See `.planning/codebase/` for full architecture, stack, and concerns analysis
- **Database**: Seed/test data only — safe to make schema changes, migrations, and data resets
- **Frontend first**: Pull from frontend code to understand exact API contracts before changing any endpoint response shapes
- **Two venv directories**: `Backend/venv/` and `Backend/venv_new/` — use `venv_new` (newer)
- **Payment priority**: M-Pesa and Paystack flows are fully working; next focus is billing accrual correctness
- **Known deferred item**: `test_monthly_invoice_generation` has a date-dependent assertion (`== 30`) that fails in 28-day months — needs `calendar.monthrange()` fix

## Constraints

- **Frontend compatibility**: No breaking API changes — field names, URL paths, and response shapes must match what frontend already calls
- **Django monolith**: Keep the existing app structure; do not restructure into microservices
- **Python 3.12 / Django 4.2**: Stay on current versions unless a patch is required
- **No frontend changes**: Backend must conform to frontend expectations, not vice versa

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix backend to match frontend (not vice versa) | Frontend is stable; backend has the stubs/placeholders | ✓ Good — no frontend regressions |
| Consolidate admin_endpoints into admin_api | admin_endpoints is explicitly marked deprecated | ✓ Good — zero cross-imports, manage.py check clean |
| Replace stubs_views.py with real payment logic | Stubs in URL config risk being called in production | ✓ Good — all 6 views promoted, stubs_views.py deleted |
| Improve test coverage for payment and booking flows | These are highest risk; currently untested | ✓ Good — 3 integration test classes passing; found 2 production bugs during Phase 8 |
| Rename `transaction` → `txn` in _handle_charge_success | Variable shadowing with Django transaction module caused AttributeError crash | ✓ Good — silenced a production crash on every Paystack webhook |
| Use USE_S3 feature flag for storage | Allows dev/CI to stay on local disk while production uses S3 | ✓ Good — zero config for local dev |
| Wrap all .delay() in transaction.on_commit() | Celery tasks fired before DB commit could process stale data | ✓ Good — 6 violations fixed |

---
*Last updated: 2026-03-17 after v1.0 milestone*