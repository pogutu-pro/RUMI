# Generated safe data migration for normalizing legacy User.role aliases.
# DO NOT APPLY to production without review. This migration only normalizes
# explicitly known legacy aliases into canonical role values using
# QuerySet.update() to avoid triggering model.save() side-effects.

from django.db import migrations


LEGACY_TO_CANONICAL = {
    'SUPERADMIN': 'super_admin',
    'SUPER_ADMIN': 'super_admin',
    'LANDLORD': 'landlord',
    'CARETAKER': 'caretaker',
    'TENANT': 'tenant',
    'TECH_SUPPORT': 'tech_support',
    'STUDENT': 'student',
}

CANONICAL_SET = set([
    'student',
    'landlord',
    'caretaker',
    'tech_support',
    'super_admin',
    'tenant',
])


def normalize_roles(apps, schema_editor):
    """
    Normalize explicitly-known legacy role aliases to canonical lowercase values.

    Important safety guarantees enforced by this function:
    - Uses apps.get_model(...) to remain compatible with historical models.
    - Uses QuerySet.update(...) to avoid calling model.save() and triggering
      any application-level normalization side-effects.
    - ONLY updates explicit legacy aliases listed in LEGACY_TO_CANONICAL.
    - Does NOT lowercase arbitrary unknown role values.
    - Does NOT conflate 'student' and 'tenant'.
    """
    User = apps.get_model('accounts', 'User')

    # Detect any unknown/unexpected role values for audit purposes.
    # We only collect them and do not modify them here.
    existing_roles = set(User.objects.values_list('role', flat=True).distinct())

    # Roles that are not canonical and not in our explicit legacy mapping
    unexpected = sorted(r for r in existing_roles if r and r not in CANONICAL_SET and r not in LEGACY_TO_CANONICAL)

    if unexpected:
        # We do not raise here because some deployments may have unexpected values
        # that require operator review. Instead, include them in the migration's
        # record by writing a message to the migration's hints (Django does not
        # provide a standard audit sink here) — in practice the deploy-runner
        # should capture migration stdout. Keep logic minimal and non-destructive.
        print('\n[accounts.0014_normalize_user_roles] Unexpected role values found (no action taken):')
        for r in unexpected:
            print('\t', r)

    # Apply updates for the explicitly mapped legacy aliases.
    for legacy, canonical in LEGACY_TO_CANONICAL.items():
        # Using .filter(role=legacy) ensures exact-match updates only.
        qs = User.objects.filter(role=legacy)
        if qs.exists():
            qs.update(role=canonical)
            print(f"[accounts.0014_normalize_user_roles] Updated {qs.count()} rows: {legacy} -> {canonical}")


def reverse_noop(apps, schema_editor):
    # The original alias casing/variant cannot be reconstructed reliably.
    # To avoid accidental data loss or incorrect reversal, this reverse
    # operation is intentionally a no-op. Rolling back should be done
    # by restoring the pre-migration audit/export if required.
    print('[accounts.0014_normalize_user_roles] reverse called: no-op (audit required to restore old values)')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_landlordprofile_average_response_time_and_more'),
    ]

    operations = [
        migrations.RunPython(normalize_roles, reverse_noop),
    ]
