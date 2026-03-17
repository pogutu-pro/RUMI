---
phase: 05-celery-and-notification-fixes
verified: 2026-03-17T12:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 5: Celery and Notification Fixes — Verification Report

**Phase Goal:** The Celery beat schedule references correct task names, django-celery-beat is installed, all task dispatches inside atomic blocks use on_commit, and SMS/email notifications fire on booking and payment events
**Verified:** 2026-03-17
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `django-celery-beat` is in requirements.txt and all migrations applied | VERIFIED | `requirements.txt` line 16: `django-celery-beat==2.8.1`; `python3 manage.py showmigrations django_celery_beat` shows 20/20 `[X]`; `manage.py check` exits 0 |
| 2 | BEAT_SCHEDULE references `payments.tasks.assess_late_fees` (not `process_late_fees`) and includes `retry_failed_webhook_events` on 5-minute crontab | VERIFIED | `performance_settings.py` lines 238-247: `assess-late-fees` entry with `task='payments.tasks.assess_late_fees'`; `retry-failed-webhook-events` entry with `task='payments.tasks.retry_failed_webhook_events'` and `crontab(minute='*/5')`; no `process_late_fees` entry found |
| 3 | No `.delay()` inside `transaction.atomic()` runs before commit — all six confirmed sites wrapped with `transaction.on_commit` | VERIFIED | All 6 sites confirmed wrapped: `payments/views.py` lines 837, 1045, 1191-1192; `hostels/views.py` lines 246, 457, 552, 944; `python3 -m pytest payments/tests/test_on_commit.py` — 6/6 pass |
| 4 | A booking confirmation event triggers `send_booking_confirmation` which dispatches SMS and email | VERIFIED | Task defined at `payments/tasks.py` line 657 with `@shared_task`; dispatches both `channel='email'` and `channel='sms'` with `notification_type='booking_confirmed'`; wired via `transaction.on_commit` at `payments/views.py` line 1192; `test_notifications.py` 6/6 pass |
| 5 | A payment received event triggers `send_payment_notification` | VERIFIED | Task defined at `payments/tasks.py` line 695; wired in `payments/views.py` line 1191 (Paystack `_handle_charge_success`) and `mpesa_webhooks.py` line 404 (`_send_payment_notifications`); both via `on_commit` |
| 6 | Hardcoded `recipient_id=1` in `payments/tasks.py` replaced with dynamic superuser lookup | VERIFIED | `payments/tasks.py` lines 103-112: `User.objects.filter(is_superuser=True).first()` with `if _admin:` guard; no `recipient_id=1` remains in `process_recurring_payments` |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Backend/requirements.txt` | `django-celery-beat==2.8.1` | VERIFIED | Line 16 contains `django-celery-beat==2.8.1` (plan specified 2.6.0 but 2.8.1 used for Django 5.2 compatibility — functionally identical) |
| `Backend/rumi/settings.py` | `django_celery_beat` in INSTALLED_APPS | VERIFIED | Line 59: `'django_celery_beat'` present |
| `Backend/rumi/performance_settings.py` | Corrected BEAT_SCHEDULE entries | VERIFIED | Lines 238-247: `assess-late-fees` and `retry-failed-webhook-events` entries present; no `process_late_fees` entry found |
| `Backend/payments/tasks.py` | `reconcile_missed_webhooks` registered as `retry_failed_webhook_events`; dynamic superuser lookup; `send_booking_confirmation` and `send_payment_notification` tasks | VERIFIED | Line 562: `@shared_task(name='payments.tasks.retry_failed_webhook_events')`; lines 103-112: dynamic lookup with `if _admin:` guard; lines 657 and 695: both notification tasks defined |
| `Backend/payments/views.py` | on_commit wrapping at refund sites and `_handle_charge_success` | VERIFIED | Lines 837, 1045 (refund sites); lines 1191-1192 (`_handle_charge_success`); all wrapped with `on_commit` |
| `Backend/hostels/views.py` | on_commit wrapping at 4 dispatch sites | VERIFIED | Lines 246, 457, 552, 944: all wrapped with `transaction.on_commit` |
| `Backend/payments/mpesa_webhooks.py` | `_send_payment_notifications` uses `send_payment_notification` via `on_commit` | VERIFIED | Lines 394-404: replaces two direct `send_notification.delay()` calls; uses `db_transaction.on_commit(lambda: send_payment_notification.delay(_txn_id))` |
| `Backend/payments/tests/test_celery_beat.py` | 4 beat schedule unit tests | VERIFIED | 60 lines; 4 test functions; all 4 pass (`pytest` 4/4) |
| `Backend/payments/tests/test_on_commit.py` | 6 on_commit and superuser lookup tests | VERIFIED | 255 lines; 6 test functions; all 6 pass (`pytest` 6/6) |
| `Backend/payments/tests/test_notifications.py` | 6 notification task and wiring tests | VERIFIED | 234 lines; 6 test functions; all 6 pass (`pytest` 6/6) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `settings.py` INSTALLED_APPS `django_celery_beat` | `django_celery_beat` migrations | `python manage.py migrate django_celery_beat` | WIRED | 20/20 migrations applied `[X]` |
| `performance_settings.py` BEAT_SCHEDULE `assess-late-fees` | `payments.tasks.assess_late_fees` | task string matches `@shared_task` at `payments/tasks.py` | WIRED | Function `assess_late_fees` exists; beat entry task string matches dotted path |
| `performance_settings.py` BEAT_SCHEDULE `retry-failed-webhook-events` | `payments.tasks.retry_failed_webhook_events` | `name=` kwarg on `@shared_task` decorator | WIRED | `@shared_task(name='payments.tasks.retry_failed_webhook_events')` at `tasks.py` line 562 |
| `payments/views.py` `RefundRequestCreateView.post` atomic block | `send_notification.delay` | `db_transaction.on_commit(lambda: ...)` at line 837 | WIRED | Snapshot variables `_student_name`, `_transaction_reference`, etc. captured before lambda |
| `payments/views.py` `RefundRequestProcessView.post` atomic block | `send_notification.delay` | `transaction.on_commit(lambda: ...)` at line 1045 | WIRED | Snapshot variables `_recipient_id`, `_refund_amount`, etc. captured |
| `hostels/views.py` `InventoryTemplateCreateView` atomic block | `notify_landlord_inventory_template_created.delay` | `transaction.on_commit(lambda: ...)` at line 246 | WIRED | Snapshot `_hostel_id`, `_caretaker_name`, `_total_items` |
| `hostels/views.py` `InventoryCheckInSubmitView` atomic block | `notify_caretaker_checkin_submitted.delay` | `transaction.on_commit(lambda: ...)` at line 457 | WIRED | Snapshot `_checkin_id` |
| `hostels/views.py` `InventoryCheckInVerifyView` atomic block | `notify_student_checkin_verified.delay` | `transaction.on_commit(lambda: ...)` at line 552 | WIRED | Snapshot `_checkin_id`, `_room_number`, `_hostel_name` |
| `hostels/views.py` booking atomic block | `cleanup_expired_reservation.apply_async` | `transaction.on_commit(lambda: ...)` at line 944 | WIRED | Snapshot `_reservation_id`; `countdown=15 * 60` preserved |
| `payments/views.py` `_handle_charge_success` atomic block | `send_payment_notification.delay` | `transaction.on_commit(lambda: send_payment_notification.delay(_txn_id))` at line 1191 | WIRED | Replaces former direct `send_notification.delay()` calls |
| `payments/views.py` `_handle_charge_success` atomic block | `send_booking_confirmation.delay` | `transaction.on_commit(lambda: send_booking_confirmation.delay(_booking_id))` at line 1192 | WIRED | `booking` variable in scope; IDs captured before lambda |
| `payments/mpesa_webhooks.py` `_send_payment_notifications` | `send_payment_notification.delay` | `db_transaction.on_commit(lambda: send_payment_notification.delay(_txn_id))` at line 404 | WIRED | `db_transaction` alias avoids name collision with `transaction` parameter |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CEL-01 | 05-01 | `django-celery-beat` added to `requirements.txt` and migrated | SATISFIED | `requirements.txt` line 16: `django-celery-beat==2.8.1`; 20 migrations `[X]`; `manage.py check` exits 0 |
| CEL-02 | 05-01 | BEAT_SCHEDULE corrected to `payments.tasks.assess_late_fees` | SATISFIED | `performance_settings.py` lines 238-240; no `process_late_fees` entry exists |
| CEL-03 | 05-01 | `retry_failed_webhook_events` task entry added on `crontab(minute='*/5')` | SATISFIED | `performance_settings.py` lines 244-247; `@shared_task(name='payments.tasks.retry_failed_webhook_events')` at `tasks.py` line 562 |
| CEL-04 | 05-02 | All `.delay()` inside `transaction.atomic()` wrapped with `on_commit` | SATISFIED | Six sites confirmed wrapped; 6/6 `test_on_commit.py` tests pass; no unguarded `.delay()` inside `atomic()` found in `payments/views.py` or `hostels/views.py` |
| CEL-05 | 05-03 | `send_booking_confirmation` and `send_payment_notification` wired to booking/payment events | SATISFIED | Both tasks exist in `payments/tasks.py`; booking confirmation wired via `on_commit` in `_handle_charge_success`; payment notification wired via `on_commit` in both `_handle_charge_success` (Paystack) and `_send_payment_notifications` (M-Pesa); 6/6 `test_notifications.py` pass. Note: REQUIREMENTS.md text includes "rent due" as a third event trigger — this is not included in the ROADMAP success criteria (SC #4 and #5) and was not scoped into any plan. The ROADMAP-defined scope (booking confirmed, payment received) is fully satisfied. |
| CEL-06 | 05-02 | Hardcoded `recipient_id=1` replaced with dynamic superuser lookup | SATISFIED | `payments/tasks.py` lines 103-112: `User.objects.filter(is_superuser=True).first()` with `if _admin:` null guard |

**Note on version deviation:** Plan 05-01 specified `django-celery-beat==2.6.0` but the requirement text in REQUIREMENTS.md also states `2.6.0`. The installed version is `2.8.1`. This is the correct choice — `2.6.0` requires Django < 5.1 and the project runs Django 5.2.11. The functional outcome (package installed, migrations applied) is identical. CEL-01 is satisfied.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

Scanned all modified files for TODOs, FIXMEs, placeholders, empty return stubs, and bare `console.log`-only handlers. None found in the six files modified by this phase.

One pre-existing test failure (`test_monthly_invoice_generation`) was logged in `deferred-items.md` — confirmed pre-existing and unrelated to phase 5 changes (hardcoded date assertion fails in February).

---

### Human Verification Required

None. All critical behaviors for this phase are verifiable programmatically:

- Beat schedule entries are code-level config (unit-testable)
- `on_commit` wrapping is verifiable by AST inspection and integration tests
- Task function bodies and wiring are statically readable

The only area that would normally require human verification (real SMS/email delivery) is outside this phase's scope — the notification infrastructure (`send_notification`) was pre-existing. This phase only creates the routing tasks that call it.

---

### Gaps Summary

No gaps found. All six ROADMAP success criteria are met:

1. `django-celery-beat==2.8.1` installed, 20/20 migrations applied, `manage.py check` clean.
2. BEAT_SCHEDULE has `assess-late-fees` → `payments.tasks.assess_late_fees` (daily midnight) and `retry-failed-webhook-events` → `payments.tasks.retry_failed_webhook_events` (every 5 min); no `process_late_fees` entry.
3. All six confirmed `.delay()` / `.apply_async()` sites inside `transaction.atomic()` are wrapped with `transaction.on_commit(lambda: ...)` with snapshot variables; no new violations introduced.
4. `send_booking_confirmation` task dispatches both email and SMS `booking_confirmed` notifications and is triggered via `on_commit` from `_handle_charge_success`.
5. `send_payment_notification` task dispatches `payment_success` (student) and `payment_received` (landlord) notifications; triggered via `on_commit` from both Paystack (`_handle_charge_success`) and M-Pesa (`_send_payment_notifications`) paths.
6. `process_recurring_payments` uses `User.objects.filter(is_superuser=True).first()` with `if _admin:` guard — no hardcoded `recipient_id=1`.

All 16 tests across three test files pass. `python3 manage.py check` exits with 0 issues.

---

_Verified: 2026-03-17_
_Verifier: Claude (gsd-verifier)_
