# Project Research Summary

**Project:** RUMI Backend Optimization
**Domain:** Django REST API backend — Kenyan student accommodation platform
**Researched:** 2026-03-07
**Confidence:** HIGH — all four research dimensions sourced from direct codebase inspection

## Executive Summary

RUMI is a multi-role Django 4.2 + DRF backend serving students, landlords, caretakers, and admins on a student accommodation platform in Kenya. Research found the codebase is architecturally sound — the stack, app decomposition, and core models are production-grade — but there are three categories of immediate problems: silent production failures in payment flows, placeholder logic shipped as live endpoints, and a deprecated app layer that cannot be safely removed yet due to unresolved cross-imports. The M-Pesa and Paystack flows are the highest-priority concern because multiple bugs (Paystack variable shadowing crash, M-Pesa callback URLs pointing at the frontend, missing `select_for_update` on STK webhook) mean real payments are either failing silently or creating race-condition double-credits today.

The recommended approach is to work in strict dependency order: fix broken payment flows and critical bugs first, then consolidate the legacy admin layer, then replace caretaker and student placeholder logic (which requires creating missing models), then apply performance optimizations (N+1 fixes, caching), and finally wire infrastructure concerns (S3, Celery beat, notification dispatch). Skipping ahead — for example, enabling the Celery beat scheduler before replacing the random-mock recurring payment task — would cause production harm. The frontend-contract constraint is non-negotiable throughout: every serializer field name and URL path must remain stable; the frontend is the source of truth for API shape.

The key risk profile is concentrated in payment flows and the Celery task layer. Payment bugs are silent — they return HTTP 200 but don't complete their DB writes or they double-process. The Celery beat schedule has two broken task references (wrong function name for `assess_late_fees`, missing registration for webhook retry), and the recurring payment task contains a live `random.choice()` mock that would randomly fail 25% of real payments. These must be resolved before any scheduled tasks are enabled in a real environment. All other risks (N+1 queries, S3 migration, WebSocket JWT expiry) are medium-severity and well-understood with clear mitigations.

---

## Key Findings

### Recommended Stack

The existing stack — Django 4.2 LTS, DRF, Celery + Redis, Django Channels, django-storages + boto3, Africa's Talking SMS — is appropriate and should be kept as-is. No version upgrades are needed for Django. Two dependencies need attention: `django-celery-beat==2.6.0` is missing from `requirements.txt` despite being referenced in settings (silent fallback to file-based scheduling), and `boto3==1.29.7` is two years outdated and should be upgraded before S3 is enabled.

**Core technologies:**
- Django 4.2 LTS + DRF: API layer — keep on current LTS (supported through 2026)
- Celery + Redis: async task queue — already wired; beat scheduler config is broken (fix task names + add `django-celery-beat` to requirements)
- Django Channels: WebSocket real-time notifications — wired; JWT auth only validated at handshake (token expiry mid-session is a known gap)
- django-storages + boto3: S3 file storage — already in requirements; settings block not yet written; upgrade boto3 first
- Africa's Talking: SMS notifications — infrastructure exists; event wiring is incomplete

### Expected Features

Research confirmed all four roles have table-stakes features that are either broken or wired to placeholder logic. The caretaker role has the most gaps: 9 URLs are not registered in `caretaker_operations/urls.py`, and placeholder list views return empty arrays because the underlying models (`MaintenanceRequest`, `LateEntry`, `VisitorInvitation`) do not exist.

**Must have (table stakes — currently broken or missing):**
- Paystack webhook processing — crashes due to `transaction` variable shadowing `django.db.transaction` import
- M-Pesa STK push callback routing — callback URLs built from `FRONTEND_URL`, causing Safaricom to POST to the Next.js server (wrong destination)
- `UnmatchedPaymentRejectView` — returns success HTTP 200 but never writes to the database
- `PaymentLedgerView` — raises `NameError` on `models.Q` due to missing import
- Admin payment oversight — depends on stub views that silently no-op
- Caretaker maintenance/damage/visitor workflows — placeholder returns empty lists; models do not exist

**Should have (operational gaps to close):**
- Caretaker: 9 missing URL registrations for visitor invitations and roommate request actions
- Student: activity feed, support tickets, unread message count endpoints (registration status unclear)
- Landlord: tenant detail endpoint (referenced in frontend, URL missing)
- Webhook retry automation — `retry_failed_webhook_events` task exists but is not in `BEAT_SCHEDULE`

**Defer (outside optimization scope):**
- Mobile app / PWA features
- New payment providers
- Real-time student-landlord chat
- New user roles

### Architecture Approach

