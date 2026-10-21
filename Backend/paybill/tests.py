"""Phase 2 — paybill collection: callbacks, matching, queue, Daraja registration, references."""

from datetime import timedelta
from decimal import Decimal
from io import StringIO
from unittest.mock import MagicMock, patch

from django.core import mail
from django.core.management import CommandError, call_command
from django.test import override_settings
from rest_framework.test import APIClient

from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from paybill.crypto import DecryptionError, decrypt, encrypt
from paybill.models import IncomingTransaction, PaybillAccount
from properties.models import Tenancy
from rent.models import Invoice, Payment
from rent.services.invoicing import InvoiceService, LineSpec
from rumia_api.tests import RumiaTestFixtures

D = Decimal
SMS = 'rent.services.notifications.send_sms_via_africastalking'


def confirmation(trans_id='QK12AB34CD', amount='22000.00', ref='A101', msisdn='2547XXXXX123', shortcode='600999'):
    return {
        'TransactionType': 'Pay Bill', 'TransID': trans_id, 'TransTime': '20260505103000',
        'TransAmount': amount, 'BusinessShortCode': shortcode, 'BillRefNumber': ref,
        'InvoiceNumber': '', 'OrgAccountBalance': '50000.00', 'ThirdPartyTransID': '',
        'MSISDN': msisdn, 'FirstName': 'John', 'MiddleName': '', 'LastName': 'Kamau',
    }


class PaybillFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)  # unit A101
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.paybill = PaybillAccount.objects.create(organization=self.org, shortcode='600999')
        self.invoice = InvoiceService.create_invoice(
            self.tenancy, 'rent', [LineSpec('rent', D('22000'))],
            period_start=self.tenancy.start_date, period_end=self.tenancy.start_date, due_date=self.tenancy.start_date,
        )
        self.api = APIClient()

    def callback(self, payload, kind='confirm', token=None):
        with patch(SMS):
            return self.api.post(
                f'/api/v1/paybill/c2b/{token or self.paybill.callback_token}/{kind}/', payload, format='json',
            )

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class ReferenceTests(PaybillFixtures):
    def test_tenancy_gets_unit_number_and_relet_unit_gets_suffix(self):
        self.assertEqual(self.tenancy.payment_reference, 'A101')
        self.tenancy.status = 'terminated'
        self.tenancy.save()
        _, other = self.create_tenant(self.org, email='next@test.com')
        relet = self.create_tenancy(self.org, self.prop, self.unit, other)
        self.assertEqual(relet.payment_reference, 'A101X2')

    def test_reference_is_exposed_read_only_on_tenancy_api(self):
        response = self.client_for(self.landlord).get('/api/v1/tenancies/')
        self.assertEqual(response.data[0]['payment_reference'], 'A101')


