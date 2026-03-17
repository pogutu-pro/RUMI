# Roadmap: RUMI Backend Optimization

## Overview

The RUMI backend has three categories of problems: silent production failures in payment flows (Paystack crashes, M-Pesa callbacks routed to the wrong server, stub views that accept requests but write nothing), a deprecated admin layer that cannot be removed until cross-imports are resolved, and missing models and URL registrations that leave caretaker features entirely broken. This roadmap works in strict dependency order — fix silent failures first so that any testing produces trustworthy results, then consolidate and clean up the architecture, then replace placeholder logic with real implementations, and finally add the performance, infrastructure, and test coverage needed for a production-ready backend.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Payment Flow Fixes** - Fix silent production failures in Paystack, M-Pesa, and stub payment views (completed 2026-03-08)
- [x] **Phase 2: Admin Layer Consolidation** - Absorb admin_endpoints views into admin_api and delete the deprecated app (completed 2026-03-16)
- [x] **Phase 3: Payment Stub Promotion** - Promote stubs_views.py views one-by-one into payments/views.py (completed 2026-03-16)
- [x] **Phase 4: Missing Models and URL Wiring** - Create caretaker models, register 9 missing URLs, replace placeholder logic (completed 2026-03-17)
- [ ] **Phase 5: Celery and Notification Fixes** - Fix beat schedule, add django-celery-beat, wire SMS/email to events
- [ ] **Phase 6: Performance and Error Standardization** - Fix N+1 queries, add Redis caching, standardize error responses
- [ ] **Phase 7: Infrastructure** - Upgrade boto3, wire S3 storage, remove weather stub dead code
- [ ] **Phase 8: Test Coverage** - Payment lifecycle tests, Paystack HMAC test, assertNumQueries tests, booking tests

## Phase Details

### Phase 1: Critical Payment Flow Fixes
**Goal**: All payment webhooks and admin payment operations write correct data to the database — no silent no-ops, no server crashes, no callbacks routed to the wrong server
**Depends on**: Nothing (first phase)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08
**Success Criteria** (what must be TRUE):
  1. A Paystack `charge.success` webhook POST returns HTTP 200 and updates the Transaction record status without crashing (variable shadowing bug resolved)
  2. M-Pesa STK push initiates with callback URLs pointing to the Django backend domain (BACKEND_API_URL), not the Next.js frontend domain
  3. Concurrent duplicate M-Pesa STK callbacks are handled idempotently — only one Transaction update occurs and both return HTTP 200 to Safaricom
  4. The STK push webhook endpoint never returns HTTP 500 — exceptions are caught, logged, and the endpoint returns HTTP 200 with a valid M-Pesa response body
  5. Paystack HMAC signature verification reads raw `request.body` bytes before any decode
  6. Admin clicking "reject" on an unmatched payment updates the Transaction record status in the database (not just returns `{'status': 'rejected'}`)
  7. `PaymentLedgerView` returns paginated transaction data without raising NameError on `models.Q`
  8. The recurring Celery payment task (`charge_saved_payment_method`) calls the real Paystack API — the `random.choice()` mock is removed
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Fix Paystack `charge.success` variable shadowing crash and outer webhook HTTP 500 (PAY-01, PAY-05) — completed 2026-03-08
- [ ] 01-02-PLAN.md — Fix M-Pesa callback URLs to use BACKEND_API_URL; add select_for_update to STK push webhook; ensure always-HTTP-200 response (PAY-02, PAY-03, PAY-04)
- [ ] 01-03-PLAN.md — Fix UnmatchedPaymentRejectView DB write, fix PaymentLedgerView NameError, remove random.choice() mock from recurring payment task (PAY-06, PAY-07, PAY-08)

