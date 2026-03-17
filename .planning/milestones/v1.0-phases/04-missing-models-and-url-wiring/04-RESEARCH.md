# Phase 4: Missing Models and URL Wiring - Research

**Researched:** 2026-03-16
**Domain:** Django ORM model creation, URL registration, view wiring, placeholder replacement
**Confidence:** HIGH

---

## Summary

Phase 4 requires creating three Django models (`VisitorInvitation`, `MaintenanceRequest`, `LateEntry`) inside the `caretaker_operations` app, registering 9 missing URL routes, replacing two placeholder logic blocks with real ORM queries, and deleting the weather stub. The caretaker app is `caretaker_operations/` — there is no `caretaker/` app. The app currently has **no migrations directory** at all, so the very first task must run `python3 manage.py makemigrations caretaker_operations` which will create the migrations directory alongside `0001_initial.py`.

The frontend type contracts are definitive (frontend is the source of truth per PROJECT.md). The primary type definitions live in `frontend/src/features/caretaker/types.ts` (re-exported from `frontend/src/types/caretaker.types.ts`) and `frontend/src/features/caretaker/api/workflows.ts`. The `VisitorInvitation` shape from `workflows.ts` is the authoritative caretaker-facing definition (more complete than the student-facing variant in `student/api/security.ts`).

The weather stub is minimal — a single `WeatherView` class at the bottom of `home/views.py` (lines 747–751), one `path('weather/', ...)` in `home/urls.py` (line 38), and a commented-out import of `third_party.weather`. The `third_party/weather.py` file exists and defines `get_location_weather()` but is already commented out in `home/views.py`. Deleting the view, URL entry, and `third_party/weather.py` fully satisfies PLC-03.

**Primary recommendation:** Create all three models in `caretaker_operations/models.py`, run `makemigrations`, then add the missing URL paths and view classes in a single focused pass per plan.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django ORM | 4.2 (project-locked) | Model definition, migrations | Already in use project-wide |
| Django REST Framework | 3.x (project-locked) | APIView, Response, serializers | All existing views use APIView pattern |
| `python3 manage.py makemigrations` | — | Generate migration files | Standard Django migration workflow |
| `python3 manage.py migrate` | — | Apply migrations | Standard Django migration workflow |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `from django.db import models` | — | Model field types | Every model file |
| `from rest_framework import serializers` | — | Serialize model instances | New serializer classes for new models |
| `from accounts.permissions import IsCaretaker` | — | Permission guard | All new caretaker views |

---

## Architecture Patterns

### Recommended Project Structure

The `caretaker_operations/` app currently has:
```
caretaker_operations/
├── __pycache__/
├── additional_views.py   # CaretakerLateEntryStatsView (has booking.id%7 simulation)
├── tests.py
├── urls.py               # URL registrations (missing 9 routes)
└── views.py              # All main view classes (CaretakerMaintenanceView has [] placeholder)
```

After Phase 4 it will have:
```
caretaker_operations/
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py   # All 3 new models in one migration
├── models.py             # VisitorInvitation, MaintenanceRequest, LateEntry
├── serializers.py        # 3 new serializers (does not exist yet)
├── additional_views.py   # LateEntry simulation removed
├── views.py              # MaintenanceRequest [] placeholder removed
├── urls.py               # 9 new URL paths added
└── tests.py
```

### Pattern 1: Model Definition (matching frontend type contracts)

**What:** Add `models.py` to `caretaker_operations/` and define each model with fields matching the TypeScript interface exactly.

**VisitorInvitation model** — sourced from `frontend/src/features/caretaker/api/workflows.ts`:
```python
# Source: frontend/src/features/caretaker/api/workflows.ts VisitorInvitation interface
class VisitorInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('expired', 'Expired'),
    ]
    visitor_name = models.CharField(max_length=255)
    visitor_phone = models.CharField(max_length=20, blank=True, null=True)
    visitor_id_number = models.CharField(max_length=50)
    student = models.ForeignKey(
        'accounts.StudentProfile', on_delete=models.CASCADE,
        related_name='visitor_invitations'
    )
    room = models.ForeignKey(
        'hostels.Room', on_delete=models.CASCADE,
        related_name='visitor_invitations'
    )
    purpose = models.TextField()
    expected_arrival_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        'accounts.CaretakerProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_invitations'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        'accounts.CaretakerProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='checked_in_invitations'
    )
    checked_out_at = models.DateTimeField(null=True, blank=True)
    checked_out_by = models.ForeignKey(
        'accounts.CaretakerProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='checked_out_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
```

