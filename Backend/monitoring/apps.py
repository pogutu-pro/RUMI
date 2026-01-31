from django.apps import AppConfig
import psutil
import time

try:
    from prometheus_client import Counter, Histogram, Gauge, start_http_server
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

class MonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'monitoring'
    verbose_name = 'RUMI Monitoring'

    def ready(self):
        """Start Prometheus metrics server when Django starts"""
        if not PROMETHEUS_AVAILABLE:
            print("Prometheus client not available, skipping metrics setup")
            return
            
        # Custom metrics for RUMI platform
        self.request_count = Counter('rumi_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
        self.response_time = Histogram('rumi_request_duration_seconds', 'Request duration in seconds')
        self.active_users = Gauge('rumi_active_users', 'Number of active users')
        self.database_connections = Gauge('rumi_db_connections', 'Database connections')
        self.redis_connected = Gauge('rumi_redis_connected', 'Redis connection status')
        self.celery_tasks = Gauge('rumi_celery_tasks', 'Celery tasks', ['status'])
        
        # System metrics
        self.cpu_usage = Gauge('rumi_cpu_usage_percent', 'CPU usage percentage')
        self.memory_usage = Gauge('rumi_memory_usage_percent', 'Memory usage percentage')
        self.disk_usage = Gauge('rumi_disk_usage_percent', 'Disk usage percentage')
        
        # Start Prometheus HTTP server on port 8002
        try:
            start_http_server(8002)
            print("Prometheus metrics server started on port 8002")
        except Exception as e:
            print(f"Failed to start Prometheus metrics server: {e}")
        
        # Start system metrics collection
        self.collect_system_metrics()

    def collect_system_metrics(self):
        """Collect system metrics periodically"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            if hasattr(self, 'cpu_usage'):
                self.cpu_usage.set(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            if hasattr(self, 'memory_usage'):
                self.memory_usage.set(memory.percent)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            if hasattr(self, 'disk_usage'):
                self.disk_usage.set((disk.used / disk.total) * 100)
            
        except Exception as e:
            print(f"Error collecting system metrics: {e}")
