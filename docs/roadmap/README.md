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
| [eazzyrent-parity.md](eazzyrent-parity.md) | Competitor comparison, target architecture, and phased roadmap |
| [bank-integration.md](bank-integration.md) | What is required to connect to M-Pesa (Daraja C2B) and Kenyan banks |

## Current status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Critical bug fixes (C1–C5) | **Done** — commit `b2cea1f1` on branch `fix/payments-phase-0` (not pushed/merged) |
| 1 | Ledger core: general invoices, receipts, penalties, deposits, tenant credit | **Design drafted** — waiting on owner decisions D1–D7 |
| 2 | M-Pesa paybill (Daraja C2B) collection + auto-matching + unmatched queue | Not started |
| 3 | Agency → many landlords, commissions, landlord statements, expenses | Not started |
| 4 | Bank IPN integrations (bank by bank) | Not started |
| 5 | Disbursements, full accounting reports | Not started |

**Explicitly out of scope for now:** USSD.

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
