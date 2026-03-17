---
phase: 07-infrastructure
plan: 02
subsystem: infra
tags: [s3, django-storages, whitenoise, aws, media-storage]

# Dependency graph
requires:
  - phase: 07-infrastructure
    provides: Phase 07 context and INF-02/INF-04 requirements
provides:
  - USE_S3 feature flag in settings.py (default False — local dev unaffected)
  - Django 4.2 STORAGES dict with both FileSystemStorage and S3Boto3Storage branches
  - CompressedManifestStaticFilesStorage in staticfiles key (both branches)
  - Pre-production sync checklist comment in settings.py
  - AWS S3 env vars documented in .env.example
affects: [07-infrastructure, deployment, media-upload, receipt-storage]

# Tech tracking
tech-stack:
  added: []
  patterns: [USE_S3 feature flag gates S3Boto3Storage; STORAGES dict replaces deprecated DEFAULT_FILE_STORAGE; both branches include staticfiles key to satisfy Django 4.2 requirement]

key-files:
  created: []
  modified:
    - Backend/rumi/settings.py
    - Backend/.env.example

key-decisions:
  - "USE_S3=False is the default — local dev and CI use FileSystemStorage with no AWS credentials required"
  - "Both STORAGES branches explicitly set staticfiles key to CompressedManifestStaticFilesStorage — Django 4.2 raises ImproperlyConfigured if missing"
  - "AWS_* vars read via os.getenv() only inside the USE_S3=True branch — no env var pollution in dev"
  - "AWS_S3_FILE_OVERWRITE=False prevents clobbering existing receipt files on re-upload"
  - "Pre-production sync procedure documented as comment block above USE_S3 line — operator must sync existing media BEFORE flipping flag"

patterns-established:
  - "Feature flag pattern: os.getenv('FLAG', 'False').lower() == 'true' — consistent with existing ENABLE_RATE_LIMITING pattern in settings.py"
  - "STORAGES dict conditional on flag — infrastructure behaviour changes via env var, no code change required at deploy time"

requirements-completed: [INF-02, INF-04]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 07 Plan 02: S3 Feature Flag and STORAGES Dict Summary

**USE_S3 feature flag with dual-branch STORAGES dict added to settings.py; AWS S3 env vars and pre-production sync procedure documented in .env.example**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-17T08:58:39Z
- **Completed:** 2026-03-17T08:60:12Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Added USE_S3 feature flag to settings.py using the existing os.getenv() pattern (default False)
- Added STORAGES dict with both branches: S3Boto3Storage when USE_S3=True, FileSystemStorage when USE_S3=False — both include staticfiles key with CompressedManifestStaticFilesStorage
- Inserted pre-production sync checklist comment block documenting exact aws s3 sync command and mandatory ordering (sync before flipping flag)
- Documented all AWS_* env vars in .env.example with placeholder values and sync reminder comment

## Task Commits

Each task was committed atomically:

1. **Task 1: Add USE_S3 flag and STORAGES dict to settings.py** - `2f2fb772` (feat)
2. **Task 2: Append AWS S3 section to .env.example** - `a7901ffe` (chore)

## Files Created/Modified
- `Backend/rumi/settings.py` - USE_S3 flag, AWS_* vars, STORAGES dict (both branches), pre-production checklist comment
- `Backend/.env.example` - AWS S3 Media Storage section with USE_S3 and all AWS_* vars documented

## Decisions Made
- USE_S3=False default ensures existing local dev and CI workflows are entirely unaffected
- Both STORAGES branches include the staticfiles key — Django 4.2 requirement; omitting it raises ImproperlyConfigured
- AWS_S3_FILE_OVERWRITE=False preserves existing receipt PDFs on any re-upload
- Pre-production sync ordered before USE_S3=true flip to prevent receipt URL breakage for the 21 existing PDFs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `python` binary not available in shell path; used `python3` instead — Django check passed with exit 0.

## User Setup Required
When ready to activate S3 in production:
1. Run: `aws s3 sync Backend/media/ s3://$AWS_STORAGE_BUCKET_NAME/media/ --exclude "*.DS_Store"`
2. Set all `AWS_*` env vars in VPS `.env` (see Backend/.env.example for variable names)
3. Set `USE_S3=True` in VPS `.env`
4. Restart Django

## Next Phase Readiness
- INF-02 and INF-04 requirements satisfied
- S3 integration is fully gated behind USE_S3=False — safe to deploy to production immediately
- When S3 is activated, existing receipt URLs under `/media/receipts/pdf/` will continue working because AWS_LOCATION='media' mirrors the local path structure

---
*Phase: 07-infrastructure*
*Completed: 2026-03-17*

## Self-Check: PASSED
- Backend/rumi/settings.py: FOUND
- Backend/.env.example: FOUND
- .planning/phases/07-infrastructure/07-02-SUMMARY.md: FOUND
- Commit 2f2fb772 (Task 1): FOUND
- Commit a7901ffe (Task 2): FOUND
