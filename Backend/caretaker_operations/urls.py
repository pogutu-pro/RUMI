from django.urls import path
from . import views

urlpatterns = [
    # Caretaker Operations (10 endpoints)
    path('dashboard/', views.CaretakerDashboardView.as_view(), name='caretaker_dashboard'),
    path('check-in/', views.CaretakerCheckInOperationsView.as_view(), name='caretaker_check_in_operations'),
    path('check-out/', views.CaretakerCheckOutOperationsView.as_view(), name='caretaker_check_out_operations'),
    path('damage-reports/', views.CaretakerDamageReportView.as_view(), name='caretaker_damage_reports'),
    path('visitors/', views.CaretakerVisitorManagementView.as_view(), name='caretaker_visitor_management'),
    path('inventory/', views.CaretakerInventoryManagementView.as_view(), name='caretaker_inventory_management'),
    path('maintenance/', views.CaretakerMaintenanceView.as_view(), name='caretaker_maintenance'),
    path('students/', views.CaretakerStudentManagementView.as_view(), name='caretaker_student_management'),
    path('notifications/', views.CaretakerNotificationView.as_view(), name='caretaker_notifications'),
    path('tasks/', views.CaretakerTaskManagementView.as_view(), name='caretaker_task_management'),
    
    # Roommate Management (2 new endpoints)
    path('roommates/match-requests/', views.CaretakerRoommateRequestApprovalView.as_view(), name='caretaker_roommate_requests'),
    path('roommates/match-requests/<int:request_id>/', views.CaretakerRoommateRequestApprovalView.as_view(), name='caretaker_roommate_request_action'),
    path('roommates/matches/', views.CaretakerRoommateMatchManagementView.as_view(), name='caretaker_roommate_matches'),
    path('roommates/matches/<int:match_id>/', views.CaretakerRoommateMatchManagementView.as_view(), name='caretaker_roommate_match_action'),
]