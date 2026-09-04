#!/usr/bin/env python
"""
Simple test script for roommate compatibility scoring system
Run this with: python test_compatibility.py
"""

import os
import sys
import django

# Add the Backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
django.setup()

from accounts.models import StudentProfile
from accounts.ml.compatibility_scorer import calculate_roommate_compatibility, find_roommate_matches

def test_compatibility_system():
    """Test the roommate compatibility scoring system"""
    print("Testing Roommate Compatibility Scoring System")
    print("=" * 60)
    
    # Check if we have students
    total_students = StudentProfile.objects.count()
    print(f"Total students in database: {total_students}")
    
    if total_students == 0:
        print("No students found. Please seed the database first.")
        return
    
    # Get students with lifestyle preferences
    students_with_prefs = StudentProfile.objects.filter(
        lifestyle_preferences__isnull=False
    ).exclude(lifestyle_preferences={})
    
    print(f"Students with lifestyle preferences: {students_with_prefs.count()}")
    
    if students_with_prefs.count() < 2:
        print("Need at least 2 students with lifestyle preferences for testing")
        return
    
    # Test 1: Pairwise compatibility
    print("\nTest 1: Pairwise Compatibility")
    print("-" * 40)
    
    student1 = students_with_prefs.first()
    student2 = students_with_prefs.exclude(id=student1.id).first()
    
    try:
        result = calculate_roommate_compatibility(student1.id, student2.id)
        
        print(f"Student 1: {student1.user.get_full_name()} (ID: {student1.id})")
        print(f"Student 2: {student2.user.get_full_name()} (ID: {student2.id})")
        print(f"Final Score: {result['final_score']}/100")
        
        print("\nComponent Breakdown:")
        for component, score in result['component_scores'].items():
            weight = result['weights_used'][component]
            if score is not None:
                print(f"  {component}: {score:.1f}/100 (weight: {weight*100:.0f}%)")
            else:
                print(f"  {component}: No data (weight: {weight*100:.0f}%)")
        
    except Exception as e:
        print(f"Error in pairwise compatibility: {e}")
    
    # Test 2: Top matches
    print("\nTest 2: Top Matches")
    print("-" * 40)
    
    try:
        matches = find_roommate_matches(student1.id, limit=5)
        
        print(f"Top 5 matches for {student1.user.get_full_name()}:")
        
        for i, match in enumerate(matches, 1):
            print(f"{i}. {match['student_name']} (ID: {match['student_id']})")
            print(f"   Score: {match['compatibility_score']}/100")
            
            # Show top 2 component scores
            sorted_components = sorted(
                match['component_scores'].items(),
                key=lambda x: x[1] if x[1] is not None else 0,
                reverse=True
            )[:2]
            
            print("   Best factors:")
            for component, score in sorted_components:
                if score is not None:
                    print(f"     - {component}: {score:.1f}/100")
            print()
        
    except Exception as e:
        print(f"Error in top matches: {e}")
    
    # Test 3: Sample lifestyle preferences
    print("\nTest 3: Sample Lifestyle Preferences")
    print("-" * 40)
    
    sample_student = students_with_prefs.first()
    prefs = sample_student.lifestyle_preferences or {}
    
    print(f"Sample preferences for {sample_student.user.get_full_name()}:")
    for key, value in list(prefs.items())[:10]:  # Show first 10 keys
        print(f"  {key}: {type(value).__name__} = {value}")
    
    print("\nTesting completed!")

if __name__ == "__main__":
    test_compatibility_system()
