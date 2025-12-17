accounts


GET
/accounts/caretakers/
accounts_caretakers_list


POST
/accounts/caretakers/
accounts_caretakers_create


PUT
/accounts/caretakers/{caretaker_id}/
accounts_caretakers_update


DELETE
/accounts/caretakers/{caretaker_id}/
accounts_caretakers_delete


GET
/accounts/chat/conversations/
accounts_chat_conversations_list


GET
/accounts/chat/conversations/{conversation_id}/messages/
accounts_chat_conversations_messages_list


POST
/accounts/chat/conversations/{conversation_id}/messages/
accounts_chat_conversations_messages_create


POST
/accounts/chat/send/
accounts_chat_send_create


GET
/accounts/dashboard/
accounts_dashboard_list


GET
/accounts/landlord/dashboard/
accounts_landlord_dashboard_list


GET
/accounts/landlords/verification/
accounts_landlords_verification_list


POST
/accounts/landlords/{landlord_id}/verify/{action}/
accounts_landlords_verify_create


POST
/accounts/login/
accounts_login_create


POST
/accounts/logout/
accounts_logout_create


POST
/accounts/password/reset/
accounts_password_reset_create


POST
/accounts/password/reset/confirm/
accounts_password_reset_confirm_create


POST
/accounts/password/reset/verify/
accounts_password_reset_verify_create


GET
/accounts/profile/
accounts_profile_list


PUT
/accounts/profile/
accounts_profile_update


GET
/accounts/profile/completion/
accounts_profile_completion_list


POST
/accounts/profile/picture/
accounts_profile_picture_create


POST
/accounts/refresh-token/
accounts_refresh-token_create


POST
/accounts/register/
accounts_register_create


POST
/accounts/resend-otp/
accounts_resend-otp_create


POST
/accounts/subscriptions/cancel/
accounts_subscriptions_cancel_create


GET
/accounts/subscriptions/features/{feature_name}/
accounts_subscriptions_features_read


GET
/accounts/subscriptions/my-subscription/
accounts_subscriptions_my-subscription_list


GET
/accounts/subscriptions/payments/history/
accounts_subscriptions_payments_history_list


POST
/accounts/subscriptions/payments/initiate/
accounts_subscriptions_payments_initiate_create


GET
/accounts/subscriptions/plans/
accounts_subscriptions_plans_list


GET
/accounts/subscriptions/plans/{plan_id}/
accounts_subscriptions_plans_read


POST
/accounts/subscriptions/reactivate/
accounts_subscriptions_reactivate_create


POST
/accounts/subscriptions/upgrade/
accounts_subscriptions_upgrade_create


GET
/accounts/users/
accounts_users_list


GET
/accounts/users/{user_id}/activity/
accounts_users_activity_list


PUT
/accounts/users/{user_id}/deactivate/
accounts_users_deactivate_update


PUT
/accounts/users/{user_id}/reactivate/
accounts_users_reactivate_update


POST
/accounts/verify-email/
accounts_verify-email_create

admin-endpoints


GET
/admin-endpoints/landlord-verifications/
admin-endpoints_landlord-verifications_list


POST
/admin-endpoints/landlord-verifications/
admin-endpoints_landlord-verifications_create


GET
/admin-endpoints/platform/stats/
admin-endpoints_platform_stats_list


GET
/admin-endpoints/system/health/
admin-endpoints_system_health_list


GET
/admin-endpoints/users/stats/
admin-endpoints_users_stats_list

admin


GET
/admin/admin/activity-feed/
admin_admin_activity-feed_list


GET
/admin/admin/dashboard/stats/
admin_admin_dashboard_stats_list


GET
/admin/admin/hostels/pending/
admin_admin_hostels_pending_list


POST
/admin/admin/hostels/{moderation_id}/approve/
admin_admin_hostels_approve_create


POST
/admin/admin/hostels/{moderation_id}/reject/
admin_admin_hostels_reject_create


GET
/admin/admin/payments/disputes/
admin_admin_payments_disputes_list


GET
/admin/admin/payments/disputes/stats/
admin_admin_payments_disputes_stats_list


GET
/admin/admin/subscriptions/
admin_admin_subscriptions_list


GET
/admin/admin/subscriptions/stats/
admin_admin_subscriptions_stats_list


GET
/admin/admin/users/
admin_admin_users_list

analytics


GET
/analytics/landlord/customers/
analytics_landlord_customers_list


GET
/analytics/landlord/financial-reports/
analytics_landlord_financial-reports_list


GET
/analytics/landlord/growth/
analytics_landlord_growth_list


GET
/analytics/landlord/occupancy/
analytics_landlord_occupancy_list


GET
/analytics/landlord/performance/
analytics_landlord_performance_list


GET
/analytics/landlord/predictive/
analytics_landlord_predictive_list


GET
/analytics/landlord/revenue/
analytics_landlord_revenue_list

caretaker-operations

caretaker


GET
/caretaker/check-in/
caretaker_check-in_list


POST
/caretaker/check-in/
caretaker_check-in_create


GET
/caretaker/check-out/
caretaker_check-out_list


POST
/caretaker/check-out/
caretaker_check-out_create


GET
/caretaker/damage-reports/
caretaker_damage-reports_list


POST
/caretaker/damage-reports/
caretaker_damage-reports_create


PUT
/caretaker/damage-reports/
caretaker_damage-reports_update


GET
/caretaker/dashboard/
caretaker_dashboard_list


GET
/caretaker/inventory/
caretaker_inventory_list


POST
/caretaker/inventory/
caretaker_inventory_create


GET
/caretaker/maintenance/
caretaker_maintenance_list


PUT
/caretaker/maintenance/
caretaker_maintenance_update


