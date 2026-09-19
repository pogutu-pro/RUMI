from django.urls import path

from .views import (
    ContactListView,
    ConversationListView,
    ConversationMessagesView,
    ConversationReadView,
    UnreadCountView,
)

urlpatterns = [
    path('contacts/', ContactListView.as_view(), name='messaging-contacts'),
    path('conversations/', ConversationListView.as_view(), name='messaging-conversations'),
    path('conversations/<uuid:pk>/messages/', ConversationMessagesView.as_view(), name='messaging-messages'),
    path('conversations/<uuid:pk>/read/', ConversationReadView.as_view(), name='messaging-read'),
    path('unread-count/', UnreadCountView.as_view(), name='messaging-unread'),
]
