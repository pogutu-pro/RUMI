from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinLengthValidator, MaxLengthValidator
from decimal import Decimal

User = get_user_model()


class TechSupportProfile(models.Model):
    """Tech Support Admin profile data"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='tech_support_profile'
    )
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        validators=[MinLengthValidator(3), MaxLengthValidator(20)]
    )
    department = models.CharField(
        max_length=100,
        choices=[
            ('general', 'General Support'),
            ('technical', 'Technical Support'),
            ('billing', 'Billing Support'),
            ('security', 'Security Support'),
            ('escalations', 'Escalations')
        ],
        default='general'
    )
    seniority_level = models.CharField(
        max_length=20,
        choices=[
            ('junior', 'Junior'),
            ('senior', 'Senior'),
            ('lead', 'Team Lead'),
            ('manager', 'Manager')
        ],
        default='junior'
    )
    max_tickets_assigned = models.IntegerField(
        default=50,
        validators=[MinLengthValidator(1), MaxLengthValidator(100)]
    )
    is_online = models.BooleanField(default=True)
    current_tickets_assigned = models.IntegerField(default=0)
    total_tickets_resolved = models.IntegerField(default=0)
    average_resolution_time = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_tech_support_users'
    )

    class Meta:
        db_table = 'support_api_techsupportprofile'
        indexes = [
            models.Index(fields=['user'], name='idx_tech_support_user'),
            models.Index(fields=['department'], name='idx_tech_support_department'),
            models.Index(fields=['is_online'], name='idx_tech_support_online'),
            models.Index(fields=['seniority_level'], name='idx_tech_support_seniority'),
        ]

    def __str__(self):
        department_map = {
            'general': 'General Support',
            'technical': 'Technical Support',
            'billing': 'Billing Support',
            'security': 'Security Support',
            'escalations': 'Escalations'
        }
        return f"{self.user.get_full_name()} - {department_map.get(self.department, self.department)}"


class SupportTicket(models.Model):
    """Hierarchical support ticket system"""
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
        ('critical', 'Critical')
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated')
    ]
    
    CATEGORY_CHOICES = [
        ('account', 'Account Issues'),
        ('payment', 'Payment & Billing'),
        ('technical', 'Technical Problems'),
        ('hostel', 'Hostel Related'),
        ('security', 'Security Concerns'),
        ('feature_request', 'Feature Request'),
        ('bug_report', 'Bug Report'),
        ('general', 'General Inquiry')
    ]
    
    ticket_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text='Auto-generated unique ticket identifier'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_tickets'
    )
    assigned_to = models.ForeignKey(
        TechSupportProfile,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_tickets'
    )
    escalated_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='escalated_tickets',
        help_text='User who escalated this ticket (usually super admin)'
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(
        validators=[MaxLengthValidator(2000)],
        help_text='Detailed description of the issue'
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='general'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='open'
    )
    
    # Escalation tracking
    escalated_at = models.DateTimeField(blank=True, null=True)
    escalation_reason = models.TextField(blank=True, null=True)
    escalation_level = models.IntegerField(
        default=1,
        help_text='1=User→Tech Support, 2=Tech Support→Super Admin'
    )
    
    # Resolution tracking
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='resolved_tickets'
    )
    resolution_notes = models.TextField(blank=True, null=True)
    
    # Metadata
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text='List of tags for ticket categorization'
    )
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text='List of attachment URLs or file references'
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_response_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'support_api_supportticket'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket_id'], name='idx_ticket_id'),
            models.Index(fields=['created_by'], name='idx_ticket_creator'),
            models.Index(fields=['assigned_to'], name='idx_ticket_assignee'),
            models.Index(fields=['status'], name='idx_ticket_status'),
            models.Index(fields=['priority'], name='idx_ticket_priority'),
            models.Index(fields=['category'], name='idx_ticket_category'),
            models.Index(fields=['escalation_level'], name='idx_ticket_escalation'),
            models.Index(fields=['created_at'], name='idx_ticket_created'),
            models.Index(fields=['last_response_at'], name='idx_ticket_last_response'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(escalation_level__gte=1) & models.Q(escalation_level__lte=2),
                name='check_valid_escalation_level'
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            # Generate unique ticket ID
            import uuid
            self.ticket_id = f"TKT-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4()).upper()[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_id}: {self.title}"

    def escalate_to_super_admin(self, reason, escalated_by):
        """Escalate ticket to super admin"""
        if self.escalation_level >= 2:
            return False  # Already escalated to max level
        
        self.escalated_to = escalated_by
        self.escalation_reason = reason
        self.escalated_at = timezone.now()
        self.escalation_level = 2
        self.status = 'escalated'
        self.save()
        return True

    def assign_to_tech_support(self, tech_support_profile):
        """Assign ticket to tech support"""
        if self.escalation_level != 1:
            return False  # Can only assign user-created tickets
        
        self.assigned_to = tech_support_profile
        self.status = 'in_progress' if self.status == 'open' else self.status
        self.save()
        
        # Update tech support profile
        tech_support_profile.current_tickets_assigned += 1
        tech_support_profile.save(update_fields=['current_tickets_assigned'])
        return True

    def resolve_ticket(self, resolved_by, notes=''):
        """Mark ticket as resolved"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.resolved_by = resolved_by
        self.resolution_notes = notes
        self.save()
        
        # Update tech support stats if assigned
        if self.assigned_to:
            tech_support = self.assigned_to
            tech_support.current_tickets_assigned = max(0, tech_support.current_tickets_assigned - 1)
            tech_support.total_tickets_resolved += 1
            
            # Calculate average resolution time
            if self.created_at and self.resolved_at:
                resolution_time = Decimal(str((self.resolved_at - self.created_at).total_seconds() / 3600))  # hours
                if tech_support.total_tickets_resolved == 1:
                    tech_support.average_resolution_time = resolution_time
                else:
                    # Calculate running average
                    current_avg = tech_support.average_resolution_time
                    total_resolved = tech_support.total_tickets_resolved
                    tech_support.average_resolution_time = ((current_avg * (total_resolved - 1)) + resolution_time) / total_resolved
            
            tech_support.save()
        
        return True


