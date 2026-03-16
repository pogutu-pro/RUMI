---
phase: 04-missing-models-and-url-wiring
plan: 06
subsystem: api
tags: [django, rest-framework, url-wiring, dead-code-removal]

# Dependency graph
requires:
  - phase: 04-missing-models-and-url-wiring
    provides: research confirming WeatherView is unreferenced stub returning 503
provides:
  - WeatherView class deleted from home/views.py
  - weather/ URL entry deleted from home/urls.py
  - Backend/third_party/weather.py stub file deleted
  - GET /api/v1/home/weather/ now returns 404 (deregistered)
affects: [04-04-migration, any future weather feature work]

# Tech tracking
tech-stack:
  added: []
  patterns: [dead stub removal — delete class, URL entry, and dependency file atomically]

key-files:
  created: []
  modified:
    - Backend/home/views.py
    - Backend/home/urls.py

key-decisions:
  - "Commented-out import '# from third_party.weather import get_location_weather' preserved in views.py — documents prior attempt without introducing import error"
  - "manage.py check has 8 pre-existing errors from 04-01 VisitorInvitation reverse accessor clash — out of scope for this plan, deferred to 04-04"

patterns-established:
  - "Stub deletion pattern: remove class from views.py, remove URL path entry, delete dependency file — all three steps required for clean deregistration"

requirements-completed: [PLC-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 06: Weather Stub Deletion Summary

**WeatherView stub (503 placeholder), weather/ URL entry, and third_party/weather.py deleted — PLC-03 satisfied, endpoint now returns 404**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-16T20:57:13Z
- **Completed:** 2026-03-16T20:59:33Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- Deleted `WeatherView` class (5-line stub returning HTTP 503) from `Backend/home/views.py`
- Removed `path('weather/', views.WeatherView.as_view(), name='weather')` from `Backend/home/urls.py`
- Deleted `Backend/third_party/weather.py` stub file
- GET /api/v1/home/weather/ now returns 404 (URL deregistered) — no longer returns misleading 503 stub response

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove WeatherView from home/views.py** - `9f7d6916` (fix)
2. **Task 2: Remove weather URL entry and delete weather.py stub file** - `3932018f` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `Backend/home/views.py` — WeatherView class (lines 747-751) deleted; commented-out import on line 15 preserved
- `Backend/home/urls.py` — weather/ path entry and its comment block removed
- `Backend/third_party/weather.py` — deleted (file no longer exists)

## Decisions Made

- Commented-out import `# from third_party.weather import get_location_weather` left in place on views.py line 15 — per plan: documents that weather feature was previously attempted, causes no import errors
- manage.py check has 8 pre-existing errors from 04-01 VisitorInvitation reverse accessor clash between `caretaker_operations` and `hostels` apps — confirmed pre-existing (not caused by this plan), deferred to 04-04

## Deviations from Plan

### Out-of-Scope Issue Logged (not auto-fixed)

**manage.py check 8 errors: VisitorInvitation FK reverse accessor clash**

- **Found during:** Task 2 verification
- **Issue:** `caretaker_operations.VisitorInvitation.room/student` clashes with `hostels.VisitorInvitation.room/student` reverse accessors (fields.E304, fields.E305)
- **Scope boundary:** These errors are caused by 04-01's VisitorInvitation model addition, not by weather deletion. Pre-existing before this plan ran.
- **Action:** Logged to deferred items — will be resolved in 04-04 when related_name attributes are added
- **Logged to:** deferred-items.md (if it exists)

The plan expected `python3 manage.py check` to show 0 issues, but the pre-existing VisitorInvitation clash prevents that. The three weather-specific deletions are verified clean.

---

**Total deviations:** 0 auto-fixes applied. 1 out-of-scope issue logged (pre-existing, deferred to 04-04).
**Impact on plan:** All weather-specific success criteria met. manage.py check failure is pre-existing and unrelated.

## Issues Encountered

manage.py check returns 8 errors from `caretaker_operations.VisitorInvitation` vs `hostels.VisitorInvitation` reverse accessor clash — confirmed pre-existing from 04-01, not caused by this plan's changes. Will be resolved in 04-04 with `related_name` attributes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PLC-03 satisfied: weather stub entirely removed from codebase
- 04-04 must add `related_name` to VisitorInvitation FKs to resolve manage.py check errors
- All other home/ routes remain intact and unaffected

---
*Phase: 04-missing-models-and-url-wiring*
*Completed: 2026-03-16*