### Phase 2: Admin Layer Consolidation
**Goal**: The admin_endpoints/ directory is fully deleted, all admin views live in admin_api/, no cross-imports remain, and the dead URL prefix is removed — with zero frontend impact
**Depends on**: Phase 1
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05
**Success Criteria** (what must be TRUE):
  1. All view classes referenced in `admin_api/platform_admin_urls.py` and `admin_api/super_admin_urls.py` are defined inside `admin_api/views.py` — no imports from `admin_endpoints` remain anywhere in the codebase
  2. The `admin_endpoints/` directory no longer exists on disk and is removed from INSTALLED_APPS
  3. The `/api/v1/admin-endpoints/` URL prefix is removed from `rumi/urls.py`
  4. `python manage.py check` runs clean with no errors or warnings after deletion
  5. All existing admin API responses accessible via `/api/v1/admin/` return the same data shapes as before consolidation
**Plans**: 2 plans

Plans:
- [x] 02-01: Audit all cross-imports from admin_endpoints; copy referenced view classes into admin_api/views.py; update import paths in platform_admin_urls.py and super_admin_urls.py (ADM-01, ADM-02)
- [x] 02-02: Remove admin_endpoints from INSTALLED_APPS; delete admin_endpoints/ directory; remove dead URL prefix from rumi/urls.py; run manage.py check (ADM-03, ADM-04, ADM-05)

### Phase 3: Payment Stub Promotion
**Goal**: Every view in payments/stubs_views.py is promoted to payments/views.py with real logic, and stubs_views.py is deleted — URL paths are unchanged throughout
**Depends on**: Phase 2
**Requirements**: PAY-09, PAY-10, PAY-11, PAY-12, PAY-13, PAY-14
**Success Criteria** (what must be TRUE):
  1. `PaymentVerifyView`, `PaybillAllocationView`, `UnmatchedPaymentsListView`, and `UnmatchedPaymentMatchView` are imported from `payments/views.py` in the URL config (not stubs_views.py), and all return identical responses to before
  2. `PaymentLedgerExportView` returns a real CSV or PDF export of transaction data (not an empty response)
  3. `payments/stubs_views.py` no longer exists — the file is deleted
  4. No URL path changes — frontend continues to call the same paths with the same results
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Promote PaymentVerifyView to views.py; update both verify/ URL entries; add TestPaymentVerifyView (PAY-09) — completed 2026-03-16
- [x] 03-02-PLAN.md — Promote PaybillAllocationView to views.py; hoist MpesaRoutingEngine import; update paybill/ URL entry; add TestPaybillAllocationView (PAY-10) — completed 2026-03-16
- [x] 03-03-PLAN.md — Promote UnmatchedPaymentsListView and UnmatchedPaymentRejectView to views.py; update both URL entries; add tests (PAY-11) — completed 2026-03-16
- [x] 03-04-PLAN.md — Promote UnmatchedPaymentMatchView and PaymentLedgerView to views.py; add BedPaymentLedger/Q/process_payment_to_rent_periods imports; update three URL entries; add tests (PAY-12) — completed 2026-03-16
- [x] 03-05-PLAN.md — Implement real CSV export in PaymentLedgerExportView; promote to views.py; update ledger/export/ URL entry; delete stubs_views.py; remove stubs_views import from urls.py (PAY-13, PAY-14) — completed 2026-03-16

