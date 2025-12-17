# Caretaker API Documentation
This document outlines the API endpoints used in the Caretaker Dashboard, covering authentication, operations, property management, and security logs. It highlights discrepancies between the `SETUP_GUIDE.md` and the actual frontend implementation (`src/features/caretaker/api/*.ts`).

## 1. Authentication
**Base URL:** `/auth`

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Login | `POST` | `/login` | Authenticate caretaker and receive JWT. |
| Logout | `POST` | `/logout` | Invalidate current session. |
| User Profile | `GET` | `/users/profile` | **[MISMATCH]** Setup guide implies `/me` or `/profile`, but frontend uses `/users/profile` to get consistent user object including role. |

## 2. Dashboard & Metrics
**Base URL:** `/caretaker`

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Dashboard Stats | `GET` | `/stats` | **[NEW]** Returns aggregated stats for KPI cards (Check-ins, Approvals, Issues). Not listed in original Setup Guide. |
| Maintenance Stats | `GET` | `/maintenance/stats` | Returns weekly breakdown of new vs. resolved issues. |

## 3. Operations & Tenants
**Base URL:** `/caretaker`

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Pending Approvals| `GET` | `/approvals` | List users waiting for verification. |
| Check-Ins | `GET` | `/check-ins` | List students scheduled to check in today. |
| Check-Outs | `GET` | `/check-outs` | List students scheduled to check out today. |
| Tenants List | `GET` | `/tenants` | Fetch all active tenants associated with the caretaker's hostel. |

## 4. Property Management
**Base URL:** `/caretaker`

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Room Management | `GET` | `/rooms` | List all rooms and their occupancy status. |
| Maintenance Logs | `GET` | `/maintenance` | List all maintenance tickets. |
| Create Ticket | `POST` | `/maintenance` | Report a new maintenance issue. |
| **Damage Reports** | `POST` | `/damage-reports` | **[NEW]** Submit damage report (replacing generic maintenance ticket for damages). Payload: `{ bookingId, items: [], notes }`. |

## 5. Security Logs
**Base URL:** `/caretaker/security`

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Visitor Logs | `GET` | `/visitors` | List active and past visitors. |
| Log Visitor | `POST` | `/visitors` | Check-in a new visitor. |
| Checkout Visitor | `PATCH` | `/visitors/{id}/checkout`| Mark visitor as departed. |
| Night Checks | `POST` | `/night-checks` | Submit nightly security round report. |

## 6. Communication
**Base URL:** `/caretaker/messages`

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| List Threads | `GET` | `/threads` | Get all active conversation threads. |
| Get Messages | `GET` | `/threads/{id}` | Fetch messages for a specific thread. |
| Send Message | `POST` | `/send` | Send a new message to a student/admin. |

---

## Discrepancies & Notes
1.  **User Profile Endpoint**: The frontend heavily relies on `/users/profile` for role-based logic, whereas early docs suggested a simpler `/profile`. The backend must ensure `/users/profile` returns the full `User` object with `role`, `hostelId`, and `permissions`.
2.  **Damage Reports**: The `CreateDamageReportPayload` requires a `bookingId` to link damage to a specific student stay. This differs from generic maintenance tickets which only require a room ID.
3.  **Dashboard Stats**: The `/caretaker/stats` endpoint is critical for the "Today's Overview" section. If missing, the dashboard will show empty states or skeletons indefinitely.
