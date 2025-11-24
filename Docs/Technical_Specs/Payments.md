# PAYMENTS APP - Technical Specification

**RUMI Platform v1.6**

**App Name:** payments

**Purpose:** Payment processing, recurring payments, transaction recording, commission calculation, tax reporting, and landlord payouts via Paystack.

---

## Table of Contents

- [PAYMENTS APP - Technical Specification](#payments-app---technical-specification)
  - [Table of Contents](#table-of-contents)
  - [1. Overview and Scope](#1-overview-and-scope)
    - [Core Features](#core-features)
    - [Revenue Model](#revenue-model)
    - [Design Philosophy](#design-philosophy)
  - [2. Data Models](#2-data-models)
    - [2.1 Transaction](#21-transaction)
    - [2.2 SavedPaymentMethod](#22-savedpaymentmethod)
    - [2.3 RecurringPayment](#23-recurringpayment)
    - [2.4 LateFeeCharge](#24-latefeecharge)
    - [2.5 TaxReport](#25-taxreport)
    - [2.6 PaystackSubaccount](#26-paystacksubaccount)
    - [2.7 Payout](#27-payout)
    - [2.8 RefundRequest](#28-refundrequest)
    - [2.9 RevenueAnalytics](#29-revenueanalytics)
  - [3. API Endpoints](#3-api-endpoints)
    - [3.1 Payment Initiation](#31-payment-initiation)
    - [3.2 Recurring Payments](#32-recurring-payments)
    - [3.3 Late Fee Management](#33-late-fee-management)
    - [3.4 Saved Payment Methods](#34-saved-payment-methods)
    - [3.5 Payment Verification (Webhook Handler)](#35-payment-verification-webhook-handler)
    - [3.6 Tax Reporting](#36-tax-reporting)
    - [3.7 Revenue Analytics (Admin)](#37-revenue-analytics-admin)
  - [5. Error Handling and Edge Cases](#5-error-handling-and-edge-cases)
    - [5.1 Payment Failures](#51-payment-failures)
    - [5.2 Edge Cases](#52-edge-cases)
    - [5.3 Failure Recovery](#53-failure-recovery)
  - [6. Security Considerations](#6-security-considerations)
    - [6.1 Data Protection](#61-data-protection)
    - [6.2 Authentication \& Authorization](#62-authentication--authorization)
    - [6.3 Audit Trail](#63-audit-trail)
  - [7. Testing Strategy](#7-testing-strategy)
    - [7.1 Unit Tests](#71-unit-tests)
    - [7.2 Integration Tests](#72-integration-tests)
    - [7.3 Load Testing](#73-load-testing)
  - [8. Monitoring and Alerting](#8-monitoring-and-alerting)
    - [8.1 Key Metrics](#81-key-metrics)
    - [8.2 Alerts](#82-alerts)
    - [8.3 Logging](#83-logging)
  - [9. Deployment and Operations](#9-deployment-and-operations)
    - [9.1 Environment Configuration](#91-environment-configuration)
    - [9.2 Database Migrations](#92-database-migrations)
    - [9.3 Rollback Procedures](#93-rollback-procedures)
  - [10. Future Enhancements](#10-future-enhancements)
    - [10.1 Planned Features](#101-planned-features)
    - [10.2 Scalability Improvements](#102-scalability-improvements)
    - [10.3 Compliance Updates](#103-compliance-updates)
  - [11. API Reference](#11-api-reference)
    - [11.1 Authentication](#111-authentication)
    - [11.2 Rate Limits](#112-rate-limits)
    - [11.3 Error Response Format](#113-error-response-format)
    - [4.1 Recurring Payment Processing (Celery Task)](#41-recurring-payment-processing-celery-task)
    - [4.2 Late Fee Assessment (Celery Task)](#42-late-fee-assessment-celery-task)
    - [4.3 Tax Report Generation (Celery Task)](#43-tax-report-generation-celery-task)
    - [4.4 Revenue Analytics Aggregation (Celery Task)](#44-revenue-analytics-aggregation-celery-task)

---

## 1. Overview and Scope

The payments app handles all financial transactions on the RUMI platform, with enhanced features for secure and automated payment processing via Paystack.

### Core Features

- **Rent payment processing** via Paystack (M-Pesa Paybill integration)
- **Dual commission structure** (2% landlord fee + 1% student fee)
- **Payment gateway fees tracking** (1.5% Paystack fee)
- **Automated landlord payouts** (via Paystack subaccounts)
- **Transaction reconciliation and audit trails**
- **Recurring Payments** - Auto-debit monthly rent from saved payment method
- **Grace Period** - 1 week before late fee is applied
- **Payment Plans** - Support for monthly plans
- **Advanced Analytics** - Revenue trends dashboard (daily/weekly/monthly)
- **Peak Payment Optimization** - Webhook processing improvements
- **Landlord Performance Metrics** - Payout time, commission trends
- **Tax Reporting Integration** - 10% withholding tax (Kenya), downloadable reports

### Revenue Model

Example Calculation (KES 5,000 Base Rent):

**Student Pays:**
- Base Rent: KES 5,000
- Platform Service Fee (1%): KES 50
- Total Charge: KES 5,050

**Landlord Receives:**
- Base Rent: KES 5,000
- Platform Commission (2%): -KES 100
- Net Payout: KES 4,900

**Platform Revenue:**
- Student Fee (1%): KES 50
- Landlord Fee (2%): KES 100
- Gross Platform Revenue: KES 150
- Paystack Fee (1.5% of KES 5,050): -KES 75.75
- Net Platform Revenue: KES 74.25

### Design Philosophy

- **Security-First:** PCI compliance via Paystack (no card data stored locally)
- **Transparency:** Clear fee breakdown shown to both students and landlords
- **Automation:** Instant landlord payouts via Paystack subaccounts with automated splits
- **Idempotency:** Webhook handlers are idempotent (duplicate events handled safely)
- **Flexibility:** Multiple payment plans (monthly)

---

## 2. Data Models

### 2.1 Transaction

**Table:** payments_transaction

**Purpose:** Central record of all payment attempts and completions

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Transaction identifier |
| booking_id | INTEGER | FK → Booking, UNIQUE, NOT NULL | Associated booking |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Payer reference |
| landlord_id | INTEGER | FK → LandlordProfile, NOT NULL | Payee reference |
| transaction_reference | VARCHAR(100) | UNIQUE, NOT NULL | Platform reference |
| paystack_reference | VARCHAR(100) | UNIQUE, NULL | Paystack transaction ID |
| transaction_type | VARCHAR(20) | DEFAULT 'initial' | Payment type |
| payment_plan | VARCHAR(20) | DEFAULT 'monthly' | Payment plan type |
| base_rent | NUMERIC(10,2) | NOT NULL | Advertised rent amount |
| student_service_fee | NUMERIC(10,2) | NOT NULL | 1% charged to student |
| total_charged_amount | NUMERIC(10,2) | NOT NULL | Amount student pays |
| landlord_commission | NUMERIC(10,2) | NOT NULL | 2% deducted from landlord |
| landlord_payout_amount | NUMERIC(10,2) | NOT NULL | Net amount to landlord |
| gross_platform_revenue | NUMERIC(10,2) | NOT NULL | Student fee + Landlord fee |
| gateway_fee | NUMERIC(10,2) | NULL | 1.5% Paystack fee |
| net_platform_revenue | NUMERIC(10,2) | NULL | Gross revenue - gateway fee |
| withholding_tax | NUMERIC(10,2) | DEFAULT 0.00 | 10% tax deducted |
| currency | VARCHAR(3) | DEFAULT 'KES' | Currency code |
| payment_method | VARCHAR(50) | NULL | M-Pesa, Card, etc. |
| saved_payment_method_id | INTEGER | FK → SavedPaymentMethod, NULL | Recurring payment ref |
| status | VARCHAR(20) | DEFAULT 'pending' | Transaction state |
| initiated_at | TIMESTAMP | DEFAULT NOW() | Payment link created |
| paid_at | TIMESTAMP | NULL | Payment success time |
| failed_at | TIMESTAMP | NULL | Payment failure time |
| metadata | JSONB | NULL | Additional context |

**Indexes:**
- `idx_transaction_booking` on booking_id (unique)
- `idx_transaction_student` on student_id
- `idx_transaction_paystack_ref` on paystack_reference (unique)
- `idx_transaction_status` on status (reconciliation queries)
- `idx_transaction_type` on transaction_type
- `idx_transaction_paid_at` on paid_at (analytics)

**Constraints:**
- CHECK (status IN ('pending', 'success', 'failed', 'refunded'))
- CHECK (transaction_type IN ('initial', 'recurring', 'late_fee'))
- CHECK (payment_plan IN ('monthly'))
- CHECK (student_service_fee = base_rent * 0.01)
- CHECK (total_charged_amount = base_rent + student_service_fee)
- CHECK (landlord_commission = base_rent * 0.02)
- CHECK (landlord_payout_amount = base_rent - landlord_commission - withholding_tax)
- CHECK (gross_platform_revenue = student_service_fee + landlord_commission)

### 2.2 SavedPaymentMethod

**Table:** payments_savedpaymentmethod

**Purpose:** Store tokenized payment methods for recurring payments

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Payment method identifier |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Owner reference |
| paystack_authorization_code | VARCHAR(100) | UNIQUE, NOT NULL | Paystack token |
| payment_type | VARCHAR(20) | NOT NULL | 'mpesa', 'card' |
| last_four | VARCHAR(4) | NULL | Last 4 digits (card) |
| phone_number | VARCHAR(15) | NULL | M-Pesa number |
| expiry_month | VARCHAR(2) | NULL | Card expiry month |
| expiry_year | VARCHAR(4) | NULL | Card expiry year |
| bank | VARCHAR(50) | NULL | Card issuing bank |
| is_default | BOOLEAN | DEFAULT FALSE | Default payment method |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| last_used_at | TIMESTAMP | NULL | Last transaction time |

**Indexes:**
- `idx_saved_payment_student` on student_id
- `idx_saved_payment_auth_code` on paystack_authorization_code (unique)

**Constraints:**
- CHECK (payment_type IN ('mpesa', 'card', 'bank_transfer'))
- UNIQUE (student_id, is_default) WHERE is_default = TRUE → Only one default per student

**Security Note:** Only Paystack authorization codes are stored, never raw card/account data.

### 2.3 RecurringPayment

**Table:** payments_recurringpayment

**Purpose:** Track recurring payment schedules for active tenants

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Recurring payment identifier |
| booking_id | INTEGER | FK → Booking, UNIQUE, NOT NULL | Associated booking |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Tenant reference |
| saved_payment_method_id | INTEGER | FK → SavedPaymentMethod, NOT NULL | Payment source |
| rent_amount | NUMERIC(10,2) | NOT NULL | Monthly rent |
| frequency | VARCHAR(20) | DEFAULT 'monthly' | Payment frequency |
| next_payment_date | DATE | NOT NULL | Next charge date |
| grace_period_days | INTEGER | DEFAULT 7 | Days before late fee |
| late_fee_amount | NUMERIC(10,2) | DEFAULT 200.00 | Late fee (KES) |
| is_active | BOOLEAN | DEFAULT TRUE | Active subscription |
| started_at | TIMESTAMP | DEFAULT NOW() | Subscription start |
| paused_at | TIMESTAMP | NULL | Paused timestamp |
| cancelled_at | TIMESTAMP | NULL | Cancellation timestamp |
| last_payment_at | TIMESTAMP | NULL | Last successful charge |
| consecutive_failures | INTEGER | DEFAULT 0 | Failed attempts counter |

**Indexes:**
- `idx_recurring_booking` on booking_id (unique)
- `idx_recurring_next_payment` on next_payment_date WHERE is_active = TRUE (Celery queries)
- `idx_recurring_student` on student_id

**Constraints:**
- CHECK (frequency IN ('monthly'))
- CHECK (grace_period_days >= 0)
- CHECK (consecutive_failures >= 0)

### 2.4 LateFeeCharge

**Table:** payments_latefeecharge

**Purpose:** Track late fee charges after grace period

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Late fee identifier |
| booking_id | INTEGER | FK → Booking, NOT NULL | Associated booking |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Debtor reference |
| original_transaction_id | INTEGER | FK → Transaction, NULL | Original rent payment |
| late_fee_amount | NUMERIC(10,2) | NOT NULL | Late fee (KES 200) |
| due_date | DATE | NOT NULL | Original payment deadline |
| grace_period_end | DATE | NOT NULL | Late fee trigger date |
| charged_at | TIMESTAMP | DEFAULT NOW() | Charge creation |
| status | VARCHAR(20) | DEFAULT 'pending' | Payment status |
| paid_at | TIMESTAMP | NULL | Payment success time |

**Indexes:**
- `idx_late_fee_booking` on booking_id
- `idx_late_fee_student` on student_id
- `idx_late_fee_status` on status

**Constraints:**
- CHECK (status IN ('pending', 'paid', 'waived'))
- CHECK (grace_period_end > due_date)

### 2.5 TaxReport

**Table:** payments_taxreport

**Purpose:** Store monthly withholding tax reports for landlords

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Report identifier |
| landlord_id | INTEGER | FK → LandlordProfile, NOT NULL | Landlord reference |
| report_month | DATE | NOT NULL | Report period (YYYY-MM-01) |
| total_rent_received | NUMERIC(10,2) | NOT NULL | Gross rent for month |
| total_withholding_tax | NUMERIC(10,2) | NOT NULL | 10% tax deducted |
| transaction_count | INTEGER | NOT NULL | Number of payments |
| report_file_url | VARCHAR(255) | NULL | PDF download link |
| generated_at | TIMESTAMP | DEFAULT NOW() | Report creation |

**Indexes:**
- `idx_tax_report_landlord_month` on (landlord_id, report_month) (unique)

**Constraints:**
- UNIQUE (landlord_id, report_month) → One report per landlord per month
- CHECK (total_withholding_tax = total_rent_received * 0.10)

### 2.6 PaystackSubaccount

**Table:** payments_paystacksubaccount

**Purpose:** Store Paystack subaccount details for automated landlord payouts

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Subaccount identifier |
| landlord_id | INTEGER | FK → LandlordProfile, UNIQUE | Owner reference |
| subaccount_code | VARCHAR(100) | UNIQUE, NOT NULL | Paystack subaccount ID |
| business_name | VARCHAR(255) | NOT NULL | Registered name |
| settlement_bank | VARCHAR(100) | NOT NULL | Bank name |
| account_number | VARCHAR(20) | NOT NULL | Bank account number |
| percentage_charge | NUMERIC(5,2) | DEFAULT 0.00 | Split % (use transaction_charge instead) |
| total_payouts | NUMERIC(10,2) | DEFAULT 0.00 | Lifetime payouts |
| total_commission_paid | NUMERIC(10,2) | DEFAULT 0.00 | Total platform fees |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| verified_at | TIMESTAMP | NULL | KYC verification time |

**Indexes:**
- `idx_subaccount_landlord` on landlord_id (unique)
- `idx_subaccount_code` on subaccount_code (unique)

### 2.7 Payout

**Table:** payments_payout

**Purpose:** Track automated payouts to landlords

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Payout identifier |
| transaction_id | INTEGER | FK → Transaction, NOT NULL | Source transaction |
| landlord_id | INTEGER | FK → LandlordProfile, NOT NULL | Payee |
| subaccount_id | INTEGER | FK → PaystackSubaccount | Destination account |
| payout_reference | VARCHAR(100) | UNIQUE, NOT NULL | Platform reference |
| paystack_transfer_code | VARCHAR(100) | UNIQUE, NULL | Paystack transfer ID |
| gross_amount | NUMERIC(10,2) | NOT NULL | Base rent amount |
| commission_deducted | NUMERIC(10,2) | NOT NULL | 2% platform fee |
| withholding_tax_deducted | NUMERIC(10,2) | DEFAULT 0.00 | 10% tax |
| net_payout_amount | NUMERIC(10,2) | NOT NULL | Actual landlord receives |
| payout_duration_seconds | INTEGER | NULL | Time to settlement |
| status | VARCHAR(20) | DEFAULT 'pending' | Payout state |
| initiated_at | TIMESTAMP | DEFAULT NOW() | Payout request time |
| completed_at | TIMESTAMP | NULL | Settlement time |
| failed_at | TIMESTAMP | NULL | Failure time |
| failure_reason | TEXT | NULL | Error message |

**Indexes:**
- `idx_payout_transaction` on transaction_id
- `idx_payout_landlord` on landlord_id
- `idx_payout_status` on status
- `idx_payout_completed_at` on completed_at (performance analytics)

**Constraints:**
- CHECK (status IN ('pending', 'processing', 'success', 'failed'))
- CHECK (net_payout_amount = gross_amount - commission_deducted - withholding_tax_deducted)

### 2.8 RefundRequest

**Table:** payments_refundrequest

**Purpose:** Handle booking cancellation refunds

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Refund identifier |
| transaction_id | INTEGER | FK → Transaction, NOT NULL | Original transaction |
| booking_id | INTEGER | FK → Booking, NOT NULL | Cancelled booking |
| student_id | INTEGER | FK → StudentProfile, NOT NULL | Recipient |
| original_amount_paid | NUMERIC(10,2) | NOT NULL | Total student paid |
| refund_amount | NUMERIC(10,2) | NOT NULL | Amount to refund |
| refund_percentage | NUMERIC(5,2) | NOT NULL | Refund policy % |
| refund_reason | VARCHAR(100) | NOT NULL | Cancellation reason |
| status | VARCHAR(20) | DEFAULT 'pending' | Refund state |
| requested_at | TIMESTAMP | DEFAULT NOW() | Request time |
| approved_at | TIMESTAMP | NULL | Admin approval time |
| processed_at | TIMESTAMP | NULL | Paystack processing |
| completed_at | TIMESTAMP | NULL | Refund success time |

**Indexes:**
- `idx_refund_transaction` on transaction_id
- `idx_refund_status` on status

**Constraints:**
- CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected'))
- CHECK (refund_reason IN ('early_cancellation', 'room_unavailable', 'platform_error'))
- CHECK (refund_amount <= original_amount_paid)

### 2.9 RevenueAnalytics

**Table:** payments_revenueanalytics

**Purpose:** Pre-aggregated revenue metrics for dashboard performance

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PK | Analytics identifier |
| date | DATE | NOT NULL | Report date |
| period_type | VARCHAR(20) | NOT NULL | 'daily', 'weekly', 'monthly' |
| total_transactions | INTEGER | NOT NULL | Transaction count |
| total_volume | NUMERIC(10,2) | NOT NULL | Total rent processed |
| gross_platform_revenue | NUMERIC(10,2) | NOT NULL | Student + Landlord fees |
| gateway_fees_paid | NUMERIC(10,2) | NOT NULL | Paystack fees |
| net_platform_revenue | NUMERIC(10,2) | NOT NULL | Actual profit |
| recurring_payments_count | INTEGER | DEFAULT 0 | Auto-debit count |
| late_fees_collected | NUMERIC(10,2) | DEFAULT 0.00 | Late fee revenue |
| total_withholding_tax | NUMERIC(10,2) | DEFAULT 0.00 | Tax collected |
| created_at | TIMESTAMP | DEFAULT NOW() | Generation time |

**Indexes:**
- `idx_revenue_date_period` on (date, period_type) (unique)
- `idx_revenue_date` on date DESC

**Constraints:**
- CHECK (period_type IN ('daily', 'weekly', 'monthly'))
- UNIQUE (date, period_type)

---

## 3. API Endpoints

### 3.1 Payment Initiation

**POST /api/v1/payments/initialize**

**Purpose:** Generate Paystack payment link for a booking

**Authentication:** Required (Student only)

**Trigger:** Called automatically after room reservation

**Request Body:**
```json
{
  "booking_id": 789,
  "payment_plan": "monthly",
  "save_payment_method": true
}
```

**Response (201):**
```json
{
  "transaction_id": 1001,
  "transaction_reference": "RUMI-TXN-2025-001001",
  "payment_link": "https://paystack.com/pay/rumi_abc123xyz",
  "breakdown": {
    "base_rent": 5000.00,
    "service_fee": 50.00,
    "service_fee_percentage": "1%",
    "total_payable": 5050.00,
    "landlord_receives": 4900.00,
    "landlord_commission": 100.00,
    "landlord_commission_percentage": "2%",
    "withholding_tax": 500.00,
    "withholding_tax_percentage": "10%"
  },
  "expires_at": "2025-10-25T14:15:00Z",
  "currency": "KES"
}
```


### 3.2 Recurring Payments

**POST /api/v1/payments/recurring/enable**

**Purpose:** Enable auto-debit for monthly rent

**Authentication:** Required (Student only)

**Prerequisite:** Student must have completed at least one successful payment

**Request Body:**
```json
{
  "booking_id": 789,
  "saved_payment_method_id": 5
}
```

**Response (200):**
```json
{
  "message": "Recurring payments enabled successfully",
  "recurring_payment_id": 50,
  "booking_id": 789,
  "rent_amount": 5000.00,
  "next_payment_date": "2025-12-01",
  "grace_period_days": 7,
  "late_fee_amount": 200.00,
  "payment_method": {
    "type": "mpesa",
    "last_four": "5678",
    "phone_number": "+254712******78"
  }
}
```

**Backend Logic:**
```python
def enable_recurring_payment(booking_id, student_id, payment_method_id):
    """
    Enable auto-debit for monthly rent
    """
    booking = Booking.objects.get(id=booking_id, student_id=student_id)

    # Check eligibility
    if booking.status != 'confirmed':
        raise ValidationError("Booking must be confirmed first")

    # Check if first month paid
    first_payment = Transaction.objects.filter(
        booking_id=booking_id,
        transaction_type='initial',
        status='success'
    ).exists()

    if not first_payment:
        raise ValidationError("Complete first payment before enabling auto-debit")

    # Get saved payment method
    payment_method = SavedPaymentMethod.objects.get(
        id=payment_method_id,
        student_id=student_id,
        is_active=True
    )

    # Calculate next payment date (1 month from move-in or last payment)
    last_payment = Transaction.objects.filter(
        booking_id=booking_id,
        status='success'
    ).order_by('-paid_at').first()

    if last_payment:
        next_payment_date = last_payment.paid_at.date() + timedelta(days=30)
    else:
        next_payment_date = booking.move_in_date + timedelta(days=30)

    # Create recurring payment schedule
    recurring_payment = RecurringPayment.objects.create(
        booking_id=booking_id,
        student_id=student_id,
        saved_payment_method_id=payment_method_id,
        rent_amount=booking.room.base_price,
        frequency='monthly',
        next_payment_date=next_payment_date,
        grace_period_days=7,
        late_fee_amount=Decimal('200.00'),
        is_active=True
    )

    # Update booking
    booking.auto_renewal = True
    booking.save()

    # Send confirmation notification
    send_notification.delay(
        recipient_id=student_id,
        notification_type='recurring_payment_enabled',
        channel='email',
        context={
            'student_name': booking.student.user.first_name,
            'rent_amount': float(booking.room.base_price),
            'next_payment_date': next_payment_date.strftime('%B %d, %Y')
        }
    )

    return recurring_payment
```

**PUT /api/v1/payments/recurring/{recurring_id}/pause**

**Purpose:** Temporarily pause auto-debit

**Authentication:** Required (Student only)

**Response (200):**
```json
{
  "message": "Recurring payments paused",
  "recurring_payment_id": 50,
  "paused_at": "2025-11-15T10:00:00Z",
  "note": "You will need to pay rent manually. Resume anytime."
}
```

**PUT /api/v1/payments/recurring/{recurring_id}/resume**

**Purpose:** Resume auto-debit after pause

**Authentication:** Required (Student only)

**DELETE /api/v1/payments/recurring/{recurring_id}**

**Purpose:** Cancel auto-debit permanently

**Authentication:** Required (Student only)

### 3.3 Late Fee Management

**GET /api/v1/payments/late-fees/{booking_id}**

**Purpose:** View outstanding late fees

**Authentication:** Required (Student only)

**Response (200):**
```json
{
  "booking_id": 789,
  "total_late_fees": 400.00,
  "late_fees": [
    {
      "late_fee_id": 10,
      "late_fee_amount": 200.00,
      "original_due_date": "2025-10-31",
      "grace_period_end": "2025-11-07",
      "charged_at": "2025-11-08T00:00:00Z",
      "status": "pending",
      "days_overdue": 8
    },
    {
      "late_fee_id": 11,
      "late_fee_amount": 200.00,
      "original_due_date": "2025-11-30",
      "grace_period_end": "2025-12-07",
      "charged_at": "2025-12-08T00:00:00Z",
      "status": "pending",
      "days_overdue": 1
    }
  ]
}
```

**POST /api/v1/payments/late-fees/{late_fee_id}/pay**

**Purpose:** Pay outstanding late fee

**Authentication:** Required (Student only)

**Response (201):**
```json
{
  "transaction_id": 1030,
  "payment_link": "https://paystack.com/pay/rumi_latefee",
  "breakdown": {
    "late_fee": 200.00,
    "service_fee": 2.00,
    "total_payable": 202.00
  }
}
```

### 3.4 Saved Payment Methods

**GET /api/v1/payments/payment-methods**

**Purpose:** List student's saved payment methods

**Authentication:** Required (Student only)

**Response (200):**
```json
{
  "payment_methods": [
    {
      "payment_method_id": 5,
      "payment_type": "mpesa",
      "phone_number": "+254712******78",
      "is_default": true,
      "last_used_at": "2025-11-01T10:30:00Z"
    },
    {
      "payment_method_id": 6,
      "payment_type": "card",
      "last_four": "4242",
      "bank": "Equity Bank",
      "expiry_month": "12",
      "expiry_year": "2027",
      "is_default": false,
      "last_used_at": "2025-10-15T14:20:00Z"
    }
  ]
}
```

**PUT /api/v1/payments/payment-methods/{method_id}/set-default**

**Purpose:** Set payment method as default

**Authentication:** Required (Student only)

**DELETE /api/v1/payments/payment-methods/{method_id}**

**Purpose:** Remove saved payment method

**Authentication:** Required (Student only)

### 3.5 Payment Verification (Webhook Handler)

**POST /api/v1/payments/webhook**

**Purpose:** Receive Paystack webhook events (payment success/failure)

**Authentication:** Paystack signature verification

**Critical:** Must be idempotent (handle duplicate events)

**Paystack Webhook Payload:**
```json
{
  "event": "charge.success",
  "data": {
    "reference": "RUMI-TXN-2025-001001",
    "amount": 505000,
    "status": "success",
    "paid_at": "2025-10-25T13:12:00Z",
    "channel": "mobile_money",
    "fees": 7575,
    "authorization": {
      "authorization_code": "AUTH_abc123",
      "last4": "5678",
      "exp_month": "12",
      "exp_year": "2027",
      "channel": "mobile_money",
      "bank": "MPESA"
    },
    "metadata": {
      "booking_id": 789,
      "transaction_type": "initial",
      "save_payment_method": true
    }
  }
}
```

**Enhanced Handler Logic:**
```python
@csrf_exempt
def paystack_webhook(request):
    """
    Enhanced webhook handler with recurring payment support
    """
    # 1. Verify Paystack signature
    signature = request.headers.get('x-paystack-signature')
    if not verify_paystack_signature(request.body, signature):
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    payload = json.loads(request.body)

    if payload['event'] == 'charge.success':
        reference = payload['data']['reference']

        # 2. Find transaction (idempotency check)
        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(
                transaction_reference=reference
            )

            if txn.status == 'success':
                return JsonResponse({'message': 'Already processed'}, status=200)

            # 3. Update transaction with actual Paystack data
            gateway_fee = Decimal(payload['data']['fees']) / 100
            net_platform_revenue = txn.gross_platform_revenue - gateway_fee

            # Calculate withholding tax (10% of base rent)
            withholding_tax = txn.base_rent * Decimal('0.10')

            txn.status = 'success'
            txn.paystack_reference = payload['data']['reference']
            txn.paid_at = payload['data']['paid_at']
            txn.payment_method = payload['data']['channel']
            txn.gateway_fee = gateway_fee
            txn.net_platform_revenue = net_platform_revenue
            txn.withholding_tax = withholding_tax
            txn.save()

            # 4. Save payment method if requested
            if payload['data']['metadata'].get('save_payment_method'):
                save_payment_method(
                    student_id=txn.student_id,
                    authorization=payload['data']['authorization']
                )

            # 5. Handle transaction type-specific logic
            transaction_type = payload['data']['metadata'].get('transaction_type', 'initial')

            if transaction_type == 'initial':
                # First payment - confirm booking
                confirm_room_booking(txn.booking_id, reference)

            elif transaction_type == 'recurring':
                # Update recurring payment schedule
                recurring_payment_id = payload['data']['metadata'].get('recurring_payment_id')
                update_recurring_payment(recurring_payment_id)

            elif transaction_type == 'late_fee':
                # Mark late fee as paid
                late_fee_id = payload['data']['metadata'].get('late_fee_id')
                mark_late_fee_paid(late_fee_id)

            # 6. Create payout record
            create_landlord_payout(txn)

            # 7. Trigger notifications
            send_payment_confirmation_notifications(txn, transaction_type)

        return JsonResponse({'status': 'success'}, status=200)
```

### 3.6 Tax Reporting

**GET /api/v1/payments/tax-reports**

**Purpose:** List landlord's tax reports

**Authentication:** Required (Landlord only)

**Response (200):**
```json
{
  "total_reports": 12,
  "reports": [
    {
      "report_id": 50,
      "report_month": "2025-11",
      "total_rent_received": 50000.00,
      "total_withholding_tax": 5000.00,
      "transaction_count": 10,
      "report_file_url": "https://s3.amazonaws.com/rumi/tax-reports/2025-11-landlord-10.pdf",
      "generated_at": "2025-12-01T00:00:00Z"
    }
  ]
}
```

**GET /api/v1/payments/tax-reports/{report_id}/download**

**Purpose:** Download tax report PDF

**Authentication:** Required (Landlord only)

**Response:** PDF file download

**PDF Content:**
```
RUMI PLATFORM - WITHHOLDING TAX CERTIFICATE
Report Period: November 2025
Landlord: Smith Properties Ltd
KRA PIN: A123456789X

Summary:
- Total Rent Received: KES 50,000.00
- Withholding Tax (10%): KES 5,000.00
- Net Amount Paid: KES 45,000.00

Transaction Breakdown:
Date         | Student Name | Room | Rent    | Tax     | Net
-------------|--------------|------|---------|---------|--------
2025-11-01   | John Doe     | A201 | 5000.00 | 500.00  | 4500.00
2025-11-05   | Jane Smith   | B105 | 5000.00 | 500.00  | 4500.00
...
```

### 3.7 Revenue Analytics (Admin)

**GET /api/v1/payments/analytics/revenue**

**Purpose:** View revenue dashboard with trends

**Authentication:** Required (Admin only)

**Query Parameters:**
- `period`: 'daily', 'weekly', 'monthly'
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD

**Response (200):**
```json
{
  "summary": {
    "total_transactions": 500,
    "total_volume": 2500000.00,
    "gross_platform_revenue": 75000.00,
    "gateway_fees_paid": 37875.00,
    "net_platform_revenue": 37125.00,
    "profit_margin": 1.48
  },
  "breakdown": {
    "recurring_payments": {
      "count": 350,
      "percentage": 70
    },
  },
  "trends": [
    {
      "date": "2025-11-01",
      "transactions": 15,
      "volume": 75000.00,
      "net_revenue": 1113.75
    },
    {
      "date": "2025-11-02",
      "transactions": 12,
      "volume": 60000.00,
      "net_revenue": 891.00
    }
  ],
  "late_fees": {
    "total_collected": 10000.00,
    "pending": 5000.00
  },
  "tax": {
    "total_withholding_tax": 250000.00
  }
}
```

**GET /api/v1/payments/analytics/landlord-performance**

**Purpose:** View landlord payout performance metrics

**Authentication:** Required (Admin only)

**Response (200):**
```json
{
  "average_payout_time_seconds": 45,
  "payout_success_rate": 99.5,
  "top_earners": [
    {
      "landlord_id": 10,
      "company_name": "Smith Properties Ltd",
      "total_payouts": 500000.00,
      "total_commission_paid": 10000.00,
      "transaction_count": 100,
      "average_payout_time_seconds": 30
    }
  ],
  "commission_trends": [
    {
      "month": "2025-11",
      "total_commission": 20000.00,
      "landlord_count": 50
    }
  ]
}
```

## 5. Security Implementation

### 5.1 Payment Data Protection

- **PCI DSS Compliance:** No card data stored locally; all sensitive data handled by Paystack
- **Encryption:** All API communications use HTTPS with TLS 1.3
- **Tokenization:** Payment methods stored as Paystack authorization codes only
- **Webhook Signature Verification:** HMAC-SHA512 signature validation for all webhook events

### 5.2 Authorization Controls

**Role-Based Permissions:**
```python
from rest_framework import permissions

class IsStudentOrLandlord(permissions.BasePermission):
    """
    Allow access to students and landlords only
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['student', 'landlord']
        )

class IsAdminOrLandlord(permissions.BasePermission):
    """
    Allow access to admins and landlords for revenue/analytics
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.role in ['tech_support', 'super_admin'] or
             (request.user.role == 'landlord' and request.user.landlord_profile.is_verified))
        )
```

### 5.3 Transaction Integrity

**Database Constraints and Validation:**
```python
def validate_transaction_amounts(transaction):
    """
    Ensure transaction amounts are mathematically correct
    """
    # Calculate expected amounts
    expected_total = transaction.base_rent + transaction.student_service_fee
    expected_landlord_payout = transaction.base_rent - transaction.landlord_commission

    # Validate calculations
    if transaction.total_charged_amount != expected_total:
        raise ValidationError("Total charged amount calculation error")

    if transaction.landlord_payout_amount != expected_landlord_payout:
        raise ValidationError("Landlord payout calculation error")

    # Validate fees are within acceptable ranges
    if not (0.009 <= transaction.student_service_fee / transaction.base_rent <= 0.011):
        raise ValidationError("Student service fee percentage out of range")

    if not (0.018 <= transaction.landlord_commission / transaction.base_rent <= 0.022):
        raise ValidationError("Landlord commission percentage out of range")
```

### 5.4 Audit Trail and Logging

**Payment Event Logging:**
```python
def log_payment_event(transaction, event_type, details=None):
    """
    Log all payment-related events for audit purposes
    """
    PaymentAuditLog.objects.create(
        transaction=transaction,
        event_type=event_type,
        user=request.user if hasattr(request, 'user') else None,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT'),
        details=details or {},
        timestamp=timezone.now()
    )
```

**Critical Events Logged:**
- Payment initialization
- Payment success/failure
- Webhook processing
- Refund requests
- Payout processing
- Commission calculations

---

## 6. Performance and Caching

### 6.1 Database Optimization

**Critical Indexes for Payment Queries:**
```sql
-- Transaction lookup performance
CREATE INDEX CONCURRENTLY idx_transaction_booking_status ON payments_transaction (booking_id, status);
CREATE INDEX CONCURRENTLY idx_transaction_student_status ON payments_transaction (student_id, status);
CREATE INDEX CONCURRENTLY idx_transaction_paystack_ref ON payments_transaction (paystack_reference);
CREATE INDEX CONCURRENTLY idx_transaction_paid_at ON payments_transaction (paid_at) WHERE paid_at IS NOT NULL;

-- Analytics query performance
CREATE INDEX CONCURRENTLY idx_transaction_paid_at_status ON payments_transaction (paid_at, status);
CREATE INDEX CONCURRENTLY idx_transaction_type_status ON payments_transaction (transaction_type, status);

-- Recurring payment scheduling
CREATE INDEX CONCURRENTLY idx_recurring_next_payment ON payments_recurringpayment (next_payment_date) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_recurring_status_active ON payments_recurringpayment (is_active, next_payment_date);

-- Payout processing
CREATE INDEX CONCURRENTLY idx_payout_status_created ON payments_payout (status, initiated_at);
CREATE INDEX CONCURRENTLY idx_payout_landlord_status ON payments_payout (landlord_id, status);
```

### 6.2 Redis Caching Strategy

**Payment Link Caching:**
```python
def cache_payment_link(transaction_id, payment_data, expiry_minutes=30):
    """
    Cache payment link data to reduce database hits
    """
    cache_key = f"payment_link:{transaction_id}"
    cache.set(cache_key, payment_data, timeout=expiry_minutes * 60)

def get_cached_payment_link(transaction_id):
    """
    Retrieve cached payment link
    """
    cache_key = f"payment_link:{transaction_id}"
    return cache.get(cache_key)
```

**Exchange Rate Caching (if multi-currency added later):**
```python
def cache_exchange_rates():
    """
    Cache currency exchange rates for 1 hour
    """
    rates = get_paystack_exchange_rates()
    cache.set('paystack_exchange_rates', rates, timeout=3600)
```

### 6.3 Query Optimization

**Efficient Transaction Retrieval:**
```python
def get_student_transactions(student_id, page=1, limit=20):
    """
    Optimized query with select_related and pagination
    """
    return Transaction.objects.select_related(
        'booking__room__hostel'
    ).filter(
        student_id=student_id
    ).only(
        'id', 'transaction_reference', 'total_charged_amount',
        'status', 'paid_at', 'booking__room__hostel__name'
    ).order_by('-paid_at')[offset:offset+limit]
```

---

## 7. Integration Points

### 7.1 With hostels App

**Room Reservation Flow:**
```python
# In hostels/views.py
def create_room_reservation(request, room_id):
    # Check student profile completion
    if not request.user.student_profile.is_profile_complete:
        return Response({
            'error': 'Complete your profile before booking',
            'profile_url': '/api/v1/accounts/profile'
        }, status=400)

    # Create booking (unconfirmed initially)
    booking = Booking.objects.create(
        student=request.user.student_profile,
        room_id=room_id,
        status='pending',
        # ... other fields
    )

    # Trigger payment initialization
    from payments.services import initialize_payment
    payment_response = initialize_payment(booking.id, request.user.id)

    return Response({
        'booking_id': booking.id,
        'payment_link': payment_response['payment_link'],
        'expires_at': payment_response['expires_at']
    })
```

**Booking Confirmation on Payment Success:**
```python
# In payments/webhook.py
def confirm_room_booking(booking_id, transaction_reference):
    """
    Confirm booking after successful payment
    """
    booking = Booking.objects.get(id=booking_id)
    booking.status = 'confirmed'
    booking.confirmed_at = timezone.now()
    booking.save()

    # Send confirmation notifications
    send_notification.delay(
        recipient_id=booking.student.user_id,
        notification_type='booking_confirmed',
        channel='email',
        context={
            'student_name': booking.student.user.get_full_name(),
            'room_name': booking.room.name,
            'hostel_name': booking.room.hostel.name,
            'check_in_date': booking.check_in_date.strftime('%B %d, %Y')
        }
    )
```

### 7.2 With notifications App

**Payment Status Notifications:**
```python
def send_payment_notifications(transaction, event_type):
    """
    Send appropriate notifications based on payment event
    """
    notification_map = {
        'payment_success': {
            'channel': 'email',
            'template': 'payment_success',
            'context': {
                'amount': float(transaction.total_charged_amount),
                'transaction_ref': transaction.transaction_reference
            }
        },
        'payment_failed': {
            'channel': 'email',
            'template': 'payment_failed',
            'context': {
                'amount': float(transaction.total_charged_amount),
                'failure_reason': 'insufficient_funds'  # from webhook
            }
        },
        'recurring_payment_success': {
            'channel': 'email',
            'template': 'recurring_payment_processed',
            'context': {
                'amount': float(transaction.total_charged_amount),
                'next_payment_date': transaction.recurring_payment.next_payment_date.strftime('%B %d, %Y')
            }
        }
    }

    notification_config = notification_map.get(event_type)
    if notification_config:
        send_notification.delay(
            recipient_id=transaction.student_id,
            notification_type=notification_config['template'],
            channel=notification_config['channel'],
            context=notification_config['context']
        )
```

### 7.3 With accounts App

**Profile Completion Validation:**
```python
# In payments/views.py
def initialize_payment(request):
    # Ensure student profile is complete
    if not request.user.student_profile.is_profile_complete:
        return Response({
            'error': 'Complete your profile to make payments',
            'required_fields': ['university', 'student_id', 'emergency_contact'],
            'profile_url': '/api/v1/accounts/profile'
        }, status=400)

    # Proceed with payment initialization...
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

**Payment Calculation Tests:**
```python
# payments/tests/test_calculations.py
class PaymentCalculationTest(TestCase):
    def test_fee_calculations(self):
        """Test commission and fee calculations"""
        base_rent = Decimal('5000.00')

        # Student fee: 1%
        student_fee = calculate_student_fee(base_rent)
        self.assertEqual(student_fee, Decimal('50.00'))

        # Landlord commission: 2%
        landlord_commission = calculate_landlord_commission(base_rent)
        self.assertEqual(landlord_commission, Decimal('100.00'))

        # Total charged to student
        total_charged = calculate_total_charged(base_rent)
        self.assertEqual(total_charged, Decimal('5050.00'))

        # Landlord payout
        landlord_payout = calculate_landlord_payout(base_rent)
        self.assertEqual(landlord_payout, Decimal('4900.00'))

    def test_paystack_fee_calculation(self):
        """Test Paystack fee calculation (1.5%)"""
        transaction_amount = Decimal('5050.00')
        paystack_fee = calculate_paystack_fee(transaction_amount)
        expected_fee = transaction_amount * Decimal('0.015')
        self.assertEqual(paystack_fee, expected_fee)

    def test_platform_revenue_calculation(self):
        """Test net platform revenue after fees"""
        base_rent = Decimal('5000.00')
        student_fee = Decimal('50.00')
        landlord_commission = Decimal('100.00')
        paystack_fee = Decimal('75.75')  # 1.5% of 5050

        gross_revenue = student_fee + landlord_commission  # 150
        net_revenue = gross_revenue - paystack_fee  # 150 - 75.75 = 74.25

        self.assertEqual(net_revenue, Decimal('74.25'))
```

**Webhook Handler Tests:**
```python
# payments/tests/test_webhook.py
class PaystackWebhookTest(TestCase):
    def test_successful_payment_webhook(self):
        """Test successful payment webhook processing"""
        # Create pending transaction
        transaction = Transaction.objects.create(
            booking_id=123,
            student_id=456,
            landlord_id=789,
            transaction_reference='RUMI-TXN-2025-001001',
            status='pending',
            base_rent=Decimal('5000.00'),
            # ... other fields
        )

        # Mock Paystack webhook payload
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'RUMI-TXN-2025-001001',
                'amount': 505000,  # in kobo
                'status': 'success',
                'paid_at': '2025-10-25T13:12:00Z',
                'channel': 'mobile_money',
                'fees': 7575,
                'authorization': {
                    'authorization_code': 'AUTH_abc123',
                    'last4': '5678',
                    'channel': 'mobile_money'
                }
            }
        }

        # Process webhook
        response = self.client.post(
            '/api/v1/payments/webhook',
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE='mock_signature'
        )

        # Verify transaction updated
        transaction.refresh_from_database()
        self.assertEqual(transaction.status, 'success')
        self.assertIsNotNone(transaction.paystack_reference)
        self.assertIsNotNone(transaction.paid_at)

    def test_duplicate_webhook_handling(self):
        """Test idempotent handling of duplicate webhooks"""
        # Create successful transaction
        transaction = Transaction.objects.create(
            transaction_reference='RUMI-TXN-2025-001001',
            status='success',
            # ... other fields
        )

        # Send duplicate webhook
        payload = {
            'event': 'charge.success',
            'data': {'reference': 'RUMI-TXN-2025-001001'}
        }

        response = self.client.post('/api/v1/payments/webhook', payload)

        # Should return 200 without error
        self.assertEqual(response.status_code, 200)
        # Transaction should remain unchanged
        transaction.refresh_from_database()
        self.assertEqual(transaction.status, 'success')
```

### 8.2 Integration Tests

**End-to-End Payment Flow:**
```python
# payments/tests/test_integration.py
class PaymentIntegrationTest(APITestCase):
    def test_complete_payment_flow(self):
        """Test full booking to payment confirmation flow"""
        # Setup test data
        student = create_test_student()
        room = create_test_room()
        self.client.force_authenticate(user=student.user)

        # 1. Create booking
        booking_response = self.client.post(f'/api/v1/hostels/rooms/{room.id}/book')
        self.assertEqual(booking_response.status_code, 201)
        booking_id = booking_response.data['booking_id']

        # 2. Initialize payment
        payment_response = self.client.post('/api/v1/payments/initialize', {
            'booking_id': booking_id,
            'payment_plan': 'monthly'
        })
        self.assertEqual(payment_response.status_code, 201)
        transaction_id = payment_response.data['transaction_id']

        # 3. Simulate Paystack webhook
        webhook_payload = create_successful_payment_webhook(transaction_id)
        webhook_response = self.client.post(
            '/api/v1/payments/webhook',
            webhook_payload,
            HTTP_X_PAYSTACK_SIGNATURE='valid_signature'
        )
        self.assertEqual(webhook_response.status_code, 200)

        # 4. Verify booking confirmed
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'confirmed')

        # 5. Verify transaction completed
        transaction = Transaction.objects.get(id=transaction_id)
        self.assertEqual(transaction.status, 'success')

        # 6. Verify payout created
        payout = Payout.objects.get(transaction_id=transaction_id)
        self.assertEqual(payout.status, 'pending')
```

### 8.3 Load Testing

**Payment Processing Load Test:**
```python
# payments/tests/test_load.py
import concurrent.futures
from django.test import override_settings

class PaymentLoadTest(TestCase):
    @override_settings(CELERY_ALWAYS_EAGER=True)  # Run tasks synchronously
    def test_concurrent_payment_processing(self):
        """Test handling multiple simultaneous payments"""
        # Create multiple test bookings
        bookings = []
        for i in range(10):
            booking = create_test_booking()
            bookings.append(booking)

        # Process payments concurrently
        def process_payment(booking):
            return initialize_payment(booking.id, booking.student_id)

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_payment, booking) for booking in bookings]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        # Verify all payments initialized successfully
        self.assertEqual(len(results), 10)
        for result in results:
            self.assertIn('payment_link', result)
            self.assertIn('transaction_id', result)

    def test_webhook_flood_protection(self):
        """Test handling of multiple rapid webhook events"""
        transaction = create_test_transaction()

        # Send multiple webhooks rapidly
        webhook_payload = create_successful_payment_webhook(transaction.id)

        for i in range(10):
            response = self.client.post('/api/v1/payments/webhook', webhook_payload)
            self.assertEqual(response.status_code, 200)

        # Verify transaction processed only once
        transaction.refresh_from_database()
        self.assertEqual(transaction.status, 'success')
        # Check audit log has only one success entry
```

---

## 9. Migration Strategy

### 9.1 Database Migration Plan

**Initial Migration:**
```sql
-- Create payments app tables
BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables in dependency order
\i payments/migrations/0001_initial.sql

COMMIT;
```

**Data Migration for Existing Bookings:**
```python
# payments/migrations/0002_data_migration.py
def migrate_existing_booking_payments(apps, schema_editor):
    """
    Migrate existing booking payment data to new transaction model
    """
    Booking = apps.get_model('hostels', 'Booking')
    Transaction = apps.get_model('payments', 'Transaction')

    # Get bookings with payment data
    paid_bookings = Booking.objects.filter(
        payment_status__in=['paid', 'completed'],
        payment_amount__isnull=False
    )

    for booking in paid_bookings:
        # Create transaction record
        Transaction.objects.create(
            booking_id=booking.id,
            student_id=booking.student_id,
            landlord_id=booking.room.hostel.landlord_id,
            transaction_reference=f"MIGRATED-{booking.id}",
            paystack_reference=booking.paystack_reference,
            transaction_type='initial',
            payment_plan='monthly',
            base_rent=booking.payment_amount,
            student_service_fee=booking.payment_amount * Decimal('0.01'),
            total_charged_amount=booking.payment_amount * Decimal('1.01'),
            landlord_commission=booking.payment_amount * Decimal('0.02'),
            landlord_payout_amount=booking.payment_amount * Decimal('0.98'),
            gross_platform_revenue=booking.payment_amount * Decimal('0.03'),
            status='success',
            paid_at=booking.paid_at or booking.updated_at,
            metadata={'migrated': True}
        )

        # Update booking reference
        booking.payment_transaction_id = transaction.id
        booking.save()
```

### 9.2 Rollback Strategy

**Feature Flags for Safe Deployment:**
```python
# settings.py
PAYMENTS_FEATURE_ENABLED = os.getenv('PAYMENTS_FEATURE_ENABLED', 'false').lower() == 'true'

# In views.py
if not settings.PAYMENTS_FEATURE_ENABLED:
    return Response({
        'error': 'Payment feature temporarily unavailable'
    }, status=503)
```

**Rollback Procedures:**
```bash
# Rollback database migrations
python manage.py migrate payments 0001

# Revert feature flag
export PAYMENTS_FEATURE_ENABLED=false

# Restart application
docker-compose restart web

# Monitor for errors
tail -f logs/django.log
```

---

## 10. API Response Examples

### 10.1 Error Response Format

**Standardized Error Structure:**
```json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment processing failed",
    "details": {
      "transaction_id": 1001,
      "failure_reason": "insufficient_funds"
    },
    "timestamp": "2025-11-05T10:30:00Z",
    "request_id": "req_abc123xyz"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Input validation failed
- `PAYMENT_FAILED`: Payment processing error
- `INSUFFICIENT_FUNDS`: Student has insufficient balance
- `DUPLICATE_TRANSACTION`: Transaction already exists
- `WEBHOOK_INVALID`: Invalid webhook signature
- `RATE_LIMIT_EXCEEDED`: Too many requests

### 10.2 Success Response Format

**Standardized Success Structure:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "transaction_id": 1001,
    "payment_link": "https://paystack.com/pay/rumi_abc123"
  },
  "meta": {
    "timestamp": "2025-11-05T10:30:00Z",
    "request_id": "req_abc123xyz"
  }
}
```

---

## 11. Compliance and Data Protection

### 11.1 Kenya Financial Regulations

**Financial Transaction Reporting:**
- All transactions over KES 1,000,000 require reporting
- Monthly withholding tax reports for landlords
- Transaction audit trail maintained for 7 years

**Consumer Protection:**
- Clear fee disclosure before payment
- Refund policy clearly stated
- Dispute resolution process documented

### 11.2 Data Retention Policy

**Transaction Data:**
- Successful transactions: 7 years (Kenyan tax law requirement)
- Failed transactions: 2 years
- Webhook logs: 1 year

**Payment Method Data:**
- Tokenized data: Indefinite (until revoked by user)
- Failed payment attempts: 90 days

---

## 12. Deployment Considerations

### 12.1 Environment Configuration

```bash
# .env.production
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...

PLATFORM_FEE_STUDENT=0.01
PLATFORM_FEE_LANDLORD=0.02
PAYSTACK_FEE_RATE=0.015
WITHHOLDING_TAX_RATE=0.10

REDIS_URL=redis://payment-redis:6379/1
PAYMENT_CACHE_TIMEOUT=1800

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PAYMENT_SUCCESS_ALERT_THRESHOLD=0.99
```

### 12.2 Database Configuration

**Connection Pooling:**
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'rumi_payments',
        'USER': 'payment_user',
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': 'payment-db',
        'PORT': '5432',
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}
```

**Read Replicas for Analytics:**
```python
# For heavy analytics queries
PAYMENT_ANALYTICS_DB = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'rumi_analytics',
    'USER': 'analytics_user',
    # ... read replica configuration
}

# Router for analytics queries
class PaymentAnalyticsRouter:
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'payments' and model.__name__ == 'RevenueAnalytics':
            return 'analytics'
        return 'default'
```

---

## 13. Monitoring and Alerts

### 13.1 Key Metrics

**Payment Success Metrics:**
- Payment success rate (target: >99% for initial, >95% for recurring)
- Average payment processing time (<30 seconds)
- Webhook processing success rate (>99.9%)

**Business Metrics:**
- Monthly transaction volume
- Platform revenue growth
- Recurring payment adoption rate
- Late fee collection rate

### 13.2 Alert Configuration

**Critical Alerts:**
```python
# payments/monitoring.py
PAYMENT_ALERTS = {
    'payment_success_rate_low': {
        'threshold': 0.95,
        'message': 'Payment success rate below 95%',
        'channels': ['slack', 'email'],
        'escalation': 'page_on_call'
    },
    'webhook_processing_failed': {
        'threshold': 5,  # failures per hour
        'message': 'High webhook processing failures',
        'channels': ['slack'],
        'escalation': 'create_ticket'
    },
    'payout_delayed': {
        'threshold': 24,  # hours
        'message': 'Landlord payout delayed over 24 hours',
        'channels': ['email'],
        'escalation': 'notify_finance'
    }
}

def check_payment_health():
    """
    Periodic health check function
    """
    # Check payment success rate (last hour)
    recent_transactions = Transaction.objects.filter(
        initiated_at__gte=timezone.now() - timedelta(hours=1)
    )

    if recent_transactions.exists():
        success_rate = recent_transactions.filter(status='success').count() / recent_transactions.count()

        if success_rate < PAYMENT_ALERTS['payment_success_rate_low']['threshold']:
            trigger_alert('payment_success_rate_low', {
                'success_rate': success_rate,
                'transaction_count': recent_transactions.count()
            })

    # Check webhook processing
    recent_webhooks = WebhookLog.objects.filter(
        created_at__gte=timezone.now() - timedelta(hours=1),
        status='failed'
    )

    if recent_webhooks.count() >= PAYMENT_ALERTS['webhook_processing_failed']['threshold']:
        trigger_alert('webhook_processing_failed', {
            'failure_count': recent_webhooks.count()
        })
```

**Sentry Integration:**
```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    environment='production',
    before_send=filter_payment_data
)

def filter_payment_data(event, hint):
    """
    Remove sensitive payment data from Sentry events
    """
    if 'request' in event and 'data' in event['request']:
        data = event['request']['data']

        # Remove card numbers, CVV, etc.
        sensitive_fields = ['card_number', 'cvv', 'pin', 'otp']
        for field in sensitive_fields:
            if field in data:
                data[field] = '[FILTERED]'

    return event
```

---

## 14. Documentation Links

### 14.1 Internal Documentation
- API Documentation: `/api/v1/docs/` (Swagger UI)
- Payment Processing Guide: `docs/payment-flow.md`
- Troubleshooting Guide: `docs/payment-troubleshooting.md`
- Admin Manual: `docs/admin-payment-manual.md`

### 14.2 External Resources
- Paystack API Documentation: https://paystack.com/docs/
- PCI DSS Guidelines: https://www.pcisecuritystandards.org/
- Kenya Revenue Authority: https://kra.go.ke/

---

## 15. Summary

The **Payments App v1.6** provides a comprehensive, secure, and automated payment processing system for the RUMI platform. Key features include:

**Core Payment Processing:**
- Paystack integration with M-Pesa Paybill support
- Dual commission structure (1% student fee + 2% landlord fee)
- Automated landlord payouts via subaccounts
- Webhook-based payment verification

**Advanced Features:**
- Recurring payment auto-debit
- Grace period and late fee management
- Tax reporting and withholding compliance
- Revenue analytics and performance metrics

**Security & Compliance:**
- PCI DSS compliance through Paystack
- Comprehensive audit trails
- Role-based access control
- Data encryption and protection

**Performance & Reliability:**
- Idempotent webhook processing
- Database optimization and caching
- Comprehensive monitoring and alerting
- Load testing and scalability considerations

**Integration Points:**
- Seamless integration with accounts, hostels, and notifications apps
- Automated booking confirmation on payment success
- Real-time payment status updates

**Next Steps:**
- Review and approve this specification
- Proceed to implementation planning
- Schedule security audit and compliance review

---

**Document Owner:** Joseph Ogutu, CTO
**Last Updated:** November 12, 2025
**Version:** 1.6 (Complete Technical Specification)
**Status:** Ready for Implementation

## 5. Error Handling and Edge Cases

### 5.1 Payment Failures

- **Webhook Retries:** Paystack automatically retries failed webhook deliveries up to 5 times
- **Idempotency:** Duplicate webhook events are safely ignored using transaction references
- **Timeout Handling:** Payment links expire after 30 minutes to prevent stale charges
- **Currency Mismatches:** All transactions validated for KES currency consistency

### 5.2 Edge Cases

- **Concurrent Bookings:** Database constraints prevent double-booking of rooms
- **Partial Payments:** Not supported; all payments must be for full amounts
- **Refund Scenarios:** Only processed for booking cancellations within 24 hours
- **Tax Calculation Errors:** Automatic reconciliation monthly with manual override capability

### 5.3 Failure Recovery

- **Recurring Payment Failures:** Automatic retry next day, disable after 3 failures
- **Payout Failures:** Manual intervention required with notification to finance team
- **Webhook Processing Errors:** Logged and alerted to developers via Sentry

---

## 6. Security Considerations

### 6.1 Data Protection

- **PCI Compliance:** No card data stored locally; all sensitive data handled by Paystack
- **Encryption:** All API communications use HTTPS with TLS 1.3
- **Tokenization:** Payment methods stored as Paystack authorization codes only

### 6.2 Authentication & Authorization

- **Webhook Verification:** Paystack signature validation on all webhook endpoints
- **Role-Based Access:** Strict permission checks (students vs landlords vs admins)
- **Rate Limiting:** API endpoints protected against abuse (100 requests/hour per user)

### 6.3 Audit Trail

- **Transaction Logging:** All payment attempts logged with full metadata
- **Change Tracking:** Django admin history for all model changes
- **Compliance:** Full audit logs maintained for 7 years per Kenyan regulations

---

## 7. Testing Strategy

### 7.1 Unit Tests

```python
# payments/tests/test_models.py
class TransactionModelTest(TestCase):
    def test_transaction_constraints(self):
        # Test fee calculation constraints
        transaction = Transaction.objects.create(...)
        self.assertEqual(transaction.student_service_fee, transaction.base_rent * 0.01)

# payments/tests/test_views.py
class PaymentAPITest(TestCase):
    def test_payment_initialization(self):
        # Test payment link generation
        response = self.client.post('/api/v1/payments/initialize', {...})
        self.assertEqual(response.status_code, 201)
```

### 7.2 Integration Tests

- **Paystack Mocking:** Use Paystack test keys for integration testing
- **Webhook Simulation:** Test webhook handlers with mock payloads
- **End-to-End Flows:** Complete booking → payment → confirmation cycles

### 7.3 Load Testing

- **Peak Payment Times:** Simulate high concurrent payment processing
- **Webhook Flood:** Test handling of multiple simultaneous webhook events
- **Performance Benchmarks:** Ensure <2 second response times for payment APIs

---

## 8. Monitoring and Alerting

### 8.1 Key Metrics

- **Payment Success Rate:** Target >99% for initial payments, >95% for recurring
- **Webhook Processing Time:** Alert if >30 seconds average
- **Payout Settlement Time:** Track and alert on delays >24 hours
- **Platform Revenue Margin:** Monitor for gateway fee changes

### 8.2 Alerts

- **Payment Failures:** Slack alerts for >5% failure rate in any hour
- **System Downtime:** Immediate alerts for payment service unavailability
- **Revenue Anomalies:** Daily variance analysis with alerts on >20% changes

### 8.3 Logging

- **Structured Logging:** JSON format with correlation IDs
- **Log Aggregation:** ELK stack for centralized log management
- **Retention:** Payment logs retained for 7 years

---

## 9. Deployment and Operations

### 9.1 Environment Configuration

```bash
# .env.production
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_STUDENT=0.01
PLATFORM_FEE_LANDLORD=0.02
PAYSTACK_FEE_RATE=0.015
WITHHOLDING_TAX_RATE=0.10
```

### 9.2 Database Migrations

```sql
-- Migration for adding withholding tax
ALTER TABLE payments_transaction ADD COLUMN withholding_tax NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE payments_payout ADD COLUMN withholding_tax_deducted NUMERIC(10,2) DEFAULT 0.00;
```

### 9.3 Rollback Procedures

- **Payment Feature Rollback:** Feature flags to disable new payment flows
- **Database Rollback:** Point-in-time recovery with automated backups
- **Third-Party Rollback:** Paystack configuration changes can be reverted instantly

---

## 10. Future Enhancements

### 10.1 Planned Features

- **Multi-Currency Support:** USD/EUR payments for international students
- **Installment Plans:** Flexible payment schedules beyond monthly
- **Mobile Money Integration:** Direct integration with M-Pesa, Airtel Money
- **Advanced Analytics:** Machine learning for payment risk assessment

### 10.2 Scalability Improvements

- **Microservices Architecture:** Separate payment service for high throughput
- **Database Sharding:** Horizontal scaling for transaction tables
- **Caching Layer:** Redis caching for payment analytics queries

### 10.3 Compliance Updates

- **Regulatory Changes:** Automated updates for tax rate changes
- **Enhanced KYC:** Additional verification for high-value landlords
- **GDPR Compliance:** Right to erasure for payment data

---

## 11. API Reference

### 11.1 Authentication

All API endpoints require JWT authentication with role-based permissions:

```javascript
const headers = {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
};
```

### 11.2 Rate Limits

- Student endpoints: 100 requests/hour
- Landlord endpoints: 200 requests/hour
- Admin endpoints: 1000 requests/hour
- Webhook endpoint: Unlimited (Paystack controlled)

### 11.3 Error Response Format

```json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment processing failed",
    "details": {
      "transaction_id": 1001,
      "failure_reason": "insufficient_funds"
    }
  }
}
```

---

**Document Version:** 1.6
**Last Updated:** November 2025
**Authors:** RUMI Platform Development Team
**Reviewers:** Finance, Compliance, and Engineering Leads

This technical specification provides comprehensive guidance for the implementation and maintenance of the payments system. All changes must be reviewed and approved by the architecture review board.

### 4.1 Recurring Payment Processing (Celery Task)

**Task Name:** process_recurring_payments

**Schedule:** Every day at 6:00 AM

**Purpose:** Charge students with active recurring payments due today

**Logic:**
```python
@shared_task
def process_recurring_payments():
    """
    Process all recurring payments due today
    """
    today = timezone.now().date()

    # Find active recurring payments due today
    due_payments = RecurringPayment.objects.filter(
        is_active=True,
        next_payment_date=today
    ).select_related('booking', 'student', 'saved_payment_method')

    results = {
        'total_due': len(due_payments),
        'successful': 0,
        'failed': 0,
        'errors': []
    }

    for recurring in due_payments:
        try:
            # Charge saved payment method via Paystack
            charge_result = charge_saved_payment_method(
                recurring_payment=recurring,
                amount=recurring.rent_amount
            )

            if charge_result['status'] == 'success':
                # Update recurring payment schedule
                recurring.last_payment_at = timezone.now()
                recurring.next_payment_date = today + timedelta(days=30)
                recurring.consecutive_failures = 0
                recurring.save()

                results['successful'] += 1

                # Send success notification
                send_notification.delay(
                    recipient_id=recurring.student.user_id,
                    notification_type='recurring_payment_success',
                    channel='email',
                    context={
                        'student_name': recurring.student.user.first_name,
                        'amount': float(recurring.rent_amount),
                        'next_payment_date': recurring.next_payment_date.strftime('%B %d, %Y')
                    }
                )

            else:
                # Handle failure
                recurring.consecutive_failures += 1
                recurring.save()

                results['failed'] += 1

                # Send failure notification
                send_notification.delay(
                    recipient_id=recurring.student.user_id,
                    notification_type='recurring_payment_failed',
                    channel='email',
                    context={
                        'student_name': recurring.student.user.first_name,
                        'amount': float(recurring.rent_amount),
                        'failure_reason': charge_result.get('message'),
                        'retry_manually_link': f"https://rumi.co.ke/bookings/{recurring.booking_id}"
                    }
                )

                # Disable after 3 consecutive failures
                if recurring.consecutive_failures >= 3:
                    recurring.is_active = False
                    recurring.save()

                    send_notification.delay(
                        recipient_id=recurring.student.user_id,
                        notification_type='recurring_payment_disabled',
                        channel='email',
                        context={
                            'student_name': recurring.student.user.first_name
                        }
                    )

        except Exception as e:
            logger.error(f"Error processing recurring payment {recurring.id}: {e}")
            results['errors'].append({
                'recurring_id': recurring.id,
                'error': str(e)
            })
            continue

    # Send admin summary
    if results['failed'] > 0:
        send_notification.delay(
            recipient_id=settings.FINANCE_ADMIN_ID,
            notification_type='recurring_payments_summary',
            channel='email',
            context=results
        )

    return results
```

### 4.2 Late Fee Assessment (Celery Task)

**Task Name:** assess_late_fees

**Schedule:** Every day at midnight

**Purpose:** Charge late fees for overdue rent payments

**Logic:**
```python
@shared_task
def assess_late_fees():
    """
    Assess late fees for rent payments past grace period
    """
    today = timezone.now().date()

    # Find active recurring payments past grace period
    overdue_payments = RecurringPayment.objects.filter(
        is_active=True,
        next_payment_date__lt=today - timedelta(days=7)  # Grace period expired
    ).exclude(
        booking__late_fees__status='pending'  # Don't charge twice
    )

    late_fees_charged = 0

    for recurring in overdue_payments:
        grace_period_end = recurring.next_payment_date + timedelta(days=recurring.grace_period_days)

        if today > grace_period_end:
            # Create late fee charge
            late_fee = LateFeeCharge.objects.create(
                booking_id=recurring.booking_id,
                student_id=recurring.student_id,
                late_fee_amount=recurring.late_fee_amount,
                due_date=recurring.next_payment_date,
                grace_period_end=grace_period_end,
                status='pending'
            )

            late_fees_charged += 1

            # Send notification
            send_notification.delay(
                recipient_id=recurring.student.user_id,
                notification_type='late_fee_charged',
                channel='email',
                context={
                    'student_name': recurring.student.user.first_name,
                    'late_fee_amount': float(recurring.late_fee_amount),
                    'original_due_date': recurring.next_payment_date.strftime('%B %d, %Y'),
                    'days_overdue': (today - grace_period_end).days
                }
            )

            # Also send SMS (critical notification)
            send_notification.delay(
                recipient_id=recurring.student.user_id,
                notification_type='late_fee_charged',
                channel='sms',
                context={
                    'first_name': recurring.student.user.first_name,
                    'late_fee_amount': float(recurring.late_fee_amount)
                }
            )

    return {
        'late_fees_charged': late_fees_charged,
        'timestamp': timezone.now().isoformat()
    }
```

### 4.3 Tax Report Generation (Celery Task)

**Task Name:** generate_monthly_tax_reports

**Schedule:** 1st day of every month at 1:00 AM

**Purpose:** Generate withholding tax reports for all landlords

**Logic:**
```python
@shared_task
def generate_monthly_tax_reports():
    """
    Generate tax reports for previous month
    """
    # Previous month
    today = timezone.now().date()
    report_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1)

    # Get all landlords with transactions last month
    landlords_with_transactions = Transaction.objects.filter(
        status='success',
        paid_at__gte=report_month,
        paid_at__lt=report_month + timedelta(days=32)
    ).values('landlord_id').distinct()

    reports_generated = 0

    for landlord_data in landlords_with_transactions:
        landlord_id = landlord_data['landlord_id']

        # Aggregate transactions
        transactions = Transaction.objects.filter(
            landlord_id=landlord_id,
            status='success',
            paid_at__gte=report_month,
            paid_at__lt=report_month + timedelta(days=32)
        )

        total_rent = transactions.aggregate(
            total=Sum('base_rent')
        )['total'] or Decimal('0.00')

        total_tax = total_rent * Decimal('0.10')
        transaction_count = transactions.count()

        # Create tax report record
        tax_report = TaxReport.objects.create(
            landlord_id=landlord_id,
            report_month=report_month,
            total_rent_received=total_rent,
            total_withholding_tax=total_tax,
            transaction_count=transaction_count
        )

        # Generate PDF report
        pdf_url = generate_tax_report_pdf(tax_report, transactions)
        tax_report.report_file_url = pdf_url
        tax_report.save()

        reports_generated += 1

        # Send notification to landlord
        landlord = LandlordProfile.objects.get(id=landlord_id)
        send_notification.delay(
            recipient_id=landlord.user_id,
            notification_type='tax_report_ready',
            channel='email',
            context={
                'landlord_name': landlord.company_name or landlord.user.get_full_name(),
                'report_month': report_month.strftime('%B %Y'),
                'total_rent': float(total_rent),
                'total_tax': float(total_tax),
                'download_link': f"https://rumi.co.ke/api/v1/payments/tax-reports/{tax_report.id}/download"
            }
        )

    return {
        'reports_generated': reports_generated,
        'report_month': report_month.strftime('%Y-%m')
    }
```

### 4.4 Revenue Analytics Aggregation (Celery Task)

**Task Name:** aggregate_revenue_analytics

**Schedule:** Daily at 11:59 PM

**Purpose:** Pre-calculate revenue metrics for dashboard performance

**Logic:**
```python
@shared_task
def aggregate_revenue_analytics():
    """
    Aggregate daily revenue metrics
    """
    today = timezone.now().date()

    # Daily aggregation
    daily_transactions = Transaction.objects.filter(
        status='success',
        paid_at__date=today
    )

    daily_stats = daily_transactions.aggregate(
        total_transactions=Count('id'),
        total_volume=Sum('base_rent'),
        gross_revenue=Sum('gross_platform_revenue'),
        gateway_fees=Sum('gateway_fee'),
        net_revenue=Sum('net_platform_revenue')
    )

    # Additional aggregations for complete metrics
    recurring_payments_count = daily_transactions.filter(
        transaction_type='recurring'
    ).count()

    late_fees_collected = Transaction.objects.filter(
        status='success',
        paid_at__date=today,
        transaction_type='late_fee'
    ).aggregate(
        total=Sum('base_rent')
    )['total'] or Decimal('0.00')

    withholding_tax_collected = daily_transactions.aggregate(
        total=Sum('withholding_tax')
    )['withholding_tax__sum'] or Decimal('0.00')

    # Create daily revenue analytics record
    RevenueAnalytics.objects.update_or_create(
        date=today,
        period_type='daily',
        defaults={
            'total_transactions': daily_stats['total_transactions'] or 0,
            'total_volume': daily_stats['total_volume'] or Decimal('0.00'),
            'gross_platform_revenue': daily_stats['gross_revenue'] or Decimal('0.00'),
            'gateway_fees_paid': daily_stats['gateway_fees'] or Decimal('0.00'),
            'net_platform_revenue': daily_stats['net_revenue'] or Decimal('0.00'),
            'recurring_payments_count': recurring_payments_count,
            'late_fees_collected': late_fees_collected,
            'total_withholding_tax': withholding_tax_collected
        }
    )

    # Weekly aggregation (every Sunday)
    if today.weekday() == 6:  # Sunday
        week_start = today - timedelta(days=6)
        weekly_stats = aggregate_period_stats(week_start, today, 'weekly')

    # Monthly aggregation (last day of month)
    if today == (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1):
        month_start = today.replace(day=1)
        monthly_stats = aggregate_period_stats(month_start, today, 'monthly')

    return {
        'daily_processed': True,
        'weekly_processed': today.weekday() == 6,
        'monthly_processed': today == (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1),
        'date': today.isoformat()
    }


def aggregate_period_stats(start_date, end_date, period_type):
    """
    Helper function to aggregate stats for a date range
    """
    period_transactions = Transaction.objects.filter(
        status='success',
        paid_at__date__gte=start_date,
        paid_at__date__lte=end_date
    )

    stats = period_transactions.aggregate(
        total_transactions=Count('id'),
        total_volume=Sum('base_rent'),
        gross_revenue=Sum('gross_platform_revenue'),
        gateway_fees=Sum('gateway_fee'),
        net_revenue=Sum('net_platform_revenue'),
        withholding_tax=Sum('withholding_tax')
    )

    recurring_count = period_transactions.filter(transaction_type='recurring').count()

    late_fees = Transaction.objects.filter(
        status='success',
        paid_at__date__gte=start_date,
        paid_at__date__lte=end_date,
        transaction_type='late_fee'
    ).aggregate(total=Sum('base_rent'))['total'] or Decimal('0.00')

    # Determine the date key for the period
    if period_type == 'weekly':
        date_key = start_date
    elif period_type == 'monthly':
        date_key = start_date
    else:
        date_key = end_date

    RevenueAnalytics.objects.update_or_create(
        date=date_key,
        period_type=period_type,
        defaults={
            'total_transactions': stats['total_transactions'] or 0,
            'total_volume': stats['total_volume'] or Decimal('0.00'),
            'gross_platform_revenue': stats['gross_revenue'] or Decimal('0.00'),
            'gateway_fees_paid': stats['gateway_fees'] or Decimal('0.00'),
            'net_platform_revenue': stats['net_revenue'] or Decimal('0.00'),
            'recurring_payments_count': recurring_count,
            'late_fees_collected': late_fees,
            'total_withholding_tax': stats['withholding_tax'] or Decimal('0.00')
        }
    )

    return stats
