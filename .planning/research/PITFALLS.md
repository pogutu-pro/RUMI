# Domain Pitfalls

**Domain:** Django backend optimization — payment integrations, legacy code removal, frontend contract preservation
**Researched:** 2026-03-07
**Codebase:** RUMI (Kenyan student accommodation platform, Django 4.2 + DRF)

---

## Critical Pitfalls

### Pitfall 1: STK Push Webhook Race Condition — No select_for_update

**What goes wrong:**
`_update_transaction_from_stk_push` checks `if transaction_obj.status == 'success'` without `select_for_update()`. M-Pesa retries callbacks if it doesn't receive HTTP 200 quickly. Two concurrent deliveries can both pass the guard — resulting in double rent credit, duplicate receipts, and duplicate billing accrual.

**Prevention:**
```python
with transaction.atomic():
    transaction_obj = Transaction.objects.select_for_update().get(
        mpesa_checkout_request_id=checkout_request_id
    )
    if transaction_obj.status == 'success':
        return JsonResponse({'status': 'already_processed'}, status=200)
    # ... rest of handler
```

**Detection:** Audit log has two `payment_completed` entries for same `CheckoutRequestID`.

**Phase:** Payment flows — must fix before any payment testing.

---

### Pitfall 2: Paystack Webhook HMAC — Body Must Be Raw Bytes

**What goes wrong:**
`payments/views.py:1079` calls `hmac.new(paystack_secret, body, hashlib.sha512)`. If any middleware reads and re-encodes the request stream before the view, the HMAC digest won't match. Every Paystack webhook will be rejected silently — Paystack stops retrying, and no payment ever completes.

**Prevention:**
- Read `body = request.body` once, directly as raw bytes, before any decode.
- Write an integration test that posts a Paystack-style webhook with known payload + secret and asserts HTTP 200.

**Detection:** All Paystack webhooks show "delivered" in Paystack dashboard but RUMI transactions never update status.

**Phase:** Payment flows — fix before any Paystack webhook testing.

---

### Pitfall 3: M-Pesa Callback URLs Default to FRONTEND_URL, Not Backend API Domain

**What goes wrong:**
`settings.py` constructs all three M-Pesa callback URLs from `FRONTEND_URL` (defaulting to `https://rumia.co.ke`). The Next.js frontend does NOT handle M-Pesa POST webhooks. In production, Safaricom POSTs to the frontend server, gets HTML/404, and retries until giving up. All STK push payments stay `pending` forever.

**Prevention:**
- Define a separate `BACKEND_API_URL` environment variable for webhook base URLs.
- Never derive payment webhook URLs from `FRONTEND_URL`.
- Assert in CI that `MPESA_CALLBACK_URL` does not contain the frontend hostname.

**Detection:** Safaricom sandbox shows HTTP 200 delivery but no Django log for the webhook endpoint. All transactions stuck in `pending`.

**Phase:** Environment config — must resolve before any sandbox payment testing.

---

### Pitfall 4: Deleting admin_endpoints/ While admin_api/ Still Imports From It

**What goes wrong:**
`admin_api/platform_admin_urls.py` and `admin_api/super_admin_urls.py` both do `from admin_endpoints import views as admin_endpoints_views`. Deleting `admin_endpoints/` or removing it from `INSTALLED_APPS` causes `ImportError` at startup — taking down the entire application.

**Prevention:**
Before touching `admin_endpoints/`, run:
```bash
grep -rn "from admin_endpoints\|import admin_endpoints" Backend/
```
For each import, copy the view logic into `admin_api/views.py` and update the import. Only delete `admin_endpoints/` after zero imports remain.

**Detection:** `python manage.py check` fails immediately after deletion.

**Phase:** Legacy cleanup — import audit FIRST, deletion LAST.

---

### Pitfall 5: Stub Views Are Live in Production URL Config and Return Mock Data

**What goes wrong:**
`payments/urls.py` registers routes pointing to `stubs_views.py`. `UnmatchedPaymentRejectView.post()` returns `{'status': 'rejected'}` without updating the database. Admins clicking "reject" in the frontend silently do nothing to the Transaction record.

**Prevention:**
Replace one stub at a time — identify frontend component calling the URL, implement real logic, update URL config, verify with frontend, then delete the stub class.

**Detection:** Admin rejects a payment, gets HTTP 200, but `Transaction.objects.get(id=x).status` is still `pending`.

**Phase:** Payment flows — high priority because admin operations are silently broken today.

---

### Pitfall 6: N+1 Fixes Break When select_related Chain Doesn't Match SerializerMethodField Access

**What goes wrong:**
`SerializerMethodField` has no awareness of the queryset's `prefetch_related` cache. Method fields executing `instance.amenities.all()` will still issue new queries even after adding `prefetch_related('amenities')` to the queryset if the method doesn't access the prefetch cache correctly.

**Prevention:**
- Use `assertNumQueries` in tests to confirm query count actually drops.
- Diff `serializer.data` output before and after to confirm response shapes are identical.

**Detection:** Django Debug Toolbar shows same high query count after adding `select_related`.

**Phase:** Performance optimization — every queryset change is a potential breaking change.

---

### Pitfall 7: Enabling AWS S3 Storage Without Syncing Existing Local Media First

**What goes wrong:**
PDF receipts already exist on local disk (`Backend/media/receipts/pdf/*.pdf`). Switching `DEFAULT_FILE_STORAGE` to S3 without migrating those files causes all existing receipt URLs to return 404.

