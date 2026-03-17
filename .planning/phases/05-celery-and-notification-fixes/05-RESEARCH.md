# Phase 5: Celery and Notification Fixes - Research

**Researched:** 2026-03-17
**Domain:** Celery Beat scheduling, Django transaction safety, notification wiring
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CEL-01 | `django-celery-beat==2.6.0` added to `requirements.txt` and migrated | Package not present — requires installation and `python manage.py migrate django_celery_beat` |
| CEL-02 | `BEAT_SCHEDULE` task name corrected to `payments.tasks.assess_late_fees` (not `process_late_fees`) | `process_late_fees` entry confirmed wrong at performance_settings.py:239; `assess_late_fees` function exists at payments/tasks.py:198 |
| CEL-03 | `retry_failed_webhook_events` task registered in `BEAT_SCHEDULE` with `crontab(minute='*/5')` | `reconcile_missed_webhooks` task exists at payments/tasks.py:560; needs a `retry_failed_webhook_events` alias or rename + schedule entry |
| CEL-04 | All `.delay()` calls inside `transaction.atomic()` blocks wrapped with `transaction.on_commit(...)` | Multiple violations confirmed in payments/views.py (lines 832, 1035, 1178, 1190) and hostels/views.py (lines 243, 453) |
| CEL-05 | `send_booking_confirmation` and `send_payment_notification` tasks wired to booking/payment events | Neither task exists yet — must be created in `payments/tasks.py` (or `notifications/tasks.py`) and called from the correct event hooks |
| CEL-06 | Hardcoded `recipient_id=1` in `payments/tasks.py` replaced with `User.objects.filter(is_superuser=True).first().id` | Confirmed at payments/tasks.py:103 (`process_recurring_payments`, admin summary notification) |
</phase_requirements>

---

## Summary

Phase 5 fixes six tightly related Celery and notification issues. The project uses Celery 5.3.4 with Redis as the broker. The beat schedule lives in `rumi/performance_settings.py` inside a `CELERY_*` dict that `settings.py` loads via `get_performance_settings()`. The package `django-celery-beat` is referenced in `BEAT_SCHEDULER` but is not in `requirements.txt` and is not in `INSTALLED_APPS`, so migrations for it have never run — this is the first fix. Several `.delay()` calls are dispatched while still inside an active `transaction.atomic()` block; those must all be wrapped with `transaction.on_commit(lambda: ...)`. Two named notification tasks (`send_booking_confirmation`, `send_payment_notification`) are referenced in requirements but do not yet exist — they must be created and wired to their trigger points. One hardcoded admin `recipient_id=1` must be replaced by a dynamic superuser lookup.

**Primary recommendation:** Work in this order — CEL-01 (install + migrate), CEL-02 + CEL-03 (beat schedule corrections), CEL-04 (on_commit wrapping), CEL-05 (new notification tasks), CEL-06 (dynamic superuser lookup). Each step is independent and verifiable.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| celery | 5.3.4 | Async task queue | Already installed — don't upgrade |
| django-celery-beat | 2.6.0 | Database-driven periodic schedule | Required by requirements; `BEAT_SCHEDULER` already points to it |
| redis | 5.0.1 | Celery broker + result backend | Already installed and configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| django.db.transaction | Django 4.2 built-in | `on_commit` callback | Wrapping any `.delay()` inside `atomic()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| django-celery-beat==2.6.0 | crontab in code | Beat schedule fixed in code is harder to change at runtime; requirements specify 2.6.0 |

**Installation:**
```bash
pip install django-celery-beat==2.6.0
```
Then add to `requirements.txt` and run `python manage.py migrate django_celery_beat`.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed for most fixes. All changes are in:
```
Backend/
├── requirements.txt              # CEL-01: add django-celery-beat==2.6.0
├── rumi/
│   └── performance_settings.py  # CEL-02, CEL-03: fix BEAT_SCHEDULE entries
├── payments/
│   ├── tasks.py                  # CEL-05 new tasks, CEL-06 dynamic recipient
│   └── views.py                  # CEL-04: on_commit wrapping
└── hostels/
    └── views.py                  # CEL-04: on_commit wrapping
