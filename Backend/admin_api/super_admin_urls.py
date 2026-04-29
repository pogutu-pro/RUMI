from django.urls import path
from .views import (
    AdminDashboardStatsView,
    SystemActivityFeedView,
    AdminUserManagementView,
    HostelModerationListView,
    HostelModerationActionView,
    AdminHostelListView,
    AdminHostelOverrideView,
    AdminPaymentDisputesListView,
    AdminPaymentDisputesStatsView,
    AdminPaymentDisputeActionView,
    AdminSubscriptionListView,
    AdminSubscriptionStatsView,
    AdminPlatformStatsView,
    AdminLandlordVerificationsView,
    AdminSystemHealthView,
    AdminRevenueView,
)

urlpatterns = [
    # Super Admin Dashboard
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='super_admin_dashboard_stats'),

    # System Activity Feed (EXPOSED)
    path('activity-feed/', SystemActivityFeedView.as_view(), name='super_admin_activity_feed'),

    # User Management (Full Access)
    path('users/', AdminUserManagementView.as_view(), name='super_admin_user_management'),
    path('users/students/', AdminUserManagementView.as_view(), name='super_admin_student_management'),
    path('users/landlords/', AdminUserManagementView.as_view(), name='super_admin_landlord_management'),
    path('users/caretakers/', AdminUserManagementView.as_view(), name='super_admin_caretaker_management'),
    path('users/suspended/', AdminUserManagementView.as_view(), name='super_admin_suspended_users'),

    # Hostel Moderation (EXPOSED)
    path('hostels/pending/', HostelModerationListView.as_view(), name='super_admin_hostels_pending'),
    path('hostels/moderation/', HostelModerationListView.as_view(), name='super_admin_hostel_moderation'),
    path('hostels/moderation/<int:moderation_id>/approve/', HostelModerationActionView.as_view(), name='super_admin_hostel_approve'),
    path('hostels/moderation/<int:moderation_id>/reject/', HostelModerationActionView.as_view(), name='super_admin_hostel_reject'),

    # Property Management (NEW)
    path('hostels/all/', AdminHostelListView.as_view(), name='super_admin_hostels_all'),
    path('hostels/<int:hostel_id>/restrict/', AdminHostelOverrideView.as_view(), name='super_admin_hostel_restrict'),

    # Payment Management (EXPOSED)
    path('payments/disputes/', AdminPaymentDisputesListView.as_view(), name='super_admin_payment_disputes'),
    path('payments/disputes/stats/', AdminPaymentDisputesStatsView.as_view(), name='super_admin_payment_disputes_stats'),
    path('payments/disputes/<int:dispute_id>/resolve/', AdminPaymentDisputeActionView.as_view(), name='super_admin_payment_dispute_resolve'),
    path('payments/disputes/<int:dispute_id>/status/', AdminPaymentDisputeActionView.as_view(), name='super_admin_payment_dispute_status'),

    # Subscription Management (EXPOSED)
    path('subscriptions/', AdminSubscriptionListView.as_view(), name='super_admin_subscriptions'),
    path('subscriptions/stats/', AdminSubscriptionStatsView.as_view(), name='super_admin_subscriptions_stats'),

    # Platform Statistics (EXPOSED)
    path('platform/stats/', AdminPlatformStatsView.as_view(), name='super_admin_platform_stats'),

    # Revenue Analytics (EXPOSED)
    path('revenue/', AdminRevenueView.as_view(), name='super_admin_revenue'),

    # Landlord Verifications (EXPOSED)
    path('landlord-verifications/', AdminLandlordVerificationsView.as_view(), name='super_admin_landlord_verifications'),

    # System Health (EXPOSED)
    path('system/health/', AdminSystemHealthView.as_view(), name='super_admin_system_health'),
]