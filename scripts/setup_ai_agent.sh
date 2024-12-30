#!/bin/bash
set -e

CONFIG_DIR="/root/config"
KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"
FILES_DIR="$CONFIG_DIR/files"

mkdir -p "$KEYS_DIR" "$DATA_DIR" "$FILES_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"
ALLOWED_IPS_FILE="$DATA_DIR/ipwhitelist.txt"  # Use correct file path

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_message "Installing required dependencies..."
sudo apt install -y curl gnupg apt-transport-https python3 python3-pip build-essential ufw

log_message "Decrypting API key..."
openssl enc -aes-256-cbc -d -pbkdf2 -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key"
export OPENAI_API_KEY=$(cat "$DECRYPTED_KEY_FILE")

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
    sudo ufw allow from "$ip" to any port 8080
done < "$ALLOWED_IPS_FILE"
sudo ufw enable

log_message "Starting AI Agent server..."
npm install
pm2 start server.js --name ai-agent-server
pm2 startup
pm2 save
