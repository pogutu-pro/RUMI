# Phase 8: Test Coverage - Research

**Researched:** 2026-03-17
**Domain:** Django/pytest integration testing — payment webhooks, query count assertions, booking lifecycle
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**M-Pesa Mock Depth (TEST-01)**
- Mock at service-method level using `unittest.mock.patch` on `mpesa_api.initiate_stk_push`
- Do NOT mock at HTTP level (`responses` library) — service layer is the right seam
- Callback endpoint hit via `APIClient.post()` to the actual callback URL — tests full Django request/response path
- Test file: extend `Backend/payments/tests_comprehensive.py`

**Receipt Assertion Scope (TEST-01)**
- Assert DB receipt record created: `PaymentReceipt.objects.filter(transaction=txn).exists()`
- Assert receipt has a `pdf_file` field that is non-empty
- Do NOT assert email sent
- Do NOT assert PDF file content

**Paystack Secret in Tests (TEST-02)**
- Use `@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')` on test class
- Compute HMAC signature in test using same `test_secret_key`
- Self-contained — no `.env` dependency in CI

**Existing File Strategy (TEST-03 and TEST-04)**
- TEST-03: extend `Backend/hostels/tests/test_query_optimization.py` — update RED stubs to GREEN with passing query counts
- TEST-04: extend `Backend/hostels/tests/test_booking_lifecycle.py` — add missing state transitions
- Do not create replacement files

### Claude's Discretion

None specified — all test strategy decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- E2E tests against live M-Pesa sandbox
- Load testing
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Payment lifecycle integration test — STK push initiation → callback → Transaction status → receipt generated | M-Pesa initiation mock seam at `mpesa_api.initiate_stk_push` (views.py:2163); callback endpoint at `/api/v1/payments/webhook/mpesa/stk_push/`; Transaction lookup via `mpesa_checkout_request_id`; receipt via `ReceiptService.generate_and_send_receipt` |
| TEST-02 | Paystack HMAC webhook integration test — POST with known payload + secret, assert HTTP 200 + Transaction update | Webhook at `/api/v1/payments/webhook/paystack/`; signature header `x-paystack-signature`; HMAC uses `hmac.new(secret.encode(), body, sha512).hexdigest()`; `@override_settings` pattern available |
| TEST-03 | `assertNumQueries` tests for hostel listing endpoint confirming N+1 reduction | RED stubs already exist in `test_query_optimization.py` with documented actual query counts; GREEN counts captured in comments: hostel list=5, bed occupancy=4, booking list=2 |
| TEST-04 | Booking lifecycle tests — created → approved → checked in → checked out | Booking.STATUS_CHOICES: pending, confirmed, checked_in, inspection_pending, cancelled, completed, expired; `BookingViewSet` supports PATCH on `/api/v1/hostels/bookings/<pk>/`; `BookingFactory` available |
</phase_requirements>

---

## Summary

Phase 8 adds four integration test suites for the highest-risk behaviors in the RUMI backend: the M-Pesa STK push payment lifecycle, Paystack HMAC webhook verification, N+1 query count regression guards, and the booking state machine. All test infrastructure (pytest, factories, fixtures, test settings) already exists. The work is purely additive — new test methods appended to existing files.

The key challenge is constructing the right seam for each test. M-Pesa tests must mock `mpesa_api.initiate_stk_push` at the routing-layer object (not a module-level function), because `MpesaRoutingEngine.get_api_for_booking()` returns a live API instance. Paystack tests require computing a matching HMAC signature in the test body. Query count tests need to update pre-written stub expected values to match post-fix reality. Booking lifecycle tests need direct ORM status transitions because no dedicated approve/check-in/check-out action endpoints exist — the `BookingViewSet` uses generic PATCH.

