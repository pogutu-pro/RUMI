"""
RUMI Performance Optimization Settings
Vertical scaling optimizations for production environment
"""

import os
from pathlib import Path
from datetime import timedelta
from decimal import Decimal
from dotenv import load_dotenv
from celery.schedules import crontab

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================================
# DATABASE OPTIMIZATIONS
# =============================================================================

# Enhanced Database Configuration for Vertical Scaling
PERFORMANCE_DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'rumi_production'),
        'USER': os.getenv('DB_USER', 'rumi_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        
        # Connection Pooling (for PostgreSQL)
        'OPTIONS': {
            'MAX_CONNS': int(os.getenv('DB_MAX_CONNS', '100')),
            'MIN_CONNS': int(os.getenv('DB_MIN_CONNS', '5')),
            'connect_timeout': 10,
            'statement_timeout': 30000,  # 30 seconds
            'lock_timeout': 5000,         # 5 seconds
        },
        
        # Connection settings
        'CONN_MAX_AGE': 60,  # Persistent connections
        'ATOMIC_REQUESTS': False,  # Disable for performance (enable per-view as needed)
        'AUTOCOMMIT': True,
    }
}

# =============================================================================
# CACHING OPTIMIZATIONS
# =============================================================================

# Multi-layer Redis Caching Strategy
PERFORMANCE_CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_timeout': 5,
                'socket_connect_timeout': 5,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'rumi',
        'TIMEOUT': 300,  # 5 minutes default
        'VERSION': 1,
    },
    
    # Session cache
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_SESSIONS_URL', 'redis://localhost:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 20,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'rumi_sessions',
        'TIMEOUT': 1200,  # 20 minutes
    },
    
    # Template fragment cache
    'template_fragments': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_TEMPLATES_URL', 'redis://localhost:6379/3'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 10,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'rumi_templates',
        'TIMEOUT': 600,  # 10 minutes
    },
}

# =============================================================================
# REST FRAMEWORK OPTIMIZATIONS
# =============================================================================

PERFORMANCE_REST_FRAMEWORK = {
    # Authentication
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'accounts.authentication.CookieJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    
    # Permissions
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    
    # Pagination - Optimized for performance
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 50,  # Increased from 20 for fewer API calls
    
    # Throttling - Increased limits for vertical scaling
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '500/hour',      # Increased from 100
        'user': '5000/hour',     # Increased from 1000
        'uploads': '100/hour',
        'payments': '200/hour',
    },
    
    # Performance optimizations
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    
    # Metadata and schema
    'DEFAULT_METADATA_CLASS': 'rest_framework.metadata.SimpleMetadata',
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    
    # Filtering
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],

    # Exception handling
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# =============================================================================
# CELERY OPTIMIZATIONS
# =============================================================================

PERFORMANCE_CELERY = {
    # Broker settings
    'BROKER_URL': os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    'BROKER_TRANSPORT_OPTIONS': {
        'visibility_timeout': 3600,
        'retry_policy': {
            'timeout': 5.0
        },
        'master_name': 'mymaster',
    },
    
    # Result backend
    'RESULT_BACKEND': os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    'RESULT_BACKEND_TRANSPORT_OPTIONS': {
        'master_name': 'mymaster',
    },
    
    # Task optimization
    'TASK_SERIALIZER': 'json',
    'RESULT_SERIALIZER': 'json',
    'ACCEPT_CONTENT': ['json'],
    'TIMEZONE': 'Africa/Nairobi',
    'ENABLE_UTC': True,
    
    # Performance settings
    'TASK_ALWAYS_EAGER': False,
    'TASK_EAGER_PROPAGATES': False,
    'TASK_IGNORE_RESULT': False,
    'TASK_STORE_ERRORS_EVEN_IF_IGNORED': True,
    
    # Worker optimization
    'WORKER_CONCURRENCY': int(os.getenv('CELERY_WORKER_CONCURRENCY', '4')),
    'WORKER_PREFETCH_MULTIPLIER': 1,
    'WORKER_DISABLE_RATE_LIMITS': False,
    'WORKER_MAX_TASKS_PER_CHILD': 1000,
    'WORKER_POOL_RESTARTS': True,
    
    # Task optimization
    'TASK_ACKS_LATE': True,
    'TASK_REJECT_ON_WORKER_LOST': True,
    'TASK_SOFT_TIME_LIMIT': 300,  # 5 minutes
    'TASK_TIME_LIMIT': 600,       # 10 minutes
    
    # Beat scheduler
    'BEAT_SCHEDULER': 'django_celery_beat.schedulers:DatabaseScheduler',
    'BEAT_SCHEDULE': {
        # Token Management
        'cleanup-expired-tokens': {
            'task': 'accounts.tasks.cleanup_expired_tokens',
            'schedule': 3600.0,  # Every hour
        },
        
        # Payment Processing
        'process-recurring-payments': {
            'task': 'payments.tasks.process_recurring_payments',
            'schedule': crontab(minute=0, hour=9),  # Daily at 9 AM
        },
        
        # Analytics and Reporting
        'update-daily-analytics': {
            'task': 'analytics.tasks.update_daily_analytics',
            'schedule': crontab(minute=30, hour=23),  # Daily at 11:30 PM
        },
        
        # Wallet Management
        'reconcile-payment-trackers': {
            'task': 'payments.tasks.reconcile_payment_trackers',
            'schedule': crontab(minute=0, hour=8),  # Daily at 8 AM
        },
        
        # Payment Reminders
        'send-payment-reminders': {
            'task': 'payments.tasks.send_payment_reminders',
            'schedule': crontab(minute=0, hour=10),  # Daily at 10 AM
        },
        
        # Late Fee Processing
        'assess-late-fees': {
            'task': 'payments.tasks.assess_late_fees',
            'schedule': crontab(minute=0, hour=0),  # Daily at midnight
        },

        # Webhook Retry
        'retry-failed-webhook-events': {
            'task': 'payments.tasks.retry_failed_webhook_events',
            'schedule': crontab(minute='*/5'),  # Every 5 minutes
        },
        
        # Payment Reconciliation
        'reconcile-payments': {
            'task': 'payments.tasks.reconcile_payments',
            'schedule': crontab(minute=30, hour=2),  # Daily at 2:30 AM
        },
        
        # Cache Cleanup
        'cleanup-expired-cache': {
            'task': 'rumi.tasks.cleanup_expired_cache',
            'schedule': crontab(minute=0, hour=3),  # Daily at 3 AM
        },
        
        # Database Maintenance
        'database-maintenance': {
            'task': 'rumi.tasks.database_maintenance',
            'schedule': crontab(minute=0, hour=4, day_of_week=0),  # Weekly on Sunday at 4 AM
        },
    },
}

