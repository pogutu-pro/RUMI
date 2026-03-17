---
phase: 6
slug: performance-and-error-standardization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Django TestCase + DRF APITestCase (built into Django 5.2.11 / DRF) |
| **Config file** | none — Django's test runner, no separate config file |
| **Quick run command** | `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python manage.py test hostels.tests core.tests home.tests --keepdb -v 0` |
| **Full suite command** | `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python manage.py test --keepdb` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python manage.py test hostels.tests core.tests home.tests --keepdb -v 0`
- **After every plan wave:** Run `python manage.py test --keepdb`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | PERF-01 | unit (assertNumQueries) | `python manage.py test hostels.tests.HostelQueryOptimizationTest --keepdb -v 2` | ❌ Wave 0 | ⬜ pending |
| 6-01-02 | 01 | 1 | PERF-02 | unit (assertNumQueries) | `python manage.py test hostels.tests.BedOccupancyQueryTest --keepdb -v 2` | ❌ Wave 0 | ⬜ pending |
| 6-01-03 | 01 | 1 | PERF-03 | unit (assertNumQueries) | `python manage.py test hostels.tests.BookingQueryOptimizationTest --keepdb -v 2` | ❌ Wave 0 | ⬜ pending |
| 6-02-01 | 02 | 2 | PERF-04 | unit (cache mock) | `python manage.py test hostels.tests.HostelCacheTest --keepdb -v 2` | ❌ Wave 0 | ⬜ pending |
| 6-02-02 | 02 | 2 | PERF-05 | unit (cache mock) | `python manage.py test home.tests.HomeCacheTest --keepdb -v 2` | ❌ Wave 0 | ⬜ pending |
| 6-03-01 | 03 | 3 | ERR-01, ERR-02 | unit + integration | `python manage.py test core.tests.ExceptionHandlerTest --keepdb -v 2` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Backend/hostels/tests.py` — add `HostelQueryOptimizationTest`, `BedOccupancyQueryTest`, `BookingQueryOptimizationTest`, `HostelCacheTest` stubs for PERF-01 through PERF-04
- [ ] `Backend/home/tests.py` — add `HomeCacheTest` stub for PERF-05
- [ ] `Backend/core/tests.py` — create new file with `ExceptionHandlerTest` stub for ERR-01/ERR-02

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
