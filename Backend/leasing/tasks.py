import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='leasing.tasks.run_daily')
def run_daily():
    """Daily: apply/announce rent reviews, lease-expiry reminders, close settled debt cases."""
    from leasing.services import DebtService, LeaseExpiryService, RentReviewService

    result = {
        'rent_reviews': RentReviewService.run(),
        'lease_expiry_reminders': LeaseExpiryService.run(),
        'debt_cases_closed': DebtService.close_settled(),
    }
    logger.info('RumiaRent leasing daily: %s', result)
    return result
