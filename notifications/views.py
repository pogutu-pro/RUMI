from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Case, When
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, NotificationPreference, EmailTemplate, SMSTemplate


class NotificationListView(APIView):
    """Get user's in-app notifications"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List notifications"""
        queryset = Notification.objects.filter(
            recipient=request.user,
            channel='in_app'
        ).order_by('-created_at')

        # Filter unread only
        unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'
        if unread_only:
            queryset = queryset.filter(read_at__isnull=True)

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        total_count = queryset.count()
        notifications = queryset[offset:offset + limit]

        # Count unread
        unread_count = Notification.objects.filter(
            recipient=request.user,
            channel='in_app',
            read_at__isnull=True
        ).count()

        notifications_data = []
        for notification in notifications:
            notifications_data.append({
                'notification_id': notification.id,
                'type': notification.notification_type,
                'subject': notification.subject,
                'message': notification.message,
                'metadata': notification.metadata,
                'created_at': notification.created_at,
                'read_at': notification.read_at
            })

        return Response({
            'unread_count': unread_count,
            'total_count': total_count,
            'notifications': notifications_data
        }, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """Mark notification as read"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, notification_id):
        """Mark single notification as read"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user,
                channel='in_app'
            )
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({
                'error': 'Failed to mark notification as read'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save()

        return Response({
            'notification_id': notification.id,
            'status': 'read',
            'read_at': notification.read_at
        }, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    """Mark all notifications as read"""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        """Mark all in-app notifications as read"""
        updated_count = Notification.objects.filter(
            recipient=request.user,
            channel='in_app',
            read_at__isnull=True
        ).update(read_at=timezone.now())

        return Response({
            'message': f'Marked {updated_count} notifications as read',
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)


class NotificationPreferencesView(APIView):
    """Manage notification preferences"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user preferences"""
        try:
            prefs = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            # Create default preferences
            prefs = NotificationPreference.objects.create(user=request.user)
        except Exception:
            return Response({
                'error': 'Failed to retrieve preferences'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'email_enabled': prefs.email_enabled,
            'sms_enabled': prefs.sms_enabled,
            'marketing_emails': prefs.marketing_emails,
            'booking_updates': prefs.booking_updates,
            'marketplace_updates': prefs.marketplace_updates,
            'roommate_updates': prefs.roommate_updates
        }, status=status.HTTP_200_OK)

    def put(self, request):
        """Update preferences"""
        try:
            prefs = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            prefs = NotificationPreference.objects.create(user=request.user)
        except Exception:
            return Response({
                'error': 'Failed to update preferences'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update allowed fields
        allowed_fields = [
            'email_enabled', 'sms_enabled', 'marketing_emails',
            'booking_updates', 'marketplace_updates', 'roommate_updates'
        ]

        updated = False
        for field in allowed_fields:
            if field in request.data:
                setattr(prefs, field, request.data[field])
                updated = True

        if updated:
            prefs.save()

        return Response({
            'message': 'Preferences updated successfully',
            'email_enabled': prefs.email_enabled,
            'sms_enabled': prefs.sms_enabled,
            'marketing_emails': prefs.marketing_emails,
            'booking_updates': prefs.booking_updates,
            'marketplace_updates': prefs.marketplace_updates,
            'roommate_updates': prefs.roommate_updates
        }, status=status.HTTP_200_OK)


# Admin views for managing templates
class AdminEmailTemplateListView(APIView):
    """List email templates (Admin only)"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List email templates"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        templates = EmailTemplate.objects.filter(is_active=True)

        templates_data = []
        for template in templates:
            templates_data.append({
                'template_id': template.id,
                'name': template.name,
                'subject': template.subject,
                'variables': template.variables,
                'created_at': template.created_at,
                'updated_at': template.updated_at
            })

        return Response({
            'total_templates': len(templates_data),
            'templates': templates_data
        }, status=status.HTTP_200_OK)


class AdminSMSTemplateListView(APIView):
    """List SMS templates (Admin only)"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List SMS templates"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        templates = SMSTemplate.objects.filter(is_active=True)

        templates_data = []
        for template in templates:
            templates_data.append({
                'template_id': template.id,
                'name': template.name,
                'message': template.message,
                'variables': template.variables,
                'created_at': template.created_at
            })

        return Response({
            'total_templates': len(templates_data),
            'templates': templates_data
        }, status=status.HTTP_200_OK)


class AdminNotificationStatsView(APIView):
    """Notification statistics (Admin only)"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get notification stats"""
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        # Get stats for last 30 days
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)

        stats = Notification.objects.filter(
            created_at__gte=thirty_days_ago
        ).aggregate(
            total_sent=Count(Case(When(status='sent', then=1))),
            total_failed=Count(Case(When(status='failed', then=1))),
            email_count=Count(Case(When(channel='email', then=1))),
            sms_count=Count(Case(When(channel='sms', then=1))),
            in_app_count=Count(Case(When(channel='in_app', then=1)))
        )

        # Failed notifications by type
        failed_by_type = Notification.objects.filter(
            status='failed',
            created_at__gte=thirty_days_ago
        ).values('notification_type').annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        return Response({
            'period': 'last_30_days',
            'total_notifications': stats['total_sent'] + stats['total_failed'],
            'successful_deliveries': stats['total_sent'],
            'failed_deliveries': stats['total_failed'],
            'delivery_rate': (
                stats['total_sent'] / (stats['total_sent'] + stats['total_failed']) * 100
                if (stats['total_sent'] + stats['total_failed']) > 0 else 0
            ),
            'by_channel': {
                'email': stats['email_count'],
                'sms': stats['sms_count'],
                'in_app': stats['in_app_count']
            },
            'top_failed_types': list(failed_by_type)
        }, status=status.HTTP_200_OK)
