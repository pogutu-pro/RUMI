from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
import logging

logger = logging.getLogger(__name__)

from .receipt_service import ReceiptService
from .models import Transaction


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
