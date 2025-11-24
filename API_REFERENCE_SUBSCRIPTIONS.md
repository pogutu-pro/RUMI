# Subscription API Reference

**Base URL:** `/api/v1/accounts/subscriptions/`

## Pricing Overview

- **Free Trial**: 30 days, all features (first-time landlords)
- **Basic Plan**: KES 10,000/month
- **Medium Plan**: KES 30,000/month
- **Advanced Plan**: KES 40,000/month (+ AI features)

---

## Authentication

All endpoints except "List Plans" and "Get Plan Details" require JWT authentication:

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. List Subscription Plans

**GET** `/plans/`

List all available subscription plans.

**Authentication:** Not required

**Response (200):**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Basic Plan",
      "slug": "basic-plan",
      "plan_type": "basic",
      "billing_type": "fixed",
      "fixed_price": "10000.00",
      "revenue_percentage": "0.00",
      "trial_duration_days": 0,
      "features": {
        "hostels": "unlimited",
        "rooms": "unlimited",
        "recurring_payments": true,
        "advanced_analytics": false
      },
      "description": "KES 10,000 per month...",
      "is_active": true,
      "sort_order": 2,
      "billing_display": "KES 10,000.00 per month",
      "price_display": "KES 10,000/mo"
    }
  ],
  "total_plans": 4
}
```

---

### 2. Get Plan Details

**GET** `/plans/{plan_id}/`

Get details of a specific subscription plan.

**Authentication:** Not required

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Medium Plan",
  "slug": "medium-plan",
  "plan_type": "medium",
  "billing_type": "revenue",
  "fixed_price": "0.00",
  "revenue_percentage": "1.00",
  "features": {...},
  "billing_display": "1.00% of monthly rent revenue",
  "price_display": "1% revenue"
}
```

---

### 3. Get My Subscription

**GET** `/my-subscription/`

Get current landlord's subscription details and feature access.

**Authentication:** Required (Landlord only)

**Response (200):**
```json
{
  "subscription": {
    "id": "uuid",
    "plan": "uuid",
    "plan_details": {
      "name": "Free Trial",
      "billing_display": "FREE"
    },
    "status": "trial",
    "status_display": "🎁 Free Trial",
    "current_period_start": "2025-11-01",
    "current_period_end": "2025-12-01",
    "next_billing_date": "2025-12-02",
    "trial_end": "2025-12-01",
    "total_rent_collected_this_period": "0.00",
    "calculated_fee_this_period": "0.00",
    "auto_renew": true,
    "days_until_billing": 10,
    "current_period_display": "Nov 01, 2025 - Dec 01, 2025",
    "subscription_amount": 0.0
  },
  "features": {
    "can_create_hostels": true,
    "can_use_ai_features": true,
    "active_features": [
      "Create Hostels",
      "AI Features",
      "Predictive Analytics"
    ],
    "feature_categories": {
      "core": {...},
      "basic": {...},
      "medium": {...},
      "advanced": {...}
    }
  },
  "is_trial": true,
  "can_access_platform": true
}
```

---

### 4. Upgrade/Downgrade Plan

**POST** `/upgrade/`

Change subscription plan.

**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "new_plan_id": "uuid",
  "immediate": false
}
```

**Response (200):**
```json
{
  "message": "Scheduled upgrade from Free Trial to Basic Plan on 2025-12-02",
  "new_plan": {
    "name": "Basic Plan",
    "price_display": "KES 10,000/mo"
  },
  "effective_date": "2025-12-02",
  "subscription": {...}
}
```

**Error Responses:**
- `400`: Cannot switch to trial plan / Already on this plan
- `404`: Plan not found

---

### 5. Cancel Subscription

**POST** `/cancel/`

Cancel current subscription.

**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "reason": "Too expensive",
  "immediate": false,
  "feedback": "Optional feedback message"
}
```

**Response (200):**
```json
{
  "message": "Subscription will be cancelled on 2025-12-01",
  "cancelled_immediately": false,
  "effective_date": "2025-12-01",
  "access_until": "2025-12-01"
}
```

---

### 6. Reactivate Subscription

**POST** `/reactivate/`

Reactivate a cancelled subscription.

**Authentication:** Required (Landlord only)

**Response (200):**
```json
{
  "message": "Subscription reactivated successfully",
  "subscription": {...}
}
```

---

### 7. Payment History

**GET** `/payments/history/`

View subscription payment history.

**Authentication:** Required (Landlord only)

