import hashlib
import hmac
import json
import uuid
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from accounts.models import StudentProfile, LandlordProfile, User
from accounts.permissions import IsStudent, IsLandlord, IsAdminOrSuperAdmin, IsVerifiedLandlord
from hostels.models import Booking

from .models import (
    Transaction, SavedPaymentMethod, RecurringPayment, LateFeeCharge,
    TaxReport, PaystackSubaccount, Payout, RefundRequest, RevenueAnalytics
)
from .serializers import (
    TransactionSerializer, SavedPaymentMethodSerializer, RecurringPaymentSerializer,
    LateFeeChargeSerializer, TaxReportSerializer, PaystackSubaccountSerializer,
    PayoutSerializer, RefundRequestSerializer, RevenueAnalyticsSerializer
)
from .tasks import charge_saved_payment_method


class PaymentInitializeView(APIView):
    """
    Initialize payment and get Paystack payment link
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        payment_type = request.data.get('payment_type', 'initial')  # initial or late_fee

        if not booking_id:
            return Response({
                'error': 'Booking ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get booking
        from hostels.models import Booking
        try:
            booking = Booking.objects.select_related(
                'student__user', 'room__hostel__landlord'
            ).get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user.role == 'student':
            if booking.student.user != request.user:
                return Response({
                    'error': 'You can only initiate payments for your own bookings'
                }, status=status.HTTP_403_FORBIDDEN)
        elif not request.user.role in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Unauthorized to initiate this payment'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if payment already exists
        if hasattr(booking, 'payment_transaction') and booking.payment_transaction.status == 'success':
            return Response({
                'error': 'Payment has already been completed for this booking'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Calculate amounts
                if payment_type == 'late_fee':
                    # Handle late fee payment
                    late_fee_id = request.data.get('late_fee_id')
                    try:
                        late_fee = LateFeeCharge.objects.get(
                            id=late_fee_id,
                            booking=booking,
                            status='pending'
                        )
                    except LateFeeCharge.DoesNotExist:
                        return Response({
                            'error': 'Late fee not found or already paid'
                        }, status=status.HTTP_404_NOT_FOUND)

                    amount = late_fee.late_fee_amount
                    transaction_type = 'late_fee'
                else:
                    # Regular booking payment
                    amount = booking.total_amount - booking.amount_paid
                    transaction_type = 'initial'

                # Create transaction record
                transaction_ref = f"RUMI-{transaction_type.upper()}-{booking.id}-{uuid.uuid4().hex[:8]}"

                transaction_obj = Transaction.objects.create(
                    booking=booking,
                    student=booking.student,
                    landlord=booking.room.hostel.landlord,
                    transaction_reference=transaction_ref,
                    transaction_type=transaction_type,
                    payment_plan='monthly',
                    base_rent=booking.monthly_rent if transaction_type == 'initial' else amount,
                    student_service_fee=booking.monthly_rent * Decimal('0.02') if transaction_type == 'initial' else Decimal('0.00'),
                    total_charged_amount=amount,
                    landlord_payout_amount=booking.monthly_rent if transaction_type == 'initial' else Decimal('0.00'),
                    gross_platform_revenue=booking.monthly_rent * Decimal('0.02') if transaction_type == 'initial' else Decimal('0.00'),
                    status='pending'
                )

                # Initialize Paystack payment
                paystack_data = self._initialize_paystack_payment(transaction_obj, request.user)

                return Response({
                    'transaction_id': transaction_obj.id,
                    'transaction_reference': transaction_ref,
                    'amount': float(amount),
                    'paystack_checkout_url': paystack_data['checkout_url'],
                    'expires_at': paystack_data['expires_at']
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Payment initialization failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _initialize_paystack_payment(self, transaction, user):
        """
        Initialize payment with Paystack API
        """
        import requests

        paystack_secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
        paystack_url = 'https://api.paystack.co/transaction/initialize'

        headers = {
            'Authorization': f'Bearer {paystack_secret}',
            'Content-Type': 'application/json'
        }

        data = {
            'email': user.email,
            'amount': int(transaction.total_charged_amount * 100),  # Convert to kobo
            'reference': transaction.transaction_reference,
            'callback_url': f"{getattr(settings, 'FRONTEND_URL', 'https://rumi.co.ke')}/payment/callback",
            'metadata': {
                'transaction_id': transaction.id,
                'booking_id': transaction.booking.id,
                'user_id': user.id
            }
        }

        response = requests.post(paystack_url, json=data, headers=headers)

        if response.status_code == 200:
            result = response.json()
            return {
                'checkout_url': result['data']['authorization_url'],
                'reference': result['data']['reference'],
                'expires_at': timezone.now() + timezone.timedelta(hours=1)
            }
        else:
            raise Exception(f"Paystack initialization failed: {response.text}")


class StudentTransactionListView(APIView):
    """
    List student's payment transactions
    """
    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user.student_profile

        # Filters
        status_filter = request.query_params.get('status')
        transaction_type = request.query_params.get('type')
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        queryset = Transaction.objects.filter(student=student)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)

        total_transactions = queryset.count()
        transactions = queryset.order_by('-initiated_at')[offset:offset + limit]

        serializer = TransactionSerializer(transactions, many=True)

        return Response({
            'total_transactions': total_transactions,
            'transactions': serializer.data
        }, status=status.HTTP_200_OK)


class StudentTransactionDetailView(APIView):
    """
    Get student's transaction details
    """
    permission_classes = [IsStudent]

    def get(self, request, transaction_id):
        student = request.user.student_profile

        try:
            transaction = Transaction.objects.select_related(
                'booking__room__hostel', 'student__user', 'landlord__user'
            ).get(id=transaction_id, student=student)
        except Transaction.DoesNotExist:
            return Response({
                'error': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LandlordTransactionListView(APIView):
    """
    List landlord's payment transactions (payouts received)
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        landlord = request.user.landlord_profile

        # Filters
        status_filter = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        queryset = Transaction.objects.filter(landlord=landlord, status='success')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        total_transactions = queryset.count()
        transactions = queryset.order_by('-paid_at')[offset:offset + limit]

        # Add payout information
        data = []
        for transaction in transactions:
            serializer = TransactionSerializer(transaction)
            transaction_data = serializer.data

            # Get payout details
            try:
                payout = transaction.payout
                transaction_data['payout'] = PayoutSerializer(payout).data
            except Payout.DoesNotExist:
                transaction_data['payout'] = None

            data.append(transaction_data)

        return Response({
            'total_transactions': total_transactions,
            'transactions': data
        }, status=status.HTTP_200_OK)


