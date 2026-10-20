from django.db.models.signals import post_save
from django.dispatch import receiver

from organizations.models import Organization


@receiver(post_save, sender=Organization)
def seed_chart_of_accounts(sender, instance, created, raw=False, **kwargs):
    if created and not raw:
        from ledger.services.chart import ensure_chart_of_accounts

        ensure_chart_of_accounts(instance)
