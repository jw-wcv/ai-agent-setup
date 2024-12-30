#!/bin/bash
set -e
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

API_KEY="$1"  # API Key passed as the first argument
VM_IP="$2"    # VM IP passed as the second argument
SSH_KEY="../config/keys/id_rsa.pem"
SSH_KEY_DIR="../config/keys"
ENCRYPTED_KEY_FILE="$SSH_KEY_DIR/api_key.enc"
IP_WHITELIST_FILE="../config/ipwhitelist.txt"  # Correct path

log_message "Incoming API Key: $API_KEY"
log_message "Incoming VM IP: $VM_IP"

# Ensure SSH key directory exists
if [ ! -d "$SSH_KEY_DIR" ]; then
    log_message "Creating SSH key directory..."
    mkdir -p "$SSH_KEY_DIR"
fi

# Generate SSH key pair if not present
if [ ! -f "$SSH_KEY" ]; then
    log_message "Generating new RSA key pair..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY" -C "AI-VM"
    chmod 600 "$SSH_KEY"
fi

# Get local IP address
LOCAL_IP=$(curl -s ifconfig.me)  # Fetches public IP

if [ -z "$LOCAL_IP" ]; then
    log_message "Failed to get local IP address. Exiting."
    exit 1
fi

log_message "Detected local IP: $LOCAL_IP"

# Add local IP to the whitelist if not already present
if ! grep -q "$LOCAL_IP" "$IP_WHITELIST_FILE"; then
    log_message "Adding $LOCAL_IP to IP whitelist..."
    echo "$LOCAL_IP" >> "$IP_WHITELIST_FILE"
else
    log_message "Local IP $LOCAL_IP already in whitelist."
fi

# Encrypt API key to ../config/keys/api_key.enc
log_message "Encrypting API key..."
echo "$API_KEY" | openssl enc -aes-256-cbc -pbkdf2 -salt -out "$ENCRYPTED_KEY_FILE" -k "$(hostname)-key"

log_message "Copying encrypted API key and whitelist to VM..."

# Handle IPv6 bracket correction
if [[ "$VM_IP" =~ ":" ]]; then
    USER_PART=$(echo "$VM_IP" | cut -d'@' -f1)
    IP_PART=$(echo "$VM_IP" | cut -d'@' -f2)

    if [[ "$IP_PART" != \[* ]]; then
        IP_PART="[$IP_PART]"
    fi

    IPV6_VM_IP="$USER_PART@$IP_PART"
else
    IPV6_VM_IP="$VM_IP"
fi

log_message "Resolved VM IP: $IPV6_VM_IP"

# Ensure config/data directory exists on the VM
ssh -i "$SSH_KEY" "$IPV6_VM_IP" "mkdir -p /root/config/data" || {
    log_message "Failed to create /root/config/data on VM"
    exit 1
}

# Copy encrypted key and whitelist to VM /root/config/data/
scp -i "$SSH_KEY" "$ENCRYPTED_KEY_FILE" setup_ai_agent.sh "$IP_WHITELIST_FILE" "$IPV6_VM_IP:/root/config/data/" || {
    log_message "Failed to SCP files to VM"
    exit 1
}

log_message "SSHing into VM and initializing setup..."

# Strip brackets for SSH command to avoid hostname resolution issues
SSH_VM_IP="${IPV6_VM_IP//[\[\]]/}"  # Remove brackets for SSH
ssh -i "$SSH_KEY" "$SSH_VM_IP" "chmod +x /root/config/data/setup_ai_agent.sh && /root/config/data/setup_ai_agent.sh" || {
    log_message "Failed to SSH into VM"
    exit 1
}
