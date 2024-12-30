#!/bin/bash
set -e

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

CONFIG_DIR="/root/config"
KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"

mkdir -p "$KEYS_DIR" "$DATA_DIR"

log_message "Decrypting API key..."
echo "$API_KEY" | openssl enc -aes-256-cbc -salt -out "$KEYS_DIR/api_key.enc" -k "$(hostname)-key"

log_message "Setting up AI Agent..."

# Install dependencies and configure firewall
apt update
apt install -y curl gnupg apt-transport-https python3 python3-pip build-essential ufw nodejs pm2 docker.io

log_message "Configuring firewall and whitelisting IPs..."
ufw allow ssh
ufw default deny incoming
while read -r ip; do
    ufw allow from "$ip" to any port 8080
done < /root/ipwhitelist
ufw enable

log_message "Starting AI Agent..."
cd /root
npm install
pm2 start server.js --name ai-agent-server
pm2 save
pm2 startup
