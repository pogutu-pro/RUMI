from django.urls import path

from .views import PayoutAccountView

urlpatterns = [
    path('payout/', PayoutAccountView.as_view(), name='organizations-payout'),
]
