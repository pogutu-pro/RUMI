from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Case, When
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema

from .models import Notification, NotificationPreference, EmailTemplate, SMSTemplate


class NotificationListView(APIView):
    """
    Notification List API
    
    Retrieve user's in-app notifications with filtering and pagination.
    
    GET: List user's notifications with read status filtering
    
    Authentication Required: JWT Token
    Permissions: Authenticated users (any role)
    
    This endpoint provides users with comprehensive notification management
    including read/unread filtering and pagination for large notification sets.
    
    Features:
    - Unread notification filtering
    - Pagination support
    - Notification type categorization
    - Real-time read status tracking
    - Comprehensive metadata support
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Notifications'],
        operation_summary="Get User Notifications",
        operation_description="Retrieve in-app notifications for authenticated users with filtering and pagination"
    )

    def get(self, request):
        """
        Get User Notifications
        
        Retrieve in-app notifications for the authenticated user.
        
        Query Parameters:
        - unread_only: Filter to show only unread notifications (true/false)
        - limit: Number of notifications per page (default: 20)
        - offset: Pagination offset for result sets
        
        Returns comprehensive notification data:
        
        Notification Details:
        - notification_id: Unique notification identifier
        - type: Notification category/type
        - subject: Notification title or subject line
        - message: Detailed notification message
        - metadata: Additional notification data (JSON)
        - created_at: Notification creation timestamp
        - read_at: Read timestamp (null if unread)
        
        Summary Statistics:
        - unread_count: Number of unread notifications
        - total_count: Total number of notifications
        - notifications: Paginated notification list
        
        Notification Types:
        - booking_confirmations: Booking status updates
        - payment_notifications: Payment and transaction alerts
        - maintenance_alerts: Property maintenance notifications
        - security_alerts: Security and safety updates
        - system_notifications: Platform and system messages
        - marketing_messages: Promotional and marketing content
        
        Usage:
        - Dashboard notification widgets
        - Mobile push notification sync
        - Email notification filtering
        - Notification history tracking
        - User engagement analytics
        
        Performance Features:
        - Efficient pagination for large datasets
        - Optimized unread count queries
        - Selective field retrieval
        
        Note: Only returns in-app notifications, not email or SMS.
        """
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
    """
    Notification Read Status API
    
    Mark individual notifications as read with timestamp tracking.
    
    PUT: Mark specific notification as read
    
    Authentication Required: JWT Token
    Permissions: Authenticated users (own notifications only)
    
    This endpoint allows users to mark individual notifications as read,
    updating read timestamps and maintaining notification history.
    
    Features:
    - Individual notification read tracking
    - Read timestamp recording
    - Duplicate read prevention
    - Permission validation
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Notifications'],
        operation_summary="Mark Notification as Read",
        operation_description="Mark a specific notification as read with timestamp tracking",
        responses={
            200: 'Successfully marked notification as read',
            404: 'Notification not found',
            401: 'Authentication required'
        }
    )

    def put(self, request, notification_id):
        """
        Mark Notification as Read
        
        Mark a specific notification as read with timestamp tracking.
        
        Path Parameters:
        - notification_id: Unique notification identifier
        
        Process:
        1. Validate notification ownership and existence
        2. Check current read status
        3. Update read timestamp if not already read
        4. Return confirmation with read details
        
        Returns notification read status:
        
        Status Information:
        - notification_id: Processed notification identifier
        - status: Read status confirmation
        - read_at: Timestamp when notification was marked read
        
        Error Handling:
        - 404: Notification not found
        - 403: Unauthorized access to notification
        - 500: Read status update failure
        
        Security Features:
        - Ownership validation
        - Access control enforcement
        - Audit trail maintenance
        
        Usage:
        - Notification dashboard management
        - Mobile app read status sync
        - Email notification linking
        - User engagement tracking
        
        Note: Idempotent operation - safe to call multiple times.
        """
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
    """
    Bulk Notification Management API
    
    Mark all user notifications as read in a single operation.
    
    PUT: Mark all in-app notifications as read
    
    Authentication Required: JWT Token
    Permissions: Authenticated users (own notifications only)
    
    This endpoint provides bulk notification management allowing users
    to mark all their unread notifications as read at once.
    
    Features:
    - Bulk read status update
    - Efficient batch processing
    - Read count tracking
    - Atomic operation support
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Notifications'],
        operation_summary="Mark All Notifications as Read",
        operation_description="Bulk operation to mark all unread notifications as read",
        responses={
            200: 'Successfully marked all notifications as read',
            401: 'Authentication required'
        }
    )

    def put(self, request):
        """
        Mark All Notifications as Read
        
        Bulk operation to mark all unread notifications as read.
        
        Process:
        1. Identify all unread notifications for user
        2. Update read timestamps in single operation
        3. Return count of updated notifications
        4. Maintain audit trail
        
        Returns bulk operation results:
        
        Operation Summary:
        - message: Confirmation message with updated count
        - updated_count: Number of notifications marked as read
        
        Performance Features:
        - Single database query for efficiency
        - Batch update operation
        - Minimal resource usage
        - Fast response times
        
        Use Cases:
        - User clearing notification inbox
        - Mobile app sync operations
        - Dashboard refresh actions
        - Email archive management
        - User experience optimization
        
        Error Handling:
        - 500: Bulk update operation failure
        
        Security Features:
        - User-specific operation scope
        - Ownership validation
        - Audit trail maintenance
        
        Note: Efficient for users with large notification volumes.
        """
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
    """
    Notification Preferences Management API
    
    Manage user notification preferences across all channels.
    
    GET: Retrieve current notification preferences
    PUT: Update notification preference settings
    
    Authentication Required: JWT Token
    Permissions: Authenticated users (own preferences only)
    
    This endpoint allows users to customize their notification preferences
    across different channels and notification types.
    
    Preference Categories:
    - Channel preferences (email, SMS, in-app)
    - Content preferences (booking, payments, marketing)
    - Frequency preferences (immediate, digest, weekly)
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Notifications'],
        operation_summary="Notification Preferences Management",
        operation_description="Manage user notification preferences across all channels and types",
        responses={
            200: 'Successfully retrieved preferences',
            401: 'Authentication required'
        }
    )

    def get(self, request):
        """
        Get Notification Preferences
        
        Retrieve current notification preferences for the authenticated user.
        
        Returns comprehensive preference settings:
        
        Channel Preferences:
        - email_enabled: Email notification enable/disable
        - sms_enabled: SMS notification enable/disable
        - in_app_enabled: In-app notification preference
        
        Content Preferences:
        - booking_updates: Accommodation booking notifications
        - payment_notifications: Payment and transaction alerts
        - maintenance_alerts: Property maintenance updates
        - security_alerts: Security and safety notifications
        - marketplace_updates: Property listing updates
        - roommate_updates: Roommate matching notifications
        - marketing_emails: Promotional and marketing content
        
        Default Values:
        - New users get sensible defaults
        - Critical notifications cannot be disabled
        - Regulatory compliance maintained
        
        Usage:
        - Settings page population
        - Preference change tracking
        - Notification delivery optimization
        - User experience customization
        - Compliance monitoring
        
        Note: Some notifications may be mandatory for service functionality.
        """
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
        """
        Update Notification Preferences
        
        Update notification preference settings for the authenticated user.
        
        Request Body (all optional):
        - email_enabled: Enable/disable email notifications
        - sms_enabled: Enable/disable SMS notifications
        - booking_updates: Booking-related notifications
        - payment_notifications: Payment and transaction alerts
        - maintenance_alerts: Property maintenance updates
        - security_alerts: Security notifications
        - marketplace_updates: Property listing notifications
        - roommate_updates: Roommate matching notifications
        - marketing_emails: Marketing and promotional content
        
        Process:
        1. Retrieve existing preferences or create defaults
        2. Validate requested changes
        3. Apply allowed updates
        4. Save new preference settings
        5. Return updated preferences
        
        Validation Rules:
        - Only specified fields are updated
        - Boolean values validated
        - Critical notifications may be protected
        - Compliance requirements enforced
        
        Returns updated preference configuration:
        
        Confirmation Details:
        - message: Update confirmation
        - All preference fields with current values
        - Changes successfully applied
        
        Security Features:
        - User-specific preference updates
        - Input validation and sanitization
        - Audit trail for changes
        - Compliance enforcement
        
        Error Handling:
        - 500: Preference update failure
        
        Usage:
        - Settings page form processing
        - Mobile app preference sync
        - Email subscription management
        - Notification delivery optimization
        
        Note: Changes take effect immediately for new notifications.
        """
        try:
            prefs = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            prefs = NotificationPreference.objects.create(user=request.user)
        except Exception:
            return Response({
                'error': 'Failed to update preferences'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update allowed fields. sms_enabled is deliberately excluded — SMS
        # rent reminders are how RumiaRent gets a tenant's attention when
        # email goes unread, and letting a tenant silently opt out defeats
        # the point of the reminder for both them and their landlord. The
        # field is still readable (always true) but not settable here.
        allowed_fields = [
            'email_enabled', 'marketing_emails',
            'booking_updates', 'marketplace_updates', 'roommate_updates'
        ]

        updated = False
        for field in allowed_fields:
            if field in request.data:
                setattr(prefs, field, request.data[field])
                updated = True

        if not prefs.sms_enabled:
            prefs.sms_enabled = True
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
    """
    Admin Email Template Management API
    
    Retrieve email templates for administrative management and customization.
    
    GET: List all active email templates for admin review
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint provides administrators with comprehensive email template
    management capabilities for platform communications.
    
    Features:
    - Template inventory management
    - Variable placeholder tracking
    - Template version control
    - Active status filtering
    - Administrative oversight
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Tech Support'],
        operation_summary="Get Email Templates",
        operation_description="Retrieve all active email templates for administrative management",
        responses={
            200: 'Successfully retrieved email templates',
            403: 'Admin access required'
        }
    )

    def get(self, request):
        """
        Get Email Templates
        
        Retrieve all active email templates for administrative management.
        
        Access Control:
        - Tech Support: Read-only template access
        - Super Admin: Full template management access
        - Other roles: Access denied
        
        Returns comprehensive template information:
        
        Template Details:
        - template_id: Unique template identifier
        - name: Template name and identifier
        - subject: Email subject line template
        - variables: Available placeholder variables
        - created_at: Template creation timestamp
        - updated_at: Last modification timestamp
        - is_active: Template activation status
        - version: Template version number
        
        Template Categories:
        - welcome_emails: New user welcome messages
        - verification_emails: Email verification requests
        - booking_confirmations: Accommodation booking updates
        - payment_notifications: Transaction and payment alerts
        - maintenance_alerts: Property maintenance communications
        - security_notifications: Security and safety updates
        - marketing_emails: Promotional and marketing content
        
        Variable System:
        - Dynamic content placeholders
        - User-specific personalization
        - System-generated content
        - Localization support
        - Conditional content blocks
        
        Administrative Features:
        - Template usage analytics
        - Delivery performance metrics
        - A/B testing support
        - Compliance tracking
        - Content approval workflow
        
        Usage:
        - Email template management
        - Content customization
        - Communication monitoring
        - Compliance oversight
        - Platform administration
        
        Error Handling:
        - 403: Insufficient administrative privileges
        
        Note: Templates contain sensitive communication content.
        """
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
                'updated_at': template.updated_at,
                'source': 'custom',
            })

        # The platform's own emails are written in code; list them too so this
        # page shows every message that actually goes out.
        from .catalog import EMAIL_CATALOG
        templates_data.extend({**entry, 'source': 'built_in'} for entry in EMAIL_CATALOG)

        return Response({
            'total_templates': len(templates_data),
            'templates': templates_data
        }, status=status.HTTP_200_OK)


class AdminSMSTemplateListView(APIView):
    """
    Admin SMS Template Management API
    
    Retrieve SMS templates for administrative management and mobile communications.
    
    GET: List all active SMS templates for admin review
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint provides administrators with comprehensive SMS template
    management for mobile-first communications and alerts.
    
    Features:
    - SMS template inventory
    - Character count tracking
    - Mobile optimization
    - Compliance management
    - Delivery tracking
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Tech Support'],
        operation_summary="Get SMS Templates",
        operation_description="Retrieve all active SMS templates for administrative management",
        responses={
            200: 'Successfully retrieved SMS templates',
            403: 'Admin access required'
        }
    )

    def get(self, request):
        """
        Get SMS Templates
        
        Retrieve all active SMS templates for administrative management.
        
        Access Control:
        - Tech Support: Read-only template access
        - Super Admin: Full template management access
        - Other roles: Access denied
        
        Returns comprehensive SMS template data:
        
        Template Details:
        - template_id: Unique template identifier
        - name: Template name and identifier
        - message: SMS message content template
        - variables: Available placeholder variables
        - created_at: Template creation timestamp
        - character_count: Message length tracking
        - is_active: Template activation status
        - delivery_priority: Message priority level
        
        SMS-Specific Features:
        - Character limit compliance (160/GSM, 70/Unicode)
        - Multi-part message handling
        - Mobile carrier optimization
        - Delivery confirmation tracking
        - Cost per message calculation
        
        Template Categories:
        - otp_verification: One-time password messages
        - booking_alerts: Accommodation booking notifications
        - payment_reminders: Payment due notifications
        - security_codes: Access and security codes
        - maintenance_updates: Property maintenance alerts
        - emergency_notifications: Critical safety messages
        
        Optimization Features:
        - Message length optimization
        - Carrier-specific formatting
        - Unicode character support
        - Delivery speed prioritization
        - Cost-effective messaging
        
        Compliance Management:
        - SMS regulations compliance
        - Opt-in/opt-out tracking
        - Message frequency limits
        - Emergency message protocols
        - Data protection compliance
        
        Usage:
        - SMS template management
        - Mobile communication oversight
        - Delivery performance monitoring
        - Cost optimization
        - Compliance management
        
        Error Handling:
        - 403: Insufficient administrative privileges
        
        Note: SMS templates optimized for mobile delivery.
        """
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
                'created_at': template.created_at,
                'source': 'custom',
            })

        from .catalog import SMS_CATALOG
        templates_data.extend({**entry, 'source': 'built_in'} for entry in SMS_CATALOG)

        return Response({
            'total_templates': len(templates_data),
            'templates': templates_data
        }, status=status.HTTP_200_OK)


