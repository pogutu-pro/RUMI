# connect.md – How the whole frontend fits together

This document explains **how all the main folders under `src/` work together**, especially for backend integration and debugging.

Use this when you want to answer:

- "Where does this data come from?"
- "What do I edit to call a new backend endpoint?"
- "Why is this page showing wrong data?"

---

## High-level architecture

Text diagram of the main flow:

```text
           Backend (Django / API server)
                     ▲
                     │ HTTP (Axios)
                     │
             src/lib/api/*.ts
                     ▲
                     │ (typed responses)
                     │
                src/hooks/*.ts
                     ▲
          ┌──────────┴───────────┐
          │                      │
   src/stores/*.ts         src/types/*.ts
          ▲                      ▲
          │                      │ (types for props/data)
          └──────────┬───────────┘
                     │
              src/components/
                     ▲
                     │
                 src/app/
        (routes, pages, layouts)
```

- **Backend** – your real server.
- **`lib/api`** – how the frontend calls the backend.
- **`hooks`** – glue between backend calls and UI, often with React Query.
- **`stores`** – shared state (auth, filters, notifications, etc.).
- **`types`** – TypeScript models matching backend data.
- **`components`** – visual building blocks.
- **`app`** – URL routes that assemble everything into pages.

---

## Typical data flow for a page

Example: `/admin/analytics/growth`

1. **Route & page**
   - URL `/admin/analytics/growth` is handled by:
     - `src/app/(admin)/admin/analytics/growth/page.tsx`
   - This page imports:
     - Components from `src/components/analytics` or `src/components/admin`.
     - Hooks like `use-analytics` from `src/hooks/use-analytics.ts`.

2. **Hook**
   - `use-analytics.ts`:
     - Uses React Query.
     - Calls functions from `src/lib/api/analytics.ts`.
     - Returns `{ data, isLoading, error }` to the page.

3. **API module**
   - `lib/api/analytics.ts`:
     - Uses `axiosInstance` from `lib/api/client.ts`.
     - Calls backend endpoints like `/analytics/growth/`.
     - Types responses using `src/types/api.types.ts` and `entities.types.ts`.

4. **Client & environment**
   - `lib/api/client.ts`:
     - Gets base URL from `lib/utils/env.ts` (`getApiUrl`).
     - Adds `Authorization` header using tokens from `lib/auth/token`.
     - Handles 401 by refreshing tokens, mapping errors with `error-mapping.ts`.

5. **Stores & providers**
   - `auth.store.ts` and `AuthProvider` know who the user is.
   - `QueryProvider` sets up React Query.

6. **Components**
   - Analytics components receive props from the page/hook and just render.
   - They don’t call the backend directly.

If the page is wrong:

- Start at `page.tsx` → see which hook it uses.
- Open that hook in `src/hooks` → see which `lib/api` function it calls.
- Open the corresponding `lib/api/*.ts` file → check the URL, params, types.
- If the response shape changed, update `src/types`.

---

## How each main folder connects

### `src/lib`

- **`lib/api/*.ts`** – one file per domain (auth, hostels, bookings, analytics, messages, notifications, payments, profiles, reviews, roommates, rooms, support, transfers, users, damage-reports).
- **`client.ts`** – central Axios client, auth headers, token refresh, retry.
- **`error-mapping.ts`** – turns raw backend errors into a consistent shape.
- **`auth/`** – token and role helpers used by the client and auth store.
- **`utils/env.ts`** – chooses the API base URL from env and validates it.
- **`react-query/`** – sets defaults for caching, refetching.
- **`validations/`** – form schemas to match backend validation.

Everything that **talks to the backend** or configures those calls lives here.

### `src/hooks`

- One hook per domain (`use-bookings`, `use-hostels`, `use-analytics`, `use-messages`, etc.).
- Each data hook:
  - Uses React Query.
  - Calls a function from `lib/api`.
  - Uses types from `src/types`.
  - Optionally writes to or reads from a store in `src/stores`.

Hooks let components and pages use complex logic with a simple API like:

```ts
const { data, isLoading, error } = useBookings({ status: 'pending' })
```

### `src/stores`

- Global state containers:
  - `auth.store.ts` – current user, tokens, login/logout.
  - `filters.store.ts` – search/filter state shared across listing pages.
  - `notifications.store.ts` – notifications list and unread counts.
  - `booking.store.ts`, `messaging.store.ts`, `ui.store.ts` – booking steps, messaging UI, layout state, etc.
- Updated by hooks/providers, read by components/pages.

### `src/types`

- TypeScript models for:
  - API payloads (`api.types.ts`).
  - Auth flows (`auth.types.ts`).
  - Core entities (`entities.types.ts`).
  - Form data (`forms.types.ts`).
  - UI helpers (`ui.types.ts`).

These types are used in:

- `lib/api` to type Axios calls.
- Hooks to type state and return values.
- Components to type props.

### `src/components`

- Visual layer grouped by domain:
  - `analytics`, `admin`, `auth`, `hostels`, `inventory`, `messaging`, `notifications`, `payments`, `profile`, `reviews`, `roommates`, `shared`, `ui`.
- Receive data from hooks and stores as props.
- Do **not** call `lib/api` directly.

### `src/app`

- Routing and pages:
  - `(admin)`, `(student)`, `(landlord)`, `(caretaker)`, `(auth)`, `(public)`.
  - Each page imports components and hooks to build the screen.
- Global layout, error, loading, and 404 handling.

---

## Troubleshooting checklist

When something is broken, ask:

1. **Wrong URL/route?**
   - Check `src/app/.../page.tsx` and folders.

2. **Correct route but wrong data?**
   - Find which hook the page uses (`import { useX } from '@/hooks/use-x'`).
   - Open that hook in `src/hooks`.

3. **Hook looks fine but API call is wrong?**
   - See which `lib/api/*.ts` function it uses.
   - Check the endpoint path, params, method.

4. **API updated on backend?**
   - Update `src/types` (entities/api/auth/types).
   - Then update `lib/api` and any hooks using those types.

5. **Auth/token issues?**
   - Check `lib/api/client.ts` and `lib/auth/*`.
   - Check `auth.store.ts` and `use-auth.ts`.

6. **UI looks wrong but data is correct?**
   - Inspect components in `src/components`.
   - Check props passed from the page.

