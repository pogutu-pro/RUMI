from rest_framework import serializers

from .models import SupportTicket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ['id', 'ticket', 'author', 'author_name', 'message', 'created_at']
        read_only_fields = ['id', 'ticket', 'author', 'created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name().strip() or obj.author.email


class SupportTicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'created_by', 'created_by_name', 'created_by_role', 'organization',
            'assigned_to', 'assigned_to_name', 'subject', 'description', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'organization', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name().strip() or obj.created_by.email

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return None
        return obj.assigned_to.get_full_name().strip() or obj.assigned_to.email


class SupportTicketDetailSerializer(SupportTicketSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta(SupportTicketSerializer.Meta):
        fields = SupportTicketSerializer.Meta.fields + ['messages']
