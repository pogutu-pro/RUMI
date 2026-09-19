from django.urls import path

from .views import (
    ExpenseDetailView, ExpenseListCreateView, ExportView, MriFiledView, MriMonthView, MriYearView,
    SummaryView, TaxProfileView,
)

urlpatterns = [
    path('mri/', MriMonthView.as_view(), name='accounting-mri-month'),
    path('mri/year/', MriYearView.as_view(), name='accounting-mri-year'),
    path('mri/<str:month>/filed/', MriFiledView.as_view(), name='accounting-mri-filed'),
    path('tax-profile/', TaxProfileView.as_view(), name='accounting-tax-profile'),
    path('summary/', SummaryView.as_view(), name='accounting-summary'),
    path('expenses/', ExpenseListCreateView.as_view(), name='accounting-expenses'),
    path('expenses/<uuid:pk>/', ExpenseDetailView.as_view(), name='accounting-expense-detail'),
    path('export/', ExportView.as_view(), name='accounting-export'),
]
