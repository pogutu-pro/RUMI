"""
Rent app tests — split-payment routing (Plan 02-02).

SplitPaymentRouting*: Task 1 — verified landlord splits, unverified landlord
is refused, manual payments unaffected (D-01/D-02/D-07, T-02-07).
"""
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import override_settings

from organizations.models import PayoutAccount
from rent.models import Payment
from rent.services.payment_service import PaymentService
from rumia_api.tests import RumiaTestFixtures


def _make_payment(org, tenant, tenancy=None, prop=None, unit=None, ref='REF-1'):
    return Payment.objects.create(
        organization=org,
        tenancy=tenancy,
        tenant=tenant,
        parent_property=prop,
        unit=unit,
        amount=Decimal('22000.00'),
        currency='KES',
        payment_method='paystack',
        provider='paystack',
        internal_reference=ref,
    )


@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')
class SplitPaymentRoutingTests(RumiaTestFixtures):
    def setUp(self):
        self.user, self.profile, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)

    @patch('rent.providers.paystack.requests.post')
    def test_active_payout_account_splits_payment_with_bearer_account(self, mock_post):
        PayoutAccount.objects.create(
            organization=self.org,
            status='active',
            paystack_subaccount_code='SUB_CODE_1',
        )
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'status': True,
                'data': {'reference': 'REF-1', 'authorization_url': 'https://paystack.test/pay'},
            },
        )
        payment = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit)

        result = PaymentService.initiate(payment, callback_url='https://app.test/callback')

        self.assertTrue(result['success'])
        mock_post.assert_called_once()
        body = mock_post.call_args.kwargs['json']
        self.assertEqual(body['subaccount'], 'SUB_CODE_1')
        self.assertEqual(body['bearer'], 'account')

    @patch('rent.providers.paystack.requests.post')
    def test_no_payout_account_refuses_payment_without_calling_paystack(self, mock_post):
        payment = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit)

        result = PaymentService.initiate(payment, callback_url='https://app.test/callback')

        self.assertFalse(result['success'])
        mock_post.assert_not_called()
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'failed')

    @patch('rent.providers.paystack.requests.post')
    def test_pending_verification_payout_account_refuses_payment(self, mock_post):
        PayoutAccount.objects.create(
            organization=self.org,
            status='pending_verification',
            paystack_subaccount_code='SUB_CODE_STALE',
        )
        payment = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit)

        result = PaymentService.initiate(payment, callback_url='https://app.test/callback')

        self.assertFalse(result['success'])
        mock_post.assert_not_called()
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'failed')

    def test_manual_payment_succeeds_without_payout_account(self):
        payment = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit)

        result = PaymentService.record_manual_payment(payment)

        self.assertEqual(result.status, 'success')
