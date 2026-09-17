from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from django.core.cache import cache

from home.models import BlogPost

User = get_user_model()


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


# Matches accounts/tests.py, notifications/tests.py, rumia_api/tests.py —
# without this, tests share the real (Redis) cache with local dev and every
# other test run, so RateLimitMiddleware's anonymous-request counter
# accumulates across all of them and eventually returns a raw 429
# HttpResponse instead of letting the view run at all.
@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class AdminBlogTests(TestCase):
    """Blog authoring is scoped to tech_support/tech_support_admin/
    super_admin — same roles as the support-ticket queue, not a Django
    admin / is_staff concept."""

    def setUp(self):
        self.tech_support = User.objects.create_user(
            email='tech@test.com', password='Pass123!',
            first_name='Tech', last_name='Support', role='tech_support',
            is_verified=True,
        )
        self.tenant = User.objects.create_user(
            email='tenant@test.com', password='Pass123!',
            first_name='Ten', last_name='Ant', role='tenant',
            is_verified=True,
        )
        self.tech_client = APIClient()
        self.tech_client.force_authenticate(self.tech_support)
        self.tenant_client = APIClient()
        self.tenant_client.force_authenticate(self.tenant)

    def test_tenant_cannot_list_admin_blog(self):
        response = self.tenant_client.get('/api/v1/home/admin/blog/')
        self.assertEqual(response.status_code, 403)

    def test_anonymous_cannot_list_admin_blog(self):
        response = APIClient().get('/api/v1/home/admin/blog/')
        self.assertEqual(response.status_code, 401)

    def test_tech_support_can_create_draft(self):
        response = self.tech_client.post('/api/v1/home/admin/blog/', {
            'title': 'How to add a property',
            'content': 'Step one.\n\nStep two.',
            'category': 'landlord_tips',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertFalse(response.data['is_published'])
        self.assertIsNone(response.data['published_at'])
        self.assertTrue(response.data['slug'])

        # A draft must never appear among published posts. Checked at the
        # ORM level, not by round-tripping the public /blog/ endpoint —
        # that endpoint sits behind APIResponseCacheMiddleware, which uses
        # a real, cross-test-run cache that override_settings' CACHES swap
        # does not reach (it holds its own cache client, not
        # django.core.cache.cache), so asserting on it here would be
        # asserting on cache state from unrelated earlier test runs.
        self.assertEqual(BlogPost.objects.filter(is_published=True).count(), 0)

    def test_publishing_sets_published_at_once(self):
        create = self.tech_client.post('/api/v1/home/admin/blog/', {
            'title': 'Rent collection tips',
            'content': 'Body.',
            'category': 'landlord_tips',
        }, format='json')
        post_id = create.data['id']

        publish = self.tech_client.patch(
            f'/api/v1/home/admin/blog/{post_id}/', {'is_published': True}, format='json',
        )
        self.assertEqual(publish.status_code, 200)
        self.assertTrue(publish.data['is_published'])
        first_published_at = publish.data['published_at']
        self.assertIsNotNone(first_published_at)

        # Now visible publicly (ORM check — see the comment in
        # test_tech_support_can_create_draft on why not the cached endpoint).
        self.assertEqual(BlogPost.objects.filter(is_published=True).count(), 1)

        # Re-saving (e.g. an unrelated edit) must not bump published_at.
        edit = self.tech_client.patch(
            f'/api/v1/home/admin/blog/{post_id}/', {'is_published': True}, format='json',
        )
        self.assertEqual(edit.data['published_at'], first_published_at)

    def test_duplicate_titles_get_unique_slugs(self):
        first = self.tech_client.post('/api/v1/home/admin/blog/', {
            'title': 'Same Title', 'content': 'A', 'category': 'company_news',
        }, format='json')
        second = self.tech_client.post('/api/v1/home/admin/blog/', {
            'title': 'Same Title', 'content': 'B', 'category': 'company_news',
        }, format='json')
        self.assertNotEqual(first.data['slug'], second.data['slug'])

    def test_invalid_category_rejected(self):
        response = self.tech_client.post('/api/v1/home/admin/blog/', {
            'title': 'X', 'content': 'Y', 'category': 'not-a-real-category',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_delete_removes_post(self):
        post = BlogPost.objects.create(
            title='Temp', slug='temp', content='x',
            author=self.tech_support, category='company_news',
        )
        response = self.tech_client.delete(f'/api/v1/home/admin/blog/{post.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(BlogPost.objects.filter(id=post.id).exists())
