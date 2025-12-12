# Backend Implementation Guide for TechSupport Dashboard

This document outlines the backend requirements to support the TechSupport Admin Dashboard.

## Role & Permissions
- **Role**: `tech_support` (already in `User` model).
- **Permissions**:
    - Read-only access to most data (Users, Hostels, Payments).
    - Write access restricted to specific operational actions (Verify, Lock, Hide, Flag, Request Refund).
    - **NO ACCESS** to: Deletion, System Config, Financial Settlements, Admin Management.

## Required API Endpoints

### 1. User Management (`/api/v1/accounts/tech-support/users/`)
- `GET /`: List all users (exclude SuperAdmin). Support filtering by role, status, search (email, name, phone).
- `GET /{id}/`: Get detailed user profile (including related profiles like Student/Landlord).
- `POST /{id}/verify/`: Mark user as verified.
- `POST /{id}/toggle-lock/`: Toggle `is_active`. Require `reason` in body.
- `POST /{id}/reset-otp/`: Reset OTP attempts.
- `GET /{id}/logs/`: Get simple activity logs (login/logout) for the user.

### 2. Hostel Support (`/api/v1/hostels/tech-support/`)
- `GET /`: List hostels. Filter by status (pending, active, flagged).
- `GET /{id}/`: Get hostel details + documents.
- `POST /{id}/verify/`: Mark hostel/landlord as verified.
- `POST /{id}/toggle-visibility/`: Hide/Show hostel. Require `reason`.
- `POST /{id}/flag/`: Flag for investigation. Require `reason`.

### 3. Payment Support (`/api/v1/payments/tech-support/`)
- `GET /`: List transactions. Search by reference, user.
- `GET /{id}/`: Get transaction details.
- `POST /{id}/request-refund/`: Create a `RefundRequest`. Require `reason`. **Do not process refund immediately.**

### 4. Complaints/Issues (`/api/v1/support/tech-support/tickets/`)
- `GET /`: List tickets. Filter by status, category, assignee.
- `POST /{id}/assign/`: Assign ticket to self.
- `POST /{id}/comment/`: Add internal comment.
- `POST /{id}/resolve/`: Mark as resolved.
- `POST /{id}/escalate/`: Escalate to SuperAdmin.

### 5. Dashboard Stats (`/api/v1/accounts/tech-support/stats/`)
- Returns counts for:
    - Pending Verifications (Users & Hostels)
    - Open Complaints
    - Flagged Hostels
    - Recent Disputes

## Security Notes
- Ensure `IsTechSupportAdmin` permission class is applied to all these endpoints.
- Audit logging is crucial. Log every write action (verify, lock, flag) with `UserActivityLog`.
