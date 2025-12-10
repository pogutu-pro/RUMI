# RUMI Platform - Complete API Endpoints Reference

**Base URL:** `http://localhost:8000/api/v1/`
**API Documentation:** `http://localhost:8000/swagger/` (Interactive Swagger UI)

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
| POST | `/register/` | User registration | No |
| POST | `/verify-email/` | Email verification with OTP | No |
| POST | `/resend-otp/` | Resend verification OTP | No |
| POST | `/login/` | User login | No |
| POST | `/refresh-token/` | Refresh access token | No |
| POST | `/logout/` | User logout | Yes |

### Password Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/password/reset/` | Request password reset | No |
| POST | `/password/reset/verify/` | Verify reset token | No |
| POST | `/password/reset/confirm/` | Confirm new password | No |

### Profile Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/profile/` | Get user profile | Yes |
| PUT | `/profile/` | Update user profile | Yes |
| POST | `/profile/picture/` | Upload profile picture | Yes |

### Dashboard
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/dashboard/` | Student dashboard | Yes |
| GET | `/landlord/dashboard/` | Landlord dashboard | Yes |

### Caretaker Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/caretakers/` | List caretakers | Yes |
| POST | `/caretakers/` | Create caretaker | Yes |
| GET | `/caretakers/<id>/` | Get caretaker details | Yes |

### Admin User Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/users/` | List all users (Admin) | Yes |
| POST | `/users/<id>/deactivate/` | Deactivate user | Yes |
| POST | `/users/<id>/reactivate/` | Reactivate user | Yes |
| GET | `/users/<id>/activity/` | User activity log | Yes |

### Landlord Verification (Admin)
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/landlords/verification/` | List landlord applications | Yes |
| POST | `/landlords/<id>/verify/<action>/` | Approve/reject landlord | Yes |

### No Missing Admin Endpoints (Referenced in Frontend)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/admin/users/` | List all users | No **MISSING** |
| GET | `/admin/stats/` | Get admin statistics | No **MISSING** |
| GET | `/admin/landlord-verifications/` | List landlord applications | No **MISSING** |
| POST | `/admin/landlord-verifications/<id>/verify/` | Verify landlord | No **MISSING** |

### No Missing Analytics Endpoints
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/analytics/users/` | User analytics data | No **MISSING** |

---

## 2. SUBSCRIPTIONS API (`/api/v1/accounts/subscriptions/`)

### Subscription Plans
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/plans/` | List all subscription plans | No |
| GET | `/plans/<uuid:plan_id>/` | Get plan details | No |

### User Subscription Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/my-subscription/` | Get user's current subscription | Yes |
| POST | `/upgrade/` | Upgrade subscription plan | Yes |
| POST | `/cancel/` | Cancel subscription | Yes |
| POST | `/reactivate/` | Reactivate cancelled subscription | Yes |

### Payment Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/payments/history/` | Payment history | Yes |
| POST | `/payments/initiate/` | Initiate payment | Yes |

### Feature Access
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/features/<feature_name>/` | Check feature access | Yes |

---

## 3. HOSTELS API (`/api/v1/hostels/`)

### Hostel Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/` | List all hostels | No |
| POST | `/create/` | Create new hostel | Yes |
| GET | `/<hostel_id>/` | Get hostel details | No |

### Room Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/rooms/` | List all rooms | No |
| GET | `/rooms/<room_id>/` | Get room details | No |
| POST | `/<hostel_id>/rooms/` | Create new room | Yes |

### Inventory Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/<hostel_id>/inventory/` | Create inventory template | Yes |
| GET | `/<hostel_id>/inventory/template/` | Get inventory template | Yes |

### Check-in Process
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/checkin/<booking_id>/start/` | Start inventory check-in | Yes |
| PUT | `/checkin/<checkin_id>/submit/` | Submit check-in checklist | Yes |
| PUT | `/checkin/<checkin_id>/verify/` | Verify check-in | Yes |

### Room Search & Booking
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/search/` | Search available rooms | No |
| POST | `/<room_id>/reserve/` | Reserve a room | Yes |
| POST | `/<room_id>/book/` | Book a room | Yes |
| GET | `/<room_id>/roommates/` | Get roommate matching | Yes |

---

## 4. MARKETPLACE API (`/api/v1/marketplace/`)

### Seller Applications
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/seller/apply/` | Submit seller application | Yes |
| GET | `/seller/application/<id>/` | Check application status | Yes |

### Admin Seller Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/admin/seller-applications/` | List seller applications | Yes |
| PUT | `/admin/seller-applications/<id>/review/` | Review application | Yes |
| POST | `/admin/seller-applications/<id>/approve/` | Approve seller | Yes |
| POST | `/admin/seller-applications/<id>/reject/` | Reject seller | Yes |
| GET | `/admin/sellers/` | List approved sellers | Yes |

### Products
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/products/` | List products | No |
| POST | `/products/create/` | Create new product | Yes |
| POST | `/products/<id>/contact/` | Reveal seller contact | Yes |

### Shopping Cart
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/cart/` | Get cart contents | Yes |
| POST | `/cart/add/` | Add item to cart | Yes |
| PUT | `/cart/update/<item_id>/` | Update cart item | Yes |
| DELETE | `/cart/remove/<item_id>/` | Remove item from cart | Yes |

### Orders
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/orders/` | List orders | Yes |
| GET | `/orders/<id>/` | Get order details | Yes |
| PUT | `/orders/<id>/status/` | Update order status | Yes |
| POST | `/orders/<id>/ship/` | Mark order shipped | Yes |
| POST | `/orders/<id>/deliver/` | Mark order delivered | Yes |

### Reviews & Ratings
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/products/<id>/reviews/` | Get product reviews | No |
| POST | `/orders/<id>/review/` | Create order review | Yes |

