from django.urls import path
from . import views

urlpatterns = [
    # User notifications
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('<int:notification_id>/read/', views.NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('mark-all-read/', views.NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('preferences/', views.NotificationPreferencesView.as_view(), name='notification_preferences'),

    # Admin template management
    path('admin/templates/email/', views.AdminEmailTemplateListView.as_view(), name='admin_email_templates'),
    path('admin/templates/sms/', views.AdminSMSTemplateListView.as_view(), name='admin_sms_templates'),
    path('admin/stats/', views.AdminNotificationStatsView.as_view(), name='admin_notification_stats'),
    path('admin/deliveries/', views.AdminDeliveryLogView.as_view(), name='admin_delivery_log'),
]