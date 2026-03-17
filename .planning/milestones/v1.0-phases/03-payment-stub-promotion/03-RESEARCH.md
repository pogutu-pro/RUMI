# Phase 3: Payment Stub Promotion - Research

**Researched:** 2026-03-16
**Domain:** Django 4.2 / DRF — view promotion, CSV export, file deletion
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-09 | `PaymentVerifyView` promoted from `stubs_views.py` to `payments/views.py` (real ORM queries retained, URL path unchanged) | View body verified in stubs_views.py lines 9-25; already contains real ORM; promotion is a copy-and-import swap |
| PAY-10 | `PaybillAllocationView` promoted from `stubs_views.py` to `payments/views.py` (real ORM queries retained, URL path unchanged) | View body verified lines 27-60; uses `MpesaRoutingEngine.get_config_for_hostel` and real ORM; no stub logic |
| PAY-11 | `UnmatchedPaymentsListView` promoted from `stubs_views.py` to `payments/views.py` (real ORM queries retained, URL path unchanged) | View body verified lines 113-139; real ORM query on Transaction model; only stub marker is `'suggested_match': None` comment |
| PAY-12 | `UnmatchedPaymentMatchView` promoted from `stubs_views.py` to `payments/views.py` (real ORM + service call retained, URL path unchanged) | View body verified lines 84-111; calls `process_payment_to_rent_periods` from payments.services; real logic present |
| PAY-13 | `PaymentLedgerExportView` implemented with real export logic (CSV/PDF), promoted to `payments/views.py` | Only stub: returns `{'download_url': '/media/exports/ledger_export.csv'}`; needs replacement with real CSV using Python `csv` module; `reportlab==4.0.7` also available |
| PAY-14 | `stubs_views.py` deleted after all views promoted | Must be last step; requires removing the `from . import stubs_views` line in urls.py |
</phase_requirements>

---

## Summary

Phase 3 promotes six view classes from `payments/stubs_views.py` into `payments/views.py` and deletes the source file. Four of the six views (`PaymentVerifyView`, `PaybillAllocationView`, `UnmatchedPaymentsListView`, `UnmatchedPaymentMatchView`) already contain complete, real ORM/service logic inside `stubs_views.py` — they were placed there during a parity exercise and never moved. Their promotion is purely mechanical: copy the class body to `views.py`, add any missing imports, update `urls.py` to reference `views.*` instead of `stubs_views.*`, and remove the class from the stub file.

`PaymentLedgerExportView` is the only view with genuine stub logic: it currently returns `{'download_url': '/media/exports/ledger_export.csv'}` and never writes a file. The real implementation must stream a CSV built from `BedPaymentLedger` rows using Python's built-in `csv` module (already available — no new dependency). The `reportlab==4.0.7` library in `requirements.txt` would support a PDF alternative, but CSV is simpler, matches the stub's implied filename, and requires zero new dependencies.

`PaymentLedgerView` and `UnmatchedPaymentRejectView` are also in `stubs_views.py` but are already covered by Phase 1 work (PAY-07 and PAY-06 respectively). Their URL registrations (`ledger/`, `ledger/<search_param>/`, `unmatched/<id>/reject/`) currently point at `stubs_views.*` and must be migrated as part of this phase.

**Primary recommendation:** For each view, copy the class into `views.py` in one commit, update the URL import in that same commit, verify the URL still resolves, then remove the class from `stubs_views.py`. Delete `stubs_views.py` only after it is empty of all view classes. Each promoted view maps to one plan file.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 4.2.7 | ORM, request/response | Project foundation |
| djangorestframework | 3.14.0 | APIView, Response, permissions | Project foundation |
| Python `csv` | stdlib | CSV response streaming | No install needed; HttpResponse with content-type text/csv |
| reportlab | 4.0.7 | PDF generation | Already in requirements.txt; used for receipts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `django.http.HttpResponse` | Django 4.2 | Streaming CSV response | Set `Content-Type: text/csv` and `Content-Disposition` header |
| `django.http.StreamingHttpResponse` | Django 4.2 | Large CSV streaming | Only if ledger has >10k rows; overkill for current data size |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Python `csv` module | reportlab PDF | PDF is more formal but adds 10x complexity for a ledger export; CSV is already implied by the stub filename |
| Direct `HttpResponse` | `StreamingHttpResponse` | Streaming is only needed for very large datasets; direct response is simpler and appropriate here |

