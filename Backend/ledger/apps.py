from django.apps import AppConfig


class LedgerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ledger'

    def ready(self):
        import ledger.signals  # noqa: F401 - seeds the chart of accounts for new organizations
