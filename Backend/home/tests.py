from unittest.mock import patch

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


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class AdminBlogCacheInvalidationTests(TestCase):
    """APIResponseCacheMiddleware caches the public blog endpoints for up to
    5 minutes with no awareness of the underlying data — without explicit
    invalidation, publishing/editing/deleting a post would silently keep
    serving a stale cached response. Verified by asserting
    _invalidate_public_blog_cache is called exactly when the public-facing
    result actually changes, not by asserting on real cache-backend state
    (home.views.api_cache is a module-level singleton bound at Django
    startup, before this class's CACHES override takes effect — same
    class of issue as RateLimitMiddleware's cache_manager)."""

    def setUp(self):
        self.tech_support = User.objects.create_user(
            email='tech2@test.com', password='Pass123!',
            first_name='Tech', last_name='Support', role='tech_support',
            is_verified=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.tech_support)

    @patch('home.views._invalidate_public_blog_cache')
    def test_publishing_on_create_invalidates(self, mock_invalidate):
        response = self.client.post('/api/v1/home/admin/blog/', {
            'title': 'Published on create', 'content': 'x', 'category': 'company_news',
            'is_published': True,
        }, format='json')
        mock_invalidate.assert_called_once_with(slug=response.data['slug'])

    @patch('home.views._invalidate_public_blog_cache')
    def test_saving_as_draft_on_create_does_not_invalidate(self, mock_invalidate):
        self.client.post('/api/v1/home/admin/blog/', {
            'title': 'Still a draft', 'content': 'x', 'category': 'company_news',
        }, format='json')
        mock_invalidate.assert_not_called()

    @patch('home.views._invalidate_public_blog_cache')
    def test_publishing_a_draft_via_patch_invalidates(self, mock_invalidate):
        post = BlogPost.objects.create(
            title='Draft to publish', slug='draft-to-publish', content='x',
            author=self.tech_support, category='company_news', is_published=False,
        )
        self.client.patch(f'/api/v1/home/admin/blog/{post.id}/', {'is_published': True}, format='json')
        mock_invalidate.assert_called_once_with(slug='draft-to-publish', old_slug='draft-to-publish')

    @patch('home.views._invalidate_public_blog_cache')
    def test_editing_content_of_a_still_draft_post_does_not_invalidate(self, mock_invalidate):
        post = BlogPost.objects.create(
            title='Still draft', slug='still-draft', content='x',
            author=self.tech_support, category='company_news', is_published=False,
        )
        self.client.patch(f'/api/v1/home/admin/blog/{post.id}/', {'content': 'edited'}, format='json')
        mock_invalidate.assert_not_called()

    @patch('home.views._invalidate_public_blog_cache')
    def test_editing_title_of_published_post_invalidates_both_old_and_new_slug(self, mock_invalidate):
        post = BlogPost.objects.create(
            title='Original Title', slug='original-title', content='x',
            author=self.tech_support, category='company_news', is_published=True,
        )
        self.client.patch(f'/api/v1/home/admin/blog/{post.id}/', {'title': 'New Title'}, format='json')
        mock_invalidate.assert_called_once_with(slug='new-title', old_slug='original-title')

    @patch('home.views._invalidate_public_blog_cache')
    def test_unpublishing_invalidates(self, mock_invalidate):
        post = BlogPost.objects.create(
            title='Was live', slug='was-live', content='x',
            author=self.tech_support, category='company_news', is_published=True,
        )
        self.client.patch(f'/api/v1/home/admin/blog/{post.id}/', {'is_published': False}, format='json')
        mock_invalidate.assert_called_once_with(slug='was-live', old_slug='was-live')

    @patch('home.views._invalidate_public_blog_cache')
    def test_deleting_published_post_invalidates(self, mock_invalidate):
        post = BlogPost.objects.create(
            title='To delete', slug='to-delete', content='x',
            author=self.tech_support, category='company_news', is_published=True,
        )
        self.client.delete(f'/api/v1/home/admin/blog/{post.id}/')
        mock_invalidate.assert_called_once_with(slug='to-delete')

    @patch('home.views._invalidate_public_blog_cache')
    def test_deleting_draft_post_does_not_invalidate(self, mock_invalidate):
        post = BlogPost.objects.create(
            title='Draft to delete', slug='draft-to-delete', content='x',
            author=self.tech_support, category='company_news', is_published=False,
        )
        self.client.delete(f'/api/v1/home/admin/blog/{post.id}/')
        mock_invalidate.assert_not_called()
