#!/usr/bin/env python3
"""
Test script for Location and Weather API integrations
Tests Google Maps, OpenWeatherMap, and WeatherAPI services
"""

import os
import sys
import asyncio
import django
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from third_party.maps import maps_service, geocode_address, reverse_geocode, calculate_distance
from third_party.weather import weather_service, get_current_weather, get_weather_forecast


async def test_google_maps_api():
    """Test Google Maps API functionality"""
    print("\n" + "="*50)
    print("TESTING GOOGLE MAPS API")
    print("="*50)

    if not maps_service.is_enabled():
        print("❌ Google Maps API is not configured (missing API key)")
        return False

    print("✅ Google Maps API is configured")

    try:
        # Test 1: Geocoding
        print("\n📍 Testing Geocoding...")
        address = "University of Nairobi, Kenya"
        result = await geocode_address(address, "ke")

        if result.success and result.data and result.data.get('locations'):
            location = result.data['locations'][0]
            print(f"✅ Geocoding successful: {address}")
            print(f"   Coordinates: {location['latitude']:.4f}, {location['longitude']:.4f}")
            lat, lng = location['latitude'], location['longitude']
        else:
            print(f"❌ Geocoding failed: {result.error}")
            return False

        # Test 2: Reverse Geocoding
        print("\n📍 Testing Reverse Geocoding...")
        result = await reverse_geocode(lat, lng)

        if result.success and result.data and result.data.get('results'):
            address_info = result.data['results'][0]
            print(f"✅ Reverse geocoding successful: {address_info.get('formatted_address')}")
        else:
            print(f"❌ Reverse geocoding failed: {result.error}")
            return False

        # Test 3: Distance Calculation
        print("\n📍 Testing Distance Calculation...")
        origin = (lat, lng)
        destination = (-1.2864, 36.8172)  # Nairobi CBD coordinates

        result = await calculate_distance(origin, destination, "driving")

        if result.success and result.data and result.data.get('distances'):
            distance_info = result.data['distances'][0]
            print(f"✅ Distance calculation successful:")
            print(f"   Distance: {distance_info.get('distance_text')}")
            print(f"   Duration: {distance_info.get('duration_text')}")
        else:
            print(f"❌ Distance calculation failed: {result.error}")
            return False

        return True

    except Exception as e:
        print(f"❌ Google Maps API test failed with exception: {str(e)}")
        return False


async def test_weather_apis():
    """Test Weather API functionality"""
    print("\n" + "="*50)
    print("TESTING WEATHER APIs")
    print("="*50)

    # Test coordinates (Nairobi, Kenya)
    lat, lng = -1.2864, 36.8172

    # Test OpenWeatherMap
    print("\n🌤️  Testing OpenWeatherMap API...")
    if weather_service.is_enabled():
        print("✅ OpenWeatherMap API is configured")

        try:
            result = await get_current_weather(lat, lng)

            if result.success and result.data and result.data.get('weather'):
                weather = result.data['weather']
                print("✅ OpenWeatherMap current weather successful:")
                print(f"   Temperature: {weather.temperature:.1f}°C")
                print(f"   Description: {weather.description}")
                print(f"   Humidity: {weather.humidity}%")
            else:
                print(f"❌ OpenWeatherMap current weather failed: {result.error}")

            # Test forecast
            result = await get_weather_forecast(lat, lng, 3)

            if result.success and result.data and result.data.get('forecast'):
                forecast = result.data['forecast']
                print(f"✅ OpenWeatherMap forecast successful: {len(forecast)} days")
            else:
                print(f"❌ OpenWeatherMap forecast failed: {result.error}")

        except Exception as e:
            print(f"❌ OpenWeatherMap test failed with exception: {str(e)}")
    else:
        print("❌ OpenWeatherMap API is not configured (missing API key)")

    # Test WeatherAPI
    print("\n🌤️  Testing WeatherAPI...")
    # Note: WeatherAPI uses different configuration, we'd need to check if it's set up
    print("ℹ️  WeatherAPI test would require separate configuration check")

    return True


async def main():
    """Main test function"""
    print("🚀 Starting Location and Weather API Tests")
    print("This script tests the integration of Google Maps and Weather APIs")
    print("Make sure your API keys are configured in the .env file")

    # Test Google Maps
    maps_success = await test_google_maps_api()

    # Test Weather APIs
    weather_success = await test_weather_apis()

    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)

    if maps_success:
        print("✅ Google Maps API: ALL TESTS PASSED")
    else:
        print("❌ Google Maps API: SOME TESTS FAILED")

    if weather_success:
        print("✅ Weather APIs: CONFIGURATION CHECKED")
    else:
        print("❌ Weather APIs: CONFIGURATION ISSUES")

    print("\n📝 Next Steps:")
    print("1. Get API keys from respective providers:")
    print("   - Google Maps: https://console.cloud.google.com/apis/credentials")
    print("   - OpenWeatherMap: https://openweathermap.org/api")
    print("   - WeatherAPI: https://www.weatherapi.com/")
    print("2. Update your .env file with the API keys")
    print("3. Run this script again to verify integrations")


if __name__ == "__main__":
    asyncio.run(main())