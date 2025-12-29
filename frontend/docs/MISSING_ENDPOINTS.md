# Missing API Endpoints

The following features in the Admin Dashboard have been implemented in the frontend but lack corresponding backend regular API endpoints. They are currently wired to these proposed paths:

## 1. settings / Security (2FA)
- **Endpoint**: `POST /auth/2fa/enable/`
- **Purpose**: Initiate 2FA setup (returns QR code secret).
- **Endpoint**: `POST /auth/2fa/verify/`
- **Purpose**: Verify OTP code to confirm 2FA setup.
- **Endpoint**: `POST /auth/2fa/disable/`
- **Purpose**: Disable 2FA for the user.

## 2. Settings / Platform Configuration
- **Endpoint**: `POST /admin/super/platform/maintenance/`
- **Purpose**: Toggle system maintenance mode.
- **Payload**:
  ```json
  {
    "maintenance_mode": true
  }
  ```

## 3. Settings / User Registration
- **Endpoint**: `POST /admin/super/platform/registrations/`
- **Purpose**: Toggle allowing new user signups.

> **Note**: Monitoring now uses the existing `/admin/super/system/health/` and `/admin/super/platform/stats/` endpoints.

## 4. Tech Support - User Management

The following endpoints are needed for the User Support feature:

- **Endpoint**: `POST /support/users/{user_id}/verify/`
- **Purpose**: Verify a user's identity (mark as verified)
- **Response**: Updated user object with `is_verified: true`

- **Endpoint**: `POST /support/users/{user_id}/toggle-lock/`
- **Purpose**: Suspend or unsuspend a user account
- **Payload**:
  ```json
  {
    "reason": "string"
  }
  ```
- **Response**: Updated user object with `is_active` toggled

> **Available endpoints** for this feature:
> - `GET /support/users/` - List all users
> - `GET /support/users/{user_id}/support/` - Get user profile details
> - `POST /support/users/{user_id}/reset-password/` - Send password reset email
