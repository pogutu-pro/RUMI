# RUMI Payment Receipt API Guide

## Overview

The RUMI payment receipt system automatically generates and emails professional PDF receipts to students after successful payments. All receipts use the official RUMI brand color (#4CAF50) for consistent branding.

## API Endpoints

### 1. Get Payment Receipt

**Endpoint:** `GET /api/v1/payments/receipts/{transaction_id}/`

**Description:** Retrieve payment receipt for a specific transaction. If no receipt exists, it will be generated automatically.

**Authentication:** Required (JWT Token)

**Permissions:**

- Students can only access their own transaction receipts
- Admins/Super Admins can access all receipts
- Landlords can access receipts for their transactions

**Response Format:**

```json
{
  "id": 1,
  "receipt_number": "RUMI-20241217-ABC123",
  "pdf_file": "/media/receipts/pdf/receipt_RUMI-20241217-ABC123.pdf",
  "generated_at": "2024-12-17T12:00:00Z",
  "emailed_at": "2024-12-17T12:00:01Z",
  "email_sent": true,
  "transaction_details": {
    "transaction_reference": "RUMI-INITIAL-123-DEF456",
    "paystack_reference": "pay_ref_12345",
    "student": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "landlord": {
      "name": "Jane Smith",
      "email": "jane@landlord.com"
    },
    "booking": {
      "reference": "BOOK-2024-001",
      "hostel": "University Heights",
      "room": "A-101",
      "check_in_date": "2024-01-15",
      "check_out_date": "2024-12-31"
    },
    "payment_details": {
      "type": "initial",
      "base_rent": 15000.0,
      "service_fee": 300.0,
      "total_charged": 15300.0,
      "landlord_payout": 15000.0,
      "status": "success",
      "paid_at": "2024-12-17T12:00:00Z"
    },
    "platform_fees": {
      "service_fee": 300.0,
      "gateway_fee": 229.5,
      "net_revenue": 70.5
    }
  }
}
```

### 2. List Student Transactions

**Endpoint:** `GET /api/v1/payments/transactions/student/`

**Description:** List all transactions for the authenticated student with receipt information.

**Query Parameters:**

- `status` (optional): Filter by transaction status (pending, success, failed, refunded)
- `type` (optional): Filter by transaction type (initial, recurring, late_fee)
- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

### 3. Get Transaction Details

**Endpoint:** `GET /api/v1/payments/transactions/student/{transaction_id}/`

**Description:** Get detailed information about a specific transaction.

## Receipt Features

### PDF Receipt Content

- **Professional Layout** with RUMI branding (#4CAF50)
- **Student Information** (name, email)
- **Booking Details** (hostel, room, dates)
- **Payment Breakdown** (base rent, service fees, totals)
- **Transaction Reference** and payment status
- **Platform Information** (contact details)

### Email Delivery

- **Automatic sending** after successful payment
- **Branded HTML email** with RUMI colors
- **PDF attachment** with the receipt
- **Professional formatting** with key payment details

## Automatic Workflow

1. **Payment Success:** When a payment is confirmed via Paystack webhook
2. **Receipt Generation:** System automatically generates PDF receipt
3. **Email Delivery:** Receipt is emailed to student's registered email
4. **Storage:** Receipt is stored and can be retrieved via API

## Frontend Integration

### JavaScript/TypeScript Example

```javascript
// Get receipt for a transaction
const getReceipt = async (transactionId) => {
  const response = await fetch(`/api/v1/payments/receipts/${transactionId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const receipt = await response.json();
    console.log('Receipt:', receipt);

    // Download PDF receipt
    if (receipt.pdf_file) {
      window.open(receipt.pdf_file, '_blank');
    }
  }
};

// List student transactions
const getTransactions = async () => {
  const response = await fetch('/api/v1/payments/transactions/student/', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Transactions:', data.transactions);
  }
};
```

### React Example

```typescript
import React, { useState, useEffect } from 'react';

const ReceiptComponent = ({ transactionId }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/v1/payments/receipts/${transactionId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          setReceipt(data);
        }
      } catch (error) {
        console.error('Error fetching receipt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [transactionId]);

  if (loading) return <div>Loading receipt...</div>;
  if (!receipt) return <div>Receipt not found</div>;

  return (
    <div className="receipt-container">
      <h2>Payment Receipt</h2>
      <p><strong>Receipt Number:</strong> {receipt.receipt_number}</p>
      <p><strong>Amount:</strong> KES {receipt.transaction_details.payment_details.total_charged}</p>
      <p><strong>Date:</strong> {receipt.transaction_details.payment_details.paid_at}</p>

      {receipt.pdf_file && (
        <a
          href={receipt.pdf_file}
          target="_blank"
          rel="noopener noreferrer"
          className="download-btn"
        >
          Download PDF Receipt
        </a>
      )}

      {receipt.email_sent && (
        <p className="email-status">
           Receipt emailed to {receipt.transaction_details.student.email}
        </p>
      )}
    </div>
  );
};
```

## Important Notes

1. **Authentication Required:** All endpoints require valid JWT authentication
2. **PDF Storage:** Receipts are stored in Django media directory
3. **Automatic Generation:** Receipts are generated automatically on payment success
4. **Email Delivery:** Students receive receipts via email automatically
5. **Brand Consistency:** All receipts use RUMI's official brand color (#4CAF50)
6. **Security:** Students can only access their own receipts
7. **Performance:** Receipts are cached after generation to avoid regeneration

## Related Endpoints

- **Payment Initialization:** `POST /api/v1/payments/initialize/`
- **Webhook Handler:** `POST /api/v1/payments/webhook/paystack/`
- **Student Transactions:** `GET /api/v1/payments/transactions/student/`
- **Admin Transactions:** `GET /api/v1/payments/transactions/admin/`

## Support

For technical support or questions about the receipt system:

- **Email:** support@rumi.co.ke
- **API Documentation:** Available at `/swagger/` when running the application
- **Frontend Integration:** Check the frontend documentation for implementation examples
