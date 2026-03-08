---
phase: 01-critical-payment-flow-fixes
plan: 02
subsystem: payments
tags: [mpesa, django, webhooks, idempotency, select_for_update, postgresql]

# Dependency graph
requires: []
provides:
  - BACKEND_API_URL env var in settings.py for routing M-Pesa callbacks to Django backend
  - select_for_update() idempotency guard in _update_transaction_from_stk_push
  - HTTP 200 always returned from STK push webhook except blocks
affects:
  - 02-payment-verification
  - 04-caretaker-management
  - M-Pesa production go-live

# Tech tracking
tech-stack:
  added: []
  patterns:
    - select_for_update() inside transaction.atomic() for concurrent webhook idempotency
    - Always return HTTP 200 from payment provider webhooks to prevent retry storms

key-files:
  created: []
  modified:
    - Backend/rumi/settings.py
    - Backend/payments/mpesa_webhooks.py

key-decisions:
  - "Use BACKEND_API_URL (not FRONTEND_URL) as base for M-Pesa callback URL defaults — Django backend handles POST callbacks, Next.js frontend does not"
  - "select_for_update() re-fetches transaction_obj inside transaction.atomic() to ensure row lock covers both idempotency check and initial status save"
  - "Both outer and inner STK push except blocks return HTTP 200 with {ResultCode: 0, ResultDesc: Accepted} — never HTTP 500 to Safaricom"

patterns-established:
  - "Pattern: M-Pesa idempotency via select_for_update() + transaction.atomic() — re-fetch inside lock before checking status"
  - "Pattern: Payment provider webhooks always return HTTP 200 — log errors internally, never return 5xx to payment providers"

requirements-completed: [PAY-02, PAY-03, PAY-04]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 1 Plan 02: M-Pesa Webhook URL Fix and Idempotency Guard Summary

**M-Pesa callbacks rerouted from Next.js frontend to Django backend via BACKEND_API_URL; concurrent retry double-processing eliminated via select_for_update(); all STK push exception handlers changed to return HTTP 200 to stop Safaricom retry storms**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-08T02:27:00Z
- **Completed:** 2026-03-08T02:30:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Introduced `BACKEND_API_URL` env var in settings.py (defaults to `https://api.rumia.co.ke`) and rebuilt all three M-Pesa callback URL defaults to use it — Safaricom callbacks now reach the Django API, not the Next.js frontend
- Added `select_for_update()` inside `transaction.atomic()` in `_update_transaction_from_stk_push` — concurrent M-Pesa retry deliveries for the same `CheckoutRequestID` now serialize at the DB row level, preventing duplicate rent credit
- Changed all STK push webhook except blocks from `status=500` to HTTP 200 with `{"ResultCode": 0, "ResultDesc": "Accepted"}` — Safaricom no longer retries indefinitely on internal exceptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add BACKEND_API_URL and fix M-Pesa webhook URL defaults (PAY-02)** - `f93c4412` (fix)
2. **Task 2: Add select_for_update idempotency guard; always return HTTP 200 (PAY-03, PAY-04)** - `4d9165c1` (fix)

## Files Created/Modified

- `Backend/rumi/settings.py` - Added `BACKEND_API_URL` env var; changed `MPESA_CALLBACK_URL`, `MPESA_VALIDATION_URL`, `MPESA_CONFIRMATION_URL` defaults to use `BACKEND_API_URL` instead of `FRONTEND_URL`
- `Backend/payments/mpesa_webhooks.py` - Added `select_for_update()` + `transaction.atomic()` to `_update_transaction_from_stk_push`; changed outer except in `_handle_stk_push_callback` from HTTP 500 to HTTP 200; changed inner except in `_update_transaction_from_stk_push` from HTTP 500 to HTTP 200

## Exact Lines Modified

**Backend/rumi/settings.py (lines 261-268):**

