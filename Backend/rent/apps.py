from django.apps import AppConfig


class RentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "rent"

    def ready(self):
        """Register the Paystack key/env system check (HARD-04)"""
        import rent.checks  # noqa: F401 - registers the Paystack key/env system check
