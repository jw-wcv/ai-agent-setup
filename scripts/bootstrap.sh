# bootstrap.sh
#!/bin/bash
set -e
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

API_KEY="sk-xxxxxx"
VM_IP="$1"  # Pass VM IP when calling bootstrap.sh
ENCRYPTED_KEY_FILE="api_key.enc"
IP_WHITELIST_FILE="ipwhitelist"

log_message "Encrypting API key..."
echo "$API_KEY" | openssl enc -aes-256-cbc -salt -out "$ENCRYPTED_KEY_FILE" -k "$(hostname)-key"

log_message "Copying encrypted API key and whitelist to VM..."
scp "$ENCRYPTED_KEY_FILE" setup_ai_agent.sh ipwhitelist "$VM_IP":/root/

log_message "SSHing into VM and initializing setup..."
ssh "$VM_IP" "chmod +x /root/setup_ai_agent.sh && /root/setup_ai_agent.sh"
