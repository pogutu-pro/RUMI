from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

User = get_user_model()


class AnalyticsEvent(models.Model):
    """Track user events for analytics"""
    EVENT_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('booking_created', 'Booking Created'),
        ('payment_made', 'Payment Made'),
        ('hostel_viewed', 'Hostel Viewed'),
        ('room_searched', 'Room Searched'),
        ('profile_updated', 'Profile Updated'),
        ('message_sent', 'Message Sent'),
        ('notification_sent', 'Notification Sent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    event_data = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'event_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.event_type} by {self.user}"


class LandlordAnalytics(models.Model):
    """Store landlord-specific analytics data"""
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name='landlord_analytics')
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Revenue Analytics
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    monthly_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    commission_earned = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    
    # Occupancy Analytics
    total_bookings = models.PositiveIntegerField(default=0)
    confirmed_bookings = models.PositiveIntegerField(default=0)
    cancelled_bookings = models.PositiveIntegerField(default=0)
    occupancy_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Performance Metrics
    average_booking_value = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    repeat_customer_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(100)])
    customer_satisfaction_score = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    # Growth Metrics
    new_bookings_growth = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    revenue_growth = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['landlord', 'period_start', 'period_end']
        ordering = ['-period_start']
    
    def __str__(self):
        return f"{self.landlord.email} analytics for {self.period_start} to {self.period_end}"


class CaretakerAnalytics(models.Model):
    """Store caretaker-specific analytics data"""
    caretaker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='caretaker_analytics')
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE, related_name='caretaker_analytics')
    
    # Operational Metrics
    check_ins_completed = models.PositiveIntegerField(default=0)
    check_outs_completed = models.PositiveIntegerField(default=0)
    damage_reports_created = models.PositiveIntegerField(default=0)
    visitor_logs_created = models.PositiveIntegerField(default=0)
    maintenance_requests_created = models.PositiveIntegerField(default=0)
    
    # Response Time Metrics
    average_check_in_time = models.DurationField(null=True, blank=True)
    average_response_time = models.DurationField(null=True, blank=True)
    
    # Performance Scores
    task_completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(100)])
    punctuality_score = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['caretaker', 'hostel', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.caretaker.email} analytics for {self.hostel.name} on {self.date}"


class StudentAnalytics(models.Model):
    """Store student-specific analytics data"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_analytics')
    
    # Search Behavior
    total_searches = models.PositiveIntegerField(default=0)
    searches_this_month = models.PositiveIntegerField(default=0)
    favorite_locations = models.JSONField(default=list)
    price_range_preference = models.JSONField(default=dict)
    
    # Booking Patterns
    total_bookings = models.PositiveIntegerField(default=0)
    completed_stays = models.PositiveIntegerField(default=0)
    average_stay_duration = models.DurationField(null=True, blank=True)
    
    # Community Engagement
    messages_sent = models.PositiveIntegerField(default=0)
    roommate_requests_sent = models.PositiveIntegerField(default=0)
    community_posts = models.PositiveIntegerField(default=0)
    
    # Satisfaction Metrics
    average_rating_given = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(5)])
    response_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.email} analytics for {self.date}"