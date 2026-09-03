# Deferred Items — Phase 07, Plan 02

Out-of-scope discoveries logged per SCOPE BOUNDARY (only auto-fix issues
directly caused by the current task's changes).

## 1. Test environment 301-redirects every HTTP-client test request

**Found during:** Task 2 and Task 3 regression verification (`billing.test_webhooks`, `organizations.tests`).

**Issue:** In this worktree's environment, `DEBUG=False` and (per
`Backend/rumi/settings.py:349-351`) `SECURE_SSL_REDIRECT = True` is set
whenever `DEBUG` is falsy. Every `rest_framework.test.APIClient` /
Django test-client request made over plain HTTP is therefore 301-redirected
to HTTPS before it reaches the view, regardless of the view's own logic.

**Evidence it is pre-existing, not caused by this plan:**
- `billing.test_webhooks.DispatchFromPaystackWebhookTests` (5 tests) — all
  fail with `301 != 200`. These tests exercise the HTTP dispatch layer only;
  `HandleBillingEventTests` (calling `handle_billing_event()` directly, no
  HTTP layer) all pass, both before and after this plan's `log_audit()`
  additions.
- `organizations.tests` baseline run (captured *before* any Task 3 edits)
  already showed 10/11 failures, all `301 != <expected>`, for the exact
  same reason — `PayoutAccountView` tests go through `APIClient`.
- Re-running `organizations.tests` after Task 3's changes shows the same
  10/11 failures, unchanged in count or identity — zero regressions
  introduced by threading `actor=request.user` through
  `PayoutService.submit_bank_details`.

**Why not fixed here:** Changing `SECURE_SSL_REDIRECT`/`DEBUG` behavior is a
settings/environment change unrelated to HARD-03's audit-trail scope, and is
explicitly out of this plan's file list (`files_modified` in the plan
frontmatter). Fixing it risks masking or altering unrelated test behavior
this plan was never asked to touch.

**Recommendation:** A future hardening-pass task (or local test-runner
config) should either set `DEBUG=True` for the test settings module, force
`SECURE_SSL_REDIRECT = False` under `TESTING`, or have the test client pass
`secure=True` — whichever the team prefers. Until then, any `APIClient`-based
test in this codebase will show `301` instead of its expected status code
when run outside a properly configured test-settings environment.

**Adaptation made in this plan:** `Backend/audit/tests.py`'s new
`PayoutAuditTests` class calls `PayoutService.submit_bank_details()`
directly (service-layer) rather than through `APIClient`, so the new
tests added by this plan are unaffected by the redirect issue and give a
real GREEN/RED signal.
