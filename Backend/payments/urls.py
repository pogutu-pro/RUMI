from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .mpesa_webhooks import StkPushWebhookView, C2BValidationWebhookView, C2BConfirmationWebhookView
from .rent_period_views import RentPeriodViewSet, StudentPaymentTrackerViewSet, TransferLogViewSet
from .additional_views import PaymentDetailsView, ReceiptGenerateView
from .subscription_views import SubscriptionPlanViewSet, SubscriptionInvoiceViewSet, SubscriptionAccrualView
from . import views, verification_views, stubs_views

# DRF Router for RentPeriod architecture endpoints
router = DefaultRouter()
router.register(r'rent-periods', RentPeriodViewSet, basename='rentperiod')
router.register(r'wallet', StudentPaymentTrackerViewSet, basename='studentwallet')
router.register(r'transfers', TransferLogViewSet, basename='transferlog')
router.register(r'subscriptions/plans', SubscriptionPlanViewSet, basename='subscriptionplan')
router.register(r'subscriptions/invoices', SubscriptionInvoiceViewSet, basename='subscriptioninvoice')

urlpatterns = [
    # RentPeriod Architecture API (NEW)
    path('', include(router.urls)),
    
    # Subscription Accrual (Custom View)
    path('subscriptions/accrual/', SubscriptionAccrualView.as_view(), name='subscription-accrual'),
    
    # Payment initialization
    path('initialize/', views.PaymentInitializeView.as_view(), name='payment_initialize'),
    
    # M-Pesa payments
    path('mpesa/initialize/', views.MpesaPaymentInitializeView.as_view(), name='mpesa_payment_initialize'),
    path('mpesa/status/', views.MpesaPaymentStatusView.as_view(), name='mpesa_payment_status'),
    path('mpesa/config/', views.LandlordMpesaConfigView.as_view(), name='landlord_mpesa_config'),
    
    # M-Pesa webhooks (class-based for Swagger documentation)
    path('webhook/mpesa/stk_push/', StkPushWebhookView.as_view(), name='mpesa_stk_push_webhook'),
    path('webhook/mpesa/c2b_validation/', C2BValidationWebhookView.as_view(), name='mpesa_c2b_validation_webhook'),
    path('webhook/mpesa/c2b_confirmation/', C2BConfirmationWebhookView.as_view(), name='mpesa_c2b_confirmation_webhook'),

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

    # Receipts (UPDATED - added generate endpoint)
    path('receipts/<int:transaction_id>/', views.PaymentReceiptView.as_view(), name='payment_receipt'),
    path('receipts/generate/', ReceiptGenerateView.as_view(), name='receipt_generate'),
    path('receipts/verify/<int:transaction_id>/', verification_views.ReceiptVerificationView.as_view(), name='receipt_verify'),
    
    # NEW: Parity Stubs
    path('verify/', views.PaymentVerifyView.as_view(), name='payment_verify_stub'),
    path('verify/<str:transaction_reference>/', views.PaymentVerifyView.as_view(), name='payment_verify_ref_stub'),
    path('paybill/', views.PaybillAllocationView.as_view(), name='paybill_allocation_stub'),
    path('unmatched/', stubs_views.UnmatchedPaymentsListView.as_view(), name='unmatched_payment_list_stub'),
    path('unmatched/<int:payment_id>/match/', stubs_views.UnmatchedPaymentMatchView.as_view(), name='unmatched_payment_match_stub'),
    path('unmatched/<int:payment_id>/reject/', stubs_views.UnmatchedPaymentRejectView.as_view(), name='unmatched_payment_reject_stub'),
    path('ledger/', stubs_views.PaymentLedgerView.as_view(), name='payment_ledger_stub'),
    path('ledger/export/', stubs_views.PaymentLedgerExportView.as_view(), name='payment_ledger_export_stub'),
    path('ledger/<str:search_param>/', stubs_views.PaymentLedgerView.as_view(), name='payment_ledger_search_stub'),

    # Payment Details (NEW - for Week 1 frontend)
    path('payment-details/<str:bed_id>/', PaymentDetailsView.as_view(), name='payment_details'),
    
    # Tax reports (Landlord)
    path('tax-reports/', views.TaxReportsView.as_view(), name='tax_reports'),
    path('tax-reports/<int:report_id>/download/', views.TaxReportDownloadView.as_view(), name='tax_report_download'),

    # Revenue analytics (Admin)
    path('analytics/revenue/', views.RevenueAnalyticsView.as_view(), name='revenue_analytics'),

    # Additional endpoints
    path('transactions/student/', views.StudentTransactionListView.as_view(), name='student_transactions'),
    path('transactions/student/<int:transaction_id>/', views.StudentTransactionDetailView.as_view(), name='student_transaction_detail'),
    path('transactions/landlord/', views.LandlordTransactionListView.as_view(), name='landlord_transactions'),
    path('payouts/landlord/', views.LandlordPayoutListView.as_view(), name='landlord_payouts'),
    path('transactions/admin/', views.AdminTransactionListView.as_view(), name='admin_transactions'),
    path('refunds/', views.RefundRequestCreateView.as_view(), name='refund_create'),
    path('refunds/list/', views.RefundRequestListView.as_view(), name='refund_list'),
    path('refunds/<int:refund_id>/process/', views.RefundRequestProcessView.as_view(), name='refund_process'),
]