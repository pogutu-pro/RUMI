from django.urls import path

from .views import (
    AdminOrganizationBillingDetailView,
    AdminOrganizationBillingListView,
    AdminRevenueSummaryView,
    AdminSubscriptionOverrideView,
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
    # List route registered BEFORE the detail route so the resolver never
    # accidentally matches admin/organizations/<something>/ against the
    # bare list path (same ordering convention as properties/ in rumia_api/urls.py).
    path(
        'admin/revenue/',
        AdminRevenueSummaryView.as_view(),
        name='billing-admin-revenue',
    ),
    path(
        'admin/organizations/',
        AdminOrganizationBillingListView.as_view(),
        name='billing-admin-organizations',
    ),
    path(
        'admin/organizations/<uuid:pk>/',
        AdminOrganizationBillingDetailView.as_view(),
        name='billing-admin-organization-detail',
    ),
    path(
        'admin/organizations/<uuid:pk>/override/',
        AdminSubscriptionOverrideView.as_view(),
        name='billing-admin-organization-override',
    ),
]
