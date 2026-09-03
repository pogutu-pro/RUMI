"""
Monitoring app tests — /health/ endpoint's Paystack key/env surface
(HARD-04/D-05, Plan 07-03 Task 3).
"""
from unittest.mock import patch

from django.test import Client, TestCase, override_settings

from rent.providers.base import ProviderConfigStatus, ProviderStatus


class HealthCheckPaystackTests(TestCase):
    def setUp(self):
        self.client = Client()

    @patch('rent.providers.paystack.PaystackProvider.get_config_status')
    def test_misconfigured_paystack_returns_503_unhealthy(self, mock_get_config_status):
        mock_get_config_status.return_value = ProviderConfigStatus(
            provider='paystack',
            status=ProviderStatus.MISCONFIGURED,
            message='PAYSTACK_SECRET_KEY prefix does not match PAYSTACK_ENV=live',
        )

        response = self.client.get('/health/')

        self.assertEqual(response.status_code, 503)
        data = response.json()
        self.assertEqual(data['status'], 'unhealthy')
        self.assertEqual(data['services']['paystack']['status'], 'unhealthy')

    @patch('rent.providers.paystack.PaystackProvider.get_config_status')
    def test_available_paystack_returns_200_healthy(self, mock_get_config_status):
        mock_get_config_status.return_value = ProviderConfigStatus(
            provider='paystack',
            status=ProviderStatus.AVAILABLE,
        )

        response = self.client.get('/health/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['services']['paystack']['status'], 'healthy')

    @override_settings(
        PAYSTACK_ENV='live',
        PAYSTACK_SECRET_KEY='sk_test_supersecretrawvalue',
    )
    def test_paystack_detail_never_contains_raw_secret_value(self):
        # Real (un-mocked) misconfiguration — env='live' but a test-prefixed
        # secret — so this exercises the actual get_config_status() message
        # construction, not a hand-built mock message.
        response = self.client.get('/health/')

        self.assertEqual(response.status_code, 503)
        raw_body = response.content.decode()
        self.assertNotIn('sk_test_supersecretrawvalue', raw_body)
