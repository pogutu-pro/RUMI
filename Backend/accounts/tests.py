"""
Tests for accounts app - authentication, profiles, and permissions.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import StudentProfile, LandlordProfile

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class AuthenticationTests(TestCase):
    """Test registration, login, logout, and token refresh."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.register_url = '/api/v1/accounts/register/'
        self.login_url = '/api/v1/accounts/login/'
        self.logout_url = '/api/v1/accounts/logout/'

    def test_register_rejects_student_role(self):
        # Tenants (the current name for the old 'student' role) are invited
        # by their landlord and never self-register — see tenants/services.py.
        data = {
            'email': 'newstudent@test.com',
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'Student',
            'role': 'student',
            'phone_number': '+254712345678',
            'gender': 'male',
            'date_of_birth': '2000-01-15',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email='newstudent@test.com').exists())

    def test_register_landlord(self):
        data = {
            'email': 'newlandlord@test.com',
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'Landlord',
            'role': 'landlord',
            'phone_number': '+254712345678',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertIn(response.status_code, [200, 201])
        self.assertTrue(User.objects.filter(email='newlandlord@test.com').exists())

    def test_register_duplicate_email(self):
        User.objects.create_user(
            email='existing@test.com', password='Pass123!',
            first_name='Test', last_name='User', role='student',
        )
        data = {
            'email': 'existing@test.com',
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!',
            'first_name': 'Dup', 'last_name': 'User', 'role': 'student',
            'phone_number': '+254712345678',
            'gender': 'male', 'date_of_birth': '2000-01-15',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertIn(response.status_code, [400, 409])

    def test_login_success(self):
        User.objects.create_user(
            email='login@test.com', password='Pass123!',
            first_name='Test', last_name='User', role='student',
            is_verified=True,
        )
        data = {'email': 'login@test.com', 'password': 'Pass123!'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, 200)

    def test_login_response_includes_onboarding_stage(self):
        """
        Regression test for post-login-redirect-broken: the frontend's
        onboarding-guard cookie (rumi_onboarding_stage) is only ever
        populated from this field (see auth.store.ts login()). If it is
        missing from the login response, every fresh login gets stuck in a
        permanent /onboarding redirect loop regardless of the account's
        actual onboarding_stage in the DB — independent of role.
        """
        for role, stage in [
            ('tenant', 'COMPLETED'),
            ('landlord', 'IDENTITY_DRAFT'),
            ('caretaker', 'REGISTERED'),
        ]:
            with self.subTest(role=role):
                email = f'onboarding-{role}@test.com'
                User.objects.create_user(
                    email=email, password='Pass123!',
                    first_name='Test', last_name='User', role=role,
                    is_verified=True, onboarding_stage=stage,
                )
                response = self.client.post(
                    self.login_url,
                    {'email': email, 'password': 'Pass123!'},
                    format='json',
                )
                self.assertEqual(response.status_code, 200)
                self.assertIn('onboarding_stage', response.data['user'])
                self.assertEqual(response.data['user']['onboarding_stage'], stage)

    def test_unverified_login_is_blocked_and_sent_a_fresh_code(self):
        from unittest import mock
        from accounts.models import OTPVerification

        User.objects.create_user(
            email='unverified@test.com', password='Pass123!',
            first_name='Un', last_name='Verified', role='landlord',
        )
        with mock.patch('accounts.tasks.send_verification_email.delay') as send:
            response = self.client.post(
                self.login_url,
                {'email': 'unverified@test.com', 'password': 'Pass123!'},
                format='json',
            )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], 'email_not_verified')
        self.assertEqual(response.data['email'], 'unverified@test.com')
        self.assertNotIn('access_token', response.data)
        self.assertEqual(
            OTPVerification.objects.filter(user__email='unverified@test.com').count(), 1,
        )
        send.assert_called_once()

    def test_unverified_login_with_wrong_password_reveals_nothing(self):
        User.objects.create_user(
            email='unverified@test.com', password='Pass123!',
            first_name='Un', last_name='Verified', role='landlord',
        )
        response = self.client.post(
            self.login_url,
            {'email': 'unverified@test.com', 'password': 'WrongPass!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)
        self.assertNotEqual(response.data.get('error'), 'email_not_verified')

    def test_unverified_login_does_not_spam_codes_when_rate_limited(self):
        from unittest import mock
        from accounts.models import OTPVerification

        User.objects.create_user(
            email='unverified@test.com', password='Pass123!',
            first_name='Un', last_name='Verified', role='landlord',
        )
        with mock.patch('accounts.tasks.send_verification_email.delay'):
            for _ in range(5):
                response = self.client.post(
                    self.login_url,
                    {'email': 'unverified@test.com', 'password': 'Pass123!'},
                    format='json',
                )
                self.assertEqual(response.status_code, 403)
        self.assertEqual(OTPVerification.objects.filter(user__email='unverified@test.com').count(), 3)

    def test_password_reset_confirm_marks_invited_user_verified(self):
        from accounts.models import PasswordResetToken

        invited = User.objects.create_user(
            email='invited@test.com', password=None,
            first_name='In', last_name='Vited', role='tenant',
        )
        self.assertFalse(invited.is_verified)
        token = PasswordResetToken.objects.create(
            user=invited, expires_at=timezone.now() + timezone.timedelta(hours=24),
        )
        response = self.client.post(
            '/api/v1/accounts/password/reset/confirm/',
            {'token': str(token.token), 'new_password': 'StrongPass123!',
             'confirm_password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        invited.refresh_from_db()
        self.assertTrue(invited.is_verified)
        login = self.client.post(
            self.login_url, {'email': 'invited@test.com', 'password': 'StrongPass123!'}, format='json',
        )
        self.assertEqual(login.status_code, 200)

    def test_login_wrong_password(self):
        User.objects.create_user(
            email='login@test.com', password='Pass123!',
            first_name='Test', last_name='User', role='student',
            is_verified=True,
        )
        data = {'email': 'login@test.com', 'password': 'WrongPass!'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertIn(response.status_code, [400, 401])

    def test_login_nonexistent_user(self):
        data = {'email': 'nobody@test.com', 'password': 'Pass123!'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertIn(response.status_code, [400, 401, 404])

    def test_logout(self):
        user = User.objects.create_user(
            email='logout@test.com', password='Pass123!',
            first_name='Test', last_name='User', role='student',
            is_verified=True,
        )
        self.client.force_authenticate(user=user)
        response = self.client.post(self.logout_url, format='json')
        self.assertIn(response.status_code, [200, 204])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class ProfileTests(TestCase):
    """Test profile retrieval and updates."""

    def setUp(self):
        self.client = APIClient()
        self.profile_url = '/api/v1/accounts/profile/'
        self.completion_url = '/api/v1/accounts/profile/completion/'
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            university='Test University',
            course='Computer Science',
            year_of_study=2,
        )

    def test_get_profile_authenticated(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, 200)

    def test_get_profile_unauthenticated(self):
        response = self.client.get(self.profile_url)
        self.assertIn(response.status_code, [401, 403])

    def test_update_profile(self):
        self.client.force_authenticate(user=self.student_user)
        data = {'first_name': 'Updated', 'last_name': 'Name'}
        response = self.client.put(self.profile_url, data, format='json')
        self.assertIn(response.status_code, [200, 204])

    def test_profile_completion(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.completion_url)
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class RolePermissionTests(TestCase):
    """Test role-based access control."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = User.objects.create_user(
            email='student@test.com', password='Pass123!',
            first_name='Test', last_name='Student', role='student',
            is_verified=True,
        )
        StudentProfile.objects.create(
            user=self.student_user, university='Test Uni',
            course='CS', year_of_study=1,
        )
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Test', last_name='Landlord', role='landlord',
            is_verified=True,
        )
        LandlordProfile.objects.create(
            user=self.landlord_user, company_name='Test Co',
            national_id='12345678',
        )

    def test_student_cannot_access_landlord_dashboard(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/accounts/landlord/dashboard/')
        self.assertIn(response.status_code, [403, 404])

    def test_landlord_cannot_access_student_dashboard(self):
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get('/api/v1/accounts/dashboard/')
        self.assertIn(response.status_code, [403, 404])


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class PasswordResetTests(TestCase):
    """Test password reset flow."""

    def setUp(self):
        # The reset-cooldown cache key is per-email, not per-test — Django
        # resets the DB between tests via transactions but does NOT reset
        # the cache, so a cooldown set by one test method (e.g. requesting
        # a reset for 'reset@test.com') would otherwise bleed into the next
        # one that reuses the same email.
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='reset@test.com', password='OldPass123!',
            first_name='Test', last_name='User', role='student',
            is_verified=True,
        )

    def test_password_reset_request(self):
        response = self.client.post(
            '/api/v1/accounts/password/reset/',
            {'email': 'reset@test.com'}, format='json',
        )
        self.assertIn(response.status_code, [200, 201, 204])

    def test_password_reset_nonexistent_email(self):
        response = self.client.post(
            '/api/v1/accounts/password/reset/',
            {'email': 'nobody@test.com'}, format='json',
        )
        # Should still return 200 to prevent email enumeration
        self.assertIn(response.status_code, [200, 400, 404])

    def test_password_reset_second_request_is_rate_limited(self):
        """A second request for the same email, before the cooldown window
        elapses, must be rejected — regression test for the "resend" button
        having no cooldown at all (any number of clicks each queued a fresh
        email)."""
        first = self.client.post(
            '/api/v1/accounts/password/reset/',
            {'email': 'reset@test.com'}, format='json',
        )
        self.assertEqual(first.status_code, 200)
        self.assertIn('retry_after_seconds', first.data)

        second = self.client.post(
            '/api/v1/accounts/password/reset/',
            {'email': 'reset@test.com'}, format='json',
        )
        self.assertEqual(second.status_code, 429)
        self.assertIn('retry_after_seconds', second.data)
        self.assertGreater(second.data['retry_after_seconds'], 0)

    def test_password_reset_cooldown_applies_to_nonexistent_email_too(self):
        """The cooldown must apply even when the email has no account —
        otherwise a rate-limited response only for real accounts would leak
        which emails exist."""
        first = self.client.post(
            '/api/v1/accounts/password/reset/',
            {'email': 'nobody-cooldown@test.com'}, format='json',
        )
        self.assertEqual(first.status_code, 200)

        second = self.client.post(
            '/api/v1/accounts/password/reset/',
            {'email': 'nobody-cooldown@test.com'}, format='json',
        )
        self.assertEqual(second.status_code, 429)

    def test_check_email_availability(self):
        response = self.client.post(
            '/api/v1/accounts/check-email/',
            {'email': 'fresh@test.com'}, format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_check_email_taken(self):
        response = self.client.post(
            '/api/v1/accounts/check-email/',
            {'email': 'reset@test.com'}, format='json',
        )
        self.assertEqual(response.status_code, 200)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class UserManagementTests(TestCase):
    """UserManagementView/UserDeactivateView/UserReactivateView — exposed
    through the super-admin Users dashboard for the first time; previously
    reachable but had zero test coverage."""

    def setUp(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_superuser(
            email='superadmin@test.com', password='Pass123!',
            first_name='Super', last_name='Admin',
        )
        self.tech_support = User.objects.create_user(
            email='tech@test.com', password='Pass123!',
            first_name='Tech', last_name='Support', role='tech_support',
            is_verified=True,
        )
        self.landlord = User.objects.create_user(
            email='landlord@test.com', password='Pass123!',
            first_name='Land', last_name='Lord', role='landlord',
            is_verified=True,
        )
        self.tenant = User.objects.create_user(
            email='tenant@test.com', password='Pass123!',
            first_name='Ten', last_name='Ant', role='tenant',
            is_verified=True,
        )

    def test_tenant_cannot_list_users(self):
        self.client.force_authenticate(self.tenant)
        response = self.client.get('/api/v1/accounts/users/')
        self.assertEqual(response.status_code, 403)

    def test_anonymous_cannot_list_users(self):
        response = self.client.get('/api/v1/accounts/users/')
        self.assertEqual(response.status_code, 401)

    def test_super_admin_lists_all_users(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/v1/accounts/users/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_users'], 4)

    def test_tech_support_can_list_users(self):
        self.client.force_authenticate(self.tech_support)
        response = self.client.get('/api/v1/accounts/users/')
        self.assertEqual(response.status_code, 200)

    def test_filter_by_role(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/v1/accounts/users/', {'role': 'landlord'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_users'], 1)
        self.assertEqual(response.data['users'][0]['email'], 'landlord@test.com')

    def test_search_by_name_or_email(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/v1/accounts/users/', {'search': 'tenant@test.com'})
        self.assertEqual(response.data['total_users'], 1)

    def test_tech_support_can_deactivate_user(self):
        self.client.force_authenticate(self.tech_support)
        response = self.client.put(
            f'/api/v1/accounts/users/{self.tenant.id}/deactivate/',
            {'reason': 'Fraudulent activity'}, format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.tenant.refresh_from_db()
        self.assertFalse(self.tenant.is_active)

    def test_deactivated_user_cannot_log_in(self):
        self.client.force_authenticate(self.super_admin)
        self.client.put(
            f'/api/v1/accounts/users/{self.tenant.id}/deactivate/',
            {'reason': 'Test'}, format='json',
        )
        self.client.force_authenticate(user=None)
        response = self.client.post(
            '/api/v1/accounts/login/',
            {'email': 'tenant@test.com', 'password': 'Pass123!'}, format='json',
        )
        self.assertNotEqual(response.status_code, 200)

    def test_tenant_cannot_deactivate_user(self):
        self.client.force_authenticate(self.tenant)
        response = self.client.put(
            f'/api/v1/accounts/users/{self.landlord.id}/deactivate/',
            {'reason': 'Test'}, format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_tech_support_cannot_reactivate_user(self):
        # UserReactivateView is IsSuperAdmin-only, unlike deactivate which is
        # IsAdminOrSuperAdmin — tech_support can lock an account but not
        # unlock one.
        self.tenant.is_active = False
        self.tenant.save()
        self.client.force_authenticate(self.tech_support)
        response = self.client.put(f'/api/v1/accounts/users/{self.tenant.id}/reactivate/')
        self.assertEqual(response.status_code, 403)

    def test_super_admin_can_reactivate_user(self):
        self.tenant.is_active = False
        self.tenant.save()
        self.client.force_authenticate(self.super_admin)
        response = self.client.put(f'/api/v1/accounts/users/{self.tenant.id}/reactivate/')
        self.assertEqual(response.status_code, 200)
        self.tenant.refresh_from_db()
        self.assertTrue(self.tenant.is_active)

    def test_deactivate_nonexistent_user_404s(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.put(
            '/api/v1/accounts/users/999999/deactivate/',
            {'reason': 'Test'}, format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_limit_offset_genuinely_pages_through_results(self):
        """Not just that limit/offset are accepted — that page two is
        actually a different, non-overlapping slice of page one, matching
        the frontend's 'Load more' (offset += page size) usage."""
        for i in range(30):
            User.objects.create_user(
                email=f'bulk{i}@test.com', password='Pass123!',
                first_name='Bulk', last_name=str(i), role='tenant',
                is_verified=True,
            )
        self.client.force_authenticate(self.super_admin)

        page_one = self.client.get('/api/v1/accounts/users/', {'limit': 25, 'offset': 0})
        page_two = self.client.get('/api/v1/accounts/users/', {'limit': 25, 'offset': 25})

        self.assertEqual(page_one.data['total_users'], 34)
        self.assertEqual(len(page_one.data['users']), 25)
        self.assertEqual(len(page_two.data['users']), 9)

        page_one_ids = {u['user_id'] for u in page_one.data['users']}
        page_two_ids = {u['user_id'] for u in page_two.data['users']}
        self.assertEqual(page_one_ids & page_two_ids, set())


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='RumiaRent <noreply@rumiarent.com>',
)
class BrandedEmailDeliveryTests(TestCase):
    """send_branded_email used to forward fail_silently into EmailMessage(),
    which rejects it — every verification/reset email raised TypeError inside
    a task that swallowed it, so the API said 'sent' and nothing left."""

    def test_send_branded_email_accepts_fail_silently(self):
        from django.core import mail
        from accounts.utils import send_branded_email

        sent = send_branded_email(
            subject='Hello', message='Body text', from_email='noreply@rumiarent.com',
            recipient_list=['someone@example.com'], recipient_name='Sam', fail_silently=False,
        )
        self.assertEqual(sent, 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['someone@example.com'])
        self.assertEqual(mail.outbox[0].content_subtype, 'html')

    def test_password_reset_task_actually_sends_an_email(self):
        from django.core import mail
        from accounts.models import PasswordResetToken
        from accounts.tasks import send_password_reset_email

        user = User.objects.create_user(
            email='reset-me@example.com', password='Pass123!',
            first_name='Reset', last_name='Me', role='landlord', is_verified=True,
        )
        token = PasswordResetToken.objects.create(
            user=user, expires_at=timezone.now() + timezone.timedelta(hours=1),
        )
        send_password_reset_email(user.id, str(token.token))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['reset-me@example.com'])


class BrandedEmailTemplateTests(TestCase):
    """The email layout is customer-facing: right brand, right colours, a logo
    URL that actually exists, no leftover copy from the old student product."""

    def _render(self, message='Hello there', name='Sam', subject='Subject'):
        from accounts.utils import create_branded_email_html
        return create_branded_email_html(subject, message, name)

    def test_uses_rumiarent_brand_colour_and_public_logo(self):
        html = self._render()
        self.assertIn('#027F53', html)
        self.assertIn('https://rumiarent.com/images/logo/logo.png', html)
        self.assertIn('RumiaRent', html)

    def test_no_leftover_old_brand_or_student_copy(self):
        html = self._render().lower()
        for stale in ('student', 'accommodation', '667eea', '764ba2', 'rumi.co.ke',
                      '+254 700 000 000', 'valued member', 'rumi platform'):
            self.assertNotIn(stale, html)

    def test_user_supplied_text_is_html_escaped(self):
        html = self._render(message='<script>alert(1)</script>', name='<b>x</b>')
        self.assertNotIn('<script>', html)
        self.assertIn('&lt;script&gt;', html)
        self.assertNotIn('<b>x</b>', html)

    def test_bare_urls_become_clickable_links(self):
        html = self._render(message='Reset here:\n\nhttps://rumiarent.com/reset-password?token=abc')
        self.assertIn('<a href="https://rumiarent.com/reset-password?token=abc"', html)

    def test_year_in_footer_is_current(self):
        self.assertIn(str(timezone.now().year), self._render())


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='RumiaRent <noreply@rumiarent.com>',
    FRONTEND_URL='https://rumiarent.com',
)
class TransactionalEmailContentTests(TestCase):
    """Links in transactional emails must point at the live site, and copy
    must describe RumiaRent — these used to say rumi.co.ke / 'book hostels' /
    'connect with other students'."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='content@example.com', password='Pass123!',
            first_name='Jo', last_name='Kim', role='landlord', is_verified=True,
        )

    def _only_email_html(self):
        from django.core import mail
        self.assertEqual(len(mail.outbox), 1)
        return mail.outbox[0].body

    def test_password_reset_link_points_at_live_site(self):
        from accounts.models import PasswordResetToken
        from accounts.tasks import send_password_reset_email
        token = PasswordResetToken.objects.create(
            user=self.user, expires_at=timezone.now() + timezone.timedelta(hours=1),
        )
        send_password_reset_email(self.user.id, str(token.token))
        html = self._only_email_html()
        self.assertIn(f'https://rumiarent.com/reset-password?token={token.token}', html)
        self.assertNotIn('rumi.co.ke', html)

    def test_welcome_email_describes_rumiarent_not_the_old_product(self):
        from accounts.tasks import send_welcome_email
        send_welcome_email(self.user.id)
        html = self._only_email_html().lower()
        self.assertIn('https://rumiarent.com/dashboard', html)
        for stale in ('student', 'hostel', 'rumi.co.ke'):
            self.assertNotIn(stale, html)


class BrandedEmailGreetingTests(TestCase):
    def test_greeting_is_not_duplicated_when_message_already_has_one(self):
        from accounts.utils import create_branded_email_html
        html = create_branded_email_html('S', 'Hi Joseph,\n\nYour code is 1.', 'Joseph')
        self.assertEqual(html.count('Hi Joseph,'), 1)

    def test_greeting_is_added_when_message_has_none(self):
        from accounts.utils import create_branded_email_html
        html = create_branded_email_html('S', 'Your code is 1.', 'Joseph')
        self.assertEqual(html.count('Hi Joseph,'), 1)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class LandlordWizardCompletionTests(TestCase):
    """A new landlord must be able to finish onboarding even before payout details exist."""

    def setUp(self):
        from django.core.management import call_command
        from organizations.models import Organization
        from properties.models import Property
        cache.clear()
        call_command('seed_subscription_plans')
        self.client = APIClient()
        self.landlord = User.objects.create_user(
            email='newlandlord@test.com', password='Pass123!', first_name='New', last_name='Landlord',
            role='landlord', is_verified=True,
        )
        self.org = Organization.objects.create(name='New Org', owner=self.landlord)
        Property.objects.create(organization=self.org, name='First', address='1 Rd', city='Nairobi')
        self.client.force_authenticate(user=self.landlord)
        self.url = '/api/v1/accounts/onboarding/wizard-complete/'

    def test_can_finish_without_any_payout_details(self):
        response = self.client.post(self.url, {'plan_slug': 'pro'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.landlord.refresh_from_db()
        self.assertEqual(self.landlord.onboarding_stage, 'COMPLETED')

    def test_still_needs_an_organization_and_a_property(self):
        from properties.models import Property
        Property.objects.all().delete()
        self.assertEqual(self.client.post(self.url, {'plan_slug': 'pro'}, format='json').status_code, 400)
        self.landlord.refresh_from_db()
        self.assertEqual(self.landlord.onboarding_stage, 'REGISTERED')

    def test_status_still_points_at_the_payout_step_until_it_is_done(self):
        data = self.client.get('/api/v1/accounts/onboarding/status/').json()
        self.assertEqual(data['wizard']['current_step'], 3)
