# Remember Me Feature - Current Status

## Overview

The login page includes a "Remember Me" checkbox in the UI, but it is **currently non-functional**. The checkbox value is captured by the frontend form but is not processed by the backend authentication system.

## Current Implementation

### Frontend ✅ (Partially Implemented)

**File**: [`frontend/src/components/auth/login-form.tsx`](frontend/src/components/auth/login-form.tsx)

- The checkbox is rendered in the UI (lines 171-178)
- Form captures the `rememberMe` boolean value
- Default value is `false`
- Value is included in the LoginFormData type

```tsx
<label className="flex items-center space-x-2 text-sm">
  <input
    type="checkbox"
    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    {...register('rememberMe')}
  />
  <span className="text-gray-600">Remember me</span>
</label>
```

### Backend ❌ (Not Implemented)

**File**: [`Backend/accounts/serializers.py`](Backend/accounts/serializers.py)

The `UserLoginSerializer` only accepts `email` and `password`:

```python
class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # ❌ No remember_me field
```

**File**: [`Backend/accounts/views.py`](Backend/accounts/views.py)

The `UserLoginView.post()` method:
- Does not extract or process any `remember_me` parameter
- Always generates JWT tokens with the same expiration time
- No logic to differentiate between "remember me" checked vs unchecked

```python
# Current implementation always uses default token expiration
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
refresh_token = str(refresh)
```

## Current Behavior

**What happens when users check "Remember Me":**
- ✅ Checkbox can be toggled in the UI
- ✅ Value is captured in the form state
- ❌ Value is sent to backend but **ignored**
- ❌ JWT tokens have the **same expiration** regardless of checkbox state
- ❌ No difference in session persistence

**Result**: The checkbox has no effect on authentication behavior.

## What Would Be Needed to Make It Work

To implement a functional "Remember Me" feature, the following changes would be required:

### 1. Backend Serializer Update

Add `remember_me` field to accept the checkbox value:

```python
# In Backend/accounts/serializers.py
class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)
```

### 2. Backend View Update

Modify login view to set different token expiration times:

```python
# In Backend/accounts/views.py, UserLoginView.post()

remember_me = serializer.validated_data.get('remember_me', False)
refresh = RefreshToken.for_user(user)

if remember_me:
    # Extended session - 30 days
    from datetime import timedelta
    refresh.set_exp(lifetime=timedelta(days=30))
    refresh.access_token.set_exp(lifetime=timedelta(hours=24))
else:
    # Use default expiration (7 days refresh, 1 hour access)
    pass
```

### 3. Expected Behavior After Implementation

| Remember Me | Access Token Lifetime | Refresh Token Lifetime |
|-------------|----------------------|------------------------|
| ❌ Unchecked | 1 hour | 7 days |
| ✅ Checked | 24 hours | 30 days |

## Testing Current State

To verify the checkbox is non-functional:

1. Open browser DevTools → Network tab
2. Navigate to `http://localhost:3000/login`
3. Enter credentials and **check** "Remember Me"
4. Submit the form
5. Inspect the login request payload - it includes `rememberMe: true`
6. Inspect the response - token expiration is the same as when unchecked
7. Check token expiration by decoding the JWT:

```javascript
// Browser console
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
```

## Notes

- JWT tokens are stored in browser localStorage (not cookies)
- Token refresh mechanism is already implemented
- Frontend requires no changes - already sending the correct data
- Only backend needs updates to process the `remember_me` parameter

## Related Files

- [`frontend/src/components/auth/login-form.tsx`](frontend/src/components/auth/login-form.tsx) - Login form with checkbox
- [`frontend/src/lib/api/auth.ts`](frontend/src/lib/api/auth.ts) - API client (sends rememberMe)
- [`frontend/src/lib/validations/auth.schema.ts`](frontend/src/lib/validations/auth.schema.ts) - Form validation schema
- [`Backend/accounts/serializers.py`](Backend/accounts/serializers.py) - Login serializer
- [`Backend/accounts/views.py`](Backend/accounts/views.py) - Login view (lines 283-396)
