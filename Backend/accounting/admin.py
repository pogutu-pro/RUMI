from django.contrib import admin

from accounting.models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['incurred_on', 'organization', 'parent_property', 'category', 'description', 'amount', 'is_void']
    list_filter = ['category', 'paid_from', 'is_void']
    search_fields = ['description', 'vendor', 'reference']
