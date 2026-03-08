# Phase 1: Critical Payment Flow Fixes - Research

**Researched:** 2026-03-08
**Domain:** Django 4.2 payment webhook handlers — Paystack HMAC verification, M-Pesa Daraja STK push, Celery recurring payments, DRF view DB writes
**Confidence:** HIGH — all findings based on direct codebase inspection

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | Paystack `charge.success` webhook processes without crashing — variable shadowing bug fixed | Variable shadowing confirmed in `_handle_charge_success`: `transaction = Transaction.objects.get(...)` overwrites `from django.db import transaction` import on line 9 of views.py. `transaction.atomic()` at line 1122 then calls `.atomic()` on a model instance, raising `AttributeError`. |
| PAY-02 | M-Pesa STK push callback URLs point to Django backend domain (`BACKEND_API_URL`) not Next.js frontend | Confirmed in `rumi/settings.py` lines 262-265: all three M-Pesa webhook URLs default to `FRONTEND_URL` (`https://rumia.co.ke`). Next.js does not handle these POST routes. Fix: add `BACKEND_API_URL` env var and substitute. |
| PAY-03 | STK push webhook handles duplicate M-Pesa deliveries idempotently via `select_for_update()` | Confirmed missing: `_update_transaction_from_stk_push` (mpesa_webhooks.py line 218) checks `transaction_obj.status == 'success'` without `select_for_update()`. Two concurrent retries can both pass the guard. Fix pattern documented below. |
| PAY-04 | STK push webhook always returns HTTP 200 to Safaricom | Confirmed broken: `_handle_stk_push_callback` outer `except` at mpesa_webhooks.py line 176 returns `status=500`. Safaricom treats non-2xx as delivery failure and retries indefinitely. |
| PAY-05 | Paystack webhook signature verification uses raw `request.body` bytes | Already correct at views.py line 1076: `body = request.body` (bytes). The HMAC call at line 1079 is correct. However the outer `except Exception` at line 1100-1102 returns HTTP 500 — which is a related reliability concern. The signature code itself is NOT broken; the risk is middleware decode interference from future changes. |
| PAY-06 | `UnmatchedPaymentRejectView` updates Transaction record in DB | Confirmed broken in stubs_views.py line 67-69: `post()` returns `{'status': 'rejected', 'payment_id': payment_id}` with no ORM write. Transaction status never changes. |
| PAY-07 | `PaymentLedgerView` fixes `models.Q` NameError and returns paginated data | Confirmed broken in stubs_views.py line 139: uses `models.Q(...)` but `models` is not imported in stubs_views.py. Any request with `search_param` raises `NameError: name 'models' is not defined`. Also missing pagination. |
| PAY-08 | Celery recurring payment task calls real Paystack API — `random.choice()` mock removed | Confirmed in tasks.py lines 116-117: `success = random.choice([True, True, True, False])`. This is NOT a test — it runs in production Celery. 25% of recurring payments will randomly fail with "Insufficient funds". |
</phase_requirements>

---

## Summary

Phase 1 addresses eight isolated, surgical bugs in the payment subsystem. None of these bugs require new models, new migrations, or changes to URL routing. Every fix is a targeted code change to an existing file. The bugs range from a Python name collision that crashes a webhook handler, to a callback URL misconfiguration that causes all M-Pesa payments to silently fail in production, to a mock that was never removed from live Celery task code.

The most dangerous bugs by production impact are: PAY-02 (all M-Pesa STK payments stuck `pending` forever because Safaricom POSTs to the wrong server), PAY-08 (randomly killing 25% of recurring payments for real users), and PAY-01 (Paystack charge.success webhook always crashes, so no Paystack payment ever completes). PAY-04 is dangerous because HTTP 500 responses to Safaricom trigger infinite retries, which combined with PAY-03's missing `select_for_update()` creates a double-processing risk.

All eight bugs were directly confirmed by reading the relevant source files. No external library research is required — the fixes use only Django ORM primitives (`select_for_update`, `atomic`, `Q`), the existing Paystack API SDK pattern already in the codebase, and standard Python `from django.db import models` imports.

