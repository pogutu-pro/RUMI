"""
Review model for hostel and room rating system
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Review(models.Model):
    """
    Model for storing student reviews of hostels and rooms
    """
    
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    REVIEW_TYPE_CHOICES = [
        ('hostel', 'Hostel Review'),
        ('room', 'Room Review'),
    ]
    
    # Core fields
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='hostel_reviews',
        limit_choices_to={'role': 'student'},
        help_text="Student who wrote the review"
    )
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='reviews',
        help_text="Hostel being reviewed"
    )
    room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.SET_NULL,
        related_name='reviews',
        null=True,
        blank=True,
        help_text="Specific room being reviewed (optional)"
    )
    booking = models.OneToOneField(
        'hostels.Booking',
        on_delete=models.CASCADE,
        related_name='review',
        help_text="Booking that this review is based on"
    )
    
    # Review content
    rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    title = models.CharField(
        max_length=100,
        help_text="Brief review title"
    )
    comment = models.TextField(
        help_text="Detailed review comments"
    )
    review_type = models.CharField(
        max_length=10,
        choices=REVIEW_TYPE_CHOICES,
        default='hostel',
        help_text="Type of review (hostel or room specific)"
    )
    
    # Review metadata
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether reviewer actually stayed at the property"
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Whether review should be shown publicly"
    )
    helpful_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of users who found this review helpful"
    )
    
    # Moderation
    is_flagged = models.BooleanField(
        default=False,
        help_text="Whether review has been flagged for moderation"
    )
    moderation_reason = models.TextField(
        blank=True,
        help_text="Reason for flagging if moderated"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When review was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When review was last updated"
    )
    
    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hostel', '-created_at']),
            models.Index(fields=['reviewer', '-created_at']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_public', 'is_flagged']),
            models.Index(fields=['booking']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['booking'],
                name='unique_booking_review'
            ),
        ]
    
    def __str__(self):
        return f"Review by {self.display_name} - {self.hostel.name} ({self.rating} stars)"
    
    def save(self, *args, **kwargs):
        """Override save to ensure data consistency"""
        if self.room and self.review_type == 'hostel':
            self.review_type = 'room'
        elif not self.room and self.review_type == 'room':
            self.review_type = 'hostel'
            
        super().save(*args, **kwargs)
    
    @property
    def display_name(self):
        """Return reviewer's display name"""
        if hasattr(self.reviewer, 'get_full_name'):
            name = self.reviewer.get_full_name()
            return name if name else str(self.reviewer.email)
        return str(self.reviewer.pk)
    
    @property
    def is_room_review(self):
        """Check if this is a room-specific review"""
        return self.review_type == 'room'
    
    @property
    def is_hostel_review(self):
        """Check if this is a hostel-level review"""
        return self.review_type == 'hostel'
    
    def can_edit(self, user):
        """Check if user can edit this review"""
        return (self.reviewer == user and 
                self.created_at > timezone.now() - timedelta(days=30))
    
    def mark_helpful(self):
        """Increment helpful count"""
        self.helpful_count = models.F('helpful_count') + 1
        self.save(update_fields=['helpful_count'])
    
    def flag_for_moderation(self, reason):
        """Flag review for moderation"""
        self.is_flagged = True
        self.moderation_reason = reason
        self.save(update_fields=['is_flagged', 'moderation_reason'])


class ReviewHelpful(models.Model):
    """
    Track which users found reviews helpful
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='helpful_reviews'
    )
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='helpful_votes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_helpful'
        unique_together = ['user', 'review']
        indexes = [
            models.Index(fields=['review', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.display_name} found review {self.review.pk} helpful"
    
    @property
    def display_name(self):
        """Return user display name"""
        if hasattr(self.user, 'get_full_name'):
            name = self.user.get_full_name()
            return name if name else str(self.user.email)
        return str(self.user.pk)


class ReviewImage(models.Model):
    """
    Images attached to reviews
    """
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to='review_images/',
        help_text="Review image"
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        help_text="Image caption"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_images'
        ordering = ['uploaded_at']
    
    def __str__(self):
        return f"Image for review {self.review.pk}"