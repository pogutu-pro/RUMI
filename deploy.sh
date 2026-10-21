#!/bin/bash
# Deploy origin/main to the Oracle server (rumiarent.com).
#
# Run by the rumi-deploy.timer every 2 minutes, or by hand:
#   sudo /opt/rumi/deploy.sh           # deploy if main has moved on
#   sudo /opt/rumi/deploy.sh --force   # rebuild and restart anyway
#
# Order matters: the new images are built while the current site keeps
# running, so a failed build changes nothing. The database is backed up
# just before the swap, because the backend runs migrations on start.
set -euo pipefail

DEPLOY_DIR="/opt/rumi"
LOG_FILE="/var/log/rumi-deploy.log"
STATE_FILE="$DEPLOY_DIR/.deployed-commit"
COMPOSE="docker compose -f docker-compose.prod.yml -f docker-compose.oracle.yml"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# One deploy at a time (the timer can fire while a slow build is running).
exec 9>/tmp/rumi-deploy.lock
flock -n 9 || exit 0

cd "$DEPLOY_DIR"
git fetch -q origin main
TARGET="$(git rev-parse origin/main)"
DEPLOYED="$(cat "$STATE_FILE" 2>/dev/null || true)"
if [ "$TARGET" = "$DEPLOYED" ] && [ "${1:-}" != "--force" ]; then
    exit 0
fi

log "=== Deploying ${TARGET:0:8} (was ${DEPLOYED:0:8}) ==="
git merge -q --ff-only origin/main

log "Building images (the running site is untouched)..."
if ! $COMPOSE build >> "$LOG_FILE" 2>&1; then
    log "BUILD FAILED: still serving ${DEPLOYED:0:8}. Fix main and push again."
    exit 1
fi

log "Backing up the database..."
mkdir -p backups
BACKUP="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"
docker exec rumi-db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$BACKUP"
find backups -name 'pre-deploy-*.sql.gz' -mtime +14 -delete

log "Starting the new version (migrations run as the backend starts)..."
$COMPOSE up -d >> "$LOG_FILE" 2>&1

# Wait for the backend to finish migrating and answer, then check the books.
for _ in $(seq 1 30); do
    if docker logs --since 5m rumi-backend 2>&1 | grep -q "Listening at"; then break; fi
    sleep 5
done
if $COMPOSE exec -T backend python manage.py ledger_backfill --check >> "$LOG_FILE" 2>&1; then
    log "Ledger check passed."
else
    log "WARNING: ledger check failed; see the log above. Backup: $BACKUP"
fi

echo "$TARGET" > "$STATE_FILE"
docker image prune -f > /dev/null
log "=== Deployed ${TARGET:0:8} ==="
