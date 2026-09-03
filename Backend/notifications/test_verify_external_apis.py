"""
Tests for `manage.py verify_external_apis` (Backend/notifications/management/
commands/verify_external_apis.py).

Proves the four HARD-05/D-09 guarantees:
1. All-pass path exits cleanly with a PASS line per provider.
2. A single provider failure still prints all three result lines and raises
   `CommandError` (no early exit on first failure).
3. No real SMS or email is ever sent, on either the success or failure path.
4. No configured credential value is ever leaked into the command's own
   stdout output.
"""

from __future__ import annotations

import io
from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings

PAYSTACK_SECRET = 'sk_test_SECRETVALUE12345'
AFRICASTALKING_KEY = 'ATSECRETVALUE'
MAILTRAP_TOKEN = 'MAILTRAPSECRETVALUE'


def _mock_requests_get(url, headers=None, timeout=None, **kwargs):
    """Shared success-path stand-in for requests.get across Paystack/Mailtrap."""
    response = MagicMock()
    if 'paystack.co' in url:
        response.json.return_value = {'status': True, 'data': {'balance': []}}
    elif 'mailtrap.io' in url:
        response.status_code = 200
    return response


@override_settings(
    PAYSTACK_SECRET_KEY=PAYSTACK_SECRET,
    AFRICASTALKING_API_KEY=AFRICASTALKING_KEY,
    AFRICASTALKING_USERNAME='sandbox',
    MAILTRAP_API_TOKEN=MAILTRAP_TOKEN,
)
class VerifyExternalApisCommandTests(TestCase):
    def _patch_requests_get(self, side_effect=_mock_requests_get):
        return patch(
            'notifications.management.commands.verify_external_apis.requests.get',
            side_effect=side_effect,
        )

    def _patch_africastalking(self, fetch_return=None):
        application = MagicMock()
        application.fetch_application_data.return_value = (
            fetch_return if fetch_return is not None else {'balance': '100 KES'}
        )
        return (
            patch('africastalking.initialize'),
            patch('africastalking.Application', application),
        )

    def test_all_providers_pass_does_not_raise_and_prints_pass_for_each(self):
        init_patch, app_patch = self._patch_africastalking()
        out = io.StringIO()

        with self._patch_requests_get(), init_patch, app_patch:
            call_command('verify_external_apis', stdout=out)

        output = out.getvalue()
        self.assertIn('PASS: Paystack', output)
        self.assertIn("PASS: Africa's Talking", output)
        self.assertIn('PASS: Mailtrap', output)

    def test_paystack_failure_still_prints_all_three_lines_and_raises(self):
        def failing_paystack(url, headers=None, timeout=None, **kwargs):
            response = MagicMock()
            if 'paystack.co' in url:
                response.json.return_value = {'status': False, 'message': 'Invalid key'}
            elif 'mailtrap.io' in url:
                response.status_code = 200
            return response

        init_patch, app_patch = self._patch_africastalking()
        out = io.StringIO()

        with self._patch_requests_get(side_effect=failing_paystack), init_patch, app_patch:
            with self.assertRaises(CommandError):
                call_command('verify_external_apis', stdout=out)

        output = out.getvalue()
        self.assertIn('FAIL: Paystack', output)
        self.assertIn("PASS: Africa's Talking", output)
        self.assertIn('PASS: Mailtrap', output)

    def test_never_sends_real_sms_or_email_on_success_or_failure_path(self):
        init_patch, app_patch = self._patch_africastalking()

        with patch('notifications.tasks.send_sms_via_africastalking') as mock_sms, \
                patch('django.core.mail.send_mail') as mock_send_mail, \
                patch('django.core.mail.EmailMessage.send') as mock_email_send:

            with self._patch_requests_get(), init_patch, app_patch:
                call_command('verify_external_apis', stdout=io.StringIO())

            mock_sms.assert_not_called()
            mock_send_mail.assert_not_called()
            mock_email_send.assert_not_called()

            def failing_paystack(url, headers=None, timeout=None, **kwargs):
                response = MagicMock()
                if 'paystack.co' in url:
                    response.json.return_value = {'status': False, 'message': 'Invalid key'}
                elif 'mailtrap.io' in url:
                    response.status_code = 200
                return response

            with self._patch_requests_get(side_effect=failing_paystack), init_patch, app_patch:
                with self.assertRaises(CommandError):
                    call_command('verify_external_apis', stdout=io.StringIO())

            mock_sms.assert_not_called()
            mock_send_mail.assert_not_called()
            mock_email_send.assert_not_called()

    def test_no_configured_secret_value_leaks_into_output(self):
        init_patch, app_patch = self._patch_africastalking()
        out = io.StringIO()

        with self._patch_requests_get(), init_patch, app_patch:
            call_command('verify_external_apis', stdout=out)

        output = out.getvalue()
        self.assertNotIn(PAYSTACK_SECRET, output)
        self.assertNotIn(AFRICASTALKING_KEY, output)
        self.assertNotIn(MAILTRAP_TOKEN, output)
