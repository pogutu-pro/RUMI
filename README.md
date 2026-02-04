# RUMI - Student Accommodation Platform

## Overview
RUMI is a comprehensive student accommodation management platform that connects students with hostel owners, streamlining the entire rental process from discovery to payment management.

## Architecture

### Technology Stack
- **Backend**: Django 4.2.11 with Django REST Framework
- **Frontend**: Next.js 16 with React 19 and TypeScript
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Authentication**: JWT-based with role-based access control
- **Real-time**: WebSocket support via Django Channels
- **Caching**: Redis for sessions and performance optimization
- **Async Processing**: Celery for background tasks
- **Payment Processing**: M-Pesa and Paystack integrations
- **Monitoring**: Prometheus metrics and comprehensive logging

### System Components
- **Multi-role User Management**: Students, Landlords, Caretakers, Tech Support, Admins
- **Property Management**: Hostel listings, room management, occupancy tracking
- **Payment System**: Recurring rent payments, wallet management, automated processing
- **Communication**: Real-time messaging, notifications
- **Analytics**: Revenue tracking, occupancy metrics, tax reporting

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Redis server
- PostgreSQL (for production)

### Backend Setup
```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Start Background Services
```bash
# Start Redis (if not running)
redis-server

# Start Celery worker
celery -A rumi worker --loglevel=info

# Start Celery beat scheduler
celery -A rumi beat --loglevel=info
```

## Project Structure

```
RUMI/
├── Backend/                 # Django backend application
│   ├── accounts/           # User management & authentication
│   ├── hostels/            # Property & room management
│   ├── payments/           # Payment processing & financial management
│   ├── notifications/     # Messaging & notifications
│   ├── analytics/          # Reporting & analytics
│   └── rumi/              # Django project configuration
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-specific components
│   │   └── lib/           # Utilities and configurations
│   └── public/            # Static assets
└── README.md               # This file
```

## Configuration

### Environment Variables

#### Backend (.env)
```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=rumi
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Payment Gateways
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=your_mpesa_shortcode

PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/

# Payment Gateways
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test payments
python manage.py test hostels
python manage.py test accounts

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Key Features

### For Students
- **Property Discovery**: Search and filter hostels by location, price, amenities
- **Room Booking**: Online booking with secure payment processing
- **Payment Management**: Recurring rent payments, wallet credits, payment history
- **Communication**: Direct messaging with landlords and caretakers
- **Profile Management**: Personal information, booking history, preferences

### For Landlords
- **Property Management**: List hostels, manage rooms, track occupancy
- **Tenant Management**: View bookings, communicate with students
- **Financial Management**: Rent collection, payout processing, tax reporting
- **Analytics**: Revenue tracking, occupancy metrics, performance insights
- **Maintenance**: Track room maintenance requests and schedules

### For Administrators
- **User Management**: Manage all user accounts and permissions
- **System Monitoring**: Track system performance, error logs
- **Financial Oversight**: Monitor transactions, generate reports
- **Content Management**: Manage platform content and settings

## Security Features

- **Authentication**: JWT-based authentication with role-based access control
- **Payment Security**: PCI-compliant payment processing with webhook validation
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **Audit Logging**: Comprehensive audit trail for all user actions
- **Input Validation**: Server-side validation for all user inputs
- **Rate Limiting**: API rate limiting to prevent abuse

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health check
curl http://localhost:8000/api/health/

# Database connectivity
python manage.py check --database default

# Redis connectivity
python manage.py check --cache
```

### Logs
```bash
# Application logs
tail -f logs/django.log

# Payment processing logs
tail -f logs/payments.log

# Celery task logs
tail -f logs/celery.log
```

### Performance Monitoring
- **Prometheus Metrics**: Available at `/metrics` endpoint
- **Health Checks**: Available at `/api/health/`
- **Error Tracking**: Comprehensive error logging and alerting

## Deployment

### Production Deployment
1. **Database Setup**: Configure PostgreSQL database
2. **Environment Configuration**: Set production environment variables
3. **Static Files**: Configure static file serving (AWS S3 recommended)
4. **SSL/TLS**: Configure HTTPS certificates
5. **Monitoring**: Set up monitoring and alerting
6. **Backup**: Configure regular database backups

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- **Email**: support@rumi.co.ke
- **Documentation**: Check the `/docs` directory for detailed documentation
- **Issues**: Report bugs and feature requests on GitHub Issues

---

**Version**: 2.0  
**Last Updated**: February 2026  
**Status**: Production Ready
