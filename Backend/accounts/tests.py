from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch
from .models import User, StudentProfile, LandlordProfile
import json

class GoogleOAuthTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('google_oauth')

    @patch('accounts.views.requests.get')
    def test_new_student_registration_full_data(self, mock_get):
        # Mock Google user info response
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'email': 'student@example.com',
            'given_name': 'Jane',
            'family_name': 'Doe',
            'picture': 'http://example.com/pic.jpg',
            'verified_email': True
        }

        payload = {
            'access_token': 'fake-token',
            'role': 'student',
            'gender': 'female',
            'date_of_birth': '2000-01-01',
            'university': 'Test University',
            'phone_number': '+254712345678'
        }

        response = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(email='student@example.com')
        self.assertEqual(user.role, 'student')
        self.assertEqual(user.gender, 'female')
        
        profile = StudentProfile.objects.get(user=user)
        self.assertEqual(profile.university, 'Test University')
        self.assertEqual(user.onboarding_stage, 'ROLE_SELECTED')

    @patch('accounts.views.requests.get')
    def test_new_landlord_registration_full_data(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'email': 'landlord@example.com',
            'verified_email': True
        }

        payload = {
            'access_token': 'fake-token',
            'role': 'landlord',
            'company_name': 'RUMI Properties',
            'total_units': 50
        }

        response = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(email='landlord@example.com')
        profile = LandlordProfile.objects.get(user=user)
        self.assertEqual(profile.company_name, 'RUMI Properties')
        self.assertEqual(profile.total_units, 50)
