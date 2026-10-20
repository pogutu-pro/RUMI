from django.urls import path

from accounting.views import (
    ExpenseListCreateView,
    ExpenseVoidView,
    ManualJournalView,
    ReportView,
    StatementImportView,
    StatementLineActionView,
    StatementView,
    SupplierListCreateView,
)

urlpatterns = [
    path('expenses/', ExpenseListCreateView.as_view(), name='accounting-expenses'),
    path('expenses/<uuid:pk>/void/', ExpenseVoidView.as_view(), name='accounting-expense-void'),
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
