# What's needed to finish RumiaRent

Status on 21 Oct 2026: rumiarent.com is live. Rent goes straight to each
landlord's own M-Pesa paybill or bank account; RumiaRent only records and
receipts payments. It never holds money. Deploys and tests run automatically.

What remains depends on things only you can get. Tick each one and send it to
me (or paste it in chat); I do the rest. For the full background, see
[external-requirements.md](external-requirements.md).

---

## 1. M-Pesa (needed before the first real landlord)

| ✓ | What to get | From | What I do with it |
|---|-------------|------|-------------------|
| ☐ | **One real paybill with Safaricom "Go Live" approval**, yours or a willing landlord's: paybill number, plus the **Consumer Key** and **Consumer Secret** of its live Daraja app | developer.safaricom.co.ke; the paybill's M-Pesa administrator approves with an OTP | Connect it, register it, run a KES 10 test payment with a tenant's account number, and confirm it matches and receipts. This is the only part of payments not yet proven with Safaricom |
| ☐ | **Safaricom's official list of callback IP addresses** | Your Safaricom contact or apisupport@safaricom.co.ke | Switch on the IP check so only Safaricom can post payments |
| ☐ | Each landlord's **signed authorisation letter**, letting RumiaRent receive their paybill notifications and send receipts in their name | Your lawyer drafts it once | Becomes part of landlord onboarding |

## 2. Banks (to match bank payments automatically)

Today landlords can upload a bank statement (CSV) and RumiaRent matches it.
For automatic, real-time matching, bring back the following from **each bank**
(start with Equity or KCB, since both already have real-time notifications):

| ✓ | What to ask for | Why |
|---|-----------------|-----|
| ☐ | **Sample CSV statement** from business online banking (fake data is fine) | I set up the import so it reads that bank's file correctly |
| ☐ | **Real-time credit notification product**: its name, its documentation, and a **sample notification**. Equity: *Jenga Account Services instant notifications*. KCB: *Buni IPN API*. Co-op: *Co-opConnect Instant Notification Service* | I build one connector per bank feeding the same matching queue (about a week per bank) |
| ☐ | Does the notification cover **every** deposit to a normal account (branch, app, PesaLink, EFT, M-Pesa to bank)? | Otherwise some payments would be missed |
| ☐ | **Third-party mandate form**: can a landlord authorise RumiaRent to receive notifications for *their* account? (KCB: a request letter signed by the account signatories, emailed to buni@kcbgroup.com) | This is how landlords will connect their bank |
| ☐ | **Which field carries the reference the tenant types** (in the notification and in the CSV), per channel: branch deposit, app, PesaLink | So tenants' account numbers match |
| ☐ | **Sandbox (test) access**, security requirements (IP allow-listing, signature keys or certificates), **fees**, contract or NDA, and a **named technical contact** | To build and go live |
| ☐ | A **business current account** for RumiaRent itself | Where subscription money settles |

## 3. Paystack (RumiaRent's own subscription income)

| ✓ | What to do | Why |
|---|------------|-----|
| ☐ | In the Paystack dashboard, set the webhook URL to `https://rumiarent.com/api/v1/rent/payments/webhook/paystack/` | Confirms landlords' subscription payments. The live keys are already saved in admin → Integrations |
| ☐ | Confirm the Paystack account is verified in your business name, with the business bank account above as settlement account | Money reaches you |

## 4. SMS and email

| ✓ | What to do | Why |
|---|------------|-----|
| ☐ | Get the **"RumiaRent" sender ID** approved on Africa's Talking, and keep the SMS balance topped up | Receipts and reminders come from a name tenants trust |
| ☐ | Check the Africa's Talking dashboard for the 3 test SMS from 20 Oct (to +254711111111 and +254700555444) | They may have been sent from your live account by mistake |
| ☐ | Make sure SPF, DKIM and DMARC are set for rumiarent.com at your email provider | Receipt emails land in the inbox, not spam |

## 5. Decisions and safety

| ✓ | What | Why |
|---|------|-----|
| ☐ | **Approve the seven accounting choices (D1–D7)** in [phase-1-ledger-design.md](phase-1-ledger-design.md), or tell me what to change | They have run on my recommended defaults |
| ☐ | **Somewhere off the server for backups**: an Oracle Object Storage bucket, Backblaze B2, or a Google Drive account (access keys or an invite) | I automate daily encrypted copies. Today backups are only on the server, plus one copy on your laptop |
| ☐ | Save the server's `FIELD_ENCRYPTION_KEY` (the line in `/opt/rumi/.env`) in your password manager | If it is lost, landlords must re-enter their Safaricom keys |
| ☐ | **Lawyer's written opinion** that "notify only, never hold funds" needs no CBK licence; review of the Terms, Privacy Policy and landlord letter | Regulatory safety |
| ☐ | Business registration: you can start as a sole proprietorship; register a limited company before scaling (see external-requirements.md, section A) | Liability, and banks' API contracts |

---

**Order that gets you to a first paying landlord fastest:** 1 (paybill test),
3 (Paystack webhook), 4 (sender ID), 5 (backups and D1–D7). Banks (2) can
follow; statement upload covers bank payments until then.
