# Troubleshooting: Data Not Visible in Frontend

## Issue: Test data exists in database but not visible in frontend

The database has been successfully seeded with 29 users, 5 hostels, 133 rooms, 9 bookings, 9 transactions, 9 receipts, and 20 notifications. However, if you're not seeing this data in your frontend, here are the steps to troubleshoot:

## 1. Verify Django Server is Running

Make sure your Django backend server is running:

```bash
cd Backend
source venv/bin/activate
python manage.py runserver 8000
```

The server should show:
```
Starting development server at http://127.0.0.1:8000/
```

## 2. Test API Endpoints Manually

Open a new terminal and test if the API is responding:

```bash
# Test user endpoint
curl http://localhost:8000/api/accounts/users/

# Test hostels endpoint  
curl http://localhost:8000/api/hostels/hostels/

# Test bookings endpoint
curl http://localhost:8000/api/hostels/bookings/
```

You should see JSON responses with the test data.

## 3. Check Frontend API Configuration

Verify your frontend is pointing to the correct API base URL:

```javascript
// Check your frontend .env file or config
NEXT_PUBLIC_API_URL=http://localhost:8000/api
// or
REACT_APP_API_URL=http://localhost:8000/api
```

## 4. Test Authentication

Get an auth token and test protected endpoints:

```bash
# Login as admin to get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rumi.co.ke","password":"admin123"}'

# Use the token to access protected data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/hostels/hostels/
```

## 5. Check Browser Network Tab

1. Open your frontend in browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Refresh the page
5. Look for API calls - are they being made?
6. Check for any 404, 500, or CORS errors

## 6. Verify CORS Configuration

Check your Django CORS settings in `rumi/settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Your frontend URL
    "http://127.0.0.1:3000",
]

# For development, you can also use:
CORS_ALLOW_ALL_ORIGINS = True
```

## 7. Clear Browser Cache

Sometimes the frontend caches old data:

1. Open Developer Tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## 8. Check Django Logs

Look at your Django logs for any errors:

```bash
cd Backend
tail -f logs/django.log
```

## 9. Test Database Connection

Verify the frontend can connect to the database:

```bash
cd Backend
python manage.py shell
```

Then run:
```python
from hostels.models import Hostel
print(f"Hostels in DB: {Hostel.objects.count()}")
```

## 10. Common Issues and Solutions

### Issue: "No data" in UI
- **Cause**: Frontend not fetching from correct API endpoints
- **Solution**: Check API URL configuration and network requests

### Issue: "Authentication required" errors
- **Cause**: Frontend not sending auth tokens
- **Solution**: Implement proper authentication flow in frontend

### Issue: CORS errors in browser
- **Cause**: Django CORS not configured for frontend domain
- **Solution**: Add frontend URL to CORS_ALLOWED_ORIGINS

### Issue: 404 errors on API calls
- **Cause**: Wrong URL patterns or API endpoints not registered
- **Solution**: Check Django URL configuration and API endpoint URLs

## 11. Quick Verification Commands

Run these to verify everything is working:

```bash
# Check server is running
curl -I http://localhost:8000/

# Check users API
curl http://localhost:8000/api/accounts/users/

# Check hostels API
curl http://localhost:8000/api/hostels/hostels/

# Check if data exists
cd Backend && python manage.py shell -c "
from hostels.models import Hostel
print(f'Hostels in database: {Hostel.objects.count()}')
"
```

## 12. Sample API Responses

If working correctly, you should see responses like:

**Users API:**
```json
{
  "count": 29,
  "results": [
    {
      "email": "admin@rumi.co.ke",
      "role": "super_admin",
      "first_name": "System",
      "last_name": "Administrator"
    },
    {
      "email": "student1@example.com", 
      "role": "student",
      "first_name": "Student",
      "last_name": "1"
    }
  ]
}
```

**Hostels API:**
```json
{
  "count": 5,
  "results": [
    {
      "name": "University Hostel 1",
      "city": "Nairobi",
      "total_rooms": 27,
      "available_rooms": 12,
      "base_price": "12000.00"
    }
  ]
}
```

If you're still not seeing data after these steps, please share:
1. What you see in the browser Network tab
2. Any error messages from Django logs
3. Your frontend API configuration
4. Any CORS or authentication errors

This will help identify the specific issue preventing data from being visible in your frontend.