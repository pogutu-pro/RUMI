# Phase 1 — Ledger Core: Design

**Status: DRAFT — awaiting owner sign-off on the decisions in §10.**
Nothing here is built yet. Prerequisite: Phase 0 (branch `fix/payments-phase-0`).

## 1. Goal

Turn RumiaRent's rent ledger into a real tenant-accounting core, so that
every shilling a tenant owes or pays is traceable, nothing is ever lost, and
later phases (paybill reconciliation, landlord statements, agency accounting,
financial reports) are built on top instead of beside it.

Phase 1 delivers:

1. **General invoices** — rent, service charge, utilities, penalties, deposits,
   one-off charges — with numbered, immutable invoices and credit notes.
2. **Double-entry journal** under every money event.
3. **Tenant credit** — overpayments and advance payments are kept and applied
   automatically to the next invoice (fixes audit H1).
4. **Receipts** — numbered, PDF, sent by SMS + email on every successful payment.
5. **Late penalties** — configurable per organization, waivable.
6. **Deposits** — invoiced, held as a liability, settled at move-out.
7. **Arrears reminders** — the schedule already stored in `EscalationPolicy`,
   finally enforced.
8. **Paystack hardening** — audit H2–H5.

Out of scope: paybill/bank ingestion (Phase 2), agencies/landlord statements/
expenses (Phase 3), trial balance/P&L UI (Phase 5), USSD (dropped).

## 2. Current state (what we're changing)

- `rent.RentCharge` = one monthly rent obligation per tenancy. `amount_due`,
  `late_fee_amount` (never set), derived `status`.
- `rent.Payment` + `rent.PaymentAllocation` = payment split across charges.
  **This design is right and is kept.**
- `_auto_allocate` only targets `due/partially_paid/overdue`; leftovers vanish.
- `RentChargeGenerationService` bills only `status='active'` tenancies —
  tenancies in `notice_period` silently stop being billed — and ignores
  `end_date`.
- `EscalationPolicy` has `first_reminder_days_before`,
  `second_reminder_days_before`, `due_date_reminder`, `overdue_reminder_days`
  — none are read. The task sends one reminder per charge, ever.
- `Tenancy.deposit` / `RentalUnit.deposit` are numbers only.
- `reportlab==4.0.7` is already installed.

## 3. Data model

### 3.1 Invoice (evolved from `RentCharge`)

`RentCharge` is **renamed** to `Invoice` with Django's `RenameModel` — data,
FKs and the `rent_rentcharge` table survive; the table is renamed in a later
cleanup. `PaymentAllocation.rent_charge` becomes `invoice`.

| Field | Notes |
|---|---|
| existing fields | organization, tenancy, property, unit, tenant, period_start/end, due_date, currency, notes, status, created_at |
| `invoice_type` | `rent` (monthly, may carry extra lines), `deposit`, `penalty`, `adhoc`, `credit_note` |
| `number` | Per-organization sequence, e.g. `INV-000123` / `CN-000004`. Unique (organization, number). |
| `issue_date` | Date the invoice became payable |
| `total` | Sum of lines. Replaces `amount_due`; `late_fee_amount` is dropped (penalties become their own invoices). |
| `amount_paid` | Unchanged meaning — sum of successful allocations |
| `source_invoice` | Nullable self-FK: penalty → invoice it penalizes; credit note → invoice it credits |
| `voided_at`, `void_reason` | Only for draft/never-paid mistakes; everything else uses credit notes |

**Immutability:** an issued invoice's lines never change. Corrections (waivers,
discounts, mistakes) are **credit notes**: an `Invoice` with
`invoice_type='credit_note'`, negative lines and `source_invoice` set. The
current `waived` status becomes "fully credited". `disputed` stays as a flag.

Unique constraint: `(tenancy, period_start)` becomes
`(tenancy, invoice_type, period_start)` conditional on `invoice_type='rent'`,
so one rent invoice per period stays guaranteed.

### 3.2 InvoiceLine (new)