7. **Many screens look visually broken?**
   - Inspect `src/styles/globals.css` and `src/styles/themes.css`.

---

## How to add a new backend feature (recipe)

1. **Backend gives you a new endpoint**, e.g. `POST /api/v1/hostels/{id}/feature/`.
2. In **`src/types`**, add or update types describing the request/response.
3. In **`src/lib/api/hostels.ts`**, add a function calling that endpoint.
4. In **`src/hooks`**, either:
   - Update an existing hook (`use-hostel`, `use-hostels`), or
   - Create a new hook (e.g. `use-hostelFeature`) that wraps the new API call.
5. In **`src/components`**, build or update UI to trigger/use this hook.
6. In **`src/app`**, wire the component into the right page/route.

Follow this pattern and this `connect.md` + the per-folder READMEs should give you everything you need to evolve and debug the project without relying on AI.
# know_my_folder.md

This document explains what each main folder under the `src` directory does, in simple language.

---

## Top-level: `src`
This is the main source code folder for the frontend. Everything that runs in the browser (and your Next.js server components) lives here.

Inside `src` you currently have:

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `providers/`
- `stores/`
- `styles/`
- `types/`

Below is what each of these does.

---

## `app/` – Routes, pages, and layouts
This is the **Next.js App Router** folder. It controls URLs, pages, layouts, loading states, and error pages.

Key items:

- `(admin)/`
- `(auth)/`
- `(caretaker)/`
- `(landlord)/`
- `(public)/`
- `(student)/`
- `api/`
- `context/`
- `error.tsx`
- `layout.tsx`
- `loading.tsx`
- `not-found.tsx`
- `page.tsx`
- `providers.tsx`

### Route groups (role-based sections)
These folders are **route groups** (the parentheses are a Next.js convention). They organize pages by role or area of the app:

- `(admin)/` – Admin area pages and components.
- `(auth)/` – Authentication pages (login, register, verification, etc.).
- `(caretaker)/` – Pages for caretaker users.
- `(landlord)/` – Pages for landlord users.
- `(public)/` – Public-facing pages (landing, marketing, general info, etc.).
- `(student)/` – Pages for student users.

Each of these route groups usually contains subfolders like `dashboard/`, `profile/`, `settings/`, etc., each with its own `page.tsx` and sometimes `layout.tsx`.

### Other app-level files/folders

- `api/` – Next.js API routes (serverless functions) that run on the server. These can be used as a thin backend or proxy for the frontend.
- `context/` – React context providers that are scoped to the app router (for example, global state that needs to be available across pages).
- `error.tsx` – Global error boundary UI if something crashes while rendering.
- `layout.tsx` – Root layout: wraps all pages (e.g. global HTML structure, theme providers, navigation). This is the top-level layout for the app router.
- `loading.tsx` – Global loading UI while routes or data are being loaded.
- `not-found.tsx` – Global 404 page when a route does not exist.
- `page.tsx` – Root index page for `/` (usually the main landing or redirect page).
- `providers.tsx` – Central place to set up React providers (e.g. theme, query client, auth, global UI providers) for the whole app.

---

## `components/` – Reusable UI building blocks
This folder contains **reusable React components** that are not tied to a single page or route. These are your building blocks for the UI.

Typical contents include:

- Shared buttons, inputs, forms.
- Layout pieces (cards, modals, headers, footers, navigation bars).
- Visual components (avatars, badges, icons, lists, tables).

When you need a UI element that will be used in multiple places, you generally:

1. Create it in `components/`.
2. Import and use it inside pages under `app/`.

---

## `hooks/` – Reusable React hooks
This folder contains **custom React hooks** (functions starting with `use...`) that encapsulate logic you want to reuse.

Examples of what typically lives here:

- `useAuth` – auth-related state and helpers.
- `useDebounce`, `usePagination`, etc. – generic UI and data helpers.
- Hooks that wrap API calls using `react-query` or other state managers.

Use this folder when you have repeated logic across components that is **not** just UI, but behavior/state.

---

## `lib/` – Core application logic and utilities
This is a key folder that holds **non-UI logic** and shared utilities.

Inside `lib/` you have:

- `api/`
- `auth/`
- `constants/`
- `react-query/`
- `utils/`
- `validations/`

### `lib/api/` – API client & endpoint modules
Holds everything related to talking to your backend.

- `client.ts` – Configures the Axios instance, base URL, auth headers, token refresh, and error handling.
- Feature-specific files like `auth.ts`, `hostels.ts`, `bookings.ts`, etc. – Each file exposes functions like `login`, `getHostels`, `createBooking`, which wrap HTTP calls.

When you want to call a backend endpoint, you:

1. Add a function in the relevant `lib/api/*.ts` file (or create a new one).
2. Import that function in your page/component/hook and use it.

### `lib/auth/` – Auth helpers
Utilities for authentication, such as:

- Managing tokens (get/set/clear access & refresh tokens).
- Storing user roles.
- Possibly helpers for checking if a user is logged in.

### `lib/constants/` – Shared constant values
Contains configuration-like values used in multiple places, e.g.:

- Enums and string constants.
- Lists for dropdowns or filters.
- Role names, route names, static labels.

### `lib/react-query/` – React Query setup
Central place for **React Query** configuration and helpers:

- Query client setup.
- Custom hooks or utilities that wrap React Query.
- Default options for caching, refetching, etc.

### `lib/utils/` – General utility functions
Small, reusable helper functions that dont belong to a specific feature.

Examples:

- Date and time formatting.
- Number and currency formatting.
- Environment helpers like `getApiUrl`.
- Miscellaneous helpers used across the app.

### `lib/validations/` – Validation schemas
Validation logic for forms and inputs, typically using a library like Zod or Yup.

- Schemas for auth forms, profile forms, filters, etc.
- Shared validation rules (e.g. email format, password strength).

Use these when building forms so validation logic stays consistent and centralized.

---

## `providers/` – App-wide provider components
Contains components that wrap the entire app (or large parts of it) with context providers.

Examples of what usually goes here:

- Theme provider.
- React Query provider.
- Toast/notification provider.
- Any global UI or state provider.

These are often imported and used in `app/layout.tsx` or `app/providers.tsx`.

---

