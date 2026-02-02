"""
Payment System Cron Jobs
Scheduled tasks for payment processing, reconciliation, and maintenance
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Count, Q, F
from celery import shared_task

from .models import Transaction, StudentPaymentTracker, RentPeriod, LateFeeCharge
from accounts.models import StudentProfile
from notifications.tasks import send_notification

logger = logging.getLogger(__name__)


@shared_task(name='payments.tasks.reconcile_payment_trackers')
def reconcile_payment_trackers():
    """
    Reconcile student payment trackers with overpayments and credits
    Runs daily at 8 AM
    """
    logger.info("Starting payment tracker reconciliation...")
    
    reconciled_count = 0
    total_reconciled = Decimal('0.00')
    
    try:
        trackers = StudentPaymentTracker.objects.select_related('student__user')
        
        for tracker in trackers:
            # Check for overpayments in transactions
            overpayments = Transaction.objects.filter(
                student=tracker.student,
                status='success',
                amount__gt=0  # Credit transactions
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            # Check for debit transactions
            debits = Transaction.objects.filter(
                student=tracker.student,
                status='success',
                amount__lt=0  # Debit transactions
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            # Calculate correct balance
            correct_balance = overpayments + debits
            
            # Update tracker if balance differs
            if tracker.balance != correct_balance:
                old_balance = tracker.balance
                tracker.balance = correct_balance
                tracker.save()
                
                total_reconciled += abs(correct_balance - old_balance)
                reconciled_count += 1
                
                logger.info(f"Reconciled payment tracker for {tracker.student.user.email}: "
                           f"{old_balance} -> {correct_balance}")
        
        logger.info(f"Payment tracker reconciliation completed: {reconciled_count} trackers, "
                   f"Total reconciled: KES {total_reconciled}")
        
        return {
            'reconciled_trackers': reconciled_count,
            'total_reconciled': str(total_reconciled),
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Payment tracker reconciliation failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='payments.tasks.send_payment_reminders')
def send_payment_reminders():
    """
    Send payment reminders to students with upcoming or overdue payments
    Runs daily at 10 AM
    """
    logger.info("Starting payment reminders...")
    
    reminders_sent = 0
    errors = 0
    
    try:
        today = timezone.now().date()
        
        # Find rent periods due in next 7 days
        upcoming_payments = RentPeriod.objects.filter(
            status='due',
            start_date__lte=today + timedelta(days=7),
            start_date__gt=today
        ).select_related('student__user', 'hostel')
        
        # Find overdue payments
        overdue_payments = RentPeriod.objects.filter(
            status__in=['due', 'partially_paid'],
            start_date__lt=today
        ).select_related('student__user', 'hostel')
        
        # Send reminders for upcoming payments
        for rent_period in upcoming_payments:
            try:
                days_until_due = (rent_period.start_date - today).days
                
                send_notification.delay(
                    recipient_id=rent_period.student.user.id,
                    notification_type='payment_reminder_upcoming',
                    channel='email',
                    context={
                        'student_name': rent_period.student.user.first_name,
                        'hostel_name': rent_period.hostel.name,
                        'amount_due': str(rent_period.amount_due),
                        'due_date': rent_period.start_date.strftime('%B %d, %Y'),
                        'days_until_due': days_until_due,
                    }
                )
                reminders_sent += 1
                
            except Exception as e:
                logger.error(f"Failed to send upcoming payment reminder to "
                           f"{rent_period.student.user.email}: {e}")
                errors += 1
        
        # Send reminders for overdue payments
        for rent_period in overdue_payments:
            try:
                days_overdue = (today - rent_period.start_date).days
                
                send_notification.delay(
                    recipient_id=rent_period.student.user.id,
                    notification_type='payment_reminder_overdue',
                    channel='email',
                    context={
                        'student_name': rent_period.student.user.first_name,
                        'hostel_name': rent_period.hostel.name,
                        'amount_due': str(rent_period.balance),
                        'due_date': rent_period.start_date.strftime('%B %d, %Y'),
                        'days_overdue': days_overdue,
                    }
                )
                reminders_sent += 1
                
            except Exception as e:
                logger.error(f"Failed to send overdue payment reminder to "
                           f"{rent_period.student.user.email}: {e}")
                errors += 1
        
        logger.info(f"Payment reminders completed: {reminders_sent} sent, {errors} errors")
        
        return {
            'reminders_sent': reminders_sent,
            'errors': errors,
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Payment reminders failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='payments.tasks.process_late_fees')
def process_late_fees():
    """
    Process and apply late fees for overdue payments
    Runs daily at midnight
    """
    logger.info("Starting late fee processing...")
    
    fees_processed = 0
    total_fees = Decimal('0.00')
    
    try:
        today = timezone.now().date()
        
        # Find overdue rent periods
        overdue_periods = RentPeriod.objects.filter(
            status__in=['due', 'partially_paid'],
            start_date__lt=today - timedelta(days=7)  # 7+ days overdue
        ).select_related('student__user', 'hostel')
        
        for rent_period in overdue_periods:
            try:
                # Calculate late fee (5% of remaining balance)
                late_fee_amount = rent_period.balance * Decimal('0.05')
                
                # Check if late fee already exists for this period
                existing_fee = LateFeeCharge.objects.filter(
                    rent_period=rent_period,
                    status='pending'
                ).first()
                
                if not existing_fee and late_fee_amount > 0:
                    # Create late fee charge
                    late_fee = LateFeeCharge.objects.create(
                        rent_period=rent_period,
                        amount=late_fee_amount,
                        reason=f"Late payment fee - {rent_period.balance} overdue",
                        due_date=today + timedelta(days=7)
                    )
                    
                    # Create transaction record
                    Transaction.objects.create(
                        student=rent_period.student,
                        rent_period=rent_period,
                        transaction_reference=f"LATEFEE-{late_fee.id}-{timezone.now().strftime('%Y%m%d')}",
                        amount=late_fee_amount,
                        transaction_type='late_fee',
                        status='pending',
                        metadata={
                            'late_fee_id': late_fee.id,
                            'original_balance': str(rent_period.balance),
                            'days_overdue': (today - rent_period.start_date).days
                        }
                    )
                    
                    fees_processed += 1
                    total_fees += late_fee_amount
                    
                    # Send notification about late fee
                    send_notification.delay(
                        recipient_id=rent_period.student.user.id,
                        notification_type='late_fee_applied',
                        channel='email',
                        context={
                            'student_name': rent_period.student.user.first_name,
                            'hostel_name': rent_period.hostel.name,
                            'late_fee_amount': str(late_fee_amount),
                            'original_balance': str(rent_period.balance),
                            'total_due': str(rent_period.balance + late_fee_amount),
                        }
                    )
                    
                    logger.info(f"Applied late fee KES {late_fee_amount} to "
                               f"{rent_period.student.user.email}")
                
            except Exception as e:
                logger.error(f"Failed to process late fee for "
                           f"{rent_period.student.user.email}: {e}")
        
        logger.info(f"Late fee processing completed: {fees_processed} fees, "
                   f"Total amount: KES {total_fees}")
        
        return {
            'fees_processed': fees_processed,
            'total_fees': str(total_fees),
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Late fee processing failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='payments.tasks.reconcile_payments')
def reconcile_payments():
    """
    Reconcile payments with external payment providers
    Runs daily at 2:30 AM
    """
    logger.info("Starting payment reconciliation...")
    
    reconciled_count = 0
    discrepancies = 0
    
    try:
        # Find pending transactions older than 1 hour
        pending_transactions = Transaction.objects.filter(
            status='pending',
            initiated_at__lt=timezone.now() - timedelta(hours=1)
        ).select_related('student__user')
        
        for transaction in pending_transactions:
            try:
                if transaction.payment_method == 'mpesa':
                    # Check M-Pesa transaction status
                    from .mpesa_api import MpesaDarajaAPI
                    api = MpesaDarajaAPI()
                    
                    if transaction.mpesa_checkout_request_id:
                        status = api.check_transaction_status(
                            transaction.mpesa_checkout_request_id
                        )
                        
                        if status.get('status') == 'completed':
                            # Update transaction status
                            transaction.status = 'success'
                            transaction.paid_at = timezone.now()
                            transaction.mpesa_receipt_number = status.get('receipt_number')
                            transaction.save()
                            
                            # Update rent period
                            if transaction.rent_period:
                                rent_period = transaction.rent_period
                                rent_period.amount_paid += transaction.amount
                                if rent_period.amount_paid >= rent_period.amount_due:
                                    rent_period.status = 'paid'
                                else:
                                    rent_period.status = 'partially_paid'
                                rent_period.save()
                            
                            reconciled_count += 1
                            logger.info(f"Reconciled M-Pesa transaction {transaction.transaction_reference}")
                        
                        elif status.get('status') == 'failed':
                            transaction.status = 'failed'
                            transaction.save()
                            reconciled_count += 1
                
                elif transaction.payment_method == 'paystack':
                    # Check Paystack transaction status
                    import paystackapi
                    from paystackapi.transaction import Transaction as PaystackTransaction
                    
                    if transaction.paystack_reference:
                        try:
                            paystack_tx = PaystackTransaction.verify(transaction.paystack_reference)
                            
                            if paystack_tx['status'] == 'success':
                                transaction.status = 'success'
                                transaction.paid_at = timezone.now()
                                transaction.save()
                                
                                # Update rent period
                                if transaction.rent_period:
                                    rent_period = transaction.rent_period
                                    rent_period.amount_paid += transaction.amount
                                    if rent_period.amount_paid >= rent_period.amount_due:
                                        rent_period.status = 'paid'
                                    else:
                                        rent_period.status = 'partially_paid'
                                    rent_period.save()
                                
                                reconciled_count += 1
                                logger.info(f"Reconciled Paystack transaction {transaction.transaction_reference}")
                            
                            elif paystack_tx['status'] in ['failed', 'abandoned']:
                                transaction.status = 'failed'
                                transaction.save()
                                reconciled_count += 1
                        
                        except Exception as e:
                            logger.warning(f"Failed to verify Paystack transaction "
                                        f"{transaction.paystack_reference}: {e}")
                            discrepancies += 1
                
            except Exception as e:
                logger.error(f"Failed to reconcile transaction {transaction.transaction_reference}: {e}")
                discrepancies += 1
        
        logger.info(f"Payment reconciliation completed: {reconciled_count} reconciled, "
                   f"{discrepancies} discrepancies")
        
        return {
            'reconciled': reconciled_count,
            'discrepancies': discrepancies,
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Payment reconciliation failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }
