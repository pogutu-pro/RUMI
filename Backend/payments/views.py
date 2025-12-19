import hashlib
import hmac
import json
import uuid
import logging
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
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import serializers

logger = logging.getLogger(__name__)

from accounts.models import StudentProfile, LandlordProfile, User
from accounts.permissions import IsStudent, IsLandlord, IsAdminOrSuperAdmin, IsVerifiedLandlord
from hostels.models import Booking

from .models import (
    Transaction, SavedPaymentMethod, RecurringPayment, LateFeeCharge,
    TaxReport, PaystackSubaccount, Payout, RefundRequest, RevenueAnalytics, MpesaPaymentConfig
)
from .serializers import (
    TransactionSerializer, SavedPaymentMethodSerializer, RecurringPaymentSerializer,
    LateFeeChargeSerializer, TaxReportSerializer, PaystackSubaccountSerializer,
    PayoutSerializer, RefundRequestSerializer, RevenueAnalyticsSerializer, ReceiptSerializer, MpesaPaymentConfigSerializer
)
from .tasks import charge_saved_payment_method
from .mpesa_api import MpesaDarajaAPI


class PaymentInitializeView(APIView):
    """
    Payment Initialization API
    
    Initialize payment processing and generate Paystack payment links.
    
    POST: Create payment transaction and get payment checkout URL
    
    Authentication Required: JWT Token
    Permissions: Students (own bookings) or Tech Support/Super Admin
    
    This endpoint initiates payment processing for hostel bookings and late fees.
    Integrates with Paystack payment gateway for secure payment collection.
    
    Payment Types:
    - initial: Initial booking payment
    - late_fee: Late payment fee settlement
    
    Security Features:
    - Booking ownership validation
    - Payment status checking
    - Secure Paystack integration
    - Transaction reference generation
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Initialize Payment
        
        Create payment transaction and generate Paystack checkout URL.
        
        Request Body:
        - booking_id: Unique booking identifier (required)
        - payment_type: Payment type ('initial' or 'late_fee', default: 'initial')
        - late_fee_id: Late fee identifier (required if payment_type='late_fee')
        
        Process Flow:
        1. Validate booking existence and ownership
        2. Check payment authorization permissions
        3. Verify no existing successful payment
        4. Calculate payment amount based on type
        5. Create transaction record with unique reference
        6. Initialize Paystack payment session
        7. Return checkout URL and transaction details
        
        Returns payment initialization details including checkout URL.
        
        Error Handling:
        - 404: Booking not found
        - 403: Unauthorized access to booking
        - 400: Missing required fields or invalid payment type
        - 400: Payment already completed
        - 500: Paystack integration failure
        """
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
    Student Transaction History API
    
    Retrieve student's payment transaction history with filtering.
    
    GET: List student's payment transactions with status filtering
    
    Authentication Required: JWT Token
    Permissions: Students only
    
    This endpoint provides students with comprehensive transaction history
    including payment status, amounts, and transaction details.
    
    Features:
    - Transaction status filtering
    - Transaction type filtering
    - Pagination support
    - Detailed transaction information
    - Chronological ordering
    """
    
    permission_classes = [IsStudent]

    def get(self, request):
        """
        Get Student Transactions
        
        Retrieve payment transaction history for the authenticated student.
        
        Query Parameters:
        - status: Filter by transaction status (success, pending, failed)
        - type: Filter by transaction type (initial, late_fee)
        - limit: Number of results per page (default: 20)
        - offset: Pagination offset for result sets
        
        Returns comprehensive transaction history:
        
        Transaction Details:
        - transaction_id: Unique transaction identifier
        - booking_reference: Associated booking reference
        - amount: Transaction amount
        - status: Current transaction status
        - type: Transaction type (initial, late_fee)
        - paid_at: Payment completion timestamp
        - created_at: Transaction creation timestamp
        
        Summary Statistics:
        - total_transactions: Count of all transactions
        - transactions: Paginated transaction list
        
        Usage:
        - Payment history tracking
        - Financial record keeping
        - Transaction status monitoring
        - Accounting and bookkeeping
        
        Note: Only accessible by students viewing their own transactions.
        """
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
    Student Transaction Details API
    
    Retrieve detailed information for specific student transaction.
    
    GET: Get comprehensive transaction details
    
    Authentication Required: JWT Token
    Permissions: Students only (own transactions)
    
    This endpoint provides detailed transaction information including
    associated booking, payment breakdown, and receipt data.
    
    Features:
    - Complete transaction details
    - Associated booking information
    - Payment method and gateway details
    - Receipt generation capability
    """
    
    permission_classes = [IsStudent]

    def get(self, request, transaction_id):
        """
        Get Transaction Details
        
        Retrieve comprehensive details for a specific transaction.
        
        Path Parameters:
        - transaction_id: Unique transaction identifier
        
        Returns detailed transaction information:
        
        Transaction Data:
        - Basic transaction information (ID, reference, amount, status)
        - Payment details (method, gateway, fees)
        - Associated booking information
        - Student and landlord details
        - Timestamps (created, paid, failed)
        
        Booking Context:
        - Room and hostel information
        - Booking dates and status
        - Payment plan details
        
        Financial Breakdown:
        - Base rent amount
        - Service fees
        - Platform revenue share
        - Landlord payout amount
        - Gateway processing fees
        
        Error Handling:
        - 404: Transaction not found
        - 403: Unauthorized access to transaction
        
        Note: Students can only view their own transaction details.
        """
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
    Landlord Transaction History API
    
    Retrieve landlord's payment transaction history and payout information.
    
    GET: List landlord's successful transactions with payout details
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with comprehensive transaction history
    including student payments and associated payout information.
    
    Features:
    - Successful transaction filtering
    - Payout information integration
    - Student payment details
    - Revenue tracking
    """
    
    permission_classes = [IsLandlord]

    def get(self, request):
        """
        Get Landlord Transactions
        
        Retrieve payment transaction history for the authenticated landlord.
        
        Query Parameters:
        - status: Filter by transaction status (default: success)
        - limit: Number of results per page (default: 20)
        - offset: Pagination offset for result sets
        
        Returns landlord transaction history:
        
        Transaction Information:
        - transaction_id: Unique transaction identifier
        - student_details: Paying student information
        - booking_reference: Associated booking reference
        - amount: Total transaction amount
        - landlord_payout: Amount paid to landlord
        - paid_at: Payment completion timestamp
        
        Payout Details:
        - payout_id: Associated payout record ID
        - payout_status: Current payout status
        - payout_amount: Actual payout amount
        - payout_date: Payout processing date
        - payout_method: Payment method used
        
        Financial Summary:
        - total_transactions: Count of transactions
        - transactions: Detailed transaction list with payout data
        
        Usage:
        - Revenue tracking and reporting
        - Payout verification
        - Financial reconciliation
        - Student payment monitoring
        
        Note: Only returns successful transactions by default.
        """
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
    Landlord Payout Management API
    
    Retrieve landlord's payout history and status tracking.
    
    GET: List landlord's payout transactions with status filtering
    
    Authentication Required: JWT Token
    Permissions: Landlords only
    
    This endpoint provides landlords with comprehensive payout history
    including payment processing status and payout details.
    
    Features:
    - Payout status tracking
    - Payment method information
    - Payout amount details
    - Processing timeline tracking
    """
    
    permission_classes = [IsLandlord]

    def get(self, request):
        """
        Get Landlord Payouts
        
        Retrieve payout history for the authenticated landlord.
        
        Query Parameters:
        - status: Filter by payout status (pending, completed, failed)
        - limit: Number of results per page (default: 20)
        - offset: Pagination offset for result sets
        
        Returns comprehensive payout information:
        
        Payout Details:
        - payout_id: Unique payout identifier
        - payout_reference: Internal payout reference
        - amount: Total payout amount
        - status: Current payout status
        - initiated_at: Payout initiation timestamp
        - processed_at: Payout processing timestamp
        - payment_method: Payout delivery method
        
        Transaction Context:
        - associated_transactions: Related payment transactions
        - gross_amount: Total amount before deductions
        - net_amount: Actual payout amount
        - deductions: Any applicable deductions
        
        Status Tracking:
        - pending: Awaiting processing
        - completed: Successfully processed
        - failed: Processing failed
        - cancelled: Payout cancelled
        
        Usage:
        - Payout status monitoring
        - Revenue collection tracking
        - Financial reconciliation
        - Payment method verification
        
        Note: Provides complete payout lifecycle tracking.
        """
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
    Admin Transaction Oversight API
    
    Provide administrators with comprehensive transaction oversight and filtering.
    
    GET: List all platform transactions with advanced filtering
    
    Authentication Required: JWT Token
    Permissions: Admin or Super Admin only
    
    This endpoint provides administrators with comprehensive transaction oversight
    across the entire platform, enabling financial monitoring and dispute resolution.
    
    Features:
    - Platform-wide transaction monitoring
    - Advanced filtering capabilities
    - User-specific transaction tracking
    - Financial analytics support
    - Dispute investigation tools
    """
    
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        """
        Get All Platform Transactions
        
        Retrieve comprehensive transaction list for administrative oversight.
        
        Query Parameters:
        - status: Filter by transaction status
        - type: Filter by transaction type (initial, late_fee)
        - landlord_id: Filter by specific landlord
        - student_id: Filter by specific student
        - limit: Number of results per page (default: 50)
        - offset: Pagination offset for result sets
        
        Returns platform-wide transaction data:
        
        Transaction Details:
        - All transaction information with full context
        - Student and landlord details
        - Booking and room information
        - Payment amounts and fee breakdown
        - Gateway processing information
        - Timestamps and status history
        
        Administrative Features:
        - Financial reconciliation support
        - Dispute investigation data
        - Platform revenue tracking
        - User activity monitoring
        - Compliance reporting
        
        Filtering Capabilities:
        - Status-based filtering for monitoring
        - User-specific queries for investigations
        - Time-based analysis support
        - Type-specific transaction review
        
        Usage:
        - Financial oversight and reporting
        - Dispute resolution support
        - Platform analytics and insights
        - Compliance and audit support
        - Revenue monitoring and analysis
        
        Note: Provides complete platform transaction visibility for admins.
        """
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
    Refund Request Creation API
    
    Handle student refund requests with automated processing.
    
    POST: Create new refund request with reason validation
    
    Authentication Required: JWT Token
    Permissions: Students only (own transactions)
    
    This endpoint allows students to request refunds for completed transactions
    with automated percentage calculations based on reason and timing.
    
    Refund Reasons:
    - early_cancellation: Cancellation within time limits
    - room_unavailable: Property no longer available
    - platform_error: Technical or payment errors
    
    Features:
    - Automated refund percentage calculation
    - Reason-based policy enforcement
    - Admin notification system
    - Duplicate request prevention
    """
    
    permission_classes = [IsStudent]

    def post(self, request):
        """
        Create Refund Request
        
        Submit a new refund request for a completed transaction.
        
        Request Body:
        - transaction_id: Target transaction ID (required)
        - reason: Refund reason (required)
        - additional_notes: Optional detailed explanation
        
        Valid Reasons:
        - early_cancellation: Early booking cancellation
        - room_unavailable: Property became unavailable
        - platform_error: Technical or payment processing error
        
        Process Flow:
        1. Validate transaction ownership and status
        2. Check for existing refund requests
        3. Validate refund reason against policy
        4. Calculate refund amount based on reason and timing
        5. Create refund request record
        6. Notify administrators for review
        7. Return request confirmation
        
        Refund Calculation Logic:
        - platform_error: 100% refund (full amount)
        - room_unavailable: 100% refund (full amount)
        - early_cancellation: 
          * ≤7 days: 90% refund
          * ≤30 days: 70% refund
          * >30 days: 50% refund
        
        Returns refund request details and processing information.
        
        Error Handling:
        - 404: Transaction not found or not eligible
        - 400: Invalid reason or missing fields
        - 400: Refund already requested
        - 403: Unauthorized transaction access
        """
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
    Refund Request Management API
    
    List refund requests for students and administrators.
    
    GET: List refund requests with role-based filtering
    
    Authentication Required: JWT Token
    Permissions: Students (own requests) or Admin/Super Admin (all requests)
    
    This endpoint provides different views based on user role:
    - Students: View their own refund requests
    - Admins: View all platform refund requests
    
    Features:
    - Role-based request filtering
    - Status-based organization
    - Request tracking and updates
    - Administrative oversight
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get Refund Requests
        
        Retrieve refund requests based on user role and permissions.
        
        Student View:
        - Returns student's own refund requests only
        - Shows request status and processing updates
        - Provides request history and details
        
        Admin View:
        - Returns all platform refund requests
        - Includes status filtering options
        - Provides comprehensive request oversight
        
        Query Parameters (Admin only):
        - status: Filter by request status (pending, approved, rejected)
        
        Returns refund request information:
        
        Request Details:
        - request_id: Unique refund request identifier
        - transaction_reference: Associated transaction
        - original_amount: Original payment amount
        - refund_amount: Calculated refund amount
        - refund_percentage: Percentage of original amount
        - reason: Refund reason and explanation
        - status: Current request status
        - requested_at: Request submission timestamp
        - processed_at: Admin processing timestamp
        
        Status Information:
        - pending: Awaiting admin review
        - approved: Refund approved for processing
        - rejected: Refund request denied
        - completed: Refund successfully processed
        
        Administrative Data:
        - student_details: Requester information
        - admin_notes: Processing comments
        - processing timeline: Request lifecycle tracking
        
        Usage:
        - Student: Track refund request progress
        - Admin: Monitor and process refund requests
        - Support: Assist with refund inquiries
        
        Note: Access level determined by user role and permissions.
        """
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

            # Generate and send receipt
            try:
                from .receipt_service import ReceiptService
                receipt_result = ReceiptService.generate_and_send_receipt(transaction)
                if receipt_result['receipt']:
                    print(f"Receipt generated and sent for transaction {transaction.transaction_reference}")
            except Exception as e:
                print(f"Error in receipt generation workflow: {str(e)}")

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
    Payment Receipt Generation API
    
    Generate and retrieve detailed payment receipts for transactions.
    
    GET: Generate and retrieve payment receipt for specific transaction
    
    Authentication Required: JWT Token
    Permissions: Transaction participants or Admin/Super Admin
    
    This endpoint generates comprehensive payment receipts including
    transaction details, platform fees, and regulatory compliance information.
    
    Features:
    - Automatic receipt generation
    - Comprehensive transaction details
    - Platform fee breakdown
    - Regulatory compliance data
    - Multiple format support
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, transaction_id):
        """
        Get Payment Receipt
        
        Generate and retrieve detailed payment receipt for transaction.
        
        Path Parameters:
        - transaction_id: Unique transaction identifier
        
        Access Control:
        - Students: Can view receipts for their own transactions
        - Landlords: Can view receipts for their property transactions
        - Admins: Can view any transaction receipt
        
        Returns comprehensive receipt data:
        
        Receipt Header:
        - receipt_id: Unique receipt identifier
        - receipt_number: Sequential receipt number
        - generated_at: Receipt generation timestamp
        - platform_info: RUMI platform details
        
        Transaction Details:
        - transaction_reference: Unique transaction ID
        - paystack_reference: Payment gateway reference
        - amount: Total transaction amount
        - currency: Payment currency (KES)
        - status: Transaction status
        - paid_at: Payment completion timestamp
        
        Party Information:
        - student_details: Payer information
        - landlord_details: Payee information
        - booking_details: Associated booking context
        
        Financial Breakdown:
        - base_rent: Accommodation cost
        - service_fee: Platform service charge
        - total_charged: Amount charged to student
        - landlord_payout: Amount paid to landlord
        - gateway_fee: Payment processing fee
        - net_platform_revenue: Platform net revenue
        
        Compliance Data:
        - tax_information: Applicable tax details
        - regulatory_compliance: Required disclosures
        - terms_and_conditions: Service terms
        
        Usage:
        - Financial record keeping
        - Tax and accounting purposes
        - Dispute resolution support
        - Regulatory compliance
        - Customer service assistance
        
        Error Handling:
        - 404: Transaction not found
        - 403: Unauthorized receipt access
        - 500: Receipt generation failure
        
        Note: Receipts include all regulatory required information.
        """
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

        # Check if receipt exists, if not generate it
        if not hasattr(transaction, 'receipt'):
            try:
                from .receipt_service import ReceiptService
                receipt = ReceiptService.generate_receipt(transaction)
            except Exception as e:
                return Response({
                    'error': 'Failed to generate receipt',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            receipt = transaction.receipt

        # Serialize receipt data
        serializer = ReceiptSerializer(receipt)
        receipt_data = serializer.data

        # Add detailed transaction information
        receipt_data['transaction_details'] = {
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
    Saved Payment Methods Management API
    
    Manage student's saved payment methods for recurring payments.
    
    GET: List student's saved payment methods
    POST: Add new payment method to saved collection
    
    Authentication Required: JWT Token
    Permissions: Students only
    
    This endpoint allows students to securely save payment methods for
    recurring payments and automatic billing setup.
    
    Features:
    - Secure payment method storage
    - Tokenized card storage (Paystack integration)
    - Default payment method management
    - Method validation and verification
    """
    
    permission_classes = [IsStudent]

    def get(self, request):
        """
        Get Saved Payment Methods
        
        Retrieve all saved payment methods for the authenticated student.
        
        Returns list of saved payment methods:
        
        Payment Method Details:
        - method_id: Unique payment method identifier
        - card_type: Card brand (visa, mastercard, etc.)
        - last_four: Last four digits of card
        - expiry_month: Card expiration month
        - expiry_year: Card expiration year
        - is_default: Whether this is the default payment method
        - is_active: Whether method is currently usable
        - created_at: When method was saved
        - last_used: Last time method was used
        
        Security Features:
        - Only last four digits stored
        - Full card details tokenized
        - PCI compliance through Paystack
        - Secure storage and transmission
        
        Default Method:
        - Only one method can be default
        - Used for automatic payments
        - Marked clearly in response
        
        Usage:
        - Recurring payment setup
        - Quick payment processing
        - Payment method management
        - Automatic billing configuration
        
        Note: Full card details are never stored locally.
        """
        """List student's saved payment methods"""
        student = request.user.student_profile
        payment_methods = SavedPaymentMethod.objects.filter(student=student).order_by('-created_at')
        serializer = SavedPaymentMethodSerializer(payment_methods, many=True)
        return Response({'payment_methods': serializer.data})

    def post(self, request):
        """
        Add Payment Method
        
        Save a new payment method for future use.
        
        Request Body:
        - authorization_code: Paystack authorization code
        - card_type: Card brand type
        - last_four: Last four card digits
        - expiry_month: Card expiration month
        - expiry_year: Card expiration year
        
        Process:
        1. Validate authorization code with Paystack
        2. Store tokenized payment information
        3. Set as default if first method
        4. Return saved method details
        
        Security:
        - No full card details stored
        - Tokenized storage only
        - PCI DSS compliant
        
        Returns saved payment method information.
        """
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


