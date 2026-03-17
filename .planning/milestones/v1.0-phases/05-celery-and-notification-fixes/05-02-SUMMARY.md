---
phase: 05-celery-and-notification-fixes
plan: "02"
subsystem: payments-tasks-reliability
tags: [celery, on_commit, race-condition, tdd, caching]
dependency_graph:
  requires: []
  provides: [CEL-04, CEL-06]
  affects: [payments/views.py, hostels/views.py, payments/tasks.py]
tech_stack:
  added: []
  patterns: [transaction.on_commit, closure-snapshot-variables, dynamic-superuser-lookup]
key_files:
  created:
    - Backend/payments/tests/test_on_commit.py
  modified:
    - Backend/payments/views.py
    - Backend/hostels/views.py
    - Backend/payments/tasks.py
decisions:
  - "Use local 'from django.db import transaction as db_transaction' alias in RefundRequestCreateView.post to resolve variable name shadow (local 'transaction' = model instance shadows module import)"
  - "Snapshot all mutable values as _prefixed variables before lambdas to prevent closure capture bugs"
  - "Dynamic superuser lookup guarded with 'if _admin:' — task must not crash in test/staging environments with no superuser"
  - "test_monthly_invoice_generation pre-existing failure deferred — date-dependent hardcoded assertion, not caused by 05-02"
metrics:
  duration: 684
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 02: on_commit Wrapping + Dynamic Superuser Lookup Summary

Six confirmed `.delay()` / `.apply_async()` violations wrapped with `transaction.on_commit(lambda: ...)`, hardcoded `recipient_id=1` replaced with dynamic superuser lookup guarded by `if _admin:`.

## What Was Built

Six Celery dispatch sites inside `transaction.atomic()` blocks were previously firing before their enclosing DB transactions committed. This created a race condition: if the transaction rolled back, the Celery task would run against state that never existed — causing `DoesNotExist` errors, duplicate processing, or silent data corruption.

All six sites are now wrapped with `transaction.on_commit(lambda: ...)`, and each lambda captures snapshot variables (not mutable references) to prevent closure capture bugs. The `process_recurring_payments` task no longer hardcodes `recipient_id=1` — it dynamically queries the first superuser and skips the notification if none exists.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Write on_commit + superuser-lookup test stubs (TDD RED) | da4185d1 | Complete |
| 2 | Wrap all violations in on_commit; fix recipient_id=1 | d1955d62 | Complete |

## Files Modified

| File | Changes |
|------|---------|
| `Backend/payments/views.py` | Site 1 (RefundRequestCreateView.post): db_transaction alias + on_commit wrap; Site 2 (RefundRequestProcessView.post): on_commit wrap with snapshots |
| `Backend/hostels/views.py` | Site 3 (InventoryTemplateCreateView): on_commit wrap; Site 4 (InventoryCheckInSubmitView): on_commit wrap; Site 5 (InventoryCheckInVerifyView): on_commit wrap; Site 6 (booking creation): cleanup_expired_reservation apply_async wrapped |
| `Backend/payments/tasks.py` | process_recurring_payments: dynamic superuser lookup with if-guard replacing hardcoded recipient_id=1 (CEL-06) |
| `Backend/payments/tests/test_on_commit.py` | Six tests covering all violation sites and CEL-06 superuser lookup — all GREEN |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed transaction variable name shadow in RefundRequestCreateView.post**
- **Found during:** Task 2 (Site 1)
- **Issue:** `from django.db import transaction` is imported at module level, but a local variable `transaction = Transaction.objects...get(...)` shadows it inside `RefundRequestCreateView.post`. The existing `with transaction.atomic():` was actually calling `.atomic()` on the model instance (not the module), which would raise `AttributeError` at runtime — making the whole refund request endpoint silently return 500.
- **Fix:** Added `from django.db import transaction as db_transaction` at the top of the try block, then used `with db_transaction.atomic():` and `db_transaction.on_commit(...)` for that method only. This is a minimal targeted fix that doesn't rename all other usages.
- **Files modified:** `Backend/payments/views.py`
- **Commit:** d1955d62

### Out-of-scope Pre-existing Issues

**Deferred: test_monthly_invoice_generation failure**
- `payments/tests/test_subscription_engine.py:94` asserts `total_bed_days == 30` but gets `28` (hardcoded date assertion fails in February)
- Confirmed pre-existing (stash verify before/after shows same failure)
- Logged in `.planning/phases/05-celery-and-notification-fixes/deferred-items.md`

## Verification Results

```
python manage.py check: System check identified no issues (0 silenced)

pytest payments/ hostels/ -q:
  1 failed (pre-existing: test_monthly_invoice_generation — date-calc bug, unrelated)
  65 passed

pytest payments/tests/test_on_commit.py -q:
  6 passed
```

## Success Criteria Met

1. Six `.delay()` / `apply_async` sites wrapped with `transaction.on_commit(lambda: ...)` — YES
2. Each lambda captures snapshot variables to prevent closure bugs — YES
3. `payments/tasks.py process_recurring_payments` uses `User.objects.filter(is_superuser=True).first()` — YES
4. Dynamic lookup guarded with `if _admin:` — YES
5. All tests in test_on_commit.py pass — YES (6/6)
6. Full payments/ and hostels/ test suites remain green (minus pre-existing failure) — YES
7. `python manage.py check` exits with no errors — YES

## Self-Check: PASSED
