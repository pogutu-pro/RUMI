#!/usr/bin/env python3
"""
Simple API key validation script
Tests Google Maps and OpenWeatherMap API keys
"""

import requests
import os
from pathlib import Path

# Load environment variables from .env file
def load_env():
    env_file = Path(__file__).parent / '.env'
    env_vars = {}

    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value

    return env_vars

def test_google_maps_api_key(api_key):
    """Test Google Maps API key with a simple geocoding request"""
    print("🔍 Testing Google Maps API Key...")

    if not api_key or api_key == 'your_google_maps_api_key_here':
        print("❌ Google Maps API key not set")
        return False

    try:
        # Test with a simple geocoding request
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': 'Nairobi, Kenya',
            'key': api_key
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'OK' and data.get('results'):
                print("✅ Google Maps API key is valid")
                print(f"   Found {len(data['results'])} results for 'Nairobi, Kenya'")
                return True
            elif data.get('status') == 'REQUEST_DENIED':
                print("❌ Google Maps API key is invalid or restricted")
                print(f"   Error: {data.get('error_message', 'Unknown error')}")
                return False
            else:
                print(f"❌ Google Maps API returned status: {data.get('status')}")
                return False
        else:
            print(f"❌ Google Maps API request failed with status: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Google Maps API test failed: {str(e)}")
        return False

def test_openweather_api_key(api_key):
    """Test OpenWeatherMap API key with current weather request"""
    print("\n🌤️  Testing OpenWeatherMap API Key...")

    if not api_key or api_key == 'your_openweather_api_key_here':
        print("❌ OpenWeatherMap API key not set")
        return False

    try:
        # Test with current weather request for Nairobi
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            'q': 'Nairobi,KE',
            'appid': api_key,
            'units': 'metric'
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if 'main' in data and 'temp' in data['main']:
                print("✅ OpenWeatherMap API key is valid")
                print(f"   Current temperature in Nairobi: {data['main']['temp']:.1f}°C")
                return True
            else:
                print("❌ OpenWeatherMap API returned unexpected data")
                return False
        elif response.status_code == 401:
            print("❌ OpenWeatherMap API key is invalid")
            return False
        else:
            print(f"❌ OpenWeatherMap API request failed with status: {response.status_code}")
            try:
                error_data = response.json()
                if 'message' in error_data:
                    print(f"   Error: {error_data['message']}")
            except:
                pass
            return False

    except Exception as e:
        print(f"❌ OpenWeatherMap API test failed: {str(e)}")
        return False

def test_weatherapi_key(api_key):
    """Test WeatherAPI key"""
    print("\n🌤️  Testing WeatherAPI Key...")

    if not api_key or api_key == 'your_weatherapi_key_here':
        print("❌ WeatherAPI key not set")
        return False

    try:
        # Test with current weather request
        url = "https://api.weatherapi.com/v1/current.json"
        params = {
            'key': api_key,
            'q': 'Nairobi',
            'aqi': 'no'
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if 'current' in data and 'temp_c' in data['current']:
                print("✅ WeatherAPI key is valid")
                print(f"   Current temperature in Nairobi: {data['current']['temp_c']:.1f}°C")
                return True
            else:
                print("❌ WeatherAPI returned unexpected data")
                return False
        elif response.status_code == 401 or response.status_code == 403:
            print("❌ WeatherAPI key is invalid")
            return False
        else:
            print(f"❌ WeatherAPI request failed with status: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ WeatherAPI test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 API Key Validation Test")
    print("=" * 50)

    # Load environment variables
    env_vars = load_env()

    # Get API keys
    google_maps_key = env_vars.get('GOOGLE_MAPS_API_KEY', '')
    openweather_key = env_vars.get('OPENWEATHER_API_KEY', '')
    weatherapi_key = env_vars.get('WEATHERAPI_KEY', '')

    print(f"Google Maps Key: {'Set' if google_maps_key and google_maps_key != 'your_google_maps_api_key_here' else 'Not Set'}")
    print(f"OpenWeatherMap Key: {'Set' if openweather_key and openweather_key != 'your_openweather_api_key_here' else 'Not Set'}")
    print(f"WeatherAPI Key: {'Set' if weatherapi_key and weatherapi_key != 'your_weatherapi_key_here' else 'Not Set'}")
    print()

    # Test each API key
    google_maps_ok = test_google_maps_api_key(google_maps_key)
    openweather_ok = test_openweather_api_key(openweather_key)
    weatherapi_ok = test_weatherapi_key(weatherapi_key)

    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)

    results = []
    if google_maps_ok:
        results.append("✅ Google Maps API: VALID")
    else:
        results.append("❌ Google Maps API: INVALID")

    if openweather_ok:
        results.append("✅ OpenWeatherMap API: VALID")
    else:
        results.append("❌ OpenWeatherMap API: INVALID")

    if weatherapi_ok:
        results.append("✅ WeatherAPI: VALID")
    else:
        results.append("❌ WeatherAPI: INVALID")

    for result in results:
        print(result)

    print("\n📝 Next Steps:")
    if not google_maps_ok:
        print("  - Get Google Maps API key: https://console.cloud.google.com/apis/credentials")
        print("  - Enable Geocoding API and Maps JavaScript API")
    if not openweather_ok:
        print("  - Get OpenWeatherMap API key: https://openweathermap.org/api")
    if not weatherapi_ok:
        print("  - Get WeatherAPI key: https://www.weatherapi.com/")

if __name__ == "__main__":
    main()