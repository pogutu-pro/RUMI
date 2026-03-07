# Research: Stack Optimization Patterns
**Project:** RUMI Backend Optimization
**Dimension:** Stack — Django 4.2 + DRF specific optimization techniques
**Confidence:** HIGH — direct codebase inspection

---

## Critical Findings

### 1. N+1 Queries Confirmed in Core Serializers

**`HostelSerializer`** — two `SerializerMethodField` methods issue separate queries per hostel:
- `get_landlord_info()` — queries `LandlordProfile` per hostel
- `get_amenities_list()` — queries `HostelAmenity` + `Amenity` per hostel

**`BedSerializer`** — `get_current_occupant()` queries `BedOccupancy` per bed

**`BookingSerializer`** — `get_room_info()` queries `Room` per booking

**Fix:** Add `select_related`/`prefetch_related` in each ViewSet's `get_queryset()`, not in the serializer. Use `assertNumQueries` tests to confirm actual reduction.

```python
# In HostelViewSet.get_queryset()
def get_queryset(self):
    return Hostel.objects.select_related(
        'landlord__user'
    ).prefetch_related(
        'hostel_amenities__amenity',
        'rooms__beds',
    )
```

---

### 2. No `on_commit` Pattern — Celery Tasks Fire Before DB Commit

**Finding:** Celery tasks fired with `.delay()` inside `transaction.atomic()` blocks in:
- `payments/mpesa_webhooks.py`
- `hostels/lifecycle_services.py`
- `payments/tasks.py`

If the task executes before the DB transaction commits, it may read stale data (e.g., transaction status still `pending` when the notification task runs).

**Fix:** Wrap all `.delay()` calls with `transaction.on_commit()`:
```python
# Instead of:
send_payment_notification.delay(transaction_id=txn.id)

# Use:
transaction.on_commit(lambda: send_payment_notification.delay(transaction_id=txn.id))
```

---

### 3. django-celery-beat Missing from requirements.txt

**Finding:** `CELERYBEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'` is referenced in settings but `django-celery-beat` is not in `requirements.txt`. The beat scheduler silently falls back to file-based scheduling.

**Fix:** Add `django-celery-beat==2.6.0` to `requirements.txt` and run `python manage.py migrate` to create beat schedule tables.

---

### 4. Task Name Mismatch in BEAT_SCHEDULE — Silent Beat Failure

**Finding:** `BEAT_SCHEDULE` registers `'payments.tasks.process_late_fees'` but the actual function in `payments/tasks.py` is named `assess_late_fees`. This causes a silent failure on every scheduled cycle — Celery logs "unknown task" and continues without executing.

**Fix:**
```python
# In settings BEAT_SCHEDULE:
'assess-late-fees': {
    'task': 'payments.tasks.assess_late_fees',  # was: process_late_fees
    'schedule': crontab(hour=0, minute=0),
},
```

---

### 5. STK Push Webhook Has No WebhookEvent Idempotency Record

**Finding:** The C2B handler writes a `WebhookEvent` for idempotency. The STK push handler (`mpesa_webhooks.py`) only checks `transaction_obj.status == 'success'` — which has a race condition window (see PITFALLS.md Pitfall #1).

**Fix:** Use `WebhookEvent.objects.get_or_create(transaction_ref=checkout_request_id)` as the very first step in the STK handler, inside a `select_for_update()` block.

---

### 6. WebhookEvent Retry Task Not Registered in BEAT_SCHEDULE

**Finding:** A pending `WebhookEvent` retry task is defined in `payments/tasks.py` (~line 518) but not registered in `BEAT_SCHEDULE`. Failed webhooks are never retried automatically.

**Fix:** Add to `BEAT_SCHEDULE`:
```python
'retry-failed-webhooks': {
    'task': 'payments.tasks.retry_failed_webhook_events',
    'schedule': crontab(minute='*/5'),
},
```

---

### 7. Inconsistent Error Response Shapes

**Finding:** Some apps return `{'error': '...'}`, others return `{'detail': '...'}`. The frontend must handle both formats defensively, which is fragile.

**Fix:** Add a custom DRF exception handler that normalizes all error responses:
```python
# In settings.py REST_FRAMEWORK:
'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',

# In core/exceptions.py:
def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {'error': response.data}
    return response
```

---

## Caching Strategy

### Current State
- Redis is configured as Django cache backend
- `rumi/cache_utils.py` exists with caching utilities
- No systematic caching applied to heavy read endpoints

### Recommended Cache Targets
| Endpoint | TTL | Cache Key |
|----------|-----|-----------|
| `GET /api/v1/hostels/` (public listing) | 5 min | `hostel_list:{city}:{filters_hash}` |
| `GET /api/v1/hostels/{id}/` (hostel detail) | 10 min | `hostel_detail:{id}` |
| `GET /api/v1/home/` (homepage data) | 15 min | `homepage_data` |
| Analytics aggregates | 1 hour | `analytics:{landlord_id}:{date}` |

**Pattern to use:**
```python
from django.core.cache import cache

def get_queryset(self):
    cache_key = f'hostel_list:{city}'
    cached = cache.get(cache_key)
    if cached:
        return cached
    qs = Hostel.objects.select_related(...).prefetch_related(...)
    cache.set(cache_key, qs, timeout=300)
    return qs
```

**Invalidation:** Use `post_save` signals on `Hostel` model to clear relevant cache keys.

---

## DRF Serializer Performance

### Avoid `many=True` with SerializerMethodField Nesting
Each nested serializer with `many=True` that has `SerializerMethodField` multiplies queries. Use `prefetch_related` + direct attribute access instead.

### Use `read_only=True` Consistently
Fields that are never written should declare `read_only=True` — this skips validation overhead on write operations.

### Separate Read and Write Serializers for Heavy Endpoints
Heavy list serializers (hostel listing) can be lighter than detail serializers:
```python
class HostelListSerializer(serializers.ModelSerializer):
    # Minimal fields for listing

class HostelDetailSerializer(serializers.ModelSerializer):
    # Full fields including nested data
```

---

## Payment Task Reliability

### Idempotency Keys for All Payment Operations
Every Celery task that touches a payment record should:
1. Accept a `transaction_id`
2. Re-fetch inside `select_for_update()`
3. Check status before acting
4. Use `on_commit` when dispatched from within `atomic()`

### Celery Task Retry Configuration
```python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_payment_webhook(self, payload):
    try:
        # ... processing
    except TransientError as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## Dependency Updates Needed

| Package | Current | Action |
|---------|---------|--------|
| `boto3` | 1.29.7 (2023) | Upgrade to latest stable |
| `django-celery-beat` | Not in requirements | Add `==2.6.0` |
| `Django` | 4.2.7 | Keep (LTS until 2026) |

---
*Research completed: 2026-03-07*
