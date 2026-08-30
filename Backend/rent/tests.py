"""
Rent app tests — split-payment routing (Plan 02-02).

SplitPaymentRouting*: Task 1 — verified landlord splits, unverified landlord
is refused, manual payments unaffected (D-01/D-02/D-07, T-02-07).
PayoutBlockedNotification*: Task 2 — throttled landlord/caretaker
notification on a blocked payment attempt (D-03/D-04, T-02-08).
"""
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import override_settings

from organizations.models import PayoutAccount
from properties.models import CaretakerPropertyAssignment
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

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    @patch('rent.providers.paystack.requests.post')
    def test_no_payout_account_refuses_payment_without_calling_paystack(
        self, mock_post, mock_email, mock_sms
    ):
        payment = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit)

        result = PaymentService.initiate(payment, callback_url='https://app.test/callback')

        self.assertFalse(result['success'])
        mock_post.assert_not_called()
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'failed')

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    @patch('rent.providers.paystack.requests.post')
    def test_pending_verification_payout_account_refuses_payment(
        self, mock_post, mock_email, mock_sms
    ):
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


@override_settings(PAYSTACK_SECRET_KEY='test_secret_key')
class PayoutBlockedNotificationTests(RumiaTestFixtures):
    def setUp(self):
        self.user, self.profile, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)

    def _make_caretaker(self, email='caretaker@test.com'):
        from accounts.models import CaretakerProfile, User

        caretaker_user = User.objects.create_user(
            email=email,
            password='TestPass123!',
            first_name='Care',
            last_name='Taker',
            role='caretaker',
            phone_number='+254733333333',
        )
        caretaker_profile = CaretakerProfile.objects.create(
            user=caretaker_user,
            created_by=self.user,
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='+254744444444',
        )
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=caretaker_profile,
            property_assignment=self.prop,
            organization=self.org,
            is_active=True,
        )
        return caretaker_user

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    @patch('rent.providers.paystack.requests.post')
    def test_two_blocked_attempts_within_throttle_window_send_only_once(
        self, mock_post, mock_email, mock_sms
    ):
        mock_email.return_value = True
        mock_sms.return_value = True

        payment1 = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit, ref='REF-A')
        payment2 = _make_payment(self.org, self.tenant, self.tenancy, self.prop, self.unit, ref='REF-B')

        PaymentService.initiate(payment1, callback_url='https://app.test/callback')
        PaymentService.initiate(payment2, callback_url='https://app.test/callback')

        mock_post.assert_not_called()
        self.assertEqual(mock_email.call_count, 1)
        self.assertEqual(mock_sms.call_count, 1)

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    def test_active_caretaker_is_notified_alongside_owner(self, mock_email, mock_sms):
        from organizations.services.notifications import notify_payout_blocked_attempt

        mock_email.return_value = True
        mock_sms.return_value = True
        caretaker_user = self._make_caretaker()

        notify_payout_blocked_attempt(self.org)

        called_emails = [c.args[0] for c in mock_email.call_args_list]
        self.assertIn(caretaker_user.email, called_emails)
        self.assertIn(self.user.email, called_emails)

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    def test_no_caretakers_only_owner_notified_no_error(self, mock_email, mock_sms):
        from organizations.services.notifications import notify_payout_blocked_attempt

        mock_email.return_value = True
        mock_sms.return_value = True

        notify_payout_blocked_attempt(self.org)

        self.assertEqual(mock_email.call_count, 1)
        self.assertEqual(mock_email.call_args.args[0], self.user.email)

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    def test_notification_excludes_tenant_name_and_amount(self, mock_email, mock_sms):
        from organizations.services.notifications import notify_payout_blocked_attempt

        mock_email.return_value = True
        mock_sms.return_value = True

        notify_payout_blocked_attempt(self.org)

        email_body = mock_email.call_args.args[2]
        self.assertNotIn(self.tenant.full_name, email_body)
        self.assertNotIn('22000', email_body)

    @patch('organizations.services.notifications._send_sms')
    @patch('organizations.services.notifications._send_email')
    def test_missing_owner_phone_still_sends_email_and_updates_throttle(
        self, mock_email, mock_sms
    ):
        from organizations.services.notifications import notify_payout_blocked_attempt

        self.user.phone_number = ''
        self.user.save(update_fields=['phone_number'])
        mock_email.return_value = True
        mock_sms.return_value = False

        notify_payout_blocked_attempt(self.org)

        self.assertTrue(mock_email.called)
        payout_account = PayoutAccount.objects.get(organization=self.org)
        self.assertIsNotNone(payout_account.last_payout_blocked_notified_at)
