#!/usr/bin/env python3
"""
Comprehensive API Test Script for RUMI Backend
Tests all endpoints including Swagger/Redoc documentation
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoint(name, url, expected_status=200, method='GET', data=None, headers=None):
    """Test an API endpoint and return results"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"Method: {method}")
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=10)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == expected_status:
            print(f"✅ SUCCESS - {name}")
            
            # For JSON responses, show first 200 chars
            if 'application/json' in response.headers.get('content-type', ''):
                try:
                    json_data = response.json()
                    print(f"Response preview: {str(json_data)[:200]}...")
                except:
                    print(f"Response preview: {response.text[:200]}...")
            else:
                print(f"Response preview: {response.text[:200]}...")
                
        else:
            print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
        return {
            'name': name,
            'url': url,
            'status_code': response.status_code,
            'success': response.status_code == expected_status,
            'response_time': response.elapsed.total_seconds()
        }
        
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR - Could not connect to {url}")
        print("Make sure the Django development server is running on port 8000")
        return {
            'name': name,
            'url': url,
            'status_code': 'CONNECTION_ERROR',
            'success': False,
            'response_time': 0
        }
    except Exception as e:
        print(f"❌ ERROR - {str(e)}")
        return {
            'name': name,
            'url': url,
            'status_code': 'ERROR',
            'success': False,
            'response_time': 0,
            'error': str(e)
        }

def test_server_health():
    """Test if the server is running"""
    print(f"\n{'🔍 SERVER HEALTH CHECK'}")
    print("="*60)
    
    # Test basic connectivity
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Django server is running and responding")
            return True
        else:
            print(f"⚠️  Server responded with status {response.status_code}")
            return True
    except requests.exceptions.ConnectionError:
        print("❌ Django server is NOT running on http://localhost:8000")
        print("\nTo start the server, run:")
        print("cd Backend && python manage.py runserver")
        return False

def test_documentation_endpoints():
    """Test Swagger and Redoc documentation endpoints"""
    print(f"\n{'📚 DOCUMENTATION ENDPOINTS'}")
    print("="*60)
    
    results = []
    
    # Test Swagger UI
    results.append(test_endpoint(
        "Swagger UI", 
        f"{BASE_URL}/swagger/",
        expected_status=200
    ))
    
    # Test ReDoc
    results.append(test_endpoint(
        "ReDoc", 
        f"{BASE_URL}/redoc/",
        expected_status=200
    ))
    
    # Test Swagger JSON schema
    results.append(test_endpoint(
        "Swagger JSON Schema", 
        f"{BASE_URL}/swagger.json",
        expected_status=200
    ))
    
    # Test Swagger YAML schema
    results.append(test_endpoint(
        "Swagger YAML Schema", 
        f"{BASE_URL}/swagger.yaml",
        expected_status=200
    ))
    
    return results

def test_api_endpoints():
    """Test main API endpoints"""
    print(f"\n{'🔌 MAIN API ENDPOINTS'}")
    print("="*60)
    
    results = []
    
    # API root
    results.append(test_endpoint(
        "API Root", 
        f"{BASE_URL}/api/v1/",
        expected_status=200
    ))
    
    # Accounts API
    results.append(test_endpoint(
        "Accounts API", 
        f"{BASE_URL}/api/v1/accounts/",
        expected_status=200
    ))
    
    # Hostels API
    results.append(test_endpoint(
        "Hostels API", 
        f"{BASE_URL}/api/v1/hostels/",
        expected_status=200
    ))
    
    # Payments API
    results.append(test_endpoint(
        "Payments API", 
        f"{BASE_URL}/api/v1/payments/",
        expected_status=200
    ))
    
    return results

def test_admin_endpoints():
    """Test admin API endpoints"""
    print(f"\n{'⚙️ ADMIN API ENDPOINTS'}")
    print("="*60)
    
    results = []
    
    # Admin API
    results.append(test_endpoint(
        "Admin API", 
        f"{BASE_URL}/api/v1/admin/",
        expected_status=200
    ))
    
    # Super Admin API
    results.append(test_endpoint(
        "Super Admin API", 
        f"{BASE_URL}/api/v1/super-admin/",
        expected_status=200
    ))
    
    # Platform Admin API
    results.append(test_endpoint(
        "Platform Admin API", 
        f"{BASE_URL}/api/v1/platform-admin/",
        expected_status=200
    ))
    
    return results

def test_mpesa_endpoints():
    """Test M-PESA related endpoints"""
    print(f"\n{'💰 M-PESA API ENDPOINTS'}")
    print("="*60)
    
    results = []
    
    # STK Push endpoint
    results.append(test_endpoint(
        "M-PESA STK Push", 
        f"{BASE_URL}/api/v1/payments/mpesa/stk-push/",
        expected_status=405  # Method not allowed for GET
    ))
    
    # Test STK Push with POST
    stk_test_data = {
        "phone_number": "254700000000",
        "amount": 100,
        "account_reference": "test123",
        "transaction_desc": "Test payment"
    }
    
    results.append(test_endpoint(
        "M-PESA STK Push (POST)", 
        f"{BASE_URL}/api/v1/payments/mpesa/stk-push/",
        method='POST',
        data=stk_test_data,
        expected_status=400  # Bad request for test data
    ))
    
    return results

def generate_report(test_results):
    """Generate a comprehensive test report"""
    print(f"\n{'📊 TEST RESULTS SUMMARY'}")
    print("="*60)
    
    total_tests = len(test_results)
    successful_tests = sum(1 for result in test_results if result['success'])
    failed_tests = total_tests - successful_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"✅ Successful: {successful_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    
    if failed_tests > 0:
        print(f"\n{'❌ FAILED TESTS:'}")
        print("-" * 30)
        for result in test_results:
            if not result['success']:
                print(f"• {result['name']}: {result['status_code']}")
    
    # Check specific Swagger/Redoc issues
    swagger_tests = [r for r in test_results if 'swagger' in r['name'].lower() or 'redoc' in r['name'].lower()]
    if any(not test['success'] for test in swagger_tests):
        print(f"\n{'🔧 TROUBLESHOOTING SWAGGER/REDOC:'}")
        print("-" * 35)
        print("1. Make sure drf-yasg is installed:")
        print("   pip install drf-yasg")
        print("2. Check that swagger URLs are included in main urls.py")
        print("3. Verify DEBUG=True in settings.py")
        print("4. Restart the Django server")
        print("5. Clear browser cache")

def main():
    """Main test runner"""
    print("🚀 RUMI API Endpoints Test Suite")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Check server health first
    if not test_server_health():
        return
    
    all_results = []
    
    # Run all tests
    all_results.extend(test_documentation_endpoints())
    all_results.extend(test_api_endpoints())
    all_results.extend(test_admin_endpoints())
    all_results.extend(test_mpesa_endpoints())
    
    # Generate comprehensive report
    generate_report(all_results)
    
    print(f"\n🏁 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()