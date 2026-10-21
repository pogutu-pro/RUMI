"""
Leasing services: generated letters (lease, demand note, notice to quit,
notice-to-vacate acknowledgement), tenant notice to vacate, debt-recovery
cases, scheduled rent reviews and lease-expiry reminders.

Letters are plain, factual templates. They are not legal advice — landlords
should have their own lease wording reviewed under Kenyan law.
"""

from __future__ import annotations

import io
import logging
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from django.core.files.base import ContentFile
from django.db import IntegrityError, transaction
from django.utils import timezone

from leasing.models import DebtCase, DebtCaseNote, LeaseReminder, RentReview, TenancyDocument
from properties.models import Tenancy
from rent.models import Invoice

logger = logging.getLogger(__name__)
ZERO = Decimal('0.00')


class LeasingError(ValueError):
    pass


def arrears(tenancy) -> Decimal:
    return sum(
        (i.outstanding for i in Invoice.objects.filter(tenancy=tenancy, is_disputed=False, due_date__lt=timezone.localdate())),
        ZERO,
    )


def _kes(value) -> str:
    return f'KES {Decimal(value):,.2f}'


def render_letter(organization_name: str, title: str, paragraphs: list[str], table: Optional[list[list[str]]] = None,
                  signature: str = '') -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    styles = getSampleStyleSheet()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=18 * mm, title=title)
    story = [
        Paragraph(organization_name, styles['Title']),
        Paragraph(title, styles['Heading2']),
        Paragraph(f'Date: {timezone.localdate():%d %B %Y}', styles['Normal']),
        Spacer(1, 6 * mm),
    ]
    for text in paragraphs:
        story += [Paragraph(text, styles['BodyText']), Spacer(1, 3 * mm)]
    if table:
        t = Table(table, repeatRows=1)
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.grey),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'), ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        story += [Spacer(1, 2 * mm), t, Spacer(1, 4 * mm)]
    if signature:
        story += [Spacer(1, 10 * mm), Paragraph(signature, styles['Normal'])]
    doc.build(story)
    return buffer.getvalue()