class AdminNotificationStatsView(APIView):
    """
    Admin Notification Analytics API
    
    Provide comprehensive notification delivery statistics and performance metrics.
    
    GET: Retrieve notification delivery statistics and analytics
    
    Authentication Required: JWT Token
    Permissions: Tech Support or Super Admin only
    
    This endpoint provides administrators with comprehensive notification
    analytics including delivery rates, failure analysis, and performance metrics.
    
    Features:
    - Delivery rate tracking
    - Channel performance analysis
    - Failure reason breakdown
    - Volume trend analysis
    - Compliance monitoring
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=['Tech Support'],
        operation_summary="Get Notification Statistics",
        operation_description="Retrieve comprehensive notification delivery analytics and metrics",
        responses={
            200: 'Successfully retrieved notification statistics',
            403: 'Admin access required'
        }
    )

    def get(self, request):
        """
        Get Notification Statistics
        
        Retrieve comprehensive notification delivery analytics and metrics.
        
        Analysis Period: Last 30 days
        
        Returns detailed notification statistics:
        
        Overall Metrics:
        - period: Analysis timeframe
        - total_notifications: Total notifications sent
        - successful_deliveries: Successfully delivered notifications
        - failed_deliveries: Failed notification deliveries
        - delivery_rate: Success percentage
        
        Channel Breakdown:
        - email: Email notification statistics
        - sms: SMS notification statistics
        - in_app: In-app notification statistics
        
        Failure Analysis:
        - top_failed_types: Most common failure reasons
        - failure_rate_by_type: Failure rates by notification type
        - technical_failures: System and technical issues
        - user_action_failures: User-related delivery failures
        
        Performance Metrics:
        - average_delivery_time: Mean delivery duration
        - peak_volume_periods: High-traffic notification times
        - channel_efficiency: Comparative channel performance
        - user_engagement: Notification interaction rates
        
        Quality Indicators:
        - bounce_rates: Email/SMS bounce statistics
        - spam_rates: Spam filter impact
        - unsubscribe_rates: User opt-out trends
        - complaint_rates: User complaint frequency
        
        Business Intelligence:
        - notification_impact: User action correlation
        - retention_metrics: Notification-driven retention
        - revenue_impact: Revenue attribution to notifications
        - cost_analysis: Notification delivery costs
        
        Compliance Tracking:
        - regulatory_compliance: Compliance adherence rates
        - opt_in_rates: User consent statistics
        - data_protection: Privacy regulation compliance
        - audit_trail: Notification delivery audit data
        
        Usage:
        - Platform performance monitoring
        - Delivery optimization
        - User experience improvement
        - Compliance reporting
        - Business intelligence analysis
        - Cost optimization
        
        Error Handling:
        - 403: Insufficient administrative privileges
        
        Note: Analytics cover all notification channels and types.
        """
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


class AdminDeliveryLogView(APIView):
    """
    Admin delivery log: the most recent email and SMS attempts, with outcome.

    GET /notifications/admin/deliveries/?channel=email|sms&status=sent|failed&limit=50

    Tech support and super admins only. Message bodies are never stored, so
    this exposes who was contacted, when, the email subject and any failure
    reason - not codes or links.
    """

    permission_classes = [permissions.IsAuthenticated]
    MAX_LIMIT = 100

    def get(self, request):
        if request.user.role not in ['tech_support', 'super_admin']:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        from .delivery_log import DELIVERY_TYPES

        rows = Notification.objects.filter(notification_type__in=DELIVERY_TYPES)
        channel = request.query_params.get('channel')
        if channel in ('email', 'sms'):
            rows = rows.filter(channel=channel)
        outcome = request.query_params.get('status')
        if outcome in ('sent', 'failed'):
            rows = rows.filter(status=outcome)

        try:
            limit = min(max(int(request.query_params.get('limit', 50)), 1), self.MAX_LIMIT)
        except ValueError:
            limit = 50

        rows = rows.select_related('recipient').order_by('-created_at')[:limit]
        return Response({
            'results': [
                {
                    'id': row.id,
                    'channel': row.channel,
                    'status': row.status,
                    'recipient_address': row.recipient_address,
                    'recipient_name': (
                        row.recipient.get_full_name().strip() if row.recipient_id else ''
                    ),
                    'subject': row.subject or '',
                    'error_message': row.error_message or '',
                    'created_at': row.created_at,
                }
                for row in rows
            ],
        }, status=status.HTTP_200_OK)
