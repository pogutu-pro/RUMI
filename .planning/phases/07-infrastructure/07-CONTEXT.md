---
phase: 7
name: Infrastructure
status: context-ready
---

# Phase 7 Context: Infrastructure

## Deployment Context

- **Hosting**: VPS (not Lambda/container/PaaS)
- S3 is for **media file storage only** — not static files, no CDN/CloudFront
- Django serves the app; S3 stores uploaded files (receipts, profiles)

## Decision: boto3 Upgrade (INF-01)

- Upgrade `boto3==1.29.7` → current stable in `requirements.txt`
- Also verify `botocore` and `django-storages` remain compatible
- `django-storages==1.14.2` is already installed — no version change needed unless boto3 upgrade requires it

## Decision: USE_S3 Feature Flag (INF-02)

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

## Decision: S3 File Organization (INF-02)

- Use `AWS_LOCATION = 'media'` so S3 paths mirror existing local structure:
  - `media/receipts/pdf/...`
  - `media/profiles/...`
- This makes future `aws s3 sync` commands straightforward

## Decision: ReceiptGenerateView URL Audit (INF-03)

- Audit `ReceiptGenerateView` and `receipt_service.py` for any hardcoded `/media/` strings
- All receipt URLs must use `receipt.pdf_file.url` (Django storage backend URL) — not string concatenation
- **Critical fix**: `receipt_service.py:86` uses `receipt.pdf_file.path` for email attachment — `.path` does not exist on S3 files
  - Fix: replace `email.attach_file(receipt.pdf_file.path)` with `email.attach(filename, receipt.pdf_file.read(), 'application/pdf')`
  - This works for both local filesystem and S3 storage

## Decision: Media Sync Documentation (INF-04)

- Document sync command as a **comment block in settings.py** above the `USE_S3` block, plus a note in `.env.example`
- Command to document:
  ```bash
  aws s3 sync Backend/media/ s3://$AWS_STORAGE_BUCKET_NAME/media/ --exclude "*.DS_Store"
  ```
- Existing files: 21 PDF receipts in `Backend/media/receipts/pdf/` + profile images in `Backend/media/profiles/`
- Note: run sync **before** setting `USE_S3=true` in production to avoid broken receipt URLs

## Code Context

| File | Relevant Lines | Notes |
|------|---------------|-------|
| `Backend/requirements.txt` | `boto3==1.29.7`, `django-storages==1.14.2` | boto3 needs upgrade |
| `Backend/rumi/settings.py` | L403-404 `MEDIA_URL`, `MEDIA_ROOT` | No S3 config yet — all net-new |
| `Backend/payments/models.py` | L503 `pdf_file = FileField(upload_to='receipts/pdf/')` | Storage-backend-aware already |
| `Backend/payments/receipt_service.py` | L86 `attach_file(receipt.pdf_file.path)` | **Must fix**: use `.read()` not `.path` |
| `Backend/media/receipts/pdf/` | 21 existing PDF files | Need `aws s3 sync` before enabling S3 |
| `Backend/media/profiles/` | Profile images | Same sync required |

## Weather Stub

Already removed (PLC-03 ✓). No action needed in Phase 7.

## Deferred Ideas

- MinIO / self-hosted object storage on VPS: viable alternative to AWS S3 — consider for future infrastructure phase if AWS costs are a concern
- CDN / pre-signed URL expiry: not needed now, note for future hardening phase