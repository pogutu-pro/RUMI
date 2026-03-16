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
