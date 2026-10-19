# Phase 0 — Critical Fixes

Findings C1–C5 from [audit-findings.md](audit-findings.md). Each fix ships with
regression tests. Update the checkboxes as work lands.

**Status: implemented (Oct 19, 2026), not yet committed.** Backend suite
239 passed (219 before + 20 regression tests). Regression tests live in
`billing/tests.py` (`SubscribeFlowTests`, `SwitchPlanTests`),
`billing/test_webhooks.py` (`PlanSwitchWebhookTests`,
`RenewalChargeWebhookTests`, `SubscriptionLapseTaskTests`) and
`rumia_api/tests.py` (`PaymentsPhase0RegressionTests`).

Pre-existing, unrelated failures (present before Phase 0): 3 tests in
`frontend/src/features/auth/hooks/__tests__/use-auth.test.tsx`, and `tsc`
errors inside `node_modules/@types/node`. Neither touches `src/` payment code.

### Extras added while fixing
- Subscription checkout `charge.success` now refuses to activate when Paystack's
  `amount` is below the expected price (billing side of H3).
- Auto-billed subscriptions also lapse, but only after
  `BILLING_AUTO_RENEWAL_BUFFER_DAYS` (default 3) past period end — a safety net
  for a missed renewal webhook.
- New settings: `BILLING_PENDING_CHECKOUT_TTL_MINUTES` (30),
  `BILLING_AUTO_RENEWAL_BUFFER_DAYS` (3). New Celery task
  `billing.tasks.disable_replaced_paystack_subscription` (retries 5× at 5-min
  intervals, then logs an error asking for manual cancellation).

### Behaviour changes to tell users about
- Landlords can no longer pick manual billing or change a manual plan
  themselves — support does it via super admin (`organization_id` in the body).
- Changing plan now redirects to Paystack; the new plan applies only after
  payment. The old plan keeps working until then.

## C1 — Free self-activation via manual billing

**Fix**
- Only `super_admin` may subscribe or switch an organization in `manual` mode.
  A landlord sending `billing_mode=manual` gets 403. A landlord on a manual
  subscription cannot switch plans themselves (403 — ask support).
- Manual subscriptions now lapse: the daily `process_grace_period_expirations`
  task moves any `active` subscription whose `current_period_end` has passed
  into `past_due` with the normal grace window, then `suspended` when grace
  ends. Super admin renews by extending the period via override after
  receiving payment.

- [x] Backend role guard (`billing/views.py`)
- [x] Lapse handling in `billing/tasks.py`
- [x] Tests

## C2 — Plan switch abandons subscription and deadlocks the org

**Fix — "pay first, then switch"**
- `switch_plan` no longer disables the old Paystack subscription up front and
  no longer touches `subscription.plan` / `status`. It creates a pending
  `SubscriptionPayment` whose `metadata` records `plan_id` (target plan) and
  the old Paystack `subscription_code` / `email_token` it replaces.
- On `charge.success` for that payment, the webhook applies the new plan,
  clears the stored Paystack subscription code, and schedules a Celery task
  (after commit) to disable the old Paystack subscription, with retries.
- Paystack's following `subscription.create` is matched to the org via the
  existing email fallback, which now also accepts an `active` subscription
  whose `paystack_subscription_code` is empty (the marker left by the step
  above).
- If the landlord abandons checkout, nothing changed — they keep their current
  plan and recurring billing.
- Pending checkouts expire after 30 minutes (`BILLING_PENDING_CHECKOUT_TTL_MINUTES`):
  a stale pending payment is marked `failed` and a new subscribe/switch is
  allowed, so a fresh subscribe can never deadlock either.
- Frontend `useSwitchPlan` redirects to `authorization_url` when present.

- [x] Service rewrite (`billing/services/subscription_service.py`)
- [x] Webhook: apply plan on success, disable old subscription task
- [x] Pending-checkout TTL
- [x] Frontend redirect
- [x] Tests

## C3 — Renewal charges ignored

**Fix**
- `charge.success` whose reference isn't one of ours but which carries a
  `plan.plan_code` is treated as a subscription renewal. Resolve the org by
  `customer.customer_code` (now stored), then by unambiguous customer email.
- Record a `SubscriptionPayment` (`internal_reference = SUB-RNW-<paystack id>`),
  extend the period by 30 days from the later of today / current period end,
  set `active`, clear grace.
- Store `paystack_customer_code` on `subscription.create` and initial
  `charge.success`.

- [x] Webhook renewal path
- [x] Customer-code capture
- [x] Tests

## C4 — Cross-org manual allocation

**Fix**
- `ManualPaymentSerializer` rejects a `rent_charge_id` that doesn't belong to
  the given tenancy, and rejects an amount above the charge's outstanding
  balance (400 instead of the current 500 — also closes H2 for this path).
- Defense in depth: `PaymentService._create_allocation` refuses a charge whose
  tenancy/organization differs from the payment's.

- [x] Serializer validation
- [x] Service guard
- [x] Tests

## C5 — Paystack callback 404 / wrong payment shown

**Fix**
- Callback URL becomes `{FRONTEND_URL}/tenant/rental/payments/callback?payment_id=<id>`.
  (Paystack appends `trxref`/`reference`.)
- Payment list ordered newest first.
- Callback page selects the payment by `payment_id` / `reference` from the
  query string instead of "first in list".

- [x] Backend callback URL + ordering
- [x] Frontend callback page
- [x] Tests

## Not in Phase 0 (deliberately)

H1–H6 and the "missing" items in the audit. H1 (tenant credit) belongs to the
Phase 1 ledger redesign.
