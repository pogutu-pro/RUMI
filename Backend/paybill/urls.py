from django.urls import path

from paybill.views import (
    C2BCallbackView,
    IncomingTransactionActionView,
    IncomingTransactionListView,
    PaybillAccountDetailView,
    PaybillAccountListCreateView,
    TenantPaybillInstructionsView,
)

# Daraja rejects callback URLs containing words such as "mpesa", "safaricom",
# "sql", "query", "exec" — keep those out of these paths.
urlpatterns = [
    path('c2b/<str:token>/validate/', C2BCallbackView.as_view(kind='validate'), name='paybill-c2b-validate'),
    path('c2b/<str:token>/confirm/', C2BCallbackView.as_view(kind='confirm'), name='paybill-c2b-confirm'),
    path('accounts/', PaybillAccountListCreateView.as_view(), name='paybill-accounts'),
    path('accounts/<uuid:pk>/', PaybillAccountDetailView.as_view(), name='paybill-account-detail'),
    path(
        'accounts/<uuid:pk>/register-urls/',
        PaybillAccountDetailView.as_view(action='register'),
        name='paybill-account-register',
    ),
    path(
        'accounts/<uuid:pk>/rotate-token/',
        PaybillAccountDetailView.as_view(action='rotate_token'),
        name='paybill-account-rotate-token',
    ),
    path('transactions/', IncomingTransactionListView.as_view(), name='paybill-transactions'),
    path(
        'transactions/<uuid:pk>/assign/',
        IncomingTransactionActionView.as_view(action='assign'),
        name='paybill-transaction-assign',
    ),
    path(
        'transactions/<uuid:pk>/ignore/',
        IncomingTransactionActionView.as_view(action='ignore'),
        name='paybill-transaction-ignore',
    ),
    path('instructions/', TenantPaybillInstructionsView.as_view(), name='paybill-instructions'),
]