**MaintenanceRequest model** — sourced from `frontend/src/features/caretaker/types.ts` `MaintenanceRequest` interface:
```python
# Source: frontend/src/features/caretaker/types.ts MaintenanceRequest interface
class MaintenanceRequest(models.Model):
    CATEGORY_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('furniture', 'Furniture'),
        ('appliance', 'Appliance'),
        ('structural', 'Structural'),
        ('cleaning', 'Cleaning'),
        ('other', 'Other'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'), ('medium', 'Medium'),
        ('high', 'High'), ('urgent', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('received', 'Received'), ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'), ('closed', 'Closed'),
    ]
    REPORTER_TYPE_CHOICES = [
        ('tenant', 'Tenant'), ('caretaker', 'Caretaker'), ('landlord', 'Landlord'),
    ]
    hostel = models.ForeignKey(
        'hostels.Hostel', on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )
    room = models.ForeignKey(
        'hostels.Room', on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )
    reported_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='maintenance_requests_filed'
    )
    reporter_type = models.CharField(max_length=20, choices=REPORTER_TYPE_CHOICES, default='tenant')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='received')
    photos_before = models.JSONField(default=list, blank=True)
    photos_after = models.JSONField(default=list, blank=True)
    assigned_to = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='maintenance_assignments'
    )
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    landlord_notified = models.BooleanField(default=False)
    landlord_notified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
```

**LateEntry model** — sourced from `frontend/src/features/student/api/security.ts` `LateEntryLog` (caretaker view) and `frontend/src/features/caretaker/types.ts` `LateEntryLog`:
```python
# Source: frontend/src/features/student/api/security.ts LateEntryLog
#         frontend/src/features/caretaker/types.ts LateEntryLog
class LateEntry(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('acknowledged', 'Acknowledged'),
    ]
    student = models.ForeignKey(
        'accounts.StudentProfile', on_delete=models.CASCADE,
        related_name='late_entries'
    )
    room = models.ForeignKey(
        'hostels.Room', on_delete=models.CASCADE,
        related_name='late_entries'
    )
    entry_time = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    logged_by = models.ForeignKey(
        'accounts.CaretakerProfile', on_delete=models.CASCADE,
        related_name='logged_late_entries'
    )
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-entry_time']
        verbose_name_plural = 'Late Entries'
```

### Pattern 2: Migration Strategy

**What:** `caretaker_operations` currently has NO migrations directory. `makemigrations` creates the directory and `0001_initial.py` covering all three models in one shot.

**When to use:** When adding the first-ever migration to an app that previously had no models.

```bash
# Run from Backend/ directory
python3 manage.py makemigrations caretaker_operations
python3 manage.py migrate caretaker_operations
python3 manage.py check   # verify clean
```

**CRITICAL:** The `caretaker_operations` app is already in `INSTALLED_APPS` (line 72 of `rumi/settings.py`). No settings change needed.

### Pattern 3: Missing URL Registration

**What:** The 9 missing URLs all belong in `caretaker_operations/urls.py`. All views referenced already exist in `views.py` with the correct method (`post(self, request, request_id)` for roommate-requests).

**URL prefix:** `caretaker_operations/urls.py` is mounted at `api/v1/caretaker/` (confirmed in `rumi/urls.py` line 103).

**Missing URLs — exact paths and views:**

