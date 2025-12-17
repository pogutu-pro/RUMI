from django.urls import path
from . import drf_views

urlpatterns = [
    path('health/', drf_views.monitoring_health, name='monitoring-health'),
    path('health/realtime/', drf_views.monitoring_realtime, name='monitoring-realtime'),
    path('health/services/', drf_views.monitoring_services, name='monitoring-services'),
    path('health/system/', drf_views.monitoring_system, name='monitoring-system'),
    path('health/info/', drf_views.monitoring_info, name='monitoring-info'),
]