## `stores/` – Global state (e.g. Zustand)
Holds **global state stores** (likely using Zustand or a similar library).

Examples:

- `auth.store` – authentication state.
- UI preferences store.
- Any other global piece of state shared across many pages.

Use a store when state is:

- Needed in many unrelated components.
- Not practical to manage only through props or local component state.

---

## `styles/` – Global styling
Contains styling files that apply across the entire app.

Common contents:

- Global CSS or SCSS files.
- Tailwind base/import file (e.g. `globals.css`).
- Theme-related style files.

Page-specific or component-specific styles may live next to the components, but **global** or shared styling belongs here.

---

## `types/` – Shared TypeScript types
Central place for TypeScript type definitions.

Typical contents:

- `api.types.ts` – Types for API requests and responses.
- `entities.types.ts` – Core domain entities (Hostel, Booking, User, etc.).
- Other shared type definitions used across components, hooks, and API modules.

When you introduce a new backend resource or domain concept, add or update its types here, then reuse those types in your `lib/api`, components, and hooks.

---

## How to use this document

- When you want to **build a new page**: go to `src/app/` and find the right route group (e.g. `(student)` or `(admin)`).
- When you want to **call the backend**: add functions in `src/lib/api/` and call them from your pages/hooks.
- When you want to **share UI**: put components in `src/components/`.
- When you want to **share logic**: create hooks in `src/hooks/` or utilities in `src/lib/utils/`.
- When you want to **define data shapes**: add/update types in `src/types/`.
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
# Frontend Comprehension

This document merges the documentation from the various `README.md` files inside the `src` subfolders of the frontend.

---

## `src/app` – Routes, pages, layouts & app-level wiring

# `src/app` – Routes, pages, layouts & app-level wiring

This folder is the **heart of the Next.js App Router**. It defines what URL shows which page, and how different parts of the app (admin, student, caretaker, landlord, public) are structured.

If you want to:

- Add or change a **page URL** → edit or create files here.
- Change the **global layout / shell** → edit `layout.tsx` or route-group layouts.
- Control what happens while data is **loading or errors occur** → use `loading.tsx` and `error.tsx`.

---

## Key files at the root of `app`

- `layout.tsx`
  - The **root layout** for the entire app.
  - Wraps all pages with HTML structure and top-level providers (often via `providers.tsx`).
  - Good place to add things like `<html lang="en">`, theme provider, and general layout (header/footer).

- `page.tsx`
  - The main page for `/` (home route).
  - If you want to change what users see when they first visit the site, change this file.

- `providers.tsx`
  - Central component that usually wraps children with global providers.
  - Here you will typically see `AuthProvider`, `QueryProvider` (React Query), `ToastProvider`, etc. imported from `src/providers`.
  - **Backend integration note:** This is where React Query is enabled so your hooks and pages can actually perform backend calls.

- `loading.tsx`
  - Global loading UI shown while the app or certain routes are fetching data on the server.

- `error.tsx`
  - Error boundary for uncaught errors in the app tree.
  - Customize this to show friendly error pages.

- `not-found.tsx`
  - Global 404 page when a route under `app/` doesn’t exist.

---

## Route groups – `(admin)`, `(student)`, `(auth)`, `(caretaker)`, `(landlord)`, `(public)`

These are **route groups**. The parentheses mean they are used for organizing, not for URL path segments.

- `(admin)/`
- `(auth)/`
- `(caretaker)/`
- `(landlord)/`
- `(public)/`
- `(student)/`

Inside each group you will typically find:

- Nested folders like `dashboard/`, `analytics/`, `settings/`, `profile/`, etc.
- A `page.tsx` file per route that defines **the UI and data fetching** for that URL.
- Sometimes a `layout.tsx` to customize navigation, sidebars, or guards for that section.

**Backend integration pattern here:**

- Server components or client components in these pages import hooks or API functions from:
  - `src/lib/api/*` – direct backend calls.
  - `src/hooks/use-*.ts` – hooks that wrap backend logic using React Query.
- Example flow:
  1. URL `/admin/analytics/growth` → handled by `app/(admin)/admin/analytics/growth/page.tsx`.
  2. That page imports `useAnalytics` (from `src/hooks/use-analytics.ts`) or a function from `lib/api/analytics.ts`.
  3. The hook/function calls Axios client in `lib/api/client.ts` with the correct endpoint.

When troubleshooting a **page**:

1. Start at the `page.tsx` for that route.
2. See which hooks/components it uses.
3. Follow those hooks to `src/hooks` and API modules in `src/lib/api`.

---

## `api/` under `app` – Next.js API routes

- `app/api/`
  - Contains serverless **API route handlers**.
  - These run on the server and can:
    - Talk to your backend.
    - Proxy external services.
    - Provide simpler endpoints for the frontend.

Use this when you want:

- To hide backend credentials from the browser.
- To add server-only logic without touching the main backend.

---

## `context/` – App-level React context

- `app/context/`
  - Holds context providers that are specific to the app router (not global providers like in `src/providers`).
  - Example: a subscription or UI context that is used by many routes.

These contexts often rely on:

- `stores/` for state.
- `hooks/` for logic.
- `lib/api/` for backend data.

---

## How to extend or debug routes

- **Add a new page:**
  - Decide which role/area it belongs to: `(student)`, `(admin)`, etc.
  - Create a folder and a `page.tsx` inside the appropriate route group.
  - Import any shared components from `src/components`.
  - Use hooks from `src/hooks` or call `lib/api/*` if you need backend data.

- **Change backend usage for a page:**
  - Find the `page.tsx` for that URL.
  - See which hook/API function it calls.
  - Update the corresponding file in `src/lib/api` or `src/hooks`.

- **Debug data shown on a page:**
  - Start at the `page.tsx`.
  - Follow imports to:
    - Components in `src/components`.
    - Hooks in `src/hooks`.
    - API calls in `src/lib/api`.

This folder is where URL → Page mapping lives. Everything starts here when a user navigates in the browser.

---

## `src/components` – Reusable UI building blocks

# `src/components` – Reusable UI building blocks

This folder holds **reusable React components**. They are mostly “dumb” UI pieces (presentational) or small stateful widgets that can be used across many pages.

If you want to:

- Change how something **looks** globally (buttons, forms, cards, tables, layouts), you usually edit something here.
- Build a UI element that will be reused in multiple pages, you create it here.

