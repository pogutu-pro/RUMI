# EazzyRent Parity — Comparison and Target Architecture

Research date: October 2026. Source for EazzyRent is their own marketing site
(https://www.eazzyrent.com/property-management-software); the product itself
was not inspected.

## The core difference

- **EazzyRent** integrates with the landlord's **own** M-Pesa paybill and bank
  accounts (Co-op, KCB, Equity, Family, NCBA, DTB, National Bank). Tenants pay
  the normal Kenyan way; each payment is posted in real time, matched to the
  tenant, and receipted by SMS + email. EazzyRent never holds the money and
  pays no transaction fees.
- **RumiaRent today** only sees rent paid through an in-app Paystack checkout,
  routed through the platform's Paystack account and split to the landlord's
  subaccount. Paybill/bank payments are invisible unless typed in manually, and
  the platform pays the Paystack fee.

Target: RumiaRent becomes a **reconciliation and accounting layer** over money
that lands directly in the landlord's accounts. Paystack remains an optional
in-app channel.

## Feature matrix

| Money operation | EazzyRent | RumiaRent (Oct 2026) | Phase |
|---|---|---|---|
| Rent invoicing | Yes, recurring | **Done (Phase 1):** monthly invoices, lease end, proration | 1 |
| Service charge / utility / repair invoicing | Yes | **Done:** recurring extras, metered water/electricity, one-off charges | 1 |
| Paybill + bank auto-reconciliation | Yes, 7+ banks | **Paybill done (Phase 2, pending Safaricom test)**; banks not yet | 2, 4 |
| Automatic SMS/email receipts | Yes | **Done:** numbered PDF receipts by SMS + email | 1 |
| Late penalties | Yes | **Done:** fixed/percent, grace, monthly, cap, per-property | 1 |
| Arrears control (reminders, demand notes, quit notices) | Yes | **Done (1, 3c):** reminders, escalations, demand notes, notices to quit, debt-recovery worklist | 1 |
| Deposits held and refunded | Yes | **Done:** held as liability, move-out settlement, refund recorded | 1 |
| Tenant credit / advance payments | Yes | **Done:** kept and auto-applied | 1 |
| Landlord statements | Yes | **Done (3a):** monthly statement per org/property, PDF | 3 |
| Landlord remittance, advances, loans | Yes | **Done (3b):** owner statements and payouts *recorded* (money not moved); advances/loans not yet | 3, 5 |
| Agent commissions | Yes | **Done (3b):** property owners, management + letting fees | 3 |
| Expenses / suppliers | Yes | **Done (3a, 3d)** | 3 |
| Trial balance / P&L / balance sheet | Yes | **Done (3d)** | 5 |
| Bulk B2B/B2C disbursements | Yes | No | 5 |
| USSD | Yes | No — **out of scope for now** | — |
| Tenant/landlord portals | Yes | Yes | — |

## Full EazzyRent feature list (re-checked 2026-10-20) and RumiaRent status

Source: https://www.eazzyrent.com/property-management-software (marketing page;
product not inspected). Build order for the remaining gaps is top to bottom.

