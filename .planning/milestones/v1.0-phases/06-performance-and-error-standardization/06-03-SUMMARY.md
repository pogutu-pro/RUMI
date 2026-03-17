---
phase: 06-performance-and-error-standardization
plan: 03
subsystem: api
tags: [drf, exception-handler, error-standardization, django]

# Dependency graph
requires:
  - phase: 06-01
    provides: ExceptionHandlerTest stub in core/tests.py created as placeholder
provides:
  - custom_exception_handler in core/exceptions.py normalizing all DRF error shapes
  - REST_FRAMEWORK EXCEPTION_HANDLER setting wired to core.exceptions.custom_exception_handler
  - ExceptionHandlerTest covering 404/400 validation/500 normalized response shapes
affects:
  - All API error responses across the entire backend (every DRF view)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DRF custom exception handler wrapping default exception_handler() then normalizing response.data"
    - "Canonical error shape: {detail, code} with optional 'errors' key for field-level validation"
    - "500 unhandled exceptions return safe message via response, log via logger.exception"

key-files:
  created:
    - Backend/core/exceptions.py
  modified:
    - Backend/core/tests.py
    - Backend/rumi/settings.py

key-decisions:
  - "Canonical error shape is {detail, code}; field-level validation errors go in 'errors' key (not flattened)"
  - "500 responses return {detail: 'An unexpected error occurred.', code: '500'} — no internal info leaked"
  - "Handler wraps DRF default exception_handler() rather than replacing it entirely"
  - "Used direct function test approach (APIRequestFactory) instead of URL patching — simpler, no test URL plumbing needed"

patterns-established:
  - "All new DRF exception paths use custom_exception_handler for consistent envelope"

requirements-completed: [ERR-01, ERR-02]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 06 Plan 03: Exception Handler Standardization Summary

**DRF custom exception handler normalizing all API errors to {detail, code} envelope with field-level 'errors' key and safe 500 responses, wired via REST_FRAMEWORK EXCEPTION_HANDLER setting**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T11:12:16Z
- **Completed:** 2026-03-17T11:17:46Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments

- Created `Backend/core/exceptions.py` with `custom_exception_handler` — normalizes 404/400/500 shapes, preserves field-level errors, logs unhandled exceptions safely
- Wired `REST_FRAMEWORK['EXCEPTION_HANDLER']` in `settings.py` to point to new handler
- Replaced skipTest stub in `core/tests.py` with three passing tests (404 shape, 400 validation shape, 500 safe message)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fill ExceptionHandlerTest stub (RED phase)** - `8b1ab665` (test)
2. **Task 2: Implement core/exceptions.py and wire settings (GREEN phase)** - `88f58d57` (feat)

_Note: TDD tasks — test commit then implementation commit_

## Files Created/Modified

- `Backend/core/exceptions.py` - New file: custom_exception_handler function normalizing DRF error shapes
- `Backend/rumi/settings.py` - Added EXCEPTION_HANDLER key to REST_FRAMEWORK dict
- `Backend/core/tests.py` - Replaced skipTest placeholder with three real ExceptionHandlerTest methods

## Decisions Made

- Used direct function test approach (APIRequestFactory + calling custom_exception_handler directly) instead of URL patching with override_settings — avoids test URL plumbing complexity and directly tests the handler contract
- Handler wraps DRF's `exception_handler()` rather than replacing it — preserves all DRF standard exception behavior and adds normalization on top
- 500 response includes `code: '500'` string for consistency with other error shapes
- Validation error code extracted from `exc.detail.code` attribute; falls back to `str(response.status_code)` for field-dict ValidationErrors

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `test_home_is_cached` failure in `home.tests` suite is pre-existing (Redis not available in test environment) — verified it failed before this plan's changes by stashing and re-running.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Error standardization is complete: all DRF API errors now return consistent `{detail, code}` envelope
- Frontend can rely on `response.data.detail` and `response.data.code` for all error handling
- No regressions introduced in hostels, core, or home test suites (excluding pre-existing Redis cache test failure)

---
*Phase: 06-performance-and-error-standardization*
*Completed: 2026-03-17*
