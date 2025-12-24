from django.urls import path
from . import views
from admin_endpoints import views as admin_endpoints_views

urlpatterns = [
    # Super Admin Dashboard
    path('dashboard/stats/', views.AdminDashboardStatsView.as_view(), name='super_admin_dashboard_stats'),
    
    # System Activity Feed (EXPOSED)
    path('activity-feed/', views.SystemActivityFeedView.as_view(), name='super_admin_activity_feed'),
    
    # User Management (Full Access)
    path('users/', views.AdminUserManagementView.as_view(), name='super_admin_user_management'),
    path('users/students/', views.AdminUserManagementView.as_view(), name='super_admin_student_management'),
    path('users/landlords/', views.AdminUserManagementView.as_view(), name='super_admin_landlord_management'),
    path('users/caretakers/', views.AdminUserManagementView.as_view(), name='super_admin_caretaker_management'),
    path('users/suspended/', views.AdminUserManagementView.as_view(), name='super_admin_suspended_users'),
    
    # Hostel Moderation (EXPOSED)
    path('hostels/pending/', views.HostelModerationListView.as_view(), name='super_admin_hostels_pending'),
    path('hostels/moderation/', views.HostelModerationListView.as_view(), name='super_admin_hostel_moderation'),
    path('hostels/moderation/<int:moderation_id>/approve/', views.HostelModerationActionView.as_view(), name='super_admin_hostel_approve'),
    path('hostels/moderation/<int:moderation_id>/reject/', views.HostelModerationActionView.as_view(), name='super_admin_hostel_reject'),
    
    # Payment Management (EXPOSED)
    path('payments/disputes/', views.AdminPaymentDisputesListView.as_view(), name='super_admin_payment_disputes'),
    path('payments/disputes/stats/', views.AdminPaymentDisputesStatsView.as_view(), name='super_admin_payment_disputes_stats'),
    path('payments/disputes/<int:dispute_id>/resolve/', views.AdminPaymentDisputeActionView.as_view(), name='super_admin_payment_dispute_resolve'),
    path('payments/disputes/<int:dispute_id>/status/', views.AdminPaymentDisputeActionView.as_view(), name='super_admin_payment_dispute_status'),
    
    # Subscription Management (EXPOSED)
    path('subscriptions/', views.AdminSubscriptionListView.as_view(), name='super_admin_subscriptions'),
    path('subscriptions/stats/', views.AdminSubscriptionStatsView.as_view(), name='super_admin_subscriptions_stats'),
    
    # Platform Statistics (EXPOSED)
    path('platform/stats/', admin_endpoints_views.AdminPlatformStatsView.as_view(), name='super_admin_platform_stats'),
    
    # Landlord Verifications (EXPOSED)
    path('landlord-verifications/', admin_endpoints_views.AdminLandlordVerificationsView.as_view(), name='super_admin_landlord_verifications'),
    
    # System Health (EXPOSED)
    path('system/health/', admin_endpoints_views.AdminSystemHealthView.as_view(), name='super_admin_system_health'),
]