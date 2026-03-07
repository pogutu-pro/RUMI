# STRUCTURE.md — Directory Structure

## Monorepo Layout
```
RUMI/
├── Backend/                    # Django REST API
├── frontend/                   # Next.js frontend
├── .github/workflows/          # CI (GitHub Actions)
├── .planning/                  # GSD planning documents
├── CLAUDE.MD                   # Claude Code project instructions
└── README.md
```

## Backend Structure
```
Backend/
├── rumi/                       # Django project config
│   ├── settings/               # Settings (base, dev, production)
│   ├── urls.py                 # Root URL config
│   ├── wsgi.py
│   ├── asgi.py                 # ASGI entry (WebSockets)
│   └── celery.py               # Celery app
│
├── accounts/                   # Users, auth, profiles, subscriptions
│   ├── models.py               # User, StudentProfile, LandlordProfile, CaretakerProfile
│   ├── subscription_models.py  # Subscription tiers
│   ├── roommate_models.py      # RoommateRequest, RoommateMatch
│   ├── views.py                # Auth views
│   ├── onboarding_views.py     # Onboarding flow
│   ├── profile_views.py        # Profile management
│   ├── subscription_views.py   # Subscription management
│   ├── serializers.py
│   ├── consumers.py            # WebSocket consumers
│   ├── tasks.py                # Async tasks
│   ├── services.py             # Business logic
│   ├── logic.py                # Additional logic
│   ├── permissions.py          # DRF permissions
│   ├── authentication.py       # Custom auth
│   ├── urls.py
│   └── ml/
│       └── compatibility_scorer.py  # Roommate ML scoring
│
├── hostels/                    # Hostel/room/bed management
│   ├── models.py               # Hostel, Room, Booking, Review, Favorite, Waitlist
│   ├── bed_models.py           # Bed, occupancy tracking
│   ├── lifecycle_services.py   # Bed lifecycle (move-in/out, billing triggers)
│   ├── compatibility_utils.py  # Hostel-student compatibility
│   ├── geo_utils.py            # Distance calculations
│   ├── endpoints/
│   │   └── bed_views.py        # Bed-specific API views
│   └── ...standard files
│
├── payments/                   # Payment processing
│   ├── mpesa_api.py            # M-Pesa Daraja API integration
│   └── ...standard files
│
├── notifications/              # SMS, email, in-app
│   ├── tasks.py                # Celery notification tasks (SMS via Africa's Talking)
│   └── ...standard files
│
├── landlord_api/               # Landlord-specific API
├── student_api/                # Student-specific API
├── caretaker_operations/       # Caretaker daily ops
│   ├── views.py
│   └── additional_views.py
│
├── admin_api/                  # Platform admin
│   ├── platform_admin_urls.py
│   └── super_admin_urls.py
├── admin_endpoints/            # Legacy admin (to be deprecated)
├── support_api/                # Tech support dashboard
│
├── analytics/                  # Occupancy and revenue analytics
├── roommate_system/            # Roommate matching
├── recommendations/            # Hostel recommendations
├── monitoring/                 # Health checks, Prometheus
├── home/                       # Public/homepage endpoints
├── core/                       # Shared base views
│
├── fixtures/                   # Test data (JSON)
├── media/                      # Uploaded files (receipts, images)
├── logs/                       # Application logs
├── docs/ & Docs/               # Developer documentation (two dirs, different cases)
├── .env                        # Backend environment variables
└── manage.py
```

## Frontend Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── providers.tsx       # Global providers (auth, toast)
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── onboarding/
│   │   │   ├── verify-email/
│   │   │   ├── verify-phone/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (public)/           # Public pages
│   │   │   ├── hostels/        # Hostel listings & detail
│   │   │   ├── about/
│   │   │   ├── pricing/
│   │   │   ├── blog/
│   │   │   └── ...
│   │   ├── (student)/          # Student dashboard (protected)
│   │   │   └── student/
│   │   ├── (landlord)/         # Landlord dashboard (protected)
│   │   │   └── landlord/
│   │   ├── (caretaker)/        # Caretaker dashboard (protected)
│   │   │   └── caretaker/
│   │   ├── (admin)/            # Admin dashboard (protected)
│   │   │   └── admin/
│   │   ├── tech-support/       # Tech support dashboard
│   │   └── verify-receipt/     # Receipt verification
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-websocket.ts    # WebSocket hook
│   │   ├── use-async.ts
│   │   ├── use-debounce.ts
│   │   └── ...
│   │
│   ├── stores/                 # Zustand state management
│   │   ├── app.store.ts
│   │   └── ui.store.ts
│   │
│   ├── providers/              # React context providers
│   │   ├── auth-provider.tsx
│   │   └── toast-provider.tsx
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── entities.types.ts
│   │   ├── caretaker.types.ts
│   │   └── ...
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── logger.ts
│   │   └── receipt-api.ts
│   │
│   ├── mocks/                  # MSW mock handlers (for testing)
│   │   ├── handlers.ts
│   │   └── server.ts
│   │
│   ├── styles/                 # Global CSS
│   └── __tests__/              # Jest test files
│
├── cypress/                    # E2E tests (Cypress)
│   └── e2e/
│       ├── booking_flow.cy.ts
│       └── home.cy.ts
│
├── public/                     # Static assets
├── middleware.ts               # Next.js middleware (route protection)
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.cjs
└── package.json
```

## Naming Conventions

### Backend
- **Apps**: `snake_case` (e.g., `landlord_api`, `caretaker_operations`)
- **Models**: `PascalCase` (e.g., `LandlordProfile`, `RoommateMatch`)
- **Views**: `PascalCase` for class-based, `snake_case` for functions
- **URLs**: `kebab-case` in URL paths (e.g., `/api/v1/landlord/`)
- **Files**: `snake_case` (e.g., `subscription_views.py`, `bed_models.py`)

### Frontend
- **Route dirs**: `kebab-case` (e.g., `forgot-password/`, `verify-email/`)
- **Components**: `PascalCase` files and components
- **Hooks**: `use-kebab-case.ts`
- **Types**: `kebab.types.ts` (e.g., `auth.types.ts`)
- **Stores**: `name.store.ts`

## Key File Locations
| Purpose | Path |
|---|---|
| Django URL root | `Backend/rumi/urls.py` |
| Django settings | `Backend/rumi/settings/` |
| Celery config | `Backend/rumi/celery.py` |
| M-Pesa integration | `Backend/payments/mpesa_api.py` |
| Bed billing | `Backend/hostels/lifecycle_services.py` |
| WebSocket consumers | `Backend/accounts/consumers.py` |
| Next.js root layout | `frontend/src/app/layout.tsx` |
| Auth middleware | `frontend/middleware.ts` |
| Global providers | `frontend/src/app/providers.tsx` |
| API types | `frontend/src/types/api.types.ts` |
| State management | `frontend/src/stores/` |
| CI pipeline | `.github/workflows/tests.yml` |