**Primary recommendation:** Extend existing test files with targeted, narrowly-scoped integration tests that assert the specific behaviors mandated by each requirement. Do not restructure or refactor any existing test infrastructure.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pytest | detected via pytest.ini | Test runner | Configured at `Backend/pytest.ini` |
| pytest-django | installed | Django ORM + settings access in tests | `DJANGO_SETTINGS_MODULE = rumi.test_settings` |
| django.test.TestCase | Django 5.2.11 | `assertNumQueries`, transaction isolation | Required for TEST-03 |
| rest_framework.test.APIClient | DRF | Sending HTTP requests to Django views | All endpoint tests |
| unittest.mock.patch | stdlib | Mocking `mpesa_api.initiate_stk_push` | TEST-01 mock seam |
| django.test.override_settings | Django | Inject `PAYSTACK_SECRET_KEY` without `.env` | TEST-02 |
| hmac / hashlib | stdlib | Compute Paystack HMAC in test body | TEST-02 signature construction |
| factory_boy | installed | `RoomFactory`, `StudentProfileFactory`, `BookingFactory` | TEST-04 setup |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `django.core.cache.cache` | Django | `cache.clear()` before query count tests | TEST-03 — cache hits distort assertNumQueries |
| `rest_framework.test.APITestCase` | DRF | Inherits `assertNumQueries` via Django | TEST-03 — already used in stubs |
| `django.test.override_settings` | Django | Also clears cached property on PAYSTACK_SECRET_KEY | TEST-02 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `unittest.mock.patch` on service method | `responses` library (HTTP-level mock) | CONTEXT.md locks service-method mock — `responses` is explicitly rejected |
| Direct ORM status updates for booking transitions | Dedicated action endpoints | No approve/check-in/check-out action endpoints exist; PATCH on BookingViewSet is the correct path |

**Installation:** No new packages required — all dependencies already present in the venv.

---

## Architecture Patterns

### Recommended Project Structure

Test files to extend (do not create new files):

```
Backend/
├── payments/
│   └── tests_comprehensive.py         # Extend: add TEST-01 M-Pesa class + TEST-02 Paystack class
└── hostels/tests/
    ├── test_query_optimization.py     # Extend: update assertNumQueries expected_count values to GREEN
    └── test_booking_lifecycle.py      # Extend: add approved → check-in → check-out transitions
```

### Pattern 1: M-Pesa STK Push Lifecycle Test (TEST-01)

**What:** Two-phase test — mock initiation call, then POST callback payload to the webhook endpoint

**When to use:** Testing full STK push flow without hitting Safaricom APIs

**Key insight:** The mock target is `payments.routing.MpesaRoutingEngine.get_api_for_booking`. The routing engine returns an API object, so `initiate_stk_push` is a method on that returned object. Use `patch.return_value.initiate_stk_push.return_value` to mock the chained call.

**Transaction lookup in callback:** `StkPushWebhookView` → `MpesaWebhookHandler._handle_stk_push_callback` → looks up by `mpesa_checkout_request_id`. The test must create the Transaction with a matching `mpesa_checkout_request_id` before posting the callback.

**Callback URL:** `/api/v1/payments/webhook/mpesa/stk_push/`

**Callback payload structure (from mpesa_webhooks.py):**
```python
{
    "Body": {
        "stkCallback": {
            "MerchantRequestID": "test-merchant-req",
            "CheckoutRequestID": "ws_co_test123",
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "CallbackMetadata": {
                "Item": [
                    {"Name": "Amount", "Value": 5000},
                    {"Name": "MpesaReceiptNumber", "Value": "QDJ9J3W45H"},
                    {"Name": "PhoneNumber", "Value": 254712345678},
                    {"Name": "TransactionDate", "Value": 20240101120000}
                ]
            }
        }
    }
}
```

**Receipt assertion (from CONTEXT.md):**
```python
from payments.models import Receipt
assert Receipt.objects.filter(transaction=txn).exists()
receipt = Receipt.objects.get(transaction=txn)
assert receipt.pdf_file  # non-empty FileField
```

**Note:** `Receipt` model (not `PaymentReceipt`) — the model is `payments.models.Receipt` with a `OneToOneField` to `Transaction` via `related_name='receipt'`. The CONTEXT.md refers to it as `PaymentReceipt` but the actual class name is `Receipt`.

### Pattern 2: Paystack HMAC Webhook Test (TEST-02)

