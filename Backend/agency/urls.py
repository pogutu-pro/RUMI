from django.urls import path

from agency.views import (
    OwnerDetailView,
    OwnerListCreateView,
    OwnerStatementListView,
    OwnerStatementPdfView,
    OwnerStatementPreviewView,
    OwnerTransactionListCreateView,
)

urlpatterns = [
    path('owners/', OwnerListCreateView.as_view(), name='agency-owners'),
    path('owners/<uuid:pk>/', OwnerDetailView.as_view(), name='agency-owner-detail'),
    path('owners/<uuid:pk>/statement-preview/', OwnerStatementPreviewView.as_view(), name='agency-owner-preview'),
    path('owners/<uuid:pk>/statements/', OwnerStatementListView.as_view(), name='agency-owner-statements'),
    path('owners/<uuid:pk>/transactions/', OwnerTransactionListCreateView.as_view(), name='agency-owner-transactions'),
    path('statements/<uuid:pk>/pdf/', OwnerStatementPdfView.as_view(), name='agency-statement-pdf'),
]
