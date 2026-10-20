from django.contrib import admin

from ledger.models import Account, JournalEntry, JournalLine


class JournalLineInline(admin.TabularInline):
    model = JournalLine
    extra = 0
    can_delete = False
    readonly_fields = ['account', 'debit', 'credit', 'description', 'tenancy', 'tenant', 'parent_property', 'unit']


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['organization', 'code', 'name', 'account_type']
    list_filter = ['account_type']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['organization', 'entry_date', 'source_type', 'source_id', 'memo']
    list_filter = ['source_type']
    inlines = [JournalLineInline]

    def has_change_permission(self, request, obj=None):
        return False  # Immutable — correct by reversal.

    def has_delete_permission(self, request, obj=None):
        return False
