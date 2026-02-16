"""
Smart Hostel Recommendation Engine

Implements personalized hostel recommendations for students using hybrid approach:
- Content-based filtering: student preferences ↔ hostel features
- Collaborative filtering: similar students' booking patterns
- Quality scoring: reviews and ratings integration
"""

import numpy as np
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.preprocessing import StandardScaler
from collections import defaultdict, Counter
from typing import List, Dict, Tuple, Optional
import logging

from django.db.models import Q, Count, Avg, Prefetch
from django.utils import timezone
from datetime import timedelta

from accounts.models import StudentProfile
from hostels.models import Hostel, Room, Booking, HostelAmenity, Amenity
from analytics.models import AnalyticsEvent

logger = logging.getLogger(__name__)


class HostelRecommendationEngine:
    """
    Hybrid recommendation engine combining content-based and collaborative filtering
    """
    
    def __init__(self):
        self.content_weight = 0.7  # Weight for content-based similarity
        self.collaborative_weight = 0.3  # Weight for collaborative filtering
        self.min_bookings_for_collaborative = 5  # Minimum bookings per student for collaborative filtering
        
    def get_recommendations_for_student(self, student_id: int, limit: int = 10) -> List[Dict]:
        """
        Get personalized hostel recommendations for a student
        
        Args:
            student_id: Student profile ID
            limit: Maximum number of recommendations to return
            
        Returns:
            List of recommendation dicts with hostel info and scores
        """
        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            logger.error(f"Student {student_id} not found")
            return []
            
        # Get all hostels with basic filtering
        hostels = self._get_available_hostels(student)
        if not hostels:
            return []
            
        # Calculate content-based scores
        content_scores = self._calculate_content_similarity(student, hostels)
        
        # Calculate collaborative scores (if enough data)
        collaborative_scores = self._calculate_collaborative_similarity(student, hostels)
        
        # Combine scores and rank
        final_scores = self._combine_scores(content_scores, collaborative_scores)
        
        # Build recommendation results
        recommendations = self._build_recommendations(student, hostels, final_scores, limit)
        
        return recommendations
    
    def _get_available_hostels(self, student: StudentProfile) -> List[Hostel]:
        """
        Get available hostels for student with basic filtering
        """
        queryset = Hostel.objects.filter(
            status='active',
            is_verified=True,
            available_rooms__gt=0
        ).select_related('landlord').prefetch_related(
            Prefetch('hostel_amenities', queryset=HostelAmenity.objects.filter(is_available=True))
        )
        
        # Filter by gender policy
        if student.user.gender == 'male':
            queryset = queryset.exclude(gender_policy='female_only')
        elif student.user.gender == 'female':
            queryset = queryset.exclude(gender_policy='male_only')
            
        # Filter by university proximity (if specified)
        if student.university:
            queryset = queryset.filter(
                Q(university__icontains=student.university) |
                Q(city__icontains=student.university)
            )
            
        return list(queryset)
    
    def _calculate_content_similarity(self, student: StudentProfile, hostels: List[Hostel]) -> Dict[int, float]:
        """
        Calculate content-based similarity scores between student and hostels
        """
        scores = {}
        
        for hostel in hostels:
            score = 0.0
            
            # University match (30% of content score)
            if student.university and hostel.university:
                if student.university.lower() in hostel.university.lower():
                    score += 0.3
                elif hostel.city.lower() in student.university.lower():
                    score += 0.15
                    
            # Price range compatibility (25% of content score)
            price_score = self._calculate_price_compatibility(student, hostel)
            score += price_score * 0.25
            
            # Amenities preference matching (25% of content score)
            amenity_score = self._calculate_amenity_compatibility(student, hostel)
            score += amenity_score * 0.25
            
            # Gender policy compatibility (10% of content score)
            if hostel.gender_policy == 'mixed':
                score += 0.1
            elif hostel.gender_policy == f"{student.user.gender}_only":
                score += 0.1
                
            # Quality score from reviews (10% of content score)
            quality_score = self._calculate_quality_score(hostel)
            score += quality_score * 0.1
            
            scores[hostel.id] = min(score, 1.0)  # Cap at 1.0
            
        return scores
    
    def _calculate_price_compatibility(self, student: StudentProfile, hostel: Hostel) -> float:
        """
        Calculate price compatibility score based on student's implied budget
        """
        # Extract price preference from lifestyle preferences if available
        max_price = None
        if student.lifestyle_preferences:
            try:
                max_price = student.lifestyle_preferences.get('max_monthly_rent')
                if max_price:
                    max_price = float(max_price)
            except (ValueError, TypeError):
                max_price = None
                
        # If no explicit preference, use university/year-based heuristics
        if not max_price:
            # Simple heuristic: higher years = higher budget tolerance
            base_budget = 15000  # Base monthly rent in KES
            if student.year_of_study:
                base_budget += (student.year_of_study - 1) * 2000
            max_price = base_budget
            
        # Calculate compatibility (0 = too expensive, 1 = well within budget)
        if hostel.base_price <= max_price * 0.8:
            return 1.0
        elif hostel.base_price <= max_price:
            return 0.7
        elif hostel.base_price <= max_price * 1.2:
            return 0.3
        else:
            return 0.0
    
    def _calculate_amenity_compatibility(self, student: StudentProfile, hostel: Hostel) -> float:
        """
        Calculate amenity preference compatibility
        """
        if not student.lifestyle_preferences:
            return 0.5  # Neutral score if no preferences
            
        preferred_amenities = student.lifestyle_preferences.get('preferred_amenities', [])
        if not isinstance(preferred_amenities, list):
            preferred_amenities = []
            
        # Get hostel amenities
        hostel_amenities = set()
        for hostel_amenity in hostel.hostel_amenities.all():
            hostel_amenities.add(hostel_amenity.amenity.name.lower())
            
        # Calculate match percentage
        if not preferred_amenities:
            return 0.5
            
        matches = 0
        for amenity in preferred_amenities:
            if amenity.lower() in hostel_amenities:
                matches += 1
                
        return matches / len(preferred_amenities) if preferred_amenities else 0.5
    
    def _calculate_quality_score(self, hostel: Hostel) -> float:
        """
        Calculate quality score from reviews and ratings
        """
        if hostel.review_count == 0:
            return 0.5  # Neutral score for new hostels
            
        # Normalize rating to 0-1 scale (5-star max)
        rating_score = float(hostel.rating) / 5.0
        
        # Apply review count confidence factor
        confidence = min(hostel.review_count / 10.0, 1.0)  # Cap at 10 reviews for full confidence
        
        return rating_score * confidence + (1 - confidence) * 0.5
    
    def _calculate_collaborative_similarity(self, student: StudentProfile, hostels: List[Hostel]) -> Dict[int, float]:
        """
        Calculate collaborative filtering scores based on similar students
        """
        scores = defaultdict(float)
        
        # Get student's booking history
        student_bookings = Booking.objects.filter(student=student).values_list('room__hostel_id', flat=True)
        if len(student_bookings) < 1:
            return dict(scores)  # No collaborative data for new students
            
        # Find similar students (same university, course, year)
        similar_students = StudentProfile.objects.filter(
            Q(university__iexact=student.university) | Q(course__iexact=student.course),
            year_of_study__in=[student.year_of_study - 1, student.year_of_study, student.year_of_study + 1]
        ).exclude(id=student.id)
        
        # Count hostel choices among similar students
        hostel_popularity = Counter()
        for similar_student in similar_students:
            similar_bookings = Booking.objects.filter(
                student=similar_student,
                status__in=['confirmed', 'checked_in', 'completed']
            ).values_list('room__hostel_id', flat=True)
            for hostel_id in similar_bookings:
                hostel_popularity[hostel_id] += 1
                
        # Normalize scores
        if hostel_popularity:
            max_popularity = max(hostel_popularity.values())
            for hostel_id, popularity in hostel_popularity.items():
                scores[hostel_id] = popularity / max_popularity
                
        return dict(scores)
    
    def _combine_scores(self, content_scores: Dict[int, float], collaborative_scores: Dict[int, float]) -> Dict[int, float]:
        """
        Combine content and collaborative scores using weighted average
        """
        combined_scores = {}
        
        all_hostel_ids = set(content_scores.keys()) | set(collaborative_scores.keys())
        
        for hostel_id in all_hostel_ids:
            content_score = content_scores.get(hostel_id, 0.0)
            collaborative_score = collaborative_scores.get(hostel_id, 0.0)
            
            combined_score = (
                self.content_weight * content_score +
                self.collaborative_weight * collaborative_score
            )
            
            combined_scores[hostel_id] = combined_score
            
        return combined_scores
    
    def _build_recommendations(self, student: StudentProfile, hostels: List[Hostel], 
                             scores: Dict[int, float], limit: int) -> List[Dict]:
        """
        Build final recommendation list with hostel details and reasoning
        """
        # Create hostel lookup
        hostel_lookup = {hostel.id: hostel for hostel in hostels}
        
        # Sort hostels by score
        sorted_hostel_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        
        recommendations = []
        for hostel_id in sorted_hostel_ids[:limit]:
            hostel = hostel_lookup[hostel_id]
            score = scores[hostel_id]
            
            recommendation = {
                'hostel': {
                    'id': hostel.id,
                    'name': hostel.name,
                    'description': hostel.description[:200] + '...' if len(hostel.description) > 200 else hostel.description,
                    'base_price': float(hostel.base_price),
                    'city': hostel.city,
                    'university': hostel.university,
                    'rating': float(hostel.rating),
                    'review_count': hostel.review_count,
                    'available_rooms': hostel.available_rooms,
                    'gender_policy': hostel.gender_policy,
                    'images': hostel.images[:3] if hostel.images else [],  # First 3 images
                },
                'score': round(score, 3),
                'reasons': self._generate_recommendation_reasons(student, hostel, score),
                'price_compatibility': self._get_price_compatibility_label(student, hostel),
            }
            
            recommendations.append(recommendation)
            
        return recommendations
    
    def _generate_recommendation_reasons(self, student: StudentProfile, hostel: Hostel, score: float) -> List[str]:
        """
        Generate human-readable reasons for recommendation
        """
        reasons = []
        
        # University match
        if student.university and hostel.university:
            if student.university.lower() in hostel.university.lower():
                reasons.append("Near your university")
                
        # Price compatibility
        price_score = self._calculate_price_compatibility(student, hostel)
        if price_score >= 0.8:
            reasons.append("Well within your budget")
        elif price_score >= 0.5:
            reasons.append("Affordable option")
            
        # Quality
        if hostel.rating >= 4.0 and hostel.review_count >= 5:
            reasons.append("Highly rated by students")
            
        # Availability
        if hostel.available_rooms >= 5:
            reasons.append("Good availability")
            
        # Gender policy
        if hostel.gender_policy == f"{student.user.gender}_only":
            reasons.append(f"{'Male' if student.user.gender == 'male' else 'Female'}-only accommodation")
            
        return reasons[:3]  # Top 3 reasons
    
    def _get_price_compatibility_label(self, student: StudentProfile, hostel: Hostel) -> str:
        """
        Get price compatibility label for display
        """
        score = self._calculate_price_compatibility(student, hostel)
        if score >= 0.8:
            return "Great Value"
        elif score >= 0.5:
            return "Affordable"
        elif score >= 0.3:
            return "Slightly Over Budget"
        else:
            return "Expensive"


def get_student_recommendations(student_id: int, limit: int = 10) -> List[Dict]:
    """
    Convenience function to get recommendations for a student
    """
    engine = HostelRecommendationEngine()
    return engine.get_recommendations_for_student(student_id, limit)