class DocumentService:
    @staticmethod
    def _save(tenancy, kind, title, pdf: bytes, created_by=None, details=None, visible=True) -> TenancyDocument:
        doc = TenancyDocument(
            organization=tenancy.organization, tenancy=tenancy, kind=kind, title=title, generated=True,
            visible_to_tenant=visible, details=details or {}, created_by=created_by,
        )
        doc.file.save(f'{kind}-{tenancy.payment_reference or tenancy.pk}-{timezone.now():%Y%m%d%H%M%S}.pdf',
                      ContentFile(pdf), save=False)
        doc.save()
        return doc

    @classmethod
    def lease(cls, tenancy: Tenancy, created_by=None) -> TenancyDocument:
        org = tenancy.organization
        end = tenancy.end_date.strftime('%d %B %Y') if tenancy.end_date else 'until ended by notice'
        paragraphs = [
            f'This agreement is between <b>{org.name}</b> (the landlord or its agent) and '
            f'<b>{tenancy.tenant.full_name}</b> (the tenant), ID {tenancy.tenant.national_id or "—"}.',
            f'<b>Premises:</b> unit {tenancy.unit.unit_number}, {tenancy.parent_property.name}, '
            f'{tenancy.parent_property.address}, {tenancy.parent_property.city}.',
            f'<b>Term:</b> from {tenancy.start_date:%d %B %Y}, {end}.',
            f'<b>Rent:</b> {_kes(tenancy.monthly_rent)} per month, due on day {tenancy.rent_due_day} of each month, '
            f'with a grace period of {tenancy.grace_period_days} days. Pay by M-Pesa using account number '
            f'<b>{tenancy.payment_reference}</b>, or as the landlord directs. Every payment is receipted.',
            f'<b>Deposit:</b> {_kes(tenancy.deposit)}, held for the tenant and refunded at the end of the tenancy less '
            'any unpaid rent and charges and the cost of damage beyond fair wear and tear, with an itemised settlement.',
            '<b>Notice:</b> either party may end the tenancy by giving at least one month\'s written notice.',
            'The tenant keeps the premises clean and in good condition, reports repairs promptly, and does not sublet '
            'without written consent. The landlord keeps the premises fit to live in and carries out structural repairs.',
        ]
        signature = ('Landlord / agent: ____________________ &nbsp;&nbsp;&nbsp; '
                     'Tenant: ____________________<br/><br/>Date: ____________ &nbsp;&nbsp;&nbsp; Date: ____________')
        pdf = render_letter(org.name, 'Tenancy agreement', paragraphs, signature=signature)
        return cls._save(tenancy, 'lease', f'Tenancy agreement — {tenancy.unit.unit_number}', pdf, created_by)

    @classmethod
    def demand_note(cls, tenancy: Tenancy, pay_within_days: int = 7, created_by=None) -> TenancyDocument:
        owed = arrears(tenancy)
        if owed <= 0:
            raise LeasingError('This tenant has no overdue balance.')
        invoices = Invoice.objects.filter(tenancy=tenancy, is_disputed=False, due_date__lt=timezone.localdate())
        rows = [['Invoice', 'Description', 'Due', 'Outstanding']] + [
            [i.number, i.get_invoice_type_display(), f'{i.due_date:%d %b %Y}', f'{i.outstanding:,.2f}']
            for i in invoices.order_by('due_date') if i.outstanding > 0
        ]
        pay_by = timezone.localdate() + timedelta(days=pay_within_days)
        paragraphs = [
            f'Dear {tenancy.tenant.full_name},',
            f'Our records show that <b>{_kes(owed)}</b> is overdue for unit {tenancy.unit.unit_number}, '
            f'{tenancy.parent_property.name}, as itemised below.',
            f'Please pay the full amount by <b>{pay_by:%d %B %Y}</b> using M-Pesa account number '
            f'<b>{tenancy.payment_reference}</b>. If you have already paid, or you dispute any item, contact us '
            'immediately so we can correct our records.',
            'If the balance is not settled or a payment plan agreed by that date, we may take further action, '
            'including a notice to quit.',
        ]
        pdf = render_letter(tenancy.organization.name, 'Demand for payment of rent arrears', paragraphs, rows,
                            signature=f'For {tenancy.organization.name}')
        return cls._save(tenancy, 'demand_note', f'Demand note — {_kes(owed)}', pdf, created_by,
                         details={'amount': str(owed), 'pay_by': pay_by.isoformat()})

    @classmethod
    def quit_notice(cls, tenancy: Tenancy, vacate_by: Optional[date] = None, reason: str = '', created_by=None) -> TenancyDocument:
        vacate_by = vacate_by or timezone.localdate() + timedelta(days=30)
        if vacate_by <= timezone.localdate():
            raise LeasingError('The vacate date must be in the future.')
        owed = arrears(tenancy)
        reason = reason.strip() or (f'unpaid rent and charges of {_kes(owed)}' if owed > 0 else 'termination of tenancy')
        paragraphs = [
            f'To {tenancy.tenant.full_name}, tenant of unit {tenancy.unit.unit_number}, {tenancy.parent_property.name}.',
            f'TAKE NOTICE that you are required to vacate and hand over the premises on or before '
            f'<b>{vacate_by:%d %B %Y}</b>.',
            f'Reason: {reason}.',
            'Any balance owed remains payable, and your deposit will be settled in writing after inspection of the premises.',
        ]
        pdf = render_letter(tenancy.organization.name, 'Notice to quit', paragraphs,
                            signature=f'For {tenancy.organization.name}')
        return cls._save(tenancy, 'quit_notice', f'Notice to quit — vacate by {vacate_by:%d %b %Y}', pdf, created_by,
                         details={'vacate_by': vacate_by.isoformat(), 'reason': reason, 'arrears': str(owed)})

    @classmethod
    @transaction.atomic
    def notice_to_vacate(cls, tenancy: Tenancy, move_out_date: date, reason: str = '', given_by=None,
                         by_tenant: bool = False) -> TenancyDocument:
        tenancy = Tenancy.objects.select_for_update().get(pk=tenancy.pk)
        if tenancy.status not in ('active', 'notice_period'):
            raise LeasingError('Only a current tenancy can be given notice.')
        if move_out_date <= timezone.localdate():
            raise LeasingError('The move-out date must be in the future.')
        tenancy.status = 'notice_period'
        tenancy.end_date = move_out_date
        tenancy.save(update_fields=['status', 'end_date', 'updated_at'])
        who = 'the tenant' if by_tenant else tenancy.organization.name
        paragraphs = [
            f'Notice to vacate unit {tenancy.unit.unit_number}, {tenancy.parent_property.name}, given by {who} '
            f'on {timezone.localdate():%d %B %Y}.',
            f'Move-out date: <b>{move_out_date:%d %B %Y}</b>. Rent is billed up to that date.',
            f'Reason: {reason.strip() or "not given"}.',
            'Please arrange the move-out inspection; the deposit is settled in writing afterwards.',
        ]
        pdf = render_letter(tenancy.organization.name, 'Notice to vacate', paragraphs)
        doc = cls._save(tenancy, 'notice_to_vacate', f'Notice to vacate — {move_out_date:%d %b %Y}', pdf, given_by,
                        details={'move_out_date': move_out_date.isoformat(), 'by_tenant': by_tenant, 'reason': reason})
        if by_tenant:
            _notify_owner(tenancy, f'{tenancy.tenant.full_name} ({tenancy.unit.unit_number}) gave notice to vacate on '
                                   f'{move_out_date:%d %b %Y}.' + (f' Reason: {reason}' if reason else ''))
        return doc

    @staticmethod
    def send(document: TenancyDocument) -> bool:
        """Email the PDF to the tenant and send a short SMS pointer."""
        from django.conf import settings
        from django.core.mail import EmailMessage

        from rent.services.notifications import _send_sms

        tenant = document.tenancy.tenant
        sent = False
        if tenant.email:
            message = EmailMessage(
                subject=f'{document.get_kind_display()} — {document.tenancy.organization.name}',
                body=f'Dear {tenant.full_name},\n\nPlease find attached: {document.title}.\n\n{document.tenancy.organization.name}',
                from_email=settings.DEFAULT_FROM_EMAIL, to=[tenant.email],
            )
            document.file.open('rb')
            try:
                message.attach(f'{document.kind}.pdf', document.file.read(), 'application/pdf')
            finally:
                document.file.close()
            try:
                message.send(fail_silently=False)
                sent = True
            except Exception:
                logger.exception('Sending document %s failed', document.pk)
        if _send_sms(tenant.phone, f'RumiaRent: {document.title}. A copy is in your RumiaRent account and email.'):
            sent = True
        if sent:
            TenancyDocument.objects.filter(pk=document.pk).update(sent_at=timezone.now())
        return sent


