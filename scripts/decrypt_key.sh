#!/bin/bash
set -e

source /root/ai-agent-setup/.env

KEYS_DIR="$CONFIG_DIR/keys"
ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"

if [ ! -f "$ENCRYPTED_KEY_FILE" ]; then
    echo "Encrypted API key file not found at $ENCRYPTED_KEY_FILE!"
    exit 1
fi

echo "Decrypting API key..."
openssl enc -aes-256-cbc -pbkdf2 -d -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key"

if [ -f "$DECRYPTED_KEY_FILE" ]; then
    echo "Decryption successful."
else
    echo "Decryption failed!"
    exit 1
fi
