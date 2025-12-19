# Frontend Integration Guide for RUMI Payment System

## API Base URLs

### Development Environment:
- **Backend API**: `http://localhost:8000/api/v1/`
- **Frontend**: `http://localhost:3000` or `http://localhost:3001`
- **Swagger Documentation**: `http://localhost:8000/swagger/`

### Production Environment:
- **Backend API**: `https://api.rumi.co.ke/api/v1/`
- **Frontend**: `https://rumi.co.ke`

## Authentication

### JWT Token Authentication
All payment endpoints require authentication. Use JWT tokens:

```javascript
// Login to get tokens
const loginResponse = await fetch('http://localhost:8000/api/v1/accounts/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const tokens = await loginResponse.json();
// Store access_token and refresh_token
localStorage.setItem('access_token', tokens.access);
localStorage.setItem('refresh_token', tokens.refresh);

// Use token in subsequent requests
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
};
```

## Payment Endpoints

### 1. Initialize Paystack Payment
```javascript
const initiatePaystackPayment = async (bookingId, paymentType = 'initial') => {
  const response = await fetch('http://localhost:8000/api/v1/payments/initialize/', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      booking_id: bookingId,
      payment_type: paymentType
    })
  });
  
  const result = await response.json();
  return result;
  // Returns: { checkout_url, transaction_reference, amount, expires_at }
};
```

### 2. Initialize M-Pesa STK Push Payment
```javascript
const initiateMpesaPayment = async (bookingId, phoneNumber, paymentType = 'initial') => {
  const response = await fetch('http://localhost:8000/api/v1/payments/mpesa/initialize/', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      booking_id: bookingId,
      payment_method: 'stk_push',
      phone_number: phoneNumber, // Format: 254XXXXXXXXX
      payment_type: paymentType
    })
  });
  
  const result = await response.json();
  return result;
  // Returns: { checkout_request_id, merchant_request_id, status, message, c2b_alternative }
};
```

### 3. Check M-Pesa Payment Status
```javascript
const checkMpesaPaymentStatus = async (transactionId, checkoutRequestId) => {
  const params = new URLSearchParams();
  if (transactionId) params.append('transaction_id', transactionId);
  if (checkoutRequestId) params.append('checkout_request_id', checkoutRequestId);
  
  const response = await fetch(`http://localhost:8000/api/v1/payments/mpesa/status/?${params}`, {
    method: 'GET',
    headers: authHeaders
  });
  
  const result = await response.json();
  return result;
  // Returns: { transaction, status, last_updated }
};
```

### 4. Get Student Transaction History
```javascript
const getStudentTransactions = async (status, type, limit = 20, offset = 0) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  params.append('limit', limit);
  params.append('offset', offset);
  
  const response = await fetch(`http://localhost:8000/api/v1/payments/transactions/student/?${params}`, {
    method: 'GET',
    headers: authHeaders
  });
  
  const result = await response.json();
  return result;
  // Returns: { total_transactions, transactions: [...] }
};
```

### 5. Get Transaction Details
```javascript
const getTransactionDetails = async (transactionId) => {
  const response = await fetch(`http://localhost:8000/api/v1/payments/transactions/student/${transactionId}/`, {
    method: 'GET',
    headers: authHeaders
  });
  
  const result = await response.json();
  return result;
  // Returns complete transaction object
};
```

### 6. Get Payment Receipt
```javascript
const getPaymentReceipt = async (transactionId) => {
  const response = await fetch(`http://localhost:8000/api/v1/payments/receipts/${transactionId}/`, {
    method: 'GET',
    headers: authHeaders
  });
  
  const result = await response.json();
  return result;
  // Returns receipt data
};
```

### 7. Landlord M-Pesa Configuration
```javascript
const getLandlordMpesaConfig = async () => {
  const response = await fetch('http://localhost:8000/api/v1/payments/mpesa/config/', {
    method: 'GET',
    headers: authHeaders
  });
  
  const result = await response.json();
  return result;
  // Returns: { configs: [...] }
};

