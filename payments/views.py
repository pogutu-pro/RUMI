import json
import uuid
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import (
    Transaction, SavedPaymentMethod, RecurringPayment,
    LateFeeCharge, TaxReport, PaystackSubaccount, Payout,
    RefundRequest, RevenueAnalytics
)


class PaymentInitializeView(APIView):
    """Initialize payment for a booking"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Initialize payment"""
        # Validate user is student
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can make payments'
            }, status=status.HTTP_403_FORBIDDEN)

        # Validate required fields
        booking_id = request.data.get('booking_id')
        payment_plan = request.data.get('payment_plan', 'monthly')
        save_payment_method = request.data.get('save_payment_method', False)

        if not booking_id:
            return Response({
                'error': 'booking_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate payment plan
        if payment_plan not in ['monthly']:
            return Response({
                'error': 'Invalid payment plan'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get booking and validate ownership
            from hostels.models import Booking
            booking = Booking.objects.select_related('student__user', 'room__hostel__landlord').get(
                id=booking_id,
                student__user=request.user
            )

            # Check booking status
            if booking.status != 'pending':
                return Response({
                    'error': 'Booking is not in pending status'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if payment already exists
            if hasattr(booking, 'payment_transaction') and booking.payment_transaction.status == 'success':
                return Response({
                    'error': 'Payment already completed for this booking'
                }, status=status.HTTP_400_BAD_REQUEST)

            # NEW: Student pays 2% service fee, landlord gets full rent
            base_rent = booking.room.base_price
            student_service_fee = base_rent * Decimal('0.02')  # 2% service fee
            total_charged_amount = base_rent + student_service_fee  # Rent + 2%
            
            # Landlord receives full rent (no commission deducted)
            landlord_commission = Decimal('0.00')  # NO landlord commission!
            landlord_payout_amount = base_rent  # FULL rent amount
            
            # Platform revenue (from 2% service fee)
            # Paystack takes ~1.5%, platform keeps ~0.5%
            gross_platform_revenue = student_service_fee

            # Generate transaction reference
            transaction_reference = f"RUMI-TXN-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"

            with transaction.atomic():
                # Create transaction record
                txn = Transaction.objects.create(
                    booking_id=booking_id,
                    student_id=booking.student.id,
                    landlord_id=booking.room.hostel.landlord.id,
                    transaction_reference=transaction_reference,
                    transaction_type='initial',
                    payment_plan=payment_plan,
                    base_rent=base_rent,
                    student_service_fee=student_service_fee,
                    total_charged_amount=total_charged_amount,
                    landlord_commission=landlord_commission,
                    landlord_payout_amount=landlord_payout_amount,
                    gross_platform_revenue=gross_platform_revenue,
                    status='pending',
                    metadata={
                        'save_payment_method': save_payment_method,
                        'booking_reference': booking.booking_reference
                    }
                )

                # Initialize payment with Paystack
                payment_link = self._initialize_paystack_payment(txn, booking)

                if not payment_link:
                    txn.status = 'failed'
                    txn.save()
                    return Response({
                        'error': 'Failed to initialize payment'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Cache payment data
                cache_key = f"payment_link:{txn.id}"
                cache.set(cache_key, {
                    'payment_link': payment_link,
                    'expires_at': timezone.now() + timezone.timedelta(minutes=30)
                }, timeout=1800)

                return Response({
                    'transaction_id': txn.id,
                    'transaction_reference': transaction_reference,
                    'payment_link': payment_link,
                    'breakdown': {
                        'base_rent': float(base_rent),
                        'service_fee': float(student_service_fee),
                        'service_fee_percentage': '2%',
                        'total_payable': float(total_charged_amount),
                        'landlord_receives': float(landlord_payout_amount),
                        'landlord_commission': 0.00,
                        'landlord_commission_percentage': '0%',
                        'note': '2% service fee covers payment processing. Landlord receives full rent.'
                    },
                    'expires_at': (timezone.now() + timezone.timedelta(minutes=30)).isoformat(),
                    'currency': 'KES'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': 'Failed to initialize payment',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _initialize_paystack_payment(self, transaction, booking):
        """Initialize payment with Paystack"""
        try:
            # Mock Paystack integration for now
            # In production, this would call Paystack API
            payment_link = f"https://paystack.com/pay/{transaction.transaction_reference.lower()}"

            # Update transaction with Paystack reference
            transaction.paystack_reference = f"paystack_{transaction.transaction_reference}"
            transaction.save()

            return payment_link
        except Exception as e:
            print(f"Paystack initialization failed: {e}")
            return None


class RecurringPaymentEnableView(APIView):
    """Enable recurring payments for a booking"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Enable recurring payments"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can enable recurring payments'
            }, status=status.HTTP_403_FORBIDDEN)

        booking_id = request.data.get('booking_id')
        saved_payment_method_id = request.data.get('saved_payment_method_id')

        if not booking_id or not saved_payment_method_id:
            return Response({
                'error': 'booking_id and saved_payment_method_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            from hostels.models import Booking
            booking = Booking.objects.get(id=booking_id, student__user=request.user)

            # Check if booking is confirmed
            if booking.status != 'confirmed':
                return Response({
                    'error': 'Booking must be confirmed first'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if first payment was successful
            first_payment = Transaction.objects.filter(
                booking=booking,
                transaction_type='initial',
                status='success'
            ).exists()

            if not first_payment:
                return Response({
                    'error': 'Complete first payment before enabling auto-debit'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get saved payment method
            payment_method = SavedPaymentMethod.objects.get(
                id=saved_payment_method_id,
                student__user=request.user,
                is_active=True
            )

            # Calculate next payment date
            rent_amount = booking.room.base_price
            next_payment_date = (timezone.now() + timezone.timedelta(days=30)).date()

            # Create recurring payment
            recurring = RecurringPayment.objects.create(
                booking=booking,
                student=booking.student,
                saved_payment_method=payment_method,
                rent_amount=rent_amount,
                next_payment_date=next_payment_date,
                is_active=True
            )

            # Update booking
            booking.auto_renewal = True
            booking.save()

            return Response({
                'message': 'Recurring payments enabled successfully',
                'recurring_payment_id': recurring.id,
                'booking_id': booking.id,
                'rent_amount': float(rent_amount),
                'next_payment_date': next_payment_date.isoformat(),
                'grace_period_days': 7,
                'late_fee_amount': 200.00,
                'payment_method': {
                    'type': payment_method.payment_type,
                    'last_four': payment_method.last_four,
                    'phone_number': payment_method.phone_number
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to enable recurring payments',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecurringPaymentPauseView(APIView):
    """Pause recurring payments"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, recurring_id):
        """Pause recurring payment"""
        try:
            recurring = RecurringPayment.objects.get(
                id=recurring_id,
                student__user=request.user
            )

            recurring.is_active = False
            recurring.paused_at = timezone.now()
            recurring.save()

            return Response({
                'message': 'Recurring payments paused',
                'recurring_payment_id': recurring.id,
                'paused_at': recurring.paused_at.isoformat(),
                'note': 'You will need to pay rent manually. Resume anytime.'
            }, status=status.HTTP_200_OK)

        except RecurringPayment.DoesNotExist:
            return Response({
                'error': 'Recurring payment not found'
            }, status=status.HTTP_404_NOT_FOUND)


class RecurringPaymentResumeView(APIView):
    """Resume recurring payments"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, recurring_id):
        """Resume recurring payment"""
        try:
            recurring = RecurringPayment.objects.get(
                id=recurring_id,
                student__user=request.user
            )

            recurring.is_active = True
            recurring.paused_at = None
            recurring.save()

            return Response({
                'message': 'Recurring payments resumed',
                'recurring_payment_id': recurring.id,
                'next_payment_date': recurring.next_payment_date.isoformat()
            }, status=status.HTTP_200_OK)

        except RecurringPayment.DoesNotExist:
            return Response({
                'error': 'Recurring payment not found'
            }, status=status.HTTP_404_NOT_FOUND)


class RecurringPaymentCancelView(APIView):
    """Cancel recurring payments"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, recurring_id):
        """Cancel recurring payment"""
        try:
            recurring = RecurringPayment.objects.get(
                id=recurring_id,
                student__user=request.user
            )

            recurring.is_active = False
            recurring.cancelled_at = timezone.now()
            recurring.save()

            # Update booking
            recurring.booking.auto_renewal = False
            recurring.booking.save()

            return Response({
                'message': 'Recurring payments cancelled',
                'recurring_payment_id': recurring.id,
                'cancelled_at': recurring.cancelled_at.isoformat()
            }, status=status.HTTP_200_OK)

        except RecurringPayment.DoesNotExist:
            return Response({
                'error': 'Recurring payment not found'
            }, status=status.HTTP_404_NOT_FOUND)


class LateFeesView(APIView):
    """View outstanding late fees"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        """Get late fees for booking"""
        try:
            from hostels.models import Booking
            booking = Booking.objects.get(id=booking_id, student__user=request.user)

            late_fees = LateFeeCharge.objects.filter(
                booking=booking
            ).order_by('-charged_at')

            late_fees_data = []
            for fee in late_fees:
                late_fees_data.append({
                    'late_fee_id': fee.id,
                    'late_fee_amount': float(fee.late_fee_amount),
                    'original_due_date': fee.due_date.isoformat(),
                    'grace_period_end': fee.grace_period_end.isoformat(),
                    'charged_at': fee.charged_at.isoformat(),
                    'status': fee.status,
                    'days_overdue': (timezone.now().date() - fee.grace_period_end).days
                })

            total_late_fees = sum(fee.late_fee_amount for fee in late_fees if fee.status == 'pending')

            return Response({
                'booking_id': booking_id,
                'total_late_fees': float(total_late_fees),
                'late_fees': late_fees_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to retrieve late fees',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LateFeePayView(APIView):
    """Pay outstanding late fee"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, late_fee_id):
        """Pay late fee"""
        try:
            late_fee = LateFeeCharge.objects.get(
                id=late_fee_id,
                student__user=request.user,
                status='pending'
            )

            # Service fee on late fees (2%)
            late_fee_amount = late_fee.late_fee_amount
            service_fee = late_fee_amount * Decimal('0.02')  # 2%
            total_payable = late_fee_amount + service_fee

            # Create transaction
            transaction_reference = f"RUMI-LATE-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"

            txn = Transaction.objects.create(
                booking=late_fee.booking,
                student=late_fee.student,
                landlord=late_fee.booking.room.hostel.landlord,
                transaction_reference=transaction_reference,
                transaction_type='late_fee',
                payment_plan='monthly',
                base_rent=late_fee_amount,
                student_service_fee=service_fee,
                total_charged_amount=total_payable,
                landlord_commission=Decimal('0.00'),
                landlord_payout_amount=late_fee_amount,
                gross_platform_revenue=service_fee,
                status='pending',
                metadata={
                    'late_fee_id': late_fee_id,
                    'original_due_date': late_fee.due_date.isoformat()
                }
            )

            # Initialize payment
            payment_link = f"https://paystack.com/pay/{transaction_reference.lower()}"
            txn.paystack_reference = f"paystack_{transaction_reference}"
            txn.save()

            return Response({
                'transaction_id': txn.id,
                'payment_link': payment_link,
                'breakdown': {
                    'late_fee': float(late_fee_amount),
                    'service_fee': float(service_fee),
                    'total_payable': float(total_payable)
                }
            }, status=status.HTTP_201_CREATED)

        except LateFeeCharge.DoesNotExist:
            return Response({
                'error': 'Late fee not found or already paid'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Failed to initialize late fee payment',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SavedPaymentMethodsView(APIView):
    """Manage saved payment methods"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List saved payment methods"""
        if request.user.role != 'student':
            return Response({
                'error': 'Only students can have saved payment methods'
            }, status=status.HTTP_403_FORBIDDEN)

        payment_methods = SavedPaymentMethod.objects.filter(
            student__user=request.user,
            is_active=True
        ).order_by('-last_used_at')

        methods_data = []
        for method in payment_methods:
            methods_data.append({
                'payment_method_id': method.id,
                'payment_type': method.payment_type,
                'phone_number': method.phone_number,
                'last_four': method.last_four,
                'bank': method.bank,
                'is_default': method.is_default,
                'last_used_at': method.last_used_at.isoformat() if method.last_used_at else None
            })

        return Response({
            'payment_methods': methods_data
        }, status=status.HTTP_200_OK)


class SavedPaymentMethodSetDefaultView(APIView):
    """Set payment method as default"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, method_id):
        """Set as default"""
        try:
            # Remove current default
            SavedPaymentMethod.objects.filter(
                student__user=request.user,
                is_default=True
            ).update(is_default=False)

            # Set new default
            method = SavedPaymentMethod.objects.get(
                id=method_id,
                student__user=request.user,
                is_active=True
            )
            method.is_default = True
            method.save()

            return Response({
                'message': 'Payment method set as default',
                'payment_method_id': method.id
            }, status=status.HTTP_200_OK)

        except SavedPaymentMethod.DoesNotExist:
            return Response({
                'error': 'Payment method not found'
            }, status=status.HTTP_404_NOT_FOUND)


class SavedPaymentMethodDeleteView(APIView):
    """Remove saved payment method"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, method_id):
        """Remove payment method"""
        try:
            method = SavedPaymentMethod.objects.get(
                id=method_id,
                student__user=request.user,
                is_active=True
            )

            # Check if it's used in active recurring payments
            active_recurring = RecurringPayment.objects.filter(
                saved_payment_method=method,
                is_active=True
            ).exists()

            if active_recurring:
                return Response({
                    'error': 'Cannot remove payment method used in active recurring payments'
                }, status=status.HTTP_400_BAD_REQUEST)

            method.is_active = False
            method.save()

            return Response({
                'message': 'Payment method removed',
                'payment_method_id': method.id
            }, status=status.HTTP_200_OK)

        except SavedPaymentMethod.DoesNotExist:
            return Response({
                'error': 'Payment method not found'
            }, status=status.HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['POST'])
def paystack_webhook(request):
    """Handle Paystack webhook events"""
    # Verify Paystack signature
    signature = request.headers.get('x-paystack-signature')
    if not verify_paystack_signature(request.body, signature):
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = json.loads(request.body)

        if payload['event'] == 'charge.success':
            reference = payload['data']['reference']

            # Find transaction
            try:
                txn = Transaction.objects.select_for_update().get(
                    transaction_reference=reference
                )
            except Transaction.DoesNotExist:
                return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

            if txn.status == 'success':
                return Response({'message': 'Already processed'}, status=status.HTTP_200_OK)

            # Update transaction
            gateway_fee = Decimal(payload['data']['fees']) / 100
            net_platform_revenue = txn.gross_platform_revenue - gateway_fee
            withholding_tax = txn.base_rent * Decimal('0.10')

            txn.status = 'success'
            txn.paystack_reference = payload['data']['reference']
            txn.paid_at = payload['data']['paid_at']
            txn.payment_method = payload['data']['channel']
            txn.gateway_fee = gateway_fee
            txn.net_platform_revenue = net_platform_revenue
            txn.withholding_tax = withholding_tax
            txn.save()

            # Save payment method if requested
            if payload['data']['metadata'].get('save_payment_method'):
                save_payment_method_from_webhook(txn.student_id, payload['data']['authorization'])

            # Handle transaction type
            transaction_type = payload['data']['metadata'].get('transaction_type', 'initial')

            if transaction_type == 'initial':
                confirm_booking_payment(txn.booking_id, reference)
            elif transaction_type == 'recurring':
                update_recurring_payment_from_webhook(payload['data']['metadata'].get('recurring_payment_id'))
            elif transaction_type == 'late_fee':
                mark_late_fee_paid_from_webhook(payload['data']['metadata'].get('late_fee_id'))

            # Create payout
            create_landlord_payout(txn)

            # Send notifications
            send_payment_success_notifications(txn, transaction_type)

            return Response({'status': 'success'}, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Webhook processing error: {e}")
        return Response({'error': 'Processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def verify_paystack_signature(request_body, signature):
    """Verify Paystack webhook signature"""
    # Mock verification for now
    return True


def save_payment_method_from_webhook(student_id, authorization):
    """Save payment method from webhook data"""
    try:
        SavedPaymentMethod.objects.create(
            student_id=student_id,
            paystack_authorization_code=authorization['authorization_code'],
            payment_type=authorization['channel'],
            last_four=authorization.get('last4'),
            phone_number=authorization.get('mobile_number'),
            bank=authorization.get('bank'),
            expiry_month=authorization.get('exp_month'),
            expiry_year=authorization.get('exp_year')
        )
    except Exception as e:
        print(f"Failed to save payment method: {e}")


def confirm_booking_payment(booking_id, transaction_reference):
    """Confirm booking after successful payment"""
    try:
        from hostels.models import Booking
        booking = Booking.objects.get(id=booking_id)
        booking.status = 'confirmed'
        booking.confirmed_at = timezone.now()
        booking.save()

        # Send confirmation notification
        from notifications.tasks import send_notification
        send_notification.delay(
            recipient_id=booking.student.user_id,
            notification_type='booking_confirmed',
            channel='email',
            context={
                'student_name': booking.student.user.first_name,
                'hostel_name': booking.room.hostel.name,
                'room_number': booking.room.room_number,
                'booking_reference': booking.booking_reference,
                'move_in_date': booking.check_in_date.strftime('%B %d, %Y')
            }
        )
    except Exception as e:
        print(f"Failed to confirm booking: {e}")


def update_recurring_payment_from_webhook(recurring_payment_id):
    """Update recurring payment after successful charge"""
    try:
        recurring = RecurringPayment.objects.get(id=recurring_payment_id)
        recurring.last_payment_at = timezone.now()
        recurring.next_payment_date = (timezone.now() + timezone.timedelta(days=30)).date()
        recurring.consecutive_failures = 0
        recurring.save()
    except Exception as e:
        print(f"Failed to update recurring payment: {e}")


def mark_late_fee_paid_from_webhook(late_fee_id):
    """Mark late fee as paid"""
    try:
        late_fee = LateFeeCharge.objects.get(id=late_fee_id)
        late_fee.status = 'paid'
        late_fee.paid_at = timezone.now()
        late_fee.save()
    except Exception as e:
        print(f"Failed to mark late fee paid: {e}")


def create_landlord_payout(transaction):
    """Create payout record for landlord"""
    try:
        # Get or create subaccount
        subaccount, created = PaystackSubaccount.objects.get_or_create(
            landlord=transaction.landlord,
            defaults={
                'subaccount_code': f"sub_{transaction.landlord.id}",
                'business_name': transaction.landlord.company_name or transaction.landlord.user.get_full_name(),
                'settlement_bank': transaction.landlord.bank_name,
                'account_number': transaction.landlord.bank_account_number
            }
        )

        Payout.objects.create(
            transaction=transaction,
            landlord=transaction.landlord,
            subaccount=subaccount,
            payout_reference=f"PAYOUT-{transaction.id}",
            gross_amount=transaction.base_rent,
            commission_deducted=transaction.landlord_commission,
            withholding_tax_deducted=transaction.withholding_tax,
            net_payout_amount=transaction.landlord_payout_amount,
            status='pending'
        )
    except Exception as e:
        print(f"Failed to create payout: {e}")


def send_payment_success_notifications(transaction, transaction_type):
    """Send payment success notifications"""
    from notifications.tasks import send_notification

    context = {
        'amount': float(transaction.total_charged_amount),
        'transaction_ref': transaction.transaction_reference
    }

    send_notification.delay(
        recipient_id=transaction.student_id,
        notification_type='payment_receipt',
        channel='email',
        context=context
    )


class TaxReportsView(APIView):
    """View tax reports"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List tax reports"""
        if request.user.role not in ['landlord']:
            return Response({
                'error': 'Only landlords can view tax reports'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            landlord_profile = request.user.landlord_profile
        except Exception:
            return Response({
                'error': 'Landlord profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        reports = TaxReport.objects.filter(
            landlord=landlord_profile
        ).order_by('-report_month')

        reports_data = []
        for report in reports:
            reports_data.append({
                'report_id': report.id,
                'report_month': report.report_month.strftime('%Y-%m'),
                'total_rent_received': float(report.total_rent_received),
                'total_withholding_tax': float(report.total_withholding_tax),
                'transaction_count': report.transaction_count,
                'report_file_url': report.report_file_url,
                'generated_at': report.generated_at.isoformat()
            })

        return Response({
            'total_reports': len(reports_data),
            'reports': reports_data
        }, status=status.HTTP_200_OK)


class TaxReportDownloadView(APIView):
    """Download tax report PDF"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, report_id):
        """Download PDF"""
        try:
            report = TaxReport.objects.get(
                id=report_id,
                landlord__user=request.user
            )

            if not report.report_file_url:
                return Response({
                    'error': 'Report file not available'
                }, status=status.HTTP_404_NOT_FOUND)

            # Mock PDF response
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="tax_report_{report.report_month.strftime("%Y_%m")}.pdf"'
            response.write(b"Mock PDF content")  # In production, fetch from S3/Cloudinary

            return response

        except TaxReport.DoesNotExist:
            return Response({
                'error': 'Tax report not found'
            }, status=status.HTTP_404_NOT_FOUND)


class RevenueAnalyticsView(APIView):
    """Revenue analytics dashboard"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get revenue analytics"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        period = request.query_params.get('period', 'monthly')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Get analytics data
        queryset = RevenueAnalytics.objects.filter(period_type=period)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        queryset = queryset.order_by('-date')[:30]  # Last 30 periods

        summary = queryset.aggregate(
            total_transactions=Sum('total_transactions'),
            total_volume=Sum('total_volume'),
            gross_revenue=Sum('gross_platform_revenue'),
            gateway_fees=Sum('gateway_fees_paid'),
            net_revenue=Sum('net_platform_revenue'),
            late_fees=Sum('late_fees_collected'),
            withholding_tax=Sum('total_withholding_tax')
        )

        trends = []
        for analytic in queryset:
            trends.append({
                'date': analytic.date.isoformat(),
                'transactions': analytic.total_transactions,
                'volume': float(analytic.total_volume),
                'net_revenue': float(analytic.net_platform_revenue)
            })

        return Response({
            'summary': {
                'total_transactions': summary['total_transactions'] or 0,
                'total_volume': float(summary['total_volume'] or 0),
                'gross_platform_revenue': float(summary['gross_revenue'] or 0),
                'gateway_fees_paid': float(summary['gateway_fees'] or 0),
                'net_platform_revenue': float(summary['net_revenue'] or 0),
                'profit_margin': (
                    (summary['net_revenue'] or 0) / (summary['gross_revenue'] or 1) * 100
                    if summary['gross_revenue'] else 0
                )
            },
            'trends': trends,
            'late_fees': {
                'total_collected': float(summary['late_fees'] or 0)
            },
            'tax': {
                'total_withholding_tax': float(summary['withholding_tax'] or 0)
            }
        }, status=status.HTTP_200_OK)


class PaymentReceiptView(APIView):
    """Get payment receipt details"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, transaction_id):
        """Get receipt for a transaction"""
        try:
            transaction = Transaction.objects.select_related(
                'student__user', 'booking__room__hostel', 'landlord__user'
            ).get(
                id=transaction_id,
                student__user=request.user,
                status='success'
            )
        except Transaction.DoesNotExist:
            return Response({
                'error': 'Receipt not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)

        receipt_data = {
            'receipt_id': f"RCPT-{transaction.id}",
            'transaction_reference': transaction.transaction_reference,
            'payment_date': transaction.paid_at.isoformat() if transaction.paid_at else None,
            'student': {
                'name': transaction.student.user.get_full_name(),
                'email': transaction.student.user.email
            },
            'hostel': {
                'name': transaction.booking.room.hostel.name,
                'address': transaction.booking.room.hostel.address,
                'room_number': transaction.booking.room.room_number
            },
            'landlord': {
                'name': transaction.landlord.company_name or transaction.landlord.user.get_full_name()
            },
            'payment_details': {
                'base_rent': float(transaction.base_rent),
                'service_fee': float(transaction.student_service_fee),
                'total_paid': float(transaction.total_charged_amount),
                'payment_method': transaction.payment_method or 'M-Pesa',
                'transaction_type': transaction.transaction_type
            },
            'breakdown': {
                'rent_amount': float(transaction.base_rent),
                'platform_fee': float(transaction.student_service_fee),
                'landlord_receives': float(transaction.landlord_payout_amount),
                'platform_revenue': float(transaction.net_platform_revenue)
            },
            'status': 'Paid',
            'generated_at': timezone.now().isoformat()
        }

        return Response(receipt_data, status=status.HTTP_200_OK)
