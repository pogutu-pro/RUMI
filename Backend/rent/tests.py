from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from accounts.models import User
from rent.models import (
    Building,
    Organization,
    Payment,
    PaymentProvider,
    Property,
    RentalUnit,
    RentCharge,
    Tenant,
    Tenancy,
)


class RumiaDomainModelTests(TestCase):
    def setUp(self):
        self.org_a = Organization.objects.create(name='Acme Rentals', slug='acme-rentals')
        self.org_b = Organization.objects.create(name='Other Rentals', slug='other-rentals')
        self.landlord_user = User.objects.create_user(
            email='owner@example.com',
            password='secret123',
            first_name='Jane',
            last_name='Owner',
            role='LANDLORD',
        )
        self.property = Property.objects.create(
            organization=self.org_a,
            owner=self.landlord_user,
            name='Sunset Apartments',
            address='1 Main Road',
            city='Nairobi',
        )
        self.building = Building.objects.create(property=self.property, name='Block A', address='1 Main Road')
        self.unit = RentalUnit.objects.create(
            property=self.property,
            building=self.building,
            unit_number='A1',
            unit_type='1bedroom',
            rent_amount=Decimal('25000.00'),
            deposit_amount=Decimal('50000.00'),
        )
        self.tenant_user = User.objects.create_user(
            email='tenant@example.com',
            password='secret123',
            first_name='John',
            last_name='Doe',
            role='TENANT',
        )
        self.tenant = Tenant.objects.create(
            user=self.tenant_user,
            organization=self.org_a,
            full_name='John Doe',
            email='tenant@example.com',
            phone='+254700000001',
            next_of_kin_name='Mary Doe',
            next_of_kin_phone='+254700000002',
            next_of_kin_relationship='Mother',
        )

    def test_one_active_tenancy_per_unit_is_enforced(self):
        tenancy = Tenancy.objects.create(
            tenant=self.tenant,
            unit=self.unit,
            organization=self.org_a,
            start_date='2025-01-01',
            status='active',
            rent_amount=Decimal('25000.00'),
        )
        self.assertEqual(tenancy.status, 'active')

        second_tenant = User.objects.create_user(
            email='tenant2@example.com',
            password='secret123',
            first_name='Jane',
            last_name='Smith',
            role='TENANT',
        )
        second_tenant_record = Tenant.objects.create(
            user=second_tenant,
            organization=self.org_a,
            full_name='Jane Smith',
            email='tenant2@example.com',
            phone='+254700000003',
        )
        second_tenancy = Tenancy(
            tenant=second_tenant_record,
            unit=self.unit,
            organization=self.org_a,
            start_date='2025-02-01',
            status='active',
            rent_amount=Decimal('25000.00'),
        )
        with self.assertRaises(ValidationError):
            second_tenancy.full_clean()

    def test_historical_tenancies_are_allowed_for_new_active_tenancy(self):
        Tenancy.objects.create(
            tenant=self.tenant,
            unit=self.unit,
            organization=self.org_a,
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='ended',
            rent_amount=Decimal('25000.00'),
        )
        tenancy = Tenancy(
            tenant=self.tenant,
            unit=self.unit,
            organization=self.org_a,
            start_date='2025-01-01',
            status='active',
            rent_amount=Decimal('25000.00'),
        )
        tenancy.full_clean()
        tenancy.save()
        self.assertEqual(tenancy.status, 'active')

    def test_cross_organization_tenancy_is_rejected(self):
        other_tenant_user = User.objects.create_user(
            email='tenant-org-b@example.com',
            password='secret123',
            first_name='Other',
            last_name='Tenant',
            role='TENANT',
        )
        other_tenant = Tenant.objects.create(
            user=other_tenant_user,
            organization=self.org_b,
            full_name='Other Tenant',
            email='tenant-org-b@example.com',
            phone='+254700000004',
        )
        property_b = Property.objects.create(organization=self.org_b, name='Maple Homes', address='2 Main Road')
        other_unit = RentalUnit.objects.create(property=property_b, unit_number='B1', unit_type='studio', rent_amount=Decimal('20000.00'))
        tenancy = Tenancy(
            tenant=other_tenant,
            unit=other_unit,
            organization=self.org_a,
            start_date='2025-01-01',
            status='active',
            rent_amount=Decimal('20000.00'),
        )
        with self.assertRaises(ValidationError):
            tenancy.full_clean()

    def test_rent_charge_outstanding_amount_tracks_allocations(self):
        tenancy = Tenancy.objects.create(
            tenant=self.tenant,
            unit=self.unit,
            organization=self.org_a,
            start_date='2025-01-01',
            status='active',
            rent_amount=Decimal('25000.00'),
        )
        rent_charge = RentCharge.objects.create(
            tenancy=tenancy,
            organization=self.org_a,
            amount=Decimal('25000.00'),
            due_date='2025-01-15',
            status='unpaid',
        )
        provider = PaymentProvider.objects.create(
            organization=self.org_a,
            name='Test M-Pesa',
            provider_type='mpesa',
        )
        payment = Payment.objects.create(
            organization=self.org_a,
            tenant=self.tenant,
            tenancy=tenancy,
            provider=provider,
            amount=Decimal('10000.00'),
            status='verified',
            idempotency_key='payment-001',
        )
        payment.allocations.create(rent_charge=rent_charge, amount=Decimal('10000.00'))
        self.assertEqual(rent_charge.paid_amount, Decimal('10000.00'))
        self.assertEqual(rent_charge.outstanding_amount, Decimal('15000.00'))

    def test_duplicate_payment_idempotency_key_is_rejected(self):
        provider = PaymentProvider.objects.create(
            organization=self.org_a,
            name='Test Paystack',
            provider_type='paystack',
        )
        tenancy = Tenancy.objects.create(
            tenant=self.tenant,
            unit=self.unit,
            organization=self.org_a,
            start_date='2025-01-01',
            status='active',
            rent_amount=Decimal('25000.00'),
        )
        Payment.objects.create(
            organization=self.org_a,
            tenant=self.tenant,
            tenancy=tenancy,
            provider=provider,
            amount=Decimal('25000.00'),
            idempotency_key='duplicate-safe',
        )
        with self.assertRaises((ValidationError, IntegrityError)):
            Payment.objects.create(
                organization=self.org_a,
                tenant=self.tenant,
                tenancy=tenancy,
                provider=provider,
                amount=Decimal('25000.00'),
                idempotency_key='duplicate-safe',
            )
