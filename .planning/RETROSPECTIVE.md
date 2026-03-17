# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — RUMI Backend MVP

**Shipped:** 2026-03-17
**Phases:** 8 | **Plans:** 30 | **Timeline:** 10 days (2026-03-07 → 2026-03-17)

### What Was Built
- All Paystack and M-Pesa payment webhooks fixed — silent production crashes and wrong-domain callbacks eliminated
- `admin_endpoints/` fully deleted — all views consolidated into `admin_api/`, zero cross-imports
- All 6 stub payment views promoted to `payments/views.py`; `stubs_views.py` deleted
- 3 caretaker models (VisitorInvitation, MaintenanceRequest, LateEntry) created with 9 URL endpoints wired
- Celery beat schedule corrected, `on_commit` wrappers added, booking/payment notification tasks wired
- N+1 queries eliminated on hostel/room/booking endpoints; Redis caching on two high-traffic routes
- S3 storage wired behind `USE_S3` feature flag; local dev unchanged
- Integration tests for M-Pesa lifecycle, Paystack HMAC, assertNumQueries regression guards, booking state machine

### What Worked
- **Strict dependency ordering** — fixing silent failures first (Phase 1) meant all subsequent testing produced trustworthy results
- **Wave-based parallel execution** — independent plans within a phase ran in parallel, cutting wall-clock time significantly
- **TDD stubs written first** — RED→GREEN pattern in Phases 5 and 6 caught scope issues before implementation
- **Verifier agents** — post-phase goal verification caught tracking gaps and confirmed real delivery vs just task completion
- **Phase 8 test suite uncovered two production bugs** — `gross_platform_revenue` non-model field assignment and invalid `select_related('landlord')` would have silently broken Paystack in production indefinitely

### What Was Inefficient
- **Tracking gaps accumulated** — REQUIREMENTS.md checkboxes and Phase 5 ROADMAP entry were never updated during execution, requiring a cleanup pass at milestone completion. Add a tracking step to the executor workflow.
- **ROADMAP plan-level checkboxes** — individual plan `[ ]` items inside phase details were never ticked, only the phase-level header was updated. The executor should tick these as plans complete.
- **Phase 5 ROADMAP entry left as `[ ]`** — Phase 5 executed and verified but the header checkbox was never marked `[x]`. The `phase complete` CLI step should be mandatory per phase, not optional.

### Patterns Established
- Use `transaction.on_commit(lambda: task.delay(...))` for all Celery dispatches inside atomic blocks — discovered 6 violations and fixed them in Phase 5
- Paystack webhook outer `except Exception` must return HTTP 200 (not 500) to prevent infinite Safaricom/Paystack retries
- Use `select_related` and `prefetch_related` in ViewSet `get_queryset()`, never in serializer methods — serializer-level fetching causes N+1 per object

### Key Lessons
1. **Test the payment path first, always** — Phase 8 tests found two production-breaking bugs that had been silently failing since before this project started. Test coverage of payment webhooks should be a Phase 1 concern, not Phase 8.
2. **Phase tracking must be automatic** — Manual checkbox updates in ROADMAP/REQUIREMENTS are error-prone. The executor's `phase complete` command should be required, not optional, after every phase.
3. **Verification agents find real gaps** — The verifier's goal-backward analysis (checking actual codebase against phase goals) consistently caught things that task completion alone would miss.
4. **`deferred-items.md` is valuable** — Phase 5's deferred items file correctly captured the date-dependent test assertion bug without scope-creeping into Phase 5.

### Cost Observations
- Model mix: 100% sonnet (all phases executed with sonnet executor + verifier)
- Sessions: ~10 sessions across 10 days
- Notable: Parallel wave execution in phases with 4–6 plans (Phases 4, 6) provided the highest efficiency gain

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 8 | 30 | Initial baseline — wave execution, TDD stubs, verifier agents established |

### Cumulative Quality

| Milestone | Integration Tests Added | Requirements | Zero-Regression |
|-----------|------------------------|--------------|-----------------|
| v1.0 | 7 new test classes | 52/52 | ✓ (13 tests pass, 0 regressions) |

### Top Lessons (Verified Across Milestones)

1. Silent production failures should be fixed before any test coverage is added — tests on broken code give false confidence
2. Parallel plan execution within waves is the biggest time multiplier for phases with independent plans