from django.urls import path
from . import views

urlpatterns = [
    # Landing page

    # About us
    path('about/', views.AboutUsView.as_view(), name='about_us'),

    # Team
    path('team/', views.TeamView.as_view(), name='team'),

    # Contact
    path('contact/', views.ContactInquiryView.as_view(), name='contact_inquiry'),
    path('contact/info/', views.ContactInfoView.as_view(), name='contact_info'),

    # FAQ
    path('faq/', views.FAQView.as_view(), name='faq'),
    path('faq/<int:faq_id>/helpful/', views.FAQHelpfulView.as_view(), name='faq_helpful'),

    # Blog
    path('blog/', views.BlogListView.as_view(), name='blog_list'),
    path('blog/<slug:slug>/', views.BlogDetailView.as_view(), name='blog_detail'),

    # Newsletter
    path('newsletter/subscribe/', views.NewsletterSubscribeView.as_view(), name='newsletter_subscribe'),
    path('newsletter/verify/', views.NewsletterVerifyView.as_view(), name='newsletter_verify'),
    path('newsletter/unsubscribe/', views.NewsletterUnsubscribeView.as_view(), name='newsletter_unsubscribe'),

    # Admin statistics
    path('statistics/<str:stat_key>/', views.StatisticsUpdateView.as_view(), name='statistics_update'),

    # Prometheus metrics proxy
    path('metrics/', views.PrometheusMetricsProxyView.as_view(), name='prometheus_metrics'),
]