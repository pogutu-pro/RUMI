# Phase 7: Infrastructure - Research

**Researched:** 2026-03-17
**Domain:** Django S3 storage wiring, boto3 upgrade, file attachment compat
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**boto3 Upgrade (INF-01)**
- Upgrade `boto3==1.29.7` to current stable in `requirements.txt`
- Also verify `botocore` and `django-storages` remain compatible
- `django-storages==1.14.2` is already installed — no version change needed unless boto3 upgrade requires it

**USE_S3 Feature Flag (INF-02)**
- Add `USE_S3 = env.bool('USE_S3', default=False)` to settings
- Use Django 4.2+ `STORAGES` dict (not legacy `DEFAULT_FILE_STORAGE`)
- When `USE_S3=true`: activate `storages.backends.s3boto3.S3Boto3Storage` as `default` storage
- When `USE_S3=false` (default): keep `django.core.files.storage.FileSystemStorage` — no change to local dev
- Required AWS env vars (minimal scope for VPS):
  ```
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_STORAGE_BUCKET_NAME
  AWS_S3_REGION_NAME
  ```
- No ACL, no CloudFront, no custom domain — VPS serves via pre-signed URLs or Django proxy

**S3 File Organization (INF-02)**
- Use `AWS_LOCATION = 'media'` so S3 paths mirror existing local structure:
  - `media/receipts/pdf/...`
  - `media/profiles/...`
- This makes future `aws s3 sync` commands straightforward

**ReceiptGenerateView URL Audit (INF-03)**
- Audit `ReceiptGenerateView` and `receipt_service.py` for any hardcoded `/media/` strings
- All receipt URLs must use `receipt.pdf_file.url` (Django storage backend URL) — not string concatenation
- Critical fix: `receipt_service.py:86` uses `receipt.pdf_file.path` for email attachment — `.path` does not exist on S3 files
  - Fix: replace `email.attach_file(receipt.pdf_file.path)` with `email.attach(filename, receipt.pdf_file.read(), 'application/pdf')`
  - This works for both local filesystem and S3 storage

**Media Sync Documentation (INF-04)**
- Document sync command as a comment block in settings.py above the `USE_S3` block, plus a note in `.env.example`
- Command to document:
  ```bash
  aws s3 sync Backend/media/ s3://$AWS_STORAGE_BUCKET_NAME/media/ --exclude "*.DS_Store"
  ```
- Existing files: 21 PDF receipts in `Backend/media/receipts/pdf/` + profile images in `Backend/media/profiles/`
- Note: run sync before setting `USE_S3=true` in production to avoid broken receipt URLs

### Claude's Discretion

None specified — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- MinIO / self-hosted object storage on VPS: viable alternative to AWS S3 — consider for future infrastructure phase if AWS costs are a concern
- CDN / pre-signed URL expiry: not needed now, note for future hardening phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INF-01 | `boto3` upgraded from `1.29.7` to current stable in `requirements.txt` | Current stable is `1.42.69` (verified via pip index). `django-storages` can be bumped to `1.14.6` (also available). No breaking API changes in boto3 for django-storages S3 usage between 1.29 and 1.42. |
| INF-02 | `USE_S3` environment variable flag added to settings — activates `S3Boto3Storage` in production, keeps local disk for dev/CI | Django 4.2 `STORAGES` dict pattern confirmed. Settings file uses `os.getenv` / `python-dotenv` pattern throughout — use same approach. No `django-environ` in project; use `os.getenv('USE_S3', 'False').lower() == 'true'`. |
| INF-03 | `ReceiptGenerateView` audited and updated to use storage backend URLs (not hardcoded `/media/` paths) before S3 is enabled | Audit complete: `additional_views.py:164` already uses `receipt.pdf_file.url` (GOOD). `receipt_service.py:86` uses `receipt.pdf_file.path` (BAD — must fix). No other hardcoded `/media/` strings found in payments views. |
| INF-04 | Existing local media files documented for sync to S3 before production S3 enablement | 21 PDFs in `Backend/media/receipts/pdf/`, 1 profile image in `Backend/media/profiles/`. Sync command and ordering note belong as settings.py comment block + `.env.example` section. |
</phase_requirements>

---

## Summary

Phase 7 is a focused infrastructure hardening phase with four discrete, non-overlapping tasks. The scope is well-defined and the decisions are all locked. The biggest runtime risk is the `receipt.pdf_file.path` call in `receipt_service.py:86` — `.path` raises `NotImplementedError` on S3-backed storage. This must be fixed before `USE_S3=true` is ever set in production, and the fix is a one-liner replacement.

