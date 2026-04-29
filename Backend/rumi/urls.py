"""
URL configuration for rumi project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger/OpenAPI Configuration
schema_view = get_schema_view(
    openapi.Info(
        title="RUMI Platform API",
        default_version='v1',
        description="RUMI Platform API Documentation - Connecting Students with Quality Accommodation",
        terms_of_service="https://rumi.co.ke/terms/",
        contact=openapi.Contact(email="support@rumi.co.ke"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    patterns=[
        # Landlord APIs
        path('api/v1/landlord/', include('landlord_api.urls')),
        path('api/v1/analytics/landlord/', include('analytics.urls')),
        
        # Tech Support APIs
        path('api/v1/support/', include('support_api.urls')),
        
        # Payment APIs
        path('api/v1/payments/', include('payments.urls')),
        
        # Admin APIs
        path('api/v1/admin/', include('admin_api.urls')),

        # Student APIs
        path('api/v1/students/', include('student_api.urls')),
        
        # General APIs
        path('api/v1/accounts/', include('accounts.urls')),
        path('api/v1/hostels/', include('hostels.urls')),
        path('api/v1/notifications/', include('notifications.urls')),
        path('api/v1/home/', include('home.urls')),
        path('api/v1/roommates/', include('roommate_system.urls')),
        path('api/v1/recommendations/', include('recommendations.urls')),
    ],
)

urlpatterns = [
    # Prometheus metrics endpoints
    path('metrics/', include('django_prometheus.urls')),

    # Custom metrics proxy endpoint (for frontend CORS fix)
    path('metrics-proxy/', include('home.urls')),

    # Health check endpoint
    path('health/', include('monitoring.urls')),

    # Admin dashboard
    path('admin/', admin.site.urls),

    # API Documentation (Swagger/OpenAPI)
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),

    # API routes
    path('api/v1/', include([
        path('accounts/', include('accounts.urls')),
        path('hostels/', include('hostels.urls')),
        path('notifications/', include('notifications.urls')),
        path('payments/', include('payments.urls')),
        path('home/', include('home.urls')),
        path('analytics/', include('analytics.urls')),
        path('roommates/', include('roommate_system.urls')),
        path('recommendations/', include('recommendations.urls')),

        # Landlord API (new)
        path('landlord/', include('landlord_api.urls')),

        # Student API (new)
        path('students/', include('student_api.urls')),

        # Admin endpoints (consolidated)
        path('admin/', include('admin_api.urls')),

        # Admin endpoints (alternate path for compatibility)
        path('users/admin/', include('admin_api.urls')),

        # Caretaker endpoints (aligned with frontend)
        path('caretaker/', include('caretaker_operations.urls')),

        # Tech Support endpoints
        path('support/', include('support_api.urls')),

    ])),
]

# Debug toolbar URLs
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

# Serve media/static files in development (for images like profile_picture_url in schema)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
