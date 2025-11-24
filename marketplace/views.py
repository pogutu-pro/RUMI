import uuid
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction, models
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import (
    SellerApplication, SellerProfile, Category, Product,
    ProductImage, ProductView, ProductFavorite, ContactReveal,
    ChatConversation, ChatMessage, ProductShare, ProductReport,
    Cart, CartItem, Order, OrderItem, Review, Wishlist, WishlistItem
)
from .serializers import (
    CartSerializer, CartItemCreateSerializer, CartItemUpdateSerializer,
    OrderSerializer, OrderStatusUpdateSerializer, OrderItemSerializer,
    ReviewSerializer, ReviewCreateSerializer,
    WishlistSerializer, WishlistItemCreateSerializer, WishlistItemSerializer
)


class SellerApplicationSubmitView(APIView):
    """Submit seller application for approval"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Submit seller application"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can apply to become sellers'
            }, status=status.HTTP_403_FORBIDDEN)

        student_id = request.user.student_profile.id

        # Check for existing active application
        existing_app = SellerApplication.objects.filter(
            applicant_id=student_id,
            status__in=['pending', 'under_review', 'approved']
        ).exists()

        if existing_app:
            return Response({
                'error': 'You already have an active application'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if already approved seller
        if SellerProfile.objects.filter(seller_id=student_id).exists():
            return Response({
                'error': 'You are already an approved seller'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate required fields
        required_fields = [
            'business_name', 'business_type', 'description',
            'contact_email', 'contact_phone', 'business_address'
        ]
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate business type
        valid_types = ['retail', 'wholesale', 'services', 'manufacturing', 'other']
        if request.data['business_type'] not in valid_types:
            return Response({
                'error': 'Invalid business type'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                application = SellerApplication.objects.create(
                    applicant_id=student_id,
                    business_name=request.data['business_name'],
                    business_type=request.data['business_type'],
                    description=request.data['description'],
                    contact_email=request.data['contact_email'],
                    contact_phone=request.data['contact_phone'],
                    business_address=request.data['business_address'],
                    id_document=request.data.get('id_document'),
                    status='pending'
                )

                reference_number = f"SEL-{timezone.now().year}-{application.id:06d}"

                # Send confirmation notification
                from .tasks import send_application_confirmation
                send_application_confirmation.delay(
                    application_id=application.id,
                    reference_number=reference_number
                )

                # Notify admin team
                from .tasks import notify_admin_new_application
                notify_admin_new_application.delay(application_id=application.id)

                return Response({
                    'application_id': application.id,
                    'reference_number': reference_number,
                    'status': 'pending',
                    'estimated_review_time': '3-5 business days',
                    'message': 'Your application has been submitted successfully. We\'ll send updates to your email.',
                    'next_steps': [
                        'Application under review by our team',
                        'Document verification process',
                        'Final approval decision'
                    ]
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to submit application',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SellerApplicationStatusView(APIView):
    """Check seller application status"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, application_id):
        """Get application status"""
        try:
            application = SellerApplication.objects.get(
                id=application_id,
                applicant__user=request.user
            )
        except SellerApplication.DoesNotExist:
            return Response({
                'error': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Build status history (simplified)
        status_history = [
            {
                'status': application.status,
                'timestamp': application.submitted_at,
                'notes': 'Application submitted successfully'
            }
        ]

        if application.reviewed_at:
            status_history.append({
                'status': 'reviewed',
                'timestamp': application.reviewed_at,
                'notes': application.approval_notes or application.rejection_reason or 'Application reviewed'
            })

        return Response({
            'application_id': application.id,
            'business_name': application.business_name,
            'status': application.status,
            'submitted_at': application.submitted_at,
            'status_history': status_history,
            'estimated_completion': (
                application.submitted_at + timezone.timedelta(days=5)
            ).isoformat() if application.status in ['pending', 'under_review'] else None
        }, status=status.HTTP_200_OK)


class AdminSellerApplicationsListView(APIView):
    """List seller applications for admin review"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List applications"""
        # Check admin permissions
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        # Filter by status
        status_filter = request.query_params.get('status')
        queryset = SellerApplication.objects.select_related('applicant__user')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_applications = queryset.count()
        applications = queryset[offset:offset + limit]

        pending_review = SellerApplication.objects.filter(status='pending').count()

        applications_data = []
        for app in applications:
            applications_data.append({
                'application_id': app.id,
                'applicant': {
                    'student_id': app.applicant.id,
                    'name': app.applicant.user.get_full_name(),
                    'email': app.applicant.user.email,
                    'university': app.applicant.university
                },
                'business_details': {
                    'business_name': app.business_name,
                    'business_type': app.business_type,
                    'contact_email': app.contact_email
                },
                'status': app.status,
                'submitted_at': app.submitted_at,
                'documents': {
                    'id_document': app.id_document
                } if app.id_document else {}
            })

        return Response({
            'total_applications': total_applications,
            'pending_review': pending_review,
            'applications': applications_data
        }, status=status.HTTP_200_OK)


class AdminSellerApplicationReviewView(APIView):
    """Start review of seller application"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, application_id):
        """Start review"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            application = SellerApplication.objects.get(id=application_id)
        except SellerApplication.DoesNotExist:
            return Response({
                'error': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if application.status != 'pending':
            return Response({
                'error': 'Application is not in pending status'
            }, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'under_review'
        application.save()

        return Response({
            'application_id': application.id,
            'status': 'under_review',
            'message': 'Application moved to under review'
        }, status=status.HTTP_200_OK)


class AdminSellerApplicationApproveView(APIView):
    """Approve seller application"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, application_id):
        """Approve application"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            application = SellerApplication.objects.get(id=application_id)
        except SellerApplication.DoesNotExist:
            return Response({
                'error': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if application.status != 'under_review':
            return Response({
                'error': 'Application must be under review to approve'
            }, status=status.HTTP_400_BAD_REQUEST)

        approval_notes = request.data.get('approval_notes', '')

        try:
            with transaction.atomic():
                # Update application
                application.status = 'approved'
                application.reviewed_at = timezone.now()
                application.reviewed_by = request.user
                application.approval_notes = approval_notes
                application.save()

                # Create seller profile
                seller_profile = SellerProfile.objects.create(
                    seller=application.applicant,
                    application=application,
                    business_name=application.business_name,
                    business_type=application.business_type,
                    description=application.description,
                    contact_email=application.contact_email,
                    contact_phone=application.contact_phone,
                    business_address=application.business_address,
                    is_verified=True
                )

                # Send approval notifications
                from .tasks import send_seller_approval_notifications
                send_seller_approval_notifications.delay(
                    seller_id=application.applicant.id,
                    business_name=application.business_name
                )

                return Response({
                    'application_id': application.id,
                    'status': 'approved',
                    'seller_profile_id': seller_profile.id,
                    'approved_at': application.reviewed_at,
                    'message': 'Seller application approved successfully',
                    'welcome_message': 'Congratulations! You can now start listing products on our marketplace.'
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to approve application',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminSellerApplicationRejectView(APIView):
    """Reject seller application"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, application_id):
        """Reject application"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            application = SellerApplication.objects.get(id=application_id)
        except SellerApplication.DoesNotExist:
            return Response({
                'error': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        rejection_reason = request.data.get('rejection_reason')
        if not rejection_reason:
            return Response({
                'error': 'rejection_reason is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'rejected'
        application.reviewed_at = timezone.now()
        application.reviewed_by = request.user
        application.rejection_reason = rejection_reason
        application.save()

        # Send rejection notification
        from .tasks import send_seller_rejection_notification
        send_seller_rejection_notification.delay(
            seller_id=application.applicant.id,
            business_name=application.business_name,
            rejection_reason=rejection_reason
        )

        return Response({
            'application_id': application.id,
            'status': 'rejected',
            'rejected_at': application.reviewed_at,
            'rejection_reason': rejection_reason,
            'can_reapply': True,
            'reapply_after_days': 30
        }, status=status.HTTP_200_OK)


class AdminSellersListView(APIView):
    """List approved sellers"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List sellers"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        sellers = SellerProfile.objects.select_related('seller__user').filter(is_verified=True)

        total_sellers = sellers.count()
        active_sellers = sellers.filter(seller__user__is_active=True).count()

        sellers_data = []
        for seller in sellers:
            sellers_data.append({
                'seller_id': seller.id,
                'student_profile': {
                    'name': seller.seller.user.get_full_name(),
                    'email': seller.seller.user.email
                },
                'business_name': seller.business_name,
                'business_type': seller.business_type,
                'total_products': seller.total_products,
                'total_sales': seller.total_sales,
                'average_rating': float(seller.average_rating) if seller.average_rating else None,
                'approval_date': seller.approval_date,
                'is_active': seller.seller.user.is_active
            })

        return Response({
            'total_sellers': total_sellers,
            'active_sellers': active_sellers,
            'sellers': sellers_data
        }, status=status.HTTP_200_OK)


class ProductCreateView(APIView):
    """Create new product listing"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Create product"""
        # Validate seller
        try:
            seller_profile = SellerProfile.objects.get(
                seller__user=request.user,
                is_verified=True
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'error': 'You must be an approved seller to list products'
            }, status=status.HTTP_403_FORBIDDEN)

        # Validate required fields
        required_fields = ['title', 'description', 'category_slug', 'price', 'condition']
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate category
        try:
            category = Category.objects.get(slug=request.data['category_slug'], is_active=True)
        except Category.DoesNotExist:
            return Response({
                'error': 'Invalid category'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate condition
        valid_conditions = ['new', 'like_new', 'good', 'fair', 'poor']
        if request.data['condition'] not in valid_conditions:
            return Response({
                'error': 'Invalid condition'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check product limit
        active_products = Product.objects.filter(
            seller=seller_profile.seller,
            is_active=True
        ).count()

        if active_products >= 50:
            return Response({
                'error': 'Maximum 50 active products allowed'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product = Product.objects.create(
                    seller=seller_profile.seller,
                    seller_profile=seller_profile,
                    category=category,
                    title=request.data['title'],
                    description=request.data['description'],
                    price=request.data['price'],
                    condition=request.data['condition'],
                    university=seller_profile.seller.university,
                    location=request.data.get('location'),
                    is_negotiable=request.data.get('is_negotiable', True),
                    status='available'
                )

                # Handle images
                images = request.data.get('images', [])
                if images:
                    for i, image_url in enumerate(images[:5]):  # Max 5 images
                        ProductImage.objects.create(
                            product=product,
                            image_url=image_url,
                            display_order=i,
                            is_primary=(i == 0)
                        )

                # Update seller stats
                seller_profile.total_products += 1
                seller_profile.save()

                # Send notification
                from .tasks import send_product_listing_notification
                send_product_listing_notification.delay(
                    seller_id=seller_profile.seller.id,
                    product_id=product.id,
                    product_title=product.title
                )

                return Response({
                    'product_id': product.id,
                    'title': product.title,
                    'status': 'available',
                    'listing_fee': 0.00,
                    'message': 'Product listed successfully',
                    'next_steps': [
                        'Share your listing on social media',
                        'Monitor inquiries from buyers',
                        'Update product status when sold'
                    ]
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to create product listing',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductListView(APIView):
    """Browse available products"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """List products with filters"""
        queryset = Product.objects.select_related(
            'seller_profile', 'category', 'seller__user'
        ).prefetch_related('productimage_set').filter(status='active')

        # Apply filters
        category_slug = request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(university__icontains=university)

        min_price = request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=Decimal(min_price))
            except Exception:
                pass

        max_price = request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(price__lte=Decimal(max_price))
            except Exception:
                pass

        condition = request.query_params.get('condition')
        if condition:
            queryset = queryset.filter(condition=condition)

        seller_verified = request.query_params.get('seller_verified', 'true').lower() == 'true'
        if seller_verified:
            queryset = queryset.filter(seller__seller_profile__is_verified=True)

        # Sorting
        sort_by = request.query_params.get('sort', 'newest')
        if sort_by == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort_by == 'popular':
            queryset = queryset.order_by('-view_count')
        else:  # newest
            queryset = queryset.order_by('-created_at')

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_products = queryset.count()
        products = queryset[offset:offset + limit]

        products_data = []
        for product in products:
            # Track view if user is logged in
            if request.user.is_authenticated:
                ProductView.objects.get_or_create(
                    product=product,
                    viewer=request.user.student_profile,
                    defaults={'viewed_at': timezone.now()}
                )

            # Get primary image from prefetched set (optimization: O(1) lookup instead of N+1 queries)
            primary_image = next(
                (img for img in product.productimage_set.all() if img.is_primary),
                None
            )

            products_data.append({
                'product_id': product.id,
                'title': product.title,
                'price': float(product.price),
                'condition': product.condition,
                'category': product.category.name,
                'seller': {
                    'business_name': product.seller_profile.business_name,
                    'rating': float(product.seller_profile.average_rating) if product.seller_profile.average_rating else None,
                    'is_verified': product.seller_profile.is_verified
                },
                'images': [{
                    'url': primary_image.image_url if primary_image else None,
                    'is_primary': True
                }] if primary_image else [],
                'location': product.location,
                'posted_at': product.created_at,
                'view_count': product.view_count,
                'is_negotiable': product.is_negotiable
            })

        # Get filter options
        categories = Category.objects.filter(is_active=True).values_list('slug', flat=True)
        universities = Product.objects.values_list('university', flat=True).distinct()
        price_range = Product.objects.filter(is_active=True).aggregate(
            min_price=models.Min('price'),
            max_price=models.Max('price')
        )

        return Response({
            'total_products': total_products,
            'products': products_data,
            'filters': {
                'categories': list(categories),
                'universities': list(universities),
                'price_range': {
                    'min': float(price_range['min_price']) if price_range['min_price'] else 0,
                    'max': float(price_range['max_price']) if price_range['max_price'] else 0
                }
            }
        }, status=status.HTTP_200_OK)


class ContactRevealView(APIView):
    """Reveal seller contact information"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        """Reveal contact"""
        try:
            product = Product.objects.select_related('seller_profile').get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Validate buyer is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can reveal seller contacts'
            }, status=status.HTTP_403_FORBIDDEN)

        buyer_id = request.user.student_profile.id

        # Check if buyer is not the seller
        if product.seller.id == buyer_id:
            return Response({
                'error': 'You cannot reveal contact for your own product'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if already revealed
        if ContactReveal.objects.filter(product=product, buyer_id=buyer_id).exists():
            return Response({
                'error': 'Contact already revealed for this product'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Create contact reveal record
                reveal = ContactReveal.objects.create(
                    product=product,
                    buyer_id=buyer_id,
                    seller=product.seller,
                    revealed_at=timezone.now()
                )

                # Update product stats
                product.contact_reveal_count += 1
                product.save()

                return Response({
                    'seller_contact': {
                        'business_name': product.seller_profile.business_name,
                        'contact_email': product.seller_profile.contact_email,
                        'contact_phone': product.seller_profile.contact_phone,
                        'business_address': product.seller_profile.business_address
                    },
                    'reveal_id': reveal.id,
                    'message': 'Contact information revealed. Use this information responsibly.',
                    'tips': [
                        'Meet in public places',
                        'Verify product condition before payment',
                        'Report any suspicious activity'
                    ]
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to reveal contact',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Cart Management Views

class CartView(APIView):
    """Get user's shopping cart"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user's cart"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            cart = Cart.objects.prefetch_related('items__product__images').get(
                student=request.user.student_profile
            )
            serializer = CartSerializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Cart.DoesNotExist:
            # Return empty cart structure
            return Response({
                'id': None,
                'student': request.user.student_profile.id,
                'items': [],
                'total_items': 0,
                'total_amount': 0.00,
                'created_at': None,
                'updated_at': None
            }, status=status.HTTP_200_OK)


class CartAddItemView(APIView):
    """Add item to cart"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Add product to cart"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = CartItemCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            product = Product.objects.get(id=data['product_id'])
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get or create cart
        cart, created = Cart.objects.get_or_create(
            student=request.user.student_profile
        )

        # Check if item already in cart
        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': data['quantity']}
        )

        if not item_created:
            # Update quantity if item already exists
            cart_item.quantity += data['quantity']
            cart_item.save()

        cart_serializer = CartSerializer(cart)
        return Response({
            'cart': cart_serializer.data,
            'message': 'Item added to cart successfully'
        }, status=status.HTTP_201_CREATED)


class CartUpdateItemView(APIView):
    """Update cart item quantity"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, item_id):
        """Update cart item quantity"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = CartItemUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__student=request.user.student_profile
            )
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Cart item not found'
            }, status=status.HTTP_404_NOT_FOUND)

        cart_item.quantity = data['quantity']
        cart_item.save()

        cart_serializer = CartSerializer(cart_item.cart)
        return Response({
            'cart': cart_serializer.data,
            'message': 'Cart item updated successfully'
        }, status=status.HTTP_200_OK)


class CartRemoveItemView(APIView):
    """Remove item from cart"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        """Remove item from cart"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__student=request.user.student_profile
            )
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Cart item not found'
            }, status=status.HTTP_404_NOT_FOUND)

        cart = cart_item.cart
        cart_item.delete()

        cart_serializer = CartSerializer(cart)
        return Response({
            'cart': cart_serializer.data,
            'message': 'Item removed from cart successfully'
        }, status=status.HTTP_200_OK)


# Order Management Views

class OrderListView(APIView):
    """List user's orders"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user's orders"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.prefetch_related(
            'items__product__images', 'items__seller__user'
        ).filter(buyer=request.user.student_profile).order_by('-ordered_at')

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_orders = orders.count()
        orders_page = orders[offset:offset + limit]

        serializer = OrderSerializer(orders_page, many=True)
        return Response({
            'total_orders': total_orders,
            'orders': serializer.data
        }, status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """Get order details"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        """Get order details"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            order = Order.objects.prefetch_related(
                'items__product__images', 'items__seller__user'
            ).get(id=order_id, buyer=request.user.student_profile)
        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderStatusUpdateView(APIView):
    """Update order status (for sellers)"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, order_id):
        """Update order status"""
        # Validate user is student (sellers are students with seller profiles)
        if request.user.role != 'student':
            return Response({
                'error': 'Only sellers can update order status'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            # Check if user is seller for any item in this order
            order = Order.objects.prefetch_related('items__seller').get(id=order_id)
            user_items = order.items.filter(seller=request.user.student_profile)

            if not user_items.exists():
                return Response({
                    'error': 'You can only update orders containing your products'
                }, status=status.HTTP_403_FORBIDDEN)

        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update order status
        order.status = data['status']
        if data['status'] == 'confirmed' and not order.confirmed_at:
            order.confirmed_at = timezone.now()
        elif data['status'] == 'cancelled' and not order.cancelled_at:
            order.cancelled_at = timezone.now()
        order.save()

        order_serializer = OrderSerializer(order)
        return Response({
            'order': order_serializer.data,
            'message': f'Order status updated to {data["status"]}'
        }, status=status.HTTP_200_OK)


class OrderShipView(APIView):
    """Mark order as shipped"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        """Mark order as shipped"""
        # Validate user is student (sellers are students with seller profiles)
        if request.user.role != 'student':
            return Response({
                'error': 'Only sellers can ship orders'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            # Check if user is seller for any item in this order
            order = Order.objects.prefetch_related('items__seller').get(id=order_id)
            user_items = order.items.filter(seller=request.user.student_profile)

            if not user_items.exists():
                return Response({
                    'error': 'You can only ship orders containing your products'
                }, status=status.HTTP_403_FORBIDDEN)

            if order.status != 'confirmed':
                return Response({
                    'error': 'Order must be confirmed before shipping'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        order.status = 'shipped'
        order.shipped_at = timezone.now()
        order.save()

        order_serializer = OrderSerializer(order)
        return Response({
            'order': order_serializer.data,
            'message': 'Order marked as shipped successfully'
        }, status=status.HTTP_200_OK)


class OrderDeliverView(APIView):
    """Mark order as delivered"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        """Mark order as delivered"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            # Check if user is buyer of this order
            order = Order.objects.get(id=order_id, buyer=request.user.student_profile)

            if order.status != 'shipped':
                return Response({
                    'error': 'Order must be shipped before marking as delivered'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        order.status = 'delivered'
        order.delivered_at = timezone.now()
        order.save()

        order_serializer = OrderSerializer(order)
        return Response({
            'order': order_serializer.data,
            'message': 'Order marked as delivered successfully'
        }, status=status.HTTP_200_OK)


# Review System Views

class ProductReviewsView(APIView):
    """Get product reviews"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        """Get reviews for a product"""
        try:
            product = Product.objects.get(id=product_id, status='active')
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects.select_related('reviewer__user').filter(
            product=product
        ).order_by('-created_at')

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_reviews = reviews.count()
        reviews_page = reviews[offset:offset + limit]

        serializer = ReviewSerializer(reviews_page, many=True)

        # Calculate average rating
        avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0

        return Response({
            'total_reviews': total_reviews,
            'average_rating': float(avg_rating),
            'reviews': serializer.data
        }, status=status.HTTP_200_OK)


class OrderReviewCreateView(APIView):
    """Submit review for order"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        """Create review for order"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            order = Order.objects.prefetch_related('items__product').get(
                id=order_id, buyer=request.user.student_profile
            )
        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if order is delivered
        if order.status != 'delivered':
            return Response({
                'error': 'Can only review delivered orders'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get the product from order items (assuming single product for simplicity)
        # In a real scenario, you might need to specify which product to review
        order_item = order.items.first()
        if not order_item:
            return Response({
                'error': 'No items found in order'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if review already exists
        if Review.objects.filter(order_item=order_item).exists():
            return Response({
                'error': 'Review already exists for this order item'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                review = Review.objects.create(
                    reviewer=request.user.student_profile,
                    product=order_item.product,
                    order_item=order_item,
                    rating=data['rating'],
                    title=data.get('title', ''),
                    comment=data['comment'],
                    is_verified_purchase=True
                )

                return Response({
                    'review_id': review.id,
                    'message': 'Review submitted successfully'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to submit review',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Wishlist Management Views

class WishlistView(APIView):
    """Get user's wishlist"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user's wishlist"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            wishlist = Wishlist.objects.prefetch_related('items__product__images').get(
                student=request.user.student_profile
            )
            serializer = WishlistSerializer(wishlist)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Wishlist.DoesNotExist:
            # Return empty wishlist structure
            return Response({
                'id': None,
                'student': request.user.student_profile.id,
                'items': [],
                'total_items': 0,
                'created_at': None,
                'updated_at': None
            }, status=status.HTTP_200_OK)


class WishlistAddItemView(APIView):
    """Add product to wishlist"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Add product to wishlist"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = WishlistItemCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            product = Product.objects.get(id=data['product_id'])
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get or create wishlist
        wishlist, created = Wishlist.objects.get_or_create(
            student=request.user.student_profile
        )

        # Check if item already in wishlist
        if WishlistItem.objects.filter(wishlist=wishlist, product=product).exists():
            return Response({
                'error': 'Product already in wishlist'
            }, status=status.HTTP_400_BAD_REQUEST)

        wishlist_item = WishlistItem.objects.create(
            wishlist=wishlist,
            product=product
        )

        wishlist_serializer = WishlistSerializer(wishlist)
        return Response({
            'wishlist': wishlist_serializer.data,
            'message': 'Product added to wishlist successfully'
        }, status=status.HTTP_201_CREATED)


class WishlistRemoveItemView(APIView):
    """Remove item from wishlist"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        """Remove item from wishlist"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can access marketplace features'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            wishlist_item = WishlistItem.objects.get(
                id=item_id,
                wishlist__student=request.user.student_profile
            )
        except WishlistItem.DoesNotExist:
            return Response({
                'error': 'Wishlist item not found'
            }, status=status.HTTP_404_NOT_FOUND)

        wishlist = wishlist_item.wishlist
        wishlist_item.delete()

        wishlist_serializer = WishlistSerializer(wishlist)
        return Response({
            'wishlist': wishlist_serializer.data,
            'message': 'Item removed from wishlist successfully'
        }, status=status.HTTP_200_OK)
