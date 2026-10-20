import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class PlatformSettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'platform_settings'

    def ready(self):
        # Background workers never see an HTTP request, so refresh before each task.
        try:
            from celery.signals import task_prerun

            from . import service

            @task_prerun.connect(weak=False)
            def _refresh_platform_settings(*args, **kwargs):
                service.ensure_fresh()
        except Exception:  # noqa: BLE001
            logger.exception('Could not hook platform settings into Celery')

        # Load overrides at start-up. The table may not exist yet (first
        # migrate, fresh test database), which is fine: the first request retries.
        try:
            from . import service

            service.apply_overrides()
        except Exception:  # noqa: BLE001
            pass
