# RumiaRent — Money Operations Roadmap

Start here. This folder is the single source of truth for the payments audit
and the plan to bring RumiaRent's money operations to parity with EazzyRent.
Written so a new contributor (or a new chat session) can pick up without any
prior context.

> Docs in `Backend/docs/` and `frontend/docs/` describe the **legacy hostel
> product** (M-Pesa STK, students, bookings). They are not current. Ignore them
> for anything money-related.

## Files

| File | What it is |
|------|------------|
| [audit-findings.md](audit-findings.md) | Every payment/billing defect found in the Oct 2026 audit, ranked, with file references and how each was verified |
| [phase-0-critical-fixes.md](phase-0-critical-fixes.md) | The 5 critical bugs being fixed first — design of each fix and status checklist |
| [phase-1-ledger-design.md](phase-1-ledger-design.md) | Phase 1 design (invoices, double-entry journal, tenant credit, receipts, penalties, deposits, reminders) — **draft, needs decisions D1–D7** |
| [to-finish.md](to-finish.md) | **Start here:** what the owner still has to get (M-Pesa, banks, Paystack, SMS, decisions) to finish the product |
| [eazzyrent-parity.md](eazzyrent-parity.md) | Competitor comparison, target architecture, and phased roadmap |
| [bank-integration.md](bank-integration.md) | What is required to connect to M-Pesa (Daraja C2B) and Kenyan banks |
| [phase-2-paybill-design.md](phase-2-paybill-design.md) | Phase 2: M-Pesa paybill collection |
| [phase-3a-statements.md](phase-3a-statements.md) | Phase 3a: expenses and landlord statements |