**Installation:** No new packages required. All libraries are in `requirements.txt` already.

---

## Architecture Patterns

### Recommended Project Structure

No new files or directories needed. Changes are confined to:

```
Backend/payments/
├── views.py          # Destination — append promoted classes here
├── urls.py           # Update stubs_views.* references to views.*
└── stubs_views.py    # Source — emptied class by class; deleted last (PAY-14)
```

### Pattern 1: View Promotion (copy-import-update-delete)

**What:** Move a view class from stubs_views.py to views.py, updating the import in urls.py in the same atomic step.
**When to use:** All four ORM-complete views (PAY-09, PAY-10, PAY-11, PAY-12).
**Steps per view:**
1. Append the class to `payments/views.py` (after existing views)
2. Add any imports the class needs to `views.py` top-level imports
3. In `urls.py`, change `stubs_views.PaymentVerifyView` → `views.PaymentVerifyView` (keep path identical)
4. Remove (or comment out) the class from `stubs_views.py`

**Example — urls.py change (PAY-09):**
```python
# Before
path('verify/', stubs_views.PaymentVerifyView.as_view(), name='payment_verify_stub'),

# After (path string unchanged, name unchanged)
path('verify/', views.PaymentVerifyView.as_view(), name='payment_verify_stub'),
```

### Pattern 2: Real CSV Export (PAY-13)

**What:** Replace `{'download_url': '...'}` stub with an `HttpResponse` that streams CSV content built from `BedPaymentLedger`.
**When to use:** `PaymentLedgerExportView`.

```python
# Verified pattern — Python stdlib csv + Django HttpResponse
import csv
from django.http import HttpResponse
from django.utils import timezone

class PaymentLedgerExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="ledger_export_{timezone.now().strftime("%Y%m%d")}.csv"'
        )
        writer = csv.writer(response)
        writer.writerow([
            'Date', 'Bed Code', 'Student Name',
            'Amount (KES)', 'Period Start', 'Period End',
            'Attribution', 'Reference'
        ])
        ledger = (
            BedPaymentLedger.objects
            .select_related('bed', 'transaction__student__user')
            .order_by('-attributed_at')
        )
        for entry in ledger:
            student_name = (
                entry.transaction.student.user.get_full_name()
                if entry.transaction.student else 'N/A'
            )
            writer.writerow([
                entry.attributed_at.strftime('%Y-%m-%d %H:%M'),
                entry.bed.full_code,
                student_name,
                str(entry.amount_allocated),
                entry.allocated_to_period_start.isoformat(),
                entry.allocated_to_period_end.isoformat(),
                entry.attributed_by,
                entry.transaction.transaction_reference,
            ])
        return response
```

### Pattern 3: Deletion of stubs_views.py (PAY-14)

**What:** After all classes are removed, delete the file and remove its import from urls.py.
**When to use:** Final plan (03-05), after PAY-13 is complete.

```python
# urls.py — remove this line entirely:
from . import views, verification_views, stubs_views
# becomes:
from . import views, verification_views
```

Then: `git rm Backend/payments/stubs_views.py` (or `os.remove` equivalent — use the shell).

### Views Already in stubs_views.py That Are NOT in Phase 3 Scope

`UnmatchedPaymentRejectView` (PAY-06, fixed in Phase 1) and `PaymentLedgerView` (PAY-07, fixed in Phase 1) are also in `stubs_views.py`. Their URL registrations (`unmatched/<id>/reject/`, `ledger/`, `ledger/<search>/`) currently point at `stubs_views.*`. These must be migrated to `views.*` as part of this phase even though the view logic was already fixed in Phase 1 — they need to move physically to `views.py` if they haven't already. **Verify whether these two views were physically moved in Phase 1 or only patched in-place inside stubs_views.py.**

**Investigation result:** Checking the stubs_views.py content — `UnmatchedPaymentRejectView` IS present in `stubs_views.py` (lines 62-82) with the Phase 1 fix applied (status='failed', metadata write). `PaymentLedgerView` IS present in `stubs_views.py` (lines 141-170) with the Phase 1 fix applied (models.Q import added). Both were patched in-place inside stubs_views.py during Phase 1. Both must therefore be promoted to views.py as part of this phase.

This means the full set of classes to promote from stubs_views.py is:
- `PaymentVerifyView` — PAY-09
- `PaybillAllocationView` — PAY-10
- `UnmatchedPaymentsListView` — PAY-11
- `UnmatchedPaymentMatchView` — PAY-12
- `UnmatchedPaymentRejectView` — already fixed, needs promotion (part of PAY-09..PAY-12 plans or explicit task)
- `PaymentLedgerView` — already fixed, needs promotion (same)
- `PaymentLedgerExportView` — PAY-13 (needs real logic)

### Anti-Patterns to Avoid

- **Changing URL path strings:** The `path('verify/', ...)` string must not change — only the view reference changes.
- **Changing URL names:** `name='payment_verify_stub'` stays as-is. Frontend/Swagger clients may reference these names.
- **Promoting in bulk:** Promote one view per plan. If a bulk promotion breaks something it is harder to bisect.
- **Leaving dangling imports in stubs_views.py:** After all classes are removed, the file's imports (`from .models import Transaction, BedPaymentLedger`, `from hostels.models import Bed`) become unused. Remove them when deleting the file.
- **Not adding `from .models import BedPaymentLedger` to views.py:** The export view needs this; it is not in the current `views.py` model import list.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV generation | Custom string formatting | Python `csv.writer` | Handles quoting, escaping, commas in values automatically |
| PDF export | Custom PDF layout | `reportlab` (already installed) | If PDF is chosen over CSV, reportlab is already available |
| File download response | Custom base64 encoding | `HttpResponse` with `Content-Disposition: attachment` | Django's standard streaming download pattern |

**Key insight:** The `csv` module is part of Python's stdlib. Zero installation overhead. `csv.writer(response)` writes directly into the HTTP response object — no temp file, no disk I/O.

---

## Common Pitfalls

### Pitfall 1: Forgetting to promote UnmatchedPaymentRejectView and PaymentLedgerView
**What goes wrong:** Phase 1 patched these views in-place inside stubs_views.py. They are NOT yet in views.py. If the planner treats them as already done, stubs_views.py cannot be deleted (urls.py still imports them from stubs_views).
**Why it happens:** The Phase 1 plan description says "fix X" not "promote X to views.py". The fix was applied to the stub file.
**How to avoid:** Explicitly include these two promotions in the plan tasks. They are mechanical (no logic change needed) but must happen.
**Warning signs:** After promoting PAY-09 through PAY-13, if stubs_views.py still has content, these two were missed.

### Pitfall 2: MpesaRoutingEngine import in PaybillAllocationView
**What goes wrong:** `PaybillAllocationView.get()` has a deferred import inside the method body: `from .routing import MpesaRoutingEngine`. When the class moves to views.py, this inline import continues to work, but it is inconsistent with views.py style.
**Why it happens:** The stub file used inline imports to avoid circular imports.
**How to avoid:** When promoting to views.py, check whether `from .routing import MpesaRoutingEngine` can be moved to the top-level import block. The routing module imports from `.models` and `.mpesa_api` — no circular dependency with views.py. Safe to hoist.

### Pitfall 3: BedPaymentLedger not in views.py imports
**What goes wrong:** `views.py` currently imports `from .models import Transaction, SavedPaymentMethod, ...` but does NOT include `BedPaymentLedger`. The ledger export view needs it.
**Why it happens:** BedPaymentLedger is a separate module (`from .bed_payment_ledger import BedPaymentLedger`) re-exported via models.py. It exists in the models namespace but must be explicitly added.
**How to avoid:** When implementing PAY-13, add `BedPaymentLedger` to the models import line in views.py.

### Pitfall 4: PaymentLedgerView also needs `from django.db import models` import
**What goes wrong:** `PaymentLedgerView` uses `models.Q(...)` — this requires `from django.db import models` at the top of views.py. Views.py does not currently import `models` (it imports specific symbols via `from django.db.models import Sum, Count`).
**Why it happens:** The Phase 1 fix added `from django.db import models` to stubs_views.py. When the class moves, that import must move (or be adapted) to views.py.
**How to avoid:** Either add `from django.db import models` to views.py, or refactor the `models.Q` call to use `from django.db.models import Q` and update the filter call to `Q(...)` — the latter is cleaner and consistent with existing views.py style (`from django.db.models import Sum, Count`).

### Pitfall 5: CSV response with non-ASCII characters
**What goes wrong:** Student names or hostel names may contain non-ASCII characters (Swahili, etc.). `csv.writer` on a Django `HttpResponse` needs explicit UTF-8 encoding.
**Why it happens:** `HttpResponse(content_type='text/csv')` defaults to UTF-8 but some Excel versions expect a BOM.
**How to avoid:** Set `content_type='text/csv; charset=utf-8'` and optionally write a UTF-8 BOM (`response.write('\ufeff')`) for Excel compatibility.

### Pitfall 6: Deleting stubs_views.py before all URL references are updated
**What goes wrong:** `urls.py` has `from . import views, verification_views, stubs_views` — deleting the file before removing this import causes an `ImportError` on startup.
**Why it happens:** Python evaluates all imports at module load time.
**How to avoid:** The last plan (03-05) must update the `urls.py` import line AND delete the file in the same commit.

---

## Code Examples

### CSV Export — complete working implementation
```python
# Source: Python stdlib csv docs + Django HttpResponse pattern
import csv
from django.http import HttpResponse
from django.utils import timezone

class PaymentLedgerExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = (
            f'attachment; filename="ledger_export_{timezone.now().strftime("%Y%m%d")}.csv"'
        )
        response.write('\ufeff')  # UTF-8 BOM for Excel compatibility
        writer = csv.writer(response)
        writer.writerow([
            'Date', 'Bed Code', 'Student Name',
            'Amount (KES)', 'Period Start', 'Period End',
            'Attribution', 'Reference'
        ])
        queryset = (
            BedPaymentLedger.objects
            .select_related('bed', 'transaction__student__user')
            .order_by('-attributed_at')
        )
        for entry in queryset:
            student_name = (
                entry.transaction.student.user.get_full_name()
                if entry.transaction.student else 'N/A'
            )
            writer.writerow([
                entry.attributed_at.strftime('%Y-%m-%d %H:%M'),
                entry.bed.full_code,
                student_name,
                str(entry.amount_allocated),
                entry.allocated_to_period_start.isoformat(),
                entry.allocated_to_period_end.isoformat(),
                entry.attributed_by,
                entry.transaction.transaction_reference,
            ])
        return response
```

### urls.py migration pattern (remove stubs_views import on last plan)
```python
# After all promotions complete (PAY-14):
# Remove stubs_views from import line
from . import views, verification_views  # stubs_views removed

# All path() entries already updated in prior plans — no path string changes needed
```

### views.py import additions needed
```python
# Add to existing model imports in views.py:
from .models import (
    Transaction, SavedPaymentMethod, RecurringPayment, LateFeeCharge,
    TaxReport, PaystackSubaccount, Payout, RefundRequest, RevenueAnalytics,
    MpesaPaymentConfig, BedPaymentLedger  # BedPaymentLedger added
)
# Add to Django DB imports:
from django.db.models import Sum, Count, Q  # Q added for PaymentLedgerView filter
```

---

## Stub-by-Stub Analysis

### 1. PaymentVerifyView (PAY-09)

| Property | Value |
|----------|-------|
| Current stub behavior | Real ORM: `get_object_or_404(Transaction, transaction_reference=...)` |
| Response shape | `{reference, status, amount, verified}` |
| Real logic needed | None — logic is complete |
| Models needed | `Transaction` (already in views.py imports) |
| Missing imports in views.py | None |
| URL paths | `verify/` and `verify/<str:transaction_reference>/` |

### 2. PaybillAllocationView (PAY-10)

| Property | Value |
|----------|-------|
| Current stub behavior | Real ORM via MpesaRoutingEngine |
| Response shape | `{paybill, account_number, business_name, hostel_name, bed_code}` |
| Real logic needed | None — logic is complete |
| Models needed | `Bed`, `Hostel` (already via hostels.models) |
| Missing imports in views.py | `from .routing import MpesaRoutingEngine` — add at top level |
| URL paths | `paybill/` |

### 3. UnmatchedPaymentsListView (PAY-11)

| Property | Value |
|----------|-------|
| Current stub behavior | Real ORM: `Transaction.objects.filter(status='pending', bed__isnull=True, transaction_type='rent')` |
| Response shape | `{data: [{id, mpesa_receipt, phone_number, amount, timestamp, status, suggested_match}]}` |
| Real logic needed | None — `suggested_match: None` is acceptable placeholder comment, not stub logic |
| Models needed | `Transaction` (already in views.py) |
| Missing imports in views.py | None |
| URL paths | `unmatched/` |

### 4. UnmatchedPaymentMatchView (PAY-12)

