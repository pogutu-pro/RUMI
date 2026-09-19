from decimal import Decimal
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CaretakerProfile, LandlordProfile
from messaging.models import Conversation, Message
from messaging.permissions import can_message, contacts_for
from organizations.models import Organization, OrganizationMembership
from properties.models import CaretakerPropertyAssignment, Property, RentalUnit, Tenancy
from tenants.models import TenantProfile

User = get_user_model()


class MessagingTestBase(TestCase):
    """One landlord, one property with a caretaker and a tenant, plus a stranger org."""

    def setUp(self):
        self.admin = self._user('admin@t.com', 'super_admin')
        self.landlord = self._user('landlord@t.com', 'landlord')
        LandlordProfile.objects.create(user=self.landlord)
        self.org = Organization.objects.create(name='Org', owner=self.landlord)
        self.prop = Property.objects.create(organization=self.org, name='Greenview', address='1 Rd', city='Nairobi')
        self.unit = RentalUnit.objects.create(
            organization=self.org, parent_property=self.prop, unit_number='A1', monthly_rent=Decimal('1000'),
        )

        self.caretaker = self._user('care@t.com', 'caretaker')
        profile = CaretakerProfile.objects.create(
            user=self.caretaker, landlord=self.landlord.landlord_profile,
            emergency_contact_name='E', emergency_contact_phone='+254700000000', created_by=self.landlord,
        )
        OrganizationMembership.objects.create(organization=self.org, user=self.caretaker, role='caretaker')
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=profile, property_assignment=self.prop, organization=self.org,
            assigned_by=self.landlord,
        )

        self.tenant = self._user('tenant@t.com', 'tenant')
        tenant_profile = TenantProfile.objects.create(
            organization=self.org, user=self.tenant, full_name='Ten Ant', phone='+254711111111',
            email='tenant@t.com', status='active',
        )
        Tenancy.objects.create(
            organization=self.org, parent_property=self.prop, unit=self.unit, tenant=tenant_profile,
            start_date=date.today() - timedelta(days=5), monthly_rent=Decimal('1000'),
            deposit=Decimal('0'), rent_due_day=5, status='active',
        )

        # An unrelated landlord + caretaker + tenant.
        self.other_landlord = self._user('other-landlord@t.com', 'landlord')
        self.other_org = Organization.objects.create(name='Other', owner=self.other_landlord)
        self.other_caretaker = self._user('other-care@t.com', 'caretaker')
        OrganizationMembership.objects.create(organization=self.other_org, user=self.other_caretaker, role='caretaker')

    @staticmethod
    def _user(email, role):
        return User.objects.create_user(
            email=email, password='Pass123!', first_name=email.split('@')[0].title(), last_name='X',
            role=role, is_verified=True, onboarding_stage='COMPLETED',
        )

    def api(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class WhoMayMessageWhomTests(MessagingTestBase):
    def test_the_chain(self):
        self.assertTrue(can_message(self.tenant, self.caretaker))
        self.assertTrue(can_message(self.caretaker, self.tenant))
        self.assertTrue(can_message(self.caretaker, self.landlord))
        self.assertTrue(can_message(self.landlord, self.caretaker))
        self.assertTrue(can_message(self.landlord, self.admin))
        self.assertTrue(can_message(self.admin, self.landlord))

    def test_it_is_not_a_free_for_all(self):
        # Skipping a level of the chain is not allowed while a caretaker exists.
        self.assertFalse(can_message(self.tenant, self.landlord))
        self.assertFalse(can_message(self.tenant, self.admin))
        self.assertFalse(can_message(self.caretaker, self.admin))
        self.assertFalse(can_message(self.admin, self.caretaker))
        self.assertFalse(can_message(self.admin, self.tenant))

    def test_other_organisations_are_off_limits(self):
        self.assertFalse(can_message(self.tenant, self.other_caretaker))
        self.assertFalse(can_message(self.caretaker, self.other_landlord))
        self.assertFalse(can_message(self.landlord, self.other_caretaker))

    def test_tenant_falls_back_to_the_landlord_when_no_caretaker_is_assigned(self):
        CaretakerPropertyAssignment.objects.update(is_active=False)
        self.assertTrue(can_message(self.tenant, self.landlord))
        self.assertFalse(can_message(self.tenant, self.caretaker))

    def test_cannot_message_yourself_or_an_inactive_user(self):
        self.assertFalse(can_message(self.tenant, self.tenant))
        self.caretaker.is_active = False
        self.caretaker.save()
        self.assertFalse(can_message(self.tenant, self.caretaker))

    def test_contacts_endpoint_lists_only_permitted_people(self):
        ids = {p['id'] for p in self.api(self.tenant).get('/api/v1/messaging/contacts/').json()['results']}
        self.assertEqual(ids, {self.caretaker.id})
        landlord_ids = {p['id'] for p in self.api(self.landlord).get('/api/v1/messaging/contacts/').json()['results']}
        self.assertEqual(landlord_ids, {self.caretaker.id, self.admin.id})


class ConversationFlowTests(MessagingTestBase):
    def _open(self, sender, recipient):
        return self.api(sender).post('/api/v1/messaging/conversations/', {'recipient': recipient.id}, format='json')

    def test_send_receive_and_unread_tracking(self):
        conversation_id = self._open(self.tenant, self.caretaker).json()['id']
        sent = self.api(self.tenant).post(
            f'/api/v1/messaging/conversations/{conversation_id}/messages/', {'body': 'The tap is leaking'}, format='json',
        )
        self.assertEqual(sent.status_code, 201)

        # The caretaker sees it, unread, in their list and in the badge count.
        listing = self.api(self.caretaker).get('/api/v1/messaging/conversations/').json()['results']
        self.assertEqual(len(listing), 1)
        self.assertEqual(listing[0]['unread_count'], 1)
        self.assertEqual(listing[0]['other']['id'], self.tenant.id)
        self.assertEqual(listing[0]['last_message_preview'], 'The tap is leaking')
        self.assertEqual(self.api(self.caretaker).get('/api/v1/messaging/unread-count/').json()['unread_count'], 1)
        # The sender has nothing unread.
        self.assertEqual(self.api(self.tenant).get('/api/v1/messaging/unread-count/').json()['unread_count'], 0)

        thread = self.api(self.caretaker).get(f'/api/v1/messaging/conversations/{conversation_id}/messages/').json()
        self.assertEqual([m['body'] for m in thread['results']], ['The tap is leaking'])

        self.api(self.caretaker).post(f'/api/v1/messaging/conversations/{conversation_id}/read/')
        self.assertEqual(self.api(self.caretaker).get('/api/v1/messaging/unread-count/').json()['unread_count'], 0)

    def test_one_conversation_per_pair_whoever_starts_it(self):
        first = self._open(self.tenant, self.caretaker).json()['id']
        second = self._open(self.caretaker, self.tenant).json()['id']
        self.assertEqual(first, second)
        self.assertEqual(Conversation.objects.count(), 1)

    def test_empty_conversations_are_not_listed_until_someone_writes(self):
        self._open(self.tenant, self.caretaker)
        self.assertEqual(self.api(self.tenant).get('/api/v1/messaging/conversations/').json()['results'], [])

    def test_cannot_open_a_conversation_outside_the_chain(self):
        self.assertEqual(self._open(self.tenant, self.landlord).status_code, 403)
        self.assertEqual(self._open(self.tenant, self.other_caretaker).status_code, 403)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_a_stranger_cannot_read_or_write_someone_elses_thread(self):
        conversation_id = self._open(self.tenant, self.caretaker).json()['id']
        url = f'/api/v1/messaging/conversations/{conversation_id}/messages/'
        self.assertEqual(self.api(self.landlord).get(url).status_code, 404)
        self.assertEqual(self.api(self.landlord).post(url, {'body': 'hi'}, format='json').status_code, 404)

    def test_validation(self):
        conversation_id = self._open(self.tenant, self.caretaker).json()['id']
        url = f'/api/v1/messaging/conversations/{conversation_id}/messages/'
        self.assertEqual(self.api(self.tenant).post(url, {'body': '   '}, format='json').status_code, 400)
        self.assertEqual(self.api(self.tenant).post(url, {'body': 'x' * 2001}, format='json').status_code, 400)
        self.assertEqual(Message.objects.count(), 0)

    def test_sending_stops_when_the_relationship_ends(self):
        conversation_id = self._open(self.tenant, self.caretaker).json()['id']
        url = f'/api/v1/messaging/conversations/{conversation_id}/messages/'
        CaretakerPropertyAssignment.objects.update(is_active=False)
        # Falls back to the landlord, so the tenant<->caretaker thread is closed.
        self.assertEqual(self.api(self.tenant).post(url, {'body': 'still there?'}, format='json').status_code, 403)

    def test_requires_authentication(self):
        self.assertIn(APIClient().get('/api/v1/messaging/conversations/').status_code, (401, 403))

    def test_after_parameter_returns_only_newer_messages(self):
        conversation_id = self._open(self.landlord, self.admin).json()['id']
        url = f'/api/v1/messaging/conversations/{conversation_id}/messages/'
        first = self.api(self.landlord).post(url, {'body': 'one'}, format='json').json()
        self.api(self.admin).post(url, {'body': 'two'}, format='json')
        newer = self.api(self.landlord).get(url, {'after': first['created_at']}).json()['results']
        self.assertEqual([m['body'] for m in newer], ['two'])


class InAppNotificationTests(MessagingTestBase):
    """The bell lights up for the things that happen."""

    def _bell(self, user):
        return self.api(user).get('/api/v1/notifications/').json()

    def test_a_new_chat_message_notifies_the_recipient_with_a_link(self):
        conversation_id = self.api(self.tenant).post(
            '/api/v1/messaging/conversations/', {'recipient': self.caretaker.id}, format='json').json()['id']
        self.api(self.tenant).post(
            f'/api/v1/messaging/conversations/{conversation_id}/messages/', {'body': 'Hello'}, format='json')

        bell = self._bell(self.caretaker)
        self.assertEqual(bell['unread_count'], 1)
        note = bell['notifications'][0]
        self.assertEqual(note['type'], 'message')
        self.assertIn('Tenant', note['subject'])
        self.assertEqual(note['metadata']['url'], '/caretaker/rental/messages')
        # The sender is not notified about their own message.
        self.assertEqual(self._bell(self.tenant)['unread_count'], 0)

    def test_a_busy_conversation_is_one_bell_entry_not_many(self):
        conversation_id = self.api(self.tenant).post(
            '/api/v1/messaging/conversations/', {'recipient': self.caretaker.id}, format='json').json()['id']
        for text in ('one', 'two', 'three'):
            self.api(self.tenant).post(
                f'/api/v1/messaging/conversations/{conversation_id}/messages/', {'body': text}, format='json')
        bell = self._bell(self.caretaker)
        self.assertEqual(bell['unread_count'], 1)
        self.assertEqual(bell['notifications'][0]['message'], 'three')
        self.assertEqual(bell['notifications'][0]['metadata']['count'], 3)

    def test_recording_a_payment_notifies_the_tenant_and_the_landlord(self):
        from unittest import mock
        from decimal import Decimal as D

        tenancy = Tenancy.objects.get()
        with mock.patch('rent.tasks.send_payment_confirmation_task.delay'):
            resp = self.api(self.caretaker).post('/api/v1/rent/payments/manual/', {
                'tenancy': str(tenancy.id), 'amount': '500', 'payment_method': 'cash',
            }, format='json')
        # The caretaker has no payment permission in this fixture, so nothing happens...
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(self._bell(self.tenant)['unread_count'], 0)

        self.caretaker.caretaker_profile.permissions = {'can_record_payments': True}
        self.caretaker.caretaker_profile.save()
        with mock.patch('rent.tasks.send_payment_confirmation_task.delay'):
            resp = self.api(self.caretaker).post('/api/v1/rent/payments/manual/', {
                'tenancy': str(tenancy.id), 'amount': '500', 'payment_method': 'cash',
            }, format='json')
        self.assertEqual(resp.status_code, 201)
        tenant_note = self._bell(self.tenant)['notifications'][0]
        self.assertEqual(tenant_note['subject'], 'Payment recorded')
        landlord_note = self._bell(self.landlord)['notifications'][0]
        self.assertIn('Ten Ant paid', landlord_note['subject'])

    def test_ticket_reply_from_staff_notifies_the_requester(self):
        from support.models import SupportTicket

        staff = self._user('support@t.com', 'tech_support')
        ticket = SupportTicket.objects.create(created_by=self.tenant, subject='Cannot pay', description='d')
        self.api(staff).post(
            f'/api/v1/support/tickets/{ticket.id}/messages/', {'message': 'Looking into it'}, format='json')
        note = self._bell(self.tenant)['notifications'][0]
        self.assertEqual(note['type'], 'ticket')
        self.assertEqual(note['metadata']['url'], '/tenant/rental/support')
        self.assertIn('Cannot pay', note['subject'])

    def test_new_ticket_notifies_support_staff(self):
        staff = self._user('support@t.com', 'tech_support')
        self.api(self.tenant).post('/api/v1/support/tickets/', {
            'subject': 'Broken app', 'description': 'It crashes',
        }, format='json')
        note = self._bell(staff)['notifications'][0]
        self.assertIn('New support ticket', note['subject'])
        self.assertEqual(note['metadata']['url'], '/tech-support/dashboard')


class TechSupportChatTests(MessagingTestBase):
    def setUp(self):
        super().setUp()
        self.support = self._user('support@t.com', 'tech_support')

    def test_tech_support_and_super_admin_can_message_each_other(self):
        self.assertTrue(can_message(self.support, self.admin))
        self.assertTrue(can_message(self.admin, self.support))

    def test_tech_support_reaches_only_super_admins(self):
        ids = {p['id'] for p in self.api(self.support).get('/api/v1/messaging/contacts/').json()['results']}
        self.assertEqual(ids, {self.admin.id})
        for other in (self.landlord, self.caretaker, self.tenant):
            self.assertFalse(can_message(self.support, other))

    def test_super_admin_now_sees_tech_support_alongside_landlords(self):
        ids = {p['id'] for p in self.api(self.admin).get('/api/v1/messaging/contacts/').json()['results']}
        self.assertEqual(ids, {self.landlord.id, self.other_landlord.id, self.support.id})

    def test_a_chat_between_them_works_and_notifies_with_the_right_link(self):
        cid = self.api(self.support).post(
            '/api/v1/messaging/conversations/', {'recipient': self.admin.id}, format='json').json()['id']
        self.api(self.support).post(
            f'/api/v1/messaging/conversations/{cid}/messages/', {'body': 'Need a decision'}, format='json')
        bell = self.api(self.admin).get('/api/v1/notifications/').json()
        self.assertEqual(bell['notifications'][0]['metadata']['url'], '/platform/messages')
        self.api(self.admin).post(
            f'/api/v1/messaging/conversations/{cid}/messages/', {'body': 'Approved'}, format='json')
        back = self.api(self.support).get('/api/v1/notifications/').json()
        self.assertEqual(back['notifications'][0]['metadata']['url'], '/tech-support/dashboard/messages')
        person = self.api(self.admin).get('/api/v1/messaging/contacts/').json()['results']
        self.assertIn('Support team', {p['role_label'] for p in person})
