from django.contrib import admin

from .models import SupportTicket, TicketMessage


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'created_by', 'status', 'assigned_to', 'created_at']
    list_filter = ['status']
    search_fields = ['subject', 'description', 'created_by__email']


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'created_at']
