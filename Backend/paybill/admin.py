from django.contrib import admin

from paybill.models import IncomingTransaction, PaybillAccount


@admin.register(PaybillAccount)
class PaybillAccountAdmin(admin.ModelAdmin):
    list_display = ['shortcode', 'shortcode_type', 'organization', 'environment', 'is_active', 'registered_at']
    exclude = ['consumer_key_encrypted', 'consumer_secret_encrypted', 'callback_token']
    readonly_fields = ['registered_at', 'registration_response', 'last_callback_at']


@admin.register(IncomingTransaction)
class IncomingTransactionAdmin(admin.ModelAdmin):
    list_display = ['trans_id', 'trans_time', 'amount', 'bill_ref_number', 'status', 'matched_by', 'organization']
    list_filter = ['status', 'matched_by']
    search_fields = ['trans_id', 'bill_ref_number', 'payer_name']
    readonly_fields = [f.name for f in IncomingTransaction._meta.fields]

    def has_add_permission(self, request):
        return False
