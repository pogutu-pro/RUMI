# Authentication Architecture & Connections

## This document explains how authentication is structured and connected throughout the project, following professional best practices for scalability, security, and maintainability.

## Additional Authentication-Related Files

### H. `frontend/middleware.ts`

- **Purpose:** Next.js middleware for handling authentication, redirects, and request validation at the edge before reaching application routes.
- **Best Practices:**
  - Use middleware to check authentication status and roles before allowing access to protected routes.
  - Redirect unauthenticated users to login or error pages.
  - Validate tokens and session cookies early for security and performance.
  - Centralize cross-cutting concerns (logging, rate limiting, etc.) in middleware.

### I. Other Potential Files

- **`src/app/providers.tsx`**: May provide global context (including AuthContext) to all pages, ensuring authentication state is available everywhere.
- **`src/lib/constants/permissions.ts` & `roles.ts`**: Store permission and role constants for consistent access control logic.
- **`src/lib/hooks/use-auth.ts`**: Custom React hook for accessing and managing authentication state and actions.
- **`src/lib/utils/token.ts`**: Utility functions for parsing, validating, and managing tokens.

---

---

## 1. Main Authentication Locations

### A. `src/app/(auth)/`

- **Purpose:** Contains all authentication-related routes and pages (login, register, forgot/reset password, verify email/phone).
- **Files/Folders:**
  - `layout.tsx`: Provides shared layout and context for all auth pages.
  - `login/`, `register/`, `forgot-password/`, `reset-password/`, `verify-email/`, `verify-phone/`: Each folder contains the respective page/component for its auth flow.
- **Best Practices:**
  - Use Next.js routing for clean separation of auth flows.
  - Share context and UI via `layout.tsx`.
  - Validate all user input using schemas from `lib/validations/auth.schema.ts`.

### B. `src/components/features/auth/`

- **Purpose:** Contains all reusable React components for authentication (forms, selectors, verification).
- **Files:**
  - `loginform.tsx`, `register-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `verify-email-form.tsx`, `verify-phone-form.tsx`, etc.
- **Best Practices:**
  - Keep components focused and reusable.
  - Use props and context for state and actions.
  - Validate form data before submission.
  - Use hooks from `lib/hooks/use-auth.ts` for logic.

### C. `src/context/AuthContext.tsx` & `src/contexts/AuthContext.tsx`

- **Purpose:** Provides global authentication state and methods via React Context.
- **Best Practices:**
  - Store user info, tokens, and auth status.
  - Expose login, logout, register, and verification methods.
  - Use context in pages and components to avoid prop drilling.
  - Securely handle tokens (prefer HttpOnly cookies for sensitive data).

### D. `src/lib/api/auth.service.ts` & `src/lib/api/auth.ts`

- **Purpose:** API service modules for authentication requests (login, register, verify, etc.).
- **Best Practices:**
  - Centralize all API calls for authentication.
  - Handle errors and responses consistently.
  - Use React Query for caching and state management.

### E. `src/lib/auth/`

- **Purpose:** Contains authentication utilities and logic.
- **Files:**
  - `guards.ts`: Route guards for protected pages.
  - `permissions.ts`, `roles.ts`: Role and permission logic.
  - `session.ts`: Session management.
  - `token.service.ts`, `token.ts`: Token handling and utilities.
- **Best Practices:**
  - Use guards to protect routes and redirect unauthenticated users.
  - Centralize permission and role checks.
  - Securely manage sessions and tokens.

### F. `src/lib/validations/auth.schema.ts`

- **Purpose:** Zod/Yup schema for validating authentication forms and API payloads.
- **Best Practices:**
  - Validate all user input on both client and server.
  - Keep schemas up to date with backend contracts.

### G. `src/types/auth.ts` & `src/types/auth.types.ts`

- **Purpose:** TypeScript type definitions for authentication data, forms, and API responses.
- **Best Practices:**
  - Use strict types for all auth-related data and props.
  - Sync types with backend API.

---

## 2. How Everything Connects

1. **User visits any route** (e.g., `/auth/login`, `/dashboard`).
2. **`middleware.ts` runs first**, checking authentication and permissions before allowing access to protected routes.
3. **Page loads** from `src/app/(auth)/login/` or other protected route, using shared layout and context.
4. **Form component** (e.g., `loginform.tsx`) is rendered, using props and context.
5. **Form data** is validated using `auth.schema.ts` before API submission.
6. **API call** is made via `auth.service.ts` or `auth.ts`, using React Query for state.
7. **AuthContext** updates global state on success (user info, tokens).
8. **Route guards** in `lib/auth/guards.ts` protect private pages and redirect as needed.
9. **Permissions/roles** are checked via `permissions.ts` and `roles.ts` for access control.
10. **Types** ensure safety and consistency across all layers.

---

## 3. Professional Best Practices

- **Centralize logic:** Keep all authentication logic in dedicated modules and context.
- **Validate everywhere:** Use schemas for all user input and API payloads.
- **Secure tokens:** Prefer HttpOnly cookies for sensitive tokens; never expose them to JS if possible.
- **Use context:** Provide global auth state and methods via React Context.
- **Protect routes:** Use guards and permissions for all private pages.
- **Type safety:** Use strict TypeScript types for all auth data.
- **Error handling:** Handle errors gracefully and provide user feedback.
- **Scalability:** Organize by feature and domain for easy growth.
- **Testing:** Add unit and integration tests for all auth logic and flows.

## 4. Recent Changes and Fixes

### Build and Runtime Error Fixes (Latest)

#### Environment Variable Configuration (`src/app/layout.tsx`)

- **Issue:** `process.env.NEXT_PUBLIC_API_URL` was used directly without fallback, causing undefined errors when the environment variable wasn't set.
- **Solution:** Replaced direct environment variable usage with `getApiUrl()` function that provides a fallback to `http://localhost:8000`.
- **Impact:** Prevents runtime errors and provides graceful degradation when API URL is not configured.

