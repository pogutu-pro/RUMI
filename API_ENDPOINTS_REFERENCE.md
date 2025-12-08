# RUMI Platform - Complete API Endpoints Reference

**Base URL:** `http://localhost:8000/api/v1/`

This document provides a comprehensive reference of all API endpoints available in the RUMI Platform backend and their expected frontend integrations.

---

## Authentication & Authorization

All endpoints (except registration, login, and public content endpoints) require authentication using Bearer token:

```
Authorization: Bearer <access_token>
```

### Token Management Flow
1. **Login:** `POST /api/v1/accounts/login/`
2. **Refresh:** `POST /api/v1/accounts/refresh-token/` 
3. **Logout:** `POST /api/v1/accounts/logout/`

---

## 1. ACCOUNTS API (`/api/v1/accounts/`)

### Authentication Endpoints
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/register/` | User registration | ❌ |
| POST | `/verify-email/` | Email verification with OTP | ❌ |
| POST | `/resend-otp/` | Resend verification OTP | ❌ |
| POST | `/login/` | User login | ❌ |
| POST | `/refresh-token/` | Refresh access token | ❌ |
| POST | `/logout/` | User logout | ✅ |

### Password Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/password/reset/` | Request password reset | ❌ |
| POST | `/password/reset/verify/` | Verify reset token | ❌ |
| POST | `/password/reset/confirm/` | Confirm new password | ❌ |

### Profile Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/profile/` | Get user profile | ✅ |
| PUT | `/profile/` | Update user profile | ✅ |
| POST | `/profile/picture/` | Upload profile picture | ✅ |

### Dashboard
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/dashboard/` | Student dashboard | ✅ |
| GET | `/landlord/dashboard/` | Landlord dashboard | ✅ |

### Caretaker Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/caretakers/` | List caretakers | ✅ |
| POST | `/caretakers/` | Create caretaker | ✅ |
| GET | `/caretakers/<id>/` | Get caretaker details | ✅ |

### Admin User Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/users/` | List all users (Admin) | ✅ |
| POST | `/users/<id>/deactivate/` | Deactivate user | ✅ |
| POST | `/users/<id>/reactivate/` | Reactivate user | ✅ |
| GET | `/users/<id>/activity/` | User activity log | ✅ |

### Landlord Verification (Admin)
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/landlords/verification/` | List landlord applications | ✅ |
| POST | `/landlords/<id>/verify/<action>/` | Approve/reject landlord | ✅ |

### ❌ Missing Admin Endpoints (Referenced in Frontend)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/admin/users/` | List all users | ❌ **MISSING** |
| GET | `/admin/stats/` | Get admin statistics | ❌ **MISSING** |
| GET | `/admin/landlord-verifications/` | List landlord applications | ❌ **MISSING** |
| POST | `/admin/landlord-verifications/<id>/verify/` | Verify landlord | ❌ **MISSING** |

### ❌ Missing Analytics Endpoints
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/analytics/users/` | User analytics data | ❌ **MISSING** |

---

## 2. SUBSCRIPTIONS API (`/api/v1/accounts/subscriptions/`)

### Subscription Plans
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/plans/` | List all subscription plans | ❌ |
| GET | `/plans/<uuid:plan_id>/` | Get plan details | ❌ |

### User Subscription Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/my-subscription/` | Get user's current subscription | ✅ |
| POST | `/upgrade/` | Upgrade subscription plan | ✅ |
| POST | `/cancel/` | Cancel subscription | ✅ |
| POST | `/reactivate/` | Reactivate cancelled subscription | ✅ |

### Payment Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/payments/history/` | Payment history | ✅ |
| POST | `/payments/initiate/` | Initiate payment | ✅ |

### Feature Access
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/features/<feature_name>/` | Check feature access | ✅ |

---

## 3. HOSTELS API (`/api/v1/hostels/`)

### Hostel Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/` | List all hostels | ❌ |
| POST | `/create/` | Create new hostel | ✅ |
| GET | `/<hostel_id>/` | Get hostel details | ❌ |

### Room Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/rooms/` | List all rooms | ❌ |
| GET | `/rooms/<room_id>/` | Get room details | ❌ |
| POST | `/<hostel_id>/rooms/` | Create new room | ✅ |

### Inventory Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/<hostel_id>/inventory/` | Create inventory template | ✅ |
| GET | `/<hostel_id>/inventory/template/` | Get inventory template | ✅ |

