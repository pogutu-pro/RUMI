---
phase: 04-missing-models-and-url-wiring
plan: 02
subsystem: database
tags: [django, orm, models, maintenance, fk]

# Dependency graph
requires:
  - phase: 04-01
    provides: VisitorInvitation model already in caretaker_operations/models.py — file exists and is valid
provides:
  - MaintenanceRequest Django model in Backend/caretaker_operations/models.py with all 18 fields from frontend type contract
affects:
  - 04-04 (migration must include MaintenanceRequest table)
  - 04-05 (CaretakerMaintenanceView will query MaintenanceRequest ORM)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "String FK references ('hostels.Hostel', 'hostels.Room', settings.AUTH_USER_MODEL) to avoid circular imports"
    - "JSONField(default=list) for photo URL arrays"
    - "Two FKs to AUTH_USER_MODEL with distinct related_names (maintenance_requests_filed, maintenance_assignments)"

key-files:
  created: []
  modified:
    - Backend/caretaker_operations/models.py

key-decisions:
  - "No migration in this plan — 04-04 runs a single combined migration after 04-01, 04-02, 04-03 all complete"
  - "String FK 'hostels.Hostel' used (safe per existing views.py pattern)"
  - "photos_before / photos_after stored as JSONField(default=list) matching frontend string[] contract"

patterns-established:
  - "Pattern 1: Append new models to existing models.py — do not replace or reorganize existing classes"

requirements-completed: [MOD-02]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 4 Plan 02: MaintenanceRequest Model Summary

**MaintenanceRequest Django model with 18 fields (4 FKs, 4 choice fields, 2 JSONFields, 6 timestamp/bool fields) appended to caretaker_operations/models.py satisfying MOD-02**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T18:22:30Z
- **Completed:** 2026-03-16T18:24:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Appended MaintenanceRequest class to Backend/caretaker_operations/models.py after VisitorInvitation
- All 18 fields from frontend/src/features/caretaker/types.ts contract present and verified
- `from django.conf import settings` import added to top of models.py
- Both VisitorInvitation and MaintenanceRequest importable without error

## Task Commits

Each task was committed atomically:

1. **Task 1: Append MaintenanceRequest to models.py** - `f1f0140c` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `Backend/caretaker_operations/models.py` - Added `from django.conf import settings` import and appended MaintenanceRequest class with all 18 fields

## Decisions Made
- No migration in this plan — single combined migration runs in 04-04 after 04-01, 04-02, 04-03 all write to models.py
- String FK references used for hostels.Hostel and hostels.Room (consistent with VisitorInvitation pattern in same file)
- photos_before/photos_after as JSONField(default=list) to match frontend string[] type

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MaintenanceRequest model is ready; 04-03 can proceed in parallel (also appends to models.py)
- 04-04 migration will create the caretaker_operations_maintenancerequest table
- 04-05 can replace the `maintenance_requests = []` placeholder with a real ORM query

---
*Phase: 04-missing-models-and-url-wiring*
*Completed: 2026-03-16*
