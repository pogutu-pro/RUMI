# Payments Audit Findings (October 2026)

Scope: tenant rent payments (`rent/`, `rumia_api/`), landlord SaaS
subscriptions (`billing/`), landlord payouts (`organizations/`), and the
matching frontend flows.

"Confirmed" = reproduced with a throwaway test against the real code, not just
read. Line numbers are as of commit `76e40ea5`.

## Critical — fixed in Phase 0 (all five, Oct 19, 2026)

See [phase-0-critical-fixes.md](phase-0-critical-fixes.md) for fix design.

| # | Finding | Where | Verified |
|---|---------|-------|----------|
| C1 | Landlord can self-activate any paid plan for free by POSTing `billing_mode: "manual"` to `/billing/subscribe/`. Manual subscriptions never expire. Manual-mode `switch-plan` is also free. | `billing/views.py:153`, `billing/services/subscription_service.py:415` | Confirmed: 201, `status=active`, 0 payments, effective plan Enterprise |
| C2 | Plan switch (auto mode) disables the live Paystack subscription and returns a checkout URL that the frontend ignores ("Plan updated" toast). Landlord never pays, loses plan, and is deadlocked: `subscribe` refuses (pending), `switch-plan` refuses (not active). Pending checkouts never expire. | `frontend/src/features/billing/hooks/use-subscription.ts:57`, `subscription_service.py:404,469` | Confirmed: both recovery calls → 400 |
| C3 | Paystack recurring renewals/dunning retries arrive as `charge.success` with Paystack-generated references, not our `SUB-…` reference → ignored. Period never extends, no ledger row, and an org that paid on retry after a failed charge is still suspended. `paystack_customer_code` is never stored. | `billing/services/webhook.py:171` | Code reading |
| C4 | Manual payment accepts any `rent_charge_id` in the DB → landlord A can mark landlord B's charge paid (cross-org write). | `rumia_api/serializers.py:164`, `rumia_api/views.py:787` | Confirmed: victim charge → `paid` |
| C5 | Paystack returns tenant to `{FRONTEND_URL}/payments/{id}/callback`, but the page is `/tenant/rental/payments/callback` → 404. The page also shows "first payment in the list", and the list is unordered. | `rumia_api/views.py:734`, `frontend/src/app/(tenant)/tenant/rental/payments/callback/page.tsx` | Confirmed by route listing |

## High — not yet fixed

| # | Finding | Where | Verified |
|---|---------|-------|----------|
| H1 | Advance payments / overpayments are taken but never credited. `_auto_allocate` only targets `due/partially_paid/overdue`; leftover is silently dropped. No tenant credit concept. Tenant UI offers "pay monthly rent" even when nothing is owed. | `rent/services/payment_service.py:306` | Confirmed: 0 allocations, next periods still owed |
| H2 | Allocation over outstanding → `IntegrityError` (CHECK `check_charge_paid_not_exceed_due`) → 500. Same risk inside the webhook. | `payment_service.py:288` | Confirmed: 500 |
| H3 | `verify_and_allocate` never checks Paystack's verified amount/currency against `payment.amount`. | `payment_service.py:215` | Confirmed: 100 settled → 22,000 recorded |
| H4 | No reconciliation for payments stuck in `processing` (lost webhook). A transient network error during verify marks the payment `failed`. | `rent/tasks.py`, `rent/providers/paystack.py:573` | Code reading |
| H5 | No handling of `refund.*` / `charge.dispute.*` webhooks. | `rumia_api/views.py:828` | Code reading |
| H6 | Billing webhook handler exceptions are swallowed → 200 → Paystack never retries. | `rumia_api/views.py:855` | Code reading |

## Business decision — needs owner's call

Rent split uses `percentage_charge=0` + `bearer='account'`: the platform pays
Paystack's ~1.5% fee on every rent payment and earns nothing from it. Example:
50 units × KES 22,000 ≈ KES 16,500/month in fees against a KES 7,999 Pro
subscription (Pro is KES 3,999 since the October 2026 launch prices). (`rent/providers/paystack.py`, `payment_service.py:148`)

## Missing / half-built

- Late fees: `late_fee_amount` and `grace_period_days` exist, nothing applies them.
- Rent generation ignores `Tenancy.end_date`.
- One rent reminder per charge ever — no overdue follow-up.
- No rent receipts (README claims ReportLab receipts).
- Deposits: just a number on `Tenancy`, never charged, held or refunded.
- `PAYSTACK_WEBHOOK_SECRET`: Paystack signs with the **secret key**; there is no separate webhook secret. `.env.mpesa.example` suggests otherwise — if followed, every webhook is rejected. Paystack vars missing from `.env.example`.

## Housekeeping

- README is stale (hostels, students, M-Pesa STK, "112 tests").
- `settings.py` holds dead pricing constants (`BASIC_PLAN_PRICE=10000`, 2% student fee) that don't match seeded plans (now 1,499 / 3,999 / 9,999, the October 2026 launch prices; originally 2,999 / 7,999 / 19,999).
- 8 receipt PDFs committed under `Backend/media/receipts/pdf/`.

## Checked and fine

- Rent webhook HMAC verification and replay/idempotency guard.
- Payout-account verification and fail-closed refusal of rent payments without an active subaccount.
- `APIResponseCacheMiddleware` does **not** leak per-user data (it looks for an `access_token` cookie while the real one is `rumi_access_token`, but DRF writes the authenticated user back onto the Django request, so responses are never stored). Tested.
