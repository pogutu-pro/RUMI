from django.db import migrations, models

# Frozen copy of the expense accounts added to ledger.services.chart in Phase 3a.
NEW_ACCOUNTS = [
    ('5000', 'Repairs and maintenance', 'expense'),
    ('5100', 'Utilities (paid by landlord)', 'expense'),
    ('5200', 'Security and cleaning', 'expense'),
    ('5300', 'Management fees', 'expense'),
    ('5400', 'Insurance', 'expense'),
    ('5500', 'Land rates and taxes', 'expense'),
    ('5800', 'Other expenses', 'expense'),
]


def seed(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    Account = apps.get_model('ledger', 'Account')
    for org in Organization.objects.all():
        existing = set(Account.objects.filter(organization=org).values_list('code', flat=True))
        Account.objects.bulk_create([
            Account(organization=org, code=code, name=name, account_type=kind, is_system=True)
            for code, name, kind in NEW_ACCOUNTS if code not in existing
        ])


class Migration(migrations.Migration):
    dependencies = [('ledger', '0003_document_sequence')]

    operations = [
        migrations.AlterField(
            model_name='journalentry',
            name='source_type',
            field=models.CharField(choices=[
                ('invoice', 'Invoice'), ('credit_note', 'Credit Note'), ('payment', 'Payment'),
                ('allocation', 'Allocation'), ('deposit_settlement', 'Deposit Settlement'), ('expense', 'Expense'),
                ('reversal', 'Reversal'), ('opening_balance', 'Opening Balance'), ('manual', 'Manual'),
            ], max_length=30),
        ),
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]
