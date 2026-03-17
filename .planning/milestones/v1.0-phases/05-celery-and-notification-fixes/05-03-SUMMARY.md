---
phase: 05-celery-and-notification-fixes
plan: "03"
subsystem: payments/notifications
tags: [celery, notifications, on_commit, tdd]
dependency_graph:
  requires: [05-02]
  provides: [send_booking_confirmation, send_payment_notification, on_commit wiring in _handle_charge_success and _send_payment_notifications]
  affects: [payments/tasks.py, payments/views.py, payments/mpesa_webhooks.py]
tech_stack:
  added: []
  patterns: [shared_task with lazy imports and try/except, transaction.on_commit lambda dispatch, ast.unparse for AST wiring assertions]
key_files:
  created: [Backend/payments/tests/test_notifications.py]
  modified:
    - Backend/payments/tasks.py
    - Backend/payments/views.py
    - Backend/payments/mpesa_webhooks.py
decisions:
  - "[05-03/CEL-05]: send_booking_confirmation dispatches email+sms via send_notification.delay inside the task body — keeps notification logic isolated from the payment atomic block"
  - "[05-03/CEL-05]: send_payment_notification uses company_name (not business_name) for landlord — consistent with mpesa_webhooks.py and Phase 02 decisions"
  - "[05-03/CEL-05]: _send_payment_notifications parameter renamed conceptually to avoid shadow but kept as 'transaction' for minimal diff — db_transaction alias used for django.db.transaction module"
  - "[05-03/test]: Patch target for send_notification in tasks is notifications.tasks.send_notification (the lazy import path) — patching payments.tasks.send_notification does not intercept the re-imported name inside the function"
  - "[05-03/test]: ast.unparse(ast_node) used instead of inspect.getsource(ast_node) for wiring assertions — inspect.getsource requires live Python objects, not AST FunctionDef nodes"
metrics:
  duration_seconds: 325
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 03: Notification Tasks and on_commit Wiring Summary

Two named Celery tasks created for booking confirmation and payment notification, replacing direct `send_notification.delay()` calls inside `transaction.atomic()` blocks with proper `transaction.on_commit` dispatch in both the Paystack and M-Pesa payment paths.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Write notification task and wiring test stubs | 09a35d7c | Backend/payments/tests/test_notifications.py |
| 2 (GREEN) | Create notification tasks; wire _handle_charge_success and M-Pesa webhook | 1bdbcd5b | tasks.py, views.py, mpesa_webhooks.py, test_notifications.py |

## What Was Built

**`send_booking_confirmation(booking_id)` (@shared_task, payments/tasks.py):**
- Fetches Booking with `select_related('student__user', 'room__hostel')`
- Dispatches `booking_confirmed` email and SMS via `send_notification.delay`
- Wrapped in try/except — logs error and returns cleanly on missing booking

**`send_payment_notification(transaction_id)` (@shared_task, payments/tasks.py):**
- Fetches Transaction with `select_related('student__user', 'landlord__user')`
- Dispatches `payment_success` email to student and `payment_received` email to landlord
- Wrapped in try/except — logs error and returns cleanly on missing transaction

**`_handle_charge_success` wiring (payments/views.py):**
- Replaced two direct `send_notification.delay()` calls (lines 1187-1209) with:
  ```python
  from payments.tasks import send_booking_confirmation, send_payment_notification
  _txn_id = txn.id
  _booking_id = booking.id
  transaction.on_commit(lambda: send_payment_notification.delay(_txn_id))
  transaction.on_commit(lambda: send_booking_confirmation.delay(_booking_id))
  ```
- IDs captured before lambda to prevent closure capture bugs

**`_send_payment_notifications` wiring (payments/mpesa_webhooks.py):**
- Replaced two direct `send_notification.delay()` calls with:
  ```python
  from payments.tasks import send_payment_notification
  from django.db import transaction as db_transaction
  _txn_id = transaction.id
  db_transaction.on_commit(lambda: send_payment_notification.delay(_txn_id))
  ```
- Works safely at both call sites (line 255 inside atomic block; line 381 outside)

## Verification

- `python manage.py check`: 0 issues
- `test_notifications.py`: 6/6 tests PASS
- Full `payments/` suite: 55/56 pass (1 pre-existing failure in test_subscription_engine — date arithmetic, unrelated to this plan)
- Pre-existing `accounts/` failures (13) unchanged — confirmed pre-existing via git stash check

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test patch targets and AST inspection method**
- **Found during:** Task 2 GREEN phase
- **Issue:** Original TDD RED tests used `patch("payments.tasks.send_notification")` and `inspect.getsource(ast_node)` — both wrong: (a) the lazy import inside the task function creates a new name binding that the payments.tasks module namespace patch doesn't intercept; (b) `inspect.getsource` requires live callable objects, not AST nodes
- **Fix:** Changed patch targets to `notifications.tasks.send_notification` (the actual object being called) and `hostels.models.Booking.objects` / `payments.models.Transaction.objects` manager-level mocks; replaced `inspect.getsource(ast_node)` with `ast.unparse(ast_node)` for wiring assertions
- **Files modified:** Backend/payments/tests/test_notifications.py
- **Commit:** 1bdbcd5b

## Self-Check: PASSED
