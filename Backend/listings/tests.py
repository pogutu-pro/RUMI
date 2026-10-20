from django.core import mail
from django.core.cache import cache
from rest_framework.test import APIClient

from listings.models import ListingEnquiry
from rumia_api.tests import RumiaTestFixtures


class ListingTests(RumiaTestFixtures):
    def setUp(self):
        cache.clear()  # enquiry throttle counters live in the cache
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)  # vacant
        self.api = APIClient()

    def test_vacant_units_are_listed_and_let_units_disappear(self):
        data = self.api.get('/api/v1/listings/?city=nairobi&max_rent=30000').data
        self.assertEqual([d['id'] for d in data], [str(self.unit.id)])
        self.assertNotIn('phone', data[0])
        self.unit.status = 'occupied'
        self.unit.save()
        self.assertEqual(self.api.get('/api/v1/listings/').data, [])

    def test_unlisted_and_filters(self):
        self.unit.is_listed = False
        self.unit.save()
        self.assertEqual(self.api.get('/api/v1/listings/').data, [])
        self.assertEqual(self.api.get('/api/v1/listings/?min_rent=abc').status_code, 400)

    def test_enquiry_alerts_landlord_and_shows_in_inbox(self):
        response = self.api.post(f'/api/v1/listings/{self.unit.id}/enquire/',
                                 {'name': 'Asha', 'phone': '0712345678', 'message': 'Can I view Saturday?'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(ListingEnquiry.objects.count(), 1)
        self.assertIn(self.landlord.email, [m.to[0] for m in mail.outbox])
        bad = self.api.post(f'/api/v1/listings/{self.unit.id}/enquire/', {'name': 'X', 'phone': '12'}, format='json')
        self.assertEqual(bad.status_code, 400)
        owner = APIClient()
        owner.force_authenticate(user=self.landlord)
        self.assertEqual(owner.get('/api/v1/listings/enquiries/').data[0]['name'], 'Asha')
