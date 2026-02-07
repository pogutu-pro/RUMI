# Payments System - Operational Runbooks

**Version**: 1.0  
**Last Updated**: 2026-02-07

---

## Runbook 1: M-Pesa Downtime Response

**Scenario**: M-Pesa API is returning 503 errors  
**Severity**: HIGH  
**Response Time**: <15 minutes

### Detection

**Symptoms**:
- Payment initiation failing with "Service Unavailable"
- Prometheus alert: `mpesa_callback_total{result_code="503"}` spike
- Student complaints of failed payments

### Response Steps

#### 1. Verify M-Pesa Status
```bash
# Check Safaricom status page
curl https://status.safaricom.co.ke/api/v2/status.json

# Check M-Pesa API health
curl -X GET https://sandbox.safaricom.co.ke/mpesa/health
```

#### 2. Enable Fallback Mode
```bash
# SSH to backend server
ssh backend@rumia-prod-01

# Set M-Pesa maintenance mode
python manage.py shell
>>> from payments.models import SystemConfig
>>> config = SystemConfig.objects.get(key='mpesa_enabled')
>>> config.value = False
>>> config.save()
```

#### 3. Notify Users
```python
# Run notification script
python manage.py send_notification \
  --type sms \
  --message "M-Pesa payments temporarily unavailable. Please try again in 30 minutes." \
  --audience students_with_pending_payments
```

#### 4. Monitor Recovery
```bash
# Watch M-Pesa callback success rate
watch -n 5 'curl -s http://localhost:8000/metrics | grep mpesa_callback_total'

# When callbacks resume successfully
python manage.py shell
>>> config = SystemConfig.objects.get(key='mpesa_enabled')
>>> config.value = True
>>> config.save()
```

#### 5. Post-Incident
- Update status page: https://status.rumia.com
- Document downtime duration in incident log
- Review failed payments for manual reconciliation

---

## Runbook 2: Stuck Transactions Recovery

**Scenario**: Transactions stuck in "pending" state for >15 minutes  
**Severity**: MEDIUM  
**Response Time**: <30 minutes

### Detection

**Symptoms**:
- Prometheus alert: `rumia_stuck_transactions_count > 50`
- Students reporting "Payment Processing..." indefinitely

### Response Steps

#### 1. Identify Stuck Transactions
```python
python manage.py shell

from payments.models import Transaction
from django.utils import timezone
from datetime import timedelta

cutoff = timezone.now() - timedelta(minutes=15)
stuck = Transaction.objects.filter(
    status='pending',
    created_at__lt=cutoff
)

print(f"Found {stuck.count()} stuck transactions")
```

#### 2. Check M-Pesa Status (Manual Query)
```bash
# For each stuck transaction, query M-Pesa
python manage.py check_mpesa_status --transaction-ref TXN-20260207-ABC123

# If M-Pesa confirms payment succeeded
python manage.py force_complete_transaction --ref TXN-20260207-ABC123
```

#### 3. Bulk Recovery Script
```python
# Run recovery script
python manage.py recover_stuck_transactions \
  --min-age-minutes 15 \
  --max-age-hours 24 \
  --dry-run

# Review output, then run for real
python manage.py recover_stuck_transactions \
  --min-age-minutes 15 \
  --max-age-hours 24
```

#### 4. Notify Affected Students
```bash
python manage.py notify_transaction_update \
  --transaction-refs TXN-20260207-ABC123,TXN-20260207-XYZ789 \
  --message "Your payment has been confirmed. Sorry for the delay!"
```

---

## Runbook 3: Payment Reconciliation Mismatch

**Scenario**: M-Pesa statement shows payment, but not reflected in Rumia  
**Severity**: HIGH (Revenue leakage)  
**Response Time**: <1 hour

### Detection

**Symptoms**:
- Landlord reports missing payment in dashboard
- M-Pesa statement reconciliation shows discrepancy

### Response Steps

#### 1. Locate Payment in M-Pesa Logs
```bash
# Search webhook logs for M-Pesa receipt number
cd /var/log/rumia/webhooks/
grep "MPESA_RECEIPT_ABC123" *.log

# If found
cat webhook-2026-02-07.log | grep "MPESA_RECEIPT_ABC123" | jq .
```

#### 2. Check Webhook Event Table
```python
python manage.py shell

from payments.models import WebhookEvent

event = WebhookEvent.objects.filter(
    provider='mpesa',
    payload__TransID='MPESA_RECEIPT_ABC123'
).first()

if event:
    print(f"Status: {event.processing_status}")
    print(f"Error: {event.error_message}")
```

#### 3. Manual Transaction Creation
```python
# If webhook failed to process
from payments.services import create_transaction_from_mpesa

mpesa_data = {
    'TransID': 'MPESA_RECEIPT_ABC123',
    'TransAmount': 15000,
    'BillRefNumber': 'KBH-101-A-47',
    'MSISDN': '254712345678',
    'TransTime': '20260207123000',
}

transaction = create_transaction_from_mpesa(mpesa_data)
print(f"Created transaction: {transaction.transaction_reference}")
```

#### 4. Update Bed Payment Ledger
```python
from payments.models import BedPaymentLedger
from hostels.models import Bed
from decimal import Decimal

bed = Bed.objects.get(full_code='KBH-101-A')

BedPaymentLedger.objects.create(
    bed=bed,
    transaction=transaction,
    amount_allocated=Decimal('15000.00'),
    allocated_to_period_start='2026-02-01',
    allocated_to_period_end='2026-02-28',
    attributed_by='admin_override',
    override_reason='Manual reconciliation - webhook processing failed',
    overridden_by_user=request.user
)
```

