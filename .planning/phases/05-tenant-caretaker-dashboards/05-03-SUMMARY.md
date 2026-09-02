---
phase: 05-tenant-caretaker-dashboards
plan: 03
subsystem: api
tags: [django, drf, support-tickets, authorization, idor, tdd]

# Dependency graph
requires: []
provides:
  - "SupportTicket.category (general/maintenance), SupportTicket.unit (nullable FK to properties.RentalUnit), SupportTicket.priority (low/medium/high/urgent) — migrated"
  - "SupportTicketSerializer.unit_label (SerializerMethodField) surfacing a human-readable unit string"
  - "_user_can_access_unit(user, unit_id) authorization helper in Backend/support/views.py — closes the IDOR the new unit field would otherwise open for every role"
  - "Validated create endpoint: category/priority checked against their CHOICES, unit id checked against caller's authorized scope, before ticket creation"
affects: [05-05, 05-06]

# Actuals (#2632)
actuals:
  tokens: 5159
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level authorization helper (_user_can_access_unit) mirroring the existing _user_organization_id per-role branch style, called from the view before .objects.create()"
    - "select_related extended to include the new FK + its parent to avoid N+1 on a SerializerMethodField"

key-files:
  created:
    - Backend/support/migrations/0002_supportticket_category_supportticket_priority_and_more.py
  modified:
    - Backend/support/models.py
    - Backend/support/serializers.py
    - Backend/support/views.py
    - Backend/support/tests.py

key-decisions:
  - "Extended the existing SupportTicket model (category/unit/priority) rather than building a parallel maintenance/work-order model — reuses the proven ticket CRUD/detail/messaging/queue path (D-05, per 05-CONTEXT.md)."
  - "_user_can_access_unit fully implemented in Task 1's commit (not stubbed) since the create endpoint cannot safely accept a client-supplied unit id without it — Task 2 then adds the dedicated 5-branch verification test suite for that same helper, per the plan's own task split."

patterns-established:
  - "Authorization gate for a nullable FK accepted from any authenticated role: look up the referenced row, branch on get_canonical_role(user), staff roles bypass, other roles check ownership/assignment/tenancy — return False (not 404) so the endpoint gives a uniform 400 regardless of whether the id doesn't exist or isn't accessible."

requirements-completed: [TEN-02, CARE-02]

coverage:
  - id: D1
    description: "SupportTicket supports category/unit/priority end-to-end: model, migration, serializer, and a validated create endpoint that round-trips all three new fields plus a computed unit_label."
    requirement: "TEN-02"
    verification:
      - kind: unit
        ref: "Backend/support/tests.py#MaintenanceTicketFieldsTests (5 tests: round-trip, invalid category, invalid priority, defaults preserved, list/detail include new fields)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The unit field cannot be used to reference units outside the caller's authorized scope, for any role (landlord/caretaker/tenant scoped, staff roles bypass) — closes the IDOR introduced by the new nullable unit FK (T-05-04)."
    requirement: "CARE-02"
    verification:
      - kind: unit
        ref: "Backend/support/tests.py#MaintenanceTicketUnitScopingTests (6 tests: caretaker allow/deny, tenant allow/deny, landlord cross-org deny, staff bypass)"
        status: pass
    human_judgment: false

# Metrics
duration: 40min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 3: Maintenance-Ready SupportTicket Model Summary

**Extended `SupportTicket` with category/unit/priority fields plus a per-role `_user_can_access_unit` authorization gate, closing an IDOR the new unit FK would otherwise open — verified with 20 passing tests (14 pre-existing + 6 new).**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-09-02
- **Tasks:** 2 completed
- **Files modified:** 5 (1 created: migration; 4 modified: models, serializers, views, tests)

## Accomplishments

- `SupportTicket` model gained `category` (general/maintenance), a nullable `unit` FK to `properties.RentalUnit`, and `priority` (low/medium/high/urgent), all additive and backward-compatible — migrated cleanly against the dev DB.
- `SupportTicketSerializer` surfaces the three new fields plus a `unit_label` `SerializerMethodField` (`"A101 — Property Name"`), with `select_related` extended on both list and detail views to avoid N+1 queries.
- `SupportTicketListCreateView.post` validates `category`/`priority` against their `CHOICES` (400 on invalid) and validates any client-supplied `unit` id against the caller's authorized scope via a new `_user_can_access_unit(user, unit_id)` helper — landlord (own org), caretaker (assigned properties), tenant (own tenancy), staff roles (`tech_support`/`tech_support_admin`/`super_admin`) always allowed.
- 11 new tests added: 5 covering the round-trip/validation/defaults behavior (Task 1), 6 covering the 5 required per-role scoping behaviors (Task 2, one behavior split into an allow + a deny test for the caretaker case). All 20 tests in `support/tests.py` (9 pre-existing + 11 new) pass together.
- `python manage.py makemigrations support --check` confirms no pending model changes left unmigrated.

## Task Commits

Each task was committed atomically, following RED → GREEN for each `tdd="true"` task:

