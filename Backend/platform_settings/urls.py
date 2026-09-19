from django.urls import path

from .views import SettingDetailView, SettingListView, TestEmailView, TestPaystackView, TestSmsView

urlpatterns = [
    path('', SettingListView.as_view(), name='platform-settings'),
    path('test/paystack/', TestPaystackView.as_view(), name='platform-settings-test-paystack'),
    path('test/email/', TestEmailView.as_view(), name='platform-settings-test-email'),
    path('test/sms/', TestSmsView.as_view(), name='platform-settings-test-sms'),
    path('<str:key>/', SettingDetailView.as_view(), name='platform-setting-detail'),
]
