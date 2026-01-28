"""
Report generation utilities for landlord analytics
"""
import logging
import csv
import io
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from decimal import Decimal
from django.conf import settings
from django.db.models import Avg, Sum, Count
from django.http import HttpResponse
from django.utils import timezone

from hostels.models import Hostel, Booking
from payments.models import Transaction

logger = logging.getLogger(__name__)


class ReportGenerator:
    """
    High-quality report generation for landlord analytics
    """
    
    def __init__(self):
        self.supported_formats = ['csv', 'pdf', 'json']
        # RUMI brand colors
        self.rumi_green = '#4CAF50'
        self.rumi_blue = '#2196F3'
        self.rumi_grey = '#757575'
    
    def generate_financial_report(self, landlord, date_from: datetime, 
                             date_to: datetime, 
                             report_format: str = 'csv') -> Dict[str, Any]:
        """
        Generate comprehensive financial report
        
        Args:
            landlord: Landlord profile
            date_from: Start date for report
            date_to: End date for report
            report_format: Output format ('csv', 'pdf', 'json')
            
        Returns:
            Dictionary with report data and file info
        """
        try:
            # Query financial data
            transactions = Transaction.objects.filter(
                booking__room__hostel__landlord=landlord,
                status='success',
                paid_at__date__gte=date_from.date(),
                paid_at__date__lte=date_to.date()
            ).select_related(
                'booking__student__user',
                'booking__room__hostel'
            ).order_by('-paid_at')
            
            # Calculate metrics
            total_revenue = sum(t.total_charged_amount for t in transactions)
            total_transactions = transactions.count()
            avg_transaction = total_revenue / total_transactions if total_transactions > 0 else 0
            
            # Revenue by hostel
            hostel_revenue = {}
            for transaction in transactions:
                hostel_name = transaction.booking.room.hostel.name
                if hostel_name not in hostel_revenue:
                    hostel_revenue[hostel_name] = 0
                hostel_revenue[hostel_name] += transaction.total_charged_amount
            
            # Monthly breakdown
            monthly_revenue = self._calculate_monthly_revenue(transactions, date_from, date_to)
            
            report_data = {
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_transactions': total_transactions,
                    'average_transaction': float(avg_transaction),
                    'report_period': f"{date_from.date()} to {date_to.date()}",
                    'generated_at': timezone.now().isoformat(),
                },
                'monthly_breakdown': monthly_revenue,
                'hostel_breakdown': [
                    {
                        'hostel_name': hostel_name,
                        'revenue': float(revenue),
                        'transaction_count': len([t for t in transactions if t.booking.room.hostel.name == hostel_name])
                    }
                    for hostel_name, revenue in hostel_revenue.items()
                ],
                'transactions': [
                    {
                        'id': t.id,
                        'amount': float(t.total_charged_amount),
                        'currency': t.currency,
                        'payment_method': t.payment_method,
                        'status': t.status,
                        'student': t.booking.student.user.get_full_name() if t.booking.student else 'Unknown',
                        'hostel': t.booking.room.hostel.name,
                        'room': t.booking.room.room_number,
                        'date': t.paid_at.date().isoformat() if t.paid_at else None,
                        'reference': t.reference,
                    }
                    for t in transactions
                ]
            }
            
            if report_format == 'csv':
                csv_data = self._generate_csv_report(report_data)
                return {
                    'status': 'success',
                    'format': report_format,
                    'data': csv_data,
                    'filename': f"financial_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{report_format}"
                }
            elif report_format == 'json':
                return {
                    'status': 'success',
                    'format': report_format,
                    'data': report_data,
                    'filename': f"financial_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{report_format}"
                }
            elif report_format == 'pdf':
                pdf_data = self._generate_pdf_report(report_data)
                return {
                    'status': 'success',
                    'format': report_format,
                    'data': pdf_data,
                    'filename': f"financial_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{report_format}"
                }
            else:
                return {
                    'status': 'error',
                    'message': f"Unsupported format: {report_format}"
                }
                
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            return {
                'status': 'error',
                'message': f"Report generation failed: {str(e)}"
            }
    
    def generate_occupancy_report(self, landlord, date_from: datetime,
                              date_to: datetime,
                              report_format: str = 'csv') -> Dict[str, Any]:
        """
        Generate comprehensive occupancy report
        
        Args:
            landlord: Landlord profile
            date_from: Start date for report
            date_to: End date for report
            report_format: Output format ('csv', 'pdf', 'json')
            
        Returns:
            Dictionary with occupancy report data
        """
        try:
            # Query booking data
            bookings = Booking.objects.filter(
                room__hostel__landlord=landlord,
                status__in=['confirmed', 'reserved'],
                check_in_date__gte=date_from.date(),
                check_in_date__lte=date_to.date()
            ).select_related(
                'student__user',
                'room__hostel'
            ).order_by('-check_in_date')
            
            # Calculate occupancy metrics
            total_bookings = bookings.count()
            total_rooms = sum(h.total_rooms for h in Hostel.objects.filter(landlord=landlord))
            
            # Room type analysis
            room_type_occupancy = {}
            for booking in bookings:
                room_type = booking.room.hostel.hostel_type
                if room_type not in room_type_occupancy:
                    room_type_occupancy[room_type] = {'count': 0, 'occupancy': 0}
                room_type_occupancy[room_type]['count'] += 1
                room_type_occupancy[room_type]['occupancy'] += booking.room.capacity
            
            # Monthly occupancy trends
            monthly_occupancy = self._calculate_monthly_occupancy(bookings, date_from, date_to)
            
            report_data = {
                'summary': {
                    'total_bookings': total_bookings,
                    'total_rooms': total_rooms,
                    'occupancy_rate': (total_bookings / total_rooms * 100) if total_rooms > 0 else 0,
                    'report_period': f"{date_from.date()} to {date_to.date()}",
                    'generated_at': timezone.now().isoformat(),
                },
                'room_type_breakdown': [
                    {
                        'room_type': room_type,
                        'bookings': data['count'],
                        'occupancy': data['occupancy'],
                        'occupancy_rate': (data['count'] / total_rooms * 100) if total_rooms > 0 else 0
                    }
                    for room_type, data in room_type_occupancy.items()
                ],
                'monthly_trends': monthly_occupancy,
                'bookings': [
                    {
                        'id': b.id,
                        'student': b.student.user.get_full_name() if b.student else 'Unknown',
                        'hostel': b.room.hostel.name,
                        'room': b.room.room_number,
                        'room_type': b.room.hostel.hostel_type,
                        'check_in_date': b.check_in_date.isoformat(),
                        'check_out_date': b.check_out_date.isoformat() if b.check_out_date else None,
                        'status': b.status,
                        'amount': float(b.total_amount) if b.total_amount else 0,
                    }
                    for b in bookings
                ]
            }
            
            return self._format_report_response(report_data, report_format)
                
        except Exception as e:
            logger.error(f"Occupancy report generation failed: {str(e)}")
            return {
                'status': 'error',
                'message': f"Report generation failed: {str(e)}"
            }
    
    def _calculate_monthly_revenue(self, transactions: List, date_from: datetime, date_to: datetime) -> List[Dict]:
        """Calculate monthly revenue breakdown"""
        monthly_data = {}
        current = date_from.replace(day=1)
        
        while current <= date_to:
            month_key = current.strftime('%Y-%m')
            month_transactions = [t for t in transactions if t.paid_at and t.paid_at.year == current.year and t.paid_at.month == current.month]
            
            monthly_revenue = sum(t.total_charged_amount for t in month_transactions)
            transaction_count = len(month_transactions)
            
            monthly_data[month_key] = {
                'month': current.strftime('%B %Y'),
                'revenue': float(monthly_revenue),
                'transaction_count': transaction_count,
                'average_transaction': float(monthly_revenue / transaction_count) if transaction_count > 0 else 0
            }
            
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        
        return [monthly_data[key] for key in sorted(monthly_data.keys())]
    
    def _calculate_monthly_occupancy(self, bookings: List, date_from: datetime, date_to: datetime) -> List[Dict]:
        """Calculate monthly occupancy breakdown"""
        monthly_data = {}
        current = date_from.replace(day=1)
        
        while current <= date_to:
            month_key = current.strftime('%Y-%m')
            month_bookings = [b for b in bookings if b.check_in_date and b.check_in_date.year == current.year and b.check_in_date.month == current.month]
            
            occupancy_data = self._analyze_monthly_bookings(month_bookings)
            
            occupancy_data = self._analyze_monthly_bookings(month_bookings)
            monthly_data[month_key] = {
                'month': current.strftime('%B %Y'),
                'total_bookings': len(month_bookings),
                **occupancy_data,  # Occupancy analysis results
            }
            
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        
        return [monthly_data[key] for key in sorted(monthly_data.keys())]
    
    def _analyze_monthly_bookings(self, bookings: List) -> Dict:
        """Analyze booking patterns for a month"""
        if not bookings:
            return {}
        
        # Peak booking times, durations, etc.
        check_in_times = [b.check_in_date.hour for b in bookings if b.check_in_date]
        bookings_by_day = {}
        for booking in bookings:
            if booking.check_in_date:
                day_key = booking.check_in_date.strftime('%A')
                bookings_by_day[day_key] = bookings_by_day.get(day_key, 0) + 1
        
        return {
            'peak_booking_hour': max(check_in_times) if check_in_times else None,
            'average_stay_duration': self._calculate_average_stay(bookings),
            'bookings_by_weekday': bookings_by_day,
            'most_popular_day': max(bookings_by_day.items(), key=lambda x: x[1])[0] if bookings_by_day else None,
        }
    
    def _calculate_average_stay(self, bookings: List) -> float:
        """Calculate average stay duration in days"""
        durations = []
        for booking in bookings:
            if booking.check_in_date and booking.check_out_date:
                duration = (booking.check_out_date - booking.check_in_date).days
                durations.append(duration)
        
        return sum(durations) / len(durations) if durations else 0
    
    def _generate_csv_report(self, report_data: Dict) -> str:
        """Generate CSV format of report data"""
        output = io.StringIO()
        
        if 'transactions' in report_data:
            writer = csv.writer(output)
            
            # Write headers
            if report_data.get('transactions'):
                headers = ['ID', 'Amount', 'Currency', 'Payment Method', 'Status', 'Student', 'Hostel', 'Room', 'Date', 'Reference']
                writer.writerow(headers)
                
                # Write transaction data
                for transaction in report_data['transactions']:
                    writer.writerow([
                        transaction['id'],
                        transaction['amount'],
                        transaction['currency'],
                        transaction['payment_method'],
                        transaction['status'],
                        transaction['student'],
                        transaction['hostel'],
                        transaction['room'],
                        transaction['date'],
                        transaction['reference']
                    ])
        
        return output.getvalue()
    
    def _generate_pdf_report(self, report_data: Dict) -> bytes:
        """Generate PDF format of report data using ReportLab"""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
            from io import BytesIO
            
            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.HexColor(self.rumi_blue)
            )
            
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Heading2'],
                fontSize=12,
                spaceAfter=12,
                alignment=TA_CENTER,
                textColor=colors.HexColor(self.rumi_grey)
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading3'],
                fontSize=14,
                spaceAfter=12,
                textColor=colors.HexColor(self.rumi_blue)
            )
            
            # Build story
            story = []
            
            # Title
            story.append(Paragraph("RUMI SYSTEM AUTOMATED REPORT", title_style))
            story.append(Spacer(1, 12))
            
            report_type = "Financial Report" if 'revenue' in report_data.get('summary', {}) else "Occupancy Report"
            story.append(Paragraph(report_type, subtitle_style))
            story.append(Spacer(1, 12))
            
            # Report period and generation info
            summary = report_data.get('summary', {})
            period_text = f"Period: {summary.get('report_period', 'N/A')}"
            generated_text = f"Generated: {summary.get('generated_at', 'N/A')}"
            
            story.append(Paragraph(period_text, subtitle_style))
            story.append(Paragraph(generated_text, subtitle_style))
            story.append(Spacer(1, 20))
            
            # Summary section
            story.append(Paragraph("Executive Summary", heading_style))
            story.append(Spacer(1, 12))
            
            # Create summary table
            summary_data = []
            for key, value in summary.items():
                if key not in ['report_period', 'generated_at']:
                    formatted_key = key.replace('_', ' ').title()
                    if isinstance(value, float):
                        formatted_value = f"KES {value:,.2f}"
                    elif isinstance(value, int):
                        formatted_value = f"{value:,}"
                    else:
                        formatted_value = str(value)
                    
                    summary_data.append([formatted_key, formatted_value])
            
            if summary_data:
                summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
                summary_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.rumi_grey)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor(self.rumi_grey))
                ]))
                story.append(summary_table)
                story.append(Spacer(1, 20))
            
            # Detailed data section
            if 'transactions' in report_data:
                story.append(Paragraph("Transaction Details", heading_style))
                story.append(Spacer(1, 12))
                
                # Transaction table headers
                transaction_headers = ['Date', 'Student', 'Hostel', 'Room', 'Amount', 'Method', 'Reference']
                transaction_data = [transaction_headers]
                
                # Add transaction rows (limit to first 50 for PDF)
                for transaction in report_data['transactions'][:50]:
                    transaction_data.append([
                        transaction.get('date', 'N/A'),
                        transaction.get('student', 'N/A'),
                        transaction.get('hostel', 'N/A'),
                        transaction.get('room', 'N/A'),
                        f"KES {transaction.get('amount', 0):,.2f}",
                        transaction.get('payment_method', 'N/A'),
                        transaction.get('reference', 'N/A')[-10:] + '...'  # Truncate long references
                    ])
                
                transaction_table = Table(transaction_data, colWidths=[0.8*inch, 1.2*inch, 1.2*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch])
                transaction_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.rumi_grey)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.rumi_grey)),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
                ]))
                story.append(transaction_table)
            
            elif 'bookings' in report_data:
                story.append(Paragraph("Booking Details", heading_style))
                story.append(Spacer(1, 12))
                
                # Booking table headers
                booking_headers = ['Date', 'Student', 'Hostel', 'Room', 'Type', 'Amount']
                booking_data = [booking_headers]
                
                # Add booking rows (limit to first 50 for PDF)
                for booking in report_data['bookings'][:50]:
                    booking_data.append([
                        booking.get('check_in_date', 'N/A'),
                        booking.get('student', 'N/A'),
                        booking.get('hostel', 'N/A'),
                        booking.get('room', 'N/A'),
                        booking.get('room_type', 'N/A'),
                        f"KES {booking.get('amount', 0):,.2f}"
                    ])
                
                booking_table = Table(booking_data, colWidths=[0.9*inch, 1.2*inch, 1.2*inch, 0.8*inch, 0.9*inch, 0.8*inch])
                booking_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.rumi_grey)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.rumi_grey)),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
                ]))
                story.append(booking_table)
            
            # Footer
            story.append(Spacer(1, 30))
            story.append(Paragraph("Generated by RUMI System - www.rumi.co.ke", subtitle_style))
            story.append(Paragraph("For support: support@rumi.co.ke", subtitle_style))
            story.append(Spacer(1, 20))
            
            # Note about data limits
            if len(report_data.get('transactions', [])) > 50 or len(report_data.get('bookings', [])) > 50:
                story.append(Paragraph("Note: Only first 50 records shown in PDF. Use CSV format for complete data.", subtitle_style))
                story.append(Spacer(1, 10))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF content
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            return pdf_content
            
        except ImportError as e:
            logger.error(f"ReportLab import failed: {str(e)}")
            return f"PDF generation failed - ReportLab not available: {str(e)}".encode('utf-8')
        except Exception as e:
            logger.error(f"PDF generation failed: {str(e)}")
            return f"PDF generation error: {str(e)}".encode('utf-8')
    
    def _format_report_response(self, report_data: Dict, report_format: str) -> Dict[str, Any]:
        """Format report response based on requested format"""
        filename = f"RUMI_automated_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{report_format}"
        
        if report_format == 'csv':
            content = self._generate_csv_report(report_data)
            return {
                'status': 'success',
                'format': report_format,
                'content': content,
                'filename': filename,
                'content_type': 'text/csv',
            }
        elif report_format == 'json':
            import json
            content = json.dumps(report_data, indent=2, default=str)
            return {
                'status': 'success',
                'format': report_format,
                'content': content,
                'filename': filename,
                'content_type': 'application/json',
            }
        elif report_format == 'pdf':
            content = self._generate_pdf_report(report_data)
            return {
                'status': 'success',
                'format': report_format,
                'content': content,
                'filename': filename,
                'content_type': 'application/pdf',
            }
        else:
            return {
                'status': 'error',
                'message': f"Unsupported report format: {report_format}"
            }


def create_financial_report(landlord, date_from: datetime, date_to: datetime, 
                         report_format: str = 'csv') -> Dict[str, Any]:
    """
    High-level function to create financial report
    
    Args:
        landlord: Landlord profile object
        date_from: Start date for report period
        date_to: End date for report period  
        report_format: Output format ('csv', 'json', 'pdf')
        
    Returns:
        Dictionary with report generation result
    """
    generator = ReportGenerator()
    return generator.generate_financial_report(landlord, date_from, date_to, report_format)


def create_occupancy_report(landlord, date_from: datetime,
                          date_to: datetime, 
                          report_format: str = 'csv') -> Dict[str, Any]:
    """
    High-level function to create occupancy report
    
    Args:
        landlord: Landlord profile object
        date_from: Start date for report period
        date_to: End date for report period
        report_format: Output format ('csv', 'json', 'pdf')
        
    Returns:
        Dictionary with report generation result
    """
    generator = ReportGenerator()
    return generator.generate_occupancy_report(landlord, date_from, date_to, report_format)