### Check-in Process
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/checkin/<booking_id>/start/` | Start inventory check-in | ✅ |
| PUT | `/checkin/<checkin_id>/submit/` | Submit check-in checklist | ✅ |
| PUT | `/checkin/<checkin_id>/verify/` | Verify check-in | ✅ |

### Room Search & Booking
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/search/` | Search available rooms | ❌ |
| POST | `/<room_id>/reserve/` | Reserve a room | ✅ |
| POST | `/<room_id>/book/` | Book a room | ✅ |
| GET | `/<room_id>/roommates/` | Get roommate matching | ✅ |

---

## 4. MARKETPLACE API (`/api/v1/marketplace/`)

### Seller Applications
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/seller/apply/` | Submit seller application | ✅ |
| GET | `/seller/application/<id>/` | Check application status | ✅ |

### Admin Seller Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/admin/seller-applications/` | List seller applications | ✅ |
| PUT | `/admin/seller-applications/<id>/review/` | Review application | ✅ |
| POST | `/admin/seller-applications/<id>/approve/` | Approve seller | ✅ |
| POST | `/admin/seller-applications/<id>/reject/` | Reject seller | ✅ |
| GET | `/admin/sellers/` | List approved sellers | ✅ |

### Products
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/products/` | List products | ❌ |
| POST | `/products/create/` | Create new product | ✅ |
| POST | `/products/<id>/contact/` | Reveal seller contact | ✅ |

### Shopping Cart
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/cart/` | Get cart contents | ✅ |
| POST | `/cart/add/` | Add item to cart | ✅ |
| PUT | `/cart/update/<item_id>/` | Update cart item | ✅ |
| DELETE | `/cart/remove/<item_id>/` | Remove item from cart | ✅ |

### Orders
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/orders/` | List orders | ✅ |
| GET | `/orders/<id>/` | Get order details | ✅ |
| PUT | `/orders/<id>/status/` | Update order status | ✅ |
| POST | `/orders/<id>/ship/` | Mark order shipped | ✅ |
| POST | `/orders/<id>/deliver/` | Mark order delivered | ✅ |

### Reviews & Ratings
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/products/<id>/reviews/` | Get product reviews | ❌ |
| POST | `/orders/<id>/review/` | Create order review | ✅ |

### Wishlist
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/wishlist/` | Get wishlist items | ✅ |
| POST | `/wishlist/add/` | Add to wishlist | ✅ |
| DELETE | `/wishlist/remove/<item_id>/` | Remove from wishlist | ✅ |

### ❌ Missing Chat Endpoints
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/chat/conversations/` | Get chat conversations | ❌ **MISSING** |
| GET | `/chat/conversations/<id>/messages/` | Get conversation messages | ❌ **MISSING** |
| POST | `/chat/conversations/<id>/messages/` | Send message | ❌ **MISSING** |

### ❌ Missing Product Analytics
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/analytics/products/` | Product analytics data | ❌ **MISSING** |

---

## 5. PAYMENTS API (`/api/v1/payments/`)

### Payment Processing
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/initialize/` | Initialize payment | ✅ |

### Recurring Payments
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/recurring/enable/` | Enable recurring payment | ✅ |
| PUT | `/recurring/<id>/pause/` | Pause recurring payment | ✅ |
| PUT | `/recurring/<id>/resume/` | Resume recurring payment | ✅ |
| DELETE | `/recurring/<id>/cancel/` | Cancel recurring payment | ✅ |

### Late Fees
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/late-fees/<booking_id>/` | Get late fees | ✅ |
| POST | `/late-fees/<id>/pay/` | Pay late fee | ✅ |

### Payment Methods
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/payment-methods/` | Get saved payment methods | ✅ |
| PUT | `/payment-methods/<id>/default/` | Set default payment method | ✅ |
| DELETE | `/payment-methods/<id>/` | Delete payment method | ✅ |

### Receipts & Reports
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/receipts/<transaction_id>/` | Get payment receipt | ✅ |
| GET | `/tax-reports/` | Get tax reports | ✅ |
| GET | `/tax-reports/<id>/download/` | Download tax report | ✅ |

### Analytics
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/analytics/revenue/` | Revenue analytics data | ✅ |

### Webhooks
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/webhook/paystack/` | Paystack webhook handler | ❌ |

