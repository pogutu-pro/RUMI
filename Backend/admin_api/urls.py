from django.urls import path
from . import views

urlpatterns = [
    # Admin Dashboard
    path('admin/dashboard/stats/', views.AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    
    # Admin Activity Feed
    path('admin/activity-feed/', views.SystemActivityFeedView.as_view(), name='admin_activity_feed'),
    
    # Admin User Management
    path('admin/users/', views.AdminUserManagementView.as_view(), name='admin_user_management'),
    
    # Admin Hostel Moderation
    path('admin/hostels/pending/', views.HostelModerationListView.as_view(), name='admin_hostels_pending'),
    path('admin/hostels/<int:moderation_id>/approve/', views.HostelModerationActionView.as_view(), name='admin_hostel_approve'),
    path('admin/hostels/<int:moderation_id>/reject/', views.HostelModerationActionView.as_view(), name='admin_hostel_reject'),
    
    # Admin Subscription Management
    path('admin/subscriptions/', views.AdminSubscriptionListView.as_view(), name='admin_subscriptions'),
    path('admin/subscriptions/stats/', views.AdminSubscriptionStatsView.as_view(), name='admin_subscriptions_stats'),
    
    # Admin Payment Disputes
    path('admin/payments/disputes/', views.AdminPaymentDisputesListView.as_view(), name='admin_payment_disputes'),
    path('admin/payments/disputes/stats/', views.AdminPaymentDisputesStatsView.as_view(), name='admin_payment_disputes_stats'),
]