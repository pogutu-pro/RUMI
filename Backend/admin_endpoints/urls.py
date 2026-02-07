from django.urls import path
from .views import (
    AdminUserStatsView,
    AdminLandlordVerificationsView,
    AdminPlatformStatsView,
    AdminSystemHealthView,
    AdminPaymentStatsView
)

urlpatterns = [
    # Stats & Analytics
    path('stats/users/', AdminUserStatsView.as_view(), name='admin-user-stats'),
    path('stats/platform/', AdminPlatformStatsView.as_view(), name='admin-platform-stats'),
    path('stats/system-health/', AdminSystemHealthView.as_view(), name='admin-system-health'),
    path('payments/stats/', AdminPaymentStatsView.as_view(), name='admin-payment-stats'),
    
    # Verifications
    path('landlords/verifications/', AdminLandlordVerificationsView.as_view(), name='admin-landlord-verifications'),
]