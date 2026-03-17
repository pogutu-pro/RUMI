import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Hostel

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Hostel)
@receiver(post_delete, sender=Hostel)
def invalidate_hostels_list_cache(sender, **kwargs):
    cache.delete('hostels_list')
    logger.debug('hostels_list cache invalidated')
