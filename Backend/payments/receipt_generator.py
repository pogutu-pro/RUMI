import uuid
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.core.files.base import ContentFile


class ReceiptGenerator:
    """Generate payment receipts in PDF format"""
    
    def __init__(self, transaction):
        self.transaction = transaction
        self.receipt_number = self._generate_receipt_number()
        # RUMI brand color #4CAF50
        self.rumi_green = colors.HexColor('#4CAF50')
    
    def _generate_receipt_number(self):
        """Generate unique receipt number"""
        timestamp = datetime.now().strftime("%Y%m%d")
        return f"RUMI-{timestamp}-{str(uuid.uuid4())[:6].upper()}"
    
    def generate_pdf_receipt(self):
        """Generate PDF receipt and return file content"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        # Container for the 'Flowable' objects
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=self.rumi_green
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=self.rumi_green
        )
        normal_style = styles['Normal']
        normal_style.fontSize = 11
        
        # Company Header
        story.append(Paragraph("RUMI PAYMENT RECEIPT", title_style))
        story.append(Spacer(1, 20))
        
        # Receipt Info
        receipt_info_data = [
            ['Receipt Number:', self.receipt_number],
            ['Transaction Reference:', self.transaction.transaction_reference],
            ['Date:', self.transaction.paid_at.strftime("%Y-%m-%d %H:%M:%S") if self.transaction.paid_at else 'N/A'],
            ['Status:', self.transaction.status.title()]
        ]
        
        receipt_info_table = Table(receipt_info_data, colWidths=[2.5*inch, 3*inch])
        receipt_info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(receipt_info_table)
        story.append(Spacer(1, 20))
        
        # Student Information
        story.append(Paragraph("Student Information", heading_style))
        student_info_data = [
            ['Name:', self.transaction.student.user.get_full_name()],
            ['Email:', self.transaction.student.user.email]
        ]
        
        student_table = Table(student_info_data, colWidths=[2.5*inch, 3*inch])
        student_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(student_table)
        story.append(Spacer(1, 20))
        
        # Booking Information
        story.append(Paragraph("Booking Details", heading_style))
        booking = self.transaction.booking
        booking_info_data = [
            ['Hostel:', booking.room.hostel.name],
            ['Room:', booking.room.room_number],
            ['Check-in Date:', booking.check_in_date.strftime("%Y-%m-%d")],
            ['Check-out Date:', booking.check_out_date.strftime("%Y-%m-%d")]
        ]
        
        booking_table = Table(booking_info_data, colWidths=[2.5*inch, 3*inch])
        booking_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(booking_table)
        story.append(Spacer(1, 20))
        
        # Payment Details
        story.append(Paragraph("Payment Details", heading_style))
        
        payment_data = [
            ['Description', 'Amount (KES)'],
            ['Base Rent', f"{self.transaction.base_rent:,.2f}"],
            ['Service Fee (2%)', f"{self.transaction.student_service_fee:,.2f}"],
            ['Total Paid', f"{self.transaction.total_charged_amount:,.2f}"]
        ]
        
        payment_table = Table(payment_data, colWidths=[3.5*inch, 2*inch])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.rumi_green),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(payment_table)
        story.append(Spacer(1, 30))
        
        # Footer
        story.append(Paragraph("Thank you for using RUMI!", styles['Normal']))
        story.append(Paragraph("For inquiries: support@rumi.co.ke", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        # Get the PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content