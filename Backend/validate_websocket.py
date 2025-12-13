#!/usr/bin/env python
"""
WebSocket Implementation Validation Script
This script validates that the WebSocket implementation is correctly configured
without requiring a running server.
"""

def validate_imports():
    """Validate that all required imports are available"""
    print(" Validating WebSocket imports...")

    try:
        # Test Django Channels imports
        from channels.routing import ProtocolTypeRouter, URLRouter
        from channels.auth import AuthMiddlewareStack
        from channels.generic.websocket import AsyncWebsocketConsumer
        from channels.db import database_sync_to_async
        print(" Django Channels imports successful")
    except ImportError as e:
        print(f" Channels import failed: {e}")
        return False

    try:
        # Test Django imports
        from django.core.asgi import get_asgi_application
        from django.urls import re_path
        print(" Django ASGI imports successful")
    except ImportError as e:
        print(f" Django import failed: {e}")
        return False

    return True

def validate_file_structure():
    """Validate that all required files exist and have correct structure"""
    print("\n🔍 Validating file structure...")

    import os

    required_files = [
        'accounts/consumers.py',
        'accounts/routing.py',
        'rumi/routing.py',
        'rumi/asgi.py',
        'rumi/settings.py'
    ]

    for file_path in required_files:
        full_path = os.path.join('Backend', file_path)
        if os.path.exists(full_path):
            print(f" {file_path} exists")
        else:
            print(f" {file_path} missing")
            return False

    return True

def validate_settings():
    """Validate Django settings for Channels"""
    print("\n🔍 Validating Django settings...")

    try:
        import os
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')

        # Test settings import
        from django.conf import settings

        # Check required settings
        if hasattr(settings, 'INSTALLED_APPS') and 'channels' in settings.INSTALLED_APPS:
            print(" Channels in INSTALLED_APPS")
        else:
            print(" Channels not in INSTALLED_APPS")
            return False

        if hasattr(settings, 'ASGI_APPLICATION'):
            print(" ASGI_APPLICATION setting found")
        else:
            print(" ASGI_APPLICATION setting missing")
            return False

        if hasattr(settings, 'CHANNEL_LAYERS'):
            print(" CHANNEL_LAYERS setting found")
        else:
            print(" CHANNEL_LAYERS setting missing")
            return False

        return True

    except Exception as e:
        print(f" Settings validation failed: {e}")
        return False

def validate_consumers():
    """Validate WebSocket consumers"""
    print("\n Validating WebSocket consumers...")

    try:
        # Import consumers
        from accounts.consumers import ChatConsumer, NotificationConsumer

        # Check required methods exist
        required_methods = ['connect', 'disconnect', 'receive']
        for method in required_methods:
            if hasattr(ChatConsumer, method):
                print(f" ChatConsumer.{method} exists")
            else:
                print(f"ChatConsumer.{method} missing")
                return False

        for method in required_methods:
            if hasattr(NotificationConsumer, method):
                print(f" NotificationConsumer.{method} exists")
            else:
                print(f" NotificationConsumer.{method} missing")
                return False

        return True

    except Exception as e:
        print(f" Consumer validation failed: {e}")
        return False

def validate_routing():
    """Validate WebSocket routing"""
    print("\n Validating WebSocket routing...")

    try:
        from accounts.routing import websocket_urlpatterns
        from rumi.routing import application

        if len(websocket_urlpatterns) >= 2:
            print(" WebSocket URL patterns configured")
        else:
            print(" Insufficient WebSocket URL patterns")
            return False

        # Check if application is properly configured
        if hasattr(application, 'application_mapping'):
            print(" ASGI application routing configured")
        else:
            print(" ASGI application routing not configured")
            return False

        return True

    except Exception as e:
        print(f"Routing validation failed: {e}")
        return False

def main():
    """Run all validations"""
    print(" WebSocket Implementation Validation")
    print("=" * 50)

    validations = [
        validate_file_structure,
        validate_imports,
        validate_settings,
        validate_consumers,
        validate_routing
    ]

    passed = 0
    total = len(validations)

    for validation in validations:
        if validation():
            passed += 1
        else:
            break

    print(f"\n Validation Results: {passed}/{total} passed")

    if passed == total:
        print(" WebSocket implementation is VALID!")
        print("\n Next Steps:")
        print("1. Install dependencies: pip install channels_redis")
        print("2. Start Redis server")
        print("3. Run with ASGI: daphne rumi.asgi:application")
        print("4. Test with: python test_websocket.py")
        print("\n WebSocket URLs:")
        print("   ws://localhost:8000/ws/chat/{conversation_id}/")
        print("   ws://localhost:8000/ws/notifications/")
    else:
        print(" WebSocket implementation has issues that need to be fixed.")

    return passed == total

if __name__ == "__main__":
    main()