from django.urls import path
from . import views

urlpatterns = [
    # Student Reviews
    path('reviews/pending/', views.StudentPendingReviewsView.as_view(), name='student_pending_reviews'),
    
    # Student Visitor Invitations
    path('visitor-invitations/', views.StudentVisitorInvitationsView.as_view(), name='student_visitor_invitations'),
    path('visitor-invitations/<int:invitation_id>/', views.StudentVisitorInvitationsView.as_view(), name='student_visitor_invitation_detail'),
    
    # Student Roommate Requests
    path('roommate-requests/', views.StudentRoommateRequestsView.as_view(), name='student_roommate_requests'),
    path('roommate-requests/<int:request_id>/', views.StudentRoommateRequestsView.as_view(), name='student_roommate_request_detail'),
]