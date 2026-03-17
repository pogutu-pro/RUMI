---
phase: 07-infrastructure
plan: 03
subsystem: payments
tags: [django, s3, storage, email, receipt, fieldfile]

# Dependency graph
requires:
  - phase: 07-02
    provides: S3Boto3Storage wiring and USE_S3 flag — storage backend is now switchable
provides:
  - Storage-agnostic receipt PDF email attachment via FieldFile.open('rb')
  - Regression test ensuring .path is never called on FieldFile during email send
affects: [07-infrastructure, production-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: [FieldFile.open('rb') for storage-agnostic binary reads instead of .path]

key-files:
  created: []
  modified:
    - Backend/payments/receipt_service.py
    - Backend/payments/tests_comprehensive.py

key-decisions:
  - "Use FieldFile.open('rb') context manager for PDF attachment — works on both FileSystemStorage and S3Boto3Storage; .path raises NotImplementedError on S3 (INF-03)"
  - "Test patches django.core.mail.EmailMessage.attach directly to assert correct call signature (filename, bytes, mime) — avoids needing a real email backend"

patterns-established:
  - "Pattern: Always use FieldFile.open() + f.read() when reading file bytes from a Django FileField; never use .path in storage-agnostic code"

requirements-completed: [INF-03]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 7 Plan 03: Receipt Email Storage-Agnostic Attachment Summary

**Storage-incompatible email.attach_file(.path) replaced with FieldFile.open('rb') + email.attach(filename, bytes, mime) — prevents NotImplementedError crash on S3Boto3Storage (INF-03)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-17T14:23:00Z
- **Completed:** 2026-03-17T14:26:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `email.attach_file(receipt.pdf_file.path)` with `FieldFile.open('rb')` context manager pattern in `receipt_service.py` — fix is compatible with both FileSystemStorage (local/CI) and S3Boto3Storage (production)
- Added `TestReceiptEmailAttachment` regression test class to `tests_comprehensive.py` verifying `email.attach()` is called with `(filename, bytes, 'application/pdf')` and that `FieldFile.open()` is used (not `.path`)
- `python manage.py check` exits clean; `TestReceiptEmailAttachment` passes GREEN after fix

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing test (TDD RED)** - `47e7f903` (test)
2. **Task 2: Fix receipt_service.py (TDD GREEN)** - `f65e8509` (fix)

## Files Created/Modified

- `Backend/payments/receipt_service.py` — lines 84-88: replaced `attach_file(.path)` with `open('rb')` + `attach(filename, bytes, mime)`
- `Backend/payments/tests_comprehensive.py` — added `TestReceiptEmailAttachment` class at end of file (54 lines)

## Decisions Made

- Used `FieldFile.open('rb')` context manager — Django FieldFile API guarantees this works on both storage backends; `.path` is filesystem-only
- Test patches `django.core.mail.EmailMessage.attach` directly to validate the exact call signature; this lets the test run without a real email backend or S3 connection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing `test_monthly_invoice_generation` failure in `payments/tests/test_subscription_engine.py` (bed_days date arithmetic) is out of scope and pre-dates this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- INF-03 satisfied: receipt email attachment is storage-agnostic and safe to use with USE_S3=True
- Pre-production media sync (described in 07-02 SUMMARY) must still precede the USE_S3=True flip in production settings

---
*Phase: 07-infrastructure*
*Completed: 2026-03-17*
