from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal

from accounts.permissions import IsCaretaker, IsLandlord
from hostels.models import (
    Booking, Room, Hostel, InventoryCheckIn, InventoryCheckOut, 
    DamageReport, VisitorCheckIn, RoomInventory, RoomOccupant
)
from accounts.models import CaretakerProfile, StudentProfile


class CaretakerDashboardView(APIView):
    """Comprehensive caretaker dashboard with analytics"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get comprehensive dashboard data for caretaker"""
        caretaker = request.user.caretaker_profile
        
        # Today's overview (KPIs)
        today = timezone.now().date()
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        check_ins_today = InventoryCheckIn.objects.filter(
            room__hostel=caretaker.hostel,
            created_at__gte=today_start,
            status='pending'
        ).count()
        
        check_outs_today = InventoryCheckOut.objects.filter(
            room__hostel=caretaker.hostel,
            created_at__gte=today_start,
            status='pending'
        ).count()
        
        pending_approvals = (
            check_ins_today + check_outs_today + 
            DamageReport.objects.filter(
                room__hostel=caretaker.hostel,
                status__in=['reported', 'investigating']
            ).count()
        )
        
        unresolved_issues = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status__in=['reported', 'investigating', 'repairing']
        ).count()
        
        today_overview = {
            'checkInsToday': check_ins_today,
            'checkOutsToday': check_outs_today,
            'pendingApprovals': pending_approvals,
            'unresolvedIssues': unresolved_issues,
            'lowAvailabilityRooms': 0,  # Would calculate based on availability
            'overduePaymentsCount': 0  # Payment tracking would be separate
        }
        
        # Maintenance statistics
        maintenance_stats = self._get_maintenance_stats(caretaker)
        
        # Room occupancy statistics
        room_occupancy = self._get_room_occupancy(caretaker)
        
        # Upcoming events (next 7 days)
        upcoming_events = self._get_upcoming_events(caretaker)
        
        # Recent activity (last 10 activities)
        recent_activity = self._get_recent_activity(caretaker)
        
        return Response({
            'todayOverview': today_overview,
            'maintenanceStats': maintenance_stats,
            'roomOccupancy': room_occupancy,
            'upcomingEvents': upcoming_events,
            'recentActivity': recent_activity
        }, status=status.HTTP_200_OK)
    
    def _get_maintenance_stats(self, caretaker):
        """Get maintenance statistics with weekly data"""
        # Current maintenance counts
        open_issues = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status='reported'
        ).count()
        
        in_progress_issues = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status='investigating'
        ).count()
        
        resolved_issues = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status='resolved'
        ).count()
        
        high_priority_issues = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            severity='severe',
            status__in=['reported', 'investigating', 'repairing']
        ).count()
        
        # Weekly data for chart (last 7 days)
        weekly_data = []
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        for i, day_name in enumerate(days):
            date = timezone.now().date() - timedelta(days=6-i)
            day_start = datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            
            new_issues = DamageReport.objects.filter(
                room__hostel=caretaker.hostel,
                reported_at__gte=day_start,
                reported_at__lt=day_end
            ).count()
            
            resolved = DamageReport.objects.filter(
                room__hostel=caretaker.hostel,
                resolved_at__gte=day_start,
                resolved_at__lt=day_end
            ).count()
            
            weekly_data.append({
                'day': day_name,
                'new': new_issues,
                'resolved': resolved
            })
        
        return {
            'open': open_issues,
            'inProgress': in_progress_issues,
            'resolved': resolved_issues,
            'highPriority': high_priority_issues,
            'weeklyData': weekly_data
        }
    
    def _get_room_occupancy(self, caretaker):
        """Get room occupancy statistics"""
        rooms = Room.objects.filter(hostel=caretaker.hostel)
        total_rooms = rooms.count()
        
        occupied_rooms = rooms.filter(status='occupied').count()
        available_rooms = rooms.filter(status='available').count()
        maintenance_rooms = rooms.filter(status='maintenance').count()
        
        occupancy_rate = round((occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0)
        
        return {
            'total': total_rooms,
            'occupied': occupied_rooms,
            'available': available_rooms,
            'underMaintenance': maintenance_rooms,
            'occupancyRate': occupancy_rate
        }
    
    def _get_upcoming_events(self, caretaker):
        """Get upcoming events for next 7 days"""
        events = []
        today = timezone.now().date()
        end_date = today + timedelta(days=7)
        
        # Upcoming check-ins
        upcoming_check_ins = Booking.objects.filter(
            room__hostel=caretaker.hostel,
            check_in_date__gte=today,
            check_in_date__lt=end_date,
            status='confirmed'
        ).select_related('student__user', 'room')[:5]
        
        for booking in upcoming_check_ins:
            events.append({
                'id': f'checkin_{booking.id}',
                'type': 'check_in',
                'title': f'Check-in: {booking.student.user.get_full_name()}',
                'description': f'Expected arrival for room {booking.room.room_number}',
                'scheduledTime': booking.check_in_date.isoformat(),
                'tenant': {
                    'id': booking.student.id,
                    'name': booking.student.user.get_full_name()
                },
                'room': booking.room.room_number,
                'priority': 'medium'
            })
        
        # Upcoming check-outs
        upcoming_check_outs = Booking.objects.filter(
            room__hostel=caretaker.hostel,
            check_out_date__gte=today,
            check_out_date__lt=end_date,
            status='confirmed'
        ).select_related('student__user', 'room')[:5]
        
        for booking in upcoming_check_outs:
            if booking.check_out_date:  # Check if check_out_date is not None
                events.append({
                    'id': f'checkout_{booking.id}',
                    'type': 'check_out',
                    'title': f'Check-out: {booking.student.user.get_full_name()}',
                    'description': f'Expected departure from room {booking.room.room_number}',
                    'scheduledTime': booking.check_out_date.isoformat(),
                    'tenant': {
                        'id': booking.student.id,
                        'name': booking.student.user.get_full_name()
                    },
                    'room': booking.room.room_number,
                    'priority': 'medium'
                })
        
        # Sort events by scheduled time
        events.sort(key=lambda x: x['scheduledTime'])
        
        return events[:10]  # Return top 10 events
    
    def _get_recent_activity(self, caretaker):
        """Get recent activity log"""
        activities = []
        
        # Recent check-ins
        recent_check_ins = InventoryCheckIn.objects.filter(
            room__hostel=caretaker.hostel,
            caretaker_verified_at__isnull=False
        ).select_related('student__user', 'room').order_by('-caretaker_verified_at')[:3]
        
        for check_in in recent_check_ins:
            if check_in.caretaker_verified_at:  # Check if caretaker_verified_at is not None
                activities.append({
                    'id': f'checkin_{check_in.id}',
                    'type': 'check_in',
                    'title': f'Completed check-in for {check_in.student.user.get_full_name()}',
                    'description': f'Verified check-in for room {check_in.room.room_number}',
                    'timestamp': check_in.caretaker_verified_at.isoformat(),
                    'tenant': {
                        'id': check_in.student.id,
                        'name': check_in.student.user.get_full_name()
                    },
                    'room': check_in.room.room_number,
                    'actionUrl': f'/caretaker/check-ins/{check_in.id}'
                })
        
        # Recent damage reports
        recent_reports = DamageReport.objects.filter(
            room__hostel=caretaker.hostel
        ).select_related('room').order_by('-reported_at')[:3]
        
        for report in recent_reports:
            activities.append({
                'id': f'damage_{report.id}',
                'type': 'damage_report',
                'title': f'Damage report: {report.title}',
                'description': report.description,
                'timestamp': report.reported_at.isoformat(),
                'room': report.room.room_number,
                'actionUrl': f'/caretaker/damage-reports/{report.id}'
            })
        
        # Recent visitor check-ins
        recent_visitors = VisitorCheckIn.objects.filter(
            hostel=caretaker.hostel
        ).select_related('room').order_by('-check_in_time')[:3]
        
        for visitor in recent_visitors:
            activities.append({
                'id': f'visitor_{visitor.id}',
                'type': 'security',
                'title': f'Visitor check-in: {visitor.visitor_name}',
                'description': f'Visited {visitor.person_visited_name} in room {visitor.room.room_number}',
                'timestamp': visitor.check_in_time.isoformat(),
                'room': visitor.room.room_number,
                'actionUrl': f'/caretaker/security/visitors'
            })
        
        # Sort by timestamp and return latest 10
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:10]


