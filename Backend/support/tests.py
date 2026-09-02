from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CaretakerProfile, LandlordProfile, User
from organizations.models import Organization
from properties.models import CaretakerPropertyAssignment, Property, RentalUnit, Tenancy
from support.models import SupportTicket
from tenants.models import TenantProfile


class SupportTicketTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.landlord = User.objects.create_user(
            email='landlord@test.com', password='pass12345', role='landlord',
            first_name='Land', last_name='Lord',
        )
        self.other_landlord = User.objects.create_user(
            email='other@test.com', password='pass12345', role='landlord',
            first_name='Other', last_name='Landlord',
        )
        self.tech_support = User.objects.create_user(
            email='support@test.com', password='pass12345', role='tech_support',
            first_name='Tech', last_name='Support',
        )

    def test_user_can_create_ticket(self):
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post('/api/v1/support/tickets/', {
            'subject': 'Cannot see my property',
            'description': 'It disappeared after I edited it.',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(SupportTicket.objects.count(), 1)
        self.assertEqual(resp.data['status'], 'open')

    def test_create_ticket_requires_subject_and_description(self):
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post('/api/v1/support/tickets/', {'subject': ''})
        self.assertEqual(resp.status_code, 400)

    def test_user_sees_only_their_own_tickets(self):
        SupportTicket.objects.create(created_by=self.landlord, subject='A', description='a')
        SupportTicket.objects.create(created_by=self.other_landlord, subject='B', description='b')

        self.client.force_authenticate(user=self.landlord)
        resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['subject'], 'A')

    def test_tech_support_sees_all_tickets(self):
        SupportTicket.objects.create(created_by=self.landlord, subject='A', description='a')
        SupportTicket.objects.create(created_by=self.other_landlord, subject='B', description='b')

        self.client.force_authenticate(user=self.tech_support)
        resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

    def test_user_cannot_view_others_ticket_detail(self):
        ticket = SupportTicket.objects.create(created_by=self.other_landlord, subject='B', description='b')
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.get(f'/api/v1/support/tickets/{ticket.id}/')
        self.assertEqual(resp.status_code, 404)

    def test_only_staff_can_update_status(self):
        ticket = SupportTicket.objects.create(created_by=self.landlord, subject='A', description='a')

        self.client.force_authenticate(user=self.landlord)
        resp = self.client.patch(f'/api/v1/support/tickets/{ticket.id}/', {'status': 'resolved'}, format='json')
        self.assertEqual(resp.status_code, 403)

        self.client.force_authenticate(user=self.tech_support)
        resp = self.client.patch(f'/api/v1/support/tickets/{ticket.id}/', {'status': 'resolved'}, format='json')
        self.assertEqual(resp.status_code, 200)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'resolved')

    def test_reply_reopens_resolved_ticket(self):
        ticket = SupportTicket.objects.create(
            created_by=self.landlord, subject='A', description='a', status='resolved',
        )
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post(f'/api/v1/support/tickets/{ticket.id}/messages/', {
            'message': 'Actually still broken',
        })
        self.assertEqual(resp.status_code, 201)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'open')

    def test_staff_reply_does_not_reopen_ticket(self):
        ticket = SupportTicket.objects.create(
            created_by=self.landlord, subject='A', description='a', status='resolved',
        )
        self.client.force_authenticate(user=self.tech_support)
        resp = self.client.post(f'/api/v1/support/tickets/{ticket.id}/messages/', {
            'message': 'Following up',
        })
        self.assertEqual(resp.status_code, 201)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'resolved')

    def test_stranger_cannot_message_ticket(self):
        ticket = SupportTicket.objects.create(created_by=self.other_landlord, subject='B', description='b')
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post(f'/api/v1/support/tickets/{ticket.id}/messages/', {'message': 'hi'})
        self.assertEqual(resp.status_code, 404)