def _notify_owner(tenancy, text: str) -> None:
    from rent.services.notifications import _deliver

    owner = tenancy.organization.owner
    try:
        _deliver(['email', 'in_app'], email=owner.email, phone='', user=owner, subject='Tenancy update', body=text,
                 sms=text, kind='tenancy_update', metadata={'tenancy_id': str(tenancy.pk)})
    except Exception:
        logger.exception('Owner notification failed for tenancy %s', tenancy.pk)


class DebtService:
    @classmethod
    def open_case(cls, tenancy, assigned_to=None, created_by=None, note: str = '') -> DebtCase:
        owed = arrears(tenancy)
        if owed <= 0:
            raise LeasingError('This tenant has no overdue balance.')
        try:
            with transaction.atomic():
                case = DebtCase.objects.create(organization=tenancy.organization, tenancy=tenancy, assigned_to=assigned_to,
                                               amount_at_open=owed, created_by=created_by)
        except IntegrityError as exc:
            raise LeasingError('This tenant already has an open debt case.') from exc
        if note:
            DebtCaseNote.objects.create(case=case, author=created_by, text=note)
        if assigned_to is not None and assigned_to != created_by:
            _notify_assignee(case)
        return case

    @classmethod
    def update(cls, case: DebtCase, user, **changes) -> DebtCase:
        before = case.assigned_to_id
        for field in ('status', 'promise_date', 'promise_amount', 'assigned_to', 'closed_reason'):
            if field in changes:
                setattr(case, field, changes[field])
        if case.status == 'closed' and not case.closed_reason:
            raise LeasingError('Say why the case is closed (e.g. paid in full).')
        case.save()
        log = ', '.join(f'{k}: {v}' for k, v in changes.items() if k != 'assigned_to')
        if log:
            DebtCaseNote.objects.create(case=case, author=user, text=f'Updated — {log}')
        if case.assigned_to_id and case.assigned_to_id != before:
            _notify_assignee(case)
        return case

    @classmethod
    def close_settled(cls) -> int:
        """Close open cases whose tenant has cleared the arrears."""
        closed = 0
        for case in DebtCase.objects.exclude(status='closed').select_related('tenancy'):
            if arrears(case.tenancy) <= 0:
                case.status, case.closed_reason = 'closed', 'Arrears cleared'
                case.save(update_fields=['status', 'closed_reason', 'updated_at'])
                DebtCaseNote.objects.create(case=case, text='Closed automatically — arrears cleared.')
                closed += 1
        return closed


def _notify_assignee(case: DebtCase) -> None:
    from rent.services.notifications import _deliver

    user = case.assigned_to
    text = (f'RumiaRent: you have been assigned to follow up {case.tenancy.tenant.full_name} '
            f'({case.tenancy.unit.unit_number}), arrears {_kes(arrears(case.tenancy))}.')
    try:
        _deliver(['in_app', 'sms'], email='', phone=getattr(user, 'phone_number', ''), user=user,
                 subject='Debt recovery assigned', body=text, sms=text, kind='debt_case_assigned',
                 metadata={'case_id': str(case.pk)})
    except Exception:
        logger.exception('Assignee notification failed for case %s', case.pk)


class RentReviewService:
    NOTICE_DAYS = 30

    @classmethod
    def schedule(cls, tenancy, effective_date: date, new_monthly_rent=None, increase_percent=None,
                 repeat_annually: bool = False, created_by=None) -> RentReview:
        if (new_monthly_rent is None) == (increase_percent is None):
            raise LeasingError('Give either the new rent or an increase percentage.')
        if repeat_annually and increase_percent is None:
            raise LeasingError('Only a percentage increase can repeat every year.')
        if effective_date <= timezone.localdate():
            raise LeasingError('The effective date must be in the future.')
        return RentReview.objects.create(
            organization=tenancy.organization, tenancy=tenancy, effective_date=effective_date,
            new_monthly_rent=new_monthly_rent, increase_percent=increase_percent, repeat_annually=repeat_annually,
            created_by=created_by,
        )

    @staticmethod
    def target_rent(review: RentReview, current: Decimal) -> Decimal:
        if review.new_monthly_rent is not None:
            return review.new_monthly_rent
        return (current * (1 + review.increase_percent / 100)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)

    @classmethod
    def run(cls, as_of: Optional[date] = None) -> dict:
        as_of = as_of or timezone.localdate()
        counts = {'notified': 0, 'applied': 0}
        pending = RentReview.objects.filter(applied_at__isnull=True, cancelled_at__isnull=True).select_related('tenancy__tenant')
        for review in pending.filter(notified_at__isnull=True, effective_date__lte=as_of + timedelta(days=cls.NOTICE_DAYS)):
            tenancy = review.tenancy
            new_rent = cls.target_rent(review, tenancy.monthly_rent)
            from rent.services.notifications import _deliver
            text = (f'RumiaRent: your rent for {tenancy.unit.unit_number} changes from {_kes(tenancy.monthly_rent)} to '
                    f'{_kes(new_rent)} from {review.effective_date:%d %b %Y}.')
            try:
                _deliver(['sms', 'email', 'in_app'], email=tenancy.tenant.email, phone=tenancy.tenant.phone,
                         user=tenancy.tenant.user, subject='Rent review', body=text, sms=text, kind='rent_review',
                         metadata={'review_id': str(review.pk)})
            except Exception:
                logger.exception('Rent review notice failed for %s', review.pk)
            RentReview.objects.filter(pk=review.pk).update(notified_at=timezone.now())
            counts['notified'] += 1
        for review in pending.filter(effective_date__lte=as_of):
            with transaction.atomic():
                tenancy = Tenancy.objects.select_for_update().get(pk=review.tenancy_id)
                if tenancy.status not in ('active', 'notice_period'):
                    RentReview.objects.filter(pk=review.pk).update(cancelled_at=timezone.now())
                    continue
                previous = tenancy.monthly_rent
                tenancy.monthly_rent = cls.target_rent(review, previous)
                tenancy.save(update_fields=['monthly_rent', 'updated_at'])
                RentReview.objects.filter(pk=review.pk).update(
                    applied_at=timezone.now(), applied_rent=tenancy.monthly_rent, previous_rent=previous,
                )
                if review.repeat_annually:
                    RentReview.objects.create(
                        organization=review.organization, tenancy=tenancy,
                        effective_date=review.effective_date.replace(year=review.effective_date.year + 1),
                        increase_percent=review.increase_percent, repeat_annually=True, created_by=review.created_by,
                    )
            counts['applied'] += 1
        return counts


