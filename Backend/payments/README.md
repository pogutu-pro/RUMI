# RUMI Payment System

## Overview
The `payments` application handles all financial transactions within the RUMI platform, providing seamless payment processing between Students, Landlords, and External Payment Gateways (M-Pesa, Paystack).

## Current Status
The payment system is fully functional with recurring payment support enabled.

## Core Features

### 1. Payment Gateway Integrations
- **M-Pesa Integration (Daraja API)**
  - STK Push for dynamic payment prompts
  - C2B (Customer to Business) for Paybill/Till payments
  - Complete webhook handling for payment confirmations
- **Paystack Integration**
  - Card/Bank payment processing
  - Tokenized payment methods for recurring billing

### 2. Automated Financial Management
- **RentPeriod System**: Monthly rent obligation tracking
- **StudentPaymentTracker**: Wallet/credit management for overpayments
- **Automated Tasks** (Celery):
  - `process_recurring_payments`: Daily recurring payment processing
  - `assess_late_fees`: Automated late fee application
  - `generate_monthly_tax_reports`: Monthly tax reporting

### 3. Transaction Processing
- **Multi-payment support**: Students can make multiple payments per booking
- **Payment Types**: Rent, security deposits, late fees, wallet credits
- **Status Tracking**: Pending, processing, success, failed states
- **Audit Trail**: Complete transaction history with metadata

## Data Architecture

### Core Models

| Model | Purpose | Key Features |
|-------|---------|--------------|
| **Transaction** | Central payment record | Multiple payments per booking, gateway integration |
| **RentPeriod** | Monthly rent obligations | Due date tracking, status management, payment allocation |
| **StudentPaymentTracker** | Student wallet/credits | Overpayment management, credit balance tracking |
| **MpesaPaymentConfig** | Landlord payment settings | Paybill/Till configuration per property |
| **RecurringPayment** | Automated payment schedules | Next payment dates, failure handling |
| **Payout** | Landlord settlement records | Automated payout calculation and tracking |

## Business Logic Flow

### 1. Booking Activation
```
Booking confirmed → LifecycleService.activate_tenancy() → RentPeriods created (monthly)
```

### 2. Payment Processing
```
Payment received → process_confirmed_payment() → Transaction created → RentPeriod updated → Booking amounts synchronized
```

### 3. Recurring Payments
```
Celery task → RecurringPayment.charge() → Transaction created → RentPeriod updated
```

## API Endpoints

### Payment Processing
- `POST /api/v1/payments/initialize/` - Initialize payment
- `POST /api/v1/payments/mpesa/stk-push/` - M-Pesa STK Push
- `POST /api/v1/payments/webhooks/mpesa/` - M-Pesa webhook handler

### Payment History
- `GET /api/v1/payments/transactions/` - User transaction history
- `GET /api/v1/payments/rent-periods/` - Rent period details
- `GET /api/v1/payments/student-wallet/` - Wallet balance and credits

### Management
- `GET /api/v1/payments/payouts/` - Landlord payout records
- `GET /api/v1/payments/tax-reports/` - Tax reporting data

## Configuration

### Environment Variables
```bash
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode

# Paystack Configuration
PAYSTACK_SECRET_KEY=your_secret_key
PAYSTACK_PUBLIC_KEY=your_public_key

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
```

## Testing

### Run Payment Tests
```bash
# Run all payment tests
python manage.py test payments.tests_v2

# Run specific test
python manage.py test payments.tests_v2.lifecycleTests
```

### Test Coverage
- LifecycleService tenancy activation
- Initial booking deposit processing
- Recurring rent payment processing
- RentPeriod creation and management
- Payment synchronization

## Management Commands

### Backfill RentPeriods
```bash
# Create missing RentPeriods for existing confirmed bookings
python manage.py backfill_rent_periods --dry-run  # Preview changes
python manage.py backfill_rent_periods              # Execute backfill
```

## Monitoring & Maintenance

### Celery Tasks
```bash
# Check active Celery tasks
celery -A rumi inspect active

# View scheduled tasks
celery -A rumi beat
```

### Payment Health Checks
```bash
# Check payment gateway status
python manage.py check --deploy
```

## Security Considerations

- **Webhook Validation**: All incoming webhooks are validated
- **Idempotency**: Payment processing prevents duplicate transactions
- **Encryption**: Sensitive payment data encrypted at rest
- **Audit Logging**: Complete audit trail for all financial transactions

## Troubleshooting

### Common Issues
1. **Payment Not Reflecting**: Check Transaction status and RentPeriod updates
2. **Recurring Payments Failing**: Verify RecurringPayment schedule and payment methods
3. **Webhook Issues**: Check M-Pesa/Paystack webhook URLs and validation

### Logs
```bash
# Payment processing logs
tail -f logs/payments.log

# Celery task logs
tail -f logs/celery.log
```

## Recent Updates

### v2.0 - Recurring Payment Enhancement
- Fixed OneToOne constraint for multiple payments per booking
- Implemented RentPeriod-based monthly tracking
- Added StudentPaymentTracker for wallet management
- Enhanced payment synchronization and audit trails
- Added comprehensive test coverage

---

*Last Updated: February 2026*
