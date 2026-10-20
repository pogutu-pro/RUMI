from django.urls import path

from leasing import views

urlpatterns = [
    path('tenancies/<uuid:pk>/documents/', views.TenancyDocumentsView.as_view(), name='leasing-documents'),
    path('tenancies/<uuid:pk>/documents/generate/', views.GenerateDocumentView.as_view(), name='leasing-generate'),
    path('tenancies/<uuid:pk>/notice-to-vacate/', views.NoticeToVacateView.as_view(), name='leasing-notice'),
    path('tenancies/<uuid:pk>/rent-reviews/', views.RentReviewListCreateView.as_view(), name='leasing-rent-reviews'),
    path('rent-reviews/<uuid:pk>/cancel/', views.RentReviewCancelView.as_view(), name='leasing-rent-review-cancel'),
    path('documents/<uuid:pk>/download/', views.DocumentDownloadView.as_view(), name='leasing-document-download'),
    path('arrears/', views.ArrearsView.as_view(), name='leasing-arrears'),
    path('debt-cases/', views.DebtCaseListCreateView.as_view(), name='leasing-debt-cases'),
    path('debt-cases/<uuid:pk>/', views.DebtCaseDetailView.as_view(), name='leasing-debt-case'),
    path('staff/', views.StaffView.as_view(), name='leasing-staff'),
]
