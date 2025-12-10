# API & Store Documentation

This file centralizes documentation that was previously stored as large README
blocks at the bottoms of TypeScript files in `src/stores` and `src/lib/api`.

## Stores

- `src/stores/auth.store.ts` — Authentication store
- `src/stores/booking.store.ts` — Simple booking state
- `src/stores/admin.store.ts` — Admin dashboard filters & UI
- `src/stores/caretaker.store.ts` — Caretaker dashboard filters & workflow
- `src/stores/filters.store.ts` — Hostel search filters
- `src/stores/messaging.store.ts` — Messaging state
- `src/stores/notifications.store.ts` — Local notifications
- `src/stores/review.store.ts` — Hostel reviews store
- `src/stores/tech-support.store.ts` — Tech-support admin dashboard data
- `src/stores/transfer.store.ts` — Room transfer workflow
- `src/stores/ui.store.ts` — Theme & sidebar state
- `src/stores/use-booking-store.ts` — Booking flow wizard
- `src/stores/useInventoryStore.ts` — Inventory reports workflow
- `src/stores/useStudentStore.ts` — Favorites & comparison lists

## API Modules

- `src/lib/api/client.ts` — Core Axios client & interceptors
- `src/lib/api/auth.ts` — Authentication API
- `src/lib/api/admin.ts` — Admin user/caretaker/landlord APIs
- `src/lib/api/analytics.ts` — Analytics dashboards
- `src/lib/api/bookings.ts` — Bookings APIs
- `src/lib/api/caretaker.ts` — Caretaker operations
- `src/lib/api/damage-reports.ts` — Damage reports
- `src/lib/api/error-mapping.ts` — Error mapping utilities
- `src/lib/api/hostels.ts` — Hostels listing/detail/favorites
- `src/lib/api/inventory.ts` — Inventory reports (check-in/out)
- `src/lib/api/inventory-api.ts` — Simplified inventory API
- `src/lib/api/landlord-caretakers.ts` — Landlord-caretaker management
- `src/lib/api/messages.ts` — In-app messaging
- `src/lib/api/notifications.ts` — Notifications and preferences
- `src/lib/api/payments.ts` — Payments, recurring, methods, fees
- `src/lib/api/profiles.ts` — Profile management for all roles
- `src/lib/api/public.ts` — Public-facing content (landing, FAQ, blog)
- `src/lib/api/reviews.ts` — Reviews (currently mock)
- `src/lib/api/roommates.ts` — Roommate matching (mostly stubbed)
- `src/lib/api/rooms.ts` — Rooms CRUD, book/reserve
- `src/lib/api/student-dashboard.ts` — Student dashboard aggregation
- `src/lib/api/subscriptions.ts` — Subscription plans & features
- `src/lib/api/support.ts` — Support tickets
- `src/lib/api/tech-support.ts` — Tech support admin APIs
- `src/lib/api/transfers.ts` — Room transfers (mock)
- `src/lib/api/users.ts` — Basic user management (mock)