| Property | Value |
|----------|-------|
| Current stub behavior | Real ORM + `process_payment_to_rent_periods` service call |
| Response shape | `{status: 'matched', transaction_id}` |
| Real logic needed | None — logic is complete |
| Models needed | `Transaction`, `Bed` |
| Missing imports in views.py | `from .services import process_payment_to_rent_periods` — add at top level |
| URL paths | `unmatched/<int:payment_id>/match/` |

### 5. UnmatchedPaymentRejectView (already patched in Phase 1, promotion needed)

| Property | Value |
|----------|-------|
| Current stub behavior | PAX-06 fix applied: writes status='failed' and metadata to DB |
| Response shape | `{status: 'rejected', payment_id}` |
| Real logic needed | None — Phase 1 fix complete |
| Models needed | `Transaction` |
| Missing imports in views.py | None |
| URL paths | `unmatched/<int:payment_id>/reject/` |

### 6. PaymentLedgerView (already patched in Phase 1, promotion needed)

| Property | Value |
|----------|-------|
| Current stub behavior | PAY-07 fix applied: real ORM query with models.Q search |
| Response shape | `{data: [{id, transaction_date, bed_code, student_name, transaction_type, amount, balance, description, reference}]}` |
| Real logic needed | None — Phase 1 fix complete; `balance: 0` is a known TBD item, not blocking |
| Models needed | `BedPaymentLedger` (must add to views.py imports) |
| Missing imports in views.py | `BedPaymentLedger`, `Q` |
| URL paths | `ledger/` and `ledger/<str:search_param>/` |

### 7. PaymentLedgerExportView (PAY-13 — genuine stub)

| Property | Value |
|----------|-------|
| Current stub behavior | Returns `{'download_url': '/media/exports/ledger_export.csv'}` — no file, no data |
| Response shape needed | `text/csv` file attachment |
| Real logic needed | CSV generation from BedPaymentLedger rows |
| Models needed | `BedPaymentLedger` |
| Libraries | Python stdlib `csv` — no new dependencies |
| URL paths | `ledger/export/` |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Views in stubs_views.py | Views in views.py | This phase | URLs unchanged; frontend unaffected |
| Stub export returning URL | Real CSV streaming | PAY-13 | Frontend can now download real ledger data |

**Deprecated/outdated:**
- `stubs_views.py` as a module: Deleted after PAY-14. All imports from it must be removed from urls.py before deletion.

---

## Open Questions

1. **Which plan handles UnmatchedPaymentRejectView and PaymentLedgerView promotion?**
   - What we know: They were patched in Phase 1 inside stubs_views.py, not moved.
   - What's unclear: The roadmap plans (03-01 through 03-05) list only PAY-09 through PAY-14 explicitly. These two are implied by PAY-14 (stubs_views.py deletion) but not given explicit PAY IDs.
   - Recommendation: Fold UnmatchedPaymentRejectView promotion into plan 03-03 or 03-04 (alongside adjacent unmatched views). Fold PaymentLedgerView promotion into plan 03-05 (alongside the export view and the deletion task).

2. **Should `suggested_match: None` in UnmatchedPaymentsListView be replaced with real matching logic?**
   - What we know: PAY-11 says "real ORM queries retained" — the current ORM query is already real. The matching algorithm is explicitly a placeholder comment in the stub.
   - What's unclear: Whether a basic matching algorithm (e.g., matching by amount + timing) is expected in this phase.
   - Recommendation: Promote as-is with `suggested_match: None`. Phase 3 is about promotion, not enhancement. A matching algorithm is out of scope.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 7.4.3 + pytest-django 4.7.0 |
