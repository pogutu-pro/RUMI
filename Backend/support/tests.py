from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
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
