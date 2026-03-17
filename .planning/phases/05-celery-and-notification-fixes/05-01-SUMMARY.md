---
phase: 05-celery-and-notification-fixes
plan: 01
subsystem: infra
tags: [celery, django-celery-beat, beat-schedule, periodic-tasks, migrations]

# Dependency graph
requires:
  - phase: 04-missing-models-and-url-wiring
    provides: caretaker_operations models, URL wiring, all Phase 4 migrations complete
provides:
  - django_celery_beat registered in INSTALLED_APPS with all 19 migrations applied
  - BEAT_SCHEDULE assess-late-fees entry pointing to payments.tasks.assess_late_fees (daily midnight)
  - BEAT_SCHEDULE retry-failed-webhook-events entry on crontab(minute='*/5')
  - reconcile_missed_webhooks task registered under name payments.tasks.retry_failed_webhook_events
  - Beat schedule unit tests verifying all four correctness criteria
affects:
  - 05-02 (notification fixes or further celery tasks)
  - celery beat worker startup

# Tech tracking
tech-stack:
  added: [django-celery-beat==2.8.1]
  patterns: [TDD RED-GREEN for beat schedule config, @shared_task(name=...) for explicit task registration]

key-files:
  created: [Backend/payments/tests/test_celery_beat.py]
  modified:
    - Backend/requirements.txt
    - Backend/rumi/settings.py
    - Backend/rumi/performance_settings.py
    - Backend/payments/tasks.py

key-decisions:
  - "Use django-celery-beat==2.8.1 instead of 2.6.0 — 2.6.0 requires Django<5.1 but venv has Django 5.2.11"
  - "Add name='payments.tasks.retry_failed_webhook_events' to @shared_task decorator on reconcile_missed_webhooks — beat schedule task string must match registered name, not function name"
  - "Replace broken 'process-late-fees' entry (non-existent function) with 'assess-late-fees' pointing to the existing assess_late_fees function"

patterns-established:
  - "Pattern: Use @shared_task(name='module.path.task_name') to decouple registered task name from Python function name"
  - "Pattern: Beat schedule keys (e.g. 'assess-late-fees') are descriptive slugs; task values are dotted Python paths to registered tasks"

requirements-completed: [CEL-01, CEL-02, CEL-03]

# Metrics
duration: 6min
completed: 2026-03-17
---

# Phase 05 Plan 01: Celery Beat Setup and Schedule Fixes Summary

**django-celery-beat installed with all 19 migrations applied; BEAT_SCHEDULE fixed with correct assess_late_fees (daily) and new retry_failed_webhook_events (every 5 min) entries; 4 pytest unit tests verify correctness**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-17T08:12:57Z
- **Completed:** 2026-03-17T08:18:40Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed django-celery-beat (2.8.1) and registered it in INSTALLED_APPS — all 19 migrations applied cleanly
- Replaced broken `process-late-fees` beat entry (non-existent task) with correct `assess-late-fees` entry pointing to `payments.tasks.assess_late_fees`
- Added `retry-failed-webhook-events` beat entry on `crontab(minute='*/5')` and registered `reconcile_missed_webhooks` under that task name
- Created 4-test beat schedule test suite; all tests pass GREEN after implementation

## Task Commits

Each task was committed atomically:

1. **Task 1: Write beat schedule test stubs (TDD RED)** - `02253f3e` (test)
2. **Task 2: Install django-celery-beat, fix INSTALLED_APPS, correct BEAT_SCHEDULE, run migrations** - `70202431` (feat)

## Files Created/Modified
- `Backend/payments/tests/test_celery_beat.py` - Created: 4 pytest functions verifying BEAT_SCHEDULE correctness and INSTALLED_APPS
- `Backend/requirements.txt` - Added django-celery-beat==2.8.1
- `Backend/rumi/settings.py` - Added 'django_celery_beat' to INSTALLED_APPS after 'celery'
- `Backend/rumi/performance_settings.py` - Replaced broken 'process-late-fees' entry; added 'assess-late-fees' and 'retry-failed-webhook-events' entries
- `Backend/payments/tasks.py` - Added `name='payments.tasks.retry_failed_webhook_events'` to @shared_task decorator on reconcile_missed_webhooks

## Decisions Made
- **django-celery-beat version**: Plan specified 2.6.0 but that version requires Django<5.1. The virtualenv runs Django 5.2.11. Used 2.8.1 which is compatible. Updated requirements.txt accordingly.
- **Task name kwarg**: `reconcile_missed_webhooks` is the Python function name; the beat schedule must reference the registered task name `payments.tasks.retry_failed_webhook_events`. The `name=` kwarg on `@shared_task` bridges this gap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used django-celery-beat==2.8.1 instead of plan-specified 2.6.0**
- **Found during:** Task 2 (Step 5 — install package)
- **Issue:** django-celery-beat==2.6.0 has a hard dependency constraint requiring Django<5.1. The project virtualenv uses Django 5.2.11. Installing 2.6.0 would downgrade Django to 5.0.14, breaking the runtime environment.
- **Fix:** Used django-celery-beat==2.8.1 (the version that was already installed in the pre-existing venv before the plan). Updated requirements.txt from 2.6.0 to 2.8.1.
- **Files modified:** Backend/requirements.txt
- **Verification:** `pip show django-celery-beat` shows 2.8.1; Django 5.2.11 intact; all 4 tests pass GREEN
- **Committed in:** `70202431` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - version compatibility bug)
**Impact on plan:** Functionally identical outcome — django-celery-beat is installed and all migrations applied. Using 2.8.1 instead of 2.6.0 avoids Django downgrade. No scope creep.

## Issues Encountered
- System-level `pip install django-celery-beat==2.6.0 --break-system-packages` unexpectedly installed Django 5.0.14 alongside 2.6.0. Restored Django 5.2.11 and pivoted to 2.8.1 in the virtualenv.
- The pytest.ini `--reuse-db --nomigrations` addopts require `pytest-rerunfailures`/`pytest-django` plugins not present in the virtualenv. Used system-level pytest (which has pytest-django) to run tests.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Celery beat is fully operational: DatabaseScheduler configured, tables exist, schedule entries are correct
- Celery beat worker can now be started with `celery -A rumi beat -l info` without NotRegistered errors
- Ready for Phase 05 Plan 02 (notification fixes or further celery work)

---
*Phase: 05-celery-and-notification-fixes*
*Completed: 2026-03-17*