```

And `INSTALLED_APPS` in `rumi/settings.py` must gain `'django_celery_beat'`.

---

### Pattern 1: django-celery-beat Installation

**What:** `django-celery-beat` stores periodic task schedules in the database and is controlled by `BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'`.

**Exact change sequence:**

1. Add to `requirements.txt`:
   ```
   django-celery-beat==2.6.0
   ```

2. Add to `INSTALLED_APPS` in `rumi/settings.py` (after `'celery'`):
   ```python
   'django_celery_beat',
   ```

3. Run migrations:
   ```bash
   python manage.py migrate django_celery_beat
   ```

`BEAT_SCHEDULER` is already set correctly in `performance_settings.py:205`. No change needed there.

---

### Pattern 2: BEAT_SCHEDULE Corrections (CEL-02 and CEL-03)

**Location:** `rumi/performance_settings.py`, inside the `PERFORMANCE_CELERY` dict, key `'BEAT_SCHEDULE'` (lines 206-260).

**CEL-02 fix** — rename the wrong task entry key and task path:

```python
# BEFORE (line 238-241):
'process-late-fees': {
    'task': 'payments.tasks.process_late_fees',  # task does NOT exist
    'schedule': crontab(minute=0, hour=0),
},

# AFTER:
'assess-late-fees': {
    'task': 'payments.tasks.assess_late_fees',   # task exists at payments/tasks.py:198
    'schedule': crontab(minute=0, hour=0),
},
```

**CEL-03 fix** — add the missing `retry_failed_webhook_events` entry:

The actual task function is `payments.tasks.reconcile_missed_webhooks` (payments/tasks.py:560). Per requirements the BEAT entry must use the name `retry_failed_webhook_events`. Two valid approaches:

- **Option A (preferred):** Add a `retry_failed_webhook_events` alias by adding a new `@shared_task` in `payments/tasks.py` that calls `reconcile_missed_webhooks` — or simply add a second task name by using `name=` parameter on the decorator. Then register that name in BEAT_SCHEDULE.
- **Option B:** Register the existing `reconcile_missed_webhooks` under the key `retry-failed-webhook-events` in BEAT_SCHEDULE. The beat entry name (dict key) is arbitrary; only the `'task'` value must match the registered task name. The requirements say the beat _entry_ must include `retry_failed_webhook_events` — this is the dict key, not the function name.

**Clearest implementation** — rename the task itself and update the BEAT entry together:

```python
# payments/tasks.py — rename decorator (or add name= kwarg):
@shared_task(name='payments.tasks.retry_failed_webhook_events')
def reconcile_missed_webhooks():
    ...

# performance_settings.py BEAT_SCHEDULE addition:
'retry-failed-webhook-events': {
    'task': 'payments.tasks.retry_failed_webhook_events',
    'schedule': crontab(minute='*/5'),
},
```

---

### Pattern 3: transaction.on_commit Wrapping (CEL-04)

**Why it matters:** A `.delay()` call dispatches the task to Redis immediately. If it fires inside `transaction.atomic()` and the transaction subsequently rolls back, the task executes against a database state that never committed — resulting in missing records, `DoesNotExist` errors, or double-processing.

**The fix — always use `on_commit`:**

```python
# BEFORE (anti-pattern):
with transaction.atomic():
    refund_request = RefundRequest.objects.create(...)
    send_notification.delay(recipient_id=1, ...)   # fires before commit

# AFTER:
with transaction.atomic():
    refund_request = RefundRequest.objects.create(...)
    transaction.on_commit(
        lambda: send_notification.delay(
            recipient_id=1,
            notification_type='refund_request_submitted',
            channel='email',
            context={...}
        )
    )
```

**Important — lambda capture pitfall:** When wrapping multiple `.delay()` calls in a loop or in sequence, each lambda must capture its own variable snapshot. The safe pattern is to extract local variables or use default arguments:

```python
# Safe capture in a loop:
for item in items:
    item_id = item.id  # snapshot
    transaction.on_commit(lambda i=item_id: some_task.delay(i))
```

**All locations requiring CEL-04 wrapping (confirmed by code audit):**

