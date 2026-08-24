"""
Advanced Caching Utilities for RUMI
Multi-layer caching strategy with Redis for vertical scaling
"""

from django.core.cache import cache, caches
from django.core.cache.backends.base import InvalidCacheBackendError
from django.conf import settings
from django.utils import timezone
from django.db.models import Model
from django.core.serializers.json import DjangoJSONEncoder
import json
import hashlib
import logging
from typing import Any, Optional, Union, Callable
from functools import wraps
from datetime import timedelta

logger = logging.getLogger(__name__)


class CacheManager:
    """Advanced cache manager with multiple strategies"""
    
    def __init__(self, cache_alias='default'):
        self.cache_alias = cache_alias
        try:
            self.cache = caches[cache_alias]
        except InvalidCacheBackendError:
            if cache_alias != 'default' and 'default' in getattr(settings, 'CACHES', {}):
                logger.warning(
                    "Cache alias '%s' is not configured; falling back to 'default'.",
                    cache_alias,
                )
                self.cache = caches['default']
            else:
                raise
        self.default_timeout = getattr(settings, 'CACHE_DEFAULT_TIMEOUT', 300)
    
    def get_cache_key(self, prefix: str, identifier: str, *args) -> str:
        """Generate consistent cache keys"""
        key_parts = [prefix, identifier]
        key_parts.extend(str(arg) for arg in args)
        key_string = ':'.join(key_parts)
        return f"rumi:{hashlib.md5(key_string.encode()).hexdigest()}"
    
    def get(self, key: str, default=None) -> Any:
        """Get value from cache with error handling"""
        try:
            return self.cache.get(key, default)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return default
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """Set value in cache with error handling"""
        try:
            timeout = timeout or self.default_timeout
            return self.cache.set(key, value, timeout)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return self.cache.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def get_or_set(self, key: str, default_func: Callable, timeout: Optional[int] = None) -> Any:
        """Get value from cache or set using default function"""
        value = self.get(key)
        if value is None:
            value = default_func()
            self.set(key, value, timeout)
        return value
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache keys matching pattern"""
        try:
            if hasattr(self.cache, 'delete_pattern'):
                return self.cache.delete_pattern(pattern)
            else:
                # Fallback for basic cache backends
                keys = self.cache.keys(f"*{pattern}*")
                deleted_count = 0
                for key in keys:
                    if self.delete(key):
                        deleted_count += 1
                return deleted_count
        except Exception as e:
            logger.error(f"Cache invalidation error for pattern {pattern}: {e}")
            return 0


class ModelCacheManager:
    """Cache manager specifically for Django models"""
    
    def __init__(self, model_class: Model, cache_manager: Optional[CacheManager] = None):
        self.model_class = model_class
        self.cache_manager = cache_manager or CacheManager()
        self.model_name = model_class._meta.model_name
        self.app_label = model_class._meta.app_label
    
    def get_instance_cache_key(self, instance_id: Union[int, str]) -> str:
        """Get cache key for model instance"""
        return f"{self.app_label}:{self.model_name}:instance:{instance_id}"
    
    def get_queryset_cache_key(self, query_params: str) -> str:
        """Get cache key for queryset"""
        return f"{self.app_label}:{self.model_name}:queryset:{hashlib.md5(query_params.encode()).hexdigest()}"
    
    def get_instance(self, instance_id: Union[int, str]) -> Optional[Model]:
        """Get cached model instance"""
        cache_key = self.get_instance_cache_key(instance_id)
        return self.cache_manager.get(cache_key)
    
    def set_instance(self, instance: Model, timeout: Optional[int] = None) -> bool:
        """Cache model instance"""
        cache_key = self.get_instance_cache_key(instance.pk)
        return self.cache_manager.set(cache_key, instance, timeout)
    
    def get_queryset(self, query_params: str, queryset_func: Callable, timeout: Optional[int] = None) -> list:
        """Get cached queryset"""
        cache_key = self.get_queryset_cache_key(query_params)
        return self.cache_manager.get_or_set(cache_key, queryset_func, timeout)
    
    def invalidate_instance(self, instance_id: Union[int, str]) -> bool:
        """Invalidate cached instance"""
        cache_key = self.get_instance_cache_key(instance_id)
        return self.cache_manager.delete(cache_key)
    
    def invalidate_queryset_pattern(self) -> int:
        """Invalidate all queryset caches for this model"""
        pattern = f"{self.app_label}:{self.model_name}:queryset:"
        return self.cache_manager.invalidate_pattern(pattern)


def cache_query(timeout: int = 300, cache_manager: Optional[CacheManager] = None):
    """Decorator for caching query results"""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_mgr = cache_manager or CacheManager()
            
            # Generate cache key
            func_name = f"{func.__module__}.{func.__name__}"
            args_str = str(args) + str(sorted(kwargs.items()))
            cache_key = cache_mgr.get_cache_key('query', func_name, args_str)
            
            # Try to get from cache
            result = cache_mgr.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_mgr.set(cache_key, result, timeout)
            
            return result
        
        return wrapper
    return decorator


def cache_model_instance(timeout: int = 300, cache_manager: Optional[CacheManager] = None):
    """Decorator for caching model instances"""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_mgr = cache_manager or CacheManager()
            
            # Get model instance from cache if possible
            if args and hasattr(args[0], 'pk'):
                instance_id = args[0].pk
                model_class = args[0].__class__
                model_cache = ModelCacheManager(model_class, cache_mgr)
                
                cached_instance = model_cache.get_instance(instance_id)
                if cached_instance is not None:
                    return cached_instance
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache the result if it's a model instance
            if hasattr(result, 'pk') and hasattr(result, '__class__'):
                model_cache = ModelCacheManager(result.__class__, cache_mgr)
                model_cache.set_instance(result, timeout)
            
            return result
        
        return wrapper
    return decorator


class APIResponseCache:
    """Cache API responses with intelligent invalidation"""
    
    def __init__(self):
        self.cache_manager = CacheManager()
        self.session_cache = CacheManager('sessions')
        self.template_cache = CacheManager('template_fragments')
    
    def cache_api_response(self, endpoint: str, method: str, user_id: Optional[str] = None, 
                          response_data: Any = None, timeout: int = 300) -> Optional[Any]:
        """Cache or retrieve API response"""
        
        # Generate cache key
        key_parts = ['api', endpoint, method]
        if user_id:
            key_parts.append(f"user:{user_id}")
        
        cache_key = self.cache_manager.get_cache_key(*key_parts)
        
        if response_data is None:
            # Get from cache
            return self.cache_manager.get(cache_key)
        else:
            # Set in cache
            return self.cache_manager.set(cache_key, response_data, timeout)
    
    def invalidate_user_cache(self, user_id: str) -> int:
        """Invalidate all cache entries for a specific user"""
        patterns = [
            f"*user:{user_id}*",
            f"rumi:accounts:user:instance:{user_id}",
        ]
        
        total_invalidated = 0
        for pattern in patterns:
            total_invalidated += self.cache_manager.invalidate_pattern(pattern)
        
        return total_invalidated
    
    def cache_hostel_listings(self, city: str, filters: dict, listings: list = None, timeout: int = 600) -> Optional[list]:
        """Cache hostel listings with location-based invalidation"""
        
        # Generate cache key based on location and filters
        filter_str = json.dumps(filters, sort_keys=True)
        cache_key = self.cache_manager.get_cache_key('hostels', 'listings', city, filter_str)
        
        if listings is None:
            return self.cache_manager.get(cache_key)
        else:
            return self.cache_manager.set(cache_key, listings, timeout)
    
    def invalidate_hostel_cache(self, hostel_id: str) -> int:
        """Invalidate cache for specific hostel"""
        patterns = [
            f"*hostel:{hostel_id}*",
            f"*hostels:listings*",  # Invalidate all listings
        ]
        
        total_invalidated = 0
        for pattern in patterns:
            total_invalidated += self.cache_manager.invalidate_pattern(pattern)
        
        return total_invalidated
    
    def cache_payment_stats(self, landlord_id: str, period: str, stats: dict = None, timeout: int = 1800) -> Optional[dict]:
        """Cache payment statistics"""
        cache_key = self.cache_manager.get_cache_key('payments', 'stats', landlord_id, period)
        
        if stats is None:
            return self.cache_manager.get(cache_key)
        else:
            return self.cache_manager.set(cache_key, stats, timeout)
    
    def cache_analytics_data(self, analytics_type: str, date_range: str, data: dict = None, timeout: int = 3600) -> Optional[dict]:
        """Cache analytics data"""
        cache_key = self.cache_manager.get_cache_key('analytics', analytics_type, date_range)
        
        if data is None:
            return self.cache_manager.get(cache_key)
        else:
            return self.cache_manager.set(cache_key, data, timeout)


class CacheWarmer:
    """Cache warming utilities for frequently accessed data"""
    
    def __init__(self):
        self.api_cache = APIResponseCache()
        self.cache_manager = CacheManager()
    
    def warm_popular_hostels(self, limit: int = 50):
        """Warm cache for popular hostels"""
        from hostels.models import Hostel
        
        try:
            popular_hostels = Hostel.objects.filter(
                status='active',
                available_rooms__gt=0
            ).order_by('-total_rooms')[:limit]
            
            for hostel in popular_hostels:
                # Cache hostel details
                hostel_data = {
                    'id': hostel.id,
                    'name': hostel.name,
                    'base_price': str(hostel.base_price),
                    'available_rooms': hostel.available_rooms,
                    'city': hostel.city,
                }
                
                cache_key = self.cache_manager.get_cache_key('hostel', 'details', str(hostel.id))
                self.cache_manager.set(cache_key, hostel_data, timeout=1800)
            
            logger.info(f"Warmed cache for {len(popular_hostels)} popular hostels")
            
        except Exception as e:
            logger.error(f"Error warming hostel cache: {e}")
    
    def warm_user_dashboards(self):
        """Warm cache for user dashboard data"""
        from accounts.models import User
        
        try:
            active_users = User.objects.filter(
                is_active=True,
                last_login__gte=timezone.now() - timedelta(days=7)
            )
            
            for user in active_users:
                # Cache user dashboard data
                dashboard_key = self.cache_manager.get_cache_key('dashboard', 'data', str(user.id))
                # This would typically call the dashboard view logic
                # For now, we'll just cache basic user info
                user_data = {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                }
                
                self.cache_manager.set(dashboard_key, user_data, timeout=900)
            
            logger.info(f"Warmed cache for {len(active_users)} active user dashboards")
            
        except Exception as e:
            logger.error(f"Error warming dashboard cache: {e}")
    
    def warm_payment_stats(self):
        """Warm cache for payment statistics"""
        from payments.models import Transaction
        
        try:
            # Cache recent payment stats
            recent_stats = {
                'total_transactions': Transaction.objects.filter(
                    created_at__gte=timezone.now() - timedelta(days=1)
                ).count(),
                'total_amount': str(Transaction.objects.filter(
                    created_at__gte=timezone.now() - timedelta(days=1),
                    status='completed'
                ).aggregate(total=models.Sum('amount'))['total'] or 0),
            }
            
            self.api_cache.cache_payment_stats('system', 'daily', recent_stats, timeout=1800)
            logger.info("Warmed payment statistics cache")
            
        except Exception as e:
            logger.error(f"Error warming payment stats cache: {e}")


# Global cache instances
default_cache_manager = CacheManager()
api_cache = APIResponseCache()
cache_warmer = CacheWarmer()


def get_cached_response(endpoint: str, method: str, user_id: Optional[str] = None) -> Optional[Any]:
    """Convenience function to get cached API response"""
    return api_cache.cache_api_response(endpoint, method, user_id)


def set_cached_response(endpoint: str, method: str, response_data: Any, 
                       user_id: Optional[str] = None, timeout: int = 300) -> bool:
    """Convenience function to set cached API response"""
    return api_cache.cache_api_response(endpoint, method, user_id, response_data, timeout)
