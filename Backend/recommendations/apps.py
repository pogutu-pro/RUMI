"""
Django app configuration for recommendations system
"""

from django.apps import AppConfig


class RecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recommendations'
    verbose_name = 'Recommendation System'
    
    def ready(self):
        """
        Perform app initialization tasks
        """
        # Import signal handlers if needed
        # from . import signals
