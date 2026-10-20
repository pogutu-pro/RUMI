"""
Ingest M-Pesa C2B confirmations, match them to tenancies, and settle them
through the normal Phase 1 payment flow (allocation, credit, receipt, ledger).
"""

from __future__ import annotations

import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional

from django.db import IntegrityError, transaction
from django.utils import timezone

from paybill.models import IncomingTransaction, PaybillAccount
from properties.models import Tenancy, normalize_payment_reference
from rent.models import Payment

logger = logging.getLogger(__name__)

# Tenancies money can still be paid against (ended ones keep arrears).
PAYABLE_STATUSES = ('active', 'notice_period', 'pending', 'terminated', 'expired')
CURRENT_STATUSES = ('active', 'notice_period')


class PaybillError(ValueError):
    """Invalid request about a paybill transaction (maps to a 400)."""


def parse_trans_time(value) -> datetime:
    """Daraja sends TransTime as YYYYMMDDHHMMSS in Kenyan time."""
    try:
        naive = datetime.strptime(str(value), '%Y%m%d%H%M%S')
        return timezone.make_aware(naive, timezone.get_fixed_timezone(180))
    except (TypeError, ValueError):
        return timezone.now()


def normalize_phone(value: str) -> str:
    """Kenyan number as 2547XXXXXXXX / 2541XXXXXXXX, or '' when it is masked/hashed/unknown."""
    digits = ''.join(ch for ch in (value or '') if ch.isdigit())
    if len(digits) == 10 and digits.startswith('0'):
        digits = '254' + digits[1:]
    elif len(digits) == 9 and digits[0] in '17':
        digits = '254' + digits
    return digits if len(digits) == 12 and digits.startswith('254') else ''


