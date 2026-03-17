---
phase: 06-performance-and-error-standardization
plan: 02
subsystem: api
tags: [redis, cache, django-redis, signals, invalidation, performance]

requires:
  - phase: 06-01
    provides: N+1 query optimization on hostel list, bed occupancy, and booking viewsets; HostelCacheTest and HomeCacheTest stubs

provides:
  - Redis caching on GET /api/v1/hostels/ (anonymous-only, TTL 300s, signal-busted)
  - Redis caching on GET /api/v1/home/ (full response, TTL 900s)
  - hostels/signals.py with post_save + post_delete Hostel invalidation
  - HostelsConfig.ready() wiring signals at app startup

affects:
  - 06-03
  - any phase touching hostel or home endpoints

tech-stack:
  added: []
  patterns:
    - "cache-aside with signal invalidation: list() reads from cache, writes on miss, signal deletes on mutation"
    - "authenticated users bypass list cache — cache only anonymous (public) responses"
    - "full-response outer cache wraps existing partial caches — inner caches serve as DB fallbacks when outer is cold"

key-files:
  created:
    - Backend/hostels/signals.py
  modified:
    - Backend/hostels/apps.py
    - Backend/hostels/views.py
    - Backend/home/views.py
    - Backend/hostels/tests/test_query_optimization.py
    - Backend/home/tests.py

key-decisions:
  - "Anonymous requests only are cached in HostelViewSet.list() — authenticated landlords/caretakers see tenant-scoped data so must bypass cache"
  - "post_delete signal added alongside post_save — hostel deletion must also bust the listing cache"
  - "home_data outer cache (900s) wraps existing landing_page_stats (3600s) and landing_page_testimonials (1800s) inner caches — inner caches still serve on outer miss"
  - "ready() in HostelsConfig imports hostels.signals to auto-connect receivers at startup — no manual signal.connect() calls needed"

patterns-established:
  - "Cache-aside in ViewSet.list(): cache.get / super().list() / cache.set pattern for anonymous public endpoints"
  - "Signal receiver with @receiver(post_save) + @receiver(post_delete) on same function for dual-event invalidation"

requirements-completed: [PERF-04, PERF-05]

duration: 8min
completed: 2026-03-17
---

# Phase 6 Plan 02: Redis Caching with Signal Invalidation Summary

**Redis cache-aside on hostel list (300s TTL, signal-busted on save/delete) and home landing page (900s TTL) eliminating repeated DB hits on the two most-called public endpoints**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-17T08:12:52Z
- **Completed:** 2026-03-17T08:20:00Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 5 (2 test files, 3 implementation files, 1 new file)

## Accomplishments

- Created hostels/signals.py with post_save + post_delete receivers that delete 'hostels_list' key on any Hostel mutation
- Added HostelViewSet.list() cache-aside: anonymous requests served from Redis on cache hit, written on miss; authenticated users bypass entirely
- Wrapped LandingPageView.get() full response in 'home_data' outer cache, short-circuiting all inner partial caches on hit
- HostelCacheTest (2 tests) and HomeCacheTest (1 test) all pass green; full suite of 9 tests exits 0

## Task Commits

1. **Task 1: Fill HostelCacheTest and HomeCacheTest stubs (RED phase)** - `9cf6a548` (test)
2. **Task 2: Implement Redis caching (GREEN phase)** - `cc1c6e97` (feat)

## Files Created/Modified

- `Backend/hostels/signals.py` - New: post_save + post_delete receivers for Hostel that call cache.delete('hostels_list')
- `Backend/hostels/apps.py` - Updated: added ready() importing hostels.signals to wire receivers at startup
- `Backend/hostels/views.py` - Updated: added HostelViewSet.list() cache-aside override (anonymous only)
- `Backend/home/views.py` - Updated: wrapped LandingPageView.get() in outer 'home_data' cache (TTL 900s)
- `Backend/hostels/tests/test_query_optimization.py` - Updated: replaced HostelCacheTest stub with test_list_is_cached + test_signal_busts_cache
- `Backend/home/tests.py` - Updated: replaced HomeCacheTest stub with test_home_is_cached

## Decisions Made

- Anonymous requests only cached in HostelViewSet.list() — landlords/caretakers need tenant-scoped data so must bypass cache
- post_delete added alongside post_save — deleting a hostel must also invalidate the listing cache
- home_data (900s) outer cache wraps inner partial caches for stats/testimonials — inner caches remain as fallbacks when outer key is cold

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Caching infrastructure in place for both high-read public endpoints
- Signal-based invalidation ensures cache consistency on hostel mutations
- Ready for 06-03 (error standardization)

---
*Phase: 06-performance-and-error-standardization*
*Completed: 2026-03-17*