| Req | HTTP | Path in urls.py | View Class | View Exists? |
|-----|------|-----------------|------------|--------------|
| URL-01 | GET, POST | `visitor-invitations/` | `VisitorInvitationListView` (new) | No — write it |
| URL-02 | POST | `visitor-invitations/<int:pk>/approve/` | `VisitorInvitationActionView` (new) | No — write it |
| URL-03 | POST | `visitor-invitations/<int:pk>/reject/` | `VisitorInvitationActionView` (new) | No — write it |
| URL-04 | POST | `visitor-invitations/<int:pk>/check-in/` | `VisitorInvitationActionView` (new) | No — write it |
| URL-05 | POST | `visitor-invitations/<int:pk>/check-out/` | `VisitorInvitationActionView` (new) | No — write it |
| URL-06 | POST | `roommate-requests/<int:request_id>/approve/` | `CaretakerRoommateRequestApprovalView` (existing) | Yes — just register |
| URL-07 | POST | `roommate-requests/<int:request_id>/reject/` | `CaretakerRoommateRequestApprovalView` (existing) | Yes — just register |
| URL-08 | GET | `maintenance/<int:pk>/` | `MaintenanceRequestDetailView` (new) | No — write it |
| URL-09 | GET | `damage-reports/<int:pk>/` | `CaretakerDamageReportDetailView` (new) | No — write it |

**Roommate request URLs — important detail:** `CaretakerRoommateRequestApprovalView.post(self, request, request_id)` already accepts a `request_id` parameter. The existing URL at `roommates/match-requests/<int:request_id>/` uses a different path. The required path is `roommate-requests/<int:request_id>/approve/` and `roommate-requests/<int:request_id>/reject/`. Both route to the same view; the `action` distinguishes them via `request.data.get('action')` — but the frontend calls separate paths. The view handles `action == 'approve'` and `action == 'reject'` in its POST body. The clearest approach: two separate URL paths each passing action via the URL path as a routing convention, OR set `action` implicitly in separate thin views. Recommended: two separate URL entries, both pointing to `CaretakerRoommateRequestApprovalView`, but passing the action via `request.data` means the frontend must send `{"action": "approve"}` or `{"action": "reject"}` in the POST body. Looking at the frontend (`workflows.ts` lines 165-190), it sends an empty body for approve and `{"reason": ...}` for reject with no explicit `action` key. So new thin views for approve/reject are needed.

**Visitor invitation action URLs:** The frontend calls `/caretaker/visitor-invitations/{id}/approve/`, `/reject/`, `/check-in/`, `/check-out/` as POST endpoints. These are four separate URL paths best served by a single `VisitorInvitationActionView` or four separate views. Given the existing pattern in the codebase (one view class per logical entity), use one `VisitorInvitationActionView` with the action encoded in the URL path.

### Pattern 4: Placeholder Replacement

**PLC-01 — `CaretakerMaintenanceView.get()` in `views.py` line 853:**
```python
# BEFORE (placeholder):
maintenance_requests = []  # Placeholder - would come from actual model

# AFTER (real ORM):
from caretaker_operations.models import MaintenanceRequest
maintenance_requests = MaintenanceRequest.objects.filter(
    hostel=caretaker.hostel,
    status__in=['received', 'in_progress']
).select_related('room', 'reported_by')
```

**PLC-02 — `CaretakerLateEntryStatsView` in `additional_views.py` lines 47-61:**
```python
# BEFORE (simulation):
for booking in bookings:
    if booking.id % 7 == 0:  # Every 7th booking has a late entry
        late_entries += 1

# AFTER (real ORM):
from caretaker_operations.models import LateEntry
late_entries = LateEntry.objects.filter(
    room__hostel=caretaker.hostel,
    entry_time__date__gte=start_date,
    entry_time__date__lte=end_date
).count()
```

**PLC-03 — Weather stub deletion:**
- Delete `WeatherView` class in `home/views.py` (lines 747–751)
- Delete `path('weather/', views.WeatherView.as_view(), name='weather')` in `home/urls.py` (line 38)
- Delete `Backend/third_party/weather.py`
- The import `# from third_party.weather import get_location_weather` is already commented out — leave the comment removal as bonus cleanup

### Anti-Patterns to Avoid

