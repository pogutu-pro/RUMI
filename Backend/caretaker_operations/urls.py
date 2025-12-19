from django.urls import path
from . import views

urlpatterns = [
    # Main Dashboard (Frontend expects /stats for KPI data)
    path('dashboard/', views.CaretakerDashboardView.as_view(), name='caretaker_dashboard'),
    path('stats/', views.CaretakerDashboardView.as_view(), name='caretaker_stats'),  # Frontend compatibility
    
    # Dashboard Overview Endpoints (Enhanced)
    path('dashboard/overview/', views.CaretakerDashboardView.as_view(), name='caretaker_dashboard_overview'),
    path('dashboard/students/', views.CaretakerStudentManagementView.as_view(), name='caretaker_student_dashboard'),
    path('dashboard/tasks/', views.CaretakerTaskManagementView.as_view(), name='caretaker_task_dashboard'),
    path('dashboard/maintenance/', views.CaretakerMaintenanceView.as_view(), name='caretaker_maintenance_dashboard'),
    path('dashboard/visitors/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_visitor_dashboard'),
    path('dashboard/notifications/', views.CaretakerNotificationView.as_view(), name='caretaker_notification_dashboard'),
    path('dashboard/inventory/', views.CaretakerInventoryManagementView.as_view(), name='caretaker_inventory_dashboard'),
    path('dashboard/roommates/', views.CaretakerRoommateRequestApprovalView.as_view(), name='caretaker_roommate_dashboard'),
    
    # Operations (Frontend expects specific endpoints)
    path('approvals/', views.CaretakerRoommateRequestApprovalView.as_view(), name='caretaker_approvals'),
    path('check-ins/', views.CaretakerCheckInOperationsView.as_view(), name='caretaker_check_ins'),
    path('check-outs/', views.CaretakerCheckOutOperationsView.as_view(), name='caretaker_check_outs'),
    path('tenants/', views.CaretakerStudentManagementView.as_view(), name='caretaker_tenants'),
    
    # Original operations endpoints (kept for compatibility)
    path('check-in/', views.CaretakerCheckInOperationsView.as_view(), name='caretaker_check_in_operations'),
    path('check-out/', views.CaretakerCheckOutOperationsView.as_view(), name='caretaker_check_out_operations'),
    path('damage-reports/', views.CaretakerDamageReportView.as_view(), name='caretaker_damage_reports'),
    path('visitors/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_visitor_management'),
    path('inventory/', views.CaretakerInventoryManagementView.as_view(), name='caretaker_inventory_management'),
    path('maintenance/', views.CaretakerMaintenanceView.as_view(), name='caretaker_maintenance'),
    path('students/', views.CaretakerStudentManagementView.as_view(), name='caretaker_student_management'),
    path('notifications/', views.CaretakerNotificationView.as_view(), name='caretaker_notifications'),
    path('tasks/', views.CaretakerTaskManagementView.as_view(), name='caretaker_task_management'),
    
    # Room Management (Frontend expects /rooms)
    path('rooms/', views.CaretakerInventoryManagementView.as_view(), name='caretaker_rooms'),
    
    # Security endpoints (aligned with frontend expectations)
    path('security/visitors/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_security_visitors'),
    path('security/night-checks/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_security_night_checks'),
    path('security/late-entries/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_security_late_entries'),
    path('security/late-entries/stats/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_security_late_entries_stats'),
    
    # Roommate Management (Frontend expects specific endpoints)
    path('roommates/match-requests/', views.CaretakerRoommateRequestApprovalView.as_view(), name='caretaker_roommate_requests'),
    path('roommates/match-requests/<int:request_id>/', views.CaretakerRoommateRequestApprovalView.as_view(), name='caretaker_roommate_request_action'),
    path('roommates/matches/', views.CaretakerRoommateMatchManagementView.as_view(), name='caretaker_roommate_matches'),
    path('roommates/matches/<int:match_id>/', views.CaretakerRoommateMatchManagementView.as_view(), name='caretaker_roommate_match_action'),
    
    # Messaging (aligned with existing messaging system)
    path('messages/', views.CaretakerNotificationView.as_view(), name='caretaker_messages'),
    path('messages/threads/', views.CaretakerNotificationView.as_view(), name='caretaker_message_threads'),
    path('messages/send/', views.CaretakerNotificationView.as_view(), name='caretaker_message_send'),
]