GET
/caretaker/notifications/
caretaker_notifications_list


PUT
/caretaker/notifications/
caretaker_notifications_update


GET
/caretaker/students/
caretaker_students_list


POST
/caretaker/students/
caretaker_students_create


GET
/caretaker/tasks/
caretaker_tasks_list


POST
/caretaker/tasks/
caretaker_tasks_create


GET
/caretaker/visitors/
caretaker_visitors_list


POST
/caretaker/visitors/
caretaker_visitors_create


PUT
/caretaker/visitors/
caretaker_visitors_update

home


GET
/home/
home_list


GET
/home/about/
home_about_list


GET
/home/blog/
home_blog_list


GET
/home/blog/{slug}/
home_blog_read


POST
/home/contact/
home_contact_create


GET
/home/contact/info/
home_contact_info_list


GET
/home/faq/
home_faq_list


POST
/home/faq/{faq_id}/helpful/
home_faq_helpful_create


POST
/home/newsletter/subscribe/
home_newsletter_subscribe_create


POST
/home/newsletter/unsubscribe/
home_newsletter_unsubscribe_create


GET
/home/newsletter/verify/
home_newsletter_verify_list


PUT
/home/statistics/{stat_key}/
home_statistics_update


GET
/home/team/
home_team_list

hostels


GET
/hostels/
hostels_list


POST
/hostels/checkin/{booking_id}/start/
hostels_checkin_start_create


PUT
/hostels/checkin/{checkin_id}/submit/
hostels_checkin_submit_update


PUT
/hostels/checkin/{checkin_id}/verify/
hostels_checkin_verify_update


POST
/hostels/create/
hostels_create_create


GET
/hostels/room-search/
hostels_room-search_list


GET
/hostels/rooms/
hostels_rooms_list


GET
/hostels/rooms/{room_id}/
hostels_rooms_read


GET
/hostels/search/
hostels_search_list


GET
/hostels/{hostel_id}/
hostels_read


POST
/hostels/{hostel_id}/inventory/
hostels_inventory_create


GET
/hostels/{hostel_id}/inventory/template/
hostels_inventory_template_list


POST
/hostels/{hostel_id}/rooms/
hostels_rooms_create


POST
/hostels/{room_id}/book/
hostels_book_create


POST
/hostels/{room_id}/reserve/
hostels_reserve_create


GET
/hostels/{room_id}/roommates/
hostels_roommates_list

notifications


GET
/notifications/
notifications_list


GET
/notifications/admin/stats/
notifications_admin_stats_list


GET
/notifications/admin/templates/email/
notifications_admin_templates_email_list


GET
/notifications/admin/templates/sms/
notifications_admin_templates_sms_list


PUT
/notifications/mark-all-read/
notifications_mark-all-read_update


GET
/notifications/preferences/
notifications_preferences_list


PUT
/notifications/preferences/
notifications_preferences_update


PUT
/notifications/{notification_id}/read/
notifications_read_update

payments


GET
/payments/analytics/revenue/
payments_analytics_revenue_list


POST
/payments/initialize/
payments_initialize_create


GET
/payments/late-fees/{booking_id}/
payments_late-fees_read


POST
/payments/late-fees/{late_fee_id}/pay/
payments_late-fees_pay_create


GET
/payments/payment-methods/
payments_payment-methods_list


POST
/payments/payment-methods/
payments_payment-methods_create


DELETE
/payments/payment-methods/{method_id}/
payments_payment-methods_delete


POST
/payments/payment-methods/{method_id}/default/
payments_payment-methods_default_create


GET
/payments/payouts/landlord/
payments_payouts_landlord_list


GET
/payments/receipts/{transaction_id}/
payments_receipts_read


POST
/payments/recurring/enable/
payments_recurring_enable_create


POST
/payments/recurring/{recurring_id}/cancel/
payments_recurring_cancel_create


POST
/payments/recurring/{recurring_id}/pause/
payments_recurring_pause_create


POST
/payments/recurring/{recurring_id}/resume/
payments_recurring_resume_create


POST
/payments/refunds/
payments_refunds_create


GET
/payments/refunds/list/
payments_refunds_list_list


POST
/payments/refunds/{refund_id}/process/
payments_refunds_process_create


GET
/payments/tax-reports/
payments_tax-reports_list


GET
/payments/tax-reports/{report_id}/download/
payments_tax-reports_download_list


GET
/payments/transactions/admin/
payments_transactions_admin_list


GET
/payments/transactions/landlord/
payments_transactions_landlord_list


GET
/payments/transactions/student/
payments_transactions_student_list


GET
/payments/transactions/student/{transaction_id}/
payments_transactions_student_read


POST
/payments/webhook/paystack/
payments_webhook_paystack_create

roommates


GET
/roommates/advanced-matching/
roommates_advanced-matching_list


GET
/roommates/analytics/
roommates_analytics_list


GET
/roommates/chat/
roommates_chat_list


POST
/roommates/chat/
roommates_chat_create


GET
/roommates/history/
roommates_history_list


POST
/roommates/history/
roommates_history_create


GET
/roommates/matches/
roommates_matches_list


POST
/roommates/matches/
roommates_matches_create


GET
/roommates/profile/
roommates_profile_list


PUT
/roommates/profile/
roommates_profile_update


POST
/roommates/report/
roommates_report_create


GET
/roommates/requests/
roommates_requests_list


POST
/roommates/requests/
roommates_requests_create


PUT
/roommates/requests/
roommates_requests_update


GET
/roommates/settings/
roommates_settings_list


PUT
/roommates/settings/
roommates_settings_update


GET
/roommates/verification/
roommates_verification_list


POST
/roommates/verification/
roommates_verification_create