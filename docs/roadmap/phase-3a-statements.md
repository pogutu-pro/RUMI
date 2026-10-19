# Phase 3a — Expenses and Landlord Statements

**Status: IMPLEMENTED on branch `feature/phase-3-statements` (local, builds on
Phase 2). Decisions made autonomously overnight — review.**

Scope is the single-landlord organization. The agency model (one agency,
many property owners, commissions, owner remittances) is **Phase 3b** and
not started.

## Expenses
- `accounting.Expense`: property (optional), category, description,
  supplier, amount, date, paid from (cash / bank / M-Pesa), reference.
- Posts Dr expense account / Cr money account. New chart accounts
  5000–5800 (repairs, landlord-paid utilities, security & cleaning,
  management fees, insurance, rates & taxes, other); `ledger.0004` adds them
  to existing organizations.
- Never deleted: **void** with a reason posts a reversing entry.

## Statements
Computed (not stored) from the journal for any period ≤ 1 year, whole
organization or one property:
- **Cash:** received by channel (cash, bank, M-Pesa paybill, Paystack) net of
  reversed payments, deposits refunded, expenses → net cash.
- **Earned (accrual):** income by account, waivers.
- **Tenant balances:** per tenancy opening → invoiced − credited − paid −
  paid from deposit + reversed → closing. Each column is the movement of
  (receivables − prepayments) by journal source, so it reconciles to the
  ledger by construction (tested against `LedgerService.balance`).
- Deposits held at period end.
- PDF via ReportLab.

## API
- `GET/POST /api/v1/accounting/expenses/`, `POST .../expenses/<id>/void/`
- `GET /api/v1/accounting/statements/?month=YYYY-MM[&property_id][&export=pdf]`
  (`export`, not `format` — DRF reserves `format`).

Owner and super_admin only.

## Frontend
Landlord → Expenses, Landlord → Statements (month + property picker, PDF).
