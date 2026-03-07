# CONVENTIONS.md — Code Conventions

## Backend (Python/Django)

### Code Style
- **Formatter**: black (line length default ~88)
- **Linter**: flake8
- **Type checker**: mypy
- **Indentation**: 4 spaces
- **Quotes**: single quotes for strings in Python code

### Naming
- **Files**: `snake_case.py` (e.g., `subscription_views.py`, `bed_models.py`)
- **Classes**: `PascalCase` (e.g., `UserRegistrationView`, `SoftDeleteModel`)
- **Functions/Methods**: `snake_case`
- **Variables**: `snake_case`
- **Constants**: `UPPER_SNAKE_CASE`
- **URL paths**: `kebab-case` (e.g., `/api/v1/landlord/`)

### View Patterns
- Mix of class-based (`APIView`, `ModelViewSet`, `generics.*`) and function-based (`@api_view`)
- Most views are class-based `APIView` subclasses
- Swagger decorators on views: `@swagger_auto_schema(tags=['...'])`
- Logger per module: `logger = logging.getLogger(__name__)`
- Transactions: `with transaction.atomic():` for multi-step DB writes

### Model Patterns
- Base `SoftDeleteModel` with `deleted_at` field (in `hostels/models.py`)
- UUIDs used as primary keys in some models
- Related names explicit (e.g., `related_name='hostels'`)
- `class Meta:` with `abstract = True` for base models

### Serializer Patterns
- `ModelSerializer` with explicit `fields` list in `Meta`
- Docstrings on every serializer class
- `SerializerMethodField` for computed/nested data
- Source overrides for frontend-friendly field names

### Error Handling
- DRF returns `Response(data, status=status.HTTP_xxx)` pattern
- `get_object_or_404()` for object lookup
- Explicit status codes on all responses
- `logger.error()` / `logger.info()` throughout

### Imports
- Standard lib → Django → DRF → local app imports (not always enforced)
- Local imports use relative imports within the same app

### Permissions
- Custom permission classes in `permissions.py` per app
- Common: `IsStudent`, `IsLandlord`, `IsCaretaker`, `IsTechSupportAdmin`, `IsSuperAdmin`
- Applied via `permission_classes` on views

### Testing
- `@override_settings(...)` to disable rate limiting and use in-memory cache
- `setUp()` creates test client and URL constants
- `APIClient` from DRF for API testing

---

## Frontend (TypeScript/Next.js)

### Code Style
- **Formatter**: Prettier (`.prettierrc` in frontend/)
- **Linter**: ESLint (with Next.js config)
- **TypeScript**: strict mode
- **Quotes**: single quotes
- **Semicolons**: present

### Naming
- **Files**: `kebab-case.tsx` / `kebab-case.ts`
- **Components**: `PascalCase` function components
- **Hooks**: `use-kebab-case.ts`, exported as `useKebabCase`
- **Types/Interfaces**: `PascalCase` (e.g., `ApiTypes`, `AuthTypes`)
- **Stores**: `name.store.ts`
- **Route dirs**: `kebab-case` (e.g., `forgot-password/`, `verify-email/`)
- **CSS classes**: Tailwind utility classes (no custom class names)

### Component Patterns
- `'use client';` directive at top for client components
- Named exports for pages (`export default function PageName()`)
- Tailwind for all styling — no CSS modules
- shadcn/ui components (`@/components/ui/`)
- lucide-react for icons
- `Link` from `next/link`, `Button` from `@/components/ui/button`

### State Management
- **Zustand** stores in `src/stores/` (e.g., `app.store.ts`, `ui.store.ts`)
- React Context for auth (`src/providers/auth-provider.tsx`)

### Type Organization
- Types split by domain in `src/types/`:
  - `api.types.ts` — API response shapes
  - `auth.types.ts` — Auth-related types
  - `entities.types.ts` — Core domain entities
  - `caretaker.types.ts`, `subscription.types.ts` — Role-specific types
  - `forms.types.ts` — Form data types

### Imports
- Alias `@/` maps to `src/` (configured in tsconfig + jest)
- Named imports from component libraries

### Error Handling
- `use-async.ts` hook for async operations
- `logger.ts` utility for frontend logging

### Real-time
- `use-websocket.ts` hook wraps WebSocket connection to Django Channels backend
