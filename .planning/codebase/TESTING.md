# TESTING.md — Testing Patterns

## Backend Testing

### Framework
- **pytest** — test runner
- **factory-boy** — test data factories
- **Django TestCase** — base test class
- **DRF APIClient** — API request simulation

### Test Location
- Each app has a `tests.py` file in its root directory
- `admin_endpoints/tests/test_payment_stats.py` — subdirectory structure in some apps
- No centralized test runner config; `pytest.ini` or `setup.cfg` likely configures pytest

### Pattern
```python
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ENABLE_RATE_LIMITING=False,
)
class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/...'

    def test_something(self):
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 200)
```

### Key Patterns
- `@override_settings` always used to disable rate limiting and use memory cache
- URL strings hardcoded in `setUp()` (not using `reverse()`)
- `User.objects.create_user()` for test user creation
- `self.assertIn(response.status_code, [200, 201])` — flexible status checks
- Tests cover: registration, login, duplicate detection, auth flows

### How to Run (Backend)
```bash
cd Backend
python -m pytest
# or
python manage.py test
```

---

## Frontend Testing

### Frameworks
- **Jest** — unit/component test runner
- **React Testing Library** (`@testing-library/react`) — component rendering
- **MSW (Mock Service Worker)** — API mocking in tests
- **Cypress** — E2E browser tests
- **Playwright** — additional E2E tests

### Test Location
- Unit tests: `src/__tests__/` (Jest)
- E2E tests: `cypress/e2e/` (Cypress)
- MSW handlers: `src/mocks/handlers.ts`, `src/mocks/server.ts`

### Jest Config (`jest.config.cjs`)
- `testEnvironment: 'jsdom'`
- Setup file: `jest.setup.ts` (imports `@testing-library/jest-dom`)
- Module alias: `@/` → `src/`
- Test match: `**/*.test.ts`, `**/*.test.tsx`
- Coverage: `src/**/*.{js,jsx,ts,tsx}` (excludes types, index files)
- `transformIgnorePatterns` configured for MSW compatibility

### Pattern (Jest)
```typescript
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
    it('renders correctly', () => {
        render(<Component />);
        expect(screen.getByText('...')).toBeDefined();
    });
});
```

### Pattern (Cypress E2E)
```typescript
// cypress/e2e/booking_flow.cy.ts
// Tests full booking user journey
```

### Mocking
- MSW for API mocking — `src/mocks/handlers.ts` defines request handlers
- `src/mocks/server.ts` sets up Node.js server for Jest

### How to Run (Frontend)
```bash
cd frontend
pnpm test           # Jest unit tests
pnpm run cypress    # Cypress E2E (interactive)
# or
./run_frontend_tests.sh
```

---

## CI (GitHub Actions)
- Config: `.github/workflows/tests.yml`
- Runs backend pytest + frontend Jest on push/PR
- Redis service included (needed for Channels + Celery in tests)
- Backend uses env vars set in CI workflow

## Coverage Gaps (Known)
- Most apps have only `tests.py` stubs or minimal tests
- Frontend has a single `sample.test.tsx` — coverage is very low
- E2E tests exist for `home.cy.ts` and `booking_flow.cy.ts` only
- No tests for: payments, notifications, analytics, roommate matching, recommendations