---

## Main subfolders

- `admin/` – Components specific to admin views (tables, dashboards, cards for admin-only features).
- `analytics/` – Charts, graphs, and analytics widgets.
- `auth/` – Login/registration/OTP forms and related UI.
- `bookings/` – Booking-related UI components (lists, detail cards). Currently empty but reserved for this domain.
- `hostels/` – Components specific to hostel listing & details (cards, gallery, amenities lists, etc.).
- `inventory/` – UI pieces for room/asset inventory management.
- `layouts/` – Reusable layout shells (sidebars, dashboard layouts, headers/footers shared across pages).
- `messaging/` – Chat or messaging UI (conversations list, message bubbles, input areas).
- `notifications/` – Notification list or dropdown components.
- `payments/` – Payment forms, method selectors, transaction lists.
- `profile/` – User profile forms, avatars, profile summaries.
- `reviews/` – Review cards, rating stars, review lists.
- `roommates/` – Components for roommate matching or lists.
- `shared/` – Shared generic components that are not tied to a single domain (e.g. modals, cards, generic lists).
- `ui/` – Base UI primitives (buttons, inputs, dropdowns, tables, etc.), often built on top of a UI library.

---

## How components connect to backend data

Components themselves usually **do not talk directly to the backend**. Instead, they:

1. Receive data as `props` from pages or hooks.
2. Trigger callbacks when the user interacts (click, submit, etc.).
3. The page or hook then calls `lib/api/*` to actually talk to the backend.

Typical flow:

- `page.tsx` (in `app/`) uses a hook `useBookings` from `src/hooks/use-bookings.ts`.
- The hook calls `lib/api/bookings.ts` to fetch data.
- The `page.tsx` passes that data into a `BookingsTable` component in `components/bookings`.

When troubleshooting a UI issue:

- If **data is correct** but the UI is wrong → look in `src/components`.
- If the **UI is correct** but data is wrong or missing → follow the props back to `app` and `hooks`/`lib/api`.

---

## When to put something in `components`

Use this folder when you create:

- A piece of UI that you might reuse on more than one page.
- A complex layout piece (e.g. dashboard shell) shared by several routes.
- A feature-specific widget (e.g. `HostelCard`, `PaymentSummary`) that is still mostly UI.

Avoid putting:

- Low-level data-fetching logic → keep that in `src/hooks` and `src/lib/api`.
- Global state → keep in `src/stores` or context/providers.

Think of `components` as the **visual layer** that sits on top of hooks, stores, and API modules.

---

## Subfolder details & typical contents

- `admin/`
  - Admin-only visual components:
    - Admin dashboards (cards, stats, tables).
    - Management views (users, hostels, payments).
  - Usually receive data from hooks like `use-analytics`, `use-users`, `use-payments`.

- `analytics/`
  - Charts and graphs for growth, occupancy, revenue, etc.
  - Often used in admin and landlord dashboards.
  - Expect analytics-shaped data from `use-analytics`.

- `auth/`
  - Login/registration forms, OTP inputs, verification steps.
  - Wired to hooks like `use-auth` that call `lib/api/auth.ts`.

- `bookings/`
  - Booking lists, detail views, and status controls (when implemented).
  - Normally consume data from `use-booking` and `use-bookings`.

- `hostels/`
  - Hostel cards, detail sections, galleries, amenities lists.
  - Used on search results and hostel detail pages.
  - Expect data from `use-hostels` and `use-hostel`.

- `inventory/`
  - Tables and forms for managing rooms/assets.
  - Use data from `use-inventory` and related hooks.

- `layouts/`
  - Reusable shells: sidebars, navbars, dashboard frames.
  - Used by pages in `app/(admin)`, `app/(landlord)`, etc.

- `messaging/`
  - Conversation list, message thread, message input box.
  - Combine hooks `use-messages`, `use-websocket`, `use-realtime` and `messaging.store`.

- `notifications/`
  - Notification dropdowns, panels, and list items.
  - Consume data from `use-notifications` and `notifications.store`.

- `payments/`
  - Payment method forms, payment summary cards, transaction tables.
  - Work with `use-payment-methods`, `use-payments`, `use-transfers`.

- `profile/`
  - Profile forms, avatars, and overview cards.
  - Use `use-profile`, `use-auth`, and types from `entities.types.ts`/`api.types.ts`.

- `reviews/`
  - Star rating components, review cards, review lists.
  - Use `use-reviews` and review-related types.

- `roommates/`
  - Match cards and roommate lists.
  - Use `use-roommates`.

- `shared/`
  - Generic shared components (cards, modals, confirmation dialogs, empty states, loaders).
  - Used everywhere; usually do **not** know about domain specifics.

- `ui/`
  - Low-level primitives (Button, Input, Select, Table, Tabs, etc.).
  - Often wrap a UI library and Tailwind classes.
  - All other components build on these primitives.

When you open any file under these folders, expect to see:

- Props typed using `src/types/*`.
- Data passed in from hooks (`src/hooks`) or stores (`src/stores`).
- Little or no direct use of `lib/api` – backend access is kept in hooks.

---

## `src/styles` – Global styling

# `src/styles` – Global styling

This folder contains CSS files that apply **globally** across your app.

Most local or component-specific styles live next to components, but anything that should affect the whole app goes here.

---

## Files

- `globals.css`
  - Imported once (usually in `app/layout.tsx` or a similar root file).
  - Sets up:
    - Base element styles (body, headings, links).
    - TailwindCSS base layers (if using Tailwind) via `@tailwind base; @tailwind components; @tailwind utilities;`.
    - Global resets and typography.
  - If you want to change **default font, background, base spacing, or generic HTML element styling**, edit this file.

- `themes.css`
  - Holds theme-related CSS, e.g.:
    - Color variables (`--color-primary`, etc.).
    - Dark/light theme values.
    - Component-theme tokens.
  - Often used together with a theme provider or class on `<html>`/`<body>`.

---

## How styling fits with the rest of the app

- Global CSS here affects everything under `app/`.
- Components in `src/components` may:
  - Use utility classes (Tailwind) that depend on definitions here.
  - Rely on CSS variables from `themes.css`.

When debugging styling:

- If **one component** looks wrong → check the component’s own CSS/classes.
- If **many components** look wrong in the same way → check `globals.css` or `themes.css`.

