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
OWNER_PAYABLES = '2300'
OWNER_DISTRIBUTIONS = '3900'
RENT_INCOME = '4000'
SERVICE_CHARGE_INCOME = '4010'
UTILITY_INCOME = '4020'
PENALTY_INCOME = '4100'
ADVANCE_FEE_INCOME = '4600'
OTHER_INCOME = '4900'
REPAIRS_AND_MAINTENANCE = '5000'
PROPERTY_UTILITIES = '5100'
SECURITY_AND_CLEANING = '5200'
MANAGEMENT_FEES = '5300'
INSURANCE = '5400'
RATES_AND_TAXES = '5500'
OTHER_EXPENSES = '5800'
WAIVERS_AND_DISCOUNTS = '5900'

CHANNEL_ACCOUNTS_CODES = (CASH_ON_HAND, BANK, MPESA_PAYBILL, PAYSTACK_CLEARING)
INCOME_CODES = (RENT_INCOME, SERVICE_CHARGE_INCOME, UTILITY_INCOME, PENALTY_INCOME, OTHER_INCOME)
EXPENSE_CODES = (
    REPAIRS_AND_MAINTENANCE, PROPERTY_UTILITIES, SECURITY_AND_CLEANING, MANAGEMENT_FEES,
    INSURANCE, RATES_AND_TAXES, OTHER_EXPENSES,
)

DEFAULT_ACCOUNTS = [
    (CASH_ON_HAND, 'Cash on hand', 'asset'),
    (BANK, 'Bank', 'asset'),
    (MPESA_PAYBILL, 'M-Pesa paybill', 'asset'),
    (PAYSTACK_CLEARING, 'Paystack clearing', 'asset'),
    (TENANT_RECEIVABLES, 'Tenant receivables', 'asset'),
    (DEPOSITS_HELD, 'Tenant deposits held', 'liability'),
    (TENANT_PREPAYMENTS, 'Tenant prepayments (credit)', 'liability'),
    (OWNER_PAYABLES, 'Due to property owners', 'liability'),
    (OWNER_DISTRIBUTIONS, 'Owner share of income (distributions)', 'equity'),
    (RENT_INCOME, 'Rent income', 'income'),
    (SERVICE_CHARGE_INCOME, 'Service charge income', 'income'),
    (UTILITY_INCOME, 'Utility income', 'income'),
    (PENALTY_INCOME, 'Penalty income', 'income'),
    (ADVANCE_FEE_INCOME, 'Owner advance fees', 'income'),
    (OTHER_INCOME, 'Other income', 'income'),
    (REPAIRS_AND_MAINTENANCE, 'Repairs and maintenance', 'expense'),
    (PROPERTY_UTILITIES, 'Utilities (paid by landlord)', 'expense'),
    (SECURITY_AND_CLEANING, 'Security and cleaning', 'expense'),
    (MANAGEMENT_FEES, 'Management fees', 'expense'),
    (INSURANCE, 'Insurance', 'expense'),
    (RATES_AND_TAXES, 'Land rates and taxes', 'expense'),
    (OTHER_EXPENSES, 'Other expenses', 'expense'),
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
