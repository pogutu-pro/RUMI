from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import BlogPost, ContactInquiry, FAQ, Newsletter, Testimonial, Statistics

User = get_user_model()


class BlogPostSerializer(serializers.ModelSerializer):
    """Serializer for BlogPost model"""

    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_profile_picture = serializers.CharField(source='author.profile_picture', read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'featured_image',
            'author', 'author_name', 'author_profile_picture', 'category', 'tags',
            'meta_title', 'meta_description', 'is_published', 'is_featured',
            'view_count', 'read_time_minutes', 'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'created_at', 'updated_at']


class BlogPostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating BlogPost"""

    class Meta:
        model = BlogPost
        fields = [
            'title', 'slug', 'excerpt', 'content', 'featured_image',
            'author', 'category', 'tags', 'meta_title', 'meta_description',
            'is_published', 'is_featured', 'read_time_minutes', 'published_at'
        ]

    def create(self, validated_data):
        # Set published_at if is_published is True and published_at is not set
        if validated_data.get('is_published') and not validated_data.get('published_at'):
            validated_data['published_at'] = timezone.now()
        return super().create(validated_data)


class BlogPostUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating BlogPost"""

    class Meta:
        model = BlogPost
        fields = [
            'title', 'slug', 'excerpt', 'content', 'featured_image',
            'category', 'tags', 'meta_title', 'meta_description',
            'is_published', 'is_featured', 'read_time_minutes', 'published_at'
        ]

    def update(self, instance, validated_data):
        # Set published_at if is_published is being set to True and published_at is not set
        if (validated_data.get('is_published') and
            not instance.published_at and
            not validated_data.get('published_at')):
            validated_data['published_at'] = timezone.now()
        return super().update(instance, validated_data)


class ContactInquirySerializer(serializers.ModelSerializer):
    """Serializer for ContactInquiry model"""

    class Meta:
        model = ContactInquiry
        fields = [
            'id', 'full_name', 'email', 'phone_number', 'subject', 'message',
            'inquiry_type', 'status', 'ip_address', 'user_agent', 'responded_at',
            'responded_by', 'response_message', 'created_at'
        ]
        read_only_fields = ['id', 'ip_address', 'user_agent', 'responded_at', 'responded_by', 'created_at']


class FAQSerializer(serializers.ModelSerializer):
    """Serializer for FAQ model"""

    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'answer', 'category', 'display_order',
            'is_published', 'view_count', 'helpful_count', 'not_helpful_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'helpful_count', 'not_helpful_count', 'created_at', 'updated_at']


class NewsletterSerializer(serializers.ModelSerializer):
    """Serializer for Newsletter model"""

    class Meta:
        model = Newsletter
        fields = [
            'id', 'email', 'full_name', 'subscription_type', 'status',
            'subscribed_at', 'unsubscribed_at', 'verification_token',
            'is_verified', 'ip_address'
        ]
        read_only_fields = ['id', 'subscribed_at', 'unsubscribed_at', 'verification_token', 'ip_address']


class TestimonialSerializer(serializers.ModelSerializer):
    """Serializer for Testimonial model"""

    class Meta:
        model = Testimonial
        fields = [
            'id', 'author_name', 'author_role', 'author_university',
            'author_photo', 'testimonial_text', 'rating', 'is_published',
            'is_featured', 'display_order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StatisticsSerializer(serializers.ModelSerializer):
    """Serializer for Statistics model"""

    class Meta:
        model = Statistics
        fields = [
            'id', 'stat_key', 'stat_value', 'stat_label', 'stat_icon',
            'display_order', 'is_active', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']