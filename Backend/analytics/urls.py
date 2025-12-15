from django.urls import path
from . import views

urlpatterns = [
    # Landlord Advanced Dashboard Analytics (7 endpoints)
    path('landlord/revenue/', views.LandlordRevenueAnalyticsView.as_view(), name='landlord_revenue_analytics'),
    path('landlord/occupancy/', views.LandlordOccupancyAnalyticsView.as_view(), name='landlord_occupancy_analytics'),
    path('landlord/growth/', views.LandlordGrowthAnalyticsView.as_view(), name='landlord_growth_analytics'),
    path('landlord/performance/', views.LandlordPerformanceMetricsView.as_view(), name='landlord_performance_metrics'),
    path('landlord/customers/', views.LandlordCustomerAnalyticsView.as_view(), name='landlord_customer_analytics'),
    path('landlord/financial-reports/', views.LandlordFinancialReportsView.as_view(), name='landlord_financial_reports'),
    path('landlord/predictive/', views.LandlordPredictiveAnalyticsView.as_view(), name='landlord_predictive_analytics'),
]