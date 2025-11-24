from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Review, Wishlist, WishlistItem, Product


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""

    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_title', 'product_price', 'product_image',
            'quantity', 'total_price', 'added_at'
        ]
        read_only_fields = ['id', 'added_at']

    def get_product_image(self, obj):
        primary_image = obj.product.images.filter(is_primary=True).first()
        return primary_image.image_url if primary_image else None

    def get_total_price(self, obj):
        return float(obj.product.price * obj.quantity)


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""

    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'student', 'items', 'total_items', 'total_amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_total_amount(self, obj):
        return sum(float(item.product.price * item.quantity) for item in obj.items.all())


class CartItemCreateSerializer(serializers.Serializer):
    """Serializer for adding items to cart"""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, status='active')
            if not product.seller.seller_profile.is_verified:
                raise serializers.ValidationError("Product from unverified seller")
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available")


class CartItemUpdateSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity"""

    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""

    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_title', 'product_image', 'seller',
            'quantity', 'unit_price', 'total_price', 'status'
        ]
        read_only_fields = ['id']

    def get_product_image(self, obj):
        primary_image = obj.product.images.filter(is_primary=True).first()
        return primary_image.image_url if primary_image else None


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""

    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.user.get_full_name', read_only=True)
    seller_names = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'buyer_name', 'items', 'seller_names',
            'total_amount', 'shipping_fee', 'tax_amount', 'discount_amount',
            'final_amount', 'status', 'payment_status', 'shipping_address',
            'buyer_notes', 'seller_notes', 'ordered_at', 'confirmed_at',
            'shipped_at', 'delivered_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'buyer', 'total_amount', 'final_amount',
            'ordered_at', 'confirmed_at', 'shipped_at', 'delivered_at'
        ]

    def get_seller_names(self, obj):
        sellers = set()
        for item in obj.items.all():
            sellers.add(item.seller.user.get_full_name())
        return list(sellers)


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status"""

    status = serializers.ChoiceField(choices=[
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ])


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""

    reviewer_name = serializers.CharField(source='reviewer.user.get_full_name', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'reviewer', 'reviewer_name', 'product', 'product_title',
            'order_item', 'rating', 'title', 'comment', 'is_verified_purchase',
            'helpful_votes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reviewer', 'order_item', 'is_verified_purchase',
            'helpful_votes', 'created_at', 'updated_at'
        ]


class ReviewCreateSerializer(serializers.Serializer):
    """Serializer for creating reviews"""

    order_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    comment = serializers.CharField()

    def validate_order_id(self, value):
        try:
            order = Order.objects.get(id=value, buyer=self.context['request'].user.student_profile)
            if order.status != 'delivered':
                raise serializers.ValidationError("Can only review delivered orders")
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")


class WishlistItemSerializer(serializers.ModelSerializer):
    """Serializer for wishlist items"""

    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()
    product_condition = serializers.CharField(source='product.condition', read_only=True)

    class Meta:
        model = WishlistItem
        fields = [
            'id', 'product', 'product_title', 'product_price', 'product_image',
            'product_condition', 'added_at'
        ]
        read_only_fields = ['id', 'added_at']

    def get_product_image(self, obj):
        primary_image = obj.product.images.filter(is_primary=True).first()
        return primary_image.image_url if primary_image else None


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for wishlist"""

    items = WishlistItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ['id', 'student', 'items', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return obj.items.count()


class WishlistItemCreateSerializer(serializers.Serializer):
    """Serializer for adding items to wishlist"""

    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, status='active')
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available")