---
phase: 04-missing-models-and-url-wiring
plan: "04"
subsystem: api
tags: [django, migrations, caretaker, visitor-invitations, roommate-requests, urls]

# Dependency graph
requires:
  - phase: 04-01
    provides: VisitorInvitation model in caretaker_operations/models.py
  - phase: 04-02
    provides: MaintenanceRequest model in caretaker_operations/models.py
  - phase: 04-03
    provides: LateEntry model in caretaker_operations/models.py
provides:
  - caretaker_operations 0001_initial migration (VisitorInvitation, MaintenanceRequest, LateEntry in DB)
  - 7 new view classes for visitor invitation lifecycle and roommate request thin wrappers
  - 7 new URL patterns under /api/v1/caretaker/ prefix (URL-01 through URL-07)
affects:
  - frontend caretaker dashboard (visitor-invitations and roommate-requests endpoints now live)
  - phase 05 and beyond (caretaker_operations DB tables now exist)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Thin wrapper views for action-specific endpoints (hardcode action, avoid reading from body)
    - Hostel-scoped queryset filtering via room__hostel=caretaker.hostel
    - Status transition guards in each action view

key-files:
  created:
    - Backend/caretaker_operations/migrations/__init__.py
    - Backend/caretaker_operations/migrations/0001_initial.py
  modified:
    - Backend/caretaker_operations/models.py
    - Backend/caretaker_operations/views.py
    - Backend/caretaker_operations/urls.py

key-decisions:
  - "related_name clash fix: caretaker_operations.VisitorInvitation uses caretaker_visitor_invitations (not visitor_invitations) to avoid clash with hostels.VisitorInvitation"
  - "related_name clash fix: caretaker_operations.LateEntry uses caretaker_late_entries (not late_entries) to avoid clash with hostels.LateEntryLog"
  - "0001_initial dependency corrected to hostels/0023 (not auto-generated 0024 which was a broken pre-existing drift migration)"
  - "CaretakerRoommateApproveView and CaretakerRoommateRejectView hardcode action — do NOT read action from request.data"

patterns-established:
  - "Thin wrapper views: when frontend sends empty body or body-without-action, write a dedicated view that hardcodes the action"
  - "Hostel-scoped visitor invitation queries: filter room__hostel=caretaker.hostel for multi-tenancy correctness"

requirements-completed: [URL-01, URL-02, URL-03, URL-04, URL-05, URL-06, URL-07]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 4 Plan 04: Missing Models and URL Wiring — Migration + Views + URLs Summary

