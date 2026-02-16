"""
Performance-Optimized Middleware for RUMI
Includes caching, compression, and monitoring for vertical scaling
"""

import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.http import HttpResponse
from django.conf import settings
from django.utils import timezone
from rumi.cache_utils import api_cache, default_cache_manager
import json
import hashlib

logger = logging.getLogger(__name__)


class APIResponseCacheMiddleware(MiddlewareMixin):
    """Middleware to cache API responses automatically"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
        
        # Cacheable HTTP methods
        self.cacheable_methods = {'GET', 'HEAD', 'OPTIONS'}
        
        # Default cache timeout (5 minutes)
        self.default_timeout = getattr(settings, 'API_CACHE_TIMEOUT', 300)
        
        # Paths to exclude from caching
        self.exclude_paths = getattr(settings, 'API_CACHE_EXCLUDE_PATHS', [
            '/api/v1/auth/login/',
            '/api/v1/auth/logout/',
            '/api/v1/auth/refresh-token/',
            '/api/v1/payments/',
            '/admin/',
            '/metrics/',
        ])
    
    def _has_auth_credentials(self, request):
        """Check if request carries authentication credentials.

        DRF authentication runs during view dispatch (after middleware),
        so request.user may not reflect the actual user at middleware time.
        We check for auth headers directly to avoid serving user-specific
        cached responses to the wrong user.
        """
        if request.META.get('HTTP_AUTHORIZATION'):
            return True
        if request.COOKIES.get('access_token') or request.COOKIES.get('sessionid'):
            return True
        # DRF's force_authenticate sets _force_auth_user without headers
        if getattr(request, '_force_auth_user', None):
            return True
        # Also check if Django's auth middleware has already set an authenticated user
        if hasattr(request, 'user') and hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
            return True
        return False

    def process_request(self, request):
        """Check cache before processing request"""

        # Only cache GET requests
        if request.method not in self.cacheable_methods:
            return None

        # Skip excluded paths
        if any(request.path.startswith(path) for path in self.exclude_paths):
            return None

        # Skip cache for authenticated requests - responses are user-specific
        # and middleware can't reliably identify the user before DRF auth runs
        if self._has_auth_credentials(request):
            return None

        # Try to get cached response (anonymous/public requests only)
        cached_response = api_cache.cache_api_response(
            endpoint=request.path,
            method=request.method,
        )

        if cached_response:
            # Add cache header
            response = HttpResponse(cached_response['content'])
            response['Content-Type'] = cached_response.get('content_type', 'application/json')
            response['X-Cache'] = 'HIT'
            response['X-Cache-TTL'] = str(cached_response.get('ttl', self.default_timeout))
            return response

        # Add cache miss header
        request._cache_miss = True
        return None
    
    def process_response(self, request, response):
        """Cache successful responses (anonymous/public requests only)"""

        # Only cache successful responses
        if response.status_code != 200:
            return response

        # Check if this was a cache miss
        if not getattr(request, '_cache_miss', False):
            return response

        # Only cache GET requests
        if request.method not in self.cacheable_methods:
            return response

        # Skip excluded paths
        if any(request.path.startswith(path) for path in self.exclude_paths):
            return response

        # Skip caching for authenticated requests - responses are user-specific
        if self._has_auth_credentials(request):
            return response

        # Prepare cache data
        cache_data = {
            'content': response.content.decode('utf-8') if hasattr(response, 'content') else str(response.content),
            'content_type': response.get('Content-Type', 'application/json'),
            'status_code': response.status_code,
            'cached_at': timezone.now().isoformat(),
            'ttl': self.default_timeout,
        }

        # Cache the response (anonymous/public only)
        api_cache.cache_api_response(
            endpoint=request.path,
            method=request.method,
            response_data=cache_data,
            timeout=self.default_timeout
        )

        # Add cache headers
        response['X-Cache'] = 'MISS'
        response['Cache-Control'] = f'public, max-age={self.default_timeout}'

        return response


class DatabaseConnectionMiddleware(MiddlewareMixin):
    """Middleware to optimize database connections"""
    
    def process_request(self, request):
        """Ensure database connection is ready"""
        from django.db import connection
        
        # Close any existing connections to prevent stale connections
        if connection.connection:
            connection.close()
        
        return None
    
    def process_response(self, request, response):
        """Close database connection after request"""
        from django.db import connection
        
        # Close connection to return it to the pool
        if connection.connection:
            connection.close()
        
        return response


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Middleware to monitor API performance"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
        
        # Performance thresholds
        self.slow_request_threshold = getattr(settings, 'SLOW_REQUEST_THRESHOLD', 2.0)  # seconds
        self.memory_threshold = getattr(settings, 'MEMORY_THRESHOLD', 100 * 1024 * 1024)  # 100MB
    
    def process_request(self, request):
        """Record request start time"""
        request._start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Log performance metrics"""
        
        if not hasattr(request, '_start_time'):
            return response
        
        # Calculate request duration
        duration = time.time() - request._start_time
        
        # Log slow requests
        if duration > self.slow_request_threshold:
            logger.warning(
                f"Slow request detected: {request.method} {request.path} "
                f"took {duration:.2f}s (status: {response.status_code})"
            )
        
        # Add performance headers
        response['X-Response-Time'] = f"{duration:.3f}s"
        
        # Log to metrics (if available)
        try:
            import psutil
            
            # Get memory usage
            process = psutil.Process()
            memory_usage = process.memory_info().rss
            
            if memory_usage > self.memory_threshold:
                logger.warning(
                    f"High memory usage: {memory_usage / 1024 / 1024:.1f}MB "
                    f"during {request.method} {request.path}"
                )
            
            response['X-Memory-Usage'] = f"{memory_usage / 1024 / 1024:.1f}MB"
            
        except ImportError:
            pass  # psutil not available
        
        return response


