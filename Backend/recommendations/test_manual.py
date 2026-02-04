#!/usr/bin/env python3
"""
Manual test script for recommendation system

Run this script to test the recommendation engine manually:
python recommendations/test_manual.py
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from recommendations.engine import get_student_recommendations, HostelRecommendationEngine
from accounts.models import StudentProfile, User
from hostels.models import Hostel

def test_recommendation_engine():
    """Test the recommendation engine with real data"""
    print("=== Testing Recommendation Engine ===")
    
    # Get a sample student
    try:
        student = StudentProfile.objects.first()
        if not student:
            print("❌ No students found in database")
            return
            
        print(f"✅ Testing with student: {student.user.get_full_name()} ({student.university})")
        
        # Test basic recommendations
        print("\n--- Testing Basic Recommendations ---")
        recommendations = get_student_recommendations(student.id, limit=5)
        
        if recommendations:
            print(f"✅ Found {len(recommendations)} recommendations")
            for i, rec in enumerate(recommendations[:3], 1):
                hostel = rec['hostel']
                print(f"\n{i}. {hostel['name']}")
                print(f"   Score: {rec['score']}")
                print(f"   Price: KES {hostel['base_price']}")
                print(f"   Rating: {hostel['rating']} ({hostel['review_count']} reviews)")
                print(f"   Reasons: {', '.join(rec['reasons'])}")
        else:
            print("❌ No recommendations found")
            
        # Test engine components
        print("\n--- Testing Engine Components ---")
        engine = HostelRecommendationEngine()
        
        # Test available hostels
        hostels = engine._get_available_hostels(student)
        print(f"✅ Found {len(hostels)} available hostels")
        
        if hostels:
            # Test content similarity
            content_scores = engine._calculate_content_similarity(student, hostels)
            print(f"✅ Calculated content scores for {len(content_scores)} hostels")
            
            # Test collaborative similarity
            collab_scores = engine._calculate_collaborative_similarity(student, hostels)
            print(f"✅ Calculated collaborative scores for {len(collab_scores)} hostels")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

def test_api_endpoints():
    """Test API endpoints (requires running server)"""
    print("\n=== Testing API Endpoints ===")
    print("Note: This requires the Django server to be running")
    print("Test these URLs in your browser or with curl:")
    
    # Get a sample student for URL examples
    student = StudentProfile.objects.first()
    if student:
        print(f"\nFor student {student.user.get_full_name()} (ID: {student.id}):")
        print(f"  GET http://localhost:8000/api/v1/recommendations/student/{student.id}/")
        print(f"  GET http://localhost:8000/api/v1/recommendations/student/me/")
        print(f"  GET http://localhost:8000/api/v1/recommendations/stats/{student.id}/")
        print(f"  GET http://localhost:8000/api/v1/recommendations/stats/me/")

def test_data_quality():
    """Test data quality for recommendations"""
    print("\n=== Testing Data Quality ===")
    
    # Check student data
    students = StudentProfile.objects.all()
    print(f"✅ Total students: {students.count()}")
    
    students_with_preferences = students.filter(lifestyle_preferences__isnull=False).exclude(lifestyle_preferences={})
    print(f"✅ Students with lifestyle preferences: {students_with_preferences.count()}")
    
    students_with_university = students.exclude(university__isnull=True).exclude(university='')
    print(f"✅ Students with university info: {students_with_university.count()}")
    
    # Check hostel data
    hostels = Hostel.objects.filter(status='active', is_verified=True)
    print(f"✅ Active verified hostels: {hostels.count()}")
    
    hostels_with_reviews = hostels.exclude(review_count=0)
    print(f"✅ Hostels with reviews: {hostels_with_reviews.count()}")
    
    # Check booking data
    from hostels.models import Booking
    bookings = Booking.objects.all()
    print(f"✅ Total bookings: {bookings.count()}")
    
    confirmed_bookings = bookings.filter(status='confirmed')
    print(f"✅ Confirmed bookings: {confirmed_bookings.count()}")

if __name__ == '__main__':
    print("🚀 Starting Recommendation System Tests")
    
    test_data_quality()
    test_recommendation_engine()
    test_api_endpoints()
    
    print("\n✅ Tests completed!")
    print("\nNext steps:")
    print("1. Run 'python manage.py test recommendations' for unit tests")
    print("2. Start the server and test API endpoints")
    print("3. Check recommendations in frontend integration")
