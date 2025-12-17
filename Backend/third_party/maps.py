"""
Google Maps API Integration

Provides location-based services for the RUMI platform:
- Geocoding (address to coordinates)
- Reverse geocoding (coordinates to address)
- Distance calculation
- Place search and autocomplete
- Route optimization
- Location validation
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

from django.conf import settings
from .base import ThirdPartyServiceBase, ServiceConfig, APIResponse, register_service


@dataclass
class Location:
    """Location data structure"""
    latitude: float
    longitude: float
    address: Optional[str] = None
    place_id: Optional[str] = None
    types: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'place_id': self.place_id,
            'types': self.types
        }


@dataclass
class DistanceResult:
    """Distance calculation result"""
    distance_km: float
    distance_meters: float
    duration_seconds: Optional[int] = None
    duration_text: Optional[str] = None
    mode: str = "driving"  # driving, walking, transit, bicycling


class MapsService(ThirdPartyServiceBase):
    """Google Maps API service"""
    
    def __init__(self):
        config = ServiceConfig(
            api_key=settings.GOOGLE_MAPS_API_KEY or "",
            base_url="https://maps.googleapis.com/maps/api",
            timeout=30,
            retries=3,
            cache_ttl=3600,  # Cache for 1 hour
            enabled=bool(settings.GOOGLE_MAPS_API_KEY),
            rate_limit=50  # 50 requests per minute
        )
        super().__init__("maps", config)
        
        # API endpoints
        self.geocode_endpoint = "/geocode/json"
        self.reverse_geocode_endpoint = "/geocode/json"
        self.distance_matrix_endpoint = "/distancematrix/json"
        self.places_endpoint = "/place"
        self.directions_endpoint = "/directions/json"
    
    async def geocode_address(self, address: str, region: str = "ke") -> APIResponse:
        """Convert address to coordinates"""
        try:
            params = {
                'address': address,
                'region': region,
                'key': self.config.api_key
            }
            
            response = await self.cached_request(
                endpoint=self.geocode_endpoint,
                params=params,
                use_cache=True
            )
            
            if response.success:
                location_data = self._parse_geocode_response(response.data)
                return APIResponse(
                    success=True,
                    data=location_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Geocoding failed")
    
    async def reverse_geocode(self, latitude: float, longitude: float) -> APIResponse:
        """Convert coordinates to address"""
        try:
            params = {
                'latlng': f"{latitude},{longitude}",
                'key': self.config.api_key
            }
            
            response = await self.cached_request(
                endpoint=self.reverse_geocode_endpoint,
                params=params,
                use_cache=True
            )
            
            if response.success:
                address_data = self._parse_reverse_geocode_response(response.data)
                return APIResponse(
                    success=True,
                    data=address_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Reverse geocoding failed")
    
    async def calculate_distance(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        mode: str = "driving"
    ) -> APIResponse:
        """Calculate distance between two points"""
        try:
            params = {
                'origins': f"{origin[0]},{origin[1]}",
                'destinations': f"{destination[0]},{destination[1]}",
                'mode': mode,
                'units': 'metric',
                'key': self.config.api_key
            }
            
            response = await self.cached_request(
                endpoint=self.distance_matrix_endpoint,
                params=params,
                use_cache=True
            )
            
            if response.success:
                distance_data = self._parse_distance_response(response.data)
                return APIResponse(
                    success=True,
                    data=distance_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Distance calculation failed")
    
    async def calculate_distance_haversine(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float]
    ) -> DistanceResult:
        """Calculate distance using Haversine formula (fallback)"""
        # Haversine formula for distance calculation
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = origin
        lat2, lon2 = destination
        
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        distance_km = R * c
        
        return DistanceResult(
            distance_km=round(distance_km, 2),
            distance_meters=round(distance_km * 1000, 2)
        )
    
    async def validate_location(self, latitude: float, longitude: float) -> APIResponse:
        """Validate if coordinates are in a valid location"""
        try:
            # Reverse geocode to check if location exists
            reverse_response = await self.reverse_geocode(latitude, longitude)
            
            if reverse_response.success and reverse_response.data:
                # Check if we got a valid address
                results = reverse_response.data.get('results', [])
                if results:
                    return APIResponse(
                        success=True,
                        data={
                            'valid': True,
                            'address': results[0].get('formatted_address'),
                            'location_type': results[0].get('geometry', {}).get('location_type')
                        }
                    )
            
            return APIResponse(
                success=True,
                data={'valid': False, 'reason': 'No address found for coordinates'}
            )
            
        except Exception as e:
            return self.handle_error(e, "Location validation failed")
    
    async def search_nearby_hostels(
        self,
        latitude: float,
        longitude: float,
        radius: int = 5000,
        keyword: str = "hostel"
    ) -> APIResponse:
        """Search for nearby hostels using Places API"""
        try:
            params = {
                'location': f"{latitude},{longitude}",
                'radius': radius,
                'keyword': keyword,
                'type': 'lodging',
                'key': self.config.api_key
            }
            
            response = await self.cached_request(
                endpoint=f"{self.places_endpoint}/nearbysearch/json",
                params=params,
                use_cache=True
            )
            
            if response.success:
                places_data = self._parse_places_response(response.data)
                return APIResponse(
                    success=True,
                    data=places_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Nearby search failed")
    
    async def get_directions(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        mode: str = "driving"
    ) -> APIResponse:
        """Get directions between two points"""
        try:
            params = {
                'origin': f"{origin[0]},{origin[1]}",
                'destination': f"{destination[0]},{destination[1]}",
                'mode': mode,
                'key': self.config.api_key
            }
            
            response = await self.cached_request(
                endpoint=self.directions_endpoint,
                params=params,
                use_cache=True
            )
            
            if response.success:
                directions_data = self._parse_directions_response(response.data)
                return APIResponse(
                    success=True,
                    data=directions_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "Directions request failed")
    
    def _parse_geocode_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse geocoding API response"""
        results = data.get('results', [])
        if not results:
            return {'locations': []}
        
        locations = []
        for result in results:
            location_data = result.get('geometry', {}).get('location', {})
            if location_data:
                location = Location(
                    latitude=location_data.get('lat'),
                    longitude=location_data.get('lng'),
                    address=result.get('formatted_address'),
                    place_id=result.get('place_id'),
                    types=result.get('types', [])
                )
                locations.append(location.to_dict())
        
        return {
            'locations': locations,
            'status': data.get('status')
        }
    
    def _parse_reverse_geocode_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse reverse geocoding API response"""
        results = data.get('results', [])
        
        return {
            'results': results,
            'status': data.get('status')
        }
    
    def _parse_distance_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse distance matrix API response"""
        rows = data.get('rows', [])
        if not rows:
            return {'distances': []}
        
        distances = []
        for row in rows:
            elements = row.get('elements', [])
            for element in elements:
                distance_info = element.get('distance', {})
                duration_info = element.get('duration', {})
                
                distances.append({
                    'distance_text': distance_info.get('text'),
                    'distance_meters': distance_info.get('value'),
                    'duration_text': duration_info.get('text'),
                    'duration_seconds': duration_info.get('value'),
                    'status': element.get('status')
                })
        
        return {
            'distances': distances,
            'status': data.get('status')
        }
    
    def _parse_places_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse places API response"""
        results = data.get('results', [])
        
        places = []
        for place in results:
            location_data = place.get('geometry', {}).get('location', {})
            if location_data:
                places.append({
                    'place_id': place.get('place_id'),
                    'name': place.get('name'),
                    'address': place.get('vicinity'),
                    'latitude': location_data.get('lat'),
                    'longitude': location_data.get('lng'),
                    'rating': place.get('rating'),
                    'types': place.get('types', [])
                })
        
        return {
            'places': places,
            'status': data.get('status')
        }
    
    def _parse_directions_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse directions API response"""
        routes = data.get('routes', [])
        
        if not routes:
            return {'routes': []}
        
        # Return the first route (usually the best)
        route = routes[0]
        legs = route.get('legs', [])
        
        directions = []
        for leg in legs:
            directions.append({
                'distance': leg.get('distance', {}),
                'duration': leg.get('duration', {}),
                'start_address': leg.get('start_address'),
                'end_address': leg.get('end_address'),
                'steps': leg.get('steps', [])
            })
        
        return {
            'routes': directions,
            'status': data.get('status')
        }


