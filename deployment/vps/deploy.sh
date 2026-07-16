#!/usr/bin/env bash
# Run on the VPS to pull latest code and redeploy Docker stack.
# Usage: /opt/intelyhood_chat/deployment/vps/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/intelyhood_chat}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yaml}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> Deploying $(basename "$APP_DIR") (branch: $BRANCH)"

if [[ ! -f .env ]]; then
  echo "ERROR: $APP_DIR/.env missing. Copy from .env.example and configure first."
  exit 1
fi

git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Building and restarting containers"
docker compose -f "$COMPOSE_FILE" build rails sidekiq
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Running migrations"
docker compose -f "$COMPOSE_FILE" run --rm rails bundle exec rails db:intelychat_prepare

echo "==> Status"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Deploy finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
