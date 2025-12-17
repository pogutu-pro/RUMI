"""
Weather API Integration

Provides weather services for the RUMI platform:
- Current weather conditions
- Weather forecasts
- Weather alerts
- Location-based weather recommendations
- Hostel weather information for students
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone

from django.conf import settings
from .base import ThirdPartyServiceBase, ServiceConfig, APIResponse, register_service


@dataclass
class WeatherData:
    """Weather information structure"""
    temperature: float
    feels_like: float
    humidity: int
    pressure: float
    description: str
    icon: str
    wind_speed: float
    wind_direction: int
    visibility: Optional[float] = None
    uv_index: Optional[int] = None


@dataclass
class WeatherForecast:
    """Weather forecast structure"""
    date: datetime
    temperature_high: float
    temperature_low: float
    humidity: int
    description: str
    icon: str
    wind_speed: float
    precipitation_probability: Optional[int] = None


@dataclass
class LocationWeather:
    """Location-based weather information"""
    location_name: str
    coordinates: tuple
    current_weather: WeatherData
    forecast: List[WeatherForecast]
    alerts: List[str]


class WeatherService(ThirdPartyServiceBase):
    """Weather service supporting OpenWeatherMap and WeatherAPI"""
    
    def __init__(self):
        # Determine which weather service to use
        primary_service = getattr(settings, 'WEATHER_SERVICE_PROVIDER', 'openweather').lower()
        
        if primary_service == 'openweather':
            config = ServiceConfig(
                api_key=settings.OPENWEATHER_API_KEY or "",
                base_url="https://api.openweathermap.org/data/2.5",
                timeout=30,
                retries=3,
                cache_ttl=1800,  # Cache for 30 minutes
                enabled=bool(settings.OPENWEATHER_API_KEY),
                rate_limit=60  # 60 requests per minute
            )
            self.service_type = 'openweather'
        else:  # weatherapi
            config = ServiceConfig(
                api_key=settings.WEATHERAPI_KEY or "",
                base_url="https://api.weatherapi.com/v1",
                timeout=30,
                retries=3,
                cache_ttl=1800,
                enabled=bool(settings.WEATHERAPI_KEY),
                rate_limit=1000000  # 1M requests per month for free tier
            )
            self.service_type = 'weatherapi'
            
        super().__init__("weather", config)
    
    async def get_current_weather(self, latitude: float, longitude: float, units: str = "metric") -> APIResponse:
        """Get current weather for a location"""
        try:
            if self.service_type == 'openweather':
                return await self._get_openweather_current(latitude, longitude, units)
            else:
                return await self._get_weatherapi_current(latitude, longitude, units)
                
        except Exception as e:
            return self.handle_error(e, "Current weather retrieval failed")
    
    async def get_weather_forecast(
        self, 
        latitude: float, 
        longitude: float, 
        days: int = 5,
        units: str = "metric"
    ) -> APIResponse:
        """Get weather forecast for a location"""
        try:
            if self.service_type == 'openweather':
                return await self._get_openweather_forecast(latitude, longitude, units)
            else:
                return await self._get_weatherapi_forecast(latitude, longitude, days)
                
        except Exception as e:
            return self.handle_error(e, "Weather forecast retrieval failed")
    
    async def get_location_weather(
        self, 
        latitude: float, 
        longitude: float,
        location_name: Optional[str] = None,
        units: str = "metric"
    ) -> APIResponse:
        """Get comprehensive weather information for a location"""
        try:
            # Get current weather and forecast concurrently
            current_task = self.get_current_weather(latitude, longitude, units)
            forecast_task = self.get_weather_forecast(latitude, longitude, 5, units)
            
            current_response, forecast_response = await asyncio.gather(
                current_task, forecast_task, return_exceptions=True
            )
            
            if isinstance(current_response, Exception):
                current_response = self.handle_error(current_response, "Current weather failed")
            if isinstance(forecast_response, Exception):
                forecast_response = self.handle_error(forecast_response, "Forecast failed")
            
            # Check if both requests succeeded
            if not current_response.success:
                return current_response
            if not forecast_response.success:
                return forecast_response
            
            # Create location weather object
            location_weather = LocationWeather(
                location_name=location_name or f"Lat: {latitude}, Lon: {longitude}",
                coordinates=(latitude, longitude),
                current_weather=current_response.data['weather'],
                forecast=forecast_response.data['forecast'],
                alerts=forecast_response.data.get('alerts', [])
            )
            
            return APIResponse(
                success=True,
                data={'location_weather': location_weather}
            )
            
        except Exception as e:
            return self.handle_error(e, "Location weather retrieval failed")
    
    async def _get_openweather_current(self, latitude: float, longitude: float, units: str) -> APIResponse:
        """Get current weather from OpenWeatherMap"""
        try:
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.config.api_key,
                'units': units
            }
            
            response = await self.cached_request(
                endpoint="/weather",
                params=params,
                use_cache=True
            )
            
            if response.success:
                weather_data = self._parse_openweather_current(response.data)
                return APIResponse(
                    success=True,
                    data={'weather': weather_data}
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "OpenWeather current weather failed")
    
    async def _get_openweather_forecast(self, latitude: float, longitude: float, units: str) -> APIResponse:
        """Get weather forecast from OpenWeatherMap"""
        try:
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.config.api_key,
                'units': units
            }
            
            response = await self.cached_request(
                endpoint="/forecast",
                params=params,
                use_cache=True
            )
            
            if response.success:
                forecast_data = self._parse_openweather_forecast(response.data)
                return APIResponse(
                    success=True,
                    data=forecast_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "OpenWeather forecast failed")
    
    async def _get_weatherapi_current(self, latitude: float, longitude: float, units: str) -> APIResponse:
        """Get current weather from WeatherAPI"""
        try:
            params = {
                'key': self.config.api_key,
                'q': f"{latitude},{longitude}",
                'aqi': 'no'
            }
            
            response = await self.cached_request(
                endpoint="/current.json",
                params=params,
                use_cache=True
            )
            
            if response.success:
                weather_data = self._parse_weatherapi_current(response.data)
                return APIResponse(
                    success=True,
                    data={'weather': weather_data}
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "WeatherAPI current weather failed")
    
    async def _get_weatherapi_forecast(self, latitude: float, longitude: float, days: int) -> APIResponse:
        """Get weather forecast from WeatherAPI"""
        try:
            params = {
                'key': self.config.api_key,
                'q': f"{latitude},{longitude}",
                'days': days,
                'aqi': 'no',
                'alerts': 'yes'
            }
            
            response = await self.cached_request(
                endpoint="/forecast.json",
                params=params,
                use_cache=True
            )
            
            if response.success:
                forecast_data = self._parse_weatherapi_forecast(response.data)
                return APIResponse(
                    success=True,
                    data=forecast_data
                )
            else:
                return response
                
        except Exception as e:
            return self.handle_error(e, "WeatherAPI forecast failed")
    
    def _parse_openweather_current(self, data: Dict[str, Any]) -> WeatherData:
        """Parse OpenWeatherMap current weather data"""
        main_data = data.get('main', {})
        weather_info = data.get('weather', [{}])[0]
        wind_data = data.get('wind', {})
        
        return WeatherData(
            temperature=main_data.get('temp', 0),
            feels_like=main_data.get('feels_like', 0),
            humidity=main_data.get('humidity', 0),
            pressure=main_data.get('pressure', 0),
            description=weather_info.get('description', 'Unknown'),
            icon=weather_info.get('icon', ''),
            wind_speed=wind_data.get('speed', 0),
            wind_direction=wind_data.get('deg', 0),
            visibility=data.get('visibility', 0) / 1000 if data.get('visibility') else None
        )
    
    def _parse_openweather_forecast(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse OpenWeatherMap forecast data"""
        forecast_list = data.get('list', [])
        forecasts = []
        
        for item in forecast_list[:5]:  # Take first 5 items (3-hour intervals)
            main_data = item.get('main', {})
            weather_info = item.get('weather', [{}])[0]
            
            forecasts.append(WeatherForecast(
                date=datetime.fromtimestamp(item.get('dt', 0), tz=timezone.utc),
                temperature_high=main_data.get('temp_max', 0),
                temperature_low=main_data.get('temp_min', 0),
                humidity=main_data.get('humidity', 0),
                description=weather_info.get('description', 'Unknown'),
                icon=weather_info.get('icon', ''),
                wind_speed=item.get('wind', {}).get('speed', 0),
                precipitation_probability=item.get('pop', 0) * 100 if item.get('pop') else None
            ))
        
        return {
            'forecast': forecasts,
            'alerts': []  # OpenWeather free tier doesn't include alerts
        }
    
    def _parse_weatherapi_current(self, data: Dict[str, Any]) -> WeatherData:
        """Parse WeatherAPI current weather data"""
        current = data.get('current', {})
        condition = current.get('condition', {})
        
        return WeatherData(
            temperature=current.get('temp_c', 0),
            feels_like=current.get('feelslike_c', 0),
            humidity=current.get('humidity', 0),
            pressure=current.get('pressure_mb', 0),
            description=condition.get('text', 'Unknown'),
            icon=condition.get('icon', ''),
            wind_speed=current.get('wind_kph', 0) / 3.6,  # Convert km/h to m/s
            wind_direction=current.get('wind_degree', 0),
            visibility=current.get('vis_km', 0),
            uv_index=current.get('uv', 0)
        )
    
    def _parse_weatherapi_forecast(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse WeatherAPI forecast data"""
        forecast_days = data.get('forecast', {}).get('forecastday', [])
        forecasts = []
        alerts = []
        
        for day in forecast_days:
            day_info = day.get('day', {})
            condition = day_info.get('condition', {})
            
            forecasts.append(WeatherForecast(
                date=datetime.fromisoformat(day.get('date')).replace(tzinfo=timezone.utc),
                temperature_high=day_info.get('maxtemp_c', 0),
                temperature_low=day_info.get('mintemp_c', 0),
                humidity=day_info.get('avghumidity', 0),
                description=condition.get('text', 'Unknown'),
                icon=condition.get('icon', ''),
                wind_speed=day_info.get('maxwind_kph', 0) / 3.6,
                precipitation_probability=day_info.get('daily_chance_of_rain', 0)
            ))
        
        # Parse alerts if available
        alert_data = data.get('alerts', {})
        if alert_data:
            alerts = [alert.get('headline', '') for alert in alert_data.get('alert', [])]
        
        return {
            'forecast': forecasts,
            'alerts': alerts
        }
    
    async def get_weather_recommendations(self, latitude: float, longitude: float) -> APIResponse:
        """Get weather-based recommendations for students"""
        try:
            weather_response = await self.get_current_weather(latitude, longitude)
            if not weather_response.success:
                return weather_response
            
            weather_data = weather_response.data['weather']
            recommendations = self._generate_weather_recommendations(weather_data)
            
            return APIResponse(
                success=True,
                data={
                    'weather': weather_data,
                    'recommendations': recommendations
                }
            )
            
        except Exception as e:
            return self.handle_error(e, "Weather recommendations failed")
    
    def _generate_weather_recommendations(self, weather: WeatherData) -> List[str]:
        """Generate weather-based recommendations"""
        recommendations = []
        
        # Temperature-based recommendations
        if weather.temperature < 10:
            recommendations.append("It's cold today. Remember to bring a warm jacket and dress in layers.")
        elif weather.temperature > 30:
            recommendations.append("It's hot today. Stay hydrated and avoid outdoor activities during peak hours.")
        
        # Humidity-based recommendations
        if weather.humidity > 80:
            recommendations.append("High humidity detected. Keep your room well-ventilated to prevent mold.")
        elif weather.humidity < 30:
            recommendations.append("Low humidity detected. Consider using a humidifier for comfort.")
        
        # Precipitation-based recommendations
        # Note: This would need precipitation data from the forecast
        
        # Wind-based recommendations
        if weather.wind_speed > 15:
            recommendations.append("Strong winds today. Secure any loose items on your balcony or outside.")
        
        return recommendations


# Create and register the weather service instance
weather_service = WeatherService()
register_service(weather_service)


# Convenience functions for weather operations
async def get_current_weather(latitude: float, longitude: float, units: str = "metric") -> APIResponse:
    """Get current weather for a location"""
    return await weather_service.get_current_weather(latitude, longitude, units)


async def get_weather_forecast(latitude: float, longitude: float, days: int = 5, units: str = "metric") -> APIResponse:
    """Get weather forecast for a location"""
    return await weather_service.get_weather_forecast(latitude, longitude, days, units)


async def get_location_weather(latitude: float, longitude: float, location_name: Optional[str] = None, units: str = "metric") -> APIResponse:
    """Get comprehensive weather information for a location"""
    return await weather_service.get_location_weather(latitude, longitude, location_name, units)


async def get_weather_recommendations(latitude: float, longitude: float) -> APIResponse:
    """Get weather-based recommendations for students"""
    return await weather_service.get_weather_recommendations(latitude, longitude)
