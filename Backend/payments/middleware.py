import time
from prometheus_client import Histogram, Counter

# Metrics Definition
MPESA_LATENCY = Histogram(
    'mpesa_latency_seconds',
    'Time taken for M-Pesa API to respond',
    ['endpoint']
)
PAYMENT_FAILURES = Counter(
    'payment_failure_total',
    'Total number of failed payments',
    ['provider', 'reason']
)

class PrometheusMetricsMiddleware:
    """
    Middleware to intercept M-Pesa callbacks and record metrics.
    Note: Real-world Prometheus setup usually involves a separate endpoint (/metrics)
    exposed via django-prometheus, but we define custom business metrics here.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Track M-Pesa Webhook Latency
        if request.path.startswith('/api/v1/payments/webhook/mpesa/'):
            duration = time.time() - start_time
            MPESA_LATENCY.labels(endpoint=request.path).observe(duration)
            
        return response
