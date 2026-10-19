"""
Receipts — issued for every successful payment, rendered to PDF, delivered by
SMS (short) and email (PDF attached).

Issuing happens inside the payment's transaction; rendering and delivery run
in a Celery task after commit so a slow SMS/email provider never blocks or
rolls back a payment.
"""

from __future__ import annotations

import io
import logging
from decimal import Decimal

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from ledger.services.numbering import RECEIPT, next_number
from rent.models import Invoice, Payment, Receipt

logger = logging.getLogger(__name__)

ZERO = Decimal('0.00')


def _money(value) -> str:
    return f'KES {Decimal(value):,.2f}'


class ReceiptService:
    @classmethod
    @transaction.atomic
    def issue(cls, payment: Payment, notify: bool = True) -> Receipt:
        """Create the payment's receipt (idempotent) and schedule delivery."""
        existing = Receipt.objects.filter(payment=payment).first()
        if existing:
            return existing
        payment = Payment.objects.select_related('tenancy', 'tenant', 'unit', 'parent_property', 'organization').get(
            pk=payment.pk,
        )
        if payment.status != 'success':
            raise ValueError('Receipts are only issued for successful payments')

        receipt = Receipt.objects.create(
            organization=payment.organization,
            payment=payment,
            number=next_number(payment.organization, RECEIPT),
            snapshot=cls._snapshot(payment),
        )
        if notify:
            transaction.on_commit(lambda: _schedule_delivery(receipt.pk))
        return receipt

    @staticmethod
    def _snapshot(payment: Payment) -> dict:
        allocations = [
            {
                'invoice_number': a.invoice.number,
                'description': a.invoice.get_invoice_type_display(),
                'period': a.invoice.period_start.strftime('%b %Y') if a.invoice.invoice_type == 'rent' else '',
                'amount': str(a.amount),
            }
            for a in payment.allocations.select_related('invoice').order_by('created_at')
        ]
        balance_after = ZERO
        credit_after = ZERO
        if payment.tenancy_id:
            balance_after = sum(
                (i.outstanding for i in Invoice.objects.filter(tenancy_id=payment.tenancy_id)), ZERO,
            )
            credit_after = sum(
                (p.unapplied_amount for p in Payment.objects.filter(tenancy_id=payment.tenancy_id, status='success')),
                ZERO,
            )
        org = payment.organization
        return {
            'organization_name': org.name,
            'tenant_name': payment.tenant.full_name,
            'unit': payment.unit.unit_number if payment.unit_id else '',
            'property': payment.parent_property.name if payment.parent_property_id else '',
            'amount': str(payment.amount),
            'currency': payment.currency,
            'method': payment.get_payment_method_display(),
            'reference': payment.provider_reference or payment.internal_reference,
            'paid_at': (payment.paid_at or payment.created_at).isoformat(),
            'allocations': allocations,
            'credit_kept': str(payment.unapplied_amount),
            'balance_after': str(balance_after),
            'credit_after': str(credit_after),
        }

    @classmethod
    def render_pdf(cls, receipt: Receipt) -> bytes:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A5
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        s = receipt.snapshot
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A5, leftMargin=12 * mm, rightMargin=12 * mm, topMargin=12 * mm, bottomMargin=12 * mm,
            title=f'Receipt {receipt.number}',
        )
        styles = getSampleStyleSheet()
        paid_at = s.get('paid_at', '')[:10]
        story = [
            Paragraph(s.get('organization_name', ''), styles['Title']),
            Paragraph(f'<b>Payment receipt {receipt.number}</b>', styles['Heading3']),
            Spacer(1, 4 * mm),
        ]
        details = [
            ['Received from', s.get('tenant_name', '')],
            ['Unit', ' · '.join(filter(None, [s.get('unit'), s.get('property')]))],
            ['Date', paid_at],
            ['Method', s.get('method', '')],
            ['Reference', s.get('reference', '')],
            ['Amount', _money(s.get('amount', '0'))],
        ]
        table = Table(details, colWidths=[35 * mm, 85 * mm])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story += [table, Spacer(1, 5 * mm)]

        rows = [['Applied to', 'Amount']]
        for a in s.get('allocations', []):
            label = ' '.join(filter(None, [a.get('invoice_number'), a.get('description'), a.get('period')]))
            rows.append([label, _money(a['amount'])])
        if Decimal(s.get('credit_kept', '0')) > 0:
            rows.append(['Kept as credit for future invoices', _money(s['credit_kept'])])
        applied = Table(rows, colWidths=[85 * mm, 35 * mm])
        applied.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.grey),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        story += [applied, Spacer(1, 5 * mm)]
        story.append(Paragraph(f'Balance after this payment: <b>{_money(s.get("balance_after", "0"))}</b>', styles['Normal']))
        if Decimal(s.get('credit_after', '0')) > 0:
            story.append(Paragraph(f'Credit on account: {_money(s["credit_after"])}', styles['Normal']))
        story += [Spacer(1, 8 * mm), Paragraph('Issued by RumiaRent.', styles['Italic'])]
        doc.build(story)
        return buffer.getvalue()

    @classmethod
    def ensure_pdf(cls, receipt: Receipt) -> Receipt:
        if not receipt.pdf:
            receipt.pdf.save(f'{receipt.number}.pdf', ContentFile(cls.render_pdf(receipt)), save=True)
        return receipt

    @classmethod
    def deliver(cls, receipt: Receipt) -> None:
        """Render the PDF and send SMS + email, each at most once, honouring organization toggles."""
        from rent.services.notifications import send_receipt_email, send_receipt_sms

        receipt = Receipt.objects.select_related('payment__tenant', 'organization').get(pk=receipt.pk)
        cls.ensure_pdf(receipt)
        org_settings = receipt.organization.settings or {}
        now = timezone.now()
        if receipt.sent_email_at is None and org_settings.get('receipt_email', True):
            if send_receipt_email(receipt):
                Receipt.objects.filter(pk=receipt.pk).update(sent_email_at=now)
        if receipt.sent_sms_at is None and org_settings.get('receipt_sms', True):
            if send_receipt_sms(receipt):
                Receipt.objects.filter(pk=receipt.pk).update(sent_sms_at=now)


def _schedule_delivery(receipt_id) -> None:
    try:
        from rent.tasks import deliver_receipt_task

        deliver_receipt_task.delay(str(receipt_id))
    except Exception:
        # Never fail a payment over a notification-dispatch problem; the
        # receipt exists and can be downloaded/resent.
        logger.exception('Could not schedule delivery of receipt %s', receipt_id)
