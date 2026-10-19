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
| Paybill + bank auto-reconciliation | Yes, 7+ banks | No | 2, 4 |
| Automatic SMS/email receipts | Yes | **Done:** numbered PDF receipts by SMS + email | 1 |
| Late penalties | Yes | **Done:** fixed/percent, grace, monthly, cap, per-property | 1 |
| Arrears control (reminders, demand notes, quit notices) | Yes | **Reminders + escalations done**; demand notes / quit notices not yet | 1 |
| Deposits held and refunded | Yes | **Done:** held as liability, move-out settlement, refund recorded | 1 |
| Tenant credit / advance payments | Yes | **Done:** kept and auto-applied | 1 |
| Landlord statements | Yes | No | 3 |
| Landlord remittance, advances, loans | Yes | Paystack split only | 3, 5 |
| Agent commissions | Yes | No agent model | 3 |
| Expenses / suppliers | Yes | No | 3 |
| Trial balance / P&L / balance sheet | Yes | Income summary only | 5 |
| Bulk B2B/B2C disbursements | Yes | No | 5 |
| USSD | Yes | No — **out of scope for now** | — |
| Tenant/landlord portals | Yes | Yes | — |

## Pricing comparison

| | EazzyRent (all features, every tier) | RumiaRent |
|---|---|---|
| Landlord, 1–50 units | KES 3,000/mo | Pro KES 7,999 (max 5 properties) |
| Landlord, 51–100 units | KES 5,000/mo | Enterprise KES 19,999 |
| Agents, 1–300 units | KES 3,500/mo | n/a (no agent model) |
| Yearly discount | 15% | none |
| Bulk SMS | KES 1/SMS | included |

Recommendation: move to per-unit-band pricing with all features on every tier.

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
