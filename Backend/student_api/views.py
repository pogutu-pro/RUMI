from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta

from accounts.permissions import IsStudent

class StudentPendingReviewsView(APIView):
    """Get pending reviews for student"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get hostels student should review"""
        student = request.user.student_profile
        
        # Get completed bookings where student hasn't reviewed yet
        from hostels.models import Booking, Review
        
        completed_bookings = Booking.objects.filter(
            student=student,
            status='completed',
            check_out_date__lte=timezone.now().date(),
            check_out_date__gte=timezone.now().date() - timedelta(days=90)  # Last 90 days
        ).select_related('room__hostel')
        
        # Filter out already reviewed hostels
        reviewed_hostel_ids = Review.objects.filter(
            student=student,
            booking__in=completed_bookings
        ).values_list('hostel_id', flat=True)
        
        pending_reviews = []
        for booking in completed_bookings:
            if booking.room.hostel.id not in reviewed_hostel_ids:
                pending_reviews.append({
                    'hostel_id': booking.room.hostel.id,
                    'hostel_name': booking.room.hostel.name,
                    'hostel_image': booking.room.hostel.main_image.url if booking.room.hostel.main_image else None,
                    'check_out_date': booking.check_out_date.isoformat(),
                    'booking_id': booking.id
                })
        
        # Sort by most recent checkout first
        pending_reviews.sort(key=lambda x: x['check_out_date'], reverse=True)
        
        return Response({
            'pending_reviews': pending_reviews,
            'total_pending': len(pending_reviews)
        }, status=status.HTTP_200_OK)


class StudentVisitorInvitationsView(APIView):
    """Handle student visitor invitations"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get student's visitor invitations"""
        student = request.user.student_profile
        
        # This would normally query a VisitorInvitation model
        # For now, return mock data
        invitations = [
            {
                'id': '1',
                'visitor_name': 'John Doe',
                'visitor_phone': '+254700123456',
                'visitor_id_number': '12345678',
                'purpose': 'Family visit',
                'expected_arrival_time': '2024-12-20T14:00:00Z',
                'status': 'pending',
                'created_at': '2024-12-15T10:00:00Z'
            }
        ]
        
        return Response({
            'invitations': invitations,
            'total': len(invitations)
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create new visitor invitation"""
        visitor_name = request.data.get('visitor_name')
        visitor_phone = request.data.get('visitor_phone')
        visitor_id_number = request.data.get('visitor_id_number')
        purpose = request.data.get('purpose')
        expected_arrival_time = request.data.get('expected_arrival_time')
        
        if not all([visitor_name, visitor_id_number, purpose]):
            return Response({
                'error': 'Visitor name, ID number, and purpose are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In production, this would create a VisitorInvitation record
        return Response({
            'message': 'Visitor invitation created successfully',
            'invitation_id': 'new_invitation_123',
            'status': 'pending'
        }, status=status.HTTP_201_CREATED)
    
    def delete(self, request, invitation_id):
        """Cancel visitor invitation"""
        if not invitation_id:
            return Response({
                'error': 'Invitation ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In production, this would cancel the VisitorInvitation
        return Response({
            'message': 'Visitor invitation cancelled successfully',
            'invitation_id': invitation_id
        }, status=status.HTTP_200_OK)


class StudentRoommateRequestsView(APIView):
    """Handle student roommate requests"""
    
    permission_classes = [IsStudent]
    
    def get(self, request):
        """Get student's roommate requests"""
        student = request.user.student_profile
        
        # This would normally query RoommateRequest model
        # For now, return mock data
        requests = [
            {
                'id': '1',
                'requested_student_name': 'Jane Smith',
                'message': 'Looking for a study buddy',
                'status': 'pending',
                'created_at': '2024-12-15T10:00:00Z',
                'move_in_date': '2024-12-25T00:00:00Z',
                'budget_range': {'min': 15000, 'max': 20000}
            }
        ]
        
        return Response({
            'requests': requests,
            'total': len(requests)
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create new roommate request"""
        requested_student_id = request.data.get('requested_student_id')
        message = request.data.get('message')
        move_in_date = request.data.get('move_in_date')
        budget_min = request.data.get('budget_min')
        budget_max = request.data.get('budget_max')
        
        if not all([requested_student_id, message, move_in_date, budget_min, budget_max]):
            return Response({
                'error': 'Requested student ID, message, move-in date, and budget range are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In production, this would create a RoommateRequest
        return Response({
            'message': 'Roommate request created successfully',
            'request_id': 'new_request_123',
            'status': 'pending'
        }, status=status.HTTP_201_CREATED)
    
    def delete(self, request, request_id):
        """Cancel roommate request"""
        if not request_id:
            return Response({
                'error': 'Request ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In production, this would cancel the RoommateRequest
        return Response({
            'message': 'Roommate request cancelled successfully',
            'request_id': request_id
        }, status=status.HTTP_200_OK)