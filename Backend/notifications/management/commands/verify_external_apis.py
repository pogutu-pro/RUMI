"""
Verify Paystack, Africa's Talking, and Mailtrap credentials resolve and are
authenticated against the currently configured environment.

Read-only and side-effect-free (per HARD-05/D-09): every provider check is a
single GET/fetch against a read-only status endpoint. This command never
sends a real SMS or email, and never calls a Paystack charge/transfer
endpoint — it must never import or call any live SMS-dispatch helper or any
outbound-mail-dispatch API from this codebase.

Intended to be run manually post-deploy or wired into the deploy script
(D-08) — not a continuous monitoring endpoint.
"""

from __future__ import annotations

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from rent.providers.base import PaymentProviderError
from rent.providers.paystack import PaystackProvider


class Command(BaseCommand):
    help = (
        "Verify Paystack, Africa's Talking, and Mailtrap credentials resolve "
        "and are authenticated (read-only, no live sends)."
    )

    def handle(self, *args, **options):
        checks = [
            ('Paystack', self._check_paystack),
            ("Africa's Talking", self._check_africastalking),
            ('Mailtrap', self._check_mailtrap),
        ]

        results = []
        for name, check in checks:
            ok, message = check()
            results.append((name, ok, message))
            if ok:
                self.stdout.write(self.style.SUCCESS(f'PASS: {name}'))
            else:
                self.stdout.write(self.style.ERROR(f'FAIL: {name} - {message}'))

        if any(not ok for _name, ok, _message in results):
            raise CommandError('One or more external API checks failed — see output above.')

    def _check_paystack(self) -> tuple[bool, str]:
        provider = PaystackProvider()
        try:
            headers = provider._headers()
        except PaymentProviderError:
            return False, 'PAYSTACK_SECRET_KEY not configured'

        try:
            response = requests.get(
                f'{PaystackProvider.API_BASE}/balance', headers=headers, timeout=15
            )
            data = response.json()
        except Exception as exc:  # noqa: BLE001 - a network failure must never crash the command
            return False, str(exc)

        if data.get('status') is True:
            return True, ''
        return False, data.get('message', 'Paystack balance check failed')

    def _check_africastalking(self) -> tuple[bool, str]:
        if not settings.AFRICASTALKING_API_KEY:
            return False, 'AFRICASTALKING_API_KEY not configured'

        try:
            import africastalking

            africastalking.initialize(
                username=settings.AFRICASTALKING_USERNAME,
                api_key=settings.AFRICASTALKING_API_KEY,
            )
            data = africastalking.Application.fetch_application_data()
        except Exception as exc:  # noqa: BLE001 - a network/SDK failure must never crash the command
            return False, str(exc)

        if isinstance(data, dict):
            return True, ''
        return False, 'Unexpected response from Africa\'s Talking fetch_application_data'

    def _check_mailtrap(self) -> tuple[bool, str]:
        if not settings.MAILTRAP_API_TOKEN:
            return False, 'MAILTRAP_API_TOKEN not configured'

        try:
            response = requests.get(
                'https://mailtrap.io/api/accounts',
                headers={'Api-Token': settings.MAILTRAP_API_TOKEN},
                timeout=15,
            )
        except Exception as exc:  # noqa: BLE001 - a network failure must never crash the command
            return False, str(exc)

        if response.status_code == 200:
            return True, ''
        return False, f'Mailtrap account check failed with status {response.status_code}'
