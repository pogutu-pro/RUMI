"""
Seed the 3 canonical subscription tiers (Starter / Pro / Enterprise).

Idempotent — `get_or_create` by slug, so running this command repeatedly
never duplicates rows.
"""
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand

from billing.models import SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient

PLAN_SEED_DATA = [
    {
        'slug': 'starter',
        'name': 'Starter',
        'price': Decimal('2999.00'),
        'max_properties': 1,
        'max_units': 10,
        'max_caretaker_seats': 1,
        'features': {'analytics': False},
        'sort_order': 1,
    },
    {
        'slug': 'pro',
        'name': 'Pro',
        'price': Decimal('7999.00'),
        'max_properties': 5,
        'max_units': 50,
        'max_caretaker_seats': 5,
        'features': {'analytics': True},
        'sort_order': 2,
    },
    {
        'slug': 'enterprise',
        'name': 'Enterprise',
        'price': Decimal('19999.00'),
        'max_properties': 0,
        'max_units': 0,
        'max_caretaker_seats': 0,
        'features': {'analytics': True},
        'sort_order': 3,
    },
]


class Command(BaseCommand):
    help = 'Seed the 3 canonical subscription tiers (idempotent).'

    def handle(self, *args, **options):
        paystack_configured = bool(getattr(settings, 'PAYSTACK_SECRET_KEY', ''))

        for data in PLAN_SEED_DATA:
            slug = data['slug']
            defaults = {key: value for key, value in data.items() if key != 'slug'}
            plan, created = SubscriptionPlan.objects.get_or_create(slug=slug, defaults=defaults)

            verb = 'Created' if created else 'Already exists'
            self.stdout.write(self.style.SUCCESS(f'{verb}: {plan.name} ({plan.slug})'))

            if paystack_configured and not plan.paystack_plan_code:
                try:
                    result = PaystackBillingClient().create_plan(
                        name=plan.name, price=plan.price, interval=plan.interval,
                    )
                    plan.paystack_plan_code = result['plan_code']
                    plan.save(update_fields=['paystack_plan_code', 'updated_at'])
                    self.stdout.write(self.style.SUCCESS(f'  Linked Paystack plan_code for {plan.slug}'))
                except Exception as exc:  # noqa: BLE001 - seeding must never fail on Paystack errors
                    self.stdout.write(self.style.WARNING(
                        f'  Could not link Paystack plan_code for {plan.slug}: {exc}'
                    ))
