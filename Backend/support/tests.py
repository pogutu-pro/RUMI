from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from organizations.models import Organization
from properties.models import Property, RentalUnit
from support.models import SupportTicket


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
