"""
Organizations app serializers — payout-account status and bank-details input.

`PayoutAccountSerializer` never exposes `bank_code`, the raw
`bank_account_number`, or `paystack_subaccount_code` — only a masked account
number (last 4 digits), mirroring billing's `OrganizationSubscriptionSerializer`
exclusion of raw `paystack_*` fields.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import PayoutAccount


class PayoutBankDetailsInputSerializer(serializers.Serializer):
    # max_length values mirror PayoutAccount's model field constraints
    # (organizations/models.py) so an over-long value is rejected here with
    # a clean 400 instead of reaching save() and raising an unhandled
    # django.db.utils.DataError from the underlying varchar(N) column.
    bank_name = serializers.CharField(max_length=100)
    bank_account_number = serializers.CharField(max_length=20)
    bank_code = serializers.CharField(max_length=10)


class PayoutAccountSerializer(serializers.ModelSerializer):
    bank_account_number_masked = serializers.SerializerMethodField()

    class Meta:
        model = PayoutAccount
        fields = [
            'status',
            'account_name',
            'bank_name',
            'bank_account_number_masked',
            'last_verified_at',
            'updated_at',
        ]

    def get_bank_account_number_masked(self, obj) -> str:
        if not obj.bank_account_number:
            return ''
        return '****' + obj.bank_account_number[-4:]
