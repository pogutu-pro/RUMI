from rest_framework import serializers
from .models import (
    Transaction, SavedPaymentMethod, RecurringPayment, LateFeeCharge,
    TaxReport, PaystackSubaccount, Payout, RefundRequest, RevenueAnalytics, Receipt
)
from hostels.models import Booking
from accounts.models import StudentProfile, LandlordProfile


class TransactionSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()
    landlord_details = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['transaction_reference', 'paystack_reference', 'initiated_at']

    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'room': obj.booking.room.room_number,
            'hostel': obj.booking.room.hostel.name,
            'check_in_date': obj.booking.check_in_date,
            'check_out_date': obj.booking.check_out_date,
        }

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'business_name': obj.landlord.business_name,
        }


class SavedPaymentMethodSerializer(serializers.ModelSerializer):
    student_details = serializers.SerializerMethodField()

    class Meta:
        model = SavedPaymentMethod
        fields = '__all__'
        read_only_fields = ['student', 'created_at']

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }


class RecurringPaymentSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()
    saved_payment_method_details = serializers.SerializerMethodField()

    class Meta:
        model = RecurringPayment
        fields = '__all__'
        read_only_fields = ['started_at']

    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'room': obj.booking.room.room_number,
            'hostel': obj.booking.room.hostel.name,
        }

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }

    def get_saved_payment_method_details(self, obj):
        return {
            'id': obj.saved_payment_method.id,
            'payment_type': obj.saved_payment_method.payment_type,
            'last_four': obj.saved_payment_method.last_four,
        }


class LateFeeChargeSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()
    original_transaction_details = serializers.SerializerMethodField()

    class Meta:
        model = LateFeeCharge
        fields = '__all__'
        read_only_fields = ['charged_at']

    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'room': obj.booking.room.name,
        }

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }

    def get_original_transaction_details(self, obj):
        if obj.original_transaction:
            return {
                'id': obj.original_transaction.id,
                'reference': obj.original_transaction.transaction_reference,
            }
        return None


class TaxReportSerializer(serializers.ModelSerializer):
    landlord_details = serializers.SerializerMethodField()

    class Meta:
        model = TaxReport
        fields = '__all__'
        read_only_fields = ['generated_at']

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'business_name': obj.landlord.business_name,
        }


class PaystackSubaccountSerializer(serializers.ModelSerializer):
    landlord_details = serializers.SerializerMethodField()

    class Meta:
        model = PaystackSubaccount
        fields = '__all__'
        read_only_fields = ['created_at', 'verified_at']

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'business_name': obj.landlord.business_name,
        }


class PayoutSerializer(serializers.ModelSerializer):
    transaction_details = serializers.SerializerMethodField()
    landlord_details = serializers.SerializerMethodField()
    subaccount_details = serializers.SerializerMethodField()

    class Meta:
        model = Payout
        fields = '__all__'
        read_only_fields = ['initiated_at']

    def get_transaction_details(self, obj):
        return {
            'id': obj.transaction.id,
            'reference': obj.transaction.transaction_reference,
        }

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'business_name': obj.landlord.business_name,
        }

    def get_subaccount_details(self, obj):
        if obj.subaccount:
            return {
                'id': obj.subaccount.id,
                'business_name': obj.subaccount.business_name,
            }
        return None


class RefundRequestSerializer(serializers.ModelSerializer):
    transaction_details = serializers.SerializerMethodField()
    booking_details = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()

    class Meta:
        model = RefundRequest
        fields = '__all__'
        read_only_fields = ['requested_at']

    def get_transaction_details(self, obj):
        return {
            'id': obj.transaction.id,
            'reference': obj.transaction.transaction_reference,
        }

    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'room': obj.booking.room.name,
        }

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }


class RevenueAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevenueAnalytics
        fields = '__all__'
        read_only_fields = ['created_at']


class ReceiptSerializer(serializers.ModelSerializer):
    transaction_details = serializers.SerializerMethodField()

    class Meta:
        model = Receipt
        fields = '__all__'
        read_only_fields = ['generated_at', 'emailed_at']

    def get_transaction_details(self, obj):
        return {
            'id': obj.transaction.id,
            'reference': obj.transaction.transaction_reference,
            'amount': float(obj.transaction.total_charged_amount),
            'paid_at': obj.transaction.paid_at.isoformat() if obj.transaction.paid_at else None
        }