| Field | Notes |
|---|---|
| invoice | FK |
| `line_type` | `rent`, `service_charge`, `water`, `electricity`, `garbage`, `penalty`, `deposit`, `repair`, `other` |
| description, quantity, unit_price, amount | `amount = quantity × unit_price`, 2 dp |
| `meter_reading` | Nullable FK, for metered utilities |

### 3.3 RecurringCharge (new) — fixed monthly extras

Per tenancy (optionally defaulted from the unit/property): `line_type`,
`description`, `amount`, `start_date`, `end_date`, `is_active`. The monthly
generator adds one line per active recurring charge to the rent invoice.
Covers service charge, garbage, parking, internet.

### 3.4 MeterReading (new) — metered utilities *(see decision D3)*

Per unit + utility: `reading_date`, `value`, `rate_per_unit`, `recorded_by`.
At invoice time, consumption = this period's reading − previous reading; one
`water`/`electricity` line. Caretakers enter readings (permission flag
`can_record_readings`).

### 3.5 Payment (kept) — additions

| Field | Notes |
|---|---|
| `source` | `paystack`, `cash`, `bank_transfer`, `mpesa_paybill` (Phase 2), `bank_ipn` (Phase 4), `other` |
| `unapplied_amount` | Denormalized `amount − Σ allocations`, kept in sync by the service. **This is tenant credit.** |
| `receipt` | One-to-one, created on success |

`provider` / `payment_method` stay for compatibility, derived from `source`.

### 3.6 Receipt (new)

`number` (per-organization `RCT-000123`), `payment`, `issued_at`, `pdf` file,
`sent_sms_at`, `sent_email_at`. Lists each allocation (invoice number + amount)
and any amount kept as credit.

### 3.7 Deposit handling

- On tenancy activation, a `deposit` invoice is issued for `Tenancy.deposit`
  (if > 0). Payments allocated to it credit **Deposits held**, not income.
- **DepositSettlement** (new), created at move-out: tenancy, held amount,
  deduction lines (each: description, amount, `apply_to_invoice` nullable,
  links to the move-out `PropertyConditionReport` when present), `refund_amount`,
  `refund_method`, `refund_reference`, `refunded_at`, `status`
  (`draft` → `approved` → `refunded`).
- The refund itself is **recorded** in Phase 1 (landlord pays it outside
  RumiaRent). Paying it out through the platform is Phase 5.

### 3.8 PenaltyPolicy (new)

One per organization (optionally per property override):

| Field | Notes |
|---|---|
| `enabled` | Default **off** |
| `method` | `fixed` or `percent_of_outstanding` |
| `amount` / `percent` | |
| `grace_days` | Defaults to `Tenancy.grace_period_days` when null |
| `frequency` | `once` (per invoice) or `monthly` (again each month still unpaid) |
| `cap_percent_of_rent` | Optional ceiling on total penalties per rent invoice |
| `applies_to` | Rent only by default; utilities optional |

### 3.9 ReminderLog (new) — replaces `RentCharge.reminder_sent_at`

`invoice`, `reminder_key` (`before_7`, `before_3`, `due`, `overdue_1`, …),
`channel`, `sent_at`. Unique (invoice, reminder_key, channel) → each step of
the `EscalationPolicy` schedule is sent exactly once.

### 3.10 Ledger (new app `ledger`)

Generic double-entry, reused by Phases 3 and 5.

- **Account** — per organization. Seeded chart:

  | Code | Name | Type |
  |---|---|---|
  | 1000 | Cash on hand | asset |
  | 1010 | Bank | asset |
  | 1020 | M-Pesa paybill | asset |
  | 1030 | Paystack clearing | asset |
  | 1100 | Tenant receivables | asset |
  | 2100 | Tenant deposits held | liability |
  | 2200 | Tenant prepayments (credit) | liability |
  | 4000 | Rent income | income |
  | 4010 | Service charge income | income |
  | 4020 | Utility income | income |
  | 4100 | Penalty income | income |
  | 4900 | Other income | income |
  | 5900 | Waivers & discounts | expense (contra-income) |

