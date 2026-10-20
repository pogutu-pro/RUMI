# Connecting to M-Pesa and Kenyan Banks

Research date: October 2026. Verify against each provider before starting —
onboarding processes change.

## Regulatory stance (decided)

RumiaRent **does not hold tenant funds**. Money lands in the landlord's own
paybill/bank account; RumiaRent receives notifications and reconciles.
Collecting into a platform account and paying out would make RumiaRent a
payment service provider, raising Central Bank of Kenya licensing questions.

## Company prerequisites (once)

- Registered company: certificate of incorporation, CR12, KRA PIN, director
  IDs, business bank account. Every bank and Safaricom performs integrator KYC.
- Registration with the Office of the Data Protection Commissioner (ODPC) —
  tenant financial data.
- Signed integration/partnership agreement with each bank (commercial, not
  just an API sign-up).

## M-Pesa — Safaricom Daraja C2B (first priority)

- Build against the Daraja sandbox.
- Go-live requires a live paybill/till with a Business Admin/Manager operator,
  a signed go-live request, and HTTPS callback URLs. Some guides report
  production IP whitelisting.
- **Per landlord:** each landlord's paybill must be onboarded — the paybill
  owner authorizes it, and RumiaRent registers its validation/confirmation
  URLs once for that shortcode (re-registering requires deleting the old URLs
  in the portal).
- Matching key: the bill-reference/account number the tenant types. Give every
  tenancy a short, unique account number (e.g. unit code) and print it on
  invoices.

## Banks — Instant Payment Notifications (IPN)

| Bank | Program | Notes |
|------|---------|-------|
| KCB | Buni API | Sandbox at the Buni portal; production needs a formal request form sent to buni@kcbgroup.com. IPN posts to your HTTPS endpoint; optional validation endpoint. |
| Equity | Jenga API | Signed requests (merchant code + private key). Developer portal: developer.jengaapi.io |
| Co-op Bank | Co-opConnect | Developer sandbox; account information + transactional APIs. |
| NCBA, Family, DTB, National Bank | No public developer program found | Go through the bank's relationship manager. |

- IPN is usually enabled **per landlord collection account**, with the
  landlord's written consent, often under a tripartite agreement
  (bank–landlord–RumiaRent).
- Technical needs:
  - HTTPS endpoint with signature/authentication verification and idempotency
    (reuse the Paystack webhook pattern).
  - Possibly IP whitelisting, VPN or mutual TLS, depending on the bank.
  - **Daily statement-pull reconciliation** to catch missed notifications.
- Expect weeks of paperwork per bank.

## Shortcut option

Kenyan payment aggregators can provide paybill collection (and sometimes bank
notifications) through a single integration. Faster to launch, but they charge
per transaction and add a dependency. Decide before Phase 2.

## Sources

- KCB Buni: https://buni.kcbgroup.com/
- KCB Buni IPN guide: https://dev.to/msnmongare/instant-payment-notification-ipn-api-integration-with-kcb-bank-buni-api-gateway-4pdc
- Co-opConnect: https://www.kenyans.co.ke/featured/55254-co-opconnect-open-apis-set-disrupt-businesses-kenya
- Co-op Bank APIs (Open Banking Tracker): https://openbankingtracker.com/provider/co-operative-bank-kenya/apis
- Equity Jenga library: https://github.com/beamkenya/ex_jenga
- Daraja C2B Register URL docs: https://glama.ai/mcp/servers/@JacksCodeVault/mpesa-daraja-mcp/blob/e875f3b350a0119c928c623c4e0cdd8999a5d329/daraja_docs_v3/docs/CustomerToBusinessRegisterURL.md
- Daraja go-live guide: https://dev.to/msnmongare/how-to-go-live-with-m-pesa-daraja-api-production-environment-4h96
