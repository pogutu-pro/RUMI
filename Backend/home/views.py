import uuid
import requests
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Page, TeamMember, ContactInquiry, FAQ, BlogPost, Newsletter, Testimonial, Statistics
from rumi.cache_utils import api_cache



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
                'content': 'To become the leading student accommodation platform in kenya, empowering students to find safe, affordable housing while helping landlords efficiently manage their properties.'
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

        # Check rate limit (disabled for testing)
        # if self.check_rate_limit(data['ip_address']):
        #     return Response({
        #         'error': 'Too many contact submissions. Please try again in 1 hour.'
        #     }, status=status.HTTP_429_TOO_MANY_REQUESTS)

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
            'email': 'info@rumiarent.co.ke',
            'support_email': 'info@rumiarent.co.ke',
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


def _is_blog_staff_role(role):
    """Same three roles the support-ticket queue is scoped to (support/views.py
    _is_staff_role) — tech support owns blog content the same way it owns
    tickets, not a separate permission concept."""
    return role in ('tech_support', 'tech_support_admin', 'super_admin')


def _blog_post_admin_data(post):
    """Full representation, including draft-only fields the public
    BlogListView/BlogDetailView never expose (is_published, meta_*)."""
    return {
        'id': post.id,
        'title': post.title,
        'slug': post.slug,
        'excerpt': post.excerpt,
        'content': post.content,
        'featured_image': post.featured_image,
        'author': {
            'id': post.author_id,
            'name': post.author.get_full_name(),
        },
        'category': post.category,
        'tags': post.tags or [],
        'meta_title': post.meta_title,
        'meta_description': post.meta_description,
        'is_published': post.is_published,
        'is_featured': post.is_featured,
        'read_time_minutes': post.read_time_minutes,
        'view_count': post.view_count,
        'published_at': post.published_at,
        'created_at': post.created_at,
        'updated_at': post.updated_at,
    }


def _unique_blog_slug(title, exclude_pk=None):
    from django.utils.text import slugify
    base = slugify(title)[:190] or 'post'
    slug = base
    n = 2
    qs = BlogPost.objects.filter(slug=slug)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.exists():
        slug = f'{base}-{n}'
        n += 1
        qs = BlogPost.objects.filter(slug=slug)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
    return slug


def _invalidate_public_blog_cache(slug=None, old_slug=None):
    """
    APIResponseCacheMiddleware (rumi/middleware.py) caches every anonymous
    GET for up to 5 minutes, keyed on request.path alone (no query string,
    no awareness of the underlying data) — it has no way to know a blog
    post was just created/published/edited/deleted, so without this, a
    newly published post — or an edit, or an unpublish/delete — would
    silently keep serving the old cached response for up to 5 minutes.

    Reconstructs the exact same cache key the middleware computes
    (rumi.cache_utils.APIResponseCache.cache_api_response with
    endpoint=request.path, method='GET') and deletes it directly, rather
    than a pattern match — the middleware's keys are MD5 hashes with no
    human-readable substring to pattern-match against.
    """
    keys_to_clear = ['/api/v1/home/blog/']
    if slug:
        keys_to_clear.append(f'/api/v1/home/blog/{slug}/')
    if old_slug and old_slug != slug:
        keys_to_clear.append(f'/api/v1/home/blog/{old_slug}/')

    for path in keys_to_clear:
        cache_key = api_cache.cache_manager.get_cache_key('api', path, 'GET')
        api_cache.cache_manager.delete(cache_key)


