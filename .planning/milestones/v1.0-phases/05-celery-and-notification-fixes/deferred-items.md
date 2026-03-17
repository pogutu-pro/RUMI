# Deferred Items — Phase 05 celery-and-notification-fixes

## Out-of-scope discoveries during 05-02

### Pre-existing test failure: test_monthly_invoice_generation
- **File:** Backend/payments/tests/test_subscription_engine.py:94
- **Issue:** `assert invoice.total_bed_days == 30` fails with `28 == 30`
- **Root cause:** Hardcoded `== 30` assertion; date-dependent (passes in 30-day months, fails in 28-day months like February)
- **Confirmed pre-existing:** Verified by stash + re-run — failure exists before any 05-02 changes
- **Action required:** Fix hardcoded assertion to use `calendar.monthrange()` or relative date arithmetic
- **Scope:** Not caused by 05-02 changes — out of scope
