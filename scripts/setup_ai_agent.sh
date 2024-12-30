#!/bin/bash
set -e

CONFIG_DIR="/root/ai-agent-setup/config"
KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"
FILES_DIR="/root/ai-agent-setup"

mkdir -p "$KEYS_DIR" "$DATA_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"
ALLOWED_IPS_FILE="$CONFIG_DIR/ipwhitelist.txt"

API_KEY="$1"  # Pass API Key as the first argument

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> /var/log/ai-agent-setup.log
}

log_message "Starting AI Agent setup process..."

log_message "Installing required dependencies..."
sudo apt update
sudo apt install -y curl gnupg apt-transport-https python3 python3-pip build-essential ufw > /dev/null 2>&1

# Ensure /root/config files are moved to the correct location
if [ -d /root/config ]; then
    log_message "Moving files from /root/config to /root/ai-agent-setup/config..."
    sudo mv /root/config/* "$CONFIG_DIR/" 2>/dev/null || true
    sudo rm -rf /root/config
fi

# Ensure Whitelist Exists (Auto-Creation)
if [ ! -f "$ALLOWED_IPS_FILE" ]; then
    log_message "Whitelist not found. Creating $ALLOWED_IPS_FILE with 127.0.0.1"
    echo "127.0.0.1" > "$ALLOWED_IPS_FILE"
else
    log_message "Whitelist found at $ALLOWED_IPS_FILE"
fi

# Cleanup Whitelist (Ensure No Invalid Entries)
sed -i 's/\r//' "$ALLOWED_IPS_FILE"
sed -i '/^$/d' "$ALLOWED_IPS_FILE"
sed -i 's/[[:space:]]*$//' "$ALLOWED_IPS_FILE"

VALID_IPS=$(mktemp)

# Encrypt API Key (if provided)
if [ -n "$API_KEY" ]; then
    log_message "Encrypting provided API key..."
    echo "$API_KEY" | openssl enc -aes-256-cbc -pbkdf2 -salt -out "$ENCRYPTED_KEY_FILE" -k "$(hostname)-key"
else
    if [ ! -f "$ENCRYPTED_KEY_FILE" ]; then
        log_message "API key not provided and no encrypted key found. Exiting."
        exit 1
    fi
    log_message "Encrypted API key already exists. Skipping encryption."
fi

# Decrypt API Key
log_message "Decrypting API key..."
openssl enc -aes-256-cbc -d -pbkdf2 -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key" || {
    log_message "Failed to decrypt API key. Exiting."
    exit 1
}

export OPENAI_API_KEY=$(cat "$DECRYPTED_KEY_FILE")

log_message "Configuring Node.js, PM2, and Docker..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - > /dev/null 2>&1
sudo apt install -y nodejs docker.io > /dev/null 2>&1
sudo npm install -g pm2 > /dev/null 2>&1
sudo systemctl enable --now docker

# UFW Setup and IP Whitelisting
log_message "Configuring firewall rules (UFW)..."
sudo ufw allow ssh
sudo ufw default deny incoming

# Validate and Add Whitelisted IPs
while read -r ip; do
    log_message "Processing IP: $ip"
    if [[ -n "$ip" && ("$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ || "$ip" =~ ^[0-9a-fA-F:]+$) ]]; then
        if sudo ufw allow from "$ip" to any port 8080; then
            log_message "Added $ip to UFW."
            echo "$ip" >> "$VALID_IPS"
        else
            log_message "Failed to add $ip. Marking as invalid."
        fi
    else
        log_message "Invalid IP: $ip (skipped)"
    fi
done < "$ALLOWED_IPS_FILE"

# Replace the Whitelist with Valid IPs
mv "$VALID_IPS" "$ALLOWED_IPS_FILE"

sudo ufw enable

log_message "Starting AI Agent server..."

cd "$FILES_DIR"
if [ -f "package.json" ]; then
    npm install
    pm2 start server.js --name ai-agent-server || {
        log_message "Failed to start server with PM2. Exiting."
        exit 1
    }
    pm2 startup
    pm2 save
    log_message "AI Agent server started successfully."
else
    log_message "package.json missing. Exiting."
    exit 1
fi