#### Tailwind CSS v4 Compatibility (`src/styles/globals.css`)

- **Issue:** Tailwind CSS v4 doesn't support `@apply` directive with component classes (like `.badge`, `.card-base`).
- **Solution:** Expanded all component class styles directly instead of using `@apply` with component classes.
- **Files Fixed:**
  - `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-destructive` - Expanded styles directly
  - `.card-hover`, `.card-interactive` - Expanded styles directly instead of `@apply card-base`
- **Impact:** Ensures compatibility with Tailwind CSS v4 and prevents build errors.

#### Missing Form Components (`src/components/shared/form/Fields.tsx`)

- **Issue:** `FormField` and `PasswordField` components were imported but didn't exist, causing build failures.
- **Solution:**
  - Created `FormField` component with label, error display, and description support
  - Created `PasswordField` component with optional password strength indicator
  - Added support for `hint` prop (alias for `description`)
  - Integrated with `PasswordInput` component for strength validation
- **Impact:** Enables all authentication forms to work correctly with proper form field components.

#### TypeScript Type Fixes

- **next-themes Import (`src/app/providers.tsx`):** Fixed import path from `next-themes/dist/types` to direct import from `next-themes`
- **Framer Motion Easing (`src/app/loading.tsx`):** Changed string easing values to array format `[0.4, 0, 0.2, 1] as const`
- **Type Guards (`src/components/auth/register-form.tsx`):** Added proper type checks for `in` operator usage
- **Next.js Typed Routes:** Added type assertions for Link href props to work with Next.js typed routes feature
- **Icon Names (`src/components/layouts/dashboard-sidebar.tsx`):** Fixed icon name from `BarChart` to `ChartBar` (correct lucide-react name)

### Register Form (`register-form.tsx`)

- **Issue Fixed:** Missing checkbox for `agreeToTerms` field, which was required by the validation schema but not present in the form, preventing successful submissions.
- **Solution:** Added a properly styled checkbox with label, error handling, and accessibility features. The checkbox is controlled via React Hook Form's `watch` and `setValue` for seamless integration.
- **Impact:** Ensures compliance with legal requirements and improves user experience by making terms agreement explicit.

### Reset Password Form (`reset-password-form.tsx`)

- **Implementation:** Created a complete, professional form component from scratch.
- **Features:**
  - Extracts reset token from URL query parameters for secure token handling.
  - Includes password strength indicator and validation.
  - Handles loading states and error messages gracefully.
  - Redirects to login after successful reset.
  - Follows the same design patterns as other auth forms for consistency.
- **Security:** Token is not stored in form state but passed securely to the API.
- **Integration:** Uses `useResetPassword` hook for API calls and toast notifications for feedback.
- **Accessibility:** Proper ARIA labels, focus management, and keyboard navigation.

### Documentation Updates

