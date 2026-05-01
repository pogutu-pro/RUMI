import time
from prometheus_client import Counter

PAYMENT_FAILURES = Counter(
    'payment_failure_total',
    'Total number of failed payments',
    ['provider', 'reason']
)

class PrometheusMetricsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
