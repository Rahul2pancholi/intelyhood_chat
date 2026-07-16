#!/usr/bin/env bash
# Paste/run this ON THE VPS via Contabo NoVNC (as root) so your Mac/Cursor can SSH in.
# It installs your laptop's SSH public key and ensures sshd is running.
set -euo pipefail

# >>> REPLACE with your Mac public key (ssh-rsa / ssh-ed25519 ... ) <<<
PUBKEY="${PUBKEY:-}"

if [[ -z "$PUBKEY" ]]; then
  echo "Usage: PUBKEY='ssh-rsa AAAA... comment' bash enable_ssh_access.sh"
  exit 1
fi

mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

if ! grep -qxF "$PUBKEY" /root/.ssh/authorized_keys; then
  echo "$PUBKEY" >> /root/.ssh/authorized_keys
  echo "Added public key to /root/.ssh/authorized_keys"
else
  echo "Public key already present"
fi

# Ensure SSH server is installed and listening on 22
apt-get update -y
apt-get install -y openssh-server
systemctl enable --now ssh || systemctl enable --now sshd

# Allow password auth as fallback (optional; key is preferred)
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

ss -lntp | grep ':22' || true
echo "SSH ready. From your Mac: ssh root@91.92.136.196  OR  ssh my-vps"
