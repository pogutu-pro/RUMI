---
plan: 03-05
phase: 03-payment-stub-promotion
status: complete
completed: 2026-03-16
requirements: PAY-13, PAY-14
---

# 03-05 Summary: PaymentLedgerExportView (real CSV) + Delete stubs_views.py

## What was done
- Added `TestPaymentLedgerExportView` (5 tests) to `payments/tests_v2.py` — confirmed RED against stub
- Added `import csv` and `from django.http import HttpResponse` to `payments/views.py`
- Implemented real `PaymentLedgerExportView` streaming UTF-8 CSV with BOM
- Updated `urls.py`: `ledger/export/` now references `views.PaymentLedgerExportView`
- Removed `stubs_views` from `urls.py` import line
- Deleted `payments/stubs_views.py` via `git rm`

## Result
5/5 export tests GREEN. 37/37 non-subscription payments tests pass.
`stubs_views.py` does not exist. `manage.py check` clean.