**What:** POST a known payload to `/api/v1/payments/webhook/paystack/` with a correctly-computed HMAC, assert HTTP 200 and Transaction status update

**The exact HMAC computation in production (views.py:1094):**
```python
computed_signature = hmac.new(paystack_secret, body, hashlib.sha512).hexdigest()
```
Where `paystack_secret = settings.PAYSTACK_SECRET_KEY.encode()`.

**Test pattern:**
```python
import json, hmac, hashlib
from django.test import override_settings

@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')
class PaystackWebhookTest(TestCase):
    def test_charge_success_updates_transaction(self):
        # Create a pending Transaction with paystack_reference matching the payload
        # ...
        payload = json.dumps({
            "event": "charge.success",
            "data": {
                "reference": txn.transaction_reference,
                "id": "paystack_id_123",
                "fees": 0,
                ...
            }
        }).encode()
        sig = hmac.new(b'test_secret_key', payload, hashlib.sha512).hexdigest()
        response = self.client.post(
            '/api/v1/payments/webhook/paystack/',
            data=payload,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=sig
        )
        self.assertEqual(response.status_code, 200)
        txn.refresh_from_db()
        self.assertEqual(txn.status, 'success')
```

**Header name in Django test client:** Use `HTTP_X_PAYSTACK_SIGNATURE` (Django converts `x-paystack-signature` header). The view reads `request.headers.get('x-paystack-signature')` which works with both.

**`txn.total_charged_amount` and `txn.landlord` are confirmed properties (not DB columns):** `total_charged_amount` returns `self.amount`; `landlord` traverses `booking.room.hostel.landlord`. The test Transaction must have a `booking` FK set with a proper room/hostel/landlord chain, otherwise `txn.landlord` returns `None` and the payout creation step crashes. Set `booking=self.booking` on the Transaction and ensure `BookingFactory` creates a room/hostel/landlord chain (it does via `RoomFactory → HostelFactory → LandlordProfileFactory`).

### Pattern 3: assertNumQueries — Update RED Stubs to GREEN (TEST-03)

**What:** The stubs in `test_query_optimization.py` already have the right structure. The GREEN expected counts are documented in comments within each stub.

**Documented GREEN counts (from file comments):**
- `HostelQueryOptimizationTest.test_no_n_plus_one`: expected_count = **5** (currently states this is the GREEN value in comments)
- `BedOccupancyQueryTest.test_no_n_plus_one`: expected_count = **4**
- `BookingQueryOptimizationTest.test_no_n_plus_one`: expected_count = **2**

**Critical prerequisite:** Call `cache.clear()` before each `assertNumQueries` block. The hostel listing endpoint has Redis caching (Phase 6) — a cache hit would return 0 DB queries and make the test trivially pass while masking real query behavior. Both `setUp` and the test method clear cache.

**Pattern:**
```python
def test_no_n_plus_one(self):
    cache.clear()
    with self.assertNumQueries(5):
        response = self.client.get("/api/v1/hostels/")
    self.assertEqual(response.status_code, 200)
```

### Pattern 4: Booking Lifecycle Transitions (TEST-04)

**What:** Extend `test_booking_lifecycle.py` with status transitions: pending → confirmed → checked_in → completed

**Booking STATUS_CHOICES (from hostels/models.py):**
- `pending` (default from BookingFactory)
- `confirmed`
- `checked_in`
- `inspection_pending`
- `cancelled`
- `completed`
- `expired`

**How to drive transitions:** No dedicated action endpoints (approve, check-in, check-out) exist on the hostel URL config. Use direct ORM saves for landlord-side transitions (confirmed), and `APIClient.patch()` on `/api/v1/hostels/bookings/<pk>/` for student-visible transitions where authentication is needed.

**Using existing factories:**
```python
from hostels.tests.factories import BookingFactory, RoomFactory, StudentProfileFactory

student = StudentProfileFactory()
room = RoomFactory(status='available', capacity=1)
booking = BookingFactory(student=student, room=room, status='pending')
# Transition to confirmed (landlord action — direct ORM is fine)
booking.status = 'confirmed'
booking.save()
booking.refresh_from_db()
self.assertEqual(booking.status, 'confirmed')
# Transition to checked_in
booking.status = 'checked_in'
booking.save()
booking.refresh_from_db()
self.assertEqual(booking.status, 'checked_in')
# Transition to completed
booking.status = 'completed'
booking.save()
booking.refresh_from_db()
self.assertEqual(booking.status, 'completed')
```

