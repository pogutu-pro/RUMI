from django.urls import path
from . import views

urlpatterns = [
    path('', views.health_check, name='health_check'),
    path('info/', views.metrics_info, name='metrics_info'),
    path('system/', views.system_metrics, name='system_metrics'),
    path('realtime/', views.realtime_metrics, name='realtime_metrics'),
    path('services/', views.service_status, name='service_status'),
]
