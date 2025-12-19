from django.urls import path, include

urlpatterns = [
    # Super Admin endpoints - Full system access
    path('super/', include('admin_api.super_admin_urls')),
    
    # Platform Admin endpoints - Content moderation and user management
    path('platform/', include('admin_api.platform_admin_urls')),
]