### Anti-Patterns to Avoid

- **Mocking at HTTP level for M-Pesa:** The `responses` library intercepts `requests` calls. CONTEXT.md explicitly forbids this — mock `mpesa_api.initiate_stk_push` at the service level instead.
- **Asserting email sent:** CONTEXT.md explicitly excludes email assertion from TEST-01 scope.
- **Using `PaymentReceipt` model name:** The actual model class is `Receipt` in `payments.models`. CONTEXT.md uses "PaymentReceipt" as a conceptual name — import `from payments.models import Receipt`.
- **Skipping `cache.clear()` before assertNumQueries:** The hostel list endpoint has a 5-minute Redis cache. A warm cache returns 0 DB queries, making the assertNumQueries trivially pass and worthless.
- **Creating new test files:** CONTEXT.md locks both TEST-03 and TEST-04 to extending existing files, preserving test history.
- **Asserting `response.status_code == 200` for M-Pesa callback without examining transaction state:** Always assert both the HTTP status AND the Transaction DB state.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC signature computation | Custom signature builder | stdlib `hmac` + `hashlib.sha512` | Exact same code as production view — guarantees match |
| Test user/profile creation | Inline `User.objects.create` chains | `StudentProfileFactory`, `RoomFactory`, `BookingFactory` | Factories handle required field defaults and FK chains |
| Cache isolation between tests | Manual cache key deletion | `cache.clear()` in `setUp` | Clears all keys; avoids leaking state across test methods |
| Transaction test setup | Complex ORM setup from scratch | Use `tests_comprehensive.py` fixture pattern | Booking fixture already handles all required FK relationships |

---

## Common Pitfalls

### Pitfall 1: Wrong Mock Target for M-Pesa (TEST-01)

**What goes wrong:** Patching `payments.mpesa_api.MpesaDarajaAPI.initiate_stk_push` (the class method) instead of the instance returned by `MpesaRoutingEngine.get_api_for_booking`.

**Why it happens:** `MpesaRoutingEngine.get_api_for_booking(booking)` builds and returns a `MpesaDarajaAPI` instance. The `initiate_stk_push` call is on that returned object, not on the class directly.

**How to avoid:** Patch `payments.routing.MpesaRoutingEngine.get_api_for_booking` and set `mock_get_api.return_value.initiate_stk_push.return_value = {'CheckoutRequestID': 'ws_co_test123', 'MerchantRequestID': 'test-merchant'}`. This intercepts the factory method and returns a mock API object whose `initiate_stk_push` returns a controlled dict.

**Warning signs:** The mock doesn't trigger and real M-Pesa credentials are looked up (test fails with config errors).

### Pitfall 2: Missing `mpesa_checkout_request_id` on Pre-created Transaction (TEST-01)

**What goes wrong:** The callback handler looks up `Transaction.objects.get(mpesa_checkout_request_id=checkout_request_id)`. If the test Transaction doesn't have this field set to the same value as in the callback payload, the lookup raises `DoesNotExist` and the webhook returns a 404-style JsonResponse (but still HTTP 200 due to the outer except).

**How to avoid:** Set `mpesa_checkout_request_id='ws_co_test123'` on the Transaction object created in test setup, matching the `CheckoutRequestID` in the callback payload.

### Pitfall 3: Paystack `_handle_charge_success` Requires `txn.booking` to Be Set (TEST-02)

**What goes wrong:** `total_charged_amount` is a property returning `self.amount` (safe). `landlord` is a property returning `self.booking.room.hostel.landlord` — if `txn.booking` is `None`, `landlord` returns `None`. The handler then tries `txn.landlord.paystack_subaccount`, raising `AttributeError`. The outer except catches this and returns HTTP 200 with `{'status': 'error'}` but `txn.status` stays `'success'` (set inside the atomic block before the payout step).

