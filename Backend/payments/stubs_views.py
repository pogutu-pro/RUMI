from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Transaction, BedPaymentLedger
from hostels.models import Bed

class PaymentVerifyView(APIView):
    """
    Stub for verifying payment status.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, transaction_reference=None):
        if not transaction_reference:
            transaction_reference = request.query_params.get('reference')
            
        transaction = get_object_or_404(Transaction, transaction_reference=transaction_reference)
        return Response({
            'reference': transaction.transaction_reference,
            'status': transaction.status,
            'amount': float(transaction.amount),
            'verified': transaction.status == 'success'
        })

class PaybillAllocationView(APIView):
    """
    Stub for allocating or fetching paybill details for a hostel/bed.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        bed_id = request.query_params.get('bed_id')
        hostel_id = request.query_params.get('hostel_id')
        
        from .routing import MpesaRoutingEngine
        from hostels.models import Hostel, Bed
        
        if bed_id:
            bed = get_object_or_404(Bed.objects.select_related('hostel'), id=bed_id)
            config = MpesaRoutingEngine.get_config_for_hostel(bed.hostel)
            return Response({
                'paybill': config.mpesa_number if config else 'PENDING',
                'account_number': bed.custom_account_number or bed.full_code,
                'business_name': config.business_name if config else bed.hostel.name,
                'hostel_name': bed.hostel.name,
                'bed_code': bed.full_code
            })
            
        if hostel_id:
            hostel = get_object_or_404(Hostel, id=hostel_id)
            config = MpesaRoutingEngine.get_config_for_hostel(hostel)
            return Response({
                'paybill': config.mpesa_number if config else 'PENDING',
                'business_name': config.business_name if config else hostel.name,
                'hostel_name': hostel.name
            })

        return Response({'error': 'bed_id or hostel_id required'}, status=400)

class UnmatchedPaymentRejectView(APIView):
    """
    Stub for rejecting an unmatched payment.
    """
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, payment_id):
        transaction_obj = get_object_or_404(Transaction, id=payment_id)
        reason = request.data.get('reason', 'Rejected by admin')

        # Transaction.STATUS_CHOICES does not include 'rejected' — use 'failed'.
        # Store the rejection reason in metadata for audit trail.
        existing_metadata = transaction_obj.metadata or {}
        existing_metadata['rejection_reason'] = reason
        existing_metadata['rejected_by'] = request.user.email if request.user else 'unknown'

        transaction_obj.status = 'failed'
        transaction_obj.metadata = existing_metadata
        transaction_obj.save(update_fields=['status', 'metadata'])

        return Response({'status': 'rejected', 'payment_id': payment_id})

class UnmatchedPaymentMatchView(APIView):
    """
    Manually match an unmatched payment to a specific bed.
    """
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, payment_id):
        bed_id = request.data.get('bed_id')
        transaction = get_object_or_404(Transaction, id=payment_id)
        bed = get_object_or_404(Bed, id=bed_id)
        
        # Link transaction to bed and hostel
        transaction.bed = bed
        transaction.hostel = bed.hostel
        transaction.status = 'success'
        transaction.save()
        
        # Trigger rent period processing
        from .services import process_payment_to_rent_periods
        process_payment_to_rent_periods(
            student=transaction.student, 
            amount=transaction.amount, 
            payment_method=transaction.payment_method,
            metadata=transaction.metadata,
            booking=transaction.booking
        )
        
        return Response({'status': 'matched', 'transaction_id': transaction.id})

class UnmatchedPaymentsListView(APIView):
    """
    List payments that couldn't be automatically matched.
    """
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Payments with 'pending' status and no bed linked are 'unmatched'
        transactions = Transaction.objects.filter(
            status='pending',
            bed__isnull=True,
            transaction_type='rent'
        ).order_by('-initiated_at')
        
        data = []
        for txn in transactions:
            data.append({
                'id': txn.id,
                'mpesa_receipt': txn.mpesa_receipt_number or txn.transaction_reference,
                'phone_number': txn.mpesa_phone_number or 'N/A',
                'amount': float(txn.amount),
                'timestamp': txn.initiated_at.isoformat(),
                'status': 'unmatched',
                'suggested_match': None # Placeholder for matching algorithm
            })
            
        return Response({'data': data})

class PaymentLedgerView(APIView):
    """
    View the immutable bed payment ledger.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, search_param=None):
        ledger = BedPaymentLedger.objects.all().select_related('bed', 'transaction', 'bed__room__hostel').order_by('-created_at')
        
        if search_param:
            ledger = ledger.filter(
                models.Q(bed__full_code__icontains=search_param) |
                models.Q(transaction__transaction_reference__icontains=search_param)
            )
            
        data = []
        for entry in ledger:
            data.append({
                'id': entry.id,
                'transaction_date': entry.created_at.isoformat(),
                'bed_code': entry.bed.full_code,
                'student_name': entry.transaction.student.user.get_full_name() if entry.transaction.student else 'N/A',
                'transaction_type': 'credit',
                'amount': float(entry.amount_allocated),
                'balance': 0, # TBD: cumulative balance
                'description': f"Rent payment for {entry.allocated_to_period_start.strftime('%b %Y')}",
                'reference': entry.transaction.transaction_reference
            })
            
        return Response({'data': data})

class PaymentLedgerExportView(APIView):
    """
    Stub for exporting the payment ledger.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response({'download_url': '/media/exports/ledger_export.csv'})
