from django.conf import settings
from django.db import models


class VisitorInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('expired', 'Expired'),
    ]

    visitor_name = models.CharField(max_length=255)
    visitor_phone = models.CharField(max_length=20, blank=True, null=True)
    visitor_id_number = models.CharField(max_length=50)
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='visitor_invitations',
    )
    room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.CASCADE,
        related_name='visitor_invitations',
    )
    purpose = models.TextField()
    expected_arrival_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_invitations',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_in_invitations',
    )
    checked_out_at = models.DateTimeField(null=True, blank=True)
    checked_out_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_out_invitations',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.visitor_name} -> {self.student} ({self.status})"


class MaintenanceRequest(models.Model):
    CATEGORY_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('furniture', 'Furniture'),
        ('appliance', 'Appliance'),
        ('structural', 'Structural'),
        ('cleaning', 'Cleaning'),
        ('other', 'Other'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    REPORTER_TYPE_CHOICES = [
        ('tenant', 'Tenant'),
        ('caretaker', 'Caretaker'),
        ('landlord', 'Landlord'),
    ]

    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='maintenance_requests',
    )
    room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.CASCADE,
        related_name='maintenance_requests',
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='maintenance_requests_filed',
    )
    reporter_type = models.CharField(
        max_length=20, choices=REPORTER_TYPE_CHOICES, default='tenant'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='received')
    photos_before = models.JSONField(default=list, blank=True)
    photos_after = models.JSONField(default=list, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='maintenance_assignments',
    )
    estimated_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    landlord_notified = models.BooleanField(default=False)
    landlord_notified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status}) — Room {self.room_id}"


class LateEntry(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('acknowledged', 'Acknowledged'),
    ]

    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='late_entries',
    )
    room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.CASCADE,
        related_name='late_entries',
    )
    entry_time = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    logged_by = models.ForeignKey(
        'accounts.CaretakerProfile',
        on_delete=models.CASCADE,
        related_name='logged_late_entries',
    )
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-entry_time']
        verbose_name_plural = 'Late Entries'

    def __str__(self):
        return f"LateEntry: {self.student} at {self.entry_time}"
