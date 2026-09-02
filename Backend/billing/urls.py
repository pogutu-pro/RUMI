from django.urls import path

from .views import (
    AdminOrganizationBillingDetailView,
    MyOrganizationSubscriptionView,
    SubscriptionPlanListView,
    SubscriptionSubscribeView,
    SubscriptionSwitchPlanView,
)

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='billing-plans'),
    path('subscribe/', SubscriptionSubscribeView.as_view(), name='billing-subscribe'),
    path('switch-plan/', SubscriptionSwitchPlanView.as_view(), name='billing-switch-plan'),
    path('my-subscription/', MyOrganizationSubscriptionView.as_view(), name='billing-my-subscription'),
    path(
        'admin/organizations/<uuid:pk>/',
        AdminOrganizationBillingDetailView.as_view(),
        name='billing-admin-organization-detail',
    ),
]