class LandlordPayoutListView(APIView):
    """
    List landlord's payouts
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        landlord = request.user.landlord_profile

        # Filters
        status_filter = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        queryset = Payout.objects.filter(landlord=landlord)

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        total_payouts = queryset.count()
        payouts = queryset.order_by('-initiated_at')[offset:offset + limit]

        serializer = PayoutSerializer(payouts, many=True)

        return Response({
            'total_payouts': total_payouts,
            'payouts': serializer.data
        }, status=status.HTTP_200_OK)


class AdminTransactionListView(APIView):
    """
    Admin view of all transactions
    """
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        # Filters
        status_filter = request.query_params.get('status')
        transaction_type = request.query_params.get('type')
        landlord_id = request.query_params.get('landlord_id')
        student_id = request.query_params.get('student_id')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))

        queryset = Transaction.objects.select_related(
            'booking__room__hostel', 'student__user', 'landlord__user'
        ).all()

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if landlord_id:
            queryset = queryset.filter(landlord_id=landlord_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        total_transactions = queryset.count()
        transactions = queryset.order_by('-initiated_at')[offset:offset + limit]

        serializer = TransactionSerializer(transactions, many=True)

        return Response({
            'total_transactions': total_transactions,
            'transactions': serializer.data
        }, status=status.HTTP_200_OK)


class RefundRequestCreateView(APIView):
    """
    Create refund request (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request):
        transaction_id = request.data.get('transaction_id')
        reason = request.data.get('reason')
        additional_notes = request.data.get('additional_notes', '')

        if not transaction_id or not reason:
            return Response({
                'error': 'Transaction ID and reason are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if reason not in ['early_cancellation', 'room_unavailable', 'platform_error']:
            return Response({
                'error': 'Invalid refund reason'
            }, status=status.HTTP_400_BAD_REQUEST)

        student = request.user.student_profile

        try:
            transaction = Transaction.objects.select_related('booking').get(
                id=transaction_id,
                student=student,
                status='success'
            )
        except Transaction.DoesNotExist:
            return Response({
                'error': 'Transaction not found or not eligible for refund'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if refund already requested
        if hasattr(transaction, 'refund_request'):
            return Response({
                'error': 'Refund has already been requested for this transaction'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate refund amount based on reason and time
        refund_percentage = self._calculate_refund_percentage(transaction, reason)
        refund_amount = transaction.total_charged_amount * refund_percentage

        try:
            with transaction.atomic():
                refund_request = RefundRequest.objects.create(
                    transaction=transaction,
                    booking=transaction.booking,
                    student=student,
                    original_amount_paid=transaction.total_charged_amount,
                    refund_amount=refund_amount,
                    refund_percentage=refund_percentage * 100,
                    refund_reason=reason,
                    status='pending'
                )

                # Notify admins (async)
                from notifications.tasks import send_notification
                send_notification.delay(
                    recipient_id=1,  # Admin notification
                    notification_type='refund_request_submitted',
                    channel='email',
                    context={
                        'student_name': request.user.get_full_name(),
                        'transaction_reference': transaction.transaction_reference,
                        'refund_amount': float(refund_amount),
                        'reason': reason
                    }
                )

                serializer = RefundRequestSerializer(refund_request)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Refund request creation failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _calculate_refund_percentage(self, transaction, reason):
        """
        Calculate refund percentage based on reason and time elapsed
        """
        days_since_payment = (timezone.now().date() - transaction.paid_at.date()).days

        if reason == 'platform_error':
            return Decimal('1.0')  # 100% refund
        elif reason == 'room_unavailable':
            return Decimal('1.0')  # 100% refund
        elif reason == 'early_cancellation':
            if days_since_payment <= 7:
                return Decimal('0.9')  # 90% refund
            elif days_since_payment <= 30:
                return Decimal('0.7')  # 70% refund
            else:
                return Decimal('0.5')  # 50% refund
        else:
            return Decimal('0.0')


class RefundRequestListView(APIView):
    """
    List refund requests (Student view or Admin view)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role == 'student':
            # Student view - their own requests
            student = request.user.student_profile
            queryset = RefundRequest.objects.filter(student=student)
        elif request.user.role in ['tech_support', 'super_admin']:
            # Admin view - all requests
            status_filter = request.query_params.get('status')
            queryset = RefundRequest.objects.all()
            if status_filter:
                queryset = queryset.filter(status=status_filter)
        else:
            return Response({
                'error': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_requests = queryset.count()
        requests = queryset.select_related(
            'transaction', 'booking', 'student__user'
        ).order_by('-requested_at')[offset:offset + limit]

        serializer = RefundRequestSerializer(requests, many=True)

        return Response({
            'total_requests': total_requests,
            'refund_requests': serializer.data
        }, status=status.HTTP_200_OK)


class RefundRequestProcessView(APIView):
    """
    Process refund request (Admin only)
    """
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request, refund_id):
        action = request.data.get('action')  # 'approve' or 'reject'
        admin_notes = request.data.get('admin_notes', '')

        if action not in ['approve', 'reject']:
            return Response({
                'error': 'Action must be approve or reject'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            refund_request = RefundRequest.objects.select_related(
                'transaction', 'student__user'
            ).get(id=refund_id)
        except RefundRequest.DoesNotExist:
            return Response({
                'error': 'Refund request not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if refund_request.status != 'pending':
            return Response({
                'error': 'Refund request has already been processed'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                if action == 'approve':
                    refund_request.status = 'approved'
                    refund_request.approved_at = timezone.now()
                    refund_request.save()

                    # Process refund (mock for now)
                    self._process_refund(refund_request)

                    refund_request.status = 'completed'
                    refund_request.processed_at = timezone.now()
                    refund_request.completed_at = timezone.now()
                    refund_request.save()

                else:  # reject
                    refund_request.status = 'rejected'
                    refund_request.save()

                # Notify student
                from notifications.tasks import send_notification
                send_notification.delay(
                    recipient_id=refund_request.student.user.id,
                    notification_type='refund_request_processed',
                    channel='email',
                    context={
                        'student_name': refund_request.student.user.first_name,
                        'refund_amount': float(refund_request.refund_amount),
                        'action': action,
                        'admin_notes': admin_notes
                    }
                )

                serializer = RefundRequestSerializer(refund_request)
                return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Refund processing failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _process_refund(self, refund_request):
        """
        Process actual refund via Paystack
        """
        # Mock refund processing - in production, call Paystack refund API
        import time
        time.sleep(1)  # Simulate processing time


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def paystack_webhook(request):
    """
    Handle Paystack webhook callbacks
    """
    # Get the secret key
    paystack_secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '').encode()

    # Get the signature from headers
    signature = request.headers.get('x-paystack-signature')

    if not signature:
        return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

    # Get raw body
    body = request.body

    # Verify signature
    computed_signature = hmac.new(paystack_secret, body, hashlib.sha512).hexdigest()

    if not hmac.compare_digest(computed_signature, signature):
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = json.loads(body)
        event = payload.get('event')

        # Handle different event types
        if event == 'charge.success':
            return _handle_charge_success(payload['data'])
        elif event == 'charge.failure':
            return _handle_charge_failure(payload['data'])
        else:
            # Log unhandled events
            print(f"Unhandled webhook event: {event}")
            return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Webhook processing error: {e}")
        return Response({'error': 'Processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _handle_charge_success(data):
    """
    Handle successful payment webhook
    """
    reference = data.get('reference')

    if not reference:
        return Response({'error': 'Missing reference'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        transaction = Transaction.objects.select_related(
            'booking', 'student', 'landlord'
        ).get(transaction_reference=reference)

        if transaction.status == 'success':
            return Response({'status': 'already_processed'}, status=status.HTTP_200_OK)

        with transaction.atomic():
            # Update transaction
            transaction.status = 'success'
            transaction.paystack_reference = data.get('id')
            transaction.paid_at = timezone.now()
            transaction.gateway_fee = Decimal(str(data.get('fees', 0))) / 100  # Convert from kobo to KES
            transaction.net_platform_revenue = transaction.gross_platform_revenue - transaction.gateway_fee
            transaction.metadata = data
            transaction.save()

            # Update booking status
            booking = transaction.booking
            booking.status = 'confirmed'
            booking.amount_paid += transaction.total_charged_amount
            booking.save()

            # Create payout record for landlord
            if transaction.transaction_type == 'initial':
                Payout.objects.create(
                    transaction=transaction,
                    landlord=transaction.landlord,
                    subaccount=transaction.landlord.paystack_subaccount if hasattr(transaction.landlord, 'paystack_subaccount') else None,
                    payout_reference=f"PAYOUT-{transaction.id}-{uuid.uuid4().hex[:8]}",
                    gross_amount=transaction.landlord_payout_amount,
                    commission_deducted=Decimal('0.00'),  # No commission in new model
                    net_payout_amount=transaction.landlord_payout_amount,
                    status='pending'
                )

            # Create recurring payment if initial payment
            if transaction.transaction_type == 'initial':
                # Check if saved payment method exists
                try:
                    saved_method = SavedPaymentMethod.objects.get(
                        student=transaction.student,
                        is_default=True
                    )
                    RecurringPayment.objects.create(
                        booking=booking,
                        student=transaction.student,
                        saved_payment_method=saved_method,
                        rent_amount=booking.monthly_rent,
                        next_payment_date=booking.move_in_date + timezone.timedelta(days=30) if booking.move_in_date else timezone.now().date() + timezone.timedelta(days=30)
                    )
                except SavedPaymentMethod.DoesNotExist:
                    pass  # No recurring payment setup

            # Send success notifications
            from notifications.tasks import send_notification
            send_notification.delay(
                recipient_id=transaction.student.user.id,
                notification_type='payment_success',
                channel='email',
                context={
                    'student_name': transaction.student.user.first_name,
                    'amount': float(transaction.total_charged_amount),
                    'transaction_reference': transaction.transaction_reference
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
                    'student_name': transaction.student.user.first_name
                }
            )

        return Response({'status': 'success'}, status=status.HTTP_200_OK)

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)


def _handle_charge_failure(data):
    """
    Handle failed payment webhook
    """
    reference = data.get('reference')

    if not reference:
        return Response({'error': 'Missing reference'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        transaction = Transaction.objects.get(transaction_reference=reference)

        if transaction.status == 'failed':
            return Response({'status': 'already_processed'}, status=status.HTTP_200_OK)

        # Update transaction
        transaction.status = 'failed'
        transaction.failed_at = timezone.now()
        transaction.metadata = data
        transaction.save()

        # Send failure notification
        from notifications.tasks import send_notification
        send_notification.delay(
            recipient_id=transaction.student.user.id,
            notification_type='payment_failed',
            channel='email',
            context={
                'student_name': transaction.student.user.first_name,
                'amount': float(transaction.total_charged_amount),
                'failure_reason': data.get('message', 'Unknown error')
            }
        )

        return Response({'status': 'failure_handled'}, status=status.HTTP_200_OK)

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)


class PaymentReceiptView(APIView):
    """
    Get payment receipt for a transaction
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            transaction = Transaction.objects.select_related(
                'booking__room__hostel', 'student__user', 'landlord__user'
            ).get(id=transaction_id)
        except Transaction.DoesNotExist:
            return Response({
                'error': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user.role == 'student':
            if transaction.student.user != request.user:
                return Response({
                    'error': 'You can only view your own receipts'
                }, status=status.HTTP_403_FORBIDDEN)
        elif not request.user.role in ['tech_support', 'super_admin']:
            if transaction.landlord.user != request.user:
                return Response({
                    'error': 'Unauthorized to view this receipt'
                }, status=status.HTTP_403_FORBIDDEN)

        # Generate receipt data
        receipt_data = {
            'transaction_reference': transaction.transaction_reference,
            'paystack_reference': transaction.paystack_reference,
            'student': {
                'name': transaction.student.user.get_full_name(),
                'email': transaction.student.user.email
            },
            'landlord': {
                'name': transaction.landlord.business_name or transaction.landlord.user.get_full_name(),
                'email': transaction.landlord.user.email
            },
            'booking': {
                'reference': transaction.booking.booking_reference,
                'hostel': transaction.booking.room.hostel.name,
                'room': transaction.booking.room.room_number,
                'check_in_date': transaction.booking.check_in_date,
                'check_out_date': transaction.booking.check_out_date
            },
            'payment_details': {
                'type': transaction.transaction_type,
                'base_rent': float(transaction.base_rent),
                'service_fee': float(transaction.student_service_fee),
                'total_charged': float(transaction.total_charged_amount),
                'landlord_payout': float(transaction.landlord_payout_amount),
                'status': transaction.status,
                'paid_at': transaction.paid_at.isoformat() if transaction.paid_at else None
            },
            'platform_fees': {
                'service_fee': float(transaction.gross_platform_revenue),
                'gateway_fee': float(transaction.gateway_fee) if transaction.gateway_fee else 0,
                'net_revenue': float(transaction.net_platform_revenue) if transaction.net_platform_revenue else 0
            }
        }

        return Response(receipt_data, status=status.HTTP_200_OK)


class SavedPaymentMethodsView(APIView):
    """
    Manage saved payment methods (Student only)
    """
    permission_classes = [IsStudent]

    def get(self, request):
        """List student's saved payment methods"""
        student = request.user.student_profile
        payment_methods = SavedPaymentMethod.objects.filter(student=student).order_by('-created_at')
        serializer = SavedPaymentMethodSerializer(payment_methods, many=True)
        return Response({'payment_methods': serializer.data})

    def post(self, request):
        """Add new payment method"""
        student = request.user.student_profile

        # Paystack integration to tokenize card
        paystack_secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
        paystack_url = 'https://api.paystack.co/charge/authorize'

        headers = {
            'Authorization': f'Bearer {paystack_secret}',
            'Content-Type': 'application/json'
        }

        data = {
            'email': request.user.email,
            'amount': 5000,  # Small amount for tokenization (KES 50)
            'authorization_code': request.data.get('authorization_code')
        }

        # For now, return success (implement full Paystack integration as needed)
        try:
            saved_method = SavedPaymentMethod.objects.create(
                student=student,
                authorization_code=request.data.get('authorization_code'),
                card_type=request.data.get('card_type', 'visa'),
                last_four=request.data.get('last_four'),
                expiry_month=request.data.get('expiry_month'),
                expiry_year=request.data.get('expiry_year'),
                is_default=not SavedPaymentMethod.objects.filter(student=student).exists()  # First method is default
            )
            serializer = SavedPaymentMethodSerializer(saved_method)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RecurringPaymentEnableView(APIView):
    """
    Enable recurring payments for a booking (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        payment_method_id = request.data.get('payment_method_id')

        if not booking_id or not payment_method_id:
            return Response({
                'error': 'Booking ID and payment method ID are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        student = request.user.student_profile

        try:
            booking = Booking.objects.get(id=booking_id, student=student)
            payment_method = SavedPaymentMethod.objects.get(id=payment_method_id, student=student)
        except (Booking.DoesNotExist, SavedPaymentMethod.DoesNotExist):
            return Response({'error': 'Invalid booking or payment method'}, status=status.HTTP_404_NOT_FOUND)

        # Check if recurring payment already exists
        if hasattr(booking, 'recurring_payment'):
            return Response({'error': 'Recurring payment already exists for this booking'}, status=status.HTTP_400_BAD_REQUEST)

        # Create recurring payment
        recurring_payment = RecurringPayment.objects.create(
            booking=booking,
            student=student,
            saved_payment_method=payment_method,
            rent_amount=booking.monthly_rent,
            next_payment_date=booking.move_in_date + timezone.timedelta(days=30) if booking.move_in_date else timezone.now().date() + timezone.timedelta(days=30),
            status='active'
        )

        serializer = RecurringPaymentSerializer(recurring_payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RevenueAnalyticsView(APIView):
    """
    Platform revenue analytics (Admin only)
    """
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        # Get date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            # Default to current month
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = today

        # Aggregate revenue data
        revenue_data = Transaction.objects.filter(
            paid_at__date__range=[start_date, end_date],
            status='success'
        ).aggregate(
            total_revenue=Sum('gross_platform_revenue'),
            total_transactions=Count('id'),
            total_volume=Sum('total_charged_amount'),
            gateway_fees=Sum('gateway_fee')
        )

        # Monthly breakdown
        monthly_data = Transaction.objects.filter(
            paid_at__date__range=[start_date, end_date],
            status='success'
        ).annotate(
            month=TruncMonth('paid_at')
        ).values('month').annotate(
            revenue=Sum('gross_platform_revenue'),
            transactions=Count('id'),
            volume=Sum('total_charged_amount')
        ).order_by('month')

        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'summary': {
                'total_revenue': float(revenue_data['total_revenue'] or 0),
                'total_transactions': revenue_data['total_transactions'] or 0,
                'total_volume': float(revenue_data['total_volume'] or 0),
                'gateway_fees': float(revenue_data['gateway_fees'] or 0),
                'net_revenue': float((revenue_data['total_revenue'] or 0) - (revenue_data['gateway_fees'] or 0))
            },
            'monthly_breakdown': list(monthly_data)
        })


class TaxReportsView(APIView):
    """
    View tax reports (Landlord only)
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        landlord = request.user.landlord_profile

        # Get current year reports
        current_year = timezone.now().year
        tax_reports = TaxReport.objects.filter(
            landlord=landlord,
            tax_year=current_year
        ).order_by('-tax_month')

        serializer = TaxReportSerializer(tax_reports, many=True)
        return Response({
            'tax_year': current_year,
            'reports': serializer.data
        })
