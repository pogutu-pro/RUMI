from rest_framework import serializers
from django.utils import timezone
from .models import SupportTicket, SupportResponse, TechSupportProfile, TicketActivityLog
from accounts.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for display in support system"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role']


class TechSupportProfileSerializer(serializers.ModelSerializer):
    """Serializer for Tech Support Profile"""
    
    user = UserBasicSerializer(read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    seniority_display = serializers.CharField(source='get_seniority_level_display', read_only=True)
    workload_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = TechSupportProfile
        fields = [
            'id', 'user', 'employee_id', 'department', 'department_display',
            'seniority_level', 'seniority_display', 'max_tickets_assigned',
            'current_tickets_assigned', 'workload_percentage', 'is_online',
            'total_tickets_resolved', 'average_resolution_time', 'created_at'
        ]
        read_only_fields = [
            'id', 'user', 'current_tickets_assigned', 'total_tickets_resolved',
            'average_resolution_time', 'created_at'
        ]
    
    def get_workload_percentage(self, obj):
        if obj.max_tickets_assigned == 0:
            return 0
        return round((obj.current_tickets_assigned / obj.max_tickets_assigned) * 100, 2)


class TechSupportProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Tech Support Profile"""
    
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = TechSupportProfile
        fields = [
            'email', 'first_name', 'last_name', 'password', 'employee_id',
            'department', 'seniority_level', 'max_tickets_assigned'
        ]
    
    def create(self, validated_data):
        # Extract user creation fields
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='tech_support'
        )
        user.set_password(password)
        user.save()
        
        # Create tech support profile
        tech_support_profile = TechSupportProfile.objects.create(
            user=user,
            created_by=self.context['request'].user,
            **validated_data
        )
        
        return tech_support_profile


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Serializer for support ticket list view"""
    
    created_by = UserBasicSerializer(read_only=True)
    assigned_to = TechSupportProfileSerializer(read_only=True)
    escalated_to = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    time_since_created = serializers.SerializerMethodField()
    response_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'ticket_id', 'title', 'category', 'category_display', 'priority',
            'priority_display', 'status', 'status_display', 'created_by',
            'assigned_to', 'escalated_to', 'escalated_at', 'resolved_at',
            'time_since_created', 'response_count', 'created_at'
        ]
    
    def get_time_since_created(self, obj):
        delta = timezone.now() - obj.created_at
        days = delta.days
        hours = delta.seconds // 3600
        
        if days > 0:
            return f"{days} day{'s' if days != 1 else ''} ago"
        elif hours > 0:
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            minutes = delta.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    
    def get_response_count(self, obj):
        return obj.responses.count()


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating support tickets"""
    
    class Meta:
        model = SupportTicket
        fields = [
            'title', 'description', 'category', 'priority', 'tags', 'attachments'
        ]
    
    def create(self, validated_data):
        # Set escalation level to 1 (User → Tech Support)
        validated_data['escalation_level'] = 1
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    """Serializer for support ticket detail view"""
    
    created_by = UserBasicSerializer(read_only=True)
    assigned_to = TechSupportProfileSerializer(read_only=True)
    escalated_to = UserBasicSerializer(read_only=True)
    resolved_by = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'ticket_id', 'title', 'description', 'category', 'category_display',
            'priority', 'priority_display', 'status', 'status_display',
            'created_by', 'assigned_to', 'escalated_to', 'resolved_by',
            'escalated_at', 'escalation_reason', 'escalation_level',
            'resolved_at', 'resolution_notes', 'tags', 'attachments',
            'created_at', 'updated_at', 'last_response_at'
        ]


class SupportResponseSerializer(serializers.ModelSerializer):
    """Serializer for support responses"""
    
    responder = UserBasicSerializer(read_only=True)
    response_type_display = serializers.CharField(source='get_response_type_display', read_only=True)
    
    class Meta:
        model = SupportResponse
        fields = [
            'id', 'responder', 'response_type', 'response_type_display',
            'message', 'is_internal', 'previous_status', 'new_status',
            'previous_priority', 'new_priority', 'previous_assignee',
            'new_assignee', 'attachments', 'created_at'
        ]
        read_only_fields = [
            'id', 'responder', 'previous_status', 'new_status',
            'previous_priority', 'new_priority', 'previous_assignee',
            'new_assignee', 'created_at'
        ]


class SupportResponseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating support responses"""
    
    class Meta:
        model = SupportResponse
        fields = [
            'response_type', 'message', 'is_internal', 'new_status',
            'new_priority', 'new_assignee', 'attachments'
        ]
    
    def create(self, validated_data):
        ticket = self.context['ticket']
        user = self.context['request'].user
        
        # Capture current state before response
        validated_data['ticket'] = ticket
        validated_data['responder'] = user
        validated_data['previous_status'] = ticket.status
        validated_data['previous_priority'] = ticket.priority
        
        if ticket.assigned_to:
            validated_data['previous_assignee'] = ticket.assigned_to
        
        return super().create(validated_data)


class TicketActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ticket activity logs"""
    
    performed_by = UserBasicSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = TicketActivityLog
        fields = [
            'id', 'action', 'action_display', 'performed_by', 'description',
            'metadata', 'created_at'
        ]
        read_only_fields = [
            'id', 'action', 'action_display', 'performed_by', 'created_at'
        ]


class TicketEscalationSerializer(serializers.Serializer):
    """Serializer for ticket escalation"""
    
    reason = serializers.CharField(max_length=500, min_length=10)
    
    def validate_reason(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Escalation reason must be at least 10 characters long."
            )
        return value


class TicketResolutionSerializer(serializers.Serializer):
    """Serializer for ticket resolution"""
    
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate_notes(self, value):
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Resolution notes must be at least 10 characters long."
            )
        return value


class TicketAssignmentSerializer(serializers.Serializer):
    """Serializer for ticket assignment"""
    
    tech_support_id = serializers.IntegerField()
    
    def validate_tech_support_id(self, value):
        try:
            tech_support = TechSupportProfile.objects.get(id=value)
            if tech_support.current_tickets_assigned >= tech_support.max_tickets_assigned:
                raise serializers.ValidationError(
                    f"Tech support {tech_support.user.get_full_name()} has reached "
                    f"maximum ticket capacity ({tech_support.max_tickets_assigned})."
                )
            return value
        except TechSupportProfile.DoesNotExist:
            raise serializers.ValidationError("Invalid tech support ID.")


class SupportTicketStatsSerializer(serializers.Serializer):
    """Serializer for support ticket statistics"""
    
    total_tickets = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    in_progress_tickets = serializers.IntegerField()
    pending_tickets = serializers.IntegerField()
    escalated_tickets = serializers.IntegerField()
    resolved_tickets = serializers.IntegerField()
    closed_tickets = serializers.IntegerField()
    avg_resolution_time = serializers.DecimalField(max_digits=8, decimal_places=2)
    tickets_by_category = serializers.DictField()
    tickets_by_priority = serializers.DictField()


class CaretakerCreateSerializer(serializers.Serializer):
    """Serializer for creating caretaker accounts"""
    
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    national_id = serializers.CharField(max_length=20, min_length=5)
    phone_number = serializers.CharField(max_length=15)
    hostel_id = serializers.IntegerField()
    emergency_contact_name = serializers.CharField(max_length=200)
    emergency_contact_phone = serializers.CharField(max_length=15)
    permissions = serializers.JSONField(default=dict)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_national_id(self, value):
        from accounts.models import CaretakerProfile
        if CaretakerProfile.objects.filter(national_id=value).exists():
            raise serializers.ValidationError("A caretaker with this national ID already exists.")
        return value
    
    def validate_hostel_id(self, value):
        from hostels.models import Hostel
        try:
            hostel = Hostel.objects.get(id=value)
            # Verify hostel belongs to this landlord
            landlord_profile = self.context['request'].user.landlord_profile
            if hostel.landlord != landlord_profile:
                raise serializers.ValidationError("You can only assign caretakers to your own hostels.")
            return value
        except Hostel.DoesNotExist:
            raise serializers.ValidationError("Invalid hostel ID.")


class CaretakerUpdateSerializer(serializers.Serializer):
    """Serializer for updating caretaker information"""
    
    emergency_contact_name = serializers.CharField(max_length=200, required=False)
    emergency_contact_phone = serializers.CharField(max_length=15, required=False)
    permissions = serializers.JSONField(required=False)
    is_active = serializers.BooleanField(required=False)