**Query Parameters:**
- `limit` (optional): Results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "total_payments": 5,
  "payments": [
    {
      "id": "uuid",
      "subscription": "uuid",
      "subscription_details": {
        "plan_name": "Basic Plan",
        "plan_type": "basic"
      },
      "amount": "10000.00",
      "billing_period_start": "2025-11-01",
      "billing_period_end": "2025-12-01",
      "period_display": "Nov 01 - Dec 01, 2025",
      "rent_revenue_amount": null,
      "payment_method": "paystack",
      "transaction_reference": "SUB-2025-ABC123",
      "status": "success",
      "status_display": "✓ Paid",
      "paid_at": "2025-11-01T10:30:00Z"
    }
  ]
}
```

---

### 8. Initiate Payment

**POST** `/payments/initiate/`

Initialize subscription payment.

**Authentication:** Required (Landlord only)

**Response (201):**
```json
{
  "payment_id": "uuid",
  "transaction_reference": "SUB-2025-ABC123",
  "amount": 10000.0,
  "payment_link": "https://paystack.com/pay/sub-2025-abc123",
  "currency": "KES",
  "expires_at": "2025-11-21T11:30:00Z"
}
```

**Error Responses:**
- `400`: No payment required (e.g., trial period)

---

### 9. Check Feature Access

**GET** `/features/{feature_name}/`

Check if landlord has access to a specific feature.

**Authentication:** Required (Landlord only)

**Feature Names:**
- `create_hostels`
- `manage_rooms`
- `process_payments`
- `create_caretakers`
- `use_recurring_payments`
- `use_inventory_management`
- `view_basic_analytics`
- `access_marketplace`
- `view_advanced_analytics`
- `generate_custom_reports`
- `use_bulk_operations`
- `use_ai_features`
- `use_predictive_analytics`
- `use_smart_pricing`
- `use_api_access`
- `use_white_label`
- `auto_screen_tenants`

**Response (200):**
```json
{
  "feature": "use_ai_features",
  "has_access": true,
  "current_plan": "Advanced Plan",
  "plan_type": "advanced"
}
```

---

## Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                  SUBSCRIPTION LIFECYCLE                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. REGISTRATION                                         │
│     └─> Auto-create 30-day FREE TRIAL                   │
│         └─> All features enabled                          │
│                                                           │
│  2. TRIAL PERIOD (30 days)                              │
│     └─> Landlord evaluates platform                      │
│     └─> 7 days before trial end: Reminder sent          │
│                                                           │
│  3. TRIAL EXPIRY                                         │
│     └─> Must choose paid plan                            │
│     └─> Options: Basic / Medium / Advanced              │
│                                                           │
│  4. ACTIVE SUBSCRIPTION                                  │
│     ├─> Basic: KES 10,000/month fixed                    │
│     ├─> Medium: 1% of rent revenue                       │
│     └─> Advanced: KES 9,999/month + AI features         │
│                                                           │
│  5. BILLING CYCLE                                        │
│     ├─> Monthly billing                                  │
│     ├─> Auto-calculate medium plan fee                   │
│     ├─> Send payment link via email                      │
│     └─> 7-day grace period if payment fails             │
│                                                           │
│  6. PLAN CHANGES                                         │
│     ├─> Upgrade: Takes effect immediately               │
│     └─> Downgrade: Takes effect next billing cycle      │
│                                                           │
│  7. CANCELLATION                                         │
│     ├─> Cancel immediately: Lose access now             │
│     └─> Cancel at period end: Access until end date     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Medium Plan Calculation

The Medium Plan uses a revenue-based model:

```python
# At the end of each billing period:
total_rent_collected = sum(all_successful_rent_payments)
subscription_fee = total_rent_collected * 0.01  # 1%

# Example:
# Landlord collected KES 500,000 in rent
# Subscription fee = 500,000 * 1% = KES 5,000
```

**Benefits:**
-  Pay only when you earn
-  Scales with your business
-  No fixed overhead
-  Fair for all hostel sizes

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `SUBSCRIPTION_NOT_FOUND` | 404 | Subscription does not exist |
| `PLAN_NOT_FOUND` | 404 | Plan does not exist |
| `INVALID_PLAN` | 400 | Invalid or inactive plan |
| `TRIAL_ALREADY_USED` | 400 | Cannot reuse trial |
| `ALREADY_ON_PLAN` | 400 | Already subscribed to this plan |
| `PAYMENT_REQUIRED` | 402 | Payment needed to proceed |
| `ACCESS_DENIED` | 403 | Feature not available in current plan |
| `VALIDATION_ERROR` | 400 | Invalid request data |

---

## Testing the API

### Using cURL:

```bash
# 1. Get all plans (no auth needed)
curl -X GET http://localhost:8000/api/v1/accounts/subscriptions/plans/

# 2. Get my subscription (with auth)
curl -X GET http://localhost:8000/api/v1/accounts/subscriptions/my-subscription/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Upgrade to Basic Plan
curl -X POST http://localhost:8000/api/v1/accounts/subscriptions/upgrade/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_plan_id": "PLAN_UUID",
    "immediate": false
  }'

# 4. Check AI feature access
curl -X GET http://localhost:8000/api/v1/accounts/subscriptions/features/use_ai_features/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Next Steps

1. Run migrations: `python manage.py migrate accounts`
2. Seed plans: `python manage.py seed_subscription_plans`
3. Test endpoints using Postman or cURL
4. Integrate with frontend

---

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Status:**  Ready for Integration