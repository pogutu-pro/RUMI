# Chaos Engineering Scenarios for Rumia Payments

**Purpose**: Test system resilience under failure conditions  
**Framework**: Custom scripts + manual testing

---

## Scenario 1: M-Pesa Complete Outage

**Hypothesis**: System gracefully degrades when M-Pesa is unavailable

### Setup
```bash
# Block outbound traffic to M-Pesa API
sudo iptables -A OUTPUT -d 196.201.214.0/24 -j DROP

# Or use toxiproxy
toxiproxy-cli create mpesa_api -l localhost:8474 -u api.safaricom.co.ke:443
toxiproxy-cli toxic add mpesa_api -t latency -a latency=10000
```

### Expected Behavior
- ✅ Payment initiation returns 503 with retry message
- ✅ Pending transactions remain in queue
- ✅ Error metrics increment (`payment_failed_total`)
- ✅ Alert sent to on-call engineer

### Validation
```bash
# Check error rate
curl localhost:8000/metrics | grep payment_failed_total

# Verify no data corruption
psql -c "SELECT COUNT(*) FROM transactions WHERE status='corrupted';"
# Should return 0
```

### Cleanup
```bash
sudo iptables -D OUTPUT -d 196.201.214.0/24 -j DROP
```

---

## Scenario 2: Database Connection Pool Exhaustion

**Hypothesis**: System handles DB connection exhaustion without crashing

### Setup
```python
# Reduce connection pool to 5
# In settings.py (temporarily)
DATABASES['default']['CONN_MAX_AGE'] = 60
DATABASES['default']['OPTIONS'] = {'max_connections': 5}

# Restart Django
sudo systemctl restart rumia-backend
```

### Load Generation
```bash
# Fire 100 concurrent requests
k6 run --vus 100 --duration 30s load_test_payments.js
```

### Expected Behavior
- ✅ Requests queue or timeout gracefully (not crash)
- ✅ Connection pool metrics visible in Prometheus
- ✅ 503 errors returned (not 500)

### Validation
```bash
# Check for application crashes
sudo journalctl -u rumia-backend | grep "fatal\|crash"

# Verify connection pool metrics
curl localhost:8000/metrics | grep db_connections
```

---

## Scenario 3: Redis Cache Failure

**Hypothesis**: Distributed locks degrade to DB locks without Redis

### Setup
```bash
# Stop Redis
sudo systemctl stop redis-server
```

### Expected Behavior
- ✅ Payment processing continues (slower)
- ✅ Idempotency still enforced via DB unique constraints
- ✅ No duplicate transactions created

### Validation
```bash
# Send duplicate M-Pesa callback
curl -X POST localhost:8000/mpesa/c2b/confirmation/ \
  -H "Content-Type: application/json" \
  -d @test_callback.json

curl -X POST localhost:8000/mpesa/c2b/confirmation/ \
  -H "Content-Type: application/json" \
  -d @test_callback.json

# Check for duplicates
psql -c "SELECT COUNT(*) FROM transactions WHERE mpesa_receipt_number='TEST123';"
# Should return 1 (not 2)
```

---

## Scenario 4: Partial Network Partition

**Hypothesis**: System handles split-brain scenarios

### Setup
```bash
# Simulate network latency to database
toxiproxy-cli create postgres -l localhost:5433 -u localhost:5432
toxiproxy-cli toxic add postgres -t latency -a latency=5000 -a jitter=1000
```

### Expected Behavior
- ✅ Requests timeout after configured threshold
- ✅ No partial writes (transactions roll back)
- ✅ Circuit breaker opens after threshold

### Validation
```python
# Check transaction atomicity
from payments.models import Transaction, BedPaymentLedger

# All successful transactions should have ledger entries
orphaned = Transaction.objects.filter(
    status='success',
    bed_attributions__isnull=True
)
assert orphaned.count() == 0
```

---

## Scenario 5: Subscription Invoice Generation During Peak Load

**Hypothesis**: Invoice generation doesn't impact user-facing APIs

### Setup
```bash
# Start load test
k6 run --vus 200 --duration 10m load_test_payments.js &

# Trigger invoice generation mid-test
python manage.py generate_monthly_invoices --month 2026-01
```

### Expected Behavior
- ✅ Payment API latency <3s (p95)
- ✅ Invoice generation completes within 5 minutes
- ✅ No database deadlocks

### Validation
```bash
# Check API latency during invoice generation
curl localhost:8000/metrics | grep http_req_duration

# Check for deadlocks
psql -c "SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';"
```

---

## Scenario 6: Corrupted M-Pesa Callback

**Hypothesis**: System rejects malformed callbacks without crashing

### Setup
```bash
# Send malformed JSON
curl -X POST localhost:8000/mpesa/c2b/confirmation/ \
  -H "Content-Type: application/json" \
  -d '{"invalid json'

# Send callback with missing fields
curl -X POST localhost:8000/mpesa/c2b/confirmation/ \
  -H "Content-Type: application/json" \
  -d '{"TransID": "ABC123"}'
```

### Expected Behavior
- ✅ Returns 400 Bad Request (not 500)
- ✅ No crash
- ✅ Error logged with details

---

## Scenario 7: Disk Space Exhaustion

**Hypothesis**: System handles disk full gracefully

### Setup
```bash
# Fill disk to 95% (test environment only!)
dd if=/dev/zero of=/tmp/fill bs=1M count=10000
```

### Expected Behavior
- ✅ Logs stop writing (graceful degradation)
- ✅ Alert triggered
- ✅ Database writes still succeed (assuming separate volume)

### Validation
```bash
df -h
# Check application still responds
curl -I localhost:8000/health/
```

---

## Scenario 8: Clock Skew

**Hypothesis**: System handles clock drift between servers

### Setup
```bash
# Set server time 5 minutes ahead
sudo date -s "+5 minutes"
```

### Expected Behavior
- ✅ JWT tokens still validated correctly
- ✅ Timestamp-based queries still work
- ✅ No duplicate invoice generation

### Validation
```python
# Check invoice uniqueness
from payments.subscription_models import SubscriptionInvoice

duplicates = SubscriptionInvoice.objects.values(
    'hostel', 'period_start', 'period_end'
).annotate(count=Count('id')).filter(count__gt=1)

assert duplicates.count() == 0
```

---

## Running Full Chaos Suite

```bash
#!/bin/bash
# chaos_suite.sh

echo "Starting Chaos Engineering Suite..."

# Scenario 1: M-Pesa Outage
echo "[1/8] Testing M-Pesa outage..."
./scenarios/mpesa_outage.sh

# Scenario 2: DB Pool Exhaustion
echo "[2/8] Testing DB connection pool..."
./scenarios/db_pool_exhaustion.sh

# ... run all scenarios ...

echo "Chaos suite complete. Check results in chaos_results.json"
```

---

## Monitoring During Chaos Tests

**Key Metrics to Watch**:
- `http_req_duration{quantile="0.95"}` - API latency
- `payment_failed_total` - Failure rate
- `db_connections_active` - DB pool usage
- `rumia_stuck_transactions_count` - Transaction backlog

**Alert Thresholds (Should NOT trigger during tests)**:
- Payment success rate <90%
- API latency p95 >5s
- Stuck transactions >500