- **Creating a separate `caretaker/` app:** The app is `caretaker_operations`. Do not create a new app.
- **Putting models in `views.py`:** Models belong in `models.py`, which does not yet exist in this app.
- **Multiple migrations per model:** Create all three models in `models.py` first, then run one `makemigrations` to get a single `0001_initial.py`.
- **ForeignKey to `auth.User` by string:** Use `'accounts.User'` if the project has a custom user model, or check `AUTH_USER_MODEL` in settings. Looking at existing views that import `from accounts.models import CaretakerProfile, StudentProfile` — use `settings.AUTH_USER_MODEL` or the string `'accounts.User'` for ForeignKeys to User.
- **Duplicating existing URL names:** The name `caretaker_roommate_request_action` already exists at line 47 of urls.py — use distinct names for the new roommate approve/reject paths.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status field choices | Custom validation method | Django `choices=` on CharField | Django validates choices at form/serializer level |
| Automatic timestamps | Manual `save()` override | `auto_now_add=True`, `auto_now=True` | Atomic, consistent, no race conditions |
| JSON array fields | Comma-separated CharField | `models.JSONField(default=list)` | Django 3.1+ JSONField handles lists natively |
| Migration management | Manual SQL | `makemigrations` + `migrate` | Django tracks schema state and generates correct SQL |

---

## Common Pitfalls

### Pitfall 1: No migrations directory means first migration creates it
**What goes wrong:** Running `makemigrations caretaker_operations` when the app has no `migrations/` directory raises no error — it creates the directory, `__init__.py`, and `0001_initial.py` automatically. The risk is accidentally referencing the models before migrating.
**Why it happens:** Developer assumes the app is migrated because it's in `INSTALLED_APPS`.
**How to avoid:** After writing models, always run `makemigrations`, then `migrate`, then `python3 manage.py check` before writing views.
**Warning signs:** `OperationalError: no such table: caretaker_operations_visiteorinvitation` in logs.

### Pitfall 2: Roommate-requests vs roommates/match-requests path mismatch
**What goes wrong:** The existing url is `roommates/match-requests/<int:request_id>/` — URL-06 and URL-07 require `roommate-requests/<int:request_id>/approve/` (note: `roommate-requests`, not `roommates/match-requests`). These are different paths.
**Why it happens:** The existing code used a deeper nesting; the frontend expects a flat path.
**How to avoid:** Register new paths `roommate-requests/<int:request_id>/approve/` and `roommate-requests/<int:request_id>/reject/` as separate entries — do not modify the existing `roommates/match-requests/` path.
**Warning signs:** Frontend receives 404 on `POST /api/v1/caretaker/roommate-requests/5/approve/`.

### Pitfall 3: Frontend approve/reject sends no `action` key in body
**What goes wrong:** The existing `CaretakerRoommateRequestApprovalView.post()` reads `action = request.data.get('action')` and returns 400 if it's not `approve` or `reject`. But the frontend calls `/roommate-requests/{id}/approve/` with an empty body (no `action` key in payload).
**Why it happens:** The frontend encodes the action in the URL, not the request body.
**How to avoid:** Write two thin new views (or route by URL kwargs) — `CaretakerRoommateApproveView` and `CaretakerRoommateRejectView` — each hardcoding the action, rather than routing through the existing generic view.
**Warning signs:** `POST /api/v1/caretaker/roommate-requests/5/approve/` returns `{"error": "Action must be either 'approve' or 'reject'"}`.

### Pitfall 4: LateEntry `_get_frequent_offenders` and `_calculate_average_entries_per_week` still use simulations
**What goes wrong:** PLC-02 targets `_get_late_entries_for_period()` which contains the `booking.id % 7` loop. But `_get_frequent_offenders()` also uses `occupant.id % 5` simulation and `_calculate_average_entries_per_week` calls `_get_late_entries_for_period` in a loop.
**Why it happens:** All three helper methods use mock data. Replacing only the target method leaves the others broken.
**How to avoid:** Replace all three simulation methods in `CaretakerLateEntryStatsView` when addressing PLC-02.
**Warning signs:** Late entry stats endpoint returns consistent fake integers even after migration.

### Pitfall 5: Weather stub `from third_party.weather import` is already commented out
**What goes wrong:** When deleting `third_party/weather.py`, the import in `home/views.py` is already a comment (`# from third_party.weather import get_location_weather`). Deleting the file is safe.
**Why it happens:** The stub was commented out at some prior point.
**How to avoid:** Verify the import is commented before deleting the file — it is (line 15 of `home/views.py`).
**Warning signs:** `ImportError: cannot import name 'get_location_weather'` — this will NOT happen because the import is commented.