The app decomposition is correct and should be preserved. The consolidation work is about removing a deprecated duplicate (`admin_endpoints/`) and promoting stub views into their rightful location (`payments/views.py`), not restructuring. The safe invariant throughout all refactoring: URL paths never change, only Python import paths change. ARCHITECTURE.md provides a ten-step ordered plan from highest-impact bug fixes through dead-code removal.

**Major components:**
1. `payments/` — all payment logic (M-Pesa, Paystack, receipts, billing, ledger); stubs_views.py views must migrate here
2. `admin_api/` — all admin views (after absorbing view classes currently cross-imported from `admin_endpoints/`)
3. `caretaker_operations/` — caretaker views plus new `MaintenanceRequest` and `LateEntry` models
4. `hostels/` — hostel/room/bed/booking core; primary N+1 query surface
5. `accounts/` — auth, profiles, WebSocket consumers, subscriptions, roommate system

### Critical Pitfalls

1. **STK Push webhook has no `select_for_update`** — M-Pesa retries callbacks; concurrent delivery can double-credit rent. Fix: wrap idempotency check in `select_for_update()` inside `atomic()` before any other status check.

2. **M-Pesa callback URLs point at frontend domain** — `settings.py` builds all three webhook URLs from `FRONTEND_URL`. Safaricom POSTs to Next.js, gets 404, retries until giving up. All STK push payments stay `pending` forever. Fix: introduce `BACKEND_API_URL` env var; never derive webhook URLs from frontend hostname.

3. **Paystack webhook HMAC uses potentially re-encoded body** — if middleware touches the request stream before the view, HMAC digest mismatches and every Paystack webhook is silently rejected. Fix: read `request.body` as raw bytes before any decode; add integration test.

4. **Recurring payment Celery task uses `random.choice()` mock** — `charge_saved_payment_method()` is live task code that simulates 75% success. In production this randomly fails 25% of recurring payments and permanently disables recurring billing after 3 random failures. Fix: block enabling `process_recurring_payments` in beat schedule until the mock is replaced with a real Paystack charge call.

5. **Deleting `admin_endpoints/` before removing all cross-imports causes startup `ImportError`** — both `platform_admin_urls.py` and `super_admin_urls.py` import from `admin_endpoints`. Fix: copy all referenced view classes into `admin_api/views.py`, update imports to zero, then delete the directory. Run `python manage.py check` after each step.

---

## Implications for Roadmap

Based on the combined research, the following phase structure is recommended. The ordering is driven by two constraints: (1) silent production failures must be fixed before any testing can produce trustworthy results, and (2) schema changes (new models) must precede the URL wiring that depends on them.

### Phase 1: Critical Payment Flow Fixes
**Rationale:** Three bugs cause silent production failures today — Paystack crashes, M-Pesa callbacks route to the wrong server, and stub views accept requests but write nothing. No payment testing is valid until these are fixed. This is the highest-risk phase and the highest-value fix.
**Delivers:** Working end-to-end payment flows for M-Pesa STK push, M-Pesa C2B, and Paystack; admin payment rejection that actually writes to the database; payment ledger search that doesn't `NameError`.
**Addresses:** Paystack variable shadowing bug, `PaymentLedgerView` NameError, `UnmatchedPaymentRejectView` no-op, M-Pesa callback URL misconfiguration, STK push `select_for_update` race condition, M-Pesa webhook always-HTTP-200 requirement.
**Avoids:** Pitfalls 1, 2, 3, 5, 11.
**Research flag:** No deeper research needed — bugs are precisely located with line numbers in FEATURES.md and PITFALLS.md.

