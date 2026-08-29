"""RUMIA canonical API routes."""

from django.urls import path

from rumia_api.views import (
    IncomeSummaryView,
    ManualPaymentView,
    OrganizationListView,
    PaymentListCreateView,
    PaymentProviderStatusView,
    PaystackWebhookView,
    PropertyDetailView,
    PropertyListCreateView,
    RentalUnitDetailView,
    RentalUnitListCreateView,
    RentBalanceView,
    RentChargeGenerateView,
    RentChargeListView,
    TenancyDetailView,
    TenancyListCreateView,
    TenancyTerminateView,
    TenantDetailView,
    TenantListCreateView,
)

urlpatterns = [
    path('organizations/', OrganizationListView.as_view(), name='rumia-organizations'),
    path('properties/', PropertyListCreateView.as_view(), name='rumia-properties'),
    path('properties/<uuid:pk>/', PropertyDetailView.as_view(), name='rumia-property-detail'),
    path('units/', RentalUnitListCreateView.as_view(), name='rumia-units'),
    path('units/<uuid:pk>/', RentalUnitDetailView.as_view(), name='rumia-unit-detail'),
    path('tenancies/', TenancyListCreateView.as_view(), name='rumia-tenancies'),
    path('tenancies/<uuid:pk>/', TenancyDetailView.as_view(), name='rumia-tenancy-detail'),
    path('tenancies/<uuid:pk>/terminate/', TenancyTerminateView.as_view(), name='rumia-tenancy-terminate'),
    path('tenants/', TenantListCreateView.as_view(), name='rumia-tenants'),
    path('tenants/<uuid:pk>/', TenantDetailView.as_view(), name='rumia-tenant-detail'),
    path('rent/', RentChargeListView.as_view(), name='rumia-rent-charges'),
    path('rent/balance/', RentBalanceView.as_view(), name='rumia-rent-balance'),
    path('rent/generate/', RentChargeGenerateView.as_view(), name='rumia-rent-generate'),
    # Nested under rent/ (not /payments/) — that top-level prefix already
    # belongs to the legacy `payments` app's URLs (registered earlier in
    # rumi/urls.py), so anything mounted at /api/v1/payments/... here would
    # silently be shadowed by the legacy router/webhook and never get hit.
    path('rent/payments/', PaymentListCreateView.as_view(), name='rumia-payments'),
    path('rent/payments/manual/', ManualPaymentView.as_view(), name='rumia-payment-manual'),
    path('rent/payments/webhook/paystack/', PaystackWebhookView.as_view(), name='rumia-paystack-webhook'),
    path('rent/payments/providers/', PaymentProviderStatusView.as_view(), name='rumia-payment-providers'),
    path('income/', IncomeSummaryView.as_view(), name='rumia-income'),
]
