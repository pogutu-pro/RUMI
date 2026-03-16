from django.urls import path
from .views import (
    AdminUserManagementView,
    HostelModerationListView,
    AdminUserStatsView,
    AdminLandlordVerificationsView,
    AdminPlatformStatsView,
    AdminSystemHealthView,
)

urlpatterns = [
    # Platform Admin User Statistics
    path('users/stats/', AdminUserStatsView.as_view(), name='platform_admin_user_stats'),

    # Platform Admin User Management (Limited)
    path('users/', AdminUserManagementView.as_view(), name='platform_admin_user_management'),

    # Landlord Verifications (Platform Level)
    path('landlord-verifications/', AdminLandlordVerificationsView.as_view(), name='platform_admin_landlord_verifications'),

    # Platform Statistics
    path('platform/stats/', AdminPlatformStatsView.as_view(), name='platform_admin_platform_stats'),

    # System Health Monitoring
    path('system/health/', AdminSystemHealthView.as_view(), name='platform_admin_system_health'),

    # Hostel Moderation (Platform Level)
    path('hostels/moderation/', HostelModerationListView.as_view(), name='platform_admin_hostel_moderation'),
]