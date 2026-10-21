"""
Make each Paystack plan bill what the plan table says.

Paystack charges the amount stored on its own plan, not `SubscriptionPlan.price`,
so a price changed outside the admin plan editor (a migration, the Django
admin) would leave the website and the card charge disagreeing. Deploys run
this after migrations. It only writes to Paystack when an amount or name
differs, and never fails the deploy.
"""
from django.conf import settings
from django.core.management.base import BaseCommand

from billing.models import SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient
from rent.providers.base import PaymentProviderError


class Command(BaseCommand):
    help = 'Bring Paystack plan amounts in line with SubscriptionPlan prices (idempotent).'

    def handle(self, *args, **options):
        if not getattr(settings, 'PAYSTACK_SECRET_KEY', ''):
            self.stdout.write('Paystack is not configured; nothing to sync.')
            return

        client = PaystackBillingClient()
        for plan in SubscriptionPlan.objects.filter(is_active=True):
            try:
                self._sync(client, plan)
            except PaymentProviderError as exc:
                self.stdout.write(self.style.WARNING(f'{plan.slug}: not synced ({exc})'))

    def _sync(self, client: PaystackBillingClient, plan: SubscriptionPlan) -> None:
        amount = int(plan.price * 100)
        if not plan.paystack_plan_code:
            result = client.create_plan(name=plan.name, price=plan.price, interval=plan.interval)
            plan.paystack_plan_code = result['plan_code']
            plan.save(update_fields=['paystack_plan_code', 'updated_at'])
            self.stdout.write(self.style.SUCCESS(f'{plan.slug}: created Paystack plan'))
            return

        current = client.get_plan(plan.paystack_plan_code)
        current_amount = int(current.get('amount') or 0)
        if current_amount == amount and current.get('name') == plan.name:
            self.stdout.write(f'{plan.slug}: in sync')
            return

        # A price cut moves existing subscribers too; a rise only affects new ones.
        cut = 0 < amount < current_amount
        client.update_plan(plan.paystack_plan_code, plan.name, plan.price, update_existing=cut)
        self.stdout.write(self.style.SUCCESS(
            f'{plan.slug}: Paystack {current_amount / 100:.0f} -> {plan.price} KES'
            + (' (existing subscribers moved to the lower price)' if cut else '')
        ))
