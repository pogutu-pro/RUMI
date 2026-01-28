# RUMI API Organization Summary

## Overview
The RUMI API endpoints have been reorganized into logical categories for better documentation, maintainability, and developer experience. The API now follows a clear hierarchical structure that groups related functionality together.

## New URL Structure

### System & Monitoring Endpoints
- `GET /admin/` - Django Admin Dashboard
- `GET /metrics/` - Prometheus metrics
- `GET /metrics-proxy/` - Custom metrics proxy
- `GET /health/` - Health check endpoint

### API Documentation
- `GET /swagger/` - Swagger UI documentation
- `GET /redoc/` - ReDoc documentation
- `GET /swagger.json` - JSON schema

### Authentication & User Management
**Base URL:** `/api/v1/auth/`

#### Authentication Endpoints
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/verify-email/` - Email verification
- `POST /api/v1/auth/resend-otp/` - Resend OTP
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/refresh-token/` - Token refresh
- `POST /api/v1/auth/logout/` - User logout

#### Password Management
- `POST /api/v1/auth/password/reset/` - Password reset request
- `POST /api/v1/auth/password/reset/verify/` - Verify reset token
- `POST /api/v1/auth/password/reset/confirm/` - Confirm password reset

#### User Profile Management
- `GET/PUT /api/v1/auth/profile/` - User profile
- `GET /api/v1/auth/profile/completion/` - Profile completion status
- `POST /api/v1/auth/profile/picture/` - Upload profile picture

#### Student-Specific Endpoints
- `GET /api/v1/auth/student/dashboard/` - Student dashboard
- `GET /api/v1/auth/student/security/late-entries/` - Late entry logs
- `GET/POST /api/v1/auth/student/security/visitor-invitations/` - Visitor invitations
- `GET /api/v1/auth/student/support/tickets/` - Support tickets
- `GET /api/v1/auth/student/activity/feed/` - Activity feed

#### Landlord-Specific Endpoints
- `GET /api/v1/auth/landlord/dashboard/` - Landlord dashboard
- `GET /api/v1/auth/landlords/verification/list/` - Landlord verification list
- `POST /api/v1/auth/landlords/{id}/verification/{action}/` - Verify/reject landlord
- `GET/POST /api/v1/auth/landlords/caretakers/` - Caretaker management
- `GET/PUT/DELETE /api/v1/auth/landlords/caretakers/{id}/` - Caretaker detail operations

#### Admin User Management
- `GET /api/v1/auth/admin/users/` - User management
- `PUT /api/v1/auth/admin/users/{id}/deactivate/` - Deactivate user
- `PUT /api/v1/auth/admin/users/{id}/reactivate/` - Reactivate user
- `GET /api/v1/auth/admin/users/{id}/activity/` - User activity log

#### Messaging System
- `GET /api/v1/auth/messaging/conversations/` - List conversations
- `GET/POST /api/v1/auth/messaging/conversations/{id}/messages/` - Messages in conversation
- `POST /api/v1/auth/messaging/send/` - Send message
- `GET /api/v1/auth/messaging/unread-count/` - Unread message count

### Role-Based Administrative Endpoints

#### Super Admin - Full System Access
**Base URL:** `/api/v1/super-admin/`
- Complete system access and control
- User management across all roles
- Platform configuration
- System settings management

#### Platform Admin - Content Moderation & User Management
**Base URL:** `/api/v1/platform-admin/`
- Content moderation
- User management
- Platform oversight
- Policy enforcement

#### General Admin - Platform Oversight
**Base URL:** `/api/v1/admin/`

##### User Management & Statistics
- `GET /api/v1/admin/users/stats/` - User statistics
- `GET /api/v1/admin/users/management/` - User management interface

##### Platform Management
- `GET /api/v1/admin/platform/stats/` - Platform statistics
- `GET /api/v1/admin/system/health/` - System health

##### Landlord Management
- `GET /api/v1/admin/landlords/verifications/` - Landlord verifications

##### Hostel Management
- `GET /api/v1/admin/hostels/moderation/` - Hostel moderation
- `GET /api/v1/admin/hostels/pending/` - Pending hostels

##### Payment Management
- `GET /api/v1/admin/payments/disputes/` - Payment disputes
- `GET /api/v1/admin/payments/disputes/stats/` - Dispute statistics

##### Subscription Management
- `GET /api/v1/admin/subscriptions/` - Subscription management
- `GET /api/v1/admin/subscriptions/stats/` - Subscription statistics

##### Activity & Dashboard
- `GET /api/v1/admin/dashboard/stats/` - Dashboard statistics
- `GET /api/v1/admin/activity-feed/` - System activity feed

#### Tech Support - System Maintenance & User Support
**Base URL:** `/api/v1/tech-support/`