**Primary recommendation:** Fix bugs in order PAY-02 → PAY-01 → PAY-04 → PAY-03 → PAY-08 → PAY-05 → PAY-06 → PAY-07. The first four unblock real payment flow; the last four fix admin and reliability concerns.

---

## Standard Stack

### Core (already in project — no installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 4.2.7 (LTS) | ORM, `select_for_update()`, `transaction.atomic()` | Project baseline; all fixes use built-in Django primitives |
| Django REST Framework | installed | APIView, Response, status codes | All payment views use DRF |
| `django.db.models` | built-in | `Q` objects for filter composition | Standard Django query filter |
| `hmac` + `hashlib` | stdlib | Paystack HMAC-SHA512 signature verification | Already used correctly in paystack_webhook |
| Celery `shared_task` | installed | Recurring payment background tasks | Project baseline |
| `requests` / Paystack SDK pattern | installed | Real Paystack charge API call | MpesaDarajaAPI pattern already in codebase |

### No new dependencies required for Phase 1

All eight fixes use code patterns already present in the codebase. No `pip install` steps needed.

---

## Architecture Patterns

### Pattern 1: Rename Local Variable to Fix Shadowing (PAY-01)

**What:** In `_handle_charge_success`, the local variable name `transaction` collides with `from django.db import transaction`. Rename the ORM variable.

**When to use:** Whenever a local variable would shadow an imported module name.

**Fix:**
```python
# Backend/payments/views.py — _handle_charge_success function

# BEFORE (broken):
from django.db import transaction  # module import at top of file
# ...
transaction = Transaction.objects.select_related(...)  # SHADOWS the import
# ...
with transaction.atomic():  # AttributeError: 'Transaction' model has no atomic()

# AFTER (fixed):
txn = Transaction.objects.select_related(
    'booking', 'student', 'landlord'
).get(transaction_reference=reference)

if txn.status == 'success':
    return Response({'status': 'already_processed'}, status=status.HTTP_200_OK)

with transaction.atomic():  # now refers to django.db.transaction correctly
    txn.status = 'success'
    txn.paystack_reference = data.get('id')
    # ... rest of updates using txn, not transaction
    txn.save()
    booking = txn.booking
    # etc.
```

### Pattern 2: Separate BACKEND_API_URL Env Var for Webhook Bases (PAY-02)

**What:** Settings currently build all M-Pesa webhook URLs from `FRONTEND_URL`. A separate `BACKEND_API_URL` env var must be introduced and used for all webhook callback URL construction.

**Fix location:** `Backend/rumi/settings.py` lines 261-265.

```python
# BEFORE (broken):
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://rumia.co.ke').rstrip('/')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', f"{FRONTEND_URL}/api/v1/payments/webhook/mpesa/stk_push/")
MPESA_VALIDATION_URL = os.getenv('MPESA_VALIDATION_URL', f"{FRONTEND_URL}/api/v1/payments/webhook/mpesa/c2b_validation/")
MPESA_CONFIRMATION_URL = os.getenv('MPESA_C2B_CONFIRMATION_URL', f"{FRONTEND_URL}/api/v1/payments/webhook/mpesa/c2b_confirmation/")

# AFTER (fixed):
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://rumia.co.ke').rstrip('/')
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'https://api.rumia.co.ke').rstrip('/')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', f"{BACKEND_API_URL}/api/v1/payments/webhook/mpesa/stk_push/")
MPESA_VALIDATION_URL = os.getenv('MPESA_VALIDATION_URL', f"{BACKEND_API_URL}/api/v1/payments/webhook/mpesa/c2b_validation/")
MPESA_CONFIRMATION_URL = os.getenv('MPESA_C2B_CONFIRMATION_URL', f"{BACKEND_API_URL}/api/v1/payments/webhook/mpesa/c2b_confirmation/")
```

### Pattern 3: select_for_update() for Idempotent Webhook Processing (PAY-03)

