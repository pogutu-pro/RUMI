"""
Inject a fake C2B confirmation through the real ingest path — for demos and
local testing without Safaricom. Refuses to run against a production paybill.

    python manage.py paybill_simulate 600999 22000 A101 [--trans-id QK12AB34CD] [--phone 254712345678]
"""

import secrets

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from paybill.models import PaybillAccount
from paybill.services import PaybillService


class Command(BaseCommand):
    help = 'Simulate an M-Pesa C2B confirmation for a sandbox paybill.'

    def add_arguments(self, parser):
        parser.add_argument('shortcode')
        parser.add_argument('amount')
        parser.add_argument('account', help='BillRefNumber the tenant typed')
        parser.add_argument('--trans-id', default='')
        parser.add_argument('--phone', default='254700000000')

    def handle(self, *args, shortcode, amount, account, trans_id, phone, **options):
        paybill = PaybillAccount.objects.filter(shortcode=shortcode).first()
        if paybill is None:
            raise CommandError(f'No paybill {shortcode} connected')
        if paybill.environment == 'production':
            raise CommandError('Refusing to simulate payments on a production paybill')
        payload = {
            'TransactionType': 'Pay Bill',
            'TransID': trans_id or f'SIM{secrets.token_hex(4).upper()}',
            'TransTime': timezone.localtime().strftime('%Y%m%d%H%M%S'),
            'TransAmount': amount,
            'BusinessShortCode': shortcode,
            'BillRefNumber': account,
            'MSISDN': phone,
            'FirstName': 'Simulated',
        }
        txn = PaybillService.ingest(paybill, payload)
        self.stdout.write(self.style.SUCCESS(
            f'{txn.trans_id}: KES {txn.amount} → {txn.status}'
            + (f' ({txn.tenancy.tenant.full_name})' if txn.tenancy_id else '')
        ))