This folder is your **starting point** for global visual identity and theming.

---

## `src/lib` – Core application logic, backend access & utilities

# `src/lib` – Core application logic, backend access & utilities

This folder holds most of the **non-UI logic** for your app:

- API client and endpoint modules.
- Auth/token helpers.
- Shared constants.
- React Query setup.
- Utility functions and validation schemas.

If you want to understand **how the frontend talks to your backend**, this is the most important folder.

---

## Structure

- `api/` – All backend HTTP calls.
- `auth/` – Token and user-role helpers.
- `constants/` – Shared enums and configuration values.
- `react-query/` – React Query configuration.
- `utils/` – Generic helper functions (environment, formatting, etc.).
- `validations/` – Form and data validation schemas.

---

## `lib/api` – Backend endpoints

Files here are grouped by feature/domain:

- `analytics.ts`
- `auth.ts`
- `bookings.ts`
- `client.ts`
- `damage-reports.ts`
- `error-mapping.ts`
- `hostels.ts`
- `inventory.ts`
- `messages.ts`
- `notifications.ts`
- `payments.ts`
- `profiles.ts`
- `reviews.ts`
- `roommates.ts`
- `rooms.ts`
- `support.ts`
- `transfers.ts`
- `users.ts`

### Per-file overview (`lib/api/*.ts`)

- `analytics.ts`
  - Functions for loading analytics data (e.g. growth, revenue, usage stats) for admin/landlord dashboards.
  - Typically called from hooks like `use-analytics.ts` and used in analytics components and pages.
  - Talks to backend endpoints under analytics-related paths (for example `/analytics/...`).

- `auth.ts`
  - Handles **all authentication-related API calls**, such as:
    - `login`, `logout`.
    - `registerStudent`, `registerLandlord`, `registerCaretaker`.
    - Email/phone verification, resend OTP.
    - Password reset (`forgotPassword`, `resetPassword`).
    - `getProfile`, `updateProfile`, `completeStudentProfile`, `completeLandlordProfile`.
    - `refreshToken`, `getPermissions`.
  - Uses types from `api.types.ts` and `auth.types.ts`.
  - Works together with `lib/auth` (for storing tokens and roles) and `stores/auth.store.ts`.

- `bookings.ts`
  - Booking-related endpoints:
    - `getBookings` – list bookings, with optional status filters.
    - `getBooking` / `getBookingById` – single booking detail.
    - `createBooking` – create a booking (hostel, room, move-in date, duration, etc.).
    - `checkAvailability` – check if a hostel is available at a given date.
    - `updateBookingStatus` – change booking state (e.g. pending, confirmed, cancelled).
  - Used by hooks: `use-booking.ts`, `use-bookings.ts`.
  - Types: `Booking` from `entities.types.ts`, `ApiResponse` from `api.types.ts`.

- `client.ts`
  - See the detailed section below – this is the **core Axios client and refresh logic**.

- `damage-reports.ts`
  - Endpoints for reporting and managing property/room damage:
    - Create a damage report.
    - List/resolve damage reports.
  - Used by hooks like `use-damage-reports.ts` and any admin/landlord components that manage damages.

- `error-mapping.ts`
  - See separate section below – maps raw Axios/DRF errors into friendly, structured errors.

- `hostels.ts`
  - Endpoints around hostels:
    - `getHostels` – list with filters (search, price range, amenities, sort).
    - `getHostelBySlug` / `getHostel` – detail for a single hostel.
    - `getRelatedHostels` – suggestions based on a hostel.
    - `createHostel` – create a hostel (landlord-facing).
    - `toggleFavoriteHostel` – mark/unmark as favourite (student-facing).
  - Used by hooks: `use-hostel.ts`, `use-hostels.ts` and hostel-related components.

- `inventory.ts`
  - Inventory (rooms/assets) endpoints, such as:
    - Listing inventory items for a hostel.
    - Updating availability or room metadata.
  - Used by `use-inventory.ts` and components under `components/inventory`.

- `messages.ts`
  - Messaging/chat endpoints:
    - Get conversations and messages.
    - Send messages.

- `notifications.ts`
  - Notification-related endpoints:
    - List notifications.
    - Mark as read/unread.

- `payments.ts`
  - Payment endpoints:
    - Create a payment.
    - List payments.
    - Fetch payment methods, etc.

- `profiles.ts`
  - Profile-related endpoints:
    - Fetch and update user profiles.

- `reviews.ts`
  - Review-related endpoints (create, list, update reviews).

- `roommates.ts`
  - Roommate-related endpoints.

- `rooms.ts`
  - Room-related endpoints (list rooms, room details, etc.).

- `support.ts`
  - Support-related endpoints (tickets, enquiries).

- `transfers.ts`
  - Transfer-related endpoints (e.g. money transfers, internal balance moves).

- `users.ts`
  - User-management endpoints (admin/management-focused).

### `client.ts` – Axios instance, interceptors & token refresh

`lib/api/client.ts` is the central place where Axios is configured:

- Creates an Axios instance with a **base URL** derived from `lib/utils/env.ts`.
- Attaches **request interceptors** to:
  - Add `Authorization: Bearer <token>` header when an access token exists.
  - Log or transform outgoing requests.
- Attaches **response interceptors** to:
  - Handle 401 Unauthorized errors.
  - Attempt **token refresh** using a refresh token.
  - Retry the original request if refresh succeeds.
  - Log user out and clear tokens if refresh fails.

This file tightly integrates with:

- `lib/auth/*` for token storage/retrieval.
- `src/stores/auth.store.ts` to sync auth state.
- `lib/utils/env.ts` for base URL and logging.

### `error-mapping.ts`

- Translates raw Axios errors and Django REST Framework-style validation errors into a consistent `ApiErrorResponse` with:
  - `message`, `statusCode`, and a list of `errors`.
- Helpful when you want predictable error messages in the UI.

---

## `lib/auth` – Auth utilities

- Deals with **tokens and roles**:
  - `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens`.
  - `setUserRole`, `getUserRole` (in corresponding files).
- Used by `lib/api/client.ts`, `lib/api/auth.ts`, `stores/auth.store.ts`, and hooks like `use-auth.ts`.

When troubleshooting login/logout or token issues, inspect:

