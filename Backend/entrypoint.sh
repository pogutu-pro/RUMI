#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

# Paystack bills the amount on its own plan, so keep it equal to our price.
echo "Syncing Paystack plans..."
python manage.py sync_paystack_plans || echo "Paystack plan sync failed; continuing."

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting gunicorn..."
exec gunicorn rumi.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class gthread \
    --threads 2 \
    --worker-tmp-dir /dev/shm \
    --timeout 60 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
