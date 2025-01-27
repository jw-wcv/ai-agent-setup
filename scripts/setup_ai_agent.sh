#!/bin/bash
set -e

# Load environment variables
# source /root/ai-agent-setup/.env
source "$(dirname "$0")/../.env"

KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"
FILES_DIR="/root/ai-agent-setup"

mkdir -p "$KEYS_DIR" "$DATA_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"
ALLOWED_IPS_FILE="$CONFIG_DIR/ipwhitelist.txt"

API_KEY="$1"  # API Key passed as the first argument

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> /var/log/ai-agent-setup.log
}

log_message "Starting AI Agent setup process..."

log_message "Installing required dependencies..."
sudo apt update
sudo apt install -y curl gnupg apt-transport-https python3 python3-pip build-essential ufw > /dev/null 2>&1

log_message "Checking and installing libssl1.1 for MongoDB 4.4..."
if ! dpkg -l | grep -q libssl1.1; then
    log_message "libssl1.1 not found. Downloading and installing..."

    if [ "$(uname -m)" = "x86_64" ]; then
        wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb
        sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb
    elif [ "$(uname -m)" = "aarch64" ]; then
        wget http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_arm64.deb
        sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2_arm64.deb
    fi

    log_message "libssl1.1 installed."
fi

# Install MongoDB
log_message "Checking and installing MongoDB 4.4..."
if ! command -v mongod &> /dev/null
then
    log_message "Installing MongoDB 4.4 from focal repository..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-4.4.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-4.4.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
    sudo apt update
    sudo apt install -y mongodb-org
    log_message "Starting and enabling MongoDB service..."
    sudo systemctl start mongod
    sudo systemctl enable mongod
else
    log_message "MongoDB is already installed."
fi

# Retry starting MongoDB if it fails
if ! systemctl is-active --quiet mongod
then
    log_message "MongoDB failed to start. Attempting repair..."
    sudo mongod --repair
    sudo systemctl start mongod
    if ! systemctl is-active --quiet mongod
    then
        log_message "MongoDB still failed to start after repair. Exiting."
        exit 1
    fi
fi

log_message "MongoDB is running."

# Move misplaced config files (if any)
if [ -d /root/config ]; then
    log_message "Moving files from /root/config to $CONFIG_DIR..."
    sudo mv /root/config/* "$CONFIG_DIR/" 2>/dev/null || true
    sudo rm -rf /root/config
fi

# Ensure whitelist exists
if [ ! -f "$ALLOWED_IPS_FILE" ]; then
    log_message "Whitelist not found. Creating default with localhost."
    echo "127.0.0.1" > "$ALLOWED_IPS_FILE"
else
    log_message "Whitelist found at $ALLOWED_IPS_FILE"
fi

# Clean up the whitelist (remove blank or invalid entries)
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

# UFW and Whitelist Setup
log_message "Configuring firewall (UFW)..."
sudo ufw allow ssh
sudo ufw default deny incoming

log_message "Allowing MongoDB port 27017 for local connections..."
sudo ufw allow 27017

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

mv "$VALID_IPS" "$ALLOWED_IPS_FILE"
yes | sudo ufw enable

log_message "Building React client..."
cd "$FILES_DIR/client"

if [ -f "package.json" ]; then
    npm install
    npm run build || {
        log_message "React build failed. Exiting."
        exit 1
    }
else
    log_message "React package.json not found. Skipping client build."
fi

log_message "Client build complete."


log_message "Starting AI Agent server..."

cd "$FILES_DIR"
if [ -f "package.json" ]; then
    log_message "Running npm install to ensure dependencies..."
    npm install || {
        log_message "npm install failed. Exiting."
        exit 1
    }

    log_message "Ensuring PM2 process for AI Agent is running..."
    if ! pm2 list | grep -q ai-agent-server; then
        log_message "Starting new PM2 process for AI Agent..."
        pm2 start /root/ai-agent-setup/server/server.js --name ai-agent-server
    else
        log_message "AI Agent server already running. Restarting..."
        pm2 restart ai-agent-server
    fi

    pm2 startup
    pm2 save
    log_message "AI Agent server started successfully."
else
    log_message "package.json missing. Exiting."
    exit 1
fi
