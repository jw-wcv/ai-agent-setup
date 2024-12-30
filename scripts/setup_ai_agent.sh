#!/bin/bash
set -e

CONFIG_DIR="/root/config"
KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"
FILES_DIR="/root/ai-agent-setup"  # Corrected to point to the project root

mkdir -p "$KEYS_DIR" "$DATA_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"
ALLOWED_IPS_FILE="$DATA_DIR/ipwhitelist.txt"

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

if [ ! -f "$ALLOWED_IPS_FILE" ]; then
    log_message "Creating default IP whitelist..."
    echo "127.0.0.1" > "$ALLOWED_IPS_FILE"
fi

# Clean up whitelist
sed -i 's/\r//' "$ALLOWED_IPS_FILE"
sed -i '/^$/d' "$ALLOWED_IPS_FILE"
sed -i 's/[[:space:]]*$//' "$ALLOWED_IPS_FILE"

VALID_IPS=$(mktemp)

while read -r ip; do
    log_message "Processing IP: '$ip'"
    if [[ -n "$ip" && ("$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ || "$ip" =~ ^[0-9a-fA-F:]+$) ]]; then
        if sudo ufw allow from "$ip" to any port 8080; then
            log_message "Added $ip to UFW rules."
            echo "$ip" >> "$VALID_IPS"
        else
            log_message "Failed to add $ip. Marking as invalid."
        fi
    else
        log_message "Skipping invalid IP: '$ip'"
    fi
done < "$ALLOWED_IPS_FILE"

mv "$VALID_IPS" "$ALLOWED_IPS_FILE"

sudo ufw enable

log_message "Starting AI Agent server..."

cd "$FILES_DIR"  # Correct directory for npm install
if [ -f "package.json" ]; then
    npm install
    pm2 start server.js --name ai-agent-server
    pm2 startup
    pm2 save
else
    log_message "package.json not found in $FILES_DIR. Ensure the server files are correctly placed."
    exit 1
fi
