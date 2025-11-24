from django.urls import path
from . import views

urlpatterns = [
    # Seller applications
    path('seller/apply/', views.SellerApplicationSubmitView.as_view(), name='seller_application_submit'),
    path('seller/application/<int:application_id>/', views.SellerApplicationStatusView.as_view(), name='seller_application_status'),

    # Admin seller management
    path('admin/seller-applications/', views.AdminSellerApplicationsListView.as_view(), name='admin_seller_applications'),
    path('admin/seller-applications/<int:application_id>/review/', views.AdminSellerApplicationReviewView.as_view(), name='admin_seller_application_review'),
    path('admin/seller-applications/<int:application_id>/approve/', views.AdminSellerApplicationApproveView.as_view(), name='admin_seller_application_approve'),
    path('admin/seller-applications/<int:application_id>/reject/', views.AdminSellerApplicationRejectView.as_view(), name='admin_seller_application_reject'),
    path('admin/sellers/', views.AdminSellersListView.as_view(), name='admin_sellers_list'),

    # Products
    path('products/', views.ProductListView.as_view(), name='product_list'),
    path('products/create/', views.ProductCreateView.as_view(), name='product_create'),
    path('products/<int:product_id>/contact/', views.ContactRevealView.as_view(), name='contact_reveal'),

    # Cart management
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.CartAddItemView.as_view(), name='cart_add_item'),
    path('cart/update/<int:item_id>/', views.CartUpdateItemView.as_view(), name='cart_update_item'),
    path('cart/remove/<int:item_id>/', views.CartRemoveItemView.as_view(), name='cart_remove_item'),

    # Order management
    path('orders/', views.OrderListView.as_view(), name='order_list'),
    path('orders/<int:order_id>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('orders/<int:order_id>/status/', views.OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('orders/<int:order_id>/ship/', views.OrderShipView.as_view(), name='order_ship'),
    path('orders/<int:order_id>/deliver/', views.OrderDeliverView.as_view(), name='order_deliver'),

    # Review system
    path('products/<int:product_id>/reviews/', views.ProductReviewsView.as_view(), name='product_reviews'),
    path('orders/<int:order_id>/review/', views.OrderReviewCreateView.as_view(), name='order_review_create'),

    # Wishlist management
    path('wishlist/', views.WishlistView.as_view(), name='wishlist'),
    path('wishlist/add/', views.WishlistAddItemView.as_view(), name='wishlist_add_item'),
    path('wishlist/remove/<int:item_id>/', views.WishlistRemoveItemView.as_view(), name='wishlist_remove_item'),
]