The boto3 upgrade is a version bump only. The jump from `1.29.7` to `1.42.69` is large numerically but boto3 uses calendar-versioning semantics — minor/patch bumps are additive. `django-storages 1.14.2` is compatible with boto3 1.42.x (it has no strict boto3 upper bound in its dependencies). Bumping `django-storages` from `1.14.2` to `1.14.6` is also safe and brings minor bug fixes.

The Django `STORAGES` dict introduced in Django 4.2 is the correct pattern for this project (Django 4.2.7 is installed). The legacy `DEFAULT_FILE_STORAGE` string setting still works in 4.2 but emits a deprecation warning. Settings uses `os.getenv` + `python-dotenv` throughout — no `django-environ` — so `USE_S3` must be read with `os.getenv('USE_S3', 'False').lower() == 'true'`.

**Primary recommendation:** Fix `receipt_service.py:86` before all else; then add the STORAGES block; then bump boto3/django-storages; then document INF-04. These four tasks are independent and can be planned as a single wave.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| boto3 | 1.42.69 | AWS SDK — S3 file operations | Required by django-storages S3 backend |
| django-storages | 1.14.6 | Django storage backends including S3Boto3Storage | Standard Django S3 integration |
| botocore | auto (pinned by boto3) | Low-level AWS client | boto3 dependency — do not pin separately |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-dotenv | 1.0.1 (already installed) | Load `.env` into `os.environ` | Already used in settings.py via `load_dotenv()` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `os.getenv` for USE_S3 | `django-environ` `env.bool()` | Not in project — stick with `os.getenv` pattern already used everywhere in settings.py |
| `django-storages S3Boto3Storage` | `boto3` direct | Hand-rolling storage is unnecessary; django-storages handles the Django integration surface |

**No installation needed** — both boto3 and django-storages are already in requirements.txt. Only version numbers change:

```bash
# In Backend/requirements.txt, update:
boto3==1.42.69
django-storages==1.14.6
```

---

## Architecture Patterns

### Recommended Settings Block

```python
# Source: django-storages official docs + Django 4.2 STORAGES docs
# =============================================================================
# S3 / Media Storage
#
# Pre-production checklist:
#   1. Run sync BEFORE setting USE_S3=true to avoid broken existing receipt URLs:
#      aws s3 sync Backend/media/ s3://$AWS_STORAGE_BUCKET_NAME/media/ --exclude "*.DS_Store"
#   2. Set AWS_* env vars in your VPS .env
#   3. Then set USE_S3=true
# =============================================================================

USE_S3 = os.getenv('USE_S3', 'False').lower() == 'true'

if USE_S3:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME')
    AWS_LOCATION = 'media'
    AWS_DEFAULT_ACL = None  # Bucket policy controls access; no per-object ACL
    AWS_S3_FILE_OVERWRITE = False  # Avoid silent clobber on re-upload

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }
else:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }
```

**Why `AWS_S3_FILE_OVERWRITE = False`:** If a receipt PDF is re-generated with the same filename, the old file is preserved. This prevents accidental clobber without triggering ACL errors.

**Why `staticfiles` must be included in STORAGES:** Django 4.2+ raises `ImproperlyConfigured` if you define a `STORAGES` dict that omits `staticfiles`. The project uses whitenoise for static — replicate that key.

### Pattern: Storage-Agnostic Email Attachment

The current `receipt_service.py:86` uses:
```python
email.attach_file(receipt.pdf_file.path)  # BROKEN on S3
```

Replace with:
```python
# Works for both FileSystemStorage and S3Boto3Storage
filename = receipt.pdf_file.name.split('/')[-1]
with receipt.pdf_file.open('rb') as f:
    email.attach(filename, f.read(), 'application/pdf')
```

`FieldFile.open()` is the storage-agnostic way to read file content. It is available on both local and S3 backends. `FieldFile.path` only works on `FileSystemStorage` and raises `NotImplementedError` on S3.

### Pattern: URL in View Response

`additional_views.py:164` already uses:
```python
'receipt_url': receipt.pdf_file.url if receipt.pdf_file else None,
```
This is correct. `.url` delegates to the active storage backend and returns an S3 presigned URL when `USE_S3=true`, or a `/media/...` URL when local.

### .env.example Addition

Append to `Backend/.env.example`:
```
# =============================================================================
# AWS S3 Media Storage (Production)
# Set USE_S3=true only AFTER running: aws s3 sync Backend/media/ s3://$AWS_STORAGE_BUCKET_NAME/media/ --exclude "*.DS_Store"
# =============================================================================
USE_S3=False
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=af-south-1
```

### Anti-Patterns to Avoid

