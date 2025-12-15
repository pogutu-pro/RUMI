# RUMI Platform - Complete API Documentation

**Version**: 1.0  
**Last Updated**: December 14, 2025  
**Base URL**: `/api/v1`  
**Total Endpoints**: 120+

---

## 📖 Table of Contents

1. [Legend & Authentication](#legend--authentication)
2. [Admin APIs](#admin-apis)
3. [Landlord APIs](#landlord-apis)
4. [Caretaker APIs](#caretaker-apis)
5. [Student APIs](#student-apis)
6. [Payment APIs](#payment-apis)
7. [Messaging APIs](#messaging-apis)
8. [Hostel & Booking APIs](#hostel--booking-apis)
9. [Inventory Management APIs](#inventory-management-apis)
10. [Support & Tickets APIs](#support--tickets-apis)
11. [Reviews APIs](#reviews-apis)
12. [Roommates APIs](#roommates-apis)
13. [Room Transfers APIs](#room-transfers-apis)
14. [Notifications APIs](#notifications-apis)
15. [Analytics APIs](#analytics-apis)
16. [User Management APIs](#user-management-apis)
17. [Standard Response Formats](#standard-response-formats)
18. [Implementation Status Summary](#implementation-status-summary)

---

## Legend & Authentication

### Authentication

All API requests require authentication unless specified otherwise.

**Headers Required:**

```http
Authorization: Bearer <access_token>
X-CSRFToken: <csrf_token>  # Required for POST, PUT, PATCH, DELETE
```

### Auth Endpoints

| Status | Method | Endpoint                                 | Description            |
| ------ | ------ | ---------------------------------------- | ---------------------- |
| ✅     | POST   | `/accounts/auth/login/`                  | User login             |
| ✅     | POST   | `/accounts/auth/register/`               | User registration      |
| ✅     | POST   | `/accounts/auth/logout/`                 | User logout            |
| ✅     | POST   | `/accounts/auth/refresh/`                | Refresh access token   |
| ✅     | POST   | `/accounts/auth/password/reset/`         | Request password reset |
| ✅     | POST   | `/accounts/auth/password/reset/confirm/` | Confirm password reset |

---

## Admin APIs

### Activity Feed

| Status | Method | Endpoint                | Description                   |
| ------ | ------ | ----------------------- | ----------------------------- |
| ❌     | GET    | `/admin/activity-feed/` | Get system-wide activity feed |

**Query Parameters:**

- `limit` (integer, optional): Number of activities (default: 10)

**Response:**

```typescript
interface AdminActivity {
  id: string;
  type:
    | 'booking'
    | 'payment'
    | 'user_registration'
    | 'verification_request'
    | 'maintenance'
    | 'system';
  title: string;
  description: string;
  time: string; // Human-readable (e.g., "2 mins ago")
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
```

---

### Payment Disputes

| Status | Method | Endpoint                                 | Description               |
| ------ | ------ | ---------------------------------------- | ------------------------- |
| ❌     | GET    | `/admin/payments/disputes/`              | List all payment disputes |
| ❌     | GET    | `/admin/payments/disputes/stats/`        | Get dispute statistics    |
| ❌     | PATCH  | `/admin/payments/disputes/{id}/status/`  | Update dispute status     |
| ❌     | POST   | `/admin/payments/disputes/{id}/resolve/` | Resolve a dispute         |

**Schemas:**

```typescript
interface PaymentDispute {
  id: string;
  disputeId: string; // User-facing ID (e.g., "DIS-2024-001")
  userId: string;
  userName: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  resolvedAt?: string;
  resolverNotes?: string;
  evidence?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DisputeStats {
  openCount: number;
  investigatingCount: number;
  resolvedCount: number;
  totalAmount: number;
  avgResolutionTime: number; // In hours
}
```

---

### Subscriptions Management

| Status | Method | Endpoint                      | Description                 |
| ------ | ------ | ----------------------------- | --------------------------- |
| ❌     | GET    | `/admin/subscriptions/`       | List all user subscriptions |
| ❌     | GET    | `/admin/subscriptions/stats/` | Get subscription KPIs       |

**Schemas:**

```typescript
interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  planName: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  amount: number;
  nextBillingDate: string | null;
  paymentMethod: string;
  createdAt: string;
  cancelledAt?: string;
}

interface SubscriptionStats {
  activeCount: number;
  monthlyRecurringRevenue: number;
  pastDueCount: number;
  churnRate: number;
}
```

---

## Landlord APIs

### Dashboard

| Status | Method | Endpoint                             | Description                      |
| ------ | ------ | ------------------------------------ | -------------------------------- |
| ❌     | GET    | `/landlord/dashboard/overview/`      | Get comprehensive dashboard data |
| ❌     | GET    | `/landlord/dashboard/activity-feed/` | Get landlord's recent activities |

**Schemas:**

```typescript
interface LandlordDashboardData {
  monthlyRevenue: {
    month: string;
    revenue: number;
    occupancy: number;
  }[];
  hostelPerformance: {
    id: string;
    name: string;
    occupancy: number;
    revenue: number;
    trend: string;
    totalRooms: number;
    occupiedRooms: number;
  }[];
  bookingStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  stats: {
    totalRevenue: number;
    occupancyRate: number;
    activeHostels: number;
    pendingActions: number;
  };
}
```

---

### Caretakers Management

| Status | Method | Endpoint                     | Description                |
| ------ | ------ | ---------------------------- | -------------------------- |
| ✅     | GET    | `/landlord/caretakers/`      | List landlord's caretakers |
| ✅     | GET    | `/landlord/caretakers/{id}/` | Get caretaker details      |
| ✅     | POST   | `/landlord/caretakers/`      | Create new caretaker       |
| ✅     | PATCH  | `/landlord/caretakers/{id}/` | Update caretaker           |
| ✅     | DELETE | `/landlord/caretakers/{id}/` | Delete caretaker           |

---

## Caretaker APIs

### Visitor Invitations

| Status | Method | Endpoint                                         | Description              |
| ------ | ------ | ------------------------------------------------ | ------------------------ |
| ❌     | GET    | `/caretaker/visitor-invitations/`                | List visitor invitations |
| ❌     | POST   | `/caretaker/visitor-invitations/{id}/approve/`   | Approve invitation       |
| ❌     | POST   | `/caretaker/visitor-invitations/{id}/reject/`    | Reject invitation        |
| ❌     | POST   | `/caretaker/visitor-invitations/{id}/check-in/`  | Check in visitor         |
| ❌     | POST   | `/caretaker/visitor-invitations/{id}/check-out/` | Check out visitor        |

**Schema:**

```typescript
interface VisitorInvitation {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  purpose: string;
  expectedArrivalTime: string;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'checked_in'
    | 'checked_out'
    | 'expired';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  checkedOutAt?: string;
  checkedOutBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Security Features (Existing)

| Status | Method | Endpoint                                      | Description               |
| ------ | ------ | --------------------------------------------- | ------------------------- |
| ✅     | GET    | `/caretaker/security/visitors/`               | List visitor logs         |
| ✅     | POST   | `/caretaker/security/visitors/`               | Create visitor log        |
| ✅     | PATCH  | `/caretaker/security/visitors/{id}/checkout/` | Check out visitor         |
| ✅     | GET    | `/caretaker/security/night-checks/`           | List night check reports  |
| ✅     | POST   | `/caretaker/security/night-checks/`           | Create night check report |
| ✅     | GET    | `/caretaker/security/late-entries/`           | List late entry logs      |
| ✅     | POST   | `/caretaker/security/late-entries/`           | Log late entry            |

---

### Roommate Matching

| Status | Method | Endpoint                                     | Description            |
| ------ | ------ | -------------------------------------------- | ---------------------- |
| ❌     | GET    | `/caretaker/roommate-requests/`              | List roommate requests |
| ❌     | POST   | `/caretaker/roommate-requests/{id}/approve/` | Approve match          |
| ❌     | POST   | `/caretaker/roommate-requests/{id}/reject/`  | Reject request         |

---

### General Approvals

| Status | Method | Endpoint                             | Description            |
| ------ | ------ | ------------------------------------ | ---------------------- |
| ❌     | GET    | `/caretaker/approvals/`              | List pending approvals |
| ❌     | POST   | `/caretaker/approvals/{id}/approve/` | Approve request        |
| ❌     | POST   | `/caretaker/approvals/{id}/reject/`  | Reject request         |

---

### Dashboard

| Status | Method | Endpoint                | Description                  |
| ------ | ------ | ----------------------- | ---------------------------- |
| ✅     | GET    | `/caretaker/dashboard/` | Get caretaker dashboard data |

---

## Student APIs

### Bookings

| Status | Method | Endpoint                         | Description                |
| ------ | ------ | -------------------------------- | -------------------------- |
| ✅     | GET    | `/students/bookings/`            | List student's bookings    |
| ✅     | GET    | `/students/bookings/{id}/`       | Get booking details        |
| ✅     | POST   | `/students/bookings/`            | Create new booking         |
| ✅     | GET    | `/students/bookings/my-booking/` | Get current active booking |

---

### Dashboard

| Status | Method | Endpoint                     | Description              |
| ------ | ------ | ---------------------------- | ------------------------ |
| ✅     | GET    | `/students/rent-status/`     | Get rent payment status  |
| ✅     | GET    | `/students/dashboard/stats/` | Get dashboard statistics |

---

### Security (Student Side)

| Status | Method | Endpoint                              | Description               |
| ------ | ------ | ------------------------------------- | ------------------------- |
| ❌     | POST   | `/students/visitor-invitations/`      | Create visitor invitation |
| ❌     | GET    | `/students/visitor-invitations/`      | List my invitations       |
| ❌     | DELETE | `/students/visitor-invitations/{id}/` | Cancel invitation         |

---

### Roommate Requests (Student Side)

| Status | Method | Endpoint                            | Description            |
| ------ | ------ | ----------------------------------- | ---------------------- |
| ❌     | POST   | `/students/roommate-requests/`      | Request roommate match |
| ❌     | GET    | `/students/roommate-requests/`      | List my requests       |
| ❌     | DELETE | `/students/roommate-requests/{id}/` | Cancel request         |

---

## Payment APIs

### Transactions

| Status | Method | Endpoint                           | Description                 |
| ------ | ------ | ---------------------------------- | --------------------------- |
| ✅     | GET    | `/payments/transactions/`          | List transactions           |
| ✅     | POST   | `/payments/initialize/`            | Initialize payment          |
| ✅     | POST   | `/payments/verify/`                | Verify payment              |
| ✅     | GET    | `/payments/recent/`                | Get recent transactions     |
| ✅     | GET    | `/payments/history/`               | Get payment history         |
| ✅     | GET    | `/payments/transactions/landlord/` | Landlord transactions       |
| ✅     | GET    | `/payments/transactions/admin/`    | Admin view all transactions |

---

### Payment Methods

| Status | Method | Endpoint                                    | Description           |
| ------ | ------ | ------------------------------------------- | --------------------- |
| ✅     | GET    | `/payments/methods/` or `/payment-methods/` | List payment methods  |
| ✅     | POST   | `/payments/methods/` or `/payment-methods/` | Add payment method    |
| ✅     | DELETE | `/payment-methods/{id}/`                    | Remove payment method |
| ✅     | POST   | `/payment-methods/{id}/set-default/`        | Set default method    |

---

### Subscriptions (User)

| Status | Method | Endpoint                                   | Description             |
| ------ | ------ | ------------------------------------------ | ----------------------- |
| ✅     | GET    | `/accounts/subscriptions/plans/`           | List available plans    |
| ✅     | GET    | `/accounts/subscriptions/my-subscription/` | Get my subscription     |
| ✅     | POST   | `/accounts/subscriptions/upgrade/`         | Upgrade subscription    |
| ✅     | POST   | `/accounts/subscriptions/cancel/`          | Cancel subscription     |
| ✅     | POST   | `/accounts/subscriptions/reactivate/`      | Reactivate subscription |
| ✅     | GET    | `/accounts/subscriptions/features/{name}/` | Check feature access    |

---

### Additional Payment Features

| Status | Method | Endpoint                               | Description               |
| ------ | ------ | -------------------------------------- | ------------------------- |
| ✅     | GET    | `/payments/stats/`                     | Get payment statistics    |
| ✅     | GET    | `/payments/analytics/revenue/`         | Revenue analytics         |
| ✅     | GET    | `/payments/receipts/{transactionId}/`  | Get transaction receipt   |
| ✅     | POST   | `/payments/recurring/enable/`          | Enable recurring payments |
| ✅     | PUT    | `/payments/recurring/{id}/pause/`      | Pause recurring payment   |
| ✅     | PUT    | `/payments/recurring/{id}/resume/`     | Resume recurring payment  |
| ✅     | DELETE | `/payments/recurring/{id}/cancel/`     | Cancel recurring payment  |
| ✅     | GET    | `/payments/late-fees/{bookingId}/`     | Get late fees             |
| ✅     | POST   | `/payments/late-fees/{id}/pay/`        | Pay late fees             |
| ✅     | GET    | `/payments/tax-reports/`               | Get tax reports           |
| ✅     | GET    | `/payments/tax-reports/{id}/download/` | Download tax report       |

---

## Messaging APIs

| Status | Method | Endpoint                             | Description              |
| ------ | ------ | ------------------------------------ | ------------------------ |
| ✅     | GET    | `/chat/conversations/`               | List conversations       |
| ✅     | GET    | `/chat/conversations/{id}/`          | Get conversation details |
| ✅     | POST   | `/chat/conversations/`               | Create conversation      |
| ✅     | GET    | `/chat/conversations/{id}/messages/` | List messages            |
| ✅     | POST   | `/chat/conversations/{id}/messages/` | Send message             |
| ✅     | PATCH  | `/chat/conversations/{id}/read/`     | Mark as read             |
| ✅     | POST   | `/chat/conversations/{id}/pin/`      | Pin conversation         |
| ✅     | DELETE | `/chat/conversations/{id}/pin/`      | Unpin conversation       |
| ✅     | POST   | `/chat/conversations/{id}/mute/`     | Mute conversation        |
| ✅     | DELETE | `/chat/conversations/{id}/mute/`     | Unmute conversation      |
| ✅     | GET    | `/chat/unread-count/`                | Get unread message count |

---

## Hostel & Booking APIs

### Hostels

| Status | Method | Endpoint                       | Description              |
| ------ | ------ | ------------------------------ | ------------------------ |
| ✅     | GET    | `/hostels/`                    | List hostels             |
| ✅     | GET    | `/hostels/{id}/`               | Get hostel details       |
| ✅     | POST   | `/hostels/`                    | Create hostel (landlord) |
| ✅     | PATCH  | `/hostels/{id}/`               | Update hostel            |
| ✅     | GET    | `/hostels/nearby/`             | Search nearby hostels    |
| ✅     | GET    | `/hostels/{id}/reviews/`       | Get hostel reviews       |
| ✅     | GET    | `/hostels/{roomId}/roommates/` | Get roommates for room   |

---

### Rooms

| Status | Method | Endpoint                    | Description            |
| ------ | ------ | --------------------------- | ---------------------- |
| ✅     | GET    | `/hostels/rooms/`           | List rooms             |
| ✅     | GET    | `/hostels/rooms/{id}/`      | Get room details       |
| ✅     | POST   | `/hostels/rooms/`           | Create room            |
| ✅     | GET    | `/hostels/rooms/available/` | Search available rooms |

---

## Inventory Management APIs

### Inventory Items

| Status | Method | Endpoint                                  | Description            |
| ------ | ------ | ----------------------------------------- | ---------------------- |
| ✅     | GET    | `/hostels/{hostelId}/inventory/template/` | Get inventory template |
| ✅     | GET    | `/hostels/inventory/items/`               | List inventory items   |

---

### Check-In/Check-Out Reports

| Status | Method | Endpoint                              | Description               |
| ------ | ------ | ------------------------------------- | ------------------------- |
| ✅     | GET    | `/hostels/checkin/my-report/`         | Get my inventory report   |
| ✅     | GET    | `/hostels/checkin/{id}/`              | Get report by ID          |
| ✅     | POST   | `/hostels/checkin/{bookingId}/start/` | Create inventory report   |
| ✅     | PUT    | `/hostels/checkin/{id}/submit/`       | Submit report (student)   |
| ✅     | PUT    | `/hostels/checkin/{id}/verify/`       | Verify report (caretaker) |
| ✅     | POST   | `/hostels/checkin/{id}/approve/`      | Approve report (landlord) |
| ✅     | GET    | `/inventory/reports/pending`          | List pending reports      |

**Schemas:**

```typescript
interface InventoryReport {
  id: string;
  bookingId: string;
  roomNumber: string;
  studentId: string;
  type: 'check_in' | 'check_out';
  status:
    | 'draft'
    | 'submitted'
    | 'verified'
    | 'disputed'
    | 'approved'
    | 'completed'
    | 'auto_accepted';
  items: InventoryReportItem[];
  createdAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  caretakerNote?: string;
  landlordNote?: string;
}
```

---

## Support & Tickets APIs

| Status | Method | Endpoint                         | Description            |
| ------ | ------ | -------------------------------- | ---------------------- |
| ✅     | GET    | `/support/tickets/`              | List support tickets   |
| ✅     | GET    | `/support/tickets/{id}/`         | Get ticket details     |
| ✅     | POST   | `/support/tickets/`              | Create support ticket  |
| ✅     | PATCH  | `/support/tickets/{id}/`         | Update ticket status   |
| ✅     | GET    | `/support/tickets/{id}/replies/` | Get ticket replies     |
| ✅     | POST   | `/support/tickets/{id}/replies/` | Add reply to ticket    |
| ✅     | POST   | `/support/tickets/{id}/assign/`  | Assign ticket to agent |

---

## Reviews APIs

| Status | Method | Endpoint                  | Description      |
| ------ | ------ | ------------------------- | ---------------- |
| ✅     | GET    | `/reviews/`               | List all reviews |
| ✅     | GET    | `/reviews/me/`            | Get my reviews   |
| ✅     | POST   | `/reviews/`               | Create review    |
| ✅     | PATCH  | `/reviews/{id}/`          | Update review    |
| ✅     | DELETE | `/reviews/{id}/`          | Delete review    |
| ✅     | POST   | `/reviews/{id}/vote/`     | Add helpful vote |
| ✅     | POST   | `/reviews/{id}/reaction/` | Add reaction     |
| ✅     | POST   | `/reviews/{id}/flag/`     | Flag review      |
| ✅     | POST   | `/reviews/{id}/unflag/`   | Unflag review    |

---

## Roommates APIs

| Status | Method | Endpoint                            | Description            |
| ------ | ------ | ----------------------------------- | ---------------------- |
| ⚠️     | GET    | `/roommates/me/`                    | Get my roommates       |
| ⚠️     | GET    | `/roommates/profile/{id}/`          | Get roommate profile   |
| ⚠️     | GET    | `/roommates/matches/`               | Get potential matches  |
| ⚠️     | GET    | `/roommates/requests/`              | List roommate requests |
| ⚠️     | POST   | `/roommates/requests/`              | Send roommate request  |
| ⚠️     | POST   | `/roommates/requests/{id}/respond/` | Respond to request     |
| ⚠️     | PATCH  | `/roommates/preferences/`           | Update preferences     |
| ⚠️     | DELETE | `/roommates/{id}/`                  | Remove roommate        |

**Note**: These endpoints exist in frontend but may need backend confirmation/implementation.

---

## Room Transfers APIs

| Status | Method | Endpoint                                         | Description                      |
| ------ | ------ | ------------------------------------------------ | -------------------------------- |
| ✅     | GET    | `/hostels/{hostelId}/transfers/my-transfers/`    | Get my transfer history          |
| ✅     | GET    | `/hostels/{hostelId}/transfers/available-rooms/` | Get available rooms for transfer |
| ✅     | GET    | `/hostels/{hostelId}/transfer-policy/`           | Get transfer policy              |
| ✅     | POST   | `/hostels/{hostelId}/transfers/request/`         | Create transfer request          |
| ✅     | DELETE | `/hostels/{hostelId}/transfers/{id}/cancel/`     | Cancel transfer request          |
| ✅     | PATCH  | `/transfers/{id}/status/`                        | Update transfer status           |

---

## Notifications APIs

| Status | Method | Endpoint                                | Description                    |
| ------ | ------ | --------------------------------------- | ------------------------------ |
| ✅     | GET    | `/notifications/`                       | List notifications (paginated) |
| ✅     | GET    | `/notifications/{id}/`                  | Get notification details       |
| ✅     | GET    | `/notifications/unread-count/`          | Get unread count               |
| ✅     | PUT    | `/notifications/{id}/read/`             | Mark notification as read      |
| ✅     | PUT    | `/notifications/mark-multiple-read/`    | Mark multiple as read          |
| ✅     | PUT    | `/notifications/mark-all-read/`         | Mark all as read               |
| ✅     | DELETE | `/notifications/{id}/`                  | Delete notification            |
| ✅     | DELETE | `/notifications/delete-all-read/`       | Delete all read                |
| ✅     | GET    | `/notifications/preferences/`           | Get notification preferences   |
| ✅     | PUT    | `/notifications/preferences/`           | Update preferences             |
| ✅     | GET    | `/notifications/admin/templates/email/` | Get email templates (admin)    |
| ✅     | GET    | `/notifications/admin/templates/sms/`   | Get SMS templates (admin)      |
| ✅     | GET    | `/notifications/admin/stats/`           | Get notification stats (admin) |

---

## Analytics APIs

| Status | Method | Endpoint                | Description            |
| ------ | ------ | ----------------------- | ---------------------- |
| ✅     | GET    | `/analytics/overview/`  | Get analytics overview |
| ✅     | GET    | `/analytics/breakdown/` | Get detailed breakdown |

---

## User Management APIs

### Profile Management

| Status | Method | Endpoint                           | Description               |
| ------ | ------ | ---------------------------------- | ------------------------- |
| ✅     | GET    | `/accounts/profile/`               | Get user profile          |
| ✅     | PATCH  | `/accounts/profile/`               | Update profile            |
| ✅     | PATCH  | `/accounts/profile/student/`       | Update student profile    |
| ✅     | PATCH  | `/accounts/profile/landlord/`      | Update landlord profile   |
| ✅     | PATCH  | `/accounts/profile/caretaker/`     | Update caretaker profile  |
| ✅     | POST   | `/accounts/profile/avatar/upload/` | Upload avatar             |
| ✅     | DELETE | `/accounts/profile/avatar/`        | Delete avatar             |
| ✅     | PATCH  | `/accounts/profile/completion/`    | Update profile completion |

---

### User Administration

| Status | Method | Endpoint                | Description              |
| ------ | ------ | ----------------------- | ------------------------ |
| ✅     | GET    | `/accounts/users/`      | List users (admin)       |
| ✅     | GET    | `/accounts/users/{id}/` | Get user details (admin) |

---

## Standard Response Formats

### Success Response

```json
{
  "status": "success",
  "data": {
    /* Response data */
  },
  "message": "Optional success message",
  "meta": {
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Error Codes

| Code               | HTTP Status | Description               |
| ------------------ | ----------- | ------------------------- |
| `VALIDATION_ERROR` | 400         | Request validation failed |
| `UNAUTHORIZED`     | 401         | Authentication required   |
| `FORBIDDEN`        | 403         | Insufficient permissions  |
| `NOT_FOUND`        | 404         | Resource not found        |
| `CONFLICT`         | 409         | Resource conflict         |
| `SERVER_ERROR`     | 500         | Internal server error     |

---

## Implementation Status Summary

### ✅ Fully Implemented (90+ endpoints)

**Features with complete backend support:**

- Authentication & User Management
- Hostels & Rooms
- Bookings
- Payments & Transactions (comprehensive)
- Messaging
- Support Tickets
- Inventory Management (Check-in/Check-out)
- Reviews System
- Room Transfers
- Notifications
- Security Features (Visitor logs, Night checks, Late entries)
- Student Dashboard
- Caretaker Dashboard (basic)
- Profile Management

---

### ❌ Needs Implementation (21 endpoints)

**High Priority - Dashboard Dependencies:**

1. Admin Activity Feed (`/admin/activity-feed/`)
2. Admin Subscriptions List (`/admin/subscriptions/`)
3. Admin Subscriptions Stats (`/admin/subscriptions/stats/`)
4. Landlord Dashboard Overview (`/landlord/dashboard/overview/`)
5. Landlord Activity Feed (`/landlord/dashboard/activity-feed/`)
6. Payment Disputes - All 4 endpoints

**Medium Priority - Workflow Features:** 7. Visitor Invitations - Student side (3 endpoints) 8. Visitor Invitations - Caretaker side (5 endpoints) 9. Roommate Requests - Student side (3 endpoints) 10. Roommate Requests - Caretaker approval (3 endpoints) 11. General Approvals System (3 endpoints)

---

### ⚠️ Needs Confirmation (9 endpoints)

**Roommates Feature** - Endpoints defined in frontend, need backend verification:

- `/roommates/me/`
- `/roommates/profile/{id}/`
- `/roommates/matches/`
- `/roommates/requests/`
- `/roommates/requests/{id}/respond/`
- `/roommates/preferences/`
- `/roommates/{id}/`

---

## 🚨 PRODUCTION READINESS - Required API Endpoints

> [!WARNING]
> **Mock Data Audit Findings (December 14, 2025)**  
> The following API endpoints are **CRITICAL FOR PRODUCTION**. Currently, 11 dashboard pages use hardcoded mock data. These endpoints must be implemented before production deployment.

---

### Admin Dashboard - Critical Endpoints

#### 1. Pending Hostel Approvals

**Frontend Files Using Mock Data:**

- `/app/(admin)/admin/hostels/pending/page.tsx` (lines 37-84)

| Status | Method | Endpoint                             | Description                          |
| ------ | ------ | ------------------------------------ | ------------------------------------ |
| ❌     | GET    | `/admin/hostels/pending/`            | List hostels awaiting admin approval |
| ❌     | POST   | `/admin/hostels/{hostelId}/approve/` | Approve a pending hostel             |
| ❌     | POST   | `/admin/hostels/{hostelId}/reject/`  | Reject a pending hostel              |

**Request/Response Schemas:**

```typescript
// GET /admin/hostels/pending/
interface GetPendingHostelsResponse {
  hostels: PendingHostel[];
}

interface PendingHostel {
  id: string;
  name: string;
  landlord: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  location: string;
  totalRooms: number;
  priceRange: string; // e.g., "KES 12,000 - 18,000"
  submittedDate: string; // ISO8601
  description: string;
  amenities: string[];
  images: string[]; // URLs to uploaded images
  verificationChecklist: Array<{
    item: string; // e.g., "Location verified"
    status: 'pending' | 'verified' | 'failed';
  }>;
}

// POST /admin/hostels/{hostelId}/approve/
interface ApproveHostelRequest {
  notes?: string;
}

interface ApproveHostelResponse {
  success: true;
  message: string;
  hostel: {
    id: string;
    status: 'approved';
    approvedAt: string;
    approvedBy: string;
  };
}

// POST /admin/hostels/{hostelId}/reject/
interface RejectHostelRequest {
  notes: string; // Required - rejection reason
}

interface RejectHostelResponse {
  success: true;
  message: string;
  hostel: {
    id: string;
    status: 'rejected';
    rejectedAt: string;
    rejectedBy: string;
    rejectionReason: string;
  };
}
```

**Implementation Notes:**

- When hostel is created by landlord, set `status: 'pending'`
- Admin should receive notification of new pending hostel
- After approval, hostel becomes visible to students
- After rejection, notify landlord with reason

---

#### 2. User Management by Role

**Frontend Files Using Mock Data:**

- `/app/(admin)/admin/users/students/page.tsx` (lines 41-50)
- `/app/(admin)/admin/users/landlords/page.tsx` (lines 42-51)
- `/app/(admin)/admin/users/caretakers/page.tsx` (lines 40-49)
- `/app/(admin)/admin/users/suspended/page.tsx` (lines 40-48)

| Status | Method | Endpoint                       | Description                     |
| ------ | ------ | ------------------------------ | ------------------------------- |
| ❌     | GET    | `/admin/users/?role=student`   | List students with pagination   |
| ❌     | GET    | `/admin/users/?role=landlord`  | List landlords with pagination  |
| ❌     | GET    | `/admin/users/?role=caretaker` | List caretakers with pagination |
| ❌     | GET    | `/admin/users/suspended/`      | List all suspended users        |

**Note:** The endpoint `/accounts/users/` exists (marked ✅) but may need to support these specific role-based queries.

**Request/Response Schemas:**

```typescript
// GET /admin/users/?role=student&page=1&limit=50&search=query
interface GetUsersQuery {
  role?: 'student' | 'landlord' | 'caretaker';
  status?: 'active' | 'suspended' | 'pending';
  page?: number;
  limit?: number;
  search?: string; // Search by name or email
  ordering?: '-created_at' | 'created_at' | 'name';
}

interface GetUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Student User
interface StudentUser {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  year: string; // e.g., "1st Year", "2nd Year"
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string; // ISO8601
}

// Landlord User
interface LandlordUser {
  id: string;
  name: string;
  email: string;
  properties: number; // Count of hostels
  location: string;
  phone: string;
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string;
}

// Caretaker User
interface CaretakerUser {
  id: string;
  name: string;
  email: string;
  assignedHostel: string; // Hostel name or ID
  tasksCompleted: number; // Count of completed tasks
  phone: string;
  status: 'active' | 'on_leave' | 'suspended';
  joinedAt: string;
}

// GET /admin/users/suspended/
interface SuspendedUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'landlord' | 'caretaker' | 'tech_support';
  reason: string; // Suspension reason
  suspendedBy: string; // Admin name
  suspendedAt: string; // ISO8601
}
```

**Implementation Notes:**

- Support pagination for large user lists
- Support search across name and email fields
- Include role-specific data (e.g., university for students, properties count for landlords)
- Calculate derived fields (properties count, tasks completed)

---

### Landlord Dashboard - Critical Endpoints

#### 3. Payment Reports

**Frontend Files Using Mock Data:**

- `/app/(landlord)/landlord/payments/reports/page.tsx` (lines 14-20)

| Status | Method | Endpoint                                    | Description                      |
| ------ | ------ | ------------------------------------------- | -------------------------------- |
| ❌     | GET    | `/landlord/payments/reports/`               | List generated financial reports |
| ❌     | POST   | `/landlord/payments/reports/generate/`      | Generate custom report           |
| ❌     | GET    | `/landlord/payments/reports/{id}/download/` | Download report file             |

**Request/Response Schemas:**

```typescript
// GET /landlord/payments/reports/
interface GetReportsResponse {
  reports: PaymentReport[];
}

interface PaymentReport {
  id: string;
  name: string;
  type: 'financial' | 'occupancy' | 'maintenance' | 'tax' | 'analytics';
  generatedAt: string; // ISO8601
  fileSize: string; // e.g., "2.4 MB"
  downloadUrl: string; // Pre-signed URL for download
  expiresAt?: string; // When download URL expires
}

// POST /landlord/payments/reports/generate/
interface GenerateReportRequest {
  type: 'financial' | 'occupancy' | 'maintenance' | 'tax' | 'analytics';
  dateRange: {
    from: string; // ISO8601
    to: string; // ISO8601
  };
  hostelIds?: string[]; // Optional: specific hostels
  format?: 'pdf' | 'xlsx' | 'csv';
}

interface GenerateReportResponse {
  reportId: string;
  status: 'generating' | 'ready';
  estimatedTime?: number; // Seconds until ready
  message: string;
}
```

**Implementation Notes:**

- Generate reports asynchronously if processing takes > 2 seconds
- Provide download URLs with expiration (24-48 hours)
- Support multiple formats (PDF for viewing, Excel/CSV for data analysis)
- Include these report types:
  - **Financial**: Monthly revenue, payouts, outstanding balances
  - **Occupancy**: Room occupancy rates over time
  - **Maintenance**: Maintenance costs and frequency
  - **Tax**: Annual tax statements
  - **Analytics**: Booking conversion rates, average stay duration

---

#### 4. Payment Analytics & Transactions

**Frontend Files Using Mock Data:**

- `/app/(landlord)/landlord/payments/page.tsx` (lines 47-102)

| Status | Method | Endpoint                                  | Description                                |
| ------ | ------ | ----------------------------------------- | ------------------------------------------ |
| ❌     | GET    | `/landlord/payments/analytics/`           | Get payment trends and statistics          |
| ⚠️     | GET    | `/landlord/payments/transactions/recent/` | Recent transactions (may need enhancement) |

**Request/Response Schemas:**

```typescript
// GET /landlord/payments/analytics/?period=6months
interface GetPaymentAnalyticsQuery {
  period: '1month' | '3months' | '6months' | '1year';
  hostelId?: string; // Optional: filter by hostel
}

interface PaymentAnalyticsResponse {
  monthlyData: MonthlyPaymentData[];
  summary: PaymentSummary;
}

interface MonthlyPaymentData {
  month: string; // e.g., "Jul", "Aug"
  collected: number; // Amount collected
  pending: number; // Amount pending
  collectionRate: number; // Percentage (0-100)
}

interface PaymentSummary {
  totalCollected: number;
  avgCollectionRate: number; // Percentage
  pendingPayments: number;
  completedTransactions: number;
  trends: {
    revenueChange: number; // Percentage change vs previous period
    collectionRateChange: number; // Percentage change
  };
}

// GET /landlord/payments/transactions/recent/?limit=10&status=all
interface GetRecentTransactionsQuery {
  limit?: number; // Default: 10
  status?: 'completed' | 'pending' | 'failed' | 'all';
  hostelId?: string;
}

interface RecentTransaction {
  id: string;
  student: {
    id: string;
    name: string;
  };
  hostel: {
    id: string;
    name: string;
  };
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string; // ISO8601
  paymentMethod: 'M-Pesa' | 'Bank Transfer' | 'Card' | 'Cash';
}
```

**Implementation Notes:**

- Calculate collection rate = (collected / (collected + pending)) \* 100
- Aggregate data by month for chart display
- Include percentage changes for dashboard KPIs
- Filter transactions by date range and status

---

### Caretaker Dashboard - Critical Endpoints

#### 5. Messaging System

**Frontend Files Using Mock Data:**

- `/app/(caretaker)/caretaker/message/page.tsx` (lines 18-58)

> [!NOTE]
> The messaging API already exists (marked ✅) with endpoints:
>
> - `GET /messaging/conversations/`
> - `GET /messaging/conversations/{id}/messages/`
> - `POST /messaging/conversations/{id}/messages/`
>
> **Action Required:** The caretaker messaging page should be **refactored** to use the existing messaging hooks (`useConversations()` and `useMessages()`) already used in the student dashboard instead of hardcoded data.

**No Backend Changes Needed** - Frontend refactoring only.

---

#### 6. General Approvals Workflow

**Frontend Files Using Mock Data:**

- `/app/(caretaker)/caretaker/approvals/page.tsx` (lines 12-40)

| Status | Method | Endpoint                             | Description                    |
| ------ | ------ | ------------------------------------ | ------------------------------ |
| ❌     | GET    | `/caretaker/approvals/`              | List pending approval requests |
| ❌     | POST   | `/caretaker/approvals/{id}/approve/` | Approve a request              |
| ❌     | POST   | `/caretaker/approvals/{id}/reject/`  | Reject a request               |

**Request/Response Schemas:**

```typescript
// GET /caretaker/approvals/?status=pending&type=all
interface GetApprovalsQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  type?: 'roommate_request' | 'maintenance' | 'guest' | 'transfer' | 'all';
}

interface GetApprovalsResponse {
  approvals: ApprovalRequest[];
}

interface ApprovalRequest {
  id: string;
  type: 'roommate_request' | 'maintenance' | 'guest' | 'transfer';
  title: string; // E.g., "Roommate Request", "Overnight Guest"
  requester: {
    id: string;
    name: string;
    roomNumber?: string;
  };
  details: string; // Human-readable description
  createdAt: string; // ISO8601
  status: 'pending' | 'approved' | 'rejected';
  metadata?: Record<string, any>; // Type-specific data
}

// POST /caretaker/approvals/{id}/approve/
interface ApproveRequestBody {
  notes?: string;
}

interface ApproveRequestResponse {
  success: true;
  message: string;
  approval: {
    id: string;
    status: 'approved';
    approvedAt: string;
    approvedBy: string;
  };
}

// POST /caretaker/approvals/{id}/reject/
interface RejectRequestBody {
  notes: string; // Required - reason for rejection
}

interface RejectRequestResponse {
  success: true;
  message: string;
  approval: {
    id: string;
    status: 'rejected';
    rejectedAt: string;
    rejectedBy: string;
    rejectionReason: string;
  };
}
```

**Implementation Notes:**

- This is a **unified approval endpoint** that consolidates:
  - Roommate pairing requests
  - Maintenance completion verifications
  - Overnight guest approvals
  - Room transfer approvals
- Each approval type can have custom metadata
- Notify requester when their request is approved/rejected
- Log all approval decisions for audit trail

---

### Student Dashboard - Required Endpoint

#### 7. Pending Reviews

**Frontend Files Using Mock Data:**

- `/app/(student)/student/reviews/page.tsx` (lines 181-188)

| Status | Method | Endpoint                     | Description                        |
| ------ | ------ | ---------------------------- | ---------------------------------- |
| ❌     | GET    | `/students/reviews/pending/` | List hostels student should review |

**Request/Response Schemas:**

```typescript
// GET /students/reviews/pending/
interface GetPendingReviewsResponse {
  pendingReviews: PendingReview[];
}

interface PendingReview {
  hostelId: string;
  hostelName: string;
  hostelImage: string; // URL to hostel main image
  checkOutDate: string; // ISO8601 - when student checked out
  bookingId: string;
}
```

**Implementation Notes:**

- Return hostels where student has checked out but not yet reviewed
- Only show if checkout was within last 90 days (configurable)
- Filter out hostels student has already reviewed
- Order by most recent checkout first

---

### Additional Required Endpoints

#### 8. Profile Completion Score

**Frontend Files Using Mock Data:**

- `/app/(landlord)/landlord/profile/page.tsx` (line 32)
- `/app/(caretaker)/caretaker/profile/page.tsx` (line 31)
- `/app/tech-support/profile/page.tsx` (line 33)

| Status | Method | Endpoint                        | Description                       |
| ------ | ------ | ------------------------------- | --------------------------------- |
| ❌     | GET    | `/accounts/profile/completion/` | Get profile completion percentage |

**Request/Response Schema:**

```typescript
interface ProfileCompletionResponse {
  percentage: number; // 0-100
  missingFields: string[]; // E.g., ["phone", "avatar", "bio"]
  completedFields: string[];
}
```

**Implementation Notes:**

- Calculate percentage based on required and optional fields filled
- Different roles have different required fields
- Weight more important fields higher (e.g., phone > bio)

---

#### 9. Late Entry Statistics

**Frontend Files Using Mock Data:**

- `/app/(caretaker)/caretaker/security/late-entries/page.tsx` (lines 79-80)

| Status | Method | Endpoint                                  | Description                          |
| ------ | ------ | ----------------------------------------- | ------------------------------------ |
| ❌     | GET    | `/caretaker/security/late-entries/stats/` | Get aggregated late entry statistics |

**Request/Response Schema:**

```typescript
interface LateEntryStatsResponse {
  thisWeek: number; // Count this week
  frequentOffenders: Array<{
    studentId: string;
    studentName: string;
    roomNumber: string;
    count: number; // Number of late entries
  }>;
  averageEntriesPerWeek: number;
}
```

---

## Backend Implementation Guide

### Priority 1: Dashboard Data (Critical)

These endpoints are essential for dashboards to function:

1. **Admin Subscriptions** (`/admin/subscriptions/`, `/admin/subscriptions/stats/`)
   - Return list of all user subscriptions
   - Calculate MRR, active count, past due count, churn rate

2. **Landlord Dashboard** (`/landlord/dashboard/overview/`)
   - Aggregate data from bookings, payments, hostels
   - Calculate 6-month revenue trends
   - Rank hostels by occupancy

3. **Activity Feeds** (Admin & Landlord)
   - Log system events (bookings, payments, registrations)
   - Return recent activities with human-readable timestamps

---

### Priority 2: Payment Disputes

Implement dispute workflow:

1. Students can submit disputes
2. Admin can investigate and update status
3. Admin can resolve with refund or rejection
4. Calculate statistics dashboard

---

### Priority 3: Visitor Invitations

Two-sided approval system:

**Student Side:**

- Create invitation with visitor details
- List and cancel own invitations

**Caretaker Side:**

- List pending invitations for hostel
- Approve/reject before arrival
- Check-in when visitor arrives
- Check-out when visitor leaves

---

### Priority 4: Roommate Matching

Similar to visitor invitations but for roommate swaps:

1. Students send requests with preferences
2. System calculates compatibility score
3. Caretaker reviews and approves
4. **On approval**, execute room swap in database

---

## API Best Practices

### Pagination

List endpoints should support:

```
?page=1&pageSize=20
```

### Filtering

Common filters:

```
?status=active&search=query&ordering=-createdAt&startDate=2024-01-01&endDate=2024-12-31
```

### Rate Limiting

- Authenticated: 1000 req/hour
- Unauthenticated: 100 req/hour

Headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1702598400
```

---

## Questions for Backend Team

1. **Pagination**: Standard format OK for all list endpoints?
2. **Filtering**: Which endpoints need advanced filtering?
3. **Webhooks**: Any events that should trigger webhooks?
4. **Rate Limits**: Current limits acceptable?
5. **File Uploads**: Max file size? Allowed types?
6. **Real-time**: Which features need WebSocket support?

---

**Document Maintained By**: Frontend Team  
**Total Documented Endpoints**: 120+  
**Fully Implemented**: ~90 endpoints  
**Needs Implementation**: 21 endpoints  
**Needs Confirmation**: 9 endpoints

**Last Verified**: December 14, 2025
