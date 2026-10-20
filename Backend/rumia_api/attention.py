"""
'Needs your attention' — the landlord's prioritised to-do list (design rule:
separate urgent from routine and always show the next action).
Each item: key, tone (urgent/warning/info), count, title, detail, href.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from accounting.models import StatementLine
from accounting.books_views import OwnerScopedView
from agency.models import PropertyOwner
from agency.services import OwnerStatementService
from leasing.models import DebtCase
from leasing.services import arrears
from listings.models import ListingEnquiry
from organizations.models import PayoutAccount
from paybill.models import IncomingTransaction, PaybillAccount
from properties.models import Tenancy
from rent.models import Invoice, Payment

ZERO = Decimal('0')


def _n(count: int, singular: str, plural: str) -> str:
    return singular if count == 1 else plural


def _kes(value) -> str:
    return f'KES {Decimal(value):,.0f}'


def attention_items(org) -> list[dict]:
    today = timezone.localdate()
    items = []

    def add(key, tone, count, title, detail, href):
        if count:
            items.append({'key': key, 'tone': tone, 'count': count, 'title': title, 'detail': detail, 'href': href})

    unmatched = IncomingTransaction.objects.filter(organization=org, status='unmatched')
    add('paybill_unmatched', 'urgent', unmatched.count(), _n(unmatched.count(), 'M-Pesa payment to assign', 'M-Pesa payments to assign'),
        'Tenants paid but used an account number we could not match. Their balance stays wrong until you assign them.',
        '/landlord/rental/paybill')

    current = Tenancy.objects.filter(organization=org, status__in=('active', 'notice_period')).select_related('tenant')
    owing = [(t, arrears(t)) for t in current]
    owing = [(t, a) for t, a in owing if a > 0]
    open_cases = set(DebtCase.objects.filter(organization=org).exclude(status='closed').values_list('tenancy_id', flat=True))
    no_case = [t for t, _ in owing if t.pk not in open_cases]
    add('arrears', 'urgent', len(owing), _n(len(owing), 'tenant in arrears', 'tenants in arrears'),
        f'{_kes(sum((a for _, a in owing), ZERO))} overdue; {len(no_case)} without a follow-up case. '
        'Reminders already go out automatically.', '/landlord/rental/debt')

    promises = DebtCase.objects.filter(organization=org, status='promised', promise_date__lt=today)
    add('broken_promises', 'warning', promises.count(), _n(promises.count(), 'broken payment promise', 'broken payment promises'),
        'Promised payment dates have passed. Follow up or escalate.', '/landlord/rental/debt')

    disputed = Invoice.objects.filter(organization=org, is_disputed=True).exclude(status__in=('paid', 'waived'))
    add('disputes', 'warning', disputed.count(), _n(disputed.count(), 'disputed invoice', 'disputed invoices'),
        'A tenant says an invoice is wrong. Resolve it or issue a credit note.', '/landlord/rental/rent')

    flagged = Payment.objects.filter(organization=org, status='disputed')
    add('payment_flags', 'warning', flagged.count(), _n(flagged.count(), 'payment needs review', 'payments need review'),
        'Paystack settled a different amount than expected, or a chargeback was opened.', '/landlord/rental/payments')

    lines = StatementLine.objects.filter(statement__organization=org, status='unmatched')
    add('reconcile', 'info', lines.count(), _n(lines.count(), 'statement line to reconcile', 'statement lines to reconcile'),
        'Money in your bank/M-Pesa statement that is not yet on a tenant’s account.', '/landlord/rental/accounts')

    ending = Tenancy.objects.filter(organization=org, status='active', end_date__gte=today,
                                    end_date__lte=today + timedelta(days=30))
    add('leases_ending', 'info', ending.count(), _n(ending.count(), 'lease ends within 30 days', 'leases end within 30 days'),
        'Renew, schedule a rent review, or plan the move-out.', '/landlord/rental/tenancies')

    leaving = Tenancy.objects.filter(organization=org, status='notice_period', end_date__lte=today + timedelta(days=14))
    add('move_outs', 'info', leaving.count(), _n(leaving.count(), 'move-out in the next 14 days', 'move-outs in the next 14 days'),
        'Book the inspection and draft the deposit settlement.', '/landlord/rental/tenancies')

    enquiries = ListingEnquiry.objects.filter(organization=org, handled=False)
    add('enquiries', 'info', enquiries.count(), _n(enquiries.count(), 'new rental enquiry', 'new rental enquiries'),
        'People asking about your vacant units.', '/landlord/rental/properties')

    owners_due = [o for o in PropertyOwner.objects.filter(organization=org, is_active=True)
                  if OwnerStatementService.balance(o) > 0]
    add('owners_due', 'info', len(owners_due), _n(len(owners_due), 'owner waiting to be paid', 'owners waiting to be paid'),
        f'{_kes(sum((OwnerStatementService.balance(o) for o in owners_due), ZERO))} approved but not yet remitted.',
        '/landlord/rental/owners')

    payout = PayoutAccount.objects.filter(organization=org).first()
    has_paybill = PaybillAccount.objects.filter(organization=org, is_active=True).exists()
    if not has_paybill and (payout is None or payout.status != 'active'):
        items.append({'key': 'collection_setup', 'tone': 'warning', 'count': 1, 'title': 'Set up rent collection',
                      'detail': 'Connect your M-Pesa paybill so tenant payments are recorded automatically.',
                      'href': '/landlord/rental/paybill'})

    order = {'urgent': 0, 'warning': 1, 'info': 2}
    return sorted(items, key=lambda i: order[i['tone']])


class AttentionView(OwnerScopedView):
    def get(self, request):
        org = self.organization(request)
        if org is None:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        return Response(attention_items(org))