- **Defining `STORAGES` without `staticfiles` key:** Django 4.2 raises `ImproperlyConfigured`. Always include both keys.
- **Reading `receipt.pdf_file.path` in email code:** Raises `NotImplementedError` on S3. Use `open('rb')` + `read()` instead.
- **Hardcoding `/media/` in URL construction:** Breaks when `MEDIA_URL` changes or S3 is active. Always use `.url`.
- **Setting `USE_S3=true` before running `aws s3 sync`:** All existing receipt URLs in the database point to local paths. If S3 is enabled before sync, those URLs 404.
- **Pinning `botocore` separately in requirements.txt:** boto3 manages botocore version via its own dependency pinning. A separate `botocore==` line can create version conflicts.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| S3 file upload/download | Custom boto3 S3 client in views | `django-storages S3Boto3Storage` | Storage backend handles FieldFile integration, URL generation, save/delete hooks |
| Storage-agnostic file reads | `if USE_S3: ... else: open(path)` branching | `FieldFile.open('rb')` | Django FieldFile API is already storage-agnostic |
| AWS credential loading | `boto3.client(key=..., secret=...)` inline | `os.getenv` + AWS SDK default chain | Environment variables are picked up automatically |

---

## Common Pitfalls

### Pitfall 1: STORAGES dict missing staticfiles key
**What goes wrong:** Django raises `ImproperlyConfigured: Setting STORAGES must include a 'staticfiles' key.` on startup.
**Why it happens:** Django 4.2 requires both `default` and `staticfiles` in the STORAGES dict when it is defined.
**How to avoid:** Always define both keys. Copy `whitenoise.storage.CompressedManifestStaticFilesStorage` from the existing implied default.
**Warning signs:** App fails to start after adding STORAGES block.

### Pitfall 2: receipt.pdf_file.path on S3
**What goes wrong:** `NotImplementedError: This backend doesn't support absolute paths.` when sending receipt emails after S3 is enabled.
**Why it happens:** `.path` is only implemented by `FileSystemStorage`. S3Boto3Storage explicitly raises `NotImplementedError`.
**How to avoid:** Fix `receipt_service.py:86` in this phase. Use `FieldFile.open('rb')` + `f.read()`.
**Warning signs:** Email receipt sending crashes with `NotImplementedError` in logs.

### Pitfall 3: Enabling USE_S3 before media sync
**What goes wrong:** All existing receipt PDF URLs in the database (`receipts/pdf/receipt_RUMI-*.pdf`) become 404s because S3 bucket is empty.
**Why it happens:** The `pdf_file` field stores relative paths like `receipts/pdf/receipt_RUMI-20260206-2C08E6.pdf`. With S3 active, `.url` constructs an S3 URL — but the file was never uploaded.
**How to avoid:** Run `aws s3 sync` before flipping `USE_S3=true`. This is the core purpose of INF-04 documentation.
**Warning signs:** All existing receipt download links return 403/404 after enabling S3.

### Pitfall 4: botocore version conflict
**What goes wrong:** pip install fails or boto3 behaves unexpectedly if `botocore` is separately pinned in requirements.txt at an incompatible version.
**Why it happens:** boto3 1.42.x requires a matching botocore 1.42.x. If requirements.txt pins `botocore==1.29.x`, pip may error or silently use wrong version.
**How to avoid:** Do not pin botocore in requirements.txt. Let boto3's dependency resolution select it.
**Warning signs:** `pip install -r requirements.txt` shows version conflict warnings.

### Pitfall 5: AWS_DEFAULT_ACL not set — bucket policy required
**What goes wrong:** File uploads succeed but public URLs return 403 if bucket has `Block all public access` enabled and you try to use public-read ACL.
**Why it happens:** New AWS buckets block public ACLs by default since April 2023.
**How to avoid:** Set `AWS_DEFAULT_ACL = None` (let bucket policy control access). For this VPS deployment, receipts are served via Django API response (presigned or direct URL) — no public access needed.
**Warning signs:** S3 upload succeeds, but `.url` returns a URL that returns 403.

---

## Code Examples

### STORAGES block (settings.py)
```python
# Source: Django 4.2 docs https://docs.djangoproject.com/en/4.2/ref/settings/#storages
USE_S3 = os.getenv('USE_S3', 'False').lower() == 'true'

if USE_S3:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME')
    AWS_LOCATION = 'media'
    AWS_DEFAULT_ACL = None
    AWS_S3_FILE_OVERWRITE = False

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }
else:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }
```

