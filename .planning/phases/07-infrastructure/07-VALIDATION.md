---
phase: 7
slug: infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (Django test runner) |
| **Config file** | Backend/pytest.ini or Backend/setup.cfg |
| **Quick run command** | `cd Backend && python manage.py check --deploy 2>&1 \| head -20` |
| **Full suite command** | `cd Backend && python -m pytest payments/tests/ -x -q` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && python manage.py check`
- **After every plan wave:** Run `cd Backend && python -m pytest payments/tests/ -x -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | INF-01 | smoke | `cd Backend && pip check && python manage.py check` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 1 | INF-02 | smoke | `cd Backend && USE_S3=false python manage.py check` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 1 | INF-02 | smoke | `cd Backend && USE_S3=true python manage.py check` | ✅ | ⬜ pending |
| 07-03-01 | 03 | 2 | INF-03 | unit | `cd Backend && python -m pytest payments/tests/test_receipt_service.py -x -q` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 2 | INF-04 | manual | see manual table | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Backend/payments/tests/test_receipt_service.py` — stub test for email attachment using `.read()` not `.path`

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| aws s3 sync command documented in settings.py and .env.example | INF-04 | Documentation audit, not runtime | Open Backend/rumi/settings.py and .env.example — verify sync command block exists with correct bucket variable and --exclude pattern |
| 21 existing PDF files inventoried | INF-04 | Filesystem count | Run `ls Backend/media/receipts/pdf/ \| wc -l` and verify count ≥ 21 in documentation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
