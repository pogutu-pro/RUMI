---
phase: 04-missing-models-and-url-wiring
plan: 01
subsystem: database
tags: [django, models, visitor-invitation, caretaker, foreignkey]

# Dependency graph
requires: []
provides:
  - "VisitorInvitation Django model with 17 fields and 6 status choices"
  - "ForeignKey links to accounts.StudentProfile, hostels.Room, and accounts.CaretakerProfile (x3)"
affects:
  - "04-04-missing-models-and-url-wiring (migration creation depends on this model)"
  - "04-missing-models-and-url-wiring visitor invitation views"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "String FK references ('app.Model') to avoid circular imports between apps"
    - "SET_NULL for optional audit FK fields (approved_by, checked_in_by, checked_out_by)"
    - "auto_now_add/auto_now for created_at/updated_at timestamps"

key-files:
  created:
    - "Backend/caretaker_operations/models.py"
  modified: []

key-decisions:
  - "No migration created in this plan — migrations run in plan 04-04 after all Wave 1 models (VisitorInvitation, MaintenanceRequest, LateEntry) complete"
  - "String FK references used ('accounts.StudentProfile', 'hostels.Room', 'accounts.CaretakerProfile') to avoid circular imports"
  - "approved_by, checked_in_by, checked_out_by all use SET_NULL so invitations persist if caretaker profile deleted"

patterns-established:
  - "caretaker_operations models use string FK targets matching existing views.py import pattern"

requirements-completed: [MOD-01, MOD-04]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 01: VisitorInvitation Model Summary

**VisitorInvitation Django model with 17 fields, 6 status choices, and FK links to StudentProfile, Room, and CaretakerProfile (x3) — no migration (deferred to 04-04)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T20:30:00Z
- **Completed:** 2026-03-16T20:33:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `Backend/caretaker_operations/models.py` (app previously had no models.py at all)
- Defined VisitorInvitation with all 17 fields matching frontend `caretaker/api/workflows.ts` type contract
- STATUS_CHOICES: pending, approved, rejected, checked_in, checked_out, expired (6 values)
- Three CaretakerProfile FKs (approved_by, checked_in_by, checked_out_by) using SET_NULL for audit trail preservation
- Model importable and verified with Django setup — no migration needed yet

## Task Commits

Each task was committed atomically:

1. **Task 1: Create models.py with VisitorInvitation model** - `e9e4241e` (feat)

## Files Created/Modified

- `Backend/caretaker_operations/models.py` - VisitorInvitation model with full field set matching frontend contract

## Decisions Made

- No migration created in this plan. Plans 04-02 and 04-03 also write to models.py in Wave 1 parallel execution. The single combined migration is run once in plan 04-04 Task 1, after all three Wave 1 models are written.
- String FK references ('accounts.StudentProfile', 'hostels.Room', 'accounts.CaretakerProfile') used throughout — avoids circular imports and matches existing views.py import pattern.
- SET_NULL used for the three optional caretaker audit FKs to ensure invitation records persist if caretaker profile is later deleted.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The DJANGO_SETTINGS_MODULE env var needed to be set explicitly for the verification command (plan's automated verify omitted it), but this was a trivial fix, not a code issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- VisitorInvitation model definition complete; MOD-01 and MOD-04 (model definition portion) satisfied
- Plans 04-02 (MaintenanceRequest) and 04-03 (LateEntry) can now proceed in parallel as Wave 1
- Plan 04-04 must run after all three Wave 1 plans complete — it runs makemigrations and migrate covering all three new models

---
*Phase: 04-missing-models-and-url-wiring*
*Completed: 2026-03-16*
