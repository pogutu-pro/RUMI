import pytest
from django.conf import settings
from rumi.performance_settings import PERFORMANCE_CELERY


def _beat_schedule():
    return PERFORMANCE_CELERY.get('BEAT_SCHEDULE', {})


def test_beat_schedule_assess_late_fees():
    """BEAT_SCHEDULE must contain an entry with task='payments.tasks.assess_late_fees' on a daily crontab."""
    schedule = _beat_schedule()
    matching = [
        entry for entry in schedule.values()
        if entry.get('task') == 'payments.tasks.assess_late_fees'
    ]
    assert len(matching) >= 1, (
        "No BEAT_SCHEDULE entry found with task='payments.tasks.assess_late_fees'. "
        f"Current tasks: {[e.get('task') for e in schedule.values()]}"
    )


def test_beat_schedule_retry_webhook_events():
    """BEAT_SCHEDULE must contain an entry with task='payments.tasks.retry_failed_webhook_events' on crontab(minute='*/5')."""
    from celery.schedules import crontab
    schedule = _beat_schedule()
    matching = [
        entry for entry in schedule.values()
        if entry.get('task') == 'payments.tasks.retry_failed_webhook_events'
    ]
    assert len(matching) >= 1, (
        "No BEAT_SCHEDULE entry found with task='payments.tasks.retry_failed_webhook_events'. "
        f"Current tasks: {[e.get('task') for e in schedule.values()]}"
    )
    # Verify the schedule is a 5-minute crontab
    entry_schedule = matching[0].get('schedule')
    expected = crontab(minute='*/5')
    assert str(entry_schedule) == str(expected), (
        f"Expected crontab(minute='*/5') but got: {entry_schedule}"
    )


def test_beat_schedule_no_process_late_fees():
    """No entry in BEAT_SCHEDULE should reference the non-existent 'payments.tasks.process_late_fees'."""
    schedule = _beat_schedule()
    bad_entries = [
        key for key, entry in schedule.items()
        if entry.get('task') == 'payments.tasks.process_late_fees'
    ]
    assert bad_entries == [], (
        f"BEAT_SCHEDULE still contains entries referencing non-existent task 'payments.tasks.process_late_fees': {bad_entries}"
    )


def test_django_celery_beat_in_installed_apps():
    """'django_celery_beat' must be listed in django.conf.settings.INSTALLED_APPS."""
    assert 'django_celery_beat' in settings.INSTALLED_APPS, (
        "'django_celery_beat' not found in INSTALLED_APPS. "
        f"Current INSTALLED_APPS: {settings.INSTALLED_APPS}"
    )