**How to avoid:** Create the test Transaction with `booking=self.booking` where `self.booking` was created by `BookingFactory`. The factory chain creates room → hostel → landlord automatically. The atomic block sets `txn.status = 'success'` before the payout creation, so even if payout creation crashes, the status assertion passes.

**Warning signs:** Response status is 200 but `txn.status` is still `'pending'` — indicates the `txn.status = 'success'` line was never reached (the atomic block rolled back entirely, which would mean something upstream of the status update crashed).

### Pitfall 4: assertNumQueries Flakiness from Middleware Auth Queries (TEST-03)

**What goes wrong:** The `HostelViewSet.list()` is unauthenticated (anonymous requests are cached), but other middleware, session queries, or content-type lookups can add queries. The stub comments document the expected query counts, but counts can vary slightly by Django version or middleware order.

**How to avoid:** The stubs already have `addopts = --reuse-db` which reuses the test DB. Run the test once, observe the actual count, then set `assertNumQueries` to the observed value. The comments in `test_query_optimization.py` already record the expected GREEN values — trust those unless a run shows otherwise.

### Pitfall 5: `Receipt` Model Name vs CONTEXT.md "PaymentReceipt" (TEST-01)

**What goes wrong:** Importing `PaymentReceipt` from `payments.models` raises `ImportError`.

**How to avoid:** The correct class name is `Receipt` (defined at `payments/models.py:499`). Use `from payments.models import Receipt`. The CONTEXT.md assertion `PaymentReceipt.objects.filter(transaction=txn).exists()` should be written as `Receipt.objects.filter(transaction=txn).exists()`.

### Pitfall 6: Booking Lifecycle — `checked_out` is Not a Valid Status (TEST-04)

**What goes wrong:** The phase description mentions "checked out" as a lifecycle step. The `Booking.STATUS_CHOICES` does not include `checked_out` — it has `completed` as the terminal post-occupancy status.

**How to avoid:** Use `completed` as the post-check-out status in TEST-04. The sequence is: `pending` → `confirmed` → `checked_in` → `completed`.

---

## Code Examples

### TEST-01: M-Pesa Lifecycle Test Skeleton

```python
# Source: Derived from Backend/payments/mpesa_webhooks.py and views.py analysis
import json
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from payments.models import Transaction, Receipt
from hostels.tests.factories import BookingFactory, StudentProfileFactory, RoomFactory

class MpesaStkPushLifecycleTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = StudentProfileFactory()
        self.room = RoomFactory(status='available')
        self.booking = BookingFactory(student=self.student, room=self.room, status='confirmed')

    def test_stk_push_full_lifecycle(self):
        CHECKOUT_REQUEST_ID = 'ws_co_test_123'

        # Create pending transaction with matching checkout request ID
        txn = Transaction.objects.create(
            student=self.student,
            booking=self.booking,
            transaction_reference='TXN-TEST-MPESA-001',
            mpesa_checkout_request_id=CHECKOUT_REQUEST_ID,
            amount='5000.00',
            payment_method='mpesa',
            status='pending',
        )

        # POST callback to webhook endpoint
        callback_payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "test-merchant-req",
                    "CheckoutRequestID": CHECKOUT_REQUEST_ID,
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 5000},
                            {"Name": "MpesaReceiptNumber", "Value": "QDJ9J3W45H"},
                            {"Name": "PhoneNumber", "Value": 254712345678},
                            {"Name": "TransactionDate", "Value": 20240101120000}
                        ]
                    }
                }
            }
        }

        with patch('payments.routing.MpesaRoutingEngine.get_api_for_booking') as mock_routing:
            mock_routing.return_value.process_payment_callback.return_value = {
                'receipt_number': 'QDJ9J3W45H',
                'phone_number': '254712345678',
                'amount': 5000,
            }
            response = self.client.post(
                '/api/v1/payments/webhook/mpesa/stk_push/',
                data=json.dumps(callback_payload),
                content_type='application/json'
            )

        self.assertEqual(response.status_code, 200)
        txn.refresh_from_db()
        # Transaction must not be 'pending' anymore
        self.assertNotEqual(txn.status, 'pending')
        # Receipt must exist
        self.assertTrue(Receipt.objects.filter(transaction=txn).exists())
        receipt = Receipt.objects.get(transaction=txn)
        self.assertTrue(receipt.pdf_file)
```

