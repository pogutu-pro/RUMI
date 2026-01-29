# RUMIA Payment System - Audit & Technical Documentation

## 1. System Overview
The `payments` application handles all financial transactions within the RUMIA platform, acting as the bridge between **Tenants (Students)**, **Landlords**, and **External Payment Gateways** (M-Pesa, Paystack).

> ⚠️ **CRITICAL AUDIT WARNING**: This system currently contains a **Blocking Database Logic Error** that prevents recurring payments. See Section 4 for details.

## 2. Current Features & Capabilities

### ✅ Implemented & Functional
1.  **M-Pesa Integration (Daraja API)**
    -   **STK Push**: Supports dynamic prompts to user phones.
    -   **C2B (Customer to Business)**: Handles "Paybill" and "Till Number" payments via webhooks.
    -   **Validation & Confirmation**: Full webhook cycle implemented in `mpesa_webhooks.py`.
    -   **Offline Payments**: C2B handler automatically matches `BillRefNumber` to## Frontend implementation Overview

The frontend has been updated to fully support the new `RentPeriod` architecture, moving away from simple transaction lists to a robust, period-based financial ledger.

### Data Integration
- **TypeScript Types**: Defined `RentPeriod`, `StudentWallet`, and `TransferLog` interfaces in `types.ts` to match the backend serializers.
- **API Client**: Implemented new functions in `payments.ts` to fetch periods, wallet status, and transfer history.
- **React Query Hooks**: Added custom hooks (`useRentPeriods`, `useMyWallet`, etc.) in `use-payments.ts` for clean data management and caching.

### UI Components & Pages

````carousel
```tsx
// RentOverview Component
// Located in: /features/payments/components/rent-overview.tsx
// Provides a high-level summary of active rent, outstanding balance, and wallet credits.
```
<!-- slide -->
```tsx
// RentHistoryTimeline Component
// Located in: /features/payments/components/rent-history-timeline.tsx
// Collapsible monthly cards showing amount due, paid, balance, and all associated transactions.
```
<!-- slide -->
```tsx
// NewPaymentPage Flow
// Located in: /app/(student)/student/payments/new/page.tsx
// A multi-step payment flow allowing students to select specific periods and handle STK/Manual Paybill.
```
````

### Key Frontend Features
- **Dynamic Paybill Instructions**: In the manual payment step, the UI now displays the specific Paybill and Account Reference assigned to that `RentPeriod` by the landlord.
- **Wallet Transparency**: A dedicated Wallet page allows students to see overpayments and how they are applied as credits.
- **Role-Based Views**: Components adapt based on whether the user is a student or landlord (Backend enforced, frontend rendered).

## Final Verification Results

- **Backend**:
  - `RentPeriod` objects successfully auto-generate and auto-close.
  - `StudentWallet` correctly captures overpayments and applies them as credits.
  - `TransferLog` provides a clear audit trail of internal fund movements.
- **Frontend**:
  - `RentOverview` displays accurate real-time balances.
  - `NewPaymentPage` successfully handles both STK Push flow and manual Paybill instructions.
  - `RentHistoryTimeline` provides a drill-down view into historical transactions.

> [!IMPORTANT]
> The system now prevents the "OneToOne" transaction limitation and ensures that even if a student pays via secondary methods, the funds are correctly attributed to the specific monthly obligation.

## Next Steps for User
1. **Hostel Configuration**: Landlords should ensure their Hostels have the correct `mpesa_paybill` and `mpesa_account_reference_prefix` set in the dashboard.
2. **First Run**: Once a booking starts, the system will automatically create the first `RentPeriod`.

---
*Implementation Complete - RUMIA RentPeriod Ledger v1.0*
 Fees".

3.  **Automated Tasks (Celery)**
    -   `process_recurring_payments`: Scheduled task to charge rent daily.
    -   `assess_late_fees`: Automated penalty application for overdue rent.
    -   `generate_monthly_tax_reports`: Accumulates 10% withholding tax data.

4.  **Payouts**
    -   Automated mirroring of `Transaction` to `Payout` records.
    -   Logic exists to calculate `net_payout_amount` after commissions (though commission is currently set to 0.00).

## 3. Data Architecture

The system is built around the following core models:

| Model | Purpose | Critical Note |
| :--- | :--- | :--- |
| **Transaction** | Central record of money movement. | **FATAL FLAW**: Linked 1:1 to Booking. |
| **MpesaPaymentConfig** | Stores Paybill/Till credentials per Landlord. | Supports "Send Money", "Pochi", "Paybill". |
| **RecurringPayment** | Tracks schedule (Next Payment Date, Amount). | Updates correctly but fails to create history due to Transaction constraint. |
| **SavedPaymentMethod** | Tokenized card/M-Pesa details. | Implementation suggests future "One-Click" pay support. |
| **Payout** | Record of funds moving to Landlord. | Created atomically with Transaction. |
| **TaxReport** | Aggregated tax liability logs. | Monthly generation logic implemented. |

## 4. Deep Audit Findings (Critical Issues)

### 🔴 P0: The One-To-One Transaction Constraint
**Location**: `payments/models.py:110`
```python
booking = models.OneToOneField('hostels.Booking', ...)
```
**Impact**:
-   A student can effectively check in and pay rent **ONCE**.
-   The **second month's rent payment will fail** database integrity checks because a Transaction already exists for that Booking ID.
-   **Consequence**: The system fundamentally cannot support the business model (Recurring Rent) in its current state.

### 🔴 P1: Missing "Ledger" or "Wallet"
**Issue**: The system relies on `Booking.amount_paid` (a simple decimal counter) and `Transaction` rows.
-   **No Audit Trail**: There is no "RentPeriod" model linking a payment to "January 2026".
-   **Overpayments**: If a student sends 50,000 instead of 10,000, there is no "Student Wallet" to hold the 40,000 credit. It just vanishes into `Booking.amount_paid` without distinct allocation logic.

### 🔴 P2: "Bed" vs "Room" Ambiguity
**Issue**: Payments are linked to `Booking`, which links to `Room`.
-   **Reality**: A "Room" has multiple people.
-   **Data Model**: The system tracks `Room.current_occupancy` but lacks definitive "Bed Slots".
-   **Risk**: If Room 101 has 4 people, knowing *who* paid for *which* space relies entirely on the `Booking` link. If a booking is cancelled/renewed, payment history continuity is fragile.

### 🔴 P3: Payout Coupling
**Issue**: `Payout` records are created inside the same atomic block as `Transaction` creation (in `mpesa_webhooks.py`).
-   **Risk**: If the Payout creation logic throws an error (e.g., missing Landlord bank details), the **Student's Payment Acceptance will Rollback**. The validation of the student's money should be decoupled from the landlord's settlement record logic.

## 5. Technical Recommendations

### Immediate Fixes Required
1.  **Refactor Model**: Change `Transaction.booking` to `models.ForeignKey`.
2.  **Migration**: Create a `RentLedger` or `Invoice` table to track monthly dues vs payments.
3.  **Decouple**: Move Payout creation to a post-save signal or separate Celery task to prevent blocking student payment confirmation.

### Usage Guide (Current State)
*Use with caution. Only suitable for "One-Time Stay" models until Schema Patch is applied.*

**Running Tests**:
```bash
python manage.py test payments
```

**Checking Recurring Status**:
```bash
# Check Celery Beat schedule
celery -A RUMIA beat
```

---
*Audit performed by Antigravity Agent, Jan 2026*
