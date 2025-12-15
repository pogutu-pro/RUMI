from django.urls import path
from . import views

urlpatterns = [
    # Additional Admin Endpoints (4 endpoints)
    path('users/stats/', views.AdminUserStatsView.as_view(), name='admin_user_stats'),
    path('landlord-verifications/', views.AdminLandlordVerificationsView.as_view(), name='admin_landlord_verifications'),
    path('platform/stats/', views.AdminPlatformStatsView.as_view(), name='admin_platform_stats'),
    path('system/health/', views.AdminSystemHealthView.as_view(), name='admin_system_health'),
]