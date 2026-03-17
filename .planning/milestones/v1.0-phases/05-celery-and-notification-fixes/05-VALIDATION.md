---
phase: 5
slug: celery-and-notification-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.4.3 + pytest-django 4.7.0 |
| **Config file** | `Backend/pytest.ini` |
| **Quick run command** | `cd Backend && python -m pytest payments/ -x -q --no-header` |
| **Full suite command** | `cd Backend && python -m pytest accounts/ hostels/ payments/ -q` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && python -m pytest payments/ -x -q --no-header`
- **After every plan wave:** Run `cd Backend && python -m pytest accounts/ hostels/ payments/ -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | CEL-01 | smoke | `python manage.py migrate django_celery_beat --check` | ✅ mgmt cmd | ⬜ pending |
| 5-01-02 | 01 | 1 | CEL-02 | unit | `cd Backend && python -m pytest payments/ -k beat_schedule -x` | ❌ Wave 0 | ⬜ pending |
| 5-01-03 | 01 | 1 | CEL-03 | unit | `cd Backend && python -m pytest payments/ -k beat_schedule -x` | ❌ Wave 0 | ⬜ pending |
| 5-02-01 | 02 | 1 | CEL-04 | unit | `cd Backend && python -m pytest payments/ -k on_commit -x` | ❌ Wave 0 | ⬜ pending |
| 5-02-02 | 02 | 1 | CEL-06 | unit | `cd Backend && python -m pytest payments/ -k superuser_recipient -x` | ❌ Wave 0 | ⬜ pending |
| 5-03-01 | 03 | 2 | CEL-05 | unit | `cd Backend && python -m pytest payments/ -k booking_confirmation -x` | ❌ Wave 0 | ⬜ pending |
| 5-03-02 | 03 | 2 | CEL-05 | unit | `cd Backend && python -m pytest payments/ -k payment_notification -x` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Backend/payments/tests/test_celery_beat.py` — stubs for CEL-02, CEL-03 (beat schedule verification)
- [ ] `Backend/payments/tests/test_on_commit.py` — stubs for CEL-04 (on_commit wrapping tests)
- [ ] `Backend/payments/tests/test_notifications.py` — stubs for CEL-05, CEL-06 (notification task tests)

*Note: Test files may partially exist. Wave 0 must ensure test functions exist for the above requirement IDs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celery beat process starts without crash after adding django-celery-beat | CEL-01 | Requires running Celery beat process, not just migration check | Run `celery -A rumi beat -l info` and verify no `NotRegistered` or `OperationalError` in output |
| SMS/email actually delivered after booking confirmed | CEL-05 | Requires live notification provider (Twilio/email) | Trigger a test booking in staging, verify SMS and email received |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
