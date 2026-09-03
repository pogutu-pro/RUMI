import json
import psutil
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import time

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

def health_check(request):
    """Simple health check endpoint"""
    try:
        # Check Django database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
        db_response_time = time.time()

        # Check Redis connection
        if REDIS_AVAILABLE:
            try:
                r = redis.Redis.from_url(settings.CELERY_BROKER_URL)
                r.ping()
                redis_status = "healthy"
            except Exception as e:
                redis_status = f"unhealthy: {str(e)}"
        else:
            redis_status = "not_available"

        # Check Paystack key/env configuration (HARD-04/D-05) — same
        # get_config_status() check used by rent.checks' blocking system
        # check, surfaced here as a second, ongoing post-deploy visibility
        # layer in case the blocking check is ever bypassed or a key
        # rotation happens without a redeploy.
        from rent.providers.base import ProviderStatus
        from rent.providers.paystack import PaystackProvider

        paystack_config = PaystackProvider().get_config_status()
        paystack_status = (
            "healthy" if paystack_config.status == ProviderStatus.AVAILABLE else "unhealthy"
        )
        paystack_service = {"status": paystack_status}
        if paystack_status == "unhealthy":
            paystack_service["detail"] = paystack_config.message

        # Check system resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        health_data = {
            "status": "healthy",
            "timestamp": time.time(),
            "services": {
                "database": {"status": db_status},
                "redis": {"status": redis_status},
                "celery": {"status": "healthy" if redis_status == "healthy" else "unhealthy"},
                "paystack": paystack_service,
            },
            "system": {
                "cpu_usage_percent": cpu_percent,
                "memory_usage_percent": memory.percent,
                "disk_usage_percent": round((disk.used / disk.total) * 100, 2)
            },
            "version": "1.0.0"
        }

        if paystack_status == "unhealthy":
            health_data["status"] = "unhealthy"
            return JsonResponse(health_data, status=503)

        return JsonResponse(health_data)

    except Exception as e:
        error_data = {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }
        return JsonResponse(error_data, status=500)

def metrics_info(request):
    """Information about available metrics"""
    metrics_info = {
        "endpoints": {
            "/health": "System health check",
            "/metrics": "Prometheus metrics (django-prometheus)",
            "/metrics/django": "Django-specific metrics",
            "/metrics/system": "System metrics",
        },
        "prometheus_port": 8001,
        "metrics": [
            "django_http_requests_total",
            "django_http_request_duration_seconds",
            "rumi_requests_total",
            "rumi_cpu_usage_percent",
            "rumi_memory_usage_percent",
            "rumi_disk_usage_percent"
        ]
    }
    return JsonResponse(metrics_info)

@csrf_exempt
@require_http_methods(["GET"])
def system_metrics(request):
    """Raw system metrics in JSON format"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Get process information
        process = psutil.Process()
        
        metrics = {
            "cpu": {
                "usage_percent": cpu_percent,
                "count": psutil.cpu_count()
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": round((disk.used / disk.total) * 100, 2)
            },
            "process": {
                "pid": process.pid,
                "memory_percent": process.memory_percent(),
                "cpu_percent": process.cpu_percent(),
                "num_threads": process.num_threads()
            },
            "network": dict(psutil.net_io_counters()._asdict()) if psutil.net_io_counters() else {},
            "timestamp": time.time()
        }
        
        return JsonResponse(metrics)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def realtime_metrics(request):
    """Real-time metrics for tech support dashboard"""
    try:
        # Get current time
        now = time.time()
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Process metrics
        process = psutil.Process()
        process_memory = process.memory_info()
        
        # Get network stats
        network = psutil.net_io_counters()
        
        # Database connection count (approximation)
        try:
            from django.db import connections
            db_connections = len(connections.all())
        except:
            db_connections = 0
        
        # Redis connection status
        redis_status = "unknown"
        if REDIS_AVAILABLE:
            try:
                r = redis.Redis.from_url(settings.CELERY_BROKER_URL)
                r.ping()
                redis_status = "connected"
            except:
                redis_status = "disconnected"
        
        metrics = {
            "timestamp": now,
            "system": {
                "cpu_percent": round(cpu_percent, 2),
                "memory_percent": round(memory.percent, 2),
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "disk_percent": round((disk.used / disk.total) * 100, 2),
                "disk_used_gb": round(disk.used / (1024**3), 2),
                "disk_total_gb": round(disk.total / (1024**3), 2),
            },
            "application": {
                "db_connections": db_connections,
                "redis_status": redis_status,
                "process_memory_mb": round(process_memory.rss / (1024**2), 2),
                "process_cpu_percent": round(process.cpu_percent(), 2),
                "process_threads": process.num_threads(),
            },
            "network": {
                "bytes_sent": network.bytes_sent if network else 0,
                "bytes_recv": network.bytes_recv if network else 0,
                "packets_sent": network.packets_sent if network else 0,
                "packets_recv": network.packets_recv if network else 0,
            },
            "status": "healthy"
        }
        
        return JsonResponse(metrics)
        
    except Exception as e:
        return JsonResponse({
            "timestamp": time.time(),
            "status": "error",
            "error": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def service_status(request):
    """Detailed service status for tech support"""
    try:
        services = {}
        
        # Database check
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            services["database"] = {"status": "healthy", "response_time": "< 10ms"}
        except Exception as e:
            services["database"] = {"status": "unhealthy", "error": str(e)}
        
        # Redis check
        if REDIS_AVAILABLE:
            try:
                r = redis.Redis.from_url(settings.CELERY_BROKER_URL)
                start_time = time.time()
                r.ping()
                response_time = round((time.time() - start_time) * 1000, 2)
                services["redis"] = {"status": "healthy", "response_time": f"{response_time}ms"}
            except Exception as e:
                services["redis"] = {"status": "unhealthy", "error": str(e)}
        else:
            services["redis"] = {"status": "not_configured"}
        
        # Celery check
        try:
            # Simple celery ping
            from celery import current_app
            app = current_app._get_current_object()
            inspect = app.control.inspect()
            stats = inspect.stats()
            if stats:
                services["celery"] = {"status": "healthy", "workers": len(stats)}
            else:
                services["celery"] = {"status": "no_workers"}
        except Exception as e:
            services["celery"] = {"status": "unhealthy", "error": str(e)}
        
        # System load
        try:
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
            services["system_load"] = {
                "1min": round(load_avg[0], 2),
                "5min": round(load_avg[1], 2),
                "15min": round(load_avg[2], 2)
            }
        except:
            services["system_load"] = {"status": "unavailable"}
        
        return JsonResponse({
            "timestamp": time.time(),
            "services": services
        })
        
    except Exception as e:
        return JsonResponse({
            "timestamp": time.time(),
            "status": "error",
            "error": str(e)
        }, status=500)
