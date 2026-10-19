from django.contrib import admin

from accounting.models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['expense_date', 'organization', 'parent_property', 'category', 'description', 'amount', 'voided_at']
    list_filter = ['category', 'paid_from']
    search_fields = ['description', 'supplier', 'reference']