class CompressionMiddleware(MiddlewareMixin):
    """Middleware to compress responses for better performance"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
        
        # Minimum size to compress (1KB)
        self.min_compress_length = getattr(settings, 'COMPRESS_MIN_LENGTH', 1024)
        
        # Content types to compress
        self.compressible_types = getattr(settings, 'COMPRESSIBLE_TYPES', [
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json',
            'application/xml',
            'text/xml',
        ])
    
    def process_response(self, request, response):
        """Compress response if applicable"""
        
        # Check if response should be compressed
        if (hasattr(response, 'content') and 
            len(response.content) >= self.min_compress_length and
            response.get('Content-Type', '').split(';')[0] in self.compressible_types and
            'gzip' in request.META.get('HTTP_ACCEPT_ENCODING', '')):
            
            # Compress content
            try:
                import gzip
                from io import BytesIO
                
                # Compress the content
                buffer = BytesIO()
                with gzip.GzipFile(fileobj=buffer, mode='wb') as gz_file:
                    gz_file.write(response.content)
                
                compressed_content = buffer.getvalue()
                
                # Update response with compressed content
                response.content = compressed_content
                response['Content-Encoding'] = 'gzip'
                response['Content-Length'] = str(len(compressed_content))
                response['Vary'] = 'Accept-Encoding'
                
            except Exception as e:
                logger.error(f"Compression error: {e}")
        
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Middleware to add security headers for better performance and security"""
    
    def process_response(self, request, response):
        """Add security headers"""
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Performance headers
        response['X-DNS-Prefetch-Control'] = 'on'
        
        # Cache control for static assets
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            response['Cache-Control'] = 'public, max-age=31536000, immutable'
        
        return response


class RateLimitMiddleware(MiddlewareMixin):
    """Enhanced rate limiting middleware with Redis backend"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
        
        # Rate limits
        self.anonymous_limit = getattr(settings, 'RATE_LIMIT_ANONYMOUS', 100)  # per hour
        self.authenticated_limit = getattr(settings, 'RATE_LIMIT_AUTHENTICATED', 1000)  # per hour
        
        # Cache manager for rate limiting
        self.cache_manager = default_cache_manager
    
    def process_request(self, request):
        """Check rate limits"""
        # 1. Global toggle
        if not getattr(settings, 'ENABLE_RATE_LIMITING', True):
            return None

        # 2. Get client identifier
        client_id = self._get_client_id(request)
        
        # 3. Bypass for internal IPs (Development/Trusted)
        if hasattr(request, 'META'):
            remote_addr = request.META.get('REMOTE_ADDR')
            if remote_addr in getattr(settings, 'INTERNAL_IPS', []):
                return None

        # 4. Determine rate limit
        limit = self.authenticated_limit if (
            hasattr(request, 'user') and request.user.is_authenticated
        ) else self.anonymous_limit
        
        # 5. Check rate limit
        cache_key = f"rate_limit:{client_id}:{timezone.now().hour}"
        current_count = self.cache_manager.get(cache_key, 0)
        
        if current_count >= limit:
            logger.warning(f"Rate limit exceeded for {client_id}: {current_count}/{limit}")
            return HttpResponse(
                json.dumps({'error': 'Rate limit exceeded'}),
                status=429,
                content_type='application/json'
            )
        
        # 6. Increment counter
        self.cache_manager.set(cache_key, current_count + 1, timeout=3600)  # 1 hour
        
        return None
    
    def _get_client_id(self, request):
        """Get client identifier for rate limiting"""
        
        # Use user ID if authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"user:{request.user.id}"
        
        # Use IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        return f"ip:{hashlib.md5(ip.encode()).hexdigest()}"


class DatabaseQueryCountMiddleware(MiddlewareMixin):
    """Middleware to monitor and log database query counts"""
    
    def process_request(self, request):
        """Reset query count at start of request"""
        from django.db import connection
        
        # Reset queries
        connection.queries_log.clear()
        request._query_count = 0
        
        return None
    
    def process_response(self, request, response):
        """Log query count for performance monitoring"""
        
        from django.db import connection
        
        query_count = len(connection.queries)
        
        # Log if too many queries
        if query_count > 50:  # Threshold for "too many" queries
            logger.warning(
                f"High query count detected: {query_count} queries for "
                f"{request.method} {request.path}"
            )
        
        # Add query count header
        response['X-DB-Queries'] = str(query_count)
        
        return response
