---
phase: 8
name: Test Coverage
status: context-ready
---

# Phase 8 Context: Test Coverage

## Deployment Context

- VPS-hosted Django app
- pytest configured at `Backend/pytest.ini`
- Factories available: `RoomFactory`, `StudentProfileFactory`, `BookingFactory` in `hostels/tests/`

## Decision: M-Pesa Mock Depth (TEST-01)

- Mock at **service-method level** using `unittest.mock.patch` on `mpesa_api.initiate_stk_push`
- Do NOT mock at HTTP level (`responses` library) — service layer is the right seam for this codebase
- Callback endpoint must be hit via `APIClient.post()` to the actual callback URL — tests the full Django request/response path
- Test file: extend `Backend/payments/tests_comprehensive.py` (already established in Phase 7)

## Decision: Receipt Assertion Scope (TEST-01)

- Assert **DB receipt record created** (`PaymentReceipt.objects.filter(transaction=txn).exists()`)
- Assert receipt has a `pdf_file` field that is non-empty
- Do NOT assert email sent (email is a side-effect requiring extra mock setup — out of scope)
- Do NOT assert PDF file content — just that the file field is populated

## Decision: Paystack Secret in Tests (TEST-02)

- Use `@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')` on the test class
- Compute HMAC signature in the test using the same `test_secret_key` to sign the payload
- This is self-contained — no `.env` dependency in CI

## Decision: Existing File Strategy (TEST-03 and TEST-04)

- **TEST-03** (`assertNumQueries`): `Backend/hostels/tests/test_query_optimization.py` already has RED stubs — **extend that file**, update expected query counts to passing values
- **TEST-04** (booking lifecycle): `Backend/hostels/tests/test_booking_lifecycle.py` already exists — **extend that file** with the missing state transitions (approved → check-in → check-out)
- Do not create replacement files — preserve existing test history

## Code Context

| File | Notes |
|------|-------|
| `Backend/payments/views.py:1077` | `paystack_webhook` function view — target for TEST-02 |
| `Backend/payments/views.py:2163` | `mpesa_api.initiate_stk_push` call — mock seam for TEST-01 |
| `Backend/hostels/tests/test_booking_lifecycle.py` | Existing — partial TEST-04 coverage, needs approval/check-in/check-out transitions |
| `Backend/hostels/tests/test_query_optimization.py` | Existing RED stubs — needs green-phase query count updates for TEST-03 |
| `Backend/payments/tests_comprehensive.py` | Home for new M-Pesa + Paystack tests (TEST-01, TEST-02) |
| `Backend/hostels/tests/factories.py` | `RoomFactory`, `StudentProfileFactory`, `BookingFactory` — use these |

## Deferred Ideas

- E2E tests against live M-Pesa sandbox: not in scope — mock-based tests are sufficient for CI
- Load testing: separate phase/concern