| File | Line | Call | Inside atomic? |
|------|------|------|----------------|
| `payments/views.py` | 832 | `send_notification.delay(recipient_id=1, notification_type='refund_request_submitted', ...)` | Yes — `with transaction.atomic():` at line 818 |
| `payments/views.py` | 1035 | `send_notification.delay(recipient_id=refund_request.student.user.id, notification_type='refund_request_processed', ...)` | Yes — `with transaction.atomic():` at line 1015 |
| `payments/views.py` | 1178 | `send_notification.delay(recipient_id=txn.student.user.id, notification_type='payment_success', ...)` | Yes — `with transaction.atomic():` at line 1129 |
| `payments/views.py` | 1190 | `send_notification.delay(recipient_id=txn.landlord.user.id, notification_type='payment_received', ...)` | Yes — `with transaction.atomic():` at line 1129 |
| `hostels/views.py` | 243 | `notify_landlord_inventory_template_created.delay(...)` | Yes — `with transaction.atomic():` at line 199 |
| `hostels/views.py` | 453 | `notify_caretaker_checkin_submitted.delay(checkin_id=checkin.id)` | Yes — `with transaction.atomic():` at line 442 |

Note: `hostels/views.py:934` (`cleanup_expired_reservation.apply_async(...)`) is also inside `transaction.atomic()` at line 892. This is a scheduling task (not a notification), but the same rule applies — wrap it with `on_commit`.

**`_handle_charge_success` in `payments/views.py` (lines 1177-1199):** The two `send_notification.delay()` calls at lines 1178 and 1190 are inside `with transaction.atomic():` at line 1129. Both need `on_commit` wrapping. The `ReceiptService.generate_and_send_receipt(txn)` call at line 1204 is *outside* the atomic block (lines 1202-1208 are after the `with` block closes), so no change needed there.

---

### Pattern 4: New Notification Tasks (CEL-05)

Neither `send_booking_confirmation` nor `send_payment_notification` exists anywhere in the codebase. They must be created in `payments/tasks.py`.

**send_booking_confirmation** — fires when a booking is confirmed (status changes to `'confirmed'`). The trigger point is `_handle_charge_success` in `payments/views.py` at line 1141 where `booking.status = 'confirmed'` is set and saved. This task should dispatch SMS or email to the student.

```python
# payments/tasks.py
@shared_task
def send_booking_confirmation(booking_id):
    """
    Send booking confirmation SMS/email after payment commits.
    Called via on_commit from _handle_charge_success.
    """
    from hostels.models import Booking
    from notifications.tasks import send_notification

    try:
        booking = Booking.objects.select_related(
            'student__user', 'room__hostel'
        ).get(id=booking_id)

        send_notification.delay(
            recipient_id=booking.student.user.id,
            notification_type='booking_confirmed',
            channel='email',
            context={
                'student_name': booking.student.user.first_name,
                'hostel_name': booking.room.hostel.name,
                'room_number': booking.room.room_number,
                'booking_reference': booking.booking_reference,
                'check_in_date': booking.check_in_date.strftime('%B %d, %Y') if booking.check_in_date else 'TBD',
            }
        )

        send_notification.delay(
            recipient_id=booking.student.user.id,
            notification_type='booking_confirmed',
            channel='sms',
            context={
                'first_name': booking.student.user.first_name,
                'hostel_name': booking.room.hostel.name,
                'booking_reference': booking.booking_reference,
            }
        )
    except Exception as e:
        logger.error(f"send_booking_confirmation failed for booking {booking_id}: {e}")
```

**send_payment_notification** — fires when a payment is received. The trigger point is the same `_handle_charge_success` function and the M-Pesa `_send_payment_notifications` helper.

