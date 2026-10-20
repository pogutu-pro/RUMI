# Phase 3c — Leases, documents, notices, debt recovery

**Status: IMPLEMENTED on `feature/eazzyrent-parity` (local). Autonomous decisions — review.**

Matches EazzyRent's debt control, document management and lease management.

- **Documents** (`leasing.TenancyDocument`): generated PDFs — tenancy
  agreement, demand note (itemised overdue invoices, pay-by date), notice to
  quit (default 30 days), notice-to-vacate record — and uploads (PDF/JPEG/PNG
  ≤ 5 MB; ID copies private to staff). Generated letters can be sent by
  email (PDF attached) + SMS. Letter wording is a plain template, **not legal
  advice** — the owner should have it reviewed under Kenyan law.
- **Notice to vacate**: tenant (from their dashboard) or landlord; tenancy goes
  to `notice_period` with `end_date` = move-out (billing stops there with
  proration, Phase 1e); owner alerted when the tenant gives notice.
- **Debt recovery** (`DebtCase`): worklist of tenancies in arrears; one open
  case per tenancy, assigned to the owner or a caretaker (who is notified),
  notes, promise-to-pay date, escalate, close; closed automatically when
  arrears are cleared. Caretakers see only cases assigned to them.
- **Rent reviews** (`RentReview`): new rent or % increase on a date,
  optionally repeating yearly; tenant told 30 days before; applied on the date
  (next invoices use it).
- **Lease expiry reminders**: 60/30/7 days before `end_date`, owner and
  tenant, each once (latest only after downtime).
- Daily task `leasing.tasks.run_daily` 07:30.

API under `/api/v1/leasing/` (see `leasing/urls.py`). Frontend: Landlord →
Debt recovery; tenancy panel → Lease tab; tenant dashboard → My documents,
Give notice to vacate.
