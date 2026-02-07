"""
Prometheus metrics for Rumia Payments System.

Tracks:
- Payment volume and success rates
- M-Pesa callback latency
- Subscription invoice status
- Transaction state distribution
"""

from prometheus_client import Counter, Histogram, Gauge, Info
import time

# Payment Volume Metrics
payment_initiated_total = Counter(
    'rumia_payment_initiated_total',
    'Total number of payment attempts initiated',
    ['hostel_id', 'payment_method', 'payment_type']
)

payment_success_total = Counter(
    'rumia_payment_success_total',
    'Total number of successful payments',
    ['hostel_id', 'payment_method', 'payment_type']
)

payment_failed_total = Counter(
    'rumia_payment_failed_total',
    'Total number of failed payments',
    ['hostel_id', 'payment_method', 'failure_reason']
)

# M-Pesa Callback Metrics
mpesa_callback_latency_seconds = Histogram(
    'rumia_mpesa_callback_latency_seconds',
    'Time from STK push to callback receipt',
    ['hostel_id'],
    buckets=[0.5, 1, 2, 5, 10, 30, 60, 120, 300]
)

mpesa_callback_total = Counter(
    'rumia_mpesa_callback_total',
    'Total M-Pesa callbacks received',
    ['callback_type', 'result_code']
)

# Transaction State Metrics
pending_transactions = Gauge(
    'rumia_pending_transactions_count',
    'Number of transactions in pending state',
    ['hostel_id']
)

stuck_transactions = Gauge(
    'rumia_stuck_transactions_count',
    'Number of transactions stuck for >15 minutes',
    ['hostel_id']
)

# Subscription Billing Metrics
subscription_invoices_issued = Counter(
    'rumia_subscription_invoices_issued_total',
    'Total subscription invoices issued',
    ['plan_name']
)

subscription_invoices_paid = Counter(
    'rumia_subscription_invoices_paid_total',
    'Total subscription invoices paid',
    ['plan_name']
)

subscription_invoices_overdue = Gauge(
    'rumia_subscription_invoices_overdue_count',
    'Number of overdue subscription invoices',
    ['days_overdue_bucket']
)

# Bed Occupancy Metrics
bed_occupancy_rate = Gauge(
    'rumia_bed_occupancy_rate_percent',
    'Bed occupancy rate percentage',
    ['hostel_id']
)

total_beds_active = Gauge(
    'rumia_total_beds_active_count',
    'Total number of active beds',
    ['hostel_id']
)

# Payment Ledger Metrics
payment_ledger_entries = Counter(
    'rumia_payment_ledger_entries_total',
    'Total payment ledger entries created',
    ['attributed_by']
)

# System Health
system_info = Info(
    'rumia_payments_system',
    'Rumia payments system information'
)

# Initialize system info
system_info.info({
    'version': '2.0.0',
    'component': 'payments',
    'environment': 'production'
})


class MetricsHelper:
    """Helper class for emitting metrics from business logic"""
    
    @staticmethod
    def record_payment_initiated(hostel_id, payment_method, payment_type='rent'):
        """Record payment initiation"""
        payment_initiated_total.labels(
            hostel_id=str(hostel_id),
            payment_method=payment_method,
            payment_type=payment_type
        ).inc()
    
    @staticmethod
    def record_payment_success(hostel_id, payment_method, payment_type='rent'):
        """Record successful payment"""
        payment_success_total.labels(
            hostel_id=str(hostel_id),
            payment_method=payment_method,
            payment_type=payment_type
        ).inc()
    
    @staticmethod
    def record_payment_failure(hostel_id, payment_method, failure_reason):
        """Record payment failure"""
        payment_failed_total.labels(
            hostel_id=str(hostel_id),
            payment_method=payment_method,
            failure_reason=failure_reason
        ).inc()
    
    @staticmethod
    def record_mpesa_callback(callback_type, result_code, latency_seconds=None, hostel_id=None):
        """Record M-Pesa callback"""
        mpesa_callback_total.labels(
            callback_type=callback_type,
            result_code=str(result_code)
        ).inc()
        
        if latency_seconds and hostel_id:
            mpesa_callback_latency_seconds.labels(
                hostel_id=str(hostel_id)
            ).observe(latency_seconds)
    
    @staticmethod
    def update_pending_transactions_count(hostel_id, count):
        """Update pending transactions gauge"""
        pending_transactions.labels(
            hostel_id=str(hostel_id)
        ).set(count)
    
    @staticmethod
    def update_stuck_transactions_count(hostel_id, count):
        """Update stuck transactions gauge"""
        stuck_transactions.labels(
            hostel_id=str(hostel_id)
        ).set(count)
    
    @staticmethod
    def record_invoice_issued(plan_name):
        """Record subscription invoice issuance"""
        subscription_invoices_issued.labels(
            plan_name=plan_name
        ).inc()
    
    @staticmethod
    def record_invoice_paid(plan_name):
        """Record subscription invoice payment"""
        subscription_invoices_paid.labels(
            plan_name=plan_name
        ).inc()
    
    @staticmethod
    def update_overdue_invoices(days_bucket, count):
        """Update overdue invoices gauge"""
        subscription_invoices_overdue.labels(
            days_overdue_bucket=days_bucket
        ).set(count)
    
    @staticmethod
    def update_bed_occupancy(hostel_id, occupancy_rate, total_beds):
        """Update bed occupancy metrics"""
        bed_occupancy_rate.labels(
            hostel_id=str(hostel_id)
        ).set(occupancy_rate)
        
        total_beds_active.labels(
            hostel_id=str(hostel_id)
        ).set(total_beds)
    
    @staticmethod
    def record_ledger_entry(attributed_by):
        """Record payment ledger entry creation"""
        payment_ledger_entries.labels(
            attributed_by=attributed_by
        ).inc()