- Updated component descriptions to reflect recent changes.
- Added section for recent changes to track maintenance and improvements.

---

## 5. REST API Integration Guide

This section provides comprehensive documentation on how to integrate the frontend with your REST API backend.

### 5.1 Environment Configuration

#### Setting Up Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# OR use any of these alternative variable names:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Custom refresh token endpoint
NEXT_PUBLIC_AUTH_REFRESH_PATH=/api/v1/accounts/token/refresh/

# Optional: Enable mock API for development/testing
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_MOCK_API_URL=/__mock_api

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Environment Variable Priority

The API client (`src/lib/utils/env.ts`) checks environment variables in this order:

1. `NEXT_PUBLIC_API_BASE_URL`
2. `NEXT_PUBLIC_BACKEND_URL`
3. `NEXT_PUBLIC_API_URL`
4. `API_BASE_URL`
5. `API_URL`

**Fallback:** If none are set, defaults to `http://localhost:8000`

#### Production Configuration

For production, set these in your deployment platform (Vercel, Netlify, etc.):

- `NEXT_PUBLIC_API_BASE_URL`: Your production API URL (e.g., `https://api.rumi.app`)
- `NEXT_PUBLIC_APP_URL`: Your production frontend URL (e.g., `https://rumi.app`)

### 5.2 API Client Architecture

#### Core API Client (`src/lib/api/client.ts`)

The API client is built on Axios and provides:

**Features:**

- Automatic token injection in request headers
- Automatic token refresh on 401 errors
- Request/response interceptors
- Error handling and transformation
- Retry logic for failed requests
- Support for mock API mode

**Configuration:**

```typescript
// Base URL is automatically determined from environment variables
const BASE_URL = getApiUrl(); // Falls back to http://localhost:8000

// Axios instance with default config
export const axiosInstance = axiosBase.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Important for cookie-based auth
});
```

#### Request Interceptor

Automatically adds the access token to all requests:

```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Response Interceptor

Handles token refresh automatically:

- On 401 (Unauthorized), attempts to refresh the token
- Retries the original request with the new token
- Logs out user if refresh fails

### 5.3 Authentication API Endpoints

All authentication endpoints are defined in `src/lib/api/auth.ts`. The API expects the following endpoints:

#### Base Endpoints Structure

```
/api/v1/accounts/
├── login/                    # POST - User login
├── register/
│   ├── student/             # POST - Student registration
│   ├── landlord/            # POST - Landlord registration
│   └── caretaker/           # POST - Caretaker registration
├── logout/                  # POST - User logout
├── verify-email/            # POST - Email verification
├── verify-phone/            # POST - Phone verification
├── resend-otp/              # POST - Resend OTP
├── forgot-password/         # POST - Request password reset
├── reset-password/          # POST - Reset password with token
├── token/refresh/           # POST - Refresh access token
├── me/                      # GET - Get current user profile
├── profile/                 # PATCH - Update profile
│   ├── student/             # POST - Complete student profile
│   └── landlord/            # POST - Complete landlord profile
└── permissions/             # GET - Get user permissions
```

#### Request/Response Formats

##### 1. Login (`POST /api/v1/accounts/login/`)

**Request:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

```typescript
{
  user: {
    id: string;
    email: string;
    role: 'student' | 'landlord' | 'caretaker' | 'admin';
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  profile?: StudentProfile | LandlordProfile | CaretakerProfile | null;
  access: string;  // JWT access token
  refresh: string; // JWT refresh token
}
```

##### 2. Registration (`POST /api/v1/accounts/register/{role}/`)

**Student Registration:**

```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  university: string;
  studentIdNumber: string;
  yearOfStudy: number;
  course?: string;
  agreeToTerms: boolean;
}
```

**Landlord Registration:**

```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  businessName: string;
  bankName: string;
  bankAccountNumber: string;
  kraPin: string;
  agreeToTerms: boolean;
}
```

**Caretaker Registration:**

```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  hostelId?: string;
  employmentStartDate?: string; // ISO date string
  nationalId?: string;
  agreeToTerms: boolean;
}
```

**Response:** Same as login response

##### 3. Token Refresh (`POST /api/v1/accounts/token/refresh/`)

**Request:**

```typescript
{
  refresh: string; // Refresh token
}
```

**Response:**

```typescript
{
  access: string; // New access token
  refresh: string; // New refresh token (optional, may be same)
}
```

##### 4. Get Profile (`GET /api/v1/accounts/me/`)

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```typescript
{
  user: User;
  profile: StudentProfile | LandlordProfile | CaretakerProfile | null;
}
```

##### 5. Email Verification (`POST /api/v1/accounts/verify-email/`)

**Request:**

```typescript
{
  email?: string; // Optional, uses current user if not provided
  otp: string;    // 6-digit OTP
}
```

**Response:** `204 No Content` or `200 OK`

##### 6. Phone Verification (`POST /api/v1/accounts/verify-phone/`)

**Request:**

```typescript
{
  phone: string;
  otp: string;
}
```

**Response:** `204 No Content` or `200 OK`

##### 7. Forgot Password (`POST /api/v1/accounts/forgot-password/`)

**Request:**

```typescript
{
  email: string;
}
```

**Response:**

```typescript
{
  message: string; // e.g., "Password reset instructions sent to your email"
}
```

##### 8. Reset Password (`POST /api/v1/accounts/reset-password/`)

**Request:**

```typescript
{
  token: string; // Reset token from email link
  password: string; // New password
  confirmPassword: string; // Password confirmation
}
```

**Response:**

```typescript
{
  message: string; // e.g., "Password reset successful"
}
```

### 5.4 Error Handling

#### Error Response Format

The API should return errors in this format:

```typescript
{
  error: string;           // Error code (e.g., "invalid_credentials")
  message: string;         // Human-readable error message
  statusCode: number;      // HTTP status code
  details?: any;           // Additional error details (optional)
}
```

#### Error Mapping (`src/lib/api/error-mapping.ts`)

The frontend automatically maps API errors to user-friendly messages:

```typescript
// Example error mappings
'invalid_credentials' → 'Invalid email or password'
'email_already_exists' → 'An account with this email already exists'
'token_expired' → 'Your session has expired. Please log in again'
'validation_error' → 'Please check your input and try again'
```

#### Handling Errors in Components

```typescript
import { useLogin } from '@/lib/hooks/use-auth';
import { mapApiError } from '@/lib/api/error-mapping';

