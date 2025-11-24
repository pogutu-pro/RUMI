from django.urls import path
from . import views

urlpatterns = [
    # Payment initialization
    path('initialize/', views.PaymentInitializeView.as_view(), name='payment_initialize'),

    # Recurring payments
    path('recurring/enable/', views.RecurringPaymentEnableView.as_view(), name='recurring_payment_enable'),
    path('recurring/<int:recurring_id>/pause/', views.RecurringPaymentPauseView.as_view(), name='recurring_payment_pause'),
    path('recurring/<int:recurring_id>/resume/', views.RecurringPaymentResumeView.as_view(), name='recurring_payment_resume'),
    path('recurring/<int:recurring_id>/cancel/', views.RecurringPaymentCancelView.as_view(), name='recurring_payment_cancel'),

    # Late fees
    path('late-fees/<int:booking_id>/', views.LateFeesView.as_view(), name='late_fees'),
    path('late-fees/<int:late_fee_id>/pay/', views.LateFeePayView.as_view(), name='late_fee_pay'),

    # Saved payment methods
    path('payment-methods/', views.SavedPaymentMethodsView.as_view(), name='saved_payment_methods'),
    path('payment-methods/<int:method_id>/default/', views.SavedPaymentMethodSetDefaultView.as_view(), name='payment_method_set_default'),
    path('payment-methods/<int:method_id>/', views.SavedPaymentMethodDeleteView.as_view(), name='payment_method_delete'),

    # Webhooks
    path('webhook/paystack/', views.paystack_webhook, name='paystack_webhook'),

    # Tax reports (Landlord)
    # Payment receipts
    path('receipts/<int:transaction_id>/', views.PaymentReceiptView.as_view(), name='payment_receipt'),
    path('tax-reports/', views.TaxReportsView.as_view(), name='tax_reports'),
    path('tax-reports/<int:report_id>/download/', views.TaxReportDownloadView.as_view(), name='tax_report_download'),

    # Revenue analytics (Admin)
    path('analytics/revenue/', views.RevenueAnalyticsView.as_view(), name='revenue_analytics'),
]