"""
System-wide cron tasks for RUMI platform
Maintenance, cleanup, and optimization tasks
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db import connection
from django.db import models
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='rumi.tasks.cleanup_expired_cache')
def cleanup_expired_cache():
    """
    Clean up expired cache entries and optimize cache performance
    Runs daily at 3 AM
    """
    logger.info("Starting cache cleanup...")
    
    try:
        # Get cache backend
        cache_backend = cache
        
        # Clear expired sessions
        cache_backend.delete_pattern('rumi_sessions:*')
        
        # Clear old analytics cache
        cache_backend.delete_pattern('rumi:analytics:*')
        
        # Clear old payment stats cache
        cache_backend.delete_pattern('rumi:payments:stats:*')
        
        # Clear old API response cache (older than 1 hour)
        cache_backend.delete_pattern('rumi:api:*')
        
        logger.info("Cache cleanup completed successfully")
        
        return {
            'status': 'success',
            'message': 'Cache cleanup completed'
        }
        
    except Exception as e:
        logger.error(f"Cache cleanup failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='rumi.tasks.database_maintenance')
def database_maintenance():
    """
    Perform database maintenance tasks
    Runs weekly on Sunday at 4 AM
    """
    logger.info("Starting database maintenance...")
    
    try:
        with connection.cursor() as cursor:
            # Update table statistics
            cursor.execute("ANALYZE;")
            logger.info("Database statistics updated")
            
            # Reindex frequently accessed tables (PostgreSQL only)
            if connection.vendor == 'postgresql':
                cursor.execute("REINDEX DATABASE rumi;")
                logger.info("Database indexes rebuilt")
            
            # Clean up old session data
            cursor.execute("DELETE FROM django_session WHERE expire_date < NOW() - INTERVAL '7 days';")
            logger.info("Old session data cleaned up")
            
            # Optimize tables (SQLite only)
            if connection.vendor == 'sqlite':
                cursor.execute("VACUUM;")
                logger.info("Database vacuumed")
        
        logger.info("Database maintenance completed successfully")
        
        return {
            'status': 'success',
            'message': 'Database maintenance completed'
        }
        
    except Exception as e:
        logger.error(f"Database maintenance failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='accounts.tasks.cleanup_expired_tokens')
def cleanup_expired_tokens():
    """
    Clean up expired JWT tokens and blacklisted tokens
    Runs every hour
    """
    logger.info("Starting token cleanup...")
    
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken, OutstandingToken
        )
        
        # Delete expired outstanding tokens
        expired_count = OutstandingToken.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()[0]
        
        # Clean up blacklisted tokens older than 7 days
        old_blacklisted = BlacklistedToken.objects.filter(
            blacklisted_at__lt=timezone.now() - timedelta(days=7)
        ).delete()[0]
        
        logger.info(f"Token cleanup completed: {expired_count} expired tokens removed, "
                   f"{old_blacklisted} old blacklisted tokens removed")
        
        return {
            'expired_tokens_removed': expired_count,
            'blacklisted_tokens_removed': old_blacklisted,
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Token cleanup failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='analytics.tasks.update_daily_analytics')
def update_daily_analytics():
    """
    Update daily analytics and metrics
    Runs daily at 11:30 PM
    """
    logger.info("Starting daily analytics update...")
    
    try:
        from analytics.models import DailyAnalytics, RevenueAnalytics
        from payments.models import Transaction
        from accounts.models import User
        from hostels.models import Hostel, Booking
        
        today = timezone.now().date()
        
        # Update user analytics
        total_users = User.objects.count()
        active_users = User.objects.filter(
            last_login__gte=today - timedelta(days=30)
        ).count()
        
        # Update transaction analytics
        total_transactions = Transaction.objects.filter(
            created_at__date=today
        ).count()
        successful_transactions = Transaction.objects.filter(
            created_at__date=today,
            status='success'
        ).count()
        total_revenue = Transaction.objects.filter(
            created_at__date=today,
            status='success'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Update booking analytics
        total_bookings = Booking.objects.filter(
            created_at__date=today
        ).count()
        active_bookings = Booking.objects.filter(
            status='confirmed'
        ).count()
        
        # Create or update daily analytics
        DailyAnalytics.objects.update_or_create(
            date=today,
            analytics_type='user_stats',
            defaults={
                'data': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'new_users_today': User.objects.filter(date_joined__date=today).count()
                }
            }
        )
        
        DailyAnalytics.objects.update_or_create(
            date=today,
            analytics_type='transaction_stats',
            defaults={
                'data': {
                    'total_transactions': total_transactions,
                    'successful_transactions': successful_transactions,
                    'total_revenue': str(total_revenue),
                    'success_rate': (successful_transactions / total_transactions * 100) if total_transactions > 0 else 0
                }
            }
        )
        
        DailyAnalytics.objects.update_or_create(
            date=today,
            analytics_type='booking_stats',
            defaults={
                'data': {
                    'total_bookings': total_bookings,
                    'active_bookings': active_bookings,
                    'occupancy_rate': (active_bookings / Hostel.objects.aggregate(total=models.Sum('total_rooms'))['total'] * 100) if Hostel.objects.exists() else 0
                }
            }
        )
        
        logger.info(f"Daily analytics updated for {today}")
        
        return {
            'date': str(today),
            'total_users': total_users,
            'total_transactions': total_transactions,
            'total_revenue': str(total_revenue),
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Daily analytics update failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }
