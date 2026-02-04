"""
Roommate Compatibility Scoring System

Basic ML-powered compatibility scoring for roommate matching using:
- Dynamic JSON preference similarity (flexible key handling)
- Categorical similarity (course, university, gender)
- Text similarity (TF-IDF on bios)
- Weighted combination: lifestyle 40%, academic 30%, personal 20%, demographics 10%
"""

from typing import Dict, List, Tuple, Optional, Any, Union
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
from datetime import datetime
from django.db.models import Model
import json
from collections import defaultdict


class RoommateCompatibilityScorer:
    """
    Flexible roommate compatibility scorer using weighted feature similarity
    """
    
    def __init__(self):
        # Exact baseline weights (sum to 1.0)
        self.weights = {
            'lifestyle': 0.4,      # JSON preferences
            'academic': 0.3,       # Course, university, year
            'personal': 0.2,        # Bio text similarity
            'demographics': 0.1,    # Age, gender
        }
        
        # Initialize TF-IDF vectorizer for bios
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            lowercase=True,
            ngram_range=(1, 2)
        )
        
    def extract_features(self, student_profile) -> Dict[str, Any]:
        """
        Extract all features from a StudentProfile for compatibility scoring
        
        Args:
            student_profile: StudentProfile instance
            
        Returns:
            Dictionary with extracted features
        """
        user = student_profile.user
        
        features = {
            'student_id': student_profile.id,
            'course': student_profile.course or '',
            'university': student_profile.university or '',
            'bio': student_profile.bio or '',
            'year_of_study': student_profile.year_of_study or 0,
            'gender': user.gender or '',
            'age': self._calculate_age(user.date_of_birth) if user.date_of_birth else 0,
            'lifestyle_preferences': student_profile.lifestyle_preferences or {},
        }
        
        return features
    
    def calculate_compatibility_score(self, student1_profile, student2_profile) -> Dict[str, Any]:
        """
        Calculate comprehensive compatibility score between two students
        
        Args:
            student1_profile: First StudentProfile instance
            student2_profile: Second StudentProfile instance
            
        Returns:
            Dictionary with final score and detailed breakdown
        """
        # Extract features
        features1 = self.extract_features(student1_profile)
        features2 = self.extract_features(student2_profile)
        
        # Calculate individual component scores (0-100)
        component_scores = {
            'lifestyle': self._calculate_lifestyle_similarity(
                features1['lifestyle_preferences'], features2['lifestyle_preferences']
            ),
            'academic': self._calculate_academic_similarity(features1, features2),
            'personal': self._calculate_personal_similarity(
                features1['bio'], features2['bio']
            ),
            'demographics': self._calculate_demographic_similarity(features1, features2),
        }
        
        # Calculate weighted final score
        final_score = 0
        for component, score in component_scores.items():
            weight = self.weights[component]
            if score is not None:  # Only include non-None scores
                final_score += score * weight
        
        # Ensure score is within bounds
        final_score = max(0, min(100, final_score))
        
        return {
            'final_score': round(final_score, 1),
            'component_scores': component_scores,
            'weights_used': self.weights,
            'student1_id': features1['student_id'],
            'student2_id': features2['student_id'],
        }
    
    def _calculate_lifestyle_similarity(self, prefs1: Dict, prefs2: Dict) -> Optional[float]:
        """
        Calculate lifestyle preference similarity with flexible JSON handling
        
        Args:
            prefs1, prefs2: Lifestyle preference dictionaries
            
        Returns:
            Similarity score 0-100 or None if no data
        """
        if not prefs1 and not prefs2:
            return None
        if not prefs1 or not prefs2:
            return 50  # Neutral if one has no preferences
        
        # Collect all keys from both preferences
        all_keys = set(prefs1.keys()) | set(prefs2.keys())
        
        if not all_keys:
            return None
        
        similarity_scores = []
        
        for key in all_keys:
            val1 = prefs1.get(key)
            val2 = prefs2.get(key)
            
            # Skip if both values are None/empty
            if val1 is None and val2 is None:
                continue
            if val1 is None or val2 is None:
                # One has preference, other doesn't - neutral score
                similarity_scores.append(50)
                continue
            
            # Calculate similarity based on value types
            similarity = self._calculate_value_similarity(val1, val2)
            similarity_scores.append(similarity)
        
        if not similarity_scores:
            return None
            
        return np.mean(similarity_scores)
    
    def _calculate_value_similarity(self, val1: Any, val2: Any) -> float:
        """
        Calculate similarity between two values based on their types
        """
        # Handle different data types
        if isinstance(val1, (list, tuple)) and isinstance(val2, (list, tuple)):
            return self._list_similarity(val1, val2)
        elif isinstance(val1, dict) and isinstance(val2, dict):
            return self._dict_similarity(val1, val2)
        elif isinstance(val1, str) and isinstance(val2, str):
            return self._text_similarity(val1, val2)
        elif isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
            return self._numeric_similarity(val1, val2)
        else:
            # Convert to string and compare
            return self._text_similarity(str(val1), str(val2))
    
    def _list_similarity(self, list1: List, list2: List) -> float:
        """
        Calculate Jaccard similarity between two lists
        """
        set1 = set(str(item).lower() for item in list1)
        set2 = set(str(item).lower() for item in list2)
        
        if not set1 and not set2:
            return 100
        if not set1 or not set2:
            return 0
        
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        
        if not union:
            return 0
        
        return (len(intersection) / len(union)) * 100
    
    def _dict_similarity(self, dict1: Dict, dict2: Dict) -> float:
        """
        Calculate similarity between two dictionaries (recursive)
        """
        all_keys = set(dict1.keys()) | set(dict2.keys())
        
        if not all_keys:
            return 100
        
        similarities = []
        for key in all_keys:
            val1 = dict1.get(key)
            val2 = dict2.get(key)
            
            if val1 is None and val2 is None:
                continue
            if val1 is None or val2 is None:
                similarities.append(50)
            else:
                similarities.append(self._calculate_value_similarity(val1, val2))
        
        return np.mean(similarities) if similarities else 100
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate text similarity using simple word overlap
        """
        if not text1 and not text2:
            return 100
        if not text1 or not text2:
            return 0
        
        # Simple word overlap for now (can be upgraded to TF-IDF)
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 100
        if not words1 or not words2:
            return 0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if not union:
            return 0
        
        return (len(intersection) / len(union)) * 100
    
    def _numeric_similarity(self, num1: Union[int, float], num2: Union[int, float]) -> float:
        """
        Calculate similarity between two numbers (inverse of normalized difference)
        """
        if num1 == num2:
            return 100
        
        # Handle zero values
        if num1 == 0 or num2 == 0:
            max_val = max(abs(num1), abs(num2))
            if max_val == 0:
                return 100
            diff = abs(num1 - num2)
            similarity = max(0, 100 - (diff / max_val) * 100)
            return similarity
        
        # Calculate relative difference
        max_val = max(abs(num1), abs(num2))
        diff = abs(num1 - num2)
        similarity = max(0, 100 - (diff / max_val) * 100)
        
        return similarity
    
    def _calculate_academic_similarity(self, features1: Dict, features2: Dict) -> float:
        """
        Calculate academic similarity based on course, university, and year
        """
        # Course similarity (40% of academic)
        course_sim = self._categorical_similarity(
            features1['course'], features2['course']
        )
        
        # University similarity (40% of academic)
        university_sim = self._categorical_similarity(
            features1['university'], features2['university']
        )
        
        # Year of study similarity (20% of academic)
        year_sim = self._year_similarity(
            features1['year_of_study'], features2['year_of_study']
        )
        
        # Weighted combination
        academic_score = (course_sim * 0.4 + university_sim * 0.4 + year_sim * 0.2)
        return academic_score
    
    def _calculate_personal_similarity(self, bio1: str, bio2: str) -> Optional[float]:
        """
        Calculate personal similarity based on bio text
        """
        if not bio1 and not bio2:
            return None
        if not bio1 or not bio2:
            return 0
        
        try:
            # Use TF-IDF for bio similarity
            corpus = [bio1, bio2]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return similarity * 100
        except Exception:
            # Fallback to simple text similarity
            return self._text_similarity(bio1, bio2)
    
    def _calculate_demographic_similarity(self, features1: Dict, features2: Dict) -> float:
        """
        Calculate demographic similarity (age and gender)
        """
        # Gender similarity (50% of demographics)
        gender_sim = self._gender_similarity(features1['gender'], features2['gender'])
        
        # Age similarity (50% of demographics)
        age_sim = self._age_similarity(features1['age'], features2['age'])
        
        return (gender_sim * 0.5 + age_sim * 0.5)
    
    def _categorical_similarity(self, value1: str, value2: str) -> float:
        """
        Calculate similarity between two categorical values
        """
        if not value1 and not value2:
            return 100
        if not value1 or not value2:
            return 0
        
        value1 = value1.lower().strip()
        value2 = value2.lower().strip()
        
        if value1 == value2:
            return 100
        
        # Check for partial matches (word overlap)
        words1 = set(value1.split())
        words2 = set(value2.split())
        
        if words1 and words2:
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            if union:
                overlap_ratio = len(intersection) / len(union)
                return overlap_ratio * 100
        
        return 0
    
    def _year_similarity(self, year1: int, year2: int) -> float:
        """
        Calculate year of study similarity
        """
        if year1 <= 0 or year2 <= 0:
            return 0
        
        if year1 == year2:
            return 100
        
        # Close years are more similar
        diff = abs(year1 - year2)
        if diff == 1:
            return 80
        elif diff == 2:
            return 60
        elif diff == 3:
            return 40
        else:
            return 20
    
    def _gender_similarity(self, gender1: str, gender2: str) -> float:
        """
        Calculate gender similarity
        """
        if not gender1 and not gender2:
            return 100
        if not gender1 or not gender2:
            return 50
        
        gender1 = gender1.lower().strip()
        gender2 = gender2.lower().strip()
        
        if gender1 == gender2:
            return 100
        elif 'prefer_not_to_say' in [gender1, gender2] or 'other' in [gender1, gender2]:
            return 75
        else:
            return 60  # Different genders but still compatible
    
    def _age_similarity(self, age1: int, age2: int) -> float:
        """
        Calculate age similarity (closer ages = higher similarity)
        """
        if age1 <= 0 or age2 <= 0:
            return 0
        
        if age1 == age2:
            return 100
        
        age_diff = abs(age1 - age2)
        
        if age_diff <= 1:
            return 95
        elif age_diff <= 2:
            return 85
        elif age_diff <= 3:
            return 70
        elif age_diff <= 5:
            return 50
        elif age_diff <= 7:
            return 30
        else:
            return 10
    
    def _calculate_age(self, date_of_birth) -> int:
        """
        Calculate age from date of birth
        """
        if not date_of_birth:
            return 0
        
        today = datetime.now().date()
        age = today.year - date_of_birth.year
        
        # Adjust if birthday hasn't occurred yet this year
        if today.month < date_of_birth.month or \
           (today.month == date_of_birth.month and today.day < date_of_birth.day):
            age -= 1
        
        return age
    
    def find_top_matches(self, target_student_profile, candidate_profiles, limit: int = 10) -> List[Dict]:
        """
        Find top roommate matches for a target student
        
        Args:
            target_student_profile: StudentProfile to find matches for
            candidate_profiles: QuerySet of StudentProfile candidates
            limit: Maximum number of matches to return
            
        Returns:
            List of matches sorted by compatibility score
        """
        matches = []
        
        for candidate in candidate_profiles:
            # Skip self-matching
            if candidate.id == target_student_profile.id:
                continue
            
            compatibility_result = self.calculate_compatibility_score(
                target_student_profile, candidate
            )
            
            matches.append({
                'student_id': candidate.id,
                'student_name': candidate.user.get_full_name(),
                'compatibility_score': compatibility_result['final_score'],
                'component_scores': compatibility_result['component_scores'],
            })
        
        # Sort by compatibility score (descending)
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return matches[:limit]


# Global scorer instance
scorer = RoommateCompatibilityScorer()


def calculate_roommate_compatibility(student1_id: int, student2_id: int) -> Dict[str, Any]:
    """
    Convenience function to calculate compatibility between two students by ID
    
    Args:
        student1_id: ID of first student
        student2_id: ID of second student
        
    Returns:
        Compatibility result dictionary
    """
    from accounts.models import StudentProfile
    
    try:
        student1 = StudentProfile.objects.get(id=student1_id)
        student2 = StudentProfile.objects.get(id=student2_id)
        return scorer.calculate_compatibility_score(student1, student2)
    except StudentProfile.DoesNotExist:
        raise ValueError(f"Student not found: {student1_id} or {student2_id}")


def find_roommate_matches(student_id: int, limit: int = 10) -> List[Dict]:
    """
    Convenience function to find top roommate matches for a student by ID
    
    Args:
        student_id: ID of student to find matches for
        limit: Maximum number of matches to return
        
    Returns:
        List of match dictionaries
    """
    from accounts.models import StudentProfile
    
    try:
        target_student = StudentProfile.objects.get(id=student_id)
        candidates = StudentProfile.objects.exclude(id=student_id)
        return scorer.find_top_matches(target_student, candidates, limit)
    except StudentProfile.DoesNotExist:
        raise ValueError(f"Student not found: {student_id}")
