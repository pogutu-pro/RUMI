# Phase 3b — Agency: property owners, commissions, remittances

**Status: IMPLEMENTED on `feature/eazzyrent-parity` (local). Autonomous decisions — review.**

Matches EazzyRent's agent package: multiple landlords, each property accounted
separately, automatic management and letting commissions, landlord advances /
loans, remittance statements.

- `agency.PropertyOwner` — contact, payout details, `management_fee_percent`
  (of rent & charges collected; penalties optional), `letting_fee_percent`
  (of one month's rent for each tenancy that starts in the period).
- `Property.owner` (nullable). Unset = the organization owns the property
  (single-landlord accounts are unaffected).
- Owner statement for a month, per property: collected (allocations to
  non-deposit invoices in the period, incl. deposit money applied to arrears),
  deposit deductions kept, expenses, management fee, letting fee → net due.
  Deposits held stay the tenant's money and are never paid to the owner.
- Ledger: approval posts Dr 3900 Owner share / Cr 2300 Due to owners (owner
  dimension). Remittances and advances post Dr 2300 / Cr money account;
  advance fees Dr 2300 / Cr 4600. Owner balance = 2300 for that owner;
  negative = advance outstanding, recovered automatically from later net due.
- Approval emails the PDF statement to the owner. Periods may not overlap.
- RumiaRent *records* payouts; it never sends money (CBK stance).

API under `/api/v1/agency/`: `owners/`, `owners/<id>/`,
`owners/<id>/statement-preview/?month=`, `owners/<id>/statements/` (POST
`{month}` approves), `owners/<id>/transactions/`, `statements/<id>/pdf/`.
Frontend: Landlord → Property owners.
