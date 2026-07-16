# VPS deploy (eVPS) — Intelyhood Chat

Easy path: **Docker on Ubuntu 24** + **GitHub Actions auto-deploy on `main`**.

Current VPS:

| Field | Value |
|--------|--------|
| IP | `91.92.136.196` |
| User | `root` |
| App dir | `/opt/intelyhood_chat` |
| Deploy branch | `main` |

> Prefer SSH key login. Panel root passwords may rotate.

---

## 0) One-time: fix SSH from Mac / Cursor

Provider console / NoVNC → login as `root`.

Paste (use your Mac public key):

```bash
# After this file is on GitHub `main`, or copy-paste from the repo:
# deployment/vps/enable_ssh_access.sh
PUBKEY='ssh-rsa PASTE_YOUR_MAC_PUBLIC_KEY_HERE' bash /path/to/enable_ssh_access.sh
```

Or manually:

```bash
mkdir -p /root/.ssh && chmod 700 /root/.ssh
echo 'YOUR_MAC_PUBKEY' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
apt-get update && apt-get install -y openssh-server
systemctl enable --now ssh
```

On your Mac `~/.ssh/config`:

```sshconfig
Host my-vps
  HostName 91.92.136.196
  User root
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes
```

Test:

```bash
ssh my-vps
```

Then Cursor → **Remote-SSH** → `my-vps`.

---

## 1) First install (bootstrap)

On the VPS as root:

```bash
export REPO_URL=https://github.com/Rahul2pancholi/intelychat.git
export DEPLOY_BRANCH=main
curl -fsSL https://raw.githubusercontent.com/Rahul2pancholi/intelychat/main/deployment/vps/bootstrap.sh | bash
```

Or after git clone:

```bash
git clone -b main https://github.com/Rahul2pancholi/intelychat.git /opt/intelyhood_chat
bash /opt/intelyhood_chat/deployment/vps/bootstrap.sh
```

This installs Docker, builds the app image, starts Postgres/Redis/Rails/Sidekiq, and puts Nginx on port 80.

Open: `http://91.92.136.196`

Edit production env anytime:

```bash
nano /opt/intelyhood_chat/.env
bash /opt/intelyhood_chat/deployment/vps/deploy.sh
```

Important `.env` keys:

- `FRONTEND_URL` — public URL (`https://your.domain` in prod)
- `SECRET_KEY_BASE`
- `POSTGRES_PASSWORD` / `REDIS_PASSWORD`
- `RAILS_ENV=production`

---

## 2) Manual redeploy

```bash
ssh my-vps
bash /opt/intelyhood_chat/deployment/vps/deploy.sh
```

---

## 3) GitHub Actions auto-deploy

Workflow: `.github/workflows/deploy_vps.yml`  
Triggers on push to `main` (and manual `workflow_dispatch`). No SSH password / interactive step — uses `VPS_SSH_PRIVATE_KEY`.

### Create a deploy key (on your Mac)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/intelyhood_vps_deploy -N '' -C 'github-actions-deploy'
ssh-copy-id -i ~/.ssh/intelyhood_vps_deploy.pub root@91.92.136.196
# or append .pub into VPS /root/.ssh/authorized_keys via NoVNC
```

### GitHub → repo → Settings → Secrets and variables → Actions

| Secret | Example |
|--------|---------|
| `VPS_HOST` | `91.92.136.196` |
| `VPS_USER` | `root` |
| `VPS_SSH_PRIVATE_KEY` | full contents of `~/.ssh/intelyhood_vps_deploy` (private key) |
| `VPS_PORT` | `22` (optional) |
| `VPS_APP_DIR` | `/opt/intelyhood_chat` (optional) |
| `VPS_DEPLOY_BRANCH` | `main` (optional) |

Push to the deploy branch → Actions tab → **Deploy to VPS**.

---

## 4) Domain + HTTPS (later)

1. DNS A record → `91.92.136.196`
2. Set `FRONTEND_URL=https://your.domain` in `.env`
3. Either:
   - Certbot on host Nginx, or
   - `docker compose -f docker-compose.production.yaml --profile with-caddy up -d` (edit `deployment/vps/Caddyfile`)
4. Update Meta WhatsApp webhook to `https://your.domain/webhooks/whatsapp/+PHONE`

---

## 5) Useful commands

```bash
cd /opt/intelyhood_chat
docker compose -f docker-compose.production.yaml ps
docker compose -f docker-compose.production.yaml logs -f rails
docker compose -f docker-compose.production.yaml logs -f sidekiq
bash deployment/vps/deploy.sh
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Connection refused` port 22 | NoVNC → `systemctl start ssh` / check provider firewall |
| Host key changed | `ssh-keygen -R 91.92.136.196` then reconnect |
| Wrong IP after upgrade | Update `HostName` in `~/.ssh/config` + GitHub `VPS_HOST` |
| Deploy Action skipped | Set `VPS_HOST` secret (workflow checks it) |
| App 502 | `docker compose ... ps` — ensure `rails` healthy; check Nginx → `127.0.0.1:3000` |