# Create and register the maps service instance
maps_service = MapsService()
register_service(maps_service)


# Convenience functions for common maps operations
async def geocode_address(address: str, region: str = "ke") -> APIResponse:
    """Geocode an address"""
    return await maps_service.geocode_address(address, region)


async def reverse_geocode(latitude: float, longitude: float) -> APIResponse:
    """Reverse geocode coordinates"""
    return await maps_service.reverse_geocode(latitude, longitude)


async def calculate_distance(origin: Tuple[float, float], destination: Tuple[float, float], mode: str = "driving") -> APIResponse:
    """Calculate distance between points"""
    return await maps_service.calculate_distance(origin, destination, mode)


async def validate_location(latitude: float, longitude: float) -> APIResponse:
    """Validate location coordinates"""
    return await maps_service.validate_location(latitude, longitude)


async def search_nearby_hostels(latitude: float, longitude: float, radius: int = 5000) -> APIResponse:
    """Search for nearby hostels"""
    return await maps_service.search_nearby_hostels(latitude, longitude, radius)


async def get_directions(origin: Tuple[float, float], destination: Tuple[float, float], mode: str = "driving") -> APIResponse:
    """Get directions between points"""
    return await maps_service.get_directions(origin, destination, mode)


def calculate_distance_haversine(origin: Tuple[float, float], destination: Tuple[float, float]) -> DistanceResult:
    """Calculate distance using Haversine formula (synchronous)"""
    return maps_service.calculate_distance_haversine(origin, destination)
