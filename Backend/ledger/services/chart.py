"""Default chart of accounts seeded for every organization."""

from __future__ import annotations

from ledger.models import Account

# Codes are referenced by posting rules — change names freely, never codes.
CASH_ON_HAND = '1000'
BANK = '1010'
MPESA_PAYBILL = '1020'
PAYSTACK_CLEARING = '1030'
TENANT_RECEIVABLES = '1100'
DEPOSITS_HELD = '2100'
TENANT_PREPAYMENTS = '2200'
RENT_INCOME = '4000'
SERVICE_CHARGE_INCOME = '4010'
UTILITY_INCOME = '4020'
PENALTY_INCOME = '4100'
OTHER_INCOME = '4900'
WAIVERS_AND_DISCOUNTS = '5900'

DEFAULT_ACCOUNTS = [
    (CASH_ON_HAND, 'Cash on hand', 'asset'),
    (BANK, 'Bank', 'asset'),
    (MPESA_PAYBILL, 'M-Pesa paybill', 'asset'),
    (PAYSTACK_CLEARING, 'Paystack clearing', 'asset'),
    (TENANT_RECEIVABLES, 'Tenant receivables', 'asset'),
    (DEPOSITS_HELD, 'Tenant deposits held', 'liability'),
    (TENANT_PREPAYMENTS, 'Tenant prepayments (credit)', 'liability'),
    (RENT_INCOME, 'Rent income', 'income'),
    (SERVICE_CHARGE_INCOME, 'Service charge income', 'income'),
    (UTILITY_INCOME, 'Utility income', 'income'),
    (PENALTY_INCOME, 'Penalty income', 'income'),
    (OTHER_INCOME, 'Other income', 'income'),
    (WAIVERS_AND_DISCOUNTS, 'Waivers and discounts', 'expense'),
]


def ensure_chart_of_accounts(organization) -> int:
    """Create any missing default accounts for `organization`. Idempotent; returns count created."""
    existing = set(
        Account.objects.filter(organization=organization).values_list('code', flat=True)
    )
    to_create = [
        Account(organization=organization, code=code, name=name, account_type=account_type)
        for code, name, account_type in DEFAULT_ACCOUNTS
        if code not in existing
    ]
    Account.objects.bulk_create(to_create, ignore_conflicts=True)
    return len(to_create)
