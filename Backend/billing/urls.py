from django.urls import path

from .views import SubscriptionPlanListView, SubscriptionSubscribeView, SubscriptionSwitchPlanView

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='billing-plans'),
    path('subscribe/', SubscriptionSubscribeView.as_view(), name='billing-subscribe'),
    path('switch-plan/', SubscriptionSwitchPlanView.as_view(), name='billing-switch-plan'),
]
