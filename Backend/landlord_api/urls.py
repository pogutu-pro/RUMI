from django.urls import path
from . import views

urlpatterns = [
    # Landlord Dashboard
    path('dashboard/overview/', views.LandlordDashboardOverviewView.as_view(), name='landlord_dashboard_overview'),
    path('dashboard/activity-feed/', views.LandlordActivityFeedView.as_view(), name='landlord_activity_feed'),
    
    # Payment Management
    path('payments/reports/', views.LandlordPaymentReportsView.as_view(), name='landlord_payment_reports'),
    path('payments/reports/generate/', views.LandlordPaymentReportsView.as_view(), name='landlord_generate_report'),
    path('payments/analytics/', views.LandlordPaymentAnalyticsView.as_view(), name='landlord_payment_analytics'),
    path('payments/transactions/recent/', views.LandlordRecentTransactionsView.as_view(), name='landlord_recent_transactions'),
]