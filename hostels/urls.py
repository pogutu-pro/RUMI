from django.urls import path
from . import views

urlpatterns = [
    # Hostel management
    path('', views.HostelsListView.as_view(), name='hostels_list'),
    path('create/', views.HostelCreateView.as_view(), name='hostel_create'),
    path('<int:hostel_id>/', views.HostelDetailView.as_view(), name='hostel_detail'),

    # Room management
    path('rooms/', views.RoomsListView.as_view(), name='rooms_list'),
    path('rooms/<int:room_id>/', views.RoomDetailView.as_view(), name='room_detail'),
    path('<int:hostel_id>/rooms/', views.RoomCreateView.as_view(), name='room_create'),

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
]