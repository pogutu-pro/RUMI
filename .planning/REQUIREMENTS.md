# Requirements: RUMI Backend Optimization

**Defined:** 2026-03-07
**Core Value:** Every backend API endpoint works exactly as the frontend expects — no stubs, no placeholders, no broken payment flows.

---

## v1 Requirements

### Payments — Critical Bug Fixes

- [x] **PAY-01**: Paystack `charge.success` webhook processes without crashing — variable shadowing bug fixed (`transaction` name collision in `_handle_charge_success`)
- [x] **PAY-02**: M-Pesa STK push callback URLs point to the Django backend API domain, not the Next.js frontend domain (`BACKEND_API_URL` env var used instead of `FRONTEND_URL`)
- [x] **PAY-03**: STK push webhook handles duplicate M-Pesa deliveries idempotently using `select_for_update()` before the status check
- [x] **PAY-04**: STK push webhook always returns HTTP 200 to Safaricom (no HTTP 500 responses that trigger infinite retries)
- [x] **PAY-05**: Paystack webhook signature verification uses raw `request.body` bytes (no middleware decode interference)
- [x] **PAY-06**: `UnmatchedPaymentRejectView` updates the Transaction record status in the database (not just return `{'status': 'rejected'}`)
- [x] **PAY-07**: `PaymentLedgerView` fixes `models.Q` NameError and returns real paginated transaction data
- [x] **PAY-08**: Celery recurring payment task (`charge_saved_payment_method`) calls real Paystack API — `random.choice()` mock removed

### Payments — Stub Promotion

- [ ] **PAY-09**: `PaymentVerifyView` promoted from `stubs_views.py` to `payments/views.py` (real ORM queries retained, URL path unchanged)
- [ ] **PAY-10**: `PaybillAllocationView` promoted from `stubs_views.py` to `payments/views.py` (real ORM queries retained, URL path unchanged)
- [ ] **PAY-11**: `UnmatchedPaymentsListView` promoted from `stubs_views.py` to `payments/views.py` (real ORM queries retained, URL path unchanged)
- [ ] **PAY-12**: `UnmatchedPaymentMatchView` promoted from `stubs_views.py` to `payments/views.py` (real ORM + service call retained, URL path unchanged)
- [ ] **PAY-13**: `PaymentLedgerExportView` implemented with real export logic (CSV/PDF), promoted to `payments/views.py`
- [ ] **PAY-14**: `stubs_views.py` deleted after all views promoted

### Admin Layer Consolidation

- [x] **ADM-01**: All view classes referenced in `admin_api/platform_admin_urls.py` and `admin_api/super_admin_urls.py` moved into `admin_api/views.py`
- [x] **ADM-02**: Cross-imports from `admin_endpoints` removed from `admin_api/` (zero `from admin_endpoints import` statements remain)
- [x] **ADM-03**: `admin_endpoints` removed from `INSTALLED_APPS` and its directory deleted
- [x] **ADM-04**: Dead `/api/v1/admin-endpoints/` URL prefix removed from `rumi/urls.py`
- [x] **ADM-05**: `python manage.py check` passes cleanly after consolidation

### Missing Models — Caretaker & Student

- [x] **MOD-01**: `VisitorInvitation` model created with fields matching `frontend/src/types/caretaker.types.ts` contract
- [x] **MOD-02**: `MaintenanceRequest` model created with fields matching frontend caretaker types contract
- [x] **MOD-03**: `LateEntry` model created with fields matching frontend types contract
- [x] **MOD-04**: Migrations written and applied for all three new models

### Missing URL Registrations — Caretaker

- [ ] **URL-01**: `GET/POST /api/v1/caretaker/visitor-invitations/` registered and wired to real view using `VisitorInvitation` model
- [ ] **URL-02**: `POST /api/v1/caretaker/visitor-invitations/{id}/approve/` registered
- [ ] **URL-03**: `POST /api/v1/caretaker/visitor-invitations/{id}/reject/` registered
- [ ] **URL-04**: `POST /api/v1/caretaker/visitor-invitations/{id}/check-in/` registered
- [ ] **URL-05**: `POST /api/v1/caretaker/visitor-invitations/{id}/check-out/` registered
- [ ] **URL-06**: `POST /api/v1/caretaker/roommate-requests/{id}/approve/` registered
- [ ] **URL-07**: `POST /api/v1/caretaker/roommate-requests/{id}/reject/` registered
- [ ] **URL-08**: `GET /api/v1/caretaker/maintenance/{id}/` detail endpoint registered using `MaintenanceRequest` model
- [ ] **URL-09**: `GET /api/v1/caretaker/damage-reports/{id}/` detail endpoint registered

### Placeholder Logic Replacement

