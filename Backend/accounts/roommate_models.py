from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class RoommateRequest(models.Model):
    """Roommate matching requests and approvals"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Request details
    requester = models.ForeignKey(
        'StudentProfile',
        on_delete=models.CASCADE,
        related_name='sent_roommate_requests'
    )
    recipient = models.ForeignKey(
        'StudentProfile',
        on_delete=models.CASCADE,
        related_name='received_roommate_requests'
    )
    
    # Room and move-in preferences
    preferred_room_type = models.CharField(
        max_length=20,
        help_text="Preferred room type for the match"
    )
    preferred_hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='roommate_requests'
    )
    move_in_date = models.DateField(help_text="Preferred move-in date")
    lease_duration = models.IntegerField(default=12, help_text="Lease duration in months")
    
    # Budget preferences
    budget_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Minimum budget range"
    )
    budget_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Maximum budget range"
    )
    
    # Personal message
    message = models.TextField(
        help_text="Personal message from requester to recipient",
        blank=True,
        null=True
    )
    
    # Status and workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Caretaker approval workflow
    caretaker_approval_required = models.BooleanField(
        default=True,
        help_text="Whether this request requires caretaker approval"
    )
    caretaker_approved = models.BooleanField(default=False)
    caretaker = models.ForeignKey(
        'CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_roommate_requests'
    )
    caretaker_approved_at = models.DateTimeField(blank=True, null=True)
    caretaker_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Response tracking
    responded_at = models.DateTimeField(blank=True, null=True)
    response_message = models.TextField(blank=True, null=True)
    
    # Expiration
    expires_at = models.DateTimeField(
        help_text="Request expiration time",
        blank=True,
        null=True
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_roommaterequest'
        indexes = [
            models.Index(fields=['requester'], name='idx_roommate_request_requester'),
            models.Index(fields=['recipient'], name='idx_roommate_request_recipient'),
            models.Index(fields=['status'], name='idx_roommate_request_status'),
            models.Index(fields=['created_at'], name='idx_roommate_request_created'),
            models.Index(fields=['caretaker_approved'], name='idx_rm_req_caretaker_appr'),
        ]
        unique_together = ['requester', 'recipient', 'preferred_room_type', 'move_in_date']
        ordering = ['-priority', '-created_at']
    
    @property
    def is_expired(self):
        """Check if request has expired"""
        return timezone.now() > self.expires_at if self.expires_at else False
    
    @property
    def can_respond(self):
        """Check if recipient can respond to this request"""
        return (
            self.status == 'pending' and
            not self.is_expired and
            self.caretaker_approval_required and
            self.caretaker_approved
        )
    
    def approve_by_caretaker(self, caretaker, notes=''):
        """Approve the request by caretaker"""
        self.caretaker_approved = True
        self.caretaker = caretaker
        self.caretaker_approved_at = timezone.now()
        self.caretaker_notes = notes
        self.save()
        
        # Send notification to both parties
        self._send_approval_notification()
    
    def reject_by_caretaker(self, caretaker, reason):
        """Reject the request by caretaker"""
        self.status = 'rejected'
        self.caretaker = caretaker
        self.caretaker_approved_at = timezone.now()
        self.rejection_reason = reason
        self.save()
        
        # Send rejection notification
        self._send_rejection_notification()
    
    def respond(self, student_profile, accepted, response_message=''):
        """Respond to the roommate request"""
        if not self.can_respond:
            raise ValueError("Request cannot be responded to")
        
        self.status = 'approved' if accepted else 'rejected'
        self.responded_at = timezone.now()
        self.response_message = response_message
        self.save()
        
        # If approved, create potential room assignment logic here
        if accepted:
            self._handle_approval()
    
    def cancel(self):
        """Cancel the request"""
        if self.status == 'pending':
            self.status = 'cancelled'
            self.save()
    
    def _send_approval_notification(self):
        """Send notification when caretaker approves"""
        # Implementation for sending notifications
        pass
    
    def _send_rejection_notification(self):
        """Send notification when caretaker rejects"""
        # Implementation for sending notifications
        pass
    
    def _handle_approval(self):
        """Handle the case when request is approved by both parties"""
        # Implementation for room assignment logic
        pass
    
    def __str__(self):
        return f"Roommate request: {self.requester.user.get_full_name()} → {self.recipient.user.get_full_name()}"


class RoommateMatch(models.Model):
    """Final roommate matches after approval"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
        ('dissolved', 'Dissolved'),
    ]
    
    students = models.ManyToManyField(
        'StudentProfile',
        related_name='roommate_matches'
    )
    primary_student = models.ForeignKey(
        'StudentProfile',
        on_delete=models.CASCADE,
        related_name='primary_roommate_matches'
    )
    
    # Room assignment
    assigned_room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='roommate_matches'
    )
    assigned_hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='roommate_matches'
    )
    
    # Match details
    compatibility_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Overall compatibility score"
    )
    match_factors = models.JSONField(
        help_text="Detailed factors contributing to match"
    )
    
    # Status and dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    move_in_date = models.DateField()
    lease_start_date = models.DateField()
    lease_end_date = models.DateField()
    
    # Approval workflow
    approved_by_caretaker = models.BooleanField(default=False)
    caretaker = models.ForeignKey(
        'CaretakerProfile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_roommate_matches'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    
    # Monitoring
    review_date = models.DateField(
        help_text="Date for compatibility review",
        blank=True,
        null=True
    )
    notes = models.TextField(
        help_text="Match notes and observations",
        blank=True,
        null=True
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_roommatematch'
        indexes = [
            models.Index(fields=['primary_student'], name='idx_roommate_match_primary'),
            models.Index(fields=['status'], name='idx_roommate_match_status'),
            models.Index(fields=['move_in_date'], name='idx_roommate_match_movein'),
            models.Index(fields=['assigned_hostel'], name='idx_roommate_match_hostel'),
        ]
        ordering = ['-created_at']
    
    @property
    def student_count(self):
        """Get number of students in this match"""
        return self.students.count()
    
    def add_student(self, student):
        """Add a student to the match"""
        self.students.add(student)
    
    def remove_student(self, student):
        """Remove a student from the match"""
        self.students.remove(student)
    
    def dissolve_match(self, reason=''):
        """Dissolve the roommate match"""
        self.status = 'dissolved'
        self.notes = f"Dissolved: {reason}" if reason else "Dissolved by admin"
        self.save()
    
    def __str__(self):
        students = ", ".join([s.user.get_full_name() for s in self.students.all()[:2]])
        if self.student_count > 2:
            students += f" +{self.student_count - 2} more"
        return f"Match: {students} in {self.assigned_hostel.name}"