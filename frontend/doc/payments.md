# Rumia Payments System: Production-Grade Audit & Architecture Blueprint

**Document Version**: 1.0  
**Date**: 2026-02-07  
**Prepared By**: Senior Fintech Architecture Team  
**Classification**: INTERNAL - CRITICAL INFRASTRUCTURE

---

## Executive Summary

This document outlines the **Rumia Payments Microservice** architecture, a production-grade fintech system handling real money across a multi-tenant property platform.

**Current State**: Rumia has successfully implemented the core financial infrastructure, including the `RentPeriod` model for cyclic rent obligations, the `StudentPaymentTracker` (Wallet), and the `SubscriptionBillingEngine` for per-occupied-bed landlord billing.

**Hardening Roadmap**: Having built the foundation, the focus now shifts to **Multi-Tenant Hardening**. This includes refactoring the M-Pesa integration for per-hostel Paybill isolation, implementing a distributed ledger for per-bed attribution, and enterprise-grade observability.

**Current Status & Hardening Focus**:
- ✅ **Bed & Occupancy Models** - Implemented and active.
- ✅ **Subscription Billing Engine** - Implemented (Daily snapshots + Monthly invoicing).
- ✅ **Tenant Wallet System** - Implemented via `StudentPaymentTracker`.
- [/] **Multi-tenant isolation** - Hardening required for M-Pesa shortcode routing.
- [/] **Per-bed payment ledger** - Hardening required for automated attribution mapping.
- [/] **Observability** - Metrics (`metrics.py`) implemented; dashboards pending.

---

## Table of Contents

