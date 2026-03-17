---
phase: 4
slug: missing-models-and-url-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x + pytest-django |
| **Config file** | `Backend/pytest.ini` |
| **Quick run command** | `cd Backend && python manage.py check --settings=rumi.settings` |
| **Full suite command** | `cd Backend && pytest caretaker_operations/ -v --tb=short` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && python manage.py check`
- **After every plan wave:** Run `cd Backend && pytest caretaker_operations/ -v --tb=short`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | MOD-01 | migration | `cd Backend && python manage.py migrate --run-syncdb 2>&1 \| grep -c "OK\|No migrations"` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | MOD-01 | import | `cd Backend && python -c "from caretaker_operations.models import VisitorInvitation; print('OK')"` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | MOD-02 | import | `cd Backend && python -c "from caretaker_operations.models import MaintenanceRequest; print('OK')"` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 1 | MOD-03 | import | `cd Backend && python -c "from caretaker_operations.models import LateEntry; print('OK')"` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 2 | URL-01..07 | url check | `cd Backend && python manage.py check` | ✅ | ⬜ pending |
| 4-05-01 | 05 | 2 | URL-08,09,PLC-01,02 | url+orm | `cd Backend && python manage.py check` | ✅ | ⬜ pending |
| 4-06-01 | 06 | 2 | PLC-03 | file deleted | `test ! -f Backend/third_party/weather.py && echo PASS` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `caretaker_operations/migrations/` directory created via `python manage.py makemigrations caretaker_operations`
- [ ] All three model classes (VisitorInvitation, MaintenanceRequest, LateEntry) defined before migration is created

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `GET /api/v1/caretaker/visitor-invitations/` returns real DB data | URL-01 | Requires authenticated caretaker session | GET with caretaker JWT; verify response is array (not 404/500) |
| `POST .../approve/` and `.../reject/` work end-to-end | URL-06, URL-07 | Requires caretaker + student data setup | POST to each action URL; verify status field updates in DB |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
