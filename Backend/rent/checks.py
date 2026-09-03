"""
django.core.checks system check for the Paystack key/PAYSTACK_ENV mismatch
(HARD-04, D-04/D-05).

Registered via RentConfig.ready() so `manage.py runserver`/`migrate` and any
other management command that runs Django's system checks blocks on a
genuine test/live key mismatch. Fails loud, never fail-open: an unexpected
exception while evaluating the check surfaces as an Error, never an empty
(healthy) result.
"""
from __future__ import annotations

from django.core.checks import Error, register


@register()
def check_paystack_key_env_match(app_configs, **kwargs):
    """
    Returns a blocking Error when PaystackProvider.get_config_status()
    reports MISCONFIGURED (secret/public key prefix does not match the
    declared PAYSTACK_ENV, or the two keys disagree with each other).

    NOT_CONFIGURED (no key set at all) is not an error here — that's the
    normal state for a dev environment that hasn't set up Paystack yet.
    """
    # Imported inside the function body (not at module scope) to avoid
    # Django app-loading-order issues, matching this project's own
    # deferred-import convention (see accounts/apps.py's ready()).
    from rent.providers.base import ProviderStatus
    from rent.providers.paystack import PaystackProvider

    try:
        config_status = PaystackProvider().get_config_status()
    except Exception as exc:
        # Fail loud, never fail open (T-07.3-04): an internal exception
        # while evaluating this check must never be silently swallowed
        # into an empty (passing) result.
        return [
            Error(
                f'Paystack configuration check raised an unexpected exception: {exc}',
                id='rent.E002',
            )
        ]

    if config_status.status == ProviderStatus.MISCONFIGURED:
        return [Error(config_status.message, id='rent.E001')]

    return []