1. [A. Microservice Architecture & Boundaries](#a-microservice-architecture--boundaries)
2. [B. Per-Hostel Paybill/Till Configuration](#b-per-hostel-paybilltill-configuration)
3. [C. End-to-End Payment Flow (Per Hostel)](#c-end-to-end-payment-flow-per-hostel)
4. [D. Per-Bed Payment Tracking](#d-per-bed-payment-tracking)
5. [E. Landlord Subscription Billing Engine](#e-landlord-subscription-billing-engine)
6. [F. Receipts, Notifications & Trust](#f-receipts-notifications--trust)
7. [G. M-PESA Integration (Multi-Tenant)](#g-m-pesa-integration-multi-tenant)
8. [H. Database & Ledger Design](#h-database--ledger-design)
9. [I. Observability, Auditing & Support Tooling](#i-observability-auditing--support-tooling)
10. [J. Edge Cases & Failure Scenarios](#j-edge-cases--failure-scenarios)
11. [Production Readiness Checklist](#production-readiness-checklist)
12. [Risk Register](#risk-register)

---

## A. Microservice Architecture & Boundaries

### 1. Current State

**Architecture**: Django monolith with `payments` app colocated alongside `hostels`, `accounts`, `notifications`.

**Evidence from codebase**:
- `Backend/payments/` is a Django app, not a standalone service
- Direct database joins between `Transaction`, `Booking`, `RentPeriod`, `Room`, `Hostel`
- Tight coupling: `process_confirmed_payment()` imports from `hostels.lifecycle_services`
- Synchronous service-to-service calls within the monolith
- No message queue or event bus

**API Contracts**: RESTful endpoints in `payments/views.py` (92KB, 2400+ lines)

**Common Anti-Pattern**: "Distributed Monolith" - splitting services without proper boundaries leads to network latency and transaction complexity.

### 2. Gaps & Risks

| Gap | Risk | Severity |
|-----|------|----------|
| No service boundaries | Cannot scale payments independently | **CRITICAL** |
| No event-driven architecture | Tight coupling, cascading failures | **CRITICAL** |
| No API gateway | No rate limiting per tenant | **MAJOR** |
| Direct DB joins across domains | Cannot extract payments to separate DB | **MAJOR** |
| No async message processing | Webhook spikes can overwhelm server | **CRITICAL** |
| No idempotency at service layer | Duplicate payments if retries occur | **CRITICAL** |

### 3. Root Causes

- **Premature Optimization Avoidance**: Started with monolith ("we'll extract later")
- **Lack of Domain-Driven Design**: No bounded contexts defined
- **Missing Event Storming**: Payment workflows not mapped as events

### 4. Severity: **CRITICAL**

Without microservice boundaries, you cannot:
- Scale M-Pesa callback processing independently
- Isolate payment failures from hostel search
- Deploy payment fixes without redeploying entire monolith
- Achieve PCI DSS or financial audit compliance

###
athi Backpackers Hostel"
  },
  "occupancy_history": [
    {
      "student_name": "John Doe",
      "moved_in": "2024-01-01",
      "moved_out": null,
      "is_current": true
    }
  ],
  "payment_ledger": [
    {
      "transaction_id": "txn_abc123",
      "date": "2024-01-15",
      "amount": "15000.00",
      "allocated_to_period": "2024-01-01 to 2024-01-31",
      "mpesa_receipt": "QDJ9J3W45H",
      "student_name": "John Doe"
    }
  ],
  "totals": {
    "total_allocated": "15000.00",
    "expected_rent": "15000.00",
    "balance": "0.00"
  }
}
```

---

## E. Landlord Subscription Billing Engine

### 1. Current State

**Subscription Billing**: **DOES NOT EXIST**

**Evidence from codebase audit**:
- ❌ No `SubscriptionInvoice` model
- ❌ No `SubscriptionBillingEngine` service
- ❌ No per-bed occupancy tracking for billing
- ❌ No landlord subscription dashboard
- ❌ No automated billing cron jobs for landlords

**Current Revenue Model** (likely):
- Platform takes 3% fee per transaction (from `Transaction.platform_fee` property)
- No recurring subscription billed to landlords

### 2. Gaps & Risks

| Gap | Risk | Severity |
|-----|------|----------|
| No subscription billing engine | Platform loses primary revenue stream | **CRITICAL** |
| No occupied bed tracking | Cannot calculate subscription accurately | **CRITICAL** |
| No subscription preview for landlords | Landlords surprised by bills | **MAJOR** |
| No pro-rated billing logic | Incorrect charges for partial months | **MAJOR** |
| No subscription payment enforcement | Landlords can use platform for free | **CRITICAL** |
| No invoicing system | No audit trail for subscription charges | **MAJOR** |

### 3. Root Causes

- **Business Model Not Implemented**: Subscription billing was planned but never built
- **Lack of Bed Model**: Cannot count occupied beds without `Bed` model
- **Priority Mismatch**: Student payments prioritized over landlord billing

### 4. Severity: **CRITICAL**

**Business Impact**: Without landlord subscription billing, the platform has no recurring revenue. This is a **fundamental business model failure**.

### 5. Recommendations

**Subscription Billing Model**:

**Subscription Tier**:
- **Per Occupied Bed Pricing**: KES 500/bed/month
- **Billing Cycle**: Monthly (1st of every month)
- **Pro-Rating**: Daily pro-rating for mid-month changes
- **Grace Period**: 7 days from invoice date
- **Enforcement**: Hostel listing hidden after 14 days non-payment

**Example Calculation**:
- **Hostel**: Kimathi Backpackers (50 beds total)
- **January Occupancy**:
  - Days 1-15: 30 beds occupied
  - Days 16-31: 35 beds occupied (5 new students moved in)
- **Calculation**:
  - Period 1 (15 days): 30 beds × 500 × (15/31) = KES 7,258.06
  - Period 2 (16 days): 35 beds × 500 × (16/31) = KES 9,032.26
  - **Total Invoice**: KES 16,290.32

### 6. Example Implementation

#### Subscription Models

```python
class SubscriptionPlan(models.Model):
    """Subscription pricing plans"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    name = models.CharField(max_length=100)  # "Per-Bed Monthly"
    pricing_model = models.CharField(choices=[
        ('per_bed', 'Per Occupied Bed'),
        ('per_room', 'Per Room'),
        ('flat_rate', 'Flat Rate')
    ])
    
    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # 500.00
    currency = models.CharField(max_length=3, default='KES')
    
    # Billing Cycle
    billing_frequency = models.CharField(choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual')
    ])
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class SubscriptionInvoice(models.Model):
    """Invoices for landlord subscriptions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Core References
    hostel = models.ForeignKey('hostels.Hostel', related_name='subscription_invoices')
    landlord = models.ForeignKey('accounts.LandlordProfile', related_name='subscription_invoices')
    subscription_plan = models.ForeignKey('SubscriptionPlan')
    
    # Invoice Details
    invoice_number = models.CharField(max_length=50, unique=True)  # "INV-2024-01-KBH-001"
    invoice_date = models.DateField()
    due_date = models.DateField()
    
    # Billing Period
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Occupancy Breakdown
    occupancy_snapshot = models.JSONField()  # Daily bed occupancy counts
    
    # Amounts
    total_bed_days = models.IntegerField()  # Sum of (occupied_beds × days)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment Status
    status = models.CharField(choices=[
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled')
    ])
    
    paid_at = models.DateTimeField(null=True)
    payment_transaction = models.ForeignKey('Transaction', null=True, related_name='subscription_invoices')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['hostel', 'status']),
            models.Index(fields=['landlord', 'due_date']),
            models.Index(fields=['invoice_date']),
        ]


class OccupancySnapshot(models.Model):
    """Daily snapshot of bed occupancy for billing"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    hostel = models.ForeignKey('hostels.Hostel', related_name='occupancy_snapshots')
    snapshot_date = models.DateField()
    
    # Occupancy Counts
    total_beds = models.IntegerField()
    occupied_beds = models.IntegerField()
    vacant_beds = models.IntegerField()
    
    # Breakdown
    bed_occupancy_data = models.JSONField()  # {bed_id: student_id or null}
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['hostel', 'snapshot_date']]
        indexes = [
            models.Index(fields=['hostel', 'snapshot_date']),
        ]
```

#### Subscription Billing Engine

```python
class SubscriptionBillingEngine:
    """Engine for calculating and generating landlord subscription invoices"""
    
    @staticmethod
    def generate_monthly_invoices():
        """
        Cron task: Generate subscription invoices for all hostels
        Runs on 1st of each month at 00:00 UTC
        """
        today = timezone.now().date()
        period_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)  # Prev month start
        period_end = today.replace(day=1) - timedelta(days=1)  # Prev month end
        
        active_hostels = Hostel.objects.filter(status='active')
        
        for hostel in active_hostels:
            try:
                invoice = SubscriptionBillingEngine.create_invoice_for_hostel(
                    hostel=hostel,
                    period_start=period_start,
                    period_end=period_end
                )
                
                # Send invoice notification
                notify_landlord_invoice_issued.delay(invoice_id=invoice.id)
                
            except Exception as e:
                logger.error(f"Failed to generate invoice for hostel {hostel.id}: {e}")
    
    @staticmethod
    def create_invoice_for_hostel(hostel, period_start, period_end):
        """Create subscription invoice for a hostel for a billing period"""
        
        # Step 1: Get daily occupancy snapshots
        snapshots = OccupancySnapshot.objects.filter(
            hostel=hostel,
            snapshot_date__gte=period_start,
            snapshot_date__lte=period_end
        ).order_by('snapshot_date')
        
        if not snapshots.exists():
            raise ValueError(f"No occupancy snapshots for {hostel.id} in period {period_start} to {period_end}")
        
        # Step 2: Calculate total bed-days
        total_bed_days = sum(s.occupied_beds for s in snapshots)
        
        # Step 3: Get subscription plan
        plan = SubscriptionPlan.objects.get(pricing_model='per_bed', is_active=True)
        
        # Step 4: Calculate amounts
        daily_rate = plan.unit_price / Decimal('30')  # Approximate daily rate
        subtotal = daily_rate * Decimal(str(total_bed_days))
        tax_amount = Decimal('0.00')  # No VAT for now
        total_amount = subtotal + tax_amount
        
        # Step 5: Build occupancy snapshot JSON
        occupancy_data = [
            {
                "date": s.snapshot_date.isoformat(),
                "occupied_beds": s.occupied_beds,
                "total_beds": s.total_beds
            }
            for s in snapshots
        ]
        
        # Step 6: Generate invoice number
        invoice_number = f"INV-{period_start.year}-{period_start.month:02d}-{hostel.code}-{hostel.id[:4]}"
        
        # Step 7: Create invoice
        invoice = SubscriptionInvoice.objects.create(
            hostel=hostel,
            landlord=hostel.landlord,
            subscription_plan=plan,
            invoice_number=invoice_number,
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=7),
            period_start=period_start,
            period_end=period_end,
            occupancy_snapshot=occupancy_data,
            total_bed_days=total_bed_days,
            unit_price=plan.unit_price,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status='issued'
        )
        
        return invoice
```

#### API: Landlord Subscription Dashboard

**Endpoint**: `GET /api/v1/landlord/subscription/dashboard`

```json
{
  "current_period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "days_elapsed": 15,
    "days_remaining": 16
  },
  "occupancy": {
    "total_beds": 50,
    "occupied_beds": 35,
    "vacant_beds": 15,
    "occupancy_rate": "70.0%"
  },
  "projected_invoice": {
    "estimated_bed_days": 525,
    "unit_price": "500.00",
    "estimated_subtotal": "8750.00",
    "estimated_total": "8750.00",
    "note": "Projection based on current occupancy. Final invoice issued on Feb 1."
  },
  "invoices": [
    {
      "invoice_id": "inv_abc123",
      "invoice_number": "INV-2024-01-KBH-001",
      "period": "Dec 2023",
      "total_amount": "16290.32",
      "status": "paid",
      "paid_at": "2024-01-05"
    }
  ]
}
```

---

## F. Receipts, Notifications & Trust

### 1. Current State

**Receipt Generation**: Basic implementation exists

**Evidence**:
- `Receipt` model in `payments/models.py`
- `receipt_generator.py` (PDF generation)
- `receipt_service.py` (service layer)

**Notifications**: Basic email/SMS via `notifications` app

**Issues**:
- ❌ Receipts not linked to bed (only to transaction)
- ❌ No hostel branding on receipts
- ❌ No receipt validation/verification mechanism
- ❌ No dispute workflow
- ❌ Notifications not real-time (no WebSocket)

### 2. Gaps & Risks

| Gap | Risk | Severity |
|-----|------|----------|----------|
| Receipts lack bed attribution | Cannot prove which bed was paid for | **MAJOR** |
| No receipt verification QR code | Fraudulent receipts possible | **MAJOR** |
| No hostel branding | Receipts look generic, not professional | **MINOR** |
| No dispute workflow | No process for payment disputes | **MAJOR** |
| Delays in notifications | Student doesn't know payment status | **MAJOR** |
| No payment confirmation SMS | Students rely only on M-Pesa SMS | **MAJOR** |

### 3. Root Causes

- **Incomplete Feature**: Receipt generation exists but lacks bed-level detail
- **Missing Process**: No dispute resolution workflow designed
- **No Real-Time Architecture**: No WebSocket/Server-Sent Events for live updates

### 4. Severity: **MAJOR**

Receipts are a **trust signal**. Poor receipts → student mistrust → bad reviews → lower bookings.

### 5. Recommendations

**Enhanced Receipt Model**:

```python
class Receipt(models.Model):
    """Enhanced receipt with full attribution"""
    receipt_number = models.CharField(max_length=50, unique=True)
    
    # Core Attribution
    transaction = models.OneToOneField('Transaction')
    hostel = models.ForeignKey('hostels.Hostel')
    bed = models.ForeignKey('Bed', null=True)  # NEW
    student = models.ForeignKey('accounts.StudentProfile')
    landlord = models.ForeignKey('accounts.LandlordProfile')
    
    # Receipt Data
    receipt_data = models.JSONField()  # Full breakdown
    pdf_file = models.FileField(upload_to='receipts/pdf/')
    
    # Verification
    verification_code = models.CharField(max_length=20, unique=True)
    qr_code_url = models.URLField()
    
    generated_at = models.DateTimeField(auto_now_add=True)
```

**Receipt Template (Enhanced)**:

```
==================================================
          KIMATHI BACKPACKERS HOSTEL
         Official Payment Receipt
==================================================

Receipt No:     REC-2024-01-15-001
Date:           January 15, 2024, 10:30 AM
Verification:   QR Code [Image]

--------------------------------------------------
PAYMENT DETAILS
--------------------------------------------------
Student:        John Kamau Doe
Phone:          +254 712 345 678
Email:          john.doe@example.com

Hostel:         Kimathi Backpackers Hostel
Location:       Kimathi Street, Nairobi
Room:           Room 101
Bed:            Bed A (Full Code: 101A)

--------------------------------------------------
TRANSACTION BREAKDOWN
--------------------------------------------------
Description:    Monthly Rent - January 2024
Period:         Jan 1, 2024 - Jan 31, 2024
Amount Paid:    KES 15,000.00
Payment Method: M-Pesa Paybill
M-Pesa Ref:     QDJ9J3W45H
Account No:     KBH-101A-47

Platform Fee:   KES 450.00 (3%)
Landlord Payout: KES 14,550.00

--------------------------------------------------
VERIFICATION
--------------------------------------------------
Verify this receipt at:
https://rumi.co.ke/verify/REC-2024-01-15-001

Or scan QR code above.

--------------------------------------------------
For support, contact:
Email: support@rumi.co.ke
Phone: +254 700 000 000
--------------------------------------------------

This is an automatically generated receipt.
==================================================
```

**Notification Flows**:

1. **Student Payment Success**:
   - **Channels**: Email + SMS + Push Notification
   - **Timing**: Within 30 seconds of callback
   - **Content**:
     - "Payment confirmed! KES 15,000 received for Room 101, Bed A."
     - Receipt attached to email
     - Receipt download link in SMS

2. **Landlord Payment Received**:
   - **Channels**: Email + Dashboard notification
   - **Timing**: Within 1 minute
   - **Content**:
     - "John Doe paid KES 15,000 for Bed 101A"
     - View transaction details link

3. **Admin Alert (Failed Payment)**:
   - **Channels**: Slack + Email
   - **Timing**: Immediate
   - **Content**:
     - "Payment failed: Transaction txn_abc123"
     - Student phone, error code, retry link

**Dispute Workflow**:

```python
class PaymentDispute(models.Model):
    """Track payment disputes"""
    dispute_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # References
    transaction = models.ForeignKey('Transaction', related_name='disputes')
    raised_by = models.ForeignKey('accounts.User')
    
    # Dispute Details
    dispute_type = models.CharField(choices=[
        ('wrong_amount', 'Wrong Amount Charged'),
        ('duplicate_payment', 'Duplicate Payment'),
        ('payment_not_received', 'Payment Not Received'),
        ('other', 'Other')
    ])
    description = models.TextField()
    evidence_urls = models.JSONField(default=list)  # Screenshots, M-Pesa messages
    
    # Status
    status = models.CharField(choices=[
        ('pending', 'Pending Review'),
        ('investigating', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected')
    ])
    
    # Resolution
    resolved_at = models.DateTimeField(null=True)
    resolution_notes = models.TextField(blank=True)
    refund_transaction = models.ForeignKey('Transaction', null=True, related_name='refund_for_dispute')
    
    created_at = models.DateTimeField(auto_now_add=True)
```

**Real-Time Notifications** (WebSocket):

```typescript
// Frontend: Real-time payment status updates
const { data: paymentStatus } = useWebSocket({
  url: `wss://api.rumi.co.ke/ws/payments/${transactionId}`,
  onMessage: (event) => {
    if (event.status === 'success') {
      toast.success('Payment confirmed!');
      router.push('/student/payments/receipts');
    }
  }
});
```

---

## G. M-PESA Integration (Multi-Tenant)

### 1. Current State

**M-Pesa Integration**: Implemented via `mpesa_api.py` and `mpesa_webhooks.py`

**Features**:
- ✅ OAuth token caching
- ✅ STK Push initiation
- ✅ Callback handling
- ✅ Connection pooling
- ✅ Idempotency via `WebhookEvent` model

**Issues**:
- ❌ Single M-Pesa API credentials (not multi-tenant)
- ❌ Callback routing assumes single Paybill
- ❌ No webhook signature verification
- ❌ No M-Pesa requery for failed callbacks
- ❌ No B2C (payouts) integration

### 2. Gaps & Risks

| Gap | Risk | Severity |
|-----|------|----------|
| Single M-Pesa credential | All hostels share same Paybill | **CRITICAL** |
| No callback signature verification | Spoofed callbacks possible | **CRITICAL** |
| No requery mechanism | Lost payments if callback fails | **CRITICAL** |
| No B2C integration | Cannot send payouts to landlords | **MAJOR** |
| No M-Pesa downtime detection | System fails silently during M-Pesa outages | **MAJOR** |

### 3. Root Causes

- **Single-Tenant Assumption**: Integration built for one Paybill only
- **Security Oversight**: Callback endpoint is public, no signature validation
- **Incomplete Implementation**: Requery API exists but not used

### 4. Severity: **CRITICAL**

**Security Risk**: Without callback signature verification, attackers can send fake payment confirmations and get free housing.

### 5. Recommendations

**Multi-Tenant M-Pesa Integration**:

```python
class MpesaApiClient:
    """Multi-tenant M-Pesa API client"""
    
    def __init__(self, hostel_payment_config):
        """Initialize with hostel-specific credentials"""
        self.config = hostel_payment_config
        self.credentials = self._get_credentials()
    
    def _get_credentials(self):
        """Get M-Pesa API credentials for this hostel"""
        # Option 1: Each hostel has own M-Pesa app credentials
        # Option 2: Platform acts as aggregator using single credentials
        
        if self.config.uses_own_credentials:
            return {
                'consumer_key': decrypt(self.config.mpesa_consumer_key),
                'consumer_secret': decrypt(self.config.mpesa_consumer_secret),
                'shortcode': self.config.mpesa_number
            }
        else:
            # Use platform credentials
            return settings.PLATFORM_MPESA_CREDENTIALS
```

**Callback Signature Verification**:

```python
import hmac
import hashlib

def verify_mpesa_callback(request):
    """Verify M-Pesa callback signature"""
    
    # Get signature from header
    signature = request.headers.get('X-Safaricom-Signature')
    
    if not signature:
        raise SecurityError("Missing callback signature")
    
    # Compute expected signature
    payload = request.body.decode('utf-8')
    secret = settings.MPESA_CALLBACK_SECRET
    
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    if not hmac.compare_digest(signature, expected_signature):
        raise SecurityError("Invalid callback signature")
    
    return True
```

**Requery Implementation**:

```python
@shared_task
def requery_pending_transactions():
    """
    Cron task: Requery M-Pesa for pending transactions
    Runs every 5 minutes
    """
    cutoff_time = timezone.now() - timedelta(minutes=10)
    
    pending_txns = Transaction.objects.filter(
        status='pending',
        payment_method='mpesa',
        initiated_at__lt=cutoff_time,
        mpesa_checkout_request_id__isnull=False
    )
    
    for txn in pending_txns:
        try:
            api = MpesaDarajaAPI()
            result = api.query_stk_push(txn.mpesa_checkout_request_id)
            
            if result.get('ResultCode') == '0':
                # Payment successful, update transaction
                process_confirmed_payment(...)
            elif result.get('ResultCode') in ['1032', '1']:
                # Payment cancelled or failed
                txn.status = 'failed'
                txn.save()
        except Exception as e:
            logger.error(f"Requery failed for {txn.id}: {e}")
```

**M-Pesa Health Monitoring**:

```python
@shared_task
def check_mpesa_health():
    """
    Health check: Verify M-Pesa API is responding
    Runs every 2 minutes
    """
    try:
        api = MpesaDarajaAPI()
        token = api.get_access_token()
        
        if token:
            # M-Pesa is up
            cache.set('mpesa_status', 'healthy', timeout=300)
        else:
            # M-Pesa is down
            cache.set('mpesa_status', 'degraded', timeout=300)
            alert_tech_support.delay("M-Pesa API not responding")
    except Exception as e:
        cache.set('mpesa_status', 'down', timeout=300)
        alert_tech_support.delay(f"M-Pesa health check failed: {e}")
```

---

## H. Database & Ledger Design

### 1. Current State

**Database**: PostgreSQL (assumed)

**Schema Review**:
- ✅ `Transaction` table with proper indexes
- ✅ `RentPeriod` for rent cycles
- ✅ `WebhookEvent` for idempotency
- ❌ No `Bed` table
- ❌ No `BedPaymentLedger` table
- ❌ No `SubscriptionInvoice` table
- ❌ No `OccupancySnapshot` table

### 2. Gaps & Risks

| Gap | Risk | Severity |
|-----|------|----------|
| No bed-level ledger | Cannot perform forensic audit | **CRITICAL** |
| No double-entry bookkeeping | Financial integrity risks | **CRITICAL** |
| No audit log table | Cannot track who changed what | **MAJOR** |
| No reconciliation table | Manual reconciliation required | **MAJOR** |

### 3. Recommended Schema

**Complete Payments Database Schema**:

```sql
-- Core Payment Entities
CREATE TABLE beds (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id),
    code VARCHAR(10) NOT NULL,
    full_code VARCHAR(20) NOT NULL,
    bed_type VARCHAR(20) NOT NULL,
    price_override DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, code)
);

CREATE INDEX idx_beds_room ON beds(room_id, is_active);

-- Bed Occupancy Timeline
CREATE TABLE bed_occupancy (
    id UUID PRIMARY KEY,
    bed_id UUID NOT NULL REFERENCES beds(id),
    student_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    moved_in_at DATE NOT NULL,
    moved_out_at DATE,
    is_active BOOLEAN DEFAULT TRUE,
    daily_subscription_rate DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_occupancy_bed_active ON bed_occupancy(bed_id, is_active);
CREATE INDEX idx_occupancy_dates ON bed_occupancy(moved_in_at, moved_out_at);

-- Bed Payment Ledger (Immutable)
CREATE TABLE bed_payment_ledger (
    id UUID PRIMARY KEY,
    bed_id UUID NOT NULL REFERENCES beds(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount_allocated DECIMAL(10,2) NOT NULL,
    allocated_to_period_start DATE NOT NULL,
    allocated_to_period_end DATE NOT NULL,
    attributed_at TIMESTAMP DEFAULT NOW(),
    attributed_by VARCHAR(50) NOT NULL,
    CONSTRAINT positive_allocation CHECK (amount_allocated > 0)
);

CREATE INDEX idx_ledger_bed_date ON bed_payment_ledger(bed_id, attributed_at);
CREATE INDEX idx_ledger_transaction ON bed_payment_ledger(transaction_id);

-- Subscription Invoices
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY,
    hostel_id UUID NOT NULL,
    landlord_id UUID NOT NULL,
    subscription_plan_id UUID NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    occupancy_snapshot JSONB NOT NULL,
    total_bed_days INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    paid_at TIMESTAMP,
    payment_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_hostel_status ON subscription_invoices(hostel_id, status);
CREATE INDEX idx_invoices_landlord_due ON subscription_invoices(landlord_id, due_date);

-- Occupancy Snapshots (Daily)
CREATE TABLE occupancy_snapshots (
    id UUID PRIMARY KEY,
    hostel_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER NOT NULL,
    vacant_beds INTEGER NOT NULL,
    bed_occupancy_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hostel_id, snapshot_date)
);

CREATE INDEX idx_snapshots_hostel_date ON occupancy_snapshots(hostel_id, snapshot_date);

-- Audit Log (Immutable)
CREATE TABLE payment_audit_log (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,  -- 'transaction', 'invoice', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,       -- 'created', 'updated', 'deleted'
    changed_by UUID NOT NULL,          -- User ID
    changed_at TIMESTAMP DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_entity ON payment_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON payment_audit_log(changed_at);

-- Reconciliation Table
CREATE TABLE payment_reconciliations (
    id UUID PRIMARY KEY,
    reconciliation_date DATE NOT NULL,
    hostel_id UUID,
    total_transactions INTEGER,
    total_amount DECIMAL(12,2),
    mpesa_report_total DECIMAL(12,2),
    discrepancy DECIMAL(12,2),
    discrepancy_reason TEXT,
    reconciled_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Data Integrity Constraints

```sql
-- Prevent negative payments
ALTER TABLE transactions 
ADD CONSTRAINT positive_amount CHECK (amount > 0);

-- Ensure rent period dates are valid
ALTER TABLE rent_periods
ADD CONSTRAINT valid_period CHECK (end_date > start_date);

-- Ensure occupancy dates are valid
ALTER TABLE bed_occupancy
ADD CONSTRAINT valid_occupancy CHECK (
    moved_out_at IS NULL OR moved_out_at > moved_in_at
);

-- Ensure only one active occupancy per bed
CREATE UNIQUE INDEX idx_one_active_occupancy_per_bed 
ON bed_occupancy(bed_id) 
WHERE is_active = TRUE;
```

---

## I. Observability, Auditing & Support Tooling

### 1. Current State

**Observability**: Minimal

**Evidence**:
- Basic logging via Python `logging` module
- No metrics collection (Prometheus, Grafana)
- No distributed tracing
- No error tracking (Sentry)
- No performance monitoring (APM)

### 2. Gaps & Risks

| Gap | Risk | Severity |
|-----|------|----------|
| No metrics dashboard | Cannot detect payment failures early | **CRITICAL** |
| No alerting | Incidents discovered by customers | **CRITICAL** |
| No distributed tracing | Cannot debug cross-service issues | **MAJOR** |
| No error aggregation | Same errors repeat unnoticed | **MAJOR** |
| No SLO tracking | No data for SLA compliance | **MAJOR** |

### 3. Recommendations

**Metrics to Track**:

```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge

# Payment Volume
payment_initiated_total = Counter(
    'payment_initiated_total',
    'Total payment attempts',
    ['hostel_id', 'payment_method']
)

payment_success_total = Counter(
    'payment_success_total',
    'Total successful payments',
    ['hostel_id', 'payment_method']
)

payment_failed_total = Counter(
    'payment_failed_total',
    'Total failed payments',
    ['hostel_id', 'payment_method', 'failure_reason']
)

# Payment Latency
mpesa_callback_latency = Histogram(
    'mpesa_callback_latency_seconds',
    'Time from STK push to callback',
    ['hostel_id']
)

# Active State
pending_transactions = Gauge(
    'pending_transactions_count',
    'Number of transactions in pending state',
    ['hostel_id']
)

# Subscription Billing
subscription_invoices_issued = Counter(
    'subscription_invoices_issued_total',
    'Total subscription invoices issued',
    ['hostel_id']
)

subscription_invoices_overdue = Gauge(
    'subscription_invoices_overdue_count',
    'Number of overdue invoices',
    ['hostel_id']
)
```

**Alerting Rules** (Prometheus AlertManager):

```yaml
groups:
  - name: payments
    rules:
      # High failure rate
      - alert: HighPaymentFailureRate
        expr: |
          (
            rate(payment_failed_total[5m]) /
            rate(payment_initiated_total[5m])
          ) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Payment failure rate above 10%"
          
      # M-Pesa callback delays
      - alert: MpesaCallbackDelayed
        expr: |
          histogram_quantile(0.95, mpesa_callback_latency_seconds) > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile M-Pesa callback latency > 60s"
      
      # Stuck transactions
      - alert: StuckTransactions
        expr: pending_transactions_count > 50
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "More than 50 transactions stuck in pending"
      
      # Overdue invoices
      - alert: OverdueInvoicesAccumulating
        expr: subscription_invoices_overdue_count > 20
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "More than 20 subscription invoices overdue"
```

**Tech Support Dashboard**:

```python
# Admin dashboard view
class PaymentsSupportDashboard(APIView):
    """Real-time operational dashboard for tech support"""
    
    

    def get(self, request):
        return Response({
            "health": {
                "mpesa_api_status": cache.get('mpesa_status', 'unknown'),
                "database_status": "healthy",
                "queue_status": "healthy"
            },
            "real_time_stats": {
                "pending_transactions": Transaction.objects.filter(status='pending').count(),
                "failed_last_hour": Transaction.objects.filter(
                    status='failed',
                    initiated_at__gte=timezone.now() - timedelta(hours=1)
                ).count(),
                "successful_last_hour": Transaction.objects.filter(
                    status='success',
                    paid_at__gte=timezone.now() - timedelta(hours=1)
                ).count()
            },
            "top_errors": self.get_top_errors(),
            "stuck_transactions": self.get_stuck_transactions(),
            "recent_disputes": self.get_recent_disputes()
        })
    
    def get_stuck_transactions(self):
        """Transactions pending > 15 minutes"""
        cutoff = timezone.now() - timedelta(minutes=15)
        return Transaction.objects.filter(
            status='pending',
            initiated_at__lt=cutoff
        ).values('id', 'student__user__email', 'initiated_at', 'amount')[:10]
```

---

## J. Edge Cases & Failure Scenarios

### 1. Critical Edge Cases

#### 1.1 Duplicate M-Pesa Callbacks

**Scenario**: M-Pesa sends same callback twice due to network retry.

**Current Handling**: `WebhookEvent` model has `unique=True` on `transaction_ref`.

**Gap**: No distributed lock. Race condition possible if callbacks arrive simultaneously.

**Recommendation**:

```python
from django_redis import get_redis_connection
import redis_lock

@transaction.atomic
def process_mpesa_callback(callback_data):
    transaction_ref = callback_data['TransID']
    
    # Distributed lock
    redis_conn = get_redis_connection('default')
    with redis_lock.Lock(redis_conn, f'callback:{transaction_ref}', expire=30):
        
        # Check idempotency
        webhook, created = WebhookEvent.objects.get_or_create(
            transaction_ref=transaction_ref,
            defaults={'payload': callback_data, 'provider': 'mpesa'}
        )
        
        if not created:
            # Duplicate callback
            webhook.processing_status = 'duplicate'
            webhook.save()
            return JsonResponse({'status': 'duplicate'}, status=200)
        
        # Process payment
        ...
```

#### 1.2 Student Pays Wrong Paybill

**Scenario**: Student pays to a different hostel's Paybill by mistake.

**Current Handling**: None. Payment would be lost or misattributed.

**Recommendation**:

```python
def handle_unmatched_payment(callback_data):
    """Handle payments that don't match any active booking"""
    
    paybill = callback_data['BusinessShortCode']
    account_number = callback_data['BillRefNumber']
    amount = callback_data['TransAmount']
    phone = callback_data['MSISDN']
    
    # Log unmatched payment
    UnmatchedPayment.objects.create(
        paybill=paybill,
        account_number=account_number,
        amount=amount,
        phone_number=phone,
        mpesa_receipt=callback_data['TransID'],
        callback_payload=callback_data,
        status='pending_resolution'
    )
    
    # Alert admins
    alert_unmatched_payment.delay(account_number, amount)
    
    # SMS to student
    send_sms.delay(
        phone=phone,
        message=f"Payment of KES {amount} received but could not be matched. "
                f"Please contact support with ref: {callback_data['TransID']}"
    )
```

#### 1.3 Student Uses Wrong Account Number

**Scenario**: Student enters wrong account number (e.g., "KBH-102A-47" instead of "KBH-101A-47").

**Current Handling**: Payment would fail to match.

**Recommendation**:

- **Fuzzy matching** for typos (Levenshtein distance)
- **Checksum validation** to detect wrong account numbers
- **Manual resolution workflow** for ambiguous payments

#### 1.4 Payment Arrives After Bed is Vacated

**Scenario**: Student pays rent on Jan 31, but booking ended Jan 15.

**Current Handling**: None. Payment would be accepted.

**Recommendation**:

```python
def validate_payment_timing(bed_occupancy, payment_date):
    """Validate payment is within valid occupancy period"""
    
    if bed_occupancy.moved_out_at and payment_date > bed_occupancy.moved_out_at:
        # Payment after move-out
        raise PaymentTimingError(
            f"Payment received after student moved out on {bed_occupancy.moved_out_at}"
        )
    
    # Allow grace period (e.g., 7 days after move-out for late payments)
    grace_period_end = bed_occupancy.moved_out_at + timedelta(days=7)
    
    if payment_date > grace_period_end:
        # Reject payment, initiate refund
        initiate_refund(payment, reason="Late payment after grace period")
```

#### 1.5 Network Outage During Callback

**Scenario**: M-Pesa callback arrives but server is down/restarting.

**Current Handling**: Callback is lost.

**Recommendation**:

- **M-Pesa will retry** callbacks up to 3 times
- **Requery mechanism** (already recommended in Section G)
- **Queue-based processing**: Callbacks written to message queue first, then processed async

```python
# Webhook endpoint writes to queue immediately
@csrf_exempt
def mpesa_callback_receiver(request):
    """Lightweight receiver that queues callback for processing"""
    callback_data = json.loads(request.body)
    
    # Immediately acknowledge to M-Pesa
    write_to_queue('mpesa_callbacks', callback_data)
    
    return JsonResponse({'ResultCode': 0, 'ResultDesc': 'Accepted'}, status=200)

# Async worker processes queue
@shared_task
def process_callback_from_queue(callback_data):
    """Process callback from queue with retries"""
    try:
        process_mpesa_callback(callback_data)
    except Exception as e:
        logger.error(f"Callback processing failed: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
```

#### 1.6 Partial Payment

**Scenario**: Student pays KES 10,000 when rent is KES 15,000.

**Current Handling**: `RentPeriod.status` = 'partially_paid'.

**Gap**: No notification to student about remaining balance.

**Recommendation**:

```python
def handle_partial_payment(rent_period, amount_paid):
    """Handle partial payment and notify student"""
    
    remaining_balance = rent_period.balance - amount_paid
    
    if remaining_balance > 0:
        # Update status
        rent_period.status = 'partially_paid'
        rent_period.save()
        
        # Notify student
        send_notification.delay(
            recipient_id=rent_period.student.user.id,
            notification_type='partial_payment_received',
            channel='sms',
            context={
                'amount_paid': amount_paid,
                'remaining_balance': remaining_balance,
                'due_date': rent_period.start_date
            }
        )
```

#### 1.7 Fraud: Spoofed M-Pesa Callback

**Scenario**: Attacker sends fake callback to `/mpesa/callback/` endpoint.

**Current Handling**: No signature verification (CRITICAL GAP).

**Recommendation**: Already covered in Section G (callback signature verification).

#### 1.8 Landlord Doesn't Pay Subscription

**Scenario**: Landlord has 20 overdue invoices, totaling KES 100,000.

**Current Handling**: None.

**Recommendation**:

```python
class SubscriptionEnforcement:
    """Enforce subscription payment requirements"""
    
    @staticmethod
    def check_and_enforce(hostel):
        """Check subscription status and enforce policies"""
        
        overdue_invoices = SubscriptionInvoice.objects.filter(
            hostel=hostel,
            status='overdue'
        )
        
        days_overdue = (timezone.now().date() - overdue_invoices.first().due_date).days
        
        if days_overdue > 14:
            # Hard enforcement: Hide hostel listing
            hostel.status = 'suspended_non_payment'
            hostel.save()
            
            notify_landlord_suspension.delay(hostel.id)
        
        elif days_overdue > 7:
            # Soft warning: Show banner on dashboard
            notify_landlord_overdue.delay(hostel.id)
```

---

## Production Readiness Checklist

### Payment Infrastructure

- [ ] **Microservice Extraction**
  - [ ] Extract payments to standalone service
  - [ ] Define service boundaries and API contracts
  - [ ] Implement event-driven architecture
  - [ ] Set up message queue (RabbitMQ/Kafka)
  - [ ] Implement circuit breakers for external calls

- [ ] **Per-Hostel Configuration**
  - [ ] Migrate `MpesaPaymentConfig` to `HostelPaymentConfig`
  - [ ] Implement account number generation algorithm
  - [ ] Build Paybill verification workflow
  - [ ] Add Till Number support
  - [ ] Encrypt sensitive payment credentials

- [ ] **Per-Bed Tracking**
  - [ ] Create `Bed` model and migrate data
  - [ ] Create `BedPaymentLedger` table
  - [ ] Create `BedOccupancy` timeline table
  - [ ] Backfill occupancy data from bookings
  - [ ] Update payment attribution logic

- [ ] **Subscription Billing**
  - [ ] Create subscription models (Invoice, Plan, Snapshot)
  - [ ] Implement daily occupancy snapshot job
  - [ ] Build subscription billing engine
  - [ ] Create landlord subscription dashboard
  - [ ] Implement subscription payment enforcement

- [ ] **M-Pesa Integration**
  - [ ] Implement callback signature verification
  - [ ] Build requery mechanism
  - [ ] Add M-Pesa health monitoring
  - [ ] Implement B2C (payouts) for landlords
  - [ ] Add multi-tenant credential support

### Security & Compliance

- [ ] **Authentication & Authorization**
  - [ ] Implement JWT with short TTL
  - [ ] Add API key authentication for webhooks
  - [ ] Implement role-based access control (RBAC)
  - [ ] Add rate limiting per tenant

- [ ] **Data Security**
  - [ ] Encrypt payment credentials at rest
  - [ ] Implement PCI DSS compliance measures
  - [ ] Add data masking for PII in logs
  - [ ] Implement GDPR-compliant data retention

- [ ] **Audit Logging**
  - [ ] Create immutable audit log table
  - [ ] Log all payment state changes
  - [ ] Log all admin overrides
  - [ ] Implement log retention policy

### Reliability & Performance

- [ ] **High Availability**
  - [ ] Deploy payment service across multiple AZs
  - [ ] Implement database replication
  - [ ] Set up Redis cluster for caching
  - [ ] Configure auto-scaling

- [ ] **Fault Tolerance**
  - [ ] Implement distributed locks for idempotency
  - [ ] Add retry logic with exponential backoff
  - [ ] Implement fallback mechanisms
  - [ ] Set up dead letter queues

- [ ] **Performance**
  - [ ] Add database indexes on payment queries
  - [ ] Implement query optimization
  - [ ] Set up CDN for receipt PDFs
  - [ ] Implement connection pooling

### Observability

- [ ] **Metrics**
  - [ ] Set up Prometheus for metrics collection
  - [ ] Create Grafana dashboards
  - [ ] Implement custom business metrics
  - [ ] Set up SLO tracking

- [ ] **Logging**
  - [ ] Centralize logs (ELK/Loki)
  - [ ] Add structured logging
  - [ ] Implement log correlation IDs
  - [ ] Set up log aggregation

- [ ] **Tracing**
  - [ ] Implement distributed tracing (Jaeger)
  - [ ] Add trace IDs to all requests
  - [ ] Set up trace sampling
  - [ ] Create trace analysis dashboard

- [ ] **Alerting**
  - [ ] Configure AlertManager
  - [ ] Set up PagerDuty integration
  - [ ] Create runbooks for common incidents
  - [ ] Implement escalation policies

### Testing

- [ ] **Unit Tests**
  - [ ] Test payment processing logic
  - [ ] Test subscription billing calculations
  - [ ] Test account number generation
  - [ ] Achieve >80% code coverage

- [ ] **Integration Tests**
  - [ ] Test M-Pesa callback handling
  - [ ] Test payment -> receipt flow
  - [ ] Test subscription invoice generation
  - [ ] Test dispute workflow

- [ ] **Load Tests**
  - [ ] Simulate 1000 concurrent payments
  - [ ] Test callback spike handling
  - [ ] Test database performance under load
  - [ ] Identify bottlenecks

- [ ] **Chaos Engineering**
  - [ ] Test M-Pesa downtime scenarios
  - [ ] Test database failover
  - [ ] Test network partitions
  - [ ] Test message queue failures

### Operations

- [ ] **Deployment**
  - [ ] Set up CI/CD pipeline
  - [ ] Implement blue-green deployment
  - [ ] Create rollback procedures
  - [ ] Document deployment process

- [ ] **Monitoring**
  - [ ] Create tech support dashboard
  - [ ] Build payment analytics dashboard
  - [ ] Implement anomaly detection
  - [ ] Set up synthetic monitoring

- [ ] **Incident Response**
  - [ ] Create incident response plan
  - [ ] Set up incident communication channels
  - [ ] Define SLA/SLO targets
  - [ ] Create post-mortem template

---

## Risk Register

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation | Owner |
|---------|------------------|-------------|--------|----------|------------|-------|
| PAY-001 | Duplicate M-Pesa callbacks cause double charging | Medium | Critical | **HIGH** | Implement distributed locks + idempotency keys | Backend Team |
| PAY-002 | Spoofed M-Pesa callbacks (no signature verification) | Medium | Critical | **HIGH** | Implement HMAC signature verification | Security Team |
| PAY-003 | Lost payments due to missed callbacks | Low | Critical | **MEDIUM** | Implement requery mechanism + alerting | Backend Team |
| PAY-004 | Incorrect subscription billing due to missing bed model | High | Critical | **CRITICAL** | Immediately implement Bed model + occupancy tracking | Product Team |
| PAY-005 | Payments misattributed in shared rooms | High | Major | **HIGH** | Implement per-bed payment ledger | Backend Team |
| PAY-006 | Landlord non-payment of subscription fees | Medium | Major | **MEDIUM** | Implement subscription enforcement (hide listing) | Product Team |
| PAY-007 | M-Pesa API downtime affecting all payments | Low | Critical | **MEDIUM** | Implement health monitoring + fallback to manual payments | DevOps Team |
| PAY-008 | Database corruption during high-load period | Low | Critical | **MEDIUM** | Implement DB replication + regular backups | DBA Team |
| PAY-009 | Student pays wrong Paybill by mistake | Medium | Minor | **LOW** | Implement fuzzy matching + manual resolution workflow | Support Team |
| PAY-010 | Receipts lack legal compliance (no signatures) | High | Major | **HIGH** | Add digital signatures + QR verification | Legal + Backend |
| PAY-011 | No audit trail for admin payment overrides | Medium | Major | **MEDIUM** | Implement immutable audit log table | Backend Team |
| PAY-012 | Payment disputes escalate without resolution process | Medium | Major | **MEDIUM** | Build dispute management workflow | Support Team |
| PAY-013 | Stuck transactions not detected for hours | Medium | Major | **MEDIUM** | Implement real-time alerting on pending > 15min | DevOps Team |
| PAY-014 | Partial payments not communicated to students | High | Minor | **LOW** | Send SMS for partial payments with remaining balance | Notifications Team |
| PAY-015 | Subscription invoices not sent to landlords | Low | Major | **LOW** | Implement email + dashboard notification on invoice | Notifications Team |

---

## Conclusion

This audit reveals **critical gaps** in Rumia's payments architecture that must be addressed before production launch:

1. **No Per-Bed Tracking**: Subscription billing is impossible without a `Bed` model and occupancy timeline.
2. **No Subscription Billing Engine**: The core revenue model is not implemented.
3. **Limited Multi-Tenant Isolation**: All hostels share a single Paybill, making reconciliation impossible.
4. **Security Vulnerabilities**: No M-Pesa callback signature verification (spoofing risk).
5. **Incomplete Observability**: No metrics, alerting, or distributed tracing.

**Recommended Priority**:

### Phase 1 (Critical - Week 1-2)
- Implement `Bed` model + migration
- Implement `BedPaymentLedger`
- Implement `BedOccupancy` timeline
- Add M-Pesa callback signature verification
- Implement distributed locks for idempotency

### Phase 2 (High - Week 3-4)
- Build subscription billing engine
- Create `SubscriptionInvoice` model
- Implement daily occupancy snapshot job
- Build landlord subscription dashboard
- Implement subscription enforcement

### Phase 3 (Medium - Week 5-6)
- Extract payments to microservice
- Implement per-hostel Paybill configuration
- Build account number generation
- Implement requery mechanism
- Add M-Pesa health monitoring

### Phase 4 (Ongoing)
- Implement observability (Prometheus, Grafana)
- Build tech support dashboard
- Add distributed tracing
- Implement chaos engineering tests
- Create incident response playbooks

**This is a production-grade fintech system handling real money. Shortcuts are not acceptable.**

---

**END OF DOCUMENT**
