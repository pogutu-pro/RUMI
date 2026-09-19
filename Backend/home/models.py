from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core import validators
import uuid

User = get_user_model()


class Page(models.Model):
    """Dynamic content pages with SEO metadata"""
    TEMPLATE_CHOICES = [
        ('default', 'Default'),
        ('about', 'About'),
        ('team', 'Team'),
        ('contact', 'Contact'),
        ('faq', 'FAQ'),
        ('blog', 'Blog'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    meta_title = models.CharField(max_length=60, blank=True, null=True)
    meta_description = models.CharField(max_length=160, blank=True, null=True)
    meta_keywords = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    is_published = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    template_name = models.CharField(max_length=100, default='default', choices=TEMPLATE_CHOICES)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['display_order', 'title']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_published']),
            models.Index(fields=['display_order']),
        ]

    def __str__(self):
        return self.title


class TeamMember(models.Model):
    """Staff and leadership profiles"""
    full_name = models.CharField(max_length=200)
    position = models.CharField(max_length=200)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'full_name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['display_order']),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.position}"


class ContactInquiry(models.Model):
    """Contact form submissions and tracking"""
    INQUIRY_TYPE_CHOICES = [
        ('general', 'General'),
        ('student_support', 'Student Support'),
        ('landlord_support', 'Landlord Support'),
        ('technical', 'Technical'),
        ('partnership', 'Partnership'),
        ('media', 'Media'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    inquiry_type = models.CharField(max_length=50, choices=INQUIRY_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='responded_inquiries')
    response_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['inquiry_type']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.subject} - {self.full_name}"


class FAQ(models.Model):
    """Frequently asked questions"""
    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    view_count = models.IntegerField(default=0)
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'display_order']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['is_published']),
            models.Index(fields=['category', 'display_order']),
        ]

    def __str__(self):
        return self.question


class BlogPost(models.Model):
    """News, updates, and announcements"""
    CATEGORY_CHOICES = [
        ('company_news', 'Company News'),
        ('product_updates', 'Product Updates'),
        ('student_stories', 'Student Stories'),
        ('landlord_tips', 'Landlord Tips'),
        ('housing_guides', 'Housing Guides'),
        ('marketplace_highlights', 'Marketplace Highlights'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    excerpt = models.TextField(blank=True, null=True)
    content = models.TextField()
    featured_image = models.URLField(blank=True, null=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    tags = models.JSONField(blank=True, null=True)
    meta_title = models.CharField(max_length=60, blank=True, null=True)
    meta_description = models.CharField(max_length=160, blank=True, null=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    read_time_minutes = models.IntegerField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_published', '-published_at']),
            models.Index(fields=['category']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['tags'], name='blog_tags_gin_idx'),
        ]

    def __str__(self):
        return self.title


class Newsletter(models.Model):
    """Newsletter subscription management"""
    SUBSCRIPTION_TYPE_CHOICES = [
        ('general', 'General'),
        ('students', 'Students'),
        ('landlords', 'Landlords'),
        ('marketplace', 'Marketplace'),
        ('blog', 'Blog'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('unsubscribed', 'Unsubscribed'),
        ('bounced', 'Bounced'),
        ('spam_complaint', 'Spam Complaint'),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=200, blank=True, null=True)
    subscription_type = models.CharField(max_length=50, choices=SUBSCRIPTION_TYPE_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    subscribed_at = models.DateTimeField(default=timezone.now)
    unsubscribed_at = models.DateTimeField(blank=True, null=True)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    is_verified = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['subscription_type']),
        ]

    def __str__(self):
        return f"{self.email} ({self.subscription_type})"


class Testimonial(models.Model):
    """User testimonials and reviews for landing page"""
    author_name = models.CharField(max_length=200)
    author_role = models.CharField(max_length=200, blank=True, null=True)
    author_university = models.CharField(max_length=255, blank=True, null=True)
    author_photo = models.URLField(blank=True, null=True)
    testimonial_text = models.TextField()
    rating = models.IntegerField(blank=True, null=True, validators=[validators.MinValueValidator(1), validators.MaxValueValidator(5)])
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['display_order', '-created_at']
        indexes = [
            models.Index(fields=['is_published']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['display_order']),
        ]

    def __str__(self):
        return f"{self.author_name} - {self.rating} stars"


class Statistics(models.Model):
    """Platform statistics for landing page display"""
    stat_key = models.CharField(max_length=100, unique=True)
    stat_value = models.IntegerField()
    stat_label = models.CharField(max_length=200)
    stat_icon = models.CharField(max_length=50, blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order']
        indexes = [
            models.Index(fields=['stat_key']),
            models.Index(fields=['display_order']),
        ]

    def __str__(self):
        return f"{self.stat_label}: {self.stat_value}"


class JobPosting(models.Model):
    """A role RumiaRent is hiring for, shown on the public careers page."""

    TYPE_CHOICES = [
        ('full_time', 'Full time'),
        ('part_time', 'Part time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    department = models.CharField(max_length=100, blank=True, default='')
    location = models.CharField(max_length=150, default='Nairobi, Kenya')
    employment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='full_time')
    summary = models.CharField(max_length=300, blank=True, default='')
    description = models.TextField()
    requirements = models.TextField(blank=True, default='')
    apply_email = models.EmailField(default='info@rumiarent.com')
    closing_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return f'{self.title} ({self.status})'

    @property
    def is_open(self) -> bool:
        """Published and not past its closing date."""
        if self.status != 'published':
            return False
        return self.closing_date is None or self.closing_date >= timezone.localdate()

