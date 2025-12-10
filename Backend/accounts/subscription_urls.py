"""
URL routes for subscription API endpoints
"""
from django.urls import path
from .subscription_views import (
    SubscriptionPlansListView,
    SubscriptionPlanDetailView,
    MySubscriptionView,
    SubscriptionUpgradeView,
    SubscriptionCancelView,
    SubscriptionReactivateView,
    SubscriptionPaymentHistoryView,
    SubscriptionInitiatePaymentView,
    FeatureCheckView,
)

urlpatterns = [
    # Public endpoints
    path('plans/', SubscriptionPlansListView.as_view(), name='subscription-plans-list'),
    path('plans/<uuid:plan_id>/', SubscriptionPlanDetailView.as_view(), name='subscription-plan-detail'),
    
    # Landlord subscription management
    path('my-subscription/', MySubscriptionView.as_view(), name='my-subscription'),
    path('upgrade/', SubscriptionUpgradeView.as_view(), name='subscription-upgrade'),
    path('cancel/', SubscriptionCancelView.as_view(), name='subscription-cancel'),
    path('reactivate/', SubscriptionReactivateView.as_view(), name='subscription-reactivate'),
    
    # Payment management
    path('payments/history/', SubscriptionPaymentHistoryView.as_view(), name='subscription-payment-history'),
    path('payments/initiate/', SubscriptionInitiatePaymentView.as_view(), name='subscription-payment-initiate'),
    
    # Feature access
    path('features/<str:feature_name>/', FeatureCheckView.as_view(), name='feature-check'),
]