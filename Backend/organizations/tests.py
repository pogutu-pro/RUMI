"""
Organizations app tests — payout-account tracer, D-09 edit-reset, and
idempotency/access-control hardening.
"""
from unittest.mock import patch

from rest_framework.test import APIClient

from organizations.models import Organization, OrganizationMembership, PayoutAccount
from organizations.services.payout_service import PayoutService
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


class PayoutBankListViewTests(RumiaTestFixtures):
    """GET /organizations/payout/banks/ — live bank list from Paystack."""

    def test_landlord_gets_bank_list(self):
        user, profile, org = self.create_landlord_with_org()
        fake_banks = [{'name': 'Equity Bank', 'code': '068'}, {'name': 'KCB Bank', 'code': '01'}]

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'list_banks', return_value=(fake_banks, None)):
            response = client.get('/api/v1/organizations/payout/banks/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['banks'], fake_banks)
        self.assertIsNone(response.data['detail'])

    def test_unconfigured_paystack_returns_empty_list_not_error(self):
        """Paystack not yet approved/configured must not read as a hard
        failure — it's an expected state, so still 200, empty list, with a
        message the frontend can show."""
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(
            PaystackProvider, 'list_banks',
            return_value=([], 'PAYSTACK_SECRET_KEY is not set'),
        ):
            response = client.get('/api/v1/organizations/payout/banks/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['banks'], [])
        self.assertEqual(response.data['detail'], 'PAYSTACK_SECRET_KEY is not set')

    def test_tenant_gets_403(self):
        user, profile, org = self.create_landlord_with_org()
        tenant_user, _ = self.create_tenant(org)

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.get('/api/v1/organizations/payout/banks/')

        self.assertEqual(response.status_code, 403)

    def test_super_admin_can_list_banks_too(self):
        admin = self.create_super_admin()
        client = APIClient()
        client.force_authenticate(user=admin)
        with patch.object(PaystackProvider, 'list_banks', return_value=([], None)):
            response = client.get('/api/v1/organizations/payout/banks/')

        self.assertEqual(response.status_code, 200)


class PayoutServiceEditResetTests(RumiaTestFixtures):
    """Task 2: D-09 edit-reset flow — re-verification when bank details change on an active account."""

    def _active_payout_account(self, org, subaccount_code='ACCT_original'):
        return PayoutAccount.objects.create(
            organization=org,
            status='active',
            bank_name='Equity Bank',
            bank_account_number='1111111111',
            bank_code='068',
            account_name='John Kamau',
            paystack_subaccount_code=subaccount_code,
        )

    def test_editing_active_account_calls_update_subaccount_with_original_code_not_create(self):
        user, profile, org = self.create_landlord_with_org()
        self._active_payout_account(org, subaccount_code='ACCT_original')

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_success('New Name')), \
                patch.object(PaystackProvider, 'update_subaccount', return_value=_mock_subaccount_success('ACCT_original')) as mock_update, \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'KCB Bank',
                'bank_account_number': '2222222222',
                'bank_code': '001',
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'active')
        mock_update.assert_called_once_with('ACCT_original', '001', '2222222222')
        mock_create.assert_not_called()

        payout_account = PayoutAccount.objects.get(organization=org)
        self.assertEqual(payout_account.paystack_subaccount_code, 'ACCT_original')
        self.assertEqual(payout_account.account_name, 'New Name')

    def test_first_time_submission_calls_create_subaccount_never_update(self):
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_success()), \
                patch.object(PaystackProvider, 'create_subaccount', return_value=_mock_subaccount_success()) as mock_create, \
                patch.object(PaystackProvider, 'update_subaccount') as mock_update:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'Equity Bank',
                'bank_account_number': '1234567890',
                'bank_code': '068',
            })

        self.assertEqual(response.status_code, 200)
        mock_create.assert_called_once()
        mock_update.assert_not_called()

    def test_edit_resolve_failure_leaves_status_pending_verification(self):
        user, profile, org = self.create_landlord_with_org()
        self._active_payout_account(org, subaccount_code='ACCT_original')

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_failure()), \
                patch.object(PaystackProvider, 'update_subaccount') as mock_update, \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'KCB Bank',
                'bank_account_number': '2222222222',
                'bank_code': '001',
            })

        self.assertEqual(response.status_code, 502)
        mock_update.assert_not_called()
        mock_create.assert_not_called()

        payout_account = PayoutAccount.objects.get(organization=org)
        self.assertEqual(payout_account.status, 'pending_verification')
        # Old subaccount code untouched; new (unverified) bank fields are
        # already saved so a retry resubmission is treated as a plain retry.
        self.assertEqual(payout_account.paystack_subaccount_code, 'ACCT_original')
        self.assertEqual(payout_account.bank_account_number, '2222222222')


