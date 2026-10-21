"""
Launch prices, set against Kenyan rental software in 2026 (Bomahut, Blocks,
RentLynk, EazzyRent): Starter KES 1,499 for 20 units, Pro KES 3,999 for 60,
Enterprise KES 9,999 unlimited.

A tier is only changed while it still holds the original seed price, so a
price set by hand in the admin plan editor is left alone. Paystack's own plan
amounts are brought in line by `manage.py sync_paystack_plans` (run as the backend starts).
"""
from decimal import Decimal

from django.db import migrations

CHANGES = {
    # slug: (old price, new price, new max_properties, new max_units)
    'starter': (Decimal('2999.00'), Decimal('1499.00'), 2, 20),
    'pro': (Decimal('7999.00'), Decimal('3999.00'), 10, 60),
    'enterprise': (Decimal('19999.00'), Decimal('9999.00'), 0, 0),
}
OLD_LIMITS = {'starter': (1, 10), 'pro': (5, 50), 'enterprise': (0, 0)}


def apply(apps, schema_editor):
    SubscriptionPlan = apps.get_model('billing', 'SubscriptionPlan')
    for slug, (old, new, props, units) in CHANGES.items():
        SubscriptionPlan.objects.filter(slug=slug, price=old).update(
            price=new, max_properties=props, max_units=units,
        )


def revert(apps, schema_editor):
    SubscriptionPlan = apps.get_model('billing', 'SubscriptionPlan')
    for slug, (old, new, _props, _units) in CHANGES.items():
        props, units = OLD_LIMITS[slug]
        SubscriptionPlan.objects.filter(slug=slug, price=new).update(
            price=old, max_properties=props, max_units=units,
        )


class Migration(migrations.Migration):
    dependencies = [('billing', '0003_manualpaymentinstructions')]

    operations = [migrations.RunPython(apply, revert)]