- `lib/auth/*`
- `lib/api/auth.ts`
- `lib/api/client.ts` (interceptors)

---

## `lib/constants` – Shared constants

Contains constants used across the app, such as:

- Role names.
- Status enums (booking statuses, notification types, etc.).
- Predefined options for forms and filters.

Changing a constant here usually changes behavior or labels in multiple places at once.

---

## `lib/react-query` – React Query setup

- Holds things like:
  - Query client configuration.
  - Default cache and refetch policies.
  - Potential helpers for building query keys.
- Integrated with `src/providers/query-provider.tsx`.

If you want to adjust **how aggressive caching is**, or how often data is refetched, you do it here.

---

## `lib/utils` – Helper functions

Examples of utilities you will find here:

- `env.ts`
  - Logic for reading env vars and creating a valid API base URL:
    - Reads from `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_BACKEND_URL`, etc.
    - Falls back to `http://localhost:8000` if not set.
  - Exposes:
    - `getApiUrl()` – returns the chosen base URL.
    - `isValidApiUrl(url)` – validates that url is `http` or `https`.
    - `logger` – safe console wrapper used by the client.
  - Used by `lib/api/client.ts` to configure Axios.

- Other helpers (names may vary):
  - Formatting helpers (dates, currency, strings).
  - Misc helpers shared across hooks and components.

If something feels "too generic" to live in a component or hook, it likely belongs in `utils`.

---

## `lib/validations` – Schemas for forms

- Contains schemas for validating input (e.g. auth forms, profile forms).
- Typically used with form libraries (React Hook Form, etc.) in components/pages.

When the **backend validation rules change**, you should:

1. Update the schema here so the frontend validates in the same way.
2. Ensure corresponding types in `src/types` match the backend.

---

## Summary – How `lib` fits into the app

- **Backend integration starts here**:
  - URLs and HTTP details in `lib/api`.
  - Tokens/roles in `lib/auth`.
  - Base URL & env in `lib/utils/env.ts`.
- Hooks in `src/hooks` build on this.
- Components in `src/components` use hooks.
- Pages in `src/app` tie it all together for each route.

When debugging or extending backend behavior, **start** with the relevant file in `lib/api` and follow the chain outward to hooks and components.

---

## `src/providers` – Global app providers

# `src/providers` – Global app providers

This folder defines **top-level provider components** that wrap your entire React tree (or large parts of it). They plug in global services such as:

- Authentication context.
- React Query client.
- Toast/notification system.

These providers are usually composed together in `app/providers.tsx` and then used in `app/layout.tsx`.

---

- Controls global React Query settings (cache times, refetch behavior, devtools, etc.).
- Hooks in `src/hooks` that use React Query (`useBookings`, `useHostels`, etc.) depend on this being present at the top of the tree.

- `toast-provider.tsx`
  - Provides a context for showing toast notifications.
  - Works with hooks like `use-toast.ts` in `src/hooks` and any UI components showing toasts.

## Files

- `auth-provider.tsx`
  - Wraps children with authentication context/state.
  - Likely reads/writes from:
    - `src/stores/auth.store.ts` for auth state.
    - `src/lib/auth` for tokens and roles.
  - Ensures that pages/components can know the current user, their role, and login status.

- `query-provider.tsx`
  - Sets up the **React Query** client and `QueryClientProvider`.

---

## How this connects to your backend

- **React Query** provider ensures that data-fetching hooks can:
  - Cache results from `lib/api` calls.
  - Perform refetches and manage loading/error states.
- **Auth provider** ensures that:
  - User info and tokens are available across the app.
  - Components can react to login/logout events.

Together with `lib/api/client.ts`, these providers enable a smooth flow:

1. `client.ts` knows how to call the backend and handle tokens.
2. `auth-provider.tsx` knows who the user is and what they can do.
3. `query-provider.tsx` lets hooks reuse and manage data.

If data or auth seem broken across the whole app, check these providers and `app/providers.tsx`.

---

## When to modify this folder

- Add a new provider when you introduce a **global service**, such as:
  - A new analytics provider.
  - A feature flag context.
  - A theme or localization provider (if not already defined elsewhere).

- Edit an existing provider when:
  - Changing how auth state is persisted or derived.
  - Updating React Query settings (retry behavior, stale times, etc.).

This folder is about **wiring up global behavior**, not feature-specific logic.

---

## `src/stores` – Global state (Zustand or similar)

# `src/stores` – Global state (Zustand or similar)

This folder contains **global state stores** used across the app. They hold data and actions that many parts of the UI need, without drilling props through every component.

Stores are typically implemented with a library like **Zustand**.

---

## Files

- `auth.store.ts`
  - Manages authentication-related state, such as:
    - Current user information.
    - Access/refresh tokens (or references to them).
    - Login/logout actions.
  - Works closely with:
    - `src/lib/auth` for token handling.
    - `src/lib/api/client.ts` for logout/token refresh.
    - `src/hooks/use-auth.ts` and maybe `AuthProvider`.

- `booking.store.ts`
  - Holds UI state and possibly selected booking info.
  - Useful for coordinating booking steps across multiple components.

- `filters.store.ts`
  - Central store for filters used in listings (e.g. hostels, bookings, analytics).
  - Example: search text, price ranges, selected amenities, sort options.

- `messaging.store.ts`
  - Global messaging state (selected conversation, unread counts, etc.).

- `notifications.store.ts`
  - Notification list and read/unread state.
  - Works with `lib/api/notifications.ts` and hooks like `use-notifications.ts`.

- `ui.store.ts`
  - Generic UI state:
    - Sidebars open/closed.
    - Theme toggles (if not elsewhere).
    - Dialog/modals open/closed.

- `index.ts`
  - Re-exports stores for simpler imports.

---

## How stores connect to backend and UI

Stores themselves usually **do not call the backend directly**. Instead, they:

- Are updated by:
  - Hooks in `src/hooks` after fetching from `lib/api`.
  - Providers in `src/providers` (e.g. `auth-provider` writing user info).
- Are read by:
  - Components and pages across `src/app` and `src/components`.

Typical pattern:

1. `useBookings` hook fetches bookings from `lib/api/bookings.ts`.
2. The hook (or a component) stores some derived state in `booking.store.ts`.
3. Multiple components read from `booking.store.ts` to stay in sync.

