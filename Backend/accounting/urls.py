from django.urls import path

from accounting.views import ExpenseListCreateView, ExpenseVoidView, StatementView

urlpatterns = [
    path('expenses/', ExpenseListCreateView.as_view(), name='accounting-expenses'),
    path('expenses/<uuid:pk>/void/', ExpenseVoidView.as_view(), name='accounting-expense-void'),
    path('statements/', StatementView.as_view(), name='accounting-statement'),
]
