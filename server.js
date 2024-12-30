const express = require('express');
const fs = require('fs');
const app = express();
const { Configuration, OpenAIApi } = require('openai');
const { spawn } = require('child_process');

const configPath = '/root/ai-agent-setup/config';
const whitelistPath = `${configPath}/ipwhitelist.txt`;
const apiKeyPath = `${configPath}/keys/api_key.txt`;

// Ensure config paths and files exist
if (!fs.existsSync(configPath)) {
    console.error(`[ERROR] Config path does not exist. Creating: ${configPath}`);
    fs.mkdirSync(configPath, { recursive: true });
}

// Ensure ipwhitelist.txt exists
if (!fs.existsSync(whitelistPath)) {
    console.warn(`[WARN] Whitelist file not found. Creating default: ${whitelistPath}`);
    fs.writeFileSync(whitelistPath, '127.0.0.1\n');
}

// Ensure API Key file exists
if (!fs.existsSync(apiKeyPath)) {
    console.error(`[ERROR] API key not found at: ${apiKeyPath}`);
    process.exit(1);
}

const apiKey = fs.readFileSync(apiKeyPath, 'utf8').trim();
const whitelist = fs.readFileSync(whitelistPath, 'utf8').split('\n').filter(Boolean);

const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

app.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    console.log(`[INFO] Incoming request from IP: ${clientIp}`);
    
    if (whitelist.includes(clientIp)) {
        next();
    } else {
        console.warn(`[WARN] Unauthorized access from IP: ${clientIp}`);
        res.status(403).json({ error: 'Access denied' });
    }
});

app.use(express.json());
app.use(express.static('public'));

// Handle text generation from OpenAI
app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 150,
        });
        res.json({ result: response.data.choices[0].text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Real-time streaming setup
const stream = spawn('tail', ['-f', '/var/log/syslog']);
const sseClients = [];

app.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    sseClients.push(res);
    req.on('close', () => {
        const index = sseClients.indexOf(res);
        if (index !== -1) {
            sseClients.splice(index, 1);
        }
    });
});

stream.stdout.on('data', (data) => {
    sseClients.forEach(client => client.write(`data: ${data}\n\n`));
});

const server = app.listen(8080, () => {
    console.log('AI Agent running on port 8080');
});