---

## When to use or edit a store

- Use a store when:
  - Many unrelated components need the same state.
  - The state should persist while navigating between pages.

- Edit a store when:
  - You add new UI state that should be shared globally.
  - Backend responses change and you store different fields.

**Troubleshooting tip:**

- If UI isn’t updating as expected while data is correct at the API level, check:
  - The relevant store file in `src/stores`.
  - The hook/provider that writes to that store (`src/hooks` or `src/providers`).

These files are the **single source of truth** for shared state in your app.

---

## `src/types` – Shared TypeScript types & models

# `src/types` – Shared TypeScript types & models

This folder defines the **TypeScript types** used across your app. They describe the shape of:

- Data coming from your backend (API responses).
- Data you send to the backend (request payloads).
- Core entities (Hostel, Booking, User, etc.).
- Forms and UI-related structures.

If you understand this folder, you understand **what data your app expects** from the backend.

---

## Files

- `api.types.ts`
  - Types for API-level concepts:
    - Request and response payloads for auth, profiles, permissions, etc.
    - Generic `ApiResponse<T>` shapes.
  - Used heavily in `src/lib/api/*.ts` to type Axios calls.
  - Example concepts:
    - `AuthResponse` – what the backend returns on successful login/register.
    - `ProfileResponse` – structure of `/accounts/me/`.
    - `PermissionsResponse` – list of permission strings used in guards.

- `auth.types.ts`
  - Types related to authentication and authorization, e.g.:
    - `LoginRequest`, `AuthResponse`.
    - Role enums.
    - Profile-related shapes that are auth-specific.
  - Maps 1:1 to auth endpoints in `lib/api/auth.ts`.

- `entities.types.ts`
  - Core domain entities like:
    - `Hostel`, `Room`, `Booking`, `User`, `Message`, etc.
  - These represent your **backend models** from a frontend perspective.
  - Example mappings:
    - `Hostel` mirrors the hostel model: id, name, slug, address, price, amenities, rating, etc.
    - `Booking` mirrors the booking model: id, hostel, room, move-in date, duration, status, totals.
    - `User` represents the user model: id, email, role, isActive, isVerified, timestamps, etc.

- `forms.types.ts`
  - Types for form data shapes (what your forms manage locally).
  - May differ slightly from API types if the UI groups or structures fields differently.

- `ui.types.ts`
  - Types for UI-related concepts:
    - Option lists, table row models, component props helpers.

- `index.ts`
  - Re-exports types for easier imports (`import { X } from '@/types'`).

---

## How this connects to the backend

- API modules in `src/lib/api` import types from here to ensure calls match the backend contract.
- Hooks in `src/hooks` use these types so that components receive correctly typed data.

When the **backend changes** (e.g. new field, renamed field):

1. Update the relevant type here (e.g. `Booking` in `entities.types.ts`).
2. Update any API functions in `src/lib/api` that use that type.
3. Fix any TypeScript errors in hooks/components that rely on the old shape.

This gives you a clear, type-safe map from **backend models → frontend usage**.

---

## Troubleshooting tips

- If TypeScript complains about mismatched fields after a backend change, the fix almost always starts here.
- Use these files as a **reference** when building new features:
  - Check what a `Hostel` or `Booking` really looks like.
  - Ensure your forms and components expect the same fields as the backend.

Understanding `src/types` makes it much easier to work independently from AI, because you can see exactly what data structures your app uses.
# RUMI Frontend - State Management Documentation

