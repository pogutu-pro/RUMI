---
phase: 02-admin-layer-consolidation
plan: 01
subsystem: admin_api
tags: [refactor, admin, consolidation, views]
dependency_graph:
  requires: []
  provides: [admin_api/views.py contains all four moved view classes]
  affects: [admin_api/platform_admin_urls.py, admin_api/super_admin_urls.py]
tech_stack:
  added: []
  patterns: [explicit view imports in URL files instead of module-level import]
key_files:
  created: []
  modified:
    - Backend/admin_api/views.py
    - Backend/admin_api/platform_admin_urls.py
    - Backend/admin_api/super_admin_urls.py
decisions:
  - Added Booking to hostels.models import in admin_api/views.py — AdminPlatformStatsView requires it and it was missing from existing imports
metrics:
  duration: 5 min
  completed: 2026-03-16
---

# Phase 2 Plan 1: Admin Endpoints View Consolidation Summary

**One-liner:** Four admin view classes (user stats, landlord verifications, platform stats, system health) moved from admin_endpoints/views.py into admin_api/views.py; both URL files now import exclusively from admin_api.views.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Append four view classes to admin_api/views.py | Done | cf43c751 |
| 2 | Update platform_admin_urls.py to import from admin_api.views | Done | cf43c751 |
| 3 | Update super_admin_urls.py to import from admin_api.views | Done | cf43c751 |

## What Was Done

### Task 1: Four View Classes Appended to admin_api/views.py

The following four classes were appended at the bottom of `Backend/admin_api/views.py` under a consolidation section comment:

- `AdminUserStatsView` — user statistics with timeframe filtering (used by platform_admin_urls.py at `users/stats/`)
- `AdminLandlordVerificationsView` — landlord verification list + approve/reject POST (used by both URL files at `landlord-verifications/`)
- `AdminPlatformStatsView` — platform-wide stats including hostel/booking/revenue metrics (used by both URL files at `platform/stats/`)
- `AdminSystemHealthView` — API performance, DB health, storage, user activity alerts (used by both URL files at `system/health/`)

**Note:** `AdminPaymentStatsView` was intentionally left in admin_endpoints — it is not referenced by either admin_api URL file and will be deleted with the app in plan 02-02.

### Task 2: platform_admin_urls.py

Replaced `from . import views` + `from admin_endpoints import views as admin_endpoints_views` with a single explicit `from .views import (...)` block covering all 6 view classes. All `views.X` and `admin_endpoints_views.X` prefixes removed. Result: 6 URL patterns, zero admin_endpoints imports.

### Task 3: super_admin_urls.py

Replaced both import lines with a single explicit `from .views import (...)` block covering all 15 view classes (12 pre-existing + 3 consolidated). All `views.X` and `admin_endpoints_views.X` prefixes removed. Result: 22 URL patterns, zero admin_endpoints imports.

## Verification Results

```
# Import check
from admin_api.views import AdminUserStatsView, AdminLandlordVerificationsView, AdminPlatformStatsView, AdminSystemHealthView
→ import OK

# Cross-import scan
grep -r "from admin_endpoints import" admin_api/
→ NO CROSS-IMPORTS (good)

# URL file checks
from admin_api.platform_admin_urls import urlpatterns → count: 6
from admin_api.super_admin_urls import urlpatterns → count: 22

# Django system check
python manage.py check --settings=rumi.settings
→ System check identified no issues (0 silenced)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Import] Added Booking to hostels.models import in admin_api/views.py**
- **Found during:** Task 1
- **Issue:** `AdminPlatformStatsView` references `Booking.objects` but `Booking` was not in the existing `from hostels.models import Hostel` import line
- **Fix:** Changed to `from hostels.models import Hostel, Booking`
- **Files modified:** Backend/admin_api/views.py
- **Commit:** cf43c751

## Note on admin_endpoints App

The `admin_endpoints` app still exists and is still installed in `INSTALLED_APPS`. It contains `AdminPaymentStatsView` which is referenced by its own URL conf (not by admin_api URL files). Deletion of the entire app is deferred to plan 02-02.

## Self-Check: PASSED

- Backend/admin_api/views.py — contains all four new classes (AdminUserStatsView, AdminLandlordVerificationsView, AdminPlatformStatsView, AdminSystemHealthView)
- Backend/admin_api/platform_admin_urls.py — no admin_endpoints imports, 6 URL patterns
- Backend/admin_api/super_admin_urls.py — no admin_endpoints imports, 22 URL patterns
- Commit cf43c751 — exists in git log