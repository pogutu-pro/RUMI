# Phase 6: Performance and Error Standardization - Research

**Researched:** 2026-03-17
**Domain:** Django ORM query optimization, Django cache framework (django_redis), DRF custom exception handling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Cache scope:**
- `GET /api/v1/hostels/` returns the same listing to all users (students, landlords, anonymous) — one shared Redis key
- `GET /api/v1/home/` returns the same data to all users — one shared Redis key
- Both endpoints serve cached responses to unauthenticated (anonymous) requests too
- Cache invalidation on hostel change: invalidate the list endpoint cache only (not detail pages) — triggered by post_save signal
- Homepage cache (15-min TTL) expires naturally — no signal-based invalidation needed

**Cache implementation:**
- Use manual `cache.get()` / `cache.set()` (not `cache_page` decorator) — gives explicit control over key naming for reliable post_save invalidation
- Cache key names: `'hostels_list'` (5-min TTL / 300s) and `'home_data'` (15-min TTL / 900s)
- Signal receiver lives in `hostels/signals.py`, connected via `hostels/apps.py` `ready()` method
- Signal invalidates only `'hostels_list'` key on Hostel `post_save` (and `post_delete`)

**N+1 query fixes:**
- Fix exactly the 3 ViewSets specified (PERF-01, PERF-02, PERF-03) — no scope expansion
- **HostelViewSet**: Add `prefetch_related('hostel_amenities__amenity', 'rooms')` alongside existing `select_related('landlord__user')` in `get_queryset()`
- **BedSerializer N+1**: Fix via `prefetch_related('occupancies')` (or equivalent) added to the parent ViewSet's `get_queryset()` — not via serializer context
- **BookingSerializer N+1**: Fix via `select_related('room__hostel')` in `BookingViewSet.get_queryset()` (pattern already used elsewhere in the file at line 333)

**Error response shape:**
- Canonical shape: `{'detail': '...', 'code': '...'}` — aligns with DRF native default, minimizes frontend breakage
- Validation errors include per-field details (field-level errors preserved — frontend can highlight specific form fields)
- 500 Internal Server Errors return `{'detail': 'An unexpected error occurred.'}` — no stack traces or internal info leaked
- 404 errors route through the custom handler too — shape: `{'detail': 'Not found.', 'code': 'not_found'}`
- Custom handler lives in `core/exceptions.py`; wired via `REST_FRAMEWORK['EXCEPTION_HANDLER']` in settings

### Claude's Discretion
- Exact prefetch field name for `BedSerializer` parent ViewSet (depends on actual FK/related_name in the Bed model)
- Whether to use `post_delete` signal in addition to `post_save` for cache invalidation
- Exact structure of per-field validation errors in the normalized envelope

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | `HostelViewSet.get_queryset()` uses `select_related('landlord__user')` and `prefetch_related('hostel_amenities__amenity', 'rooms')` — N+1 eliminated | Confirmed: existing code only has `select_related('landlord__user')` on public path — `prefetch_related` missing; field paths verified at views.py:778 |
| PERF-02 | `BedSerializer.get_current_occupant()` N+1 fixed via `prefetch_related('occupancies')` in parent ViewSet | Confirmed: `BedSerializer.get_current_occupant()` at serializers.py:116 calls `obj.occupancy_timeline.filter(is_active=True).first()` per bed — related_name is `occupancy_timeline` on `BedOccupancy` model |
| PERF-03 | `BookingSerializer.get_room_info()` N+1 fixed via `select_related('room__hostel')` in BookingViewSet | Confirmed: `BookingSerializer.get_room_info()` at serializers.py:183 accesses `obj.room.id`, `obj.room.room_number`, `obj.room.hostel.name` — two FK hops; pattern already exists at hostels/views.py:333 |
| PERF-04 | Redis caching applied to `GET /api/v1/hostels/` (5 min TTL) with cache invalidation on Hostel `post_save` | Confirmed: `django_redis` already configured at `redis://localhost:6379/1`; `KEY_PREFIX: 'rumi'` in settings; `cache` already imported in hostels/views.py:4 |
| PERF-05 | Redis caching applied to `GET /api/v1/home/` homepage endpoint (15 min TTL) | Confirmed: `cache` already imported in home/views.py:4; landing page already uses `cache.get/set` for stats and testimonials — same pattern applies to full response caching |
| ERR-01 | Custom DRF exception handler in `core/exceptions.py` normalizes all error responses to consistent shape | Confirmed: `core/` app exists with only `__init__.py` and `views.py` — `exceptions.py` is a new file; codebase mixes `{'error': ...}` and `{'detail': ...}` shapes throughout |
| ERR-02 | `REST_FRAMEWORK['EXCEPTION_HANDLER']` in settings points to custom handler | Confirmed: no `EXCEPTION_HANDLER` key in current `REST_FRAMEWORK` dict; `performance_settings.py` may override via `get_performance_settings()` — must add to both or ensure override is safe |
</phase_requirements>

