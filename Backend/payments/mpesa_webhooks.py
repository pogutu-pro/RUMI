"""
M-Pesa Webhook Handlers for RUMI Platform (Class-based for Swagger documentation)

This module handles M-Pesa webhook callbacks for:
- STK Push payment callbacks
- C2B validation requests
- C2B confirmation requests
- Payment status updates

Supports offline payment processing with real-time updates to the platform.
"""

import json
import logging
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.db import transaction
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Transaction, MpesaPaymentConfig
from .mpesa_api import MpesaDarajaAPI

logger = logging.getLogger(__name__)


class MpesaWebhookHandler(View):
    """
    Main webhook handler for M-Pesa callbacks
    """
    
    def __init__(self):
        self.mpesa_api = MpesaDarajaAPI()
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["POST"]))
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request, webhook_type):
        """
        Handle M-Pesa webhook based on type
        
        Args:
            request: HTTP request object
            webhook_type (str): Type of webhook (stk_push, c2b_validation, c2b_confirmation)
        """
        try:
            # Parse JSON data
            data = json.loads(request.body.decode('utf-8'))
            logger.info(f"Received M-Pesa webhook: {webhook_type}")
            logger.info(f"Webhook data: {data}")
            
            if webhook_type == 'stk_push':
                return self._handle_stk_push_callback(data)
            elif webhook_type == 'c2b_validation':
                return self._handle_c2b_validation(data)
            elif webhook_type == 'c2b_confirmation':
                return self._handle_c2b_confirmation(data)
            else:
                logger.error(f"Unknown webhook type: {webhook_type}")
                return JsonResponse({'error': 'Unknown webhook type'}, status=400)
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in webhook: {e}")
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            return JsonResponse({'error': 'Processing failed'}, status=500)
    
    def _handle_stk_push_callback(self, data):
        """
        Handle STK Push payment callback
        """
        try:
            # Process the callback using M-Pesa API
            payment_info = self.mpesa_api.process_payment_callback(data)
            
            if payment_info['status'] == 'success':
                return self._update_transaction_from_stk_push(payment_info)
            elif payment_info['status'] == 'failed':
                return self._handle_failed_stk_push(payment_info)
            else:
                logger.warning(f"Unexpected STK push status: {payment_info}")
                return JsonResponse({'status': 'processed'}, status=200)
                
        except Exception as e:
            logger.error(f"Error handling STK push callback: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def _handle_c2b_validation(self, data):
        """
        Handle C2B validation request
        """
        try:
            # Process validation using M-Pesa API
            validation_result = self.mpesa_api.process_c2b_validation(data)
            
            # Log the validation for audit purposes
            logger.info(f"C2B Validation processed: {validation_result}")
            
            # Return validation response
            return JsonResponse(validation_result, status=200)
            
        except Exception as e:
            logger.error(f"Error handling C2B validation: {e}")
            # Return rejection on error
            return JsonResponse({
                'ResultCode': '1',
                'ResultDesc': 'Validation failed',
                'ThirdPartyTransID': f"C2B-{int(timezone.now().timestamp())}"
            }, status=200)
    
    def _handle_c2b_confirmation(self, data):
        """
        Handle C2B confirmation request
        """
        try:
            # Process confirmation using M-Pesa API
            payment_info = self.mpesa_api.process_c2b_confirmation(data)
            
            if payment_info['status'] == 'success':
                # Create or update transaction from C2B confirmation
                return self._create_transaction_from_c2b(payment_info)
            else:
                logger.warning(f"C2B confirmation processing failed: {payment_info}")
                
            # Return confirmation response
            confirmation_response = self.mpesa_api.process_c2b_confirmation(data)
            return JsonResponse(confirmation_response, status=200)
            
        except Exception as e:
            logger.error(f"Error handling C2B confirmation: {e}")
            return JsonResponse({
                'ResultCode': '1',
                'ResultDesc': 'Confirmation processing failed',
                'ThirdPartyTransID': f"C2B-{int(timezone.now().timestamp())}"
            }, status=200)
    
    def _update_transaction_from_stk_push(self, payment_info):
        """
        Update transaction from successful STK push callback
        """
        try:
            with transaction.atomic():
                # Find transaction by checkout request ID
                checkout_request_id = payment_info.get('checkout_request_id')
                if not checkout_request_id:
                    logger.error("No checkout request ID in payment info")
                    return JsonResponse({'error': 'Missing checkout request ID'}, status=400)
                
                try:
                    transaction_obj = Transaction.objects.get(
                        mpesa_checkout_request_id=checkout_request_id,
                        payment_method='mpesa'
                    )
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for checkout request ID: {checkout_request_id}")
                    return JsonResponse({'error': 'Transaction not found'}, status=404)
                
                # Update transaction with M-Pesa details
                transaction_obj.mpesa_transaction_id = payment_info.get('transaction_id')
                transaction_obj.mpesa_receipt_number = payment_info.get('receipt_number')
                transaction_obj.mpesa_phone_number = payment_info.get('phone_number')
                transaction_obj.mpesa_transaction_date = timezone.now()
                transaction_obj.metadata = payment_info
                
                # Update status and timestamps
                transaction_obj.status = 'success'
                transaction_obj.paid_at = timezone.now()
                
                # Update booking
                booking = transaction_obj.booking
                booking.status = 'confirmed'
                booking.amount_paid += transaction_obj.total_charged_amount
                booking.save()
                
                # Create payout record
                from .models import Payout
                Payout.objects.create(
                    transaction=transaction_obj,
                    landlord=transaction_obj.landlord,
                    payout_reference=f"MPESA-PAYOUT-{transaction_obj.id}-{int(timezone.now().timestamp())}",
                    gross_amount=transaction_obj.landlord_payout_amount,
                    commission_deducted=Decimal('0.00'),
                    net_payout_amount=transaction_obj.landlord_payout_amount,
                    status='pending'
                )
                
                # Send notifications
                self._send_payment_notifications(transaction_obj)
                
                # Generate receipt
                self._generate_receipt(transaction_obj)
                
                logger.info(f"STK Push transaction updated successfully: {transaction_obj.transaction_reference}")
                return JsonResponse({'status': 'success', 'message': 'Transaction updated'}, status=200)
                
        except Exception as e:
            logger.error(f"Error updating STK push transaction: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def _handle_failed_stk_push(self, payment_info):
        """
        Handle failed STK push payment
        """
        try:
            checkout_request_id = payment_info.get('checkout_request_id')
            if not checkout_request_id:
                return JsonResponse({'error': 'Missing checkout request ID'}, status=400)
            
            transaction_obj = Transaction.objects.get(
                mpesa_checkout_request_id=checkout_request_id,
                payment_method='mpesa'
            )
            
            # Update transaction as failed
            transaction_obj.status = 'failed'
            transaction_obj.failed_at = timezone.now()
            transaction_obj.metadata = payment_info
            transaction_obj.save()
            
            # Send failure notification
            self._send_failure_notification(transaction_obj, payment_info.get('result_desc', 'Payment failed'))
            
            logger.info(f"STK Push transaction marked as failed: {transaction_obj.transaction_reference}")
            return JsonResponse({'status': 'failure_handled'}, status=200)
            
        except Transaction.DoesNotExist:
            logger.error(f"Transaction not found for failed STK push: {checkout_request_id}")
            return JsonResponse({'error': 'Transaction not found'}, status=404)
        except Exception as e:
            logger.error(f"Error handling failed STK push: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def _create_transaction_from_c2b(self, payment_info):
        """
        Create new transaction from C2B confirmation
        
        This is the automatic workflow for C2B offline payments.
        Students can pay via M-Pesa menu using business number and reference.
        Webhooks automatically create transactions when payments are confirmed.
        """
        try:
            with transaction.atomic():
                reference = payment_info.get('reference')
                transaction_id = payment_info.get('transaction_id')
                amount = payment_info.get('amount')
                phone_number = payment_info.get('phone_number')
                
                # Parse reference to extract booking ID and transaction type
                # Expected format: RUMI-INITIAL-{booking_id}-{uuid}
                if not reference or not reference.startswith('RUMI-'):
                    logger.error(f"Invalid C2B reference format: {reference}")
                    return JsonResponse({'error': 'Invalid reference format'}, status=400)
                
                parts = reference.split('-')
                if len(parts) < 4:
                    logger.error(f"Invalid C2B reference structure: {reference}")
                    return JsonResponse({'error': 'Invalid reference structure'}, status=400)
                
                try:
                    booking_id = int(parts[2])
                except (ValueError, IndexError):
                    logger.error(f"Could not parse booking ID from reference: {reference}")
                    return JsonResponse({'error': 'Invalid booking ID'}, status=400)
                
                from hostels.models import Booking
                from accounts.models import StudentProfile, LandlordProfile
                
                try:
                    booking = Booking.objects.select_related(
                        'student', 'room__hostel__landlord'
                    ).get(id=booking_id)
                except Booking.DoesNotExist:
                    logger.error(f"Booking not found for C2B payment: {booking_id}")
                    return JsonResponse({'error': 'Booking not found'}, status=404)
                
                # Check if transaction already exists
                existing_transaction = Transaction.objects.filter(
                    transaction_reference=reference
                ).first()
                
                if existing_transaction:
                    logger.info(f"C2B transaction already exists: {reference}")
                    return JsonResponse({'status': 'already_processed'}, status=200)
                
                # Create new transaction from C2B confirmation
                transaction_obj = Transaction.objects.create(
                    booking=booking,
                    student=booking.student,
                    landlord=booking.room.hostel.landlord,
                    transaction_reference=reference,
                    transaction_type='initial',
                    payment_plan='monthly',
                    payment_method='mpesa',
                    mpesa_payment_type='c2b_offline',
                    mpesa_transaction_id=transaction_id,
                    mpesa_receipt_number=transaction_id,  # Use transaction ID as receipt
                    mpesa_phone_number=phone_number,
                    mpesa_transaction_date=timezone.now(),
                    base_rent=booking.monthly_rent,
                    student_service_fee=booking.monthly_rent * Decimal('0.02'),
                    total_charged_amount=Decimal(str(amount)),
                    landlord_payout_amount=booking.monthly_rent,
                    gross_platform_revenue=booking.monthly_rent * Decimal('0.02'),
                    status='success',
                    paid_at=timezone.now(),
                    metadata=payment_info
                )
                
                # Update booking
                booking.status = 'confirmed'
                booking.amount_paid += transaction_obj.total_charged_amount
                booking.save()
                
                # Create payout record
                from .models import Payout
                Payout.objects.create(
                    transaction=transaction_obj,
                    landlord=transaction_obj.landlord,
                    payout_reference=f"MPESA-C2B-PAYOUT-{transaction_obj.id}-{int(timezone.now().timestamp())}",
                    gross_amount=transaction_obj.landlord_payout_amount,
                    commission_deducted=Decimal('0.00'),
                    net_payout_amount=transaction_obj.landlord_payout_amount,
                    status='pending'
                )
                
                # Send notifications
                self._send_payment_notifications(transaction_obj)
                
                # Generate receipt
                self._generate_receipt(transaction_obj)
                
                logger.info(f"C2B transaction created successfully: {transaction_obj.transaction_reference}")
                return JsonResponse({'status': 'success', 'message': 'Transaction created'}, status=200)
                
        except Exception as e:
            logger.error(f"Error creating C2B transaction: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def _send_payment_notifications(self, transaction):
        """
        Send payment success notifications
        """
        try:
            from notifications.tasks import send_notification
            
            # Notify student
            send_notification.delay(
                recipient_id=transaction.student.user.id,
                notification_type='payment_success',
                channel='email',
                context={
                    'student_name': transaction.student.user.first_name,
                    'amount': float(transaction.total_charged_amount),
                    'transaction_reference': transaction.transaction_reference,
                    'payment_method': 'M-Pesa'
                }
            )
            
            # Notify landlord
            send_notification.delay(
                recipient_id=transaction.landlord.user.id,
                notification_type='payment_received',
                channel='email',
                context={
                    'landlord_name': transaction.landlord.business_name or transaction.landlord.user.first_name,
                    'amount': float(transaction.landlord_payout_amount),
                    'student_name': transaction.student.user.first_name,
                    'payment_method': 'M-Pesa'
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending payment notifications: {e}")
    
    def _send_failure_notification(self, transaction, reason):
        """
        Send payment failure notification
        """
        try:
            from notifications.tasks import send_notification
            
            send_notification.delay(
                recipient_id=transaction.student.user.id,
                notification_type='payment_failed',
                channel='email',
                context={
                    'student_name': transaction.student.user.first_name,
                    'amount': float(transaction.total_charged_amount),
                    'failure_reason': reason,
                    'payment_method': 'M-Pesa'
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending failure notification: {e}")
    
    def _generate_receipt(self, transaction):
        """
        Generate receipt for successful payment
        """
        try:
            from .receipt_service import ReceiptService
            receipt_result = ReceiptService.generate_and_send_receipt(transaction)
            if receipt_result['receipt']:
                logger.info(f"Receipt generated for M-Pesa transaction: {transaction.transaction_reference}")
        except Exception as e:
            logger.error(f"Error generating receipt for M-Pesa transaction: {e}")


# Utility functions for URL routing
def stk_push_callback(request):
    """Wrapper for STK push callback"""
    handler = MpesaWebhookHandler()
    return handler.post(request, 'stk_push')


def c2b_validation(request):
    """Wrapper for C2B validation"""
    handler = MpesaWebhookHandler()
    return handler.post(request, 'c2b_validation')


def c2b_confirmation(request):
    """Wrapper for C2B confirmation"""
    handler = MpesaWebhookHandler()
    return handler.post(request, 'c2b_confirmation')


# Class-based views for Swagger documentation
class StkPushWebhookView(View):
    """
    STK Push Webhook Endpoint
    
    Handles M-Pesa STK push payment callbacks for automatic payment processing.
    """
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="M-Pesa STK Push Webhook",
        operation_description="""
        Webhook endpoint for M-Pesa STK Push payment callbacks.
        
        **Purpose:**
        - Receives payment confirmations from M-Pesa
        - Automatically processes successful payments
        - Updates transaction and booking status
        - Triggers notifications and receipt generation
        
        **Automatic Processing:**
        1. Validates webhook payload
        2. Processes payment callback data
        3. Updates transaction status
        4. Confirms booking
        5. Creates payout record
        6. Sends notifications
        7. Generates receipt
        
        **Security:**
        - CSRF exempt (external webhook)
        - Signature validation recommended for production
        - Request logging for audit trail
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='M-Pesa STK Push callback payload',
            example={
                "Body": {
                    "stkCallback": {
                        "MerchantRequestID": "12345-67890-1",
                        "CheckoutRequestID": "ws_co_123456789",
                        "ResultCode": 0,
                        "ResultDesc": "The service request is processed successfully.",
                        "CallbackMetadata": {
                            "Item": [
                                {"Name": "Amount", "Value": 15000},
                                {"Name": "MpesaReceiptNumber", "Value": "QDJ9J3W45H"},
                                {"Name": "PhoneNumber", "Value": "254712345678"},
                                {"Name": "TransactionDate", "Value": "20240101120000"}
                            ]
                        }
                    }
                }
            }
        ),
        responses={
            200: openapi.Response(
                description='Webhook processed successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='success')
                    }
                )
            ),
            400: 'Bad Request - Invalid webhook payload',
            500: 'Internal Server Error'
        },
        tags=['Webhooks']
    )
    def post(self, request):
        """Handle STK push webhook"""
        handler = MpesaWebhookHandler()
        return handler.post(request, 'stk_push')


class C2BValidationWebhookView(View):
    """
    C2B Validation Webhook Endpoint
    
    Handles M-Pesa C2B validation requests for offline payment processing.
    """
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="M-Pesa C2B Validation Webhook",
        operation_description="""
        Webhook endpoint for M-Pesa C2B validation requests.
        
        **Purpose:**
        - Validates C2B offline payment requests
        - Confirms business details with platform
        - Returns validation response to M-Pesa
        
        **Automatic Validation:**
        1. Receives validation request from M-Pesa
        2. Validates payment details
        3. Checks booking reference
        4. Returns validation response
        5. Logs validation for audit
        
        **Response Codes:**
        - 0: Accept payment
        - 1: Reject payment
        
        **Security:**
        - CSRF exempt (external webhook)
        - Request validation
        - Audit logging
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='M-Pesa C2B validation request payload',
            example={
                "TransactionType": "Pay Bill",
                "TransID": "QDJ9J3W45H",
                "TransTime": "20240101120000",
                "TransAmount": "150.00",
                "BusinessShortCode": "174379",
                "BillRefNumber": "RUMI-INITIAL-123-abc12345",
                "InvoiceNumber": "",
                "OrgAccountBalance": "",
                "ThirdPartyTransID": "",
                "MSISDN": "254712345678",
                "FirstName": "John",
                "MiddleName": "",
                "LastName": "Doe"
            }
        ),
        responses={
            200: openapi.Response(
                description='Validation response',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'ResultCode': openapi.Schema(type=openapi.TYPE_STRING, example='0'),
                        'ResultDesc': openapi.Schema(type=openapi.TYPE_STRING, example='Accepted'),
                        'ThirdPartyTransID': openapi.Schema(type=openapi.TYPE_STRING, example='C2B-123456789')
                    }
                )
            ),
            400: 'Bad Request - Invalid validation payload',
            500: 'Internal Server Error'
        },
        tags=['Webhooks']
    )
    def post(self, request):
        """Handle C2B validation webhook"""
        handler = MpesaWebhookHandler()
        return handler.post(request, 'c2b_validation')


class C2BConfirmationWebhookView(View):
    """
    C2B Confirmation Webhook Endpoint
    
    Handles M-Pesa C2B confirmation for automatic payment processing.
    """
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="M-Pesa C2B Confirmation Webhook",
        operation_description="""
        Webhook endpoint for M-Pesa C2B confirmation requests.
        
        **Purpose:**
        - Receives C2B offline payment confirmations
        - Automatically creates transactions
        - Updates booking status
        - Processes payouts
        
        **Automatic Processing:**
        1. Receives confirmation from M-Pesa
        2. Parses transaction details
        3. Creates transaction record
        4. Updates booking status
        5. Creates payout record
        6. Sends notifications
        7. Generates receipt
        
        **No Manual Intervention:**
        - Complete automation
        - Real-time processing
        - Instant booking confirmation
        
        **Security:**
        - CSRF exempt (external webhook)
        - Request validation
        - Transaction verification
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='M-Pesa C2B confirmation payload',
            example={
                "TransactionType": "Pay Bill",
                "TransID": "QDJ9J3W45H",
                "TransTime": "20240101120000",
                "TransAmount": "150.00",
                "BusinessShortCode": "174379",
                "BillRefNumber": "RUMI-INITIAL-123-abc12345",
                "InvoiceNumber": "",
                "OrgAccountBalance": "",
                "ThirdPartyTransID": "",
                "MSISDN": "254712345678",
                "FirstName": "John",
                "MiddleName": "",
                "LastName": "Doe"
            }
        ),
        responses={
            200: openapi.Response(
                description='Confirmation processed successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'ResultCode': openapi.Schema(type=openapi.TYPE_STRING, example='0'),
                        'ResultDesc': openapi.Schema(type=openapi.TYPE_STRING, example='Confirmation received'),
                        'ThirdPartyTransID': openapi.Schema(type=openapi.TYPE_STRING, example='QDJ9J3W45H')
                    }
                )
            ),
            400: 'Bad Request - Invalid confirmation payload',
            500: 'Internal Server Error'
        },
        tags=['Webhooks']
    )
    def post(self, request):
        """Handle C2B confirmation webhook"""
        handler = MpesaWebhookHandler()
        return handler.post(request, 'c2b_confirmation')