### Storage-agnostic email attachment (receipt_service.py)
```python
# Source: Django docs FieldFile.open() https://docs.djangoproject.com/en/4.2/ref/models/fields/#django.db.models.fields.files.FieldFile.open
if receipt.pdf_file:
    filename = receipt.pdf_file.name.split('/')[-1]
    with receipt.pdf_file.open('rb') as f:
        email.attach(filename, f.read(), 'application/pdf')
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'` | `STORAGES = {'default': {...}}` dict | Django 4.2 (2023) | Old string setting still works in 4.2 but deprecated; new STORAGES dict is required in Django 5.x |
| `DEFAULT_STORAGE_CLASS` / `STATICFILES_STORAGE` separate settings | Both in `STORAGES` dict | Django 4.2 | Must include `staticfiles` key when defining `STORAGES` |

**Deprecated/outdated:**
- `DEFAULT_FILE_STORAGE = '...'` string setting: deprecated in Django 4.2, removed in Django 5.1. Do not use.
- `STATICFILES_STORAGE = '...'` string setting: same deprecation timeline.

---

## Open Questions

1. **django-storages version bump needed?**
   - What we know: Current installed is `1.14.2`; latest available is `1.14.6`
   - What's unclear: Whether boto3 1.42.x has any incompatibility with django-storages 1.14.2
   - Recommendation: Bump `django-storages` to `1.14.6` in the same PR as boto3 — it is a safe patch series with no breaking changes

2. **botocore in requirements.txt?**
   - What we know: `botocore` is not separately listed in `Backend/requirements.txt`
   - What's unclear: Whether the venv install added it
   - Recommendation: Do not add `botocore` to requirements.txt — boto3 manages it

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 7.4.3 + pytest-django 4.7.0 |
| Config file | `Backend/pytest.ini` |
| Quick run command | `cd Backend && pytest payments/ -x -q` |
| Full suite command | `cd Backend && pytest` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INF-01 | boto3 bumped, app starts without dependency errors | smoke | `cd Backend && python manage.py check` | ✅ (manage.py check) |
| INF-02 | USE_S3=False keeps FileSystemStorage; USE_S3=True activates S3Boto3Storage | unit | `cd Backend && pytest payments/tests_comprehensive.py -k "storage" -x` | ❌ Wave 0 |
| INF-03 | receipt_service uses .open().read() not .path; ReceiptGenerateView uses .url | manual-only code audit + unit | `cd Backend && pytest payments/tests_comprehensive.py -k "receipt" -x` | ❌ Wave 0 |
| INF-04 | sync command present in settings.py comment + .env.example | manual-only | — code audit | N/A |

**INF-04 is manual-only:** it is documentation content (comment block + .env.example lines), not executable behavior.

### Sampling Rate
- **Per task commit:** `cd Backend && python manage.py check`
- **Per wave merge:** `cd Backend && pytest payments/ -x -q`
- **Phase gate:** `cd Backend && pytest` full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `Backend/payments/tests_comprehensive.py` — add test for storage backend selection (mocking `os.getenv('USE_S3')`) — covers INF-02
- [ ] `Backend/payments/tests_comprehensive.py` — add test that `receipt_service` email attachment uses `open()`/`read()` not `.path` — covers INF-03

*(Note: `payments/tests_comprehensive.py` and `payments/tests_v2.py` exist but likely don't cover storage switching. Planner should add targeted test cases in those files or a new `payments/tests_storage.py`.)*

---

## Sources

### Primary (HIGH confidence)
- `pip index versions boto3` — confirmed current stable is `1.42.69` (2026-03-17)
- `pip index versions django-storages` — confirmed current stable is `1.14.6` (2026-03-17)
- Direct code audit: `Backend/payments/receipt_service.py:86` — `.path` confirmed
- Direct code audit: `Backend/payments/additional_views.py:164` — `.url` confirmed correct
- Direct code audit: `Backend/rumi/settings.py:403-404` — no STORAGES or USE_S3 block exists
- Django 4.2 STORAGES docs — `STORAGES` dict required; both `default` and `staticfiles` keys required
- django-storages S3Boto3Storage — `AWS_LOCATION`, `AWS_DEFAULT_ACL`, `AWS_S3_FILE_OVERWRITE` settings

### Secondary (MEDIUM confidence)
- django-storages changelog 1.14.2→1.14.6: patch series with no breaking S3 changes
- boto3 1.29→1.42 release series: additive changes; no API removals relevant to django-storages S3 usage

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — version numbers verified live via pip index
- Architecture: HIGH — code audit confirms exact lines to change; Django STORAGES pattern is documented
- Pitfalls: HIGH — INF-03 bug confirmed by direct code read; Django deprecation timeline is documented

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (boto3 stable tag moves weekly but pattern is stable 90 days)