---

## Summary

Phase 6 is a pure optimization/standardization pass — no new models, no new URLs. All three technical domains (N+1 fixes, Redis caching, error normalization) work with existing infrastructure that is already in place. The Django ORM patterns are straightforward `select_related` and `prefetch_related` additions to `get_queryset()` methods. Redis is already configured via `django_redis` at `redis://localhost:6379/1` with `KEY_PREFIX: 'rumi'`, and `cache` is already imported in both affected view files. The DRF exception handler is a single new file plus one settings key.

The main implementation risk is the `KEY_PREFIX: 'rumi'` setting in the cache configuration. Django's cache framework automatically prepends `KEY_PREFIX:VERSION:` to all cache keys, so `cache.get('hostels_list')` actually stores under the key `rumi:1:hostels_list`. The signal invalidation code must use the same bare key `'hostels_list'` — not the prefixed form — and Django handles the prefix transparently. This is not a risk as long as all access goes through `cache.get/set/delete` (not raw Redis).

A second risk is the `REST_FRAMEWORK` dict in `settings.py`: it is conditionally populated from `performance_settings.get('REST_FRAMEWORK', {...})`. If `performance_settings.py`'s `get_performance_settings()` function returns its own `REST_FRAMEWORK` dict, the exception handler key must be added there too. Reading `performance_settings.py` confirms the function returns a subset of keys — it does not return a `REST_FRAMEWORK` key — so the default dict in `settings.py` is the live one.

