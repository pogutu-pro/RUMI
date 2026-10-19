from rest_framework import serializers

from paybill.daraja import callback_urls
from paybill.models import IncomingTransaction, PaybillAccount


class PaybillAccountSerializer(serializers.ModelSerializer):
    """Never returns credentials or the callback token itself — only whether they are set."""

    has_credentials = serializers.BooleanField(read_only=True)
    consumer_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    consumer_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)
    callback_urls = serializers.SerializerMethodField()

    class Meta:
        model = PaybillAccount
        fields = [
            'id', 'shortcode', 'shortcode_type', 'display_name', 'environment', 'is_active',
            'has_credentials', 'consumer_key', 'consumer_secret', 'registered_at', 'last_callback_at',
            'callback_urls', 'created_at',
        ]
        read_only_fields = ['id', 'registered_at', 'last_callback_at', 'created_at']

    def get_callback_urls(self, obj):
        # Shown so the owner can check what Safaricom was told; the token is
        # inside the URL, so only organization owners ever receive this.
        return callback_urls(obj)

    def validate_shortcode(self, value):
        value = value.strip()
        if not value.isdigit() or not 5 <= len(value) <= 7:
            raise serializers.ValidationError('A paybill or till number is 5–7 digits.')
        return value

    def validate(self, attrs):
        key, secret = attrs.get('consumer_key'), attrs.get('consumer_secret')
        if bool(key) != bool(secret):
            raise serializers.ValidationError('Provide both the consumer key and the consumer secret.')
        return attrs

    def _apply_credentials(self, instance, attrs):
        key, secret = attrs.pop('consumer_key', ''), attrs.pop('consumer_secret', '')
        if key and secret:
            instance.set_credentials(key, secret)

    def create(self, validated_data):
        key, secret = validated_data.pop('consumer_key', ''), validated_data.pop('consumer_secret', '')
        instance = PaybillAccount(**validated_data)
        if key and secret:
            instance.set_credentials(key, secret)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        self._apply_credentials(instance, validated_data)
        return super().update(instance, validated_data)


class IncomingTransactionSerializer(serializers.ModelSerializer):
    shortcode = serializers.CharField(source='paybill.shortcode', read_only=True)
    tenant_name = serializers.CharField(source='tenancy.tenant.full_name', read_only=True, default=None)
    unit_number = serializers.CharField(source='tenancy.unit.unit_number', read_only=True, default=None)
    receipt_number = serializers.SerializerMethodField()

    class Meta:
        model = IncomingTransaction
        fields = [
            'id', 'shortcode', 'trans_id', 'trans_type', 'trans_time', 'amount', 'bill_ref_number', 'msisdn',
            'payer_name', 'status', 'matched_by', 'tenancy', 'tenant_name', 'unit_number', 'payment',
            'receipt_number', 'note', 'resolved_at', 'received_at',
        ]
        read_only_fields = fields

    def get_receipt_number(self, obj):
        receipt = getattr(obj.payment, 'receipt', None) if obj.payment_id else None
        return receipt.number if receipt else None