### Phase 4: Missing Models and URL Wiring
**Goal**: The three missing caretaker models exist with correct fields matching frontend type contracts, all 9 missing caretaker URLs are registered and wired to real views, and placeholder list logic is replaced with real ORM queries
**Depends on**: Phase 3
**Requirements**: MOD-01, MOD-02, MOD-03, MOD-04, URL-01, URL-02, URL-03, URL-04, URL-05, URL-06, URL-07, URL-08, URL-09, PLC-01, PLC-02, PLC-03
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/caretaker/maintenance/` returns a real list from the database (not an empty array placeholder), and `GET /api/v1/caretaker/maintenance/{id}/` returns a single record
  2. `GET /api/v1/caretaker/visitor-invitations/` and all five visitor invitation action endpoints (approve, reject, check-in, check-out, POST create) return real responses backed by the VisitorInvitation model
  3. `POST /api/v1/caretaker/roommate-requests/{id}/approve/` and `/reject/` are registered and return real responses
  4. `GET /api/v1/caretaker/damage-reports/{id}/` detail endpoint is registered and returns real data
  5. Late entry logic returns real LateEntry records — the `booking.id % 7` simulation is gone
  6. Weather stub endpoint (`/api/v1/home/weather/`) is removed — no 500 or placeholder response returned
  7. Migrations for all three new models are written and apply cleanly with `python manage.py migrate`
**Plans**: 6 plans

Plans:
- [ ] 04-01-PLAN.md — Create VisitorInvitation model in caretaker_operations/models.py; run makemigrations + migrate for all 3 models (MOD-01, MOD-04)
- [ ] 04-02-PLAN.md — Append MaintenanceRequest model to caretaker_operations/models.py (MOD-02)
- [ ] 04-03-PLAN.md — Append LateEntry model to caretaker_operations/models.py (MOD-03)
- [ ] 04-04-PLAN.md — Add 5 visitor invitation views + 2 roommate thin-wrapper views; register 7 URLs (URL-01 to URL-07)
- [ ] 04-05-PLAN.md — Add MaintenanceRequestDetailView + CaretakerDamageReportDetailView; fix PLC-01 maintenance placeholder; fix PLC-02 LateEntry simulation (URL-08, URL-09, PLC-01, PLC-02)
- [ ] 04-06-PLAN.md — Delete WeatherView, weather/ URL entry, third_party/weather.py (PLC-03)

### Phase 5: Celery and Notification Fixes
**Goal**: The Celery beat schedule references correct task names, django-celery-beat is installed, all task dispatches inside atomic blocks use on_commit, and SMS/email notifications fire on booking and payment events
**Depends on**: Phase 4
**Requirements**: CEL-01, CEL-02, CEL-03, CEL-04, CEL-05, CEL-06
**Success Criteria** (what must be TRUE):
  1. `django-celery-beat==2.6.0` is in requirements.txt and its migrations are applied — `python manage.py migrate django_celery_beat` runs cleanly
  2. The Celery beat schedule references `payments.tasks.assess_late_fees` (not `process_late_fees`) and includes the `retry_failed_webhook_events` task entry on a 5-minute crontab
  3. No `.delay()` call inside a `transaction.atomic()` block runs before the transaction commits — all are wrapped with `transaction.on_commit(lambda: task.delay(...))`
  4. A booking confirmation event triggers the `send_booking_confirmation` Celery task, which dispatches an SMS or email to the relevant user
  5. A payment received event triggers the `send_payment_notification` Celery task
  6. The hardcoded `recipient_id=1` in payments/tasks.py is replaced with a dynamic lookup of the first superuser
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Add django-celery-beat==2.6.0 to requirements.txt; register in INSTALLED_APPS; run migrations; rename reconcile_missed_webhooks to retry_failed_webhook_events; fix assess_late_fees beat entry; add retry-failed-webhook-events beat entry (CEL-01, CEL-02, CEL-03)
- [ ] 05-02-PLAN.md — Wrap 6 confirmed .delay() violations in payments/views.py and hostels/views.py with transaction.on_commit(); replace hardcoded recipient_id=1 with dynamic superuser lookup in payments/tasks.py (CEL-04, CEL-06)
- [ ] 05-03-PLAN.md — Create send_booking_confirmation and send_payment_notification tasks; wire both into _handle_charge_success via on_commit; wire M-Pesa _send_payment_notifications via on_commit (CEL-05)

### Phase 6: Performance and Error Standardization
**Goal**: Hostel listing, booking list, and bed detail endpoints issue no N+1 queries, high-read public endpoints are cached in Redis, and all API error responses share a consistent shape
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, ERR-01, ERR-02
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/hostels/` query count is confirmed reduced by `assertNumQueries` test — HostelViewSet uses select_related('landlord__user') and prefetch_related('hostel_amenities__amenity', 'rooms')
  2. Bed occupant data and booking room info are fetched without N+1 queries — confirmed by assertNumQueries
  3. `GET /api/v1/hostels/` responses are cached in Redis for 5 minutes with cache invalidation on Hostel post_save signal
  4. `GET /api/v1/home/` responses are cached in Redis for 15 minutes
  5. All API error responses have a consistent shape — no mix of `{'error': ...}` vs `{'detail': ...}` — a custom DRF exception handler in core/exceptions.py normalizes all errors
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Write all test stubs (Wave 0); fix N+1 queries in HostelViewSet, RoomViewSet, BookingViewSet (PERF-01, PERF-02, PERF-03)
- [ ] 06-02-PLAN.md — Implement Redis caching on GET /api/v1/hostels/ with 5-min TTL + post_save/post_delete signal invalidation; cache GET /api/v1/home/ with 15-min TTL (PERF-04, PERF-05)
- [ ] 06-03-PLAN.md — Create core/exceptions.py custom DRF exception handler; wire REST_FRAMEWORK['EXCEPTION_HANDLER'] in settings.py (ERR-01, ERR-02)