| Config file | `/home/joseph-ogutu/Desktop/RUMI/Backend/pytest.ini` |
| Settings module | `rumi.test_settings` |
| Quick run command | `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python -m pytest payments/tests_v2.py -x -q` |
| Full suite command | `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python -m pytest payments/ -x -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-09 | `GET /api/v1/payments/verify/?reference=REF` returns `{reference, status, amount, verified}` from `views.PaymentVerifyView` (not stubs_views) | unit | `pytest payments/tests_v2.py -k "verify" -x` | Wave 0 |
| PAY-09 | `GET /api/v1/payments/verify/<ref>/` path resolves without 404 | unit | `pytest payments/tests_v2.py -k "verify_ref" -x` | Wave 0 |
| PAY-10 | `GET /api/v1/payments/paybill/?bed_id=1` returns paybill config shape | unit | `pytest payments/tests_v2.py -k "paybill" -x` | Wave 0 |
| PAY-11 | `GET /api/v1/payments/unmatched/` returns `{data: [...]}` with pending/no-bed transactions | unit | `pytest payments/tests_v2.py -k "unmatched_list" -x` | Wave 0 |
| PAY-12 | `POST /api/v1/payments/unmatched/<id>/match/` with `{bed_id}` sets transaction.status='success' and links bed | unit | `pytest payments/tests_v2.py -k "unmatched_match" -x` | Wave 0 |
| PAY-13 | `GET /api/v1/payments/ledger/export/` returns HTTP 200 with `Content-Type: text/csv` and at least a header row | unit | `pytest payments/tests_v2.py -k "ledger_export" -x` | Wave 0 |
| PAY-14 | `payments/stubs_views.py` does not exist on disk | smoke | `python -c "import payments.stubs_views" 2>&1 | grep -q ModuleNotFoundError && echo PASS` | Wave 0 |
| PAY-14 | `from . import stubs_views` not present in `payments/urls.py` | smoke | `grep -c "stubs_views" Backend/payments/urls.py` returns 0 | Wave 0 |

### URL Continuity (No Path Changes)

All URL paths must remain identical before and after promotion. The test suite should assert that each path still resolves with the same name:

| Path | Name | Must resolve to |
|------|------|----------------|
| `verify/` | `payment_verify_stub` | `views.PaymentVerifyView` |
| `verify/<str:transaction_reference>/` | `payment_verify_ref_stub` | `views.PaymentVerifyView` |
| `paybill/` | `paybill_allocation_stub` | `views.PaybillAllocationView` |
| `unmatched/` | `unmatched_payment_list_stub` | `views.UnmatchedPaymentsListView` |
| `unmatched/<int:payment_id>/match/` | `unmatched_payment_match_stub` | `views.UnmatchedPaymentMatchView` |
| `unmatched/<int:payment_id>/reject/` | `unmatched_payment_reject_stub` | `views.UnmatchedPaymentRejectView` |
| `ledger/` | `payment_ledger_stub` | `views.PaymentLedgerView` |
| `ledger/export/` | `payment_ledger_export_stub` | `views.PaymentLedgerExportView` |
| `ledger/<str:search_param>/` | `payment_ledger_search_stub` | `views.PaymentLedgerView` |

### Sampling Rate

- **Per task commit:** `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python -m pytest payments/tests_v2.py -x -q`
- **Per wave merge:** `cd /home/joseph-ogutu/Desktop/RUMI/Backend && python -m pytest payments/ -x -q`
- **Phase gate:** Full suite green + `python manage.py check` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `Backend/payments/tests_v2.py` — needs test cases for all promoted views (currently only has lifecycle tests); add `TestPaymentVerifyView`, `TestPaybillAllocationView`, `TestUnmatchedPaymentsListView`, `TestUnmatchedPaymentMatchView`, `TestPaymentLedgerExportView`
- [ ] Smoke test for PAY-14: verify stubs_views.py is deleted and no import reference remains

*(Existing test infrastructure — pytest.ini, pytest-django, factory-boy — covers all framework needs. No new framework install required.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `Backend/payments/stubs_views.py` — full view inventory, response shapes, logic completeness
- Direct code read: `Backend/payments/urls.py` — all stubs_views URL registrations and path strings
- Direct code read: `Backend/payments/models.py` — Transaction, BedPaymentLedger field inventory
- Direct code read: `Backend/payments/views.py` lines 1-80 — existing import patterns, class structure
- Direct code read: `Backend/payments/bed_payment_ledger.py` — BedPaymentLedger fields for CSV column selection
- Direct code read: `Backend/requirements.txt` — confirmed `reportlab==4.0.7`, `csv` is stdlib (no install)
- Direct code read: `Backend/pytest.ini` — confirmed test framework config and run commands

### Secondary (MEDIUM confidence)
- Python stdlib documentation: `csv.writer` writes to any file-like object; Django `HttpResponse` implements the file-like interface — this is a well-established Django pattern

### Tertiary (LOW confidence)
- None — all findings are from direct code inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from requirements.txt directly
- Architecture: HIGH — derived from reading actual source files
- Pitfalls: HIGH — identified from direct analysis of import dependencies and Phase 1 history in STATE.md
- Stub analysis: HIGH — every view read line-by-line

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain — file promotion and CSV export patterns do not change)
