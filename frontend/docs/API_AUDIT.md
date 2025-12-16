# Backend API Requirements Report

## Overview
This document outlines specific API endpoints and modifications required from the Backend Engineering team to align with the frontend client. This audit was conducted by cross-referencing all endpoints documented in SETUP_GUIDE.md against actual frontend implementation.

**Status:** Action Required  
**Last Updated:** 2025-12-16

---

## 1. Missing Endpoints (Critical)
The following endpoints are required for feature completion but are currently missing or undocumented.

### Transfers & Room Changes
- `GET /hostels/{id}/transfers/my-transfers/` ✅ **UTILIZED**
- `GET /hostels/{id}/transfers/available-rooms/` ✅ **UTILIZED**
- `GET /hostels/{id}/transfer-policy/` ✅ **UTILIZED**
- `POST /hostels/{id}/transfers/request/` ✅ **UTILIZED**
- `DELETE /hostels/{id}/transfers/{id}/cancel/` ✅ **UTILIZED**

### Roommates & Matching
- `DELETE /roommates/{id}/` ✅ **UTILIZED** - Remove roommate
- `GET /roommates/profile/{id}/` ✅ **UTILIZED** - Specific profile lookup
- `POST /roommates/requests/{id}/respond/` ✅ **UTILIZED** - Not in SETUP_GUIDE but actively used

### Notifications
- `GET /notifications/unread-count/` ✅ **UTILIZED** - Lightweight unread counter
- `PUT /notifications/mark-multiple-read/` ✅ **UTILIZED** - Batch mark-as-read
- `DELETE /notifications/delete-all-read/` ✅ **UTILIZED** - Batch cleanup

### Analytics & Exports
- `POST /analytics/export/` ✅ **UTILIZED** - Export data to CSV/PDF
- `GET /analytics/breakdown/{category}/` ✅ **UTILIZED** - Detailed drilled-down stats

### Hostels & Favorites
- `GET /hostels/favorites/` ⚠️ **NOT UTILIZED YET**
- `POST /hostels/{id}/favorite/` ⚠️ **NOT UTILIZED YET**
- `GET /hostels/related/` ⚠️ **NOT UTILIZED YET**
- `GET /hostels/{id}/availability/` ✅ **UTILIZED**

### Dashboard Support
- `GET /analytics/distribution/users/` ⚠️ **NOT UTILIZED YET** - Admin: User distribution by role
- `GET /messages/unread-count/` ⚠️ **NOT UTILIZED YET** - Student Dashboard
- `GET /activity/feed/` ⚠️ **NOT UTILIZED YET** - Student Dashboard  
  > **Note**: Currently using `/admin/activity-feed/` instead
- `GET /landlord/dashboard/overview/` ⚠️ **NOT UTILIZED YET**
  > **Update Required**: Response must include growth trends/percentages for KPIs (revenue, occupancy)

### Tech Support Dashboard
- `GET /support/users/` ✅ **UTILIZED**
- `GET /support/tickets/admin/` ✅ **UTILIZED**
- `GET /support/stats/` ✅ **UTILIZED**
- `GET /support/logs/` ⚠️ **NOT UTILIZED YET**
- `GET /support/hostels/` ✅ **UTILIZED**
- `POST /support/hostels/{id}/verify/` ✅ **UTILIZED**
- `POST /support/hostels/{id}/visibility/` ✅ **UTILIZED**
- `POST /support/hostels/{id}/flag/` ✅ **UTILIZED**

---

## 2. Unutilized Endpoints from SETUP_GUIDE.md

After removing mock data and auditing frontend implementation, the following documented endpoints in SETUP_GUIDE.md are **NOT currently being utilized** in the frontend:

### Accounts Namespace

#### Chat/Messaging
- `POST /accounts/chat/send/` ⚠️ **UNUTILIZED**
  > Frontend uses feature-specific messaging endpoints instead

#### Password Management (Likely Unutilized)
- `POST /accounts/resend-otp/` ⚠️ **POTENTIALLY UNUTILIZED**
  > Verify if OTP resend flow is complete

#### Dashboard
- `GET /accounts/landlord/dashboard/` ⚠️ **POTENTIALLY UNDERUTILIZED**
  > Verify if this provides sufficient data vs `/analytics/landlord/*` endpoints

### Admin Endpoints Namespace

#### Landlord Verifications
- `POST /admin-endpoints/landlord-verifications/` ⚠️ **UNUTILIZED**
  > Frontend uses `/accounts/landlords/{id}/verify/{action}/` instead

#### Platform Stats
- `GET /admin-endpoints/platform/stats/` ⚠️ **UNUTILIZED**
  > Frontend uses `/admin/admin/dashboard/stats/` instead

#### System Health
- `GET /admin-endpoints/system/health/` ⚠️ **UNUTILIZED**
  > No health check UI implemented yet

#### Users Stats
- `GET /admin-endpoints/users/stats/` ⚠️ **UNUTILIZED**
  > Frontend may be using `/admin/admin/dashboard/stats/` instead

### Admin Namespace

