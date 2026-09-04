"""
Django management command to run database optimizations
"""

from django.core.management.base import BaseCommand
from rumi.optimization_migrations import run_database_optimization
from rumi.cache_utils import cache_warmer
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run database optimizations for vertical scaling'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--warm-cache',
            action='store_true',
            help='Warm cache after database optimization',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force run optimizations even if recently run',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database optimization...'))
        
        try:
            # Run database optimizations
            run_database_optimization()
            self.stdout.write(self.style.SUCCESS('Database optimization completed'))
            
            # Warm cache if requested
            if options['warm_cache']:
                self.stdout.write('Warming cache...')
                
                cache_warmer.warm_popular_hostels()
                self.stdout.write(self.style.SUCCESS('Popular hostels cached'))
                
                cache_warmer.warm_user_dashboards()
                self.stdout.write(self.style.SUCCESS('User dashboards cached'))
                
                cache_warmer.warm_payment_stats()
                self.stdout.write(self.style.SUCCESS('Payment statistics cached'))
                
                self.stdout.write(self.style.SUCCESS('Cache warming completed'))
            
            self.stdout.write(self.style.SUCCESS('All optimizations completed successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Optimization failed: {e}'))
            logger.error(f"Database optimization command failed: {e}")
            raise
