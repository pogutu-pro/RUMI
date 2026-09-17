"""
Tests for accounts app - authentication, profiles, and permissions.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
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
        self.client = APIClient()
        self.register_url = '/api/v1/accounts/register/'
        self.login_url = '/api/v1/accounts/login/'
        self.logout_url = '/api/v1/accounts/logout/'

    def test_register_student(self):
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
        self.assertIn(response.status_code, [200, 201])
        self.assertTrue(User.objects.filter(email='newstudent@test.com').exists())

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
