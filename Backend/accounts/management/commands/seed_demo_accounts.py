"""
Seed one loggable-in demo account per role (tenant, caretaker, landlord,
tech_support, super_admin) plus enough connected domain data (organization,
property, unit, tenancy, rent charge, caretaker assignment) that every
role's dashboard has real data to show.

Idempotent — safe to run repeatedly. Every account's password is reset to
the fixed demo password on each run, so it always works for local login
even if it was previously seeded with a different password.

Usage:
    python manage.py seed_demo_accounts

Does NOT touch, import from, or depend on the pre-existing broken
seed_test_users.py command in this same directory.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import CaretakerProfile, LandlordProfile
from accounts.utils import generate_strong_password
from organizations.models import Organization, OrganizationMembership, PayoutAccount
from properties.models import CaretakerPropertyAssignment, Property, RentalUnit, Tenancy
from rent.models import RentCharge
from tenants.models import EscalationPolicy, TenantProfile

User = get_user_model()

# Fixed demo credentials — hardcoded on purpose (never read from environment
# or settings) so the printed table is always accurate for local dev, where
# this fixed, memorable password is genuinely fine. --password overrides it
# for anywhere that isn't local dev (see add_arguments) — this file's known
# password must never be used on a reachable-from-the-internet environment.
TEST_PASSWORD = 'Test@Rumia2026'

LANDLORD_EMAIL = 'landlord@demo.rumiarent.co.ke'
CARETAKER_EMAIL = 'caretaker@demo.rumiarent.co.ke'
TENANT_EMAIL = 'tenant@demo.rumiarent.co.ke'
TECH_SUPPORT_EMAIL = 'techsupport@demo.rumiarent.co.ke'
SUPER_ADMIN_EMAIL = 'superadmin@demo.rumiarent.co.ke'


class Command(BaseCommand):
    help = "Seed one loggable-in demo account per role, with connected domain data (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default=None,
            help=(
                "Override the fixed local-dev demo password. Required in "
                "practice anywhere reachable from the internet — the "
                "hardcoded TEST_PASSWORD in this file is public (it's in "
                "the repo). Pass --password random to have one generated "
                "and printed instead of choosing one yourself."
            ),
        )

    def handle(self, *args, **options):
        password = options.get('password')
        if password == 'random':
            password = generate_strong_password(16)
        self.password = password or TEST_PASSWORD

        with transaction.atomic():
            # 1. Subscription plans first — gate-checked endpoints (GatingService)
            # fall back to this catalog for any org with no OrganizationSubscription.
            call_command('seed_subscription_plans')

            # 2-6. Landlord + org + payout + property + unit
            landlord_user = self._get_or_reset_user(
                email=LANDLORD_EMAIL,
                first_name='Demo',
                last_name='Landlord',
                role='landlord',
                phone_number='+254711111111',
            )
            landlord_profile, _ = LandlordProfile.objects.get_or_create(user=landlord_user)

            org, _ = Organization.objects.get_or_create(
                owner=landlord_user,
                defaults={
                    'name': 'Demo Rentals Ltd',
                    'legacy_landlord_profile': landlord_profile,
                },
            )
            OrganizationMembership.objects.get_or_create(
                organization=org,
                user=landlord_user,
                defaults={'role': 'owner'},
            )
            EscalationPolicy.objects.get_or_create(organization=org)

            PayoutAccount.objects.get_or_create(
                organization=org,
                defaults={
                    'status': 'active',
                    'bank_name': 'KCB Bank',
                    'bank_account_number': '1234567890',
                    'bank_code': '01',
                    'account_name': org.name,
                },
            )

            prop, _ = Property.objects.get_or_create(
                organization=org,
                name='Greenview Apartments',
                defaults={
                    'property_type': 'apartment',
                    'address': '123 Demo Road',
                    'city': 'Nairobi',
                },
            )
            unit, _ = RentalUnit.objects.get_or_create(
                organization=org,
                parent_property=prop,
                unit_number='A101',
                defaults={
                    'unit_type': '1_bedroom',
                    'monthly_rent': Decimal('22000.00'),
                    'deposit': Decimal('22000.00'),
                    'status': 'vacant',
                },
            )

            # 7. Caretaker + assignment
            caretaker_user = self._get_or_reset_user(
                email=CARETAKER_EMAIL,
                first_name='Demo',
                last_name='Caretaker',
                role='caretaker',
                phone_number='+254733333333',
            )
            caretaker_profile, _ = CaretakerProfile.objects.get_or_create(
                user=caretaker_user,
                defaults={
                    'landlord': landlord_profile,
                    'emergency_contact_name': 'Demo Emergency Contact',
                    'emergency_contact_phone': '+254744444444',
                    'created_by': landlord_user,
                    'permissions': {'can_view_payments': True},
                },
            )
            CaretakerPropertyAssignment.objects.get_or_create(
                caretaker_profile=caretaker_profile,
                property_assignment=prop,
                defaults={
                    'organization': org,
                    'assigned_by': landlord_user,
                },
            )

            # 8. Tenant + tenancy + rent charge
            tenant_user = self._get_or_reset_user(
                email=TENANT_EMAIL,
                first_name='Demo',
                last_name='Tenant',
                role='tenant',
                phone_number='+254722222222',
            )
            tenant_profile, _ = TenantProfile.objects.get_or_create(
                organization=org,
                user=tenant_user,
                defaults={
                    'full_name': tenant_user.get_full_name(),
                    'phone': tenant_user.phone_number,
                    'email': tenant_user.email,
                    'status': 'active',
                },
            )

            # Only one status='active' Tenancy may exist per unit
            # (unique_active_tenancy_per_unit) — check before creating rather
            # than relying on get_or_create with the full field set.
            tenancy = unit.tenancies.filter(status='active').first()
            if tenancy is None:
                tenancy = Tenancy.objects.create(
                    organization=org,
                    parent_property=prop,
                    unit=unit,
                    tenant=tenant_profile,
                    start_date=date.today() - timedelta(days=30),
                    end_date=date.today() + timedelta(days=335),
                    monthly_rent=unit.monthly_rent,
                    deposit=unit.deposit,
                    rent_due_day=5,
                    status='active',
                )

            today = timezone.now().date()
            RentCharge.objects.get_or_create(
                organization=org,
                tenancy=tenancy,
                parent_property=prop,
                unit=unit,
                tenant=tenant_profile,
                period_start=today.replace(day=1),
                period_end=today.replace(day=28),
                due_date=today.replace(day=5),
                defaults={
                    'amount_due': Decimal('22000.00'),
                    'amount_paid': Decimal('0.00'),
                    'status': 'due',
                },
            )

            # 9. Tech support — no organization or supporting data.
            self._get_or_reset_user(
                email=TECH_SUPPORT_EMAIL,
                first_name='Demo',
                last_name='TechSupport',
                role='tech_support',
                phone_number='+254755555555',
            )

            # 10. Super admin — no organization or supporting data.
            self._get_or_reset_super_admin()

        self._print_credentials_table()

    def _get_or_reset_user(self, *, email, first_name, last_name, role, phone_number):
        """Get or create a demo user for a role, then always reset its
        password and verified/onboarding flags so re-running the command
        keeps every account loggable-in with the known demo password."""
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': role,
                'phone_number': phone_number,
                'is_verified': True,
                'onboarding_stage': 'COMPLETED',
            },
        )
        user.set_password(self.password)
        user.role = role
        user.is_verified = True
        user.onboarding_stage = 'COMPLETED'
        user.save()
        return user

    def _get_or_reset_super_admin(self):
        """Super admin needs is_staff/is_superuser set — create_superuser
        handles that on first creation; on re-run just re-assert the flags
        and reset the password.

        BUG FIXED: create_superuser's own defaults (UserManager, accounts/
        models.py) cover is_staff/is_superuser/role/is_verified but NOT
        onboarding_stage, which then falls through to the model field's
        default ('REGISTERED') on first creation only — re-running the
        command masked this, since the re-run branch below always set it
        correctly, making a *freshly seeded* super_admin the one broken
        case. onboarding_stage is now set unconditionally after either
        branch so a first-time run is no longer silently incomplete."""
        user = User.objects.filter(email=SUPER_ADMIN_EMAIL).first()
        if user is None:
            user = User.objects.create_superuser(
                email=SUPER_ADMIN_EMAIL,
                password=self.password,
                first_name='Demo',
                last_name='SuperAdmin',
                phone_number='+254766666666',
            )
        else:
            user.set_password(self.password)
            user.role = 'super_admin'
            user.is_staff = True
            user.is_superuser = True
            user.is_verified = True
            user.save()
        user.onboarding_stage = 'COMPLETED'
        user.save(update_fields=['onboarding_stage'])
        return user

    def _print_credentials_table(self):
        rows = [
            ('landlord', LANDLORD_EMAIL),
            ('caretaker', CARETAKER_EMAIL),
            ('tenant', TENANT_EMAIL),
            ('tech_support', TECH_SUPPORT_EMAIL),
            ('super_admin', SUPER_ADMIN_EMAIL),
        ]
        self.stdout.write(self.style.SUCCESS('Demo accounts seeded successfully:'))
        self.stdout.write('')
        header = f"{'ROLE':<14} {'EMAIL':<40} {'PASSWORD'}"
        self.stdout.write(self.style.SUCCESS(header))
        self.stdout.write(self.style.SUCCESS('-' * len(header)))
        for role, email in rows:
            self.stdout.write(
                self.style.SUCCESS(f"{role:<14} {email:<40} {self.password}")
            )