##### Support Dashboard & Tickets
- `GET /api/v1/tech-support/dashboard/` - Support dashboard
- `GET /api/v1/tech-support/tickets/` - Support tickets
- `GET /api/v1/tech-support/tickets/{id}/` - Ticket detail
- `POST /api/v1/tech-support/tickets/{id}/respond/` - Respond to ticket
- `POST /api/v1/tech-support/tickets/{id}/escalate/` - Escalate ticket
- `POST /api/v1/tech-support/tickets/{id}/resolve/` - Resolve ticket
- `GET /api/v1/tech-support/tickets/stats/` - Ticket statistics

##### System Management
- `GET /api/v1/tech-support/users/` - User visibility management
- `GET /api/v1/tech-support/hostels/` - Hostel management
- `GET /api/v1/tech-support/transactions/` - Transaction management
- `GET /api/v1/tech-support/messages/` - Messaging management
- `GET /api/v1/tech-support/logs/` - System logs
- `GET /api/v1/tech-support/stats/` - System statistics

##### System Health & Maintenance
- `GET /api/v1/tech-support/system/health/` - System health
- `GET /api/v1/tech-support/maintenance/` - Maintenance operations
- `GET /api/v1/tech-support/maintenance/schedule/` - Maintenance scheduling
- `GET /api/v1/tech-support/maintenance/backup/` - System backup

##### Technical Analytics
- `GET /api/v1/tech-support/analytics/performance/` - Performance analytics
- `GET /api/v1/tech-support/analytics/errors/` - Error analytics
- `GET /api/v1/tech-support/analytics/usage/` - Usage analytics

##### Blog Management
- `GET/POST /api/v1/tech-support/blog/posts/` - Blog posts
- `GET/PUT /api/v1/tech-support/blog/posts/{id}/` - Blog post detail
- `POST /api/v1/tech-support/blog/posts/{id}/publish/` - Publish post
- `POST /api/v1/tech-support/blog/posts/{id}/unpublish/` - Unpublish post
- `DELETE /api/v1/tech-support/blog/posts/{id}/` - Delete post

### Role-Specific User Endpoints

#### Landlord APIs
**Base URL:** `/api/v1/landlord/`
- `GET /api/v1/landlord/dashboard/overview/` - Dashboard overview
- `GET /api/v1/landlord/dashboard/activity-feed/` - Activity feed
- `GET /api/v1/landlord/payments/reports/` - Payment reports
- `GET /api/v1/landlord/payments/analytics/` - Payment analytics
- `GET /api/v1/landlord/payments/transactions/recent/` - Recent transactions

#### Student APIs
**Base URL:** `/api/v1/student/`
- `GET /api/v1/student/reviews/pending/` - Pending reviews
- `GET/POST /api/v1/student/visitor-invitations/` - Visitor invitations
- `GET/POST /api/v1/student/roommate-requests/` - Roommate requests

#### Caretaker Operations
**Base URL:** `/api/v1/caretaker/`
- Caretaker-specific operations and management

### Core Business Functionality

#### Hostel & Property Management
**Base URL:** `/api/v1/hostels/`

##### Hostel Management
- `GET /api/v1/hostels/properties/` - List hostels
- `POST /api/v1/hostels/properties/create/` - Create hostel
- `GET /api/v1/hostels/properties/{id}/` - Hostel details

##### Room Management
- `GET /api/v1/hostels/rooms/` - List rooms
- `GET /api/v1/hostels/rooms/{id}/` - Room details
- `POST /api/v1/hostels/properties/{id}/rooms/create/` - Create room

##### Inventory Management
- `POST /api/v1/hostels/properties/{id}/inventory/templates/` - Create inventory template
- `GET /api/v1/hostels/properties/{id}/inventory/templates/{template_id}/` - Template details

##### Inventory Check-in Process
- `POST /api/v1/hostels/checkin/{booking_id}/start/` - Start check-in
- `PUT /api/v1/hostels/checkin/{checkin_id}/submit/` - Submit check-in
- `PUT /api/v1/hostels/checkin/{checkin_id}/verify/` - Verify check-in

##### Search & Discovery
- `GET /api/v1/hostels/search/` - Search hostels
- `GET /api/v1/hostels/rooms/search/` - Search rooms

##### Roommate Matching
- `GET /api/v1/hostels/rooms/{id}/roommates/` - Find roommates

##### Room Reservation & Booking
- `POST /api/v1/hostels/rooms/{id}/reserve/` - Reserve room
- `POST /api/v1/hostels/rooms/{id}/book/` - Book room

#### Payment Processing & Financial Management
**Base URL:** `/api/v1/payments/`

