#!/bin/bash
set -e

CONFIG_DIR="/root/config"
KEYS_DIR="$CONFIG_DIR/keys"
DATA_DIR="$CONFIG_DIR/data"
FILES_DIR="$CONFIG_DIR/files"

mkdir -p "$KEYS_DIR" "$DATA_DIR" "$FILES_DIR"

ENCRYPTED_KEY_FILE="$KEYS_DIR/api_key.enc"
DECRYPTED_KEY_FILE="$KEYS_DIR/api_key.txt"
ALLOWED_IPS_FILE="$DATA_DIR/ipwhitelist"

if [ ! -f "$ENCRYPTED_KEY_FILE" ]; then
    echo "Encrypted API key file not found!"
    exit 1
fi

echo "Decrypting API key..."
openssl enc -aes-256-cbc -d -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key"

echo "Decryption successful. API key available in $DECRYPTED_KEY_FILE"
