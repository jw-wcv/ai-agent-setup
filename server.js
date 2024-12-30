require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Configuration, OpenAIApi, OpenAI } = require('openai');
const app = express();
const { spawn } = require('child_process');
import { doCompletion } from './services/aiServices';
// Paths
const configPath = process.env.CONFIG_DIR || '/root/ai-agent-setup/config';
const whitelistPath = `${configPath}/ipwhitelist.txt`;

// OpenAI API Configuration
/*
const openaiConfig = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
*/
const openaiConfig = new Configuration({
    apiKey: fs.readFileSync(path.join(configPath, 'keys/api_key.txt'), 'utf8').trim(),
});
const openai = new OpenAIApi(openaiConfig);

// Helper to normalize IP addresses (IPv4-mapped IPv6)
const formatIP = (ip) => (ip.includes('::ffff:') ? ip.split('::ffff:')[1] : ip);

// Ensure whitelist file exists
const ensureWhitelist = () => {
    if (!fs.existsSync(whitelistPath)) {
        console.log('Whitelist not found. Creating default with localhost.');
        fs.writeFileSync(whitelistPath, '127.0.0.1\n');
    }
};
ensureWhitelist();

// Load whitelist
let whitelist = [];
try {
    whitelist = fs.readFileSync(whitelistPath, 'utf8').split('\n').filter(Boolean);
    console.log('Loaded Whitelist IPs:', whitelist);
} catch (err) {
    console.error('Failed to load whitelist. Defaulting to localhost.');
    whitelist = ['127.0.0.1'];
}

// Middleware for IP filtering
app.use((req, res, next) => {
    const clientIp = formatIP(req.ip || req.connection.remoteAddress);
    console.log(`Incoming request from IP: ${clientIp} - ${req.method} ${req.url}`);

    if (whitelist.includes(clientIp)) {
        next();
    } else {
        console.warn(`ACCESS DENIED for IP: ${clientIp}`);
        res.status(403).json({ error: 'Access denied' });
    }
});

// Set CORS headers for all requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Serve static files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Serve index.html for the root route
app.get('/', (req, res) => {
    console.log('Serving index.html');
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Handle POST /command with OpenAI
app.post('/command', express.json(), async (req, res) => {
    const { command } = req.body;
    console.log(`Received command: ${command}`);

    if (!command) {
        return res.status(400).json({ error: 'No command provided' });
    }

    try {
        const result = await doCompletion(command);
        console.log(`OpenAI Response: ${result}`);
        res.json({ status: 'success', result });
    } catch (err) {
        console.error('Error generating AI response:', err.message);
        res.status(500).json({ error: 'Failed to process command' });
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
        if (index !== -1) sseClients.splice(index, 1);
    });
});

stream.stdout.on('data', (data) => {
    sseClients.forEach(client => client.write(`data: ${data}\n\n`));
});

// Start server on IPv6 (::)
const server = app.listen(8080, '::', () => {
    console.log('Server is running on port 8080 and accessible via IPv6');
});

// Log accessible IPs (both IPv4 and IPv6)
console.log('\n--- Server IP Addresses ---');

Object.entries(os.networkInterfaces()).forEach(([iface, addresses]) => {
    addresses.forEach((address) => {
        if (address.family === 'IPv4' || address.family === 'IPv6') {
            const ipType = address.scopeid ? 'Link-Local' : 'Global';
            console.log(`Server accessible at [${iface}] - ${ipType} ${address.family}: ${address.address}`);
        }
    });
});

console.log('--- End of IP Listing ---\n');