> **Last Updated:** December 6, 2025  
> **Location:** `frontend/src/stores/` and `frontend/src/store/`  
> **Library:** Zustand v4

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Store Patterns](#store-patterns)
3. [Store Reference](#store-reference)
4. [Persistence Strategy](#persistence-strategy)
5. [Best Practices](#best-practices)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Components                            │
│                            │                                     │
│                      useXxxStore()                               │
│                            ↓                                     │
├─────────────────────────────────────────────────────────────────┤
│                      Zustand Stores                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  Auth   │  │ Booking │  │ Filters │  │   UI    │  ...        │
│  │  Store  │  │  Store  │  │  Store  │  │  Store  │             │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘             │
│       │            │            │            │                   │
├───────┴────────────┴────────────┴────────────┴───────────────────┤
│                   Zustand Middleware                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                          │
│  │ persist │  │devtools │  │  immer  │                          │
│  └─────────┘  └─────────┘  └─────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      localStorage                                │
│           (Persisted state survives page refresh)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Store Patterns

### 1. Basic Store Pattern
```typescript
import { create } from 'zustand';

interface State {
  count: number;
  increment: () => void;
}

export const useCountStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 2. Persisted Store Pattern
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFiltersStore = create<State>()(
  persist(
    (set) => ({
      filters: {},
      setFilters: (f) => set({ filters: f }),
    }),
    {
      name: 'filters-storage',
      partialize: (state) => ({ filters: state.filters }), // Only persist this
    }
  )
);
```

### 3. Store with Selectors
```typescript
// Define store
export const useAuthStore = create<AuthState>()(...);

// Export optimized selectors
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUserRole = () => useAuthStore((s) => s.user?.role);
```

---

## Store Reference

### Authentication & User

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| `useAuthStore` | `auth.store.ts` | Authentication, tokens, user/profile | ✅ (partial) |
| `useStudentStore` | `store/useStudentStore.ts` | Favorites, compare list | ✅ |

### Dashboard Stores (Role-Specific)

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| `useAdminStore` | `admin.store.ts` | Admin filters, selections, view mode | ✅ |
| `useCaretakerStore` | `caretaker.store.ts` | Tenant/maintenance filters, check-in/out | ✅ (partial) |
| `useTechSupportStore` | `tech-support.store.ts` | Tech admin data (mock data) | ❌ |

### Booking & Payments

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| `useBookingStore` | `booking.store.ts` | Current active booking | ❌ |
| `useBookingStore` | `use-booking-store.ts` | Multi-step booking wizard | ✅ (partial) |
| `useTransferStore` | `transfer.store.ts` | Room transfer wizard | ✅ (partial) |

### Hostel Features

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| `useFiltersStore` | `filters.store.ts` | Hostel search filters | ✅ |
| `useCompareStore` | `compare.store.ts` | Hostel comparison (max 3) | ✅ |
| `useReviewStore` | `review.store.ts` | Hostel reviews | ✅ |
| `useInventoryStore` | `store/useInventoryStore.ts` | Check-in/out inventory reports | ❌ |

### Communication

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| `useMessagingStore` | `messaging.store.ts` | Chat conversations (mock) | ❌ |
| `useNotificationsStore` | `notifications.store.ts` | Local notifications | ❌ |

### UI State

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| `useUiStore` | `ui.store.ts` | Theme, sidebar state | ❌ |

---

## Persistence Strategy

### Storage Keys
| Key | Store | Data Persisted |
|-----|-------|----------------|
| `rumi-auth-storage` | auth.store | user, profile (NOT tokens) |
| `student-storage` | useStudentStore | favorites, compareList |
| `admin-storage` | useAdminStore | filters, sidebar, viewMode |
| `caretaker-storage` | useCaretakerStore | filters, sidebar, viewMode |
| `filters-storage` | useFiltersStore | priceRange, amenities, sort |
| `compare-store` | useCompareStore | compareList |
| `review-store` | useReviewStore | reviews |
| `transfer-storage` | useTransferStore | filters, draftTransfer, step |
| `rumi-booking-storage` | use-booking-store | selection state only |

### Partial Persistence
Some stores use `partialize` to only persist specific fields:
```typescript
partialize: (state) => ({
  filters: state.filters,  // ✅ Persisted
  // loading: state.loading  // ❌ Not persisted
})
```

---

## Best Practices

### 1. Use Selectors for Performance
```typescript
// ❌ Bad - re-renders on any state change
const store = useAuthStore();
const user = store.user;

// ✅ Good - only re-renders when user changes
const user = useAuthStore((s) => s.user);
```

### 2. Access Store Outside React
```typescript
// Get current state
const user = useAuthStore.getState().user;

// Call action
useAuthStore.getState().logout();
```

### 3. Reset Stores on Logout
```typescript
// Clear all relevant stores
useAuthStore.getState().logout();
useBookingStore.getState().resetBooking();
useTransferStore.getState().reset();
```

### 4. Optimistic Updates
```typescript
// 1. Update UI immediately
set({ items: [...items, newItem] });

// 2. Sync with backend
try {
  await api.createItem(newItem);
} catch {
  // 3. Rollback on error
  set({ items: items.filter(i => i.id !== newItem.id) });
}
```

---

## Mock Data Stores

The following stores currently use mock data:

| Store | Status |
|-------|--------|
| `useMessagingStore` | Uses `@/lib/mock/mock-messaging` |
| `useTechSupportStore` | Uses setTimeout mock responses |
| `useReviewStore` | Uses `reviewApi` with mock data |

---

## Summary

- **15 Zustand stores** manage frontend state
- **9 stores** persist to localStorage
- **Selectors** optimize re-render performance
- **Partial persistence** prevents persisting sensitive/temporary data
- Key patterns: auth tokens in cookies (not localStorage), optimistic updates for UX
# Backend-Frontend Integration Walkthrough

This document outlines the professional integration of the RUMI backend API with the frontend application.

## 1. Configuration

### Environment Variables
The project includes a comprehensive `.env.example` file with all necessary configurations.
Copy this file to `.env.local` and populate the values:

```bash
cp .env.example .env.local
```

Key configurations include:
- **API**: `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000/api/v1`)
- **Auth**: `NEXT_PUBLIC_AUTH_REFRESH_PATH`
- **Features**: `NEXT_PUBLIC_ENABLE_ANALYTICS`, `NEXT_PUBLIC_ENABLE_NOTIFICATIONS`
- **External Services**: Paystack, Africa's Talking, etc. (for backend, but good to know)


## 2. API Client Architecture

The integration uses a robust `Axios` client (`src/lib/api/client.ts`) with:
- **Automatic Token Injection**: Access tokens are automatically added to headers.
- **Seamless Token Refresh**: 401 errors trigger a transparent token refresh flow.
- **Request Queueing**: Failed requests during refresh are queued and retried.
- **Type-Safe Responses**: All API calls use `ApiResponse<T>` for consistent typing.

## 3. Core Modules Integration

### Authentication (`src/lib/api/auth.ts`)
- Login, Register (Student/Landlord/Caretaker)
- Password Reset Flow
- Profile Management
- Token Refresh

### Hostels & Rooms (`src/lib/api/hostels.ts`, `rooms.ts`)
- Hostel Search & Details
- Room Availability Checks
- Room Booking & Reservation
- Inventory Management

### Payments & Subscriptions (`src/lib/api/payments.ts`, `subscriptions.ts`)
- M-Pesa & Bank Payment Initiation
- Recurring Payment Management
- Subscription Plan Upgrades
- Transaction History & Receipts

### Notifications (`src/lib/api/notifications.ts`)
- Real-time Notification Listing
- Read Status Management
- Preference Settings

## 4. Usage Examples

### Using Custom Hooks

#### Fetching Hostels
```typescript
import { useHostels } from '@/hooks/use-hostels';

const { data: hostels, isLoading } = useHostels({ 
  search: 'Nairobi', 
  minPrice: 5000 
});
```

#### Making a Booking
```typescript
import { useCreateBooking } from '@/hooks/use-bookings';

const { mutate: bookRoom } = useCreateBooking();

const handleBook = () => {
  bookRoom({
    hostelId: 'hostel-123',
    roomId: 'room-456',
    moveInDate: new Date(),
    durationMonths: 6
  });
};
```

#### Handling Payments
```typescript
import { useInitiatePayment } from '@/hooks/use-payments';

const { mutate: pay } = useInitiatePayment();

const handlePayment = () => {
  pay({
    bookingId: 'booking-789',
    method: 'mpesa'
  });
};
```

## 5. Verification Steps

1. **Start Backend**: Ensure Django server is running at `http://localhost:8000`.
2. **Start Frontend**: Run `npm run dev`.
3. **Check Console**: Verify "Initializing API client..." message.
4. **Test Login**: Log in with a user account and check Application > Cookies for tokens.
5. **Verify Data**: Navigate to Hostels page and verify data loads from backend.

## 6. Next Steps
- Implement UI components for the new Admin and Public content features.
- Add comprehensive unit tests for the new hooks.