class CaretakerCheckInOperationsView(APIView):
    """Handle caretaker check-in operations"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get pending check-ins for caretaker"""
        caretaker = request.user.caretaker_profile
        
        # Get pending check-ins for caretaker's hostel
        pending_check_ins = InventoryCheckIn.objects.filter(
            room__hostel=caretaker.hostel,
            status='pending',
            caretaker_verified_at__isnull=True
        ).select_related('booking', 'room', 'student', 'template').order_by('-created_at')
        
        data = []
        for check_in in pending_check_ins:
            data.append({
                'check_in_id': check_in.id,
                'booking_reference': check_in.booking.booking_reference,
                'student_name': check_in.student.user.get_full_name(),
                'student_email': check_in.student.user.email,
                'room_number': check_in.room.room_number,
                'check_in_date': check_in.booking.check_in_date.isoformat(),
                'template_name': check_in.template.name,
                'student_submitted_at': check_in.student_submitted_at.isoformat() if check_in.student_submitted_at else None,
                'items_count': len(check_in.checklist_data) if check_in.checklist_data else 0,
                'days_pending': (timezone.now().date() - check_in.created_at.date()).days
            })
        
        return Response({
            'pending_check_ins': data,
            'total_pending': len(data)
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Verify and complete a check-in"""
        check_in_id = request.data.get('check_in_id')
        notes = request.data.get('notes', '')
        status_update = request.data.get('status', 'verified')  # verified, rejected
        
        if not check_in_id:
            return Response({
                'error': 'Check-in ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            check_in = InventoryCheckIn.objects.get(
                id=check_in_id,
                room__hostel=request.user.caretaker_profile.hostel
            )
        except InventoryCheckIn.DoesNotExist:
            return Response({
                'error': 'Check-in not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update check-in status
        check_in.caretaker_notes = notes
        check_in.verified_by_caretaker = request.user.caretaker_profile
        check_in.caretaker_verified_at = timezone.now()
        check_in.status = status_update
        check_in.save()
        
        # If verified, update room occupancy
        if status_update == 'verified':
            # Create or update room occupant record
            RoomOccupant.objects.update_or_create(
                booking=check_in.booking,
                defaults={
                    'room': check_in.room,
                    'student': check_in.student,
                    'move_in_date': check_in.booking.check_in_date,
                    'check_in_completed': True,
                    'check_in_id': check_in.id,
                    'is_active': True
                }
            )
            
            # Update room status if needed
            if check_in.room.status == 'available':
                check_in.room.status = 'occupied'
                check_in.room.save()
        
        return Response({
            'message': f'Check-in {status_update} successfully',
            'check_in_id': check_in.id,
            'status': status_update
        }, status=status.HTTP_200_OK)


class CaretakerCheckOutOperationsView(APIView):
    """Handle caretaker check-out operations"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get pending check-outs for caretaker"""
        caretaker = request.user.caretaker_profile
        
        # Get pending check-outs for caretaker's hostel
        pending_check_outs = InventoryCheckOut.objects.filter(
            room__hostel=caretaker.hostel,
            status='pending',
            caretaker_verified_at__isnull=True
        ).select_related('booking', 'room', 'student', 'template').order_by('-created_at')
        
        data = []
        for check_out in pending_check_outs:
            # Count damaged items
            damaged_items = 0
            if check_out.checklist_data:
                for item_status in check_out.checklist_data.values():
                    if item_status.get('condition') == 'damaged':
                        damaged_items += 1
            
            data.append({
                'check_out_id': check_out.id,
                'booking_reference': check_out.booking.booking_reference,
                'student_name': check_out.student.user.get_full_name(),
                'student_email': check_out.student.user.email,
                'room_number': check_out.room.room_number,
                'move_out_date': check_out.booking.check_out_date.isoformat() if check_out.booking.check_out_date else None,
                'template_name': check_out.template.name,
                'student_submitted_at': check_out.student_submitted_at.isoformat() if check_out.student_submitted_at else None,
                'items_count': len(check_out.checklist_data) if check_out.checklist_data else 0,
                'damaged_items': damaged_items,
                'days_pending': (timezone.now().date() - check_out.created_at.date()).days
            })
        
        return Response({
            'pending_check_outs': data,
            'total_pending': len(data)
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Verify and complete a check-out"""
        check_out_id = request.data.get('check_out_id')
        notes = request.data.get('notes', '')
        status_update = request.data.get('status', 'verified')  # verified, rejected
        
        if not check_out_id:
            return Response({
                'error': 'Check-out ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            check_out = InventoryCheckOut.objects.get(
                id=check_out_id,
                room__hostel=request.user.caretaker_profile.hostel
            )
        except InventoryCheckOut.DoesNotExist:
            return Response({
                'error': 'Check-out not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update check-out status
        check_out.caretaker_notes = notes
        check_out.verified_by_caretaker = request.user.caretaker_profile
        check_out.caretaker_verified_at = timezone.now()
        check_out.status = status_update
        check_out.save()
        
        # If verified, update room occupancy
        if status_update == 'verified':
            # Deactivate room occupant
            RoomOccupant.objects.filter(
                booking=check_out.booking,
                room=check_out.room,
                student=check_out.student
            ).update(
                is_active=False,
                move_out_date=check_out.booking.check_out_date or timezone.now().date()
            )
            
            # Update room status if no other occupants
            active_occupants = RoomOccupant.objects.filter(
                room=check_out.room,
                is_active=True
            ).count()
            
            if active_occupants == 0:
                check_out.room.status = 'available'
                check_out.room.save()
        
        return Response({
            'message': f'Check-out {status_update} successfully',
            'check_out_id': check_out.id,
            'status': status_update
        }, status=status.HTTP_200_OK)


class CaretakerDamageReportView(APIView):
    """Handle damage report management"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get damage reports for caretaker's hostel"""
        caretaker = request.user.caretaker_profile
        status_filter = request.query_params.get('status', 'all')
        
        damage_reports = DamageReport.objects.filter(
            room__hostel=caretaker.hostel
        )
        
        if status_filter != 'all':
            damage_reports = damage_reports.filter(status=status_filter)
        
        damage_reports = damage_reports.select_related(
            'booking', 'room', 'reported_by'
        ).order_by('-reported_at')
        
        data = []
        for report in damage_reports:
            data.append({
                'report_id': report.id,
                'title': report.title,
                'description': report.description,
                'severity': report.severity,
                'status': report.status,
                'room_number': report.room.room_number,
                'reported_by': report.reported_by.get_full_name(),
                'estimated_cost': float(report.estimated_cost) if report.estimated_cost else None,
                'repair_cost': float(report.repair_cost) if report.repair_cost else None,
                'reported_at': report.reported_at.isoformat(),
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
                'images': report.images or []
            })
        
        return Response({
            'damage_reports': data,
            'total_reports': len(data),
            'status_filter': status_filter
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new damage report"""
        caretaker = request.user.caretaker_profile
        
        # Get data from request
        room_id = request.data.get('room_id')
        booking_id = request.data.get('booking_id')
        title = request.data.get('title')
        description = request.data.get('description')
        severity = request.data.get('severity', 'minor')
        images = request.data.get('images', [])
        estimated_cost = request.data.get('estimated_cost')
        
        # Validate required fields
        if not all([room_id, title, description]):
            return Response({
                'error': 'Room ID, title, and description are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            room = Room.objects.get(id=room_id, hostel=caretaker.hostel)
            booking = Booking.objects.get(id=booking_id) if booking_id else None
        except (Room.DoesNotExist, Booking.DoesNotExist) as e:
            return Response({
                'error': f'Room or booking not found: {str(e)}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create damage report
        damage_report = DamageReport.objects.create(
            room=room,
            booking=booking,
            reported_by=request.user,
            title=title,
            description=description,
            severity=severity,
            images=images,
            estimated_cost=Decimal(estimated_cost) if estimated_cost else None
        )
        
        return Response({
            'message': 'Damage report created successfully',
            'report_id': damage_report.id,
            'status': damage_report.status
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request):
        """Update damage report status"""
        report_id = request.data.get('report_id')
        status_update = request.data.get('status')
        repair_cost = request.data.get('repair_cost')
        
        if not all([report_id, status_update]):
            return Response({
                'error': 'Report ID and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            report = DamageReport.objects.get(
                id=report_id,
                room__hostel=request.user.caretaker_profile.hostel
            )
        except DamageReport.DoesNotExist:
            return Response({
                'error': 'Damage report not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update report
        report.status = status_update
        if repair_cost:
            report.repair_cost = Decimal(repair_cost)
        if status_update == 'resolved':
            report.resolved_at = timezone.now()
        
        report.save()
        
        return Response({
            'message': 'Damage report updated successfully',
            'report_id': report.id,
            'status': report.status
        }, status=status.HTTP_200_OK)


class CaretakerVisitorManagementView(APIView):
    """Handle visitor check-in/check-out management"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get visitor records for caretaker's hostel"""
        caretaker = request.user.caretaker_profile
        status_filter = request.query_params.get('status', 'all')  # all, active, checked_out
        
        visitors = VisitorCheckIn.objects.filter(
            hostel=caretaker.hostel
        )
        
        if status_filter == 'active':
            visitors = visitors.filter(is_active=True)
        elif status_filter == 'checked_out':
            visitors = visitors.filter(is_active=False)
        
        visitors = visitors.select_related('room').order_by('-check_in_time')
        
        data = []
        for visitor in visitors:
            data.append({
                'visitor_id': visitor.id,
                'visitor_name': visitor.visitor_name,
                'visitor_id_number': visitor.visitor_id_number,
                'room_number': visitor.room.room_number,
                'person_visited': visitor.person_visited_name,
                'check_in_time': visitor.check_in_time.isoformat(),
                'check_out_time': visitor.check_out_time.isoformat() if visitor.check_out_time else None,
                'visit_duration_minutes': visitor.visit_duration,
                'is_active': visitor.is_active,
                'notes': visitor.notes
            })
        
        return Response({
            'visitor_records': data,
            'total_visitors': len(data),
            'currently_checked_in': len([v for v in data if v['is_active']]),
            'status_filter': status_filter
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Check in a new visitor"""
        caretaker = request.user.caretaker_profile
        
        # Get visitor data
        room_id = request.data.get('room_id')
        visitor_name = request.data.get('visitor_name')
        visitor_id_number = request.data.get('visitor_id_number')
        person_visited_name = request.data.get('person_visited_name')
        notes = request.data.get('notes', '')
        
        # Validate required fields
        if not all([room_id, visitor_name, visitor_id_number, person_visited_name]):
            return Response({
                'error': 'Room ID, visitor name, ID number, and person visited are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            room = Room.objects.get(id=room_id, hostel=caretaker.hostel)
        except Room.DoesNotExist:
            return Response({
                'error': 'Room not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create visitor record
        visitor = VisitorCheckIn.objects.create(
            hostel=caretaker.hostel,
            room=room,
            visitor_name=visitor_name,
            visitor_id_number=visitor_id_number,
            person_visited_name=person_visited_name,
            checked_in_by=caretaker,
            notes=notes,
            is_active=True
        )
        
        return Response({
            'message': 'Visitor checked in successfully',
            'visitor_id': visitor.id,
            'check_in_time': visitor.check_in_time.isoformat()
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request):
        """Check out a visitor"""
        visitor_id = request.data.get('visitor_id')
        notes = request.data.get('notes', '')
        
        if not visitor_id:
            return Response({
                'error': 'Visitor ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            visitor = VisitorCheckIn.objects.get(
                id=visitor_id,
                hostel=request.user.caretaker_profile.hostel,
                is_active=True
            )
        except VisitorCheckIn.DoesNotExist:
            return Response({
                'error': 'Active visitor record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check out visitor
        visitor.check_out_time = timezone.now()
        visitor.checked_out_by = request.user.caretaker_profile
        visitor.is_active = False
        if notes:
            visitor.notes = f"{visitor.notes}\nCheck-out notes: {notes}" if visitor.notes else notes
        visitor.save()
        
        return Response({
            'message': 'Visitor checked out successfully',
            'visitor_id': visitor.id,
            'check_out_time': visitor.check_out_time.isoformat(),
            'visit_duration_minutes': visitor.visit_duration
        }, status=status.HTTP_200_OK)


class CaretakerInventoryManagementView(APIView):
    """Handle inventory management operations"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get inventory status for caretaker's hostel"""
        caretaker = request.user.caretaker_profile
        
        # Get all rooms in caretaker's hostel
        rooms = Room.objects.filter(hostel=caretaker.hostel).prefetch_related('inventory_checks')
        
        inventory_status = []
        for room in rooms:
            # Get latest inventory check for this room
            latest_check = room.inventory_checks.order_by('-checked_at').first()
            
            # Count items by status
            total_items = 0
            damaged_items = 0
            missing_items = 0
            good_items = 0
            
            if latest_check and latest_check.items_status:
                for item_status in latest_check.items_status.values():
                    total_items += 1
                    condition = item_status.get('condition', 'good')
                    if condition == 'damaged':
                        damaged_items += 1
                    elif condition == 'missing':
                        missing_items += 1
                    else:
                        good_items += 1
            
            inventory_status.append({
                'room_id': room.id,
                'room_number': room.room_number,
                'room_type': room.room_type,
                'total_items': total_items,
                'good_items': good_items,
                'damaged_items': damaged_items,
                'missing_items': missing_items,
                'last_check_date': latest_check.checked_at.isoformat() if latest_check else None,
                'needs_attention': damaged_items > 0 or missing_items > 0
            })
        
        return Response({
            'inventory_status': inventory_status,
            'total_rooms': len(inventory_status),
            'rooms_needing_attention': len([r for r in inventory_status if r['needs_attention']])
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create inventory check record"""
        caretaker = request.user.caretaker_profile
        
        booking_id = request.data.get('booking_id')
        check_type = request.data.get('check_type')  # check_in, check_out
        items_status = request.data.get('items_status', {})
        notes = request.data.get('notes', '')
        
        if not all([booking_id, check_type]):
            return Response({
                'error': 'Booking ID and check type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking = Booking.objects.get(
                id=booking_id,
                room__hostel=caretaker.hostel
            )
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create inventory template for the hostel
        template = caretaker.hostel.inventory_templates.filter(is_active=True).first()
        if not template:
            return Response({
                'error': 'No active inventory template found for this hostel'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create inventory check record
        inventory_check = RoomInventory.objects.create(
            booking=booking,
            template=template,
            checked_by=request.user,
            check_type=check_type,
            items_status=items_status,
            notes=notes
        )
        
        return Response({
            'message': 'Inventory check recorded successfully',
            'check_id': inventory_check.id,
            'check_type': check_type
        }, status=status.HTTP_201_CREATED)


class CaretakerMaintenanceView(APIView):
    """Handle maintenance requests and room status management"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get maintenance status for caretaker's hostel"""
        caretaker = request.user.caretaker_profile
        
        # Get rooms and their maintenance status
        rooms = Room.objects.filter(hostel=caretaker.hostel)
        
        maintenance_data = []
        for room in rooms:
            # Get damage reports for this room
            damage_reports = DamageReport.objects.filter(
                room=room,
                status__in=['reported', 'investigating', 'repairing']
            )
            
            # Get active maintenance requests (you might have a separate MaintenanceRequest model)
            maintenance_requests = []  # Placeholder - would come from actual model
            
            maintenance_data.append({
                'room_id': room.id,
                'room_number': room.room_number,
                'room_type': room.room_type,
                'current_status': room.status,
                'damage_reports_count': damage_reports.count(),
                'active_maintenance_requests': len(maintenance_requests),
                'needs_maintenance': room.status == 'maintenance' or damage_reports.exists(),
                'last_maintenance_date': None,  # Would come from maintenance records
                'next_maintenance_due': None    # Would be calculated based on schedule
            })
        
        # Summary statistics
        total_rooms = len(maintenance_data)
        rooms_need_maintenance = len([r for r in maintenance_data if r['needs_maintenance']])
        rooms_in_maintenance = len([r for r in maintenance_data if r['current_status'] == 'maintenance'])
        
        return Response({
            'maintenance_status': maintenance_data,
            'summary': {
                'total_rooms': total_rooms,
                'rooms_needing_maintenance': rooms_need_maintenance,
                'rooms_in_maintenance': rooms_in_maintenance,
                'maintenance_rate': (rooms_need_maintenance / total_rooms * 100) if total_rooms > 0 else 0
            }
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update room maintenance status"""
        room_id = request.data.get('room_id')
        new_status = request.data.get('status')  # available, occupied, maintenance
        reason = request.data.get('reason', '')
        
        if not all([room_id, new_status]):
            return Response({
                'error': 'Room ID and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            room = Room.objects.get(
                id=room_id,
                hostel=request.user.caretaker_profile.hostel
            )
        except Room.DoesNotExist:
            return Response({
                'error': 'Room not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update room status
        old_status = room.status
        room.status = new_status
        room.save()
        
        # Log the status change (you might want to create a maintenance log model)
        # For now, we'll just return success
        
        return Response({
            'message': 'Room status updated successfully',
            'room_id': room.id,
            'room_number': room.room_number,
            'old_status': old_status,
            'new_status': new_status,
            'reason': reason
        }, status=status.HTTP_200_OK)


class CaretakerStudentManagementView(APIView):
    """Handle student management operations"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get students in caretaker's hostel"""
        caretaker = request.user.caretaker_profile
        
        # Get current occupants
        occupants = RoomOccupant.objects.filter(
            room__hostel=caretaker.hostel,
            is_active=True
        ).select_related('room', 'student', 'student__user')
        
        students_data = []
        for occupant in occupants:
            # Get latest damage reports for this student
            damage_reports = DamageReport.objects.filter(
                booking__student=occupant.student,
                room__hostel=caretaker.hostel,
                status__in=['reported', 'investigating', 'repairing']
            ).count()
            
            # Get check-in/check-out status
            check_in_completed = occupant.check_in_completed
            check_out_completed = occupant.move_out_date is not None
            
            students_data.append({
                'occupant_id': occupant.id,
                'student_id': occupant.student.id,
                'student_name': occupant.student.user.get_full_name(),
                'student_email': occupant.student.user.email,
                'room_number': occupant.room.room_number,
                'move_in_date': occupant.move_in_date.isoformat(),
                'move_out_date': occupant.move_out_date.isoformat() if occupant.move_out_date else None,
                'check_in_completed': check_in_completed,
                'check_out_completed': check_out_completed,
                'open_damage_reports': damage_reports,
                'stay_duration_days': (occupant.move_out_date or timezone.now().date() - occupant.move_in_date).days
            })
        
        return Response({
            'students': students_data,
            'total_students': len(students_data),
            'active_students': len([s for s in students_data if not s['move_out_date']]),
            'completed_stays': len([s for s in students_data if s['move_out_date']])
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create incident report for student"""
        student_id = request.data.get('student_id')
        incident_type = request.data.get('incident_type')
        description = request.data.get('description')
        severity = request.data.get('severity', 'minor')
        
        if not all([student_id, incident_type, description]):
            return Response({
                'error': 'Student ID, incident type, and description are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({
                'error': 'Student not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create incident report (you might have a separate IncidentReport model)
        # For now, we'll create a damage report as placeholder
        incident_report = DamageReport.objects.create(
            room=student.room_occupancy.filter(is_active=True).first().room,
            booking=student.room_occupancy.filter(is_active=True).first().booking,
            reported_by=request.user,
            title=f"Incident: {incident_type}",
            description=description,
            severity=severity
        )
        
        return Response({
            'message': 'Incident report created successfully',
            'incident_id': incident_report.id,
            'incident_type': incident_type
        }, status=status.HTTP_201_CREATED)


class CaretakerNotificationView(APIView):
    """Handle notifications for caretakers"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get notifications for caretaker"""
        caretaker = request.user.caretaker_profile
        
        # Get recent activities and notifications
        from notifications.models import Notification
        
        notifications = Notification.objects.filter(
            recipient=request.user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')
        
        notification_data = []
        for notification in notifications:
            notification_data.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'notification_type': notification.notification_type,
                'channel': notification.channel,
                'is_read': notification.read_at is not None,
                'created_at': notification.created_at.isoformat(),
                'read_at': notification.read_at.isoformat() if notification.read_at else None
            })
        
        # Get pending tasks summary
        pending_check_ins = InventoryCheckIn.objects.filter(
            room__hostel=caretaker.hostel,
            status='pending'
        ).count()
        
        pending_check_outs = InventoryCheckOut.objects.filter(
            room__hostel=caretaker.hostel,
            status='pending'
        ).count()
        
        active_damage_reports = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status__in=['reported', 'investigating', 'repairing']
        ).count()
        
        active_visitors = VisitorCheckIn.objects.filter(
            hostel=caretaker.hostel,
            is_active=True
        ).count()
        
        return Response({
            'notifications': notification_data,
            'unread_count': len([n for n in notification_data if not n['is_read']]),
            'pending_tasks': {
                'check_ins': pending_check_ins,
                'check_outs': pending_check_outs,
                'damage_reports': active_damage_reports,
                'active_visitors': active_visitors
            }
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Mark notification as read"""
        notification_id = request.data.get('notification_id')
        
        if not notification_id:
            return Response({
                'error': 'Notification ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from notifications.models import Notification
        
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user
            )
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marked as read',
            'notification_id': notification_id
        }, status=status.HTTP_200_OK)


class CaretakerTaskManagementView(APIView):
    """Handle task management for caretakers"""
    
    permission_classes = [IsCaretaker]
    
    def get(self, request):
        """Get tasks for caretaker"""
        caretaker = request.user.caretaker_profile
        
        # Compile all pending tasks
        tasks = []
        
        # Check-in tasks
        check_ins = InventoryCheckIn.objects.filter(
            room__hostel=caretaker.hostel,
            status='pending'
        ).select_related('booking', 'room', 'student')
        
        for check_in in check_ins:
            tasks.append({
                'task_id': f'checkin_{check_in.id}',
                'task_type': 'check_in',
                'title': f'Check-in verification for {check_in.student.user.get_full_name()}',
                'description': f'Verify check-in for room {check_in.room.room_number}',
                'priority': 'medium',
                'due_date': check_in.created_at + timedelta(hours=24),
                'created_at': check_in.created_at.isoformat(),
                'related_id': check_in.id,
                'status': 'pending'
            })
        
        # Check-out tasks
        check_outs = InventoryCheckOut.objects.filter(
            room__hostel=caretaker.hostel,
            status='pending'
        ).select_related('booking', 'room', 'student')
        
        for check_out in check_outs:
            tasks.append({
                'task_id': f'checkout_{check_out.id}',
                'task_type': 'check_out',
                'title': f'Check-out verification for {check_out.student.user.get_full_name()}',
                'description': f'Verify check-out for room {check_out.room.room_number}',
                'priority': 'medium',
                'due_date': check_out.created_at + timedelta(hours=24),
                'created_at': check_out.created_at.isoformat(),
                'related_id': check_out.id,
                'status': 'pending'
            })
        
        # Damage reports
        damage_reports = DamageReport.objects.filter(
            room__hostel=caretaker.hostel,
            status__in=['reported', 'investigating']
        ).select_related('room')
        
        for report in damage_reports:
            priority = 'high' if report.severity == 'severe' else 'medium' if report.severity == 'moderate' else 'low'
            tasks.append({
                'task_id': f'damage_{report.id}',
                'task_type': 'damage_report',
                'title': f'Address damage report: {report.title}',
                'description': report.description,
                'priority': priority,
                'due_date': report.reported_at + timedelta(days=3) if report.severity == 'severe' else report.reported_at + timedelta(days=7),
                'created_at': report.reported_at.isoformat(),
                'related_id': report.id,
                'status': report.status
            })
        
        # Sort tasks by priority and due date
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        tasks.sort(key=lambda x: (priority_order[x['priority']], x['due_date']), reverse=True)
        
        # Calculate task statistics
        total_tasks = len(tasks)
        overdue_tasks = len([t for t in tasks if t['due_date'] < timezone.now()])
        high_priority_tasks = len([t for t in tasks if t['priority'] == 'high'])
        
        return Response({
            'tasks': tasks,
            'summary': {
                'total_tasks': total_tasks,
                'overdue_tasks': overdue_tasks,
                'high_priority_tasks': high_priority_tasks,
                'completion_rate': 0  # Would calculate based on completed vs total
            }
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Update task status"""
        task_id = request.data.get('task_id')
        task_type = request.data.get('task_type')  # checkin, checkout, damage_report
        action = request.data.get('action')  # complete, postpone, cancel
        
        if not all([task_id, task_type, action]):
            return Response({
                'error': 'Task ID, type, and action are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update based on task type
        if task_type == 'checkin':
            try:
                check_in = InventoryCheckIn.objects.get(
                    id=task_id.split('_')[1],
                    room__hostel=request.user.caretaker_profile.hostel
                )
                if action == 'complete':
                    check_in.status = 'verified'
                    check_in.caretaker_verified_at = timezone.now()
                    check_in.save()
            except InventoryCheckIn.DoesNotExist:
                return Response({'error': 'Check-in task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif task_type == 'checkout':
            try:
                check_out = InventoryCheckOut.objects.get(
                    id=task_id.split('_')[1],
                    room__hostel=request.user.caretaker_profile.hostel
                )
                if action == 'complete':
                    check_out.status = 'verified'
                    check_out.caretaker_verified_at = timezone.now()
                    check_out.save()
            except InventoryCheckOut.DoesNotExist:
                return Response({'error': 'Check-out task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif task_type == 'damage_report':
            try:
                report = DamageReport.objects.get(
                    id=task_id.split('_')[1],
                    room__hostel=request.user.caretaker_profile.hostel
                )
                if action == 'complete':
                    report.status = 'resolved'
                    report.resolved_at = timezone.now()
                    report.save()
                elif action == 'postpone':
                    report.status = 'investigating'
                    report.save()
            except DamageReport.DoesNotExist:
                return Response({'error': 'Damage report task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'message': f'Task {action} successfully',
            'task_id': task_id,
            'action': action
        }, status=status.HTTP_200_OK)