##### Payment Initialization & Processing
- `POST /api/v1/payments/initialize/` - Initialize payment
- `POST /api/v1/payments/mpesa/initialize/` - M-Pesa initialization
- `GET /api/v1/payments/mpesa/status/` - M-Pesa payment status
- `GET /api/v1/payments/mpesa/config/` - M-Pesa configuration

##### Payment Webhooks
- `POST /api/v1/payments/webhooks/mpesa/stk_push/` - M-Pesa STK Push webhook
- `POST /api/v1/payments/webhooks/mpesa/c2b_validation/` - C2B validation webhook
- `POST /api/v1/payments/webhooks/mpesa/c2b_confirmation/` - C2B confirmation webhook
- `POST /api/v1/payments/webhooks/paystack/` - Paystack webhook

##### Recurring Payment Management
- `POST /api/v1/payments/recurring/enable/` - Enable recurring payment
- `POST /api/v1/payments/recurring/{id}/pause/` - Pause recurring payment
- `POST /api/v1/payments/recurring/{id}/resume/` - Resume recurring payment
- `POST /api/v1/payments/recurring/{id}/cancel/` - Cancel recurring payment

##### Late Fee Management
- `GET /api/v1/payments/late-fees/{booking_id}/` - Late fees for booking
- `POST /api/v1/payments/late-fees/{fee_id}/pay/` - Pay late fee

##### Saved Payment Methods
- `GET/POST /api/v1/payments/methods/` - Payment methods
- `POST /api/v1/payments/methods/{id}/set-default/` - Set default method
- `DELETE /api/v1/payments/methods/{id}/` - Delete payment method

##### Receipt and Tax Management
- `GET /api/v1/payments/receipts/{transaction_id}/` - Payment receipt
- `GET /api/v1/payments/tax-reports/` - Tax reports
- `GET /api/v1/payments/tax-reports/{report_id}/download/` - Download tax report

##### Analytics and Reporting
- `GET /api/v1/payments/analytics/revenue/` - Revenue analytics

##### Transaction Management
- `GET /api/v1/payments/transactions/student/` - Student transactions
- `GET /api/v1/payments/transactions/student/{id}/` - Student transaction detail
- `GET /api/v1/payments/transactions/landlord/` - Landlord transactions
- `GET /api/v1/payments/transactions/admin/` - Admin transactions

##### Payout Management
- `GET /api/v1/payments/payouts/landlord/` - Landlord payouts

##### Refund Management
- `POST /api/v1/payments/refunds/create/` - Create refund request
- `GET /api/v1/payments/refunds/` - List refund requests
- `POST /api/v1/payments/refunds/{id}/process/` - Process refund

#### Notification System
**Base URL:** `/api/v1/notifications/`

##### User Notifications
- `GET /api/v1/notifications/` - List notifications
- `POST /api/v1/notifications/{id}/read/` - Mark notification as read
- `POST /api/v1/notifications/mark-all-read/` - Mark all as read
- `GET/POST /api/v1/notifications/preferences/` - Notification preferences

##### Admin Template Management
- `GET /api/v1/notifications/admin/templates/email/` - Email templates
- `GET /api/v1/notifications/admin/templates/sms/` - SMS templates
- `GET /api/v1/notifications/admin/stats/` - Notification statistics

#### Analytics & Reporting
**Base URL:** `/api/v1/analytics/`
- Platform analytics and reporting endpoints

#### Roommate Matching System
**Base URL:** `/api/v1/roommates/`
- Roommate matching and compatibility endpoints

#### Home & General Application Features
**Base URL:** `/api/v1/home/`
- General application features and utilities

## Benefits of New Organization

### Improved Developer Experience
- **Logical Grouping**: Related endpoints are grouped together
- **Clear Naming**: Consistent and intuitive URL patterns
- **Role-Based Access**: Easy to identify which endpoints require which permissions

### Better Documentation
- **Swagger UI**: Clear categorization in Swagger documentation
- **ReDoc**: Organized display in ReDoc interface
- **JSON Schema**: Structured schema for API consumers

### Enhanced Maintainability
- **Modular Structure**: Easy to add new endpoints to appropriate categories
- **Consistent Patterns**: Standardized URL patterns across the API
- **Separation of Concerns**: Clear boundaries between different functional areas

### Security & Permissions
- **Role-Based URLs**: Easy to implement role-based access control
- **Endpoint Discovery**: Clear understanding of which endpoints belong to which roles
- **Permission Mapping**: Simplified permission management

## Total Endpoint Count
- **369 endpoints** across all categories
- All endpoints properly documented with Swagger/OpenAPI
- Organized into logical, maintainable groups

## Next Steps
1. Update API documentation and guides
2. Implement role-based access control at the URL level
3. Add endpoint grouping in frontend API clients
4. Create comprehensive testing for each category
5. Update API versioning strategy if needed

This organization provides a solid foundation for API growth and maintenance while improving the developer experience significantly.