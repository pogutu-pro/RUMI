"""
Ingest M-Pesa C2B confirmations, match them to tenancies, and settle them
through the normal Phase 1 payment flow (allocation, credit, receipt, ledger).
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional

from django.db import IntegrityError, transaction
from django.utils import timezone

from paybill.models import IncomingTransaction, PaybillAccount, PaybillReferenceAlias
from properties.models import Tenancy, normalize_payment_reference
from rent.models import Payment

logger = logging.getLogger(__name__)

# Tenancies money can still be paid against (ended ones keep arrears).
PAYABLE_STATUSES = ('active', 'notice_period', 'pending', 'terminated', 'expired')
CURRENT_STATUSES = ('active', 'notice_period')


# Words tenants add around their account number ("RENT A3 OCT"). Never
# matched on their own and never learned as an alias: they would send every
# tenant who types "RENT" to the same account.
NOISE_WORDS = {
    'RENT', 'HOUSE', 'HSE', 'HS', 'PAYMENT', 'PAY', 'KODI', 'DEPOSIT', 'WATER', 'BILL', 'ACC', 'ACCOUNT',
    'UNIT', 'NO', 'APT', 'ROOM', 'FLAT', 'FOR', 'THE', 'MONTH', 'BAL', 'BALANCE', 'ARREARS',
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'SEPT', 'OCT', 'NOV', 'DEC',
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
}
# Characters people confuse when typing an account number on a phone.
_LOOKALIKE = str.maketrans({'O': '0', 'I': '1', 'L': '1', 'S': '5', 'B': '8'})


def lookalike(ref: str) -> str:
    return ref.translate(_LOOKALIKE)


def reference_tokens(raw: str) -> list[str]:
    """The words in what the tenant typed that could be an account number."""
    words = re.findall(r'[A-Z0-9]+', (raw or '').upper())
    return [w for w in words if w not in NOISE_WORDS and not re.fullmatch(r'(19|20)\d\d', w)]


def learnable(ref: str) -> bool:
    """Whether an account number is specific enough to remember for one tenant."""
    if ref in NOISE_WORDS:
        return False
    return len(ref) >= 3 if ref.isdigit() else len(ref) >= 2


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
    def ingest(cls, paybill: PaybillAccount, payload: dict, trusted: bool = True) -> IncomingTransaction:
        """
        Store a confirmation (idempotent on TransID), then try to match and settle it.
        `trusted=False` (sender IP not on the allowlist) stores it for a person to
        check instead of settling it: never lose a payment, never auto-post one we
        cannot vouch for.
        """
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
                    unverified_source=not trusted,
                    note='' if trusted else 'Arrived from an address not on the Safaricom list. Check your M-Pesa statement before assigning.',
                )
        except IntegrityError:
            return IncomingTransaction.objects.get(trans_id=trans_id)  # concurrent duplicate delivery
        PaybillAccount.objects.filter(pk=paybill.pk).update(last_callback_at=timezone.now())

        tenancy, matched_by = cls.match(txn) if trusted else (None, '')
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
        """
        Find the one tenancy a payment belongs to, most certain rule first.
        Every rule needs a single answer: anything ambiguous goes to a person.
        """
        payable = Tenancy.objects.filter(organization=txn.organization, status__in=PAYABLE_STATUSES)
        current = list(
            payable.filter(status__in=CURRENT_STATUSES).select_related('unit', 'tenant')
        )
        ref = txn.normalized_ref

        def unique(found) -> Optional[Tenancy]:
            found = {t.pk: t for t in found}
            return next(iter(found.values())) if len(found) == 1 else None

        if ref:
            # 1. The tenant's own account number, exactly.
            exact = payable.filter(payment_reference=ref).first()
            if exact is not None:
                return exact, 'reference'
            # 2. The unit number, when only one current tenant has it.
            by_unit = unique(t for t in current if normalize_payment_reference(t.unit.unit_number) == ref)
            if by_unit is not None:
                return by_unit, 'unit'
            # 3. Something this tenant typed before and the landlord assigned.
            alias = PaybillReferenceAlias.objects.filter(
                organization=txn.organization, normalized_ref=ref, contested=False,
                tenancy__status__in=CURRENT_STATUSES,
            ).select_related('tenancy').first()
            if alias is not None:
                PaybillReferenceAlias.objects.filter(pk=alias.pk).update(times_used=alias.times_used + 1)
                return alias.tenancy, 'alias'

        # 4. One word of what they typed is an account or unit number ("RENT A3 OCT").
        tokens = reference_tokens(txn.bill_ref_number)
        if tokens and tokens != [ref]:
            by_token = unique(
                t for t in current for token in tokens
                if token in (t.payment_reference, normalize_payment_reference(t.unit.unit_number))
            )
            if by_token is not None:
                return by_token, 'fuzzy'

        # 5. Look-alike characters: "AO3" for "A03", "BI2" for "B12".
        candidates = [ref, *tokens] if ref else tokens
        if candidates:
            typed = {lookalike(c) for c in candidates if len(c) >= 2}
            by_lookalike = unique(
                t for t in current
                if lookalike(t.payment_reference) in typed
                or lookalike(normalize_payment_reference(t.unit.unit_number)) in typed
            )
            if by_lookalike is not None:
                return by_lookalike, 'fuzzy'

        # 6. The phone number, when Safaricom has not masked it.
        phone = normalize_phone(txn.msisdn)
        if phone:
            by_phone = unique(t for t in current if normalize_phone(t.tenant.phone) == phone)
            if by_phone is not None:
                return by_phone, 'phone'
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
            internal_reference=cls._internal_reference(txn),
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

    @staticmethod
    def _internal_reference(txn: IncomingTransaction) -> str:
        """MPESA-<code>; a payment re-assigned after a reversal gets -R2, -R3..."""
        base = f'MPESA-{txn.trans_id}'
        if not Payment.objects.filter(internal_reference=base).exists():
            return base
        n = 2
        while Payment.objects.filter(internal_reference=f'{base}-R{n}').exists():
            n += 1
        return f'{base}-R{n}'

    @staticmethod
    def release(payment: Payment, reason: str = '') -> None:
        """
        A reversed payment's M-Pesa notice goes back to the queue so it can be
        given to the right tenant; a reference learned for the wrong tenant is
        forgotten. Called from PaymentService.reverse_payment.
        """
        txn = IncomingTransaction.objects.filter(payment=payment).first()
        if txn is None:
            return
        if txn.matched_by == 'alias' and txn.normalized_ref:
            PaybillReferenceAlias.objects.filter(
                organization_id=txn.organization_id, normalized_ref=txn.normalized_ref,
            ).update(contested=True, tenancy=None)
        txn.status, txn.matched_by, txn.payment, txn.tenancy = 'unmatched', '', None, None
        txn.resolved_by, txn.resolved_at = None, None
        txn.note = f'Back to assign: the payment to the first tenant was reversed. {reason}'.strip()[:255]
        txn.save(update_fields=['status', 'matched_by', 'payment', 'tenancy', 'resolved_by', 'resolved_at', 'note'])

    @classmethod
    def assign(cls, txn: IncomingTransaction, tenancy: Tenancy, user) -> Payment:
        if txn.status in ('matched', 'assigned'):
            raise PaybillError('This payment is already on a tenant’s account.')
        if txn.status == 'ignored':
            raise PaybillError('This payment was ignored; restore it before assigning.')
        payment = cls.settle(txn, tenancy, 'manual', user=user)
        cls._learn(txn, tenancy, user)
        return payment

    @staticmethod
    def _learn(txn: IncomingTransaction, tenancy: Tenancy, user) -> None:
        """
        Remember what this tenant typed so their next payment matches on its own.
        A reference that turns out to belong to two tenants is forgotten instead.
        """
        ref = txn.normalized_ref
        if txn.unverified_source or not ref or ref == tenancy.payment_reference or not learnable(ref):
            return
        others = Tenancy.objects.filter(organization=txn.organization).exclude(pk=tenancy.pk).select_related('unit')
        if any(ref in (t.payment_reference, normalize_payment_reference(t.unit.unit_number)) for t in others):
            return  # another tenant's account or unit number: never learn it for this one
        alias = PaybillReferenceAlias.objects.filter(organization=txn.organization, normalized_ref=ref).first()
        if alias is None:
            PaybillReferenceAlias.objects.create(
                organization=txn.organization, normalized_ref=ref, tenancy=tenancy, created_by=user,
            )
        elif not alias.contested and alias.tenancy_id != tenancy.pk:
            alias.contested, alias.tenancy = True, None  # two tenants type it: stop guessing
            alias.save(update_fields=['contested', 'tenancy'])

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
