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

## B. At the bank

### B1. RumiaRent's own account
Open a **business current account** in the business name. Subscription money
from landlords settles here (through Paystack, or a direct transfer when a
landlord uses "pay another way").

### B2. Bank integration for landlords: what is already known
Researched 21 Oct 2026 from the banks' developer docs and other Kenyan PMSs.
Go to the bank to **confirm** these and fill in the "Ask" items. Nothing is
built for banks yet; today landlords upload a CSV statement.

**How Kenyan PMSs do it:** the same model as M-Pesa. Rent lands in the
landlord's **own** account, and the landlord asks *their* bank to send
"instant notifications" for that account to the PMS's web address. Example:
RentalDesk tells landlords to ask their Equity contact to enable *instant
account notifications through Jenga Account Services* and send them to
RentalDesk's URL (Basic Auth), tests with a test credit, then goes live.
Tenants put the unit or invoice number in the payment reference. When the
reference is missing, the payment waits for manual matching. RumiaRent
already works this way for M-Pesa, so banks become another source for the
same "match and receipt" queue.

| Question | Equity (Jenga) | KCB (Buni) | Co-op (Co-opConnect) |
|---|---|---|---|
| **1. Statement export** | API: *Account Full Statement* returns date, amount, Credit/Debit, `reference` and `description` (narration) for a date range. Needs a signed request with a key registered with Finserve. **Ask:** CSV download in online banking for business accounts? Can a third party (RumiaRent) pull a landlord's statement with their consent? | **Ask:** CSV export in KCB online banking for business accounts; any statement API on Buni | Has an *Account Transactions* API. **Ask:** CSV export; whether a third party can call it with the landlord's consent |
| **2. Real-time notification (IPN)** | Yes. Jenga **IPN**: you register a URL plus username/password (Basic Auth) in JengaHQ; it sends payer name, phone, `customer.reference`, amount, transaction and bank reference, status. The documented IPN is for **Jenga payment-gateway** collections. **Ask:** do *Jenga Account Services instant notifications* cover every credit to a normal account (branch, app, PesaLink, EFT)? | Yes. Buni **IPN API**: KCB POSTs each successful credit to your HTTPS URL with `transactionReference`, `transactionAmount`, `customerReference`, `narration`, `customerName`, `customerMobileNumber`, `balance`, signed with a `Signature` header. You reply with a small JSON acknowledgement | Co-opConnect lists an **Instant Notification Service** ("real-time notification of any activity on the account"). **Ask:** is it push (they call our URL) or pull? What are the fields? Is it available to SMEs? |
| **3. Third-party access with consent** | Other PMSs (RentalDesk) receive Equity notifications for landlords' accounts: the landlord asks their Equity contact to point them at the PMS. **Ask:** the official form or mandate letter for this | Production IPN needs a **request letter signed by the account signatories** (form on the Buni portal), emailed to **buni@kcbgroup.com**. So the landlord signs; the URL can be RumiaRent's. **Ask:** confirm the URL may belong to a third party | **Ask:** the mandate letter for a third party to receive a customer's notifications |
| **4. Deposit reference** | IPN `customer.reference` / `transaction.billNumber`; statement `description`. **Ask:** which one carries what the payer typed in branch, Equitel/app and PesaLink deposits | IPN `customerReference` and `narration`. **Ask:** which carries what the payer typed, per channel (branch, app, PesaLink, Vooma) | **Ask:** the same question for statements and notifications |
| **5. Technical and commercial** | UAT and live environments (uat.finserve.africa / api.finserve.africa); Basic Auth on the IPN; may require IP or domain allow-listing. **Ask:** fees, contract, technical contact | No self-service sandbox for IPN (registration by email); the signature public key comes from KCB on request. **Ask:** the public key, fees, contract, contact | Developer portal developer.co-opbank.co.ke: register an app, get consumer key/secret, subscribe to each API, test in sandbox. **Ask:** go-live process, fees, contact |

**What to bring back from each bank:** the product name; a sample
notification and a sample CSV statement (fake data); the mandate or request
form; the fees; and a named technical contact. With those, each bank takes
about a week to build: one endpoint per bank feeding the existing matching
queue.

**Suggested order:** Equity and KCB both have documented push notifications
and several PMSs already use them. Ask Co-op whether its notification service
is push. Start with whichever bank most of your first landlords use.

### B3. Other Kenyan PMSs (landscape, Oct 2026)
Most are M-Pesa-first. EazzyRent, Kodi and Pangoni advertise using the
landlord's **own** paybill. Bank reconciliation is advertised by EazzyRent (7
banks), Nyumba Zetu and Silqu, and RentalDesk publishes its Equity setup.
Pricing is about KES 1,500–15,000 a month by unit count; Pangoni has a free
tier for 3 units. Also listed: BomaHut, PMS.co.ke, Shiftenant, Rentall,
RentSmart, Dala, Blocks, Rent Rahisi. Claims come from the vendors' own sites.

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
