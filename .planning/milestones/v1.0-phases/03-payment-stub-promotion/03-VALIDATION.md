---
phase: 3
slug: payment-stub-promotion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x + pytest-django |
| **Config file** | `Backend/pytest.ini` |
| **Quick run command** | `cd Backend && python manage.py check --settings=rumi.settings` |
| **Full suite command** | `cd Backend && pytest payments/tests/ -v --tb=short` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && python manage.py check --settings=rumi.settings`
- **After every plan wave:** Run `cd Backend && pytest payments/tests/ -v --tb=short`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | PAY-09 | import check | `cd Backend && python -c "from payments.views import PaymentVerifyView; print('OK')"` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | PAY-09 | url check | `cd Backend && python manage.py check` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 1 | PAY-10 | import check | `cd Backend && python -c "from payments.views import PaybillAllocationView; print('OK')"` | ✅ | ⬜ pending |
| 3-03-01 | 03 | 1 | PAY-11 | import check | `cd Backend && python -c "from payments.views import UnmatchedPaymentsListView; print('OK')"` | ✅ | ⬜ pending |
| 3-04-01 | 04 | 1 | PAY-12 | import check | `cd Backend && python -c "from payments.views import UnmatchedPaymentMatchView; print('OK')"` | ✅ | ⬜ pending |
| 3-05-01 | 05 | 2 | PAY-13 | import check | `cd Backend && python -c "from payments.views import PaymentLedgerExportView; print('OK')"` | ✅ | ⬜ pending |
| 3-05-02 | 05 | 2 | PAY-14 | file deleted | `ls Backend/payments/stubs_views.py 2>&1 \| grep -c "No such" \| grep 1` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (pytest + django check already available).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PaymentLedgerExportView returns valid CSV content | PAY-13 | Requires authenticated request with data | POST to `/api/v1/payments/admin/export/` with admin token; verify Content-Type is text/csv and rows contain transaction data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
