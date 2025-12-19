from django.urls import path
from . import views
from admin_endpoints import views as admin_endpoints_views

urlpatterns = [
    # Platform Admin User Statistics
    path('users/stats/', admin_endpoints_views.AdminUserStatsView.as_view(), name='platform_admin_user_stats'),
    
    # Platform Admin User Management (Limited)
    path('users/', views.AdminUserManagementView.as_view(), name='platform_admin_user_management'),
    
    # Landlord Verifications (Platform Level)
    path('landlord-verifications/', admin_endpoints_views.AdminLandlordVerificationsView.as_view(), name='platform_admin_landlord_verifications'),
    
    # Platform Statistics
    path('platform/stats/', admin_endpoints_views.AdminPlatformStatsView.as_view(), name='platform_admin_platform_stats'),
    
    # System Health Monitoring
    path('system/health/', admin_endpoints_views.AdminSystemHealthView.as_view(), name='platform_admin_system_health'),
    
    # Hostel Moderation (Platform Level)
    path('hostels/moderation/', views.HostelModerationListView.as_view(), name='platform_admin_hostel_moderation'),
]