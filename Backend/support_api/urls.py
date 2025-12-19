from django.urls import path
from . import views

urlpatterns = [
    # Support Dashboard
    path('dashboard/', views.TechSupportDashboardView.as_view(), name='support_dashboard'),
    
    # Support Ticket Management
    path('tickets/', views.SupportTicketListView.as_view(), name='support_tickets'),
    path('tickets/<str:ticket_id>/', views.SupportTicketDetailView.as_view(), name='support_ticket_detail'),
    path('tickets/<str:ticket_id>/respond/', views.SupportTicketResponseView.as_view(), name='support_ticket_respond'),
    path('tickets/<str:ticket_id>/escalate/', views.SupportTicketEscalateView.as_view(), name='support_ticket_escalate'),
    path('tickets/<str:ticket_id>/resolve/', views.SupportTicketResolveView.as_view(), name='support_ticket_resolve'),
    path('tickets/stats/', views.SupportTicketStatsView.as_view(), name='support_ticket_stats'),
    
    # Tech Support User Management (Super Admin only)
    path('tech-support/', views.TechSupportUserManagementView.as_view(), name='tech_support_management'),
    
    # Caretaker Management (Landlord only)
    path('caretakers/', views.CaretakerManagementView.as_view(), name='caretaker_management'),
    
    # System Health & Monitoring
    path('system-health/', views.SystemHealthView.as_view(), name='support_system_health'),
    path('logs/', views.SystemLogsView.as_view(), name='support_logs'),
    
    # Maintenance Operations
    path('maintenance/', views.SystemMaintenanceView.as_view(), name='support_maintenance'),
    path('maintenance/schedule/', views.MaintenanceScheduleView.as_view(), name='support_maintenance_schedule'),
    path('maintenance/backup/', views.SystemBackupView.as_view(), name='support_backup'),
    
    # User Support Operations
    path('users/', views.UserSupportView.as_view(), name='support_users'),
    path('users/<int:user_id>/support/', views.UserSupportDetailView.as_view(), name='support_user_detail'),
    path('users/<int:user_id>/reset-password/', views.UserPasswordResetView.as_view(), name='support_user_password_reset'),
    
    # Payment Support Operations
    path('payments/', views.PaymentSupportView.as_view(), name='support_payments'),
    path('payments/disputes/', views.PaymentDisputeSupportView.as_view(), name='support_payment_disputes'),
    path('payments/refunds/', views.PaymentRefundSupportView.as_view(), name='support_payment_refunds'),
    
    # Technical Analytics
    path('analytics/performance/', views.SystemPerformanceView.as_view(), name='support_performance'),
    path('analytics/errors/', views.SystemErrorAnalyticsView.as_view(), name='support_errors'),
    path('analytics/usage/', views.SystemUsageAnalyticsView.as_view(), name='support_usage'),
]