### Phase 7: Infrastructure
**Goal**: boto3 is current, S3 storage is wired behind a USE_S3 feature flag, existing local media files are documented for sync, and the weather stub dead code is fully removed
**Depends on**: Phase 6
**Requirements**: INF-01, INF-02, INF-03, INF-04
**Success Criteria** (what must be TRUE):
  1. `boto3` in requirements.txt is upgraded to current stable version and the application starts without dependency errors
  2. `USE_S3=true` activates `S3Boto3Storage` as the default file storage backend; `USE_S3=false` (default) keeps local disk storage — the settings block handles both cases
  3. `ReceiptGenerateView` uses storage backend URLs (via `receipt.url`) rather than hardcoded `/media/` path strings — verified by code audit before S3 is enabled
  4. Existing local receipt files in `Backend/media/` are inventoried and a sync command is documented so no existing receipt URLs break when S3 is enabled
**Plans**: TBD

Plans:
- [ ] 07-01: Upgrade boto3 to current stable in requirements.txt; verify no dependency conflicts (INF-01)
- [ ] 07-02: Add USE_S3 flag to settings.py with full STORAGES block for S3Boto3Storage; add AWS env var config (INF-02)
- [ ] 07-03: Audit ReceiptGenerateView for hardcoded /media/ URL strings; update to use storage backend URLs; inventory existing media files and document aws s3 sync command (INF-03, INF-04)

### Phase 8: Test Coverage
**Goal**: The highest-risk payment and booking flows have passing integration tests, N+1 fixes are verified by query count assertions, and the Paystack HMAC path is covered by an integration test
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. An integration test exercises the full M-Pesa STK push flow — initiation, callback POST, Transaction status update, receipt generation — and all assertions pass
  2. A Paystack webhook integration test POSTs a webhook with a known payload and HMAC signature and asserts HTTP 200 and the correct Transaction status update
  3. `assertNumQueries` tests for the hostel listing endpoint confirm the query count is reduced compared to the pre-optimization baseline
  4. A booking lifecycle test covers booking creation, approval, check-in, and check-out — all state transitions assert the correct status in the database
**Plans**: TBD

Plans:
- [ ] 08-01: Write M-Pesa STK push payment lifecycle integration test (initiation → callback → Transaction update → receipt) (TEST-01)
- [ ] 08-02: Write Paystack HMAC webhook integration test (POST with known payload + secret → assert HTTP 200 + Transaction update) (TEST-02)
- [ ] 08-03: Write assertNumQueries tests for hostel listing endpoint confirming N+1 query reduction (TEST-03)
- [ ] 08-04: Write booking lifecycle tests (created → approved → checked in → checked out with status assertions) (TEST-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Payment Flow Fixes | 3/3 | Complete    | 2026-03-08 |
| 2. Admin Layer Consolidation | 2/2 | Complete    | 2026-03-16 |
| 3. Payment Stub Promotion | 5/5 | Complete    | 2026-03-16 |
| 4. Missing Models and URL Wiring | 6/6 | Complete   | 2026-03-17 |
| 5. Celery and Notification Fixes | 2/3 | In Progress|  |
| 6. Performance and Error Standardization | 0/3 | Not started | - |
| 7. Infrastructure | 0/3 | Not started | - |
| 8. Test Coverage | 0/4 | Not started | - |
