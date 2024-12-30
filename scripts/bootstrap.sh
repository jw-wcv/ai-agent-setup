#!/bin/bash
set -e

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

API_KEY=${1:-$(grep API_KEY .env | cut -d '=' -f2)}
VM_IP="$2"  # Pass VM IP as second argument
ENCRYPTED_KEY_FILE="api_key.enc"
IP_WHITELIST_FILE="ipwhitelist"

if [ -z "$API_KEY" ] || [ -z "$VM_IP" ]; then
    echo "Usage: ./bootstrap.sh [API_KEY] <VM_IP>"
    exit 1
fi

log_message "Encrypting API key..."
echo "$API_KEY" | openssl enc -aes-256-cbc -salt -out "$ENCRYPTED_KEY_FILE" -k "$(hostname)-key"

log_message "Copying encrypted API key and whitelist to VM..."
scp "$ENCRYPTED_KEY_FILE" setup_ai_agent.sh ipwhitelist "$VM_IP":/root/

log_message "SSHing into VM and initializing setup..."
ssh "$VM_IP" "API_KEY='$API_KEY' bash -s" < remote_setup.sh