- [ ] **PLC-01**: `caretaker_operations/views.py` `maintenance_requests = []` replaced with real `MaintenanceRequest` ORM query
- [ ] **PLC-02**: `caretaker_operations/additional_views.py` `booking.id % 7` simulation replaced with real `LateEntry` model query
- [x] **PLC-03**: Weather stub (`third_party/weather.py` + `home/views.py:WeatherView` + URL registration) removed — no frontend component calls this endpoint

### Celery & Task Fixes

- [ ] **CEL-01**: `django-celery-beat==2.6.0` added to `requirements.txt` and migrated
- [ ] **CEL-02**: `BEAT_SCHEDULE` task name corrected (`payments.tasks.assess_late_fees`, not `process_late_fees`)
- [ ] **CEL-03**: `WebhookEvent` retry task registered in `BEAT_SCHEDULE` (`crontab(minute='*/5')`)
- [ ] **CEL-04**: All `.delay()` calls inside `transaction.atomic()` blocks wrapped with `transaction.on_commit(lambda: task.delay(...))`
- [ ] **CEL-05**: Celery notification tasks (`send_payment_notification`, `send_booking_confirmation`) wired to fire on correct events (booking approved, payment received, rent due)
- [ ] **CEL-06**: Hardcoded `recipient_id=1` in `payments/tasks.py` replaced with `User.objects.filter(is_superuser=True).first().id`

### Performance — Query Optimization

- [ ] **PERF-01**: `HostelViewSet.get_queryset()` uses `select_related('landlord__user')` and `prefetch_related('hostel_amenities__amenity', 'rooms')` — N+1 eliminated
- [ ] **PERF-02**: `BedSerializer.get_current_occupant()` N+1 fixed via `prefetch_related('occupancies')` in parent ViewSet
- [ ] **PERF-03**: `BookingSerializer.get_room_info()` N+1 fixed via `select_related('room__hostel')` in BookingViewSet
- [ ] **PERF-04**: Redis caching applied to `GET /api/v1/hostels/` (5 min TTL) with cache invalidation on Hostel `post_save`
- [ ] **PERF-05**: Redis caching applied to `GET /api/v1/home/` homepage endpoint (15 min TTL)

### Error Response Standardization

- [ ] **ERR-01**: Custom DRF exception handler in `core/exceptions.py` normalizes all error responses to consistent shape (no more mix of `{'error': ...}` vs `{'detail': ...}`)
- [ ] **ERR-02**: `REST_FRAMEWORK['EXCEPTION_HANDLER']` in settings points to custom handler

### Infrastructure

- [ ] **INF-01**: `boto3` upgraded from `1.29.7` to current stable in `requirements.txt`
- [ ] **INF-02**: `USE_S3` environment variable flag added to settings — activates `S3Boto3Storage` in production, keeps local disk for dev/CI
- [ ] **INF-03**: `ReceiptGenerateView` audited and updated to use storage backend URLs (not hardcoded `/media/` paths) before S3 is enabled
- [ ] **INF-04**: Existing local media files documented for sync to S3 before production S3 enablement

### Test Coverage

- [ ] **TEST-01**: Payment lifecycle integration test — STK push initiation → callback → Transaction status → receipt generated
- [ ] **TEST-02**: Paystack HMAC webhook integration test — posts webhook with known payload + secret, asserts HTTP 200 and Transaction update
- [ ] **TEST-03**: `assertNumQueries` tests for hostel listing endpoint (confirm N+1 fixes actually reduce queries)
- [ ] **TEST-04**: Booking lifecycle tests — booking created → approved → checked in → checked out

---

## v2 Requirements (Deferred)

### Squash Migrations
- `hostels/` (26 migrations) and `payments/` (24 migrations) squashed after schema stabilizes

### WebSocket Token Expiry Handling
- Frontend reconnect-on-token-refresh logic for long-lived WebSocket connections

### ML Roommate Compatibility
- `accounts/ml/compatibility_scorer.py` — expanded training data, improved scoring

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Frontend changes | Backend must conform to frontend; no frontend modifications |
| New product features | Optimization only — fix what's broken |
| Microservices | Keep Django monolith |
| Mobile app | Not part of this project |
| New payment providers | M-Pesa + Paystack sufficient for v1 |
| New user roles | Existing 5 roles are sufficient |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAY-01, PAY-05 | Phase 1 (01-01) | Complete |
| PAY-02 to PAY-04, PAY-06 to PAY-08 | Phase 1 | Pending |
| ADM-01 to ADM-05 | Phase 2 | Complete |
| PAY-09 to PAY-14 | Phase 3 | Pending |
| MOD-01 to MOD-04 | Phase 4 | Pending |
| URL-01 to URL-09 | Phase 4 | Pending |
| PLC-01 to PLC-03 | Phase 4 | Pending |
| CEL-01 to CEL-06 | Phase 5 | Pending |
| PERF-01 to PERF-05 | Phase 6 | Pending |
| ERR-01 to ERR-02 | Phase 6 | Pending |
| INF-01 to INF-04 | Phase 7 | Pending |
| TEST-01 to TEST-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after initial definition*