class AdminBlogPostListCreateView(APIView):
    """Tech support's own blog queue — every post regardless of publish
    status, unlike the public BlogListView which only ever shows published
    ones."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from core.permissions.rumia import get_canonical_role
        role = get_canonical_role(request.user)
        if not _is_blog_staff_role(role):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        qs = BlogPost.objects.select_related('author').order_by('-created_at')

        is_published = request.query_params.get('is_published')
        if is_published is not None:
            qs = qs.filter(is_published=is_published.lower() == 'true')

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)

        return Response([_blog_post_admin_data(p) for p in qs[:200]], status=status.HTTP_200_OK)

    def post(self, request):
        from core.permissions.rumia import get_canonical_role
        role = get_canonical_role(request.user)
        if not _is_blog_staff_role(role):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        title = (request.data.get('title') or '').strip()
        content = (request.data.get('content') or '').strip()
        category = request.data.get('category')

        if not title:
            return Response({'detail': 'Title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not content:
            return Response({'detail': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if category not in dict(BlogPost.CATEGORY_CHOICES):
            return Response({'detail': 'Invalid category.'}, status=status.HTTP_400_BAD_REQUEST)

        tags = request.data.get('tags') or []
        if not isinstance(tags, list):
            return Response({'detail': 'tags must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        is_published = bool(request.data.get('is_published', False))

        post = BlogPost.objects.create(
            title=title,
            slug=_unique_blog_slug(title),
            excerpt=(request.data.get('excerpt') or '').strip() or None,
            content=content,
            featured_image=(request.data.get('featured_image') or '').strip() or None,
            author=request.user,
            category=category,
            tags=tags,
            meta_title=(request.data.get('meta_title') or '').strip() or None,
            meta_description=(request.data.get('meta_description') or '').strip() or None,
            is_published=is_published,
            is_featured=bool(request.data.get('is_featured', False)),
            read_time_minutes=request.data.get('read_time_minutes') or None,
            published_at=timezone.now() if is_published else None,
        )
        if is_published:
            _invalidate_public_blog_cache(slug=post.slug)
        return Response(_blog_post_admin_data(post), status=status.HTTP_201_CREATED)


class AdminBlogPostDetailView(APIView):
    """Edit/publish/delete a single post — draft or published."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_post_or_403(self, request, pk):
        from core.permissions.rumia import get_canonical_role
        role = get_canonical_role(request.user)
        if not _is_blog_staff_role(role):
            return None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            return BlogPost.objects.select_related('author').get(pk=pk), None
        except BlogPost.DoesNotExist:
            return None, Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        post, error = self._get_post_or_403(request, pk)
        if error:
            return error
        return Response(_blog_post_admin_data(post), status=status.HTTP_200_OK)

    def patch(self, request, pk):
        post, error = self._get_post_or_403(request, pk)
        if error:
            return error

        was_published = post.is_published
        old_slug = post.slug

        data = request.data
        if 'title' in data:
            title = (data.get('title') or '').strip()
            if not title:
                return Response({'detail': 'Title cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            if title != post.title:
                post.title = title
                post.slug = _unique_blog_slug(title, exclude_pk=post.pk)
        if 'content' in data:
            content = (data.get('content') or '').strip()
            if not content:
                return Response({'detail': 'Content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            post.content = content
        if 'excerpt' in data:
            post.excerpt = (data.get('excerpt') or '').strip() or None
        if 'featured_image' in data:
            post.featured_image = (data.get('featured_image') or '').strip() or None
        if 'category' in data:
            if data.get('category') not in dict(BlogPost.CATEGORY_CHOICES):
                return Response({'detail': 'Invalid category.'}, status=status.HTTP_400_BAD_REQUEST)
            post.category = data.get('category')
        if 'tags' in data:
            tags = data.get('tags') or []
            if not isinstance(tags, list):
                return Response({'detail': 'tags must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
            post.tags = tags
        if 'meta_title' in data:
            post.meta_title = (data.get('meta_title') or '').strip() or None
        if 'meta_description' in data:
            post.meta_description = (data.get('meta_description') or '').strip() or None
        if 'is_featured' in data:
            post.is_featured = bool(data.get('is_featured'))
        if 'read_time_minutes' in data:
            post.read_time_minutes = data.get('read_time_minutes') or None
        if 'is_published' in data:
            new_is_published = bool(data.get('is_published'))
            if new_is_published and not post.is_published:
                post.published_at = timezone.now()
            post.is_published = new_is_published

        post.save()

        # Only matters if the post was ever visible publicly — a pure draft
        # edit (never published, still not published) was never cached.
        if was_published or post.is_published:
            _invalidate_public_blog_cache(slug=post.slug, old_slug=old_slug)

        return Response(_blog_post_admin_data(post), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        post, error = self._get_post_or_403(request, pk)
        if error:
            return error
        was_published = post.is_published
        slug = post.slug
        post.delete()
        if was_published:
            _invalidate_public_blog_cache(slug=slug)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminBlogCoverUploadView(APIView):
    """Cover-image upload for a blog post — mirrors
    accounts.views.ProfilePictureUploadView's storage pattern (works with
    either local disk or S3, per USE_S3)."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        from core.permissions.rumia import get_canonical_role
        from django.core.files.storage import default_storage
        role = get_canonical_role(request.user)
        if not _is_blog_staff_role(role):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if file_obj.content_type not in allowed_types:
            return Response(
                {'detail': 'Invalid file type. Only JPEG, PNG, and WebP allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if file_obj.size > 5 * 1024 * 1024:
            return Response({'detail': 'File too large. Maximum size is 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        file_extension = file_obj.name.split('.')[-1]
        filename = f'blog_covers/{uuid.uuid4().hex}.{file_extension}'
        default_storage.save(filename, file_obj)
        return Response({'featured_image': default_storage.url(filename)}, status=status.HTTP_201_CREATED)


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

