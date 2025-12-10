# RUMI Frontend - Backend Communication Documentation

> **Last Updated:** December 6, 2025  
> **Location:** `frontend/src/lib/api/`

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Client Configuration](#api-client-configuration)
3. [Authentication Flow](#authentication-flow)
4. [API Modules Reference](#api-modules-reference)
5. [Error Handling](#error-handling)
6. [Environment Configuration](#environment-configuration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        RUMI Frontend                             │
├─────────────────────────────────────────────────────────────────┤
│  React Components / Pages                                        │
│       ↓ ↑                                                        │
│  Zustand Stores (State Management)                               │
│       ↓ ↑                                                        │
│  API Modules (frontend/src/lib/api/*.ts)                         │
│       ↓ ↑                                                        │
│  Axios Client (client.ts) ─────────┬───────────────────────────── │
│       │                            │                             │
│       ▼                            ▼                             │
│  Request Interceptor         Response Interceptor                │
│  (Adds Auth Token)           (Handles 401, Token Refresh)        │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Django REST Backend                            │
│                 http://127.0.0.1:8000/api/v1/                     │
└──────────────────────────────────────────────────────────────────┘
```

### Communication Pattern
All frontend-to-backend communication follows this flow:
1. **Component/Hook** calls API function
2. **API Module** uses Axios instance from `client.ts`
3. **Request Interceptor** attaches JWT token from localStorage
4. **Request** is sent to Django backend
5. **Response Interceptor** handles errors (auto-refreshes on 401)
6. **Data** returns to component

---

## API Client Configuration

**File:** `frontend/src/lib/api/client.ts`

### Axios Instance Setup
```typescript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // Sends cookies
});
```

### Request Interceptor
```typescript
// Automatically adds Authorization header
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor - Token Refresh
```typescript
// On 401 → automatically refresh token → retry request
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      const newToken = await refreshAccessToken();
      // Retry original request with new token
    }
  }
);
```

---

## Authentication Flow

### Login Flow
```
User Login Form
      │
      ▼
POST /accounts/login/  ──────────────────────────────────────────►  Backend
      │                                                               │
      │ { email, password }                                           │
      │                                                               ▼
      │                                              Validate credentials
      │                                                               │
      ◄─────────────────────────────────────────────────────────────────
      │
      │ { access_token, refresh_token, user }
      │
      ▼
Save tokens to localStorage
Update Zustand auth store
Redirect to dashboard
```

### Token Management
| Item | Storage | Purpose |
|------|---------|---------|
| `access_token` | localStorage | Short-lived (15-30 min), sent with requests |
| `refresh_token` | localStorage | Long-lived, used to get new access token |
| `user_role` | localStorage | Role for routing (student/landlord/caretaker) |

---

## API Modules Reference

### Core Infrastructure

| File | Purpose | Key Functions |
|------|---------|---------------|
| `client.ts` | Axios config, interceptors | `axiosInstance`, `requestWithRetry()` |
| `error-mapping.ts` | Error transformation | `mapApiError()`, `getFieldError()` |

---

### Authentication & Users

#### `auth.ts` - Authentication
| Endpoint | Method | Function |
|----------|--------|----------|
| `/accounts/login/` | POST | `login()` |
| `/accounts/register/` | POST | `registerStudent()`, `registerLandlord()` |
| `/accounts/logout/` | POST | `logout()` |
| `/accounts/refresh-token/` | POST | `refreshToken()` |
| `/accounts/password/reset/` | POST | `forgotPassword()` |
| `/accounts/verify-email/` | POST | `verifyEmail()` |

#### `profiles.ts` - User Profiles
| Endpoint | Method | Function |
|----------|--------|----------|
| `/accounts/profile/` | GET | `getProfile()` |
| `/accounts/profile/` | PATCH | `updateProfile()` |
| `/accounts/profile/student/` | PATCH | `updateStudentProfile()` |
| `/accounts/profile/landlord/` | PATCH | `updateLandlordProfile()` |
| `/accounts/profile/upload-image/` | POST | `uploadProfileImage()` |

#### `admin.ts` - Admin Functions
| Endpoint | Method | Function |
|----------|--------|----------|
| `/accounts/users/` | GET | `getUsers()` |
| `/accounts/users/{id}/deactivate/` | POST | `deactivateUser()` |
| `/accounts/caretakers/` | GET/POST | `getCaretakers()`, `createCaretaker()` |
| `/accounts/landlords/{id}/verify/` | POST | `verifyLandlord()` |

---

### Hostels & Rooms

#### `hostels.ts` - Hostel Management
| Endpoint | Method | Function |
|----------|--------|----------|
| `/hostels/` | GET | `getHostels()` |
| `/hostels/{slug}/` | GET | `getHostelBySlug()` |
| `/hostels/create/` | POST | `createHostel()` |
| `/hostels/{id}/favorite/` | POST | `toggleFavoriteHostel()` |
| `/hostels/favorites/` | GET | `getFavorites()` |

#### `rooms.ts` - Room Management
| Endpoint | Method | Function |
|----------|--------|----------|
| `/hostels/{id}/rooms/` | GET | `getRooms()` |
| `/hostels/rooms/{id}/` | GET | `getRoomById()` |
| `/hostels/{roomId}/book/` | POST | `bookRoom()` |

#### `roommates.ts` - Roommate Matching
| Endpoint | Method | Function |
|----------|--------|----------|
| `/roommates/matches/` | GET | `getRoommateMatches()` |
| `/roommates/requests/` | POST | `sendRoommateRequest()` |
| `/roommates/requests/{id}/respond/` | POST | `respondToRequest()` |

---

### Bookings & Payments

#### `bookings.ts` - Booking Management
| Endpoint | Method | Function |
|----------|--------|----------|
| `/bookings/` | GET/POST | `getBookings()`, `createBooking()` |
| `/bookings/{id}/` | GET | `getBookingById()` |
| `/bookings/{id}/cancel/` | POST | `cancelBooking()` |
| `/bookings/{id}/confirm-payment/` | POST | `confirmPayment()` |
| `/hostels/{id}/availability/` | GET | `checkAvailability()` |

**Booking Status Flow:**
```
pending → confirmed → active → completed
    ↓
cancelled
```

#### `payments.ts` - Payment Processing
| Endpoint | Method | Function |
|----------|--------|----------|
| `/payments/initialize/` | POST | `initiatePayment()` |
| `/payments/receipts/{id}/` | GET | `verifyPayment()` |
| `/payments/history/` | GET | `getPayments()` |
| `/payments/recurring/enable/` | POST | `enableRecurringPayment()` |
| `/payments/payment-methods/` | GET | `getPaymentMethods()` |

**Supported Payment Methods:**
- M-Pesa (mobile money)
- Bank transfer

---

### Inventory System

#### `inventory.ts` - Inventory Reports (Three-Tier Approval)
| Endpoint | Method | Function |
|----------|--------|----------|
| `/inventory/items/` | GET | `getInventoryItems()` |
| `/inventory/reports/` | POST | `createReport()` |
| `/inventory/reports/{id}/submit/` | POST | `submitReport()` |
| `/inventory/reports/{id}/verify/` | POST | `verifyReport()` |
| `/inventory/reports/{id}/approve/` | POST | `approveReport()` |

**Report Workflow:**
```
Student Creates → Student Submits → Caretaker Verifies → Landlord Approves
     draft    →     submitted     →      verified      →     approved
```

#### `damage-reports.ts` - Damage Assessment
| Endpoint | Method | Function |
|----------|--------|----------|
| `/damage-reports/` | GET/POST | `getDamageReports()`, `createDamageReport()` |

---

### Role-Specific APIs

#### `caretaker.ts` - Caretaker Operations
| Category | Key Endpoints |
|----------|--------------|
| Dashboard | `GET /caretaker/dashboard/` |
| Tenants | `GET/PATCH /caretaker/tenants/` |
| Check-In | `POST /caretaker/check-in/verify/`, `POST /caretaker/check-in/` |
| Maintenance | `GET/POST /caretaker/maintenance/` |
| Security | `GET /caretaker/security/visitors/`, `GET /caretaker/security/night-checks/` |

#### `landlord-caretakers.ts` - Landlord's Caretaker Management
| Endpoint | Method | Function |
|----------|--------|----------|
| `/landlord/caretakers/` | GET/POST | `getMyCaretakers()`, `createCaretaker()` |
| `/landlord/caretakers/{id}/` | PATCH/DELETE | `updateCaretaker()`, `deleteCaretaker()` |

#### `tech-support.ts` - Admin Dashboard
| Category | Key Endpoints |
|----------|--------------|
| Users | `/accounts/tech-support/users/` |
| Hostels | `/hostels/tech-support/` |
| Payments | `/payments/tech-support/` |
| Tickets | `/support/tech-support/tickets/` |
| Logs | `/accounts/tech-support/logs/` |

---

### Communication & Support

#### `messages.ts` - In-App Messaging
| Endpoint | Method | Function |
|----------|--------|----------|
| `/messages/conversations/` | GET | `getConversations()` |
| `/messages/conversations/{id}/messages/` | GET/POST | `getMessages()`, `sendMessage()` |
| `/messages/conversations/{id}/read/` | POST | `markConversationAsRead()` |

#### `notifications.ts` - Push Notifications
| Endpoint | Method | Function |
|----------|--------|----------|
| `/notifications/` | GET | `getNotifications()` |
| `/notifications/{id}/read/` | PUT | `markAsRead()` |
| `/notifications/preferences/` | GET/PUT | `getPreferences()`, `updatePreferences()` |

#### `support.ts` - Support Tickets
| Endpoint | Method | Function |
|----------|--------|----------|
| `/support/tickets/` | GET/POST | `getTickets()`, `createTicket()` |
| `/support/tickets/{id}/replies/` | POST | `addTicketReply()` |
| `/support/tickets/{id}/assign/` | POST | `assignTicket()` |

---

### Public & Analytics

#### `public.ts` - Public Content (No Auth)
| Endpoint | Method | Function |
|----------|--------|----------|
| `/home/` | GET | `getLandingContent()` |
| `/home/faq/` | GET | `getFAQs()` |
| `/home/blog/` | GET | `getBlogPosts()` |
| `/home/contact/` | POST | `submitContactForm()` |
| `/home/newsletter/subscribe/` | POST | `subscribeNewsletter()` |

#### `analytics.ts` - Dashboard Analytics
| Endpoint | Method | Function |
|----------|--------|----------|
| `/analytics/dashboard/` | GET | `getAnalytics()` |
| `/analytics/breakdown/{category}/` | GET | `getAnalyticsBreakdown()` |
| `/analytics/export/` | POST | `exportAnalytics()` |

---

## Error Handling

**File:** `frontend/src/lib/api/error-mapping.ts`

### Error Response Format
```typescript
interface ApiErrorResponse {
  errors: Array<{
    message: string;
    field?: string;    // For form field validation
    code?: string;     // Known error codes
  }>;
  message: string;     // Main error message
  statusCode: number;  // HTTP status
}
```

### Error Handling Example
```typescript
import { mapApiError, getFieldError } from '@/lib/api/error-mapping';

try {
  await api.post('/bookings/', bookingData);
} catch (error) {
  const { errors, message, statusCode } = mapApiError(error);
  
  // Show field-specific errors
  const emailError = getFieldError(errors, 'email');
  if (emailError) setEmailError(emailError);
  
  // Show general error
  toast.error(message);
}
```

### Known Error Codes
| Code | Message |
|------|---------|
| `email_exists` | "This email is already registered." |
| `phone_exists` | "This phone number is already registered." |
| `validation_error` | "Some fields contain invalid data." |
| `network_error` | "Network error. Please check your connection." |
| `timeout` | "Request timed out. Please try again." |

---

## Environment Configuration

### Required Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1

# Optional: Mock API for development
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_MOCK_API_URL=/__mock_api
```

### Production Configuration
```env
NEXT_PUBLIC_API_URL=https://api.rumi.co.ke/api/v1
```

---

## Files with Mock Data (TODO)

The following files currently use mock data and need backend integration:

| File | Notes |
|------|-------|
| `reviews.ts` | All review functions return mock data |
| `transfers.ts` | All transfer functions return mock data |
| `users.ts` | Basic user functions return mock data |

---

## Quick Reference

### Making API Calls
```typescript
// Import the API module
import { hostelsApi } from '@/lib/api/hostels';

// In component
const loadHostels = async () => {
  try {
    const hostels = await hostelsApi.getHostels({ page: 1, university: 'UoN' });
    setHostels(hostels.results);
  } catch (error) {
    console.error('Failed to load hostels:', error);
  }
};
```

### With Zustand Store
```typescript
// In store
import { bookingsApi } from '@/lib/api/bookings';

const useBookingStore = create((set) => ({
  bookings: [],
  loading: false,
  fetchBookings: async () => {
    set({ loading: true });
    const bookings = await bookingsApi.getBookings();
    set({ bookings, loading: false });
  },
}));
```

---

## Summary

- **26 API modules** handle all backend communication
- **Centralized Axios client** with automatic token management
- **Token refresh** happens automatically on 401 responses
- **Consistent error handling** via `error-mapping.ts`
- **Three user roles** with distinct API endpoints: Student, Landlord, Caretaker
