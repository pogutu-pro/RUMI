from django.test import TestCase
from rest_framework.test import APIClient
from django.core.cache import cache


class HomeCacheTest(TestCase):
    """Tests for Redis caching on LandingPageView.get()."""

    def setUp(self):
        cache.clear()

    def test_home_is_cached(self):
        """Second GET /api/v1/home/ must hit cache."""
        client = APIClient()
        response1 = client.get('/api/v1/home/')
        self.assertEqual(response1.status_code, 200)
        cached = cache.get('home_data')
        self.assertIsNotNone(cached, 'home_data key must be set after first call')
