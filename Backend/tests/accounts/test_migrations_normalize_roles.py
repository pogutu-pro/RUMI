from django.test import TestCase
from django.apps import apps
from django.contrib.auth import get_user_model

# import the migration function under test
from importlib import import_module
migration_module = import_module('accounts.migrations.0014_normalize_user_roles')


class NormalizeUserRolesMigrationTest(TestCase):
    def setUp(self):
        User = get_user_model()
        # Create users with legacy aliases using bulk_create to bypass model.save() normalization
        users = [
            User(email='s1@example.com', password='x', first_name='S', last_name='One', role='SUPERADMIN'),
            User(email='s2@example.com', password='x', first_name='S', last_name='Two', role='SUPER_ADMIN'),
            User(email='l1@example.com', password='x', first_name='L', last_name='One', role='LANDLORD'),
            User(email='c1@example.com', password='x', first_name='C', last_name='One', role='CARETAKER'),
            User(email='t1@example.com', password='x', first_name='T', last_name='One', role='TENANT'),
            User(email='ts1@example.com', password='x', first_name='TS', last_name='One', role='TECH_SUPPORT'),
            User(email='st1@example.com', password='x', first_name='ST', last_name='One', role='STUDENT'),
            # canonical values should remain
            User(email='can1@example.com', password='x', first_name='Can', last_name='One', role='student'),
            User(email='can2@example.com', password='x', first_name='Can', last_name='Two', role='tenant'),
            # unknown/edge-case role should remain unchanged (inserted raw)
            User(email='u1@example.com', password='x', first_name='U', last_name='One', role='WeirdRole'),
        ]
        User.objects.bulk_create(users)

    def test_normalize_migration(self):
        # Run the migration function against the real apps registry (test DB)
        migration_module.normalize_roles(apps, None)

        User = get_user_model()
        roles = dict(User.objects.values_list('email', 'role'))

        self.assertEqual(roles['s1@example.com'], 'super_admin')
        self.assertEqual(roles['s2@example.com'], 'super_admin')
        self.assertEqual(roles['l1@example.com'], 'landlord')
        self.assertEqual(roles['c1@example.com'], 'caretaker')
        self.assertEqual(roles['t1@example.com'], 'tenant')
        self.assertEqual(roles['ts1@example.com'], 'tech_support')
        self.assertEqual(roles['st1@example.com'], 'student')

        # canonical roles remain unchanged
        self.assertEqual(roles['can1@example.com'], 'student')
        self.assertEqual(roles['can2@example.com'], 'tenant')

        # unknown role remains unchanged
        self.assertEqual(roles['u1@example.com'], 'WeirdRole')

    def test_does_not_use_model_save(self):
        # Verify migration function uses QuerySet.update by ensuring
        # saving is not invoked: create an object with a role that would
        # be changed only if save() normalization fires (we rely on migration's approach)
        User = get_user_model()
        # Create without calling save() to ensure we can detect if migration calls save()
        u = User(email='nosave@example.com', password='x', first_name='No', last_name='Save', role='SUPERADMIN')
        User.objects.bulk_create([u])
        # re-fetch the instance for later assertions
        u = User.objects.get(email='nosave@example.com')
        # monkeypatch User.save to raise if called
        original_save = User.save

        def will_raise(*args, **kwargs):
            raise RuntimeError('save called')

        User.save = will_raise
        try:
            # running migration should not call save(), so no exception
            migration_module.normalize_roles(apps, None)
        finally:
            User.save = original_save

        u.refresh_from_db()
        self.assertEqual(u.role, 'super_admin')
