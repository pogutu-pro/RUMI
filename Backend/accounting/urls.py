from django.urls import path

from .books_views import (
    ManualJournalView, ReportView, StatementImportView, StatementLineActionView, StatementView, SupplierListCreateView,
)
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
    path('statements/', StatementView.as_view(), name='accounting-statement'),
    path('suppliers/', SupplierListCreateView.as_view(), name='accounting-suppliers'),
    path('reports/', ReportView.as_view(), name='accounting-reports'),
    path('journals/', ManualJournalView.as_view(), name='accounting-journals'),
    path('reconciliation/', StatementImportView.as_view(), name='accounting-reconciliation'),
    path('reconciliation/lines/<uuid:pk>/assign/', StatementLineActionView.as_view(action='assign'),
         name='accounting-line-assign'),
    path('reconciliation/lines/<uuid:pk>/ignore/', StatementLineActionView.as_view(action='ignore'),
         name='accounting-line-ignore'),
]