### TEST-02: Paystack HMAC Test Skeleton

```python
# Source: Derived from Backend/payments/views.py:1077-1119 analysis
import json, hmac, hashlib
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from payments.models import Transaction
from hostels.tests.factories import BookingFactory, StudentProfileFactory, RoomFactory

@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')
class PaystackWebhookTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = StudentProfileFactory()
        self.room = RoomFactory()
        self.booking = BookingFactory(student=self.student, room=self.room)

    def _make_signed_request(self, payload_dict):
        payload = json.dumps(payload_dict).encode()
        sig = hmac.new(b'test_secret_key', payload, hashlib.sha512).hexdigest()
        return self.client.post(
            '/api/v1/payments/webhook/paystack/',
            data=payload,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )

    def test_charge_success_returns_200_and_updates_transaction(self):
        txn = Transaction.objects.create(
            student=self.student,
            booking=self.booking,
            transaction_reference='TXN-PAY-001',
            amount='5000.00',
            payment_method='paystack',
            status='pending',
        )
        payload = {
            "event": "charge.success",
            "data": {
                "reference": txn.transaction_reference,
                "id": "paystack_id_abc",
                "fees": 0,
            }
        }
        response = self._make_signed_request(payload)
        self.assertEqual(response.status_code, 200)
        txn.refresh_from_db()
        self.assertEqual(txn.status, 'success')

    def test_invalid_signature_returns_400(self):
        payload = json.dumps({"event": "charge.success", "data": {}}).encode()
        response = self.client.post(
            '/api/v1/payments/webhook/paystack/',
            data=payload,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE='bad_signature',
        )
        self.assertEqual(response.status_code, 400)
```

### TEST-03: assertNumQueries — GREEN Update Pattern

```python
# Source: Derived from Backend/hostels/tests/test_query_optimization.py
# Only the expected_count value changes — test structure is preserved

def test_no_n_plus_one(self):
    cache.clear()
    with self.assertNumQueries(5):   # Was deliberate RED value before Phase 6 fix
        response = self.client.get("/api/v1/hostels/")
    self.assertEqual(response.status_code, 200)
```

### TEST-04: Booking Lifecycle Transitions

