#!/bin/bash
set -e

DEPLOY_DIR="/opt/rumi"
LOG_FILE="/var/log/rumi-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting RUMI deployment ==="

cd "$DEPLOY_DIR"

log "Pulling latest code from GitHub..."
git pull origin main

log "Building Docker images..."
docker compose -f docker-compose.prod.yml build

log "Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate

log "Cleaning up unused Docker resources..."
docker image prune -f

log "=== Deployment complete ==="
docker compose -f docker-compose.prod.yml ps
