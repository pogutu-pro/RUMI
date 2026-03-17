# Phase 6: Performance and Error Standardization - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix N+1 queries on hostel listing, bed detail, and booking list endpoints. Add Redis caching to the two highest-read public endpoints. Normalize all DRF error responses to a consistent shape via a custom exception handler. No new features — optimization and standardization only.

</domain>

<decisions>
## Implementation Decisions

### Cache scope
- `GET /api/v1/hostels/` returns the same listing to all users (students, landlords, anonymous) — one shared Redis key
- `GET /api/v1/home/` returns the same data to all users — one shared Redis key
- Both endpoints serve cached responses to unauthenticated (anonymous) requests too
- Cache invalidation on hostel change: invalidate the list endpoint cache only (not detail pages) — triggered by post_save signal
- Homepage cache (15-min TTL) expires naturally — no signal-based invalidation needed

### Cache implementation
- Use manual `cache.get()` / `cache.set()` (not `cache_page` decorator) — gives explicit control over key naming for reliable post_save invalidation
- Cache key names: `'hostels_list'` (5-min TTL / 300s) and `'home_data'` (15-min TTL / 900s)
- Signal receiver lives in `hostels/signals.py`, connected via `hostels/apps.py` `ready()` method
- Signal invalidates only `'hostels_list'` key on Hostel `post_save` (and `post_delete`)

### N+1 query fixes
- Fix exactly the 3 ViewSets specified (PERF-01, PERF-02, PERF-03) — no scope expansion
- **HostelViewSet**: Add `prefetch_related('hostel_amenities__amenity', 'rooms')` alongside existing `select_related('landlord__user')` in `get_queryset()`
- **BedSerializer N+1**: Fix via `prefetch_related('occupancies')` (or equivalent) added to the parent ViewSet's `get_queryset()` — not via serializer context
- **BookingSerializer N+1**: Fix via `select_related('room__hostel')` in `BookingViewSet.get_queryset()` (pattern already used elsewhere in the file at line 333)

### Error response shape
- Canonical shape: `{'detail': '...', 'code': '...'}` — aligns with DRF native default, minimizes frontend breakage
- Validation errors include per-field details (field-level errors preserved — frontend can highlight specific form fields)
- 500 Internal Server Errors return `{'detail': 'An unexpected error occurred.'}` — no stack traces or internal info leaked
- 404 errors route through the custom handler too — shape: `{'detail': 'Not found.', 'code': 'not_found'}`
- Custom handler lives in `core/exceptions.py`; wired via `REST_FRAMEWORK['EXCEPTION_HANDLER']` in settings

### Claude's Discretion
- Exact prefetch field name for `BedSerializer` parent ViewSet (depends on actual FK/related_name in the Bed model)
- Whether to use `post_delete` signal in addition to `post_save` for cache invalidation
- Exact structure of per-field validation errors in the normalized envelope

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `django_redis` already in `INSTALLED_APPS` and configured at `redis://localhost:6379/1` — no new Redis setup needed
- `cache` from `django.core.cache` can be imported and used directly
- `hostels/views.py:53` — `HostelViewSet.get_queryset()` already has `select_related('landlord__user')` — just add `prefetch_related()`
- `hostels/views.py:778` — a separate view already uses `prefetch_related('hostel_amenities__amenity')` — confirms the field path is correct
- `hostels/serializers.py:103` — `BedSerializer.get_current_occupant()` is the N+1 hotspot
- `hostels/views.py:333` — `Booking.objects.select_related('room__hostel')` already used elsewhere — same pattern goes into `BookingViewSet.get_queryset()`

### Established Patterns
- Module-level logger: `logger = logging.getLogger(__name__)` used throughout
- Signals pattern: `hostels/apps.py` likely exists — add `ready()` import there
- `core/` directory exists with `__init__.py` and `views.py` — `exceptions.py` is a new file in an existing app

### Integration Points
- `REST_FRAMEWORK` dict in `Backend/rumi/settings.py` — add `'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler'`
- `hostels/apps.py` — connect post_save signal in `ready()` method
- No existing `hostels/signals.py` — create new file

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-performance-and-error-standardization*
*Context gathered: 2026-03-17*
