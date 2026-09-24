"""
Phase 2 tests — RUMIA domain foundation.

Covers: organization isolation, financial integrity, tenancy lifecycle,
unit lifecycle, tenant isolation, caretaker isolation, migration mapping.
"""

import hashlib
import hmac
import json
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from django.core import mail

from accounts.models import CaretakerProfile, LandlordProfile, PasswordResetToken, StudentProfile
from audit.models import AuditLog
from organizations.models import Organization, OrganizationMembership, PayoutAccount
from properties.models import Property, RentalUnit, Tenancy, CaretakerPropertyAssignment
from rent.models import Payment, PaymentAllocation, Receipt, RentCharge
from rent.providers.base import InitiatePaymentResult, ProviderConfigStatus, ProviderStatus, VerifyPaymentResult
from rent.providers.paystack import PaystackProvider
from rent.services.income_flow import IncomeFlowService
from rent.services.payment_service import PaymentService
from rent.services.rent_generation import RentChargeGenerationService
from tenants.models import EmergencyContact, EscalationPolicy, TenantProfile

User = get_user_model()


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class RumiaTestFixtures(TestCase):
    """Shared fixture factory for RUMIA domain tests."""

    @classmethod
    def setUpTestData(cls):
        # GATE-01: GatingService.get_effective_plan() falls back to the
        # seeded starter/enterprise SubscriptionPlan rows for any org with
        # no OrganizationSubscription (the default for every fixture org
        # created in this suite) — every gate-guarded endpoint now depends
        # on these rows existing. Idempotent (get_or_create by slug), so
        # harmless if a subclass also seeds explicitly.
        call_command('seed_subscription_plans')

    @classmethod
    def create_landlord_with_org(cls, email='landlord@test.com'):
        user = User.objects.create_user(
            email=email,
            password='TestPass123!',
            first_name='Land',
            last_name='Lord',
            role='landlord',
            phone_number='+254711111111',
        )
        profile = LandlordProfile.objects.create(user=user, company_name='Test Properties')
        org = Organization.objects.create(
            name='Test Org',
            owner=user,
            legacy_landlord_profile=profile,
        )
        OrganizationMembership.objects.create(organization=org, user=user, role='owner')
        EscalationPolicy.objects.create(organization=org)
        return user, profile, org

    @classmethod
    def create_super_admin(cls, email='admin@test.com'):
        # super_admin has no Organization of its own — matches the pattern
        # already established: get_user_organization_ids() returns None
        # (unrestricted) for this role (see core/permissions/rumia.py).
        return User.objects.create_user(
            email=email,
            password='TestPass123!',
            first_name='Super',
            last_name='Admin',
            role='super_admin',
            phone_number='+254700000099',
        )

    @classmethod
    def create_property_with_unit(cls, org, name='Greenview Apartments'):
        prop = Property.objects.create(
            organization=org,
            name=name,
            property_type='apartment',
            address='123 Test Road',
            city='Nairobi',
        )
        unit = RentalUnit.objects.create(
            organization=org,
            parent_property=prop,
            unit_number='A101',
            unit_type='1_bedroom',
            monthly_rent=Decimal('22000.00'),
            deposit=Decimal('22000.00'),
            status='vacant',
        )
        return prop, unit

    @classmethod
    def create_tenant(cls, org, email='tenant@test.com', role='tenant'):
        user = User.objects.create_user(
            email=email,
            password='TestPass123!',
            first_name='John',
            last_name='Kamau',
            role=role,
            phone_number='+254722222222',
        )
        profile = TenantProfile.objects.create(
            organization=org,
            user=user,
            full_name='John Kamau',
            phone='+254722222222',
            email=email,
            status='active',
        )
        return user, profile

    @classmethod
    def create_tenancy(cls, org, prop, unit, tenant, status='active'):
        return Tenancy.objects.create(
            organization=org,
            parent_property=prop,
            unit=unit,
            tenant=tenant,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=335),
            monthly_rent=Decimal('22000.00'),
            deposit=Decimal('22000.00'),
            rent_due_day=5,
            status=status,
        )

    @classmethod
    def create_rent_charge(cls, tenancy, amount=Decimal('22000.00'), amount_paid=Decimal('0.00')):
        today = timezone.now().date()
        return RentCharge.objects.create(
            organization=tenancy.organization,
            tenancy=tenancy,
            parent_property=tenancy.parent_property,
            unit=tenancy.unit,
            tenant=tenancy.tenant,
            period_start=today.replace(day=1),
            period_end=(today.replace(day=28)),
            due_date=today.replace(day=5),
            amount_due=amount,
            amount_paid=amount_paid,
            status='due' if amount_paid == 0 else 'partially_paid',
        )


class OrganizationIsolationTests(RumiaTestFixtures):
    def test_landlord_cannot_see_other_org_properties(self):
        user_a, _, org_a = self.create_landlord_with_org('landlord_a@test.com')
        user_b, _, org_b = self.create_landlord_with_org('landlord_b@test.com')
        self.create_property_with_unit(org_a, 'Property A')
        self.create_property_with_unit(org_b, 'Property B')

        client = APIClient()
        client.force_authenticate(user=user_a)
        response = client.get('/api/v1/properties/')
        self.assertEqual(response.status_code, 200)
        names = [p['name'] for p in response.data]
        self.assertIn('Property A', names)
        self.assertNotIn('Property B', names)


