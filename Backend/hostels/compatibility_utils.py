"""
Compatibility scoring algorithms for roommate matching
"""
import math
from typing import Dict, List, Tuple, Optional


class CompatibilityScorer:
    """
    High-quality roommate compatibility scoring algorithm
    """
    
    def __init__(self):
        # Weight factors for different compatibility aspects
        self.weights = {
            'gender_match': 30,      # Most important for shared rooms
            'course_match': 25,       # Academic compatibility
            'study_habits': 20,       # Study preferences alignment
            'lifestyle': 15,           # General lifestyle compatibility
            'budget_alignment': 10,      # Financial compatibility
        }
        self.base_score = 50  # Base score for all matches
    
    def calculate_student_compatibility(self, student1_data: Dict, 
                                  student2_data: Dict,
                                  room_data: Dict) -> Dict:
        """
        Calculate comprehensive compatibility score between two students
        
        Args:
            student1_data: Profile data for first student
            student2_data: Profile data for second student  
            room_data: Room information affecting compatibility
            
        Returns:
            Dictionary with detailed breakdown and final score
        """
        score_breakdown = {
            'base_score': self.base_score,
            'gender_match': 0,
            'course_match': 0,
            'study_habits': 0,
            'lifestyle': 0,
            'budget_alignment': 0,
            'final_score': 0,
            'details': []
        }
        
        # Gender matching (highest priority for shared rooms)
        score_breakdown['gender_match'] = self._calculate_gender_compatibility(
            student1_data, student2_data, room_data
        )
        
        # Course/academic compatibility
        score_breakdown['course_match'] = self._calculate_course_compatibility(
            student1_data, student2_data
        )
        
        # Study habits compatibility
        score_breakdown['study_habits'] = self._calculate_study_habits_compatibility(
            student1_data, student2_data
        )
        
        # General lifestyle compatibility
        score_breakdown['lifestyle'] = self._calculate_lifestyle_compatibility(
            student1_data, student2_data
        )
        
        # Budget alignment
        score_breakdown['budget_alignment'] = self._calculate_budget_compatibility(
            student1_data, student2_data
        )
        
        # Calculate weighted final score
        weighted_score = (
            score_breakdown['base_score'] +
            (score_breakdown['gender_match'] * self.weights['gender_match']) / 100 +
            (score_breakdown['course_match'] * self.weights['course_match']) / 100 +
            (score_breakdown['study_habits'] * self.weights['study_habits']) / 100 +
            (score_breakdown['lifestyle'] * self.weights['lifestyle']) / 100 +
            (score_breakdown['budget_alignment'] * self.weights['budget_alignment']) / 100
        )
        
        # Ensure score stays within bounds
        score_breakdown['final_score'] = max(0, min(100, int(weighted_score)))
        
        return score_breakdown
    
    def _calculate_gender_compatibility(self, student1: Dict, student2: Dict, room: Dict) -> int:
        """
        Calculate gender compatibility based on room type and gender policies
        """
        if room.get('capacity', 1) == 1:  # Single room
            return 100  # Gender doesn't matter for single rooms
        
        room_gender_policy = room.get('gender_policy', 'mixed')
        s1_gender = student1.get('gender', '').lower()
        s2_gender = student2.get('gender', '').lower()
        
        if room_gender_policy == 'mixed':
            if s1_gender == s2_gender:
                return 100
            else:
                return 85  # Mixed rooms allow some gender flexibility
        elif room_gender_policy == 'male' and s1_gender == 'male' and s2_gender == 'male':
            return 100
        elif room_gender_policy == 'female' and s1_gender == 'female' and s2_gender == 'female':
            return 100
        else:
            return 0  # Gender mismatch for gender-specific rooms
    
    def _calculate_course_compatibility(self, student1: Dict, student2: Dict) -> int:
        """
        Calculate academic compatibility based on courses
        """
        s1_course = (student1.get('course_of_study') or '').lower().strip()
        s2_course = (student2.get('course_of_study') or '').lower().strip()
        
        if not s1_course or not s2_course:
            return 50  # Neutral if course info missing
        
        if s1_course == s2_course:
            return 100  # Exact match
        
        # Check for related courses (same faculty/school)
        s1_words = set(s1_course.split())
        s2_words = set(s2_course.split())
        
        # Calculate similarity based on word overlap
        common_words = s1_words & s2_words
        total_words = s1_words | s2_words
        
        if total_words:
            similarity = len(common_words) / len(total_words)
            return int(50 + similarity * 50)  # 50-100 range
        
        return 50  # Default if no clear similarity
    
    def _calculate_study_habits_compatibility(self, student1: Dict, student2: Dict) -> int:
        """
        Calculate compatibility based on study habits and preferences
        """
        s1_habits = student1.get('study_preferences', {})
        s2_habits = student2.get('study_preferences', {})
        
        if not s1_habits or not s2_habits:
            return 50
        
        # Compare key study preference factors
        factors_to_compare = [
            'study_time_preference',  # Morning/night person
            'noise_tolerance',        # Study noise preferences
            'social_study_preference', # Social vs solitary study
            'cleanliness_importance',  # Cleanliness standards
        ]
        
        compatibility_scores = []
        
        for factor in factors_to_compare:
            s1_val = str(s1_habits.get(factor, '')).lower()
            s2_val = str(s2_habits.get(factor, '')).lower()
            
            if s1_val and s2_val:
                if s1_val == s2_val:
                    compatibility_scores.append(100)
                elif self._are_similar_preferences(s1_val, s2_val, factor):
                    compatibility_scores.append(75)
                else:
                    compatibility_scores.append(25)
            else:
                compatibility_scores.append(50)  # Neutral if missing data
        
        return int(sum(compatibility_scores) / len(compatibility_scores)) if compatibility_scores else 50
    
    def _are_similar_preferences(self, pref1: str, pref2: str, factor: str) -> bool:
        """
        Check if two preferences are similar based on factor type
        """
        similar_groups = {
            'study_time_preference': {
                'morning': ['early', 'morning', 'day'],
                'night': ['evening', 'night', 'late'],
            },
            'noise_tolerance': {
                'quiet': ['silent', 'very_quiet', 'minimal'],
                'moderate': ['normal', 'average', 'ok'],
                'high': ['loud', 'noisy', 'flexible'],
            },
            'social_study_preference': {
                'solo': ['individual', 'alone', 'independent'],
                'group': ['social', 'collaborative', 'team'],
            },
            'cleanliness_importance': {
                'high': ['very_clean', 'spotless', 'strict'],
                'moderate': ['clean', 'tidy', 'reasonable'],
                'low': ['relaxed', 'flexible', 'casual'],
            },
        }
        
        if factor in similar_groups:
            for group_name, similar_values in similar_groups.items():
                if pref1 in group_name and pref2 in similar_values:
                    return True
                elif pref2 in group_name and pref1 in similar_values:
                    return True
        
        return False
    
    def _calculate_lifestyle_compatibility(self, student1: Dict, student2: Dict) -> int:
        """
        Calculate general lifestyle compatibility
        """
        s1_profile = student1.get('lifestyle_preferences', {})
        s2_profile = student2.get('lifestyle_preferences', {})
        
        if not s1_profile or not s2_profile:
            return 50
        
        # Compare lifestyle factors
        lifestyle_factors = [
            'sleep_schedule',        # Sleep patterns
            'social_preferences',      # Social vs private
            'substance_use',         # Smoking/drinking preferences
            'guest_policy',          # Guest tolerance
            'activity_level',         # Active vs sedentary
        ]
        
        compatibility_scores = []
        
        for factor in lifestyle_factors:
            s1_val = str(s1_profile.get(factor, '')).lower()
            s2_val = str(s2_profile.get(factor, '')).lower()
            
            if s1_val and s2_val:
                if s1_val == s2_val:
                    compatibility_scores.append(100)
                elif self._are_compatible_lifestyle(s1_val, s2_val, factor):
                    compatibility_scores.append(80)
                else:
                    compatibility_scores.append(30)
            else:
                compatibility_scores.append(50)
        
        return int(sum(compatibility_scores) / len(compatibility_scores)) if compatibility_scores else 50
    
    def _are_compatible_lifestyle(self, pref1: str, pref2: str, factor: str) -> bool:
        """
        Check if two lifestyle preferences are compatible
        """
        compatible_combinations = {
            'sleep_schedule': {
                'early': ['early', 'mixed'],
                'late': ['late', 'mixed'],
                'mixed': ['early', 'late', 'mixed'],
            },
            'social_preferences': {
                'social': ['social', 'mixed'],
                'private': ['private', 'mixed'],
                'mixed': ['social', 'private', 'mixed'],
            },
            'substance_use': {
                'none': ['none', 'occasional'],
                'occasional': ['none', 'occasional', 'regular'],
                'regular': ['regular', 'occasional'],
            },
            'guest_policy': {
                'strict': ['strict', 'moderate'],
                'moderate': ['strict', 'moderate', 'flexible'],
                'flexible': ['moderate', 'flexible'],
            },
            'activity_level': {
                'active': ['active', 'moderate'],
                'moderate': ['active', 'sedentary', 'moderate'],
                'sedentary': ['moderate', 'sedentary'],
            },
        }
        
        if factor in compatible_combinations:
            return pref2 in compatible_combinations[factor].get(pref1, [])
        
        return False
    
    def _calculate_budget_compatibility(self, student1: Dict, student2: Dict) -> int:
        """
        Calculate budget compatibility between students
        """
        s1_budget = student1.get('budget_range', {})
        s2_budget = student2.get('budget_range', {})
        
        if not s1_budget or not s2_budget:
            return 50
        
        s1_min = s1_budget.get('min', 0)
        s1_max = s1_budget.get('max', 0)
        s2_min = s2_budget.get('min', 0)
        s2_max = s2_budget.get('max', 0)
        
        # Calculate overlap between budget ranges
        overlap_min = max(s1_min, s2_min)
        overlap_max = min(s1_max, s2_max)
        
        if overlap_min <= overlap_max:
            overlap_size = overlap_max - overlap_min + 1
            s1_range_size = s1_max - s1_min + 1
            s2_range_size = s2_max - s2_min + 1
            
            # Calculate percentage overlap
            overlap_percentage = min(
                overlap_size / s1_range_size,
                overlap_size / s2_range_size
            ) * 100
            
            return int(overlap_percentage)
        
        return 0  # No budget overlap


def calculate_room_compatibility(student1_data: Dict, 
                           student2_data: Dict, 
                           room_data: Dict) -> Dict:
    """
    High-level function to calculate compatibility score
    
    Args:
        student1_data: First student's profile data
        student2_data: Second student's profile data  
        room_data: Room information
        
    Returns:
        Compatibility score with breakdown
    """
    scorer = CompatibilityScorer()
    return scorer.calculate_student_compatibility(student1_data, student2_data, room_data)