**What:** Wrap the idempotency check inside `atomic()` with `select_for_update()`. The guard check and the update must be in the same transaction with a row lock held.

**Fix location:** `Backend/payments/mpesa_webhooks.py` — `_update_transaction_from_stk_push` method.

```python
# BEFORE (broken — race condition window between check and update):
if transaction_obj.status == 'success':
    return JsonResponse({'status': 'already_processed'}, status=200)

transaction_obj.status = 'processing'
transaction_obj.save()

# AFTER (fixed — atomic + row lock eliminates race):
with transaction.atomic():
    # Re-fetch with row lock; blocks concurrent requests until we commit
    transaction_obj = Transaction.objects.select_for_update().get(
        pk=transaction_obj.pk
    )
    if transaction_obj.status == 'success':
        return JsonResponse({'status': 'already_processed'}, status=200)

    transaction_obj.status = 'processing'
    transaction_obj.mpesa_receipt_number = payment_info.get('receipt_number')
    transaction_obj.mpesa_phone_number = payment_info.get('phone_number')
    transaction_obj.metadata = payment_info
    transaction_obj.save()
```

**Note:** The `transaction_obj` has already been fetched before this method is called. Inside `_update_transaction_from_stk_push`, re-fetch using `select_for_update()` by pk — the passed-in object is now stale.

### Pattern 4: Always Return HTTP 200 from Safaricom Webhook Endpoint (PAY-04)

**What:** Safaricom treats any non-2xx response as delivery failure and retries. The outer `except Exception` in `_handle_stk_push_callback` must never return status=500.

**Fix location:** `Backend/payments/mpesa_webhooks.py` — `_handle_stk_push_callback` outer except block (line ~170-176).

```python
# BEFORE (broken):
except Exception as e:
    logger.error(f"Error processing STK Push webhook: {str(e)}")
    from .middleware import PAYMENT_FAILURES
    PAYMENT_FAILURES.labels(provider='mpesa', reason='exception').inc()
    return JsonResponse({"status": "error", "message": str(e)}, status=500)  # TRIGGERS SAFARICOM RETRIES

# AFTER (fixed):
except Exception as e:
    logger.error(f"Error processing STK Push webhook: {str(e)}", exc_info=True)
    from .middleware import PAYMENT_FAILURES
    PAYMENT_FAILURES.labels(provider='mpesa', reason='exception').inc()
    # Always return 200 — Safaricom must not retry on internal errors
    return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)
```

**Safaricom-compliant success response:** The standard M-Pesa STK push acknowledgment body is `{"ResultCode": 0, "ResultDesc": "Accepted"}`.

### Pattern 5: Fix UnmatchedPaymentRejectView DB Write (PAY-06)

**What:** The stub returns a response without writing to the database. Add ORM update before returning.

**Fix location:** `Backend/payments/stubs_views.py` — `UnmatchedPaymentRejectView.post()`.

```python
# BEFORE (broken — no DB write):
def post(self, request, payment_id):
    return Response({'status': 'rejected', 'payment_id': payment_id})

# AFTER (fixed):
def post(self, request, payment_id):
    transaction = get_object_or_404(Transaction, id=payment_id)
    reason = request.data.get('reason', '')
    transaction.status = 'rejected'
    transaction.notes = reason  # or whichever notes field exists on Transaction
    transaction.save(update_fields=['status', 'notes'])
    return Response({'status': 'rejected', 'payment_id': payment_id})
```

**Important:** Confirm the correct status choice string on the Transaction model before writing. Check `Transaction.STATUS_CHOICES` in `payments/models.py`.

### Pattern 6: Fix PaymentLedgerView models.Q NameError + Add Pagination (PAY-07)

**What:** `models` is not imported in stubs_views.py. Add the correct import and add pagination.

**Fix location:** `Backend/payments/stubs_views.py` — top of file and `PaymentLedgerView.get()`.

