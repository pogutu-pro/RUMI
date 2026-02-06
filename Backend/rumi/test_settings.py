from .settings import *

# Backend Verification settings (Migrated to Pytest-Django)

# Override problematic middleware for stable testing
MIDDLEWARE = [
    m for m in MIDDLEWARE 
    if m not in [
        'rumi.middleware.APIResponseCacheMiddleware',
        'rumi.middleware.RateLimitMiddleware',
    ]
]

# Provide all required cache backends expected by rumi.cache_utils
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
    'sessions': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
    'template_fragments': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
}

# Ensure tests don't hit external services
CELERY_TASK_ALWAYS_EAGER = True
MPESA_SANDBOX = True
# Disable real Redis/Channels for unit tests where possible
CHANNEL_LAYERS = {
    'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
}

# Use faster password hasher
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]
