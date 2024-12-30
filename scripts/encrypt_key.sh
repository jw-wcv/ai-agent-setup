#!/bin/bash
set -e

# Load environment variables
source /root/ai-agent-setup/.env

KEYS_DIR="$CONFIG_DIR/keys"

mkdir -p "$KEYS_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
PLAIN_KEY_FILE="$KEYS_DIR/api_key.txt"

if [ -z "$1" ]; then
    echo "Usage: ./encrypt_key.sh <API_KEY>"
    exit 1
fi

API_KEY=$1
echo "$API_KEY" > "$PLAIN_KEY_FILE"

echo "Encrypting API key..."
openssl enc -aes-256-cbc -salt -in "$PLAIN_KEY_FILE" -out "$ENCRYPTED_KEY_FILE" -k "$(hostname)-key"

echo "Encrypted API key saved to $ENCRYPTED_KEY_FILE"
rm "$PLAIN_KEY_FILE"
