from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Chat WebSocket for specific conversations
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),

    # Notifications WebSocket
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]