# =============================================================================
# SESSION OPTIMIZATIONS
# =============================================================================

PERFORMANCE_SESSIONS = {
    'ENGINE': 'django.contrib.sessions.backends.cache',
    'CACHE_ALIAS': 'sessions',
    'SESSION_COOKIE_AGE': 1200,  # 20 minutes
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',
    'SESSION_SAVE_EVERY_REQUEST': False,
}

# =============================================================================
# STATIC FILES AND MEDIA OPTIMIZATIONS
# =============================================================================

PERFORMANCE_STATIC = {
    'STATIC_URL': '/static/',
    'STATIC_ROOT': BASE_DIR / 'staticfiles',
    'STATICFILES_STORAGE': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    'STATICFILES_DIRS': [],
}

PERFORMANCE_MEDIA = {
    'MEDIA_URL': '/media/',
    'MEDIA_ROOT': BASE_DIR / 'media',
    'FILE_UPLOAD_MAX_MEMORY_SIZE': 5242880,  # 5MB
    'DATA_UPLOAD_MAX_MEMORY_SIZE': 5242880,  # 5MB
    'FILE_UPLOAD_PERMISSIONS': 0o644,
    'FILE_UPLOAD_DIRECTORY_PERMISSIONS': 0o775,
}

# =============================================================================
# LOGGING OPTIMIZATIONS
# =============================================================================

PERFORMANCE_LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "{levelname}", "time": "{asctime}", "module": "{module}", "message": "{message}"}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'errors.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'payments': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'hostels': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}

# =============================================================================
# SECURITY OPTIMIZATIONS
# =============================================================================

PERFORMANCE_SECURITY = {
    'SECURE_BROWSER_XSS_FILTER': True,
    'SECURE_CONTENT_TYPE_NOSNIFF': True,
    'X_FRAME_OPTIONS': 'DENY',
}

# =============================================================================
# MIDDLEWARE OPTIMIZATIONS
# =============================================================================
PERFORMANCE_MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static file serving
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.gzip.GZipMiddleware',  # Response compression
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =============================================================================
# ENVIRONMENT-SPECIFIC SETTINGS
# =============================================================================

def get_performance_settings():
    """Return performance settings based on environment"""
    
    env = os.getenv('DJANGO_ENVIRONMENT', 'development')
    debug_mode = os.getenv('DEBUG', 'True').lower() == 'true'
    
    if env == 'production':
        return {
            'DATABASES': PERFORMANCE_DATABASES,
            'CACHES': PERFORMANCE_CACHES,
            'REST_FRAMEWORK': PERFORMANCE_REST_FRAMEWORK,
            'CELERY_BROKER_URL': PERFORMANCE_CELERY['BROKER_URL'],
            'CELERY_RESULT_BACKEND': PERFORMANCE_CELERY['RESULT_BACKEND'],
            'SESSION_ENGINE': PERFORMANCE_SESSIONS['ENGINE'],
            'SESSION_CACHE_ALIAS': PERFORMANCE_SESSIONS['CACHE_ALIAS'],
            'STATICFILES_STORAGE': PERFORMANCE_STATIC['STATICFILES_STORAGE'],
            'LOGGING': PERFORMANCE_LOGGING,
            'MIDDLEWARE': PERFORMANCE_MIDDLEWARE,
            **PERFORMANCE_SECURITY,
            **PERFORMANCE_STATIC,
            **PERFORMANCE_MEDIA,
        }
    else:
        # Development settings with some optimizations
        return {
            'CACHES': PERFORMANCE_CACHES,
            'REST_FRAMEWORK': {
                **PERFORMANCE_REST_FRAMEWORK,
                'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
                'PAGE_SIZE': 20,
            },
            'CELERY_BROKER_URL': PERFORMANCE_CELERY['BROKER_URL'],
            'CELERY_RESULT_BACKEND': PERFORMANCE_CELERY['RESULT_BACKEND'],
        }
