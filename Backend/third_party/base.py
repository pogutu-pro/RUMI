"""
Third Party API Integration Base Service

This module provides the foundation for all third-party API integrations
in the RUMI platform, ensuring consistent error handling, logging, and
configuration management.
"""

import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
from datetime import datetime
import json

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone


@dataclass
class APIResponse:
    """Standardized API response format"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: Optional[int] = None
    response_time: Optional[float] = None
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = timezone.now()


@dataclass
class ServiceConfig:
    """Configuration for third-party services"""
    api_key: str
    api_secret: Optional[str] = None
    base_url: Optional[str] = None
    timeout: int = 30
    retries: int = 3
    cache_ttl: int = 300  # 5 minutes default
    enabled: bool = True
    rate_limit: Optional[int] = None  # requests per minute


class ThirdPartyServiceBase(ABC):
    """Base class for all third-party API services"""
    
    def __init__(self, service_name: str, config: ServiceConfig):
        self.service_name = service_name
        self.config = config
        self.logger = logging.getLogger(f"third_party.{service_name}")
        self._rate_limit_cache_key = f"rate_limit_{service_name}"
    
    @abstractmethod
    async def make_request(
        self, 
        endpoint: str, 
        method: str = "GET", 
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> APIResponse:
        """Make API request to third-party service"""
        pass
    
    def is_enabled(self) -> bool:
        """Check if service is enabled"""
        return self.config.enabled and bool(self.config.api_key)
    
    def get_cache_key(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Generate cache key for requests"""
        param_str = json.dumps(params or {}, sort_keys=True) if params else ""
        return f"{self.service_name}_{endpoint}_{hash(param_str)}"
    
    def get_from_cache(self, cache_key: str) -> Optional[APIResponse]:
        """Get response from cache"""
        try:
            cached_data = cache.get(cache_key)
            if cached_data:
                # Deserialize the cached response
                response_data = json.loads(cached_data)
                return APIResponse(**response_data)
        except Exception as e:
            self.logger.warning(f"Cache retrieval failed: {e}")
        return None
    
    def set_cache(self, cache_key: str, response: APIResponse) -> None:
        """Cache API response"""
        try:
            cache.set(
                cache_key, 
                json.dumps({
                    'success': response.success,
                    'data': response.data,
                    'error': response.error,
                    'status_code': response.status_code,
                    'timestamp': response.timestamp.isoformat() if response.timestamp else None
                }),
                self.config.cache_ttl
            )
        except Exception as e:
            self.logger.warning(f"Cache storage failed: {e}")
    
    def check_rate_limit(self) -> bool:
        """Check if rate limit allows request"""
        if not self.config.rate_limit:
            return True
        
        try:
            current_count = cache.get(self._rate_limit_cache_key, 0)
            if current_count >= self.config.rate_limit:
                return False
            
            # Increment counter
            cache.set(
                self._rate_limit_cache_key, 
                current_count + 1, 
                60  # Reset every minute
            )
            return True
        except Exception:
            return True  # Allow request if cache fails
    
    def handle_error(self, error: Exception, context: str = "") -> APIResponse:
        """Standardized error handling"""
        error_msg = f"{context}: {str(error)}" if context else str(error)
        self.logger.error(error_msg, exc_info=True)
        
        return APIResponse(
            success=False,
            error=error_msg,
            timestamp=timezone.now()
        )
    
    async def cached_request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        **kwargs
    ) -> APIResponse:
        """Make request with caching support"""
        if not self.is_enabled():
            return APIResponse(
                success=False,
                error=f"Service {self.service_name} is disabled"
            )
        
        # Check rate limiting
        if not self.check_rate_limit():
            return APIResponse(
                success=False,
                error="Rate limit exceeded"
            )
        
        cache_key = self.get_cache_key(endpoint, params)
        
        # Try cache first
        if use_cache and kwargs.get("method", "GET") == "GET":
            cached_response = self.get_from_cache(cache_key)
            if cached_response:
                self.logger.debug(f"Cache hit for {endpoint}")
                return cached_response
        
        # Make API request
        start_time = datetime.now()
        response = await self.make_request(endpoint, params=params, **kwargs)
        
        # Add timing info
        response.response_time = (datetime.now() - start_time).total_seconds()
        
        # Cache successful GET requests
        if use_cache and response.success and kwargs.get("method", "GET") == "GET":
            self.set_cache(cache_key, response)
        
        return response


class ServiceRegistry:
    """Registry for managing third-party services"""
    
    def __init__(self):
        self._services: Dict[str, ThirdPartyServiceBase] = {}
    
    def register(self, service: ThirdPartyServiceBase) -> None:
        """Register a third-party service"""
        self._services[service.service_name] = service
    
    def get_service(self, service_name: str) -> Optional[ThirdPartyServiceBase]:
        """Get registered service by name"""
        return self._services.get(service_name)
    
    def get_all_services(self) -> Dict[str, ThirdPartyServiceBase]:
        """Get all registered services"""
        return self._services.copy()
    
    def get_enabled_services(self) -> Dict[str, ThirdPartyServiceBase]:
        """Get only enabled services"""
        return {
            name: service 
            for name, service in self._services.items() 
            if service.is_enabled()
        }


# Global service registry instance
service_registry = ServiceRegistry()


def register_service(service: ThirdPartyServiceBase):
    """Decorator to automatically register services"""
    service_registry.register(service)
    return service


def get_service(service_name: str) -> Optional[ThirdPartyServiceBase]:
    """Get a registered service by name"""
    return service_registry.get_service(service_name)


def get_all_services() -> Dict[str, ThirdPartyServiceBase]:
    """Get all registered services"""
    return service_registry.get_all_services()


def get_enabled_services() -> Dict[str, ThirdPartyServiceBase]:
    """Get only enabled services"""
    return service_registry.get_enabled_services()