**Primary recommendation:** Add `select_related`/`prefetch_related` to three `get_queryset()` methods, wrap `HostelViewSet.list()` and `LandingPageView.get()` with manual cache get/set, create `hostels/signals.py` + update `hostels/apps.py`, create `core/exceptions.py`, add `EXCEPTION_HANDLER` to `REST_FRAMEWORK` in `settings.py`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `django.core.cache` (cache) | Django 5.2.11 | Manual cache.get/set/delete | Already imported in both affected view files; django_redis is the backend |
| `django_redis` | Already installed | Redis cache backend | Already in INSTALLED_APPS and CACHES config |
| `django.db.models.signals` | Django 5.2.11 | post_save/post_delete for cache invalidation | Standard Django signal mechanism |
| `rest_framework.views` exception_handler | DRF (current) | Base handler to delegate to | Custom handler wraps DRF's default handler |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `django.db.models.prefetch_related` | Django 5.2.11 | Batch reverse FK / M2M lookups | BedOccupancy (reverse FK from Bed), hostel_amenities (M2M through HostelAmenity) |
| `django.db.models.select_related` | Django 5.2.11 | SQL JOIN for forward FK | room__hostel (two FK hops), landlord__user (two FK hops) |
| `rest_framework.exceptions` | DRF | ValidationError, AuthenticationFailed etc. | Custom handler inspects exc type to build normalized shape |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `cache.get/set` | `cache_page` decorator | `cache_page` cannot be reliably invalidated by key name — locked decision to use manual |
| `core/exceptions.py` new file | Inline in `settings.py` | New file is testable and keeps settings clean |
| `post_save` only | `post_save` + `post_delete` | `post_delete` should also be included — deleting a hostel must bust list cache (Claude's discretion: recommend YES) |

**Installation:** No new packages required — all dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure (new/modified files)
```
Backend/
├── core/
│   ├── __init__.py           (exists)
│   ├── views.py              (exists)
│   └── exceptions.py         (NEW — ERR-01)
├── hostels/
│   ├── apps.py               (MODIFY — add ready() + signal import)
│   ├── signals.py            (NEW — PERF-04 cache invalidation)
│   └── views.py              (MODIFY — 3 get_queryset() + list() cache)
├── home/
│   └── views.py              (MODIFY — LandingPageView cache)
└── rumi/
    └── settings.py           (MODIFY — EXCEPTION_HANDLER key)
```

### Pattern 1: Manual Cache Get/Set in a ViewSet list() Override
**What:** Override `list()` in the ViewSet, check `cache.get()` first, fall back to super().list() and store result.
**When to use:** ViewSet endpoints where the full serialized response is identical for all callers (no user-specific data in the response body).
**Example:**
```python
# Source: Django cache docs pattern, verified against existing home/views.py usage
from django.core.cache import cache

class HostelViewSet(TenantModelViewSet):
    def list(self, request, *args, **kwargs):
        cached = cache.get('hostels_list')
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set('hostels_list', response.data, timeout=300)
        return response
```

### Pattern 2: Manual Cache Get/Set in an APIView get()
**What:** Check cache at top of get(), return early if hit, otherwise compute and cache.
**When to use:** APIView subclasses (LandingPageView uses this pattern for stats/testimonials already).
**Example:**
```python
# Pattern already exists in home/views.py:26-38
from django.core.cache import cache

class LandingPageView(APIView):
    def get(self, request):
        cached = cache.get('home_data')
        if cached is not None:
            return Response(cached)
        # ... build response_data ...
        cache.set('home_data', response_data, timeout=900)
        return Response(response_data, status=status.HTTP_200_OK)
```

### Pattern 3: Post-Save Signal for Cache Invalidation
**What:** Connect a receiver to `Hostel.post_save` (and `post_delete`) that calls `cache.delete('hostels_list')`.
**When to use:** Any time a model write must bust a cached list response.
**Example:**
```python
# hostels/signals.py
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Hostel

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Hostel)
@receiver(post_delete, sender=Hostel)
def invalidate_hostels_list_cache(sender, **kwargs):
    cache.delete('hostels_list')
    logger.debug('hostels_list cache invalidated')
```

```python
# hostels/apps.py
from django.apps import AppConfig

class HostelsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "hostels"

    def ready(self):
        import hostels.signals  # noqa: F401
```

### Pattern 4: DRF Custom Exception Handler
**What:** A function `custom_exception_handler(exc, context)` that normalizes all error shapes.
**When to use:** Required for ERR-01/ERR-02 — replaces DRF's default handler globally.
**Example:**
```python
# core/exceptions.py
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — 500
        logger.exception('Unhandled exception in %s', context.get('view'))
        return Response(
            {'detail': 'An unexpected error occurred.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Normalize shape
    data = response.data
    if isinstance(data, dict):
        detail = data.get('detail', '')
        code = getattr(getattr(exc, 'detail', exc), 'code', None) or str(response.status_code)
        # Preserve field-level errors
        errors = {k: v for k, v in data.items() if k not in ('detail',)}
        normalized = {'detail': str(detail), 'code': str(code)}
        if errors:
            normalized['errors'] = errors
        response.data = normalized
    return response
```

```python
# rumi/settings.py — inside REST_FRAMEWORK dict
REST_FRAMEWORK = {
    # ... existing keys ...
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}
```

### Pattern 5: N+1 Fix via select_related / prefetch_related in get_queryset()
**What:** Annotate the queryset at the ViewSet level so serializer field access never hits the DB.
**When to use:** Any serializer that traverses FK relationships per object row.
**Examples:**
```python
# PERF-01 — HostelViewSet.get_queryset() public path
return Hostel.objects.filter(status='active').select_related(
    'landlord__user'
).prefetch_related('hostel_amenities__amenity', 'rooms')

# PERF-02 — parent ViewSet (RoomViewSet) that serves beds
# BedSerializer.get_current_occupant() calls obj.occupancy_timeline.filter(is_active=True).first()
# related_name='occupancy_timeline' confirmed in bed_models.py:151
# Add to RoomViewSet.get_queryset() public path:
return Room.objects.filter(...).prefetch_related('beds__occupancy_timeline')

# PERF-03 — BookingViewSet.get_queryset()
return Booking.objects.all().select_related('room__hostel')
# Pattern already at hostels/views.py:333
```

### Anti-Patterns to Avoid
- **Fetching per-bed occupancy in the serializer without prefetch:** `obj.occupancy_timeline.filter(...)` inside `get_current_occupant()` issues one query per bed row. The fix is on the queryset, not in the serializer method itself (serializer method stays unchanged).
- **Using `cache_page` for hostel list:** `cache_page` keyed on URL+request headers cannot be targeted for deletion by key name — use manual `cache.get/set`.
- **Accessing prefixed key directly via cache.delete:** Always use bare key name (e.g. `'hostels_list'`) — Django cache framework applies `KEY_PREFIX` internally.
- **Not connecting signals in `ready()`:** Importing signals at module level (outside `ready()`) causes AppRegistryNotReady errors. Always import in `AppConfig.ready()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| N+1 across FK traversals | Custom caching in serializer | `select_related` / `prefetch_related` on QuerySet | Django batches correctly; custom caching duplicates ORM internals |
| Cache key versioning | Custom prefix logic | `KEY_PREFIX` + `VERSION` in CACHES setting | Already configured in `rumi/performance_settings.py` |
| Exception shape normalization | Per-view try/except | Single DRF custom exception handler | One registration point covers every view globally |
| 500 error detail suppression | View-level try/except | Handler's `response is None` branch | DRF calls handler even for unhandled exceptions if wired correctly |

**Key insight:** N+1 query bugs and cache invalidation problems are almost always solved at the queryset / signal layer, not inside serializer methods or view logic.

---

## Common Pitfalls

### Pitfall 1: KEY_PREFIX Prefix Confusion
**What goes wrong:** Developer looks at Redis directly and sees `rumi:1:hostels_list` but calls `cache.delete('rumi:1:hostels_list')` — this double-prefixes or misses the entry.
**Why it happens:** `django_redis` stores keys as `{KEY_PREFIX}:{VERSION}:{key}` internally. Raw Redis inspection shows the full key.
**How to avoid:** Always use bare key names (`'hostels_list'`) in Python code. Let Django handle prefixing transparently.
**Warning signs:** `cache.get('hostels_list')` returns None even when Redis shows the key exists.

### Pitfall 2: HostelViewSet Dual get_queryset() Code Paths
**What goes wrong:** Adding `prefetch_related` only to the public path (line 53) but not to the landlord/caretaker path via `super().get_queryset()`.
**Why it happens:** `HostelViewSet.get_queryset()` has two branches: authenticated landlords/caretakers go through `TenantModelViewSet.get_queryset()` (which uses the class-level `queryset = Hostel.objects.all()` with no prefetches), while the public path is an explicit `Hostel.objects.filter(...)`. PERF-01 only requires fixing the public path, but both paths hit `HostelSerializer` which accesses `hostel_amenities` and `rooms`.
**How to avoid:** Fix the public return path explicitly. Understand that scope is limited to PERF-01 (public listing only per the locked decisions).
**Warning signs:** N+1 queries still logged for authenticated landlord requests.

### Pitfall 3: Signals Not Firing Due to Missing ready() Import
**What goes wrong:** `hostels/signals.py` created but `hostels/apps.py` `ready()` never imports it — signals never connect.
**Why it happens:** Django signals must be connected at app startup. Simply creating the file does nothing.
**How to avoid:** Add `ready()` method to `HostelsConfig` with `import hostels.signals`.
**Warning signs:** Hostel saves do not bust the cache; `cache.get('hostels_list')` returns stale data.

### Pitfall 4: Exception Handler Not Wired — performance_settings Override Risk
**What goes wrong:** `EXCEPTION_HANDLER` added to the `REST_FRAMEWORK` default dict in `settings.py` but `performance_settings.get('REST_FRAMEWORK', {...})` returns its own dict that doesn't include the key.
**Why it happens:** `settings.py` line 156 uses `performance_settings.get('REST_FRAMEWORK', {...})`. If `get_performance_settings()` returns a `REST_FRAMEWORK` key, the default dict (containing the exception handler) is ignored.
**How to avoid:** Confirmed by reading `performance_settings.py` — `get_performance_settings()` does NOT return a `REST_FRAMEWORK` key, so the default dict in `settings.py` is active. Nonetheless, add the key to the dict that is actually used (the default dict at line 156).
**Warning signs:** Custom handler is never called; `{'error': ...}` shape still appears.

### Pitfall 5: BedSerializer Prefetch Field Path
**What goes wrong:** Using wrong related_name for `prefetch_related` on the parent ViewSet queryset.
**Why it happens:** The correct path must traverse `Room.beds` (related_name on Bed.room FK) then `Bed.occupancy_timeline` (related_name on BedOccupancy.bed FK).
**How to avoid:** Verified in `bed_models.py`: `Bed.room` FK has `related_name='beds'`; `BedOccupancy.bed` FK has `related_name='occupancy_timeline'`. Full path for `RoomViewSet.get_queryset()`: `prefetch_related('beds__occupancy_timeline')`.
**Warning signs:** `assertNumQueries` test still shows O(n*m) queries for room lists with beds.

### Pitfall 6: Caching Paginated Responses
**What goes wrong:** `cache.set('hostels_list', response.data)` stores the full paginated data dict including pagination metadata (count, next, previous, results). This is correct behavior if the endpoint uses pagination, but the cached response will have stale pagination links if the base URL changes.
**Why it happens:** `HostelViewSet` uses `DEFAULT_PAGINATION_CLASS: PageNumberPagination`. The `list()` override caches `response.data` which includes `count`, `next`, `previous`, `results`.
**How to avoid:** Cache `response.data` as-is. The pagination links use absolute URLs from the current request, so they are correct when served. This is acceptable for a shared cache because all users see the same list page.
**Warning signs:** Clients receive wrong page navigation URLs after cache is populated.

---

## Code Examples

### N+1 Fix — PERF-01 (HostelViewSet public path)
```python
# hostels/views.py — HostelViewSet.get_queryset() public path
# Source: verified against existing pattern at hostels/views.py:778
return Hostel.objects.filter(status='active').select_related(
    'landlord__user'
).prefetch_related('hostel_amenities__amenity', 'rooms')
```

### N+1 Fix — PERF-02 (RoomViewSet public path — beds + occupancy)
```python
# hostels/views.py — RoomViewSet.get_queryset() public path
# Source: bed_models.py related_names confirmed — 'beds' on Bed.room, 'occupancy_timeline' on BedOccupancy.bed
return Room.objects.filter(
    status='available', hostel__status='active'
).select_related('hostel').prefetch_related('beds__occupancy_timeline')
```

### N+1 Fix — PERF-03 (BookingViewSet)
```python
# hostels/views.py — BookingViewSet.get_queryset()
# Source: pattern already at views.py:333; BookingSerializer.get_room_info() accesses obj.room.hostel.name
queryset = Booking.objects.all().select_related('room__hostel')
```

### Redis Caching — PERF-04 (HostelViewSet list)
```python
# hostels/views.py — add list() override inside HostelViewSet
from django.core.cache import cache  # already imported at line 4

def list(self, request, *args, **kwargs):
    cached = cache.get('hostels_list')
    if cached is not None:
        return Response(cached)
    response = super().list(request, *args, **kwargs)
    cache.set('hostels_list', response.data, timeout=300)
    return response
```

### Cache Invalidation Signal — PERF-04
```python
# hostels/signals.py (new file)
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Hostel

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Hostel)
@receiver(post_delete, sender=Hostel)
def invalidate_hostels_list_cache(sender, **kwargs):
    cache.delete('hostels_list')
    logger.debug('hostels_list cache invalidated')