class CallbackTests(PaybillFixtures):
    def test_confirmation_matches_reference_and_settles_like_any_payment(self):
        response = self.callback(confirmation(ref='a-101 '))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {'ResultCode': 0, 'ResultDesc': 'Accepted'})

        txn = IncomingTransaction.objects.get()
        self.assertEqual((txn.status, txn.matched_by, txn.tenancy_id), ('matched', 'reference', self.tenancy.id))
        payment = txn.payment
        self.assertEqual((payment.status, payment.payment_method, payment.provider_reference),
                         ('success', 'mpesa_paybill', 'QK12AB34CD'))
        self.assertEqual(payment.paid_at.strftime('%Y-%m-%d %H:%M'), '2026-05-05 07:30')  # 10:30 EAT in UTC
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'paid')
        self.assertTrue(hasattr(payment, 'receipt'))
        self.assertEqual(LedgerService.balance(self.org, chart.MPESA_PAYBILL), D('22000.00'))
        assert_ledger_balanced(self)

    def test_duplicate_delivery_is_idempotent(self):
        self.callback(confirmation())
        self.callback(confirmation())
        self.assertEqual(IncomingTransaction.objects.count(), 1)
        self.assertEqual(Payment.objects.filter(payment_method='mpesa_paybill').count(), 1)

    def test_unmatched_goes_to_queue_and_alerts_owner(self):
        self.callback(confirmation(ref='WRONG99'))
        txn = IncomingTransaction.objects.get()
        self.assertEqual(txn.status, 'unmatched')
        self.assertIsNone(txn.payment_id)
        self.assertEqual(mail.outbox[-1].to, [self.landlord.email])
        self.assertIn('WRONG99', mail.outbox[-1].body)

    def test_plain_phone_matches_but_masked_or_hashed_does_not(self):
        self.tenant.phone = '0722 222 222'
        self.tenant.save()
        self.callback(confirmation(trans_id='T1', ref='', msisdn='254722222222'))
        self.assertEqual(IncomingTransaction.objects.get(trans_id='T1').matched_by, 'phone')
        self.callback(confirmation(trans_id='T2', ref='', msisdn='a3f5c9e1d2b4' * 5))
        self.callback(confirmation(trans_id='T3', ref='', msisdn='2547****222'))
        self.assertEqual(
            set(IncomingTransaction.objects.filter(trans_id__in=['T2', 'T3']).values_list('status', flat=True)),
            {'unmatched'},
        )

    def test_overpayment_is_kept_as_credit(self):
        self.callback(confirmation(amount='25000'))
        self.assertEqual(IncomingTransaction.objects.get().payment.unapplied_amount, D('3000.00'))

    def test_validation_always_accepts(self):
        response = self.callback(confirmation(ref='anything'), kind='validate')
        self.assertEqual(response.data['ResultCode'], 0)
        self.assertEqual(IncomingTransaction.objects.count(), 0)

    def test_unknown_token_and_wrong_shortcode_rejected(self):
        self.assertEqual(self.callback(confirmation(), token='nope').status_code, 404)
        self.assertEqual(self.callback(confirmation(shortcode='111111')).status_code, 400)
        self.paybill.is_active = False
        self.paybill.save()
        self.assertEqual(self.callback(confirmation()).status_code, 404)
        self.assertEqual(IncomingTransaction.objects.count(), 0)

    @override_settings(MPESA_CALLBACK_ALLOWED_IPS=['196.201.214.200'])
    def test_unlisted_ip_is_held_for_review_not_lost_or_posted(self):
        held = self.callback(confirmation(trans_id='QKHELD0001'))
        self.assertEqual(held.status_code, 200)
        txn = IncomingTransaction.objects.get(trans_id='QKHELD0001')
        self.assertEqual((txn.status, txn.unverified_source, txn.payment_id), ('unmatched', True, None))

        with patch(SMS):
            ok = self.api.post(f'/api/v1/paybill/c2b/{self.paybill.callback_token}/confirm/', confirmation(),
                               format='json', REMOTE_ADDR='196.201.214.200')
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(IncomingTransaction.objects.get(trans_id='QK12AB34CD').status, 'matched')

    def test_bad_amount_is_logged_not_crashing(self):
        response = self.callback(confirmation(amount='abc'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(IncomingTransaction.objects.count(), 0)


class QueueTests(PaybillFixtures):
    def unmatched(self):
        self.callback(confirmation(ref='??'))
        return IncomingTransaction.objects.get()

    def test_owner_assigns_unmatched_payment(self):
        txn = self.unmatched()
        landlord = self.client_for(self.landlord)
        listing = landlord.get('/api/v1/paybill/transactions/?status=unmatched')
        self.assertEqual([t['trans_id'] for t in listing.data], ['QK12AB34CD'])

        with patch(SMS):
            response = landlord.post(f'/api/v1/paybill/transactions/{txn.id}/assign/',
                                     {'tenancy': str(self.tenancy.id)}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual((response.data['status'], response.data['matched_by']), ('assigned', 'manual'))
        self.assertEqual(response.data['receipt_number'], 'RCT-000001')
        again = landlord.post(f'/api/v1/paybill/transactions/{txn.id}/assign/', {'tenancy': str(self.tenancy.id)},
                              format='json')
        self.assertEqual(again.status_code, 400)

    def test_cannot_assign_to_another_organizations_tenancy(self):
        txn = self.unmatched()
        _, _, other_org = self.create_landlord_with_org('other@test.com')
        other_prop, other_unit = self.create_property_with_unit(other_org, name='Other')
        _, other_tenant = self.create_tenant(other_org, email='ot@test.com')
        foreign = self.create_tenancy(other_org, other_prop, other_unit, other_tenant)
        response = self.client_for(self.landlord).post(f'/api/v1/paybill/transactions/{txn.id}/assign/',
                                                       {'tenancy': str(foreign.id)}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_ignore_needs_a_reason_and_tenants_cannot_see_queue(self):
        txn = self.unmatched()
        landlord = self.client_for(self.landlord)
        self.assertEqual(landlord.post(f'/api/v1/paybill/transactions/{txn.id}/ignore/', {}, format='json').status_code, 400)
        self.assertEqual(landlord.post(f'/api/v1/paybill/transactions/{txn.id}/ignore/', {'note': 'Shop sale'},
                                       format='json').data['status'], 'ignored')
        self.assertEqual(self.client_for(self.tenant_user).get('/api/v1/paybill/transactions/').status_code, 403)


class AccountApiTests(PaybillFixtures):
    def test_connect_paybill_never_returns_credentials(self):
        response = self.client_for(self.landlord).post('/api/v1/paybill/accounts/', {
            'shortcode': '174379', 'display_name': 'Greenview', 'consumer_key': 'ck', 'consumer_secret': 'cs',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data['has_credentials'])
        self.assertNotIn('consumer_key', response.data)
        self.assertNotIn('consumer_secret', response.data)
        stored = PaybillAccount.objects.get(shortcode='174379')
        self.assertNotIn('ck', stored.consumer_key_encrypted)
        self.assertEqual(stored.consumer_key, 'ck')

    def test_validation(self):
        landlord = self.client_for(self.landlord)
        self.assertEqual(landlord.post('/api/v1/paybill/accounts/', {'shortcode': '12'}, format='json').status_code, 400)
        self.assertEqual(landlord.post('/api/v1/paybill/accounts/', {'shortcode': '600999'}, format='json').status_code, 400)
        self.assertEqual(landlord.post('/api/v1/paybill/accounts/', {'shortcode': '174379', 'consumer_key': 'only'},
                                       format='json').status_code, 400)
        self.assertEqual(self.client_for(self.tenant_user).get('/api/v1/paybill/accounts/').status_code, 403)

    @override_settings(BACKEND_API_URL='https://api.example.test')
    def test_register_urls_with_safaricom(self):
        self.paybill.set_credentials('ck', 'cs')
        self.paybill.save()
        token_response = MagicMock(json=lambda: {'access_token': 'tok', 'expires_in': '3599'})
        register_response = MagicMock(json=lambda: {'ResponseCode': '0', 'ResponseDescription': 'Success'})
        with patch('paybill.daraja.requests.get', return_value=token_response) as get, \
                patch('paybill.daraja.requests.post', return_value=register_response) as post:
            response = self.client_for(self.landlord).post(f'/api/v1/paybill/accounts/{self.paybill.id}/register-urls/')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(get.call_args.kwargs['auth'], ('ck', 'cs'))
        sent = post.call_args.kwargs['json']
        self.assertEqual(sent['ShortCode'], '600999')
        self.assertEqual(sent['ConfirmationURL'],
                         f'https://api.example.test/api/v1/paybill/c2b/{self.paybill.callback_token}/confirm/')
        self.assertNotIn('mpesa', sent['ConfirmationURL'].lower())
        self.assertIsNotNone(response.data['registered_at'])

    def test_register_failure_is_502(self):
        response = self.client_for(self.landlord).post(f'/api/v1/paybill/accounts/{self.paybill.id}/register-urls/')
        self.assertEqual(response.status_code, 502)  # no credentials

    def test_rotate_token_invalidates_old_callback_url(self):
        old = self.paybill.callback_token
        self.client_for(self.landlord).post(f'/api/v1/paybill/accounts/{self.paybill.id}/rotate-token/')
        self.assertEqual(self.callback(confirmation(), token=old).status_code, 404)


class TenantInstructionsAndToolsTests(PaybillFixtures):
    def test_tenant_sees_paybill_and_account_number(self):
        data = self.client_for(self.tenant_user).get('/api/v1/paybill/instructions/').data
        self.assertEqual(data, [{
            'tenancy': str(self.tenancy.id), 'unit_number': 'A101', 'shortcode': '600999',
            'shortcode_type': 'paybill', 'business_name': self.org.name, 'account_number': 'A101',
        }])

    def test_simulate_command(self):
        with patch(SMS):
            call_command('paybill_simulate', '600999', '22000', 'A101', stdout=StringIO())
        self.assertEqual(IncomingTransaction.objects.get().status, 'matched')
        self.paybill.environment = 'production'
        self.paybill.save()
        with self.assertRaises(CommandError):
            call_command('paybill_simulate', '600999', '1', 'A101', stdout=StringIO())

    def test_crypto_roundtrip_and_wrong_key(self):
        token = encrypt('secret')
        self.assertEqual(decrypt(token), 'secret')
        with override_settings(FIELD_ENCRYPTION_KEY='bnJlcGxhY2VtZW50LWtleS1mb3ItdGVzdHMtMzJieXQ='):
            with self.assertRaises(DecryptionError):
                decrypt(token)


class MatchingHardeningTests(PaybillFixtures):
    """How real tenants type account numbers, and learning from the landlord."""

    def setUp(self):
        super().setUp()
        from properties.models import RentalUnit
        unit_b = RentalUnit.objects.create(organization=self.org, parent_property=self.prop, unit_number='B12',
                                           monthly_rent=D('15000'))
        _, tenant_b = self.create_tenant(self.org, email='second@test.com')
        self.tenancy_b = self.create_tenancy(self.org, self.prop, unit_b, tenant_b)

    def matched(self, ref, trans_id):
        self.callback(confirmation(trans_id=trans_id, ref=ref, amount='1000.00'))
        txn = IncomingTransaction.objects.get(trans_id=trans_id)
        return txn.tenancy_id, txn.matched_by

    def test_account_number_inside_extra_words(self):
        self.assertEqual(self.matched('rent b12 oct', 'QKWORD0001'), (self.tenancy_b.pk, 'fuzzy'))

    def test_lookalike_characters(self):
        self.assertEqual(self.matched('BI2', 'QKLOOK0001'), (self.tenancy_b.pk, 'fuzzy'))
        self.assertEqual(self.matched('A1O1', 'QKLOOK0002'), (self.tenancy.pk, 'fuzzy'))

    def test_noise_alone_never_matches(self):
        self.assertEqual(self.matched('RENT', 'QKNOISE001'), (None, ''))

    def test_assigning_by_hand_teaches_the_next_payment(self):
        self.callback(confirmation(trans_id='QKLEARN001', ref='JOHN K', amount='500.00'))
        first = IncomingTransaction.objects.get(trans_id='QKLEARN001')
        self.assertEqual(first.status, 'unmatched')
        with patch(SMS):
            response = self.client_for(self.landlord).post(
                f'/api/v1/paybill/transactions/{first.id}/assign/', {'tenancy': str(self.tenancy.id)}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.matched('john k', 'QKLEARN002'), (self.tenancy.pk, 'alias'))

    def test_a_wrongly_learned_reference_is_undone_by_reversing(self):
        from paybill.models import PaybillReferenceAlias
        from paybill.services import PaybillService
        from rent.services.payment_service import PaymentService
        self.callback(confirmation(trans_id='QKMAMA0001', ref='MAMA', amount='500.00'))
        with patch(SMS):
            PaybillService.assign(IncomingTransaction.objects.get(trans_id='QKMAMA0001'), self.tenancy, self.landlord)
        # Another tenant also types MAMA: it is wrongly matched by the learned reference.
        self.assertEqual(self.matched('MAMA', 'QKMAMA0002'), (self.tenancy.pk, 'alias'))
        wrong = IncomingTransaction.objects.get(trans_id='QKMAMA0002')

        PaymentService.reverse_payment(wrong.payment, reversed_by=self.landlord, reason='Wrong tenant')
        wrong.refresh_from_db()
        self.assertEqual((wrong.status, wrong.payment_id), ('unmatched', None))

        with patch(SMS):
            payment = PaybillService.assign(wrong, self.tenancy_b, self.landlord)  # now to the right tenant
        self.assertEqual((payment.tenancy_id, payment.internal_reference), (self.tenancy_b.pk, 'MPESA-QKMAMA0002-R2'))
        # Two tenants type MAMA: it is never guessed again.
        self.assertTrue(PaybillReferenceAlias.objects.get(normalized_ref='MAMA').contested)
        self.assertEqual(self.matched('MAMA', 'QKMAMA0003'), (None, ''))

    def test_never_learns_another_tenants_unit_number(self):
        from paybill.models import PaybillReferenceAlias
        from paybill.services import PaybillService
        self.tenancy_b.status = 'expired'  # B12 no longer current, so 'B12' stays unmatched
        self.tenancy_b.save(update_fields=['status'])
        self.callback(confirmation(trans_id='QKUNIT0001', ref='B12X', amount='500.00'))
        txn = IncomingTransaction.objects.get(trans_id='QKUNIT0001')
        Tenancy.objects.filter(pk=self.tenancy_b.pk).update(payment_reference='B12X')
        with patch(SMS):
            PaybillService.assign(txn, self.tenancy, self.landlord)
        self.assertFalse(PaybillReferenceAlias.objects.exists())


class ReminderHowToPayTests(PaybillFixtures):
    def test_overdue_reminder_says_where_and_with_which_account_number(self):
        from rent.services.notifications import how_to_pay, send_invoice_reminder
        self.assertEqual(how_to_pay(self.tenancy), f'Pay via M-Pesa Paybill 600999, Account {self.tenancy.payment_reference}.')
        with patch(SMS) as sms:
            send_invoice_reminder(self.invoice, 'overdue_3', ['sms'], self.invoice.due_date + timedelta(days=3))
        self.assertIn('Paybill 600999', sms.call_args[0][1])


class PaybillAttentionTests(PaybillFixtures):
    def keys(self):
        from rumia_api.attention import attention_items
        return {item['key'] for item in attention_items(self.org)}

    def test_quiet_paybill_and_monthly_statement_check(self):
        from django.utils import timezone
        long_ago = timezone.now() - timedelta(days=40)
        PaybillAccount.objects.filter(pk=self.paybill.pk).update(
            registered_at=long_ago, last_callback_at=long_ago, created_at=long_ago)
        keys = self.keys()
        self.assertIn('paybill_quiet_600999', keys)
        self.assertIn('statement_check', keys)

    def test_new_paybill_is_not_nagged(self):
        self.assertFalse({'statement_check', 'paybill_quiet_600999'} & self.keys())

