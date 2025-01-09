# ai-agent-setup
 
Deploy VM
SSH into VM OR .bootstrap.sh into VM w/ IP and API Key from Host
Git clone repo down 
Chmod any necessary files
Run setup_ai_agent.sh w/ the API Key

rm -rf ./ai-agent-setup
git clone https://github.com/jw-wcv/ai-agent-setup.git
chmod 600 ai-agent-setup/server/config/keys/id_rsa.pem
chmod +x ai-agent-setup/scripts/setup_ai_agent.sh

sudo ai-agent-setup/scripts/setup_ai_agent.sh sk-goes-here