#### Hostel Moderation (All Utilized ✅)
- All hostel moderation endpoints are being used

#### Payment Disputes (Custom extensions found)
- `PATCH /admin/payments/disputes/{id}/status/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /admin/payments/disputes/{id}/resolve/` ✅ **UTILIZED** - Not in SETUP_GUIDE

### Analytics Namespace

#### Landlord Analytics
- `GET /analytics/landlord/customers/` ⚠️ **PARTIALLY UNUTILIZED**
- `GET /analytics/landlord/financial-reports/` ⚠️ **PARTIALLY UNUTILIZED**
- `GET /analytics/landlord/growth/` ⚠️ **PARTIALLY UNUTILIZED**
- `GET /analytics/landlord/occupancy/` ⚠️ **PARTIALLY UNUTILIZED**
- `GET /analytics/landlord/performance/` ⚠️ **PARTIALLY UNUTILIZED**
- `GET /analytics/landlord/predictive/` ⚠️ **PARTIALLY UNUTILIZED**
- `GET /analytics/landlord/revenue/` ⚠️ **PARTIALLY UNUTILIZED**

> **Note**: Some analytics endpoints may be used but need verification of full utilization

### Caretaker Operations Namespace

> **CRITICAL**: There is **namespace duplication** between `/caretaker/` and `/caretaker-operations/`

**Completely Duplicated Endpoints:**
- Check-in/Check-out operations
- Damage reports
- Dashboard
- Inventory
- Maintenance
- Notifications
- Students management
- Tasks
- Visitors

**Action Required:** Backend should consolidate these into a single consistent namespace (recommend `/caretaker/`)

#### Additional Caretaker Endpoints (Extended in frontend):
- `GET /caretaker/visitor-invitations/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/visitor-invitations/{id}/approve/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/visitor-invitations/{id}/reject/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/visitor-invitations/{id}/check-in/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/visitor-invitations/{id}/check-out/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `GET /caretaker/roommate-requests/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/roommate-requests/{id}/approve/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/roommate-requests/{id}/reject/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `GET /caretaker/approvals/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/approvals/{id}/approve/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/approvals/{id}/reject/` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `GET /caretaker/roommates/groups` ✅ **UTILIZED** - Not in SETUP_GUIDE
- `POST /caretaker/roommates/assign` ✅ **UTILIZED** - Not in SETUP_GUIDE

### Home/Public Namespace

**All home endpoints appear UNUTILIZED** (public website not in current scope):
- `/home/` - Homepage
- `/home/about/` - About page
- `/home/blog/` - Blog listing
- `/home/blog/{slug}/` - Blog post detail
- `/home/contact/` - Contact form
- `/home/contact/info/` - Contact information
- `/home/faq/` - FAQ listing
- `/home/faq/{faq_id}/helpful/` - FAQ feedback
- `/home/newsletter/subscribe/` - Newsletter subscription
- `/home/newsletter/unsubscribe/` - Newsletter unsubscribe
- `/home/newsletter/verify/` - Newsletter verification
- `/home/statistics/{stat_key}/` - Update statistics
- `/home/team/` - Team page

> **Note**: These are likely for a public marketing website that's not part of the current dashboard application.

### Hostels Namespace

Most hostel endpoints are utilized ✅. No unutilized endpoints found.

### Roommates Namespace

**Less-used endpoints:**
- `GET /roommates/advanced-matching/` ⚠️ **POTENTIALLY UNUTILIZED**
- `GET /roommates/analytics/` ⚠️ **POTENTIALLY UNUTILIZED**
- `GET /roommates/chat/` ⚠️ **POTENTIALLY UNUTILIZED**
- `POST /roommates/chat/` ⚠️ **POTENTIALLY UNUTILIZED**
- `GET /roommates/history/` ⚠️ **POTENTIALLY UNUTILIZED**
- `POST /roommates/history/` ⚠️ **POTENTIALLY UNUTILIZED**
- `POST /roommates/report/` ⚠️ **POTENTIALLY UNUTILIZED**
- `GET /roommates/verification/` ⚠️ **POTENTIALLY UNUTILIZED**
- `POST /roommates/verification/` ⚠️ **POTENTIALLY UNUTILIZED**

**Utilized endpoints:**
- `/roommates/profile/` ✅
- `/roommates/matches/` ✅
- `/roommates/requests/` ✅
- `/roommates/settings/` ✅

### Payments Namespace

Most payment endpoints are utilized ✅.

**Potentially underutilized:**
- `POST /payments/payment-methods/` ⚠️ **VERIFY USAGE**
- All recurring payment endpoints may need verification

### Notifications Namespace

All core notification endpoints are utilized ✅.

---

## 3. New Endpoints Required (Not in SETUP_GUIDE.md)

These endpoints are **actively being used** by the frontend but are **NOT documented** in SETUP_GUIDE.md:

### Authentication & Social Login
- `POST /accounts/google/` - Google OAuth integration

### Account Management
- `POST /accounts/users/{id}/deactivate/` - Ensure POST method is supported (SETUP_GUIDE shows PUT)

