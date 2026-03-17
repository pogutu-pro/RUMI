---
phase: 06-performance-and-error-standardization
plan: "01"
subsystem: hostels
tags: [performance, n+1, prefetch_related, select_related, tdd, query-optimization]
dependency_graph:
  requires: []
  provides: [PERF-01, PERF-02, PERF-03]
  affects: [hostels/views.py, hostels/serializers.py, hostels/tests, home/tests, core/tests]
tech_stack:
  added: [django.db.models.Prefetch]
  patterns: [assertNumQueries TDD, Prefetch with nested queryset, _prefetched_objects_cache guard]
key_files:
  created:
    - Backend/hostels/tests/test_query_optimization.py
    - Backend/core/tests.py
  modified:
    - Backend/hostels/views.py
    - Backend/hostels/serializers.py
    - Backend/hostels/tests/__init__.py
    - Backend/home/tests.py
decisions:
  - "Use Prefetch with custom queryset (BedOccupancy.filter(is_active=True).select_related('student__user')) instead of bare prefetch_related('beds__occupancy_timeline') — bare prefetch is bypassed when serializer adds .filter()"
  - "BedSerializer.get_current_occupant checks _prefetched_objects_cache before falling back to DB query — ensures prefetch cache is used when available"
  - "BookingViewSet.get_queryset uses select_related('room__hostel', 'student__user') — resolves both room_info and student_info N+1 in one JOIN"
  - "Wave 0 stub tests use skipTest — ensures test discovery doesn't block on unimplemented cache/exception features"
metrics:
  duration: "27 minutes"
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 6
---

# Phase 6 Plan 1: N+1 Query Fixes and Wave 0 Test Stubs Summary

N+1 query elimination across HostelViewSet, RoomViewSet, and BookingViewSet public listing endpoints — reducing query counts by up to 7x — using TDD assertNumQueries methodology with Wave 0 stub scaffolding.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write Wave 0 test stubs (RED phase) | e36ff73b | test_query_optimization.py, __init__.py, home/tests.py, core/tests.py, serializers.py |
| 2 | Fix N+1 queries in HostelViewSet, RoomViewSet, BookingViewSet (GREEN phase) | 45092b57 | views.py, serializers.py, test_query_optimization.py |

## Verification Results

```
python3 manage.py test hostels.tests core.tests home.tests --keepdb -v 0
Ran 6 tests in 4.214s
OK (skipped=3)
```

- HostelQueryOptimizationTest: PASS (5 queries, down from 10)
- BedOccupancyQueryTest: PASS (4 queries, down from 12)
- BookingQueryOptimizationTest: PASS (2 queries, down from 14)
- HostelCacheTest: SKIP (plan 06-02)
- HomeCacheTest: SKIP (plan 06-02)
- ExceptionHandlerTest: SKIP (plan 06-03)

## Query Count Improvements

| Endpoint | Before Fix | After Fix | Improvement |
|----------|-----------|-----------|-------------|
| GET /api/v1/hostels/ | 10 | 5 | -50% |
| GET /api/v1/hostels/rooms/ | 12 | 4 | -67% |
| GET /api/v1/hostels/bookings/ | 14 | 2 | -86% |

## Success Criteria

- [x] HostelViewSet public path includes `prefetch_related('hostel_amenities__amenity', 'rooms')`
- [x] RoomViewSet public path includes nested Prefetch for `beds__occupancy_timeline` (filtered + student__user)
- [x] BookingViewSet has `get_queryset()` returning `Booking.objects.all().select_related('room__hostel', 'student__user')`
- [x] All three assertNumQueries tests pass GREEN
- [x] Backend/hostels/tests, Backend/home/tests, Backend/core/tests all exist with correct stubs
- [x] `python3 manage.py test hostels.tests core.tests home.tests --keepdb -v 0` exits 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BookingSerializer referenced non-existent field `move_out_date`**
- **Found during:** Task 1 RED phase (serializer raised ImproperlyConfigured)
- **Issue:** BookingSerializer.Meta.fields had `move_out_date` but the model field is `check_out_date`
- **Fix:** Renamed to `check_out_date` in serializer fields list
- **Files modified:** Backend/hostels/serializers.py
- **Commit:** e36ff73b

