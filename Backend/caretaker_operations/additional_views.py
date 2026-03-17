from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsCaretaker
from hostels.models import Booking, Room
from accounts.models import CaretakerProfile
from caretaker_operations.models import LateEntry

class CaretakerLateEntryStatsView(APIView):
    """Get late entry statistics for caretaker's hostel"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get aggregated late entry statistics"""
        caretaker = request.user.caretaker_profile
        
        # Get all late entries for caretaker's hostel
        # Note: This assumes there's a LateEntry model or similar tracking
        # For now, we'll simulate with mock data based on booking patterns
        
        # This week statistics
        week_start = timezone.now().date() - timedelta(days=timezone.now().weekday())
        this_week_entries = self._get_late_entries_for_period(caretaker, week_start, timezone.now().date())
        
        # Frequent offenders (students with most late entries)
        frequent_offenders = self._get_frequent_offenders(caretaker)
        
        # Calculate average entries per week
        avg_entries_per_week = self._calculate_average_entries_per_week(caretaker)
        
        return Response({
            'this_week': this_week_entries,
            'frequent_offenders': frequent_offenders,
            'average_entries_per_week': avg_entries_per_week
        }, status=status.HTTP_200_OK)
    
    def _get_late_entries_for_period(self, caretaker, start_date, end_date):
        """Get late entries count for a specific period from the LateEntry table"""
        return LateEntry.objects.filter(
            room__hostel=caretaker.hostel,
            entry_time__date__gte=start_date,
            entry_time__date__lte=end_date,
        ).count()
    
    def _get_frequent_offenders(self, caretaker):
        """Get students with most late entries from the LateEntry table"""
        offenders = (
            LateEntry.objects
            .filter(room__hostel=caretaker.hostel)
            .values(
                'student__id',
                'student__user__first_name',
                'student__user__last_name',
                'room__room_number',
            )
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        return [
            {
                'student_id': o['student__id'],
                'student_name': f"{o['student__user__first_name']} {o['student__user__last_name']}".strip(),
                'room_number': o['room__room_number'],
                'count': o['count'],
            }
            for o in offenders
        ]
    
    def _calculate_average_entries_per_week(self, caretaker):
        """Calculate average late entries per week"""
        # This would normally calculate from historical data
        # For now, return a simulated average
        
        # Look at last 4 weeks
        weeks_to_analyze = 4
        total_late_entries = 0
        
        for week in range(weeks_to_analyze):
            week_start = timezone.now().date() - timedelta(days=(week + 1) * 7)
            week_end = week_start + timedelta(days=6)
            week_entries = self._get_late_entries_for_period(caretaker, week_start, week_end)
            total_late_entries += week_entries
        
        return round(total_late_entries / weeks_to_analyze, 1)


class CaretakerGeneralApprovalsView(APIView):
    """Handle general approval requests for caretaker"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get pending approval requests"""
        caretaker = request.user.caretaker_profile
        status_filter = request.query_params.get('status', 'pending')
        type_filter = request.query_params.get('type', 'all')
        
        approvals = []
        
        # Get pending roommate requests (if RoommateRequest exists)
        try:
            from accounts.roommate_models import RoommateRequest
            roommate_requests = RoommateRequest.objects.filter(
                preferred_hostel=caretaker.hostel,
                status='pending',
                caretaker_approval_required=True,
                caretaker_approved=False
            ).select_related('requester__user', 'recipient__user')
            
            for req in roommate_requests:
                approvals.append({
                    'id': f'roommate_{req.id}',
                    'type': 'roommate_request',
                    'title': 'Roommate Request',
                    'requester': {
                        'id': req.requester.id,
                        'name': req.requester.user.get_full_name(),
                        'room_number': 'TBD'  # Would need to get current room
                    },
                    'details': f'Request to room with {req.recipient.user.get_full_name()}',
                    'created_at': req.created_at.isoformat(),
                    'status': 'pending',
                    'priority': req.priority
                })
        except ImportError:
            pass
        
        # Get pending maintenance approvals (if applicable)
        from hostels.models import DamageReport
        maintenance_reports = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status='reported',
            severity__in=['moderate', 'severe']
        ).select_related('room', 'reported_by')
        
        for report in maintenance_reports:
            approvals.append({
                'id': f'maintenance_{report.id}',
                'type': 'maintenance',
                'title': 'Maintenance Approval',
                'requester': {
                    'id': report.reported_by.id,
                    'name': report.reported_by.get_full_name(),
                    'room_number': report.room.room_number
                },
                'details': report.description,
                'created_at': report.reported_at.isoformat(),
                'status': 'pending',
                'priority': 'high' if report.severity == 'severe' else 'medium',
                'metadata': {
                    'severity': report.severity,
                    'estimated_cost': report.estimated_cost
                }
            })
        
        # Get visitor invitation approvals (if system exists)
        # This would depend on having a visitor invitation system
        
        # Filter by status and type
        if status_filter != 'all':
            approvals = [a for a in approvals if a['status'] == status_filter]
        
        if type_filter != 'all':
            approvals = [a for a in approvals if a['type'] == type_filter]
        
        # Sort by priority and created date
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        approvals.sort(key=lambda x: (priority_order.get(x['priority'], 0), x['created_at']), reverse=True)
        
        return Response({
            'approvals': approvals,
            'total_pending': len([a for a in approvals if a['status'] == 'pending']),
            'filters': {
                'status': status_filter,
                'type': type_filter
            }
        }, status=status.HTTP_200_OK)
    
    def post(self, request, approval_id):
        """Approve or reject an approval request"""
        caretaker = request.user.caretaker_profile
        action = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response({
                'error': 'Action must be either "approve" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse approval ID and type
        if approval_id.startswith('roommate_'):
            return self._handle_roommate_approval(approval_id, action, notes, caretaker)
        elif approval_id.startswith('maintenance_'):
            return self._handle_maintenance_approval(approval_id, action, notes, caretaker)
        else:
            return Response({
                'error': 'Unknown approval type'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_roommate_approval(self, approval_id, action, notes, caretaker):
        """Handle roommate request approval"""
        try:
            from accounts.roommate_models import RoommateRequest
            request_id = approval_id.replace('roommate_', '')
            roommate_request = RoommateRequest.objects.get(
                id=request_id,
                preferred_hostel=caretaker.hostel,
                status='pending'
            )
            
            if action == 'approve':
                roommate_request.approve_by_caretaker(caretaker, notes)
                return Response({
                    'message': 'Roommate request approved successfully',
                    'approval_id': approval_id,
                    'status': 'approved'
                }, status=status.HTTP_200_OK)
            else:
                rejection_reason = request.data.get('rejection_reason', 'Rejected by caretaker')
                roommate_request.reject_by_caretaker(caretaker, rejection_reason)
                return Response({
                    'message': 'Roommate request rejected',
                    'approval_id': approval_id,
                    'status': 'rejected',
                    'rejection_reason': rejection_reason
                }, status=status.HTTP_200_OK)
                
        except (ImportError, RoommateRequest.DoesNotExist) as e:
            return Response({
                'error': f'Roommate request not found: {str(e)}'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def _handle_maintenance_approval(self, approval_id, action, notes, caretaker):
        """Handle maintenance request approval"""
        try:
            from hostels.models import DamageReport
            report_id = approval_id.replace('maintenance_', '')
            report = DamageReport.objects.get(
                id=report_id,
                room__hostel=caretaker.hostel,
                status='reported'
            )
            
            if action == 'approve':
                report.status = 'investigating'
                report.save()
                return Response({
                    'message': 'Maintenance request approved for investigation',
                    'approval_id': approval_id,
                    'status': 'approved'
                }, status=status.HTTP_200_OK)
            else:
                report.status = 'rejected'
                report.resolved_at = timezone.now()
                report.save()
                return Response({
                    'message': 'Maintenance request rejected',
                    'approval_id': approval_id,
                    'status': 'rejected',
                    'rejection_reason': notes
                }, status=status.HTTP_200_OK)
                
        except DamageReport.DoesNotExist:
            return Response({
                'error': 'Maintenance request not found'
            }, status=status.HTTP_404_NOT_FOUND)