const { mutate: login, isPending } = useLogin();

const handleSubmit = (data: LoginFormData) => {
  login(data, {
    onError: (error) => {
      const apiError = mapApiError(error);
      // apiError.message contains user-friendly message
      toast({
        title: 'Login failed',
        description: apiError.message,
        variant: 'destructive',
      });
    },
  });
};
```

### 5.5 Token Management

#### Token Storage

Tokens are stored in browser localStorage:

- `access_token`: JWT access token (short-lived, ~15 minutes)
- `refresh_token`: JWT refresh token (long-lived, ~7 days)

**Location:** `src/lib/auth/token.ts`

#### Automatic Token Refresh

The API client automatically handles token refresh:

1. When a request returns 401 (Unauthorized)
2. The client attempts to refresh using the refresh token
3. If refresh succeeds, the original request is retried
4. If refresh fails, user is logged out and redirected to login

**Implementation:** See `src/lib/api/client.ts` response interceptor

#### Manual Token Refresh

```typescript
import { authApi } from '@/lib/api/auth';

const refreshToken = async () => {
  const refresh = getRefreshToken();
  if (refresh) {
    const response = await authApi.refreshToken(refresh);
    // Tokens are automatically stored
    return response;
  }
};
```

### 5.6 Using React Query Hooks

All authentication operations use React Query hooks for state management:

#### Available Hooks (`src/lib/hooks/use-auth.ts`)

```typescript
// Login
const { mutate: login, isPending } = useLogin();

// Registration
const { mutate: register, isPending } = useRegister('student');
// Or use specific hooks:
const { mutate: registerStudent } = useRegisterStudent();
const { mutate: registerLandlord } = useRegisterLandlord();
const { mutate: registerCaretaker } = useRegisterCaretaker();

// Profile
const { data: profile, isLoading } = useProfile();
const { mutate: updateProfile } = useUpdateProfile();

// Verification
const { mutate: verifyEmail } = useVerifyEmail();
const { mutate: verifyPhone } = useVerifyPhone();
const { mutate: resendOtp } = useResendVerification();

// Password
const { mutate: forgotPassword } = useForgotPassword();
const { mutate: resetPassword } = useResetPassword();

// Logout
const { mutate: logout } = useLogout();

