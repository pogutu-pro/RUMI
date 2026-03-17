import logging
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.conf import settings
from .models import Receipt
from .receipt_generator import ReceiptGenerator

logger = logging.getLogger(__name__)


class ReceiptService:
    """Service for managing payment receipts"""
    
    @staticmethod
    def generate_receipt(transaction):
        """Generate receipt for a transaction and store it"""
        try:
            # Check if receipt already exists
            if hasattr(transaction, 'receipt'):
                return transaction.receipt
            
            # Generate receipt
            generator = ReceiptGenerator(transaction)
            
            receipt = Receipt.objects.create(
                transaction=transaction,
                receipt_number=generator.receipt_number
            )
            
            # Generate PDF
            pdf_content = generator.generate_pdf_receipt()
            filename = f"receipt_{receipt.receipt_number}.pdf"
            receipt.pdf_file.save(filename, ContentFile(pdf_content), save=False)
            receipt.save()
            
            logger.info(f"Generated receipt for transaction {transaction.transaction_reference}")
            return receipt
            
        except Exception as e:
            logger.error(f"Failed to generate receipt: {str(e)}")
            raise
    
    @staticmethod
    def send_receipt_email(receipt):
        """Send receipt via email to the student"""
        try:
            transaction = receipt.transaction
            student = transaction.student
            student_email = student.user.email
            
            if not student_email:
                return False
            
            # Create email with RUMI branding
            subject = f"Payment Receipt - {receipt.receipt_number}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">RUMI Payment Receipt</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <h2 style="color: #4CAF50;">Hello {student.user.first_name},</h2>
                    <p>Thank you for your payment. Please find your receipt attached.</p>
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong style="color: #4CAF50;">Receipt Number:</strong> {receipt.receipt_number}</p>
                        <p><strong style="color: #4CAF50;">Amount Paid:</strong> KES {transaction.total_charged_amount:,.2f}</p>
                        <p><strong style="color: #4CAF50;">Transaction Reference:</strong> {transaction.transaction_reference}</p>
                        <p><strong style="color: #4CAF50;">Date:</strong> {transaction.paid_at.strftime('%Y-%m-%d %H:%M:%S') if transaction.paid_at else 'N/A'}</p>
                    </div>
                    <p>Thank you for using RUMI!</p>
                    <p style="color: #666; font-size: 14px;">For inquiries: support@rumi.co.ke</p>
                </div>
            </div>
            """
            
            email = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[student_email]
            )
            
            # Attach PDF if available — use FieldFile.open() for storage-agnostic read.
            # .path raises NotImplementedError on S3Boto3Storage (INF-03).
            if receipt.pdf_file:
                filename = receipt.pdf_file.name.split('/')[-1]
                with receipt.pdf_file.open('rb') as f:
                    email.attach(filename, f.read(), 'application/pdf')
            
            email.content_subtype = "html"
            email.send(fail_silently=False)
            
            # Update receipt status
            receipt.email_sent = True
            receipt.emailed_at = timezone.now()
            receipt.save()
            
            logger.info(f"Sent receipt email to {student_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send receipt email: {str(e)}")
            return False
    
    @staticmethod
    def generate_and_send_receipt(transaction):
        """Generate receipt and send via email"""
        try:
            receipt = ReceiptService.generate_receipt(transaction)
            email_sent = ReceiptService.send_receipt_email(receipt)
            return {'receipt': receipt, 'email_sent': email_sent}
        except Exception as e:
            logger.error(f"Failed to generate and send receipt: {str(e)}")
            return {'receipt': None, 'email_sent': False, 'error': str(e)}