class PaybillService:
    @classmethod
    def ingest(cls, paybill: PaybillAccount, payload: dict) -> IncomingTransaction:
        """Store a confirmation (idempotent on TransID), then try to match and settle it."""
        trans_id = str(payload.get('TransID') or '').strip()
        if not trans_id:
            raise PaybillError('Confirmation without TransID')
        existing = IncomingTransaction.objects.filter(trans_id=trans_id).first()
        if existing is not None:
            return existing
        try:
            amount = Decimal(str(payload.get('TransAmount'))).quantize(Decimal('0.01'))
        except (InvalidOperation, TypeError) as exc:
            raise PaybillError(f'Invalid TransAmount: {payload.get("TransAmount")!r}') from exc
        if amount <= 0:
            raise PaybillError('TransAmount must be positive')

        bill_ref = str(payload.get('BillRefNumber') or '').strip()
        name = ' '.join(filter(None, (payload.get(k, '') for k in ('FirstName', 'MiddleName', 'LastName'))))
        try:
            with transaction.atomic():
                txn = IncomingTransaction.objects.create(
                    paybill=paybill,
                    organization=paybill.organization,
                    trans_id=trans_id,
                    trans_type=str(payload.get('TransactionType') or ''),
                    trans_time=parse_trans_time(payload.get('TransTime')),
                    amount=amount,
                    bill_ref_number=bill_ref[:100],
                    normalized_ref=normalize_payment_reference(bill_ref)[:100],
                    msisdn=str(payload.get('MSISDN') or '')[:128],
                    payer_name=name.strip()[:150],
                    org_account_balance=str(payload.get('OrgAccountBalance') or '')[:40],
                    raw_payload=payload,
                )
        except IntegrityError:
            return IncomingTransaction.objects.get(trans_id=trans_id)  # concurrent duplicate delivery
        PaybillAccount.objects.filter(pk=paybill.pk).update(last_callback_at=timezone.now())

        tenancy, matched_by = cls.match(txn)
        if tenancy is not None:
            try:
                cls.settle(txn, tenancy, matched_by)
            except Exception:
                # The raw transaction is safely stored as unmatched — a person
                # can assign it. Never lose a confirmation over a settle error.
                logger.exception('Settling paybill transaction %s failed', trans_id)
        else:
            cls._notify_unmatched(txn)
        txn.refresh_from_db()
        return txn

    @classmethod
    def match(cls, txn: IncomingTransaction) -> tuple[Optional[Tenancy], str]:
        tenancies = Tenancy.objects.filter(organization=txn.organization, status__in=PAYABLE_STATUSES)
        ref = txn.normalized_ref
        if ref:
            by_reference = tenancies.filter(payment_reference=ref).first()
            if by_reference is not None:
                return by_reference, 'reference'
            by_unit = [
                t for t in tenancies.filter(status__in=CURRENT_STATUSES).select_related('unit')
                if normalize_payment_reference(t.unit.unit_number) == ref
            ]
            if len(by_unit) == 1:
                return by_unit[0], 'unit'
        phone = normalize_phone(txn.msisdn)
        if phone:
            by_phone = [
                t for t in tenancies.filter(status__in=CURRENT_STATUSES).select_related('tenant')
                if normalize_phone(t.tenant.phone) == phone
            ]
            if len(by_phone) == 1:
                return by_phone[0], 'phone'
        return None, ''

    @classmethod
    @transaction.atomic
    def settle(cls, txn: IncomingTransaction, tenancy: Tenancy, matched_by: str, user=None) -> Payment:
        from rent.services.payment_service import PaymentService

        txn = IncomingTransaction.objects.select_for_update().get(pk=txn.pk)
        if txn.payment_id:
            return txn.payment
        if tenancy.organization_id != txn.organization_id:
            raise PaybillError('That tenancy belongs to another organization.')

        payment = Payment.objects.create(
            organization=tenancy.organization,
            tenancy=tenancy,
            tenant=tenancy.tenant,
            parent_property=tenancy.parent_property,
            unit=tenancy.unit,
            amount=txn.amount,
            currency='KES',
            payment_method='mpesa_paybill',
            provider='mpesa',
            provider_reference=txn.trans_id,
            internal_reference=f'MPESA-{txn.trans_id}',
            status='success',
            paid_at=txn.trans_time,
            notes=f'Paybill {txn.paybill.shortcode}, account {txn.bill_ref_number or "—"}',
            recorded_by=user,
            verified_by=user,
        )
        PaymentService.settle_received(payment, created_by=user)

        txn.status = 'assigned' if matched_by == 'manual' else 'matched'
        txn.matched_by = matched_by
        txn.tenancy = tenancy
        txn.payment = payment
        if user is not None:
            txn.resolved_by = user
            txn.resolved_at = timezone.now()
        txn.save(update_fields=['status', 'matched_by', 'tenancy', 'payment', 'resolved_by', 'resolved_at'])
        return payment

    @classmethod
    def assign(cls, txn: IncomingTransaction, tenancy: Tenancy, user) -> Payment:
        if txn.status in ('matched', 'assigned'):
            raise PaybillError('This payment is already on a tenant’s account.')
        if txn.status == 'ignored':
            raise PaybillError('This payment was ignored; restore it before assigning.')
        return cls.settle(txn, tenancy, 'manual', user=user)

    @classmethod
    def ignore(cls, txn: IncomingTransaction, user, note: str) -> IncomingTransaction:
        if txn.status != 'unmatched':
            raise PaybillError('Only payments that need attention can be ignored.')
        if not (note or '').strip():
            raise PaybillError('Say why — e.g. "not rent: shop sale".')
        txn.status = 'ignored'
        txn.note = note.strip()[:255]
        txn.resolved_by = user
        txn.resolved_at = timezone.now()
        txn.save(update_fields=['status', 'note', 'resolved_by', 'resolved_at'])
        return txn

    @staticmethod
    def _notify_unmatched(txn: IncomingTransaction) -> None:
        from rent.services.notifications import _deliver

        owner = txn.organization.owner
        text = (
            f'RumiaRent: KES {txn.amount} received on paybill {txn.paybill.shortcode} '
            f'(M-Pesa {txn.trans_id}, account "{txn.bill_ref_number or "blank"}") could not be matched to a tenant. '
            f'Assign it in Payments → Paybill.'
        )
        try:
            _deliver(['email', 'in_app'], email=owner.email, phone='', user=owner,
                     subject=f'Unmatched M-Pesa payment KES {txn.amount}', body=text, sms=text,
                     kind='paybill_unmatched', metadata={'transaction_id': str(txn.pk)})
        except Exception:
            logger.exception('Unmatched-payment alert failed for %s', txn.trans_id)