### Wishlist
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/wishlist/` | Get wishlist items | Yes |
| POST | `/wishlist/add/` | Add to wishlist | Yes |
| DELETE | `/wishlist/remove/<item_id>/` | Remove from wishlist | Yes |

### Yes Chat System Endpoints
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/chat/conversations/` | Get user's chat conversations | Yes |
| GET | `/chat/conversations/<id>/messages/` | Get messages for a conversation | Yes |
| POST | `/chat/conversations/<id>/messages/` | Send message to a conversation | Yes |
| POST | `/chat/send/` | Send message (creates conversation if needed) | Yes |

### No Missing Product Analytics
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/analytics/products/` | Product analytics data | No **MISSING** |

---

## 5. PAYMENTS API (`/api/v1/payments/`)

### Payment Processing
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/initialize/` | Initialize payment | Yes |

### Recurring Payments
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/recurring/enable/` | Enable recurring payment | Yes |
| PUT | `/recurring/<id>/pause/` | Pause recurring payment | Yes |
| PUT | `/recurring/<id>/resume/` | Resume recurring payment | Yes |
| DELETE | `/recurring/<id>/cancel/` | Cancel recurring payment | Yes |

### Late Fees
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/late-fees/<booking_id>/` | Get late fees | Yes |
| POST | `/late-fees/<id>/pay/` | Pay late fee | Yes |

### Payment Methods
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/payment-methods/` | Get saved payment methods | Yes |
| PUT | `/payment-methods/<id>/default/` | Set default payment method | Yes |
| DELETE | `/payment-methods/<id>/` | Delete payment method | Yes |

### Receipts & Reports
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/receipts/<transaction_id>/` | Get payment receipt | Yes |
| GET | `/tax-reports/` | Get tax reports | Yes |
| GET | `/tax-reports/<id>/download/` | Download tax report | Yes |

### Analytics
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/analytics/revenue/` | Revenue analytics data | Yes |

### Webhooks
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/webhook/paystack/` | Paystack webhook handler | No |

### No Missing Payment Endpoints
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/transactions/` | Get transaction history | No **MISSING** |
| GET | `/transactions/<id>/receipt/` | Get transaction receipt | No **MISSING** |
| GET | `/recurring/` | List recurring payments | No **MISSING** |

---

## 6. NOTIFICATIONS API (`/api/v1/notifications/`)

### User Notifications
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/` | List user notifications | Yes |
| PUT | `/<notification_id>/read/` | Mark notification as read | Yes |
| PUT | `/mark-all-read/` | Mark all notifications as read | Yes |
| GET | `/preferences/` | Get notification preferences | Yes |
| PUT | `/preferences/` | Update notification preferences | Yes |

### Admin Notification Management
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/admin/templates/email/` | Email templates | Yes |
| GET | `/admin/templates/sms/` | SMS templates | Yes |
| GET | `/admin/stats/` | Notification statistics | Yes |

---

## 7. HOME API (`/api/v1/home/`)

### Landing Page & Public Content
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/` | Landing page content | No |
| GET | `/about/` | About us page | No |
| GET | `/team/` | Team information | No |
| POST | `/contact/` | Submit contact inquiry | No |
| GET | `/contact/info/` | Contact information | No |

### FAQ & Help
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/faq/` | FAQ list | No |
| PUT | `/faq/<id>/helpful/` | Mark FAQ as helpful | No |

### Blog & Content
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| GET | `/blog/` | Blog posts list | No |
| GET | `/blog/<slug>/` | Blog post detail | No |

### Newsletter
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| POST | `/newsletter/subscribe/` | Subscribe to newsletter | No |
| POST | `/newsletter/verify/` | Verify newsletter subscription | No |
| POST | `/newsletter/unsubscribe/` | Unsubscribe from newsletter | No |

### Admin Statistics
| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|------------------------|
| PUT | `/statistics/<key>/` | Update statistics | Yes |

---

## API Statistics

### Endpoint Summary
- **Total Backend Endpoints:** 93
- **Implemented:** 87 (94%)
- **Missing (Required by Frontend):** 6 (6%)

### Endpoints by Category
| Category | Implemented | Missing | Total |
|----------|-------------|---------|-------|
| Accounts | 21 | 4 | 25 |
| Subscriptions | 9 | 0 | 9 |
| Hostels | 12 | 0 | 12 |
| Marketplace | 19 | 4 | 23 |
| Payments | 12 | 3 | 15 |
| Notifications | 8 | 0 | 8 |
| Home | 9 | 0 | 9 |
| **Total** | **87** | **6** | **93** |

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

3. **Payment History:**
    - `GET /api/v1/payments/transactions/`
    - `GET /api/v1/payments/transactions/<id>/receipt/`
    - `GET /api/v1/payments/recurring/`

---

## Recommendations

1. **Implement Missing Endpoints:** Priority should be given to admin and analytics endpoints as they're critical for the admin dashboard functionality.

2. **Payment History:** Transaction and recurring payment listing endpoints are needed for the payment dashboard.

3. **API Documentation:** Swagger/OpenAPI documentation is now available at `/swagger/` for interactive API testing and exploration.

4. **Error Handling:** Ensure consistent error response format across all endpoints.

5. **Rate Limiting:** Consider implementing rate limiting for API endpoints, especially authentication endpoints.

---

## Notes

- All endpoints use JSON for request/response format
- File uploads use multipart/form-data (e.g., profile picture)
- Date/Time fields are in ISO 8601 format
- UUIDs are used for subscription plan IDs
- Integer IDs are used for most other resources
- The base API version is v1, so all endpoints start with `/api/v1/`

This document should be updated whenever new endpoints are added or existing ones are modified.