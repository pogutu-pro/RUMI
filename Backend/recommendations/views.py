"""
API endpoints for hostel recommendation system
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.db import models as django_models

from accounts.models import StudentProfile
from .engine import get_student_recommendations


class RecommendationPagination(PageNumberPagination):
    """
    Custom pagination for recommendations
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 20


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_recommendations(request, student_id=None):
    """
    Get personalized hostel recommendations for a student
    
    GET /api/recommendations/student/{student_id}/
    GET /api/recommendations/student/me/  (for current user)
    
    Query Parameters:
    - limit: Number of recommendations (default: 10, max: 20)
    - page: Page number for pagination (default: 1)
    """
    
    # Determine student ID
    if student_id == 'me':
        # Get current user's student profile
        try:
            student_profile = request.user.student_profile
            student_id = str(student_profile.id)
        except StudentProfile.DoesNotExist:
            return Response(
                {'error': 'Student profile not found for current user'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif student_id:
        # Convert string to int for database operations
        try:
            student_id_int = int(student_id)
        except ValueError:
            return Response(
                {'error': 'Invalid student ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify permissions - users can only see their own recommendations unless staff
        if not request.user.is_staff and str(student_id_int) != str(request.user.student_profile.id):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {'error': 'Student ID required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get query parameters
    limit = min(int(request.GET.get('limit', 10)), 20)  # Cap at 20
    page = int(request.GET.get('page', 1))
    
    try:
        # Get recommendations
        recommendations = get_student_recommendations(int(student_id), limit)
        
        # Paginate results
        paginator = RecommendationPagination()
        paginated_recommendations = paginator.paginate_queryset(
            recommendations, request
        )
        
        # Build response
        response_data = {
            'student_id': int(student_id),
            'recommendations': paginated_recommendations,
            'pagination': {
                'current_page': page,
                'page_size': paginator.page_size,
                'total_count': len(recommendations),
                'total_pages': (len(recommendations) + paginator.page_size - 1) // paginator.page_size
            },
            'meta': {
                'algorithm': 'hybrid_content_collaborative',
                'content_weight': 0.7,
                'collaborative_weight': 0.3,
                'generated_at': timezone.now().isoformat()
            }
        }
        
        return paginator.get_paginated_response(response_data)
        
    except StudentProfile.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to generate recommendations: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommendation_stats(request, student_id=None):
    """
    Get statistics about recommendation performance and student preferences
    
    GET /api/recommendations/stats/{student_id}/
    GET /api/recommendations/stats/me/
    """
    
    # Similar student ID logic as above
    if student_id == 'me':
        try:
            student_profile = request.user.student_profile
            student_id = str(student_profile.id)
        except StudentProfile.DoesNotExist:
            return Response(
                {'error': 'Student profile not found for current user'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif student_id:
        try:
            student_id_int = int(student_id)
        except ValueError:
            return Response(
                {'error': 'Invalid student ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify permissions - users can only see their own stats unless staff
        if not request.user.is_staff and str(student_id_int) != str(request.user.student_profile.id):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {'error': 'Student ID required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        student = StudentProfile.objects.get(id=int(student_id))
        
        # Get student's booking history
        from hostels.models import Booking
        booking_history = Booking.objects.filter(student=student).select_related('room__hostel')
        
        # Preference analysis
        preferences = {
            'university': student.university,
            'course': student.course,
            'year_of_study': student.year_of_study,
            'lifestyle_preferences': student.lifestyle_preferences or {},
            'gender': student.user.gender,
        }
        
        # Booking patterns
        booking_patterns = {
            'total_bookings': booking_history.count(),
            'completed_bookings': booking_history.filter(status='completed').count(),
            'cancelled_bookings': booking_history.filter(status='cancelled').count(),
            'average_price_range': {
                'min': float(booking_history.aggregate(min_price=django_models.Min('monthly_rent'))['min_price'] or 0),
                'max': float(booking_history.aggregate(max_price=django_models.Max('monthly_rent'))['max_price'] or 0),
                'avg': float(booking_history.aggregate(avg_price=django_models.Avg('monthly_rent'))['avg_price'] or 0),
            } if booking_history.exists() else None,
            'preferred_amenities': [],  # Could be derived from booking patterns
        }
        
        # Review behavior (review system pending reimplementation)
        review_behavior = {
            'total_reviews': 0,
            'average_rating_given': 0,
            'recent_reviews': []
        }
        
        return Response({
            'student_id': int(student_id),
            'preferences': preferences,
            'booking_patterns': booking_patterns,
            'review_behavior': review_behavior,
            'recommendation_readiness': {
                'has_profile_data': bool(student.university and student.course),
                'has_lifestyle_preferences': bool(student.lifestyle_preferences),
                'has_booking_history': booking_history.exists(),
                'has_review_history': False,
                'ready_for_collaborative_filtering': booking_history.count() >= 1
            }
        })
        
    except StudentProfile.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to get stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
