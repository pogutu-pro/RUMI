from django.urls import path
from . import views

urlpatterns = [
    # Roommate System (10 endpoints)
    path('profile/', views.RoommateProfileView.as_view(), name='roommate_profile'),
    path('matches/', views.RoommateMatchingView.as_view(), name='roommate_matching'),
    path('requests/', views.RoommateRequestsView.as_view(), name='roommate_requests'),
    path('chat/', views.RoommateChatView.as_view(), name='roommate_chat'),
    path('verification/', views.RoommateVerificationView.as_view(), name='roommate_verification'),
    path('history/', views.RoommateHistoryView.as_view(), name='roommate_history'),
    path('analytics/', views.RoommateAnalyticsView.as_view(), name='roommate_analytics'),
    path('settings/', views.RoommateSettingsView.as_view(), name='roommate_settings'),
    path('report/', views.RoommateReportView.as_view(), name='roommate_report'),
    path('advanced-matching/', views.RoommateMatchingAdvancedView.as_view(), name='roommate_advanced_matching'),
]