```

### Settings Wiring — ERR-02
```python
# rumi/settings.py — add to REST_FRAMEWORK dict
REST_FRAMEWORK = performance_settings.get('REST_FRAMEWORK', {
    # ... existing keys ...
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cache_page` decorator for full-page caching | Manual `cache.get/set` with explicit key names | Django 1.x → now | Reliable signal-based invalidation by name |
| Per-view try/except for error normalization | DRF `EXCEPTION_HANDLER` setting | DRF 3.x → now | One function covers all views globally |

**No deprecated patterns in use for this phase's scope.**

---

## Open Questions

1. **HostelViewSet caching: authenticated vs anonymous**
   - What we know: The locked decision says one shared key for all users. But `HostelViewSet.get_queryset()` returns different querysets for authenticated landlords/caretakers vs public users.
   - What's unclear: If a landlord hits `GET /api/v1/hostels/`, they go through `TenantModelViewSet.get_queryset()` and see only their own hostels. Caching this response as `'hostels_list'` would poison the shared cache with scoped data.
   - Recommendation: Cache only when `request.user` is anonymous (or for the public path). The simplest guard: skip caching if `request.user.is_authenticated`. This aligns with the locked decision ("same listing to all users / anonymous requests") — the caching applies to the public-facing listing, not the landlord-scoped view. Implement as: `if request.user.is_authenticated: return super().list(...)`.

2. **`get_performance_settings()` return value completeness**
   - What we know: `settings.py` uses `performance_settings.get('REST_FRAMEWORK', {...})`. Verified that the function does NOT return a `REST_FRAMEWORK` key in the current `performance_settings.py`.
   - What's unclear: Whether future changes to `performance_settings.py` could override this.
   - Recommendation: Add the `EXCEPTION_HANDLER` key to the default dict — it will be used unless `performance_settings` later starts returning `REST_FRAMEWORK`. Safe to proceed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Django TestCase + DRF APITestCase (built into Django 5.2.11 / DRF) |
| Config file | none — Django's test runner, no separate config file |
| Quick run command | `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python manage.py test hostels.tests core --keepdb -v 0` |
| Full suite command | `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python manage.py test --keepdb` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | HostelViewSet GET returns without N+1 on hostel_amenities and rooms | unit (assertNumQueries) | `python manage.py test hostels.tests.HostelQueryOptimizationTest -v 2 --keepdb` | ❌ Wave 0 |
| PERF-02 | RoomViewSet GET with beds returns without N+1 on occupancy_timeline | unit (assertNumQueries) | `python manage.py test hostels.tests.BedOccupancyQueryTest -v 2 --keepdb` | ❌ Wave 0 |
| PERF-03 | BookingViewSet GET returns without N+1 on room__hostel | unit (assertNumQueries) | `python manage.py test hostels.tests.BookingQueryOptimizationTest -v 2 --keepdb` | ❌ Wave 0 |
| PERF-04 | GET /api/v1/hostels/ returns cached on second call; cache.delete busts it | unit (cache mock) | `python manage.py test hostels.tests.HostelCacheTest -v 2 --keepdb` | ❌ Wave 0 |
| PERF-05 | GET /api/v1/home/ returns cached on second call | unit (cache mock) | `python manage.py test home.tests.HomeCacheTest -v 2 --keepdb` | ❌ Wave 0 |
| ERR-01 | DRF 400/404/500 responses all have `{'detail': ..., 'code': ...}` shape | unit | `python manage.py test core.tests.ExceptionHandlerTest -v 2 --keepdb` | ❌ Wave 0 |
| ERR-02 | EXCEPTION_HANDLER setting points to custom_exception_handler | integration | included in ERR-01 test — makes real API call | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `python manage.py test hostels.tests core.tests home.tests --keepdb -v 0`
- **Per wave merge:** `python manage.py test --keepdb`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `Backend/hostels/tests.py` — add `HostelQueryOptimizationTest`, `BedOccupancyQueryTest`, `BookingQueryOptimizationTest`, `HostelCacheTest` classes covering PERF-01 through PERF-04
- [ ] `Backend/home/tests.py` — add `HomeCacheTest` class covering PERF-05
- [ ] `Backend/core/tests.py` — create new file with `ExceptionHandlerTest` covering ERR-01/ERR-02

---

## Sources

### Primary (HIGH confidence)
- Direct code reading: `Backend/hostels/views.py` lines 1-173, 778-780 — confirmed existing queryset patterns and missing prefetches
- Direct code reading: `Backend/hostels/serializers.py` lines 101-124 — confirmed `BedSerializer.get_current_occupant()` hotspot and `occupancy_timeline` related_name
- Direct code reading: `Backend/hostels/bed_models.py` lines 134-231 — confirmed `BedOccupancy.bed` FK `related_name='occupancy_timeline'`, `Bed.room` FK `related_name='beds'`
- Direct code reading: `Backend/rumi/settings.py` lines 154-174, 313-328 — confirmed `CACHES` config with `KEY_PREFIX: 'rumi'`, `django_redis` backend, no existing `EXCEPTION_HANDLER`
- Direct code reading: `Backend/home/views.py` — confirmed `cache` import, existing cache.get/set pattern, `LandingPageView` structure
- Direct code reading: `Backend/hostels/apps.py` — confirmed no `ready()` method exists; signals file does not exist
- Direct code reading: `Backend/core/` directory — confirmed `exceptions.py` does not exist

### Secondary (MEDIUM confidence)
- `Backend/rumi/performance_settings.py` — verified `get_performance_settings()` does NOT return `REST_FRAMEWORK` key, confirming the default dict in settings.py is live

### Tertiary (LOW confidence)
- None for this phase — all claims verified directly from source code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already present, versions confirmed from installed packages
- Architecture: HIGH — patterns verified against existing code in the same files being modified
- Pitfalls: HIGH — confirmed from direct code inspection (e.g., dual get_queryset paths, KEY_PREFIX behavior from Django source)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain — Django ORM and DRF exception handling are not fast-moving)