#### 5. Notify Student
```bash
python manage.py send_receipt \
  --transaction-ref TXN-20260207-MANUAL-001 \
  --send-email \
  --send-sms
```

---

## Runbook 4: Subscription Invoice Generation Failure

**Scenario**: Monthly invoices not generated on 1st of month  
**Severity**: CRITICAL (Revenue impact)  
**Response Time**: <2 hours

### Detection

**Symptoms**:
- Cron job failure email received
- Prometheus metric `subscription_invoices_issued_total` not increasing
- Landlords not receiving invoices

### Response Steps

#### 1. Check Cron Job Logs
```bash
# View cron job logs
tail -f /var/log/rumia/cron/subscription_invoices.log

# Check for errors
grep "ERROR" /var/log/rumia/cron/subscription_invoices.log
```

#### 2. Verify Occupancy Snapshots
```python
python manage.py shell

from payments.subscription_models import OccupancySnapshot
from datetime import date

# Check snapshots exist for previous month
snapshots = OccupancySnapshot.objects.filter(
    snapshot_date__year=2026,
    snapshot_date__month=1
).count()

print(f"January snapshots: {snapshots}")
# Should be ~620 (20 hostels × 31 days)
```

#### 3. Manual Invoice Generation
```python
# If snapshots exist but invoices failed
from payments.subscription_billing_engine import SubscriptionBillingEngine
from datetime import date

result = SubscriptionBillingEngine.generate_monthly_invoices(
    billing_month=date(2026, 1, 1)
)

print(f"Success: {result['success']}")
print(f"Errors: {result['errors']}")
```

#### 4. Verify Invoice Counts
```python
from payments.subscription_models import SubscriptionInvoice

invoices = SubscriptionInvoice.objects.filter(
    period_start='2026-01-01',
    period_end='2026-01-31'
)

print(f"Total invoices: {invoices.count()}")
print(f"By status:")
for status in ['issued', 'paid', 'overdue']:
    count = invoices.filter(status=status).count()
    print(f"  {status}: {count}")
```

#### 5. Send Invoice Notifications
```bash
# Trigger email notifications
python manage.py send_invoice_notifications \
  --period 2026-01 \
  --dry-run

# If looks good, send for real
python manage.py send_invoice_notifications \
  --period 2026-01
```

---

## Runbook 5: Database Performance Degradation

**Scenario**: Payment queries taking >5 seconds  
**Severity**: HIGH  
**Response Time**: <15 minutes

### Detection

**Symptoms**:
- Prometheus alert: `http_req_duration{endpoint="/payments/"} > 5s`
- Slow dashboard loading
- Database CPU >80%

### Response Steps

#### 1. Identify Slow Queries
```sql
-- Connect to database
psql rumia_production

-- Check current queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### 2. Kill Long-Running Queries (if stuck)
```sql
-- Terminate stuck query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE query_start < now() - interval '10 minutes'
  AND state = 'active';
```

#### 3. Rebuild Indexes (if needed)
```sql
-- Reindex payments tables
REINDEX TABLE transactions;
REINDEX TABLE bed_payment_ledger;
REINDEX TABLE subscription_invoices;
```

#### 4. Vacuum Analyze
```sql
-- Clean up dead tuples
VACUUM ANALYZE transactions;
VACUUM ANALYZE bed_payment_ledger;
```

#### 5. Check Missing Indexes
```python
# Run Django check for missing indexes
python manage.py check --deploy

# Add indexes if needed
python manage.py makemigrations --name add_performance_indexes
python manage.py migrate
```

---

## Runbook 6: Overdue Invoice Enforcement Failure

**Scenario**: Hostels with overdue invoices still showing in listings  
**Severity**: MEDIUM (Revenue leakage)  
**Response Time**: <1 hour

### Response Steps

#### 1. Check Enforcement Cron Job
```bash
# Check last run time
cat /var/log/rumia/cron/invoice_enforcement.log | tail -20

# Manual run
python manage.py run_invoice_enforcement --dry-run
```

#### 2. Identify Overdue Invoices
```python
python manage.py shell

from payments.subscription_models import SubscriptionInvoice
from django.utils import timezone

overdue = SubscriptionInvoice.objects.filter(
    status__in=['overdue', 'in_grace'],
    due_date__lt=timezone.now().date()
)

for invoice in overdue:
    days = (timezone.now().date() - invoice.due_date).days
    print(f"{invoice.hostel.name}: {days} days overdue")
```

#### 3. Apply Enforcement
```python
from payments.subscription_billing_engine import SubscriptionBillingEngine

SubscriptionBillingEngine.check_overdue_invoices()

# Verify hostels hidden
from hostels.models import Hostel
hidden_count = Hostel.objects.filter(status='inactive').count()
print(f"{hidden_count} hostels hidden for non-payment")
```

---

## Emergency Contacts

- **On-Call Engineer**: +254-XXX-XXXX
- **Backend Lead**: backend-lead@rumia.com
- **CTO**: cto@rumia.com
- **Safaricom Support**: 0722000000

## Escalation Path

1. **0-15 min**: On-call engineer attempts resolution
2. **15-30 min**: Escalate to Backend Lead
3. **30-60 min**: Escalate to CTO
4. **>60 min**: Engage external incident response team
