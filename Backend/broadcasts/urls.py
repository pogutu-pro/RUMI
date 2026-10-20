from django.urls import path

from broadcasts.views import BroadcastView

urlpatterns = [path('', BroadcastView.as_view(), name='broadcasts')]