### ❌ Missing Payment Endpoints
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/transactions/` | Get transaction history | ❌ **MISSING** |
| GET | `/transactions/<id>/receipt/` | Get transaction receipt | ❌ **MISSING** |
| GET | `/recurring/` | List recurring payments | ❌ **MISSING** |

---

## 6. NOTIFICATIONS API (`/api/v1/notifications/`)

### User Notifications
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/` | List user notifications | ✅ |
| PUT | `/<notification_id>/read/` | Mark notification as read | ✅ |
| PUT | `/mark-all-read/` | Mark all notifications as read | ✅ |
| GET | `/preferences/` | Get notification preferences | ✅ |
| PUT | `/preferences/` | Update notification preferences | ✅ |

### Admin Notification Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/admin/templates/email/` | Email templates | ✅ |
| GET | `/admin/templates/sms/` | SMS templates | ✅ |
| GET | `/admin/stats/` | Notification statistics | ✅ |

---

## 7. HOME API (`/api/v1/home/`)

### Landing Page & Public Content
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/` | Landing page content | ❌ |
| GET | `/about/` | About us page | ❌ |
| GET | `/team/` | Team information | ❌ |
| POST | `/contact/` | Submit contact inquiry | ❌ |
| GET | `/contact/info/` | Contact information | ❌ |

### FAQ & Help
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/faq/` | FAQ list | ❌ |
| PUT | `/faq/<id>/helpful/` | Mark FAQ as helpful | ❌ |

### Blog & Content
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/blog/` | Blog posts list | ❌ |
| GET | `/blog/<slug>/` | Blog post detail | ❌ |

### Newsletter
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/newsletter/subscribe/` | Subscribe to newsletter | ❌ |
| POST | `/newsletter/verify/` | Verify newsletter subscription | ❌ |
| POST | `/newsletter/unsubscribe/` | Unsubscribe from newsletter | ❌ |

### Admin Statistics
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| PUT | `/statistics/<key>/` | Update statistics | ✅ |

---

## API Statistics

### Endpoint Summary
- **Total Backend Endpoints:** 89
- **Implemented:** 80 (90%)
- **Missing (Required by Frontend):** 9 (10%)

### Endpoints by Category
| Category | Implemented | Missing | Total |
|----------|-------------|---------|-------|
| Accounts | 17 | 4 | 21 |
| Subscriptions | 9 | 0 | 9 |
| Hostels | 12 | 0 | 12 |
| Marketplace | 19 | 4 | 23 |
| Payments | 12 | 3 | 15 |
| Notifications | 8 | 0 | 8 |
| Home | 9 | 0 | 9 |
| **Total** | **80** | **9** | **89** |

---

## Critical Missing Endpoints

The following endpoints are being called by the frontend but are not implemented in the backend:

1. **Admin User Management:**
   - `GET /api/v1/accounts/admin/users/`
   - `GET /api/v1/accounts/admin/stats/`
   - `GET /api/v1/accounts/admin/landlord-verifications/`
   - `POST /api/v1/accounts/admin/landlord-verifications/<id>/verify/`

2. **Analytics:**
   - `GET /api/v1/accounts/analytics/users/`
   - `GET /api/v1/marketplace/analytics/products/`

3. **Chat System:**
   - `GET /api/v1/marketplace/chat/conversations/`
   - `GET /api/v1/marketplace/chat/conversations/<id>/messages/`
   - `POST /api/v1/marketplace/chat/conversations/<id>/messages/`

4. **Payment History:**
   - `GET /api/v1/payments/transactions/`
   - `GET /api/v1/payments/transactions/<id>/receipt/`
   - `GET /api/v1/payments/recurring/`

---

## Recommendations

1. **Implement Missing Endpoints:** Priority should be given to admin and analytics endpoints as they're critical for the admin dashboard functionality.

2. **Chat System:** The chat functionality is referenced throughout the frontend but not implemented in the backend. This should be a high priority.

3. **Payment History:** Transaction and recurring payment listing endpoints are needed for the payment dashboard.

4. **API Documentation:** Consider using Django REST Framework's built-in documentation features (Swagger/OpenAPI) for auto-generated API documentation.

5. **Error Handling:** Ensure consistent error response format across all endpoints.

6. **Rate Limiting:** Consider implementing rate limiting for API endpoints, especially authentication endpoints.

---

## Notes

- All endpoints use JSON for request/response format
- File uploads use multipart/form-data (e.g., profile picture)
- Date/Time fields are in ISO 8601 format
- UUIDs are used for subscription plan IDs
- Integer IDs are used for most other resources
- The base API version is v1, so all endpoints start with `/api/v1/`

This document should be updated whenever new endpoints are added or existing ones are modified.