"""
Organizations app tests — payout-account tracer, D-09 edit-reset, and
idempotency/access-control hardening.
"""
from unittest.mock import patch

from rest_framework.test import APIClient

from organizations.models import Organization, OrganizationMembership, PayoutAccount
from rent.providers.base import AccountResolveResult, SubaccountResult
from rent.providers.paystack import PaystackProvider
from rumia_api.tests import RumiaTestFixtures


def _mock_resolve_success(account_name='John Kamau'):
    return AccountResolveResult(success=True, account_name=account_name)


def _mock_resolve_failure(message='Could not resolve account'):
    return AccountResolveResult(success=False, error_message=message)


def _mock_subaccount_success(code='ACCT_test123'):
    return SubaccountResult(success=True, subaccount_code=code)


class PayoutAccountTracerTests(RumiaTestFixtures):
    """Task 1: end-to-end payout setup — bank details -> resolve -> subaccount -> active."""

    def test_get_with_no_row_returns_not_started_200(self):
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/organizations/payout/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'not_started')
        self.assertFalse(PayoutAccount.objects.filter(organization=org).exists())

    def test_owner_post_valid_details_resolves_and_creates_subaccount_then_active(self):
        user, profile, org = self.create_landlord_with_org()
        raw_account_number = '1234567890'

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_success()), \
                patch.object(PaystackProvider, 'create_subaccount', return_value=_mock_subaccount_success()) as mock_create, \
                patch.object(PaystackProvider, 'update_subaccount') as mock_update:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'Equity Bank',
                'bank_account_number': raw_account_number,
                'bank_code': '068',
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'active')
        mock_create.assert_called_once()
        mock_update.assert_not_called()

        payout_account = PayoutAccount.objects.get(organization=org)
        self.assertEqual(payout_account.status, 'active')
        self.assertEqual(payout_account.account_name, 'John Kamau')
        self.assertEqual(payout_account.paystack_subaccount_code, 'ACCT_test123')

        # Raw account number, bank_code, and paystack_subaccount_code must
        # never appear in the response body.
        self.assertNotIn('bank_code', response.data)
        self.assertNotIn('paystack_subaccount_code', response.data)
        self.assertNotIn(raw_account_number, response.content.decode())

    def test_resolve_failure_returns_502_and_stays_pending_verification(self):
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_failure()), \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'Equity Bank',
                'bank_account_number': '1234567890',
                'bank_code': '068',
            })

        self.assertEqual(response.status_code, 502)
        mock_create.assert_not_called()

        payout_account = PayoutAccount.objects.get(organization=org)
        self.assertEqual(payout_account.status, 'pending_verification')

    def test_non_owner_org_member_post_is_rejected_403_no_row_created_or_modified(self):
        user, profile, org = self.create_landlord_with_org()
        admin_user, _ = self.create_tenant(org, email='admin-member@test.com', role='landlord')
        OrganizationMembership.objects.create(organization=org, user=admin_user, role='admin')

        client = APIClient()
        client.force_authenticate(user=admin_user)
        with patch.object(PaystackProvider, 'resolve_account') as mock_resolve, \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'Equity Bank',
                'bank_account_number': '1234567890',
                'bank_code': '068',
            })

        self.assertEqual(response.status_code, 403)
        mock_resolve.assert_not_called()
        mock_create.assert_not_called()
        self.assertFalse(PayoutAccount.objects.filter(organization=org).exists())
