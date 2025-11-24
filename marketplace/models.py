from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Category(models.Model):
    """Product categories for marketplace organization"""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='subcategories'
    )
    image_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_category'
        verbose_name_plural = 'categories'
        indexes = [
            models.Index(fields=['slug'], name='idx_category_slug'),
            models.Index(fields=['parent'], name='idx_category_parent'),
            models.Index(fields=['is_active'], name='idx_category_active'),
        ]
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Marketplace products/items for sale"""

    CONDITION_CHOICES = [
        ('new', 'New'),
        ('like_new', 'Like New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('sold', 'Sold'),
        ('deleted', 'Deleted'),
    ]

    seller = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products'
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    location = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_negotiable = models.BooleanField(default=True)
    contact_method = models.CharField(max_length=50, default='in_app')  # in_app, phone, email
    view_count = models.IntegerField(default=0)
    favorite_count = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    featured_until = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_product'
        indexes = [
            models.Index(fields=['seller'], name='idx_product_seller'),
            models.Index(fields=['category'], name='idx_product_category'),
            models.Index(fields=['status'], name='idx_product_status'),
            models.Index(fields=['price'], name='idx_product_price'),
            models.Index(fields=['created_at'], name='idx_product_created'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ProductImage(models.Model):
    """Product photos and images"""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField()
    caption = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_productimage'
        indexes = [
            models.Index(fields=['product'], name='idx_product_image_product'),
            models.Index(fields=['is_primary'], name='idx_product_image_primary'),
        ]
        ordering = ['sort_order', 'uploaded_at']

    def __str__(self):
        return f"Image for {self.product.title}"


class Order(models.Model):
    """Purchase orders for marketplace transactions"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    buyer = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='orders'
    )
    order_number = models.CharField(max_length=100, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    shipping_address = models.TextField()
    buyer_notes = models.TextField(blank=True, null=True)
    seller_notes = models.TextField(blank=True, null=True)
    ordered_at = models.DateTimeField(default=timezone.now)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'marketplace_order'
        indexes = [
            models.Index(fields=['buyer'], name='idx_order_buyer'),
            models.Index(fields=['status'], name='idx_order_status'),
            models.Index(fields=['payment_status'], name='idx_order_payment_status'),
            models.Index(fields=['ordered_at'], name='idx_order_ordered_at'),
        ]
        ordering = ['-ordered_at']

    def __str__(self):
        return f"Order {self.order_number}"


class OrderItem(models.Model):
    """Individual items within an order"""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    seller = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='sold_items'
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')

    class Meta:
        db_table = 'marketplace_orderitem'
        indexes = [
            models.Index(fields=['order'], name='idx_order_item_order'),
            models.Index(fields=['product'], name='idx_order_item_product'),
            models.Index(fields=['seller'], name='idx_order_item_seller'),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product.title}"


class Cart(models.Model):
    """Shopping cart for marketplace"""

    student = models.OneToOneField(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_cart'

    def __str__(self):
        return f"Cart for {self.student.user.get_full_name()}"


class CartItem(models.Model):
    """Items in shopping cart"""

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_cartitem'
        unique_together = ['cart', 'product']
        indexes = [
            models.Index(fields=['cart'], name='idx_cart_item_cart'),
            models.Index(fields=['product'], name='idx_cart_item_product'),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product.title} in cart"


class Wishlist(models.Model):
    """Student wishlists for marketplace products"""

    student = models.OneToOneField(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='wishlist'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_wishlist'

    def __str__(self):
        return f"Wishlist for {self.student.user.get_full_name()}"


class WishlistItem(models.Model):
    """Items in wishlist"""

    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_wishlistitem'
        unique_together = ['wishlist', 'product']
        indexes = [
            models.Index(fields=['wishlist'], name='idx_wishlist_item_wishlist'),
            models.Index(fields=['product'], name='idx_wishlist_item_product'),
        ]

    def __str__(self):
        return f"{self.product.title} in wishlist"


class Review(models.Model):
    """Product reviews and ratings"""

    reviewer = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    order_item = models.OneToOneField(
        OrderItem,
        on_delete=models.CASCADE,
        related_name='review'
    )
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=255, blank=True, null=True)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=True)
    helpful_votes = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_review'
        indexes = [
            models.Index(fields=['product'], name='idx_review_product'),
            models.Index(fields=['reviewer'], name='idx_review_reviewer'),
            models.Index(fields=['rating'], name='idx_review_rating'),
        ]
        unique_together = ['reviewer', 'product']

    def __str__(self):
        return f"Review for {self.product.title} by {self.reviewer.user.get_full_name()}"


class ProductView(models.Model):
    """Track product views for analytics"""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='views'
    )
    viewer = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='product_views'
    )
    session_id = models.CharField(max_length=255, blank=True, null=True)
    viewed_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'marketplace_productview'
        indexes = [
            models.Index(fields=['product'], name='idx_view_product'),
            models.Index(fields=['viewer'], name='idx_view_viewer'),
            models.Index(fields=['viewed_at'], name='idx_view_viewed_at'),
        ]

    def __str__(self):
        return f"View of {self.product.title}"


