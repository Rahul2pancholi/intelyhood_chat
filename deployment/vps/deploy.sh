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

# Prefer deploy-key SSH for private repos (configured in /root/.ssh/config).
export GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new}"

git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Building and restarting containers"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose -f "$COMPOSE_FILE" build rails sidekiq
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Running migrations"
docker compose -f "$COMPOSE_FILE" run --rm rails bundle exec rails db:intelychat_prepare

echo "==> Waiting for Rails"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:3000/; then
    echo "Rails responded on :3000"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "WARNING: Rails did not respond on :3000 yet (nginx may still proxy once ready)"
  fi
done

echo "==> Status"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Deploy finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