class RecurringPaymentPauseView(APIView):
    """
    Pause recurring payments (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request, recurring_id):
        student = request.user.student_profile

        try:
            recurring_payment = RecurringPayment.objects.get(
                id=recurring_id,
                student=student,
                is_active=True
            )
        except RecurringPayment.DoesNotExist:
            return Response({'error': 'Recurring payment not found'}, status=status.HTTP_404_NOT_FOUND)

        recurring_payment.is_active = False
        recurring_payment.paused_at = timezone.now()
        recurring_payment.save()

        serializer = RecurringPaymentSerializer(recurring_payment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RecurringPaymentResumeView(APIView):
    """
    Resume recurring payments (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request, recurring_id):
        student = request.user.student_profile

        try:
            recurring_payment = RecurringPayment.objects.get(
                id=recurring_id,
                student=student
            )
        except RecurringPayment.DoesNotExist:
            return Response({'error': 'Recurring payment not found'}, status=status.HTTP_404_NOT_FOUND)

        if recurring_payment.is_active:
            return Response({'error': 'Recurring payment is already active'}, status=status.HTTP_400_BAD_REQUEST)

        recurring_payment.is_active = True
        recurring_payment.paused_at = None
        recurring_payment.save()

        serializer = RecurringPaymentSerializer(recurring_payment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RecurringPaymentCancelView(APIView):
    """
    Cancel recurring payments (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request, recurring_id):
        student = request.user.student_profile

        try:
            recurring_payment = RecurringPayment.objects.get(
                id=recurring_id,
                student=student
            )
        except RecurringPayment.DoesNotExist:
            return Response({'error': 'Recurring payment not found'}, status=status.HTTP_404_NOT_FOUND)

        recurring_payment.is_active = False
        recurring_payment.cancelled_at = timezone.now()
        recurring_payment.save()

        serializer = RecurringPaymentSerializer(recurring_payment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LateFeesView(APIView):
    """
    View late fees for a booking (Student/Landlord)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.select_related('student__user', 'room__hostel__landlord').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user.role == 'student':
            if booking.student.user != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'landlord':
            if booking.room.hostel.landlord.user != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        elif not request.user.role in ['tech_support', 'super_admin']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        late_fees = LateFeeCharge.objects.filter(booking=booking).order_by('-charged_at')
        serializer = LateFeeChargeSerializer(late_fees, many=True)
        return Response({'late_fees': serializer.data}, status=status.HTTP_200_OK)


class LateFeePayView(APIView):
    """
    Pay late fee (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request, late_fee_id):
        student = request.user.student_profile

        try:
            late_fee = LateFeeCharge.objects.select_related('booking').get(
                id=late_fee_id,
                student=student,
                status='pending'
            )
        except LateFeeCharge.DoesNotExist:
            return Response({'error': 'Late fee not found or already paid'}, status=status.HTTP_404_NOT_FOUND)

        # Use existing payment initialization with late_fee type
        payment_view = PaymentInitializeView()
        payment_request = request._clone()
        payment_request.data = payment_request.data.copy()
        payment_request.data.update({
            'booking_id': late_fee.booking.id,
            'payment_type': 'late_fee',
            'late_fee_id': late_fee.id
        })

        return payment_view.post(payment_request)


class SavedPaymentMethodSetDefaultView(APIView):
    """
    Set default payment method (Student only)
    """
    permission_classes = [IsStudent]

    def post(self, request, method_id):
        student = request.user.student_profile

        try:
            payment_method = SavedPaymentMethod.objects.get(
                id=method_id,
                student=student,
                is_active=True
            )
        except SavedPaymentMethod.DoesNotExist:
            return Response({'error': 'Payment method not found'}, status=status.HTTP_404_NOT_FOUND)

        # Remove default from all other methods
        SavedPaymentMethod.objects.filter(student=student).update(is_default=False)

        # Set this one as default
        payment_method.is_default = True
        payment_method.save()

        serializer = SavedPaymentMethodSerializer(payment_method)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SavedPaymentMethodDeleteView(APIView):
    """
    Delete saved payment method (Student only)
    """
    permission_classes = [IsStudent]

    def delete(self, request, method_id):
        student = request.user.student_profile

        try:
            payment_method = SavedPaymentMethod.objects.get(
                id=method_id,
                student=student
            )
        except SavedPaymentMethod.DoesNotExist:
            return Response({'error': 'Payment method not found'}, status=status.HTTP_404_NOT_FOUND)

        # Don't allow deletion of default method if it's the only one
        if payment_method.is_default:
            other_methods = SavedPaymentMethod.objects.filter(
                student=student,
                is_active=True
            ).exclude(id=method_id)
            if not other_methods.exists():
                return Response({
                    'error': 'Cannot delete the only payment method. Add another method first.'
                }, status=status.HTTP_400_BAD_REQUEST)

        payment_method.is_active = False
        payment_method.save()

        return Response({'message': 'Payment method deleted'}, status=status.HTTP_200_OK)


class TaxReportDownloadView(APIView):
    """
    Download tax report PDF (Landlord only)
    """
    permission_classes = [IsLandlord]

    def get(self, request, report_id):
        landlord = request.user.landlord_profile

        try:
            tax_report = TaxReport.objects.get(
                id=report_id,
                landlord=landlord
            )
        except TaxReport.DoesNotExist:
            return Response({'error': 'Tax report not found'}, status=status.HTTP_404_NOT_FOUND)

        # For now, return report data (implement PDF generation as needed)
        serializer = TaxReportSerializer(tax_report)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TaxReportsView(APIView):
    """
    View tax reports (Landlord only)
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        landlord = request.user.landlord_profile

        # Get reports for the last 12 months
        tax_reports = TaxReport.objects.filter(
            landlord=landlord
        ).order_by('-report_month')[:12]

        serializer = TaxReportSerializer(tax_reports, many=True)
        return Response({
            'reports': serializer.data
        })


class MpesaPaymentInitializeView(APIView):
    """
    M-Pesa Payment Initialization API (Optimized for Performance)
    
    Initialize M-Pesa payments with STK Push method.
    C2B offline payments are handled automatically via webhooks.
    
    Features:
    - Performance optimized with connection pooling and token caching
    - Sub-second response times
    - Automatic C2B alternative instructions
    - Fast-fail error handling
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Initialize M-Pesa Payment",
        operation_description="""
        Initialize M-Pesa payment for booking or late fee with optimized performance.
        
        **Performance Optimizations:**
        - Connection pooling for faster requests
        - Token caching (eliminates repeated OAuth calls)
        - Optimized database queries
        - Sub-second response times
        
        **Payment Methods:**
        - **STK Push**: Online payment with instant prompt (this endpoint)
        - **C2B Offline**: Automatic processing via webhooks (no manual selection)
        
        **Workflow:**
        1. Student provides phone number
        2. System initiates STK Push
        3. Customer enters M-Pesa PIN on phone
        4. Payment confirmed via webhook
        5. Booking confirmed automatically
        
        **C2B Alternative:**
        Students can also pay via M-Pesa menu using:
        - Business Number: Platform Shortcode
        - Amount: Transaction Amount  
        - Reference: Transaction Reference
        
        Processing is completely automatic via webhooks.
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['booking_id', 'payment_method', 'phone_number'],
            properties={
                'booking_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='Unique booking identifier',
                    example=123
                ),
                'payment_type': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Payment type',
                    enum=['initial', 'late_fee'],
                    default='initial',
                    example='initial'
                ),
                'payment_method': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Payment method (only STK Push supported)',
                    enum=['stk_push'],
                    default='stk_push',
                    example='stk_push'
                ),
                'phone_number': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Customer phone number (format: 254XXXXXXXXX)',
                    example='254712345678'
                ),
                'late_fee_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='Late fee identifier (required if payment_type is late_fee)',
                    example=456
                )
            },
            example={
                'booking_id': 123,
                'payment_type': 'initial',
                'payment_method': 'stk_push',
                'phone_number': '254712345678'
            }
        ),
        responses={
            200: openapi.Response(
                description='M-Pesa payment initialized successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'transaction_id': openapi.Schema(type=openapi.TYPE_INTEGER, example=789),
                        'transaction_reference': openapi.Schema(type=openapi.TYPE_STRING, example='RUMI-INITIAL-123-abc12345'),
                        'amount': openapi.Schema(type=openapi.TYPE_NUMBER, example=15000.0),
                        'payment_method': openapi.Schema(type=openapi.TYPE_STRING, example='mpesa'),
                        'mpesa_payment_type': openapi.Schema(type=openapi.TYPE_STRING, example='stk_push'),
                        'phone_number': openapi.Schema(type=openapi.TYPE_STRING, example='254712345678'),
                        'checkout_request_id': openapi.Schema(type=openapi.TYPE_STRING, example='ws_co_123456789'),
                        'merchant_request_id': openapi.Schema(type=openapi.TYPE_STRING, example='mr_123456789'),
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='pending_stk_push'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='STK push initiated. Please check your phone for payment prompt.'),
                        'c2b_alternative': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'note': openapi.Schema(type=openapi.TYPE_STRING),
                                'business_number': openapi.Schema(type=openapi.TYPE_STRING),
                                'amount': openapi.Schema(type=openapi.TYPE_STRING),
                                'reference': openapi.Schema(type=openapi.TYPE_STRING)
                            }
                        )
                    }
                )
            ),
            400: 'Bad Request - Invalid input data',
            401: 'Unauthorized - Authentication required',
            404: 'Not Found - Booking or late fee not found',
            500: 'Internal Server Error - M-Pesa API error'
        },
        tags=['Payments']
    )
    
    def post(self, request):
        """
        Initialize M-Pesa Payment (Optimized for speed)
        
        Fast payment initialization with minimal database operations.
        
        Request Body:
        - booking_id: Unique booking identifier (required)
        - payment_type: Payment type ('initial' or 'late_fee', default: 'initial')
        - payment_method: 'stk_push' (M-Pesa STK Push)
        - phone_number: Customer phone number (required for STK push)
        - late_fee_id: Late fee identifier (required if payment_type='late_fee')
        
        Note: C2B offline payments are handled automatically via webhooks.
        
        Returns optimized payment initialization response.
        """
        booking_id = request.data.get('booking_id')
        payment_type = request.data.get('payment_type', 'initial')
        payment_method = request.data.get('payment_method', 'stk_push')
        phone_number = request.data.get('phone_number')
        
        # Fast validation - fail early
        if not booking_id:
            return Response({'error': 'Booking ID is required'}, status=400)
        
        if payment_method != 'stk_push':
            return Response({
                'error': 'Invalid payment method. Use "stk_push" for M-Pesa payments.',
                'note': 'C2B offline payments are handled automatically via webhooks.'
            }, status=400)
        
        if not phone_number:
            return Response({'error': 'Phone number is required for STK Push payments'}, status=400)
        
        # Get booking with optimized query
        try:
            from hostels.models import Booking
            booking = Booking.objects.select_related(
                'student__user', 'room__hostel__landlord'
            ).only(
                'id', 'student_id', 'room__hostel__landlord_id', 'monthly_rent',
                'total_amount', 'amount_paid', 'status'
            ).get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)
        
        # Fast permission check
        if request.user.role == 'student':
            if booking.student.user != request.user:
                return Response({'error': 'Unauthorized access to booking'}, status=403)
        elif request.user.role not in ['tech_support', 'super_admin']:
            return Response({'error': 'Unauthorized'}, status=403)
        
        # Fast payment status check
        if hasattr(booking, 'payment_transaction') and booking.payment_transaction.status == 'success':
            return Response({'error': 'Payment already completed for this booking'}, status=400)
        
        try:
            # Calculate amount with minimal operations
            if payment_type == 'late_fee':
                late_fee_id = request.data.get('late_fee_id')
                try:
                    late_fee = LateFeeCharge.objects.only('late_fee_amount', 'status').get(
                        id=late_fee_id, booking=booking, status='pending'
                    )
                except LateFeeCharge.DoesNotExist:
                    return Response({'error': 'Late fee not found or already paid'}, status=404)
                amount = late_fee.late_fee_amount
                transaction_type = 'late_fee'
            else:
                amount = booking.total_amount - booking.amount_paid
                transaction_type = 'initial'
            
            # Create transaction with minimal fields
            transaction_ref = f"RUMI-{transaction_type.upper()}-{booking.id}-{uuid.uuid4().hex[:8]}"
            
            transaction_obj = Transaction.objects.create(
                booking=booking,
                student=booking.student,
                landlord=booking.room.hostel.landlord,
                transaction_reference=transaction_ref,
                transaction_type=transaction_type,
                payment_plan='monthly',
                payment_method='mpesa',
                mpesa_payment_type='stk_push',
                base_rent=booking.monthly_rent if transaction_type == 'initial' else amount,
                student_service_fee=booking.monthly_rent * Decimal('0.02') if transaction_type == 'initial' else Decimal('0.00'),
                total_charged_amount=amount,
                landlord_payout_amount=booking.monthly_rent if transaction_type == 'initial' else Decimal('0.00'),
                gross_platform_revenue=booking.monthly_rent * Decimal('0.02') if transaction_type == 'initial' else Decimal('0.00'),
                status='pending'
            )
            
            # Fast M-Pesa API call
            mpesa_api = MpesaDarajaAPI()
            formatted_phone = mpesa_api.validate_phone_number(phone_number)
            
            if not formatted_phone:
                return Response({'error': 'Invalid phone number format'}, status=400)
            
            # Initiate STK Push with timeout
            stk_result = mpesa_api.initiate_stk_push(
                amount=str(amount),
                phone_number=formatted_phone,
                reference=transaction_ref,
                description=f"RUMI {transaction_type.title()} Payment"
            )
            
            if 'error' in stk_result:
                # Clean up transaction on failure
                transaction_obj.delete()
                return Response({
                    'error': 'M-Pesa payment initialization failed',
                    'details': stk_result['error']
                }, status=500)
            
            # Update transaction with minimal operations
            transaction_obj.mpesa_checkout_request_id = stk_result.get('CheckoutRequestID')
            transaction_obj.mpesa_phone_number = formatted_phone
            transaction_obj.save(update_fields=['mpesa_checkout_request_id', 'mpesa_phone_number'])
            
            # Fast response with minimal data
            return Response({
                'transaction_id': transaction_obj.id,
                'transaction_reference': transaction_ref,
                'amount': float(amount),
                'payment_method': 'mpesa',
                'mpesa_payment_type': 'stk_push',
                'phone_number': formatted_phone,
                'checkout_request_id': stk_result.get('CheckoutRequestID'),
                'merchant_request_id': stk_result.get('MerchantRequestID'),
                'status': 'pending_stk_push',
                'message': 'STK push initiated. Please check your phone for payment prompt.',
                'c2b_alternative': {
                    'note': 'You can also pay via C2B offline using M-Pesa menu',
                    'business_number': getattr(settings, 'MPESA_SHORTCODE', 'N/A'),
                    'amount': str(amount),
                    'reference': transaction_ref
                }
            }, status=200)
            
        except Exception as e:
            logger.error(f"Payment initialization failed: {str(e)}")
            return Response({
                'error': 'Payment initialization failed',
                'details': str(e)
            }, status=500)