class SellerApplication(models.Model):
    """Seller registration applications awaiting admin approval"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    applicant = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='seller_applications'
    )
    business_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=100)
    description = models.TextField()
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)
    business_address = models.TextField()
    id_document = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_applications'
    )
    approval_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'marketplace_sellerapplication'
        indexes = [
            models.Index(fields=['applicant'], name='idx_seller_app_applicant'),
            models.Index(fields=['status'], name='idx_seller_app_status'),
            models.Index(fields=['submitted_at'], name='idx_seller_app_submitted'),
        ]

    def __str__(self):
        return f"Seller application: {self.business_name}"


class SellerProfile(models.Model):
    """Approved seller profiles with business information"""

    seller = models.OneToOneField(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='seller_profile'
    )
    application = models.OneToOneField(
        SellerApplication,
        on_delete=models.CASCADE,
        related_name='seller_profile'
    )
    business_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=100)
    description = models.TextField()
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)
    business_address = models.TextField()
    store_banner = models.URLField(blank=True, null=True)
    store_logo = models.URLField(blank=True, null=True)
    social_links = models.JSONField(blank=True, null=True)
    return_policy = models.TextField(blank=True, null=True)
    shipping_policy = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=True)
    total_products = models.IntegerField(default=0)
    total_sales = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    approval_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_sellerprofile'
        indexes = [
            models.Index(fields=['seller'], name='idx_seller_profile_seller'),
            models.Index(fields=['is_verified'], name='idx_seller_profile_verified'),
            models.Index(fields=['average_rating'], name='idx_seller_profile_rating'),
        ]

    def __str__(self):
        return f"Seller: {self.business_name}"


class ProductFavorite(models.Model):
    """Student product favorites/wishlist"""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_productfavorite'
        indexes = [
            models.Index(fields=['product'], name='idx_favorite_product'),
            models.Index(fields=['student'], name='idx_favorite_student'),
        ]
        unique_together = ['product', 'student']

    def __str__(self):
        return f"{self.student.user.get_full_name()} favorited {self.product.title}"


class ContactReveal(models.Model):
    """Track when buyers reveal seller contact information"""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='contact_reveals'
    )
    buyer = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='contact_reveals'
    )
    seller = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='contact_revealed'
    )
    revealed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_contactreveal'
        indexes = [
            models.Index(fields=['product'], name='idx_contact_reveal_product'),
            models.Index(fields=['buyer'], name='idx_contact_reveal_buyer'),
            models.Index(fields=['seller'], name='idx_contact_reveal_seller'),
        ]
        unique_together = ['product', 'buyer']

    def __str__(self):
        return f"Contact revealed for {self.product.title}"


class ChatConversation(models.Model):
    """Chat conversations between buyers and sellers about products"""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    buyer = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='buyer_conversations'
    )
    seller = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='seller_conversations'
    )
    last_message_at = models.DateTimeField(blank=True, null=True)
    buyer_unread_count = models.IntegerField(default=0)
    seller_unread_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_chatconversation'
        indexes = [
            models.Index(fields=['product'], name='idx_chat_conversation_product'),
            models.Index(fields=['buyer'], name='idx_chat_conversation_buyer'),
            models.Index(fields=['seller'], name='idx_chat_conversation_seller'),
        ]
        unique_together = ['product', 'buyer']

    def __str__(self):
        return f"Chat about {self.product.title}"


class ChatMessage(models.Model):
    """Individual chat messages in conversations"""

    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='sent_chat_messages'
    )
    message_text = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_chatmessage'
        indexes = [
            models.Index(fields=['conversation'], name='idx_chat_message_conversation'),
            models.Index(fields=['sender'], name='idx_chat_message_sender'),
            models.Index(fields=['created_at'], name='idx_chat_message_created'),
        ]
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.user.get_full_name()}"


class ProductShare(models.Model):
    """Track social media shares for analytics"""

    PLATFORM_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter'),
        ('instagram', 'Instagram'),
        ('telegram', 'Telegram'),
        ('email', 'Email'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    sharer = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='product_shares'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    shared_at = models.DateTimeField(default=timezone.now)
    referral_clicks = models.IntegerField(default=0)

    class Meta:
        db_table = 'marketplace_productshare'
        indexes = [
            models.Index(fields=['product'], name='idx_product_share_product'),
            models.Index(fields=['platform'], name='idx_product_share_platform'),
            models.Index(fields=['shared_at'], name='idx_product_share_date'),
        ]

    def __str__(self):
        return f"Share of {self.product.title} on {self.platform}"


class ProductReport(models.Model):
    """User reports of inappropriate product listings"""

    REASON_CHOICES = [
        ('inappropriate_content', 'Inappropriate Content'),
        ('scam', 'Scam/Suspicious'),
        ('duplicate', 'Duplicate Listing'),
        ('sold_elsewhere', 'Already Sold'),
        ('prohibited_item', 'Prohibited Item'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    reporter = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='product_reports'
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_reports'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    action_taken = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_productreport'
        indexes = [
            models.Index(fields=['product'], name='idx_product_report_product'),
            models.Index(fields=['status'], name='idx_product_report_status'),
        ]

    def __str__(self):
        return f"Report for {self.product.title}: {self.reason}"


class Message(models.Model):
    """In-app messaging between buyers and sellers"""

    sender = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='received_messages'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    sent_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'marketplace_message'
        indexes = [
            models.Index(fields=['sender'], name='idx_message_sender'),
            models.Index(fields=['recipient'], name='idx_message_recipient'),
            models.Index(fields=['product'], name='idx_message_product'),
            models.Index(fields=['is_read'], name='idx_message_read'),
        ]
        ordering = ['-sent_at']

    def __str__(self):
        return f"Message about {self.product.title}"