// Permissions
const { data: permissions } = usePermissions();
const hasPermission = useHasPermission('read_hostels');
```

#### Example Usage

```typescript
'use client';

import { useLogin } from '@/lib/hooks/use-auth';
import { useForm } from 'react-hook-form';

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        // User is automatically redirected by the hook
        toast({ title: 'Welcome back!' });
      },
      onError: (error) => {
        // Error is automatically handled and displayed
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 5.7 Mock API Mode

For development and testing, you can enable mock API mode:

#### Enable Mock Mode

Set in `.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_API=true
```

#### Mock API Behavior

When enabled:

- All API calls return mock data immediately
- No actual HTTP requests are made
- Useful for frontend development without backend
- Mock responses are defined in `src/lib/api/auth.ts`

#### Disabling Mock Mode

Set `NEXT_PUBLIC_USE_MOCK_API=false` or remove the variable to use real API.

### 5.8 CORS Configuration

Your backend API must be configured to accept requests from your frontend:

#### Required CORS Headers

```
Access-Control-Allow-Origin: http://localhost:3000 (development)
Access-Control-Allow-Origin: https://rumi.app (production)
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### Django CORS Configuration Example

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://rumi.app",
]

CORS_ALLOW_CREDENTIALS = True
```

### 5.9 Testing API Integration

#### 1. Check API Connection

```typescript
// Test if API is reachable
const testConnection = async () => {
  try {
    const response = await fetch(`${getApiUrl()}/api/v1/accounts/me/`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
    console.log('API Status:', response.status);
  } catch (error) {
    console.error('API Connection Error:', error);
  }
};
```

#### 2. Verify Environment Variables

```typescript
// Check if API URL is configured
import { getApiUrl } from '@/lib/utils/env';

console.log('API URL:', getApiUrl());
// Should output: http://localhost:8000 or your configured URL
```

#### 3. Test Authentication Flow

1. Register a new user
2. Verify email/phone
3. Login
4. Access protected routes
5. Test token refresh (wait for token to expire or manually invalidate)

### 5.10 Troubleshooting

#### Common Issues

**1. CORS Errors**

- **Symptom:** `Access-Control-Allow-Origin` errors in browser console
- **Solution:** Configure CORS on your backend to allow your frontend origin

**2. 401 Unauthorized Errors**

- **Symptom:** All requests return 401
- **Solution:**
  - Check if tokens are being stored correctly
  - Verify token format in Authorization header
  - Check if refresh token endpoint is correct

**3. Network Errors**

- **Symptom:** `Network Error` or connection refused
- **Solution:**
  - Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
  - Check if backend server is running
  - Verify network connectivity

**4. Token Refresh Loop**

- **Symptom:** Infinite refresh attempts
- **Solution:**
  - Check refresh token endpoint path
  - Verify refresh token is valid
  - Check backend refresh token logic

**5. Environment Variables Not Loading**

- **Symptom:** API URL defaults to localhost:8000
- **Solution:**
  - Restart Next.js dev server after changing `.env.local`
  - Ensure variable names start with `NEXT_PUBLIC_`
  - Check for typos in variable names

### 5.11 Security Best Practices

1. **Never expose sensitive tokens in client-side code**
   - Tokens are stored in localStorage (consider HttpOnly cookies for production)

2. **Always use HTTPS in production**
   - Set `NEXT_PUBLIC_API_BASE_URL` to `https://` URL

3. **Validate all user input**
   - Use Zod schemas before sending to API

4. **Handle errors gracefully**
   - Don't expose internal error details to users

5. **Implement rate limiting on backend**
   - Prevent brute force attacks on login/registration

6. **Use secure token storage**
   - Consider HttpOnly cookies for production (requires backend changes)

### 5.12 Next Steps

1. **Configure your backend API** to match the endpoint structure above
2. **Set environment variables** in `.env.local` for development
3. **Test authentication flow** end-to-end
4. **Configure CORS** on your backend
5. **Set up production environment variables** in your deployment platform
6. **Monitor API errors** and adjust error handling as needed

---

## 6. Additional Resources

- **API Client:** `src/lib/api/client.ts`
- **Auth API:** `src/lib/api/auth.ts`
- **Auth Hooks:** `src/lib/hooks/use-auth.ts`
- **Token Utils:** `src/lib/auth/token.ts`
- **Error Mapping:** `src/lib/api/error-mapping.ts`
- **Environment Utils:** `src/lib/utils/env.ts`
