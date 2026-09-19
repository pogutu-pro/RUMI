from django.db import migrations


def drop_branded_receipts(apps, schema_editor):
    """The flag was advertised on the pricing page but no such feature was ever built."""
    SubscriptionPlan = apps.get_model('billing', 'SubscriptionPlan')
    for plan in SubscriptionPlan.objects.all():
        features = dict(plan.features or {})
        if features.pop('branded_receipts', None) is not None:
            plan.features = features
            plan.save(update_fields=['features'])


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(drop_branded_receipts, migrations.RunPython.noop),
    ]