class SupportResponse(models.Model):
    """Responses to support tickets"""
    
    RESPONSE_TYPE_CHOICES = [
        ('initial', 'Initial Response'),
        ('update', 'Status Update'),
        ('resolution', 'Resolution'),
        ('escalation', 'Escalation Note'),
        ('customer_response', 'Customer Response')
    ]
    
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    responder = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ticket_responses'
    )
    
    response_type = models.CharField(
        max_length=20,
        choices=RESPONSE_TYPE_CHOICES,
        default='update'
    )
    message = models.TextField(
        validators=[MaxLengthValidator(2000)],
        help_text='Response message content'
    )
    
    # Internal note flag
    is_internal = models.BooleanField(
        default=False,
        help_text='Internal note visible only to staff'
    )
    
    # Status change tracking
    previous_status = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )
    new_status = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )
    
    # Priority change tracking
    previous_priority = models.CharField(
        max_length=10,
        blank=True,
        null=True
    )
    new_priority = models.CharField(
        max_length=10,
        blank=True,
        null=True
    )
    
    # Assignment tracking
    previous_assignee = models.ForeignKey(
        TechSupportProfile,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='previous_assignments'
    )
    new_assignee = models.ForeignKey(
        TechSupportProfile,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='new_assignments'
    )
    
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text='List of attachment URLs or file references'
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'support_api_supportresponse'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket'], name='idx_response_ticket'),
            models.Index(fields=['responder'], name='idx_response_responder'),
            models.Index(fields=['response_type'], name='idx_response_type'),
            models.Index(fields=['created_at'], name='idx_response_created'),
            models.Index(fields=['is_internal'], name='idx_response_internal'),
        ]

    def __str__(self):
        return f"Response to {self.ticket.ticket_id} by {self.responder.get_full_name()}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update ticket's last_response_at
        self.ticket.last_response_at = self.created_at
        self.ticket.save(update_fields=['last_response_at'])
        
        # Handle status changes
        if self.new_status and self.new_status != self.previous_status:
            self.ticket.status = self.new_status
            self.ticket.save(update_fields=['status'])
        
        # Handle priority changes
        if self.new_priority and self.new_priority != self.previous_priority:
            self.ticket.priority = self.new_priority
            self.ticket.save(update_fields=['priority'])
        
        # Handle assignment changes
        if self.new_assignee and self.new_assignee != self.previous_assignee:
            # Decrement previous assignee count
            if self.previous_assignee:
                self.previous_assignee.current_tickets_assigned = max(0, self.previous_assignee.current_tickets_assigned - 1)
                self.previous_assignee.save(update_fields=['current_tickets_assigned'])
            
            # Increment new assignee count
            self.new_assignee.current_tickets_assigned += 1
            self.new_assignee.save(update_fields=['current_tickets_assigned'])


class TicketActivityLog(models.Model):
    """Activity log for ticket actions"""
    
    ACTION_CHOICES = [
        ('created', 'Ticket Created'),
        ('assigned', 'Ticket Assigned'),
        ('status_changed', 'Status Changed'),
        ('priority_changed', 'Priority Changed'),
        ('escalated', 'Escalated'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('reopened', 'Reopened'),
        ('response_added', 'Response Added'),
        ('attachment_added', 'Attachment Added')
    ]
    
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='activity_log'
    )
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='ticket_activities'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'support_api_ticketactivitylog'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket'], name='idx_support_activity_ticket'),
            models.Index(fields=['performed_by'], name='idx_support_activity_performer'),
            models.Index(fields=['action'], name='idx_support_activity_action'),
            models.Index(fields=['created_at'], name='idx_support_activity_created'),
        ]

    def __str__(self):
        action_map = {
            'created': 'Ticket Created',
            'assigned': 'Ticket Assigned',
            'status_changed': 'Status Changed',
            'priority_changed': 'Priority Changed',
            'escalated': 'Escalated',
            'resolved': 'Resolved',
            'closed': 'Closed',
            'reopened': 'Reopened',
            'response_added': 'Response Added',
            'attachment_added': 'Attachment Added'
        }
        return f"{action_map.get(self.action, self.action)} on {self.ticket.ticket_id}"