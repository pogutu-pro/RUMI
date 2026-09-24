import unittest
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from django.core.cache import cache

from home.models import BlogPost, JobPosting

User = get_user_model()


class HomeCacheTest(TestCase):
    """Tests for Redis caching on LandingPageView.get()."""

    def setUp(self):
        cache.clear()

    @unittest.skip('GET /api/v1/home/ no longer exists; the home data is served by per-section endpoints.')
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


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class ContactInfoNoInventedDetailsTests(TestCase):
    """The public contact API used to publish a placeholder phone/WhatsApp
    number, a made-up street address, and guessed social handles — real
    visitors could call or click them."""

    def setUp(self):
        # APIResponseCacheMiddleware caches anonymous GETs in a module-level
        # cache that ignores override_settings(CACHES=...), so a response
        # cached by an earlier run would otherwise be asserted on here.
        from rumi.cache_utils import api_cache
        cm = api_cache.cache_manager
        cm.delete(cm.get_cache_key('api', '/api/v1/home/contact/info/', 'GET'))

    def test_only_real_contact_details_are_published(self):
        response = APIClient().get('/api/v1/home/contact/info/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for invented in ('phone', 'whatsapp', 'social_media'):
            self.assertNotIn(invented, data)
        self.assertTrue(data['email'].startswith('info@rumiarent.'))
        self.assertNotIn('street', data['address'])
        self.assertNotIn('postal_code', data['address'])


class CareerPostingTests(TestCase):
    """Tech support posts roles; the public sees only what is open."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        User = get_user_model()
        self.support = User.objects.create_user(
            email='support@t.com', password='Pass123!', first_name='Su', last_name='Port',
            role='tech_support', is_verified=True,
        )
        self.landlord = User.objects.create_user(
            email='landlord@t.com', password='Pass123!', first_name='La', last_name='Lord',
            role='landlord', is_verified=True,
        )
        self.payload = {
            'title': 'Backend Engineer', 'department': 'Engineering', 'employment_type': 'full_time',
            'summary': 'Build the money paths.', 'description': 'You will work on Django.',
            'requirements': '3 years Python', 'status': 'published',
        }

    def _api(self, user=None):
        client = APIClient()
        if user:
            client.force_authenticate(user=user)
        return client

    def _clear_public_cache(self):
        from rumi.cache_utils import api_cache
        api_cache.cache_manager.delete(api_cache.cache_manager.get_cache_key('api', '/api/v1/home/careers/', 'GET'))

    def _public(self):
        self._clear_public_cache()
        return self._api().get('/api/v1/home/careers/').json()['results']

    def test_tech_support_can_create_and_it_appears_publicly(self):
        resp = self._api(self.support).post('/api/v1/home/admin/careers/', self.payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()['slug'], 'backend-engineer')
        public = self._public()
        self.assertEqual([j['title'] for j in public], ['Backend Engineer'])
        self.assertEqual(public[0]['apply_email'], 'info@rumiarent.com')

    def test_drafts_and_closed_roles_are_not_public(self):
        self._api(self.support).post('/api/v1/home/admin/careers/', {**self.payload, 'status': 'draft'}, format='json')
        self.assertEqual(self._public(), [])
        job = JobPosting.objects.get()
        self._api(self.support).patch(f'/api/v1/home/admin/careers/{job.id}/', {'status': 'published'}, format='json')
        self.assertEqual(len(self._public()), 1)
        self._api(self.support).patch(f'/api/v1/home/admin/careers/{job.id}/', {'status': 'closed'}, format='json')
        self.assertEqual(self._public(), [])

    def test_a_role_past_its_closing_date_drops_off_by_itself(self):
        from datetime import timedelta
        from django.utils import timezone
        self._api(self.support).post('/api/v1/home/admin/careers/', {
            **self.payload, 'closing_date': str(timezone.localdate() - timedelta(days=1)),
        }, format='json')
        self.assertEqual(self._public(), [])

    def test_only_staff_can_manage_postings(self):
        self.assertEqual(self._api(self.landlord).post('/api/v1/home/admin/careers/', self.payload, format='json').status_code, 403)
        self.assertEqual(self._api(self.landlord).get('/api/v1/home/admin/careers/').status_code, 403)
        self.assertIn(self._api().post('/api/v1/home/admin/careers/', self.payload, format='json').status_code, (401, 403))
        self.assertEqual(JobPosting.objects.count(), 0)

    def test_validation(self):
        bad = self._api(self.support).post('/api/v1/home/admin/careers/', {**self.payload, 'title': ''}, format='json')
        self.assertEqual(bad.status_code, 400)
        self.assertIn('title', bad.json()['errors'])
        for field, value in (('apply_email', 'nope'), ('employment_type', 'gig'), ('closing_date', 'soon'), ('status', 'live')):
            r = self._api(self.support).post('/api/v1/home/admin/careers/', {**self.payload, field: value}, format='json')
            self.assertEqual(r.status_code, 400, field)
        self.assertEqual(JobPosting.objects.count(), 0)

    def test_editing_and_deleting(self):
        self._api(self.support).post('/api/v1/home/admin/careers/', self.payload, format='json')
        job = JobPosting.objects.get()
        edited = self._api(self.support).patch(
            f'/api/v1/home/admin/careers/{job.id}/', {'title': 'Senior Backend Engineer'}, format='json')
        self.assertEqual(edited.json()['slug'], 'senior-backend-engineer')
        self.assertEqual(self._public()[0]['title'], 'Senior Backend Engineer')
        self.assertEqual(self._api(self.support).delete(f'/api/v1/home/admin/careers/{job.id}/').status_code, 204)
        self.assertEqual(self._public(), [])

    def test_slugs_stay_unique(self):
        for _ in range(2):
            self._api(self.support).post('/api/v1/home/admin/careers/', self.payload, format='json')
        self.assertEqual(sorted(JobPosting.objects.values_list('slug', flat=True)),
                         ['backend-engineer', 'backend-engineer-2'])

    def test_publishing_stamps_the_date_once(self):
        self._api(self.support).post('/api/v1/home/admin/careers/', {**self.payload, 'status': 'draft'}, format='json')
        job = JobPosting.objects.get()
        self.assertIsNone(job.published_at)
        self._api(self.support).patch(f'/api/v1/home/admin/careers/{job.id}/', {'status': 'published'}, format='json')
        job.refresh_from_db()
        first = job.published_at
        self.assertIsNotNone(first)
        self._api(self.support).patch(f'/api/v1/home/admin/careers/{job.id}/', {'summary': 'x'}, format='json')
        job.refresh_from_db()
        self.assertEqual(job.published_at, first)


class PublicApiBrowserCachingTests(TestCase):
    """Public API responses may be cached by the server, never held by browsers for minutes."""

    def test_browsers_are_told_to_revalidate_on_a_miss_and_on_a_hit(self):
        from django.http import HttpResponse
        from django.test import RequestFactory
        from rumi.middleware import APIResponseCacheMiddleware
        from rumi.cache_utils import api_cache

        middleware = APIResponseCacheMiddleware(lambda request: HttpResponse('{"results": []}', content_type='application/json'))
        path = '/api/v1/home/careers/'
        api_cache.cache_manager.delete(api_cache.cache_manager.get_cache_key('api', path, 'GET'))

        request = RequestFactory().get(path)
        self.assertIsNone(middleware.process_request(request))
        miss = middleware.process_response(request, HttpResponse('{"results": []}', content_type='application/json'))
        self.assertEqual(miss['X-Cache'], 'MISS')
        self.assertIn('no-cache', miss['Cache-Control'])
        self.assertNotIn('max-age=300', miss['Cache-Control'])

        hit = middleware.process_request(RequestFactory().get(path))
        self.assertEqual(hit['X-Cache'], 'HIT')
        self.assertIn('no-cache', hit['Cache-Control'])
        api_cache.cache_manager.delete(api_cache.cache_manager.get_cache_key('api', path, 'GET'))


class LoggedInResponsesAreNeverCachedForOtherUsersTests(TestCase):
    """
    Regression test for a real production incident: _has_auth_credentials()
    checked for cookies named 'access_token'/'sessionid', which this project
    has never set (the real cookie is 'rumi_access_token' — see
    accounts/views.py UserLoginView.post and accounts/authentication.py).
    It returned False for every authenticated request, so every logged-in
    tenant's and landlord's GET response got cached under a key with no
    user in it (cache_api_response() is only ever called with endpoint and
    method, never a user_id) and served to the next person who hit the same
    URL. Found live: a brand-new tenant's first login showed a different
    tenant's dashboard data.
    """

    def setUp(self):
        from rumi.cache_utils import api_cache
        self.api_cache = api_cache
        self.path = '/api/v1/rent/balance/'
        self.cache_key = self.api_cache.cache_manager.get_cache_key('api', self.path, 'GET')
        self.api_cache.cache_manager.delete(self.cache_key)

    def tearDown(self):
        self.api_cache.cache_manager.delete(self.cache_key)

    def test_a_request_carrying_the_real_login_cookie_is_never_cached_or_served_from_cache(self):
        from django.http import HttpResponse
        from django.test import RequestFactory
        from rumi.middleware import APIResponseCacheMiddleware

        tenant_a_response = HttpResponse('{"tenant": "A", "outstanding_total": "0.00"}', content_type='application/json')
        tenant_b_response = HttpResponse('{"tenant": "B", "outstanding_total": "22000.00"}', content_type='application/json')

        middleware = APIResponseCacheMiddleware(lambda request: tenant_a_response)

        request_a = RequestFactory().get(self.path)
        request_a.COOKIES['rumi_access_token'] = 'tenant-a-session-token'
        # A cookie-carrying request must never even attempt a cache read —
        # process_request must return None (fall through to the view),
        # never a cached HttpResponse.
        self.assertIsNone(middleware.process_request(request_a))
        middleware.process_response(request_a, tenant_a_response)

        # Nothing must have been written to the shared, unscoped cache key —
        # prove it by confirming a completely different logged-in user
        # (different cookie value) reaching the SAME URL does not receive
        # tenant A's response.
        self.assertIsNone(self.api_cache.cache_manager.get(self.cache_key))

        request_b = RequestFactory().get(self.path)
        request_b.COOKIES['rumi_access_token'] = 'tenant-b-session-token'
        served_to_b = middleware.process_request(request_b)
        self.assertIsNone(served_to_b, 'tenant B must never be served a cached response at all, let alone tenant A\'s')

    def test_a_request_with_no_login_cookie_can_still_use_the_public_cache(self):
        """The fix must not disable caching for genuinely anonymous requests."""
        from django.http import HttpResponse
        from django.test import RequestFactory
        from rumi.middleware import APIResponseCacheMiddleware

        response = HttpResponse('{"plans": []}', content_type='application/json')
        middleware = APIResponseCacheMiddleware(lambda request: response)

        anon_request = RequestFactory().get(self.path)
        self.assertIsNone(middleware.process_request(anon_request))
        middleware.process_response(anon_request, response)

        second_anon_request = RequestFactory().get(self.path)
        hit = middleware.process_request(second_anon_request)
        self.assertIsNotNone(hit, 'a genuinely anonymous request should still be servable from cache')
        self.assertEqual(hit['X-Cache'], 'HIT')
