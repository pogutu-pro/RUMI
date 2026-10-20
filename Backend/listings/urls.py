from django.urls import path

from listings.views import EnquiryInboxView, ListingDetailView, ListingEnquiryView, ListingSearchView

urlpatterns = [
    path('', ListingSearchView.as_view(), name='listings'),
    path('enquiries/', EnquiryInboxView.as_view(), name='listing-enquiries'),
    path('<uuid:pk>/', ListingDetailView.as_view(), name='listing-detail'),
    path('<uuid:pk>/enquire/', ListingEnquiryView.as_view(), name='listing-enquire'),
]