**2. [Rule 1 - Bug] BookingSerializer missing `student_info` SerializerMethodField declaration**
- **Found during:** Task 1 RED phase
- **Issue:** `get_student_info` method existed but `student_info = serializers.SerializerMethodField()` was not declared at class level
- **Fix:** Added `student_info = serializers.SerializerMethodField()` to class body
- **Files modified:** Backend/hostels/serializers.py
- **Commit:** e36ff73b

**3. [Rule 1 - Bug] AmenitySerializer referenced non-existent field `icon`**
- **Found during:** Task 1 RED phase
- **Issue:** AmenitySerializer.Meta.fields had `icon` but model field is `icon_url`
- **Fix:** Renamed to `icon_url`
- **Files modified:** Backend/hostels/serializers.py
- **Commit:** e36ff73b

**4. [Rule 1 - Bug] RoomImageSerializer referenced non-existent field `alt_text`**
- **Found during:** Task 1 RED phase
- **Issue:** RoomImageSerializer.Meta.fields had `alt_text` but model field is `caption`
- **Fix:** Renamed to `caption`
- **Files modified:** Backend/hostels/serializers.py
- **Commit:** e36ff73b

**5. [Rule 1 - Bug] BedSerializer accessed `occupancy.student.student_id` — non-existent attribute**
- **Found during:** Task 1 RED phase
- **Issue:** BedSerializer.get_current_occupant referenced `student_id` but StudentProfile field is `student_id_number`
- **Fix:** Changed to `student_id_number`
- **Files modified:** Backend/hostels/serializers.py
- **Commit:** e36ff73b

**6. [Rule 2 - Enhancement] APIResponseCacheMiddleware serves cached GET responses with 0 DB queries**
- **Found during:** Task 1 RED phase (BedOccupancyQueryTest returned 0 queries)
- **Issue:** The cache middleware (active in default settings) served a cached rooms response with 0 queries, making `assertNumQueries(4)` fail as `0 != 4` instead of the expected N+1 failure
- **Fix:** Added `cache.clear()` in all test `setUp()` and before each `assertNumQueries` block to force cache misses
- **Files modified:** Backend/hostels/tests/test_query_optimization.py
- **Commit:** e36ff73b

**7. [Rule 2 - Enhancement] Bare `prefetch_related('beds__occupancy_timeline')` bypassed by serializer filter**
- **Found during:** Task 2 GREEN phase (BedOccupancyQueryTest still showing 13 queries)
- **Issue:** BedSerializer.get_current_occupant calls `.filter(is_active=True).first()` — Django cannot use the prefetch cache when a filter is added, issuing a new query per bed
- **Fix:** Used `Prefetch('occupancy_timeline', queryset=BedOccupancy.objects.filter(is_active=True).select_related('student__user'))` and updated `get_current_occupant` to check `_prefetched_objects_cache` first
- **Files modified:** Backend/hostels/views.py, Backend/hostels/serializers.py
- **Commit:** 45092b57

**8. [Rule 2 - Enhancement] BookingSerializer `get_student_info` caused 2 extra queries per booking**
- **Found during:** Task 2 GREEN phase (BookingQueryOptimizationTest showing 8 queries after initial fix)
- **Issue:** `select_related('room__hostel')` alone didn't resolve student+user N+1 because serializer also accesses `obj.student.user.get_full_name()`
- **Fix:** Extended `get_queryset()` to `select_related('room__hostel', 'student__user')`
- **Files modified:** Backend/hostels/views.py
- **Commit:** 45092b57

## Self-Check: PASSED

Files verified:
- Backend/hostels/tests/test_query_optimization.py: FOUND
- Backend/core/tests.py: FOUND
- Backend/home/tests.py: FOUND

Commits verified:
- e36ff73b (test RED phase): FOUND
- 45092b57 (feat GREEN phase): FOUND