- **JournalEntry** — organization, date, memo, `source_type` + `source_id`
  (invoice / payment / allocation / settlement / reversal), `posted_at`,
  `reverses` (self-FK). Immutable once posted.
- **JournalLine** — entry, account, debit, credit, optional tenancy/property/
  unit dimensions for sub-ledger queries.
- **Invariant:** Σ debits = Σ credits per entry, enforced in `LedgerService.post()`
  and checked by a test that sweeps every entry. Never edit — reverse.

## 4. Posting rules (accrual basis — see D5)

| Event | Debit | Credit |
|---|---|---|
| Invoice issued | 1100 Receivables | Income account per line (4000/4010/4020/4100/4900); deposit lines → 2100 |
| Credit note | Same income/2100 account per line (or 5900 for waivers) | 1100 Receivables |
| Payment received | Channel account (1000/1010/1020/1030) | 2200 Prepayments |
| Allocation to an invoice | 2200 Prepayments | 1100 Receivables |
| Payment reversed / refunded | Mirror of the payment and its allocations | |
| Deposit deduction applied to arrears | 2100 Deposits held | 1100 Receivables |
| Deposit deduction kept for damages | 2100 Deposits held | 4900 Other income |
| Deposit refunded | 2100 Deposits held | Channel account |

Receiving money first lands in **Prepayments**, and allocation moves it to
Receivables. That makes "unapplied credit" the natural balance of 2200 for a
tenancy — no special case for overpayments or advance payments.

## 5. Behaviour

### 5.1 Monthly invoicing (replaces `RentChargeGenerationService`)
- Bill tenancies in `active` **and** `notice_period`.
- Stop at `end_date` / `move_out_date`; final period **prorated by days**
  (D6).
- Lines: rent + active recurring charges + metered utilities with a reading for
  the period.
- After issuing: post the journal, then **apply tenant credit** (oldest
  unapplied payments first) to the new invoice.
- Idempotent: unchanged guarantee of one rent invoice per tenancy per period.

### 5.2 Allocation (fixes H1, H2)
- Order: **oldest due date first**, invoices with equal due dates in the order
  deposit → rent → service/utility → penalty (D2).
- Never allocate more than an invoice's outstanding balance; the remainder
  stays on the payment as `unapplied_amount` (credit) — no 500s, no loss.
- Explicit allocation (landlord picks invoices) validated against the same caps
  and tenancy ownership (Phase 0 C4 rule kept).
- Tenant UI: "Pay" pre-fills the total outstanding; paying with nothing owed is
  allowed and shown as credit.

### 5.3 Receipts
On every payment that becomes `success` (Paystack webhook, manual entry, later
paybill/bank): create Receipt in the same transaction, then a Celery task
renders the PDF (ReportLab) and sends SMS (short: amount, receipt number,
balance) + email (PDF attached). Tenant and landlord can download any receipt.

### 5.4 Penalties
Daily task: for each overdue rent invoice past grace with outstanding > 0 under
an enabled policy, issue a `penalty` invoice linked via `source_invoice`.
Idempotent by unique (source_invoice, penalty period). Landlord/caretaker with
permission can waive → credit note. Tenant notified.

### 5.5 Reminders
Daily task reads each organization's `EscalationPolicy`: sends `before_N`, `due`
and each `overdue_N` step once per invoice via the enabled channels; logs to
ReminderLog. Existing caretaker/landlord escalation and next-of-kin steps move
onto the same log.

### 5.6 Deposits
Deposit invoice at activation → paid like any invoice → held in 2100. Move-out
flow: landlord drafts settlement (deductions, optional link to the move-out
condition report), tenant sees it, landlord approves and records the refund.

### 5.7 Paystack hardening
- **H3:** verify Paystack's amount and currency equal the payment's; mismatch →
  `disputed`, landlord alerted, no allocation.