```python
# Add to imports at top of stubs_views.py:
from django.db import models  # for models.Q

# Fix in PaymentLedgerView.get():
from rest_framework.pagination import PageNumberPagination

def get(self, request, search_param=None):
    ledger = BedPaymentLedger.objects.all().select_related(
        'bed', 'transaction', 'bed__room__hostel'
    ).order_by('-created_at')

    search_param = request.query_params.get('search', search_param)
    if search_param:
        ledger = ledger.filter(
            models.Q(bed__full_code__icontains=search_param) |
            models.Q(transaction__transaction_reference__icontains=search_param)
        )

    paginator = PageNumberPagination()
    paginator.page_size = 50
    page = paginator.paginate_queryset(ledger, request)
    # ... serialize and return
```

### Pattern 7: Replace random.choice() Mock with Real Paystack Charge Call (PAY-08)

**What:** `charge_saved_payment_method` in tasks.py uses `random.choice()` to simulate success/failure. Replace with a real Paystack charge API call using the `SavedPaymentMethod.authorization_code`.

**Fix location:** `Backend/payments/tasks.py` — `charge_saved_payment_method` function.

```python
# BEFORE (broken mock):
import random
success = random.choice([True, True, True, False])  # 75% success rate — LIVE IN PROD

# AFTER (real Paystack charge):
import requests
import json
from django.conf import settings

def charge_saved_payment_method(recurring_payment, amount):
    """
    Charge saved payment method via Paystack Charge API.
    Uses authorization_code from SavedPaymentMethod.
    """
    saved_method = recurring_payment.saved_payment_method
    paystack_secret = settings.PAYSTACK_SECRET_KEY
    amount_kobo = int(Decimal(str(amount)) * 100)  # Convert to kobo/smallest unit

    payload = {
        'authorization_code': saved_method.authorization_code,
        'email': recurring_payment.student.user.email,
        'amount': amount_kobo,
        'reference': f"RUMI-RECUR-{timezone.now().year}-{recurring_payment.id}-{timezone.now().timestamp():.0f}",
        'metadata': {
            'recurring_payment_id': recurring_payment.id,
            'is_recurring': True,
            'booking_id': recurring_payment.booking.id,
        }
    }

    response = requests.post(
        'https://api.paystack.co/transaction/charge_authorization',
        headers={
            'Authorization': f'Bearer {paystack_secret}',
            'Content-Type': 'application/json',
        },
        json=payload,
        timeout=30,
    )
    result = response.json()

    if result.get('status') and result['data']['status'] == 'success':
        from .models import Transaction
        txn = Transaction.objects.create(
            booking=recurring_payment.booking,
            student=recurring_payment.student,
            transaction_reference=payload['reference'],
            transaction_type='rent',
            amount=amount,
            status='success',
            paid_at=timezone.now(),
            paystack_reference=result['data'].get('reference'),
            metadata=result['data'],
        )
        return {'status': 'success', 'transaction_id': txn.id, 'amount': float(amount)}
    else:
        return {
            'status': 'failed',
            'message': result.get('message', 'Paystack charge failed'),
            'gateway_response': result['data'].get('gateway_response', '') if result.get('data') else '',
        }
```

**Before implementing:** Check the `SavedPaymentMethod` model to confirm the `authorization_code` field name. Also confirm `SavedPaymentMethod` is accessible via `recurring_payment.saved_payment_method`.

### Anti-Patterns to Avoid

- **Using a local variable named `transaction` in any view that imports `from django.db import transaction`:** Always use `txn`, `payment_obj`, or `payment_record` for ORM query results in the payments module.
- **Returning HTTP 4xx or 5xx from M-Pesa webhook endpoints:** Safaricom will retry. Always return 200 from STK push and C2B handlers.
- **Checking `transaction_obj.status` without a row lock:** Must always be inside `select_for_update()` when concurrent requests are possible.
- **Importing `random` in any payment-related task or view:** This is a code smell that signals test scaffolding left in production code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Row-level concurrency lock | Custom flag/semaphore | `Transaction.objects.select_for_update()` | Django ORM provides database-level pessimistic locking; custom solutions have their own race windows |
| HMAC signature verification | Custom byte comparison | `hmac.compare_digest()` (already used) | Timing-safe comparison; already correct at line 1081 |
| Paystack charge API | Custom HTTP client wrapper | `requests.post()` to Paystack endpoint with Bearer token | Pattern already established in codebase; Paystack has no official Python SDK requirement |
| DRF pagination | Manual slicing | `PageNumberPagination` (DRF built-in) | Already in DRF dependency; handles page/page_size query params |
| Django Q objects | Chained `.filter()` calls with OR | `from django.db import models; models.Q()` | Single import fixes the NameError; Q is the standard Django filter composition tool |

