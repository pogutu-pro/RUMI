---
phase: 01-critical-payment-flow-fixes
plan: 03
subsystem: payments
tags: [paystack, celery, django, recurring-payments, admin, ledger]

# Dependency graph
requires: []
provides:
  - UnmatchedPaymentRejectView that writes Transaction.status='failed' to DB on admin reject
  - PaymentLedgerView that resolves models.Q() without NameError
  - charge_saved_payment_method using real Paystack charge_authorization API
affects:
  - 02-recurring-payments
  - admin-payment-management
  - payment-ledger

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use Transaction.STATUS_CHOICES (pending/processing/success/failed) — 'rejected' is not valid; store rejection reason in metadata"
    - "Paystack amount in kobo: int(Decimal(str(amount)) * 100)"
    - "Unique recurring reference includes timestamp: RUMI-RECUR-{year}-{id}-{timestamp}"

key-files:
  created: []
  modified:
    - Backend/payments/stubs_views.py
    - Backend/payments/tasks.py

key-decisions:
  - "Use status='failed' (not 'rejected') for rejected unmatched payments — STATUS_CHOICES constraint; store rejection reason and admin email in metadata JSON field for audit trail"
  - "Add from django.db import models to stubs_views.py top-level imports — fixes PaymentLedgerView NameError without touching any other view logic"
  - "Replace random.choice() mock with requests.post() to Paystack /transaction/charge_authorization — uses saved_method.paystack_authorization_code (exact model field name)"
  - "Add module-level logger = logging.getLogger(__name__) to tasks.py — enables production-grade error/warning logging for recurring payment failures"

patterns-established:
  - "Rejection pattern: get_object_or_404 + update metadata dict + set status + save(update_fields=['status','metadata'])"
  - "Recurring charge pattern: kobo conversion + timestamp reference + requests.post with Bearer token + Transaction.objects.create on success"

requirements-completed:
  - PAY-06
  - PAY-07
  - PAY-08

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 1 Plan 03: Critical Payment Stub Fixes Summary

**Admin reject now writes status='failed' to DB; PaymentLedgerView models.Q NameError fixed; recurring charge_saved_payment_method replaced with real Paystack charge_authorization API call**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T02:26:56Z
- **Completed:** 2026-03-08T02:29:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- PAY-07: Added `from django.db import models` to stubs_views.py — PaymentLedgerView.get() no longer raises NameError on `models.Q(...)` when search_param is provided
- PAY-06: UnmatchedPaymentRejectView.post() now fetches the Transaction via get_object_or_404, sets status='failed' (the valid STATUS_CHOICE for rejected payments), stores rejection_reason and rejected_by in metadata, and calls save(update_fields=['status', 'metadata']) before returning — admin reject is no longer a no-op
- PAY-08: charge_saved_payment_method() in tasks.py now calls the real Paystack `/transaction/charge_authorization` API using `saved_method.paystack_authorization_code`, converts amount to kobo with `int(Decimal(str(amount)) * 100)`, generates a timestamp-suffixed reference to prevent duplicate charges, and creates a Transaction record on success — the `random.choice()` mock and `import random` are fully removed

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix UnmatchedPaymentRejectView DB write (PAY-06) and add models import for PaymentLedgerView NameError (PAY-07)** - `adcb5ebe` (fix)
2. **Task 2: Replace random.choice() mock with real Paystack charge_authorization API call (PAY-08)** - `661b8970` (fix)

**Plan metadata:** (docs commit follows this summary)

## Files Created/Modified

- `Backend/payments/stubs_views.py` - Added `from django.db import models` import; replaced UnmatchedPaymentRejectView.post() stub with real ORM update (get_object_or_404 + status='failed' + metadata + save)
- `Backend/payments/tasks.py` - Added `import logging` + `logger = logging.getLogger(__name__)`; replaced charge_saved_payment_method() random mock with real Paystack charge_authorization API call

## Decisions Made

- **'failed' not 'rejected' for admin reject:** Transaction.STATUS_CHOICES only includes (pending, processing, success, failed). 'rejected' is not a valid choice and would cause a database constraint error. Status is set to 'failed' and the rejection context is preserved in the metadata JSON field.
- **Audit trail in metadata:** Admin email (request.user.email) and rejection reason are stored in the transaction's metadata dict to provide a complete audit trail without requiring schema changes.
- **Timestamp in recurring reference:** The reference `RUMI-RECUR-{year}-{id}-{timestamp}` includes `int(timezone.now().timestamp())` to prevent Paystack duplicate-charge errors on task retry.
- **Module-level logger:** Added `logger = logging.getLogger(__name__)` at module level in tasks.py (not inside the function) to follow Django/Python logging conventions and enable log filtering by module path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added module-level logging infrastructure to tasks.py**
- **Found during:** Task 2 (charge_saved_payment_method replacement)
- **Issue:** Plan's implementation used `logger` inside the function but tasks.py had no logger defined anywhere. Without it the import would fail at function call time.
- **Fix:** Added `import logging` and `logger = logging.getLogger(__name__)` at module top level alongside existing imports.
- **Files modified:** Backend/payments/tasks.py
- **Verification:** `python3 manage.py check` passed with 0 issues; grep confirms logger defined before first use.
- **Committed in:** `661b8970` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical infrastructure)
**Impact on plan:** Logger was required for the plan's own implementation to function. No scope creep.

## Issues Encountered

- `python` command not available in environment (Linux, Python 3.12) — used `python3` for verification. Django management commands work correctly.
- Import verification (`python3 -c "from payments.stubs_views import ..."`) fails without `DJANGO_SETTINGS_MODULE` set. Verified correctness via `grep` pattern matching (all three done-criteria patterns found at correct lines) and `python3 manage.py check --settings=rumi.settings` (0 issues).

## User Setup Required

None - no external service configuration required. `PAYSTACK_SECRET_KEY` must already be set in production settings for the real API call to work; this is an existing requirement not introduced by this plan.

## Next Phase Readiness

- PAY-06, PAY-07, PAY-08 are fixed — admin payment rejection, payment ledger search, and recurring payment charging are now production-safe
- The `process_recurring_payments` Celery beat task (blocked per STATE.md Pitfall 9) can now be safely enabled — the random.choice() mock is gone
- Payment ledger search via `search_param` is unblocked

---
*Phase: 01-critical-payment-flow-fixes*
*Completed: 2026-03-08*