class TenantIsolationTests(RumiaTestFixtures):
    def test_tenant_cannot_access_other_tenant_profile(self):
        user_l, _, org = self.create_landlord_with_org()
        _, tenant_a = self.create_tenant(org, 'tenant_a@test.com')
        _, tenant_b = self.create_tenant(org, 'tenant_b@test.com')

        client = APIClient()
        client.force_authenticate(user=tenant_a.user)
        response = client.get(f'/api/v1/tenants/{tenant_b.id}/')
        self.assertEqual(response.status_code, 403)

    def test_tenant_sees_only_own_rent_charges(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit_a = self.create_property_with_unit(org)
        unit_b, _ = RentalUnit.objects.get_or_create(
            organization=org,
            parent_property=prop,
            unit_number='A102',
            defaults={
                'unit_type': '1_bedroom',
                'monthly_rent': Decimal('22000.00'),
                'status': 'vacant',
            },
        )
        user_a, tenant_a = self.create_tenant(org, 'ta@test.com')
        user_b, tenant_b = self.create_tenant(org, 'tb@test.com')
        tenancy_a = self.create_tenancy(org, prop, unit_a, tenant_a)
        tenancy_b = self.create_tenancy(org, prop, unit_b, tenant_b)
        self.create_rent_charge(tenancy_a)
        self.create_rent_charge(tenancy_b)

        client = APIClient()
        client.force_authenticate(user=user_a)
        response = client.get('/api/v1/rent/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


class CaretakerIsolationTests(RumiaTestFixtures):
    def test_caretaker_cannot_access_unassigned_property(self):
        user_l, _, org = self.create_landlord_with_org()
        prop_a, _ = self.create_property_with_unit(org, 'Property A')
        prop_b, _ = self.create_property_with_unit(org, 'Property B')

        caretaker_user = User.objects.create_user(
            email='caretaker@test.com',
            password='TestPass123!',
            first_name='Care',
            last_name='Taker',
            role='caretaker',
            phone_number='+254733333333',
        )
        caretaker_profile = CaretakerProfile.objects.create(
            user=caretaker_user,
            landlord=LandlordProfile.objects.get(user=user_l),
            emergency_contact_name='Emergency',
            emergency_contact_phone='+254744444444',
            created_by=user_l,
            permissions={'can_view_payments': True},
        )
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=caretaker_profile,
            property_assignment=prop_a,
            organization=org,
            assigned_by=user_l,
        )

        client = APIClient()
        client.force_authenticate(user=caretaker_user)
        response = client.get('/api/v1/properties/')
        self.assertEqual(response.status_code, 200)
        names = [p['name'] for p in response.data]
        self.assertIn('Property A', names)
        self.assertNotIn('Property B', names)


class FinancialIntegrityTests(RumiaTestFixtures):
    def test_partial_payment_reduces_outstanding(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        charge = self.create_rent_charge(tenancy, amount=Decimal('25000.00'))

        payment = Payment.objects.create(
            organization=org,
            tenancy=tenancy,
            tenant=tenant,
            parent_property=prop,
            unit=unit,
            amount=Decimal('10000.00'),
            payment_method='cash',
            provider='manual',
            internal_reference='TEST-PARTIAL-001',
            status='success',
            paid_at=timezone.now(),
        )
        PaymentAllocation.objects.create(payment=payment, invoice=charge, amount=Decimal('10000.00'))
        charge.amount_paid = Decimal('10000.00')
        charge.recalculate_status()
        charge.save()

        self.assertEqual(charge.outstanding, Decimal('15000.00'))
        self.assertEqual(charge.status, 'partially_paid')

    def test_multiple_payments_aggregate_to_paid(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        charge = self.create_rent_charge(tenancy, amount=Decimal('25000.00'))

        for i, amount in enumerate([Decimal('10000.00'), Decimal('15000.00')], start=1):
            payment = Payment.objects.create(
                organization=org,
                tenancy=tenancy,
                tenant=tenant,
                amount=amount,
                payment_method='cash',
                provider='manual',
                internal_reference=f'TEST-MULTI-{i}',
                status='success',
                paid_at=timezone.now(),
            )
            PaymentAllocation.objects.create(payment=payment, invoice=charge, amount=amount)

        charge.amount_paid = Decimal('25000.00')
        charge.recalculate_status()
        charge.save()

        self.assertEqual(charge.outstanding, Decimal('0.00'))
        self.assertEqual(charge.status, 'paid')

    def test_failed_payment_does_not_reduce_outstanding(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        charge = self.create_rent_charge(tenancy, amount=Decimal('25000.00'))

        Payment.objects.create(
            organization=org,
            tenant=tenant,
            amount=Decimal('25000.00'),
            payment_method='paystack',
            provider='paystack',
            internal_reference='TEST-FAILED-001',
            status='failed',
        )

        self.assertEqual(charge.outstanding, Decimal('25000.00'))

    def test_reversed_payment_restores_outstanding(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        charge = self.create_rent_charge(tenancy, amount=Decimal('25000.00'))

        payment = Payment.objects.create(
            organization=org,
            tenancy=tenancy,
            tenant=tenant,
            amount=Decimal('25000.00'),
            payment_method='cash',
            provider='manual',
            internal_reference='TEST-REVERSE-001',
            status='success',
            paid_at=timezone.now(),
        )
        PaymentAllocation.objects.create(
            payment=payment, invoice=charge, amount=Decimal('25000.00')
        )
        charge.amount_paid = Decimal('25000.00')
        charge.recalculate_status()
        charge.save()

        PaymentService.reverse_payment(payment, reversed_by=user_l)
        charge.refresh_from_db()

        self.assertEqual(payment.status, 'reversed')
        self.assertEqual(charge.amount_paid, Decimal('0.00'))
        self.assertEqual(charge.outstanding, Decimal('25000.00'))


class TenancyLifecycleTests(RumiaTestFixtures):
    def test_unit_vacant_to_occupied_to_vacant(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)

        self.assertEqual(unit.status, 'vacant')

        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        unit.status = 'occupied'
        unit.save(update_fields=['status'])
        self.assertEqual(unit.status, 'occupied')

        tenancy.status = 'terminated'
        tenancy.save(update_fields=['status'])
        unit.status = 'vacant'
        unit.save(update_fields=['status'])
        self.assertEqual(unit.status, 'vacant')


class IncomeFlowServiceTests(RumiaTestFixtures):
    def test_income_summary_from_ledger(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        charge = self.create_rent_charge(tenancy, amount=Decimal('500000.00'))

        # amount_paid is derived from real ledger allocations, never hand-set —
        # RentCharge.recalculate_status() always re-sums payment_allocations.
        payment = Payment.objects.create(
            organization=org,
            tenancy=tenancy,
            tenant=tenant,
            parent_property=prop,
            unit=unit,
            amount=Decimal('450000.00'),
            payment_method='cash',
            provider='manual',
            internal_reference='RUMIA-TEST-INCOME-1',
            status='success',
            paid_at=timezone.now(),
        )
        PaymentAllocation.objects.create(
            payment=payment, invoice=charge, amount=Decimal('450000.00'),
        )
        charge.recalculate_status()
        charge.save()

        today = timezone.now().date()
        report = IncomeFlowService.for_organization(
            org.id,
            today.replace(day=1),
            today,
        )

        self.assertEqual(report.summary.expected_rent, Decimal('500000.00'))
        self.assertEqual(report.summary.collected_rent, Decimal('450000.00'))
        self.assertEqual(report.summary.outstanding_rent, Decimal('50000.00'))
        self.assertEqual(report.summary.collection_rate, Decimal('90.00'))


class LegacyRoleCompatibilityTests(RumiaTestFixtures):
    def test_student_role_maps_to_tenant(self):
        user_l, _, org = self.create_landlord_with_org()
        user, profile = self.create_tenant(org, 'legacy@test.com', role='student')
        self.assertEqual(user.get_canonical_role(), 'tenant')


class PaymentProviderTests(TestCase):
    def test_paystack_reports_configuration_status(self):
        provider = PaystackProvider()
        status = provider.get_config_status()
        self.assertIn(status.status.value, ('not_configured', 'available'))


# ---------------------------------------------------------------------------
# Phase 9 — CRUD, one-active-tenancy, rent generation, Paystack, security,
# notifications. Appended alongside the Phase 2 tests above, same fixtures.
# ---------------------------------------------------------------------------

class PropertyApiTests(RumiaTestFixtures):
    def test_landlord_can_create_property(self):
        user_l, _, org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post('/api/v1/properties/', {
            'organization_id': str(org.id),
            'name': 'New Property',
            'address': '1 New Road',
            'city': 'Nairobi',
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Property.objects.filter(name='New Property', organization=org).count(), 1)

    def test_landlord_can_update_property(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, _ = self.create_property_with_unit(org)
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.patch(f'/api/v1/properties/{prop.id}/', {'name': 'Renamed'}, format='json')
        self.assertEqual(response.status_code, 200)
        prop.refresh_from_db()
        self.assertEqual(prop.name, 'Renamed')

    def test_delete_archives_not_hard_deletes(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, _ = self.create_property_with_unit(org)
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.delete(f'/api/v1/properties/{prop.id}/')
        self.assertEqual(response.status_code, 200)
        prop.refresh_from_db()
        self.assertEqual(prop.status, 'inactive')
        self.assertTrue(Property.objects.filter(pk=prop.id).exists())


class RentalUnitApiTests(RumiaTestFixtures):
    def test_landlord_can_create_unit(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, _ = self.create_property_with_unit(org)
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post('/api/v1/units/', {
            'property': str(prop.id),
            'unit_number': 'B201',
            'unit_type': '2_bedroom',
            'monthly_rent': '30000.00',
        })
        self.assertEqual(response.status_code, 201)

    def test_landlord_can_update_unit(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.patch(f'/api/v1/units/{unit.id}/', {'monthly_rent': '27000.00'}, format='json')
        self.assertEqual(response.status_code, 200)
        unit.refresh_from_db()
        self.assertEqual(unit.monthly_rent, Decimal('27000.00'))

    def test_cannot_mark_vacant_while_actively_tenanted(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        self.create_tenancy(org, prop, unit, tenant, status='active')
        unit.status = 'occupied'
        unit.save(update_fields=['status'])

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.patch(f'/api/v1/units/{unit.id}/', {'status': 'vacant'}, format='json')
        self.assertEqual(response.status_code, 400)


class TenancyApiTests(RumiaTestFixtures):
    def test_landlord_can_create_tenancy(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post('/api/v1/tenancies/', {
            'unit': str(unit.id),
            'tenant': str(tenant.id),
            'start_date': date.today().isoformat(),
            'monthly_rent': '22000.00',
            'status': 'active',
        })
        self.assertEqual(response.status_code, 201)
        unit.refresh_from_db()
        self.assertEqual(unit.status, 'occupied')

    def test_second_active_tenancy_on_same_unit_rejected(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant_a = self.create_tenant(org, 'a@test.com')
        _, tenant_b = self.create_tenant(org, 'b@test.com')
        self.create_tenancy(org, prop, unit, tenant_a, status='active')

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post('/api/v1/tenancies/', {
            'unit': str(unit.id),
            'tenant': str(tenant_b.id),
            'start_date': date.today().isoformat(),
            'monthly_rent': '22000.00',
            'status': 'active',
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Tenancy.objects.filter(unit=unit, status='active').count(), 1)

    def test_second_active_tenancy_blocked_at_database_level_too(self):
        """The application check in the view is belt-and-suspenders — the DB constraint is authoritative."""
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant_a = self.create_tenant(org, 'a2@test.com')
        _, tenant_b = self.create_tenant(org, 'b2@test.com')
        self.create_tenancy(org, prop, unit, tenant_a, status='active')

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Tenancy.objects.create(
                organization=org, parent_property=prop, unit=unit, tenant=tenant_b,
                start_date=date.today(), monthly_rent=Decimal('22000.00'), status='active',
            )

    def test_terminate_tenancy_frees_unit(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        unit.status = 'occupied'
        unit.save(update_fields=['status'])

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post(f'/api/v1/tenancies/{tenancy.id}/terminate/', {}, format='json')
        self.assertEqual(response.status_code, 200)

        tenancy.refresh_from_db()
        unit.refresh_from_db()
        self.assertEqual(tenancy.status, 'terminated')
        self.assertEqual(unit.status, 'vacant')

    def test_tenant_cannot_terminate_own_tenancy(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')

        client = APIClient()
        client.force_authenticate(user=tenant.user)
        response = client.post(f'/api/v1/tenancies/{tenancy.id}/terminate/', {}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_patch_tenancy_persists_renewal_notes(self):
        """
        Regression guard (06-01 / code review WR-05): renewal_notes was
        previously listed in TenancyDetailView.PATCHABLE_FIELDS but missing
        from TenancySerializer.Meta.fields, so PATCHing it silently no-opped.
        """
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.patch(
            f'/api/v1/tenancies/{tenancy.id}/',
            {'renewal_notes': 'Renewing for 12 more months'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['renewal_notes'], 'Renewing for 12 more months')
        tenancy.refresh_from_db()
        self.assertEqual(tenancy.renewal_notes, 'Renewing for 12 more months')


class RentGenerationTests(RumiaTestFixtures):
    def test_generates_one_charge_for_current_period(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        self.create_tenancy(org, prop, unit, tenant, status='active')

        result = RentChargeGenerationService.generate_for_organization(org.id)
        self.assertGreaterEqual(result.created, 1)
        self.assertEqual(
            RentCharge.objects.filter(organization=org).count(), result.created,
        )

    def test_generation_is_idempotent(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        self.create_tenancy(org, prop, unit, tenant, status='active')

        first = RentChargeGenerationService.generate_for_organization(org.id)
        second = RentChargeGenerationService.generate_for_organization(org.id)

        self.assertGreaterEqual(first.created, 1)
        self.assertEqual(second.created, 0)

    def test_overdue_status_applied_by_date_alone(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        charge = RentCharge.objects.create(
            organization=org, tenancy=tenancy, parent_property=prop, unit=unit, tenant=tenant,
            period_start=date.today() - timedelta(days=40),
            period_end=date.today() - timedelta(days=10),
            due_date=date.today() - timedelta(days=10),
            amount_due=Decimal('22000.00'), status='due',
        )
        RentChargeGenerationService.refresh_statuses()
        charge.refresh_from_db()
        self.assertEqual(charge.status, 'overdue')

    def test_rent_balance_endpoint_reports_totals(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        self.create_rent_charge(tenancy, amount=Decimal('22000.00'))

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.get('/api/v1/rent/balance/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['outstanding_total']), Decimal('22000.00'))


class PaystackFlowTests(RumiaTestFixtures):
    def _tenancy_with_tenant(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        tenant_user, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        return org, tenant_user, tenant, tenancy

    @override_settings(PAYSTACK_SECRET_KEY='')
    def test_initiate_without_credentials_fails_cleanly(self):
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.post('/api/v1/rent/payments/', {
            'tenancy': str(tenancy.id), 'amount': '22000.00',
        })
        self.assertEqual(response.status_code, 502)
        self.assertFalse(Payment.objects.filter(status='processing').exists())

    @override_settings(PAYSTACK_SECRET_KEY='test_secret_key')
    @patch.object(PaystackProvider, 'initiate_payment')
    @patch.object(PaystackProvider, 'get_config_status')
    def test_tenant_can_initiate_payment(self, mock_config, mock_initiate):
        mock_config.return_value = ProviderConfigStatus(provider='paystack', status=ProviderStatus.AVAILABLE)
        mock_initiate.return_value = InitiatePaymentResult(
            success=True, provider_reference='PSK-REF-1',
            authorization_url='https://checkout.paystack.com/abc123',
        )
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        # PAY-03 (Phase 2): a rent payment only splits/initiates for an
        # organization with a verified, active PayoutAccount — otherwise
        # PaymentService.initiate refuses it outright (D-01).
        PayoutAccount.objects.create(
            organization=org, status='active', paystack_subaccount_code='SUB_TEST_CODE',
        )

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.post('/api/v1/rent/payments/', {
            'tenancy': str(tenancy.id), 'amount': '22000.00',
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['authorization_url'], 'https://checkout.paystack.com/abc123')

        payment = Payment.objects.get(internal_reference=response.data['internal_reference'])
        self.assertEqual(payment.status, 'processing')

    @override_settings(PAYSTACK_SECRET_KEY='test_secret_key', FRONTEND_URL='https://app.test')
    @patch.object(PaystackProvider, 'initiate_payment')
    @patch.object(PaystackProvider, 'get_config_status')
    def test_payment_callback_url_points_at_a_real_page(self, mock_config, mock_initiate):
        """Paystack's hosted checkout redirects the tenant's browser to this
        URL after they pay — it must be a route the frontend actually
        serves, not a stale path nobody has cleaned up (there is no page
        at /payments/{id}/callback; the real one is under the tenant's own
        rental area)."""
        mock_config.return_value = ProviderConfigStatus(provider='paystack', status=ProviderStatus.AVAILABLE)
        mock_initiate.return_value = InitiatePaymentResult(
            success=True, provider_reference='PSK-REF-1',
            authorization_url='https://checkout.paystack.com/abc123',
        )
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        PayoutAccount.objects.create(
            organization=org, status='active', paystack_subaccount_code='SUB_TEST_CODE',
        )

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.post('/api/v1/rent/payments/', {
            'tenancy': str(tenancy.id), 'amount': '22000.00',
        })
        self.assertEqual(response.status_code, 201)

        callback_url = mock_initiate.call_args[0][0].callback_url
        self.assertTrue(
            callback_url.startswith('https://app.test/tenant/rental/payments/callback'),
            f'callback_url {callback_url!r} does not point at the frontend\'s payment-callback page',
        )

    def test_tenant_cannot_initiate_payment_for_other_tenants_tenancy(self):
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        other_user, _ = self.create_tenant(org, 'other@test.com')

        client = APIClient()
        client.force_authenticate(user=other_user)
        response = client.post('/api/v1/rent/payments/', {
            'tenancy': str(tenancy.id), 'amount': '22000.00',
        })
        self.assertEqual(response.status_code, 403)

    def _webhook_body_and_signature(self, secret, reference, amount_kobo, event='charge.success'):
        body = json.dumps({
            'event': event,
            'data': {'reference': reference, 'status': 'success', 'amount': amount_kobo, 'id': 'psk_evt_1'},
        }).encode()
        sig = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
        return body, sig

    @override_settings(PAYSTACK_WEBHOOK_SECRET='test_secret_key')
    def test_webhook_rejects_invalid_signature(self):
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-WEBHOOK-BAD-SIG', status='processing',
        )
        body, _ = self._webhook_body_and_signature('test_secret_key', payment.internal_reference, 2200000)
        client = APIClient()
        response = client.generic(
            'POST', '/api/v1/rent/payments/webhook/paystack/', data=body,
            content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE='not-the-right-signature',
        )
        self.assertEqual(response.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'processing')

    @override_settings(PAYSTACK_WEBHOOK_SECRET='test_secret_key')
    @patch.object(PaystackProvider, 'verify_payment')
    def test_webhook_valid_signature_allocates_payment(self, mock_verify):
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        charge = self.create_rent_charge(tenancy, amount=Decimal('22000.00'))
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-WEBHOOK-OK', status='processing',
        )
        mock_verify.return_value = VerifyPaymentResult(
            success=True, status='success', amount=Decimal('22000.00'),
            provider_reference=payment.internal_reference,
        )
        body, sig = self._webhook_body_and_signature('test_secret_key', payment.internal_reference, 2200000)

        client = APIClient()
        response = client.generic(
            'POST', '/api/v1/rent/payments/webhook/paystack/', data=body,
            content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        self.assertEqual(response.status_code, 200)

        payment.refresh_from_db()
        charge.refresh_from_db()
        self.assertEqual(payment.status, 'success')
        self.assertEqual(charge.status, 'paid')
        self.assertEqual(PaymentAllocation.objects.filter(payment=payment).count(), 1)

    @override_settings(PAYSTACK_WEBHOOK_SECRET='test_secret_key')
    @patch.object(PaystackProvider, 'verify_payment')
    def test_duplicate_webhook_does_not_double_allocate(self, mock_verify):
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        charge = self.create_rent_charge(tenancy, amount=Decimal('22000.00'))
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-WEBHOOK-DUP', status='processing',
        )
        mock_verify.return_value = VerifyPaymentResult(
            success=True, status='success', amount=Decimal('22000.00'),
            provider_reference=payment.internal_reference,
        )
        body, sig = self._webhook_body_and_signature('test_secret_key', payment.internal_reference, 2200000)
        client = APIClient()

        first = client.generic('POST', '/api/v1/rent/payments/webhook/paystack/', data=body,
                                content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=sig)
        second = client.generic('POST', '/api/v1/rent/payments/webhook/paystack/', data=body,
                                 content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=sig)

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(mock_verify.call_count, 1)  # second call short-circuited by the idempotency guard
        self.assertEqual(PaymentAllocation.objects.filter(payment=payment).count(), 1)
        charge.refresh_from_db()
        self.assertEqual(charge.amount_paid, Decimal('22000.00'))

    @override_settings(PAYSTACK_WEBHOOK_SECRET='test_secret_key')
    def test_webhook_rejects_missing_signature_header(self):
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-WEBHOOK-NO-SIG', status='processing',
        )
        body, _ = self._webhook_body_and_signature('test_secret_key', payment.internal_reference, 2200000)
        client = APIClient()
        response = client.generic(
            'POST', '/api/v1/rent/payments/webhook/paystack/', data=body,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'processing')
        self.assertEqual(AuditLog.objects.count(), 0)

    @override_settings(PAYSTACK_WEBHOOK_SECRET='', PAYSTACK_SECRET_KEY='test_secret_key')
    @patch.object(PaystackProvider, 'verify_payment')
    def test_webhook_falls_back_to_secret_key_when_webhook_secret_unset(self, mock_verify):
        """Paystack has no separate webhook-signing secret — it signs with
        your Secret key. A deployment that only configured PAYSTACK_SECRET_KEY
        (the one credential Paystack actually issues) must still verify."""
        org, tenant_user, tenant, tenancy = self._tenancy_with_tenant()
        charge = self.create_rent_charge(tenancy, amount=Decimal('22000.00'))
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=tenancy.parent_property,
            unit=tenancy.unit, amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-WEBHOOK-FALLBACK', status='processing',
        )
        mock_verify.return_value = VerifyPaymentResult(
            success=True, status='success', amount=Decimal('22000.00'),
            provider_reference=payment.internal_reference,
        )
        body, sig = self._webhook_body_and_signature('test_secret_key', payment.internal_reference, 2200000)

        client = APIClient()
        response = client.generic(
            'POST', '/api/v1/rent/payments/webhook/paystack/', data=body,
            content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        charge.refresh_from_db()
        self.assertEqual(payment.status, 'success')
        self.assertEqual(charge.status, 'paid')


class SecurityAccessTests(RumiaTestFixtures):
    def test_tenant_cannot_create_property(self):
        user_l, _, org = self.create_landlord_with_org()
        tenant_user, _ = self.create_tenant(org)
        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.post('/api/v1/properties/', {
            'organization_id': str(org.id), 'name': 'X', 'address': 'Y', 'city': 'Nairobi',
        })
        self.assertEqual(response.status_code, 403)

    def test_tech_support_denied_financial_access(self):
        tech_user = User.objects.create_user(
            email='tech@test.com', password='TestPass123!', first_name='Tech', last_name='Support',
            role='tech_support', phone_number='+254755555555',
        )
        client = APIClient()
        client.force_authenticate(user=tech_user)
        response = client.get('/api/v1/rent/payments/')
        self.assertEqual(response.status_code, 403)

    def test_caretaker_without_permission_cannot_view_payments(self):
        user_l, _, org = self.create_landlord_with_org()
        caretaker_user = User.objects.create_user(
            email='caretaker2@test.com', password='TestPass123!', first_name='Care', last_name='Two',
            role='caretaker', phone_number='+254766666666',
        )
        CaretakerProfile.objects.create(
            user=caretaker_user, landlord=LandlordProfile.objects.get(user=user_l),
            emergency_contact_name='E', emergency_contact_phone='+254777777777',
            created_by=user_l, permissions={},
        )
        client = APIClient()
        client.force_authenticate(user=caretaker_user)
        response = client.get('/api/v1/rent/payments/')
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_request_rejected(self):
        client = APIClient()
        response = client.get('/api/v1/properties/')
        self.assertEqual(response.status_code, 401)


class NotificationTests(RumiaTestFixtures):
    def test_payment_confirmation_sends_email_and_sms(self):
        from rent.services.notifications import send_payment_confirmation

        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=prop, unit=unit,
            amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-NOTIFY-1', status='success', paid_at=timezone.now(),
        )

        with patch('rent.services.notifications._send_email') as mock_email, \
             patch('rent.services.notifications._send_sms') as mock_sms:
            mock_email.return_value = True
            mock_sms.return_value = True
            send_payment_confirmation(payment)

        mock_email.assert_called_once()
        mock_sms.assert_called_once()
        self.assertIn(tenant.email, mock_email.call_args[0])
        self.assertIn(tenant.phone, mock_sms.call_args[0])

    def test_rent_due_reminder_sends_email_and_sms(self):
        from rent.services.notifications import send_rent_due_reminder

        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        charge = self.create_rent_charge(tenancy, amount=Decimal('22000.00'))

        with patch('rent.services.notifications._send_email') as mock_email, \
             patch('rent.services.notifications._send_sms') as mock_sms:
            mock_email.return_value = True
            mock_sms.return_value = True
            send_rent_due_reminder(charge)

        mock_email.assert_called_once()
        mock_sms.assert_called_once()

    def test_email_failure_does_not_raise(self):
        from rent.services.notifications import send_payment_confirmation

        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        payment = Payment.objects.create(
            organization=org, tenancy=tenancy, tenant=tenant, parent_property=prop, unit=unit,
            amount=Decimal('22000.00'), payment_method='paystack', provider='paystack',
            internal_reference='RUMIA-NOTIFY-FAIL', status='success', paid_at=timezone.now(),
        )

        with patch('django.core.mail.EmailMessage.send', side_effect=Exception('SMTP down')), \
             patch('rent.services.notifications._send_sms', return_value=True):
            try:
                send_payment_confirmation(payment)
            except Exception:
                self.fail('send_payment_confirmation must not propagate email provider failures')

    def test_sms_dispatch_uses_fixed_africastalking_sender(self):
        """Guards against ever regressing to the broken `kenyastalking` import."""
        from notifications.tasks import send_sms_via_africastalking

        with patch('notifications.tasks.cache') as mock_cache:
            mock_cache.get.return_value = 0
            with override_settings(AFRICASTALKING_API_KEY=''):
                result = send_sms_via_africastalking('+254700000000', 'test message')
        self.assertEqual(result, {'mock': True})


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class TenantOnboardingTests(RumiaTestFixtures):
    """
    Tenants are never self-registered — a caretaker or landlord adds them.

    CELERY_TASK_ALWAYS_EAGER is forced here because `manage.py test` runs
    against rumi.settings (not rumi.test_settings, which only applies under
    pytest) — without it, the invite email task queues to the real broker
    instead of running inline, and mail.outbox stays empty.
    """

    def test_create_tenant_captures_emergency_contacts(self):
        user_l, _, org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=user_l)

        response = client.post('/api/v1/tenants/', {
            'full_name': 'Jane Wanjiru',
            'phone': '+254711222333',
            'email': 'jane@test.com',
            'emergency_contacts': [
                {
                    'full_name': 'John Wanjiru',
                    'relationship': 'Brother',
                    'phone': '+254722333444',
                    'is_primary': True,
                    'purpose': 'rent_escalation_authorized',
                    'consent_given': True,
                },
            ],
        }, format='json')

        self.assertEqual(response.status_code, 201)
        profile = TenantProfile.objects.get(full_name='Jane Wanjiru')
        contacts = list(profile.emergency_contacts.all())
        self.assertEqual(len(contacts), 1)
        self.assertEqual(contacts[0].purpose, 'rent_escalation_authorized')
        self.assertIsNotNone(contacts[0].consent_recorded_at)

    def test_tenant_detail_includes_emergency_contacts(self):
        user_l, _, org = self.create_landlord_with_org()
        _, tenant = self.create_tenant(org)
        EmergencyContact.objects.create(
            tenant=tenant, full_name='Next Kin', relationship='Parent',
            phone='+254700999888', purpose='both',
        )
        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.get(f'/api/v1/tenants/{tenant.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['emergency_contacts']), 1)
        self.assertEqual(response.data['emergency_contacts'][0]['full_name'], 'Next Kin')

    def test_new_tenant_gets_invited_when_tenancy_created(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        profile = TenantProfile.objects.create(
            organization=org, full_name='New Tenant', phone='+254700111000',
            email='newtenant@test.com', status='prospect',
        )
        self.assertIsNone(profile.user)

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post('/api/v1/tenancies/', {
            'unit': str(unit.id), 'tenant': str(profile.id),
            'start_date': date.today().isoformat(), 'monthly_rent': '18000.00', 'status': 'active',
        })
        self.assertEqual(response.status_code, 201)

        profile.refresh_from_db()
        self.assertIsNotNone(profile.user)
        self.assertEqual(profile.user.role, 'tenant')
        self.assertFalse(profile.user.has_usable_password())
        self.assertTrue(PasswordResetToken.objects.filter(user=profile.user).exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('reset-password', mail.outbox[0].body)

    def test_tenancy_creation_links_existing_user_without_reinvite(self):
        user_l, _, org = self.create_landlord_with_org()
        prop, unit = self.create_property_with_unit(org)
        existing_user, profile = self.create_tenant(org, 'already_has_account@test.com')
        self.assertIsNotNone(profile.user)

        client = APIClient()
        client.force_authenticate(user=user_l)
        response = client.post('/api/v1/tenancies/', {
            'unit': str(unit.id), 'tenant': str(profile.id),
            'start_date': date.today().isoformat(), 'monthly_rent': '18000.00', 'status': 'active',
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 0)  # already had an account, no invite needed


class NextOfKinEscalationTests(RumiaTestFixtures):
    def test_escalation_notifies_authorized_contact_when_opted_in(self):
        from rent.tasks import escalate_overdue_to_next_of_kin

        user_l, _, org = self.create_landlord_with_org()
        policy = EscalationPolicy.objects.get(organization=org)
        policy.allow_next_of_kin_rent_contact = True
        policy.next_of_kin_contact_after_days = 7
        policy.save()

        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        charge = RentCharge.objects.create(
            organization=org, tenancy=tenancy, parent_property=prop, unit=unit, tenant=tenant,
            period_start=date.today() - timedelta(days=40),
            period_end=date.today() - timedelta(days=10),
            due_date=date.today() - timedelta(days=10),
            amount_due=Decimal('22000.00'), status='overdue',
        )
        EmergencyContact.objects.create(
            tenant=tenant, full_name='Next Kin', relationship='Sibling',
            phone='+254700555444', email='nextkin@test.com',
            purpose='rent_escalation_authorized', is_primary=True,
        )

        result = escalate_overdue_to_next_of_kin()
        self.assertEqual(result['notified'], 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('nextkin@test.com', mail.outbox[0].to)

        charge.refresh_from_db()
        self.assertIsNotNone(charge.next_of_kin_notified_at)

        # Running again must not re-notify the same charge.
        mail.outbox.clear()
        escalate_overdue_to_next_of_kin()
        self.assertEqual(len(mail.outbox), 0)

    def test_no_escalation_without_opt_in(self):
        from rent.tasks import escalate_overdue_to_next_of_kin

        user_l, _, org = self.create_landlord_with_org()
        # EscalationPolicy defaults to allow_next_of_kin_rent_contact=False.
        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        RentCharge.objects.create(
            organization=org, tenancy=tenancy, parent_property=prop, unit=unit, tenant=tenant,
            period_start=date.today() - timedelta(days=40),
            period_end=date.today() - timedelta(days=10),
            due_date=date.today() - timedelta(days=10),
            amount_due=Decimal('22000.00'), status='overdue',
        )
        EmergencyContact.objects.create(
            tenant=tenant, full_name='Next Kin', relationship='Sibling',
            phone='+254700555444', email='nextkin@test.com',
            purpose='rent_escalation_authorized', is_primary=True,
        )

        result = escalate_overdue_to_next_of_kin()
        self.assertEqual(result['notified'], 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_no_escalation_without_authorized_contact(self):
        from rent.tasks import escalate_overdue_to_next_of_kin

        user_l, _, org = self.create_landlord_with_org()
        policy = EscalationPolicy.objects.get(organization=org)
        policy.allow_next_of_kin_rent_contact = True
        policy.next_of_kin_contact_after_days = 7
        policy.save()

        prop, unit = self.create_property_with_unit(org)
        _, tenant = self.create_tenant(org)
        tenancy = self.create_tenancy(org, prop, unit, tenant, status='active')
        RentCharge.objects.create(
            organization=org, tenancy=tenancy, parent_property=prop, unit=unit, tenant=tenant,
            period_start=date.today() - timedelta(days=40),
            period_end=date.today() - timedelta(days=10),
            due_date=date.today() - timedelta(days=10),
            amount_due=Decimal('22000.00'), status='overdue',
        )
        # Emergency contact exists but is emergency_only — not authorized for rent.
        EmergencyContact.objects.create(
            tenant=tenant, full_name='Next Kin', relationship='Sibling',
            phone='+254700555444', email='nextkin@test.com', purpose='emergency_only',
        )

        result = escalate_overdue_to_next_of_kin()
        self.assertEqual(result['notified'], 0)
        self.assertEqual(len(mail.outbox), 0)


class CaretakerEndpointTests(RumiaTestFixtures):
    def test_landlord_can_create_caretaker(self):
        landlord, _, org = self.create_landlord_with_org()
        prop, _ = self.create_property_with_unit(org)
        client = APIClient()
        client.force_authenticate(user=landlord)

        resp = client.post('/api/v1/caretakers/', {
            'full_name': 'Jane Caretaker',
            'email': 'jane.caretaker@test.com',
            'phone': '+254722333444',
            'emergency_contact_name': 'Peter Kin',
            'emergency_contact_phone': '+254733444555',
            'property_ids': [str(prop.id)],
        }, format='json')

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(len(resp.data['assigned_properties']), 1)
        self.assertEqual(resp.data['assigned_properties'][0]['name'], prop.name)

        caretaker_user = User.objects.get(email='jane.caretaker@test.com')
        self.assertEqual(caretaker_user.role, 'caretaker')
        self.assertFalse(caretaker_user.has_usable_password())
        self.assertTrue(
            OrganizationMembership.objects.filter(organization=org, user=caretaker_user, role='caretaker').exists()
        )
        self.assertTrue(PasswordResetToken.objects.filter(user=caretaker_user).exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('caretaker', mail.outbox[0].body.lower())

    def test_invited_caretaker_can_set_a_password_and_sign_in(self):
        """
        Regression: the whole invite journey. A caretaker added by a landlord
        must be able to use the emailed token to set a password and then sign
        in, with nothing left to onboard (they were once bounced between
        /onboarding and their dashboard forever) and no email-code step (the
        invite link already proved they own the address).
        """
        landlord, _, org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=landlord)
        resp = client.post('/api/v1/caretakers/', {
            'full_name': 'Jane Caretaker',
            'email': 'jane.invited@test.com',
            'phone': '+254722333444',
            'emergency_contact_name': 'Peter Kin',
            'emergency_contact_phone': '+254733444555',
        }, format='json')
        self.assertEqual(resp.status_code, 201)

        caretaker = User.objects.get(email='jane.invited@test.com')
        self.assertEqual(caretaker.onboarding_stage, 'COMPLETED')
        self.assertFalse(caretaker.is_verified)

        token = PasswordResetToken.objects.get(user=caretaker)
        anon = APIClient()
        confirm = anon.post('/api/v1/accounts/password/reset/confirm/', {
            'token': str(token.token),
            'new_password': 'Caretaker#2026x',
            'confirm_password': 'Caretaker#2026x',
        }, format='json')
        self.assertEqual(confirm.status_code, 200)

        login = anon.post('/api/v1/accounts/login/', {
            'email': 'jane.invited@test.com', 'password': 'Caretaker#2026x',
        }, format='json')
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data['user']['onboarding_stage'], 'COMPLETED')

    def test_caretaker_creation_requires_valid_phone_format(self):
        landlord, _, org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=landlord)

        resp = client.post('/api/v1/caretakers/', {
            'full_name': 'Bad Phone',
            'email': 'bad@test.com',
            'phone': '0722333444',  # missing +254
            'emergency_contact_name': 'Someone',
            'emergency_contact_phone': '+254733444555',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_tenant_cannot_create_caretaker(self):
        landlord, _, org = self.create_landlord_with_org()
        _, tenant_profile = self.create_tenant(org)
        client = APIClient()
        client.force_authenticate(user=tenant_profile.user)

        resp = client.post('/api/v1/caretakers/', {
            'full_name': 'Jane', 'email': 'jane2@test.com', 'phone': '+254722333444',
            'emergency_contact_name': 'X', 'emergency_contact_phone': '+254733444555',
        }, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_landlord_sees_only_their_caretakers(self):
        landlord, _, org = self.create_landlord_with_org()
        other_landlord, _, other_org = self.create_landlord_with_org(email='other@test.com')
        prop, _ = self.create_property_with_unit(org)

        client = APIClient()
        client.force_authenticate(user=landlord)
        client.post('/api/v1/caretakers/', {
            'full_name': 'Mine', 'email': 'mine@test.com', 'phone': '+254722111111',
            'emergency_contact_name': 'X', 'emergency_contact_phone': '+254733444555',
            'property_ids': [str(prop.id)],
        }, format='json')

        client.force_authenticate(user=other_landlord)
        other_prop, _ = self.create_property_with_unit(other_org, name='Other Place')
        client.post('/api/v1/caretakers/', {
            'full_name': 'Theirs', 'email': 'theirs@test.com', 'phone': '+254722222222',
            'emergency_contact_name': 'X', 'emergency_contact_phone': '+254733444555',
            'property_ids': [str(other_prop.id)],
        }, format='json')

        client.force_authenticate(user=landlord)
        resp = client.get('/api/v1/caretakers/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['full_name'], 'Mine')

    def test_duplicate_email_rejected(self):
        landlord, _, org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=landlord)
        resp = client.post('/api/v1/caretakers/', {
            'full_name': 'Dup', 'email': landlord.email, 'phone': '+254722333444',
            'emergency_contact_name': 'X', 'emergency_contact_phone': '+254733444555',
        }, format='json')
        self.assertEqual(resp.status_code, 400)


class PaymentsPhase0RegressionTests(RumiaTestFixtures):
    """Audit C4/C5 — see docs/roadmap/phase-0-critical-fixes.md."""

    def _org_with_tenancy(self, tag):
        landlord, _, org = self.create_landlord_with_org(email=f'{tag}-landlord@test.com')
        prop, unit = self.create_property_with_unit(org, name=f'{tag} Apartments')
        tenant_user, tenant = self.create_tenant(org, email=f'{tag}-tenant@test.com')
        tenancy = self.create_tenancy(org, prop, unit, tenant)
        return landlord, tenant_user, org, tenancy

    def test_manual_payment_cannot_target_another_organizations_charge(self):
        landlord_a, _, _, tenancy_a = self._org_with_tenancy('a')
        _, _, _, tenancy_b = self._org_with_tenancy('b')
        victim_charge = self.create_rent_charge(tenancy_b)

        client = APIClient()
        client.force_authenticate(user=landlord_a)
        response = client.post('/api/v1/rent/payments/manual/', {
            'tenancy': str(tenancy_a.id), 'amount': '22000.00', 'payment_method': 'cash',
            'rent_charge_id': str(victim_charge.id),
        }, format='json')

        self.assertEqual(response.status_code, 400)
        victim_charge.refresh_from_db()
        self.assertEqual(victim_charge.amount_paid, Decimal('0.00'))
        self.assertFalse(Payment.objects.filter(tenancy=tenancy_a).exists())

    def test_manual_payment_above_charge_outstanding_is_400_not_500(self):
        landlord, _, _, tenancy = self._org_with_tenancy('over')
        charge = self.create_rent_charge(tenancy)

        client = APIClient()
        client.force_authenticate(user=landlord)
        response = client.post('/api/v1/rent/payments/manual/', {
            'tenancy': str(tenancy.id), 'amount': '25000.00', 'payment_method': 'cash',
            'rent_charge_id': str(charge.id),
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('amount', response.data['errors'])

    def test_service_refuses_allocation_to_another_tenancys_charge(self):
        _, _, org_a, tenancy_a = self._org_with_tenancy('svc-a')
        _, _, _, tenancy_b = self._org_with_tenancy('svc-b')
        other_charge = self.create_rent_charge(tenancy_b)
        payment = Payment.objects.create(
            organization=org_a, tenancy=tenancy_a, tenant=tenancy_a.tenant, amount=Decimal('100.00'),
            payment_method='cash', provider='manual', internal_reference='RUMIA-SVC-GUARD',
        )

        with self.assertRaises(ValueError):
            PaymentService.record_manual_payment(
                payment, allocations=[{'rent_charge_id': other_charge.id, 'amount': '100.00'}],
            )
        other_charge.refresh_from_db()
        self.assertEqual(other_charge.amount_paid, Decimal('0.00'))

    @override_settings(PAYSTACK_SECRET_KEY='test_secret_key', FRONTEND_URL='https://app.example.test')
    @patch.object(PaystackProvider, 'initiate_payment')
    @patch.object(PaystackProvider, 'get_config_status')
    def test_paystack_callback_url_points_at_the_real_frontend_route(self, mock_config, mock_initiate):
        mock_config.return_value = ProviderConfigStatus(provider='paystack', status=ProviderStatus.AVAILABLE)
        mock_initiate.return_value = InitiatePaymentResult(
            success=True, provider_reference='PSK-REF-CB', authorization_url='https://checkout.paystack.com/cb',
        )
        _, tenant_user, org, tenancy = self._org_with_tenancy('cb')
        PayoutAccount.objects.create(organization=org, status='active', paystack_subaccount_code='SUB_CB')

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.post('/api/v1/rent/payments/', {'tenancy': str(tenancy.id), 'amount': '22000.00'})

        self.assertEqual(response.status_code, 201)
        callback_url = mock_initiate.call_args[0][0].callback_url
        self.assertEqual(
            callback_url,
            f'https://app.example.test/tenant/rental/payments/callback?payment_id={response.data["payment_id"]}',
        )

    def test_payment_list_is_newest_first(self):
        _, tenant_user, org, tenancy = self._org_with_tenancy('order')
        now = timezone.now()
        for i, ref in enumerate(['RUMIA-OLD', 'RUMIA-NEW']):
            Payment.objects.create(
                organization=org, tenancy=tenancy, tenant=tenancy.tenant, amount=Decimal('10.00'),
                payment_method='paystack', provider='paystack', internal_reference=ref,
                created_at=now - timedelta(days=1 - i),
            )

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.get('/api/v1/rent/payments/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([p['internal_reference'] for p in response.data], ['RUMIA-NEW', 'RUMIA-OLD'])


class ManualPaymentRecordingTests(RumiaTestFixtures):
    """Cash / bank payments recorded by a landlord or a permitted caretaker."""

    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        _, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.charge = self.create_rent_charge(self.tenancy)

    def _caretaker(self, permissions, assigned=True, email='ct@test.com'):
        user = User.objects.create_user(
            email=email, password='TestPass123!', first_name='Care', last_name='Taker',
            role='caretaker', phone_number='+254733333333',
        )
        profile = CaretakerProfile.objects.create(
            user=user, landlord=LandlordProfile.objects.get(user=self.landlord),
            emergency_contact_name='E', emergency_contact_phone='+254744444444',
            created_by=self.landlord, permissions=permissions,
        )
        OrganizationMembership.objects.get_or_create(
            organization=self.org, user=user, defaults={'role': 'caretaker'},
        )
        if assigned:
            CaretakerPropertyAssignment.objects.create(
                caretaker_profile=profile, property_assignment=self.prop,
                organization=self.org, assigned_by=self.landlord,
            )
        return user

    def _record(self, user, **overrides):
        client = APIClient()
        client.force_authenticate(user=user)
        payload = {'tenancy': str(self.tenancy.id), 'amount': '22000.00', 'payment_method': 'cash'}
        payload.update(overrides)
        return client.post('/api/v1/rent/payments/manual/', payload, format='json')

    def test_landlord_cash_payment_settles_the_oldest_charge(self):
        resp = self._record(self.landlord, notes='Receipt 0042')
        self.assertEqual(resp.status_code, 201)
        self.charge.refresh_from_db()
        self.assertEqual(self.charge.status, 'paid')
        payment = Payment.objects.get()
        self.assertEqual((payment.provider, payment.payment_method, payment.status), ('manual', 'cash', 'success'))
        self.assertEqual(payment.notes, 'Receipt 0042')
        self.assertEqual(payment.recorded_by, self.landlord)

    def test_partial_cash_payment_leaves_the_balance(self):
        self._record(self.landlord, amount='5000.00')
        self.charge.refresh_from_db()
        self.assertEqual(self.charge.status, 'partially_paid')
        self.assertEqual(self.charge.outstanding, Decimal('17000.00'))

    def test_caretaker_with_permission_can_record_on_an_assigned_property(self):
        caretaker = self._caretaker({'can_view_payments': True, 'can_record_payments': True})
        self.assertEqual(self._record(caretaker).status_code, 201)
        self.assertEqual(Payment.objects.get().recorded_by, caretaker)

    def test_caretaker_without_permission_is_refused(self):
        caretaker = self._caretaker({'can_view_payments': True})
        self.assertEqual(self._record(caretaker).status_code, 403)
        self.assertEqual(Payment.objects.count(), 0)

    def test_caretaker_cannot_record_on_a_property_they_are_not_assigned_to(self):
        caretaker = self._caretaker({'can_record_payments': True}, assigned=False)
        self.assertEqual(self._record(caretaker).status_code, 403)
        self.assertEqual(Payment.objects.count(), 0)

    def test_tenant_cannot_record_a_payment_for_themselves(self):
        tenant_user = self.tenant.user
        self.assertEqual(self._record(tenant_user).status_code, 403)

    def test_recording_issues_a_receipt_to_the_tenant(self):
        from unittest import mock
        with mock.patch('rent.tasks.deliver_receipt_task.delay') as queued, \
                self.captureOnCommitCallbacks(execute=True):
            self._record(self.landlord)
        payment = Payment.objects.get()
        self.assertTrue(Receipt.objects.filter(payment=payment).exists())
        queued.assert_called_once()
