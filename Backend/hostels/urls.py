from django.urls import path
from . import views
from .endpoints.bed_views import BedUpdateView

urlpatterns = [
    # Hostel management
    path('', views.HostelViewSet.as_view({'get': 'list', 'post': 'create'}), name='hostels_list'),
    path('create/', views.HostelViewSet.as_view({'post': 'create'}), name='hostel_create'),
    path('<int:pk>/', views.HostelViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='hostel_detail'),
    path('<int:hostel_id>/related/', views.HostelRelatedView.as_view(), name='hostel_related'),

    # Room management
    path('rooms/', views.RoomViewSet.as_view({'get': 'list'}), name='rooms_list'),
    path('rooms/<int:pk>/', views.RoomViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='room_detail'),
    path('<int:hostel_id>/rooms/', views.RoomViewSet.as_view({'post': 'create'}), name='room_create'),

    # Bed management
    path('beds/<uuid:id>/', BedUpdateView.as_view(), name='bed_update'),

    # Booking management
    path('bookings/', views.BookingViewSet.as_view({'get': 'list', 'post': 'create'}), name='bookings_list'),
    path('bookings/<int:pk>/', views.BookingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='booking_detail'),

    # Inventory management
    path('<int:hostel_id>/inventory/', views.InventoryTemplateCreateView.as_view(), name='inventory_template_create'),
    path('<int:hostel_id>/inventory/template/', views.InventoryTemplateDetailView.as_view(), name='inventory_template_detail'),

    # Inventory check-in
    path('checkin/<int:booking_id>/start/', views.InventoryCheckInStartView.as_view(), name='inventory_checkin_start'),
    path('checkin/<int:checkin_id>/submit/', views.InventoryCheckInSubmitView.as_view(), name='inventory_checkin_submit'),
    path('checkin/<int:checkin_id>/verify/', views.InventoryCheckInVerifyView.as_view(), name='inventory_checkin_verify'),

    # Room search and booking
    path('search/', views.HostelSearchView.as_view(), name='hostel_search'),
    # Roommate matching
    path('<int:room_id>/roommates/', views.RoommateMatchingView.as_view(), name='roommate_matching'),
    path('room-search/', views.RoomSearchView.as_view(), name='room_search'),
    path('<int:room_id>/reserve/', views.RoomReserveView.as_view(), name='room_reserve'),
    path('<int:room_id>/book/', views.RoomBookView.as_view(), name='room_book'),
    path('<int:hostel_id>/toggle-favorite/', views.toggle_favorite_hostel, name='hostel_toggle_favorite'),
    path('favorites/', views.get_favorites, name='hostel_favorites'),
    path('<int:hostel_id>/join-waitlist/', views.join_waitlist, name='hostel_join_waitlist'),
]