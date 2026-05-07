#!/bin/bash
# Push local changes to GitHub.
# The VPS webhook server listens for pushes and auto-deploys.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(git rev-parse --show-toplevel)"

echo -e "${YELLOW}=== RUMI Push & Deploy ===${NC}"

if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Nothing to commit. Pushing existing commits...${NC}"
else
    echo ""
    echo "Changed files:"
    git status --short
    echo ""

    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        read -r -p "Commit message: " COMMIT_MSG
        if [ -z "$COMMIT_MSG" ]; then
            echo -e "${RED}Commit message cannot be empty.${NC}"
            exit 1
        fi
    fi

    git add -A
    git commit -m "$COMMIT_MSG"
fi

echo -e "${YELLOW}Pushing to GitHub (main)...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✓ Pushed to GitHub.${NC}"
echo -e "${GREEN}✓ The VPS will auto-deploy in ~1-2 minutes via the webhook.${NC}"
echo ""
echo "Watch live deploy logs:"
echo "  ssh root@145.223.83.173 'tail -f /var/log/rumi-deploy.log'"
