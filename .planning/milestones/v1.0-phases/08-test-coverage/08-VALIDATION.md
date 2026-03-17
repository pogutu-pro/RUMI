---
phase: 8
slug: test-coverage
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-17
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + pytest-django |
| **Config file** | `Backend/pytest.ini` |
| **Quick run command** | `cd Backend && python -m pytest payments/tests_comprehensive.py -x -q` |
| **Full suite command** | `cd Backend && python -m pytest -x -q` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && python -m pytest <specific_test_file> -x -q`
- **After every plan wave:** Run `cd Backend && python -m pytest -x -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01 | 01 | 1 | TEST-01 | integration | `cd Backend && python -m pytest payments/tests_comprehensive.py -k "test_stk_push" -x` | ✅ extend | ⬜ pending |
| 08-02 | 02 | 1 | TEST-02 | integration | `cd Backend && python -m pytest payments/tests_comprehensive.py -k "test_charge_success" -x` | ✅ extend | ⬜ pending |
| 08-03 | 03 | 1 | TEST-03 | unit | `cd Backend && python -m pytest hostels/tests/test_query_optimization.py -x` | ✅ update stubs | ⬜ pending |
| 08-04 | 04 | 1 | TEST-04 | integration | `cd Backend && python -m pytest hostels/tests/test_booking_lifecycle.py -x` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files, framework config, or fixtures need to be created. Factories are in place. pytest.ini is configured.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
