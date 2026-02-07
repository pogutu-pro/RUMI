import logging
from .models import MpesaPaymentConfig, RentPeriod
from .mpesa_api import MpesaDarajaAPI

logger = logging.getLogger(__name__)

class MpesaRoutingEngine:
    """
    Engine for resolving and providing landlord-specific M-Pesa API instances.
    Ensures that payments are routed to the correct landlord's shortcode.
    """

    @staticmethod
    def get_config_for_hostel(hostel):
        """Get the active M-Pesa config for a specific hostel."""
        landlord = hostel.landlord
        config = MpesaPaymentConfig.objects.filter(
            landlord=landlord,
            status='active'
        ).first()

        if not config:
            logger.warning(f"No active M-Pesa configuration found for landlord: {landlord}")
            # Fallback to default/global config if necessary or return None
            return None
        
        return config

    @staticmethod
    def get_api_for_booking(booking):
        """Returns an initialized MpesaDarajaAPI for a given booking."""
        config = MpesaRoutingEngine.get_config_for_hostel(booking.room.hostel)
        if not config:
            return MpesaDarajaAPI() # Fallback to global
        
        return MpesaDarajaAPI(config=config)

    @staticmethod
    def get_api_for_rent_period(rent_period):
        """Returns an initialized MpesaDarajaAPI for a given rent period."""
        config = MpesaRoutingEngine.get_config_for_hostel(rent_period.hostel)
        if not config:
            return MpesaDarajaAPI() # Fallback to global
        
        return MpesaDarajaAPI(config=config)

    @staticmethod
    def get_api_by_shortcode(shortcode):
        """Returns an initialized MpesaDarajaAPI for a given shortcode (used in webhooks)."""
        config = MpesaPaymentConfig.objects.filter(mpesa_number=shortcode, status='active').first()
        if not config:
            logger.error(f"Webhook received for unrecognized or inactive shortcode: {shortcode}")
            return None
        
        return MpesaDarajaAPI(config=config)
