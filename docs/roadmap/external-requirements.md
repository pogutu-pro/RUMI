# External requirements: what to get from outside

The model: **RumiaRent never holds or moves tenant money.** Tenants pay the
landlord's own paybill or bank account. RumiaRent only receives a
notification that a payment happened, matches it to a tenant, and sends the
receipt. RumiaRent's own money (landlord subscriptions) is the only money
RumiaRent receives.

Each item says what it is, who gets it, and why the app needs it. Tick them
off as you go.

---

## A. The business (RumiaRent itself)

### Sole proprietorship or limited company?

**You can start with your registered business name (sole proprietorship).**
Banks open business accounts for registered business names, and Paystack,
Safaricom and Africa's Talking accept sole proprietors. Confirm with each one
when you apply, since document lists change.

**Plan to register a limited company before you scale**, for these reasons:

- **Liability.** As a sole proprietor you *are* the business. If a landlord sues over wrong figures, a missed receipt or a data leak, your personal property is at risk. A company limits that.
- **Bank API programmes and larger landlords or agencies** often expect a company to sign their contracts (question 5 in section B tells you).
- **Investors and partners** can only take shares in a company.
- **Data protection obligations** are easier to carry as a company.

Practical path: open the bank account and apply to Paystack, Safaricom and
Africa's Talking now as a sole proprietor. Register **RumiaRent Limited** on
eCitizen in parallel (a few days to a few weeks). Then move the accounts over
once you're onboarding paying landlords, or earlier if a bank's API programme
requires a company. Moving means updating the bank account holder, Paystack
business details and the sender ID owner, so ask each provider how they
handle a "change of business entity".

| ✓ | Item | Where | Why |
|---|------|-------|-----|
| ☐ | **Now:** Business name certificate (you have this) + your personal KRA PIN and ID | eCitizen / iTax | Bank, Paystack, Safaricom and SMS sender-ID applications ask for these |
| ☐ | **Later:** Certificate of incorporation + CR12, company KRA PIN, directors' IDs and KRA PINs | eCitizen (Business Registration Service) / iTax | When you move to a limited company (see above) |
| ☐ | Single business permit | Your county | Usually asked for at account opening |
| ☐ | Registration as a data controller/processor | Office of the Data Protection Commissioner (ODPC) | You store tenants' names, phones, IDs and payment history. Check ODPC's list of sectors that must register; property management is likely covered |
| ☐ | Lawyer's written opinion | Advocate with fintech experience | Confirms the "notify only, never hold funds" model needs no CBK payment-service-provider licence. Also have them review the Terms, Privacy Policy and the landlord authorisation letter (section D) |
| ☐ | eTIMS onboarding (and VAT if turnover passes the threshold) | KRA | For RumiaRent's own subscription invoices to landlords |

## B. At the bank (for RumiaRent's own account)

Open a **business current account** in RumiaRent's name. Subscription money
from landlords settles here (through Paystack, or a direct transfer when a
landlord uses "pay another way").

Questions to ask the relationship manager while you're there. You'll need
the answers for bank integration later; nothing is built for it yet:

1. **Statement exports.** Can a business customer download account statements as **CSV** (not only PDF)? Get a sample file with fake data. RumiaRent's "Accounts & reconciliation" page imports CSV today.
2. **Real-time credit notifications (IPN/webhook).** When money lands in a *customer's* account, can the bank call a URL in real time with the amount, the payer's narrative/reference and a transaction ID? What is the product called?
   - Equity: **Jenga API**
   - KCB: **Buni**
   - Co-op Bank: its **API developer portal**
3. **Third-party access with consent.** Can a landlord authorise a software company (RumiaRent) to receive those notifications for *their* account, using a signed mandate letter? Ask for the bank's template letter.
4. **Deposit reference.** When a tenant pays by bank (branch, app or PesaLink), which field carries the reference the tenant types? Is it delivered in the notification and the CSV?
5. **Technical and commercial.** Sandbox access, security requirements (IP whitelisting, certificates), fees, contract or NDA, and who the technical contact is.

Ask the same five questions at each bank you want to support. Start with
whichever bank most of your landlords use.

## C. Safaricom (M-Pesa)

