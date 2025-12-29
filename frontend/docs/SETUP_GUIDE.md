accounts


GET
/accounts/caretakers/
List Caretakers
accounts_caretakers_list


POST
/accounts/caretakers/
Create Caretaker
accounts_caretakers_create


PUT
/accounts/caretakers/{caretaker_id}/
accounts_caretakers_update


DELETE
/accounts/caretakers/{caretaker_id}/
accounts_caretakers_delete


GET
/accounts/chat/conversations/
Get User Conversations
accounts_chat_conversations_list


GET
/accounts/chat/conversations/{conversation_id}/messages/
Get Conversation Messages
accounts_chat_conversations_messages_list


POST
/accounts/chat/conversations/{conversation_id}/messages/
Send Message to Conversation
accounts_chat_conversations_messages_create


POST
/accounts/chat/send/
Send Direct Message
accounts_chat_send_create


GET
/accounts/dashboard/
Get Student Dashboard
accounts_dashboard_list


GET
/accounts/landlord/dashboard/
Get Landlord Dashboard
accounts_landlord_dashboard_list


GET
/accounts/landlords/verification/
accounts_landlords_verification_list


POST
/accounts/landlords/{landlord_id}/verify/{action}/
accounts_landlords_verify_create


POST
/accounts/login/
Authenticate User
accounts_login_create


POST
/accounts/logout/
accounts_logout_create


GET
/accounts/messages/unread-count/
Get Unread Message Count
accounts_messages_unread-count_list


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
Get User Profile
accounts_profile_list


PUT
/accounts/profile/
Update User Profile
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
Register New User
accounts_register_create


POST
/accounts/resend-otp/
accounts_resend-otp_create


GET
/accounts/student/activity/feed/
accounts_student_activity_feed_list


GET
/accounts/student/security/late-entries/
accounts_student_security_late-entries_list


GET
/accounts/student/security/visitor-invitations/
accounts_student_security_visitor-invitations_list


POST
/accounts/student/security/visitor-invitations/
accounts_student_security_visitor-invitations_create


PUT
/accounts/student/security/visitor-invitations/
accounts_student_security_visitor-invitations_update


GET
/accounts/student/security/visitor-invitations/{invitation_id}/
accounts_student_security_visitor-invitations_read


POST
/accounts/student/security/visitor-invitations/{invitation_id}/
accounts_student_security_visitor-invitations_create


PUT
/accounts/student/security/visitor-invitations/{invitation_id}/
accounts_student_security_visitor-invitations_update


GET
/accounts/student/support/tickets/
accounts_student_support_tickets_list


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
List Users
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
Verify Email Address
accounts_verify-email_create


Admin


GET
/admin/platform/hostels/moderation/
Get Hostel Moderation Queue
admin_platform_hostels_moderation_list


GET
/admin/platform/users/
Get User Management List
admin_platform_users_list


GET
/admin/super/activity-feed/
Get System Activity Feed
admin_super_activity-feed_list


GET
/admin/super/dashboard/stats/
Get Admin Dashboard Statistics
admin_super_dashboard_stats_list


GET
/admin/super/hostels/moderation/
Get Hostel Moderation Queue
admin_super_hostels_moderation_list


POST
/admin/super/hostels/moderation/{moderation_id}/approve/
Process Hostel Moderation
admin_super_hostels_moderation_approve_create


POST
/admin/super/hostels/moderation/{moderation_id}/reject/
Process Hostel Moderation
admin_super_hostels_moderation_reject_create


GET
/admin/super/hostels/pending/
Get Hostel Moderation Queue
admin_super_hostels_pending_list


GET
/admin/super/payments/disputes/
Get Payment Disputes List
admin_super_payments_disputes_list


GET
/admin/super/payments/disputes/stats/
Get Payment Dispute Statistics
admin_super_payments_disputes_stats_list


POST
/admin/super/payments/disputes/{dispute_id}/resolve/
Resolve Payment Dispute
admin_super_payments_disputes_resolve_create


PATCH
/admin/super/payments/disputes/{dispute_id}/resolve/
Update Payment Dispute Status
admin_super_payments_disputes_resolve_partial_update


POST
/admin/super/payments/disputes/{dispute_id}/status/
Resolve Payment Dispute
admin_super_payments_disputes_status_create


PATCH
/admin/super/payments/disputes/{dispute_id}/status/
Update Payment Dispute Status
admin_super_payments_disputes_status_partial_update


GET
/admin/super/subscriptions/
Get Subscription List
admin_super_subscriptions_list


GET
/admin/super/subscriptions/stats/
Get Subscription Statistics
admin_super_subscriptions_stats_list


GET
/admin/super/users/
Get User Management List
admin_super_users_list