1. **Task 1: Add category/unit/priority to SupportTicket, migrate, and surface via the API**
   - `6188bfd5` (test) — RED: 5 failing tests for round-trip/validation/defaults behavior
   - `f3976a7a` (feat) — GREEN: model fields + migration, serializer, view validation + `_user_can_access_unit`, `select_related` extension
2. **Task 2: General unit-access authorization helper + caretaker/tenant scoping tests**
   - `ade9f7b4` (test) — verification: 6 tests covering all 5 required per-role scoping behaviors (function itself was already implemented in Task 1's commit, per the plan's explicit instruction — see Deviations)

**Plan metadata:** commit skipped — `commit_docs: false` in `.planning/config.json` (worktree mode; orchestrator handles shared-file commits centrally after merge)

## Files Created/Modified

- `Backend/support/migrations/0002_supportticket_category_supportticket_priority_and_more.py` - New migration adding category/unit/priority to SupportTicket
- `Backend/support/models.py` - `CATEGORY_CHOICES`, `PRIORITY_CHOICES` constants; `category`, `unit`, `priority` fields on `SupportTicket`
- `Backend/support/serializers.py` - New fields added to `SupportTicketSerializer.Meta.fields`; `unit_label` `SerializerMethodField`
- `Backend/support/views.py` - `_user_can_access_unit(user, unit_id)` helper; `post()` validates category/priority/unit before create; `select_related` extended on list/detail querysets; `RentalUnit` import added
- `Backend/support/tests.py` - `MaintenanceTicketFieldsTests` (5 tests) and `MaintenanceTicketUnitScopingTests` (6 tests) added

## Decisions Made

- Kept `_user_can_access_unit` a module-level function (not a class-based mixin) to match the existing `_user_organization_id` style in the same file, since `SupportTicketListCreateView` is a plain `APIView`, not a `RumiaBaseView`/`OrganizationScopedMixin` subclass — per the plan's explicit instruction to stay consistent with the existing helper rather than reusing the mixin.
- Landlord branch checks `Organization.objects.filter(id=unit.organization_id, owner=user).exists()` (owner-only), deliberately not using `OrganizationScopedMixin.get_user_organization_ids()`'s broader membership-inclusive check — mirrors `_user_organization_id`'s existing landlord branch exactly, per the plan's explicit call-out to keep the two helpers consistent.
- Returns `False` (leading to a uniform 400 "Unit not found or not accessible") rather than distinguishing 404-vs-403 for a nonexistent vs. inaccessible unit — avoids leaking which unit ids exist to an unauthorized caller.

## Deviations from Plan

**1. [Rule 3 - Blocking] Set `DEBUG=True` for local test invocation only**
- **Found during:** Task 1, first test run attempt
- **Issue:** The worktree has no `.env` file, so `DEBUG` defaults to `False`, which flips on `SECURE_SSL_REDIRECT` in `rumi/settings.py` — every test-client request (made over plain HTTP) got redirected with a 301, masking all real assertions (even pre-existing, previously-passing tests failed this way before any of my changes).
- **Fix:** Invoked `python manage.py test` with `DEBUG=True` set as an environment variable for the command only — no committed file was changed. This is a test-invocation detail, not a code or config fix.
- **Files modified:** None (no commit)
- **Verification:** With `DEBUG=True`, all pre-existing tests pass as expected; without it, they all fail with 301 regardless of any change in this plan.

**2. [Task-structure note, not a Rule 1-4 deviation] Task 2 tests pass without new production code**
- **Found during:** Task 2
- **Context:** The plan's Task 1 action text explicitly directs implementing the full `_user_can_access_unit` helper (with all 5 role branches) as part of Task 1's commit, "since Task 1's create-flow calls it." Task 2 then adds the dedicated scoping test suite for that same, already-complete helper.
- **Effect:** Task 2's 6 new tests passed on first run (no RED phase for Task 2, since the implementation they verify already existed from Task 1). This is the plan's intended structure, not a bug — documented here for transparency since it diverges from a textbook per-task RED→GREEN cycle.
- **Files modified:** `Backend/support/tests.py` only (test-only commit)

---

**Total deviations:** 1 auto-fixed (Rule 3, test-invocation only, no code/config change) + 1 structural note (expected per plan design)
**Impact on plan:** No scope creep. No production code affected by either deviation.

## Issues Encountered

- One test assertion bug (comparing a UUID object to its string form in the list-endpoint scoping test) caught and fixed during the GREEN run — not a deviation, just a test-writing correction.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `SupportTicket.category`/`unit`/`priority` and the `unit_label` serializer field are ready for Plans 05-05 (tenant maintenance-request UI) and 05-06 (caretaker "Log maintenance request" UI) to consume directly — no further backend work needed for the create/list/detail round-trip.
- `_user_can_access_unit` is exercised by 6 tests covering all 5 required role branches; any frontend consumer can rely on a uniform 400 `{'detail': 'Unit not found or not accessible.'}` for any inaccessible or nonexistent unit id.
- No blockers for downstream plans.

---
*Phase: 05-tenant-caretaker-dashboards*
*Completed: 2026-09-02*