class MaintenanceTicketFieldsTests(TestCase):
    """Task 1: category/unit/priority round-trip and validation on the create endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.landlord = User.objects.create_user(
            email='landlord2@test.com', password='pass12345', role='landlord',
            first_name='Land', last_name='Lord',
        )
        self.org = Organization.objects.create(name='Test Org 2', owner=self.landlord)
        self.property = Property.objects.create(
            organization=self.org,
            name='Greenview Apartments',
            property_type='apartment',
            address='123 Test Road',
            city='Nairobi',
        )
        self.unit = RentalUnit.objects.create(
            organization=self.org,
            parent_property=self.property,
            unit_number='A101',
            unit_type='1_bedroom',
            monthly_rent=Decimal('22000.00'),
            deposit=Decimal('22000.00'),
            status='vacant',
        )

    def test_create_ticket_with_category_unit_priority_round_trips(self):
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post('/api/v1/support/tickets/', {
            'subject': 'Leaking tap',
            'description': 'Kitchen tap leaking constantly.',
            'category': 'maintenance',
            'unit': str(self.unit.id),
            'priority': 'high',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['category'], 'maintenance')
        self.assertEqual(resp.data['unit'], str(self.unit.id))
        self.assertEqual(resp.data['priority'], 'high')
        self.assertEqual(resp.data['unit_label'], f'{self.unit.unit_number} — {self.property.name}')

    def test_create_ticket_with_invalid_category_returns_400(self):
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post('/api/v1/support/tickets/', {
            'subject': 'Test',
            'description': 'Test description.',
            'category': 'not-a-real-choice',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['detail'], 'Invalid category.')

    def test_create_ticket_with_invalid_priority_returns_400(self):
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post('/api/v1/support/tickets/', {
            'subject': 'Test',
            'description': 'Test description.',
            'priority': 'not-a-real-choice',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['detail'], 'Invalid priority.')

    def test_create_ticket_without_new_fields_uses_defaults(self):
        self.client.force_authenticate(user=self.landlord)
        resp = self.client.post('/api/v1/support/tickets/', {
            'subject': 'Cannot see my property',
            'description': 'It disappeared after I edited it.',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['category'], 'general')
        self.assertEqual(resp.data['priority'], 'medium')
        self.assertIsNone(resp.data['unit'])
        self.assertIsNone(resp.data['unit_label'])

    def test_list_and_detail_include_new_fields(self):
        self.client.force_authenticate(user=self.landlord)
        create_resp = self.client.post('/api/v1/support/tickets/', {
            'subject': 'Leaking tap',
            'description': 'Kitchen tap leaking constantly.',
            'category': 'maintenance',
            'unit': str(self.unit.id),
            'priority': 'high',
        })
        ticket_id = create_resp.data['id']

        list_resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(list_resp.status_code, 200)
        row = next(r for r in list_resp.data if str(r['id']) == str(ticket_id))
        self.assertEqual(row['category'], 'maintenance')
        self.assertEqual(str(row['unit']), str(self.unit.id))
        self.assertEqual(row['priority'], 'high')
        self.assertIn('unit_label', row)

        detail_resp = self.client.get(f'/api/v1/support/tickets/{ticket_id}/')
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.data['category'], 'maintenance')
        self.assertEqual(str(detail_resp.data['unit']), str(self.unit.id))
        self.assertEqual(detail_resp.data['priority'], 'high')
        self.assertIn('unit_label', detail_resp.data)


class MaintenanceTicketUnitScopingTests(TestCase):
    """Task 2: _user_can_access_unit per-role scoping on ticket creation (T-05-04)."""

    def setUp(self):
        self.client = APIClient()

        # Org A: landlord, two properties/units, a caretaker assigned only
        # to property A1, and a tenant with an active tenancy on unit A1.
        self.landlord = User.objects.create_user(
            email='landlord-scope@test.com', password='pass12345', role='landlord',
            first_name='Land', last_name='Lord', phone_number='+254711111111',
        )
        self.landlord_profile = LandlordProfile.objects.create(user=self.landlord, company_name='Org A Co')
        self.org = Organization.objects.create(name='Org A', owner=self.landlord)

        self.property_a1 = Property.objects.create(
            organization=self.org, name='Property A1', property_type='apartment',
            address='1 Test Road', city='Nairobi',
        )
        self.unit_a1 = RentalUnit.objects.create(
            organization=self.org, parent_property=self.property_a1, unit_number='A101',
            unit_type='1_bedroom', monthly_rent=Decimal('20000.00'), deposit=Decimal('20000.00'),
            status='occupied',
        )
        self.property_a2 = Property.objects.create(
            organization=self.org, name='Property A2', property_type='apartment',
            address='2 Test Road', city='Nairobi',
        )
        self.unit_a2 = RentalUnit.objects.create(
            organization=self.org, parent_property=self.property_a2, unit_number='B201',
            unit_type='1_bedroom', monthly_rent=Decimal('20000.00'), deposit=Decimal('20000.00'),
            status='vacant',
        )

        self.caretaker = User.objects.create_user(
            email='caretaker-scope@test.com', password='pass12345', role='caretaker',
            first_name='Care', last_name='Taker', phone_number='+254733333333',
        )
        self.caretaker_profile = CaretakerProfile.objects.create(
            user=self.caretaker, landlord=self.landlord_profile,
            emergency_contact_name='Emergency', emergency_contact_phone='+254744444444',
            created_by=self.landlord,
        )
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=self.caretaker_profile,
            property_assignment=self.property_a1,
            organization=self.org,
            assigned_by=self.landlord,
        )

        self.tenant_user = User.objects.create_user(
            email='tenant-scope@test.com', password='pass12345', role='tenant',
            first_name='John', last_name='Kamau', phone_number='+254722222222',
        )
        self.tenant_profile = TenantProfile.objects.create(
            organization=self.org, user=self.tenant_user, full_name='John Kamau',
            phone='+254722222222', email='tenant-scope@test.com', status='active',
        )
        Tenancy.objects.create(
            organization=self.org, parent_property=self.property_a1, unit=self.unit_a1,
            tenant=self.tenant_profile, start_date=date(2026, 1, 1),
            monthly_rent=Decimal('20000.00'), status='active',
        )

        # Org B: a different landlord entirely, to test cross-org denial.
        self.other_landlord = User.objects.create_user(
            email='landlord-other-scope@test.com', password='pass12345', role='landlord',
            first_name='Other', last_name='Landlord', phone_number='+254755555555',
        )
        self.other_org = Organization.objects.create(name='Org B', owner=self.other_landlord)
        self.other_property = Property.objects.create(
            organization=self.other_org, name='Property B1', property_type='apartment',
            address='3 Test Road', city='Nairobi',
        )
        self.other_unit = RentalUnit.objects.create(
            organization=self.other_org, parent_property=self.other_property, unit_number='C301',
            unit_type='1_bedroom', monthly_rent=Decimal('20000.00'), deposit=Decimal('20000.00'),
            status='vacant',
        )

        self.tech_support = User.objects.create_user(
            email='tech-scope@test.com', password='pass12345', role='tech_support',
            first_name='Tech', last_name='Support',
        )

    def _post_ticket(self, user, unit):
        self.client.force_authenticate(user=user)
        return self.client.post('/api/v1/support/tickets/', {
            'subject': 'Broken tap', 'description': 'Needs fixing.',
            'category': 'maintenance', 'unit': str(unit.id), 'priority': 'high',
        })

    def test_caretaker_denied_unit_on_unassigned_property(self):
        resp = self._post_ticket(self.caretaker, self.unit_a2)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['detail'], 'Unit not found or not accessible.')

    def test_caretaker_allowed_unit_on_assigned_property(self):
        resp = self._post_ticket(self.caretaker, self.unit_a1)
        self.assertEqual(resp.status_code, 201)

    def test_tenant_denied_unit_not_their_own_tenancy(self):
        resp = self._post_ticket(self.tenant_user, self.unit_a2)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['detail'], 'Unit not found or not accessible.')

    def test_tenant_allowed_unit_of_own_tenancy(self):
        resp = self._post_ticket(self.tenant_user, self.unit_a1)
        self.assertEqual(resp.status_code, 201)

    def test_landlord_denied_unit_in_different_organization(self):
        resp = self._post_ticket(self.landlord, self.other_unit)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['detail'], 'Unit not found or not accessible.')

    def test_staff_role_never_blocked_by_unit_scoping(self):
        resp = self._post_ticket(self.tech_support, self.other_unit)
        self.assertEqual(resp.status_code, 201)

    # --- 05-08: caretaker/landlord read-visibility widening (CARE-02/WR-03) ---

    def test_caretaker_sees_tenant_raised_ticket_on_assigned_unit(self):
        ticket = SupportTicket.objects.create(
            created_by=self.tenant_user, organization=self.org, category='maintenance',
            unit=self.unit_a1, priority='high', subject='Broken tap', description='Needs fixing.',
        )
        self.client.force_authenticate(user=self.caretaker)

        list_resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(list_resp.status_code, 200)
        self.assertIn(str(ticket.id), [str(row['id']) for row in list_resp.data])

        detail_resp = self.client.get(f'/api/v1/support/tickets/{ticket.id}/')
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.data['subject'], 'Broken tap')

    def test_caretaker_does_not_see_ticket_on_unassigned_property(self):
        ticket = SupportTicket.objects.create(
            created_by=self.landlord, organization=self.org, category='maintenance',
            unit=self.unit_a2, priority='medium', subject='Leaky roof', description='Needs fixing.',
        )
        self.client.force_authenticate(user=self.caretaker)

        list_resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(list_resp.status_code, 200)
        self.assertNotIn(str(ticket.id), [str(row['id']) for row in list_resp.data])

        detail_resp = self.client.get(f'/api/v1/support/tickets/{ticket.id}/')
        self.assertEqual(detail_resp.status_code, 404)

    def test_tenant_still_only_sees_own_tickets_after_visibility_widening(self):
        SupportTicket.objects.create(
            created_by=self.caretaker, organization=self.org, category='maintenance',
            unit=self.unit_a1, priority='medium', subject='Caretaker ticket', description='desc',
        )
        SupportTicket.objects.create(
            created_by=self.landlord, organization=self.org, category='maintenance',
            unit=self.unit_a1, priority='medium', subject='Landlord ticket', description='desc',
        )
        self.client.force_authenticate(user=self.tenant_user)
        resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)

    def test_landlord_sees_ticket_raised_by_tenant_on_own_property(self):
        ticket = SupportTicket.objects.create(
            created_by=self.tenant_user, organization=self.org, unit=self.unit_a1,
            category='maintenance', priority='medium', subject='Broken tap', description='desc',
        )
        self.client.force_authenticate(user=self.landlord)

        list_resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(list_resp.status_code, 200)
        self.assertIn(str(ticket.id), [str(row['id']) for row in list_resp.data])

        detail_resp = self.client.get(f'/api/v1/support/tickets/{ticket.id}/')
        self.assertEqual(detail_resp.status_code, 200)

    def test_landlord_does_not_see_ticket_in_other_organization(self):
        ticket = SupportTicket.objects.create(
            created_by=self.other_landlord, organization=self.other_org, unit=self.other_unit,
            category='maintenance', priority='medium', subject='Other org ticket', description='desc',
        )
        self.client.force_authenticate(user=self.landlord)

        list_resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(list_resp.status_code, 200)
        self.assertNotIn(str(ticket.id), [str(row['id']) for row in list_resp.data])

        detail_resp = self.client.get(f'/api/v1/support/tickets/{ticket.id}/')
        self.assertEqual(detail_resp.status_code, 404)

    def test_staff_still_sees_all_tickets_after_visibility_widening(self):
        ticket_1 = SupportTicket.objects.create(
            created_by=self.tenant_user, organization=self.org, unit=self.unit_a1,
            category='maintenance', priority='medium', subject='Ticket 1', description='desc',
        )
        ticket_2 = SupportTicket.objects.create(
            created_by=self.other_landlord, organization=self.other_org, unit=self.other_unit,
            category='maintenance', priority='medium', subject='Ticket 2', description='desc',
        )
        self.client.force_authenticate(user=self.tech_support)
        resp = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(resp.status_code, 200)
        ids = [str(row['id']) for row in resp.data]
        self.assertIn(str(ticket_1.id), ids)
        self.assertIn(str(ticket_2.id), ids)

    def test_caretaker_cannot_reply_to_ticket_they_did_not_create(self):
        ticket = SupportTicket.objects.create(
            created_by=self.tenant_user, organization=self.org, unit=self.unit_a1,
            category='maintenance', priority='medium', subject='Broken tap', description='desc',
        )
        self.client.force_authenticate(user=self.caretaker)
        resp = self.client.post(f'/api/v1/support/tickets/{ticket.id}/messages/', {'message': 'On it'})
        self.assertEqual(resp.status_code, 404)