**Key insight:** Every tool needed to fix these eight bugs is already imported or importable from the project's existing dependencies. No new packages, no new patterns. The fixes are all about using existing Django/DRF primitives correctly.

---

## Common Pitfalls

### Pitfall 1: Re-introducing the variable shadowing bug during PAY-01 fix

**What goes wrong:** Developer renames `transaction` to `txn` in the query line but leaves downstream references to `transaction.status`, `transaction.save()` etc. — these now reference the module, not the object.
**Why it happens:** The rename must be global within the `_handle_charge_success` function scope.
**How to avoid:** After renaming, search for all occurrences of the bare word `transaction` within the function and ensure they are either `transaction.atomic()` (module call, correct) or renamed to `txn.` (object access).
**Warning signs:** `AttributeError: module 'django.db.transaction' has no attribute 'status'`

### Pitfall 2: select_for_update() used outside an atomic() block

**What goes wrong:** `select_for_update()` without being inside `transaction.atomic()` raises `TransactionManagementError` on some databases and has undefined behavior on others.
**How to avoid:** Always pair `select_for_update()` with `with transaction.atomic():` wrapping it.
**Warning signs:** `django.db.transaction.TransactionManagementError: An error occurred in the current transaction`

### Pitfall 3: Changing MPESA_CALLBACK_URL default without updating MpesaDarajaAPI.__init__

**What goes wrong:** `mpesa_api.py` line 66 reads `self.callback_url = getattr(settings, 'MPESA_CALLBACK_URL', '')`. The fix to settings.py is sufficient — `MpesaDarajaAPI.__init__` reads from settings at instantiation time, so changing the settings default is the only required change. Don't add a duplicate `BACKEND_API_URL` read inside `mpesa_api.py` as well.
**How to avoid:** Change only `settings.py` lines 262-265. Verify by checking `mpesa_api.py` line 66-68.

### Pitfall 4: Paystack charge_authorization uses wrong amount unit

**What goes wrong:** Paystack API expects amount in the smallest currency unit (kobo for NGN, cents for USD). For Kenya shillings, confirm whether Paystack uses 100 subunits or 1. All existing Paystack code in views.py at line 1127 divides `fees` by 100, suggesting kobo/cents unit. Use `int(amount * 100)` consistently.
**How to avoid:** Check the existing `PaymentInitializeView.post()` to see how amount is sent to Paystack — match that pattern exactly.

### Pitfall 5: UnmatchedPaymentRejectView — wrong status string for Transaction.status

**What goes wrong:** Writing `transaction.status = 'rejected'` fails if `'rejected'` is not in `Transaction.STATUS_CHOICES`. The existing choices visible in usage patterns are `'pending'`, `'success'`, `'failed'`, `'processing'`. `'rejected'` may not exist.
**How to avoid:** Read `payments/models.py` Transaction model `STATUS_CHOICES` before writing the fix. If `'rejected'` is not a valid choice, use the closest valid status (likely `'failed'` with a `notes` field capturing the rejection reason).
**Warning signs:** Django model validation error, or silently saving an invalid choice if the field uses `CharField` without `choices` enforcement.

### Pitfall 6: PaymentLedgerView pagination — response shape must match frontend expectation

