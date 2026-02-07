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
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from django.conf import settings


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
        
        # Attribution Information (Booking or Rent Period)
        story.append(Paragraph("Attribution Details", heading_style))
        
        booking = self.transaction.booking
        rent_period = self.transaction.rent_period
        
        if booking:
            hostel_name = booking.room.hostel.name
            room_number = booking.room.room_number
            bed_code = booking.bed_slot_id or "N/A"
            period_text = f"{booking.check_in_date} to {booking.check_out_date}"
        elif rent_period:
            hostel_name = rent_period.hostel.name
            room_number = rent_period.room.room_number if rent_period.room else "N/A"
            bed_code = rent_period.bed_slot_id or "N/A"
            period_text = f"{rent_period.start_date} to {rent_period.end_date}"
        else:
            hostel_name = "N/A"
            room_number = "N/A"
            bed_code = "N/A"
            period_text = "N/A"

        attribution_info_data = [
            ['Hostel:', hostel_name],
            ['Room:', room_number],
            ['Bed Slot:', bed_code],
            ['Period:', period_text]
        ]
        
        attribution_table = Table(attribution_info_data, colWidths=[2.5*inch, 3*inch])
        attribution_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(attribution_table)
        story.append(Spacer(1, 20))
        
        # Payment Details
        story.append(Paragraph("Payment Details", heading_style))
        
        payment_data = [
            ['Description', 'Amount (KES)'],
            ['Booking Payment', f"{self.transaction.amount:,.2f}"],
            ['Total Paid', f"{self.transaction.amount:,.2f}"]
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

        # QR Code Verification
        story.append(Spacer(1, 20))
        
        # Determine verification URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.rumi.co.ke')
        verify_url = f"{frontend_url}/verify-receipt?id={self.transaction.id}"
        
        # Create QR Code
        qr_code = qr.QrCodeWidget(verify_url)
        qr_code.barWidth = 2.5
        qr_code.barHeight = 2.5
        qr_code.qrVersion = 1
        
        d = Drawing(100, 100)
        d.add(qr_code)
        
        # Center QR Code in a table
        qr_table = Table([[d, Paragraph("Scan to Verify", heading_style)]], colWidths=[1.5*inch, 2*inch])
        qr_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(qr_table)
        
        # Build PDF
        doc.build(story)
        
        # Get the PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content