### Phase 2: Admin Layer Consolidation
**Rationale:** Low-risk refactoring with zero frontend impact (URL paths don't change). Unblocks clean architecture for subsequent phases. Should be done early while the codebase is fresh.
**Delivers:** `admin_endpoints/` directory fully removed; all admin views live in `admin_api/`; no duplicate URL prefixes; `python manage.py check` passes cleanly.
**Addresses:** Cross-import dependency between `admin_api/` and `admin_endpoints/`, dead `/api/v1/admin-endpoints/` URL registration.
**Avoids:** Pitfalls 4 and 12 — import audit must precede deletion.
**Research flag:** No deeper research needed — consolidation order is documented in ARCHITECTURE.md step by step.

### Phase 3: Stub View Promotion (Payment Views)
**Rationale:** Stubs in `payments/stubs_views.py` are live in the production URL config and represent either broken or no-op implementations. Each view needs to be promoted to `payments/views.py` one at a time — this is low-risk but methodical work.
**Delivers:** `PaymentVerifyView`, `PaybillAllocationView`, `UnmatchedPaymentsListView`, `UnmatchedPaymentMatchView` promoted with real logic; `PaymentLedgerExportView` implemented (currently returns empty).
**Addresses:** Feature gaps in payment admin and payment verification flows identified in FEATURES.md.
**Avoids:** Pitfall 5 — replace one stub at a time, verify frontend after each, never change URL paths.
**Research flag:** No deeper research needed — promotion order and action per view is documented in ARCHITECTURE.md.

### Phase 4: Missing Models and Caretaker URL Wiring
**Rationale:** Caretaker features are the largest functional gap. The placeholder logic exists because models don't exist yet. Models must come before URL registration. Frontend TypeScript types must be consulted before designing model fields.
**Delivers:** `MaintenanceRequest`, `LateEntry`, and `VisitorInvitation` models with migrations; real ORM queries replacing all placeholder arrays; all 9 missing caretaker URL registrations added.
**Addresses:** Caretaker table-stakes gaps from FEATURES.md; placeholder logic at `caretaker_operations/views.py:853` and `additional_views.py:58`.
**Avoids:** Creating models that mismatch frontend type contracts — must grep `frontend/src/types/caretaker.types.ts` first (see ARCHITECTURE.md).
**Research flag:** May need phase-level research on `VisitorInvitation` if frontend types reveal complexity. `MaintenanceRequest` and `LateEntry` are straightforward — standard patterns apply.

### Phase 5: N+1 Query Fixes and Caching
**Rationale:** Performance work comes after correctness work. N+1 fixes require tests to verify they actually reduce query counts — don't apply them without `assertNumQueries` confirmation.
**Delivers:** `HostelViewSet`, `BedViewSet`, and `BookingViewSet` with `select_related`/`prefetch_related`; Redis caching on high-read public endpoints (hostel list, hostel detail, homepage, analytics); separate read/write serializers for heavy endpoints.
**Addresses:** N+1 findings in STACK.md; cache targets table in STACK.md; analytics placeholder data in FEATURES.md.
**Avoids:** Pitfall 6 — `assertNumQueries` tests must confirm actual reduction; diff serializer output before/after to protect frontend contracts; Pitfall 10 — never rename a serializer field without grepping frontend.
**Research flag:** Standard Django ORM optimization patterns — no additional research needed.

### Phase 6: Celery Task Fixes and Notification Wiring
**Rationale:** Celery beat has two broken task registrations (`assess_late_fees` name mismatch, missing webhook retry entry) and the recurring payment mock must be replaced before beat is enabled. Notification dispatch (SMS/email on booking/payment events) is infrastructure that already exists but is not connected to event triggers.
**Delivers:** Corrected `BEAT_SCHEDULE` with proper task names; `django-celery-beat==2.6.0` added to requirements; `on_commit` wrapping for all `.delay()` calls inside `atomic()` blocks; real Paystack charge replacing `random.choice()` mock; SMS and email dispatch wired to booking confirmed, payment received, and rent due events; admin notification hardcoded user ID 1 replaced.
**Addresses:** STACK.md findings 2, 3, 4, 6; PITFALLS.md pitfalls 9, 14.
**Avoids:** Pitfall 9 — block enabling `process_recurring_payments` beat entry until mock is replaced.
**Research flag:** Paystack recurring charge API documentation may need review before implementing the real charge call.

### Phase 7: AWS S3 Storage and Infrastructure Cleanup
**Rationale:** Infrastructure work is last because it is config-only with no logic changes, but it carries migration risk for existing receipt files. Dead code removal (weather stub, docs directory merge) is also lowest priority.
**Delivers:** `USE_S3` feature flag in settings with full `STORAGES` block; boto3 upgraded to current stable; existing `Backend/media/` files synced to S3 before storage backend switch; weather stub and `WeatherView` deleted; `Backend/docs/` and `Backend/Docs/` merged; WebSocket JWT token expiry documented.
**Addresses:** ARCHITECTURE.md findings 4 and 5; PITFALLS.md pitfalls 7 and 13; PROJECT.md requirement for AWS S3 storage.
**Avoids:** Pitfall 7 — `aws s3 sync` local media to S3 before flipping `DEFAULT_FILE_STORAGE`; audit hardcoded `/media/` URL strings in receipt views before enabling S3.
**Research flag:** No deeper research needed — settings pattern is documented in ARCHITECTURE.md. boto3 upgrade is routine.

### Phase 8: Test Coverage
**Rationale:** Tests validate all prior work and provide a safety net for future changes. Payment and booking flows are the highest risk and lowest test coverage areas.
**Delivers:** `assertNumQueries` tests for N+1 fixes; Paystack webhook HMAC integration test; M-Pesa STK push + callback round-trip test; booking lifecycle test; billing accrual test.
**Addresses:** PROJECT.md requirement for improved test coverage on payments and bookings.
**Avoids:** Pitfall 2 — Paystack HMAC integration test is explicitly called for to catch body re-encoding issues.
**Research flag:** Standard Django test patterns — no additional research needed.

### Phase Ordering Rationale

- Payment fixes (Phase 1) must precede all testing — broken webhooks mean test results are meaningless until the callback URL config and variable shadowing are resolved.
- Admin consolidation (Phase 2) is decoupled from user-facing features and low-risk — good to do early before the codebase grows.
- Stub promotion (Phase 3) follows admin cleanup because both are internal refactoring that sets up a clean foundation for Phase 4 model work.
- Missing models (Phase 4) must precede the URL wiring that depends on them — can't register a URL for a view that queries a non-existent model.
- N+1 fixes (Phase 5) come after correctness is established — performance on broken code is irrelevant.
- Celery/notification wiring (Phase 6) is gated on the recurring payment mock being resolved, so it comes late but before infrastructure changes.
- S3 and cleanup (Phase 7) are lowest urgency and carry file-migration risk — save for last.
- Tests (Phase 8) can be written incrementally throughout but a dedicated phase ensures coverage of the most critical flows.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (VisitorInvitation model):** Frontend caretaker types may reveal complex invitation state machine; consult `frontend/src/types/caretaker.types.ts` before designing schema.
- **Phase 6 (Paystack recurring charge):** Paystack's API for charging a saved card/token may require reviewing current Paystack Charges API documentation — the existing code was never real.

Phases with standard patterns (skip research-phase):
- **Phase 1:** All bugs are precisely located with code snippets in research files — implementation is mechanical.
- **Phase 2:** Consolidation order is fully documented in ARCHITECTURE.md — no research needed.
- **Phase 3:** Stub promotion strategy is documented per-view in ARCHITECTURE.md.
- **Phase 5:** Django ORM optimization is a well-documented pattern; `assertNumQueries` approach is standard.
- **Phase 7:** S3 settings pattern is documented in ARCHITECTURE.md; boto3 upgrade is routine.
- **Phase 8:** Django test patterns are well-established.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct inspection of `requirements.txt`, `settings.py`, and all app configurations — no inference required |
| Features | HIGH | Direct inspection of every URL config, view file, and frontend grep for dead/missing routes — broken views confirmed by reading the code |
| Architecture | HIGH | Component boundaries verified by reading `rumi/urls.py`, all app `urls.py` files, and import chains — consolidation order is deterministic |
| Pitfalls | HIGH | All pitfalls sourced from reading actual code paths — specific line numbers provided, race conditions confirmed by reading the handler logic |

**Overall confidence:** HIGH

### Gaps to Address

- **VisitorInvitation model shape:** The model does not exist and was not designed during research. Before creating it in Phase 4, read `frontend/src/types/caretaker.types.ts` to determine the exact field names and state machine the frontend expects.
- **Student endpoint registration status:** Three student endpoints (activity feed, unread count, support tickets) have unclear URL registration status — FEATURES.md flagged these as "unclear if registered." Verify against `accounts/urls.py` and `student_api/urls.py` at the start of Phase 4.
- **Landlord tenant detail endpoint:** The missing URL is noted but the view implementation was not inspected. May be a missing URL entry only, or the view itself may be missing. Verify in Phase 3 or 4.
- **WebSocket JWT reconnect:** Documented as a known gap (Pitfall 8) with no frontend reconnect strategy in place. This needs coordination between backend documentation of `ACCESS_TOKEN_LIFETIME` and frontend implementation. Out of scope for this optimization project but should be noted for the next cycle.
- **Migration squashing:** `hostels/` has 26 un-squashed migrations slowing test startup. PITFALLS.md explicitly notes this should wait until schema stabilizes — defer until after Phase 4 schema changes are complete.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `payments/views.py`, `payments/stubs_views.py`, `payments/mpesa_webhooks.py`, `payments/tasks.py` — payment flow bugs and Celery issues
- Direct codebase inspection — `hostels/serializers.py`, `hostels/views.py` — N+1 query patterns
- Direct codebase inspection — `caretaker_operations/views.py`, `caretaker_operations/additional_views.py` — placeholder logic
- Direct codebase inspection — `admin_api/platform_admin_urls.py`, `admin_api/super_admin_urls.py`, `admin_endpoints/` — cross-import dependency
- Direct codebase inspection — `rumi/settings.py` — M-Pesa callback URL misconfiguration, missing `django-celery-beat`, Celery beat task name mismatch
- Direct codebase inspection — frontend `src/` grep — confirmed zero calls to `/api/v1/admin-endpoints/` prefix

### Secondary (MEDIUM confidence)
- Django ORM documentation patterns — `select_related`/`prefetch_related` and `assertNumQueries` usage
- Celery `transaction.on_commit` pattern — established Django community pattern for deferred task dispatch

### Tertiary (LOW confidence)
- Paystack recurring charge API shape — not verified against current Paystack documentation; implementation was a mock; needs fresh API docs review before Phase 6

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
