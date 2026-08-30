from django.urls import path
from . import views
from .onboarding_views import (
    OnboardingDraftView, OnboardingAdvanceView, 
    OnboardingFinalizeView, OnboardingStatusView
)

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='user_registration'),
    path('verify-email/', views.EmailVerificationView.as_view(), name='email_verification'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend_otp'),
    path('login/', views.UserLoginView.as_view(), name='user_login'),
    path('check-email/', views.CheckEmailView.as_view(), name='check_email'),
    path('check-password/', views.CheckPasswordView.as_view(), name='check_password'),
    path('set-password/', views.SetPasswordView.as_view(), name='set_password'),
    path('auth/google/', views.GoogleOAuthView.as_view(), name='google_oauth'),
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

    # Onboarding Endpoints
    path('onboarding/status/', OnboardingStatusView.as_view(), name='onboarding_status'),
    path('onboarding/draft/', OnboardingDraftView.as_view(), name='onboarding_draft'),
    path('onboarding/advance/', OnboardingAdvanceView.as_view(), name='onboarding_advance'),
    path('onboarding/finalize/', OnboardingFinalizeView.as_view(), name='onboarding_finalize'),

    # Caretaker management (Landlord)
    path('caretakers/<int:caretaker_id>/', views.CaretakerDetailView.as_view(), name='caretaker_detail'),

    # User management (Admin)
    path('users/', views.UserManagementView.as_view(), name='user_management'),
    path('users/<int:user_id>/deactivate/', views.UserDeactivateView.as_view(), name='user_deactivate'),
    path('users/<int:user_id>/reactivate/', views.UserReactivateView.as_view(), name='user_reactivate'),
    path('users/<int:user_id>/activity/', views.UserActivityLogView.as_view(), name='user_activity_log'),

    # Student dashboard

    # Landlord dashboard

    path('landlords/verification/', views.LandlordVerificationListView.as_view(), name='landlord_verification_list'),
    path('landlords/<int:landlord_id>/verify/<str:action>/', views.LandlordVerificationView.as_view(), name='landlord_verification'),

    # Chat endpoints
    path('chat/conversations/', views.ConversationListView.as_view(), name='conversation_list'),
    path('chat/conversations/<int:conversation_id>/messages/', views.ConversationMessagesView.as_view(), name='conversation_messages'),
    path('chat/send/', views.SendMessageView.as_view(), name='send_message'),
    path('messages/unread-count/', views.UnreadMessageCountView.as_view(), name='unread_message_count'),
    
    # Security endpoints

    # Student dashboard support endpoints
]