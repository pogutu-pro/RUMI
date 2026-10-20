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
    path('careers/', views.CareerListView.as_view(), name='career_list'),
    path('social-links/', views.SocialLinkListView.as_view(), name='social_links'),
    path('admin/careers/', views.AdminCareerListCreateView.as_view(), name='admin_career_list_create'),
    path('admin/careers/<int:pk>/', views.AdminCareerDetailView.as_view(), name='admin_career_detail'),
    path('blog/<slug:slug>/', views.BlogDetailView.as_view(), name='blog_detail'),

    # Blog admin — tech_support/tech_support_admin/super_admin only, see
    # _is_blog_staff_role in views.py. Every post regardless of publish
    # status; distinct from the public, published-only endpoints above.
    path('admin/blog/', views.AdminBlogPostListCreateView.as_view(), name='admin_blog_list_create'),
    path('admin/blog/upload-cover/', views.AdminBlogCoverUploadView.as_view(), name='admin_blog_upload_cover'),
    path('admin/blog/<int:pk>/', views.AdminBlogPostDetailView.as_view(), name='admin_blog_detail'),

    # Newsletter
    path('newsletter/subscribe/', views.NewsletterSubscribeView.as_view(), name='newsletter_subscribe'),
    path('newsletter/verify/', views.NewsletterVerifyView.as_view(), name='newsletter_verify'),
    path('newsletter/unsubscribe/', views.NewsletterUnsubscribeView.as_view(), name='newsletter_unsubscribe'),

    # Admin statistics
    path('statistics/<str:stat_key>/', views.StatisticsUpdateView.as_view(), name='statistics_update'),

    # Prometheus metrics proxy
    path('metrics/', views.PrometheusMetricsProxyView.as_view(), name='prometheus_metrics'),
]