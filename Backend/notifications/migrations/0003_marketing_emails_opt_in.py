from django.db import migrations, models


def clear_implied_consent(apps, schema_editor):
    """No marketing has ever been sent, so the old default of True was never a
    real opt-in. Reset it so consent has to be given explicitly."""
    NotificationPreference = apps.get_model('notifications', 'NotificationPreference')
    NotificationPreference.objects.filter(marketing_emails=True).update(marketing_emails=False)


class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0002_delivery_log_recipient_optional'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notificationpreference',
            name='marketing_emails',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(clear_implied_consent, migrations.RunPython.noop),
    ]