```python
@shared_task
def send_payment_notification(transaction_id):
    """
    Send payment received notification to student and landlord.
    Called via on_commit from _handle_charge_success.
    """
    from payments.models import Transaction
    from notifications.tasks import send_notification

    try:
        txn = Transaction.objects.select_related(
            'student__user', 'landlord__user'
        ).get(id=transaction_id)

        send_notification.delay(
            recipient_id=txn.student.user.id,
            notification_type='payment_success',
            channel='email',
            context={
                'student_name': txn.student.user.first_name,
                'amount': float(txn.total_charged_amount),
                'transaction_reference': txn.transaction_reference,
            }
        )

        send_notification.delay(
            recipient_id=txn.landlord.user.id,
            notification_type='payment_received',
            channel='email',
            context={
                'landlord_name': txn.landlord.company_name or txn.landlord.user.first_name,
                'amount': float(txn.landlord_payout_amount),
                'student_name': txn.student.user.first_name,
            }
        )
    except Exception as e:
        logger.error(f"send_payment_notification failed for transaction {transaction_id}: {e}")
```

**Wiring:** In `_handle_charge_success` (`payments/views.py`), the existing direct `send_notification.delay()` calls at lines 1178 and 1190 should be **replaced** by the new named tasks, dispatched via `on_commit`:

```python
# Inside _handle_charge_success, REPLACE lines 1177-1199 with:
from payments.tasks import send_booking_confirmation, send_payment_notification

transaction.on_commit(lambda: send_booking_confirmation.delay(booking.id))
transaction.on_commit(lambda: send_payment_notification.delay(txn.id))
```

This satisfies CEL-04 and CEL-05 together for the Paystack webhook path. The M-Pesa webhook (`mpesa_webhooks.py`) calls `self._send_payment_notifications(transaction_obj)` at line 255 from *within* `transaction.atomic()`. That helper calls `.delay()` directly. Wire it to use `send_payment_notification.delay` via `on_commit` as well.

---

### Pattern 5: Dynamic Superuser Lookup (CEL-06)

**Location:** `payments/tasks.py` line 103 — inside `process_recurring_payments()`.

```python
# BEFORE:
send_notification.delay(
    recipient_id=1,  # Admin user ID
    ...
)

# AFTER:
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.filter(is_superuser=True).first()
if admin:
    send_notification.delay(
        recipient_id=admin.id,
        ...
    )
```

The `if admin:` guard is required — the task must not crash if no superuser exists yet (e.g., in test environments).

---

### Anti-Patterns to Avoid

- **Calling `.delay()` directly in atomic blocks without `on_commit`:** The task may execute before the DB transaction commits, reading non-existent or stale data.
- **Using `lambda: task.delay()` in a loop without capturing loop variable:** Python closures capture by reference; always use a default argument `lambda x=var: task.delay(x)`.
- **Adding `django_celery_beat` to `INSTALLED_APPS` without running migrations:** Django will raise `OperationalError: no such table: django_celery_beat_*` at startup.
- **Renaming a task but not updating all callsites:** The beat schedule uses string task names — a mismatch causes `celery.exceptions.NotRegistered` at runtime.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Post-commit task dispatch | Custom signal or threading hack | `transaction.on_commit(lambda: task.delay(...))` | Django built-in; works correctly with savepoints and nested atomics |
| Periodic schedule storage | Custom scheduler table | `django-celery-beat` | Handles crontab, interval, solar schedules; admin UI included |
| Dynamic admin lookup | `User.objects.get(id=1)` | `User.objects.filter(is_superuser=True).first()` | Hardcoded IDs break in test/staging environments |

**Key insight:** `transaction.on_commit` is the Django-idiomatic answer to the "fire task after commit" problem. It is zero-dependency and works with all DB backends that support transactions.

---

## Common Pitfalls

### Pitfall 1: `django_celery_beat` in `BEAT_SCHEDULER` but not in `INSTALLED_APPS`
**What goes wrong:** `python manage.py migrate` does not create the `django_celery_beat_*` tables. Beat starts but crashes with `OperationalError`.
**Why it happens:** `BEAT_SCHEDULER` is a Celery config key; Django's migration runner only considers apps in `INSTALLED_APPS`.
**How to avoid:** Add `'django_celery_beat'` to `INSTALLED_APPS` before running migrate.
**Warning signs:** `manage.py showmigrations django_celery_beat` returns an error.

