import uuid
import requests
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Page, TeamMember, ContactInquiry, FAQ, BlogPost, Newsletter, Testimonial, Statistics


class LandingPageView(APIView):
    """Get landing page data"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return landing page data"""
        # Cache statistics for 1 hour to reduce database queries (optimization for high traffic)
        cache_key_stats = 'landing_page_stats'
        stats_data = cache.get(cache_key_stats)
        if stats_data is None:
            statistics = Statistics.objects.filter(is_active=True).order_by('display_order')
            stats_data = [
                {
                    'label': stat.stat_label,
                    'value': stat.stat_value,
                    'icon': stat.stat_icon
                }
                for stat in statistics
            ]
            cache.set(cache_key_stats, stats_data, timeout=3600)  # 1 hour

        # Cache featured testimonials for 30 minutes (optimization for frequently accessed data)
        cache_key_testimonials = 'landing_page_testimonials'
        testimonials_data = cache.get(cache_key_testimonials)
        if testimonials_data is None:
            testimonials = Testimonial.objects.filter(
                is_published=True,
                is_featured=True
            ).order_by('display_order')[:3]

            testimonials_data = [
                {
                    'author_name': t.author_name,
                    'author_role': t.author_role,
                    'author_university': t.author_university,
                    'author_photo': t.author_photo,
                    'testimonial_text': t.testimonial_text,
                    'rating': t.rating
                }
                for t in testimonials
            ]
            cache.set(cache_key_testimonials, testimonials_data, timeout=1800)  # 30 minutes

        # Mock featured hostels (would come from hostels app)
        featured_hostels = [
            {
                'hostel_id': 1,
                'name': 'University Heights',
                'university': 'University of Nairobi',
                'min_price': 5000.00,
                'available_rooms': 15,
                'rating': 4.5,
                'image': 'https://example.com/hostel1.jpg'
            }
        ]

        # Platform features
        features = [
            {
                'title': 'Verified Hostels',
                'description': 'All hostels verified for quality and safety',
                'icon': 'shield-check'
            },
            {
                'title': 'Secure Payments',
                'description': 'Pay securely via M-Pesa with platform protection',
                'icon': 'lock'
            },
            {
                'title': 'Roommate Matching',
                'description': 'Find compatible roommates based on lifestyle',
                'icon': 'users'
            },
            {
                'title': 'Student Marketplace',
                'description': 'Buy and sell items within your university',
                'icon': 'shopping-bag'
            }
        ]

        return Response({
            'hero': {
                'title': 'Find Your Perfect Student Accommodation',
                'subtitle': 'Browse verified hostels near your university. Book rooms with confidence.',
                'cta_buttons': [
                    {'text': 'Find Rooms', 'link': '/hostels'},
                    {'text': 'List Your Hostel', 'link': '/landlord/register'}
                ]
            },
            'statistics': stats_data,
            'featured_hostels': featured_hostels,
            'testimonials': testimonials_data,
            'features': features
        }, status=status.HTTP_200_OK)


class AboutUsView(APIView):
    """Get about us page content"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return about us content"""
        return Response({
            'mission': {
                'title': 'Our Mission',
                'content': 'To revolutionize student accommodation in Kenya by providing a transparent, secure, and user-friendly platform that connects students with verified landlords and fosters a supportive community.'
            },
            'vision': {
                'title': 'Our Vision',
                'content': 'To become the leading student accommodation platform in Africa, empowering students to find safe, affordable housing while helping landlords efficiently manage their properties.'
            },
            'story': {
                'title': 'Our Story',
                'content': 'Founded in 2025 by university students who experienced the challenges of finding safe accommodation in some of Kenyan universities, RUMI was born from the need for a transparent and trustworthy platform.',
                'milestones': [
                    {'year': '2025', 'event': 'Platform launched at various University across Kenya'},
                    {'year': '2025', 'event': 'Expanded to 5 universities across Kenya'},
                    {'year': '2025', 'event': 'Launched integrated student marketplace'}
                ]
            },
            'values': [
                {
                    'title': 'Transparency',
                    'description': 'Clear pricing, verified information, no hidden fees'
                },
                {
                    'title': 'Safety',
                    'description': 'Verified hostels, secure payments, trusted landlords'
                },
                {
                    'title': 'Community',
                    'description': 'Building connections between students and landlords'
                }
            ]
        }, status=status.HTTP_200_OK)


