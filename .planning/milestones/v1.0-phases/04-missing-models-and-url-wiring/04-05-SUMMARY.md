---
phase: 04-missing-models-and-url-wiring
plan: 05
subsystem: api
tags: [django, orm, caretaker, maintenance, late-entries, views, urls]

# Dependency graph
requires:
  - phase: 04-04
    provides: migrations for VisitorInvitation, MaintenanceRequest, LateEntry; 7 URL registrations URL-01 through URL-07
provides:
  - MaintenanceRequestDetailView class in caretaker_operations/views.py (URL-08 view)
  - CaretakerDamageReportDetailView class in caretaker_operations/views.py (URL-09 view)
  - PLC-01 fix: CaretakerMaintenanceView.get() queries MaintenanceRequest ORM instead of placeholder []
  - PLC-02 fix: all 3 simulation methods in CaretakerLateEntryStatsView replaced with real LateEntry ORM queries
  - URL-08: maintenance/<int:pk>/ registered in caretaker_operations/urls.py
  - URL-09: damage-reports/<int:pk>/ registered in caretaker_operations/urls.py
affects: [phase-05, phase-06, frontend caretaker dashboard maintenance and late-entries modules]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "select_related on detail views for FK chains: room, reported_by, assigned_to, hostel"
    - "Detail views scoped to caretaker.hostel — hostel=caretaker.hostel or room__hostel=caretaker.hostel"
    - "LateEntry.objects.filter(room__hostel=...).values(...).annotate(count=Count('id')).order_by('-count') for aggregated stats"

key-files:
  created: []
  modified:
    - Backend/caretaker_operations/views.py
    - Backend/caretaker_operations/additional_views.py
    - Backend/caretaker_operations/urls.py

key-decisions:
  - "MaintenanceRequestModel alias used (as MaintenanceRequestModel) to avoid shadowing the local variable name maintenance_requests used in get() responses"
  - "CaretakerDamageReportDetailView uses room__hostel=caretaker.hostel (room FK chain) because DamageReport has room FK not hostel FK directly"
  - "_calculate_average_entries_per_week required no code change — it already delegates to _get_late_entries_for_period which now returns real LateEntry counts"

patterns-established:
  - "PLC fixes follow pattern: replace [] placeholder with .filter(hostel=..., room=room, status__in=[...]).count()"
  - "Simulation removal pattern: replace booking.id % N loops with LateEntry.objects.filter(...).count()"

requirements-completed: [URL-08, URL-09, PLC-01, PLC-02]

# Metrics
duration: 8min
completed: 2026-03-17
---

# Phase 4 Plan 05: Detail Views, PLC-01 and PLC-02 Fixes Summary

**Two caretaker detail endpoints wired (maintenance/{id}/, damage-reports/{id}/), MaintenanceRequest ORM replacing [] placeholder, and all 3 LateEntry simulation methods replaced with real ORM queries**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-17T00:00:00Z
- **Completed:** 2026-03-17T00:08:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- PLC-01 resolved: CaretakerMaintenanceView.get() now calls MaintenanceRequestModel.objects.filter(hostel=..., room=room, status__in=['received','in_progress']).count() — no more empty [] placeholder
- PLC-02 resolved: _get_late_entries_for_period queries LateEntry table directly; _get_frequent_offenders uses .values().annotate(count=Count('id')).order_by('-count')[:5]; _calculate_average_entries_per_week returns real data automatically
- URL-08 and URL-09 registered: GET /api/v1/caretaker/maintenance/{id}/ and GET /api/v1/caretaker/damage-reports/{id}/ now resolve to their respective detail view classes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 2 detail views to views.py and fix PLC-01 maintenance placeholder** - `c3fae402` (feat)
2. **Task 2: Replace all 3 LateEntry simulation methods in additional_views.py (PLC-02)** - `24f555b2` (feat)
3. **Task 3: Register 2 detail URLs in urls.py** - `f0523122` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `Backend/caretaker_operations/views.py` - Added MaintenanceRequestModel import; replaced [] placeholder with real ORM query (PLC-01); appended MaintenanceRequestDetailView and CaretakerDamageReportDetailView classes
- `Backend/caretaker_operations/additional_views.py` - Added LateEntry import; replaced _get_late_entries_for_period and _get_frequent_offenders with real ORM queries (PLC-02)
- `Backend/caretaker_operations/urls.py` - Registered maintenance/<int:pk>/ (URL-08) and damage-reports/<int:pk>/ (URL-09)

## Decisions Made

- MaintenanceRequestModel alias used (imported `as MaintenanceRequestModel`) to avoid naming conflict with the `maintenance_requests` queryset variable used elsewhere in the same view
- CaretakerDamageReportDetailView scopes via `room__hostel=caretaker.hostel` because DamageReport's FK is to Room, not directly to Hostel
- _calculate_average_entries_per_week required no structural change — it already delegates entirely to _get_late_entries_for_period, so fixing that method was sufficient for PLC-02 third simulation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 requirements satisfied: URL-08, URL-09, PLC-01, PLC-02
- GET /api/v1/caretaker/maintenance/{id}/ and GET /api/v1/caretaker/damage-reports/{id}/ resolve and return real data
- CaretakerMaintenanceView no longer returns active_maintenance_requests: 0 for all rooms
- LateEntry stats endpoints now return real counts from the LateEntry table
- Phase 4 all plans complete — Phase 5 can proceed

---
*Phase: 04-missing-models-and-url-wiring*
*Completed: 2026-03-17*