### Pitfall 6: `caretaker_operations` has no `serializers.py`
**What goes wrong:** Without serializers, new views that return model instances must hand-roll dict serialization (which is the existing pattern in `views.py`). This is acceptable for consistency with the existing codebase style, but a `serializers.py` file will be needed if DRF serializers are used.
**Why it happens:** The app was originally built without models, so no serializer file was created.
**How to avoid:** Either continue the existing hand-rolled dict pattern (consistent with all existing views in this app) or create `serializers.py`. The existing pattern is acceptable and consistent — use it.

---

## Code Examples

### Creating the missing URL paths (URL-06, URL-07 — existing view, new paths)

```python
# Source: caretaker_operations/urls.py — add these entries
# Two new thin views needed because frontend sends empty body (no 'action' key)
path('roommate-requests/<int:request_id>/approve/', views.CaretakerRoommateApproveView.as_view(), name='caretaker_roommate_approve'),
path('roommate-requests/<int:request_id>/reject/', views.CaretakerRoommateRejectView.as_view(), name='caretaker_roommate_reject'),
```

### Visitor invitation URL pattern

```python
# Source: frontend/src/features/caretaker/api/workflows.ts (URL shapes)
path('visitor-invitations/', views.VisitorInvitationListView.as_view(), name='caretaker_visitor_invitations'),
path('visitor-invitations/<int:pk>/approve/', views.VisitorInvitationApproveView.as_view(), name='caretaker_visitor_invitation_approve'),
path('visitor-invitations/<int:pk>/reject/', views.VisitorInvitationRejectView.as_view(), name='caretaker_visitor_invitation_reject'),
path('visitor-invitations/<int:pk>/check-in/', views.VisitorInvitationCheckInView.as_view(), name='caretaker_visitor_invitation_checkin'),
path('visitor-invitations/<int:pk>/check-out/', views.VisitorInvitationCheckOutView.as_view(), name='caretaker_visitor_invitation_checkout'),
```

### Real ORM query replacing `maintenance_requests = []`

```python
# Source: PLC-01 fix in caretaker_operations/views.py CaretakerMaintenanceView.get()
from caretaker_operations.models import MaintenanceRequest as MaintenanceRequestModel
maintenance_requests_qs = MaintenanceRequestModel.objects.filter(
    hostel=caretaker.hostel,
    status__in=['received', 'in_progress']
).select_related('room', 'reported_by')
# Replace `active_maintenance_requests: len(maintenance_requests)` with:
# active_maintenance_requests: maintenance_requests_qs.filter(room=room).count()
```

### `AUTH_USER_MODEL` for ForeignKey