### Analytics
- `GET /analytics/dashboard/` - General analytics dashboard

### Landlord Management
- `GET /landlord/caretakers/` - List caretakers for landlord
- `POST /landlord/caretakers/` - Create caretaker assignment
- `GET /landlord/caretakers/{id}/` - Get specific caretaker
- `PATCH /landlord/caretakers/{id}/` - Update caretaker
- `DELETE /landlord/caretakers/{id}/` - Remove caretaker

### Admin Payment Disputes
- `PATCH /admin/payments/disputes/{id}/status/` - Update dispute status
- `POST /admin/payments/disputes/{id}/resolve/` - Resolve dispute

### Profile Management
- `GET /api/v1/accounts/profile/` - Get current user profile
- `GET /api/v1/accounts/users/{userId}/profile/` - Get specific user profile
- `PUT /api/v1/accounts/profile/` - Update profile
- `PUT /api/v1/accounts/profile/student/` - Update student profile
- `PUT /api/v1/accounts/profile/landlord/` - Update landlord profile
- `PUT /api/v1/accounts/profile/caretaker/` - Update caretaker profile
- `POST /api/v1/accounts/profile/upload-image/` - Upload profile image
- `DELETE /api/v1/accounts/profile/image/` - Delete profile image
- `PUT /api/v1/accounts/profile/lifestyle-preferences/` - Update lifestyle preferences

### Student Dashboard
- `GET /accounts/dashboard/` - Student dashboard data

### Caretaker Workflows (Extended)
All the caretaker workflow endpoints listed in section 2 above.

### Support/Tech Support
- `GET /support/hostels/` - List hostels for support
- `POST /support/hostels/{id}/verify/` - Verify hostel
- `POST /support/hostels/{id}/visibility/` - Toggle hostel visibility
- `POST /support/hostels/{id}/flag/` - Flag hostel for review

### Inventory/Check-in Additional
- `GET /hostels/checkin/my-report/` - Get user's check-in report
- `GET /hostels/checkin/{reportId}/` - Get specific check-in report
- `POST /hostels/checkin/{reportId}/approve/` - Approve check-in report

---

## 4. Endpoint Modifications & Alignment

### Authentication
- `POST /accounts/google/` - **NEW** - Required for Social Auth (not in SETUP_GUIDE)

### Account Management
- `POST /accounts/users/{id}/deactivate/` - Ensure this method is supported (SETUP_GUIDE shows PUT)

### Caretaker Operations
- **Consolidation Required**: Consolidate `caretaker` vs `caretaker-operations` namespaces to a single consistent path structure.
- **Maintenance Notification**: Create endpoint `POST /caretaker/maintenance/{id}/notify-landlord/`

### Landlord Dashboard
- `GET /landlord/dashboard/overview/` or equivalent - Ensure growth trends/percentages for KPIs are included

---

## 5. URL Construction Notes

### Messaging
- Ensure `/chat/conversations/...` or `/accounts/chat/conversations/...` are consistently routed
- Frontend primarily uses messaging feature-specific endpoints

### Roommates
- Ensure preferences can be managed via `/roommates/settings/` ✅ **VERIFIED**

### API Versioning
- Some endpoints use `/api/v1/` prefix (especially profiles)
- Ensure consistent versioning strategy across all endpoints

---

## 6. Summary & Action Items

### For Backend Engineer:

1. **Implement Missing Endpoints** marked as ⚠️ **NOT UTILIZED YET** if they're planned features
2. **Consolidate Caretaker Namespaces** - Merge `/caretaker/` and `/caretaker-operations/` into single namespace
3. **Add Extended Caretaker Endpoints** - Implement all the workflow endpoints listed in section 3
4. **Add Profile Management Endpoints** - Implement all `/api/v1/accounts/profile/*` endpoints
5. **Add Landlord Management Endpoints** - Implement `/landlord/caretakers/*` endpoints
6. **Add Admin Dispute Resolution** - Implement dispute management endpoints
7. **Add Support Hostel Management** - Implement `/support/hostels/*` endpoints
8. **Review Unutilized Endpoints** - Determine if home/public website endpoints are still needed
9. **Verify Dashboard Endpoints** - Ensure proper data structure with growth metrics
10. **Social Authentication** - Implement Google OAuth endpoint

### Priority Order:
1. **HIGH**: Extended caretaker workflows, Profile management, Landlord caretaker management
2. **MEDIUM**: Admin dispute resolution, Support hostel management, Dashboard enhancements
3. **LOW**: Home/public website endpoints (if marketing site is planned)
4. **REVIEW**: Analytics endpoint utilization, Roommate advanced features

---

## 7. Notes

- This audit was conducted on **2025-12-16** by cross-referencing SETUP_GUIDE.md with all frontend API implementation files
- Frontend implementation has extended beyond SETUP_GUIDE.md in several areas (caretaker workflows, admin features, profiles)
- Some endpoints may be listed as unutilized because they're planned for future features
- Recommend backend engineer review this document and confirm implementation priorities with product team
