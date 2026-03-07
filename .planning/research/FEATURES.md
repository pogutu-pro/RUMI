# Research: Features & API Contracts
**Project:** RUMI Backend Optimization
**Dimension:** Features — what each role needs, what's broken
**Confidence:** HIGH — direct codebase inspection

---

## Critical Bugs Found (Fix First)

### 1. Paystack Variable Shadowing Bug — `payments/views.py`
```python
from django.db import transaction  # imported here
# ...
transaction = Transaction.objects.get(...)  # OVERWRITES the import!
transaction.atomic()  # AttributeError — 'Transaction' model has no atomic()
```
**Impact:** Paystack charge.success webhook crashes silently.

### 2. PaymentLedgerView NameError — `payments/stubs_views.py`
```python
models.Q(...)  # models is not imported in stubs_views.py
```
**Impact:** Any ledger search request raises `NameError` at runtime.

### 3. UnmatchedPaymentRejectView — No DB Write
```python
# POST returns {'status': 'rejected'} but Transaction record is never updated
```
**Impact:** Rejected payments remain in their original state in the database.

---

## Student Role API Needs

### Table Stakes (must work)
- Browse/search hostels with filters (city, price, gender policy, amenities)
- View hostel detail + rooms + beds + availability
- Create/cancel bookings
- Track booking status (pending → approved → active → completed)
- Make payments (M-Pesa STK push, Paystack)
- View payment history + receipts (PDF download)
- View/update own profile
- Roommate matching (request, browse matches, accept/reject)
- In-app notifications + unread count
- Activity feed
- Support ticket submission

### Missing / Broken
- `VisitorInvitation` model does not exist — student endpoints for inviting visitors are wired to non-existent model
- `LateEntry` model does not exist — late entry logging has no model backing it
- `/accounts/messages/unread-count/` — unclear if registered
- `/accounts/student/activity/feed/` — unclear if registered
- `/accounts/student/support/tickets/` — unclear if registered

---

## Landlord Role API Needs

### Table Stakes (must work)
- Create/edit/delete hostels, rooms, beds
- View occupancy dashboard (beds occupied, vacant, revenue)
- Manage bookings (approve, reject, check-in, check-out)
- View payment history + payouts
- Manage caretakers (assign, remove)
- View tenant list with payment status
- Maintenance logs
- Analytics (occupancy rate, revenue trends)
- Waitlist management

### Missing / Broken
- Tenant detail endpoint — referenced in frontend but missing URL
- Some analytics endpoints return placeholder/mock data

---

## Caretaker Role API Needs

### Table Stakes (must work)
- View assigned hostel(s) dashboard
- Check in / check out residents
- Visitor invitation management (create, approve, reject, check-in, check-out)
- Maintenance requests (create, update status, view list + detail)
- Damage reports (create, view list + detail)
- Roommate request approval actions
- Late entry logging

### Missing URLs (not registered in caretaker_operations/urls.py)
- `GET/POST /api/v1/caretaker/visitor-invitations/`
- `POST /api/v1/caretaker/visitor-invitations/{id}/approve/`
- `POST /api/v1/caretaker/visitor-invitations/{id}/reject/`
- `POST /api/v1/caretaker/visitor-invitations/{id}/check-in/`
- `POST /api/v1/caretaker/visitor-invitations/{id}/check-out/`
- `POST /api/v1/caretaker/roommate-requests/{id}/approve/`
- `POST /api/v1/caretaker/roommate-requests/{id}/reject/`
- `GET /api/v1/caretaker/maintenance/{id}/` (detail)
- `GET /api/v1/caretaker/damage-reports/{id}/` (detail)

### Placeholder Logic (needs real implementation)
- `caretaker_operations/views.py:853` — `maintenance_requests = []  # Placeholder`
- `caretaker_operations/additional_views.py:58` — `# This is just placeholder logic`

---

## Admin / Tech Support Role API Needs

### Table Stakes (must work)
- User management (list, detail, activate/deactivate, role changes)
- Platform stats (total users, hostels, revenue, bookings)
- Landlord verification workflow (approve/reject documents)
- Payment oversight (flagged payments, disputes)
- Content moderation (blogs, reviews)
- System health + monitoring

### Broken: Admin Layer Cross-Coupling
`admin_api/super_admin_urls.py` and `admin_api/platform_admin_urls.py` directly import views from `admin_endpoints` (the deprecated app):
```python
from admin_endpoints import views as admin_endpoints_views
```
This creates 6+ cross-wired endpoints that prevent deprecating `admin_endpoints`.

---

## Payment Flow Requirements

### M-Pesa STK Push (Daraja API)
1. Frontend calls `POST /api/v1/payments/mpesa/initiate/`
2. Backend calls Daraja STK Push → returns `CheckoutRequestID`
3. Frontend polls `GET /api/v1/payments/mpesa/status/{CheckoutRequestID}/`
4. Safaricom sends callback to `POST /api/v1/payments/mpesa/callback/`
5. Backend processes callback → updates Transaction → triggers billing accrual
6. Receipt generated and stored

### Paystack
1. Frontend creates charge → Paystack returns reference
2. Frontend verifies `GET /api/v1/payments/paystack/verify/{reference}/`
3. Paystack sends `charge.success` webhook → `POST /api/v1/payments/webhook/paystack/`
4. Backend verifies signature → processes payment → updates Transaction
5. **BUG**: Step 4 crashes due to variable shadowing (see Critical Bugs above)

---

## Stub Views — What They Should Actually Do

| Stub | Real Implementation Needed |
|------|---------------------------|
| `PaymentVerificationView` | Query Transaction by reference, return status + details |
| `BedPaybillView` | Return bed's M-Pesa paybill/account number from BedMpesaConfig |
| `UnmatchedPaymentRejectView` | Update Transaction status to 'rejected', log reason, notify landlord |
| `PaymentLedgerView` | Query Transaction with proper filters using `Q()`, paginate results |

---

## Deferred Features (not in this optimization scope)
- Mobile app / PWA features
- New payment providers beyond M-Pesa + Paystack
- New user roles
- Real-time chat between students and landlords

---

## Out of Scope
| Feature | Reason |
|---------|--------|
| Frontend changes | Backend must conform to frontend |
| New product features | Optimization only — fix what's broken |
| Microservices | Keep monolith |

---
*Research completed: 2026-03-07*