class ConcurrentSubmissionStaleActivationTests(RumiaTestFixtures):
    """CR-01 regression: an in-flight submission must not activate against
    bank details a newer, overlapping submission has already superseded.
    """

    def test_stale_submission_does_not_activate_over_newer_bank_details(self):
        user, profile, org = self.create_landlord_with_org()
        original_account_number = '1234567890'
        superseding_account_number = '5555555555'

        def resolve_side_effect(*_args, **_kwargs):
            # Simulate a second, overlapping submission completing its own
            # first atomic block (new bank fields, back to
            # pending_verification) while THIS call's Paystack round-trip
            # is still in flight — the exact interleaving CR-01 describes.
            PayoutAccount.objects.filter(organization=org).update(
                bank_account_number=superseding_account_number,
                bank_code='001',
                status='pending_verification',
            )
            return _mock_resolve_success()

        with patch.object(PaystackProvider, 'resolve_account', side_effect=resolve_side_effect), \
                patch.object(PaystackProvider, 'create_subaccount', return_value=_mock_subaccount_success('SUB_STALE')) as mock_create:
            result = PayoutService.submit_bank_details(
                org, 'Equity Bank', original_account_number, '068',
            )

        mock_create.assert_called_once()

        # The stale call must return without activating — it must not link
        # SUB_STALE (resolved/created against the original, now-superseded
        # account number) to a row that now holds different bank details.
        self.assertEqual(result.status, 'pending_verification')
        self.assertIsNone(result.paystack_subaccount_code)

        payout_account = PayoutAccount.objects.get(organization=org)
        self.assertEqual(payout_account.status, 'pending_verification')
        self.assertEqual(payout_account.bank_account_number, superseding_account_number)
        self.assertIsNone(payout_account.paystack_subaccount_code)


class IdempotentPayoutSubmissionTests(RumiaTestFixtures):
    """Task 3: identical resubmission on an active account is a safe no-op."""

    def test_double_submit_identical_active_details_makes_zero_paystack_calls(self):
        user, profile, org = self.create_landlord_with_org()
        PayoutAccount.objects.create(
            organization=org,
            status='active',
            bank_name='Equity Bank',
            bank_account_number='1234567890',
            bank_code='068',
            account_name='John Kamau',
            paystack_subaccount_code='ACCT_original',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account') as mock_resolve, \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create, \
                patch.object(PaystackProvider, 'update_subaccount') as mock_update:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'Equity Bank',
                'bank_account_number': '1234567890',
                'bank_code': '068',
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'active')
        mock_resolve.assert_not_called()
        mock_create.assert_not_called()
        mock_update.assert_not_called()

        self.assertEqual(PayoutAccount.objects.filter(organization=org).count(), 1)


class StatusNotClientWritableTests(RumiaTestFixtures):
    """Task 3: an extra client-supplied `status` key never influences the outcome."""

    def test_status_key_in_post_body_is_ignored(self):
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackProvider, 'resolve_account', return_value=_mock_resolve_failure()), \
                patch.object(PaystackProvider, 'create_subaccount') as mock_create:
            response = client.post('/api/v1/organizations/payout/', {
                'bank_name': 'Equity Bank',
                'bank_account_number': '1234567890',
                'bank_code': '068',
                'status': 'active',
            })

        self.assertEqual(response.status_code, 502)
        mock_create.assert_not_called()

        payout_account = PayoutAccount.objects.get(organization=org)
        # Driven entirely by the mocked resolve outcome (failure), never by
        # the client-supplied status='active'.
        self.assertEqual(payout_account.status, 'pending_verification')


class CrossOrgPayoutIsolationTests(RumiaTestFixtures):
    """Task 3: a supplied organization_id never leaks a foreign org's payout data."""

    def test_landlord_cannot_see_another_orgs_payout_via_organization_id_param(self):
        user_a, profile_a, org_a = self.create_landlord_with_org(email='landlord-a@test.com')
        user_b, profile_b, org_b = self.create_landlord_with_org(email='landlord-b@test.com')
        PayoutAccount.objects.create(
            organization=org_b,
            status='active',
            bank_name='KCB Bank',
            bank_account_number='9999999999',
            bank_code='001',
            account_name='Org B Owner',
            paystack_subaccount_code='ACCT_orgb',
        )

        client = APIClient()
        client.force_authenticate(user=user_a)
        response = client.get(f'/api/v1/organizations/payout/?organization_id={org_b.id}')

        # Landlord A has no payout account of their own; org_b's
        # organization_id param must be ignored entirely for a non-super_admin
        # caller — never leaked as org B's active status.
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'not_started')
