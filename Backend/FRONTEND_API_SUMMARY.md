# RUMI Payment System - Frontend Ready!

## System Status: FULLY OPERATIONAL

### API Endpoints Available for Frontend

**Base URL**: `http://localhost:8000/api/v1/`

### Payment Endpoints

#### 1. Paystack Payment Initialization
```
POST /payments/initialize/
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request Body:
{
  "booking_id": 123,
  "payment_type": "initial" // or "late_fee"
}

Response:
{
  "transaction_id": 789,
  "transaction_reference": "RUMI-INITIAL-123-abc12345",
  "amount": 15000.0,
  "paystack_checkout_url": "https://checkout.paystack.com/...",
  "expires_at": "2025-12-19T14:30:00Z"
}
```

#### 2. M-Pesa STK Push Payment
```
POST /payments/mpesa/initialize/
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request Body:
{
  "booking_id": 123,
  "payment_method": "stk_push",
  "phone_number": "254712345678",
  "payment_type": "initial"
}

Response:
{
  "transaction_id": 789,
  "transaction_reference": "RUMI-INITIAL-123-abc12345",
  "amount": 15000.0,
  "payment_method": "mpesa",
  "mpesa_payment_type": "stk_push",
  "phone_number": "254712345678",
  "checkout_request_id": "ws_co_123456789",
  "merchant_request_id": "mr_123456789",
  "status": "pending_stk_push",
  "message": "STK push initiated. Please check your phone for payment prompt.",
  "c2b_alternative": {
    "note": "You can also pay via C2B offline using M-Pesa menu",
    "business_number": "174379",
    "amount": "15000",
    "reference": "RUMI-INITIAL-123-abc12345"
  }
}
```

#### 3. M-Pesa Payment Status Check
```
GET /payments/mpesa/status/?transaction_id=123
Authorization: Bearer <jwt_token>

Response:
{
  "transaction": { /* complete transaction object */ },
  "status": "success", // pending, success, failed
  "last_updated": "2025-12-19T13:30:00Z"
}
```

#### 4. Student Transaction History
```
GET /payments/transactions/student/?status=success&limit=20&offset=0
Authorization: Bearer <jwt_token>

Response:
{
  "total_transactions": 5,
  "transactions": [
    {
      "id": 123,
      "transaction_reference": "RUMI-INITIAL-...",
      "amount": 15000.0,
      "status": "success",
      "transaction_type": "initial",
      "paid_at": "2025-12-19T13:30:00Z",
      "payment_method": "mpesa"
    }
  ]
}
```

#### 5. Transaction Details
```
GET /payments/transactions/student/123/
Authorization: Bearer <jwt_token>

Response: Complete transaction object with all details
```

#### 6. Payment Receipt
```
GET /payments/receipts/123/
Authorization: Bearer <jwt_token>

Response: Complete receipt data with platform fees and compliance info
```

#### 7. Landlord M-Pesa Configuration
```
GET /payments/mpesa/config/
POST /payments/mpesa/config/
Authorization: Bearer <jwt_token>

POST Request Body:
{
  "payment_type": "send_money", // send_money, till_number, pochi, paybill
  "mpesa_number": "174379",
  "business_name": "My Business",
  "is_default": false
}
```

### Authentication Required

All payment endpoints require JWT authentication:

```javascript
// Login first
const loginResponse = await fetch('http://localhost:8000/api/v1/accounts/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});

const { access } = await loginResponse.json();

// Use token for all payment requests
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${access}`
};
```

### CORS Configuration

**Already configured for:**
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173` (Vite)
- `http://localhost:8080`
- `https://rumi.co.ke`

### M-Pesa Payment Flow

#### STK Push (Online)
1. User selects M-Pesa payment
2. Frontend calls `/payments/mpesa/initialize/`
3. STK push sent to user's phone
4. User enters M-Pesa PIN
5. Payment confirmed automatically

#### C2B (Offline)
1. User chooses offline payment
2. Frontend shows instructions:
   - Go to M-Pesa menu
   - Select Pay Bill/Buy Goods  
   - Enter business number: `174379`
   - Enter amount: Transaction amount
   - Enter reference: Transaction reference
3. Payment processes automatically via webhooks

### Documentation

- **Swagger UI**: http://localhost:8000/swagger/
- **Integration Guide**: `Backend/docs/FRONTEND_INTEGRATION_GUIDE.md`
- **API Schema**: http://localhost:8000/swagger.json

### Testing

**Run integration test:**
```bash
cd Backend
python3 test_frontend_integration.py
```

**Test with Postman or curl:**
```bash
# Test M-Pesa initialization
curl -X POST http://localhost:8000/api/v1/payments/mpesa/initialize/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"booking_id":1,"payment_method":"stk_push","phone_number":"254712345678"}'
```

### Ready for Frontend Integration!

**Your payment system is now fully operational with:**

**Paystack Integration** - For bank/card payments  
**M-Pesa STK Push** - For online M-Pesa payments  
**M-Pesa C2B** - For offline M-Pesa payments (automatic)  
**Complete Documentation** - Swagger + Integration guides  
**CORS Configured** - Ready for frontend calls  
**Authentication** - JWT token-based security  
**Transaction Tracking** - Full payment history  
**Receipt Generation** - Automated receipts  
**Webhook Processing** - Automatic payment confirmations  

**Frontend developers can now integrate immediately!**