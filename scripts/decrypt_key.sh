#!/bin/bash
set -e

# Load environment variables
source /root/ai-agent-setup/.env

KEYS_DIR="$CONFIG_DIR/keys"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"

if [ ! -f "$ENCRYPTED_KEY_FILE" ]; then
    echo "Encrypted API key file not found!"
    exit 1
fi

echo "Decrypting API key..."
openssl enc -aes-256-cbc -d -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key"

echo "Decryption successful. API key available in $DECRYPTED_KEY_FILE"
