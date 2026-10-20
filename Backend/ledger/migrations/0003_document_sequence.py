import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('organizations', '0002_payoutaccount'),
        ('ledger', '0002_seed_chart_of_accounts'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentSequence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prefix', models.CharField(max_length=10)),
                ('last_value', models.PositiveIntegerField(default=0)),
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='document_sequences',
                    to='organizations.organization',
                )),
            ],
            options={
                'db_table': 'ledger_documentsequence',
                'unique_together': {('organization', 'prefix')},
            },
        ),
    ]