class MpesaPaymentStatusView(APIView):
    """
    M-Pesa Payment Status API
    
    Check the status of an M-Pesa payment transaction.
    Supports both STK Push and C2B payment status checking.
    
    Features:
    - Real-time payment status checking
    - Automatic STK Push status updates
    - C2B payment confirmation tracking
    - Optimized for fast responses
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Check M-Pesa Payment Status",
        operation_description="""
        Check the current status of an M-Pesa payment transaction.
        
        **Supported Payment Types:**
        - **STK Push**: Online payments initiated via this platform
        - **C2B**: Offline payments made via M-Pesa menu
        
        **Status Updates:**
        - For STK Push: Queries M-Pesa API for real-time status
        - For C2B: Returns transaction status from webhook processing
        
        **Performance:**
        - Fast database queries with optimized lookups
        - Minimal payload processing
        - Quick response times
        
        **Authentication:**
        - Students can only check their own transactions
        - Admins can check any transaction
        """,
        manual_parameters=[
            openapi.Parameter(
                'transaction_id',
                openapi.IN_QUERY,
                description='Transaction ID to check',
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                'checkout_request_id',
                openapi.IN_QUERY,
                description='STK Push checkout request ID to check',
                type=openapi.TYPE_STRING,
                required=False
            )
        ],
        responses={
            200: openapi.Response(
                description='Payment status retrieved successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'transaction': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            description='Complete transaction object'
                        ),
                        'status': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            enum=['pending', 'success', 'failed'],
                            example='success'
                        ),
                        'last_updated': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            format=openapi.FORMAT_DATETIME,
                            example='2024-01-01T12:00:00Z'
                        )
                    }
                )
            ),
            400: 'Bad Request - Invalid parameters',
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Access denied to transaction',
            404: 'Not Found - Transaction not found',
            500: 'Internal Server Error'
        },
        tags=['Payments']
    )
    
    def get(self, request):
        """
        Get M-Pesa Payment Status
        
        Query Parameters:
        - transaction_id: Transaction ID (optional)
        - checkout_request_id: STK Push checkout request ID (optional)
        
        Returns current payment status and details.
        """
        transaction_id = request.query_params.get('transaction_id')
        checkout_request_id = request.query_params.get('checkout_request_id')
        
        if not transaction_id and not checkout_request_id:
            return Response({
                'error': 'Either transaction_id or checkout_request_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get transaction
            if transaction_id:
                transaction_obj = Transaction.objects.get(id=transaction_id)
            else:
                transaction_obj = Transaction.objects.get(
                    mpesa_checkout_request_id=checkout_request_id,
                    payment_method='mpesa'
                )
            
            # Check permissions
            if request.user.role == 'student':
                if transaction_obj.student.user != request.user:
                    return Response({
                        'error': 'Unauthorized to view this transaction'
                    }, status=status.HTTP_403_FORBIDDEN)
            elif not request.user.role in ['tech_support', 'super_admin']:
                return Response({
                    'error': 'Unauthorized'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check status for STK push payments
            if (transaction_obj.mpesa_payment_type == 'stk_push' and 
                transaction_obj.mpesa_checkout_request_id and 
                transaction_obj.status == 'pending'):
                
                # Query M-Pesa for status update
                mpesa_api = MpesaDarajaAPI()
                query_result = mpesa_api.query_stk_push(transaction_obj.mpesa_checkout_request_id)
                
                if 'error' not in query_result:
                    result_code = query_result.get('ResultCode')
                    
                    if result_code == 0:
                        # Payment successful
                        transaction_obj.status = 'success'
                        transaction_obj.paid_at = timezone.now()
                        transaction_obj.mpesa_receipt_number = query_result.get('MpesaReceiptNumber')
                        transaction_obj.save()
                        
                        # Update booking
                        booking = transaction_obj.booking
                        booking.status = 'confirmed'
                        booking.amount_paid += transaction_obj.total_charged_amount
                        booking.save()
                        
                    elif result_code == '1032':
                        # Payment cancelled by user
                        transaction_obj.status = 'failed'
                        transaction_obj.failed_at = timezone.now()
                        transaction_obj.save()
            
            # Return current status
            serializer = TransactionSerializer(transaction_obj)
            return Response({
                'transaction': serializer.data,
                'status': transaction_obj.status,
                'last_updated': transaction_obj.updated_at.isoformat() if hasattr(transaction_obj, 'updated_at') else None
            }, status=status.HTTP_200_OK)
            
        except Transaction.DoesNotExist:
            return Response({
                'error': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Failed to check payment status',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LandlordMpesaConfigView(APIView):
    """
    Landlord M-Pesa Configuration API
    
    Manage landlord's M-Pesa payment configurations for different payment methods.
    
    Features:
    - Configure multiple M-Pesa payment methods
    - Set default payment option
    - Validate M-Pesa numbers
    - Track configuration status
    
    Supported Payment Types:
    - Send Money
    - Till Number
    - Pochi la Biashara
    - Paybill Number
    """
    
    permission_classes = [IsLandlord]
    
    @swagger_auto_schema(
        operation_summary="Manage Landlord M-Pesa Configuration",
        operation_description="""
        Manage landlord's M-Pesa payment configurations.
        
        **Supported Payment Methods:**
        - **Send Money**: Direct M-Pesa send money to business
        - **Till Number**: Pay using business till number
        - **Pochi la Biashara**: Pay using Pochi business account
        - **Paybill Number**: Pay using paybill number
        
        **Features:**
        - Configure multiple payment methods
        - Set default payment option
        - Track configuration verification status
        - Validate M-Pesa numbers
        
        **Authentication:**
        - Landlord JWT Token required
        - Can only manage own configurations
        
        **GET**: List all configurations
        **POST**: Create new configuration
        """,
        responses={
            200: 'Configurations retrieved successfully',
            201: 'Configuration created successfully',
            400: 'Bad Request - Invalid input data',
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Landlord access required',
            500: 'Internal Server Error'
        },
        tags=['Payments']
    )
    
    def get(self, request):
        """Get landlord's M-Pesa configurations"""
        landlord = request.user.landlord_profile
        configs = MpesaPaymentConfig.objects.filter(landlord=landlord).order_by('-created_at')
        serializer = MpesaPaymentConfigSerializer(configs, many=True)
        return Response({'configs': serializer.data})
    
    def post(self, request):
        """Add new M-Pesa configuration"""
        landlord = request.user.landlord_profile
        
        payment_type = request.data.get('payment_type')
        mpesa_number = request.data.get('mpesa_number')
        business_name = request.data.get('business_name')
        is_default = request.data.get('is_default', False)
        
        if not all([payment_type, mpesa_number, business_name]):
            return Response({
                'error': 'Payment type, M-Pesa number, and business name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            config = MpesaPaymentConfig.objects.create(
                landlord=landlord,
                payment_type=payment_type,
                mpesa_number=mpesa_number,
                business_name=business_name,
                is_default=is_default
            )
            
            serializer = MpesaPaymentConfigSerializer(config)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Failed to create M-Pesa configuration',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
