from django.urls import path

from .views import (
    LockView, TaxRatesView, SettingDetailView, SettingListView, SocialLinkAdminDetailView, SocialLinkAdminListView,
    TestEmailView, TestPaystackView, TestSmsView, UnlockStatusView, UnlockView,
)

urlpatterns = [
    path('', SettingListView.as_view(), name='platform-settings'),
    path('unlock/', UnlockView.as_view(), name='platform-settings-unlock'),
    path('lock/', LockView.as_view(), name='platform-settings-lock'),
    path('unlock-status/', UnlockStatusView.as_view(), name='platform-settings-unlock-status'),
    path('tax-rates/', TaxRatesView.as_view(), name='platform-tax-rates'),
    path('social-links/', SocialLinkAdminListView.as_view(), name='platform-social-links'),
    path('social-links/<str:platform>/', SocialLinkAdminDetailView.as_view(), name='platform-social-link'),
    path('test/paystack/', TestPaystackView.as_view(), name='platform-settings-test-paystack'),
    path('test/email/', TestEmailView.as_view(), name='platform-settings-test-email'),
    path('test/sms/', TestSmsView.as_view(), name='platform-settings-test-sms'),
    path('<str:key>/', SettingDetailView.as_view(), name='platform-setting-detail'),
]
