# RUMI Onboarding Strategy: The Student Housing OS

This document maps out the end-to-end onboarding flows for RUMI, positioning it as the infrastructure layer for student housing in Africa.

## 1. Persona Mapping & Flow Architecture

RUMI handles four distinct personas, each with unique trust requirements and friction points.

### Persona A: The New Student (Booking Flow)
*   **Goal**: Find a hostel, match with roommates, and secure a bed with a deposit.
*   **Path**: Landing -> Search -> Roommate Compatibility -> 15-min Reservation -> M-Pesa Payment -> Verification.
*   **Trust Gap**: "Is the room real? Will I like my roommates?"
*   **Edge Case**: Reservation expires before M-Pesa webhook confirms (15-min window).

### Persona B: The Existing Student (Migration Flow)
*   **Goal**: Join RUMI for an already occupied hostel to pay rent and manage daily life.
*   **Path**: Invite/Reference -> Profile Setup -> Link to Existing Hostel (C2B Transaction matching).
*   **Trust Gap**: "Why do I need to switch from paying my landlord directly?"
*   **Edge Case**: M-Pesa reference mismatch during first offline payment.

### Persona C: The Landlord (Infrastructure Flow)
*   **Goal**: List properties, verify bank accounts, and automate rent collection.
*   **Path**: Signup -> Business Verification (KRA/ID/Deeds) -> Admin Audit -> Hostel Creation -> Room Config.
*   **Trust Gap**: "Is my money safe? Do I have control over my caretakers?"

### Persona D: The Caretaker (Operations Flow)
*   **Goal**: Manage day-to-day operations (check-ins, visitors, damages).
*   **Path**: Landlord Invite -> Role Activation -> Hostel Dashboard.
*   **Trust Gap**: "Does the app save me time or create more data entry?"

---

## 2. Technical Architecture: Server-Authoritative State Machine

RUMI's onboarding logic is shifting from client-side form wizards to a **Server-Authoritative State Machine**. The backend is the single source of truth for user status, capabilities, and next allowed actions.

### Core Onboarding States (Finite State Machine)
The `User.onboarding_stage` determines the strict availability of routes and APIs.

1.  **UNINITIALIZED**
    -   *Trigger*: Account created (OAuth/Email).
    -   *Gate*: Email Verification.
    -   *Allowed*: `/onboarding/role-selection`.
2.  **ROLE_SELECTED**
    -   *Trigger*: User selects Student, Landlord, or Caretaker.
    -   *Action*: Backend initialized empty Profile model.
    -   *Next*: `IDENTITY_VERIFICATION`.
3.  **IDENTITY_DRAFT** (Crash-Resumable)
    -   *Trigger*: User starts filling personal details.
    -   *Feature*: Stepwise data persistence (auto-save).
    -   *Validations*: Basic format checks (Regex).
4.  **IDENTITY_VERIFIED**
    -   *Trigger*: Core identity fields (DOB, Gender, Phone) validated.
    -   *Gate*: OTP Verification for Phone.
    -   *Unlock*: Role-specific sub-flows.
5.  **ACADEMIC_VERIFICATION_PENDING** (Student Only)
    -   *Trigger*: Upload Student ID / Admission Letter.
    -   *State*: User can browse but cannot BOOK until verified (or provisional access granted).
6.  **BUSINESS_VERIFICATION_PENDING** (Landlord Only)
    -   *Trigger*: KRA PIN, Deeds/Business Permit upload.
    -   *State*: Can create "Draft" hostels, cannot "Publish".
7.  **ACTIVE (COMPLETED)**
    -   *Trigger*: All required verifications passed.
    -   *Unlock*: Full platform capabilities.

### Capability-Based Roles (RBAC 2.0)
Instead of hardcoded `if role == 'landlord'`, we use dynamic **Capabilities**.
*   `student:browse`
*   `student:book` (Requires `IDENTITY_VERIFIED`)
*   `hostel:create_draft` (Requires `IDENTITY_VERIFIED`)
*   `hostel:publish` (Requires `BUSINESS_VERIFICATION_COMPLETE`)
*   `tenant:manage` (Caretaker specific)

---

## 3. Crash-Resumable & Stepwise Flows

### The Problem: Atomic Form Fragility
Previous "Wall of Fields" forms caused data loss on network drops and high cognitive load.

### The Solution: Stepwise Persistence
1.  **Draft API**: `PATCH /api/v1/onboarding/draft/`
    -   Accepts partial JSON.
    -   Saves to `profile.draft_data` without running strict full-model validation.
2.  **Resume Support**:
    -   On login, `GET /api/v1/users/me/` returns `onboarding_step` and `draft_data`.
    -   Frontend hydrates the wizard to the exact last known state.

### Tenants & Offboarding Lifecycle
Onboarding is capable of handling the entire tenancy lifecycle:
-   **NOTICE_GIVEN**: Tenant signaled departure.
-   **MOVE_OUT_PENDING**: Caretaker inspection scheduled.
-   **CLOSED**: Deposit refunded/forfeited, room freed.

---

## 4. Global Guards & Security

### API Layer
-   **Middleware**: `OnboardingGuardMiddleware` intercepts all non-public requests.
-   **Logic**: If `user.onboarding_stage != COMPLETED` and route is not in `ALLOWED_ONBOARDING_URLS`, redirect to `/onboarding`.

### Frontend Layer
-   **HOC**: `withOnboardingGuard` wraps Dashboard layouts.
-   **Redirect**: Automatically routes users to their next incomplete step based on backend response.

---

## 5. Reservation & Payment State Machine

The booking flow is a critical sub-state machine:

| State | Description | Transition Trigger |
| :--- | :--- | :--- |
| **INITIATED** | Booking intent declared (room lock). | User clicks "Book". |
| **PENDING_PAYMENT** | STK Push sent / Instructions shown. | Payment Gateway API. |
| **DELAYED** | 15min timer expired, but webhook unknown. | Cron/Task Scheduler. |
| **FAILED** | Payment declined or timeout confirmed. | Webhook / Reconciliation. |
| **EXTENDED** | System grants extra time (e.g., Offline mode). | Manual/Auto Policy. |
| **CONFIRMED** | Payment received & reconciled. | Idempotent Webhook. |

---

## 6. Implementation Checklist

### Backend Refactor
- [ ] **State Machine**: Implement `OnboardingStateMachine` class in `accounts/logic.py`.
- [ ] **Models**: Update `User` and `Profile` models with `onboarding_stage` and `capabilities`.
- [ ] **API**: logic for `draft` vs `commit` endpoints.
- [ ] **Webhooks**: Ensure idempotent handling of M-Pesa callbacks to prevent double-booking.

### Frontend Refactor
- [ ] **Wizard**: Replace `OnboardingForm` with `StepwiseWizard` component.
- [ ] **State Sync**: React Query hooks to poll/sync `onboarding_stage`.
- [ ] **Guards**: Implement `useOnboardingGuard` hook in `_app.tsx` or layout root.

### Remediation & Quality
- [ ] **Audit**: Check for race conditions in "Simultaneous Booking" scenarios.
- [ ] **Tests**: Add integration tests for "Resume after reload" flows.
- [ ] **Docs**: Maintain this document as the single source of truth.