class LeaseExpiryService:
    THRESHOLDS = (60, 30, 7)

    @classmethod
    def run(cls, as_of: Optional[date] = None) -> int:
        as_of = as_of or timezone.localdate()
        sent = 0
        tenancies = Tenancy.objects.filter(
            status='active', end_date__isnull=False, end_date__gt=as_of,
            end_date__lte=as_of + timedelta(days=max(cls.THRESHOLDS)),
        ).select_related('tenant', 'unit', 'organization__owner')
        for tenancy in tenancies:
            days_left = (tenancy.end_date - as_of).days
            due = [d for d in cls.THRESHOLDS if days_left <= d]
            logged = set(tenancy.lease_reminders.values_list('key', flat=True))
            todo = [d for d in due if f'expiry_{d}' not in logged]
            if not todo:
                continue
            for d in todo:
                LeaseReminder.objects.get_or_create(tenancy=tenancy, key=f'expiry_{d}')
            text = (f'RumiaRent: the lease for {tenancy.tenant.full_name}, unit {tenancy.unit.unit_number}, ends on '
                    f'{tenancy.end_date:%d %b %Y} ({days_left} days). Renew it or plan the move-out.')
            _notify_owner(tenancy, text)
            from rent.services.notifications import _deliver
            try:
                _deliver(['sms', 'email', 'in_app'], email=tenancy.tenant.email, phone=tenancy.tenant.phone,
                         user=tenancy.tenant.user, subject='Your lease is ending soon',
                         body=text.replace('RumiaRent: the lease for', 'Your lease for'),
                         sms=text, kind='lease_expiry', metadata={'tenancy_id': str(tenancy.pk)})
            except Exception:
                logger.exception('Lease expiry notice failed for %s', tenancy.pk)
            sent += 1
        return sent