**Combined 0001_initial migration applied for all 3 caretaker models; 7 visitor-invitation views and 7 URL patterns wired under /api/v1/caretaker/**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-16T18:27:17Z
- **Completed:** 2026-03-16T18:32:01Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- caretaker_operations 0001_initial migration applied — VisitorInvitation, MaintenanceRequest, LateEntry tables now exist in DB
- 7 view classes added to views.py covering the full visitor invitation lifecycle (list/create, approve, reject, check-in, check-out) plus thin roommate approve/reject wrappers
- 7 URL patterns registered resolving to correct /api/v1/caretaker/visitor-invitations/ and /roommate-requests/ paths
- manage.py check passes with 0 issues

## Task Commits

1. **Task 1: Run makemigrations and migrate** - `72882b30` (feat)
2. **Task 2: Add 7 new view classes** - `d0d7aee5` (feat)
3. **Task 3: Register 7 new URLs** - `89935706` (feat)

## Migration Confirmation

```
caretaker_operations
 [X] 0001_initial
```

Migration covers: Create model LateEntry, Create model MaintenanceRequest, Create model VisitorInvitation.

## 7 View Classes Added

1. `VisitorInvitationListView` — GET list + POST create
2. `VisitorInvitationApproveView` — POST approve (pending -> approved)
3. `VisitorInvitationRejectView` — POST reject with optional reason
4. `VisitorInvitationCheckInView` — POST check-in (approved -> checked_in)
5. `VisitorInvitationCheckOutView` — POST check-out (checked_in -> checked_out)
6. `CaretakerRoommateApproveView` — thin wrapper, hardcodes approve (no action key in body)
7. `CaretakerRoommateRejectView` — thin wrapper, reads only reason (no action key in body)

## 7 URL Paths Registered

| URL Name | Resolved Path |
|---|---|
| caretaker_visitor_invitations | /api/v1/caretaker/visitor-invitations/ |
| caretaker_visitor_invitation_approve | /api/v1/caretaker/visitor-invitations/{pk}/approve/ |
| caretaker_visitor_invitation_reject | /api/v1/caretaker/visitor-invitations/{pk}/reject/ |
| caretaker_visitor_invitation_checkin | /api/v1/caretaker/visitor-invitations/{pk}/check-in/ |
| caretaker_visitor_invitation_checkout | /api/v1/caretaker/visitor-invitations/{pk}/check-out/ |
| caretaker_roommate_approve | /api/v1/caretaker/roommate-requests/{request_id}/approve/ |
| caretaker_roommate_reject | /api/v1/caretaker/roommate-requests/{request_id}/reject/ |

Requirements satisfied: URL-01 (list/create), URL-02 (approve), URL-03 (reject), URL-04 (check-in), URL-05 (check-out), URL-06 (roommate approve), URL-07 (roommate reject).

## Files Created/Modified

- `Backend/caretaker_operations/migrations/__init__.py` — Created by makemigrations
- `Backend/caretaker_operations/migrations/0001_initial.py` — Combined initial migration for all 3 models
- `Backend/caretaker_operations/models.py` — Fixed related_name clashes (caretaker_visitor_invitations, caretaker_late_entries)
- `Backend/caretaker_operations/views.py` — Added VisitorInvitation import + 7 new view classes (~195 lines)
- `Backend/caretaker_operations/urls.py` — Added 7 new URL path entries

## Decisions Made

- Fixed related_name clashes: `caretaker_operations.VisitorInvitation` now uses `caretaker_visitor_invitations` and `caretaker_late_entries` to avoid collision with `hostels.VisitorInvitation.visitor_invitations` and `hostels.LateEntryLog.late_entries`
- Migration dependency corrected to `hostels/0023` — Django auto-generated a broken `hostels/0024` migration during `makemigrations caretaker_operations` (due to pre-existing hostels model drift); that file was deleted and dependency pinned to 0023
- CaretakerRoommateApproveView and CaretakerRoommateRejectView intentionally do NOT read `action` from `request.data` — frontend sends empty body for approve and `{"reason": ...}` only for reject

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed related_name clashes blocking makemigrations**
- **Found during:** Task 1 (Run makemigrations and migrate)
- **Issue:** `caretaker_operations.VisitorInvitation.student` used `related_name='visitor_invitations'` which clashed with `hostels.VisitorInvitation.student`. Same for room FK and LateEntry student/room FKs clashing with `hostels.LateEntryLog`.
- **Fix:** Renamed related_names to `caretaker_visitor_invitations` and `caretaker_late_entries` in models.py
- **Files modified:** Backend/caretaker_operations/models.py
- **Verification:** makemigrations succeeded after fix; system check passes with 0 issues
- **Committed in:** `72882b30` (Task 1 commit)

**2. [Rule 3 - Blocking] Deleted broken hostels/0024 migration and corrected 0001_initial dependency**
- **Found during:** Task 1 (migrate step)
- **Issue:** Django auto-generated `hostels/0024` during `makemigrations caretaker_operations` (pre-existing hostels model drift). The 0024 migration was broken (tried to remove a field from a model with a constraint referencing that field). The `caretaker_operations/0001_initial.py` had a dependency on this broken migration.
- **Fix:** Deleted `hostels/0024` migration file; updated `0001_initial` dependency to `hostels/0023`
- **Files modified:** Backend/caretaker_operations/migrations/0001_initial.py
- **Verification:** `migrate caretaker_operations` succeeded; system check passes
- **Committed in:** `72882b30` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug — related_name clash, 1 blocking — broken migration dependency)
**Impact on plan:** Both auto-fixes necessary for migration to run. No scope creep. The hostels drift is a pre-existing issue logged as out-of-scope for this plan.

## Issues Encountered

- Pre-existing hostels model drift (Review/ReviewImage/ReviewHelpful removed from models.py but not migrated) caused auto-generation of a broken migration. Resolved by deleting the generated file and pinning to 0023. The underlying drift is deferred — not in scope for phase 4.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All caretaker_operations DB tables are live in the database
- All 7 URL-0x requirements (URL-01 through URL-07) are satisfied
- Phase 4 is now complete — all 4 plans done
- Phase 5 can proceed

---
*Phase: 04-missing-models-and-url-wiring*
*Completed: 2026-03-16*