**What goes wrong:** Adding DRF `PageNumberPagination` changes the response from `{'data': [...]}` to DRF's standard `{'count': N, 'next': '...', 'previous': '...', 'results': [...]}`. If the frontend expects `{'data': [...]}`, the change breaks the frontend contract.
**How to avoid:** Check what shape the frontend component expects from `PaymentLedgerView`. The current stub returns `{'data': data}`. Either preserve that wrapper in a custom paginator, or confirm the frontend handles DRF's standard paginated format.

---

## Code Examples

Verified patterns from codebase inspection:

### Existing correct HMAC pattern (PAY-05 — already correct, preserve it)
```python
# Source: Backend/payments/views.py lines 1076-1082
body = request.body  # raw bytes — correct
computed_signature = hmac.new(paystack_secret, body, hashlib.sha512).hexdigest()
if not hmac.compare_digest(computed_signature, signature):
    return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
```
PAY-05 is NOT broken — the raw bytes read is correct. The risk is a future middleware decode. The only real fix needed is ensuring the outer `except` at line 1100 does not return HTTP 500 (which would also affect Paystack's retry logic). Change that `except` to return HTTP 200 with an error logged.

### Correct select_for_update pattern (already used in C2B handler — replicate for STK)
```python
# Pattern from Django docs / existing codebase usage
with transaction.atomic():
    obj = MyModel.objects.select_for_update().get(pk=pk)
    if obj.status == 'already_done':
        return early
    obj.status = 'new_status'
    obj.save()
```

### DRF PageNumberPagination (standard usage)
```python
# Source: DRF built-in
from rest_framework.pagination import PageNumberPagination

paginator = PageNumberPagination()
paginator.page_size = 50
page = paginator.paginate_queryset(queryset, request)
return paginator.get_paginated_response(serializer_class(page, many=True).data)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paystack Charge API (mock) | Real Paystack `/transaction/charge_authorization` | Must be done in Phase 1 | 25% of recurring payments currently fail randomly |
| FRONTEND_URL for webhooks | Dedicated BACKEND_API_URL | Must be done in Phase 1 | All M-Pesa STK payments currently stuck `pending` in prod |
| Bare status check | select_for_update() + atomic() | Must be done in Phase 1 | Double-processing risk on any M-Pesa retry |

**Deprecated/outdated in this codebase:**
- `random.choice()` in tasks.py: was development scaffolding, never removed. Replace with real API call.
- `stubs_views.py` stub implementations for PAY-06 and PAY-07: these stubs are live in production URL config. Phase 1 fixes PAY-06 and PAY-07 in-place in `stubs_views.py` (no promotion yet — that is Phase 3).

---

## Key Files and Line References

| File | Bug | Lines |
|------|-----|-------|
| `Backend/payments/views.py` | PAY-01: variable shadowing in `_handle_charge_success` | 9 (import), 1105-1203 (function) |
| `Backend/payments/views.py` | PAY-05: outer `except` returns HTTP 500 | 1100-1102 |
| `Backend/rumi/settings.py` | PAY-02: webhook URLs built from FRONTEND_URL | 262-265 |
| `Backend/payments/mpesa_webhooks.py` | PAY-03: missing `select_for_update()` | 218 (status check), 212-264 (full method) |
| `Backend/payments/mpesa_webhooks.py` | PAY-04: HTTP 500 on exception | 170-176 |
| `Backend/payments/stubs_views.py` | PAY-06: no DB write in reject | 61-69 |
| `Backend/payments/stubs_views.py` | PAY-07: `models` not imported, `models.Q` NameError | 1 (imports), 128-157 (view) |
| `Backend/payments/tasks.py` | PAY-08: `random.choice()` mock in prod task | 109-151 |

---

## Files That Must Be Read Before Fixing

Before implementing each fix, inspect these files:

| Fix | Read Before Implementing |
|-----|--------------------------|
| PAY-06 | `Backend/payments/models.py` — confirm `Transaction.STATUS_CHOICES` includes 'rejected', or find the correct status string |
| PAY-08 | `Backend/payments/models.py` — confirm `SavedPaymentMethod.authorization_code` field name; also read `PaymentInitializeView.post()` to match Paystack amount unit (kobo vs KES) |
| PAY-07 | Any frontend component calling `/api/v1/payments/ledger/` — confirm expected response shape for pagination |

---

## Open Questions

1. **Does `Transaction.STATUS_CHOICES` include 'rejected'?**
   - What we know: Statuses seen in codebase are `pending`, `processing`, `success`, `failed`
   - What's unclear: Whether `rejected` is a valid choice — if not, PAY-06 fix must use `failed` + a notes field
   - Recommendation: Read `payments/models.py` Transaction model definition as first step of PAY-06 task

2. **Does `SavedPaymentMethod` have `authorization_code`?**
   - What we know: Paystack recurring charges require an authorization code from a prior transaction
   - What's unclear: The exact field name on the `SavedPaymentMethod` model
   - Recommendation: Read `payments/models.py` SavedPaymentMethod model as first step of PAY-08 task

3. **What response shape does the frontend PaymentLedger component expect?**
   - What we know: Current stub returns `{'data': [...]}`; DRF pagination returns `{'count', 'next', 'previous', 'results'}`
   - What's unclear: Whether the frontend handles DRF's standard paginated format
   - Recommendation: Check `frontend/src/` for the PaymentLedger component before finalizing PAY-07 pagination shape

4. **PAY-05 HMAC: Is there any middleware that decodes `request.body`?**
   - What we know: `body = request.body` at line 1076 is correct; `request.body` is always raw bytes in Django
   - What's unclear: Whether any custom middleware in `rumi/middleware.py` or DRF parser behavior could cause interference
   - Recommendation: The fix for PAY-05 should add a comment asserting the raw bytes assumption AND fix the outer `except` HTTP 500 (which is the real reliability gap)

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `Backend/payments/views.py` — confirmed variable shadowing bug at `_handle_charge_success` (lines 1105-1203), HMAC signature code correct (lines 1060-1102)
- Direct inspection: `Backend/payments/mpesa_webhooks.py` — confirmed missing `select_for_update()` (line 218), HTTP 500 on exception (line 176)
- Direct inspection: `Backend/rumi/settings.py` — confirmed `MPESA_CALLBACK_URL` defaults to `FRONTEND_URL` (lines 262-265)
- Direct inspection: `Backend/payments/stubs_views.py` — confirmed `UnmatchedPaymentRejectView` has no DB write (lines 61-69), `models.Q` NameError (line 139)
- Direct inspection: `Backend/payments/tasks.py` — confirmed `random.choice()` in production task (lines 116-117)
- Direct inspection: `.planning/research/PITFALLS.md` — corroborates all eight bugs with root cause analysis
- Direct inspection: `.planning/research/FEATURES.md` — corroborates bugs 1, 2, 3 with impact assessment
- Direct inspection: `Backend/pytest.ini` — test framework configuration confirmed (pytest-django, `rumi.test_settings`)

### Secondary (MEDIUM confidence)
- Paystack Charges API — `charge_authorization` endpoint pattern: standard Paystack recurring charge flow uses `POST /transaction/charge_authorization` with Bearer token. Pattern matches existing Paystack code in views.py.
- Safaricom M-Pesa STK push response format: standard acknowledgment is `{"ResultCode": 0, "ResultDesc": "Accepted"}` per Daraja API documentation conventions. Implementation already returns `JsonResponse` format from the success path.

### Tertiary (LOW confidence)
- Paystack amount unit for Kenya: assumed kobo (multiply KES by 100) based on existing line 1127 which divides `fees` by 100. Should be verified against `PaymentInitializeView` Paystack initialization code.

---

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH — all eight bugs confirmed by direct code inspection
- Fix patterns: HIGH — all fixes use Django/DRF primitives, no external library uncertainty
- Paystack charge API shape for PAY-08: MEDIUM — pattern matches existing codebase conventions and standard Paystack docs
- Transaction.STATUS_CHOICES for PAY-06: LOW — must read models.py before implementing

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain — Django 4.2 LTS, fixes are code corrections not library upgrades)