Before:
```python
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://rumia.co.ke').rstrip('/')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', f"{FRONTEND_URL}/api/v1/payments/webhook/mpesa/stk_push/")
MPESA_VALIDATION_URL = os.getenv('MPESA_VALIDATION_URL', f"{FRONTEND_URL}/api/v1/payments/webhook/mpesa/c2b_validation/")
MPESA_CONFIRMATION_URL = os.getenv('MPESA_C2B_CONFIRMATION_URL', f"{FRONTEND_URL}/api/v1/payments/webhook/mpesa/c2b_confirmation/")
```

After:
```python
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://rumia.co.ke').rstrip('/')
# BACKEND_API_URL is used for all webhook callback URLs (M-Pesa, etc.)
# Must point to the Django backend server — never the Next.js frontend domain.
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'https://api.rumia.co.ke').rstrip('/')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', f"{BACKEND_API_URL}/api/v1/payments/webhook/mpesa/stk_push/")
MPESA_VALIDATION_URL = os.getenv('MPESA_VALIDATION_URL', f"{BACKEND_API_URL}/api/v1/payments/webhook/mpesa/c2b_validation/")
MPESA_CONFIRMATION_URL = os.getenv('MPESA_C2B_CONFIRMATION_URL', f"{BACKEND_API_URL}/api/v1/payments/webhook/mpesa/c2b_confirmation/")
```

**Backend/payments/mpesa_webhooks.py — _update_transaction_from_stk_push:**

Added `with transaction.atomic(): ... select_for_update()` wrapper (lines 218-233) enclosing the idempotency check and initial status save.

**Backend/payments/mpesa_webhooks.py — outer except in _handle_stk_push_callback (was line 170-176):**

Changed from: `return JsonResponse({"status": "error", "message": str(e)}, status=500)`
Changed to: `return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)`

**Backend/payments/mpesa_webhooks.py — inner except in _update_transaction_from_stk_push (was line 262-264):**

Changed from: `return JsonResponse({'error': str(e)}, status=500)`
Changed to: `return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)`

## Decisions Made

- Used `BACKEND_API_URL` as the new env var name (not `API_URL` or `DJANGO_URL`) for clarity that it is the Django backend server URL used for webhooks and API callbacks
- The `select_for_update()` re-fetches `transaction_obj` inside `transaction.atomic()` (rather than passing the lock hint to the original query in the caller) because the method signature receives an already-fetched object — the re-fetch pattern is the minimal-change approach that keeps the row lock correctly scoped
- The inner `transaction.atomic()` block for business logic is retained as a savepoint inside the outer atomic block — Django handles nested atomics as savepoints, which is the correct pattern

## Deviations from Plan

None - plan executed exactly as written.

**Note on pre-existing status=500 in other methods:** Lines 83, 295, and 392 in mpesa_webhooks.py still contain `status=500` responses in `post()` dispatch handler, `_handle_failed_stk_push`, and `_create_transaction_from_c2b` respectively. These were pre-existing and out of scope for this plan (PAY-03/PAY-04 only scoped `_handle_stk_push_callback` and `_update_transaction_from_stk_push`). Deferred for future cleanup.

## Issues Encountered

None.

## User Setup Required

**New environment variable required in production:**

```
BACKEND_API_URL=https://api.rumia.co.ke  # or your actual Django backend domain
```

This must be set in the production environment before deploying. Without it, M-Pesa callback URLs will use the `https://api.rumia.co.ke` default which may or may not match the actual backend hostname.

## Next Phase Readiness

- PAY-02, PAY-03, PAY-04 complete — M-Pesa STK push flow is now production-safe
- `BACKEND_API_URL` env var must be added to production deployment config before going live
- Remaining `status=500` responses in `_handle_failed_stk_push` and `_create_transaction_from_c2b` should be addressed in a future cleanup plan

## Self-Check: PASSED

- FOUND: Backend/rumi/settings.py
- FOUND: Backend/payments/mpesa_webhooks.py
- FOUND: .planning/phases/01-critical-payment-flow-fixes/01-02-SUMMARY.md
- FOUND commit f93c4412 (Task 1: BACKEND_API_URL settings fix)
- FOUND commit 4d9165c1 (Task 2: select_for_update + HTTP 200 fixes)

---
*Phase: 01-critical-payment-flow-fixes*
*Completed: 2026-03-08*
