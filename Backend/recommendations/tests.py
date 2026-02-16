"""
Tests for recommendation engine
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from accounts.models import StudentProfile
from hostels.models import Hostel, Room, Booking, HostelAmenity, Amenity
from recommendations.engine import HostelRecommendationEngine, get_student_recommendations

User = get_user_model()


class RecommendationEngineTests(TestCase):
    """
    Test cases for the recommendation engine
    """
    
    def setUp(self):
        """
        Set up test data
        """
        # Create test users
        self.student_user = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            role='student',
            gender='male'
        )
        
        # Create student profile
        self.student = StudentProfile.objects.create(
            user=self.student_user,
            university='Test University',
            course='Computer Science',
            year_of_study=2,
            lifestyle_preferences={
                'max_monthly_rent': 15000,
                'preferred_amenities': ['wifi', 'study_area', 'security']
            }
        )
        
        # Create landlord
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Landlord',
            role='landlord'
        )
        
        # Create landlord profile
        from accounts.models import LandlordProfile
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user,
            company_name='Test Landlord Co',
            national_id='12345678'
        )
        
        # Create hostel
        self.hostel = Hostel.objects.create(
            landlord=self.landlord_profile,
            name='Test Hostel',
            description='A great place to stay',
            address='123 Test Street',
            city='Nairobi',
            university='Test University',
            base_price=Decimal('12000.00'),
            gender_policy='mixed',
            total_rooms=10,
            available_rooms=5,
            rating=Decimal('4.2'),
            review_count=8
        )
        
        # Create amenities
        self.wifi_amenity = Amenity.objects.create(
            name='WiFi',
            category='facilities',
            description='High-speed internet'
        )
        
        self.study_amenity = Amenity.objects.create(
            name='Study Area',
            category='facilities',
            description='Quiet study space'
        )
        
        # Link amenities to hostel
        HostelAmenity.objects.create(
            hostel=self.hostel,
            amenity=self.wifi_amenity,
            is_available=True
        )
        
        HostelAmenity.objects.create(
            hostel=self.hostel,
            amenity=self.study_amenity,
            is_available=True
        )
        
        # Create room
        self.room = Room.objects.create(
            hostel=self.hostel,
            room_number='101',
            room_type='single',
            base_price=Decimal('12000.00'),
            capacity=1,
            current_occupancy=0
        )
        
        # Create booking
        self.booking = Booking.objects.create(
            student=self.student,
            room=self.room,
            booking_reference='TEST001',
            check_in_date=timezone.now().date(),
            duration_months=6,
            monthly_rent=Decimal('12000.00'),
            total_amount=Decimal('72000.00'),
            status='confirmed'
        )
        
        self.engine = HostelRecommendationEngine()
    
    def test_get_recommendations_for_student(self):
        """
        Test getting recommendations for a student
        """
        recommendations = self.engine.get_recommendations_for_student(self.student.id, limit=5)
        
        self.assertIsInstance(recommendations, list)
        self.assertLessEqual(len(recommendations), 5)
        
        if recommendations:
            rec = recommendations[0]
            self.assertIn('hostel', rec)
            self.assertIn('score', rec)
            self.assertIn('reasons', rec)
            self.assertIn('price_compatibility', rec)
            
            # Check hostel structure
            hostel = rec['hostel']
            self.assertIn('id', hostel)
            self.assertIn('name', hostel)
            self.assertIn('base_price', hostel)
            self.assertIn('rating', hostel)
    
    def test_content_similarity_calculation(self):
        """
        Test content-based similarity calculation
        """
        hostels = [self.hostel]
        scores = self.engine._calculate_content_similarity(self.student, hostels)
        
        self.assertIn(self.hostel.id, scores)
        self.assertGreaterEqual(scores[self.hostel.id], 0.0)
        self.assertLessEqual(scores[self.hostel.id], 1.0)
    
    def test_price_compatibility(self):
        """
        Test price compatibility calculation
        """
        score = self.engine._calculate_price_compatibility(self.student, self.hostel)
        
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
        
        # Should be compatible since hostel price (12000) < student max (15000)
        self.assertGreater(score, 0.5)
    
    def test_amenity_compatibility(self):
        """
        Test amenity compatibility calculation
        """
        score = self.engine._calculate_amenity_compatibility(self.student, self.hostel)
        
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
        
        # Should have decent match since student wants WiFi and study area
        self.assertGreater(score, 0.0)  # Just check it's greater than 0
    
    def test_quality_score(self):
        """
        Test quality score calculation
        """
        score = self.engine._calculate_quality_score(self.hostel)
        
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
        
        # Should have decent score due to 4.2 rating and 8 reviews
        self.assertGreater(score, 0.5)
    
    def test_convenience_function(self):
        """
        Test the convenience function
        """
        recommendations = get_student_recommendations(self.student.id, limit=3)
        
        self.assertIsInstance(recommendations, list)
        self.assertLessEqual(len(recommendations), 3)
    
    def test_student_not_found(self):
        """
        Test handling of non-existent student
        """
        recommendations = self.engine.get_recommendations_for_student(99999)
        
        self.assertEqual(recommendations, [])
    
    def test_no_available_hostels(self):
        """
        Test when no hostels are available
        """
        # Make hostel unavailable
        self.hostel.available_rooms = 0
        self.hostel.save()
        
        recommendations = self.engine.get_recommendations_for_student(self.student.id)
        
        self.assertEqual(recommendations, [])


class RecommendationAPITests(TestCase):
    """
    Test cases for recommendation API endpoints
    """
    
    def setUp(self):
        """
        Set up test data for API tests
        """
        # Create test student user
        self.student_user = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            role='student'
        )
        
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            university='Test University',
            course='Computer Science',
            year_of_study=2
        )
        
        # Create test landlord and hostel
        self.landlord_user = User.objects.create_user(
            email='landlord@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Landlord',
            role='landlord'
        )
        
        # Create landlord profile
        from accounts.models import LandlordProfile
        self.landlord_profile = LandlordProfile.objects.create(
            user=self.landlord_user,
            company_name='Test Landlord Co',
            national_id='12345678'
        )
        
        self.hostel = Hostel.objects.create(
            landlord=self.landlord_profile,
            name='Test Hostel',
            description='A great place to stay',
            address='123 Test Street',
            city='Nairobi',
            university='Test University',
            base_price=Decimal('12000.00'),
            gender_policy='mixed',
            total_rooms=10,
            available_rooms=5,
            rating=Decimal('4.2'),
            review_count=8
        )
    
    def test_student_recommendations_api(self):
        """
        Test the student recommendations API endpoint
        """
        self.client.login(email='student@test.com', password='testpass123')
        
        response = self.client.get('/api/v1/recommendations/student/me/')

        self.assertEqual(response.status_code, 200)

        data = response.json()
        # Response is wrapped in DRF pagination: {count, next, previous, results}
        self.assertIn('results', data)
        results = data['results']
        self.assertIn('student_id', results)
        self.assertIn('recommendations', results)
        self.assertIn('pagination', results)
        self.assertIn('meta', results)

        # Check meta information
        meta = results['meta']
        self.assertEqual(meta['algorithm'], 'hybrid_content_collaborative')
        self.assertEqual(meta['content_weight'], 0.7)
        self.assertEqual(meta['collaborative_weight'], 0.3)
    
    def test_recommendation_stats_api(self):
        """
        Test the recommendation stats API endpoint
        """
        self.client.login(email='student@test.com', password='testpass123')

        response = self.client.get('/api/v1/recommendations/stats/me/')

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn('student_id', data)
        self.assertIn('preferences', data)
        self.assertIn('booking_patterns', data)
        self.assertIn('review_behavior', data)
        self.assertIn('recommendation_readiness', data)

        # Check preferences
        preferences = data['preferences']
        self.assertEqual(preferences['university'], 'Test University')
        self.assertEqual(preferences['course'], 'Computer Science')
        self.assertEqual(preferences['year_of_study'], 2)
    
    def test_unauthorized_access(self):
        """
        Test unauthorized access to recommendation endpoints
        """
        # Test without authentication
        response = self.client.get('/api/v1/recommendations/student/me/')
        self.assertEqual(response.status_code, 401)

        response = self.client.get('/api/v1/recommendations/stats/me/')
        self.assertEqual(response.status_code, 401)
    
    def test_permission_denied_other_student(self):
        """
        Test that students can't access other students' recommendations
        """
        # Create another student
        other_user = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Student',
            role='student'
        )
        
        other_profile = StudentProfile.objects.create(
            user=other_user,
            university='Other University',
            course='Engineering',
            year_of_study=1
        )
        
        # Login as first student and try to access other's recommendations
        self.client.login(email='student@test.com', password='testpass123')
        
        response = self.client.get(f'/api/v1/recommendations/student/{other_profile.id}/')
        self.assertEqual(response.status_code, 403)

        response = self.client.get(f'/api/v1/recommendations/stats/{other_profile.id}/')
        self.assertEqual(response.status_code, 403)