**Prevention:**
1. `aws s3 sync Backend/media/ s3://bucket-name/media/` first
2. Enable S3 in staging, verify all existing receipt URLs resolve from S3
3. Only then flip `DEFAULT_FILE_STORAGE` in production

**Phase:** Infrastructure / S3 migration — sync first, switch second.

---

### Pitfall 8: WebSocket JWT Auth Does Not Handle Token Expiry Mid-Connection

**What goes wrong:**
`accounts/consumers.py` validates the JWT only at WebSocket handshake time. If the access token expires while the connection is open, the consumer continues with a stale user object — or users with recently expired tokens can't connect without a page reload.

**Prevention:**
Document `ACCESS_TOKEN_LIFETIME`. Implement frontend reconnect-on-token-refresh logic.

**Detection:** WebSocket connection drops ~15 minutes after page load (matching JWT TTL).

**Phase:** WebSocket / real-time — address before production launch.

---

### Pitfall 9: Celery Recurring Payment Task Uses a Random Mock — Will Fail Real Users

**What goes wrong:**
`payments/tasks.py` `charge_saved_payment_method()` uses `random.choice([True, True, True, False])` to simulate 75% success. This is live Celery task code. In production, 25% of recurring payments will randomly fail with "Insufficient funds", and after 3 failures the recurring payment is permanently disabled.

**Prevention:**
Grep all Celery tasks for `random` before enabling beat schedules. Block `process_recurring_payments` from running until the mock is replaced with a real Paystack charge API call.

**Detection:** Task result logs show intermittent "Insufficient funds" with no pattern matching real bank balances.

**Phase:** Celery / recurring payments — blocked until real implementation replaces the mock.

---

### Pitfall 10: Changing Any Serializer Field Name or Shape Breaks the Next.js Frontend

**What goes wrong:**
Fields like `slug` (`source='id'` — documented fallback in `hostels/serializers.py`), `landlord_info`, `amenities_list` are stable contracts consumed by Next.js components. Changing `slug` format breaks frontend routes. Any field rename causes `undefined` errors.

**Prevention:**
Before changing any field in a public serializer, `grep -r "fieldname" frontend/src/`. If found, the value contract must be preserved exactly — even if the underlying data source changes.

**Detection:** Browser console: `Cannot read properties of undefined`. Frontend shows blank data despite correct HTTP status codes.

**Phase:** Every phase touching serializers — non-negotiable constraint.

---

### Pitfall 11: C2B and STK Webhook Exceptions Return HTTP 500 — Safaricom Retries Indefinitely

**What goes wrong:**
The outer `except` in the M-Pesa webhook handler returns `status=500`. Safaricom treats non-2xx as delivery failure and retries. If a bug causes an exception, Safaricom floods with retries — and combined with Pitfall 1 (no `select_for_update`), a retry after a transient error could double-process.

**Prevention:**
M-Pesa webhook endpoints must always return HTTP 200. Log the internal error, enqueue for manual review, return a valid M-Pesa response body regardless.

**Phase:** Payment flow implementation — fix the outer exception handler before live testing.

---

### Pitfall 12: Both admin_api/ and admin_endpoints/ URL Prefixes Registered Simultaneously

**What goes wrong:**
Both `/api/v1/admin/` and `/api/v1/admin-endpoints/` are registered. After consolidation, if a fix is applied only to `admin_api/`, callers using `/admin-endpoints/` still hit old code. Removing `/admin-endpoints/` from URL config without checking frontend causes 404s.

**Prevention:**
Grep `frontend/src/` for `admin-endpoints` before removing the URL prefix.

**Phase:** Legacy cleanup.

---

## Minor Pitfalls

### Pitfall 13: boto3==1.29.7 Is Severely Outdated
Two+ years of patches missing. Upgrade before S3 migration.

### Pitfall 14: Celery Notification Hardcodes Admin User ID as 1
`payments/tasks.py` uses `recipient_id=1`. Replace with `User.objects.filter(is_superuser=True).first().id`.

### Pitfall 15: 26 Un-squashed Migrations in hostels/ Slow Startup
Squash after schema stabilizes — not during active optimization work.

---

## Phase-Specific Warning Table

| Phase Topic | Pitfall | Mitigation |
|-------------|---------|------------|
| M-Pesa STK webhook | Race condition (#1) | `select_for_update()` before idempotency check |
| Paystack webhook wiring | HMAC body encoding (#2) | Verify `request.body` is raw bytes; write integration test |
| M-Pesa environment setup | Callback URLs wrong (#3) | Separate `BACKEND_API_URL` env var; test in sandbox |
| admin_endpoints/ removal | ImportError at startup (#4) | Audit all imports first; zero imports before deletion |
| Stub view replacement | Stubs live in prod (#5) | Replace one stub at a time; verify frontend after each |
| Hostel N+1 query fixes | Response shape changes (#6 + #10) | `assertNumQueries` in tests; diff serializer output |
| AWS S3 migration | Existing file URLs break (#7) | Sync local media to S3 before switching storage backend |
| WebSocket auth | Token expiry mid-session (#8) | Document TTL; implement frontend reconnect strategy |
| Celery recurring payments | Mock runs in prod (#9) | Block enabling until real Paystack charge replaces mock |
| C2B webhook error handling | HTTP 500 triggers retries (#11) | Always return HTTP 200 from webhook endpoints |
| Admin URL consolidation | Frontend 404s on prefix removal (#12) | Grep frontend before removing any URL prefix |

---
*Research completed: 2026-03-07*
