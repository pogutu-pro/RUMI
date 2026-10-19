from django.apps import AppConfig


class PaybillConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'paybill'
    verbose_name = 'Paybill collection (M-Pesa C2B)'
