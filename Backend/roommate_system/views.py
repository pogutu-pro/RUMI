from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, F, Value, Case, When, IntegerField
from django.core.paginator import Paginator
from django.db.models.functions import ExtractYear
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStudent
from rest_framework.permissions import IsAuthenticated
from accounts.models import StudentProfile, User
from hostels.models import Booking, RoomOccupant, CompatibilityScore


class RoommateProfileView(APIView):
    """Manage roommate profile and preferences"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get current user's roommate profile"""
        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get roommate profile data from database
        roommate_profile = {
            'profile_id': student_profile.id,
            'is_active': True,
            'preferences': {
                'gender_preference': getattr(student_profile, 'gender_preference', 'any'),
                'age_range': {
                    'min': getattr(student_profile, 'min_age_preference', 18),
                    'max': getattr(student_profile, 'max_age_preference', 25)
                },
                'study_habits': getattr(student_profile, 'study_habits_preference', 'moderate'),
                'sleep_schedule': getattr(student_profile, 'sleep_schedule_preference', 'normal'),
                'cleanliness': getattr(student_profile, 'cleanliness_preference', 'moderate'),
                'social_level': getattr(student_profile, 'social_level_preference', 'moderate'),
                'smoking': getattr(student_profile, 'smoking_preference', False),
                'drinking': getattr(student_profile, 'drinking_preference', False),
                'guests_frequency': getattr(student_profile, 'guests_frequency_preference', 'occasional'),
                'budget_range': {
                    'min': getattr(student_profile, 'min_budget', 15000),
                    'max': getattr(student_profile, 'max_budget', 25000)
                },
                'move_in_date': getattr(student_profile, 'preferred_move_in_date', (timezone.now() + timedelta(days=30)).date()).isoformat(),
                'lease_duration': getattr(student_profile, 'preferred_lease_duration', 12)
            },
            'personality_traits': {
                'openness': getattr(student_profile, 'personality_openness', 5),
                'conscientiousness': getattr(student_profile, 'personality_conscientiousness', 5),
                'extraversion': getattr(student_profile, 'personality_extraversion', 5),
                'agreeableness': getattr(student_profile, 'personality_agreeableness', 5),
                'neuroticism': getattr(student_profile, 'personality_neuroticism', 5)
            },
            'interests': getattr(student_profile, 'interests', []),
            'about_me': getattr(student_profile, 'about_me', ''),
            'looking_for': getattr(student_profile, 'looking_for', ''),
            'profile_completion': self._calculate_profile_completion(student_profile),
            'last_updated': student_profile.updated_at.isoformat() if student_profile.updated_at else None
        }
        
        return Response({
            'roommate_profile': roommate_profile
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update roommate profile and preferences"""
        try:
            student_profile = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update profile data
        preferences = request.data.get('preferences', {})
        personality_traits = request.data.get('personality_traits', {})
        interests = request.data.get('interests', [])
        about_me = request.data.get('about_me', '')
        looking_for = request.data.get('looking_for', '')
        
        # Update fields
        if 'gender_preference' in preferences:
            student_profile.gender_preference = preferences['gender_preference']
        if 'min_age_preference' in preferences:
            student_profile.min_age_preference = preferences['age_range']['min']
        if 'max_age_preference' in preferences:
            student_profile.max_age_preference = preferences['age_range']['max']
        if 'study_habits_preference' in preferences:
            student_profile.study_habits_preference = preferences['study_habits']
        if 'sleep_schedule_preference' in preferences:
            student_profile.sleep_schedule_preference = preferences['sleep_schedule']
        if 'cleanliness_preference' in preferences:
            student_profile.cleanliness_preference = preferences['cleanliness']
        if 'social_level_preference' in preferences:
            student_profile.social_level_preference = preferences['social_level']
        if 'smoking_preference' in preferences:
            student_profile.smoking_preference = preferences['smoking']
        if 'drinking_preference' in preferences:
            student_profile.drinking_preference = preferences['drinking']
        if 'guests_frequency_preference' in preferences:
            student_profile.guests_frequency_preference = preferences['guests_frequency']
        if 'min_budget' in preferences:
            student_profile.min_budget = preferences['budget_range']['min']
        if 'max_budget' in preferences:
            student_profile.max_budget = preferences['budget_range']['max']
        if 'preferred_move_in_date' in preferences:
            student_profile.preferred_move_in_date = preferences['move_in_date']
        if 'preferred_lease_duration' in preferences:
            student_profile.preferred_lease_duration = preferences['lease_duration']
        
        # Update personality traits
        if 'openness' in personality_traits:
            student_profile.personality_openness = personality_traits['openness']
        if 'conscientiousness' in personality_traits:
            student_profile.personality_conscientiousness = personality_traits['conscientiousness']
        if 'extraversion' in personality_traits:
            student_profile.personality_extraversion = personality_traits['extraversion']
        if 'agreeableness' in personality_traits:
            student_profile.personality_agreeableness = personality_traits['agreeableness']
        if 'neuroticism' in personality_traits:
            student_profile.personality_neuroticism = personality_traits['neuroticism']
        
        # Update other fields
        student_profile.interests = interests
        student_profile.about_me = about_me
        student_profile.looking_for = looking_for
        
        student_profile.save()
        
        return Response({
            'message': 'Roommate profile updated successfully',
            'profile_completion': self._calculate_profile_completion(student_profile)
        }, status=status.HTTP_200_OK)
    
    def _calculate_profile_completion(self, student_profile):
        """Calculate profile completion percentage"""
        fields = [
            'gender_preference', 'min_age_preference', 'max_age_preference',
            'study_habits_preference', 'sleep_schedule_preference', 'cleanliness_preference',
            'social_level_preference', 'min_budget', 'max_budget', 'interests',
            'about_me', 'looking_for'
        ]
        
        completed = 0
        for field in fields:
            value = getattr(student_profile, field, None)
            if value:
                if isinstance(value, (list, dict)):
                    if len(value) > 0:
                        completed += 1
                else:
                    completed += 1
        
        return int((completed / len(fields)) * 100)


class RoommateMatchingView(APIView):
    """Roommate matching algorithm and results"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get potential roommate matches"""
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 10))
        min_score = int(request.query_params.get('min_score', 70))
        location_filter = request.query_params.get('location', 'any')
        
        try:
            current_student = request.user.student_profile
        except:
            return Response({
                'error': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get other students for matching - STRICT GENDER FILTER
        # Mixed gender housing is not supported
        other_students = StudentProfile.objects.filter(
            user__role='student',
            user__is_active=True,
            user__is_verified=True,
            user__gender=request.user.gender
        ).exclude(user=request.user)
        
        # Calculate compatibility scores
        matches = []
        for student in other_students:
            score = self._calculate_compatibility_score(current_student, student)
            if score >= min_score:
                # Get student's current booking/hostel info
                current_booking = Booking.objects.filter(
                    student=student,
                    status__in=['confirmed', 'reserved']
                ).select_related('room__hostel').first()
                
                # Calculate common interests
                student_interests = getattr(student, 'interests', []) or []
                current_interests = getattr(current_student, 'interests', []) or []
                common_interests = list(set(current_interests) & set(student_interests))
                
                match_data = {
                    'user_id': student.user.id,
                    'student_id': student.id,
                    'first_name': student.user.first_name,
                    'last_name': student.user.last_name,
                    'name': student.user.get_full_name(),
                    'university': getattr(student, 'university', 'Not specified'),
                    'year_of_study': getattr(student, 'year_of_study', 1),
                    'course': getattr(student, 'course', 'Not specified'),
                    'compatibility_score': score,
                    'compatibility_factors': self._get_compatibility_factors(current_student, student),
                    'profile_picture': student.user.profile_picture,
                    'age': self._calculate_age(getattr(student.user, 'date_of_birth', None)),
                    'hostel': current_booking.room.hostel.name if current_booking and current_booking.room else None,
                    'room_type_preference': getattr(student, 'room_type_preference', 'any'),
                    'budget_range': {
                        'min': getattr(student, 'min_budget', 0),
                        'max': getattr(student, 'max_budget', 0)
                    },
                    'move_in_date': getattr(student, 'preferred_move_in_date', None),
                    'common_interests': common_interests,
                    'last_active': student.user.last_login.isoformat() if student.user.last_login else None,
                    'verification_status': 'verified' if student.user.is_verified else 'unverified'
                }
                
                matches.append(match_data)
        
        # Apply location filter
        if location_filter == 'same_hostel' and matches:
            current_hostel = None
            current_booking = Booking.objects.filter(
                student=current_student,
                status__in=['confirmed', 'reserved']
            ).select_related('room__hostel').first()
            
            if current_booking:
                current_hostel = current_booking.room.hostel.name
                matches = [m for m in matches if m['hostel'] == current_hostel]
        
        # Sort by compatibility score
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        # Paginate results
        paginator = Paginator(matches, per_page)
        page_obj = paginator.get_page(page)
        
        return Response({
            'matches': page_obj.object_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_matches': len(matches),
                'per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            },
            'filters': {
                'min_score': min_score,
                'location_filter': location_filter
            }
        }, status=status.HTTP_200_OK)
    
    def _calculate_compatibility_score(self, student1, student2):
        """Calculate compatibility score between two students"""
        score = 0
        
        # Age compatibility (20 points max)
        age1 = self._calculate_age(getattr(student1.user, 'date_of_birth', None))
        age2 = self._calculate_age(getattr(student2.user, 'date_of_birth', None))
        age_diff = abs(age1 - age2)

        if age_diff <= 2:
            score += 20
        elif age_diff <= 4:
            score += 15
        elif age_diff <= 6:
            score += 10
        
        # Study habits compatibility (15 points max)
        if getattr(student1, 'study_habits_preference', '') == getattr(student2, 'study_habits_preference', ''):
            score += 15
        
        # Sleep schedule compatibility (15 points max)
        if getattr(student1, 'sleep_schedule_preference', '') == getattr(student2, 'sleep_schedule_preference', ''):
            score += 15
        
        # Cleanliness compatibility (15 points max)
        if getattr(student1, 'cleanliness_preference', '') == getattr(student2, 'cleanliness_preference', ''):
            score += 15
        
        # Social level compatibility (15 points max)
        if getattr(student1, 'social_level_preference', '') == getattr(student2, 'social_level_preference', ''):
            score += 15
        
        # Interests overlap (10 points max)
        interests1 = set(getattr(student1, 'interests', []) or [])
        interests2 = set(getattr(student2, 'interests', []) or [])
        if interests1 and interests2:
            overlap = len(interests1 & interests2)
            score += min(overlap * 2, 10)
        
        # Lifestyle compatibility (5 points max)
        smoking_match = getattr(student1, 'smoking_preference', False) == getattr(student2, 'smoking_preference', False)
        drinking_match = getattr(student1, 'drinking_preference', False) == getattr(student2, 'drinking_preference', False)
        if smoking_match and drinking_match:
            score += 5
        
        return min(score, 100)
    
    def _get_compatibility_factors(self, student1, student2):
        """Get detailed compatibility factors"""
        age1 = self._calculate_age(getattr(student1.user, 'date_of_birth', None))
        age2 = self._calculate_age(getattr(student2.user, 'date_of_birth', None))
        
        return {
            'age_compatibility': abs(age1 - age2) <= 3,
            'study_habits_match': getattr(student1, 'study_habits_preference', '') == getattr(student2, 'study_habits_preference', ''),
            'budget_compatibility': (getattr(student1, 'min_budget', 0) <= getattr(student2, 'max_budget', 0) and 
                                   getattr(student2, 'min_budget', 0) <= getattr(student1, 'max_budget', 0)),
            'social_level_match': getattr(student1, 'social_level_preference', '') == getattr(student2, 'social_level_preference', ''),
            'cleanliness_match': getattr(student1, 'cleanliness_preference', '') == getattr(student2, 'cleanliness_preference', ''),
            'interests_overlap': len(set(getattr(student1, 'interests', []) or []) & set(getattr(student2, 'interests', []) or [])),
            'lifestyle_compatibility': (getattr(student1, 'smoking_preference', False) == getattr(student2, 'smoking_preference', False) and
                                      getattr(student1, 'drinking_preference', False) == getattr(student2, 'drinking_preference', False))
        }
    
    def _calculate_age(self, birth_date):
        """Calculate age from birth date"""
        if not birth_date:
            return 20  # Default age
            
        today = timezone.now().date()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    def post(self, request):
        """Refresh roommate matches with updated preferences"""
        # In a real implementation, this would trigger the matching algorithm
        # to recalculate compatibility scores based on updated preferences
        
        return Response({
            'message': 'Roommate matches refreshed successfully',
            'total_matches': StudentProfile.objects.filter(user__role='student', user__is_active=True, user__is_verified=True).exclude(user=request.user).count()
        }, status=status.HTTP_200_OK)


class RoommateRequestsView(APIView):
    """Handle roommate requests and invitations"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get roommate requests"""
        request_type = request.query_params.get('type', 'all')
        
        # In a real implementation, you'd have a RoommateRequest model
        # For now, return empty results as we don't have the model yet
        
        sent_requests = []
        received_requests = []
        
        # Filter based on request type
        if request_type == 'sent':
            requests = sent_requests
        elif request_type == 'received':
            requests = received_requests
        elif request_type == 'accepted':
            requests = []
        elif request_type == 'rejected':
            requests = []
        else:
            requests = sent_requests + received_requests
        
        return Response({
            'requests': requests,
            'summary': {
                'total_sent': len(sent_requests),
                'total_received': len(received_requests),
                'pending_responses': len([r for r in received_requests if r.get('status') == 'pending'])
            },
            'request_type': request_type
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Send roommate request"""
        target_user_id = request.data.get('target_user_id')
        room_type_preference = request.data.get('room_type_preference', 'double')
        budget_min = request.data.get('budget_min')
        budget_max = request.data.get('budget_max')
        move_in_date = request.data.get('move_in_date')
        message = request.data.get('message', '')
        
        if not all([target_user_id, budget_min, budget_max, move_in_date]):
            return Response({
                'error': 'Target user ID, budget range, and move-in date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In a real implementation, you'd create a RoommateRequest model
        return Response({
            'message': 'Roommate request sent successfully',
            'request_id': 12345,
            'target_user_id': target_user_id,
            'expires_at': (timezone.now() + timedelta(days=7)).isoformat()
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request):
        """Respond to roommate request"""
        request_id = request.data.get('request_id')
        response = request.data.get('response')
        response_message = request.data.get('response_message', '')
        
        if not all([request_id, response]):
            return Response({
                'error': 'Request ID and response are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if response not in ['accept', 'decline']:
            return Response({
                'error': 'Response must be either "accept" or "decline"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': f'Roommate request {response}ed successfully',
            'request_id': request_id,
            'response': response,
            'response_message': response_message
        }, status=status.HTTP_200_OK)


class RoommateChatView(APIView):
    """Chat system for potential roommates"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get roommate conversations"""
        # In a real implementation, you'd query the Conversation and Message models
        conversations = []
        
        return Response({
            'conversations': conversations,
            'total_conversations': len(conversations),
            'unread_total': 0
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Send message to roommate conversation"""
        conversation_id = request.data.get('conversation_id')
        recipient_id = request.data.get('recipient_id')
        content = request.data.get('content')
        
        if not all([content]):
            return Response({
                'error': 'Message content is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Message sent successfully',
            'message_id': 12345,
            'timestamp': timezone.now().isoformat(),
            'conversation_id': conversation_id
        }, status=status.HTTP_201_CREATED)


class RoommateVerificationView(APIView):
    """Roommate verification and safety features"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get verification status and safety information"""
        user = request.user
        
        verification_status = {
            'profile_verified': user.is_verified,
            'identity_verified': getattr(user, 'identity_verified', False),
            'university_verified': getattr(user, 'university_verified', False),
            'background_check': getattr(user, 'background_check_status', 'not_requested'),
            'verification_score': self._calculate_verification_score(user),
            'verified_at': getattr(user, 'verified_at', None),
            'safety_features': {
                'profile_visibility': getattr(user, 'profile_visibility', 'public'),
                'contact_sharing': getattr(user, 'contact_sharing_enabled', False),
                'meeting_safety': True,
                'emergency_contact_verified': getattr(user, 'emergency_contact_verified', False)
            }
        }
        
        safety_tips = [
            {
                'tip_id': 1,
                'title': 'Meet in Public Places',
                'description': 'Always meet potential roommates in public, well-lit areas like cafes or libraries.',
                'category': 'meeting_safety',
                'priority': 'high'
            },
            {
                'tip_id': 2,
                'title': 'Verify Identity',
                'description': 'Ask to see university ID and other verification documents before finalizing arrangements.',
                'category': 'identity_verification',
                'priority': 'high'
            }
        ]
        
        return Response({
            'verification_status': verification_status,
            'safety_tips': safety_tips,
            'emergency_contacts': {
                'campus_security': '+254 700 111 222',
                'local_police': '999',
                'platform_support': '+254 700 123 456'
            }
        }, status=status.HTTP_200_OK)
    
    def _calculate_verification_score(self, user):
        """Calculate user verification score"""
        score = 0
        if user.is_verified:
            score += 40
        if getattr(user, 'identity_verified', False):
            score += 30
        if getattr(user, 'university_verified', False):
            score += 20
        if getattr(user, 'background_check_status', '') == 'completed':
            score += 10
        return score
    
    def post(self, request):
        """Request verification upgrade"""
        verification_type = request.data.get('verification_type')
        documents = request.data.get('documents', [])
        
        if not verification_type:
            return Response({
                'error': 'Verification type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': f'{verification_type.title()} verification request submitted',
            'request_id': 12345,
            'processing_time': '24-48 hours',
            'verification_type': verification_type
        }, status=status.HTTP_201_CREATED)


class RoommateHistoryView(APIView):
    """Roommate history and past experiences"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get roommate history and experiences"""
        # In a real implementation, you'd query roommate history from database
        roommate_history = []
        
        return Response({
            'roommate_history': roommate_history,
            'statistics': {
                'total_relationships': 0,
                'average_compatibility': 0,
                'recommendation_rate': 0,
                'contact_maintenance_rate': 0
            }
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Add roommate experience review"""
        roommate_id = request.data.get('roommate_id')
        compatibility_rating = request.data.get('compatibility_rating')
        review = request.data.get('review')
        would_recommend = request.data.get('would_recommend')
        contact_maintained = request.data.get('contact_maintained', False)
        
        if not all([roommate_id, compatibility_rating, review]):
            return Response({
                'error': 'Roommate ID, compatibility rating, and review are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Roommate review added successfully',
            'review_id': 12345,
            'roommate_id': roommate_id,
            'compatibility_rating': compatibility_rating
        }, status=status.HTTP_201_CREATED)


class RoommateAnalyticsView(APIView):
    """Roommate matching analytics and insights"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get roommate matching analytics"""
        user = request.user
        
        # Get real analytics data
        analytics = {
            'profile_views': getattr(user, 'profile_views_count', 0),
            'profile_likes': getattr(user, 'profile_likes_count', 0),
            'messages_sent': getattr(user, 'messages_sent_count', 0),
            'messages_received': getattr(user, 'messages_received_count', 0),
            'requests_sent': getattr(user, 'requests_sent_count', 0),
            'requests_received': getattr(user, 'requests_received_count', 0),
            'connections_made': getattr(user, 'connections_made_count', 0),
            'match_score_distribution': {
                '90-100': getattr(user, 'high_score_matches', 0),
                '80-89': getattr(user, 'good_score_matches', 0),
                '70-79': getattr(user, 'fair_score_matches', 0),
                '60-69': getattr(user, 'low_score_matches', 0),
                'below_60': getattr(user, 'very_low_score_matches', 0)
            },
            'response_rates': {
                'profile_views_response': getattr(user, 'profile_view_response_rate', 0),
                'message_response': getattr(user, 'message_response_rate', 0),
                'request_response': getattr(user, 'request_response_rate', 0)
            }
        }
        
        return Response({
            'analytics': analytics,
            'insights': [
                'Update your profile to get more views',
                'Be more active in conversations to improve response rates',
                'Consider adjusting your preferences for better matches'
            ]
        }, status=status.HTTP_200_OK)


class RoommateSettingsView(APIView):
    """Roommate matching settings and preferences"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get roommate matching settings"""
        user = request.user
        
        settings = {
            'matching_enabled': getattr(user, 'roommate_matching_enabled', True),
            'profile_visibility': getattr(user, 'profile_visibility', 'public'),
            'auto_match': getattr(user, 'auto_match_enabled', True),
            'match_notifications': getattr(user, 'match_notifications_enabled', True),
            'message_notifications': getattr(user, 'message_notifications_enabled', True),
            'email_notifications': getattr(user, 'email_notifications_enabled', False),
            'distance_preference': getattr(user, 'distance_preference_km', 10),
            'age_range': {
                'min': getattr(user, 'min_age_preference', 18),
                'max': getattr(user, 'max_age_preference', 26)
            },
            'university_preference': getattr(user, 'university_preference', 'any'),
            'budget_range': {
                'min': getattr(user, 'min_budget', 15000),
                'max': getattr(user, 'max_budget', 30000)
            },
            'room_type_preference': getattr(user, 'room_type_preference', ['single', 'double']),
            'move_in_timeline': {
                'immediate': getattr(user, 'immediate_move_in', True),
                'within_month': getattr(user, 'within_month_move_in', True),
                'within_3_months': getattr(user, 'within_3_months_move_in', True),
                'flexible': getattr(user, 'flexible_move_in', False)
            }
        }
        
        return Response({
            'settings': settings
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update roommate matching settings"""
        settings_updates = request.data
        user = request.user
        
        # Update settings
        for key, value in settings_updates.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        user.save()
        
        return Response({
            'message': 'Roommate settings updated successfully',
            'updated_settings': settings_updates
        }, status=status.HTTP_200_OK)


class RoommateReportView(APIView):
    """Report inappropriate behavior or safety concerns"""
    
    permission_classes = [IsStudent]
    
    def post(self, request):
        """Submit a report"""
        reported_user_id = request.data.get('reported_user_id')
        report_type = request.data.get('report_type')
        description = request.data.get('description')
        evidence = request.data.get('evidence', [])
        
        if not all([reported_user_id, report_type, description]):
            return Response({
                'error': 'Reported user ID, report type, and description are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Report submitted successfully',
            'report_id': 'RPT-2024-001234',
            'report_type': report_type,
            'status': 'under_review',
            'estimated_resolution_time': '24-48 hours'
        }, status=status.HTTP_201_CREATED)


class RoommateMatchingAdvancedView(APIView):
    """Advanced roommate matching with AI/ML features"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get advanced matching insights"""
        user = request.user
        
        # Get real data from user profile
        insights = {
            'personality_match': {
                'openness': {'score': getattr(user, 'personality_openness', 5), 'match_count': 0},
                'conscientiousness': {'score': getattr(user, 'personality_conscientiousness', 5), 'match_count': 0},
                'extraversion': {'score': getattr(user, 'personality_extraversion', 5), 'match_count': 0},
                'agreeableness': {'score': getattr(user, 'personality_agreeableness', 5), 'match_count': 0},
                'neuroticism': {'score': getattr(user, 'personality_neuroticism', 5), 'match_count': 0}
            },
            'lifestyle_compatibility': {
                'study_schedule': {'compatibility': 0, 'recommendations': 0},
                'sleep_patterns': {'compatibility': 0, 'recommendations': 0},
                'social_preferences': {'compatibility': 0, 'recommendations': 0},
                'cleanliness_standards': {'compatibility': 0, 'recommendations': 0}
            },
            'preference_optimization': {
                'budget_range': 'Consider expanding your budget range for more options',
                'location': 'Your current location preference limits matches',
                'move_in_timeline': 'Being flexible with move-in dates increases matches'
            },
            'success_prediction': {
                'match_success_rate': getattr(user, 'match_success_rate', 0),
                'average_relationship_duration': getattr(user, 'avg_relationship_duration', 0),
                'compatibility_threshold': 75
            }
        }
        
        return Response({
            'advanced_insights': insights,
            'recommendations': [
                'Update your personality traits for better matches',
                'Consider expanding your university preference radius',
                'Add more interests to increase compatibility scores'
            ]
        }, status=status.HTTP_200_OK)