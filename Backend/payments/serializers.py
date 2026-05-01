from rest_framework import serializers
from .models import (
    Transaction, SavedPaymentMethod, RecurringPayment, LateFeeCharge,
    TaxReport, PaystackSubaccount, Payout, RefundRequest, RevenueAnalytics, Receipt,
    RentPeriod, StudentPaymentTracker, TransferLog
)
from hostels.models import Booking
from accounts.models import StudentProfile, LandlordProfile


class TransactionSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()
    rent_period_details = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['transaction_reference', 'paystack_reference', 'initiated_at']

    def get_booking_details(self, obj):
        if not obj.booking:
            return None
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
    
    def get_rent_period_details(self, obj):
        if not obj.rent_period:
            return None
        return {
            'id': obj.rent_period.id,
            'start_date': obj.rent_period.start_date,
            'end_date': obj.rent_period.end_date,
            'status': obj.rent_period.status,
            'bed_code': obj.rent_period.bed.full_code if obj.rent_period.bed else obj.rent_period.bed_slot_id,
        }


class SavedPaymentMethodSerializer(serializers.ModelSerializer):
    student_details = serializers.SerializerMethodField()

    class Meta:
        model = SavedPaymentMethod
        fields = '__all__'

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }


class RecurringPaymentSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()

    class Meta:
        model = RecurringPayment
        fields = '__all__'

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


class LateFeeChargeSerializer(serializers.ModelSerializer):
    student_details = serializers.SerializerMethodField()
    rent_period_details = serializers.SerializerMethodField()

    class Meta:
        model = LateFeeCharge
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user': obj.student.user.get_full_name(),
        }
    
    def get_rent_period_details(self, obj):
        if not obj.rent_period:
            return None
        return {
            'id': obj.rent_period.id,
            'start_date': obj.rent_period.start_date,
            'end_date': obj.rent_period.end_date,
        }


class PaystackSubaccountSerializer(serializers.ModelSerializer):
    landlord_details = serializers.SerializerMethodField()

    class Meta:
        model = PaystackSubaccount
        fields = '__all__'

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'company_name': obj.landlord.company_name,
        }


class PayoutSerializer(serializers.ModelSerializer):
    landlord_details = serializers.SerializerMethodField()

    class Meta:
        model = Payout
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'company_name': obj.landlord.company_name,
        }


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
            'room': obj.booking.room.room_number,
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


class ReceiptSerializer(serializers.ModelSerializer):
    transaction_details = serializers.SerializerMethodField()

    class Meta:
        model = Receipt
        fields = '__all__'
        read_only_fields = ['generated_at']

    def get_transaction_details(self, obj):
        return {
            'id': obj.transaction.id,
            'reference': obj.transaction.transaction_reference,
            'amount': float(obj.transaction.amount),
            'paid_at': obj.transaction.paid_at.isoformat() if obj.transaction.paid_at else None
        }


class TaxReportSerializer(serializers.ModelSerializer):
    """
    Serializer for the TaxReport model.
    """
    landlord_details = serializers.SerializerMethodField()

    class Meta:
        model = TaxReport
        fields = '__all__'
        read_only_fields = ['generated_at']

    def get_landlord_details(self, obj):
        return {
            'id': obj.landlord.id,
            'company_name': obj.landlord.company_name,
            'user': obj.landlord.user.get_full_name(),
        }


# ============================================
# NEW: RentPeriod Architecture Serializers
# ============================================

class RentPeriodSerializer(serializers.ModelSerializer):
    """Serializer for RentPeriod - the canonical rent ledger"""
    student_details = serializers.SerializerMethodField()
    hostel_details = serializers.SerializerMethodField()
    room_details = serializers.SerializerMethodField()
    bed_details = serializers.SerializerMethodField()
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    transactions = serializers.SerializerMethodField()
    
    class Meta:
        model = RentPeriod
        fields = [
            'id', 'student', 'student_details', 'hostel', 'hostel_details',
            'room', 'room_details', 'bed', 'bed_details', 'booking', 'bed_slot_id',
            'start_date', 'end_date', 'amount_due', 'amount_paid', 'balance',
            'status', 'transactions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'balance']
    
    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'name': obj.student.user.get_full_name(),
            'email': obj.student.user.email,
        }
    
    def get_hostel_details(self, obj):
        return {
            'id': obj.hostel.id,
            'name': obj.hostel.name,
            'address': obj.hostel.address,
        }
    
    def get_room_details(self, obj):
        if not obj.room:
            return None
        return {
            'id': obj.room.id,
            'room_number': obj.room.room_number,
            'room_type': obj.room.room_type,
        }
    
    def get_bed_details(self, obj):
        if not obj.bed:
            return None
        return {
            'id': obj.bed.id,
            'code': obj.bed.code,
            'full_code': obj.bed.full_code,
            'bed_type': obj.bed.bed_type,
        }
    
    def get_transactions(self, obj):
        """Return simplified transaction list for this period"""
        transactions = obj.transactions.all().order_by('-paid_at')
        return [{
            'id': txn.id,
            'reference': txn.transaction_reference,
            'amount': float(txn.amount),
            'payment_method': txn.payment_method,
            'status': txn.status,
            'paid_at': txn.paid_at.isoformat() if txn.paid_at else None,
        } for txn in transactions]


class StudentPaymentTrackerSerializer(serializers.ModelSerializer):
    """Serializer for StudentPaymentTracker - tracks overpayments/credits"""
    student_details = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentPaymentTracker
        fields = ['id', 'student', 'student_details', 'balance', 'updated_at']
        read_only_fields = ['updated_at']
    
    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'name': obj.student.user.get_full_name(),
            'email': obj.student.user.email,
        }


class TransferLogSerializer(serializers.ModelSerializer):
    """Serializer for TransferLog - audit trail for room transfers"""
    student_details = serializers.SerializerMethodField()
    from_period_details = serializers.SerializerMethodField()
    to_period_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TransferLog
        fields = [
            'id', 'student', 'student_details',
            'from_rent_period', 'from_period_details',
            'to_rent_period', 'to_period_details',
            'transfer_date', 'reason'
        ]
        read_only_fields = ['transfer_date']
    
    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'name': obj.student.user.get_full_name(),
        }
    
    def get_from_period_details(self, obj):
        period = obj.from_rent_period
        return {
            'id': period.id,
            'hostel': period.hostel.name,
            'room': period.room.room_number if period.room else None,
            'start_date': period.start_date,
            'end_date': period.end_date,
        }
    
    def get_to_period_details(self, obj):
        period = obj.to_rent_period
        return {
            'id': period.id,
            'hostel': period.hostel.name,
            'room': period.room.room_number if period.room else None,
            'start_date': period.start_date,
            'end_date': period.end_date,
        }