```python
# Source: standard Django pattern; confirmed by checking accounts.models imports in views.py
# Use string reference to avoid circular import
from django.conf import settings
# In model:
reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, ...)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `models.JSONField` required PostgreSQL | `models.JSONField` works with SQLite/PostgreSQL | Django 3.1 | Can safely use JSONField for `photos_before`, `photos_after` arrays |
| Manual `__init__.py` in migrations/ | `makemigrations` creates migrations/ directory | Django 1.x | No manual directory creation needed |

---

## Open Questions

1. **`AUTH_USER_MODEL` — is it a custom user model or `auth.User`?**
   - What we know: `accounts.models` contains `CaretakerProfile`, `StudentProfile` and imports of user. Views reference `request.user` directly.
   - What's unclear: Whether `AUTH_USER_MODEL = 'accounts.User'` or `= 'auth.User'`.
   - Recommendation: Use `settings.AUTH_USER_MODEL` in ForeignKey definitions to be safe. Check `rumi/settings.py` before writing models — the import pattern `from accounts.models import ...` suggests a custom user model.

2. **Should `MaintenanceRequest` use `hostel` ForeignKey or derive it from `room.hostel`?**
   - What we know: Frontend type has both `hostelId` and `roomId` as separate fields.
   - What's unclear: Whether redundant `hostel` FK is needed or a `@property` can derive it.
   - Recommendation: Include `hostel` as a direct FK for query efficiency (avoids join through room for hostel-scoped queries, consistent with how `DamageReport` uses `room__hostel` filters).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + pytest-django |
| Config file | `Backend/pytest.ini` |
| Quick run command | `cd Backend && python3 -m pytest caretaker_operations/ -x -q` |
| Full suite command | `cd Backend && python3 -m pytest -x -q` |

Note: `pytest.ini` currently sets `testpaths = accounts hostels payments`. To run caretaker_operations tests, pass the path explicitly.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOD-01 | `VisitorInvitation` model creates and saves correctly | unit | `python3 -m pytest caretaker_operations/tests.py::TestVisitorInvitation -x` | No — Wave 0 |
| MOD-02 | `MaintenanceRequest` model creates and saves correctly | unit | `python3 -m pytest caretaker_operations/tests.py::TestMaintenanceRequest -x` | No — Wave 0 |
| MOD-03 | `LateEntry` model creates and saves correctly | unit | `python3 -m pytest caretaker_operations/tests.py::TestLateEntry -x` | No — Wave 0 |
| MOD-04 | `python3 manage.py migrate` runs without error | smoke | `cd Backend && python3 manage.py migrate --run-syncdb 2>&1` | No — manual run |
| URL-01 | `GET /api/v1/caretaker/visitor-invitations/` returns 200 | integration | `python3 -m pytest caretaker_operations/tests.py::TestVisitorInvitationURLs -x` | No — Wave 0 |
| URL-02–05 | Action endpoints return correct status transitions | integration | `python3 -m pytest caretaker_operations/tests.py::TestVisitorInvitationActions -x` | No — Wave 0 |
| URL-06–07 | Roommate approve/reject return correct responses | integration | `python3 -m pytest caretaker_operations/tests.py::TestRoommateRequestURLs -x` | No — Wave 0 |
| URL-08 | `GET /api/v1/caretaker/maintenance/{id}/` returns 200 | integration | `python3 -m pytest caretaker_operations/tests.py::TestMaintenanceDetailURL -x` | No — Wave 0 |
| URL-09 | `GET /api/v1/caretaker/damage-reports/{id}/` returns 200 | integration | `python3 -m pytest caretaker_operations/tests.py::TestDamageReportDetailURL -x` | No — Wave 0 |
| PLC-01 | Maintenance list returns DB records, not empty list | integration | `python3 -m pytest caretaker_operations/tests.py::TestMaintenancePlaceholder -x` | No — Wave 0 |
| PLC-02 | Late entry stats count from LateEntry table, not mod 7 | unit | `python3 -m pytest caretaker_operations/tests.py::TestLateEntryPlaceholder -x` | No — Wave 0 |
| PLC-03 | `GET /api/v1/home/weather/` returns 404 | smoke | `cd Backend && python3 manage.py check && python3 -m pytest home/ -k weather` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd Backend && python3 manage.py check`
- **Per wave merge:** `cd Backend && python3 -m pytest caretaker_operations/ payments/ -x -q`
- **Phase gate:** `cd Backend && python3 -m pytest -x -q` + `python3 manage.py check`

### Wave 0 Gaps
- [ ] `Backend/caretaker_operations/models.py` — new file required before any tests run
- [ ] `Backend/caretaker_operations/migrations/` — created by `makemigrations`
- [ ] `Backend/caretaker_operations/tests.py` — exists but likely empty; needs test classes for all 9 requirements above
- [ ] Update `pytest.ini` `testpaths` to include `caretaker_operations` OR pass path explicitly in all test commands

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `Backend/caretaker_operations/views.py` — full view inventory, placeholder locations
- Direct file reads: `Backend/caretaker_operations/urls.py` — existing URL registrations, missing URLs confirmed
- Direct file reads: `Backend/home/views.py`, `Backend/home/urls.py` — weather stub location and structure
- Direct file reads: `Backend/third_party/weather.py` — stub implementation confirmed minimal
- Direct file reads: `frontend/src/features/caretaker/api/workflows.ts` — VisitorInvitation type contract, URL shapes, request body shapes
- Direct file reads: `frontend/src/features/caretaker/types.ts` — MaintenanceRequest, LateEntryLog type contracts
- Direct file reads: `frontend/src/features/student/api/security.ts` — LateEntryLog (student-facing) with `status` field
- Direct file reads: `Backend/rumi/urls.py` — URL prefix `api/v1/caretaker/` confirmed
- Direct file reads: `Backend/rumi/settings.py` — `caretaker_operations` in `INSTALLED_APPS` confirmed
- Direct file reads: `Backend/caretaker_operations/additional_views.py` — full placeholder code confirmed