const addMpesaConfig = async (paymentType, mpesaNumber, businessName, isDefault = false) => {
  const response = await fetch('http://localhost:8000/api/v1/payments/mpesa/config/', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      payment_type: paymentType, // 'send_money', 'till_number', 'pochi', 'paybill'
      mpesa_number: mpesaNumber,
      business_name: businessName,
      is_default: isDefault
    })
  });
  
  const result = await response.json();
  return result;
};
```

## M-Pesa Payment Flow

### STK Push Flow (Online)
1. User selects M-Pesa payment method
2. Frontend calls `mpesa/initialize/` with phone number
3. Backend sends STK push to user's phone
4. User enters M-Pesa PIN on phone
5. Payment confirmed via webhook
6. Booking status updated automatically

### C2B Flow (Offline)
1. User chooses to pay via M-Pesa menu
2. Frontend shows instructions:
   - Go to M-Pesa menu
   - Select Pay Bill/Buy Goods
   - Enter business number: `174379` (platform shortcode)
   - Enter amount: Transaction amount
   - Enter reference: Transaction reference
3. Payment processes automatically via webhooks
4. No frontend polling required

## Payment Status Handling

### Real-time Updates
```javascript
const pollPaymentStatus = async (transactionId, checkoutRequestId, maxAttempts = 30) => {
  let attempts = 0;
  
  const poll = async () => {
    attempts++;
    const status = await checkMpesaPaymentStatus(transactionId, checkoutRequestId);
    
    if (status.status === 'success') {
      console.log('Payment successful!');
      return status;
    } else if (status.status === 'failed') {
      console.log('Payment failed!');
      return status;
    } else if (attempts < maxAttempts) {
      // Continue polling after 2 seconds
      setTimeout(poll, 2000);
    } else {
      console.log('Payment timeout!');
      return status;
    }
  };
  
  return await poll();
};
```

## Complete Payment Integration Example

```javascript
class RUMIPaymentService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/v1';
    this.authHeaders = this.getAuthHeaders();
  }
  
  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  
  async makePayment(bookingId, paymentMethod, options = {}) {
    switch (paymentMethod) {
      case 'paystack':
        return await this.initiatePaystackPayment(bookingId, options.paymentType);
      
      case 'mpesa':
        return await this.initiateMpesaPayment(
          bookingId, 
          options.phoneNumber, 
          options.paymentType
        );
      
      default:
        throw new Error('Unsupported payment method');
    }
  }
  
  async initiatePaystackPayment(bookingId, paymentType = 'initial') {
    const response = await fetch(`${this.baseURL}/payments/initialize/`, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({
        booking_id: bookingId,
        payment_type: paymentType
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate payment');
    }
    
    return await response.json();
  }
  
  async initiateMpesaPayment(bookingId, phoneNumber, paymentType = 'initial') {
    const response = await fetch(`${this.baseURL}/payments/mpesa/initialize/`, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({
        booking_id: bookingId,
        payment_method: 'stk_push',
        phone_number: phoneNumber,
        payment_type: paymentType
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate M-Pesa payment');
    }
    
    return await response.json();
  }
  
  async checkMpesaStatus(transactionId, checkoutRequestId) {
    const params = new URLSearchParams();
    if (transactionId) params.append('transaction_id', transactionId);
    if (checkoutRequestId) params.append('checkout_request_id', checkoutRequestId);
    
    const response = await fetch(`${this.baseURL}/payments/mpesa/status/?${params}`, {
      method: 'GET',
      headers: this.authHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }
    
    return await response.json();
  }
  
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await fetch(`${this.baseURL}/payments/transactions/student/?${params}`, {
      method: 'GET',
      headers: this.authHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to get transactions');
    }
    
    return await response.json();
  }
}

// Usage Example
const paymentService = new RUMIPaymentService();

// Pay with M-Pesa
const mpesaResult = await paymentService.makePayment(123, 'mpesa', {
  phoneNumber: '254712345678',
  paymentType: 'initial'
});

console.log('STK Push sent:', mpesaResult.checkout_request_id);

// Poll for status
const status = await paymentService.checkMpesaStatus(null, mpesaResult.checkout_request_id);
```

## Error Handling

```javascript
const handlePaymentError = (error) => {
  console.error('Payment error:', error);
  
  switch (error.message) {
    case 'Authentication required':
      // Redirect to login
      window.location.href = '/login';
      break;
    
    case 'Booking not found':
      // Show error message
      alert('Booking not found. Please check your booking ID.');
      break;
    
    case 'Payment already completed':
      // Redirect to booking details
      alert('This booking has already been paid for.');
      break;
    
    default:
      // Generic error handling
      alert('Payment failed. Please try again.');
  }
};
```

## Testing the Integration

1. **Start the backend**: `cd Backend && python3 manage.py runserver 0.0.0.0:8000`
2. **Access Swagger**: http://localhost:8000/swagger/
3. **Test authentication**: Use the `/accounts/auth/login/` endpoint
4. **Test payments**: Use the payment endpoints with valid JWT tokens
5. **Check transactions**: View transaction history and details

## Support

For integration issues:
- Check the Swagger documentation: http://localhost:8000/swagger/
- Review server logs for detailed error messages
- Ensure JWT tokens are properly included in requests
- Verify CORS settings for frontend domain