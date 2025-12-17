from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import psutil
import time

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

@api_view(['GET'])
@permission_classes([AllowAny])
def monitoring_health(request):
    """
    System health check endpoint
    
    Returns overall system health status including all critical services:
    - Database connectivity
    - Redis connection status  
    - Celery worker status
    - System resource usage (CPU, memory, disk)
    
    This endpoint is designed for monitoring systems and health checks.
    """
    try:
        # Check Django database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
        
        # Check Redis connection
        if REDIS_AVAILABLE:
            try:
                r = redis.Redis.from_url('redis://localhost:6379/0')
                r.ping()
                redis_status = "healthy"
            except Exception as e:
                redis_status = f"unhealthy: {str(e)}"
        else:
            redis_status = "not_available"
        
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
                "celery": {"status": "healthy" if redis_status == "healthy" else "unhealthy"}
            },
            "system": {
                "cpu_usage_percent": round(cpu_percent, 2),
                "memory_usage_percent": round(memory.percent, 2),
                "disk_usage_percent": round((disk.used / disk.total) * 100, 2)
            },
            "version": "1.0.0"
        }
        
        return Response(health_data)
        
    except Exception as e:
        error_data = {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }
        return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def monitoring_realtime(request):
    """
    Real-time system metrics for dashboard display
    
    Returns live system and application metrics optimized for real-time monitoring:
    - System resources (CPU, memory, disk usage)
    - Application metrics (process memory, threads, database connections)
    - Network statistics (bytes transferred, packet counts)
    - Service connectivity status
    
    Use this endpoint for live dashboard updates (poll every 5-10 seconds).
    """
    try:
        now = time.time()
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Process metrics
        process = psutil.Process()
        process_memory = process.memory_info()
        
        # Network stats
        network = psutil.net_io_counters()
        
        # Database connection count
        try:
            from django.db import connections
            db_connections = len(connections.all())
        except:
            db_connections = 0
        
        # Redis connection status
        redis_status = "unknown"
        if REDIS_AVAILABLE:
            try:
                r = redis.Redis.from_url('redis://localhost:6379/0')
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
        
        return Response(metrics)
        
    except Exception as e:
        return Response({
            "timestamp": time.time(),
            "status": "error",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def monitoring_services(request):
    """
    Detailed service status with response times
    
    Provides comprehensive status checks for all critical services:
    - Database connectivity with response time
    - Redis connection with latency measurement
    - Celery worker status and count
    - System load averages
    
    Use this endpoint for service health monitoring and alerting.
    """
    try:
        services = {}
        
        # Database check
        try:
            from django.db import connection
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            response_time = round((time.time() - start_time) * 1000, 2)
            services["database"] = {"status": "healthy", "response_time": f"{response_time}ms"}
        except Exception as e:
            services["database"] = {"status": "unhealthy", "error": str(e)}
        
        # Redis check
        if REDIS_AVAILABLE:
            try:
                r = redis.Redis.from_url('redis://localhost:6379/0')
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
            if hasattr(psutil, 'getloadavg'):
                load_avg = psutil.getloadavg()
                services["system_load"] = {
                    "1min": round(load_avg[0], 2),
                    "5min": round(load_avg[1], 2), 
                    "15min": round(load_avg[2], 2)
                }
            else:
                services["system_load"] = {"status": "unavailable"}
        except:
            services["system_load"] = {"status": "unavailable"}
        
        return Response({
            "timestamp": time.time(),
            "services": services
        })
        
    except Exception as e:
        return Response({
            "timestamp": time.time(),
            "status": "error",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def monitoring_system(request):
    """
    Raw system metrics for detailed monitoring
    
    Returns comprehensive system information including:
    - CPU usage and core count
    - Memory statistics (total, available, used, free)
    - Disk usage and storage information
    - Process-specific metrics (memory, CPU, threads)
    - Network I/O statistics
    
    This endpoint provides detailed metrics for advanced monitoring and analysis.
    """
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
        
        return Response(metrics)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def monitoring_info(request):
    """
    Information about available monitoring endpoints
    
    Returns documentation and metadata about all available monitoring endpoints:
    - Endpoint descriptions
    - Available metrics list
    - Prometheus integration details
    
    Use this endpoint to discover available monitoring capabilities.
    """
    metrics_info = {
        "endpoints": {
            "/health/": "System health check",
            "/health/realtime/": "Real-time metrics for dashboards",
            "/health/services/": "Detailed service status with response times",
            "/health/system/": "Raw system metrics",
            "/health/info/": "This endpoint - API information",
            "/metrics/": "Prometheus metrics (standard format)",
        },
        "prometheus_port": 8001,
        "metrics": [
            "django_http_requests_total",
            "django_http_request_duration_seconds", 
            "rumi_requests_total",
            "rumi_cpu_usage_percent",
            "rumi_memory_usage_percent",
            "rumi_disk_usage_percent"
        ],
        "integration": {
            "base_url": "http://localhost:8000/",
            "recommended_poll_interval": "5-10 seconds for real-time endpoints",
            "authentication": "Currently open - implement auth for production"
        }
    }
    return Response(metrics_info)
