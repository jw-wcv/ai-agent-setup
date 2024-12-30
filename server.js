require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const { Configuration, OpenAIApi } = require('openai');
const { spawn } = require('child_process');

// Use environment variable for config path
const configPath = process.env.CONFIG_DIR || '/root/ai-agent-setup/config';
const whitelistPath = `${configPath}/ipwhitelist.txt`;
const keysPath = `${configPath}/keys/api_key.txt`;

function ensureWhitelist() {
    if (!fs.existsSync(whitelistPath)) {
        console.log('Whitelist not found. Creating default with localhost.');
        fs.writeFileSync(whitelistPath, '127.0.0.1\n');
    }
}

// Ensure both whitelist and API key exist before proceeding
ensureWhitelist();

let apiKey;
try {
    apiKey = fs.readFileSync(keysPath, 'utf8').trim();
} catch (err) {
    console.error(`ERROR: Failed to load API key from ${keysPath}`);
    process.exit(1);
}

let whitelist;
try {
    whitelist = fs.readFileSync(whitelistPath, 'utf8').split('\n').filter(Boolean);
} catch (err) {
    console.warn('WARN: Failed to read whitelist. Falling back to localhost.');
    whitelist = ['127.0.0.1'];
}

const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

app.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    if (whitelist.includes(clientIp)) {
        next();
    } else {
        console.warn(`ACCESS DENIED for IP: ${clientIp}`);
        res.status(403).json({ error: 'Access denied' });
    }
});

app.use(express.json());
app.use(express.static('public'));

// OpenAI text generation
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

// Real-time log streaming (syslog)
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
