require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { OpenAIApi, OpenAI } = require('openai');
const db = require('./server/services/dbServices'); 
const Assistant = require('./server/database/models/Assistant');
const { 
    doCompletion, 
    createAssistant, 
    createThread, 
    addMessageToThread, 
    runThread, 
    getThreadMessages 
} = require('./server/services/aiServices');

const app = express();
app.use(express.json());

// Paths
const configPath = process.env.CONFIG_DIR || '/root/ai-agent-setup/config';
const whitelistPath = `${configPath}/ipwhitelist.txt`;

// OpenAI API Configuration
let apiKey = fs.readFileSync(path.join(configPath, 'keys/api_key.txt'), 'utf8').trim();
const openai = new OpenAI({ apiKey });

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

// AI Greeting for New Sessions
app.get('/greet', async (req, res) => {
    const greetingPrompt = "Greet the user and ask how you can help today.";
    
    try {
        const result = await doCompletion(greetingPrompt);
        console.log(`AI Greeting Response: ${result}`);
        res.json({ status: 'success', result });
    } catch (err) {
        console.error('Error generating greeting:', err.message);
        res.status(500).json({ error: 'Failed to process greeting' });
    }
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

// Create Assistant (Persist in MongoDB)
app.post('/create-assistant', async (req, res) => {
    const { name, instructions, description } = req.body;
    try {
        const assistant = await createAssistant(name, instructions, description);
        res.json({ status: 'success', assistant });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create assistant' });
    }
});

// Start a New Thread
app.post('/start-thread', async (req, res) => {
    try {
        const thread = await createThread();
        res.json({ status: 'success', thread });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start thread' });
    }
});

// Add Message to Existing Thread
app.post('/add-message', async (req, res) => {
    const { threadId, message } = req.body;
    try {
        const response = await addMessageToThread(threadId, message);
        res.json({ status: 'success', response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add message to thread' });
    }
});

// Run Thread and Get Results
app.post('/run-thread', async (req, res) => {
    const { threadId } = req.body;
    try {
        const response = await runThread(threadId);
        res.json({ status: 'success', response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to run thread' });
    }
});

// Fetch Messages from a Thread
app.get('/thread-messages', async (req, res) => {
    const { threadId } = req.query;
    try {
        const messages = await getThreadMessages(threadId);
        res.json({ status: 'success', messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve thread messages' });
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

// Start Server
const server = app.listen(8080, '::', () => {
    console.log('Server is running on port 8080 and accessible via IPv6');
});
