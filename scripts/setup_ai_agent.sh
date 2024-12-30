#!/bin/bash
set -e

CONFIG_DIR="/root/config"
KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"
FILES_DIR="$CONFIG_DIR/files"

mkdir -p "$KEYS_DIR" "$DATA_DIR" "$FILES_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"
ALLOWED_IPS_FILE="$DATA_DIR/ipwhitelist.txt"  # Ensure correct path

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_message "Installing required dependencies..."
sudo apt update
sudo apt install -y curl gnupg apt-transport-https python3 python3-pip build-essential ufw

log_message "Decrypting API key..."
if [ -f "$ENCRYPTED_KEY_FILE" ]; then
    openssl enc -aes-256-cbc -d -pbkdf2 -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key"
    export OPENAI_API_KEY=$(cat "$DECRYPTED_KEY_FILE")
else
    log_message "Encrypted API key not found!"
    exit 1
fi

log_message "Configuring Node.js and PM2..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo apt install -y docker.io
sudo systemctl enable --now docker

log_message "Enabling UFW and setting up IP whitelist..."
sudo ufw allow ssh
sudo ufw default deny incoming

# Ensure whitelist exists
if [ ! -f "$ALLOWED_IPS_FILE" ]; then
    log_message "Creating default IP whitelist..."
    echo "127.0.0.1" > "$ALLOWED_IPS_FILE"
fi

while read -r ip; do
    if [[ -n "$ip" && ("$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ || "$ip" =~ ^[0-9a-fA-F:]+$) ]]; then
        sudo ufw allow from "$ip" to any port 8080
        log_message "Added $ip to UFW rules."
    else
        log_message "Skipping invalid IP or empty line: '$ip'"
    fi
done < "$ALLOWED_IPS_FILE"

sudo ufw enable

log_message "Starting AI Agent server..."
npm install
pm2 start server.js --name ai-agent-server
pm2 startup
pm2 save
