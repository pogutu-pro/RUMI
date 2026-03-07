# CONCERNS.md — Technical Concerns & Debt

## Technical Debt

### Legacy Admin Layer (High Priority)
- `admin_endpoints/` app is explicitly marked "Legacy - to be deprecated" in `rumi/urls.py:102`
- `support_api/urls.py` has "Legacy User/Payment Support Operations (keeping for backward compatibility)"
- `payments/models.py:240` — "Keeping Booking primarily for legacy/deposit logic"
- `payments/models.py:331` — "Legacy / Auxiliary Models (Kept/Updated)" section
- `admin_api/platform_admin_urls.py` imports from `admin_endpoints` views — creates tight coupling to the deprecated layer
- **Risk**: Dual URL registration (`/api/v1/admin/` and `/api/v1/admin-endpoints/`) for same functionality

### Stub/Placeholder Views
- `Backend/payments/stubs_views.py` — stub views for payment verification, paybill allocation, unmatched payment rejection with `suggested_match: None` placeholder
- `Backend/caretaker_operations/views.py:853` — `maintenance_requests = []  # Placeholder - would come from actual model`
- `Backend/caretaker_operations/views.py:990` — "we'll create a damage report as placeholder"
- `Backend/caretaker_operations/additional_views.py:58` — "This is just placeholder logic"
- `Backend/third_party/weather.py` — entire file is a placeholder for weather API integration

### Incomplete Integrations
- **AWS S3**: `boto3` + `django-storages` in requirements but "not yet fully wired in settings" — media files likely stored locally in production
- **Weather API**: Keys configured but implementation is a placeholder stub
- **Notification service**: `payments/subscription_billing_engine.py:255` — `# TODO: Implement notification service`
- **Slugs**: `hostels/serializers.py` — `slug = serializers.CharField(source='id', ...)  # Fallback since we don't have slugs yet`

### Duplicate Documentation Directories
- Two docs directories in Backend: `Backend/docs/` (lowercase) and `Backend/Docs/` (capitalized)
- Content appears split across both — inconsistent, confusing

### Migration Volume
- `hostels/` — 26 migrations (highest in project), indicating rapid schema evolution
- `payments/` — 24 migrations, also high churn
- `accounts/` — 15 migrations
- High migration count increases risk of merge conflicts and deploy complexity

---

## Test Coverage Gaps (Critical)

### Backend
- Most apps have only minimal `tests.py` stubs
- **No tests** for: payments (M-Pesa, Paystack flows), notifications, analytics, roommate matching, recommendations, caretaker operations, landlord API
- `admin_endpoints/tests/` has only `test_payment_stats.py`
- Tests use hardcoded URLs (not `reverse()`) — brittle to URL changes

### Frontend
- Only one real test: `src/__tests__/sample.test.tsx` (renders `<div>Hello RUMI</div>`)
- E2E coverage: only `home.cy.ts` and `booking_flow.cy.ts`
- **673 uses of TypeScript `any`** across `src/` — significant type safety gap
- `@ts-ignore` used in sample test to suppress type conflicts

---

## Security Concerns

### Seed Data with Weak Passwords
- `comprehensive_seed.py` and `seed_all_data.py` create users with passwords: `admin123`, `tech123`, `student123`, `landlord123`, `caretaker123`
- **Risk**: If seed scripts are accidentally run in production, these predictable accounts exist

### Dual venv Directories
- Both `Backend/venv/` and `Backend/venv_new/` tracked in repo (untracked in git but present on disk)
- Indicates messy dependency management history

---

## Performance Concerns

### Potential N+1 Queries
- Hostel serializer uses `SerializerMethodField` for nested data — risk of N+1 without `select_related`/`prefetch_related`
- `HostelAmenitySerializer` nested inside `HostelSerializer` in a `many=True` context

### Migration Debt
- 26 migrations in `hostels/` — squashing migrations has not been done; startup time increases with each migration

---

## Fragile Areas

### WebSocket Authentication
- `accounts/consumers.py` implements WebSocket consumers — authentication at WebSocket layer needs careful review for session handling

### M-Pesa Webhooks
- Production M-Pesa C2B webhooks require publicly accessible URLs — local dev/testing requires ngrok or similar; easy to misconfigure

### Dual Auth Token Storage
- JWT tokens stored in cookies with names `rumi_access_token` and `rumi_refresh_token` (via `accounts/views.py:517-528`)
- Need to verify CSRF protection and `httpOnly` flags are properly set

### Payments Stub Views in Production
- `payments/stubs_views.py` is registered in URL config — if exposed, returns stub/mock responses for real payment flows

---

## Dependency Health

### Outdated Versions (Approximate, based on package names)
- Django 4.2.7 — LTS (supported until 2026), but 5.x available
- React 19 + Next.js 16 — very recent, cutting edge; may have ecosystem compatibility issues
- `paystackapi==2.1.3` — third-party; maintenance status unknown

### Dependency Organization
- `Backend/third_party/` directory exists but only contains a placeholder `weather.py` — not a real package structure

---

## Architecture Concerns

### Docs Sprawl
- Extensive markdown documentation in `Backend/docs/` and `Backend/Docs/` covering M-Pesa setup, API guides, debugging summaries — suggests frequent debugging and integration pain
- `LANDLORD_DASHBOARD_INTEGRATION_ISSUES.md`, `TROUBLESHOOTING_DATA_VISIBILITY.md`, `DEBUGGING_SUMMARY.md` indicate recurring integration friction

### Admin Endpoint Duplication
- `admin_api/` and `admin_endpoints/` serve overlapping purposes with cross-imports
- `admin_api/platform_admin_urls.py` and `admin_api/super_admin_urls.py` both import from `admin_endpoints.views`