```python
# Source: Derived from Backend/hostels/models.py STATUS_CHOICES analysis
from hostels.tests.factories import BookingFactory, StudentProfileFactory, RoomFactory

class BookingFullLifecycleTest(TestCase):
    def setUp(self):
        self.student = StudentProfileFactory()
        self.room = RoomFactory(capacity=1, status='available')
        self.booking = BookingFactory(student=self.student, room=self.room, status='pending')

    def test_booking_approved_to_checked_in_to_completed(self):
        # pending → confirmed (landlord approves)
        self.booking.status = 'confirmed'
        self.booking.save()
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')

        # confirmed → checked_in (student moves in)
        self.booking.status = 'checked_in'
        self.booking.save()
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'checked_in')

        # checked_in → completed (booking ends)
        self.booking.status = 'completed'
        self.booking.save()
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'completed')
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `responses` library for HTTP mock | `unittest.mock.patch` at service method | CONTEXT.md decision | Cleaner seam — no dependency on HTTP transport layer |
| Separate test files per feature | Extend existing established files | CONTEXT.md decision | Preserves test history; reduces merge conflict risk |
| Unverified query counts (no assertNumQueries) | assertNumQueries with documented expected values | Phase 6 + Phase 8 | Query count regressions caught at commit time |

**Deprecated/outdated:**
- RED stub expected_count values in `test_query_optimization.py`: These are deliberately wrong (too tight) to force RED. Phase 8 replaces them with GREEN passing values.

---

## Open Questions

1. **`process_confirmed_payment` service for M-Pesa callback**
   - What we know: `_update_transaction_from_stk_push` calls `process_confirmed_payment(student, amount, reference, payment_method, metadata)`. This service function exists in `payments/services.py` and may trigger receipt generation internally.
   - What's unclear: Whether `process_confirmed_payment` calls `ReceiptService.generate_and_send_receipt` or whether only `_generate_receipt` (called after the service) does — determines where to assert receipt creation.
   - Recommendation: During 08-01 implementation, read `payments/services.py` to confirm receipt generation path. If receipt is generated inside `process_confirmed_payment`, mock the service and separately test receipt generation.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest + pytest-django |
| Config file | `Backend/pytest.ini` |
| Quick run command | `cd Backend && python -m pytest payments/tests_comprehensive.py -x -q` |
| Full suite command | `cd Backend && python -m pytest -x -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | M-Pesa STK push → callback → Transaction update → Receipt | integration | `cd Backend && python -m pytest payments/tests_comprehensive.py -k "test_stk_push" -x` | ✅ (extend) |
| TEST-02 | Paystack HMAC webhook → HTTP 200 → Transaction status=success | integration | `cd Backend && python -m pytest payments/tests_comprehensive.py -k "test_charge_success" -x` | ✅ (extend) |
| TEST-03 | assertNumQueries on hostel listing confirms N+1 eliminated | unit | `cd Backend && python -m pytest hostels/tests/test_query_optimization.py -x` | ✅ (update stubs) |
| TEST-04 | Booking pending→confirmed→checked_in→completed state assertions | integration | `cd Backend && python -m pytest hostels/tests/test_booking_lifecycle.py -x` | ✅ (extend) |

### Sampling Rate

- **Per task commit:** `cd Backend && python -m pytest <specific_test_file> -x -q`
- **Per wave merge:** `cd Backend && python -m pytest -x -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. No new test files, framework config, or fixtures need to be created. Factories are in place. pytest.ini is configured.

---

## Sources

### Primary (HIGH confidence)

- Direct source code inspection — `Backend/payments/views.py` (paystack_webhook function at line 1077; _handle_charge_success at line 1122; M-Pesa initiation at line 2163)
- Direct source code inspection — `Backend/payments/mpesa_webhooks.py` (StkPushWebhookView; _handle_stk_push_callback; _update_transaction_from_stk_push; _generate_receipt)
- Direct source code inspection — `Backend/payments/models.py` (Transaction fields; Receipt model at line 499)
- Direct source code inspection — `Backend/payments/receipt_service.py` (ReceiptService.generate_and_send_receipt)
- Direct source code inspection — `Backend/hostels/tests/test_query_optimization.py` (RED stubs with documented GREEN expected values)
- Direct source code inspection — `Backend/hostels/tests/test_booking_lifecycle.py` (existing tests to extend)
- Direct source code inspection — `Backend/hostels/tests/factories.py` (BookingFactory, StudentProfileFactory, RoomFactory)
- Direct source code inspection — `Backend/hostels/models.py` (Booking.STATUS_CHOICES)
- Direct source code inspection — `Backend/pytest.ini` (test runner config)
- Direct source code inspection — `Backend/rumi/test_settings.py` (test settings overrides)
- `.planning/phases/08-test-coverage/08-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Django documentation pattern: `@override_settings` for injecting test secrets — standard Django test pattern
- Django documentation pattern: `assertNumQueries` context manager — standard Django test pattern
- DRF documentation: `APIClient.post()` with `content_type='application/json'` — standard DRF test pattern

### Tertiary (LOW confidence)

- Confirmed: `total_charged_amount` is `@property` returning `self.amount` (payments/models.py:291); `landlord` is `@property` returning booking.room.hostel.landlord (payments/models.py:303) — HIGH confidence, resolved during research

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools detected in codebase and pytest.ini
- Architecture: HIGH — test file structure and webhook seams verified from source
- Pitfalls: HIGH — derived from direct reading of production code paths
- `total_charged_amount`/`landlord` resolution: HIGH — confirmed as @property definitions in payments/models.py

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable Django/DRF stack; test patterns do not change rapidly)
