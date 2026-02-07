from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from payments.models import Transaction
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class ReceiptVerificationView(APIView):
    """
    Endpoint for verifying the authenticity of a payment receipt.
    URL: /api/v1/payments/verify/{transaction_id}/
    """
    permission_classes = [permissions.IsAuthenticated] # Require login to view PII

    @swagger_auto_schema(
        operation_description="Verify a payment receipt",
        responses={200: "Valid Receipt Details", 404: "Receipt Not Found"}
    )
    def get(self, request, transaction_id):
        transaction = get_object_or_404(Transaction, id=transaction_id)
        
        # Construct verification data
        data = {
            "valid": True,
            "receipt_number": f"RCP-{transaction.transaction_reference}", # Simplistic for now, match generator if needed
            "amount": transaction.amount,
            "date": transaction.paid_at,
            "status": transaction.status,
            "student_name": transaction.student.user.get_full_name(),
            "student_email": transaction.student.user.email,
            "payment_method": transaction.payment_method,
            "reference": transaction.transaction_reference,
        }
        
        # Attribution details
        if transaction.booking:
            data['attribution'] = {
                "type": "Booking",
                "c": transaction.booking.room.hostel.name,
                "room": transaction.booking.room.room_number,
                "bed": transaction.booking.bed_slot_id
            }
        elif transaction.rent_period:
            data['attribution'] = {
                "type": "Rent Period",
                "hostel": transaction.rent_period.hostel.name,
                "room": transaction.rent_period.room.room_number if transaction.rent_period.room else "N/A",
                "bed": transaction.rent_period.bed_slot_id or "N/A"
            }
            
        return Response(data, status=status.HTTP_200_OK)