class TeamView(APIView):
    """Get team members"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return team members"""
        leadership = TeamMember.objects.filter(
            is_active=True,
            position__icontains='chief'
        ).order_by('display_order')

        team = TeamMember.objects.filter(
            is_active=True
        ).exclude(
            position__icontains='chief'
        ).order_by('display_order')

        leadership_data = [
            {
                'member_id': member.id,
                'full_name': member.full_name,
                'position': member.position,
                'bio': member.bio,
                'profile_picture': member.profile_picture,
                'email': member.email,
                'linkedin_url': member.linkedin_url,
                'twitter_url': member.twitter_url
            }
            for member in leadership
        ]

        team_data = [
            {
                'member_id': member.id,
                'full_name': member.full_name,
                'position': member.position,
                'bio': member.bio,
                'profile_picture': member.profile_picture,
                'email': member.email,
                'linkedin_url': member.linkedin_url,
                'twitter_url': member.twitter_url
            }
            for member in team
        ]

        return Response({
            'leadership': leadership_data,
            'team': team_data
        }, status=status.HTTP_200_OK)


class ContactInquiryView(APIView):
    """Handle contact form submissions"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Submit contact inquiry"""
        data = request.data.copy()
        data['ip_address'] = self.get_client_ip(request)
        data['user_agent'] = request.META.get('HTTP_USER_AGENT')

        # Validate required fields
        required_fields = ['full_name', 'email', 'subject', 'inquiry_type', 'message']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate email format
        if '@' not in data['email']:
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check rate limit
        if self.check_rate_limit(data['ip_address']):
            return Response({
                'error': 'Too many contact submissions. Please try again in 1 hour.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Validate inquiry type
        valid_types = ['general', 'student_support', 'landlord_support', 'technical', 'partnership', 'media', 'other']
        if data['inquiry_type'] not in valid_types:
            return Response({
                'error': 'Invalid inquiry type'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create inquiry
        inquiry = ContactInquiry.objects.create(
            full_name=data['full_name'],
            email=data['email'],
            phone_number=data.get('phone_number'),
            subject=data['subject'],
            inquiry_type=data['inquiry_type'],
            message=data['message'],
            ip_address=data['ip_address'],
            user_agent=data['user_agent'],
            status='pending'
        )

        # Generate reference number
        reference_number = f"INQ-{timezone.now().year}-{inquiry.id:06d}"

        # Send confirmation email (async)
        from .tasks import send_inquiry_confirmation_email
        send_inquiry_confirmation_email.delay(
            inquiry_id=inquiry.id,
            reference_number=reference_number
        )

        # Notify admin team (async)
        from .tasks import notify_admin_new_inquiry
        notify_admin_new_inquiry.delay(inquiry_id=inquiry.id)

        return Response({
            'inquiry_id': inquiry.id,
            'message': 'Thank you for contacting us! We\'ll respond within 24 hours.',
            'reference_number': reference_number,
            'expected_response_time': '24 hours'
        }, status=status.HTTP_201_CREATED)

    def get_client_ip(self, request):
        """Get client IP"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def check_rate_limit(self, ip_address):
        """Check contact form rate limit (3 per hour)"""
        cache_key = f"contact_rate:{ip_address}"
        submissions = cache.get(cache_key, 0)

        if submissions >= 3:
            return True  # Rate limited

        cache.incr(cache_key)
        cache.expire(cache_key, 3600)  # 1 hour
        return False


class ContactInfoView(APIView):
    """Get platform contact information"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return contact information"""
        return Response({
            'email': 'hello@rumi.co.ke',
            'support_email': 'support@rumi.co.ke',
            'phone': '+254 700 000 000',
            'whatsapp': '+254 700 000 000',
            'address': {
                'street': '123 University Way',
                'city': 'Nairobi',
                'country': 'Kenya',
                'postal_code': '00100'
            },
            'social_media': {
                'facebook': 'https://facebook.com/rumikenya',
                'twitter': 'https://twitter.com/rumikenya',
                'instagram': 'https://instagram.com/rumikenya',
                'linkedin': 'https://linkedin.com/company/rumikenya'
            },
            'office_hours': {
                'weekdays': '8:00 AM - 6:00 PM EAT',
                'saturday': '9:00 AM - 2:00 PM EAT',
                'sunday': 'Closed'
            }
        }, status=status.HTTP_200_OK)


class FAQView(APIView):
    """Get frequently asked questions"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return FAQs grouped by category"""
        category_filter = request.query_params.get('category')

        # Cache FAQs for 1 hour to reduce database load (optimization for frequently accessed content)
        cache_key = f'faqs_{category_filter or "all"}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        # Define category labels
        category_labels = {
            'getting_started': 'Getting Started',
            'students': 'For Students',
            'landlords': 'For Landlords',
            'payments': 'Payments & Billing',
            'safety': 'Safety & Security',
            'technical': 'Technical Support',
            'marketplace': 'Marketplace'
        }

        # Get FAQs - using efficient ordering with database indexes
        faqs = FAQ.objects.filter(is_published=True).order_by('category', 'display_order')

        if category_filter:
            faqs = faqs.filter(category=category_filter)

        # Group by category - O(n) time complexity with single pass
        categories = {}
        for faq in faqs:
            category = faq.category
            if category not in categories:
                categories[category] = {
                    'category': category,
                    'label': category_labels.get(category, category.replace('_', ' ').title()),
                    'faqs': []
                }

            categories[category]['faqs'].append({
                'faq_id': faq.id,
                'question': faq.question,
                'answer': faq.answer,
                'helpful_count': faq.helpful_count,
                'not_helpful_count': faq.not_helpful_count
            })

        response_data = {
            'categories': list(categories.values())
        }

        # Cache the response
        cache.set(cache_key, response_data, timeout=3600)  # 1 hour

        return Response(response_data, status=status.HTTP_200_OK)


class FAQHelpfulView(APIView):
    """Mark FAQ as helpful or not helpful"""

    permission_classes = [permissions.AllowAny]

    def post(self, request, faq_id):
        """Update FAQ helpfulness rating"""
        try:
            faq = FAQ.objects.get(id=faq_id, is_published=True)
        except FAQ.DoesNotExist:
            return Response({
                'error': 'FAQ not found'
            }, status=status.HTTP_404_NOT_FOUND)

        helpful = request.data.get('helpful')

        if helpful is None:
            return Response({
                'error': 'helpful field is required (true/false)'
            }, status=status.HTTP_400_BAD_REQUEST)

        if helpful:
            faq.helpful_count += 1
        else:
            faq.not_helpful_count += 1

        faq.save(update_fields=['helpful_count', 'not_helpful_count'])

        return Response({
            'faq_id': faq.id,
            'helpful_count': faq.helpful_count,
            'not_helpful_count': faq.not_helpful_count,
            'message': 'Thank you for your feedback!'
        }, status=status.HTTP_200_OK)


class BlogListView(APIView):
    """List blog posts"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return blog posts with filtering and pagination"""
        queryset = BlogPost.objects.filter(is_published=True).select_related('author')

        # Apply filters
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        tag = request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__icontains=tag)

        featured = request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)

        # Pagination
        limit = int(request.query_params.get('limit', 10))
        offset = int(request.query_params.get('offset', 0))

        total_posts = queryset.count()
        posts = queryset.order_by('-published_at')[offset:offset + limit]

        posts_data = []
        for post in posts:
            posts_data.append({
                'post_id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'featured_image': post.featured_image,
                'author': {
                    'name': post.author.get_full_name(),
                    'profile_picture': post.author.profile_picture
                },
                'category': post.category,
                'tags': post.tags or [],
                'read_time_minutes': post.read_time_minutes,
                'published_at': post.published_at,
                'view_count': post.view_count
            })

        return Response({
            'total_posts': total_posts,
            'posts': posts_data
        }, status=status.HTTP_200_OK)


class BlogDetailView(APIView):
    """Get single blog post"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        """Return blog post details"""
        try:
            post = BlogPost.objects.select_related('author').get(
                slug=slug,
                is_published=True
            )
        except BlogPost.DoesNotExist:
            return Response({
                'error': 'Blog post not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Increment view count (with deduplication)
        session_id = request.session.session_key or 'anonymous'
        cache_key = f"blog_view:{post.id}:{session_id}"

        if not cache.get(cache_key):
            post.view_count += 1
            post.save(update_fields=['view_count'])
            cache.set(cache_key, True, timeout=86400)  # 24 hours

        # Get related posts (same category, exclude current)
        related_posts = BlogPost.objects.filter(
            category=post.category,
            is_published=True
        ).exclude(id=post.id).order_by('-published_at')[:3]

        related_data = [
            {
                'post_id': rp.id,
                'title': rp.title,
                'slug': rp.slug,
                'excerpt': rp.excerpt,
                'published_at': rp.published_at
            }
            for rp in related_posts
        ]

        return Response({
            'post_id': post.id,
            'title': post.title,
            'slug': post.slug,
            'content': post.content,
            'featured_image': post.featured_image,
            'author': {
                'name': post.author.get_full_name(),
                'bio': getattr(post.author, 'bio', ''),
                'profile_picture': post.author.profile_picture
            },
            'category': post.category,
            'tags': post.tags or [],
            'read_time_minutes': post.read_time_minutes,
            'published_at': post.published_at,
            'view_count': post.view_count,
            'related_posts': related_data
        }, status=status.HTTP_200_OK)


class NewsletterSubscribeView(APIView):
    """Handle newsletter subscription"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Subscribe to newsletter"""
        email = request.data.get('email')
        full_name = request.data.get('full_name')
        subscription_type = request.data.get('subscription_type', 'general')

        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate email format
        if '@' not in email:
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if already subscribed
        existing = Newsletter.objects.filter(email=email).first()
        if existing and existing.status == 'active':
            return Response({
                'message': 'Email already subscribed',
                'already_subscribed': True
            }, status=status.HTTP_200_OK)

        # Generate verification token
        verification_token = uuid.uuid4()

        # Create or update subscription
        subscription, created = Newsletter.objects.update_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'subscription_type': subscription_type,
                'verification_token': verification_token,
                'is_verified': False,
                'status': 'active',
                'ip_address': self.get_client_ip(request)
            }
        )

        # Send verification email (async)
        from .tasks import send_newsletter_verification_email
        send_newsletter_verification_email.delay(
            subscription_id=subscription.id,
            verification_token=str(verification_token)
        )

        return Response({
            'message': 'Thank you for subscribing! Please check your email to confirm.',
            'verification_required': True
        }, status=status.HTTP_201_CREATED)

    def get_client_ip(self, request):
        """Get client IP"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class NewsletterVerifyView(APIView):
    """Verify newsletter subscription"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Verify subscription via token"""
        token = request.query_params.get('token')

        if not token:
            return Response({
                'error': 'Verification token is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            subscription = Newsletter.objects.get(
                verification_token=uuid.UUID(token),
                is_verified=False
            )
        except (Newsletter.DoesNotExist, ValueError):
            return Response({
                'error': 'Invalid or expired verification token'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verify subscription
        subscription.is_verified = True
        subscription.verified_at = timezone.now()
        subscription.save()

        return Response({
            'message': 'Email verified successfully! You\'ll start receiving our newsletter.',
            'verified': True
        }, status=status.HTTP_200_OK)


class NewsletterUnsubscribeView(APIView):
    """Handle newsletter unsubscription"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Unsubscribe from newsletter"""
        email = request.data.get('email')

        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            subscription = Newsletter.objects.get(email=email)
            subscription.status = 'unsubscribed'
            subscription.unsubscribed_at = timezone.now()
            subscription.save()

            return Response({
                'message': 'You have been unsubscribed successfully.',
                'unsubscribed': True
            }, status=status.HTTP_200_OK)

        except Newsletter.DoesNotExist:
            # Return success even if email not found (security)
            return Response({
                'message': 'You have been unsubscribed successfully.',
                'unsubscribed': True
            }, status=status.HTTP_200_OK)


class StatisticsUpdateView(APIView):
    """Update platform statistics (Admin only)"""

    def put(self, request, stat_key):
        """Update statistic value"""
        try:
            stat = Statistics.objects.get(stat_key=stat_key)
        except Statistics.DoesNotExist:
            return Response({
                'error': 'Statistic not found'
            }, status=status.HTTP_404_NOT_FOUND)

        stat_value = request.data.get('stat_value')
        if stat_value is None:
            return Response({
                'error': 'stat_value is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            stat_value = int(stat_value)
        except ValueError:
            return Response({
                'error': 'stat_value must be an integer'
            }, status=status.HTTP_400_BAD_REQUEST)

        stat.stat_value = stat_value
        stat.save()

        return Response({
            'stat_key': stat.stat_key,
            'stat_value': stat.stat_value,
            'stat_label': stat.stat_label,
            'updated_at': stat.updated_at
        }, status=status.HTTP_200_OK)


class PrometheusMetricsProxyView(APIView):
    """Proxy Prometheus metrics to avoid CORS issues"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Return Prometheus metrics"""
        try:
            # Fetch metrics from Prometheus
            response = requests.get('http://localhost:8001/metrics', timeout=5)
            response.raise_for_status()
            
            # Return the metrics text directly
            return Response(
                response.text,
                content_type='text/plain',
                status=status.HTTP_200_OK
            )
        except requests.RequestException as e:
            return Response({
                'error': f'Failed to fetch metrics: {str(e)}'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                'error': f'Unexpected error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