### Pitfall 2: Wrong task dotted path in BEAT_SCHEDULE
**What goes wrong:** Beat logs `celery.exceptions.NotRegistered: 'payments.tasks.process_late_fees'` and the schedule never runs.
**Why it happens:** The string in `'task'` must exactly match the task's auto-discovered dotted import path. `process_late_fees` does not exist; `assess_late_fees` does.
**How to avoid:** Verify with `celery inspect registered` or search the task file directly.

### Pitfall 3: `on_commit` callbacks not firing in tests
**What goes wrong:** Unit tests using `TestCase` (not `TransactionTestCase`) wrap every test in a transaction that is always rolled back — `on_commit` callbacks never fire.
**Why it happens:** Django's `TestCase` wraps the test in an outer atomic block that never commits.
**How to avoid:** Use `TransactionTestCase` for tests that need `on_commit` to fire, or use `celery_task_always_eager=True` in test settings.

### Pitfall 4: `User.objects.filter(is_superuser=True).first()` returns `None`
**What goes wrong:** `admin.id` raises `AttributeError: 'NoneType' object has no attribute 'id'`.
**Why it happens:** Test DB or fresh dev environment has no superuser.
**How to avoid:** Always guard with `if admin:` before accessing `.id`.

### Pitfall 5: `on_commit` lambda captures mutable loop variable
**What goes wrong:** All `on_commit` callbacks dispatch with the *last* value of the loop variable.
**Why it happens:** Python closures capture the variable reference, not its value at closure creation time.
**How to avoid:** Use default argument capture: `lambda txn_id=txn.id: task.delay(txn_id)`.

---

## Code Examples

### Registering django-celery-beat in INSTALLED_APPS
```python
# rumi/settings.py — INSTALLED_APPS, after 'celery':
'django_celery_beat',
```

### Corrected BEAT_SCHEDULE entries
```python
# rumi/performance_settings.py — inside PERFORMANCE_CELERY['BEAT_SCHEDULE']:
'assess-late-fees': {
    'task': 'payments.tasks.assess_late_fees',
    'schedule': crontab(minute=0, hour=0),  # Daily at midnight
},
'retry-failed-webhook-events': {
    'task': 'payments.tasks.retry_failed_webhook_events',
    'schedule': crontab(minute='*/5'),  # Every 5 minutes
},
```

### on_commit wrapping — single call
```python
from django.db import transaction

with transaction.atomic():
    obj = MyModel.objects.create(...)
    transaction.on_commit(
        lambda: send_notification.delay(
            recipient_id=obj.student.user.id,
            notification_type='payment_success',
            channel='email',
            context={...}
        )
    )
```

### on_commit wrapping — multiple calls, safe capture
```python
with transaction.atomic():
    txn = Transaction.objects.create(...)
    booking = txn.booking
    txn_id = txn.id
    booking_id = booking.id
    transaction.on_commit(lambda: send_payment_notification.delay(txn_id))
    transaction.on_commit(lambda: send_booking_confirmation.delay(booking_id))
```

