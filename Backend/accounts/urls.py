from django.urls import path, include
from . import views

urlpatterns = [
    # Subscription management
    path('subscriptions/', include('accounts.subscription_urls')),
    
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='user_registration'),
    path('verify-email/', views.EmailVerificationView.as_view(), name='email_verification'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend_otp'),
    path('login/', views.UserLoginView.as_view(), name='user_login'),
    path('refresh-token/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.UserLogoutView.as_view(), name='user_logout'),

    # Password reset
    path('password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/verify/', views.PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/completion/', views.ProfileCompletionView.as_view(), name='profile_completion'),
    path('profile/picture/', views.ProfilePictureUploadView.as_view(), name='profile_picture_upload'),

    # Caretaker management (Landlord)
    path('caretakers/', views.CaretakerListCreateView.as_view(), name='caretaker_list_create'),
    path('caretakers/<int:caretaker_id>/', views.CaretakerDetailView.as_view(), name='caretaker_detail'),

    # User management (Admin)
    path('users/', views.UserManagementView.as_view(), name='user_management'),
    path('users/<int:user_id>/deactivate/', views.UserDeactivateView.as_view(), name='user_deactivate'),
    path('users/<int:user_id>/reactivate/', views.UserReactivateView.as_view(), name='user_reactivate'),
    path('users/<int:user_id>/activity/', views.UserActivityLogView.as_view(), name='user_activity_log'),

    # Landlord verification (Admin)
    # Student dashboard
    path('dashboard/', views.StudentDashboardView.as_view(), name='student_dashboard'),

    # Landlord dashboard
    path('landlord/dashboard/', views.LandlordDashboardView.as_view(), name='landlord_dashboard'),

    path('landlords/verification/', views.LandlordVerificationListView.as_view(), name='landlord_verification_list'),
    path('landlords/<int:landlord_id>/verify/<str:action>/', views.LandlordVerificationView.as_view(), name='landlord_verification'),

    # Chat endpoints
    path('chat/conversations/', views.ConversationListView.as_view(), name='conversation_list'),
    path('chat/conversations/<int:conversation_id>/messages/', views.ConversationMessagesView.as_view(), name='conversation_messages'),
    path('chat/send/', views.SendMessageView.as_view(), name='send_message'),
    path('messages/unread-count/', views.UnreadMessageCountView.as_view(), name='unread_message_count'),
    
    # Security endpoints
    path('student/security/late-entries/', views.StudentSecurityLateEntriesView.as_view(), name='student_security_late_entries'),
    path('student/security/visitor-invitations/', views.StudentSecurityVisitorInvitationsView.as_view(), name='student_security_visitor_invitations'),
    path('student/security/visitor-invitations/<int:invitation_id>/', views.StudentSecurityVisitorInvitationsView.as_view(), name='student_security_visitor_invitation_action'),

    # Student dashboard support endpoints
    path('student/support/tickets/', views.StudentSupportTicketsView.as_view(), name='student_support_tickets'),
    path('student/activity/feed/', views.StudentActivityFeedView.as_view(), name='student_activity_feed'),
]