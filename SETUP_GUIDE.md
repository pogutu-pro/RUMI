# RUMI Platform v2.0 - Setup & Deployment Guide

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (or SQLite for development)
- Redis 6+
- Google Cloud Console account (for OAuth)

---

## Backend Setup

### 1. Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Additional packages for new features
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

### 2. Environment Configuration

Create `.env` file in project root:

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://user:password@localhost:5432/rumi_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800

# Google OAuth (REQUIRED - Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Email (Mailtrap for development)
MAILTRAP_USERNAME=your-mailtrap-username
MAILTRAP_PASSWORD=your-mailtrap-password

# SMS (Africa's Talking)
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=rumi

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx

# Subscription Settings
SUBSCRIPTION_TRIAL_DAYS=30
BASIC_PLAN_PRICE=10000.00
MEDIUM_PLAN_PERCENTAGE=1.00
ADVANCED_PLAN_PRICE=9999.00
```

### 3. Database Setup

```bash
# Run migrations
python manage.py migrate

# Seed subscription plans
python manage.py seed_subscription_plans

# Create superuser
python manage.py createsuperuser

# (Optional) Seed test data
python manage.py seed_users
```

### 4. Start Backend Server

```bash
# Development server
python manage.py runserver

# With Celery (for async tasks)
celery -A rumi worker -l info

# Celery beat (for scheduled tasks)
celery -A rumi beat -l info
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend

# Install packages
npm install

# Install new dependencies
npm install jwt-decode react-icons lucide-react
```

### 2. Environment Configuration

Create `frontend/.env`:

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxx
```

### 3. Add Images

Place your custom images in `frontend/public/images/`:

**Required Images:**
- `carousel-1.jpg` - Homepage carousel image 1
- `carousel-2.jpg` - Homepage carousel image 2  
- `carousel-3.jpg` - Homepage carousel image 3
- `login-bg.jpg` - Login page background
- `register-bg.jpg` - Register page background
- `student-hero.jpg` - Student section image
- `landlord-hero.jpg` - Landlord section image

**Recommended Dimensions:**
- Carousel: 1920x800px
- Backgrounds: 1200x1600px (vertical)
- Hero images: 800x600px

### 4. Start Frontend Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Google Cloud Console Setup

### Step-by-Step OAuth Configuration

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Create new project or select existing

2. **Enable APIs**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: External
   - App name: `RUMI Platform`
   - User support email: `support@rumi.co.ke`
   - Developer contact: `dev@rumi.co.ke`
   - Scopes: Add `email`, `profile`, `openid`
   - Test users: Add your email for testing

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: `Web application`
   - Name: `RUMI Web Client`
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/google/callback
     https://rumi.co.ke/auth/google/callback
     ```
   - Click "Create"
   - Copy Client ID and Client Secret

5. **Update Environment Variables**
   ```bash
   # Backend (.env)
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx

   # Frontend (frontend/.env)
   VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

---

## Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Test specific app
python manage.py test accounts

# Test with coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Deployment

### Production Checklist

#### Backend
- [ ] Set `DEBUG=False`
- [ ] Configure production database (PostgreSQL)
- [ ] Set up Redis for production
- [ ] Configure Celery workers
- [ ] Set strong `SECRET_KEY`
- [ ] Configure HTTPS
- [ ] Set up Sentry for error tracking
- [ ] Configure static files serving
- [ ] Set up database backups
- [ ] Update `ALLOWED_HOSTS`

#### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Configure CDN for images
- [ ] Set production `VITE_API_BASE_URL`
- [ ] Update Google OAuth redirect URIs
- [ ] Enable error tracking
- [ ] Optimize images
- [ ] Configure caching

#### Google OAuth Production
- [ ] Update authorized redirect URIs
- [ ] Verify app in OAuth consent screen
- [ ] Remove test users restriction
- [ ] Monitor OAuth quota usage

---

## Database Migrations

### Creating New Migrations

```bash
# After model changes
python manage.py makemigrations

# Review migration file
cat accounts/migrations/0004_add_subscriptions.py

# Apply migration
python manage.py migrate

# Rollback if needed
python manage.py migrate accounts 0003
```

### Current Migrations

1. `0001_initial.py` - Base user model
2. `0002_initial.py` - Profile models
3. `0003_make_student_profile_fields_optional.py` - Student profile updates
4. `0004_add_subscriptions.py` - **NEW: Subscription system**

---

## API Testing

### Using Postman

**Collection:** Import `postman_collection.json`

**Environment Variables:**
```json
{
  "base_url": "http://localhost:8000/api/v1",
  "access_token": "{{access_token}}",
  "refresh_token": "{{refresh_token}}"
}
```

### Key Endpoints to Test

1. **Register:** `POST /accounts/register/`
2. **Login:** `POST /accounts/login/`
3. **Google OAuth:** `POST /accounts/auth/google/`
4. **Get Plans:** `GET /accounts/subscriptions/plans/`
5. **My Subscription:** `GET /accounts/subscriptions/my-subscription/`
6. **Upgrade Plan:** `POST /accounts/subscriptions/upgrade/`

---

## Troubleshooting

### Common Issues

**Issue: Google OAuth not working**
```bash
# Check environment variables
echo $GOOGLE_CLIENT_ID

# Verify redirect URI matches exactly
# Check browser console for errors
```

**Issue: Subscription not created**
```bash
# Check if signal is registered
python manage.py shell
>>> from accounts.models import LandlordProfile
>>> from accounts.subscription_models import LandlordSubscription
>>> LandlordSubscription.objects.all()
```

**Issue: Frontend can't connect to backend**
```bash
# Check CORS settings in settings.py
# Verify VITE_API_BASE_URL in frontend/.env
# Check if backend is running: curl http://localhost:8000/api/v1/accounts/subscriptions/plans/
```

**Issue: Missing images**
```bash
# Ensure images are in frontend/public/images/
ls frontend/public/images/

# Create placeholders if needed
```

---

## Feature Flags

Enable/disable features via environment variables:

```bash
# .env
GOOGLE_OAUTH_ENABLED=true
SUBSCRIPTIONS_ENABLED=true
AI_FEATURES_ENABLED=false  # Coming soon
```

---

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health/

# Database connection
python manage.py dbshell

# Redis connection
redis-cli ping

# Celery workers
celery -A rumi inspect active
```

### Logs

```bash
# Django logs
tail -f logs/django.log

# Celery logs
tail -f logs/celery.log

# Error tracking (Sentry)
# Check Sentry dashboard
```

---

## Next Steps After Setup

1. Run backend migrations
2. Seed subscription plans
3. Configure Google OAuth credentials
4. Add custom images to frontend
5. Test registration flow
6. Test Google OAuth flow
7. Test subscription upgrade/downgrade
8. Deploy to staging environment
9. User acceptance testing
10. Production deployment

---

## Support

**Documentation:**
- API Reference: `/Docs/API_REFERENCE_SUBSCRIPTIONS.md`
- Technical Specs: `/Docs/Technical_Specs/Accounts.md`

**Contact:**
- Email: dev@rumi.co.ke
- Slack: #rumi-dev

---

**Last Updated:** November 21, 2025  
**Version:** 2.0  
**Status:** Ready for Testing