GET
/admin/super/users/caretakers/
Get User Management List
admin_super_users_caretakers_list


GET
/admin/super/users/landlords/
Get User Management List
admin_super_users_landlords_list


GET
/admin/super/users/students/
Get User Management List
admin_super_users_students_list


GET
/admin/super/users/suspended/
Get User Management List
admin_super_users_suspended_list

admin


GET
/admin/platform/landlord-verifications/
admin_platform_landlord-verifications_list


POST
/admin/platform/landlord-verifications/
admin_platform_landlord-verifications_create


GET
/admin/platform/platform/stats/
admin_platform_platform_stats_list


GET
/admin/platform/system/health/
admin_platform_system_health_list


GET
/admin/platform/users/stats/
admin_platform_users_stats_list


GET
/admin/super/landlord-verifications/
admin_super_landlord-verifications_list


POST
/admin/super/landlord-verifications/
admin_super_landlord-verifications_create


GET
/admin/super/platform/stats/
admin_super_platform_stats_list


GET
/admin/super/system/health/
admin_super_system_health_list

analytics


GET
/analytics/landlord/breakdown/{category}/
analytics_landlord_breakdown_read


GET
/analytics/landlord/dashboard/
analytics_landlord_dashboard_list


GET
/analytics/landlord/landlord/customers/
analytics_landlord_landlord_customers_list


GET
/analytics/landlord/landlord/financial-reports/
analytics_landlord_landlord_financial-reports_list


GET
/analytics/landlord/landlord/growth/
analytics_landlord_landlord_growth_list


GET
/analytics/landlord/landlord/occupancy/
analytics_landlord_landlord_occupancy_list


GET
/analytics/landlord/landlord/performance/
analytics_landlord_landlord_performance_list


GET
/analytics/landlord/landlord/predictive/
analytics_landlord_landlord_predictive_list


GET
/analytics/landlord/landlord/revenue/
analytics_landlord_landlord_revenue_list

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
Create Hostel Listing
hostels_create_create


GET
/hostels/room-search/
Search Rooms
hostels_room-search_list


GET
/hostels/rooms/
hostels_rooms_list


GET
/hostels/rooms/{room_id}/
hostels_rooms_read


GET
/hostels/search/
Search Hostels
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
Create Room
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

landlord


GET
/landlord/dashboard/activity-feed/
Get Activity Feed
landlord_dashboard_activity-feed_list


GET
/landlord/dashboard/overview/
Get Landlord Dashboard Overview
landlord_dashboard_overview_list


GET
/landlord/payments/analytics/
Get Payment Analytics
landlord_payments_analytics_list


GET
/landlord/payments/reports/
List Payment Reports
landlord_payments_reports_list


POST
/landlord/payments/reports/
Generate Payment Report
landlord_payments_reports_create


GET
/landlord/payments/reports/generate/
List Payment Reports
landlord_payments_reports_generate_list


POST
/landlord/payments/reports/generate/
Generate Payment Report
landlord_payments_reports_generate_create


GET
/landlord/payments/transactions/recent/
Get Recent Transactions
landlord_payments_transactions_recent_list

Notifications


GET
/notifications/
Get User Notifications
notifications_list


PUT
/notifications/mark-all-read/
Mark All Notifications as Read
notifications_mark-all-read_update


GET
/notifications/preferences/
Notification Preferences Management
notifications_preferences_list


PUT
/notifications/{notification_id}/read/
Mark Notification as Read
notifications_read_update

Tech Support


GET
/notifications/admin/stats/
Get Notification Statistics
notifications_admin_stats_list


GET
/notifications/admin/templates/email/
Get Email Templates
notifications_admin_templates_email_list


GET
/notifications/admin/templates/sms/
Get SMS Templates
notifications_admin_templates_sms_list

notifications


PUT
/notifications/preferences/
Update Notification Preferences
notifications_preferences_update

payments


GET
/payments/analytics/revenue/
payments_analytics_revenue_list


POST
/payments/initialize/
Initialize Payment
payments_initialize_create


GET
/payments/late-fees/{booking_id}/
payments_late-fees_read


POST
/payments/late-fees/{late_fee_id}/pay/
payments_late-fees_pay_create


POST
/payments/mpesa/config/
payments_mpesa_config_create


GET
/payments/payment-methods/
Get Saved Payment Methods
payments_payment-methods_list


POST
/payments/payment-methods/
Add Payment Method
payments_payment-methods_create


DELETE
/payments/payment-methods/{method_id}/
payments_payment-methods_delete


POST
/payments/payment-methods/{method_id}/default/
payments_payment-methods_default_create


GET
/payments/payouts/landlord/
Get Landlord Payouts
payments_payouts_landlord_list


GET
/payments/receipts/{transaction_id}/
Get Payment Receipt
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
Create Refund Request
payments_refunds_create


