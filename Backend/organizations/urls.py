from django.urls import path

from .views import PayoutAccountView, PayoutBankListView

urlpatterns = [
    path('payout/', PayoutAccountView.as_view(), name='organizations-payout'),
    path('payout/banks/', PayoutBankListView.as_view(), name='organizations-payout-banks'),
]