### Dynamic superuser lookup
```python
from django.contrib.auth import get_user_model
User = get_user_model()

admin = User.objects.filter(is_superuser=True).first()
if admin:
    send_notification.delay(
        recipient_id=admin.id,
        notification_type='recurring_payments_summary',
        channel='email',
        context=results
    )
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `task.delay()` inside `atomic()` | `transaction.on_commit(lambda: task.delay(...))` | Django 1.9+ | Prevents tasks from reading uncommitted DB state |
| Hardcoded admin `recipient_id=1` | Dynamic `User.objects.filter(is_superuser=True).first()` | This phase | Works in all environments, not just production |

**Deprecated/outdated in this codebase:**
- `'payments.tasks.process_late_fees'` in BEAT_SCHEDULE: never existed; replaced by `assess_late_fees`
- Direct `.delay()` inside `atomic()` blocks: all 6 confirmed violations must be converted

---

## Open Questions

1. **CEL-03: Task name — `retry_failed_webhook_events` vs `reconcile_missed_webhooks`**
   - What we know: The function is `reconcile_missed_webhooks`; the requirements say the BEAT entry must include `retry_failed_webhook_events`.
   - What's unclear: Should the function be renamed or should a `name=` kwarg alias be added to the decorator?
   - Recommendation: Add `name='payments.tasks.retry_failed_webhook_events'` to the `@shared_task` decorator on `reconcile_missed_webhooks`. This registers it under the new name without breaking any existing callers (there are none in the beat schedule yet). The function body stays as-is.

2. **CEL-05: M-Pesa path for `send_payment_notification`**
   - What we know: `mpesa_webhooks.py` calls `self._send_payment_notifications(transaction_obj)` from within `transaction.atomic()`, which dispatches `.delay()` directly.
   - What's unclear: The requirements specify the task fires on "payment received" events — this includes M-Pesa, not just Paystack.
   - Recommendation: Replace the `_send_payment_notifications` helper calls in the M-Pesa handler with `on_commit(lambda: send_payment_notification.delay(transaction_obj.id))` for consistency.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 7.4.3 + pytest-django 4.7.0 |
| Config file | `Backend/pytest.ini` |
| Quick run command | `cd Backend && python -m pytest payments/ -x -q --no-header` |
| Full suite command | `cd Backend && python -m pytest accounts/ hostels/ payments/ -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CEL-01 | `migrate django_celery_beat` runs without error | smoke | `python manage.py migrate django_celery_beat --check` | N/A — Django mgmt command |
| CEL-02 | BEAT_SCHEDULE key `assess-late-fees` → `payments.tasks.assess_late_fees` | unit | `pytest payments/tests.py -k beat_schedule -x` | ❌ Wave 0 |
| CEL-03 | BEAT_SCHEDULE includes `retry-failed-webhook-events` on `*/5` | unit | `pytest payments/tests.py -k beat_schedule -x` | ❌ Wave 0 |
| CEL-04 | No `.delay()` call fires inside uncommitted atomic block | unit | `pytest payments/tests.py -k on_commit -x` | ❌ Wave 0 |
| CEL-05 | `send_booking_confirmation` dispatched after booking confirmed | unit | `pytest payments/tests.py -k booking_confirmation -x` | ❌ Wave 0 |
| CEL-05 | `send_payment_notification` dispatched after payment received | unit | `pytest payments/tests.py -k payment_notification -x` | ❌ Wave 0 |
| CEL-06 | Admin notification uses dynamic superuser, not `id=1` | unit | `pytest payments/tests.py -k superuser_recipient -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd Backend && python -m pytest payments/ -x -q --no-header`
- **Per wave merge:** `cd Backend && python -m pytest accounts/ hostels/ payments/ -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `Backend/payments/tests.py` — cover CEL-02, CEL-03, CEL-04, CEL-05, CEL-06 (file may exist but tasks for these requirements are missing)
- [ ] Test coverage for `send_booking_confirmation` and `send_payment_notification` tasks

---

## Sources

### Primary (HIGH confidence)
- Direct code audit: `Backend/rumi/performance_settings.py` — BEAT_SCHEDULE, BEAT_SCHEDULER, INSTALLED_APPS
- Direct code audit: `Backend/payments/tasks.py` — task names, `assess_late_fees`, `reconcile_missed_webhooks`, `recipient_id=1`
- Direct code audit: `Backend/payments/views.py` — `.delay()` inside `transaction.atomic()` at lines 818, 1015, 1129
- Direct code audit: `Backend/hostels/views.py` — `.delay()` inside `transaction.atomic()` at lines 199, 442
- Direct code audit: `Backend/notifications/tasks.py` — `send_notification` signature, channels supported
- Direct code audit: `Backend/requirements.txt` — `django-celery-beat` absent, `celery==5.3.4` present
- Django 4.2 official docs: `transaction.on_commit` semantics — standard built-in since Django 1.9

### Secondary (MEDIUM confidence)
- Django release notes: `transaction.on_commit` is the canonical solution for post-commit task dispatch, well-established since Django 1.9

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from requirements.txt and direct file audit
- Architecture: HIGH — all change locations confirmed by reading actual source files
- Pitfalls: HIGH — all pitfalls verified from the actual code patterns present in this repo

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable Django/Celery patterns; code structure unlikely to change)