- **H4:** a transient verify error leaves the payment `processing`; a reconciliation
  task re-verifies `processing` payments older than 15 min (backoff), and
  marks `failed` after 24 h of Paystack reporting abandoned.
- **H5:** handle `refund.processed` (reverse payment and its allocations via
  journal reversal) and `charge.dispute.create/resolve` (flag `disputed`).
- **H6:** billing webhook errors return 500 so Paystack retries.

## 6. Migration plan

1. Create `ledger` app; seed chart of accounts for every existing organization.
2. `RenameModel RentCharge → Invoice`; add new fields; rename allocation FK.
3. Data migration: one `rent` line per existing invoice (`amount_due`);
   `late_fee_amount > 0` (should be none) → separate penalty invoice;
   assign invoice numbers in `created_at` order; `waived` → credit note.
4. Backfill `Payment.source` and `unapplied_amount`; issue receipts for past
   successful payments **without** sending them.
5. Backfill journal entries from history in date order; run the balance
   invariant and assert each tenancy's receivable equals the old outstanding.
6. API: `/rent/`, `/rent/balance/` keep their response shape (serializer maps
   `total` → `amount_due`), and new `/invoices/`, `/receipts/`, `/credit-notes/`,
   `/deposits/` endpoints are added. Frontend moves over gradually; old
   fields removed in Phase 2.

Every step is a separate, reversible migration with its own tests.

## 7. Delivery slices (each its own PR, tests first)

| Slice | Contents | Closes |
|---|---|---|
| 1a | `ledger` app, accounts, LedgerService, invariant test | — |
| 1b | Rename → Invoice + lines + numbering + credit notes, data migration, compatible API | — |
| 1c | Allocation rewrite + tenant credit + journal posting for invoices/payments | H1, H2 |
| 1d | Receipts (model, PDF, SMS/email task, download endpoints, UI) | receipts |
| 1e | Invoicing generator: notice period, end date, proration, recurring charges | lease-end bug |
| 1f | Reminders on EscalationPolicy + ReminderLog | reminders |
| 1g | Penalty policy + task + waive flow + UI | late fees |
| 1h | Deposits: invoice, settlement flow, UI | deposits |
| 1i | Paystack hardening | H3–H6 |
| 1j | Metered utilities (if D3 = yes) | utilities |

## 8. Testing strategy

- Ledger invariant test over every journal entry after each test (fixture hook).
- Property-style tests for allocation: random payments vs invoices → Σ
  allocations + unapplied = Σ payments, never over-allocates.
- Migration test: build a pre-migration fixture DB, migrate, compare balances.
- Existing 239 backend tests must keep passing at every slice.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Backfill produces balances that differ from today's numbers | Step 6.5 asserts equality per tenancy; migration aborts on mismatch |
| Frontend breaks on renamed fields | Compatibility serializers through Phase 1 |
| Penalties anger tenants/landlords | Off by default; explicit opt-in; always waivable |
| Receipts/SMS cost | Uses existing Africa's Talking account; SMS toggle per org |

## 10. Decisions needed from the owner

| # | Decision | Recommendation |
|---|---|---|
| D1 | Rename `RentCharge` in place (keeps data and FKs) vs build a new model and copy | **Rename in place** |
| D2 | Allocation order: oldest-first (above) vs always rent first | **Oldest-first**, ties deposit → rent → services → penalty |
| D3 | Metered utilities (water/electricity readings) in Phase 1 or later | **Phase 1, last slice (1j)** — EazzyRent has it; fixed service charges come earlier |
| D4 | Receipt/invoice numbering per organization vs global | **Per organization** (landlords expect their own sequence) |
| D5 | Accrual accounting (income when invoiced) vs cash (income when paid) | **Accrual journal**; cash-basis views derived for landlord "collections" reports |
| D6 | Final month at move-out: prorate by days vs bill the full month | **Prorate**, overridable per tenancy |
| D7 | Penalty default | **Off**; when enabled, default fixed amount, once per invoice, after the tenancy's grace days |
