from django.urls import path
from . import views

urlpatterns = [
    # Support Dashboard
    path('dashboard/', views.TechSupportDashboardView.as_view(), name='support_dashboard'),

    # Support Ticket Management
    path('tickets/', views.SupportTicketListView.as_view(), name='support_tickets'),
    path('tickets/admin/', views.SupportTicketListView.as_view(), name='support_tickets_admin'),  # Admin alias
    path('tickets/stats/', views.SupportTicketStatsView.as_view(), name='support_ticket_stats'),
    path('tickets/<str:ticket_id>/', views.SupportTicketDetailView.as_view(), name='support_ticket_detail'),
    path('tickets/<str:ticket_id>/respond/', views.SupportTicketResponseView.as_view(), name='support_ticket_respond'),
    path('tickets/<str:ticket_id>/escalate/', views.SupportTicketEscalateView.as_view(), name='support_ticket_escalate'),
    path('tickets/<str:ticket_id>/resolve/', views.SupportTicketResolveView.as_view(), name='support_ticket_resolve'),

    # Tech Support User Management (Super Admin only)
    path('tech-support/', views.TechSupportUserManagementView.as_view(), name='tech_support_management'),

    # Caretaker Management (Landlord only)
    path('caretakers/', views.CaretakerManagementView.as_view(), name='caretaker_management'),

    # Tech Support Dashboard Data
    path('users/', views.TechSupportUserVisibilityView.as_view(), name='support_users'),
    path('hostels/', views.TechSupportHostelManagementView.as_view(), name='support_hostels'),
    path('transactions/', views.TechSupportTransactionView.as_view(), name='support_transactions'),
    path('messages/', views.TechSupportMessagingView.as_view(), name='support_messages'),
    path('logs/', views.TechSupportLogsView.as_view(), name='support_logs'),
    path('stats/', views.TechSupportStatsView.as_view(), name='support_stats'),

    # System Health & Monitoring
    path('system-health/', views.SystemHealthView.as_view(), name='support_system_health'),

    # Maintenance Operations
    path('maintenance/', views.SystemMaintenanceView.as_view(), name='support_maintenance'),
    path('maintenance/schedule/', views.MaintenanceScheduleView.as_view(), name='support_maintenance_schedule'),
    path('maintenance/backup/', views.SystemBackupView.as_view(), name='support_backup'),

    # Legacy User Support Operations (keeping for backward compatibility)
    path('users/<int:user_id>/support/', views.UserSupportDetailView.as_view(), name='support_user_detail'),
    path('users/<int:user_id>/reset-password/', views.UserPasswordResetView.as_view(), name='support_user_password_reset'),

    # Legacy Payment Support Operations (keeping for backward compatibility)
    path('payments/disputes/', views.PaymentDisputeSupportView.as_view(), name='support_payment_disputes'),
    path('payments/refunds/', views.PaymentRefundSupportView.as_view(), name='support_payment_refunds'),

    # Technical Analytics
    path('analytics/performance/', views.SystemPerformanceView.as_view(), name='support_performance'),
    path('analytics/errors/', views.SystemErrorAnalyticsView.as_view(), name='support_errors'),
    path('analytics/usage/', views.SystemUsageAnalyticsView.as_view(), name='support_usage'),

    # Blog Management (Tech Support)
    path('blog/', views.BlogPostListView.as_view(), name='support_blog_list'),
    path('blog/create/', views.BlogPostCreateView.as_view(), name='support_blog_create'),
    path('blog/<int:post_id>/', views.BlogPostDetailView.as_view(), name='support_blog_detail'),
    path('blog/<int:post_id>/update/', views.BlogPostUpdateView.as_view(), name='support_blog_update'),
    path('blog/<int:post_id>/publish/', views.BlogPostPublishView.as_view(), name='support_blog_publish'),
    path('blog/<int:post_id>/unpublish/', views.BlogPostUnpublishView.as_view(), name='support_blog_unpublish'),
    path('blog/<int:post_id>/delete/', views.BlogPostDeleteView.as_view(), name='support_blog_delete'),
]