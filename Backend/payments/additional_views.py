from django.http import HttpResponse, FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
import logging

logger = logging.getLogger(__name__)

from .receipt_service import ReceiptService
from .hostel_payment_config import HostelPaymentConfig
from .models import Transaction
from hostels.models import Bed
from hostels.bed_models import BedOccupancy


class PaymentDetailsView(APIView):
    """
    Payment Details API - Get paybill/till and account number for a bed
    
    GET: Fetch payment configuration for a specific bed
    
    Returns payment details needed by student for offline payment
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, bed_id):
        """
        Get payment details for a bed
        
        Returns:
        - paybill_number or till_number
        - account_number (for Paybill only)
        - amount (current rent period balance)
        - hostel_name
        - bed_code
        - student_phone
       - ussd_code (optional quick dial)
        """
        try:
            # Get bed and check occupancy
            bed = Bed.objects.select_related('hostel').get(id=bed_id)
            
            # Check if user has access (student must be occupant or admin)
            if request.user.role == 'student':
                try:
                    occupancy = BedOccupancy.objects.get(
                        bed=bed,
                        student=request.user.student_profile,
                        is_active=True
                    )
                except BedOccupancy.DoesNotExist:
                    return Response({
                        'error': 'You do not have access to this bed'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Get hostel payment config
            try:
                config = bed.hostel.payment_config
            except HostelPaymentConfig.DoesNotExist:
                return Response({
                    'error': 'Payment configuration not set up for this hostel'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Generate account number for this bed
            account_number = config.generate_account_number(bed)
            
            # Get current rent period to fetch balance
            from .models import RentPeriod
            current_period = RentPeriod.objects.filter(
                bed_slot_id=str(bed.id),
                student=request.user.student_profile,
                status__in=['due', 'partially_paid', 'overdue']
            ).first()
            
            amount = current_period.balance if current_period else 0
            
            # Build response
            response_data = {
                'hostel_name': bed.hostel.name,
                'bed_code': f"Room {bed.room.room_number}, Bed {bed.code}",
                'amount': float(amount),
                'account_number': account_number,
                'student_phone': request.user.phone_number if hasattr(request.user, 'phone_number') else ''
            }
            
            # Add paybill or till based on config
            if config.payment_type == 'till':
                response_data['till_number'] = config.mpesa_number
                response_data['paybill_number'] = None
            else:  # paybill
                response_data['paybill_number'] = config.mpesa_number
                response_data['till_number'] = None
            
            # Optional: Generate USSD code for paybill
            if config.payment_type == 'paybill':
                response_data['ussd_code'] = f"*234*{config.mpesa_number}*{account_number}*{int(amount)}#"
            
            return Response({'data': response_data}, status=status.HTTP_200_OK)
            
        except Bed.DoesNotExist:
            return Response({
                'error': 'Bed not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching payment details: {str(e)}")
            return Response({
                'error': 'Failed to fetch payment details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReceiptGenerateView(APIView):
    """
    Receipt Generation API - Generate downloadable PDF receipt
    
    POST: Generate and return receipt URL for a transaction
    
    Returns receipt download URL and metadata
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Generate PDF receipt for a transaction
        
        Request body:
        - transaction_reference: Transaction ref to generate receipt for
        
        Returns:
        - receipt_url: URL to download PDF
        - receipt_number: Receipt identifier
        - generated_at: Generation timestamp
        """
        transaction_ref = request.data.get('transaction_reference')
        
        if not transaction_ref:
            return Response({
                'error': 'transaction_reference is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get transaction
            transaction_obj = Transaction.objects.select_related(
                'student__user', 'booking__room__hostel'
            ).get(transaction_reference=transaction_ref)
            
            # Check access permissions
            if request.user.role == 'student':
                if transaction_obj.student.user != request.user:
                    return Response({
                        'error': 'Unauthorized access'
                    }, status=status.HTTP_403_FORBIDDEN)
            elif request.user.role == 'landlord':
                if transaction_obj.landlord.user != request.user:
                    return Response({
                        'error': 'Unauthorized access'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Generate receipt using service
            receipt = ReceiptService.generate_receipt(transaction_obj)
            
            # Return receipt details
            return Response({
                'data': {
                    'receipt_url': receipt.pdf_file.url if receipt.pdf_file else None,
                    'receipt_number': receipt.receipt_number,
                    'generated_at': receipt.generated_at.isoformat()
                }
            }, status=status.HTTP_200_OK)
            
        except Transaction.DoesNotExist:
            return Response({
                'error': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error generating receipt: {str(e)}")
            return Response({
                'error': 'Failed to generate receipt',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
