# Phase 2 — M-Pesa Paybill Collection (Daraja C2B): Design

**Status: IMPLEMENTED (code + tests) on branch `feature/phase-2-paybill`,
built on Phase 1. NOT verified against Safaricom — no Daraja credentials
were available. Built to Safaricom's documented C2B formats with simulated
callbacks.** Decisions here were made autonomously overnight; review them.

## Goal

Tenants pay rent the normal Kenyan way — to their landlord's own paybill,
with an account number — and RumiaRent records it automatically: matched to
the right tenancy, allocated to invoices, receipted by SMS/email, booked to
ledger account 1020 (M-Pesa paybill). Money never passes through RumiaRent.

## How it works

1. A landlord adds their paybill (or till) in RumiaRent with the Daraja app
   credentials for that shortcode (consumer key/secret — stored encrypted).
2. RumiaRent calls Daraja **Register URL** for that shortcode, pointing
   Safaricom at `/api/v1/paybill/c2b/<secret-token>/confirm/` and `.../validate/`.
   (Daraja rejects callback URLs containing words like "mpesa", "safaricom",
   "sql", "query", "exec" — hence `paybill`, not `mpesa`, in the path.)
3. Every tenancy has a short **payment reference** (default: the unit
   number, e.g. `A101`; made unique per organization). Tenants type it as the
   account number. It is shown on their dashboard, invoices and reminders.
4. On each confirmation callback RumiaRent stores the raw transaction
   (idempotent on M-Pesa `TransID`), then matches it:
   - by account number → tenancy payment reference (case/space/dash-insensitive);
   - else by unit number, if unique in the organization;
   - else by phone, **only** if Safaricom sent a plain number (it often
     sends a masked/hashed MSISDN) and exactly one tenant has it.
5. Matched → a `Payment` (`mpesa_paybill`, provider reference = TransID) goes
   through the normal Phase 1 flow: allocation oldest-first, credit for
   overpayment, receipt, ledger.
6. Unmatched → it waits in the **unmatched payments** queue; the owner is
   alerted and assigns it to a tenancy (or ignores it, e.g. not rent).
7. Validation callback always **accepts** — rejecting would bounce a tenant's
   money because of a typo; the queue is the safety net.

## Security

Daraja C2B callbacks are **not signed**. Defences:
- Unguessable per-paybill token in the callback URL (rotatable).
- `BusinessShortCode` in the payload must equal the paybill's shortcode.
- Optional IP allowlist: `MPESA_CALLBACK_ALLOWED_IPS` (comma-separated) —
  set it to Safaricom's published callback IPs in production.
- Credentials encrypted at rest with Fernet; key from
  `FIELD_ENCRYPTION_KEY` (falls back to a key derived from `SECRET_KEY` —
  set a dedicated key in production).
- Callbacks never leak whether a reference exists (always `ResultCode 0`).

## Reliability

Sandbox callbacks are widely reported as unreliable, and production ones can
be missed during downtime. Phase 2 provides the unmatched queue and manual
assignment; an automatic statement pull (Transaction Status / Account
Balance APIs, or the bank's statement API) is **Phase 2b**.

## Data model (app `paybill`)

- `PaybillAccount` — organization, shortcode (unique), type (paybill/till),
  environment (sandbox/production), encrypted consumer key/secret,
  callback token, registered_at, last_callback_at, is_active.
- `IncomingTransaction` — paybill, organization, trans_id (unique), type,
  time, amount, bill reference (raw + normalized), msisdn, payer name,
  raw payload, status (`matched` | `unmatched` | `assigned` | `ignored`),
  matched_by (`reference` | `unit` | `phone` | `manual`), tenancy, payment,
  resolved_by/at, note.
- `Tenancy.payment_reference` — unique per organization.

## API

| Method | Path | Who |
|---|---|---|
| POST | `/paybill/c2b/<token>/validate/`, `/confirm/` | Safaricom |
| GET/POST | `/paybill/accounts/` | owner |
| PATCH | `/paybill/accounts/<id>/` | owner (credentials, active) |
| POST | `/paybill/accounts/<id>/register-urls/` | owner |
| POST | `/paybill/accounts/<id>/rotate-token/` | owner |
| GET | `/paybill/transactions/?status=unmatched` | owner, caretaker w/ payments |
| POST | `/paybill/transactions/<id>/assign/` `{tenancy}` | owner, caretaker `can_record_payments` |
| POST | `/paybill/transactions/<id>/ignore/` `{note}` | owner |
| GET | `/paybill/instructions/` | tenant (paybill + account number to pay) |

`manage.py paybill_simulate <shortcode> <amount> <account>` injects a fake
confirmation through the real code path, for demos without Safaricom.

## To go live (owner)

See [bank-integration.md](bank-integration.md): Daraja production go-live
for the landlord's paybill, then in RumiaRent: add the paybill with its
production consumer key/secret → "Register with Safaricom" → send a KES 10
test payment with the tenancy's account number.

## Hardening (21 Oct 2026)

**Matching order.** Each rule must find exactly one tenancy; otherwise the
payment goes to "needs attention":

1. The tenant's account number, exactly.
2. The unit number, when only one current tenant has it.
3. A reference learned when the landlord assigned an earlier payment by hand.
4. One word of what was typed ("RENT B12 OCT"). Noise words such as RENT,
   HSE and month names are never used alone.
5. Look-alike characters (O/0, I/L/1, S/5, B/8).
6. The phone number, only when Safaricom has not masked it.

**Learning.** Assigning a payment by hand remembers its reference for that
tenant. It is never learned when it is a noise word, a short number, or
another tenant's account or unit number. If two tenants turn out to use the
same reference, it becomes *contested* and is always sent to a person.

**Reversal.** Reversing a payment puts its M-Pesa notice and any matched
statement line back in the queue. A reference learned wrongly becomes
contested. When the payment is re-assigned, it gets internal reference
`MPESA-<code>-R2`.

**Never lose a notice.** A notice from an IP outside
`MPESA_CALLBACK_ALLOWED_IPS` that still carries the secret URL token is stored
as unverified and held for a person to check against the statement. It is
never settled automatically. Validation always accepts, and registration uses
ResponseType `Completed`.

**Missed notices.** The dashboard warns after 7 days without notices on a
registered paybill. Once a paybill is 35 days old, it shows a monthly
"check against your M-Pesa statement" item. Statement upload detects the
header row and columns of M-Pesa and bank CSVs, and handles amounts such as
`1,000 CR`, `(500)` and `500 DR`.

**Telling tenants.** Every reminder SMS and email says "Pay via M-Pesa Paybill
<n>, Account <tenant's account number>".
