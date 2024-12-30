// server.js
const express = require('express');
const fs = require('fs');
const app = express();
const { Configuration, OpenAIApi } = require('openai');

const apiKey = fs.readFileSync('/root/api_key.txt', 'utf8').trim();
const config = new Configuration({ apiKey });
const openai = new OpenAIApi(config);

const whitelist = fs.readFileSync('/root/ipwhitelist', 'utf8').split('\n').filter(Boolean);

app.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    if (whitelist.includes(clientIp)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

app.use(express.json());
app.use(express.static('public'));

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

const server = app.listen(8080, () => {
    console.log('AI Agent running on port 8080');
});

const { spawn } = require('child_process');
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