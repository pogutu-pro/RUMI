"""
Phase 1b — evolve RentCharge into Invoice (same table, same rows).

1. Rename the model and the allocation FK; add invoice fields, InvoiceLine and CreditNote.
2. Data: give every existing charge a rent line (plus a penalty line for any
   late fee, folded into the total), a per-organization number, an issue date;
   convert `waived` charges into credit notes and `disputed` into the flag.
3. Drop late_fee_amount and replace the constraints.

Journal entries for historical rows are posted by `manage.py ledger_backfill`,
not here — migrations must not depend on live service code.
"""

import uuid
from decimal import Decimal

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def forwards(apps, schema_editor):
    Invoice = apps.get_model('rent', 'Invoice')
    InvoiceLine = apps.get_model('rent', 'InvoiceLine')
    CreditNote = apps.get_model('rent', 'CreditNote')
    DocumentSequence = apps.get_model('ledger', 'DocumentSequence')

    counters = {}  # (organization_id, prefix) -> last value

    def next_number(org_id, prefix):
        key = (org_id, prefix)
        counters[key] = counters.get(key, 0) + 1
        return f'{prefix}-{counters[key]:06d}'

    for invoice in Invoice.objects.order_by('created_at', 'id'):
        rent_amount = invoice.amount_due
        late_fee = invoice.late_fee_amount or Decimal('0.00')
        lines = []
        if rent_amount > 0:
            lines.append(InvoiceLine(
                id=uuid.uuid4(), invoice=invoice, line_type='rent', description='Rent',
                quantity=Decimal('1'), unit_price=rent_amount, amount=rent_amount, sort_order=0,
            ))
        if late_fee > 0:
            lines.append(InvoiceLine(
                id=uuid.uuid4(), invoice=invoice, line_type='penalty', description='Late fee',
                quantity=Decimal('1'), unit_price=late_fee, amount=late_fee, sort_order=1,
            ))
        InvoiceLine.objects.bulk_create(lines)

        invoice.amount_due = rent_amount + late_fee
        invoice.number = next_number(invoice.organization_id, 'INV')
        invoice.issue_date = invoice.created_at.date()
        invoice.invoice_type = 'rent'

        if invoice.status == 'disputed':
            invoice.is_disputed = True
        if invoice.status == 'waived':
            unpaid = invoice.amount_due - invoice.amount_paid
            if unpaid > 0:
                CreditNote.objects.create(
                    id=uuid.uuid4(),
                    organization_id=invoice.organization_id,
                    invoice=invoice,
                    number=next_number(invoice.organization_id, 'CN'),
                    amount=unpaid,
                    reason='Waived before Phase 1 (migrated)',
                    issue_date=invoice.updated_at.date(),
                )
                invoice.amount_credited = unpaid
        invoice.save()

    for (org_id, prefix), value in counters.items():
        DocumentSequence.objects.update_or_create(
            organization_id=org_id, prefix=prefix, defaults={'last_value': value},
        )


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('organizations', '0002_payoutaccount'),
        ('properties', '0001_initial'),
        ('tenants', '0001_initial'),
        ('ledger', '0003_document_sequence'),
        ('rent', '0001_initial'),
    ]

    operations = [
        # --- 1. schema: rename and add -------------------------------------
        migrations.RemoveIndex(model_name='paymentallocation', name='idx_allocation_charge'),
        migrations.RenameModel(old_name='RentCharge', new_name='Invoice'),
        migrations.RenameField(model_name='paymentallocation', old_name='rent_charge', new_name='invoice'),
        migrations.AddIndex(
            model_name='paymentallocation',
            index=models.Index(fields=['invoice'], name='idx_allocation_charge'),
        ),
        migrations.AlterField(
            model_name='paymentallocation',
            name='invoice',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name='payment_allocations', to='rent.invoice',
            ),
        ),
        migrations.AlterField(
            model_name='invoice', name='organization',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='organizations.organization',
            ),
        ),
        migrations.AlterField(
            model_name='invoice', name='tenancy',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='properties.tenancy',
            ),
        ),
        migrations.AlterField(
            model_name='invoice', name='parent_property',
            field=models.ForeignKey(
                db_column='property_id', on_delete=django.db.models.deletion.CASCADE,
                related_name='invoices', to='properties.property',
            ),
        ),
        migrations.AlterField(
            model_name='invoice', name='unit',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='properties.rentalunit',
            ),
        ),
        migrations.AlterField(
            model_name='invoice', name='tenant',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='tenants.tenantprofile',
            ),
        ),
        migrations.AddField(
            model_name='invoice', name='invoice_type',
            field=models.CharField(
                choices=[('rent', 'Rent'), ('deposit', 'Deposit'), ('penalty', 'Late Penalty'), ('adhoc', 'Ad-hoc Charge')],
                default='rent', max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='invoice', name='number', field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.AddField(model_name='invoice', name='issue_date', field=models.DateField(blank=True, null=True)),
        migrations.AddField(
            model_name='invoice', name='source_invoice',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                related_name='derived_invoices', to='rent.invoice',
                help_text='For a penalty: the invoice it penalizes.',
            ),
        ),
        migrations.AddField(
            model_name='invoice', name='amount_credited',
            field=models.DecimalField(
                decimal_places=2, default=Decimal('0.00'), max_digits=12,
                validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
            ),
        ),
        migrations.AddField(model_name='invoice', name='is_disputed', field=models.BooleanField(default=False)),
        migrations.CreateModel(
            name='InvoiceLine',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('line_type', models.CharField(choices=[
                    ('rent', 'Rent'), ('service_charge', 'Service Charge'), ('water', 'Water'),
                    ('electricity', 'Electricity'), ('garbage', 'Garbage'), ('parking', 'Parking'),
                    ('penalty', 'Late Penalty'), ('deposit', 'Deposit'), ('repair', 'Repair'), ('other', 'Other'),
                ], max_length=20)),
                ('description', models.CharField(blank=True, default='', max_length=255)),
                ('quantity', models.DecimalField(decimal_places=3, default=Decimal('1'), max_digits=12)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('invoice', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='lines', to='rent.invoice',
                )),
            ],
            options={'db_table': 'rent_invoiceline', 'ordering': ['sort_order', 'id']},
        ),
        migrations.CreateModel(
            name='CreditNote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('number', models.CharField(max_length=30)),
                ('amount', models.DecimalField(
                    decimal_places=2, max_digits=12,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.01'))],
                )),
                ('reason', models.TextField()),
                ('issue_date', models.DateField()),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='credit_notes_issued', to=settings.AUTH_USER_MODEL,
                )),
                ('invoice', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT, related_name='credit_notes', to='rent.invoice',
                )),
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='credit_notes',
                    to='organizations.organization',
                )),
            ],
            options={'db_table': 'rent_creditnote', 'ordering': ['-issue_date', '-created_at']},
        ),
        migrations.RemoveConstraint(model_name='invoice', name='check_charge_paid_not_exceed_due'),
        migrations.AlterUniqueTogether(name='invoice', unique_together=set()),

        # --- 2. data -------------------------------------------------------
        migrations.RunPython(forwards, migrations.RunPython.noop),

        # --- 3. schema: drop and constrain ---------------------------------
        migrations.RemoveField(model_name='invoice', name='late_fee_amount'),
        migrations.AddConstraint(
            model_name='invoice',
            constraint=models.UniqueConstraint(
                condition=models.Q(invoice_type='rent'), fields=('tenancy', 'period_start'),
                name='uniq_rent_invoice_per_period',
            ),
        ),
        migrations.AddConstraint(
            model_name='invoice',
            constraint=models.UniqueConstraint(
                condition=~models.Q(number=''), fields=('organization', 'number'),
                name='uniq_invoice_number_per_org',
            ),
        ),
        migrations.AddConstraint(
            model_name='invoice',
            constraint=models.CheckConstraint(
                check=models.Q(amount_paid__lte=models.F('amount_due') - models.F('amount_credited')),
                name='check_invoice_paid_not_exceed_due',
            ),
        ),
        migrations.AddConstraint(
            model_name='creditnote',
            constraint=models.UniqueConstraint(fields=('organization', 'number'), name='uniq_credit_note_number_per_org'),
        ),
    ]
