# INTEGRATIONS.md — External Integrations

## Payments
### M-Pesa (Safaricom Daraja API)
- **Type**: STK Push (customer-initiated) + C2B webhooks (paybill)
- **Files**: `Backend/payments/mpesa_api.py`
- **Webhooks**: Handled in payments views
- **Notes**: Primary payment method for Kenyan market

### Paystack
- **Type**: Payments, subaccounts, webhooks
- **Package**: `paystackapi==2.1.3`
- **Webhook URL**: `/api/v1/payments/webhook/paystack/`
- **Notes**: Secondary payment provider

## Communications
### SMS — Africa's Talking / kenyastalking
- **Type**: Outbound SMS notifications
- **Files**: `Backend/notifications/tasks.py`
- **Notes**: Used for rent reminders, receipts, alerts

### Email — Mailtrap (SMTP)
- **Type**: Transactional email
- **Config**: Django email backend (SMTP settings in env)

## Authentication
### Google OAuth
- **Package**: `@react-oauth/google` (frontend)
- **Type**: Social login

## Maps
### Google Maps
- **Package**: `@googlemaps/js-api-loader`
- **Type**: Location display (hostel locations)

## Monitoring & Observability
### Sentry
- **Type**: Error monitoring
- **Notes**: Production only

### Prometheus
- **Type**: Metrics collection

### Flower
- **Type**: Celery task monitoring dashboard

## Storage
### AWS S3
- **Packages**: `boto3`, `django-storages`
- **Status**: Configured in requirements but not yet fully wired in settings
- **Intended use**: Media file storage

## Weather
### OpenWeatherMap / WeatherAPI
- **Type**: Weather data
- **Status**: API keys configured in settings

## Real-time
### Django Channels + Redis
- **Type**: WebSocket connections
- **Channel layer**: Redis-backed
- **Use**: Real-time notifications, live updates
