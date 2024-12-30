# setup_ai_agent.sh
#!/bin/bash
set -e
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

ENCRYPTED_KEY_FILE="/root/api_key.enc"
DECRYPTED_KEY_FILE="/root/api_key.txt"
ALLOWED_IPS_FILE="/root/ipwhitelist"

log_message "Installing required dependencies..."
sudo apt install -y curl gnupg apt-transport-https python3 python3-pip build-essential ufw

log_message "Decrypting API key..."
openssl enc -aes-256-cbc -d -in "$ENCRYPTED_KEY_FILE" -out "$DECRYPTED_KEY_FILE" -k "$(hostname)-key"
export OPENAI_API_KEY=$(cat "$DECRYPTED_KEY_FILE")

log_message "Configuring Node.js and PM2..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo apt install -y docker.io
sudo systemctl enable --now docker

log_message "Enabling UFW and setting up IP whitelist..."
sudo ufw allow ssh
sudo ufw default deny incoming
while read -r ip; do
    sudo ufw allow from "$ip" to any port 8080
done < "$ALLOWED_IPS_FILE"
sudo ufw enable

log_message "Starting AI Agent server..."
npm install
pm2 start server.js --name ai-agent-server
pm2 startup
pm2 save