| ✓ | Item | Who | Why |
|---|------|-----|-----|
| ☐ | Daraja developer account | RumiaRent (developer.safaricom.co.ke) | To test in the sandbox and to hold the app that receives payment notifications |
| ☐ | Go-live of the C2B (paybill) API **for each landlord's paybill** | Landlord's paybill admin (M-Pesa Org Portal "Business Administrator") approves, together with RumiaRent | Without this Safaricom won't send that paybill's payment notifications to RumiaRent. This is the main onboarding step per landlord |
| ☐ | Safaricom's callback IP addresses | Safaricom / Daraja docs | Put them in `MPESA_CALLBACK_ALLOWED_IPS` so only Safaricom can post payments |
| ☐ | (Optional) a RumiaRent paybill or till | Safaricom business team | Only if you want landlords to pay *subscriptions* by M-Pesa directly. Not needed for rent |

Each landlord needs: a **paybill** (not a till, because a paybill carries the
account number tenants type), registered in their own or their company's
name, with org-portal admin access.

## D. Per landlord (onboarding pack)

- ☐ A signed **authorisation letter**: lets RumiaRent receive their paybill/bank payment notifications and send receipts in their name. The lawyer drafts it (section A).
- ☐ Paybill number + Daraja go-live done (section C).
- ☐ (Banks) the bank's mandate letter (section B, question 3).
- ☐ Their tenants' phone numbers and emails, for receipts and reminders.

## E. Messaging

| ✓ | Item | Where | Why |
|---|------|-------|-----|
| ☐ | Africa's Talking production account + prepaid balance | africastalking.com | Receipts, reminders and bulk SMS. **Not "sandbox"** in production |
| ☐ | Alphanumeric sender ID "RumiaRent" | Africa's Talking (they submit to the networks; takes days to weeks, needs company docs) | Otherwise SMS arrive from a random short code and tenants ignore them |
| ☐ | Email sending service + domain records | Any SMTP provider; DNS at your domain host | Receipts carry PDF attachments. Set **SPF, DKIM and DMARC** on rumiarent.com so they don't land in spam |

## F. Payments for RumiaRent subscriptions only

| ✓ | Item | Why |
|---|------|-----|
| ☐ | Paystack business account fully verified (KYC) + **live** keys | Landlords paying RumiaRent by card or M-Pesa. Tenant rent no longer goes through Paystack |
| ☐ | Paystack webhook URL set to `https://<api-domain>/api/v1/rent/payments/webhook/paystack/` (one URL serves rent and subscriptions) | Confirms subscription payments |
| ☐ | Settlement bank account = the business account from section B | |

## G. Server settings (environment variables on the server)

Generate or obtain each of these and put them in the server's `.env` (never
in git):

| Variable | What |
|----------|------|
| `SECRET_KEY` | Long random Django secret |
| `FIELD_ENCRYPTION_KEY` | Encrypts each landlord's Daraja key/secret. Generate once and **back it up**: if it's lost, every landlord must re-enter their Daraja credentials |
| `MPESA_CALLBACK_ALLOWED_IPS` | Safaricom's IPs (section C) |
| `MPESA_TRUST_X_FORWARDED_FOR` | `True` only if behind the Caddy proxy (it is) |
| `BACKEND_API_URL`, `FRONTEND_URL` | Public HTTPS URLs; the Daraja callback URLs are built from these |
| `PAYSTACK_ENV=live`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` | Section F |
| `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`, `SMS_MONTHLY_LIMIT` | Section E; the limit protects the SMS balance |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | Section E |
| `SENTRY_DSN` | Error alerts |
| `DB_*`, `REDIS_URL`, `CELERY_BROKER_URL` | Already set on the server |

## H. Operations

- ☐ **Off-site database backups** (daily, kept 30 days, restore tested once). The ledger is the landlord's books, so losing it is not an option.
- ☐ Turn **GitHub Actions back on** (repo Settings → Actions). The test workflow exists but is disabled, so nothing checks code before it deploys.
- ☐ A support phone line or WhatsApp for landlords during onboarding.

---

### Minimum to go live with one real landlord
A (business name certificate + KRA PIN), C (Daraja account + that landlord's paybill go-live),
D (their authorisation letter), E (Africa's Talking production + email DNS),
G (`FIELD_ENCRYPTION_KEY`, `MPESA_CALLBACK_ALLOWED_IPS`, URLs) and
H (backups). Banks (B) and Paystack live (F) can follow.