### Secondary (MEDIUM confidence)
- `python3 manage.py showmigrations caretaker_operations` output: "(no migrations)" confirmed

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Model field definitions: HIGH — sourced directly from TypeScript interfaces, no inference
- URL paths: HIGH — sourced from frontend API call files, exact strings visible
- Placeholder locations: HIGH — source lines quoted directly from file reads
- View existence for URL-06/07: HIGH — `CaretakerRoommateRequestApprovalView.post(request, request_id)` signature confirmed
- Migration strategy: HIGH — confirmed via `showmigrations` output
- Weather stub: HIGH — exact line numbers confirmed in `home/views.py` and `home/urls.py`
- ForeignKey to User: MEDIUM — `AUTH_USER_MODEL` value not verified (flagged as open question)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable Django codebase, 30-day window)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOD-01 | `VisitorInvitation` model created with fields matching `frontend/src/types/caretaker.types.ts` contract | Type contract sourced from `workflows.ts` VisitorInvitation interface; full field list and Django type mappings documented above |
| MOD-02 | `MaintenanceRequest` model created with fields matching frontend caretaker types contract | Type contract sourced from `types.ts` MaintenanceRequest interface; full field list documented above |
| MOD-03 | `LateEntry` model created with fields matching frontend types contract | Type contract sourced from `security.ts` LateEntryLog and `types.ts` LateEntryLog; full field list documented above |
| MOD-04 | Migrations written and applied for all three new models | `caretaker_operations` has no migrations directory; `makemigrations` creates it; single `0001_initial.py` covers all three models |
| URL-01 | `GET/POST /api/v1/caretaker/visitor-invitations/` registered and wired to real view using `VisitorInvitation` model | Path confirmed from `workflows.ts` line 84; new `VisitorInvitationListView` needed |
| URL-02 | `POST /api/v1/caretaker/visitor-invitations/{id}/approve/` registered | Path confirmed from `workflows.ts` line 93; new view needed |
| URL-03 | `POST /api/v1/caretaker/visitor-invitations/{id}/reject/` registered | Path confirmed from `workflows.ts` line 109; new view needed |
| URL-04 | `POST /api/v1/caretaker/visitor-invitations/{id}/check-in/` registered | Path confirmed from `workflows.ts` line 125; new view needed |
| URL-05 | `POST /api/v1/caretaker/visitor-invitations/{id}/check-out/` registered | Path confirmed from `workflows.ts` line 141; new view needed |
| URL-06 | `POST /api/v1/caretaker/roommate-requests/{id}/approve/` registered | Path confirmed from `workflows.ts` line 167; existing `CaretakerRoommateRequestApprovalView` view exists but frontend sends no `action` key in body — thin wrapper view needed |
| URL-07 | `POST /api/v1/caretaker/roommate-requests/{id}/reject/` registered | Path confirmed from `workflows.ts` line 183; same concern as URL-06 |
| URL-08 | `GET /api/v1/caretaker/maintenance/{id}/` detail endpoint registered using `MaintenanceRequest` model | Path confirmed from `caretaker.ts` line 161; new `MaintenanceRequestDetailView` needed |
| URL-09 | `GET /api/v1/caretaker/damage-reports/{id}/` detail endpoint registered | Path confirmed from `damage-reports.ts` line 63; existing `CaretakerDamageReportView` only has list/create; detail view needed |
| PLC-01 | `caretaker_operations/views.py` `maintenance_requests = []` replaced with real `MaintenanceRequest` ORM query | Exact location: `CaretakerMaintenanceView.get()` line 853; replacement ORM query documented above |
| PLC-02 | `caretaker_operations/additional_views.py` `booking.id % 7` simulation replaced with real `LateEntry` model query | Exact location: `CaretakerLateEntryStatsView._get_late_entries_for_period()` lines 47-61; two other simulation methods also need replacement |
| PLC-03 | Weather stub removed — `third_party/weather.py` + `home/views.py:WeatherView` + URL registration deleted | `WeatherView` at `home/views.py` lines 747-751; URL at `home/urls.py` line 38; `third_party/weather.py` is the stub file; import already commented out |
</phase_requirements>