| EazzyRent feature | RumiaRent | Branch / plan |
|---|---|---|
| Landlords → properties → units → tenants | Done (single landlord per org) | — |
| Agent package: many landlords, properties accounted separately | **Done (3b)** | feature/eazzyrent-parity |
| Commissions (management + letting fees, automatic) | **Done (3b)** | feature/eazzyrent-parity |
| Landlord advances / loans (early payout, tracking, interest) | **Done (3b)** — advances + fee/interest, auto-recovered | feature/eazzyrent-parity |
| Remittance statements (collections, expenses, advances, payable) | **Done (3b)** — emailed PDF | feature/eazzyrent-parity |
| Invoicing rent / service / utilities / repairs | Done (Phase 1) | — |
| Receipts by SMS + email in real time | Done | — |
| Late penalties, vacating tenants, deposit refunds | Done | — |
| Debt control: reminders | Done | — |
| Debt control: demand notes, quit notices, recovery task workflow | **Done (3c)** | feature/eazzyrent-parity |
| Notice to vacate (tenant-initiated) | **Done (3c)** | feature/eazzyrent-parity |
| Lease management: expiry reminders, automatic rent increments, document generation | **Done (3c)** | feature/eazzyrent-parity |
| Document management (uploads) | **Done (3c)** | feature/eazzyrent-parity |
| Accounts: chart, journal entries, suppliers, reconciliation, TB / P&L / balance sheet | **Done (3d)** — Landlord → Accounts | feature/eazzyrent-parity |
| M-Pesa paybill integration | Done (Phase 2, untested with Safaricom) | — |
| Bank integrations (7 banks, real time) | Real-time needs bank agreements (Phase 4); **CSV statement import + reconciliation done (3d)** for any bank and M-Pesa | feature/eazzyrent-parity |
| Bulk SMS / email (KES 1/SMS, toggle) | **Done:** Messages page — audience by property/arrears, personalisation, preview | feature/eazzyrent-parity |
| Marketing: vacant units listed publicly, auto-removed when let | **Done:** /rentals search + enquiries inbox; tenanted units never listed | feature/eazzyrent-parity |
| Maintenance requests | Support tickets with maintenance category exist; cost recovery via ad-hoc invoice | — |
| Tenant + landlord portals | Done (tenant, landlord); owner portal via emailed statements | — |
| Reports with charts | Dashboard collection bars, statements, trial balance / P&L / balance sheet | — |
| Payroll (salaries, NSSF/NHIF/KRA) | Gap — not planned (not core to rent collection) | — |
| KRA eTIMS e-invoicing | Gap — needs KRA OSCU/VSCU onboarding by the business | — |
| Real-time disbursements (B2B/B2C) | Out of scope — RumiaRent does not hold funds (CBK) ; remittances are *recorded* | — |
| USSD | Out of scope (owner decision) | — |
| Unlimited users and branch offices | Users yes; branches not modelled | — |
| 14-day free trial | RumiaRent: 30-day Enterprise trial | — |

## Pricing comparison

| | EazzyRent (all features, every tier) | RumiaRent |
|---|---|---|
| Landlord, 1–20 units | KES 3,000/mo | Starter KES 1,499 (2 properties, 20 units) |
| Landlord, 21–60 units | KES 3,000–5,000/mo | Pro KES 3,999 (10 properties, 60 units) |
| Landlord, 61+ units | KES 5,000/mo | Enterprise KES 9,999 (unlimited) |
| Agents, 1–300 units | KES 3,500/mo | n/a (no agent model) |
| Yearly discount | 15% | none |
| Bulk SMS | KES 1/SMS | included |

Recommendation: move to per-unit-band pricing with all features on every tier.

Update (October 2026): launch prices set against Bomahut, Blocks, RentLynk and
EazzyRent: Starter KES 1,499, Pro KES 3,999, Enterprise KES 9,999 (previously
2,999 / 7,999 / 19,999). Migration `billing/0004_launch_prices`; Paystack plan
amounts follow via `manage.py sync_paystack_plans` as the backend starts.

## Target architecture

### Reused as-is
Organizations, properties, units, tenancies, tenant profiles, audit log,
Celery, Africa's Talking SMS, Paystack adapter, webhook signature +
idempotency patterns.

### Changes
1. **Ledger core (Phase 1).** Double-entry general ledger underneath
   everything. `RentCharge` generalizes to an `Invoice` with typed lines (rent,
   service charge, water, penalty, deposit). `Payment` gains a `source`
   (paybill, bank, paystack, cash). Allocation oldest-first; remainder becomes
   tenant credit. Receipts, penalties, deposits.
2. **Collection inbox (Phase 2).** Ingest M-Pesa C2B confirmations, match by
   bill-reference/account number (e.g. unit code) to a tenancy, auto-allocate.
   Unmatched payments go to a review queue for manual assignment.
3. **Agency model (Phase 3).** An `Organization` of type agency manages many
   **property owners** (landlord clients). Commission rules per owner, monthly
   owner statements, expenses deducted before remittance.
4. **Bank IPN (Phase 4).** One bank at a time, same inbox as Phase 2, plus a
   daily statement-pull reconciliation job.
5. **Disbursements and full reports (Phase 5).** Only via the landlord's own
   bank instruction or a licensed partner — never pooled platform funds.

Each phase gets its own design doc in this folder before implementation.
