from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from accounts.models import User
from rent.models import Organization, Property, RentalUnit, Tenant, Tenancy, PaymentProvider, Payment
from decimal import Decimal


class RentAPITestCase(APITestCase):
    def setUp(self):
        # Users
        self.landlord_user = User.objects.create_user(email='owner@example.com', password='pw', first_name='Owner', last_name='One', role='landlord')
        self.other_landlord = User.objects.create_user(email='owner2@example.com', password='pw', first_name='Owner', last_name='Two', role='landlord')
        self.tenant_user = User.objects.create_user(email='tenant@example.com', password='pw', first_name='Tenant', last_name='One', role='tenant')
        # Orgs
        self.org_a = Organization.objects.create(name='Acme', slug='acme')
        self.org_b = Organization.objects.create(name='Other', slug='other')
        # Properties
        self.property_a = Property.objects.create(organization=self.org_a, owner=self.landlord_user, name='Prop A')
        self.property_b = Property.objects.create(organization=self.org_b, owner=self.other_landlord, name='Prop B')
        # Units
        self.unit_a = RentalUnit.objects.create(property=self.property_a, unit_number='A1', rent_amount=Decimal('25000.00'))
        self.unit_b = RentalUnit.objects.create(property=self.property_b, unit_number='B1', rent_amount=Decimal('20000.00'))
        # Tenants
        self.tenant = Tenant.objects.create(user=self.tenant_user, organization=self.org_a, full_name='Tenant One')
        # Tenancy
        self.tenancy = Tenancy.objects.create(tenant=self.tenant, unit=self.unit_a, organization=self.org_a, start_date='2025-01-01', status='active', rent_amount=Decimal('25000.00'))
        # Provider
        self.provider = PaymentProvider.objects.create(organization=self.org_a, name='Test MPESA', provider_type='mpesa')

    def test_property_org_isolation(self):
        url = '/api/v1/rent/properties/'
        self.client.force_authenticate(user=self.landlord_user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        # landlord_user should only see property A
        ids = [p['id'] for p in results]
        self.assertIn(self.property_a.id, ids)
        self.assertNotIn(self.property_b.id, ids)

    def test_tenancy_creation_cross_org_rejected(self):
        self.client.force_authenticate(user=self.landlord_user)
        url = '/api/v1/rent/tenancies/'
        # try to create tenancy tied to org_b unit but organization set to org_a
        payload = {
            'tenant': self.tenant.id,
            'unit': self.unit_b.id,
            'organization': self.org_a.id,
            'start_date': '2025-02-01',
            'status': 'active',
            'rent_amount': '20000.00'
        }
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_idempotency(self):
        self.client.force_authenticate(user=self.landlord_user)
        url = '/api/v1/rent/payments/'
        payload = {
            'organization': self.org_a.id,
            'tenant': self.tenant.id,
            'tenancy': self.tenancy.id,
            'provider': self.provider.id,
            'amount': '10000.00',
            'idempotency_key': 'idem-1'
        }
        resp1 = self.client.post(url, payload, format='json')
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        resp2 = self.client.post(url, payload, format='json')
        # second request should return existing payment (serializer returns existing object)
        self.assertIn(resp2.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        # Ensure only one payment in DB with that idempotency_key
        payments = Payment.objects.filter(idempotency_key='idem-1')
        self.assertEqual(payments.count(), 1)

    def test_cannot_create_verified_payment_directly(self):
        self.client.force_authenticate(user=self.landlord_user)
        url = '/api/v1/rent/payments/'
        payload = {
            'organization': self.org_a.id,
            'tenant': self.tenant.id,
            'tenancy': self.tenancy.id,
            'provider': self.provider.id,
            'amount': '5000.00',
            'status': 'verified'
        }
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        payment = Payment.objects.get(id=resp.data['id'])
        self.assertNotEqual(payment.status, 'verified')
