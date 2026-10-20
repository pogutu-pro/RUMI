from django.urls import path

from . import views

urlpatterns = [
    path('admin/logs/', views.AdminAuditLogListView.as_view(), name='audit-admin-logs'),
]
