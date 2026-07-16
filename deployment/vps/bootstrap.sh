#!/usr/bin/env bash
# First-time VPS bootstrap (Ubuntu 22.04 / 24.04).
# Run as root via Contabo NoVNC or SSH:
#   curl -fsSL <raw-url> | bash
# or:
#   git clone <repo> /opt/intelyhood_chat && bash /opt/intelyhood_chat/deployment/vps/bootstrap.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Rahul2pancholi/intelychat.git}"
BRANCH="${DEPLOY_BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/intelyhood_chat}"
DOMAIN="${DOMAIN:-}" # e.g. chat.yourdomain.com (optional for first boot)

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing Docker + git"
apt-get update -y
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# Compose plugin
docker compose version >/dev/null 2>&1 || apt-get install -y docker-compose-plugin

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Cloning $REPO_URL ($BRANCH) → $APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "==> Repo exists, fetching latest"
  git -C "$APP_DIR" fetch --all
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "==> Creating .env from example"
  cp .env.example .env
  SECRET=$(openssl rand -hex 64)
  PG_PASS=$(openssl rand -hex 16)
  REDIS_PASS=$(openssl rand -hex 16)

  FRONTEND="http://$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
  if [[ -n "$DOMAIN" ]]; then
    FRONTEND="https://$DOMAIN"
  fi

  sed -i "s|^SECRET_KEY_BASE=.*|SECRET_KEY_BASE=$SECRET|" .env
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND|" .env
  sed -i "s|^RAILS_ENV=.*|RAILS_ENV=production|" .env
  sed -i "s|^POSTGRES_HOST=.*|POSTGRES_HOST=postgres|" .env
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PG_PASS|" .env
  # Ensure DB name for compose
  grep -q '^POSTGRES_DATABASE=' .env || echo "POSTGRES_DATABASE=intelychat" >> .env
  sed -i "s|^POSTGRES_DATABASE=.*|POSTGRES_DATABASE=intelychat|" .env
  sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASS@redis:6379|" .env
  sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|" .env
  grep -q '^FORCE_SSL=' .env && sed -i "s|^FORCE_SSL=.*|FORCE_SSL=false|" .env

  echo "==> .env created. FRONTEND_URL=$FRONTEND"
  echo "    Edit $APP_DIR/.env for domain/SSL/SMTP before going public."
fi

chmod +x deployment/vps/deploy.sh
bash deployment/vps/deploy.sh

# Open firewall for SSH + HTTP/HTTPS
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw --force enable || true
fi

# Expose app on :80 via simple nginx if no domain/caddy yet
if ! docker compose -f docker-compose.production.yaml ps --status running | grep -q caddy; then
  apt-get install -y nginx
  cat >/etc/nginx/sites-available/intelyhood_chat <<'NGINX'
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
  }
}
NGINX
  ln -sfn /etc/nginx/sites-available/intelyhood_chat /etc/nginx/sites-enabled/intelyhood_chat
  rm -f /etc/nginx/sites-enabled/default
  systemctl enable --now nginx
  systemctl reload nginx
fi

echo ""
echo "==> Bootstrap complete"
echo "    App dir: $APP_DIR"
echo "    Open:   http://$(curl -fsS ifconfig.me 2>/dev/null || echo YOUR_VPS_IP)"
echo "    Next:   point a domain A-record here, set FRONTEND_URL=https://domain, then SSL."
echo "    Deploy: bash $APP_DIR/deployment/vps/deploy.sh"