GET
/payments/refunds/list/
Get Refund Requests
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
Get All Platform Transactions
payments_transactions_admin_list


GET
/payments/transactions/landlord/
Get Landlord Transactions
payments_transactions_landlord_list


GET
/payments/transactions/student/
Get Student Transactions
payments_transactions_student_list


GET
/payments/transactions/student/{transaction_id}/
Get Transaction Details
payments_transactions_student_read


POST
/payments/webhook/paystack/
payments_webhook_paystack_create

Payments


GET
/payments/mpesa/config/
Manage Landlord M-Pesa Configuration
payments_mpesa_config_list


POST
/payments/mpesa/initialize/
Initialize M-Pesa Payment
payments_mpesa_initialize_create


GET
/payments/mpesa/status/
Check M-Pesa Payment Status
payments_mpesa_status_list

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

students


GET
/students/reviews/pending/
students_reviews_pending_list


GET
/students/roommate-requests/
students_roommate-requests_list


POST
/students/roommate-requests/
students_roommate-requests_create


DELETE
/students/roommate-requests/
students_roommate-requests_delete


GET
/students/roommate-requests/{request_id}/
students_roommate-requests_read


POST
/students/roommate-requests/{request_id}/
students_roommate-requests_create


DELETE
/students/roommate-requests/{request_id}/
students_roommate-requests_delete


GET
/students/visitor-invitations/
students_visitor-invitations_list


POST
/students/visitor-invitations/
students_visitor-invitations_create


DELETE
/students/visitor-invitations/
students_visitor-invitations_delete


GET
/students/visitor-invitations/{invitation_id}/
students_visitor-invitations_read


POST
/students/visitor-invitations/{invitation_id}/
students_visitor-invitations_create


DELETE
/students/visitor-invitations/{invitation_id}/
students_visitor-invitations_delete

support


GET
/support/analytics/errors/
support_analytics_errors_list


GET
/support/analytics/performance/
support_analytics_performance_list


GET
/support/analytics/usage/
support_analytics_usage_list


GET
/support/blog/
support_blog_list


POST
/support/blog/create/
support_blog_create_create


GET
/support/blog/{post_id}/
support_blog_read


DELETE
/support/blog/{post_id}/delete/
support_blog_delete_delete


POST
/support/blog/{post_id}/publish/
support_blog_publish_create


POST
/support/blog/{post_id}/unpublish/
support_blog_unpublish_create


PUT
/support/blog/{post_id}/update/
support_blog_update_update


GET
/support/caretakers/
List Caretakers
support_caretakers_list


POST
/support/caretakers/
Create Caretaker
support_caretakers_create


GET
/support/dashboard/
Get Tech Support Dashboard Data
support_dashboard_list


GET
/support/maintenance/
support_maintenance_list


POST
/support/maintenance/backup/
support_maintenance_backup_create


GET
/support/maintenance/schedule/
support_maintenance_schedule_list


GET
/support/payments/disputes/
support_payments_disputes_list


GET
/support/payments/refunds/
support_payments_refunds_list


GET
/support/system-health/
support_system-health_list


GET
/support/tech-support/
List Tech Support Users
support_tech-support_list


POST
/support/tech-support/
Create Tech Support User
support_tech-support_create


GET
/support/tickets/
List Support Tickets
support_tickets_list


POST
/support/tickets/
Create Support Ticket
support_tickets_create


GET
/support/tickets/admin/
List Support Tickets
support_tickets_admin_list


POST
/support/tickets/admin/
Create Support Ticket
support_tickets_admin_create


GET
/support/tickets/stats/
Get Support Ticket Statistics
support_tickets_stats_list


GET
/support/tickets/{ticket_id}/
Get Support Ticket Details
support_tickets_read


POST
/support/tickets/{ticket_id}/escalate/
Escalate Ticket to Super Admin
support_tickets_escalate_create


POST
/support/tickets/{ticket_id}/resolve/
Resolve Support Ticket
support_tickets_resolve_create


POST
/support/tickets/{ticket_id}/respond/
Respond to Support Ticket
support_tickets_respond_create


POST
/support/users/{user_id}/reset-password/
support_users_reset-password_create


GET
/support/users/{user_id}/support/
support_users_support_list

Tech Support Dashboard


GET
/support/hostels/
Get Hostels for Support
support_hostels_list


GET
/support/logs/
Get System Logs
support_logs_list


GET
/support/messages/
Get Support Messages
support_messages_list


POST
/support/messages/
Send Support Message
support_messages_create


GET
/support/stats/
Get Dashboard Statistics
support_stats_list


GET
/support/transactions/
Get Transactions for Support
support_transactions_list


GET
/support/users/
Get Users for Support
support_users_list