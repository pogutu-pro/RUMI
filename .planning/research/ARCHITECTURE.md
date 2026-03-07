# Research: Architecture Consolidation
**Project:** RUMI Backend Optimization
**Dimension:** Architecture — safe consolidation order, legacy removal, infrastructure wiring
**Confidence:** HIGH — direct codebase inspection

---

## Key Findings

### 1. admin_endpoints Consolidation — LOW RISK, Safe to Do

**Finding:** The frontend calls ZERO URLs under `/api/v1/admin-endpoints/` — confirmed by grepping all of `frontend/src/`. That URL registration is completely dead.

**What's cross-wired:**
- `admin_api/platform_admin_urls.py` imports 3-5 view classes from `admin_endpoints/views.py`
- `admin_api/super_admin_urls.py` imports 3-5 view classes from `admin_endpoints/views.py`
- Both via `from admin_endpoints import views as admin_endpoints_views`

**Safe consolidation order:**
1. Copy referenced view classes into `admin_api/views.py`
2. Update imports in `platform_admin_urls.py` and `super_admin_urls.py` to use `admin_api.views`
3. Run `python manage.py check` to verify no remaining cross-imports
4. Remove the dead `/api/v1/admin-endpoints/` URL registration from `rumi/urls.py`
5. Remove `admin_endpoints` from `INSTALLED_APPS` in `settings.py`
6. Delete the `admin_endpoints/` directory
7. Run `python manage.py check` again — should be clean

**URL paths never change** — only the Python import paths change. Zero frontend impact.

---

### 2. payments/stubs_views.py — Not Uniformly Stub-Quality

**Finding:** The file is a mix — some views use real ORM queries, some are true stubs.

| View | Quality | Action Needed |
|------|---------|---------------|
| `PaymentVerifyView` | Real ORM queries | Promote to `payments/views.py` |
| `PaybillAllocationView` | Real ORM queries | Promote to `payments/views.py` |
| `UnmatchedPaymentsListView` | Real ORM queries | Promote to `payments/views.py` |
| `UnmatchedPaymentMatchView` | Real ORM + service call | Promote to `payments/views.py` |
| `PaymentLedgerView` | Has `models.Q` NameError | Fix import bug, then promote |
| `UnmatchedPaymentRejectView` | True stub — no DB write | Implement real logic, then promote |
| `PaymentLedgerExportView` | True stub — returns empty | Implement real logic, then promote |

**Safe promotion order:** Move one view at a time. Update URL config to point to new location. Verify frontend still works. Delete old stub class. Never change the URL path.

---

### 3. Caretaker Placeholder Logic — Needs Missing Models

**Root cause:** `maintenance_requests = []` at `caretaker_operations/views.py:853` exists because no `MaintenanceRequest` model exists. The `booking.id % 7` simulation in `additional_views.py` exists because no `LateEntry` model exists.

**Approach:**
1. Read `frontend/src/types/caretaker.types.ts` before designing models — build fields to the frontend contract, not the other way around
2. Create `MaintenanceRequest` model in `caretaker_operations/` (or `hostels/` if it fits the hostel domain)
3. Create `LateEntry` model in `accounts/` or `hostels/`
4. Write and run migrations
5. Replace placeholder logic with real ORM queries

**Risk:** Schema change requires migration. Safe on seed-only database.

---

### 4. AWS S3 Wiring — One settings.py Block Away

**Current state:** `django-storages==1.14.2` and `boto3==1.29.7` already in requirements. `settings.py` only has `MEDIA_ROOT = BASE_DIR / 'media'` — no `STORAGES` key at all.

**Implementation:**
```python
# settings.py
USE_S3 = env.bool('USE_S3', default=False)

if USE_S3:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='af-south-1')
    AWS_DEFAULT_ACL = 'private'
    AWS_S3_FILE_OVERWRITE = False
else:
    MEDIA_ROOT = BASE_DIR / 'media'
    MEDIA_URL = '/media/'
```

**Must audit first:** Check `payments/additional_views.py:ReceiptGenerateView` for hardcoded `/media/` URL strings before enabling S3 — these would produce broken URLs when storage backend changes.

**Also:** Upgrade `boto3==1.29.7` to current stable before wiring S3.

---

### 5. Weather Stub — Remove, Don't Implement

**Finding:** `third_party/weather.py` returns hardcoded `temperature: 25`. `home/views.py:WeatherView` wraps it. No frontend component calls `/api/v1/home/weather/`.

**Action:** Delete both the stub and the view. Remove the URL registration. This is dead code with no frontend caller.

---

### 6. docs/ vs Docs/ Directory — Merge

Two documentation directories exist due to case-sensitivity (`Backend/docs/` and `Backend/Docs/`). Contents appear split arbitrarily. Merge into single `Backend/docs/` directory. Zero risk — no code imports from these directories.

---

## Recommended Phase Order (by risk level)

| Order | Topic | Risk | Why This Order |
|-------|-------|------|----------------|
| 1 | Payment flow bugs (Paystack crash, M-Pesa callback URLs, stub NoOps) | HIGH fix priority | Silent production failures today |
| 2 | admin_endpoints → admin_api consolidation | LOW | Zero URL changes, no frontend impact |
| 3 | Promote payment stub views to real views | LOW-MEDIUM | Zero URL changes; fix one at a time |
| 4 | Missing models (MaintenanceRequest, LateEntry, VisitorInvitation) | MEDIUM | Schema change; read frontend types first |
| 5 | Wire missing caretaker/student URLs | LOW-MEDIUM | New endpoints, no existing ones change |
| 6 | N+1 query fixes + caching | MEDIUM | Requires `assertNumQueries` tests to verify |
| 7 | S3 storage wiring | LOW-MEDIUM | Config-only change; sync local files first |
| 8 | Celery task fixes (mock removal, notification wiring) | MEDIUM | Replace mock payment task |
| 9 | Notification wiring (SMS/email on events) | LOW | Wire existing task infrastructure to events |
| 10 | Weather stub removal + docs merge | LOW | Dead code removal |

---

## Component Boundaries After Consolidation

```
Backend/
├── accounts/          — auth, users, profiles, subscriptions, roommate, WebSocket
├── hostels/           — hostel, room, bed, booking, reviews, lifecycle
├── payments/          — M-Pesa, Paystack, receipts, billing, ledger (ALL payment views here)
├── notifications/     — SMS, email, in-app (all notification types)
├── landlord_api/      — landlord-specific views (reads from hostels/payments/accounts)
├── student_api/       — student-specific views
├── caretaker_operations/ — caretaker views + MaintenanceRequest + LateEntry models
├── admin_api/         — all admin views (after absorbing admin_endpoints)
├── support_api/       — tech support views
├── analytics/         — occupancy + revenue analytics
├── roommate_system/   — roommate matching
├── recommendations/   — hostel recommendations
├── monitoring/        — health checks, Prometheus
├── home/              — public/homepage endpoints (weather view removed)
└── core/              — shared base views
```

---
*Research completed: 2026-03-07*