## Current status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Critical bug fixes (C1–C5) | **Done** — commit `b2cea1f1` on branch `fix/payments-phase-0` (not pushed/merged) |
| 1 | Ledger core: general invoices, receipts, penalties, deposits, tenant credit, utilities | **Implemented** on branch `feature/phase-1-ledger` (local, not pushed) using the *recommended* D1–D7 — owner to confirm |
| 2 | M-Pesa paybill (Daraja C2B) collection + auto-matching + unmatched queue | **Implemented** on branch `feature/phase-2-paybill` (local) — not yet tested against Safaricom |
| 3a | Expenses + landlord statements (single landlord) | **Implemented** on branch `feature/phase-3-statements` (local) |
| 3b | Agency → many property owners, commissions, owner statements + recorded payouts | **Implemented** on `feature/eazzyrent-parity` (local) — see phase-3b-agency.md |
| 3c | Lease documents, notices, debt recovery, rent reviews, lease-expiry reminders | **Implemented** on `feature/eazzyrent-parity` (local) — see phase-3c-leasing.md |
| 3d | Trial balance, P&L, balance sheet, manual journals, suppliers, CSV statement reconciliation | **Implemented** on `feature/eazzyrent-parity` (local) |
| 3e | Bulk SMS/email, public vacancy listings + enquiries, attention API, dashboard/navigation redesign | **Implemented** on `feature/eazzyrent-parity` (local) |
| 4 | Bank IPN integrations (bank by bank) | Not started |
| 5 | Disbursements (via landlord's bank/licensed partner only) | Not started — reports done in 3d |

**Explicitly out of scope for now:** USSD.

## Owner checklist (next working session)

Nothing has been pushed, merged or deployed — the push was blocked pending
the owner's explicit OK. Branches (each builds on the previous):

1. `fix/payments-phase-0` — critical fixes C1–C5.
2. `feature/phase-1-ledger` — Phase 1 backend + frontend, PostgreSQL fixes.
3. `feature/phase-2-paybill` — M-Pesa paybill collection + stale auth test fix.
4. `feature/phase-3-statements` — expenses and landlord statements.
5. `feature/eazzyrent-parity` — agency, leasing, accounting reports, bulk
   messaging, listings, attention API and the UX redesign (Phases 3b–3e).

The top branch contains everything below it, so one PR is enough.

To ship:

```bash
git push -u origin fix/payments-phase-0 feature/phase-1-ledger feature/phase-2-paybill feature/phase-3-statements feature/eazzyrent-parity
gh pr create --base main --head feature/eazzyrent-parity   # contains every phase below it
# after CI is green (CI now really runs on PostgreSQL):
gh pr merge --merge          # a push to main auto-deploys via webhook/
# Migrations run automatically (Backend/entrypoint.sh). Then, on the server:
cd /opt/rumi
docker compose -f docker-compose.prod.yml exec backend python manage.py ledger_backfill
docker compose -f docker-compose.prod.yml exec backend python manage.py ledger_backfill --check  # "reconciles"
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_subscription_plans  # links plans to Paystack once keys are set
```

Celery beat uses django-celery-beat's DatabaseScheduler, which imports the new
entries from `CELERY_BEAT_SCHEDULE` on start — no manual schedule setup.

Also needed:
- Confirm (or change) Phase 1 decisions D1–D7 — see phase-1-ledger-design.md §10.
- Paystack **test** keys in `Backend/.env` (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`,
  `PAYSTACK_ENV=test`). `PAYSTACK_WEBHOOK_SECRET` is no longer required.
- Africa's Talking sandbox keys (receipts, reminders).
- Phase 2: `FIELD_ENCRYPTION_KEY` (Fernet key) in production `.env`; optionally
  `MPESA_CALLBACK_ALLOWED_IPS` (Safaricom's callback IPs). Then connect a paybill
  in the app (Daraja consumer key/secret) → "Register with Safaricom" → send a
  KES 10 test payment. Demo without Safaricom: `manage.py paybill_simulate`.
- Celery beat must run: new schedules — penalties 01:15, payment reconciliation every 15 min.
- Local dev only: `frontend/node_modules/@types/node` is corrupted (missing
  semicolons vs the published package) so `next build`'s type-check fails
  locally. Fix with `cd frontend && rm -rf node_modules && pnpm install`.
  Docker builds install fresh and are unaffected.
- Local dev only: `Backend/db.sqlite3` has an inconsistent migration history
  (`rent.0001` applied before `organizations.0001`); recreate it or use PostgreSQL.

## Ground rules decided so far

1. **RumiaRent should not hold tenant money.** Rent goes directly into the
   landlord's own paybill/bank account; RumiaRent records and reconciles it.
   Holding and paying out funds raises CBK payment-service licensing questions.
2. **Paystack stays**, but as an optional in-app card/online channel, not the
   primary collection route.
3. Fix Phase 0 before building anything new.

## Codebase map (money-related)

| Area | Path |
|------|------|
| Rent ledger models (`RentCharge`, `Payment`, `PaymentAllocation`) | `Backend/rent/models.py` |
| Payment orchestration | `Backend/rent/services/payment_service.py` |
| Paystack adapter (rent + payout subaccounts) | `Backend/rent/providers/paystack.py` |
| Monthly charge generation | `Backend/rent/services/rent_generation.py` |
| Rent API + Paystack webhook (single URL for rent and billing) | `Backend/rumia_api/views.py` |
| Landlord SaaS subscriptions | `Backend/billing/` (`services/subscription_service.py`, `services/webhook.py`, `tasks.py`) |
| Landlord payout account / Paystack subaccount | `Backend/organizations/services/payout_service.py` |
| Celery beat schedule | `Backend/rumi/settings.py` (`CELERY_BEAT_SCHEDULE`) |
| Tenant pay flow UI | `frontend/src/app/(tenant)/tenant/rental/` |
| Landlord billing UI | `frontend/src/app/(landlord)/landlord/rental/billing/page.tsx`, `frontend/src/features/billing/` |

## Running backend tests

```bash
cd Backend
PYTHONPATH=. venv/bin/python3 -m pytest -c pytest.ini -q
```

Note: `rumi/test_settings.py` strips `APIResponseCacheMiddleware` and
`RateLimitMiddleware`, so tests don't exercise them.
