from django.db import migrations

# Frozen copy of ledger.services.chart.DEFAULT_ACCOUNTS at the time of this
# migration — migrations must not import live application code.
DEFAULT_ACCOUNTS = [
    ('1000', 'Cash on hand', 'asset'),
    ('1010', 'Bank', 'asset'),
    ('1020', 'M-Pesa paybill', 'asset'),
    ('1030', 'Paystack clearing', 'asset'),
    ('1100', 'Tenant receivables', 'asset'),
    ('2100', 'Tenant deposits held', 'liability'),
    ('2200', 'Tenant prepayments (credit)', 'liability'),
    ('4000', 'Rent income', 'income'),
    ('4010', 'Service charge income', 'income'),
    ('4020', 'Utility income', 'income'),
    ('4100', 'Penalty income', 'income'),
    ('4900', 'Other income', 'income'),
    ('5900', 'Waivers and discounts', 'expense'),
]


def seed(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    Account = apps.get_model('ledger', 'Account')
    for org in Organization.objects.all():
        existing = set(Account.objects.filter(organization=org).values_list('code', flat=True))
        Account.objects.bulk_create([
            Account(organization=org, code=code, name=name, account_type=account_type, is_system=True)
            for code, name, account_type in DEFAULT_ACCOUNTS
            if code not in existing
        ])


class Migration(migrations.Migration):
    dependencies = [
        ('ledger', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]
