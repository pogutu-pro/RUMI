from django.urls import path

from .views import (
    SupportTicketDetailView,
    SupportTicketListCreateView,
    TicketMessageListCreateView,
)

urlpatterns = [
    path('tickets/', SupportTicketListCreateView.as_view(), name='support-tickets'),
    path('tickets/<uuid:pk>/', SupportTicketDetailView.as_view(), name='support-ticket-detail'),
    path('tickets/<uuid:pk>/messages/', TicketMessageListCreateView.as_view(), name='support-ticket-messages'),
]
